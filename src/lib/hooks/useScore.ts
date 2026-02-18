"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./fetchApi";

interface Insight {
  type: "positive" | "warning" | "negative";
  message: string;
  score?: number;
}

interface CategoryDetail {
  total: number;
  insights: Insight[];
  [key: string]: unknown;
}

interface ScoreData {
  symbol: string;
  totalScore: number;
  grade: string;
  scores: {
    quality: number;
    moat: number;
    value: number;
    growth: number;
    momentum: number;
  };
  details: {
    quality: CategoryDetail;
    moat: CategoryDetail;
    value: CategoryDetail;
    growth: CategoryDetail;
    momentum: CategoryDetail;
  };
  insights: Insight[];
  calculatedAt: string;
}

export function useScore(symbol: string) {
  return useQuery({
    queryKey: ["score", symbol],
    queryFn: () => fetchApi<ScoreData>(`/api/stock/${symbol}/score`),
    staleTime: 6 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    enabled: !!symbol,
  });
}
