"use client";

interface SignalIndicatorProps {
  signal: "buy" | "sell" | "neutral";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function SignalIndicator({
  signal,
  size = "md",
  showLabel = true,
}: SignalIndicatorProps) {
  const config = {
    buy: {
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      label: "Buy",
    },
    sell: {
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      label: "Sell",
    },
    neutral: {
      color: "text-gray-500 dark:text-zinc-400",
      bg: "bg-zinc-500/10",
      border: "border-zinc-500/30",
      label: "Hold",
    },
  };

  const { color, bg, border, label } = config[signal];

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${bg} ${border} ${color} ${sizeClasses[size]} font-medium`}
    >
      <span
        className={`w-2 h-2 rounded-full ${signal === "buy" ? "bg-emerald-500" : signal === "sell" ? "bg-red-500" : "bg-zinc-500"}`}
      />
      {showLabel && <span>{label}</span>}
    </span>
  );
}
