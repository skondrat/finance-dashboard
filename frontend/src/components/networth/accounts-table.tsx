"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  useNetworthSummary,
  useUpdateNetworthAccount,
  useDeleteNetworthAccount,
  useUpdateSnapshot,
  fetchPortfolioValueAtDate,
  type NetworthSummaryAccount,
  type NetworthSnapshot,
} from "@/lib/queries/networth";
import { useCurrencyStore } from "@/stores/currency-store";
import { cn, formatCurrency } from "@/lib/utils";

type BreakdownEntry = NonNullable<NetworthSnapshot["breakdown"]>[number];

const HISTORICAL_CURRENCIES = ["EUR", "USD", "PLN", "GBP"] as const;

function entryCurrency(
  entry: BreakdownEntry,
  fallbackCurrency: string,
  liveAccounts: NetworthSummaryAccount[] | undefined
): string {
  if (entry.currency) return entry.currency;
  const match = liveAccounts?.find(
    (a) => a.source === "manual" && a.name === entry.name
  );
  return match?.original_currency ?? fallbackCurrency;
}

type SortColumn = "name" | "type" | "currency" | "balance" | "percentage";
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

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-14 animate-pulse rounded-xl bg-surface-container-lowest"
        />
      ))}
    </div>
  );
}

interface InlineEditCellProps {
  value: number;
  accountId: string;
  currencyCode: string;
}

function InlineEditCell({ value, accountId, currencyCode }: InlineEditCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const updateMutation = useUpdateNetworthAccount();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  function handleSave() {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed) && parsed !== value) {
      updateMutation.mutate({ id: accountId, balance: parsed });
    }
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setEditValue(String(value));
      setIsEditing(false);
    }
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="number"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        step="0.01"
        className="w-28 rounded-md bg-surface-container-highest px-2 py-1 font-mono text-sm text-on-surface outline-none focus:ring-1 focus:ring-on-surface-variant/20"
      />
    );
  }

  return (
    <button
      onClick={() => {
        setEditValue(String(value));
        setIsEditing(true);
      }}
      className="font-mono text-sm text-on-surface cursor-text hover:underline decoration-dotted underline-offset-4"
      title="Click to edit"
    >
      {formatCurrency(value, currencyCode)}
    </button>
  );
}

function sortAccounts(
  accounts: NetworthSummaryAccount[],
  column: SortColumn | null,
  direction: SortDirection
): NetworthSummaryAccount[] {
  if (!column) return accounts;

  return [...accounts].sort((a, b) => {
    let cmp: number;
    switch (column) {
      case "name":
        cmp = a.name.localeCompare(b.name);
        break;
      case "type": {
        const aType = a.source === "manual" ? (a.account_type ?? "") : "Investment";
        const bType = b.source === "manual" ? (b.account_type ?? "") : "Investment";
        cmp = aType.localeCompare(bType);
        break;
      }
      case "currency": {
        const aCur = a.source === "manual" ? a.original_currency : "";
        const bCur = b.source === "manual" ? b.original_currency : "";
        cmp = aCur.localeCompare(bCur);
        break;
      }
      case "balance":
        cmp = a.converted_balance - b.converted_balance;
        break;
      case "percentage":
        cmp = a.percentage - b.percentage;
        break;
    }
    return direction === "asc" ? cmp : -cmp;
  });
}

const COLUMNS: { key: SortColumn; label: string; align: string }[] = [
  { key: "name", label: "Account", align: "text-left" },
  { key: "type", label: "Type", align: "text-left" },
  { key: "currency", label: "Currency", align: "text-left" },
  { key: "balance", label: "Balance", align: "text-right" },
  { key: "percentage", label: "% of Total", align: "text-right" },
];

interface HistoricalInlineEditCellProps {
  value: number;
  currency: string;
  snapshotId: string;
  breakdown: BreakdownEntry[];
  entryIndex: number;
}

