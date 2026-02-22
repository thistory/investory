"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface AddStockCardProps {
  isLoggedIn?: boolean;
}

export default function AddStockCard({ isLoggedIn }: AddStockCardProps) {
  const [open, setOpen] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const t = useTranslations("stock");

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  function handleOpen() {
    setOpen(true);
    setSymbol("");
    setError("");
  }

  function handleClose() {
    setOpen(false);
    setSymbol("");
    setError("");
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = symbol.trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/stocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: trimmed }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || t("addFailed"));
        setLoading(false);
        return;
      }

      handleClose();
      router.refresh();
    } catch {
      setError(t("networkError"));
      setLoading(false);
    }
  }

  if (!isLoggedIn) {
    return (
      <Link
        href="/login"
        className="group relative p-5 rounded-xl border-2 border-dashed border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/30 flex flex-col items-center justify-center min-h-[140px] cursor-pointer"
      >
        <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
          <svg className="w-5 h-5 text-gray-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
        <span className="text-sm font-medium text-gray-300 dark:text-zinc-600">
          {t("loginToAdd")}
        </span>
      </Link>
    );
  }

  return (
    <>
      {/* + Card */}
      <button
        onClick={handleOpen}
        className="group relative p-5 rounded-xl border-2 border-dashed border-gray-200 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/30 flex flex-col items-center justify-center min-h-[140px] cursor-pointer"
      >
        <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-zinc-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 flex items-center justify-center mb-3 transition-colors">
          <svg className="w-5 h-5 text-gray-400 dark:text-zinc-500 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span className="text-sm font-medium text-gray-400 dark:text-zinc-500 group-hover:text-blue-500 transition-colors">
          {t("addStock")}
        </span>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Dialog */}
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-bold mb-1">{t("addStockTitle")}</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-5">
              {t("addStockDesc")}
            </p>

            <form onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="text"
                value={symbol}
                onChange={(e) => {
                  setSymbol(e.target.value.toUpperCase());
                  setError("");
                }}
                placeholder="AAPL"
                maxLength={10}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm font-mono font-bold tracking-wider placeholder:text-gray-300 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={loading}
              />

              {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                  disabled={loading}
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={loading || !symbol.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {t("checking")}
                    </span>
                  ) : (
                    t("add")
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
