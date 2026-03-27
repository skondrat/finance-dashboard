import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Base Skeleton primitive                                            */
/* ------------------------------------------------------------------ */

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-surface-container-high", className)}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton card – generic content placeholder                       */
/* ------------------------------------------------------------------ */

export function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-surface-container-low p-5">
      <Skeleton className="mb-3 h-3 w-24" />
      <Skeleton className="mb-2 h-6 w-36" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton KPI strip – matches the 6-card KPI layout                */
/* ------------------------------------------------------------------ */

export function SkeletonKpiStrip() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl bg-surface-container-lowest px-5 py-4"
        >
          <Skeleton className="mb-3 h-3 w-20" />
          <Skeleton className="h-8 w-32" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton chart – 2:1 aspect ratio placeholder                     */
/* ------------------------------------------------------------------ */

export function SkeletonChart() {
  return (
    <div className="animate-pulse rounded-2xl bg-surface-container-low aspect-[2/1]" />
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton table – stacked row placeholders                         */
/* ------------------------------------------------------------------ */

interface SkeletonTableProps {
  rows?: number;
}

export function SkeletonTable({ rows = 5 }: SkeletonTableProps) {
  return (
    <div className="space-y-2">
      {/* Header row */}
      <div className="flex gap-4 px-4 py-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16 ml-auto" />
      </div>

      {/* Data rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-xl bg-surface-container-low px-4 py-3"
        >
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16 ml-auto" />
        </div>
      ))}
    </div>
  );
}
