"use client";

import { useTranslations } from "next-intl";
import type { ScoreData, StockScoreData } from "@/lib/hooks/useScore";
import { isCryptoScore } from "@/lib/hooks/useScore";

interface CompareHighlightsProps {
  leftSymbol: string;
  rightSymbol: string;
  leftScore?: ScoreData;
  rightScore?: ScoreData;
}

export function CompareHighlights({
  leftSymbol,
  rightSymbol,
  leftScore,
  rightScore,
}: CompareHighlightsProps) {
  const t = useTranslations("compareHighlights");

  if (!leftScore || !rightScore) {
    return null;
  }

  // Crypto scores use a different axis system, so fundamental side-by-side
  // comparison (quality/moat/value/growth/momentum) does not apply.
  if (isCryptoScore(leftScore) || isCryptoScore(rightScore)) {
    return null;
  }
  const leftStock: StockScoreData = leftScore;
  const rightStock: StockScoreData = rightScore;

  const winner =
    leftStock.totalScore > rightStock.totalScore ? "left" : "right";
  const diff = Math.abs(leftStock.totalScore - rightStock.totalScore);
  const winnerSymbol = winner === "left" ? leftSymbol : rightSymbol;
  const loserSymbol = winner === "left" ? rightSymbol : leftSymbol;

  const comparisons = [
    {
      label: t("quality"),
      left: leftStock.scores.quality,
      right: rightStock.scores.quality,
    },
    {
      label: t("moat"),
      left: leftStock.scores.moat,
      right: rightStock.scores.moat,
    },
    {
      label: t("value"),
      left: leftStock.scores.value,
      right: rightStock.scores.value,
    },
    {
      label: t("growth"),
      left: leftStock.scores.growth,
      right: rightStock.scores.growth,
    },
    {
      label: t("momentum"),
      left: leftStock.scores.momentum,
      right: rightStock.scores.momentum,
    },
  ];

  return (
    <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-4 sm:p-6 mb-4">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-zinc-100 mb-4">
        {t("compareSummary")}
      </h2>

      {/* Overall Winner */}
      <div className="mb-6 p-4 bg-gray-100 dark:bg-zinc-800 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500 dark:text-zinc-400 mb-1">{t("overallWinner")}</div>
            <div className="text-xl sm:text-2xl font-bold text-green-400">
              {winnerSymbol}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-zinc-400 mb-1">{t("scoreDifference")}</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-zinc-100">
              +{diff.toFixed(0)}{t("pointsSuffix")}
            </div>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
          {t("higherBy", { winner: winnerSymbol, loser: loserSymbol, diff: diff.toFixed(0) })}
        </div>
      </div>

      {/* Category Comparisons */}
      <div className="space-y-3">
        {comparisons.map((comparison, index) => {
          const leftWins = comparison.left > comparison.right;
          const tie = comparison.left === comparison.right;

          return (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-100 dark:bg-zinc-800/50 rounded-lg"
            >
              <div className="flex-1">
                <div className="text-sm text-gray-700 dark:text-zinc-300 mb-1">
                  {comparison.label}
                </div>
                <div className="flex items-center gap-4">
                  <div
                    className={`text-lg font-semibold ${
                      leftWins && !tie
                        ? "text-green-400"
                        : tie
                        ? "text-gray-500 dark:text-zinc-400"
                        : "text-gray-400 dark:text-zinc-500"
                    }`}
                  >
                    {leftSymbol}: {comparison.left.toFixed(0)}
                  </div>
                  <div className="text-gray-400 dark:text-zinc-600">vs</div>
                  <div
                    className={`text-lg font-semibold ${
                      !leftWins && !tie
                        ? "text-green-400"
                        : tie
                        ? "text-gray-500 dark:text-zinc-400"
                        : "text-gray-400 dark:text-zinc-500"
                    }`}
                  >
                    {rightSymbol}: {comparison.right.toFixed(0)}
                  </div>
                </div>
              </div>
              {!tie && (
                <div className="ml-4">
                  <span
                    className={`text-2xl ${
                      leftWins ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {leftWins ? "←" : "→"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
