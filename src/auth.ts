import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      authorization: { params: { scope: "openid email" } },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: { signIn: "/login" },
  useSecureCookies: process.env.NODE_ENV === "production",
  callbacks: {
    jwt({ token }) {
      delete token.name;
      delete token.picture;
      return token;
    },
    session({ session }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = session.user as any;
        delete user.name;
        delete user.image;
      }
      return session;
    },
  },
});
