"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

interface ShareButtonsProps {
  symbol: string;
  date: string;
  title: string;
  description: string;
  snsXText?: string;
  snsThreadsText?: string;
  snsTelegramText?: string;
}

type SharePlatform = "x" | "telegram" | "threads";

interface ShareConfig {
  platform: SharePlatform;
  name: string;
  icon: string;
  originalText: string;
}

const PLATFORM_META: Record<SharePlatform, { name: string; icon: string }> = {
  x: { name: "X", icon: "\uD835\uDD4F" },
  telegram: { name: "Telegram", icon: "\u2708\uFE0F" },
  threads: { name: "Threads", icon: "\uD83E\uDDF5" },
};

function buildShareUrl(platform: SharePlatform, text: string, pageUrl: string): string {
  switch (platform) {
    case "x":
      return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(pageUrl)}`;
    case "telegram":
      return `https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(text)}`;
    case "threads":
      return `https://www.threads.net/intent/post?text=${encodeURIComponent(text + "\n" + pageUrl)}`;
  }
}

export function ShareButtons({
  symbol,
  date,
  title,
  description,
  snsXText,
  snsThreadsText,
  snsTelegramText,
}: ShareButtonsProps) {
  const t = useTranslations("share");
  const [copied, setCopied] = useState(false);
  const [active, setActive] = useState<ShareConfig | null>(null);
  const [editedText, setEditedText] = useState("");

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_BASE_URL || "";
  const pageUrl = `${baseUrl}/stock/${symbol}/analysis/${date}`;
  const fallback = `${title}\n${description}`;

  const platforms: { platform: SharePlatform; text: string }[] = [
    { platform: "x", text: snsXText || snsThreadsText || fallback },
    { platform: "telegram", text: snsTelegramText || fallback },
    { platform: "threads", text: snsThreadsText || fallback },
  ];

  function openPreview(platform: SharePlatform, originalText: string) {
    const meta = PLATFORM_META[platform];
    setActive({ platform, name: meta.name, icon: meta.icon, originalText });
    setEditedText(originalText);
  }

  function resetText() {
    if (active) setEditedText(active.originalText);
  }

  // ESC key to close
  const close = useCallback(() => setActive(null), []);
  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active, close]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl);
    } catch {
      const input = document.createElement("input");
      input.value = pageUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const shareHref = active
    ? buildShareUrl(active.platform, editedText, pageUrl)
    : "";
  const isEdited = active ? editedText !== active.originalText : false;

  return (
    <>
      <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-4">
        <div className="text-sm text-gray-500 dark:text-zinc-400 mb-3">
          {t("shareTitle")}
        </div>
        <div className="flex flex-wrap gap-2">
          {platforms.map(({ platform, text }) => {
            const meta = PLATFORM_META[platform];
            return (
              <button
                key={platform}
                onClick={() => openPreview(platform, text)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg text-sm text-gray-700 dark:text-zinc-300 transition-colors"
              >
                <span>{meta.icon}</span>
                <span>{meta.name}</span>
              </button>
            );
          })}
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg text-sm text-gray-700 dark:text-zinc-300 transition-colors"
          >
            <span>{copied ? "\u2713" : "\uD83D\uDD17"}</span>
            <span>{copied ? t("copied") : t("copyLink")}</span>
          </button>
        </div>
      </div>

      {/* Share preview modal */}
      {active && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="bg-white dark:bg-zinc-900 w-full sm:max-w-lg sm:rounded-xl rounded-t-2xl shadow-2xl max-h-[85vh] sm:max-h-[80vh] flex flex-col animate-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle — mobile only */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-zinc-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-2 sm:pt-4 pb-3 border-b border-gray-200 dark:border-zinc-800">
              <h3 className="text-base font-semibold">
                {t("shareWith", { platform: `${active.icon} ${active.name}` })}
              </h3>
              <button
                onClick={close}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
                aria-label={t("close")}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>

            {/* Editable content */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 dark:text-zinc-500">
                  {t("editableContent")}
                </span>
                {isEdited && (
                  <button
                    onClick={resetText}
                    className="text-xs text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {t("restoreOriginal")}
                  </button>
                )}
              </div>

              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-800 rounded-lg p-3 text-sm text-gray-700 dark:text-zinc-300 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 border border-gray-200 dark:border-zinc-700"
                rows={Math.min(10, Math.max(4, editedText.split("\n").length + 1))}
              />

              <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 dark:text-zinc-500">
                <span className="font-medium shrink-0">{t("linkLabel")}</span>
                <span className="truncate">{pageUrl}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 px-4 py-4 border-t border-gray-200 dark:border-zinc-800 safe-bottom">
              <button
                onClick={close}
                className="flex-1 px-4 py-3 sm:py-2.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl sm:rounded-lg text-sm font-medium text-gray-600 dark:text-zinc-400 transition-colors"
              >
                {t("cancel")}
              </button>
              <a
                href={shareHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
                className="flex-1 px-4 py-3 sm:py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl sm:rounded-lg text-sm font-medium text-white text-center transition-colors"
              >
                {t("shareButton")}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
