"use client";

import { usePerformanceBreakdown } from "@/lib/queries/portfolio-analytics";
import { useCurrencyStore } from "@/stores/currency-store";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";

function valueColor(value: number): string {
  if (value > 0) return "text-on-tertiary-container";
  if (value < 0) return "text-on-error-container";
  return "text-on-surface";
}

interface BreakdownRowProps {
  label: string;
  value: number;
  pct?: number;
  currency: string;
  colored?: boolean;
  bold?: boolean;
}

function BreakdownRow({
  label,
  value,
  pct,
  currency,
  colored = false,
  bold = false,
}: BreakdownRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-2",
        bold && "border-t border-outline-variant pt-3 mt-1"
      )}
    >
      <span
        className={cn(
          "font-body text-sm",
          bold ? "font-semibold text-on-surface" : "text-on-surface-variant"
        )}
      >
        {label}
      </span>
      <div className="text-right">
        <span
          className={cn(
            "font-mono text-sm",
            bold && "font-semibold",
            colored ? valueColor(value) : "text-on-surface"
          )}
        >
          {formatCurrency(value, currency)}
        </span>
        {pct !== undefined && (
          <span
            className={cn(
              "font-mono text-xs ml-2",
              colored ? valueColor(pct) : "text-on-surface-variant"
            )}
          >
            {formatPercent(pct)}
          </span>
        )}
      </div>
    </div>
  );
}

export function PerformanceBreakdown() {
  const { data, isLoading } = usePerformanceBreakdown();
  const currency = useCurrencyStore((s) => s.currency);

  return (
    <div className="rounded-2xl bg-surface-container-low p-6">
      <h2 className="font-display text-xl font-medium text-on-surface mb-4">
        Performance Breakdown
      </h2>

      {isLoading || !data ? (
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-6 animate-pulse rounded bg-surface-container-lowest"
            />
          ))}
        </div>
      ) : (
        <div>
          <BreakdownRow
            label="Capital"
            value={Number(data.capital)}
            currency={currency}
          />
          <BreakdownRow
            label="Price gain"
            value={Number(data.price_gain)}
            pct={Number(data.price_gain_pct)}
            currency={currency}
            colored
          />
          <BreakdownRow
            label="Dividends"
            value={Number(data.dividends)}
            pct={Number(data.dividends_pct)}
            currency={currency}
            colored
          />
          <BreakdownRow
            label="Realized losses"
            value={Number(data.realized_losses)}
            pct={Number(data.realized_losses_pct)}
            currency={currency}
            colored
          />
          <BreakdownRow
            label="Transaction costs"
            value={Number(data.transaction_costs)}
            currency={currency}
          />
          <BreakdownRow
            label="Total return"
            value={Number(data.total_return)}
            pct={Number(data.total_return_pct)}
            currency={currency}
            colored
            bold
          />

          {/* IRR and TWR */}
          <div className="mt-4 border-t border-outline-variant pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-body text-sm text-on-surface-variant">
                IRR
              </span>
              <span className={cn("font-mono text-sm", valueColor(Number(data.irr)))}>
                {formatPercent(Number(data.irr))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body text-sm text-on-surface-variant">
                TWR
              </span>
              <span className={cn("font-mono text-sm", valueColor(Number(data.twr)))}>
                {formatPercent(Number(data.twr))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
