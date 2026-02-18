import { NextResponse } from "next/server";

const SYMBOL_RE = /^[A-Z]{1,10}$/;

/** Validate and sanitize stock symbol. Returns uppercase symbol or error response. */
export function validateSymbol(
  symbol: string
): { valid: true; symbol: string } | { valid: false; response: NextResponse } {
  const upper = symbol.toUpperCase().trim();

  if (!SYMBOL_RE.test(upper)) {
    return {
      valid: false,
      response: NextResponse.json(
        { success: false, error: "Invalid symbol" },
        { status: 400 }
      ),
    };
  }

  return { valid: true, symbol: upper };
}
