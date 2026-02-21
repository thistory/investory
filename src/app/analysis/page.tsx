import Link from "next/link";
import { getIndexStats } from "@/data/analysis";
import AnalysisListClient from "@/components/analysis/AnalysisListClient";

export default function AnalysisListPage() {
  const stats = getIndexStats();

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
            총 {stats.totalReports}건의 분석 · {stats.symbolCount}개 종목 ·{" "}
            {stats.dateCount}일
          </p>
        </div>

        <AnalysisListClient symbols={stats.symbols} />
      </div>
    </div>
  );
}

export const metadata = {
  title: "일별 분석 리포트",
  description: "미국 주식 종목별 심층 분석 리포트 목록",
};
