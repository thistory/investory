import { NextRequest, NextResponse } from "next/server";
import { addToWaitlist } from "@/lib/db/queries/waitlist";

const VALID_SOURCES = ["stocks", "stocks-add", "compare", "unknown"] as const;
const VALID_LOCALES = ["ko", "en"] as const;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeSource(source: unknown): string {
  if (typeof source === "string") {
    // Allow "stocks", "compare", or "stock-SYMBOL" pattern
    if (VALID_SOURCES.includes(source as (typeof VALID_SOURCES)[number])) return source;
    if (/^stock-[A-Za-z]{1,10}$/.test(source)) return source;
  }
  return "unknown";
}

function sanitizeLocale(locale: unknown): string {
  if (typeof locale === "string" && VALID_LOCALES.includes(locale as (typeof VALID_LOCALES)[number])) return locale;
  return "ko";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email) || email.length > 255) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const result = await addToWaitlist(
      email,
      sanitizeSource(body.source),
      sanitizeLocale(body.locale),
    );

    return NextResponse.json({
      success: true,
      message: result.alreadyExists ? "already_registered" : "registered",
    });
  } catch (error) {
    console.error("Waitlist registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
