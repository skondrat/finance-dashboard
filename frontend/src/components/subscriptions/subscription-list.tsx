"use client";

import { useState } from "react";
import {
  useSubscriptions,
  useCancelSubscription,
  useReactivateSubscription,
  useDeleteSubscription,
  type Subscription,
} from "@/lib/queries/subscriptions";
import { formatCurrency } from "@/lib/utils";

type SortField = "name" | "price";
type SortDir = "asc" | "desc";

function monthlyEquivalent(sub: Subscription): number {
  if (sub.cadence === "yearly") return sub.amount / 12;
  if (sub.cadence === "weekly") return sub.amount * 4.33;
  return sub.amount;
}

function cadenceLabel(cadence: string): string {
  if (cadence === "yearly") return "/yr";
  if (cadence === "weekly") return "/wk";
  return "/mo";
}

interface Props {
  onEdit: (sub: Subscription) => void;
}

function sortSubs(subs: Subscription[], field: SortField, dir: SortDir): Subscription[] {
  return [...subs].sort((a, b) => {
    const cmp = field === "price"
      ? monthlyEquivalent(a) - monthlyEquivalent(b)
      : a.name.localeCompare(b.name);
    return dir === "asc" ? cmp : -cmp;
  });
}

export function SubscriptionList({ onEdit }: Props) {
  const { data: subscriptions, isLoading } = useSubscriptions();
  const cancelMutation = useCancelSubscription();
  const reactivateMutation = useReactivateSubscription();
  const deleteMutation = useDeleteSubscription();
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "price" ? "desc" : "asc");
    }
  }

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-xl bg-surface-container-lowest" />;
  }

  const all = subscriptions ?? [];
  const active = sortSubs(all.filter((s) => s.status === "active"), sortField, sortDir);
  const cancelled = sortSubs(all.filter((s) => s.status === "cancelled"), sortField, sortDir);

  const totalMonthly = active.reduce((sum, s) => sum + monthlyEquivalent(s), 0);

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="rounded-2xl bg-surface-container-lowest p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-on-surface-variant">
          Total Monthly Cost
        </p>
        <p className="font-display text-3xl font-medium text-on-surface mt-1">
          {formatCurrency(totalMonthly)}
        </p>
      </div>

      {/* Active subscriptions */}
      {active.length > 0 && (
        <div className="rounded-2xl bg-surface-container-lowest p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.1em] text-on-surface-variant">
              Active ({active.length})
            </h3>
            <div className="flex gap-1">
              <button
                onClick={() => toggleSort("name")}
                className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.05em] transition-colors cursor-pointer ${sortField === "name" ? "bg-on-surface-variant/15 text-on-surface" : "text-on-surface-variant hover:text-on-surface"}`}
              >
                Name {sortField === "name" ? (sortDir === "asc" ? "↑" : "↓") : ""}
              </button>
              <button
                onClick={() => toggleSort("price")}
                className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.05em] transition-colors cursor-pointer ${sortField === "price" ? "bg-on-surface-variant/15 text-on-surface" : "text-on-surface-variant hover:text-on-surface"}`}
              >
                Price {sortField === "price" ? (sortDir === "asc" ? "↑" : "↓") : ""}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {active.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3 group"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium text-on-surface truncate">
                    {sub.name}
                  </p>
                  <p className="font-mono text-xs text-on-surface-variant">
                    {sub.payment_source && `${sub.payment_source} · `}
                    {sub.payment_day && `Day ${sub.payment_day} · `}
                    {sub.cadence}
                  </p>
                </div>
                <div className="text-right mr-4">
                  <p className="font-mono text-sm text-on-surface">
                    {formatCurrency(sub.amount, sub.currency)}
                    <span className="text-on-surface-variant">{cadenceLabel(sub.cadence)}</span>
                  </p>
                  {sub.cadence !== "monthly" && (
                    <p className="font-mono text-xs text-on-surface-variant">
                      ≈ {formatCurrency(monthlyEquivalent(sub), sub.currency)}/mo
                    </p>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(sub)}
                    className="rounded p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                    title="Edit"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => cancelMutation.mutate(sub.id)}
                    className="rounded p-1.5 text-on-surface-variant hover:text-on-error-container hover:bg-error-container transition-colors cursor-pointer"
                    title="Cancel subscription"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancelled subscriptions */}
      {cancelled.length > 0 && (
        <div className="rounded-2xl bg-surface-container-lowest p-6">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.1em] text-on-surface-variant mb-4">
            Cancelled ({cancelled.length})
          </h3>
          <div className="space-y-2">
            {cancelled.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3 opacity-60 group"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-on-surface-variant line-through truncate">
                    {sub.name}
                  </p>
                </div>
                <div className="text-right mr-4">
                  <p className="font-mono text-xs text-on-surface-variant line-through">
                    {formatCurrency(sub.amount, sub.currency)}{cadenceLabel(sub.cadence)}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => reactivateMutation.mutate(sub.id)}
                    className="rounded p-1.5 text-on-surface-variant hover:text-on-tertiary-container hover:bg-tertiary-fixed transition-colors cursor-pointer"
                    title="Reactivate"
                  >
                    ↺
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(sub.id)}
                    className="rounded p-1.5 text-on-surface-variant hover:text-on-error-container hover:bg-error-container transition-colors cursor-pointer"
                    title="Delete permanently"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
