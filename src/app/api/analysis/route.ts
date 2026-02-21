import { NextRequest, NextResponse } from "next/server";
import { loadIndex } from "@/data/analysis";

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const cursor = Math.max(0, Math.floor(Number(params.get("cursor")) || 0));
  const limit = Math.min(Math.max(1, Math.floor(Number(params.get("limit")) || DEFAULT_LIMIT)), MAX_LIMIT);

  const symbol = params.get("symbol")?.toUpperCase().trim() || null;
  if (symbol && !/^[A-Z]{1,10}$/.test(symbol)) {
    return NextResponse.json(
      { success: false, error: "Invalid symbol format" },
      { status: 400 }
    );
  }

  const allEntries = loadIndex();
  const filtered = symbol
    ? allEntries.filter((e) => e.symbol === symbol)
    : allEntries;

  const total = filtered.length;
  const entries = filtered.slice(cursor, cursor + limit);
  const nextCursor = cursor + limit < total ? cursor + limit : null;

  return NextResponse.json({
    success: true,
    data: { entries, nextCursor, total },
  });
}
