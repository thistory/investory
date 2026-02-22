import { NextRequest, NextResponse } from "next/server";
import { getIncomeStatements } from "@/lib/services/providers/alpha-vantage";
import { cache } from "@/lib/cache/redis";
import { alphaVantageLimiter, withRateLimit } from "@/lib/utils/rate-limiter";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { validateSymbol } from "@/lib/utils/validate-symbol";
import { requireAuth } from "@/lib/auth/api-guard";

const CACHE_TTL = 86400; // 24 hours
const FILE_CACHE_DIR = join(process.cwd(), ".cache", "financials");

interface RouteParams {
  params: Promise<{ symbol: string }>;
}

async function readFileCache(symbol: string) {
  try {
    const filePath = join(FILE_CACHE_DIR, `${symbol}.json`);
    const raw = await readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed._cachedAt < 7 * 86400 * 1000) {
      return parsed.data;
    }
  } catch {
    // File doesn't exist or invalid
  }
  return null;
}

async function writeFileCache(symbol: string, data: unknown) {
  try {
    await mkdir(FILE_CACHE_DIR, { recursive: true });
    const filePath = join(FILE_CACHE_DIR, `${symbol}.json`);
    await writeFile(filePath, JSON.stringify({ _cachedAt: Date.now(), data }));
  } catch {
    // Ignore write errors
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { symbol } = await params;
    const result = validateSymbol(symbol);
    if (!result.valid) return result.response;
    const upperSymbol = result.symbol;
    const cacheKey = `financials:${upperSymbol}`;

    // 1. In-memory/Redis cache
    const cached = await cache.get<any>(cacheKey);
    if (cached && (cached.annual?.length > 0 || cached.quarterly?.length > 0)) {
      return NextResponse.json({ success: true, data: cached, cached: true });
    }

    // 2. File cache (survives server restarts)
    const fileCached = await readFileCache(upperSymbol);
    if (fileCached) {
      await cache.set(cacheKey, fileCached, CACHE_TTL);
      return NextResponse.json({ success: true, data: fileCached, cached: true });
    }

    // 3. Fetch from Alpha Vantage
    let data;
    try {
      data = await withRateLimit(alphaVantageLimiter, () =>
        getIncomeStatements(upperSymbol)
      );
    } catch {
      await new Promise((r) => setTimeout(r, 1500));
      data = await getIncomeStatements(upperSymbol);
    }

    if (data.annual.length === 0 && data.quarterly.length === 0) {
      return NextResponse.json({ success: true, data, cached: false });
    }

    await cache.set(cacheKey, data, CACHE_TTL);
    await writeFileCache(upperSymbol, data);

    return NextResponse.json({ success: true, data, cached: false });
  } catch (error) {
    console.error("Error fetching financials:", error);

    // Last resort: try file cache even if expired
    try {
      const { symbol } = await params;
      const filePath = join(FILE_CACHE_DIR, `${symbol.toUpperCase()}.json`);
      const raw = await readFile(filePath, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.data?.annual?.length > 0) {
        return NextResponse.json({ success: true, data: parsed.data, cached: true });
      }
    } catch {
      // No file cache
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch financials" },
      { status: 500 }
    );
  }
}
