"use client";

import {
  useSpendByCategory,
  type SpendByCategoryItem,
} from "@/lib/queries/budget";
import { useCurrencyStore } from "@/stores/currency-store";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";

function CategorySkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-xl bg-surface-container-lowest"
        />
      ))}
    </div>
  );
}

function ProgressBar({
  spent,
  budget,
}: {
  spent: number;
  budget: number | null;
}) {
  if (budget === null || budget === 0) {
    return (
      <div className="h-1.5 w-full rounded-full bg-on-surface-variant/20" />
    );
  }

  const pct = Math.min((spent / budget) * 100, 100);
  const overBudget = spent > budget;

  return (
    <div className="h-1.5 w-full rounded-full bg-on-surface-variant/10">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          overBudget ? "bg-on-error-container" : "bg-on-tertiary-container"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

interface CategoryRowProps {
  item: SpendByCategoryItem;
  currency: string;
}

function CategoryRow({ item, currency }: CategoryRowProps) {
  return (
    <div className="rounded-xl bg-surface-container-lowest px-4 py-3">
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_0.5fr] gap-4 items-center">
        {/* Category name with color dot */}
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: item.category.color }}
          />
          <span className="font-body text-sm text-on-surface">
            {item.category.name}
          </span>
        </div>

        {/* Budget */}
        <p className="text-right font-mono text-sm text-on-surface-variant">
          {item.budget !== null
            ? formatCurrency(item.budget, currency)
            : "\u2014"}
        </p>

        {/* Spent */}
        <p className="text-right font-mono text-sm text-on-surface">
          {formatCurrency(item.spent, currency)}
        </p>

        {/* Remaining */}
        <p
          className={cn(
            "text-right font-mono text-sm",
            item.remaining !== null && item.remaining < 0
              ? "text-on-error-container"
              : "text-on-surface-variant"
          )}
        >
          {item.remaining !== null
            ? formatCurrency(item.remaining, currency)
            : "\u2014"}
        </p>

        {/* % of total */}
        <p className="text-right font-mono text-sm text-on-surface-variant">
          {formatPercent(item.pct_of_total)}
        </p>
      </div>

      <div className="mt-2">
        <ProgressBar spent={item.spent} budget={item.budget} />
      </div>
    </div>
  );
}

interface CategoryTableProps {
  period: string;
  month?: number;
  year?: number;
  fromDate?: string;
  toDate?: string;
}

export function CategoryTable({ period, month, year, fromDate, toDate }: CategoryTableProps) {
  const { data, isLoading } = useSpendByCategory(period, month, year, fromDate, toDate);
  const currency = useCurrencyStore((s) => s.currency);

  return (
    <div className="rounded-2xl bg-surface-container-low p-6">
      <h2 className="font-display text-xl font-medium text-on-surface mb-4">
        Spend by Category
      </h2>

      {/* Header */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_0.5fr] gap-4 px-4 pb-2">
        <span className="font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant">
          Category
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant text-right">
          Budget
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant text-right">
          Spent
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant text-right">
          Remaining
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant text-right">
          % Total
        </span>
      </div>

      {/* Rows */}
      {isLoading || !data ? (
        <CategorySkeleton />
      ) : (
        <div className="space-y-2">
          {data.map((item) => (
            <CategoryRow key={item.category.id} item={item} currency={currency} />
          ))}
        </div>
      )}
    </div>
  );
}
