import { NextRequest, NextResponse } from "next/server";
import { getManagedStocks, addStock } from "@/lib/stocks/managed-stocks";
import { getIncomeStatements } from "@/lib/services/providers/alpha-vantage";
import { cache } from "@/lib/cache/redis";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { requireAuth } from "@/lib/auth/api-guard";

const FINANCIALS_CACHE_TTL = 86400;
const FINANCIALS_FILE_DIR = join(process.cwd(), ".cache", "financials");

export async function GET() {
  const stocks = await getManagedStocks();
  return NextResponse.json({ success: true, stocks });
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  let body: { symbol?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "잘못된 요청입니다" },
      { status: 400 }
    );
  }

  const { symbol } = body;
  if (!symbol || typeof symbol !== "string") {
    return NextResponse.json(
      { success: false, error: "심볼을 입력해주세요" },
      { status: 400 }
    );
  }

  const result = await addStock(symbol);
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 }
    );
  }

  // 재무 데이터 미리 가져와서 캐싱 (차트가 바로 보이도록)
  const upper = symbol.toUpperCase().trim();
  try {
    const financials = await getIncomeStatements(upper);
    if (financials.annual.length > 0 || financials.quarterly.length > 0) {
      await cache.set(`financials:${upper}`, financials, FINANCIALS_CACHE_TTL);
      // 파일 캐시도 저장
      try {
        await mkdir(FINANCIALS_FILE_DIR, { recursive: true });
        await writeFile(
          join(FINANCIALS_FILE_DIR, `${upper}.json`),
          JSON.stringify({ _cachedAt: Date.now(), data: financials })
        );
      } catch { /* ignore file write errors */ }
    }
  } catch {
    // 재무 데이터 실패해도 종목 추가는 성공으로 처리
  }

  return NextResponse.json({ success: true, stock: result.stock });
}
