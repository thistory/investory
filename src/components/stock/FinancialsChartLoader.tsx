"use client";

import dynamic from "next/dynamic";

const FinancialsChart = dynamic(
  () =>
    import("@/components/stock/FinancialsChart").then(
      (mod) => mod.FinancialsChart
    ),
  { ssr: false }
);

export function FinancialsChartLoader({ symbol }: { symbol: string }) {
  return <FinancialsChart symbol={symbol} />;
}
