"use client";

import { useState, useEffect, type FormEvent } from "react";
import {
  useNetworthHistory,
  useUpdateSnapshot,
  type NetworthSnapshot,
} from "@/lib/queries/networth";
import { useCurrencyStore } from "@/stores/currency-store";
import { formatCurrency, cn } from "@/lib/utils";

interface EditSnapshotModalProps {
  open: boolean;
  onClose: () => void;
}

export function EditSnapshotModal({ open, onClose }: EditSnapshotModalProps) {
  const { data: history } = useNetworthHistory();
  const currency = useCurrencyStore((s) => s.currency);
  const mutation = useUpdateSnapshot();

  const snapshots = history?.snapshots ?? [];

  // Selected month key (e.g. "2026-03")
  const [selectedMonth, setSelectedMonth] = useState("");

  // Editable breakdown balances — keyed by index
  const [balances, setBalances] = useState<number[]>([]);

  // For snapshots without breakdown: single total field
  const [manualTotal, setManualTotal] = useState("");

  // Find the snapshot for the selected month
  const snapshot = snapshots.find((s) => s.snapshot_month === selectedMonth);
  const hasBreakdown = snapshot?.breakdown && snapshot.breakdown.length > 0;

  // Default to most recent snapshot when modal opens or snapshots change
  useEffect(() => {
    if (open && snapshots.length > 0 && !selectedMonth) {
      const latest = snapshots[snapshots.length - 1];
      setSelectedMonth(latest.snapshot_month);
    }
  }, [open, snapshots, selectedMonth]);

  // Sync breakdown balances when selected snapshot changes
  useEffect(() => {
    if (!snapshot) {
      setBalances([]);
      setManualTotal("");
      return;
    }
    if (snapshot.breakdown && snapshot.breakdown.length > 0) {
      setBalances(snapshot.breakdown.map((b) => b.balance));
    } else {
      setManualTotal(String(snapshot.total_networth));
      setBalances([]);
    }
  }, [snapshot]);

  const liveTotal = hasBreakdown
    ? balances.reduce((sum, b) => sum + (b || 0), 0)
    : parseFloat(manualTotal) || 0;

  function handleBalanceChange(index: number, value: string) {
    setBalances((prev) => {
      const next = [...prev];
      next[index] = parseFloat(value) || 0;
      return next;
    });
  }

  function handleClose() {
    mutation.reset();
    setSelectedMonth("");
    setBalances([]);
    setManualTotal("");
    onClose();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!snapshot) return;

    const updatedBreakdown = hasBreakdown
      ? snapshot.breakdown!.map((entry, i) => ({
          ...entry,
          balance: balances[i] ?? entry.balance,
        }))
      : null;

    mutation.mutate(
      {
        id: snapshot.id,
        total_networth: liveTotal,
        breakdown: updatedBreakdown,
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
          Modify Previous Networth
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 min-h-0">
          {/* Month selector */}
          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant mb-1.5">
              Snapshot Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full appearance-none rounded-md bg-surface-container-highest px-3 py-2.5 font-body text-sm text-on-surface focus:bg-surface-container-lowest focus:outline focus:outline-outline-variant/20"
            >
              {snapshots.length === 0 && (
                <option value="">No snapshots available</option>
              )}
              {[...snapshots].reverse().map((s) => (
                <option key={s.snapshot_month} value={s.snapshot_month}>
                  {formatSnapshotMonth(s.snapshot_month)}
                </option>
              ))}
            </select>
          </div>

          {/* Breakdown fields or no-snapshot message */}
          {!snapshot ? (
            <p className="font-mono text-sm text-on-surface-variant py-4 text-center">
              No snapshot exists for this month
            </p>
          ) : hasBreakdown ? (
            <div className="overflow-y-auto min-h-0 space-y-3 pr-1">
              {snapshot.breakdown!.map((entry, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="font-mono text-xs text-on-surface-variant w-40 truncate shrink-0">
                    {entry.name}
                  </span>
                  <input
                    type="number"
                    value={balances[i] ?? ""}
                    onChange={(e) => handleBalanceChange(i, e.target.value)}
                    step="0.01"
                    className="w-full rounded-md bg-surface-container-highest px-3 py-2 font-mono text-sm text-on-surface focus:bg-surface-container-lowest focus:outline focus:outline-outline-variant/20"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div>
              <label className="block font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant mb-1.5">
                Total Networth ({currency})
              </label>
              <input
                type="number"
                value={manualTotal}
                onChange={(e) => setManualTotal(e.target.value)}
                step="0.01"
                className="w-full rounded-md bg-surface-container-highest px-3 py-2.5 font-mono text-sm text-on-surface focus:bg-surface-container-lowest focus:outline focus:outline-outline-variant/20"
              />
            </div>
          )}

          {/* Live total */}
          {snapshot && (
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
              disabled={mutation.isPending || !snapshot}
              className={cn(
                "rounded-xl bg-primary px-4 py-2.5 font-mono text-xs uppercase tracking-[0.1em] text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-50"
              )}
            >
              {mutation.isPending ? "Saving..." : "Save"}
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

function formatSnapshotMonth(ym: string): string {
  const [y, m] = ym.split("-");
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
}
