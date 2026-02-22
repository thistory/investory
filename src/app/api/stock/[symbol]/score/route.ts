import { NextRequest, NextResponse } from "next/server";
import { cache } from "@/lib/cache/redis";
import { getStockProfile } from "@/lib/services/providers/finnhub";
import {
  getCompanyOverview,
  getTechnicalIndicators,
} from "@/lib/services/providers/alpha-vantage";
import {
  finnhubLimiter,
  alphaVantageLimiter,
  withRateLimit,
} from "@/lib/utils/rate-limiter";
import {
  calculateCompositeScore,
  ComprehensiveInput,
  QualityInput,
  MoatInput,
  ValueInput,
  GrowthInput,
  MomentumInput,
} from "@/lib/scoring";
import { validateSymbol } from "@/lib/utils/validate-symbol";
import { requireAdmin } from "@/lib/auth/api-guard";

const CACHE_TTL = 21600; // 6 hours

interface RouteParams {
  params: Promise<{ symbol: string }>;
}

/**
 * GET /api/stock/[symbol]/score
 *
 * 종목의 종합 투자 점수를 계산합니다.
 * - Quality: 30% (수익성, 재무건전성, 성장 일관성)
 * - Moat: 25% (경쟁우위)
 * - Value: 20% (저평가)
 * - Growth: 15% (성장 잠재력)
 * - Momentum: 10% (기술적 모멘텀)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { symbol } = await params;
    const result = validateSymbol(symbol);
    if (!result.valid) return result.response;
    const upperSymbol = result.symbol;
    const cacheKey = `score:${upperSymbol}`;

    // Check cache first
    const cached = await cache.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    // Fetch data directly from providers (no self-fetch)
    const [finnhubProfile, alphaVantageOverview, technicals] =
      await Promise.all([
        withRateLimit(finnhubLimiter, () =>
          getStockProfile(upperSymbol)
        ).catch(() => null),
        withRateLimit(alphaVantageLimiter, () =>
          getCompanyOverview(upperSymbol)
        ).catch(() => null),
        withRateLimit(alphaVantageLimiter, () =>
          getTechnicalIndicators(upperSymbol)
        ).catch(() => null),
      ]);

    // Merge profile data (same logic as profile route)
    const profile = {
      symbol: upperSymbol,
      name:
        finnhubProfile?.name || alphaVantageOverview?.name || upperSymbol,
      marketCap:
        finnhubProfile?.marketCap ||
        alphaVantageOverview?.valuation?.marketCap,
      sector: alphaVantageOverview?.sector,
      valuation: alphaVantageOverview?.valuation,
      fundamentals: alphaVantageOverview?.fundamentals,
      margins: alphaVantageOverview?.margins,
      returns: alphaVantageOverview?.returns,
      growth: alphaVantageOverview?.growth,
      technicals: alphaVantageOverview?.technicals,
      analystRatings: alphaVantageOverview?.analystRatings,
    };

    // Build technicals data
    const techData = technicals
      ? {
          indicators: {
            rsi14: technicals.rsi14,
            macd: technicals.macd,
            sma20: technicals.sma20,
            sma50: technicals.sma50,
            sma200: technicals.sma200,
          },
        }
      : { indicators: {} };

    // Map data to scoring inputs
    const scoringInput: ComprehensiveInput = {
      symbol: upperSymbol,
      quality: mapQualityInput(profile),
      moat: mapMoatInput(profile),
      value: mapValueInput(profile),
      growth: mapGrowthInput(profile),
      momentum: mapMomentumInput(profile, techData),
    };

    // Calculate composite score
    const score = calculateCompositeScore(scoringInput);

    // Prepare response data
    const responseData = {
      symbol: upperSymbol,
      totalScore: score.totalScore,
      grade: score.grade,
      scores: {
        quality: score.quality.total,
        moat: score.moat.total,
        value: score.value.total,
        growth: score.growth.total,
        momentum: score.momentum.total,
      },
      details: {
        quality: {
          total: score.quality.total,
          profitability: score.quality.profitability,
          financialHealth: score.quality.financialHealth,
          growthConsistency: score.quality.growthConsistency,
          insights: score.quality.insights,
        },
        moat: {
          total: score.moat.total,
          classification: score.moat.moatClassification,
          pricingPower: score.moat.pricingPower,
          marketPosition: score.moat.marketPosition,
          durability: score.moat.durability,
          insights: score.moat.insights,
        },
        value: {
          total: score.value.total,
          valuationMultiples: score.value.valuationMultiples,
          pricePosition: score.value.pricePosition,
          marginOfSafety: score.value.marginOfSafety,
          insights: score.value.insights,
        },
        growth: {
          total: score.growth.total,
          historicalGrowth: score.growth.historicalGrowth,
          analystExpectations: score.growth.analystExpectations,
          growthQuality: score.growth.growthQuality,
          insights: score.growth.insights,
        },
        momentum: {
          total: score.momentum.total,
          trend: score.momentum.trend,
          indicators: score.momentum.indicators,
          volume: score.momentum.volume,
          insights: score.momentum.insights,
        },
      },
      insights: score.insights,
      calculatedAt: score.calculatedAt.toISOString(),
    };

    // Cache the result
    await cache.set(cacheKey, responseData, CACHE_TTL);

    return NextResponse.json({
      success: true,
      data: responseData,
      cached: false,
    });
  } catch (error) {
    console.error("Error calculating score:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to calculate score",
      },
      { status: 500 }
    );
  }
}

function mapQualityInput(profile: any): QualityInput {
  const grossMargin =
    profile.fundamentals?.grossProfit && profile.fundamentals?.revenue
      ? (profile.fundamentals.grossProfit / profile.fundamentals.revenue) * 100
      : null;

  return {
    roe: profile.returns?.roe ? profile.returns.roe * 100 : null,
    roa: profile.returns?.roa ? profile.returns.roa * 100 : null,
    netMargin: profile.margins?.profit ? profile.margins.profit * 100 : null,
    operatingMargin: profile.margins?.operating
      ? profile.margins.operating * 100
      : null,
    grossMargin,
    debtToEquity: profile.fundamentals?.debtToEquity || null,
    currentRatio: profile.fundamentals?.currentRatio || null,
    quarterlyRevenueGrowthYoY: profile.growth?.quarterlyRevenueGrowth
      ? profile.growth.quarterlyRevenueGrowth * 100
      : null,
    quarterlyEarningsGrowthYoY: profile.growth?.quarterlyEarningsGrowth
      ? profile.growth.quarterlyEarningsGrowth * 100
      : null,
  };
}

function mapMoatInput(profile: any): MoatInput {
  const grossMargin =
    profile.fundamentals?.grossProfit && profile.fundamentals?.revenue
      ? (profile.fundamentals.grossProfit / profile.fundamentals.revenue) * 100
      : null;

  return {
    grossMargin,
    operatingMargin: profile.margins?.operating
      ? profile.margins.operating * 100
      : null,
    marketCap: profile.marketCap || profile.valuation?.marketCap || null,
    beta: profile.technicals?.beta || null,
    roe: profile.returns?.roe ? profile.returns.roe * 100 : null,
    roa: profile.returns?.roa ? profile.returns.roa * 100 : null,
  };
}

function mapValueInput(profile: any): ValueInput {
  return {
    peRatio: profile.valuation?.pe || profile.valuation?.trailingPE || null,
    pegRatio: profile.valuation?.peg || null,
    pbRatio: profile.valuation?.priceToBook || null,
    psRatio: profile.valuation?.priceToSales || null,
    evToEbitda: profile.valuation?.evToEbitda || null,
    evToRevenue: profile.valuation?.evToRevenue || null,
    currentPrice: null,
    fiftyTwoWeekHigh: profile.technicals?.fiftyTwoWeekHigh || null,
    fiftyTwoWeekLow: profile.technicals?.fiftyTwoWeekLow || null,
    sector: profile.sector || null,
  };
}

function mapGrowthInput(profile: any): GrowthInput {
  return {
    quarterlyRevenueGrowthYoY: profile.growth?.quarterlyRevenueGrowth
      ? profile.growth.quarterlyRevenueGrowth * 100
      : null,
    quarterlyEarningsGrowthYoY: profile.growth?.quarterlyEarningsGrowth
      ? profile.growth.quarterlyEarningsGrowth * 100
      : null,
    trailingPE: profile.valuation?.trailingPE || profile.valuation?.pe || null,
    forwardPE: profile.valuation?.forwardPE || null,
    analystTargetPrice: profile.analystRatings?.targetPrice || null,
    currentPrice: null,
    netMargin: profile.margins?.profit ? profile.margins.profit * 100 : null,
    operatingMargin: profile.margins?.operating
      ? profile.margins.operating * 100
      : null,
  };
}

function mapMomentumInput(profile: any, technicals: any): MomentumInput {
  return {
    currentPrice: null,
    sma20: technicals.indicators?.sma20 || null,
    sma50: technicals.indicators?.sma50 || null,
    sma200: technicals.indicators?.sma200 || null,
    rsi: technicals.indicators?.rsi14 || null,
    macd: technicals.indicators?.macd?.macd || null,
    macdSignal: technicals.indicators?.macd?.signal || null,
    currentVolume: null,
    averageVolume: profile.fundamentals?.averageVolume || null,
  };
}
