import { Link } from "@/i18n/navigation";
import { getAnalysisByDate, getAllAnalyses } from "@/data/analysis";
import { AnalysisReport } from "@/components/stock/AnalysisReport";
import { ShareButtons } from "@/components/stock/ShareButtons";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";

interface AnalysisDatePageProps {
  params: Promise<{ symbol: string; date: string; locale: string }>;
}

export default async function AnalysisDatePage({
  params,
}: AnalysisDatePageProps) {
  const { symbol, date, locale } = await params;
  const upperSymbol = symbol.toUpperCase();
  const report = getAnalysisByDate(upperSymbol, date, locale as "ko" | "en");
  const t = await getTranslations({ locale, namespace: "stock" });
  const session = await auth();
  const isAdmin = session?.user?.email === process.env.ADMIN_EMAIL;

  if (!report) {
    notFound();
  }

  const allReports = getAllAnalyses(upperSymbol, locale as "ko" | "en");
  const currentIndex = allReports.findIndex((r) => r.analysisDate === date);
  const newerReport = currentIndex > 0 ? allReports[currentIndex - 1] : null;
  const olderReport =
    currentIndex < allReports.length - 1 ? allReports[currentIndex + 1] : null;

  // JSON-LD uses only trusted, server-generated content (no user input)
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${upperSymbol} ${report.companyName} — ${date} ${t("depthAnalysis")}`,
    datePublished: date,
    author: { "@type": "Organization", name: "Investory" },
    publisher: { "@type": "Organization", name: "Investory" },
    description: report.businessSummary.oneLiner,
    inLanguage: locale === "ko" ? "ko-KR" : "en-US",
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
            {t("backToHistory")}
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
            title={`${upperSymbol} ${report.companyName} ${t("depthAnalysis")}`}
            description={report.businessSummary.oneLiner}
            locale={locale}
            snsXText={report.snsContent?.x?.text}
            snsThreadsText={report.snsContent?.threads?.text}
            snsTelegramText={report.snsContent?.telegram?.text}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string; date: string; locale: string }>;
}) {
  const { symbol, date, locale } = await params;
  const upper = symbol.toUpperCase();
  const report = getAnalysisByDate(upper, date, locale as "ko" | "en");
  const t = await getTranslations({ locale, namespace: "stock" });
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://investory.kro.kr";
  const url = `${baseUrl}/${locale}/stock/${upper}/analysis/${date}`;

  const title = report
    ? `${upper} ${report.companyName} — ${date} ${t("depthAnalysis")}`
    : `${upper} - ${date} ${t("depthAnalysis")}`;
  const description = report
    ? report.snsContent?.threads?.hook ||
      `${report.businessSummary.oneLiner} | Target $${report.analystOpinions.consensusTarget} (+${report.analystOpinions.upsidePercent}%)`
    : `${upper} ${date} ${t("depthAnalysis")}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "article",
      siteName: "Investory",
      locale: locale === "ko" ? "ko_KR" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `/${locale}/stock/${upper}/analysis/${date}`,
      languages: {
        ko: `/ko/stock/${upper}/analysis/${date}`,
        en: `/en/stock/${upper}/analysis/${date}`,
      },
    },
  };
}
