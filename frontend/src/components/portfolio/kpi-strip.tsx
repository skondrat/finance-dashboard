"use client";

import { usePortfolioSummary } from "@/lib/queries/portfolio";
import { useCurrencyStore } from "@/stores/currency-store";
import { cn, formatCurrency, formatPercent, signedValue, valueColorClass } from "@/lib/utils";

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
  const longValue = value.length > 9;
  return (
    <div className="rounded-xl bg-surface-container-lowest px-5 py-4 overflow-hidden">
      <p className="font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant mb-1">
        {label}
      </p>
      <p
        className={cn(
          "font-display font-medium truncate",
          large
            ? longValue ? "text-2xl" : "text-4xl"
            : longValue ? "text-lg" : "text-2xl",
          colorClass ?? "text-on-surface"
        )}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

export function KpiStrip() {
  const { data, isLoading } = usePortfolioSummary();
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

  return (
    <div className="grid grid-cols-2 gap-4 rounded-2xl bg-surface-container-low p-4 md:grid-cols-3 lg:grid-cols-6">
      <KpiCard
        label="Net Worth"
        value={formatCurrency(data.net_worth, currency)}
        large
      />
      <KpiCard
        label="Total Return"
        value={signedValue(data.total_return)}
        colorClass={valueColorClass(data.total_return)}
      />
      <KpiCard
        label="Return %"
        value={formatPercent(data.return_pct)}
        colorClass={valueColorClass(data.return_pct)}
      />
      <KpiCard
        label="Saving Rate"
        value={formatPercent(data.saving_rate)}
      />
      <KpiCard
        label="Investment Rate"
        value={formatPercent(data.investment_rate)}
      />
      <KpiCard
        label="Invested Capital"
        value={formatCurrency(data.invested_capital, currency)}
      />
    </div>
  );
}
