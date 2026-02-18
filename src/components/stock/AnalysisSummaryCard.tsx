import Link from "next/link";
import { getLatestAnalysis, getAllAnalyses } from "@/data/analysis";

interface AnalysisSummaryCardProps {
  symbol: string;
}

export function AnalysisSummaryCard({ symbol }: AnalysisSummaryCardProps) {
  const latest = getLatestAnalysis(symbol);
  const allReports = getAllAnalyses(symbol);

  if (!latest) return null;

  const topRisk = latest.risks[0];

  return (
    <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-1">
            심층 분석 요약
          </h2>
          <p className="text-xs text-gray-400 dark:text-zinc-500">
            최종 분석일: {latest.analysisDate} · 총 {allReports.length}회 분석
          </p>
        </div>
        <Link
          href={`/stock/${symbol}/analysis`}
          className="px-3 py-1.5 text-xs font-medium bg-blue-600/20 text-blue-600 dark:text-blue-400 hover:bg-blue-600/30 rounded-lg transition-colors whitespace-nowrap"
        >
          전체 보기 →
        </Link>
      </div>

      {/* One-liner */}
      <div className="p-3 bg-blue-500/5 rounded-lg mb-4">
        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
          {latest.businessSummary.oneLiner}
        </p>
      </div>

      {/* Key Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="p-2.5 bg-gray-100 dark:bg-zinc-800/50 rounded-lg text-center">
          <div className="text-xs text-gray-400 dark:text-zinc-500">현재가</div>
          <div className="text-base font-bold font-mono">
            ${latest.currentPrice}
          </div>
        </div>
        <div className="p-2.5 bg-gray-100 dark:bg-zinc-800/50 rounded-lg text-center">
          <div className="text-xs text-gray-400 dark:text-zinc-500">시가총액</div>
          <div className="text-base font-bold font-mono">
            {latest.marketCap}
          </div>
        </div>
        <div className="p-2.5 bg-gray-100 dark:bg-zinc-800/50 rounded-lg text-center">
          <div className="text-xs text-gray-400 dark:text-zinc-500">목표가</div>
          <div className="text-base font-bold font-mono text-blue-600 dark:text-blue-400">
            ${latest.analystOpinions.consensusTarget}
          </div>
        </div>
        <div className="p-2.5 bg-gray-100 dark:bg-zinc-800/50 rounded-lg text-center">
          <div className="text-xs text-gray-400 dark:text-zinc-500">업사이드</div>
          <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
            +{latest.analystOpinions.upsidePercent}%
          </div>
        </div>
      </div>

      {/* Buy Reasons */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
          ✅ 사야 하는 이유
        </h3>
        <div className="space-y-1.5">
          {latest.buyReasons.map((reason, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="text-emerald-500 dark:text-emerald-400 font-bold flex-shrink-0">{i + 1}.</span>
              <div>
                <span className="text-gray-800 dark:text-zinc-200 font-medium">{reason.title}</span>
                <span className="text-gray-400 dark:text-zinc-500"> — {reason.rationale}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Risk */}
      {topRisk && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
            ⚠️ 최대 리스크
          </h3>
          <div
            className={`p-2.5 rounded-lg text-sm ${
              topRisk.severity === "critical"
                ? "bg-red-500/5"
                : "bg-orange-500/5"
            }`}
          >
            <span className="text-gray-800 dark:text-zinc-200 font-medium">{topRisk.title}:</span>{" "}
            <span className="text-gray-500 dark:text-zinc-400">
              {topRisk.description.length > 120
                ? topRisk.description.slice(0, 120) + "..."
                : topRisk.description}
            </span>
          </div>
        </div>
      )}

      {/* Overall Opinion */}
      <div className="p-3 bg-gray-100 dark:bg-zinc-800/30 rounded-lg mb-4">
        <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
          {latest.overallOpinion.length > 200
            ? latest.overallOpinion.slice(0, 200) + "..."
            : latest.overallOpinion}
        </p>
      </div>

      {/* Sources count + link */}
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-zinc-500">
        <span>
          출처 {latest.sources.length}건 · 뉴스 {latest.recentNews.length}건
        </span>
        <Link
          href={`/stock/${symbol}/analysis/${latest.analysisDate}`}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
        >
          상세 분석 보기 →
        </Link>
      </div>
    </div>
  );
}
