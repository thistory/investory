import { StockHeader } from "@/components/stock/StockHeader";
import { InvestmentScoreCard } from "@/components/stock/InvestmentScoreCard";
import { PriceChart } from "@/components/charts/PriceChart";
import { ValuationCard } from "@/components/stock/ValuationCard";
import { TechnicalCard } from "@/components/stock/TechnicalCard";
import { CompanyDescription } from "@/components/stock/CompanyDescription";
import { SocialFeed } from "@/components/stock/SocialFeed";
import { AnalysisSummaryCard } from "@/components/stock/AnalysisSummaryCard";
import { FinancialsChartLoader } from "@/components/stock/FinancialsChartLoader";

interface StockPageProps {
  params: Promise<{ symbol: string }>;
}

export default async function StockPage({ params }: StockPageProps) {
  const { symbol } = await params;
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

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const upper = symbol.toUpperCase();
  return {
    title: `${upper} - 주식 분석`,
    description: `${upper} 종목의 실시간 시세, 기술적 분석, 밸류에이션 정보`,
    openGraph: {
      title: `${upper} - 주식 분석`,
      description: `${upper} 종목의 실시간 시세, 기술적 분석, 밸류에이션 정보`,
      url: `/stock/${upper}`,
    },
    alternates: {
      canonical: `/stock/${upper}`,
    },
  };
}
