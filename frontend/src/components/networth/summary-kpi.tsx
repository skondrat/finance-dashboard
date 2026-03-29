"use client";

import { useNetworthSummary } from "@/lib/queries/networth";
import { useCurrencyStore } from "@/stores/currency-store";
import { formatCurrency } from "@/lib/utils";

function KpiSkeleton() {
  return (
    <div className="rounded-xl bg-surface-container-lowest px-5 py-4 animate-pulse">
      <div className="h-3 w-20 rounded bg-surface-container-low mb-3" />
      <div className="h-8 w-32 rounded bg-surface-container-low" />
    </div>
  );
}

export function SummaryKpi() {
  const { data, isLoading } = useNetworthSummary();
  const currency = useCurrencyStore((s) => s.currency);

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 gap-4 rounded-2xl bg-surface-container-low p-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 rounded-2xl bg-surface-container-low p-4 md:grid-cols-3">
      <div className="rounded-xl bg-surface-container-lowest px-5 py-4">
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant mb-1">
          Total Net Worth
        </p>
        <p className="font-display text-4xl font-medium text-on-surface truncate" title={formatCurrency(data.total_networth, currency)}>
          {formatCurrency(data.total_networth, currency)}
        </p>
      </div>
      <div className="rounded-xl bg-surface-container-lowest px-5 py-4">
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant mb-1">
          Manual Accounts
        </p>
        <p className="font-display text-2xl font-medium text-on-surface truncate">
          {formatCurrency(data.manual_total, currency)}
        </p>
      </div>
      <div className="rounded-xl bg-surface-container-lowest px-5 py-4">
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant mb-1">
          Investments
        </p>
        <p className="font-display text-2xl font-medium text-on-surface truncate">
          {formatCurrency(data.investment_total, currency)}
        </p>
      </div>
    </div>
  );
}
