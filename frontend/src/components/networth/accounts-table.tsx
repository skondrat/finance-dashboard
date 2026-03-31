"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  useNetworthSummary,
  useUpdateNetworthAccount,
  useDeleteNetworthAccount,
  type NetworthSummaryAccount,
} from "@/lib/queries/networth";
import { useCurrencyStore } from "@/stores/currency-store";
import { cn, formatCurrency } from "@/lib/utils";

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

interface AccountsTableProps {
  showDebts: boolean;
  onEdit: (acct: {
    id: string;
    name: string;
    balance: number;
    currency: string;
    account_type: string;
  }) => void;
}

export function AccountsTable({ showDebts, onEdit }: AccountsTableProps) {
  const { data: summary, isLoading } = useNetworthSummary();
  const currency = useCurrencyStore((s) => s.currency);
  const deleteMutation = useDeleteNetworthAccount();
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

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

  if (isLoading || !summary) {
    return (
      <div className="rounded-2xl bg-surface-container-low p-6">
        <TableSkeleton />
      </div>
    );
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
        <p className="font-mono text-xs text-on-surface-variant uppercase">
          {isManual ? acct.original_currency : ""}
        </p>

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
