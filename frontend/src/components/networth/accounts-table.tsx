"use client";

import { useState, useRef, useEffect } from "react";
import {
  useNetworthSummary,
  useUpdateNetworthAccount,
  useDeleteNetworthAccount,
  type NetworthSummaryAccount,
} from "@/lib/queries/networth";
import { useCurrencyStore } from "@/stores/currency-store";
import { formatCurrency } from "@/lib/utils";

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

  if (isLoading || !summary) {
    return (
      <div className="rounded-2xl bg-surface-container-low p-6">
        <TableSkeleton />
      </div>
    );
  }

  const visibleAccounts = showDebts
    ? summary.accounts
    : summary.accounts.filter((a) => a.account_type !== "debt");

  const manualAccounts = visibleAccounts.filter(
    (a) => a.source === "manual"
  );
  const investmentAccounts = visibleAccounts.filter(
    (a) => a.source === "investment"
  );

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
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant">
          Account
        </p>
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant">
          Type
        </p>
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant">
          Currency
        </p>
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant text-right">
          Balance
        </p>
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant text-right">
          % of Total
        </p>
        <div />
      </div>

      {/* Manual accounts section */}
      {manualAccounts.length > 0 && (
        <div className="space-y-2">
          <p className="px-4 font-mono text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/60">
            Current Accounts
          </p>
          {manualAccounts.map(renderRow)}
        </div>
      )}

      {/* Investment accounts section */}
      {investmentAccounts.length > 0 && (
        <div className="space-y-2">
          <p className="px-4 font-mono text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/60">
            Investment Accounts
          </p>
          {investmentAccounts.map(renderRow)}
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
