"use client";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-100 dark:bg-zinc-800 rounded ${className}`}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg">
      <div className="flex justify-between mb-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-10" />
          <Skeleton className="h-6 w-10" />
          <Skeleton className="h-6 w-10" />
        </div>
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="p-6 bg-gray-50 dark:bg-zinc-900 rounded-lg">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
    </div>
  );
}
