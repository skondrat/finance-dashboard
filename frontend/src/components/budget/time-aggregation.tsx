"use client";

import { cn } from "@/lib/utils";

const MONTHS = [
  { value: 1, label: "Jan" },
  { value: 2, label: "Feb" },
  { value: 3, label: "Mar" },
  { value: 4, label: "Apr" },
  { value: 5, label: "May" },
  { value: 6, label: "Jun" },
  { value: 7, label: "Jul" },
  { value: 8, label: "Aug" },
  { value: 9, label: "Sep" },
  { value: 10, label: "Oct" },
  { value: 11, label: "Nov" },
  { value: 12, label: "Dec" },
];

const YEARS = [2026];

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
  fromDate?: string;
  toDate?: string;
  onPeriodChange: (period: Period) => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onFromDateChange?: (date: string) => void;
  onToDateChange?: (date: string) => void;
}

export type { Period };

const selectClass =
  "rounded-lg border border-on-surface-variant/20 bg-surface-container-lowest px-2 py-1 font-mono text-sm text-on-surface focus:outline-none focus:border-on-surface-variant/40 appearance-none cursor-pointer";

export function TimeAggregation({
  period,
  month,
  year,
  fromDate,
  toDate,
  onPeriodChange,
  onMonthChange,
  onYearChange,
  onFromDateChange,
  onToDateChange,
}: TimeAggregationProps) {
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
          <select
            value={month}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            className={selectClass}
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className={selectClass}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      )}

      {period === "yearly" && (
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className={selectClass}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      )}

      {period === "custom" && (
        <div className="flex items-center gap-2">
          <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-on-surface-variant">
            From
          </label>
          <input
            type="date"
            value={fromDate ?? ""}
            onChange={(e) => onFromDateChange?.(e.target.value)}
            className={selectClass}
          />
          <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-on-surface-variant">
            To
          </label>
          <input
            type="date"
            value={toDate ?? ""}
            onChange={(e) => onToDateChange?.(e.target.value)}
            className={selectClass}
          />
        </div>
      )}
    </div>
  );
}
