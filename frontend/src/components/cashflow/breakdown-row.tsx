"use client";

import { useCashflowSankey } from "@/lib/queries/cashflow";
import { useCurrencyStore } from "@/stores/currency-store";
import { formatCurrency } from "@/lib/utils";

interface BreakdownRowProps {
  year: number;
  month: number;
}

export function BreakdownRow({ year, month }: BreakdownRowProps) {
  const { data, isLoading } = useCashflowSankey(year, month);
  const currency = useCurrencyStore((s) => s.currency);

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl bg-surface-container-lowest p-6 animate-pulse">
          <div className="h-6 w-40 rounded bg-surface-container-low mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-5 w-full rounded bg-surface-container-low" />
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-surface-container-lowest p-6 animate-pulse">
          <div className="h-6 w-40 rounded bg-surface-container-low mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-5 w-full rounded bg-surface-container-low" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Separate income nodes and expense nodes from the data
  const incomeNodes = data.nodes.filter((n) => n.type === "income");
  const expenseNodes = data.nodes.filter((n) => n.type === "expense");

  // Calculate totals per node from links
  const nodeValues = new Map<string, number>();
  for (const link of data.links) {
    const targetVal = nodeValues.get(link.target) ?? 0;
    nodeValues.set(link.target, targetVal + link.value);

    const sourceVal = nodeValues.get(link.source) ?? 0;
    nodeValues.set(link.source, sourceVal + link.value);
  }

  // Income sources: get totals from outgoing links
  const incomeSources = incomeNodes.map((node) => {
    // Sum outgoing links from this income node
    const total = data.links
      .filter((l) => l.source === node.id)
      .reduce((sum, l) => sum + l.value, 0);
    return { label: node.label, amount: total };
  });
  incomeSources.sort((a, b) => b.amount - a.amount);
  const totalIncome = incomeSources.reduce((sum, s) => sum + s.amount, 0);

  // Expense categories: get totals from incoming links
  const expenseCategories = expenseNodes.map((node) => {
    const total = data.links
      .filter((l) => l.target === node.id)
      .reduce((sum, l) => sum + l.value, 0);
    return { label: node.label, amount: total };
  });
  expenseCategories.sort((a, b) => b.amount - a.amount);
  const totalExpenses = expenseCategories.reduce((sum, c) => sum + c.amount, 0);

  // Top 8 expense categories, rest as "Other"
  const topExpenses = expenseCategories.slice(0, 8);
  const otherExpenses = expenseCategories.slice(8);
  const otherTotal = otherExpenses.reduce((sum, c) => sum + c.amount, 0);

  // Monochromatic dot colors
  const dotColors = [
    "#1a1a1a", "#333333", "#4d4d4d", "#666666",
    "#808080", "#999999", "#b3b3b3", "#cccccc",
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Left: Income sources */}
      <div className="rounded-2xl bg-surface-container-lowest p-6">
        <h3 className="font-display text-lg font-medium text-on-surface mb-4">
          Income Sources
        </h3>
        <div className="space-y-3">
          {incomeSources.map((source, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between"
            >
              <span className="font-mono text-sm text-on-surface-variant">
                {source.label}
              </span>
              <span className="font-mono text-sm text-on-surface">
                {formatCurrency(source.amount, currency)}
              </span>
            </div>
          ))}
        </div>
        {incomeSources.length > 0 && (
          <div className="mt-4 border-t border-outline-variant pt-3 flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant">
              Total
            </span>
            <span className="font-mono text-sm font-medium text-on-surface">
              {formatCurrency(totalIncome, currency)}
            </span>
          </div>
        )}
        {incomeSources.length === 0 && (
          <p className="font-mono text-sm text-on-surface-variant">
            No income sources recorded
          </p>
        )}
      </div>

      {/* Right: Top spending categories */}
      <div className="rounded-2xl bg-surface-container-lowest p-6">
        <h3 className="font-display text-lg font-medium text-on-surface mb-4">
          Top Spending Categories
        </h3>
        <div className="space-y-3">
          {topExpenses.map((cat, idx) => {
            const pct = totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0;
            return (
              <div key={idx} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: dotColors[idx % dotColors.length] }}
                  />
                  <span className="font-mono text-sm text-on-surface-variant truncate">
                    {cat.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-sm text-on-surface">
                    {formatCurrency(cat.amount, currency)}
                  </span>
                  <span className="font-mono text-xs text-on-surface-variant w-14 text-right">
                    {pct.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
          {otherTotal > 0 && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: "#d4d4d4" }}
                />
                <span className="font-mono text-sm text-on-surface-variant truncate">
                  Other
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-sm text-on-surface">
                  {formatCurrency(otherTotal, currency)}
                </span>
                <span className="font-mono text-xs text-on-surface-variant w-14 text-right">
                  {totalExpenses > 0
                    ? ((otherTotal / totalExpenses) * 100).toFixed(1)
                    : "0.0"}
                  %
                </span>
              </div>
            </div>
          )}
        </div>
        {expenseCategories.length === 0 && (
          <p className="font-mono text-sm text-on-surface-variant">
            No spending recorded
          </p>
        )}
      </div>
    </div>
  );
}
