import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./fetchApi";

export interface ProfileData {
  symbol: string;
  name: string;
  exchange?: string;
  sector?: string;
  industry?: string;
  description?: string;
  website?: string;
  logo?: string;
  country?: string;
  cik?: string;
  marketCap?: number;
  sharesOutstanding?: number;
  valuation?: {
    marketCap?: number;
    pe?: number;
    peg?: number;
    priceToBook?: number;
    priceToSales?: number;
    evToRevenue?: number;
    evToEbitda?: number;
    forwardPE?: number;
    trailingPE?: number;
  };
  fundamentals?: {
    eps?: number;
    dilutedEps?: number;
    bookValue?: number;
    revenuePerShare?: number;
    revenue?: number;
    grossProfit?: number;
    ebitda?: number;
  };
  margins?: { profit?: number; operating?: number };
  returns?: { roa?: number; roe?: number };
  growth?: { quarterlyEarningsGrowth?: number; quarterlyRevenueGrowth?: number };
  dividend?: { perShare?: number; yield?: number; date?: string; exDate?: string };
  technicals?: {
    beta?: number;
    "52WeekHigh"?: number;
    "52WeekLow"?: number;
    "50DayMA"?: number;
    "200DayMA"?: number;
  };
  analystRatings?: {
    targetPrice?: number;
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
  };
}

export function useProfile(symbol: string) {
  return useQuery({
    queryKey: ["profile", symbol],
    queryFn: () => fetchApi<ProfileData>(`/api/stock/${symbol}/profile`),
    staleTime: 86400000,
  });
}
