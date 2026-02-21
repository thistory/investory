import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getIndexStats } from "@/data/analysis";
import AnalysisListClient from "@/components/analysis/AnalysisListClient";
import { getTranslations } from "next-intl/server";

export default async function AnalysisListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "analysis" });
  const stats = getIndexStats(locale as "ko" | "en");

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Back nav */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors mb-6"
        >
          {t("backHome")}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t("title")}</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {t("stats", {
              totalReports: stats.totalReports,
              symbolCount: stats.symbolCount,
              dateCount: stats.dateCount,
            })}
          </p>
        </div>

        <AnalysisListClient symbols={stats.symbols} />
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "analysis" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: `/${locale}/analysis`,
    },
    alternates: {
      canonical: `/${locale}/analysis`,
      languages: {
        ko: "/ko/analysis",
        en: "/en/analysis",
      },
    },
  };
}
