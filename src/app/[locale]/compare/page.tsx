"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { StockHeader } from "@/components/stock/StockHeader";
import { InvestmentScoreCard } from "@/components/stock/InvestmentScoreCard";
import { ValuationCard } from "@/components/stock/ValuationCard";
import { TechnicalCard } from "@/components/stock/TechnicalCard";
import { PriceChart } from "@/components/charts/PriceChart";
import { CompareHighlights } from "@/components/compare/CompareHighlights";
import { useScore } from "@/lib/hooks/useScore";

function ComparePageContent() {
  const searchParams = useSearchParams();
  const symbolsParam = searchParams.get("symbols");
  const t = useTranslations("compare");

  if (!symbolsParam) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t("title")}</h1>
          <p className="text-gray-500 dark:text-zinc-400 mb-4">
            {t("noSymbols")}
          </p>
          <p className="text-sm text-gray-400 dark:text-zinc-500">
            {t("noSymbolsExample")}
          </p>
        </div>
      </div>
    );
  }

  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  if (symbols.length !== 2) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t("title")}</h1>
          <p className="text-gray-500 dark:text-zinc-400 mb-4">
            {t("twoRequired")}
          </p>
          <p className="text-sm text-gray-400 dark:text-zinc-500">
            {t("currentCount", { count: symbols.length })}
          </p>
        </div>
      </div>
    );
  }

  const [leftSymbol, rightSymbol] = symbols;

  return <CompareView leftSymbol={leftSymbol} rightSymbol={rightSymbol} />;
}

function CompareView({
  leftSymbol,
  rightSymbol,
}: {
  leftSymbol: string;
  rightSymbol: string;
}) {
  const { data: leftScore } = useScore(leftSymbol);
  const { data: rightScore } = useScore(rightSymbol);
  const t = useTranslations("compare");

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
      <div className="max-w-[1920px] mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-zinc-100 mb-2">
            {t("title")}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-zinc-400">
            {leftSymbol} vs {rightSymbol}
          </p>
        </div>

        {/* Comparison Highlights */}
        <CompareHighlights
          leftSymbol={leftSymbol}
          rightSymbol={rightSymbol}
          leftScore={leftScore}
          rightScore={rightScore}
        />

        {/* Side-by-Side Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Side */}
          <div className="space-y-4 border-r-0 lg:border-r lg:border-gray-200 dark:border-zinc-800 lg:pr-4">
            <div className="bg-gray-100 dark:bg-zinc-800/30 rounded-lg p-2 mb-2">
              <h2 className="text-lg font-bold text-center">{leftSymbol}</h2>
            </div>

            <StockHeader symbol={leftSymbol} />
            <InvestmentScoreCard symbol={leftSymbol} />
            <ValuationCard symbol={leftSymbol} />
            <TechnicalCard symbol={leftSymbol} />
            <PriceChart symbol={leftSymbol} />
          </div>

          {/* Right Side */}
          <div className="space-y-4 lg:pl-4">
            <div className="bg-gray-100 dark:bg-zinc-800/30 rounded-lg p-2 mb-2">
              <h2 className="text-lg font-bold text-center">{rightSymbol}</h2>
            </div>

            <StockHeader symbol={rightSymbol} />
            <InvestmentScoreCard symbol={rightSymbol} />
            <ValuationCard symbol={rightSymbol} />
            <TechnicalCard symbol={rightSymbol} />
            <PriceChart symbol={rightSymbol} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  const t = useTranslations("compare");
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
          <div className="text-gray-500 dark:text-zinc-400">{t("loading")}</div>
        </div>
      }
    >
      <ComparePageContent />
    </Suspense>
  );
}
