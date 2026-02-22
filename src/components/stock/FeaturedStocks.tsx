"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import WaitlistForm from "@/components/ui/WaitlistForm";

interface Stock {
  symbol: string;
  name: string;
  tag: string;
  logo: string;
}

interface FeaturedStocksProps {
  stocks: Stock[];
  isAdmin: boolean;
  locale: string;
}

function StockCard({ stock }: { stock: Stock }) {
  return (
    <div className="relative p-5 rounded-xl bg-gray-50 dark:bg-zinc-900 hover:bg-white dark:hover:bg-zinc-800 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/30">
      <div className="flex items-center justify-between mb-4">
        <img
          src={stock.logo}
          alt={stock.name}
          className="w-9 h-9 rounded-full object-cover bg-white"
        />
        <span className="text-xs text-gray-400 dark:text-zinc-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
          →
        </span>
      </div>
      <div className="text-lg font-bold mb-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {stock.symbol}
      </div>
      <div className="text-xs text-gray-400 dark:text-zinc-500 mb-2">
        {stock.name}
      </div>
      <div className="inline-block text-[10px] font-medium tracking-wide text-gray-400 dark:text-zinc-600 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
        {stock.tag}
      </div>
    </div>
  );
}

export default function FeaturedStocks({ stocks, isAdmin, locale }: FeaturedStocksProps) {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const t = useTranslations("lockScreen");
  const tw = useTranslations("waitlist");

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stocks.map((stock) =>
          isAdmin ? (
            <Link key={stock.symbol} href={`/stock/${stock.symbol}`} className="group">
              <StockCard stock={stock} />
            </Link>
          ) : (
            <button
              key={stock.symbol}
              onClick={() => setSelectedStock(stock)}
              className="group text-left w-full"
            >
              <StockCard stock={stock} />
            </button>
          )
        )}
      </div>

      {/* Waitlist Modal */}
      {selectedStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedStock(null)}
          />
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-center">
            {/* Close */}
            <button
              onClick={() => setSelectedStock(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Stock info */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <img
                src={selectedStock.logo}
                alt={selectedStock.name}
                className="w-10 h-10 rounded-full object-cover bg-white"
              />
              <div className="text-left">
                <div className="text-lg font-bold text-white">{selectedStock.symbol}</div>
                <div className="text-xs text-zinc-500">{selectedStock.name}</div>
              </div>
            </div>

            {/* Lock icon */}
            <div className="relative mx-auto w-14 h-14 mb-4">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-14 h-14 rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">
              {t("stockDetail.title")}
            </h3>
            <p className="text-sm text-zinc-400 mb-6">
              {t("stockDetail.description")}
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 gap-2 mb-6 text-left">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                  <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t(`stockDetail.features.${i}`)}
                </div>
              ))}
            </div>

            {/* Waitlist */}
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-5 mb-4">
              <p className="text-sm font-medium text-white mb-1">{t("waitlistHeading")}</p>
              <p className="text-xs text-zinc-500 mb-4">{t("waitlistSubheading")}</p>
              <WaitlistForm source={`stock-${selectedStock.symbol}`} locale={locale} />
            </div>

            {/* Login CTA */}
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-zinc-500">{t("ctaText")}</span>
              <Link
                href="/login"
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                {t("loginText")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
