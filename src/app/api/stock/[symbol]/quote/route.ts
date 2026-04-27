import { NextRequest, NextResponse } from "next/server";
import { getStockQuote, getStockMetrics } from "@/lib/services/providers/finnhub";
import { getCryptoQuote } from "@/lib/services/providers/coingecko";
import { cache } from "@/lib/cache/redis";
import {
  finnhubLimiter,
  coingeckoLimiter,
  withRateLimit,
} from "@/lib/utils/rate-limiter";
import { validateSymbol } from "@/lib/utils/validate-symbol";
import { isCryptoSymbol, getCoinGeckoId } from "@/lib/utils/crypto-symbols";
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

    let data: Record<string, unknown>;

    if (isCryptoSymbol(upperSymbol)) {
      const coinId = getCoinGeckoId(upperSymbol);
      if (!coinId) {
        return NextResponse.json(
          { success: false, error: "Unsupported crypto symbol" },
          { status: 400 }
        );
      }
      const q = await withRateLimit(coingeckoLimiter, () =>
        getCryptoQuote(coinId, upperSymbol)
      );
      data = {
        symbol: upperSymbol,
        price: q.price,
        change: q.change,
        changePercent: q.changePercent,
        open: q.open,
        high: q.high,
        low: q.low,
        previousClose: q.previousClose,
        timestamp: q.timestamp,
        marketCap: q.marketCap,
        // Reuse `trading` block so existing UI keeps working.
        trading: {
          "52WeekHigh": q.ath,
          "52WeekLow": q.atl,
        },
        crypto: {
          rank: q.rank,
          volume24h: q.volume24h,
          ath: q.ath,
          atl: q.atl,
          athChangePercent: q.athChangePercent,
          atlChangePercent: q.atlChangePercent,
          circulatingSupply: q.circulatingSupply,
          totalSupply: q.totalSupply,
          maxSupply: q.maxSupply,
          priceChange1h: q.priceChange1h,
          priceChange7d: q.priceChange7d,
          priceChange30d: q.priceChange30d,
          priceChange1y: q.priceChange1y,
        },
      };
    } else {
      // Fetch from Finnhub with rate limiting
      const [quote, metrics] = await Promise.all([
        withRateLimit(finnhubLimiter, () => getStockQuote(upperSymbol)),
        withRateLimit(finnhubLimiter, () => getStockMetrics(upperSymbol)),
      ]);

      data = {
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
    }

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
