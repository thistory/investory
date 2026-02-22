"use client";

import { Link } from "@/i18n/navigation";
import { useQuote } from "@/lib/hooks/useQuote";
import { useTranslations } from "next-intl";

interface Stock {
  symbol: string;
  name: string;
  tag: string;
  logo: string;
}

function StockCard({ stock }: { stock: Stock }) {
  const { data: quote, isLoading } = useQuote(stock.symbol);
  const t = useTranslations("stocks");

  return (
    <Link href={`/stock/${stock.symbol}`} className="group">
      <div className="relative p-5 rounded-xl bg-gray-50 dark:bg-zinc-900 hover:bg-white dark:hover:bg-zinc-800 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/30">
        <div className="flex items-center justify-between mb-4">
          <img
            src={stock.logo}
            alt={stock.name}
            className="w-9 h-9 rounded-full object-cover bg-white"
          />
          {quote ? (
            <span
              className={`text-sm font-semibold ${
                quote.changePercent >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {quote.changePercent >= 0 ? "+" : ""}
              {quote.changePercent.toFixed(2)}%
            </span>
          ) : isLoading ? (
            <span className="w-14 h-4 rounded bg-gray-200 dark:bg-zinc-800 animate-pulse" />
          ) : (
            <span className="text-xs text-gray-400 dark:text-zinc-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
              &rarr;
            </span>
          )}
        </div>
        <div className="text-lg font-bold mb-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {stock.symbol}
        </div>
        <div className="text-xs text-gray-400 dark:text-zinc-500 mb-2">
          {stock.name}
        </div>
        {quote ? (
          <div className="text-sm font-semibold mb-2">
            ${quote.price.toFixed(2)}
            <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-zinc-500">
              {quote.change >= 0 ? "+" : ""}
              {quote.change.toFixed(2)}
            </span>
          </div>
        ) : isLoading ? (
          <div className="w-20 h-5 rounded bg-gray-200 dark:bg-zinc-800 animate-pulse mb-2" />
        ) : null}
        <div className="inline-block text-[10px] font-medium tracking-wide text-gray-400 dark:text-zinc-600 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
          {stock.tag}
        </div>
      </div>
    </Link>
  );
}

interface StocksGridProps {
  stocks: Stock[];
}

export function StocksGrid({ stocks }: StocksGridProps) {
  const t = useTranslations("stocks");

  if (stocks.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 dark:text-zinc-500">
        <p className="text-sm">{t("noStocks")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {stocks.map((stock) => (
        <StockCard key={stock.symbol} stock={stock} />
      ))}
    </div>
  );
}
