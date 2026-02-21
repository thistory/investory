"use client";

import { useScore } from "@/lib/hooks/useScore";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTranslations } from "next-intl";

interface InvestmentScoreCardProps {
  symbol: string;
}

export function InvestmentScoreCard({ symbol }: InvestmentScoreCardProps) {
  const t = useTranslations("score");
  const { data: score, isLoading, error } = useScore(symbol);

  if (isLoading) {
    return <InvestmentScoreCardSkeleton />;
  }

  if (error || !score) {
    return (
      <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-4 sm:p-6">
        <div className="text-gray-500 dark:text-zinc-400 text-sm">
          {t("errorLoading")}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-4 sm:p-6">
      {/* Header: Total Score & Grade */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-zinc-100 mb-1">
            {t("title")}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">
            {t("subtitle")}
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-zinc-100">
              {score.totalScore.toFixed(0)}
            </span>
            <span className="text-lg sm:text-xl text-gray-500 dark:text-zinc-400">/100</span>
          </div>
          <div className="mt-1">
            <GradeBadge grade={score.grade} />
          </div>
        </div>
      </div>

      {/* Score Progress Bar */}
      <div className="mb-6">
        <div className="h-3 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${getScoreColor(
              score.totalScore
            )}`}
            style={{ width: `${score.totalScore}%` }}
          />
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-3 mb-6">
        <ScoreBar
          label="Quality"
          sublabel={t("quality")}
          score={score.scores.quality}
          maxScore={100}
        />
        <ScoreBar
          label="Moat"
          sublabel={t("moat")}
          score={score.scores.moat}
          maxScore={100}
        />
        <ScoreBar
          label="Value"
          sublabel={t("value")}
          score={score.scores.value}
          maxScore={100}
        />
        <ScoreBar
          label="Growth"
          sublabel={t("growth")}
          score={score.scores.growth}
          maxScore={100}
        />
        <ScoreBar
          label="Momentum"
          sublabel={t("momentum")}
          score={score.scores.momentum}
          maxScore={100}
        />
      </div>

      {/* Key Insights */}
      {score.insights && score.insights.length > 0 && (
        <div className="border-t border-gray-200 dark:border-zinc-800 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-3">
            {t("keyInsights")}
          </h3>
          <div className="space-y-2">
            {score.insights.slice(0, 5).map((insight, index) => (
              <InsightItem key={index} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* Timestamp */}
      <div className="mt-4 text-xs text-gray-400 dark:text-zinc-500">
        {t("calculatedAt")}: {new Date(score.calculatedAt).toLocaleString()}
      </div>
    </div>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const t = useTranslations("score");
  const getGradeColor = (grade: string) => {
    if (grade === "A+" || grade === "A") return "bg-green-500/20 text-green-400";
    if (grade === "B") return "bg-blue-500/20 text-blue-400";
    if (grade === "C") return "bg-yellow-500/20 text-yellow-400";
    if (grade === "D") return "bg-orange-500/20 text-orange-400";
    return "bg-red-500/20 text-red-400";
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(
        grade
      )}`}
    >
      {t("grade")} {grade}
    </span>
  );
}

function ScoreBar({
  label,
  sublabel,
  score,
  maxScore,
}: {
  label: string;
  sublabel: string;
  score: number;
  maxScore: number;
}) {
  const percentage = (score / maxScore) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">{label}</span>
          <span className="text-xs text-gray-400 dark:text-zinc-500">{sublabel}</span>
        </div>
        <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
          {score.toFixed(0)}
        </span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${getScoreColor(
            score
          )}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function InsightItem({
  insight,
}: {
  insight: { type: string; message: string; score?: number };
}) {
  const getIcon = (type: string) => {
    if (type === "positive") return "✓";
    if (type === "warning") return "⚠";
    return "✗";
  };

  const getColor = (type: string) => {
    if (type === "positive") return "text-green-400";
    if (type === "warning") return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="flex items-start gap-2 text-sm">
      <span className={`${getColor(insight.type)} font-bold flex-shrink-0`}>
        {getIcon(insight.type)}
      </span>
      <span className="text-gray-700 dark:text-zinc-300">{insight.message}</span>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 70) return "bg-blue-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 50) return "bg-orange-500";
  return "bg-red-500";
}

function InvestmentScoreCardSkeleton() {
  return (
    <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-6 w-24 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="text-right">
          <Skeleton className="h-10 w-20 mb-2" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      <Skeleton className="h-3 w-full mb-6" />

      <div className="space-y-3 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i}>
            <Skeleton className="h-4 w-32 mb-1.5" />
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 dark:border-zinc-800 pt-4">
        <Skeleton className="h-5 w-28 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
