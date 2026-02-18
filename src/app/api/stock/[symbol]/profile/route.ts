import { NextRequest, NextResponse } from "next/server";
import { getStockProfile } from "@/lib/services/providers/finnhub";
import { getCompanyOverview } from "@/lib/services/providers/alpha-vantage";
import { cache } from "@/lib/cache/redis";
import {
  finnhubLimiter,
  alphaVantageLimiter,
  withRateLimit,
} from "@/lib/utils/rate-limiter";
import { validateSymbol } from "@/lib/utils/validate-symbol";

const CACHE_TTL = 86400; // 24 hours

// Finnhub/AlphaVantage에서 반환하는 잘못된 데이터 교정
// 사명 변경, URL 변경 등 API가 아직 반영하지 않은 경우
const PROFILE_OVERRIDES: Record<string, Record<string, string>> = {
  BMNR: {
    website: "https://www.bitminetech.io",
    name: "Bitmine Immersion Technologies Inc",
  },
};

interface RouteParams {
  params: Promise<{ symbol: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { symbol } = await params;
    const result = validateSymbol(symbol);
    if (!result.valid) return result.response;
    const upperSymbol = result.symbol;
    const cacheKey = `profile:${upperSymbol}`;

    // Check cache first
    const cached = await cache.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    // Fetch from both sources
    const [finnhubProfile, alphaVantageOverview] = await Promise.all([
      withRateLimit(finnhubLimiter, () => getStockProfile(upperSymbol)).catch(
        () => null
      ),
      withRateLimit(alphaVantageLimiter, () =>
        getCompanyOverview(upperSymbol)
      ).catch(() => null),
    ]);

    // Merge data from both sources
    const data = {
      symbol: upperSymbol,
      name: finnhubProfile?.name || alphaVantageOverview?.name || upperSymbol,
      exchange: finnhubProfile?.exchange || alphaVantageOverview?.exchange,
      sector: alphaVantageOverview?.sector,
      industry:
        finnhubProfile?.industry || alphaVantageOverview?.industry,
      description: alphaVantageOverview?.description,
      website: finnhubProfile?.website,
      logo: finnhubProfile?.logo,
      country: finnhubProfile?.country,
      cik: alphaVantageOverview?.cik,
      marketCap:
        finnhubProfile?.marketCap || alphaVantageOverview?.valuation?.marketCap,
      sharesOutstanding:
        finnhubProfile?.sharesOutstanding ||
        alphaVantageOverview?.shares?.outstanding,
      valuation: alphaVantageOverview?.valuation,
      fundamentals: alphaVantageOverview?.fundamentals,
      margins: alphaVantageOverview?.margins,
      returns: alphaVantageOverview?.returns,
      growth: alphaVantageOverview?.growth,
      dividend: alphaVantageOverview?.dividend,
      technicals: alphaVantageOverview?.technicals,
      analystRatings: alphaVantageOverview?.analystRatings,
    };

    // Apply known overrides for stale API data
    const overrides = PROFILE_OVERRIDES[upperSymbol];
    if (overrides) {
      Object.assign(data, overrides);
    }

    // Cache the result
    await cache.set(cacheKey, data, CACHE_TTL);

    return NextResponse.json({
      success: true,
      data,
      cached: false,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch profile",
      },
      { status: 500 }
    );
  }
}
