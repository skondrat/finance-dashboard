"use client";

import { useState, type FormEvent } from "react";
import { useCreateManualSnapshot } from "@/lib/queries/networth";
import { useCurrencyStore } from "@/stores/currency-store";
import { cn } from "@/lib/utils";

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
  const [value, setValue] = useState("");
  const currency = useCurrencyStore((s) => s.currency);

  const mutation = useCreateManualSnapshot();

  function handleClose() {
    mutation.reset();
    setValue("");
    onClose();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return;

    const snapshotMonth = `${year}-${month}`;
    mutation.mutate(
      { snapshot_month: snapshotMonth, total_networth: parsed, currency },
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

      <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl bg-surface-container-lowest p-6 shadow-ambient">
        <h2 className="font-display text-xl font-medium text-on-surface mb-6">
          Import Previous Networth
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant mb-1.5">
              Total Networth ({currency})
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              step="0.01"
              placeholder="e.g. 50000"
              className="w-full rounded-md bg-surface-container-highest px-3 py-2.5 font-mono text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:bg-surface-container-lowest focus:outline focus:outline-outline-variant/20"
            />
          </div>

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
              disabled={mutation.isPending || !value}
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
