"use client";

interface ChangeIndicatorProps {
  value: number;
  percent?: number;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export function ChangeIndicator({
  value,
  percent,
  size = "md",
  showIcon = true,
}: ChangeIndicatorProps) {
  const isPositive = value >= 0;
  const color = isPositive ? "text-emerald-500" : "text-red-500";
  const bgColor = isPositive ? "bg-emerald-500/10" : "bg-red-500/10";

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const icon = isPositive ? "▲" : "▼";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${bgColor} ${color} ${sizeClasses[size]} font-medium`}
    >
      {showIcon && <span className="text-[0.6em]">{icon}</span>}
      <span>
        {isPositive ? "+" : ""}
        {value.toFixed(2)}
      </span>
      {percent !== undefined && (
        <span>
          ({isPositive ? "+" : ""}
          {percent.toFixed(2)}%)
        </span>
      )}
    </span>
  );
}
