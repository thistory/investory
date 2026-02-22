import { NextRequest, NextResponse } from "next/server";
import { getStockCandles } from "@/lib/services/providers/finnhub";
import { getDailyPrices } from "@/lib/services/providers/alpha-vantage";
import { cache } from "@/lib/cache/redis";
import {
  finnhubLimiter,
  alphaVantageLimiter,
  withRateLimit,
} from "@/lib/utils/rate-limiter";
import { validateSymbol } from "@/lib/utils/validate-symbol";
import { requireAuth } from "@/lib/auth/api-guard";

type Period = "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y";

const CACHE_TTL: Record<Period, number> = {
  "1D": 60, // 1 minute
  "1W": 300, // 5 minutes
  "1M": 600, // 10 minutes
  "3M": 3600, // 1 hour
  "1Y": 3600, // 1 hour
  "5Y": 86400, // 24 hours
};

interface RouteParams {
  params: Promise<{ symbol: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { symbol } = await params;
    const result = validateSymbol(symbol);
    if (!result.valid) return result.response;
    const upperSymbol = result.symbol;

    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") || "1Y") as Period;

    const validPeriods: Period[] = ["1D", "1W", "1M", "3M", "1Y", "5Y"];
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid period. Must be one of: ${validPeriods.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const cacheKey = `chart:${upperSymbol}:${period}`;

    // Check cache first
    const cached = await cache.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    let candles;

    // For intraday data, use Finnhub
    if (period === "1D" || period === "1W") {
      candles = await withRateLimit(finnhubLimiter, () =>
        getStockCandles(upperSymbol, period)
      );
    } else {
      // For longer periods, try Alpha Vantage first, fallback to Finnhub
      try {
        const canMakeRequest = await alphaVantageLimiter.canMakeRequest();

        if (canMakeRequest) {
          await alphaVantageLimiter.recordRequest();
          const prices = await getDailyPrices(upperSymbol, period === "5Y");

          // Filter by period
          const now = Date.now();
          const periodMs: Record<Period, number> = {
            "1D": 24 * 60 * 60 * 1000,
            "1W": 7 * 24 * 60 * 60 * 1000,
            "1M": 30 * 24 * 60 * 60 * 1000,
            "3M": 90 * 24 * 60 * 60 * 1000,
            "1Y": 365 * 24 * 60 * 60 * 1000,
            "5Y": 5 * 365 * 24 * 60 * 60 * 1000,
          };

          candles = prices
            .filter((p) => now - p.date.getTime() <= periodMs[period])
            .map((p) => ({
              time: Math.floor(p.date.getTime() / 1000),
              open: p.open,
              high: p.high,
              low: p.low,
              close: p.close,
              volume: p.volume,
            }));
        } else {
          // Rate limited, use Finnhub
          candles = await withRateLimit(finnhubLimiter, () =>
            getStockCandles(upperSymbol, period)
          );
        }
      } catch {
        // Fallback to Finnhub
        candles = await withRateLimit(finnhubLimiter, () =>
          getStockCandles(upperSymbol, period)
        );
      }
    }

    const data = {
      symbol: upperSymbol,
      period,
      candles,
    };

    // Cache the result
    await cache.set(cacheKey, data, CACHE_TTL[period]);

    return NextResponse.json({
      success: true,
      data,
      cached: false,
    });
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch chart data",
      },
      { status: 500 }
    );
  }
}
