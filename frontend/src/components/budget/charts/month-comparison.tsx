"use client";

import { useState } from "react";
import { useSpendByCategory, type SpendByCategoryItem } from "@/lib/queries/budget";
import { useCurrencyStore } from "@/stores/currency-store";
import { formatCurrency } from "@/lib/utils";
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

const YEARS = [2025, 2026];

const selectClass =
  "rounded-lg border border-on-surface-variant/20 bg-surface-container-lowest px-1.5 py-0.5 font-mono text-[10px] text-on-surface focus:outline-none appearance-none cursor-pointer";

type SortKey = "pctChange" | "previous" | "current";
type SortDir = "asc" | "desc";

interface MonthComparisonProps {
  month: number;
  year: number;
}

export function MonthComparison({ month, year }: MonthComparisonProps) {
  const currency = useCurrencyStore((s) => s.currency);

  // Selectable months
  const defaultPrevMonth = month === 1 ? 12 : month - 1;
  const defaultPrevYear = month === 1 ? year - 1 : year;
  const [month1, setMonth1] = useState(defaultPrevMonth);
  const [year1, setYear1] = useState(defaultPrevYear);
  const [month2, setMonth2] = useState(month);
  const [year2, setYear2] = useState(year);

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>("pctChange");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const { data: data1, isLoading: loading1 } = useSpendByCategory("monthly", month1, year1);
  const { data: data2, isLoading: loading2 } = useSpendByCategory("monthly", month2, year2);

  const isLoading = loading1 || loading2;

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-surface-container-low p-6">
        <h2 className="font-display text-xl font-medium text-on-surface mb-4">
          Month-over-Month
        </h2>
        <div className="h-48 animate-pulse rounded-xl bg-surface-container-lowest" />
      </div>
    );
  }

  if (!data1 || !data2) return null;

  // Build comparison data
  const prevMap = new Map<string, SpendByCategoryItem>();
  for (const item of data1) {
    prevMap.set(item.category.name, item);
  }

  const comparisons = data2
    .map((curr) => {
      const prev = prevMap.get(curr.category.name);
      const currSpent = curr.spent;
      const prevSpent = prev?.spent ?? 0;
      const diff = currSpent - prevSpent;
      const pctChange = prevSpent > 0 ? ((diff / prevSpent) * 100) : currSpent > 0 ? 100 : 0;

      return {
        name: curr.category.name,
        color: curr.category.color,
        current: currSpent,
        previous: prevSpent,
        diff,
        pctChange,
      };
    })
    .filter((c) => c.current > 0 || c.previous > 0)
    .sort((a, b) => {
      const mult = sortDir === "desc" ? 1 : -1;
      if (sortKey === "pctChange") return mult * (Math.abs(b.pctChange) - Math.abs(a.pctChange));
      if (sortKey === "previous") return mult * (b.previous - a.previous);
      return mult * (b.current - a.current);
    });

  const sortArrow = (key: SortKey) =>
    sortKey === key ? (sortDir === "desc" ? " ↓" : " ↑") : "";

  return (
    <div className="rounded-2xl bg-surface-container-low p-6">
      <h2 className="font-display text-xl font-medium text-on-surface mb-2">
        Month-over-Month
      </h2>

      {/* Month selectors */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        <select value={month1} onChange={(e) => setMonth1(Number(e.target.value))} className={selectClass}>
          {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select value={year1} onChange={(e) => setYear1(Number(e.target.value))} className={selectClass}>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <span className="font-mono text-xs text-on-surface-variant">vs</span>
        <select value={month2} onChange={(e) => setMonth2(Number(e.target.value))} className={selectClass}>
          {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select value={year2} onChange={(e) => setYear2(Number(e.target.value))} className={selectClass}>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Sort buttons */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => toggleSort("previous")}
          className={cn(
            "font-mono text-[10px] uppercase tracking-[0.1em] px-2 py-1 rounded-lg transition-colors",
            sortKey === "previous" ? "bg-on-surface text-surface" : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          {MONTHS.find((m) => m.value === month1)?.label}{sortArrow("previous")}
        </button>
        <button
          onClick={() => toggleSort("current")}
          className={cn(
            "font-mono text-[10px] uppercase tracking-[0.1em] px-2 py-1 rounded-lg transition-colors",
            sortKey === "current" ? "bg-on-surface text-surface" : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          {MONTHS.find((m) => m.value === month2)?.label}{sortArrow("current")}
        </button>
        <button
          onClick={() => toggleSort("pctChange")}
          className={cn(
            "font-mono text-[10px] uppercase tracking-[0.1em] px-2 py-1 rounded-lg transition-colors",
            sortKey === "pctChange" ? "bg-on-surface text-surface" : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          Diff %{sortArrow("pctChange")}
        </button>
      </div>

      {comparisons.length === 0 ? (
        <p className="font-mono text-sm text-on-surface-variant text-center py-4">
          No spending data to compare
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-visible">
          {comparisons.map((c) => (
            <div
              key={c.name}
              className="flex items-center justify-between rounded-xl bg-surface-container-lowest px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <span className="font-mono text-xs text-on-surface truncate">
                  {c.name}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-xs text-on-surface-variant">
                  {formatCurrency(c.previous, currency)}
                </span>
                <span className="font-mono text-xs text-on-surface-variant">{"\u2192"}</span>
                <span className="font-mono text-xs text-on-surface">
                  {formatCurrency(c.current, currency)}
                </span>
                <span
                  className={cn(
                    "font-mono text-xs font-medium min-w-[4rem] text-right",
                    c.diff > 0 && Math.abs(c.pctChange) > 20
                      ? "text-on-error-container"
                      : c.diff < 0
                        ? "text-on-tertiary-container"
                        : "text-on-surface-variant"
                  )}
                >
                  {c.diff > 0 ? "+" : ""}
                  {c.pctChange.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
