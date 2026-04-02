"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useIncomes, useCopyIncomeFromPrevious, type IncomeSource } from "@/lib/queries/budget";
import { useCurrencyStore } from "@/stores/currency-store";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface IncomeManagerProps {
  year?: number;
  month?: number;
}

export function IncomeManager({ year, month }: IncomeManagerProps) {
  const { data: incomes, isLoading } = useIncomes(year, month);
  const currency = useCurrencyStore((s) => s.currency);
  const queryClient = useQueryClient();

  const copyMutation = useCopyIncomeFromPrevious();
  const [isAdding, setIsAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");

  const addMutation = useMutation<
    IncomeSource,
    Error,
    { label: string; amount: number }
  >({
    mutationFn: (payload) =>
      apiFetch<IncomeSource>("/budget/income", {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          currency,
          year: year ?? new Date().getFullYear(),
          month: month ?? new Date().getMonth() + 1,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget", "income"] });
      queryClient.invalidateQueries({ queryKey: ["budget", "summary"] });
      setLabel("");
      setAmount("");
      setIsAdding(false);
    },
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: (id) =>
      apiFetch<void>(`/budget/income/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget", "income"] });
      queryClient.invalidateQueries({ queryKey: ["budget", "summary"] });
    },
  });

  function handleAdd() {
    const parsedAmount = parseFloat(amount);
    if (!label.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;
    addMutation.mutate({ label: label.trim(), amount: parsedAmount });
  }

  return (
    <div className="rounded-2xl bg-surface-container-low p-6">
      <h2 className="font-display text-xl font-medium text-on-surface mb-4">
        Income Sources
      </h2>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-xl bg-surface-container-lowest"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {incomes?.map((income) => (
            <div
              key={income.id}
              className="flex items-center justify-between rounded-xl bg-surface-container-lowest px-4 py-3"
            >
              <div>
                <p className="font-body text-sm text-on-surface">
                  {income.label}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-mono text-sm text-on-surface">
                  {formatCurrency(income.amount, currency)}
                </p>
                <button
                  onClick={() => deleteMutation.mutate(income.id)}
                  disabled={deleteMutation.isPending}
                  className="font-mono text-xs text-on-surface-variant transition-colors hover:text-on-error-container disabled:opacity-50"
                  aria-label={`Delete ${income.label}`}
                >
                  &times;
                </button>
              </div>
            </div>
          ))}

          {incomes?.length === 0 && (
            <div className="py-4 text-center space-y-2">
              <p className="font-body text-sm text-on-surface-variant">
                No income sources yet.
              </p>
              {year && month && (
                <button
                  onClick={() => copyMutation.mutate({ year, month })}
                  disabled={copyMutation.isPending}
                  className="font-mono text-xs text-on-surface-variant underline decoration-dotted hover:text-on-surface transition-colors disabled:opacity-50"
                >
                  {copyMutation.isPending ? "Copying..." : "Copy from previous month"}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add form */}
      {isAdding ? (
        <div className="mt-4 space-y-3">
          <input
            type="text"
            placeholder="Label (e.g. Salary)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-xl bg-surface-container-lowest px-4 py-2.5 font-body text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-1 focus:ring-on-surface-variant/20"
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
              className="flex-1 rounded-xl bg-surface-container-lowest px-4 py-2.5 font-mono text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-1 focus:ring-on-surface-variant/20"
            />
            <span className="font-mono text-xs text-on-surface-variant">
              {currency}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAdd}
              disabled={addMutation.isPending}
              className="rounded-xl bg-on-surface px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] text-surface transition-colors hover:bg-on-surface/90 disabled:opacity-50"
            >
              {addMutation.isPending ? "Adding..." : "Add"}
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setLabel("");
                setAmount("");
              }}
              className="rounded-xl px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant transition-colors hover:text-on-surface"
            >
              Cancel
            </button>
          </div>
          {addMutation.isError && (
            <p className="font-mono text-xs text-on-error-container">
              {addMutation.error.message}
            </p>
          )}
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="mt-4 w-full rounded-xl border border-dashed border-on-surface-variant/20 px-4 py-2.5 font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant transition-colors hover:border-on-surface-variant/40 hover:text-on-surface"
        >
          + Add Income Source
        </button>
      )}
    </div>
  );
}
