"use client";

import { useCashflowSankey } from "@/lib/queries/cashflow";
import { useCurrencyStore } from "@/stores/currency-store";
import { cn, formatCurrency } from "@/lib/utils";

function KpiSkeleton() {
  return (
    <div className="rounded-xl bg-surface-container-lowest px-5 py-4 animate-pulse">
      <div className="h-3 w-20 rounded bg-surface-container-low mb-3" />
      <div className="h-8 w-32 rounded bg-surface-container-low" />
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: string;
  large?: boolean;
  colorClass?: string;
}

function KpiCard({ label, value, large, colorClass }: KpiCardProps) {
  return (
    <div className="rounded-xl bg-surface-container-lowest px-5 py-4">
      <p className="font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant mb-1">
        {label}
      </p>
      <p
        className={cn(
          "font-display font-medium",
          large ? "text-4xl" : "text-2xl",
          colorClass ?? "text-on-surface"
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function CashflowKpiStrip() {
  const { data, isLoading } = useCashflowSankey();
  const currency = useCurrencyStore((s) => s.currency);

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 gap-4 rounded-2xl bg-surface-container-low p-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
    );
  }

  const savingsColor =
    data.total_savings >= 0
      ? "text-on-tertiary-container"
      : "text-on-error-container";

  return (
    <div className="grid grid-cols-2 gap-4 rounded-2xl bg-surface-container-low p-4 md:grid-cols-4">
      <KpiCard
        label="Total Income"
        value={formatCurrency(data.total_income, currency)}
        large
      />
      <KpiCard
        label="Total Spend"
        value={formatCurrency(data.total_spend, currency)}
      />
      <KpiCard
        label="Total Savings"
        value={formatCurrency(data.total_savings, currency)}
        colorClass={savingsColor}
      />
      <KpiCard
        label="Total Investments"
        value={formatCurrency(data.total_investments, currency)}
      />
    </div>
  );
}
