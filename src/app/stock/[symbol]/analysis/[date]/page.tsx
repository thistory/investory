import Link from "next/link";
import { getAnalysisByDate, getAllAnalyses } from "@/data/analysis";
import { AnalysisReport } from "@/components/stock/AnalysisReport";
import { ShareButtons } from "@/components/stock/ShareButtons";
import { notFound } from "next/navigation";

interface AnalysisDatePageProps {
  params: Promise<{ symbol: string; date: string }>;
}

export default async function AnalysisDatePage({
  params,
}: AnalysisDatePageProps) {
  const { symbol, date } = await params;
  const upperSymbol = symbol.toUpperCase();
  const report = getAnalysisByDate(upperSymbol, date);

  if (!report) {
    notFound();
  }

  // 이전/다음 분석 찾기
  const allReports = getAllAnalyses(upperSymbol);
  const currentIndex = allReports.findIndex((r) => r.analysisDate === date);
  const newerReport = currentIndex > 0 ? allReports[currentIndex - 1] : null;
  const olderReport =
    currentIndex < allReports.length - 1 ? allReports[currentIndex + 1] : null;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${upperSymbol} ${report.companyName} — ${date} 심층 분석`,
    datePublished: date,
    author: { "@type": "Organization", name: "Investory" },
    publisher: { "@type": "Organization", name: "Investory" },
    description: report.businessSummary.oneLiner,
  };

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/stock/${upperSymbol}/analysis`}
            className="inline-flex items-center gap-1 text-sm text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors"
          >
            ← 분석 히스토리
          </Link>
          <div className="flex items-center gap-2">
            {olderReport && (
              <Link
                href={`/stock/${upperSymbol}/analysis/${olderReport.analysisDate}`}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded transition-colors text-gray-500 dark:text-zinc-400"
              >
                ← {olderReport.analysisDate}
              </Link>
            )}
            {newerReport && (
              <Link
                href={`/stock/${upperSymbol}/analysis/${newerReport.analysisDate}`}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded transition-colors text-gray-500 dark:text-zinc-400"
              >
                {newerReport.analysisDate} →
              </Link>
            )}
          </div>
        </div>

        {/* Full Report */}
        <AnalysisReport report={report} />

        {/* Share */}
        <div className="mt-6">
          <ShareButtons
            symbol={upperSymbol}
            date={date}
            title={`${upperSymbol} ${report.companyName} 심층 분석`}
            description={report.businessSummary.oneLiner}
            snsXText={report.snsContent?.x?.text}
            snsThreadsText={report.snsContent?.threads.text}
            snsTelegramText={report.snsContent?.telegram.text}
          />
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string; date: string }>;
}) {
  const { symbol, date } = await params;
  const upper = symbol.toUpperCase();
  const report = getAnalysisByDate(upper, date);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const url = `${baseUrl}/stock/${upper}/analysis/${date}`;

  const title = report
    ? `${upper} ${report.companyName} — ${date} 분석`
    : `${upper} - ${date} 분석`;
  const description = report
    ? report.snsContent?.threads.hook ||
      `${report.businessSummary.oneLiner} | 목표가 $${report.analystOpinions.consensusTarget} (+${report.analystOpinions.upsidePercent}%)`
    : `${upper} 종목 ${date} 심층 분석 리포트`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "article",
      siteName: "Investory",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `/stock/${upper}/analysis/${date}`,
    },
  };
}
