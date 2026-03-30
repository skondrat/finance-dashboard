"use client";

import { useState, useMemo } from "react";
import { useTransactions, useUpdateTransaction, useDeleteTransaction, type Transaction, type UpdateTransactionPayload } from "@/lib/queries/accounts";
import { useAllTransactions, type PortfolioTransaction } from "@/lib/queries/portfolio";
import { useCurrencyStore } from "@/stores/currency-store";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { AddTransactionForm } from "./add-transaction-form";

interface TransactionsViewProps {
  accountId?: string;
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  const d = new Date(parseInt(year), parseInt(month) - 1);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
}

function getInitial(ticker: string): string {
  return ticker ? ticker.charAt(0).toUpperCase() : "?";
}

function TransactionsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-xl bg-surface-container-lowest"
        />
      ))}
    </div>
  );
}

export function TransactionsView({ accountId }: TransactionsViewProps) {
  const accountQuery = useTransactions(accountId ?? "");
  const allQuery = useAllTransactions();
  const isAggregated = !accountId;
  const { data: transactions, isLoading } = isAggregated ? allQuery : accountQuery;
  const currency = useCurrencyStore((s) => s.currency);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UpdateTransactionPayload>({});
  const updateTxn = useUpdateTransaction(accountId ?? "");
  const deleteTxn = useDeleteTransaction(accountId ?? "");

  // Normalize both transaction types to a common shape
  const normalizedTxs = useMemo(() => {
    if (!transactions) return [];
    return (transactions as Array<Transaction | PortfolioTransaction>).map((t) => ({
      ...t,
      account_name: "account_name" in t ? t.account_name : undefined,
    }));
  }, [transactions]);

  const filtered = useMemo(() => {
    if (!normalizedTxs.length) return [];
    if (!search.trim()) return normalizedTxs;
    const term = search.toLowerCase();
    return normalizedTxs.filter(
      (t) =>
        t.asset.ticker.toLowerCase().includes(term) ||
        t.asset.name.toLowerCase().includes(term) ||
        t.type.toLowerCase().includes(term) ||
        (t.account_name && t.account_name.toLowerCase().includes(term))
    );
  }, [normalizedTxs, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    const sorted = [...filtered].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    for (const tx of sorted) {
      const key = getMonthKey(tx.date);
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  return (
    <div className="rounded-2xl bg-surface-container-low p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-medium text-on-surface">
          Transactions
        </h2>
        {accountId && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-xl bg-primary px-4 py-2.5 font-mono text-xs uppercase tracking-[0.1em] text-on-primary transition-colors hover:bg-primary/90"
          >
            {showForm ? "Close" : "Add Transaction"}
          </button>
        )}
      </div>

      {/* Inline transaction form */}
      {showForm && accountId && (
        <div className="mb-6 rounded-xl bg-surface-container-lowest p-4">
          <AddTransactionForm
            accountId={accountId}
            onSuccess={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search transactions..."
          className="w-full rounded-md bg-surface-container-highest px-3 py-2.5 font-body text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:bg-surface-container-lowest focus:outline focus:outline-outline-variant/20"
        />
      </div>

      {/* Transaction list */}
      {isLoading ? (
        <TransactionsSkeleton />
      ) : grouped.length === 0 ? (
        <p className="font-body text-sm text-on-surface-variant py-8 text-center">
          {search
            ? "No transactions match your search."
            : "No transactions yet."}
        </p>
      ) : (
        <div className="space-y-6">
          {grouped.map(([monthKey, txs]) => (
            <div key={monthKey}>
              {/* Month header */}
              <h3 className="font-display text-lg font-medium text-on-surface mb-3">
                {formatMonthLabel(monthKey)}
              </h3>

              {/* Transaction rows */}
              <div className="space-y-2">
                {txs.map((tx) => {
                  const txAccountId = "account_id" in tx ? (tx as PortfolioTransaction).account_id : accountId;

                  if (editingId === tx.id) {
                    return (
                      <div key={tx.id} className="rounded-xl bg-surface-container-lowest px-4 py-3 space-y-3">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <input type="number" step="any" placeholder="Quantity" defaultValue={tx.quantity}
                            onChange={(e) => setEditForm((f) => ({ ...f, quantity: parseFloat(e.target.value) }))}
                            className="rounded-md bg-surface-container-highest px-2 py-1.5 font-mono text-sm text-on-surface" />
                          <input type="number" step="any" placeholder="Price" defaultValue={tx.price_per_unit}
                            onChange={(e) => setEditForm((f) => ({ ...f, price_per_unit: parseFloat(e.target.value) }))}
                            className="rounded-md bg-surface-container-highest px-2 py-1.5 font-mono text-sm text-on-surface" />
                          <input type="number" step="any" placeholder="Fees" defaultValue={tx.fees}
                            onChange={(e) => setEditForm((f) => ({ ...f, fees: parseFloat(e.target.value) }))}
                            className="rounded-md bg-surface-container-highest px-2 py-1.5 font-mono text-sm text-on-surface" />
                          <input type="date" defaultValue={tx.date}
                            onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                            className="rounded-md bg-surface-container-highest px-2 py-1.5 font-mono text-sm text-on-surface" />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (txAccountId) {
                                updateTxn.mutate({ txnId: tx.id, payload: editForm }, {
                                  onSuccess: () => { setEditingId(null); setEditForm({}); }
                                });
                              }
                            }}
                            disabled={updateTxn.isPending}
                            className="rounded-lg bg-primary px-3 py-1.5 font-mono text-xs text-on-primary"
                          >
                            {updateTxn.isPending ? "Saving…" : "Save"}
                          </button>
                          <button onClick={() => { setEditingId(null); setEditForm({}); }}
                            className="rounded-lg px-3 py-1.5 font-mono text-xs text-on-surface-variant hover:text-on-surface"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={tx.id}
                      className="flex items-center gap-4 rounded-xl bg-surface-container-lowest px-4 py-3 transition-colors hover:bg-surface-container-low"
                    >
                      {/* Date */}
                      <span className="shrink-0 font-mono text-xs text-on-surface-variant w-16">
                        {formatDate(tx.date)}
                      </span>

                      {/* Asset initial circle */}
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container-high">
                        <span className="font-mono text-sm font-medium text-on-surface">
                          {getInitial(tx.asset.ticker)}
                        </span>
                      </div>

                      {/* Description */}
                      <div className="min-w-0 flex-1">
                        <p className="font-body text-sm text-on-surface truncate">
                          {tx.type === "buy" ? "Bought" : "Sold"} {tx.asset.ticker} x{parseFloat(String(tx.quantity))} @ {formatCurrency(tx.price_per_unit, tx.currency)}
                        </p>
                        <p className="font-mono text-xs text-on-surface-variant">
                          {tx.type}{tx.fees > 0 ? ` · fees ${formatCurrency(tx.fees, tx.currency)}` : ""}{tx.account_name ? ` · ${tx.account_name}` : ""}
                        </p>
                      </div>

                      {/* Amount */}
                      <span
                        className={cn(
                          "shrink-0 font-mono text-sm font-medium",
                          tx.type === "buy"
                            ? "text-on-error-container"
                            : "text-on-tertiary-container"
                        )}
                      >
                        {tx.type === "buy" ? "-" : "+"}
                        {formatCurrency(tx.quantity * tx.price_per_unit, currency)}
                      </span>

                      {/* 3-dot menu */}
                      {txAccountId && (
                        <div className="relative shrink-0">
                          <button
                            onClick={() => setMenuOpenId(menuOpenId === tx.id ? null : tx.id)}
                            className="rounded-md p-1 text-on-surface-variant transition-colors hover:text-on-surface hover:bg-surface-container-high"
                          >
                            ⋮
                          </button>
                          {menuOpenId === tx.id && (
                            <div className="absolute right-0 top-8 z-10 rounded-lg bg-surface-container-high shadow-lg py-1 min-w-[100px]">
                              <button
                                onClick={() => {
                                  setEditingId(tx.id);
                                  setEditForm({});
                                  setMenuOpenId(null);
                                }}
                                className="w-full px-4 py-2 text-left font-body text-sm text-on-surface hover:bg-surface-container-highest"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  setMenuOpenId(null);
                                  if (confirm(`Delete this ${tx.type} transaction for ${tx.asset.ticker}?`)) {
                                    deleteTxn.mutate(tx.id);
                                  }
                                }}
                                className="w-full px-4 py-2 text-left font-body text-sm text-on-error-container hover:bg-surface-container-highest"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
