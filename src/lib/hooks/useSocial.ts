import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./fetchApi";

export interface SentimentTrend {
  date: string;
  mentions: number;
  score: number;
  positiveScore: number;
  negativeScore: number;
}

export interface SentimentSummary {
  bullish: number;
  bearish: number;
  neutral: number;
  total: number;
  bullishPercent: number;
  bearishPercent: number;
  overallSentiment: "bullish" | "bearish" | "neutral";
  avgScore: number;
}

export interface RecentNewsItem {
  headline: string;
  source: string;
  datetime: string;
  url: string;
  sentiment: "bullish" | "bearish" | "neutral";
}

export interface SocialData {
  symbol: string;
  sentiment: SentimentSummary;
  trend: SentimentTrend[];
  recentNews?: RecentNewsItem[];
  updatedAt: string;
  dataSource?: string;
}

export function useSocial(symbol: string) {
  return useQuery({
    queryKey: ["social", symbol],
    queryFn: () => fetchApi<SocialData>(`/api/stock/${symbol}/social`),
    refetchInterval: 300000,
    staleTime: 180000,
  });
}
