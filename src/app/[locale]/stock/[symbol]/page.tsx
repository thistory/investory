import { StockHeader } from "@/components/stock/StockHeader";
import { InvestmentScoreCard } from "@/components/stock/InvestmentScoreCard";
import { PriceChart } from "@/components/charts/PriceChart";
import { ValuationCard } from "@/components/stock/ValuationCard";
import { TechnicalCard } from "@/components/stock/TechnicalCard";
import { CompanyDescription } from "@/components/stock/CompanyDescription";
import { SocialFeed } from "@/components/stock/SocialFeed";
import { AnalysisSummaryCard } from "@/components/stock/AnalysisSummaryCard";
import { FinancialsChartLoader } from "@/components/stock/FinancialsChartLoader";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import LockScreen from "@/components/ui/LockScreen";

interface StockPageProps {
  params: Promise<{ symbol: string; locale: string }>;
}

export default async function StockPage({ params }: StockPageProps) {
  const { symbol, locale } = await params;
  const session = await auth();
  const isAdmin = session?.user?.email === process.env.ADMIN_EMAIL;

  if (!isAdmin) {
    const t = await getTranslations({ locale, namespace: "lockScreen" });
    return (
      <LockScreen
        locale={locale}
        title={t("stockDetail.title")}
        description={t("stockDetail.description")}
        features={[
          t("stockDetail.features.0"),
          t("stockDetail.features.1"),
          t("stockDetail.features.2"),
          t("stockDetail.features.3"),
        ]}
        source={`stock-${symbol.toUpperCase()}`}
        ctaText={t("ctaText")}
        loginText={t("loginText")}
        waitlistHeading={t("waitlistHeading")}
        waitlistSubheading={t("waitlistSubheading")}
      />
    );
  }

  const upperSymbol = symbol.toUpperCase();

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
        <StockHeader symbol={upperSymbol} />
        <AnalysisSummaryCard symbol={upperSymbol} />
        <FinancialsChartLoader symbol={upperSymbol} />
        <InvestmentScoreCard symbol={upperSymbol} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-4 sm:space-y-6">
            <ValuationCard symbol={upperSymbol} />
          </div>
          <div className="space-y-4 sm:space-y-6">
            <TechnicalCard symbol={upperSymbol} />
            <SocialFeed symbol={upperSymbol} />
          </div>
        </div>
        <CompanyDescription symbol={upperSymbol} />
        <PriceChart symbol={upperSymbol} />
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
    title: `${upper} - ${t("analysis")}`,
    description: `${upper} ${t("analysisDesc")}`,
    openGraph: {
      title: `${upper} - ${t("analysis")}`,
      description: `${upper} ${t("analysisDesc")}`,
      url: `/${locale}/stock/${upper}`,
    },
    alternates: {
      canonical: `/${locale}/stock/${upper}`,
      languages: {
        ko: `/ko/stock/${upper}`,
        en: `/en/stock/${upper}`,
      },
    },
  };
}
