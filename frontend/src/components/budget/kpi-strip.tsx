"use client";

import { useBudgetSummary } from "@/lib/queries/budget";
import { useCurrencyStore } from "@/stores/currency-store";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";

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

interface BudgetKpiStripProps {
  period: string;
  month?: number;
  year?: number;
  fromDate?: string;
  toDate?: string;
}

export function BudgetKpiStrip({ period, month, year, fromDate, toDate }: BudgetKpiStripProps) {
  const { data, isLoading } = useBudgetSummary(period, month, year, fromDate, toDate);
  const currency = useCurrencyStore((s) => s.currency);

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 gap-4 rounded-2xl bg-surface-container-low p-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
    );
  }

  const savingRateColor =
    data.saving_rate >= 0
      ? "text-on-tertiary-container"
      : "text-on-error-container";

  const budgetRemainingColor =
    data.budget_remaining >= 0
      ? "text-on-tertiary-container"
      : "text-on-error-container";

  return (
    <div className="grid grid-cols-2 gap-4 rounded-2xl bg-surface-container-low p-4 md:grid-cols-3 lg:grid-cols-6">
      <KpiCard
        label="Monthly Income"
        value={formatCurrency(data.income, currency)}
        large
      />
      <KpiCard
        label="Monthly Spend"
        value={formatCurrency(data.spend, currency)}
      />
      <KpiCard
        label="Monthly Savings"
        value={formatCurrency(data.savings, currency)}
        colorClass={savingRateColor}
      />
      <KpiCard
        label="Saving Rate"
        value={formatPercent(data.saving_rate)}
        colorClass={savingRateColor}
      />
      <KpiCard
        label="Investment Rate"
        value={formatPercent(data.investment_rate)}
      />
      <KpiCard
        label="Budget Remaining"
        value={formatCurrency(data.budget_remaining, currency)}
        colorClass={budgetRemainingColor}
      />
    </div>
  );
}
