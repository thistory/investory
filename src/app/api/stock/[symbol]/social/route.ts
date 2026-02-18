import { NextRequest, NextResponse } from "next/server";
import { getStockNews } from "@/lib/services/providers/finnhub";
import { cache } from "@/lib/cache/redis";
import { validateSymbol } from "@/lib/utils/validate-symbol";

const CACHE_TTL = 600; // 10 minutes

interface RouteParams {
  params: Promise<{ symbol: string }>;
}

function analyzeHeadlineSentiment(headline: string): number {
  const bullishWords = [
    "surge", "soar", "jump", "rally", "gain", "rise", "up", "high", "record",
    "beat", "exceeds", "growth", "profit", "bullish", "buy", "upgrade",
    "outperform", "strong", "positive", "success", "breakthrough", "deal",
  ];
  const bearishWords = [
    "fall", "drop", "plunge", "crash", "decline", "down", "low", "miss",
    "loss", "bearish", "sell", "downgrade", "underperform", "weak", "negative",
    "fail", "concern", "risk", "warning", "cut", "layoff", "recession",
  ];

  const lowerHeadline = headline.toLowerCase();
  let score = 0;

  bullishWords.forEach((word) => {
    if (lowerHeadline.includes(word)) score += 1;
  });
  bearishWords.forEach((word) => {
    if (lowerHeadline.includes(word)) score -= 1;
  });

  return Math.max(-1, Math.min(1, score / 3));
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { symbol } = await params;
    const result = validateSymbol(symbol);
    if (!result.valid) return result.response;
    const upperSymbol = result.symbol;
    const cacheKey = `social:news:v2:${upperSymbol}`;

    const cached = await cache.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached, cached: true });
    }

    const news = await getStockNews(upperSymbol, 20);

    const newsWithSentiment = news.map((item) => ({
      ...item,
      sentimentScore: analyzeHeadlineSentiment(item.headline),
    }));

    const totalNews = newsWithSentiment.length;
    const bullishNews = newsWithSentiment.filter((n) => n.sentimentScore > 0).length;
    const bearishNews = newsWithSentiment.filter((n) => n.sentimentScore < 0).length;
    const neutralNews = totalNews - bullishNews - bearishNews;

    const avgScore =
      totalNews > 0
        ? newsWithSentiment.reduce((sum, n) => sum + n.sentimentScore, 0) / totalNews
        : 0;

    let overallSentiment: "bullish" | "bearish" | "neutral" = "neutral";
    if (avgScore > 0.15) overallSentiment = "bullish";
    else if (avgScore < -0.15) overallSentiment = "bearish";

    const bullishPercent = totalNews > 0 ? (bullishNews / totalNews) * 100 : 33;
    const bearishPercent = totalNews > 0 ? (bearishNews / totalNews) * 100 : 33;

    const newsByDate = new Map<string, { count: number; totalScore: number }>();
    newsWithSentiment.forEach((item) => {
      const date = item.datetime.toISOString().split("T")[0];
      const existing = newsByDate.get(date) || { count: 0, totalScore: 0 };
      newsByDate.set(date, {
        count: existing.count + 1,
        totalScore: existing.totalScore + item.sentimentScore,
      });
    });

    const trend = Array.from(newsByDate.entries())
      .map(([date, data]) => ({
        date,
        mentions: data.count,
        score: data.count > 0 ? data.totalScore / data.count : 0,
        positiveScore: 0,
        negativeScore: 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);

    const data = {
      symbol: upperSymbol,
      sentiment: {
        bullish: bullishNews,
        bearish: bearishNews,
        neutral: neutralNews,
        total: totalNews,
        bullishPercent,
        bearishPercent,
        overallSentiment,
        avgScore,
      },
      trend,
      recentNews: newsWithSentiment.slice(0, 20).map((n) => ({
        headline: n.headline,
        source: n.source,
        datetime: n.datetime,
        url: n.url,
        sentiment: n.sentimentScore > 0 ? "bullish" : n.sentimentScore < 0 ? "bearish" : "neutral",
      })),
      updatedAt: new Date().toISOString(),
      dataSource: "News Analysis",
    };

    await cache.set(cacheKey, data, CACHE_TTL);

    return NextResponse.json({ success: true, data, cached: false });
  } catch (error) {
    console.error("Error fetching social data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch social data",
      },
      { status: 500 }
    );
  }
}
