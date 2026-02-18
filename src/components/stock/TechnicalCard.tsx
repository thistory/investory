"use client";

import { useTechnicals } from "@/lib/hooks/useTechnicals";
import { MetricCard, MetricGrid } from "@/components/ui/MetricCard";
import { SignalIndicator } from "@/components/ui/SignalIndicator";
import { CardSkeleton } from "@/components/ui/Skeleton";

interface TechnicalCardProps {
  symbol: string;
}

export function TechnicalCard({ symbol }: TechnicalCardProps) {
  const { data: technicals, isLoading } = useTechnicals(symbol);

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (!technicals) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg">
        <p className="text-gray-400 dark:text-zinc-500">기술적 지표를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const { indicators, signals } = technicals;

  const getRsiColor = (rsi?: number) => {
    if (!rsi) return "text-gray-900 dark:text-zinc-100";
    if (rsi < 30) return "text-emerald-500";
    if (rsi > 70) return "text-red-500";
    return "text-gray-900 dark:text-zinc-100";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">기술적 분석</h2>
        <SignalIndicator signal={signals.overall} size="md" />
      </div>

      <MetricGrid columns={3}>
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 dark:text-zinc-500 uppercase tracking-wide">
            RSI (14)
          </span>
          <span className={`text-sm font-medium ${getRsiColor(indicators.rsi14)}`}>
            {indicators.rsi14?.toFixed(2) || "-"}
          </span>
          <span className="text-xs text-gray-400 dark:text-zinc-500">
            {indicators.rsi14 && indicators.rsi14 < 30
              ? "과매도"
              : indicators.rsi14 && indicators.rsi14 > 70
                ? "과매수"
                : "중립"}
          </span>
        </div>
        <MetricCard
          label="MACD"
          value={indicators.macd?.macd?.toFixed(2)}
        />
        <MetricCard
          label="MACD Signal"
          value={indicators.macd?.signal?.toFixed(2)}
        />
        <MetricCard
          label="SMA (20)"
          value={indicators.sma20}
          prefix="$"
        />
        <MetricCard
          label="SMA (50)"
          value={indicators.sma50}
          prefix="$"
        />
        <MetricCard
          label="SMA (200)"
          value={indicators.sma200}
          prefix="$"
        />
      </MetricGrid>

      {indicators.bollingerBands && (
        <>
          <h3 className="text-md font-medium text-gray-800 dark:text-zinc-200 mt-4">
            볼린저 밴드
          </h3>
          <MetricGrid columns={3}>
            <MetricCard
              label="상단"
              value={indicators.bollingerBands.upper}
              prefix="$"
            />
            <MetricCard
              label="중간"
              value={indicators.bollingerBands.middle}
              prefix="$"
            />
            <MetricCard
              label="하단"
              value={indicators.bollingerBands.lower}
              prefix="$"
            />
          </MetricGrid>
        </>
      )}

      {/* Signal Details */}
      <div className="mt-4 p-3 bg-gray-100 dark:bg-zinc-800/50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-800 dark:text-zinc-200 mb-2">신호 요약</h3>
        <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
          <span className="text-emerald-500">
            매수: {signals.summary.buy}
          </span>
          <span className="text-red-500">매도: {signals.summary.sell}</span>
          <span className="text-gray-500 dark:text-zinc-400">
            중립: {signals.summary.neutral}
          </span>
        </div>
        <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
          {signals.details.map((detail, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-gray-500 dark:text-zinc-400 truncate mr-2">{detail.indicator}</span>
              <SignalIndicator signal={detail.signal} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
