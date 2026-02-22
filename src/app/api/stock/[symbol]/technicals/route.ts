import { NextRequest, NextResponse } from "next/server";
import { getTechnicalIndicators } from "@/lib/services/providers/alpha-vantage";
import { cache } from "@/lib/cache/redis";
import { alphaVantageLimiter, withRateLimit } from "@/lib/utils/rate-limiter";
import { validateSymbol } from "@/lib/utils/validate-symbol";
import { requireAuth } from "@/lib/auth/api-guard";

const CACHE_TTL = 300; // 5 minutes

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
    const cacheKey = `technicals:${upperSymbol}`;

    // Check cache first
    const cached = await cache.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    // Fetch technical indicators
    const indicators = await withRateLimit(alphaVantageLimiter, () =>
      getTechnicalIndicators(upperSymbol)
    );

    // Calculate signals based on indicators
    const signals = calculateSignals(indicators);

    const data = {
      symbol: upperSymbol,
      date: indicators.date,
      indicators: {
        rsi14: indicators.rsi14,
        macd: indicators.macd,
        sma20: indicators.sma20,
        sma50: indicators.sma50,
        sma200: indicators.sma200,
        bollingerBands: indicators.bollingerBands,
      },
      signals,
    };

    // Cache the result
    await cache.set(cacheKey, data, CACHE_TTL);

    return NextResponse.json({
      success: true,
      data,
      cached: false,
    });
  } catch (error) {
    console.error("Error fetching technical indicators:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch technical indicators",
      },
      { status: 500 }
    );
  }
}

function calculateSignals(indicators: any) {
  const signals: {
    indicator: string;
    signal: "buy" | "sell" | "neutral";
    value: number | null;
    description: string;
  }[] = [];

  // RSI signal
  if (indicators.rsi14 !== undefined) {
    let rsiSignal: "buy" | "sell" | "neutral" = "neutral";
    let rsiDesc = "RSI is neutral";

    if (indicators.rsi14 < 30) {
      rsiSignal = "buy";
      rsiDesc = "RSI indicates oversold conditions";
    } else if (indicators.rsi14 > 70) {
      rsiSignal = "sell";
      rsiDesc = "RSI indicates overbought conditions";
    }

    signals.push({
      indicator: "RSI(14)",
      signal: rsiSignal,
      value: indicators.rsi14,
      description: rsiDesc,
    });
  }

  // MACD signal
  if (indicators.macd) {
    let macdSignal: "buy" | "sell" | "neutral" = "neutral";
    let macdDesc = "MACD is neutral";

    if (indicators.macd.histogram > 0 && indicators.macd.macd > 0) {
      macdSignal = "buy";
      macdDesc = "MACD histogram is positive, bullish momentum";
    } else if (indicators.macd.histogram < 0 && indicators.macd.macd < 0) {
      macdSignal = "sell";
      macdDesc = "MACD histogram is negative, bearish momentum";
    }

    signals.push({
      indicator: "MACD",
      signal: macdSignal,
      value: indicators.macd.histogram,
      description: macdDesc,
    });
  }

  // Moving Average signals
  if (indicators.sma50 && indicators.sma200) {
    let maSignal: "buy" | "sell" | "neutral" = "neutral";
    let maDesc = "Moving averages are neutral";

    if (indicators.sma50 > indicators.sma200) {
      maSignal = "buy";
      maDesc = "Golden Cross: 50-day SMA above 200-day SMA";
    } else if (indicators.sma50 < indicators.sma200) {
      maSignal = "sell";
      maDesc = "Death Cross: 50-day SMA below 200-day SMA";
    }

    signals.push({
      indicator: "MA Cross",
      signal: maSignal,
      value: indicators.sma50 - indicators.sma200,
      description: maDesc,
    });
  }

  // Overall signal
  const buyCount = signals.filter((s) => s.signal === "buy").length;
  const sellCount = signals.filter((s) => s.signal === "sell").length;

  let overallSignal: "buy" | "sell" | "neutral" = "neutral";
  if (buyCount > sellCount) {
    overallSignal = "buy";
  } else if (sellCount > buyCount) {
    overallSignal = "sell";
  }

  return {
    overall: overallSignal,
    details: signals,
    summary: {
      buy: buyCount,
      sell: sellCount,
      neutral: signals.length - buyCount - sellCount,
    },
  };
}
