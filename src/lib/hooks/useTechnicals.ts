import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./fetchApi";

export interface TechnicalSignal {
  indicator: string;
  signal: "buy" | "sell" | "neutral";
  value: number | null;
  description: string;
}

export interface TechnicalsData {
  symbol: string;
  date: string;
  indicators: {
    rsi14?: number;
    macd?: { macd: number; signal: number; histogram: number };
    sma20?: number;
    sma50?: number;
    sma200?: number;
    bollingerBands?: { upper: number; middle: number; lower: number };
  };
  signals: {
    overall: "buy" | "sell" | "neutral";
    details: TechnicalSignal[];
    summary: { buy: number; sell: number; neutral: number };
  };
}

export function useTechnicals(symbol: string) {
  return useQuery({
    queryKey: ["technicals", symbol],
    queryFn: () => fetchApi<TechnicalsData>(`/api/stock/${symbol}/technicals`),
    staleTime: 300000,
  });
}
