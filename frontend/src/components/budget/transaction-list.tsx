"use client";

import { useMemo, useState } from "react";
import {
  useBudgetTransactions,
  useCategories,
  useUpdateBudgetTransaction,
  useDeleteBudgetTransaction,
  type BudgetTransaction,
} from "@/lib/queries/budget";
import { useCurrencyStore } from "@/stores/currency-store";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

type SortColumn = "date" | "description" | "amount" | "category";
type SortDirection = "asc" | "desc";

const PAGE_SIZE = 50;

function SortArrow({
  direction,
  active,
}: {
  direction: SortDirection;
  active: boolean;
}) {
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

function TransactionSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-12 animate-pulse rounded-xl bg-surface-container-lowest"
        />
      ))}
    </div>
  );
}

interface TransactionListProps {
  from?: string;
  to?: string;
  filterCategoryId?: string | null;
  onClearCategoryFilter?: () => void;
}

export function TransactionList({
  from,
  to,
  filterCategoryId,
  onClearCategoryFilter,
}: TransactionListProps) {
  const currency = useCurrencyStore((s) => s.currency);
  const { data: categories } = useCategories();
  const updateTransaction = useUpdateBudgetTransaction();
  const deleteTransaction = useDeleteBudgetTransaction();

  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<SortColumn>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchText, setSearchText] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editingAmount, setEditingAmount] = useState("");

  // Use filterCategoryId prop if provided, otherwise use local dropdown state
  const activeCategoryId = filterCategoryId ?? selectedCategoryId;

  const { data: transactions, isLoading } = useBudgetTransactions({
    from,
    to,
    page,
    per_page: PAGE_SIZE,
    category_id: activeCategoryId ?? undefined,
  });

  // Build category lookup map
  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    if (categories) {
      for (const cat of categories) {
        map.set(cat.id, { name: cat.name, color: cat.color });
      }
    }
    return map;
  }, [categories]);

  function getCategoryInfo(categoryId: string | null) {
    if (!categoryId) return { name: "Uncategorized", color: "#6B7280" };
    return categoryMap.get(categoryId) ?? { name: "Unknown", color: "#6B7280" };
  }

  // Client-side search filter
  const filtered = useMemo(() => {
    if (!transactions) return [];
    if (!searchText.trim()) return transactions;
    const term = searchText.toLowerCase();
    return transactions.filter((tx) =>
      tx.description.toLowerCase().includes(term)
    );
  }, [transactions, searchText]);

  // Client-side sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp: number;
      switch (sortColumn) {
        case "date":
          cmp = a.date.localeCompare(b.date);
          break;
        case "description":
          cmp = a.description.localeCompare(b.description);
          break;
        case "amount":
          cmp = a.amount - b.amount;
          break;
        case "category": {
          const aCat = getCategoryInfo(a.category_id).name;
          const bCat = getCategoryInfo(b.category_id).name;
          cmp = aCat.localeCompare(bCat);
          break;
        }
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortColumn, sortDirection, categoryMap]);

  function handleSort(col: SortColumn) {
    if (sortColumn === col) {
      setSortDirection((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortColumn(col);
      setSortDirection(col === "date" ? "desc" : "asc");
    }
  }

  function handleCategoryFilterChange(value: string) {
    if (filterCategoryId !== undefined && filterCategoryId !== null) {
      // External filter is active — clear it first
      onClearCategoryFilter?.();
    }
    setSelectedCategoryId(value || null);
    setPage(1);
  }

  const COLUMNS: { key: SortColumn; label: string; align: string }[] = [
    { key: "date", label: "Date", align: "text-left" },
    { key: "description", label: "Description", align: "text-left" },
    { key: "amount", label: "Amount", align: "text-right" },
    { key: "category", label: "Category", align: "text-left" },
  ];

  const hasMore = transactions?.length === PAGE_SIZE;

  return (
    <div id="transaction-list" className="rounded-2xl bg-surface-container-low p-6">
      <h2 className="font-display text-xl font-medium text-on-surface mb-4">
        Transactions
      </h2>

      {/* Search + Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
        {/* Search input */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by description..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full rounded-lg border border-on-surface-variant/20 bg-surface-container-lowest px-3 py-2 pl-9 font-body text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-on-surface-variant/40"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchText && (
            <button
              onClick={() => setSearchText("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Category filter dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={activeCategoryId ?? ""}
            onChange={(e) => handleCategoryFilterChange(e.target.value)}
            className="rounded-lg border border-on-surface-variant/20 bg-surface-container-lowest px-3 py-2 font-body text-sm text-on-surface focus:outline-none focus:border-on-surface-variant/40 appearance-none cursor-pointer min-w-[160px]"
          >
            <option value="">All Categories</option>
            <option value="uncategorized">Uncategorized</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {activeCategoryId && (
            <button
              onClick={() => {
                onClearCategoryFilter?.();
                setSelectedCategoryId(null);
                setPage(1);
              }}
              className="rounded-lg px-2 py-2 text-on-surface-variant hover:text-on-surface transition-colors"
              title="Clear filter"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Result count */}
        {searchText && (
          <span className="font-mono text-xs text-on-surface-variant">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[100px_1fr_140px_160px_36px] gap-4 px-4 pb-2">
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
        {/* Empty header for actions column */}
        <div />
      </div>

      {/* Table body */}
      {isLoading ? (
        <TransactionSkeleton />
      ) : sorted.length === 0 ? (
        <div className="py-12 text-center">
          <p className="font-body text-sm text-on-surface-variant">
            {searchText || activeCategoryId
              ? "No transactions match your filters."
              : "No transactions for this period."}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {sorted.map((tx) => {
            const cat = getCategoryInfo(tx.category_id);
            const isEditing = editingTxId === tx.id;
            return (
              <div
                key={tx.id}
                className="grid grid-cols-[100px_1fr_140px_160px_36px] gap-4 items-center rounded-xl bg-surface-container-lowest px-4 py-2.5"
              >
                {/* Date */}
                <span className="font-mono text-sm text-on-surface-variant">
                  {formatDate(tx.date)}
                </span>

                {/* Description */}
                <span className="font-body text-sm text-on-surface truncate" title={tx.description}>
                  {tx.description}
                </span>

                {/* Amount — inline editable */}
                {isEditing ? (
                  <form
                    className="flex items-center justify-end gap-1"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const parsed = parseFloat(editingAmount);
                      if (isNaN(parsed)) return;
                      updateTransaction.mutate(
                        { id: tx.id, amount: parsed },
                        { onSuccess: () => setEditingTxId(null) }
                      );
                    }}
                  >
                    <input
                      type="text"
                      inputMode="decimal"
                      autoFocus
                      value={editingAmount}
                      onChange={(e) => setEditingAmount(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditingTxId(null);
                      }}
                      onBlur={() => setEditingTxId(null)}
                      className={cn(
                        "w-[90px] rounded border bg-surface-container-lowest px-1.5 py-0.5 text-right font-mono text-sm text-on-surface focus:outline-none",
                        isNaN(parseFloat(editingAmount))
                          ? "border-on-error-container"
                          : "border-on-surface-variant/30 focus:border-on-surface-variant/60"
                      )}
                    />
                  </form>
                ) : (
                  <button
                    className={cn(
                      "group flex items-center justify-end gap-1 text-right font-mono text-sm cursor-pointer",
                      tx.amount < 0
                        ? "text-on-error-container"
                        : "text-on-tertiary-container"
                    )}
                    title="Click to edit amount"
                    onClick={() => {
                      setEditingTxId(tx.id);
                      setEditingAmount(String(tx.amount));
                    }}
                  >
                    {formatCurrency(tx.amount, currency)}
                    <svg
                      className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                )}

                {/* Category */}
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <select
                    value={tx.category_id ?? ""}
                    onChange={(e) => {
                      const newCategoryId = e.target.value || null;
                      updateTransaction.mutate({
                        id: tx.id,
                        category_id: newCategoryId,
                      });
                    }}
                    className="flex-1 min-w-0 truncate bg-transparent font-body text-sm text-on-surface-variant cursor-pointer focus:outline-none hover:text-on-surface transition-colors pr-4"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath d='M5 7L1 3h8z' fill='%236B7280'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0 center', WebkitAppearance: 'none', appearance: 'none' as const }}
                  >
                    <option value="">Uncategorized</option>
                    {categories?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Delete button */}
                <button
                  title="Delete transaction"
                  disabled={deleteTransaction.isPending}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Delete this transaction? This cannot be undone."
                      )
                    ) {
                      deleteTransaction.mutate(tx.id);
                    }
                  }}
                  className="flex items-center justify-center h-7 w-7 rounded-lg text-on-surface-variant/40 hover:text-on-error-container hover:bg-on-error-container/10 transition-colors disabled:opacity-30"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {(page > 1 || hasMore) && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-on-surface-variant/10">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={cn(
              "rounded-lg px-3 py-1.5 font-mono text-xs uppercase tracking-[0.1em] transition-colors",
              page === 1
                ? "text-on-surface-variant/30 cursor-not-allowed"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest"
            )}
          >
            Previous
          </button>
          <span className="font-mono text-xs text-on-surface-variant">
            Page {page}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
            className={cn(
              "rounded-lg px-3 py-1.5 font-mono text-xs uppercase tracking-[0.1em] transition-colors",
              !hasMore
                ? "text-on-surface-variant/30 cursor-not-allowed"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest"
            )}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