function HistoricalInlineEditCell({
  value,
  currency,
  snapshotId,
  breakdown,
  entryIndex,
}: HistoricalInlineEditCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const updateMutation = useUpdateSnapshot();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  function handleSave() {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed) && parsed !== value) {
      const newBreakdown = breakdown.map((entry, i) =>
        i === entryIndex ? { ...entry, balance: parsed } : entry
      );
      updateMutation.mutate({
        id: snapshotId,
        breakdown: newBreakdown,
      });
    }
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setEditValue(String(value));
      setIsEditing(false);
    }
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="number"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        step="0.01"
        className="w-28 rounded-md bg-surface-container-highest px-2 py-1 font-mono text-sm text-on-surface outline-none focus:ring-1 focus:ring-on-surface-variant/20"
      />
    );
  }

  return (
    <button
      onClick={() => {
        setEditValue(String(value));
        setIsEditing(true);
      }}
      className="font-mono text-sm text-on-surface cursor-text hover:underline decoration-dotted underline-offset-4"
      title="Click to edit"
    >
      {formatCurrency(value, currency)}
    </button>
  );
}

interface LiveCurrencyCellProps {
  currency: string;
  accountId: string;
}

function LiveCurrencyCell({ currency, accountId }: LiveCurrencyCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const updateMutation = useUpdateNetworthAccount();

  function handleChange(next: string) {
    if (next !== currency) {
      updateMutation.mutate({ id: accountId, currency: next });
    }
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <select
        autoFocus
        value={currency}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setIsEditing(false)}
        className="rounded-md bg-surface-container-highest px-1 py-0.5 font-mono text-xs uppercase text-on-surface outline-none focus:ring-1 focus:ring-on-surface-variant/20 cursor-pointer"
      >
        {HISTORICAL_CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="font-mono text-xs uppercase text-on-surface-variant hover:text-on-surface hover:underline decoration-dotted underline-offset-4 text-left"
      title="Click to change currency"
    >
      {currency || "—"}
    </button>
  );
}

interface HistoricalCurrencyCellProps {
  currency: string;
  snapshotId: string;
  breakdown: BreakdownEntry[];
  entryIndex: number;
}

function HistoricalCurrencyCell({
  currency,
  snapshotId,
  breakdown,
  entryIndex,
}: HistoricalCurrencyCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const updateMutation = useUpdateSnapshot();

  function handleChange(next: string) {
    if (next !== currency) {
      const newBreakdown = breakdown.map((entry, i) =>
        i === entryIndex ? { ...entry, currency: next } : entry
      );
      updateMutation.mutate({
        id: snapshotId,
        breakdown: newBreakdown,
      });
    }
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <select
        autoFocus
        value={currency}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setIsEditing(false)}
        className="rounded-md bg-surface-container-highest px-1 py-0.5 font-mono text-xs uppercase text-on-surface outline-none focus:ring-1 focus:ring-on-surface-variant/20 cursor-pointer"
      >
        {HISTORICAL_CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="font-mono text-xs uppercase text-on-surface-variant hover:text-on-surface hover:underline decoration-dotted underline-offset-4 text-left"
      title="Click to change currency"
    >
      {currency || "—"}
    </button>
  );
}

interface HistoricalNameCellProps {
  name: string;
  isEditing: boolean;
  onStartEdit: () => void;
  snapshotId: string;
  snapshotCurrency: string;
  breakdown: BreakdownEntry[];
  entryIndex: number;
  onDoneEdit: () => void;
}

function HistoricalNameCell({
  name,
  isEditing,
  onStartEdit,
  snapshotId,
  snapshotCurrency,
  breakdown,
  entryIndex,
  onDoneEdit,
}: HistoricalNameCellProps) {
  if (isEditing) {
    return (
      <HistoricalNameInput
        initialName={name}
        snapshotId={snapshotId}
        snapshotCurrency={snapshotCurrency}
        breakdown={breakdown}
        entryIndex={entryIndex}
        onDone={onDoneEdit}
      />
    );
  }

  return (
    <button
      onClick={onStartEdit}
      className="font-body text-sm text-on-surface truncate text-left hover:underline decoration-dotted underline-offset-4"
      title="Click to rename"
    >
      {name}
    </button>
  );
}

interface HistoricalNameInputProps {
  initialName: string;
  snapshotId: string;
  snapshotCurrency: string;
  breakdown: BreakdownEntry[];
  entryIndex: number;
  onDone: () => void;
}

