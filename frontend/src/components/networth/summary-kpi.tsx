"use client";

import { useMemo } from "react";
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

interface SummaryKpiProps {
  showDebts: boolean;
}

export function SummaryKpi({ showDebts }: SummaryKpiProps) {
  const { data, isLoading } = useNetworthSummary();
  const currency = useCurrencyStore((s) => s.currency);

  const totals = useMemo(() => {
    if (!data) return null;
    const visibleAccounts = showDebts
      ? data.accounts
      : data.accounts.filter((a) => a.account_type !== "debt");
    const manualTotal = visibleAccounts
      .filter((a) => a.source === "manual")
      .reduce((sum, a) => sum + a.converted_balance, 0);
    const investmentTotal = visibleAccounts
      .filter((a) => a.source === "investment")
      .reduce((sum, a) => sum + a.converted_balance, 0);
    return {
      total: manualTotal + investmentTotal,
      manual: manualTotal,
      investment: investmentTotal,
    };
  }, [data, showDebts]);

  if (isLoading || !totals) {
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
        <p className="font-display text-4xl font-medium text-on-surface truncate" title={formatCurrency(totals.total, currency)}>
          {formatCurrency(totals.total, currency)}
        </p>
      </div>
      <div className="rounded-xl bg-surface-container-lowest px-5 py-4">
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant mb-1">
          Current Accounts
        </p>
        <p className="font-display text-2xl font-medium text-on-surface truncate">
          {formatCurrency(totals.manual, currency)}
        </p>
      </div>
      <div className="rounded-xl bg-surface-container-lowest px-5 py-4">
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant mb-1">
          Investments
        </p>
        <p className="font-display text-2xl font-medium text-on-surface truncate">
          {formatCurrency(totals.investment, currency)}
        </p>
      </div>
    </div>
  );
}
