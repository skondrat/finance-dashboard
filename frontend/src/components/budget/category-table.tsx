"use client";

import { useMemo, useState } from "react";
import {
  useSpendByCategory,
  type SpendByCategoryItem,
} from "@/lib/queries/budget";
import { useCurrencyStore } from "@/stores/currency-store";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";

type SortColumn = "name" | "budget" | "spent" | "remaining" | "pct_of_total";
type SortDirection = "asc" | "desc";

function SortArrow({ direction, active }: { direction: SortDirection; active: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      className={cn(
        "ml-1 inline-block transition-opacity",
        active ? "opacity-100" : "opacity-0"
      )}
    >
      {direction === "desc" ? (
        <path d="M5 7L1 3h8L5 7z" fill="currentColor" />
      ) : (
        <path d="M5 3L1 7h8L5 3z" fill="currentColor" />
      )}
    </svg>
  );
}

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
      <div className="h-1.5 w-full rounded-full bg-on-surface-variant/10" />
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

function getValue(item: SpendByCategoryItem, col: SortColumn): string | number | null {
  switch (col) {
    case "name": return item.category.name;
    case "budget": return item.budget;
    case "spent": return item.spent;
    case "remaining": return item.remaining;
    case "pct_of_total": return item.pct_of_total;
  }
}

const SORT_TO_END_COLUMNS: SortColumn[] = ["budget", "remaining"];

function sortData(
  data: SpendByCategoryItem[],
  column: SortColumn | null,
  direction: SortDirection
): SpendByCategoryItem[] {
  if (!column) return data;

  const sortNullishToEnd = SORT_TO_END_COLUMNS.includes(column);

  return [...data].sort((a, b) => {
    const aVal = getValue(a, column);
    const bVal = getValue(b, column);

    // Nulls and zeros (for budget/remaining) sort to the end
    const aEmpty = aVal === null || (sortNullishToEnd && aVal === 0);
    const bEmpty = bVal === null || (sortNullishToEnd && bVal === 0);
    if (aEmpty && bEmpty) return 0;
    if (aEmpty) return 1;
    if (bEmpty) return -1;

    let cmp: number;
    if (typeof aVal === "string" && typeof bVal === "string") {
      cmp = aVal.localeCompare(bVal);
    } else {
      cmp = (aVal as number) - (bVal as number);
    }

    return direction === "asc" ? cmp : -cmp;
  });
}

interface CategoryTableProps {
  period: string;
  month?: number;
  year?: number;
  fromDate?: string;
  toDate?: string;
}

const COLUMNS: { key: SortColumn; label: string; align: string }[] = [
  { key: "name", label: "Category", align: "text-left" },
  { key: "budget", label: "Budget", align: "text-right" },
  { key: "spent", label: "Spent", align: "text-right" },
  { key: "remaining", label: "Remaining", align: "text-right" },
  { key: "pct_of_total", label: "% Total", align: "text-right" },
];

export function CategoryTable({ period, month, year, fromDate, toDate }: CategoryTableProps) {
  const { data, isLoading } = useSpendByCategory(period, month, year, fromDate, toDate);
  const currency = useCurrencyStore((s) => s.currency);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const sortedData = useMemo(() => {
    if (!data) return [];
    return sortData(data, sortColumn, sortDirection);
  }, [data, sortColumn, sortDirection]);

  function handleSort(col: SortColumn) {
    if (sortColumn === col) {
      setSortDirection((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortColumn(col);
      setSortDirection("desc");
    }
  }

  return (
    <div className="rounded-2xl bg-surface-container-low p-6">
      <h2 className="font-display text-xl font-medium text-on-surface mb-4">
        Spend by Category
      </h2>

      {/* Header */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_0.5fr] gap-4 px-4 pb-2">
        {COLUMNS.map((col) => (
          <button
            key={col.key}
            onClick={() => handleSort(col.key)}
            className={cn(
              "font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer select-none inline-flex items-center",
              col.align,
              col.align === "text-right" && "justify-end"
            )}
          >
            {col.label}
            <SortArrow
              direction={sortColumn === col.key ? sortDirection : "desc"}
              active={sortColumn === col.key}
            />
          </button>
        ))}
      </div>

      {/* Rows */}
      {isLoading || !data ? (
        <CategorySkeleton />
      ) : (
        <div className="space-y-2">
          {sortedData.map((item) => (
            <CategoryRow key={item.category.id} item={item} currency={currency} />
          ))}
        </div>
      )}
    </div>
  );
}
