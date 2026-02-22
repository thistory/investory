import { eq } from "drizzle-orm";
import { db } from "../index";
import { waitlist } from "../schema";

export async function addToWaitlist(
  email: string,
  source?: string,
  locale?: string
) {
  // Check if email already exists
  const existing = await db
    .select()
    .from(waitlist)
    .where(eq(waitlist.email, email.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    return { success: true, alreadyExists: true };
  }

  await db.insert(waitlist).values({
    email: email.toLowerCase().trim(),
    source: source || "unknown",
    locale: locale || "ko",
  });

  return { success: true, alreadyExists: false };
}

export async function getWaitlistEntries() {
  return db.select().from(waitlist).orderBy(waitlist.createdAt);
}

export async function getWaitlistCount() {
  const result = await db.select().from(waitlist);
  return result.length;
}

export async function updateWaitlistStatus(email: string, status: string) {
  await db
    .update(waitlist)
    .set({ status })
    .where(eq(waitlist.email, email.toLowerCase()));
}
