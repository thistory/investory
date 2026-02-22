import { NextRequest, NextResponse } from "next/server";
import { addToWaitlist } from "@/lib/db/queries/waitlist";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, source, locale } = body;

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const result = await addToWaitlist(email, source, locale);

    if (result.alreadyExists) {
      return NextResponse.json({
        success: true,
        message: "already_registered",
      });
    }

    return NextResponse.json({
      success: true,
      message: "registered",
    });
  } catch (error) {
    console.error("Waitlist registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
