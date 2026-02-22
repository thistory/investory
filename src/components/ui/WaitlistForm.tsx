"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface WaitlistFormProps {
  source: string;
  locale: string;
}

export default function WaitlistForm({ source, locale }: WaitlistFormProps) {
  const t = useTranslations("waitlist");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "already" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source, locale }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus(data.message === "already_registered" ? "already" : "success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center py-4">
        <div className="text-2xl mb-2">🎉</div>
        <p className="text-emerald-600 dark:text-emerald-400 font-semibold">{t("successTitle")}</p>
        <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">{t("successDescription")}</p>
      </div>
    );
  }

  if (status === "already") {
    return (
      <div className="text-center py-4">
        <div className="text-2xl mb-2">✅</div>
        <p className="text-blue-600 dark:text-blue-400 font-semibold">{t("alreadyTitle")}</p>
        <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">{t("alreadyDescription")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-md mx-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("emailPlaceholder")}
        required
        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "loading" ? t("submitting") : t("joinWaitlist")}
      </button>
      {status === "error" && (
        <p className="text-red-500 dark:text-red-400 text-sm">{t("errorMessage")}</p>
      )}
    </form>
  );
}
