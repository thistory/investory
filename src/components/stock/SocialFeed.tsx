"use client";

import { useSocial, SentimentTrend, RecentNewsItem } from "@/lib/hooks/useSocial";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useTranslations } from "next-intl";

interface SocialFeedProps {
  symbol: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function timeAgo(dateStr: string, t: (key: string, values?: Record<string, string | number>) => string): string {
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now.getTime() - past.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffHours < 1) return t("justNow");
  if (diffHours < 24) return t("hoursAgo", { count: diffHours });
  if (diffDays < 7) return t("daysAgo", { count: diffDays });
  return formatDate(dateStr);
}

function SentimentMiniChart({ trend }: { trend: SentimentTrend[] }) {
  const t = useTranslations("social");
  if (!trend || trend.length === 0) return null;

  const maxMentions = Math.max(...trend.map((item) => item.mentions), 1);

  return (
    <div className="flex items-end gap-1 h-16">
      {trend.map((item, i) => {
        const height = (item.mentions / maxMentions) * 100;
        const isPositive = item.score > 0;
        const isNeutral = Math.abs(item.score) < 0.05;

        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1"
            title={t("mentionsTooltip", { date: formatDate(item.date), count: item.mentions, score: item.score.toFixed(2) })}
          >
            <div
              className={`w-full rounded-t transition-all ${
                isNeutral
                  ? "bg-zinc-600"
                  : isPositive
                    ? "bg-emerald-500"
                    : "bg-red-500"
              }`}
              style={{ height: `${Math.max(height, 4)}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

function ScoreGauge({ score }: { score: number }) {
  // Score range: -1 to 1, map to 0-100 for display
  const percentage = ((score + 1) / 2) * 100;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  return (
    <div className="relative h-3 bg-gradient-to-r from-red-500 via-zinc-600 to-emerald-500 rounded-full overflow-hidden">
      <div
        className="absolute top-0 w-1 h-full bg-white shadow-lg transition-all duration-500"
        style={{ left: `${clampedPercentage}%`, transform: "translateX(-50%)" }}
      />
    </div>
  );
}

function SentimentBadge({
  sentiment,
}: {
  sentiment: "bullish" | "bearish" | "neutral";
}) {
  const t = useTranslations("social");
  const config = {
    bullish: {
      bg: "bg-emerald-500/20",
      text: "text-emerald-400",
      label: t("positive"),
    },
    bearish: {
      bg: "bg-red-500/20",
      text: "text-red-400",
      label: t("negative"),
    },
    neutral: {
      bg: "bg-zinc-500/20",
      text: "text-gray-500 dark:text-zinc-400",
      label: t("neutral"),
    },
  };

  const { bg, text, label } = config[sentiment];

  return (
    <span className={`px-1.5 py-0.5 rounded text-xs ${bg} ${text}`}>
      {label}
    </span>
  );
}

function NewsItem({ news }: { news: RecentNewsItem }) {
  const t = useTranslations("social");
  return (
    <a
      href={news.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 bg-gray-100 dark:bg-zinc-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors group cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-gray-800 dark:text-zinc-200 leading-snug flex-1 group-hover:text-white transition-colors">
          {news.headline}
        </p>
        <SentimentBadge sentiment={news.sentiment} />
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 dark:text-zinc-500">
        <span>{news.source}</span>
        <span>•</span>
        <span>{timeAgo(news.datetime, t)}</span>
        <span className="ml-auto text-gray-400 dark:text-zinc-600 group-hover:text-gray-500 dark:text-zinc-400 transition-colors">
          ↗
        </span>
      </div>
    </a>
  );
}

export function SocialFeed({ symbol }: SocialFeedProps) {
  const t = useTranslations("social");
  const { data, isLoading, error } = useSocial(symbol);

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-zinc-900 rounded-lg">
        <p className="text-gray-400 dark:text-zinc-500">{t("errorLoading")}</p>
      </div>
    );
  }

  const { sentiment, trend, recentNews, dataSource } = data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{t("newsSentiment")}</h2>
        <span className="text-xs text-gray-400 dark:text-zinc-500">{dataSource || "Finnhub"}</span>
      </div>

      {/* Sentiment Summary */}
      <div className="p-3 sm:p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">{t("newsMood")}</span>
          <span
            className={`text-sm font-medium ${
              sentiment.overallSentiment === "bullish"
                ? "text-emerald-400"
                : sentiment.overallSentiment === "bearish"
                  ? "text-red-400"
                  : "text-gray-500 dark:text-zinc-400"
            }`}
          >
            {sentiment.overallSentiment === "bullish"
              ? t("bullishEmoji")
              : sentiment.overallSentiment === "bearish"
                ? t("bearishEmoji")
                : t("neutral")}
          </span>
        </div>

        {/* Sentiment Bar */}
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 transition-all duration-500"
            style={{ width: `${sentiment.bullishPercent}%` }}
          />
          <div
            className="bg-red-500 transition-all duration-500"
            style={{ width: `${sentiment.bearishPercent}%` }}
          />
        </div>

        <div className="flex justify-between mt-2 text-xs">
          <span className="text-emerald-400">
            {t("positiveCount", { count: sentiment.bullish, percent: sentiment.bullishPercent.toFixed(0) })}
          </span>
          <span className="text-gray-400 dark:text-zinc-500">{t("recentNewsCount", { count: sentiment.total })}</span>
          <span className="text-red-400">
            {t("negativeCount", { count: sentiment.bearish, percent: sentiment.bearishPercent.toFixed(0) })}
          </span>
        </div>
      </div>

      {/* Score Gauge */}
      <div className="p-3 sm:p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">{t("avgSentimentScore")}</span>
          <span
            className={`text-sm font-mono font-medium ${
              sentiment.avgScore > 0.05
                ? "text-emerald-400"
                : sentiment.avgScore < -0.05
                  ? "text-red-400"
                  : "text-gray-500 dark:text-zinc-400"
            }`}
          >
            {sentiment.avgScore > 0 ? "+" : ""}
            {sentiment.avgScore.toFixed(3)}
          </span>
        </div>
        <ScoreGauge score={sentiment.avgScore} />
        <div className="flex justify-between mt-1 text-xs text-gray-400 dark:text-zinc-600">
          <span>{t("bearish")}</span>
          <span>{t("neutral")}</span>
          <span>{t("bullish")}</span>
        </div>
      </div>

      {/* Trend Chart */}
      {trend && trend.length > 0 && (
        <div className="p-3 sm:p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">{t("dailyNewsTrend")}</span>
            <span className="text-xs text-gray-400 dark:text-zinc-600">{t("recentDays", { count: trend.length })}</span>
          </div>
          <SentimentMiniChart trend={trend} />
          <div className="flex justify-between mt-2 text-xs text-gray-400 dark:text-zinc-600">
            <span>{trend.length > 0 ? formatDate(trend[0].date) : ""}</span>
            <span>
              {trend.length > 0 ? formatDate(trend[trend.length - 1].date) : ""}
            </span>
          </div>
        </div>
      )}

      {/* Recent News */}
      {recentNews && recentNews.length > 0 && (
        <div className="p-3 sm:p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">{t("recentNews")}</span>
            <span className="text-xs text-gray-400 dark:text-zinc-600">{t("newsCount", { count: recentNews.length })}</span>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
            {recentNews.map((news, i) => (
              <NewsItem key={i} news={news} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
