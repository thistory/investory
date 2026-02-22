import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { upsertUser } from "@/lib/db/queries/users";
import {
  ensureFreeSubscription,
  getSubscriptionByUserId,
} from "@/lib/db/queries/subscriptions";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      authorization: { params: { scope: "openid email profile" } },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: { signIn: "/login" },
  useSecureCookies: process.env.NODE_ENV === "production",
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      // Initial sign-in: upsert user + ensure subscription
      if (user && account) {
        const userId = account.providerAccountId;
        await upsertUser({
          id: userId,
          email: user.email!,
          name: user.name,
          image: user.image,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        });

        const subscription = await ensureFreeSubscription(userId);

        token.id = userId;
        token.plan = subscription.plan;
        token.planStatus = subscription.status;
      }

      // Session update trigger: refresh subscription from DB
      if (trigger === "update" && token.id) {
        const subscription = await getSubscriptionByUserId(token.id);
        if (subscription) {
          token.plan = subscription.plan;
          token.planStatus = subscription.status;
        }
      }

      return token;
    },
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id;
      }
      session.user.plan = token.plan ?? "free";
      session.user.planStatus = token.planStatus ?? "active";
      return session;
    },
  },
});
