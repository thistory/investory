"use client";

import { useQuote } from "@/lib/hooks/useQuote";
import { useProfile } from "@/lib/hooks/useProfile";
import { MetricCard, MetricGrid } from "@/components/ui/MetricCard";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useTranslations } from "next-intl";

interface ValuationCardProps {
  symbol: string;
}

// 섹터 평균 데이터 (Consumer Cyclical - Auto Manufacturers)
const SECTOR_AVERAGES = {
  pe: 15.2,
  forwardPE: 12.8,
  pb: 2.5,
  ps: 1.2,
  peg: 1.5,
  evToEbitda: 10.5,
  evToRevenue: 1.8,
};

function CompareIndicator({ value, sectorAvg }: { value?: number; sectorAvg: number }) {
  const t = useTranslations("valuation");
  if (!value) return null;

  const diff = ((value - sectorAvg) / sectorAvg) * 100;
  const isHigher = diff > 0;

  return (
    <span className={`text-xs ${isHigher ? "text-red-400" : "text-emerald-400"}`}>
      {t("vsSector")} {isHigher ? "+" : ""}{diff.toFixed(0)}%
    </span>
  );
}

export function ValuationCard({ symbol }: ValuationCardProps) {
  const t = useTranslations("valuation");
  const { data: quote, isLoading: quoteLoading } = useQuote(symbol);
  const { data: profile, isLoading: profileLoading } = useProfile(symbol);

  if (quoteLoading || profileLoading) {
    return <CardSkeleton />;
  }

  const profileValuation = profile?.valuation;
  const quoteValuation = quote?.valuation;
  const margins = profile?.margins;
  const returns = profile?.returns;
  const fundamentals = profile?.fundamentals;

  // Calculate Price/Cash Flow if data available
  const priceToCashFlow = quote?.price && fundamentals?.ebitda && profile?.sharesOutstanding
    ? (quote.price / (fundamentals.ebitda / profile.sharesOutstanding)).toFixed(2)
    : undefined;

  const pe = profileValuation?.pe || quoteValuation?.pe;
  const forwardPE = profileValuation?.forwardPE;
  const pb = profileValuation?.priceToBook || quoteValuation?.pb;
  const ps = profileValuation?.priceToSales || quoteValuation?.ps;
  const peg = profileValuation?.peg;
  const evToEbitda = profileValuation?.evToEbitda;
  const evToRevenue = profileValuation?.evToRevenue;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{t("title")}</h2>
        <span className="text-xs text-gray-400 dark:text-zinc-500">{t("sectorLabel")}</span>
      </div>

      {/* P/E Ratios */}
      <div className="p-3 sm:p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">P/E Ratios</h3>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 dark:text-zinc-500">P/E (TTM)</span>
            <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-zinc-100">
              {pe?.toFixed(2) || "-"}
            </span>
            <CompareIndicator value={pe} sectorAvg={SECTOR_AVERAGES.pe} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 dark:text-zinc-500">Forward P/E</span>
            <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-zinc-100">
              {forwardPE?.toFixed(2) || "-"}
            </span>
            <CompareIndicator value={forwardPE} sectorAvg={SECTOR_AVERAGES.forwardPE} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 dark:text-zinc-500">PEG Ratio</span>
            <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-zinc-100">
              {peg?.toFixed(2) || "-"}
            </span>
            <CompareIndicator value={peg} sectorAvg={SECTOR_AVERAGES.peg} />
          </div>
        </div>
      </div>

      {/* Price Multiples */}
      <div className="p-3 sm:p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">Price Multiples</h3>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 dark:text-zinc-500">P/B</span>
            <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-zinc-100">
              {pb?.toFixed(2) || "-"}
            </span>
            <CompareIndicator value={pb} sectorAvg={SECTOR_AVERAGES.pb} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 dark:text-zinc-500">P/S</span>
            <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-zinc-100">
              {ps?.toFixed(2) || "-"}
            </span>
            <CompareIndicator value={ps} sectorAvg={SECTOR_AVERAGES.ps} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 dark:text-zinc-500">P/CF</span>
            <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-zinc-100">
              {priceToCashFlow || "-"}
            </span>
          </div>
        </div>
      </div>

      {/* Enterprise Value Multiples */}
      <div className="p-3 sm:p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">Enterprise Value</h3>
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 dark:text-zinc-500">EV/EBITDA</span>
            <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-zinc-100">
              {evToEbitda?.toFixed(2) || "-"}
            </span>
            <CompareIndicator value={evToEbitda} sectorAvg={SECTOR_AVERAGES.evToEbitda} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 dark:text-zinc-500">EV/Sales</span>
            <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-zinc-100">
              {evToRevenue?.toFixed(2) || "-"}
            </span>
            <CompareIndicator value={evToRevenue} sectorAvg={SECTOR_AVERAGES.evToRevenue} />
          </div>
        </div>
      </div>

      {/* Profitability */}
      <div className="p-3 sm:p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">{t("profitability")}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 dark:text-zinc-500">ROE</span>
            <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">
              {returns?.roe ? (returns.roe * 100).toFixed(2) : quote?.profitability?.roe?.toFixed(2) || "-"}%
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 dark:text-zinc-500">ROA</span>
            <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">
              {returns?.roa ? (returns.roa * 100).toFixed(2) : quote?.profitability?.roa?.toFixed(2) || "-"}%
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 dark:text-zinc-500">{t("netMargin")}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">
              {margins?.profit ? (margins.profit * 100).toFixed(2) : quote?.profitability?.netMargin?.toFixed(2) || "-"}%
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 dark:text-zinc-500">{t("operatingMargin")}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">
              {margins?.operating ? (margins.operating * 100).toFixed(2) : quote?.profitability?.operatingMargin?.toFixed(2) || "-"}%
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 dark:text-zinc-500">{t("grossMargin")}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">
              {quote?.profitability?.grossMargin?.toFixed(2) || "-"}%
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 dark:text-zinc-500">Beta</span>
            <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">
              {profile?.technicals?.beta?.toFixed(2) || "-"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
