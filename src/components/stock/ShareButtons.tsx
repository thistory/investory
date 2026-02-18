"use client";

import { useState } from "react";

interface ShareButtonsProps {
  symbol: string;
  date: string;
  title: string;
  description: string;
}

export function ShareButtons({
  symbol,
  date,
  title,
  description,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_BASE_URL || "";
  const url = `${baseUrl}/stock/${symbol}/analysis/${date}`;
  const text = `${title}\n${description}`;

  const shareLinks = [
    {
      name: "X",
      icon: "𝕏",
      href: `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      bg: "hover:bg-zinc-700",
    },
    {
      name: "Telegram",
      icon: "✈",
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      bg: "hover:bg-blue-800",
    },
    {
      name: "카카오톡",
      icon: "💬",
      href: `https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent(url)}`,
      bg: "hover:bg-yellow-700",
    },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-4">
      <div className="text-sm text-gray-500 dark:text-zinc-400 mb-3">공유하기</div>
      <div className="flex flex-wrap gap-2">
        {shareLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-zinc-800 ${link.bg} rounded-lg text-sm text-gray-700 dark:text-zinc-300 transition-colors`}
          >
            <span>{link.icon}</span>
            <span>{link.name}</span>
          </a>
        ))}
        <button
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg text-sm text-gray-700 dark:text-zinc-300 transition-colors"
        >
          <span>{copied ? "✓" : "🔗"}</span>
          <span>{copied ? "복사됨" : "링크 복사"}</span>
        </button>
      </div>
    </div>
  );
}
