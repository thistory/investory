import { db } from "../index";
import { users } from "../schema";
import { eq } from "drizzle-orm";

interface UpsertUserParams {
  id: string;
  email: string;
  provider: string;
  providerAccountId: string;
}

export async function upsertUser(params: UpsertUserParams) {
  const [user] = await db
    .insert(users)
    .values(params)
    .onConflictDoUpdate({
      target: users.id,
      set: {
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      },
    })
    .returning();
  return user;
}

export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user ?? null;
}

export async function getUserById(id: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return user ?? null;
}
