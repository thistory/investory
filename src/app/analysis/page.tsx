import Link from "next/link";
import { getAllReportsByDate, getAnalyzedSymbols } from "@/data/analysis";

export default function AnalysisListPage() {
  const reports = getAllReportsByDate();
  const symbols = getAnalyzedSymbols();

  // 날짜별 그룹핑
  const byDate: Record<string, typeof reports> = {};
  for (const report of reports) {
    if (!byDate[report.analysisDate]) {
      byDate[report.analysisDate] = [];
    }
    byDate[report.analysisDate].push(report);
  }
  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Back nav */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors mb-6"
        >
          ← 홈으로
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            일별 분석 리포트
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            총 {reports.length}건의 분석 · {symbols.length}개 종목 ·{" "}
            {dates.length}일
          </p>
        </div>

        {/* 종목 필터 칩 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {symbols.map((s) => (
            <Link
              key={s.symbol}
              href={`/stock/${s.symbol}/analysis`}
              className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-full transition-colors"
            >
              {s.symbol}{" "}
              <span className="text-gray-400 dark:text-zinc-500">{s.reportCount}건</span>
            </Link>
          ))}
        </div>

        {/* 날짜별 리스트 */}
        {reports.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-zinc-500">
            아직 분석 리포트가 없습니다.
          </div>
        ) : (
          <div className="space-y-6">
            {dates.map((date) => (
              <div key={date}>
                {/* 날짜 헤더 */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                    {formatDateKR(date)}
                  </div>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-800" />
                  <div className="text-xs text-gray-400 dark:text-zinc-600">
                    {byDate[date].length}건
                  </div>
                </div>

                {/* 리포트 카드 */}
                <div className="space-y-3">
                  {byDate[date].map((report) => (
                    <Link
                      key={`${report.symbol}-${report.analysisDate}`}
                      href={`/stock/${report.symbol}/analysis/${report.analysisDate}`}
                      className="block group"
                    >
                      <div className="bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg p-4 sm:p-5 transition-all">
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {report.symbol}
                            </span>
                            <span className="text-sm text-gray-400 dark:text-zinc-500">
                              {report.companyName}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-right">
                              <div className="text-sm font-mono">
                                ${report.currentPrice}
                              </div>
                              <div className="text-xs text-gray-400 dark:text-zinc-500">
                                {report.marketCap}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* One-liner */}
                        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-3">
                          {report.businessSummary.oneLiner}
                        </p>

                        {/* Buy reasons */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {report.buyReasons.map((reason, j) => (
                            <span
                              key={j}
                              className="px-2 py-1 text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded"
                            >
                              {reason.title}
                            </span>
                          ))}
                        </div>

                        {/* Risk + Target */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-400 dark:text-zinc-500">
                              목표가{" "}
                              <span className="text-blue-600 dark:text-blue-400 font-mono">
                                ${report.analystOpinions.consensusTarget}
                              </span>{" "}
                              (+{report.analystOpinions.upsidePercent}%)
                            </span>
                            <span className="text-gray-300 dark:text-zinc-600">·</span>
                            <span className="text-gray-400 dark:text-zinc-500">
                              리스크{" "}
                              <span className="text-red-500 dark:text-red-400">
                                {
                                  report.risks.filter(
                                    (r) =>
                                      r.severity === "critical" ||
                                      r.severity === "high"
                                  ).length
                                }
                                건
                              </span>
                            </span>
                            <span className="text-gray-300 dark:text-zinc-600">·</span>
                            <span className="text-gray-400 dark:text-zinc-500">
                              출처 {report.sources.length}건
                            </span>
                          </div>
                          <span className="text-blue-600 dark:text-blue-400 group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors">
                            리포트 보기 →
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDateKR(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const weekday = weekdays[date.getDay()];
  return `${y}년 ${Number(m)}월 ${Number(d)}일 (${weekday})`;
}

export const metadata = {
  title: "일별 분석 리포트",
  description: "미국 주식 종목별 심층 분석 리포트 목록",
};
