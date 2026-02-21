"use client";

import { useRef, useEffect, useDeferredValue, useState, useMemo, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import Fuse from "fuse.js";
import { useTranslations, useLocale } from "next-intl";
import { useAnalysisList } from "@/lib/hooks/useAnalysisList";
import type { AnalysisIndexEntry } from "@/data/analysis/types";

const FUSE_OPTIONS = {
  keys: ["symbol", "companyName", "oneLiner", "buyReasonTitles", "riskTitles"],
  threshold: 0.35,
  ignoreLocation: true,
};

interface Props {
  symbols: { symbol: string; companyName: string; reportCount: number }[];
}

export default function AnalysisListClient({ symbols }: Props) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const t = useTranslations("analysis");
  const locale = useLocale();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useAnalysisList(undefined, locale);

  // Flatten all loaded pages
  const allEntries = useMemo(
    () => data?.pages.flatMap((p) => p.entries) ?? [],
    [data]
  );
  const total = data?.pages[0]?.total ?? 0;

  // Fuse.js search
  const fuse = useMemo(
    () => new Fuse(allEntries, FUSE_OPTIONS),
    [allEntries]
  );

  const isSearching = deferredQuery.trim().length > 0;

  // When searching, fetch ALL entries first (need them for Fuse)
  useEffect(() => {
    if (isSearching && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isSearching, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const filtered = useMemo(() => {
    if (!isSearching) return allEntries;
    return fuse.search(deferredQuery).map((r) => r.item);
  }, [isSearching, deferredQuery, fuse, allEntries]);

  // Group by date (only when NOT searching)
  const grouped = useMemo(() => {
    if (isSearching) return null;
    const groups: Record<string, AnalysisIndexEntry[]> = {};
    for (const e of filtered) {
      if (!groups[e.analysisDate]) groups[e.analysisDate] = [];
      groups[e.analysisDate].push(e);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered, isSearching]);

  // IntersectionObserver for infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage && !isSearching) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, isSearching, fetchNextPage]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: "200px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  return (
    <>
      {/* Search bar */}
      <div className="relative mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full px-4 py-3 pl-10 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* Symbol filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {symbols.map((s) => (
          <Link
            key={s.symbol}
            href={`/stock/${s.symbol}/analysis`}
            className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-full transition-colors"
          >
            {s.symbol}{" "}
            <span className="text-gray-400 dark:text-zinc-500">
              {t("reportsCount", { count: s.reportCount })}
            </span>
          </Link>
        ))}
      </div>

      {/* Search result count */}
      {isSearching && (
        <p className="text-xs text-gray-400 dark:text-zinc-500 mb-4">
          {t("searchResults", { count: filtered.length })}
          {allEntries.length < total && ` (${t("loading")})`}
        </p>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-400 dark:text-zinc-500">
          {t("loading")}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-zinc-500">
          {isSearching ? t("noSearchResults") : t("noReports")}
        </div>
      ) : isSearching ? (
        /* Flat list when searching */
        <div className="space-y-3">
          {filtered.map((entry) => (
            <ReportCard
              key={`${entry.symbol}-${entry.analysisDate}`}
              entry={entry}
            />
          ))}
        </div>
      ) : (
        /* Grouped by date */
        <div className="space-y-6">
          {grouped!.map(([date, entries]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <div className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                  {formatDate(date, locale)}
                </div>
                <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-800" />
                <div className="text-xs text-gray-400 dark:text-zinc-600">
                  {t("reportsCount", { count: entries.length })}
                </div>
              </div>
              <div className="space-y-3">
                {entries.map((entry) => (
                  <ReportCard
                    key={`${entry.symbol}-${entry.analysisDate}`}
                    entry={entry}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {!isSearching && (
        <div ref={sentinelRef} className="h-px" />
      )}

      {/* Loading more indicator */}
      {isFetchingNextPage && (
        <div className="text-center py-6 text-sm text-gray-400 dark:text-zinc-500">
          {t("loadingMore")}
        </div>
      )}
    </>
  );
}

function ReportCard({ entry }: { entry: AnalysisIndexEntry }) {
  const t = useTranslations("analysis");
  return (
    <Link
      href={`/stock/${entry.symbol}/analysis/${entry.analysisDate}`}
      className="block group"
    >
      <div className="bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg p-4 sm:p-5 transition-all">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {entry.symbol}
            </span>
            <span className="text-sm text-gray-400 dark:text-zinc-500">
              {entry.companyName}
            </span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <div className="text-sm font-mono">${entry.currentPrice}</div>
              <div className="text-xs text-gray-400 dark:text-zinc-500">
                {entry.marketCap}
              </div>
            </div>
          </div>
        </div>

        {/* One-liner */}
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-3">
          {entry.oneLiner}
        </p>

        {/* Buy reasons */}
        <div className="flex flex-wrap gap-2 mb-3">
          {entry.buyReasonTitles.map((title, j) => (
            <span
              key={j}
              className="px-2 py-1 text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded"
            >
              {title}
            </span>
          ))}
        </div>

        {/* Risk + Target */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 dark:text-zinc-500">
              {t("targetPrice")}{" "}
              <span className="text-blue-600 dark:text-blue-400 font-mono">
                ${entry.consensusTarget}
              </span>{" "}
              (+{entry.upsidePercent}%)
            </span>
            <span className="text-gray-300 dark:text-zinc-600">·</span>
            <span className="text-gray-400 dark:text-zinc-500">
              {t("risks")}{" "}
              <span className="text-red-500 dark:text-red-400">
                {entry.highRiskCount}
              </span>
            </span>
            <span className="text-gray-300 dark:text-zinc-600">·</span>
            <span className="text-gray-400 dark:text-zinc-500">
              {t("sources")} {entry.sourceCount}
            </span>
          </div>
          <span className="text-blue-600 dark:text-blue-400 group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors">
            {t("viewReport")}
          </span>
        </div>
      </div>
    </Link>
  );
}

function formatDate(dateStr: string, locale: string): string {
  const [y, m, d] = dateStr.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));

  if (locale === "en") {
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${weekdays[date.getDay()]}, ${months[Number(m) - 1]} ${Number(d)}, ${y}`;
  }

  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const weekday = weekdays[date.getDay()];
  return `${y}년 ${Number(m)}월 ${Number(d)}일 (${weekday})`;
}
