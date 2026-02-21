import { useInfiniteQuery } from "@tanstack/react-query";
import type { AnalysisIndexEntry } from "@/data/analysis/types";

interface AnalysisPage {
  entries: AnalysisIndexEntry[];
  nextCursor: number | null;
  total: number;
}

const PAGE_SIZE = 20;

export function useAnalysisList(symbol?: string) {
  return useInfiniteQuery({
    queryKey: ["analysis-list", symbol ?? "all"],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams({
        cursor: String(pageParam),
        limit: String(PAGE_SIZE),
      });
      if (symbol) params.set("symbol", symbol);

      const res = await fetch(`/api/analysis?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to fetch");
      return json.data as AnalysisPage;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 60_000,
  });
}
