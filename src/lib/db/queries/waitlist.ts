import { eq, count } from "drizzle-orm";
import { db } from "../index";
import { waitlist } from "../schema";

export async function addToWaitlist(
  email: string,
  source: string,
  locale: string
) {
  const normalized = email.toLowerCase().trim();
  const existing = await db
    .select({ id: waitlist.id })
    .from(waitlist)
    .where(eq(waitlist.email, normalized))
    .limit(1);

  if (existing.length > 0) {
    return { success: true, alreadyExists: true };
  }

  await db.insert(waitlist).values({
    email: normalized,
    source,
    locale,
  });

  return { success: true, alreadyExists: false };
}

export async function getWaitlistEntries() {
  return db.select().from(waitlist).orderBy(waitlist.createdAt);
}

export async function getWaitlistCount() {
  const [result] = await db.select({ value: count() }).from(waitlist);
  return result.value;
}

export async function updateWaitlistStatus(email: string, newStatus: string) {
  await db
    .update(waitlist)
    .set({ status: newStatus })
    .where(eq(waitlist.email, email.toLowerCase()));
}
