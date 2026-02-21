"use client";

import { useTranslations } from "next-intl";

export default function StockError({ reset }: { reset: () => void }) {
  const t = useTranslations("error");

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-300 dark:text-zinc-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>
        <p className="text-lg font-semibold text-gray-700 dark:text-zinc-300 mb-1">
          {t("cannotLoad")}
        </p>
        <p className="text-sm text-gray-400 dark:text-zinc-500 mb-6">
          {t("tryAgainLater")}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            {t("retry")}
          </button>
          <a
            href="/"
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            {t("goHome")}
          </a>
        </div>
      </div>
    </div>
  );
}
