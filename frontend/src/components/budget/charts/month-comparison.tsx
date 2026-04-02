"use client";

import { useSpendByCategory, type SpendByCategoryItem } from "@/lib/queries/budget";
import { useCurrencyStore } from "@/stores/currency-store";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface MonthComparisonProps {
  month: number;
  year: number;
}

export function MonthComparison({ month, year }: MonthComparisonProps) {
  const currency = useCurrencyStore((s) => s.currency);

  // Current month
  const { data: currentData, isLoading: loadingCurrent } = useSpendByCategory(
    "monthly",
    month,
    year
  );

  // Previous month
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const { data: prevData, isLoading: loadingPrev } = useSpendByCategory(
    "monthly",
    prevMonth,
    prevYear
  );

  const isLoading = loadingCurrent || loadingPrev;

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

  if (!currentData || !prevData) return null;

  // Build comparison data
  const prevMap = new Map<string, SpendByCategoryItem>();
  for (const item of prevData) {
    prevMap.set(item.category.name, item);
  }

  const comparisons = currentData
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
    .sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange));

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="rounded-2xl bg-surface-container-low p-6">
      <h2 className="font-display text-xl font-medium text-on-surface mb-1">
        Month-over-Month
      </h2>
      <p className="font-mono text-xs text-on-surface-variant mb-4">
        {monthNames[prevMonth - 1]} vs {monthNames[month - 1]} {year}
      </p>

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
