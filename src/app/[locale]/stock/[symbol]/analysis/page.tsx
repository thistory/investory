import { Link } from "@/i18n/navigation";
import { getAllAnalyses } from "@/data/analysis";
import { getTranslations } from "next-intl/server";

interface AnalysisListPageProps {
  params: Promise<{ symbol: string; locale: string }>;
}

export default async function AnalysisListPage({
  params,
}: AnalysisListPageProps) {
  const { symbol, locale } = await params;
  const upperSymbol = symbol.toUpperCase();
  const reports = getAllAnalyses(upperSymbol, locale as "ko" | "en");
  const t = await getTranslations({ locale, namespace: "stock" });

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Back nav */}
        <Link
          href={`/stock/${upperSymbol}`}
          className="inline-flex items-center gap-1 text-sm text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors mb-6"
        >
          {t("backToStock", { symbol: upperSymbol })}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            {upperSymbol} {t("analysisHistory")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {reports.length > 0
              ? t("totalAnalyses", {
                  count: reports.length,
                  date: reports[0].analysisDate,
                })
              : t("noReportsYet")}
          </p>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-zinc-500">
            {t("noReportsForStock")}
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report, i) => (
              <Link
                key={report.analysisDate}
                href={`/stock/${upperSymbol}/analysis/${report.analysisDate}`}
                className="block group"
              >
                <div className="bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg p-4 sm:p-5 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      {i === 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded">
                          {t("latest")}
                        </span>
                      )}
                      <span className="text-lg font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {report.analysisDate}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-mono">
                        ${report.currentPrice}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-zinc-500">
                        {report.marketCap}
                      </div>
                    </div>
                  </div>

                  {/* Buy reasons summary */}
                  <div className="space-y-1 mb-3">
                    {report.buyReasons.map((reason, j) => (
                      <div key={j} className="flex items-center gap-2 text-sm">
                        <span className="text-emerald-500 dark:text-emerald-400 flex-shrink-0">
                          ✓
                        </span>
                        <span className="text-gray-500 dark:text-zinc-400">
                          {reason.title}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Opinion preview */}
                  <p className="text-xs text-gray-400 dark:text-zinc-500 line-clamp-2">
                    {report.overallOpinion}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-zinc-800/50 text-xs text-gray-400 dark:text-zinc-600">
                    <span>
                      {t("sourcesCount", {
                        sourceCount: report.sources.length,
                        riskCount: report.risks.filter(
                          (r) =>
                            r.severity === "critical" || r.severity === "high"
                        ).length,
                      })}
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors">
                      {t("viewDetail")}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string; locale: string }>;
}) {
  const { symbol, locale } = await params;
  const upper = symbol.toUpperCase();
  const t = await getTranslations({ locale, namespace: "stock" });

  return {
    title: `${upper} - ${t("analysisHistoryMeta")}`,
    description: `${upper} ${t("analysisHistoryDesc")}`,
    openGraph: {
      title: `${upper} - ${t("analysisHistoryMeta")}`,
      description: `${upper} ${t("analysisHistoryDesc")}`,
      url: `/${locale}/stock/${upper}/analysis`,
    },
    alternates: {
      canonical: `/${locale}/stock/${upper}/analysis`,
      languages: {
        ko: `/ko/stock/${upper}/analysis`,
        en: `/en/stock/${upper}/analysis`,
      },
    },
  };
}
