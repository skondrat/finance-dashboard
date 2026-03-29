"use client";

import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useImportCategories } from "@/lib/queries/budget";
import { useCurrencyStore } from "@/stores/currency-store";

export function AddSpendModal() {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { data: categoriesData } = useImportCategories();
  const currency = useCurrencyStore((s) => s.currency);
  const categories = categoriesData?.categories ?? [];

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        handleClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleClose() {
    setOpen(false);
    setCategoryId("");
    setAmount("");
    setDescription("");
    setError(null);
  }

  async function handleSubmit() {
    if (!categoryId) {
      setError("Please select a category");
      return;
    }
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid positive amount");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const today = new Date().toISOString().split("T")[0];
      await apiFetch("/budget/transactions", {
        method: "POST",
        body: JSON.stringify({
          date: today,
          description: description || "Manual expense",
          amount: -numAmount,
          currency,
          category_id: categoryId,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add expense");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-surface-container-high px-4 py-3 font-mono text-xs uppercase tracking-[0.1em] text-on-surface transition-colors hover:bg-surface-container-highest"
      >
        Add Spend
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/40">
          <div
            ref={ref}
            className="w-full max-w-sm rounded-2xl bg-surface-container-lowest p-6 shadow-ambient space-y-4"
          >
            <h3 className="font-display text-lg font-medium text-on-surface">
              Add Expense
            </h3>

            {/* Category selector */}
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-on-surface-variant">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-on-surface-variant/20 bg-surface-container-low px-3 py-2 font-body text-sm text-on-surface outline-none focus:border-primary"
              >
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-on-surface-variant">
                Amount ({currency})
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-on-surface-variant/20 bg-surface-container-low px-3 py-2 font-mono text-sm text-on-surface outline-none focus:border-primary"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-on-surface-variant">
                Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What was this for?"
                className="w-full rounded-lg border border-on-surface-variant/20 bg-surface-container-low px-3 py-2 font-body text-sm text-on-surface outline-none focus:border-primary"
              />
            </div>

            {error && (
              <p className="font-mono text-xs text-on-error-container">
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleClose}
                className="flex-1 rounded-xl border border-on-surface-variant/20 px-4 py-2.5 font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant transition-colors hover:bg-surface-container-low"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 rounded-xl bg-on-surface px-4 py-2.5 font-mono text-xs uppercase tracking-[0.1em] text-surface transition-colors hover:bg-on-surface/90 disabled:opacity-50"
              >
                {submitting ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
