import { db } from "../index";
import { subscriptions } from "../schema";
import { eq } from "drizzle-orm";

export async function getSubscriptionByUserId(userId: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  return sub ?? null;
}

export async function ensureFreeSubscription(userId: string) {
  await db
    .insert(subscriptions)
    .values({
      id: crypto.randomUUID(),
      userId,
      plan: "free",
      status: "active",
    })
    .onConflictDoNothing({ target: subscriptions.userId });

  return (await getSubscriptionByUserId(userId))!;
}

export function isSubscriptionActive(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}

export function isPremiumPlan(plan: string | null | undefined) {
  return plan === "pro";
}
