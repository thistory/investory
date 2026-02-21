"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  Time,
  CandlestickSeries,
  HistogramSeries,
} from "lightweight-charts";
import { useTheme } from "next-themes";
import { useChart, Period } from "@/lib/hooks/useChart";
import { ChartSkeleton } from "@/components/ui/Skeleton";
import { useTranslations } from "next-intl";

interface PriceChartProps {
  symbol: string;
}

const PERIOD_VALUES: Period[] = ["1D", "1W", "1M", "3M", "1Y", "5Y"];

const PERIOD_KEYS: Record<Period, string> = {
  "1D": "period1D",
  "1W": "period1W",
  "1M": "period1M",
  "3M": "period3M",
  "1Y": "period1Y",
  "5Y": "period5Y",
};

const INTRADAY_PERIODS = new Set(["1D", "1W"]);

const THEME = {
  dark: {
    bg: "#18181b",
    text: "#a1a1aa",
    grid: "#27272a",
    border: "#3f3f46",
    volUp: "#10b98133",
    volDown: "#ef444433",
    volDefault: "#3f3f46",
  },
  light: {
    bg: "#f9fafb",
    text: "#6b7280",
    grid: "#f3f4f6",
    border: "#e5e7eb",
    volUp: "#10b98133",
    volDown: "#ef444433",
    volDefault: "#d1d5db",
  },
};

/** Unix timestamp (seconds) → "YYYY-MM-DD" */
function toDateString(ts: number): string {
  const d = new Date(ts * 1000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function PriceChart({ symbol }: PriceChartProps) {
  const t = useTranslations("chart");
  const [period, setPeriod] = useState<Period>("1Y");
  const { data: chartData, isLoading } = useChart(symbol, period);
  const { resolvedTheme } = useTheme();

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick", Time> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram", Time> | null>(null);

  const isDark = resolvedTheme === "dark";
  const colors = isDark ? THEME.dark : THEME.light;

  // Create / recreate chart when theme changes
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    }

    const isMobile = window.innerWidth < 640;
    const chartHeight = isMobile ? 300 : 400;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: colors.bg },
        textColor: colors.text,
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartHeight,
      timeScale: {
        borderColor: colors.border,
        timeVisible: INTRADAY_PERIODS.has(period),
      },
      rightPriceScale: {
        borderColor: colors.border,
      },
      crosshair: {
        mode: 1,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderUpColor: "#10b981",
      borderDownColor: "#ef4444",
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: colors.volDefault,
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        const mobile = window.innerWidth < 640;
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: mobile ? 300 : 400,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark]);

  // Set data when chartData or chart changes
  useEffect(() => {
    if (!chartData?.candles?.length || !candleSeriesRef.current || !volumeSeriesRef.current) {
      return;
    }

    const isIntraday = INTRADAY_PERIODS.has(chartData.period);

    const candleData: CandlestickData<Time>[] = chartData.candles.map((c) => ({
      time: (isIntraday ? c.time : toDateString(c.time)) as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const volumeData: HistogramData<Time>[] = chartData.candles.map((c) => ({
      time: (isIntraday ? c.time : toDateString(c.time)) as Time,
      value: c.volume,
      color: c.close >= c.open ? colors.volUp : colors.volDown,
    }));

    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);

    // Update timeScale visibility for period
    if (chartRef.current) {
      chartRef.current.timeScale().applyOptions({
        timeVisible: isIntraday,
      });
      chartRef.current.timeScale().fitContent();
    }
  }, [chartData, isDark, colors]);

  if (isLoading && !chartData) {
    return <ChartSkeleton />;
  }

  return (
    <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-zinc-800 gap-2 sm:gap-0">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-zinc-100">{t("priceChart")}</h2>
        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1 sm:mx-0 sm:px-0">
          {PERIOD_VALUES.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 sm:px-3 py-1 text-xs sm:text-sm rounded transition-colors whitespace-nowrap flex-shrink-0 ${
                period === p
                  ? "bg-gray-200 dark:bg-zinc-700 text-gray-900 dark:text-zinc-100"
                  : "text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-800 dark:hover:text-zinc-200"
              }`}
            >
              {t(PERIOD_KEYS[p])}
            </button>
          ))}
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}
