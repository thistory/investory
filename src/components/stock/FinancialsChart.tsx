"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { useFinancials, FinancialReport } from "@/lib/hooks/useFinancials";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useTranslations } from "next-intl";

interface FinancialsChartProps {
  symbol: string;
}

type ViewMode = "annual" | "quarterly";

function formatValue(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(0)}M`;
  return value.toLocaleString();
}

function formatLabel(date: string, mode: ViewMode): string {
  if (mode === "annual") {
    return date.substring(0, 4);
  }
  const d = new Date(date);
  const month = d.getMonth();
  const quarter = Math.floor(month / 3) + 1;
  const year = d.getFullYear().toString().slice(-2);
  return `Q${quarter} '${year}`;
}

function formatTooltipValue(value: number): string {
  const abs = Math.abs(value);
  const prefix = value < 0 ? "-" : "";
  if (abs >= 1e12) return `${prefix}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${prefix}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${prefix}$${(abs / 1e6).toFixed(1)}M`;
  return `${prefix}$${abs.toLocaleString()}`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload) return null;

  return (
    <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-3 shadow-lg">
      <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-2">
        {label}
      </p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600 dark:text-zinc-300">
            {entry.name}:
          </span>
          <span className="font-semibold text-gray-900 dark:text-zinc-100">
            {formatTooltipValue(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function FinancialsChart({ symbol }: FinancialsChartProps) {
  const t = useTranslations("financials");
  const { data, isLoading, error } = useFinancials(symbol);
  const [viewMode, setViewMode] = useState<ViewMode>("annual");

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (error || !data || (!data.annual?.length && !data.quarterly?.length)) {
    return null;
  }

  const reports: FinancialReport[] =
    viewMode === "annual" ? data.annual : data.quarterly;

  const chartData = reports.map((r) => ({
    label: formatLabel(r.date, viewMode),
    revenue: r.revenue,
    netIncome: r.netIncome,
  }));

  const hasNegative = chartData.some((d) => d.netIncome < 0);

  return (
    <div className="p-4 sm:p-6 bg-gray-50 dark:bg-zinc-900 rounded-lg">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
          {t("revenueAndIncome")}
        </h2>
        <div className="flex bg-gray-200 dark:bg-zinc-800 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("annual")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              viewMode === "annual"
                ? "bg-white dark:bg-zinc-600 text-gray-900 dark:text-zinc-100 shadow-sm"
                : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
            }`}
          >
            {t("annual")}
          </button>
          <button
            onClick={() => setViewMode("quarterly")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              viewMode === "quarterly"
                ? "bg-white dark:bg-zinc-600 text-gray-900 dark:text-zinc-100 shadow-sm"
                : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
            }`}
          >
            {t("quarterly")}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-blue-500" />
          <span className="text-xs text-gray-500 dark:text-zinc-400">{t("revenue")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-500" />
          <span className="text-xs text-gray-500 dark:text-zinc-400">
            {t("netIncome")}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
            barCategoryGap="20%"
            barGap={4}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-gray-200 dark:text-zinc-800"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => formatValue(v)}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              width={55}
            />
            {hasNegative && (
              <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />
            )}
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(107, 114, 128, 0.1)" }} />
            <Bar
              dataKey="revenue"
              name={t("revenue")}
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
            <Bar
              dataKey="netIncome"
              name={t("netIncome")}
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 dark:text-zinc-500 border-b border-gray-200 dark:border-zinc-800">
              <th className="text-left py-2 pr-3 font-medium">{t("period")}</th>
              <th className="text-right py-2 px-3 font-medium">{t("revenue")}</th>
              <th className="text-right py-2 px-3 font-medium">{t("netIncome")}</th>
              <th className="text-right py-2 pl-3 font-medium">{t("netMargin")}</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((row, i) => {
              const report = reports[i];
              const margin =
                report.revenue > 0
                  ? ((report.netIncome / report.revenue) * 100).toFixed(1)
                  : "-";
              const isNegMargin = report.netIncome < 0;
              return (
                <tr
                  key={row.label}
                  className="border-b border-gray-100 dark:border-zinc-800/50 last:border-0"
                >
                  <td className="py-2 pr-3 font-medium text-gray-700 dark:text-zinc-300">
                    {row.label}
                  </td>
                  <td className="py-2 px-3 text-right text-gray-900 dark:text-zinc-100 tabular-nums">
                    {formatTooltipValue(report.revenue)}
                  </td>
                  <td
                    className={`py-2 px-3 text-right tabular-nums ${
                      report.netIncome >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-500"
                    }`}
                  >
                    {formatTooltipValue(report.netIncome)}
                  </td>
                  <td
                    className={`py-2 pl-3 text-right tabular-nums ${
                      isNegMargin ? "text-red-500" : "text-gray-600 dark:text-zinc-300"
                    }`}
                  >
                    {margin}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
