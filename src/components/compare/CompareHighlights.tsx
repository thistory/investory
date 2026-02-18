"use client";

interface ScoreData {
  totalScore: number;
  grade: string;
  scores: {
    quality: number;
    moat: number;
    value: number;
    growth: number;
    momentum: number;
  };
}

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
  if (!leftScore || !rightScore) {
    return null;
  }

  const winner =
    leftScore.totalScore > rightScore.totalScore ? "left" : "right";
  const diff = Math.abs(leftScore.totalScore - rightScore.totalScore);
  const winnerSymbol = winner === "left" ? leftSymbol : rightSymbol;
  const loserSymbol = winner === "left" ? rightSymbol : leftSymbol;

  const comparisons = [
    {
      label: "품질 (Quality)",
      left: leftScore.scores.quality,
      right: rightScore.scores.quality,
    },
    {
      label: "경쟁우위 (Moat)",
      left: leftScore.scores.moat,
      right: rightScore.scores.moat,
    },
    {
      label: "가치 (Value)",
      left: leftScore.scores.value,
      right: rightScore.scores.value,
    },
    {
      label: "성장성 (Growth)",
      left: leftScore.scores.growth,
      right: rightScore.scores.growth,
    },
    {
      label: "모멘텀 (Momentum)",
      left: leftScore.scores.momentum,
      right: rightScore.scores.momentum,
    },
  ];

  return (
    <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-4 sm:p-6 mb-4">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-zinc-100 mb-4">
        비교 요약
      </h2>

      {/* Overall Winner */}
      <div className="mb-6 p-4 bg-gray-100 dark:bg-zinc-800 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500 dark:text-zinc-400 mb-1">전체 우승자</div>
            <div className="text-xl sm:text-2xl font-bold text-green-400">
              {winnerSymbol}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-zinc-400 mb-1">점수 차이</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-zinc-100">
              +{diff.toFixed(0)}점
            </div>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
          {winnerSymbol}이(가) {loserSymbol}보다 {diff.toFixed(0)}점 높습니다
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
              className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-100 dark:bg-zinc-800/50 rounded-lg"
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
