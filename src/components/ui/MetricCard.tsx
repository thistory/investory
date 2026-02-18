"use client";

interface MetricCardProps {
  label: string;
  value: string | number | undefined | null;
  subValue?: string;
  change?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function MetricCard({
  label,
  value,
  subValue,
  change,
  prefix = "",
  suffix = "",
  className = "",
}: MetricCardProps) {
  const displayValue =
    value === undefined || value === null
      ? "-"
      : typeof value === "number"
        ? formatNumber(value, prefix, suffix)
        : value;

  return (
    <div className={`flex flex-col ${className}`}>
      <span className="text-xs text-gray-400 dark:text-zinc-500 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{displayValue}</span>
      {subValue && <span className="text-xs text-gray-400 dark:text-zinc-500">{subValue}</span>}
      {change !== undefined && (
        <span
          className={`text-xs ${change >= 0 ? "text-emerald-500" : "text-red-500"}`}
        >
          {change >= 0 ? "+" : ""}
          {change.toFixed(2)}%
        </span>
      )}
    </div>
  );
}

function formatNumber(num: number, prefix: string, suffix: string): string {
  if (Math.abs(num) >= 1e12) {
    return `${prefix}${(num / 1e12).toFixed(2)}T${suffix}`;
  }
  if (Math.abs(num) >= 1e9) {
    return `${prefix}${(num / 1e9).toFixed(2)}B${suffix}`;
  }
  if (Math.abs(num) >= 1e6) {
    return `${prefix}${(num / 1e6).toFixed(2)}M${suffix}`;
  }
  if (Math.abs(num) >= 1e3) {
    return `${prefix}${(num / 1e3).toFixed(2)}K${suffix}`;
  }
  return `${prefix}${num.toFixed(2)}${suffix}`;
}

interface MetricGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  mobileColumns?: 1 | 2;
  className?: string;
}

export function MetricGrid({
  children,
  columns = 3,
  mobileColumns = 2,
  className = "",
}: MetricGridProps) {
  const mobileGridCols = {
    1: "grid-cols-1",
    2: "grid-cols-2",
  };

  const desktopGridCols = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-4",
  };

  return (
    <div
      className={`grid ${mobileGridCols[mobileColumns]} ${desktopGridCols[columns]} gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg ${className}`}
    >
      {children}
    </div>
  );
}
