import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./fetchApi";

export type Period = "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y";

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartData {
  symbol: string;
  period: Period;
  candles: CandleData[];
}

export function useChart(symbol: string, period: Period = "1Y") {
  return useQuery({
    queryKey: ["chart", symbol, period],
    queryFn: () => fetchApi<ChartData>(`/api/stock/${symbol}/chart?period=${period}`),
    staleTime: period === "1D" ? 60000 : 300000,
  });
}
