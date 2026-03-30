"use client";

import { useState } from "react";
import { usePositions, type Position } from "@/lib/queries/portfolio";
import { useAccounts } from "@/lib/queries/accounts";
import { useCurrencyStore } from "@/stores/currency-store";
import {
  cn,
  formatCurrency,
  formatPercent,
  signedValue,
  valueColorClass,
} from "@/lib/utils";

type SortColumn =
  | "asset"
  | "buy_in"
  | "current"
  | "value"
  | "pl"
  | "weight";
type SortDirection = "asc" | "desc";

const COLUMNS: { key: SortColumn; label: string; align?: "right" }[] = [
  { key: "asset", label: "Asset" },
  { key: "buy_in", label: "Buy In", align: "right" },
  { key: "current", label: "Current", align: "right" },
  { key: "value", label: "Position", align: "right" },
  { key: "pl", label: "P/L", align: "right" },
  { key: "weight", label: "Weight", align: "right" },
];

function sortPositions(
  positions: Position[],
  column: SortColumn,
  direction: SortDirection
): Position[] {
  const sorted = [...positions].sort((a, b) => {
    let cmp = 0;
    switch (column) {
      case "asset":
        cmp = a.asset.ticker.localeCompare(b.asset.ticker);
        break;
      case "buy_in":
        cmp = a.avg_cost_basis - b.avg_cost_basis;
        break;
      case "current":
        cmp = a.current_price - b.current_price;
        break;
      case "value":
        cmp = a.current_value - b.current_value;
        break;
      case "pl":
        cmp = a.pnl_absolute - b.pnl_absolute;
        break;
      case "weight":
        cmp = a.weight - b.weight;
        break;
    }
    return direction === "asc" ? cmp : -cmp;
  });
  return sorted;
}

function PositionsSkeleton() {
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

export function PositionsList({
  onAccountChange,
}: {
  onAccountChange?: (accountId: string | undefined) => void;
} = {}) {
  const [selectedAccountId, setSelectedAccountId] = useState<
    string | undefined
  >(undefined);
  const { data: accounts } = useAccounts();
  const { data, isLoading } = usePositions(selectedAccountId);
  const currency = useCurrencyStore((s) => s.currency);
  const [sortColumn, setSortColumn] = useState<SortColumn>("value");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  function handleAccountChange(accountId: string | undefined) {
    setSelectedAccountId(accountId);
    onAccountChange?.(accountId);
  }

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  }

  const sorted = data ? sortPositions(data, sortColumn, sortDirection) : [];

  return (
    <div className="rounded-2xl bg-surface-container-low p-6">
      <h2 className="font-display text-xl font-medium text-on-surface mb-4">
        Positions
      </h2>

      {/* Account filter tabs */}
      {accounts && accounts.length > 0 && (
        <div className="flex items-center gap-4 mb-4 overflow-x-auto">
          <button
            onClick={() => handleAccountChange(undefined)}
            className={cn(
              "shrink-0 pb-1 font-mono text-xs uppercase tracking-[0.1em] transition-colors",
              selectedAccountId === undefined
                ? "text-on-surface border-b-2 border-on-surface"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            Aggregated
          </button>
          {accounts.map((account) => (
            <button
              key={account.id}
              onClick={() => handleAccountChange(account.id)}
              className={cn(
                "shrink-0 pb-1 font-mono text-xs uppercase tracking-[0.1em] transition-colors",
                selectedAccountId === account.id
                  ? "text-on-surface border-b-2 border-on-surface"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              {account.name}
            </button>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-4 pb-2">
        {COLUMNS.map((col) => (
          <button
            key={col.key}
            onClick={() => handleSort(col.key)}
            className={cn(
              "font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant transition-colors hover:text-on-surface",
              col.align === "right" && "text-right"
            )}
          >
            {col.label}
            {sortColumn === col.key && (
              <span className="ml-1">
                {sortDirection === "asc" ? "\u2191" : "\u2193"}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Rows */}
      {isLoading || !data ? (
        <PositionsSkeleton />
      ) : (
        <div className="space-y-2">
          {sorted.map((position) => (
            <div
              key={position.asset.id}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 items-center rounded-xl bg-surface-container-lowest px-4 py-3 transition-colors hover:bg-surface-container-low"
            >
              {/* Asset */}
              <div>
                <p className="font-mono text-sm font-medium text-on-surface">
                  {position.asset.ticker}
                </p>
                <p className="font-body text-xs text-on-surface-variant">
                  {position.asset.name}
                </p>
              </div>

              {/* Buy In */}
              <p className="text-right font-mono text-sm text-on-surface">
                {formatCurrency(position.avg_cost_basis, currency)}
              </p>

              {/* Current Price */}
              <p className="text-right font-mono text-sm text-on-surface">
                {position.current_price > 0
                  ? formatCurrency(position.current_price, currency)
                  : "—"}
              </p>

              {/* Position (value + qty) */}
              <div className="text-right">
                <p className="font-mono text-sm text-on-surface">
                  {formatCurrency(position.current_value, currency)}
                </p>
                <p className="font-mono text-xs text-on-surface-variant">
                  {parseFloat(String(position.quantity))} units
                </p>
              </div>

              {/* P/L */}
              <div className="text-right">
                <p
                  className={cn(
                    "font-mono text-sm inline-block rounded-md px-1.5 py-0.5",
                    valueColorClass(position.pnl_absolute)
                  )}
                >
                  {signedValue(position.pnl_absolute, currency)}
                </p>
                <p
                  className={cn(
                    "font-mono text-xs mt-0.5",
                    position.pnl_percent >= 0
                      ? "text-on-tertiary-container"
                      : "text-on-error-container"
                  )}
                >
                  {formatPercent(position.pnl_percent)}
                </p>
              </div>

              {/* Weight */}
              <p className="text-right font-mono text-sm text-on-surface">
                {formatPercent(position.weight)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
