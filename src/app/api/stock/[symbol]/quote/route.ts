import { NextRequest, NextResponse } from "next/server";
import { getStockQuote, getStockMetrics } from "@/lib/services/providers/finnhub";
import { cache } from "@/lib/cache/redis";
import { finnhubLimiter, withRateLimit } from "@/lib/utils/rate-limiter";
import { validateSymbol } from "@/lib/utils/validate-symbol";
import { requireAdmin } from "@/lib/auth/api-guard";

const CACHE_TTL = 15; // 15 seconds for real-time data

interface RouteParams {
  params: Promise<{ symbol: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { symbol } = await params;
    const result = validateSymbol(symbol);
    if (!result.valid) return result.response;
    const upperSymbol = result.symbol;
    const cacheKey = `quote:${upperSymbol}`;

    // Check cache first
    const cached = await cache.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    // Fetch from Finnhub with rate limiting
    const [quote, metrics] = await Promise.all([
      withRateLimit(finnhubLimiter, () => getStockQuote(upperSymbol)),
      withRateLimit(finnhubLimiter, () => getStockMetrics(upperSymbol)),
    ]);

    const data = {
      symbol: upperSymbol,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      open: quote.open,
      high: quote.high,
      low: quote.low,
      previousClose: quote.previousClose,
      timestamp: quote.timestamp,
      valuation: metrics.valuation,
      profitability: metrics.profitability,
      trading: metrics.trading,
      marketCap: metrics.marketCap,
    };

    // Cache the result
    await cache.set(cacheKey, data, CACHE_TTL);

    return NextResponse.json({
      success: true,
      data,
      cached: false,
    });
  } catch (error) {
    console.error("Error fetching quote:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch quote",
      },
      { status: 500 }
    );
  }
}
