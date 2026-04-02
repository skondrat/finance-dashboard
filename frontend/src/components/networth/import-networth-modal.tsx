"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useCreateManualSnapshot } from "@/lib/queries/networth";
import { useNetworthSummary } from "@/lib/queries/networth";
import { useCurrencyStore } from "@/stores/currency-store";
import { formatCurrency, cn } from "@/lib/utils";

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
] as const;

function getYearOptions(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= currentYear - 10; y--) {
    years.push(y);
  }
  return years;
}

interface ImportNetworthModalProps {
  open: boolean;
  onClose: () => void;
}

export function ImportNetworthModal({ open, onClose }: ImportNetworthModalProps) {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [year, setYear] = useState(String(now.getFullYear()));
  const currency = useCurrencyStore((s) => s.currency);

  const { data: summary } = useNetworthSummary();
  const mutation = useCreateManualSnapshot();

  const accounts = summary?.accounts ?? [];
  const hasAccounts = accounts.length > 0;

  // Per-account balances, all default to 0
  const [balances, setBalances] = useState<number[]>([]);

  // Reset balances when modal opens or accounts change
  useEffect(() => {
    if (open && accounts.length > 0) {
      setBalances(accounts.map(() => 0));
    }
  }, [open, accounts.length]);

  const liveTotal = balances.reduce((sum, b) => sum + (b || 0), 0);

  function handleBalanceChange(index: number, value: string) {
    setBalances((prev) => {
      const next = [...prev];
      next[index] = parseFloat(value) || 0;
      return next;
    });
  }

  function handleClose() {
    mutation.reset();
    setBalances([]);
    onClose();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!hasAccounts) return;

    const snapshotMonth = `${year}-${month}`;
    const breakdown = accounts.map((acct, i) => ({
      name: acct.name,
      balance: balances[i] ?? 0,
      source: acct.source,
      account_type: acct.account_type,
    }));

    mutation.mutate(
      {
        snapshot_month: snapshotMonth,
        total_networth: liveTotal,
        currency,
        breakdown,
      },
      { onSuccess: handleClose }
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-on-surface/40"
        onClick={handleClose}
      />

      <div className="relative z-10 w-full max-w-lg mx-4 rounded-2xl bg-surface-container-lowest p-6 shadow-ambient max-h-[85vh] flex flex-col">
        <h2 className="font-display text-xl font-medium text-on-surface mb-6">
          Import Previous Networth
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 min-h-0">
          {/* Month/Year selector */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant mb-1.5">
                Month
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full appearance-none rounded-md bg-surface-container-highest px-3 py-2.5 font-body text-sm text-on-surface focus:bg-surface-container-lowest focus:outline focus:outline-outline-variant/20"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant mb-1.5">
                Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full appearance-none rounded-md bg-surface-container-highest px-3 py-2.5 font-body text-sm text-on-surface focus:bg-surface-container-lowest focus:outline focus:outline-outline-variant/20"
              >
                {getYearOptions().map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Account breakdown or no-accounts message */}
          {!hasAccounts ? (
            <p className="font-mono text-sm text-on-surface-variant py-4 text-center">
              Add accounts first to import historical net worth
            </p>
          ) : (
            <div className="overflow-y-auto min-h-0 space-y-3 pr-1">
              {accounts.map((acct, i) => (
                <div key={acct.id} className="flex items-center gap-3">
                  <span className="font-mono text-xs text-on-surface-variant w-40 truncate shrink-0">
                    {acct.name}
                  </span>
                  <input
                    type="number"
                    value={balances[i] ?? 0}
                    onChange={(e) => handleBalanceChange(i, e.target.value)}
                    step="0.01"
                    className="w-full rounded-md bg-surface-container-highest px-3 py-2 font-mono text-sm text-on-surface focus:bg-surface-container-lowest focus:outline focus:outline-outline-variant/20"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Live total */}
          {hasAccounts && (
            <div className="flex items-center justify-between border-t border-outline-variant/20 pt-3">
              <span className="font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant">
                Total
              </span>
              <span className="font-display text-lg font-medium text-on-surface">
                {formatCurrency(liveTotal, currency)}
              </span>
            </div>
          )}

          {mutation.isError && (
            <p className="font-mono text-xs text-on-error-container">
              {mutation.error.message}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={mutation.isPending}
              className="rounded-xl bg-surface-container-high px-4 py-2.5 font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant transition-colors hover:bg-surface-container-highest disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !hasAccounts}
              className={cn(
                "rounded-xl bg-primary px-4 py-2.5 font-mono text-xs uppercase tracking-[0.1em] text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-50"
              )}
            >
              {mutation.isPending ? "Saving..." : "Import"}
            </button>
          </div>
        </form>

        <button
          onClick={handleClose}
          className="absolute right-4 top-4 font-mono text-sm text-on-surface-variant transition-colors hover:text-on-surface"
          aria-label="Close"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
