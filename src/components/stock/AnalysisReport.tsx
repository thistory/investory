"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { StockAnalysisReport } from "@/data/analysis";

interface AnalysisReportProps {
  report: StockAnalysisReport;
}

function SeverityBadge({ severity }: { severity: string }) {
  const t = useTranslations("report");
  const config: Record<string, { bg: string; text: string; labelKey: string }> = {
    critical: { bg: "bg-red-500/20", text: "text-red-600 dark:text-red-400", labelKey: "severityCritical" },
    high: { bg: "bg-orange-500/20", text: "text-orange-600 dark:text-orange-400", labelKey: "severityHigh" },
    medium: { bg: "bg-yellow-500/20", text: "text-yellow-600 dark:text-yellow-400", labelKey: "severityMedium" },
    low: { bg: "bg-green-500/20", text: "text-green-600 dark:text-green-400", labelKey: "severityLow" },
  };
  const c = config[severity] ?? config.medium;
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.bg} ${c.text}`}>
      {t(c.labelKey as "severityCritical" | "severityHigh" | "severityMedium" | "severityLow")}
    </span>
  );
}

function Section({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const t = useTranslations("report");
  return (
    <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-gray-100 dark:hover:bg-zinc-800/50 transition-colors text-left"
      >
        <h3 className="text-base sm:text-lg font-semibold">
          {icon} {title}
        </h3>
        <span className="text-gray-400 dark:text-zinc-500 text-sm">{open ? t("collapse") : t("expand")}</span>
      </button>
      {open && <div className="px-4 sm:px-5 pb-4 sm:pb-5">{children}</div>}
    </div>
  );
}

function PositionBar({
  low,
  high,
  current,
  label,
}: {
  low: number;
  high: number;
  current: number;
  label: string;
}) {
  const pct = ((current - low) / (high - low)) * 100;
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 dark:text-zinc-500 mb-1">
        <span>${low.toFixed(2)}</span>
        <span className="text-gray-600 dark:text-zinc-400 font-medium">{label}</span>
        <span>${high.toFixed(2)}</span>
      </div>
      <div className="relative h-2 bg-gray-200 dark:bg-zinc-800 rounded-full">
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-zinc-900 shadow-lg"
          style={{ left: `${clamped}%`, transform: `translateX(-50%) translateY(-50%)` }}
        />
      </div>
    </div>
  );
}

function MetricBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "blue" | "green" | "purple" | "zinc";
}) {
  const accentColors = {
    blue: "text-blue-600 dark:text-blue-400",
    green: "text-emerald-600 dark:text-emerald-400",
    purple: "text-purple-600 dark:text-purple-400",
    zinc: "text-gray-700 dark:text-zinc-300",
  };
  return (
    <div className="p-3 bg-gray-100 dark:bg-zinc-800/50 rounded-lg text-center">
      <div className="text-xs text-gray-500 dark:text-zinc-500 mb-1">{label}</div>
      <div className={`text-lg font-bold font-mono ${accentColors[accent]}`}>
        {value}
      </div>
    </div>
  );
}

export function AnalysisReport({ report }: AnalysisReportProps) {
  const t = useTranslations("report");

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Report Header */}
      <div className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-lg p-4 sm:p-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t("depthReport")}</div>
            <h2 className="text-xl sm:text-2xl font-bold">
              <Link
                href={`/stock/${report.symbol}`}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {report.symbol}
              </Link>{" "}
              <Link
                href={`/stock/${report.symbol}`}
                className="text-gray-500 dark:text-zinc-400 font-normal text-lg hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {report.companyName}
              </Link>
            </h2>
          </div>
          <div className="text-right text-sm">
            <div className="text-gray-400 dark:text-zinc-500">{t("analysisDate")}</div>
            <div className="text-gray-700 dark:text-zinc-300 font-medium">{report.analysisDate}</div>
          </div>
        </div>
      </div>

      {/* 종합 의견 */}
      <div className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-lg p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-3">
          {t("overallOpinion")}
        </h3>
        {Array.isArray(report.overallOpinion) ? (
          <ul className="space-y-1.5">
            {report.overallOpinion.map((item, i) => (
              <li key={i} className="text-sm sm:text-base text-gray-700 dark:text-zinc-300 leading-relaxed flex items-start gap-2">
                <span className="text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0">•</span>
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm sm:text-base text-gray-700 dark:text-zinc-300 leading-relaxed">
            {report.overallOpinion}
          </p>
        )}
      </div>

      {/* 최종 투자 판단 */}
      {report.investmentVerdict && (
        <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3">
            {t("investmentVerdict")}
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className={`px-4 py-3 rounded-lg text-center sm:text-left flex-shrink-0 ${
              report.investmentVerdict.stance === "strong-buy" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" :
              report.investmentVerdict.stance === "buy" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
              report.investmentVerdict.stance === "hold" ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300" :
              report.investmentVerdict.stance === "sell" ? "bg-red-500/10 text-red-600 dark:text-red-400" :
              "bg-red-500/15 text-red-700 dark:text-red-300"
            }`}>
              <div className="text-xl sm:text-2xl font-bold">
                {t(`verdict${report.investmentVerdict.stance === "strong-buy" ? "StrongBuy" : report.investmentVerdict.stance === "buy" ? "Buy" : report.investmentVerdict.stance === "hold" ? "Hold" : report.investmentVerdict.stance === "sell" ? "Sell" : "StrongSell"}` as "verdictStrongBuy")}
              </div>
              <div className="text-xs mt-1 opacity-75">
                {t("verdictHorizon")}: {report.investmentVerdict.horizon}
              </div>
            </div>
            <div className="flex-1 p-3 bg-gray-100 dark:bg-zinc-800/50 rounded-lg">
              <p className="text-sm sm:text-base text-gray-700 dark:text-zinc-300 leading-relaxed">
                {report.investmentVerdict.summary}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 핵심 숫자 */}
      <Section title={t("keyMetrics")} icon="📊">
        <div className="space-y-2.5">
          {report.keyMetrics.map((metric, i) => (
            <div key={i} className="p-3 bg-gray-100 dark:bg-zinc-800/50 rounded-lg">
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                  {metric.name}
                </span>
                <span className="text-base font-bold font-mono text-blue-600 dark:text-blue-400 whitespace-nowrap shrink-0">
                  {metric.value}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                {metric.interpretation}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* 최근 주요 뉴스 */}
      <Section title={t("recentNews")} icon="📰">
        <div className="space-y-3">
          {report.recentNews.map((news, i) => (
            <div key={i} className="p-3 bg-gray-100 dark:bg-zinc-800/50 rounded-lg">
              <div className="flex items-start justify-between gap-3 mb-1.5">
                {news.url ? (
                  <a
                    href={news.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-800 dark:text-zinc-200 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors group flex items-start gap-1"
                  >
                    {news.headline}
                    <span className="text-gray-400 dark:text-zinc-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 flex-shrink-0 text-xs mt-0.5">
                      ↗
                    </span>
                  </a>
                ) : (
                  <p className="text-sm text-gray-800 dark:text-zinc-200 font-medium">{news.headline}</p>
                )}
                <span className="text-xs text-gray-400 dark:text-zinc-500 whitespace-nowrap flex-shrink-0">
                  {news.date}
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-zinc-500">{news.significance}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 애널리스트 의견 */}
      <Section title={t("analystOpinions")} icon="🎯">
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricBox label={t("avgTarget")} value={`$${report.analystOpinions.consensusTarget}`} accent="blue" />
            <MetricBox label={t("vsCurrentPrice")} value={`+${report.analystOpinions.upsidePercent}%`} accent="green" />
            <MetricBox label={t("highTarget")} value={`$${report.analystOpinions.highTarget}`} accent="purple" />
            <MetricBox label={t("lowTarget")} value={`$${report.analystOpinions.lowTarget}`} accent="zinc" />
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-zinc-400 mb-2">{t("opinionDist")}</div>
            <div className="flex gap-1 h-6 rounded-full overflow-hidden">
              {report.analystOpinions.buyCount > 0 && (
                <div
                  className="bg-emerald-500 flex items-center justify-center text-xs text-white font-medium"
                  style={{ flex: report.analystOpinions.buyCount }}
                >
                  {t("buy")} {report.analystOpinions.buyCount}
                </div>
              )}
              {report.analystOpinions.holdCount > 0 && (
                <div
                  className="bg-yellow-500 flex items-center justify-center text-xs text-zinc-900 font-medium"
                  style={{ flex: report.analystOpinions.holdCount }}
                >
                  {t("hold")} {report.analystOpinions.holdCount}
                </div>
              )}
              {report.analystOpinions.sellCount > 0 && (
                <div
                  className="bg-red-500 flex items-center justify-center text-xs text-white font-medium"
                  style={{ flex: report.analystOpinions.sellCount }}
                >
                  {t("sell")} {report.analystOpinions.sellCount}
                </div>
              )}
            </div>
          </div>
          <div className="p-3 bg-gray-100 dark:bg-zinc-800/50 rounded-lg">
            <div className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t("notableComment")}</div>
            <p className="text-sm text-gray-700 dark:text-zinc-300">{report.analystOpinions.notableComment}</p>
          </div>
        </div>
      </Section>

      {/* 기술적 위치 */}
      <Section title={t("technicalPosition")} icon="📈">
        <div className="space-y-4">
          <PositionBar
            low={report.technicalPosition.week52Low}
            high={report.technicalPosition.week52High}
            current={report.currentPrice}
            label={`${t("current")} $${report.currentPrice} (${report.technicalPosition.currentPositionPercent.toFixed(1)}%)`}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-gray-100 dark:bg-zinc-800/50 rounded-lg text-center">
              <div className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t("sma50")}</div>
              <div className="text-lg font-mono">${report.technicalPosition.sma50}</div>
              <div className={`text-xs mt-1 ${report.technicalPosition.sma50Signal === "above" ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                {report.technicalPosition.sma50Signal === "above" ? t("above") : t("below")}
              </div>
            </div>
            <div className="p-3 bg-gray-100 dark:bg-zinc-800/50 rounded-lg text-center">
              <div className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t("sma200")}</div>
              <div className="text-lg font-mono">${report.technicalPosition.sma200}</div>
              <div className={`text-xs mt-1 ${report.technicalPosition.sma200Signal === "above" ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                {report.technicalPosition.sma200Signal === "above" ? t("above") : t("below")}
              </div>
            </div>
            <div className="p-3 bg-gray-100 dark:bg-zinc-800/50 rounded-lg text-center">
              <div className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t("rsi14")}</div>
              <div className="text-lg font-mono">{report.technicalPosition.rsi}</div>
              <div className={`text-xs mt-1 ${
                report.technicalPosition.rsiSignal === "oversold" ? "text-emerald-500 dark:text-emerald-400"
                  : report.technicalPosition.rsiSignal === "overbought" ? "text-red-500 dark:text-red-400"
                  : "text-gray-400 dark:text-zinc-400"
              }`}>
                {report.technicalPosition.rsiSignal === "oversold" ? t("oversold")
                  : report.technicalPosition.rsiSignal === "overbought" ? t("overbought")
                  : t("neutral")}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 리스크 */}
      <Section title={t("risks")} icon="⚠️">
        <div className="space-y-3">
          {report.risks.map((risk, i) => (
            <div
              key={i}
              className={`p-3 sm:p-4 rounded-lg ${
                risk.severity === "critical"
                  ? "bg-red-500/5"
                  : risk.severity === "high"
                    ? "bg-orange-500/5"
                    : "bg-yellow-500/5"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-zinc-200">{risk.title}</h4>
                <SeverityBadge severity={risk.severity} />
              </div>
              <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">{risk.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 사야 하는 이유 */}
      <Section title={t("buyReasons")} icon="✅">
        <div className="space-y-3">
          {report.buyReasons.map((reason, i) => (
            <div key={i} className="p-3 sm:p-4 bg-emerald-500/5 rounded-lg">
              <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                {i + 1}. {reason.title}
              </h4>
              <p className="text-sm text-gray-500 dark:text-zinc-400">{reason.rationale}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 이 회사는 뭐하는 곳? */}
      <Section title={t("businessSummary")} icon="🏢" defaultOpen={false}>
        <div className="space-y-4">
          <div className="p-3 bg-blue-500/5 rounded-lg">
            <p className="text-sm sm:text-base text-blue-700 dark:text-blue-300 font-medium">
              {report.businessSummary.oneLiner}
            </p>
          </div>
          <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">
            {report.businessSummary.description}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">{t("howTheyMakeMoney")}</h4>
              <ul className="space-y-1.5">
                {report.businessSummary.howTheyMakeMoney.map((item, i) => (
                  <li key={i} className="text-sm text-gray-500 dark:text-zinc-400 flex items-start gap-2">
                    <span className="text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">{t("keyProducts")}</h4>
              <ul className="space-y-1.5">
                {report.businessSummary.keyProducts.map((item, i) => (
                  <li key={i} className="text-sm text-gray-500 dark:text-zinc-400 flex items-start gap-2">
                    <span className="text-purple-500 dark:text-purple-400 mt-0.5 flex-shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* 왜 성장할 수 있는가? */}
      <Section title={t("growthDrivers")} icon="🚀" defaultOpen={false}>
        <div className="space-y-4">
          {report.growthDrivers.map((driver, i) => (
            <div key={i} className="p-3 sm:p-4 bg-gray-100 dark:bg-zinc-800/50 rounded-lg">
              <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5">
                {i + 1}. {driver.title}
              </h4>
              <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">{driver.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 경쟁에서 이기는 이유 */}
      <Section title={t("competitiveAdvantage")} icon="🏰" defaultOpen={false}>
        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-zinc-300 font-medium">
            {report.competitiveAdvantage.summary}
          </p>
          <div className="space-y-3">
            {report.competitiveAdvantage.moats.map((moat, i) => (
              <div key={i} className="p-3 bg-gray-100 dark:bg-zinc-800/50 rounded-lg">
                <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">{moat.type}</div>
                <p className="text-sm text-gray-500 dark:text-zinc-400">{moat.description}</p>
              </div>
            ))}
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">{t("competitors")}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {report.competitiveAdvantage.competitors.map((comp, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 bg-gray-100 dark:bg-zinc-800/30 rounded-lg text-sm"
                >
                  <span className="text-gray-700 dark:text-zinc-300">{comp.name}</span>
                  <span className="text-gray-400 dark:text-zinc-500 text-xs">{comp.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* 출처 */}
      {report.sources && report.sources.length > 0 && (
        <Section title={t("sourcesRef")} icon="📋" defaultOpen={false}>
          <div className="space-y-2">
            {report.sources.map((source, i) => (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-2.5 bg-gray-100 dark:bg-zinc-800/30 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800/60 transition-colors group"
              >
                <span className="text-xs text-gray-400 dark:text-zinc-600 font-mono mt-0.5 flex-shrink-0">
                  [{i + 1}]
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-blue-600 dark:text-blue-400 group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors truncate">
                    {source.name}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{source.description}</div>
                </div>
                <span className="text-gray-400 dark:text-zinc-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors flex-shrink-0 text-xs mt-0.5">
                  ↗
                </span>
              </a>
            ))}
          </div>
        </Section>
      )}

      {/* 면책 조항 */}
      <div className="text-xs text-gray-400 dark:text-zinc-600 text-center px-4 py-3">
        {t("disclaimer")}
      </div>
    </div>
  );
}
