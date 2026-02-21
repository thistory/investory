"use client";

import { useQuote } from "@/lib/hooks/useQuote";
import { useProfile } from "@/lib/hooks/useProfile";
import { ChangeIndicator } from "@/components/ui/ChangeIndicator";
import { HeaderSkeleton } from "@/components/ui/Skeleton";
import { useState } from "react";

interface StockHeaderProps {
  symbol: string;
}

/** Premium single-candle OHLC visualization with current price */
function PriceCandle({
  open,
  high,
  low,
  close,
  previousClose,
}: {
  open: number;
  high: number;
  low: number;
  close: number;
  previousClose: number;
}) {
  const allPrices = [open, high, low, close, previousClose];
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const range = maxPrice - minPrice;

  if (range === 0) return null;

  // SVG layout
  const W = 280;
  const H = 150;
  const pad = { top: 16, bottom: 16, left: 8, right: 8 };
  const chartH = H - pad.top - pad.bottom;
  const candleX = W * 0.42;
  const candleW = 28;

  const toY = (p: number) => pad.top + ((maxPrice - p) / range) * chartH;

  const isBull = close >= open;
  const bodyHi = toY(Math.max(open, close));
  const bodyLo = toY(Math.min(open, close));
  const bodyH = Math.max(bodyLo - bodyHi, 3);
  const wickTop = toY(high);
  const wickBot = toY(low);
  const prevY = toY(previousClose);
  const closeY = toY(close);

  const bull = "#10b981";
  const bear = "#ef4444";
  const color = isBull ? bull : bear;
  const gradId = isBull ? "gradBull" : "gradBear";

  // Build labels: left = Open, PrevClose; right = High, Low, Close(current)
  type Label = {
    price: number;
    origY: number;
    y: number;
    text: string;
    side: "left" | "right";
    color: string;
    bold?: boolean;
    dot?: boolean;
  };

  const labels: Label[] = [
    { price: high, origY: toY(high), y: toY(high), text: "고가", side: "right", color: "#ef4444", dot: true },
    { price: low, origY: toY(low), y: toY(low), text: "저가", side: "right", color: "#3b82f6", dot: true },
    { price: close, origY: closeY, y: closeY, text: "현재", side: "right", color: color, bold: true, dot: true },
    { price: open, origY: toY(open), y: toY(open), text: "시가", side: "left", color: "#9ca3af", dot: true },
    { price: previousClose, origY: prevY, y: prevY, text: "전일종가", side: "left", color: "#f59e0b", dot: true },
  ];

  // Separate and de-overlap each side independently
  const deOverlap = (items: Label[], gap: number) => {
    items.sort((a, b) => a.origY - b.origY);
    for (let i = 1; i < items.length; i++) {
      if (items[i].y - items[i - 1].y < gap) {
        items[i].y = items[i - 1].y + gap;
      }
    }
  };

  const leftLabels = labels.filter((l) => l.side === "left");
  const rightLabels = labels.filter((l) => l.side === "right");
  deOverlap(leftLabels, 18);
  deOverlap(rightLabels, 18);

  const allLabels = [...leftLabels, ...rightLabels];

  const leftX = candleX - candleW / 2 - 14;
  const rightX = candleX + candleW / 2 + 14;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      <defs>
        <linearGradient id="gradBull" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="gradBear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background subtle scale lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = pad.top + f * chartH;
        return (
          <line
            key={f}
            x1={leftX + 10}
            y1={y}
            x2={rightX - 10}
            y2={y}
            stroke="currentColor"
            className="text-gray-100 dark:text-zinc-800/60"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Candle glow background */}
      <rect
        x={candleX - candleW / 2 - 6}
        y={bodyHi - 6}
        width={candleW + 12}
        height={bodyH + 12}
        rx={8}
        fill={color}
        opacity={0.08}
        filter="url(#softGlow)"
      />

      {/* Upper wick */}
      <line
        x1={candleX}
        y1={wickTop}
        x2={candleX}
        y2={bodyHi}
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />

      {/* Lower wick */}
      <line
        x1={candleX}
        y1={bodyLo}
        x2={candleX}
        y2={wickBot}
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />

      {/* Candle body */}
      <rect
        x={candleX - candleW / 2}
        y={bodyHi}
        width={candleW}
        height={bodyH}
        fill={`url(#${gradId})`}
        rx={4}
      />

      {/* Candle body border for depth */}
      <rect
        x={candleX - candleW / 2}
        y={bodyHi}
        width={candleW}
        height={bodyH}
        fill="none"
        stroke={color}
        strokeWidth={0.5}
        strokeOpacity={0.3}
        rx={4}
      />

      {/* High tick */}
      <line
        x1={candleX - 6}
        y1={wickTop}
        x2={candleX + 6}
        y2={wickTop}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* Low tick */}
      <line
        x1={candleX - 6}
        y1={wickBot}
        x2={candleX + 6}
        y2={wickBot}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* Previous close dashed line */}
      <line
        x1={candleX - candleW / 2 - 10}
        y1={prevY}
        x2={candleX + candleW / 2 + 10}
        y2={prevY}
        stroke="#f59e0b"
        strokeWidth={1.5}
        strokeDasharray="4 3"
        opacity={0.6}
      />

      {/* Current price indicator line - extends wider */}
      <line
        x1={candleX + candleW / 2 + 2}
        y1={closeY}
        x2={rightX - 2}
        y2={closeY}
        stroke={color}
        strokeWidth={1.5}
        opacity={0.5}
      />
      {/* Current price dot on candle */}
      <circle
        cx={candleX}
        cy={closeY}
        r={4}
        fill={color}
        filter="url(#glow)"
      />

      {/* Price labels */}
      {allLabels.map((item) => {
        const isLeft = item.side === "left";
        const anchorX = isLeft ? leftX : rightX;
        const align = isLeft ? "end" : "start";

        return (
          <g key={item.text}>
            {/* Connector */}
            <line
              x1={isLeft ? anchorX + 3 : anchorX - 3}
              y1={item.y}
              x2={isLeft ? candleX - candleW / 2 - 4 : candleX + candleW / 2 + 4}
              y2={item.origY}
              stroke={item.color}
              strokeWidth={0.7}
              opacity={0.25}
              strokeDasharray={item.bold ? "0" : "2 2"}
            />

            {/* Dot */}
            {item.dot && (
              <circle
                cx={anchorX + (isLeft ? 5 : -5)}
                cy={item.y}
                r={2}
                fill={item.color}
                opacity={0.6}
              />
            )}

            {/* Label text */}
            <text
              x={anchorX + (isLeft ? -1 : 1)}
              y={item.y - 4}
              textAnchor={align}
              fontSize={8}
              fill={item.color}
              opacity={0.7}
            >
              {item.text}
            </text>

            {/* Price */}
            <text
              x={anchorX + (isLeft ? -1 : 1)}
              y={item.y + 8}
              textAnchor={align}
              fontSize={item.bold ? 11 : 10}
              fontWeight={item.bold ? 700 : 500}
              fill={item.bold ? item.color : "currentColor"}
              className={item.bold ? "" : "text-gray-700 dark:text-zinc-300"}
            >
              ${item.price.toFixed(2)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function StockHeader({ symbol }: StockHeaderProps) {
  const { data: quote, isLoading: quoteLoading, isError: quoteError } = useQuote(symbol);
  const { data: profile, isLoading: profileLoading, isError: profileError } = useProfile(symbol);
  const [showCompareInput, setShowCompareInput] = useState(false);
  const [compareSymbol, setCompareSymbol] = useState("");

  if (quoteLoading || profileLoading) {
    return <HeaderSkeleton />;
  }

  // 종목 데이터를 가져올 수 없는 경우 (존재하지 않는 종목)
  const noData = (quoteError || !quote?.price) && (profileError || !profile?.name || profile.name === symbol);
  if (noData) {
    return (
      <div className="p-8 sm:p-12 bg-gray-50 dark:bg-zinc-900 rounded-lg text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-gray-700 dark:text-zinc-300 mb-1">
          {symbol}
        </p>
        <p className="text-sm text-gray-400 dark:text-zinc-500 mb-6">
          해당 종목은 현재 준비 중입니다
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          홈으로 돌아가기
        </a>
      </div>
    );
  }

  const handleCompare = () => {
    if (compareSymbol.trim()) {
      window.location.href = `/compare?symbols=${symbol},${compareSymbol.toUpperCase()}`;
    }
  };

  const formatMarketCap = (value?: number) => {
    if (!value) return "-";
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  const hasCandle =
    quote && quote.open && quote.high && quote.low && quote.previousClose;

  return (
    <div className="p-4 sm:p-6 bg-gray-50 dark:bg-zinc-900 rounded-lg">
      {/* Compare Button */}
      <div className="flex justify-end mb-4">
        {!showCompareInput ? (
          <button
            onClick={() => setShowCompareInput(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            종목 비교하기
          </button>
        ) : (
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={compareSymbol}
              onChange={(e) => setCompareSymbol(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCompare()}
              placeholder="비교할 종목 심볼 (예: MSFT)"
              className="px-3 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 text-sm rounded-lg border border-zinc-700 focus:border-blue-500 focus:outline-none w-48"
              autoFocus
            />
            <button
              onClick={handleCompare}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              비교
            </button>
            <button
              onClick={() => {
                setShowCompareInput(false);
                setCompareSymbol("");
              }}
              className="px-3 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500 dark:text-zinc-400 text-sm font-medium rounded-lg transition-colors"
            >
              취소
            </button>
          </div>
        )}
      </div>

      {/* Main: Company + Price + Candle */}
      <div className="flex flex-col gap-4">
        {/* Top row: Company Info + Price */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Left: Company Info */}
          <div className="flex items-start gap-3 sm:gap-4">
            {profile?.logo && (
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-white/30 rounded-full blur-xl scale-110" />
                <img
                  src={profile.logo}
                  alt={profile.name}
                  className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base sm:text-lg font-bold bg-gray-200 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  {symbol}
                </span>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-zinc-100 truncate">
                  {profile?.name || symbol}
                </h1>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 mt-1 text-xs sm:text-sm text-gray-400 dark:text-zinc-500 flex-wrap">
                {profile?.exchange && <span>{profile.exchange}</span>}
                {profile?.sector && (
                  <>
                    <span>•</span>
                    <span className="truncate">{profile.sector}</span>
                  </>
                )}
                {profile?.industry && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline truncate">
                      {profile.industry}
                    </span>
                  </>
                )}
              </div>
              <div className="text-xs sm:text-sm text-gray-400 dark:text-zinc-500 mt-1">
                시가총액:{" "}
                {formatMarketCap(quote?.marketCap || profile?.marketCap)}
              </div>
            </div>
          </div>

          {/* Right: Price (no candle) */}
          {!hasCandle && (
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200 dark:border-zinc-800">
              <div className="flex items-baseline gap-2 sm:flex-col sm:items-end sm:gap-0">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-zinc-100">
                  ${quote?.price?.toFixed(2) || "-"}
                </div>
                {quote && (
                  <div className="sm:mt-1">
                    <ChangeIndicator
                      value={quote.change}
                      percent={quote.changePercent}
                      size="lg"
                    />
                  </div>
                )}
              </div>
              {quote?.timestamp && (
                <div className="text-xs text-gray-400 dark:text-zinc-500 sm:mt-2">
                  {new Date(quote.timestamp).toLocaleString("ko-KR")}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Price + Candle integrated section */}
        {hasCandle && (
          <div className="mt-1 pt-4 border-t border-gray-200 dark:border-zinc-800">
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Price display */}
              <div className="flex flex-col items-start flex-shrink-0">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-zinc-100 tabular-nums tracking-tight">
                  ${quote.price.toFixed(2)}
                </div>
                <div className="mt-1.5">
                  <ChangeIndicator
                    value={quote.change}
                    percent={quote.changePercent}
                    size="lg"
                  />
                </div>
                {quote.timestamp && (
                  <div className="text-[10px] text-gray-400 dark:text-zinc-600 mt-1.5">
                    {new Date(quote.timestamp).toLocaleString("ko-KR")}
                  </div>
                )}
              </div>

              {/* Candle visualization */}
              <div className="flex-1 min-w-0 h-[150px] max-w-[320px]">
                <PriceCandle
                  open={quote.open}
                  high={quote.high}
                  low={quote.low}
                  close={quote.price}
                  previousClose={quote.previousClose}
                />
              </div>

              {/* 52 Week Range - vertical on right */}
              {quote.trading?.["52WeekLow"] &&
                quote.trading?.["52WeekHigh"] && (
                  <div className="hidden md:flex flex-col items-center gap-1 flex-shrink-0">
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">
                      52주
                    </span>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] tabular-nums text-gray-500 dark:text-zinc-400">
                        ${quote.trading["52WeekHigh"].toFixed(0)}
                      </span>
                      <div className="relative w-1.5 h-20 bg-gray-200 dark:bg-zinc-700 rounded-full">
                        {(() => {
                          const low52 = quote.trading!["52WeekLow"]!;
                          const high52 = quote.trading!["52WeekHigh"]!;
                          const range52 = high52 - low52;
                          const pct =
                            range52 > 0
                              ? ((quote.price - low52) / range52) * 100
                              : 50;
                          // Invert: top = high, bottom = low
                          const top = 100 - Math.min(Math.max(pct, 0), 100);
                          return (
                            <div
                              className="absolute left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-blue-500 shadow-md shadow-blue-500/40 border-2 border-white dark:border-zinc-900"
                              style={{ top: `${top}%` }}
                            />
                          );
                        })()}
                      </div>
                      <span className="text-[10px] tabular-nums text-gray-500 dark:text-zinc-400">
                        ${quote.trading["52WeekLow"].toFixed(0)}
                      </span>
                    </div>
                  </div>
                )}
            </div>

            {/* 52 Week Range - horizontal for mobile */}
            {quote.trading?.["52WeekLow"] &&
              quote.trading?.["52WeekHigh"] && (
                <div className="flex md:hidden items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800/50">
                  <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium flex-shrink-0">
                    52주
                  </span>
                  <span className="text-[10px] tabular-nums text-gray-500 dark:text-zinc-400">
                    ${quote.trading["52WeekLow"].toFixed(0)}
                  </span>
                  <div className="relative flex-1 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full">
                    {(() => {
                      const low52 = quote.trading!["52WeekLow"]!;
                      const high52 = quote.trading!["52WeekHigh"]!;
                      const range52 = high52 - low52;
                      const pos =
                        range52 > 0
                          ? ((quote.price - low52) / range52) * 100
                          : 50;
                      return (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500 shadow-md shadow-blue-500/30 border-2 border-white dark:border-zinc-900"
                          style={{
                            left: `${Math.min(Math.max(pos, 0), 100)}%`,
                          }}
                        />
                      );
                    })()}
                  </div>
                  <span className="text-[10px] tabular-nums text-gray-500 dark:text-zinc-400">
                    ${quote.trading["52WeekHigh"].toFixed(0)}
                  </span>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