function HistoricalNameInput({
  initialName,
  snapshotId,
  snapshotCurrency,
  breakdown,
  entryIndex,
  onDone,
}: HistoricalNameInputProps) {
  const [editValue, setEditValue] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateMutation = useUpdateSnapshot();

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function handleSave() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== initialName) {
      const newBreakdown = breakdown.map((entry, i) =>
        i === entryIndex ? { ...entry, name: trimmed } : entry
      );
      updateMutation.mutate({
        id: snapshotId,
        breakdown: newBreakdown,
      });
    }
    onDone();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") onDone();
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      className="w-full rounded-md bg-surface-container-highest px-2 py-1 font-body text-sm text-on-surface outline-none focus:ring-1 focus:ring-on-surface-variant/20"
    />
  );
}

interface AccountsTableProps {
  showDebts: boolean;
  isCurrentMonth: boolean;
  selectedMonthKey: string;
  historicalSnapshot: NetworthSnapshot | null;
  onEdit: (acct: {
    id: string;
    name: string;
    balance: number;
    currency: string;
    account_type: string;
  }) => void;
}

export function AccountsTable({
  showDebts,
  isCurrentMonth,
  selectedMonthKey,
  historicalSnapshot,
  onEdit,
}: AccountsTableProps) {
  const { data: summary, isLoading } = useNetworthSummary();
  const currency = useCurrencyStore((s) => s.currency);
  const deleteMutation = useDeleteNetworthAccount();
  const updateSnapshotMutation = useUpdateSnapshot();
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [renamingIndex, setRenamingIndex] = useState<number | null>(null);

  const visibleAccounts = useMemo(() => {
    if (!summary) return { manual: [], investment: [] };
    const filtered = showDebts
      ? summary.accounts
      : summary.accounts.filter((a) => a.account_type !== "debt");

    const manual = sortAccounts(
      filtered.filter((a) => a.source === "manual"),
      sortColumn,
      sortDirection
    );
    const investment = sortAccounts(
      filtered.filter((a) => a.source === "investment"),
      sortColumn,
      sortDirection
    );
    return { manual, investment };
  }, [summary, showDebts, sortColumn, sortDirection]);

  function handleSort(col: SortColumn) {
    if (sortColumn === col) {
      setSortDirection((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortColumn(col);
      setSortDirection("desc");
    }
  }

  if (isCurrentMonth && (isLoading || !summary)) {
    return (
      <div className="rounded-2xl bg-surface-container-low p-6">
        <TableSkeleton />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Historical view (past month selected)
  // ---------------------------------------------------------------------------

  if (!isCurrentMonth) {
    if (!historicalSnapshot) {
      return (
        <div className="rounded-2xl bg-surface-container-low p-6 space-y-4">
          <div className="grid grid-cols-[2fr_0.8fr_0.6fr_1fr_0.8fr_0.5fr] gap-2 px-4 pb-2">
            {COLUMNS.map((col) => (
              <span
                key={col.key}
                className={cn(
                  "font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant select-none inline-flex items-center",
                  col.align,
                  col.align === "text-right" && "justify-end"
                )}
              >
                {col.label}
              </span>
            ))}
            <div />
          </div>
          <div className="rounded-xl bg-surface-container-lowest px-4 py-10 text-center space-y-2">
            <p className="font-body text-sm text-on-surface">
              No net-worth data captured for {selectedMonthKey}.
            </p>
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant">
              Use Settings → Import previous networth to add it.
            </p>
          </div>
        </div>
      );
    }

    const allBreakdown: BreakdownEntry[] = historicalSnapshot.breakdown ?? [];
    const visibleManual: Array<{ entry: BreakdownEntry; index: number }> = [];
    const visibleInvestment: Array<{ entry: BreakdownEntry; index: number }> = [];
    let visibleConvertedTotal = 0;

    allBreakdown.forEach((entry, index) => {
      const converted = entry.converted_balance ?? entry.balance ?? 0;
      if (entry.source === "manual") {
        if (!showDebts && entry.account_type === "debt") return;
        visibleManual.push({ entry, index });
        visibleConvertedTotal += converted;
      } else if (entry.source === "investment") {
        visibleInvestment.push({ entry, index });
        visibleConvertedTotal += converted;
      }
    });

    const handleRemoveRow = (index: number, name: string) => {
      if (!confirm(`Remove "${name}" from ${selectedMonthKey}?`)) return;
      const newBreakdown = allBreakdown.filter((_, i) => i !== index);
      updateSnapshotMutation.mutate({
        id: historicalSnapshot.id,
        breakdown: newBreakdown.length > 0 ? newBreakdown : null,
      });
    };

    const handleResetInvestment = async (index: number, name: string) => {
      const [yearStr, monthStr] = selectedMonthKey.split("-");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const lastDay = new Date(year, month, 0).getDate();
      const asOf = `${selectedMonthKey}-${String(lastDay).padStart(2, "0")}`;
      try {
        const res = await fetchPortfolioValueAtDate(
          name,
          asOf,
          historicalSnapshot.currency
        );
        if (!res.found) {
          alert(`No portfolio account named "${name}" found.`);
          return;
        }
        const newBreakdown = allBreakdown.map((entry, i) =>
          i === index
            ? { ...entry, balance: res.value, currency: res.currency }
            : entry
        );
        updateSnapshotMutation.mutate({
          id: historicalSnapshot.id,
          breakdown: newBreakdown,
        });
      } catch (e) {
        alert(`Failed to fetch portfolio value: ${e instanceof Error ? e.message : "unknown error"}`);
      }
    };

    const renderHistoricalRow = ({
      entry,
      index,
    }: {
      entry: BreakdownEntry;
      index: number;
    }) => {
      const isManual = entry.source === "manual";
      const rowCurrency = entryCurrency(
        entry,
        historicalSnapshot.currency,
        summary?.accounts
      );
      const rowConverted = entry.converted_balance ?? entry.balance ?? 0;
      const pct =
        visibleConvertedTotal > 0
          ? (rowConverted / visibleConvertedTotal) * 100
          : 0;

      return (
        <div
          key={`hist-${index}`}
          className="grid grid-cols-[2fr_0.8fr_0.6fr_1fr_0.8fr_0.5fr] items-center gap-2 rounded-xl bg-surface-container-lowest px-4 py-3"
        >
          {/* Name */}
          <div className="flex items-center gap-2 min-w-0">
            <HistoricalNameCell
              name={entry.name}
              isEditing={renamingIndex === index}
              onStartEdit={() => setRenamingIndex(index)}
              snapshotId={historicalSnapshot.id}
              snapshotCurrency={historicalSnapshot.currency}
              breakdown={allBreakdown}
              entryIndex={index}
              onDoneEdit={() => setRenamingIndex(null)}
            />
          </div>

          {/* Type */}
          <p className="font-mono text-xs text-on-surface-variant uppercase">
            {isManual ? entry.account_type ?? "" : "Investment"}
          </p>

          {/* Currency — each row in its own currency, clickable to change */}
          <div>
            <HistoricalCurrencyCell
              currency={rowCurrency}
              snapshotId={historicalSnapshot.id}
              breakdown={allBreakdown}
              entryIndex={index}
            />
          </div>

          {/* Balance — in row.currency */}
          <div className="text-right">
            <HistoricalInlineEditCell
              value={entry.balance}
              currency={rowCurrency}
              snapshotId={historicalSnapshot.id}
              breakdown={allBreakdown}
              entryIndex={index}
            />
          </div>

          {/* Percentage */}
          <p className="text-right font-mono text-sm text-on-surface-variant">
            {pct.toFixed(1)}%
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setRenamingIndex(index)}
              className="font-mono text-lg text-on-surface-variant transition-colors hover:text-on-surface"
              title="Rename"
            >
              ✎
            </button>
            <button
              onClick={() => handleRemoveRow(index, entry.name)}
              disabled={updateSnapshotMutation.isPending}
              className="font-mono text-lg text-on-surface-variant transition-colors hover:text-on-error-container disabled:opacity-50"
              title="Remove from this month"
            >
              &times;
            </button>
            {!isManual && (
              <button
                onClick={() => handleResetInvestment(index, entry.name)}
                disabled={updateSnapshotMutation.isPending}
                className="font-mono text-base text-on-surface-variant transition-colors hover:text-primary disabled:opacity-50"
                title={`Reset to portfolio value at end of ${selectedMonthKey}`}
              >
                ↻
              </button>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="rounded-2xl bg-surface-container-low p-6 space-y-4">
        {/* Header */}
        <div className="grid grid-cols-[2fr_0.8fr_0.6fr_1fr_0.8fr_0.5fr] gap-2 px-4 pb-2">
          {COLUMNS.map((col) => (
            <span
              key={col.key}
              className={cn(
                "font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant select-none inline-flex items-center",
                col.align,
                col.align === "text-right" && "justify-end"
              )}
            >
              {col.label}
            </span>
          ))}
          <div />
        </div>

        {visibleManual.length > 0 && (
          <div className="space-y-2">
            <p className="px-4 font-mono text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/60">
              Current Accounts
            </p>
            {visibleManual.map(renderHistoricalRow)}
          </div>
        )}

        {visibleInvestment.length > 0 && (
          <div className="space-y-2">
            <p className="px-4 font-mono text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/60">
              Investment Accounts
            </p>
            {visibleInvestment.map(renderHistoricalRow)}
          </div>
        )}

        {visibleManual.length === 0 && visibleInvestment.length === 0 && (
          <p className="py-4 text-center font-body text-sm text-on-surface-variant">
            No accounts recorded for this month.
          </p>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Live view (current month) — unchanged below
  // ---------------------------------------------------------------------------

  if (!summary) {
    return null;
  }

  function renderRow(acct: NetworthSummaryAccount) {
    const isManual = acct.source === "manual";

    return (
      <div
        key={`${acct.source}-${acct.id}`}
        className="grid grid-cols-[2fr_0.8fr_0.6fr_1fr_0.8fr_0.5fr] items-center gap-2 rounded-xl bg-surface-container-lowest px-4 py-3"
      >
        {/* Name */}
        <div className="flex items-center gap-2 min-w-0">
          <p className="font-body text-sm text-on-surface truncate">
            {acct.name}
          </p>
          {!acct.conversion_available && (
            <span
              className="text-xs text-on-error-container"
              title="Currency conversion unavailable"
            >
              ⚠
            </span>
          )}
        </div>

        {/* Type / Source */}
        <p className="font-mono text-xs text-on-surface-variant uppercase">
          {isManual ? acct.account_type : "Investment"}
        </p>

        {/* Currency */}
        <div>
          {isManual ? (
            <LiveCurrencyCell currency={acct.original_currency} accountId={acct.id} />
          ) : (
            <p className="font-mono text-xs text-on-surface-variant uppercase" />
          )}
        </div>

        {/* Balance */}
        <div className="text-right">
          {isManual ? (
            <InlineEditCell value={acct.balance} accountId={acct.id} currencyCode={acct.original_currency} />
          ) : (
            <p className="font-mono text-sm text-on-surface">
              {formatCurrency(acct.converted_balance, currency)}
            </p>
          )}
        </div>

        {/* Percentage */}
        <p className="text-right font-mono text-sm text-on-surface-variant">
          {acct.percentage.toFixed(1)}%
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          {isManual && (
            <>
              <button
                onClick={() =>
                  onEdit({
                    id: acct.id,
                    name: acct.name,
                    balance: acct.balance,
                    currency: acct.original_currency,
                    account_type: acct.account_type ?? "bank",
                  })
                }
                className="font-mono text-lg text-on-surface-variant transition-colors hover:text-on-surface"
                title="Edit"
              >
                ✎
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete "${acct.name}"?`)) {
                    deleteMutation.mutate(acct.id);
                  }
                }}
                disabled={deleteMutation.isPending}
                className="font-mono text-lg text-on-surface-variant transition-colors hover:text-on-error-container disabled:opacity-50"
                title="Delete"
              >
                &times;
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-surface-container-low p-6 space-y-4">
      {/* Header */}
      <div className="grid grid-cols-[2fr_0.8fr_0.6fr_1fr_0.8fr_0.5fr] gap-2 px-4 pb-2">
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
        <div />
      </div>

      {/* Manual accounts section */}
      {visibleAccounts.manual.length > 0 && (
        <div className="space-y-2">
          <p className="px-4 font-mono text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/60">
            Current Accounts
          </p>
          {visibleAccounts.manual.map(renderRow)}
        </div>
      )}

      {/* Investment accounts section */}
      {visibleAccounts.investment.length > 0 && (
        <div className="space-y-2">
          <p className="px-4 font-mono text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/60">
            Investment Accounts
          </p>
          {visibleAccounts.investment.map(renderRow)}
        </div>
      )}

      {summary.accounts.length === 0 && (
        <p className="py-4 text-center font-body text-sm text-on-surface-variant">
          No accounts to display.
        </p>
      )}
    </div>
  );
}
