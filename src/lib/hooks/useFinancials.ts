import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./fetchApi";

export interface FinancialReport {
  date: string;
  revenue: number;
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  ebitda: number;
}

export interface FinancialsData {
  annual: FinancialReport[];
  quarterly: FinancialReport[];
}

export function useFinancials(symbol: string) {
  return useQuery({
    queryKey: ["financials", symbol],
    queryFn: () => fetchApi<FinancialsData>(`/api/stock/${symbol}/financials`),
    staleTime: 86400000,
    retry: 2,
    retryDelay: 3000,
  });
}
