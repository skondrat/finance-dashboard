"use client";

import { cn } from "@/lib/utils";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type Period = "monthly" | "ytd" | "yearly" | "custom";

const SEGMENTS: { key: Period; label: string }[] = [
  { key: "monthly", label: "Monthly" },
  { key: "ytd", label: "YTD" },
  { key: "yearly", label: "Yearly" },
  { key: "custom", label: "Custom" },
];

interface TimeAggregationProps {
  period: Period;
  month: number;
  year: number;
  onPeriodChange: (period: Period) => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

export type { Period };

export function TimeAggregation({
  period,
  month,
  year,
  onPeriodChange,
  onMonthChange,
  onYearChange,
}: TimeAggregationProps) {
  function handlePrevMonth() {
    if (month === 1) {
      onMonthChange(12);
      onYearChange(year - 1);
    } else {
      onMonthChange(month - 1);
    }
  }

  function handleNextMonth() {
    if (month === 12) {
      onMonthChange(1);
      onYearChange(year + 1);
    } else {
      onMonthChange(month + 1);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Segmented control */}
      <div className="flex gap-1 rounded-xl bg-surface-container-low p-1">
        {SEGMENTS.map((seg) => (
          <button
            key={seg.key}
            onClick={() => onPeriodChange(seg.key)}
            className={cn(
              "rounded-lg px-3 py-1.5 font-mono text-xs uppercase tracking-[0.1em] transition-colors",
              period === seg.key
                ? "bg-on-surface text-surface"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            {seg.label}
          </button>
        ))}
      </div>

      {/* Period selector */}
      {period === "monthly" && (
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="rounded-lg px-2 py-1 font-mono text-sm text-on-surface-variant transition-colors hover:text-on-surface"
            aria-label="Previous month"
          >
            &larr;
          </button>
          <span className="min-w-[7rem] text-center font-mono text-sm text-on-surface">
            {MONTHS[month - 1]} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="rounded-lg px-2 py-1 font-mono text-sm text-on-surface-variant transition-colors hover:text-on-surface"
            aria-label="Next month"
          >
            &rarr;
          </button>
        </div>
      )}

      {period === "yearly" && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onYearChange(year - 1)}
            className="rounded-lg px-2 py-1 font-mono text-sm text-on-surface-variant transition-colors hover:text-on-surface"
            aria-label="Previous year"
          >
            &larr;
          </button>
          <span className="min-w-[4rem] text-center font-mono text-sm text-on-surface">
            {year}
          </span>
          <button
            onClick={() => onYearChange(year + 1)}
            className="rounded-lg px-2 py-1 font-mono text-sm text-on-surface-variant transition-colors hover:text-on-surface"
            aria-label="Next year"
          >
            &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
