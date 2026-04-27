import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./fetchApi";

export interface CryptoQuoteExtras {
  rank: number;
  volume24h: number;
  ath: number;
  atl: number;
  athChangePercent: number;
  atlChangePercent: number;
  circulatingSupply: number | null;
  totalSupply: number | null;
  maxSupply: number | null;
  priceChange1h: number | null;
  priceChange7d: number | null;
  priceChange30d: number | null;
  priceChange1y: number | null;
}

export interface QuoteData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  timestamp: string;
  valuation?: { pe?: number; pb?: number; ps?: number };
  profitability?: {
    roe?: number;
    roa?: number;
    grossMargin?: number;
    operatingMargin?: number;
    netMargin?: number;
  };
  trading?: { "52WeekHigh"?: number; "52WeekLow"?: number; avgVolume10D?: number };
  marketCap?: number;
  crypto?: CryptoQuoteExtras;
}

export function useQuote(symbol: string) {
  return useQuery({
    queryKey: ["quote", symbol],
    queryFn: () => fetchApi<QuoteData>(`/api/stock/${symbol}/quote`),
    refetchInterval: 15000,
    staleTime: 10000,
  });
}
