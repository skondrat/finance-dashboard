"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useSpendingTrends } from "@/lib/queries/budget-charts";
import { useCurrencyStore } from "@/stores/currency-store";
import { formatCurrency } from "@/lib/utils";

function ChartTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  currency: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl bg-surface-container-lowest/80 backdrop-blur-[20px] shadow-ambient px-4 py-3 max-w-xs">
      <p className="font-mono text-xs text-on-surface-variant mb-2">{label}</p>
      {payload
        .filter((p) => p.value > 0)
        .map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-mono text-xs text-on-surface-variant truncate">
                {entry.name}
              </span>
            </div>
            <span className="font-mono text-xs font-medium text-on-surface">
              {formatCurrency(entry.value, currency)}
            </span>
          </div>
        ))}
    </div>
  );
}

export function SpendingTrendsChart() {
  const { data, isLoading } = useSpendingTrends(6);
  const currency = useCurrencyStore((s) => s.currency);

  return (
    <div className="rounded-2xl bg-surface-container-low p-6">
      <h2 className="font-display text-xl font-medium text-on-surface mb-6">
        Spending Trends
      </h2>

      <div className="h-72">
        {isLoading || !data ? (
          <div className="h-full w-full animate-pulse rounded-xl bg-surface-container-lowest" />
        ) : data.categories.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="font-mono text-sm text-on-surface-variant">
              No spending data
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
                tickFormatter={(v: string) => {
                  const [, m] = v.split("-");
                  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                  return names[parseInt(m, 10) - 1] ?? v;
                }}
              />
              <YAxis
                tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                width={40}
              />
              <Tooltip
                content={<ChartTooltip currency={currency} />}
              />
              <Legend
                wrapperStyle={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
              />
              {data.categories.map((cat) => (
                <Bar
                  key={cat.name}
                  dataKey={cat.name}
                  stackId="spending"
                  fill={cat.color}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
