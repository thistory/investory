import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getWaitlistEntries,
} from "@/lib/db/queries/waitlist";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const entries = await getWaitlistEntries();
  const count = entries.length;

  return NextResponse.json({ count, entries });
}
