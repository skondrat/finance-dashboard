"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useIncomeVsSpend } from "@/lib/queries/budget-charts";
import { useCurrencyStore } from "@/stores/currency-store";
import { formatCurrency } from "@/lib/utils";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  currency: string;
}

function ChartTooltip({ active, payload, label, currency }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl bg-surface-container-lowest/80 backdrop-blur-[20px] shadow-ambient px-4 py-3">
      <p className="font-mono text-xs text-on-surface-variant mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="font-mono text-xs text-on-surface-variant capitalize">
            {entry.name}
          </span>
          <span className="font-display text-sm font-medium text-on-surface ml-auto">
            {formatCurrency(entry.value, currency)}
          </span>
        </div>
      ))}
    </div>
  );
}

interface IncomeVsSpendChartProps {
  months?: number;
}

export function IncomeVsSpendChart({ months = 12 }: IncomeVsSpendChartProps) {
  const { data, isLoading } = useIncomeVsSpend(months);
  const currency = useCurrencyStore((s) => s.currency);

  return (
    <div className="rounded-2xl bg-surface-container-low p-6">
      <h2 className="font-display text-xl font-medium text-on-surface mb-6">
        Income vs Spend
      </h2>

      <div className="h-72">
        {isLoading || !data ? (
          <div className="h-full w-full animate-pulse rounded-xl bg-surface-container-lowest" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={4}>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fontFamily: "var(--font-mono)" }}
                className="text-on-surface-variant"
              />
              <YAxis
                tickFormatter={(v) => formatCurrency(v, currency)}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fontFamily: "var(--font-mono)" }}
                className="text-on-surface-variant"
                width={100}
              />
              <Tooltip
                content={<ChartTooltip currency={currency} />}
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
              />
              <Legend
                wrapperStyle={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="income"
                fill="#009668"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                dataKey="spend"
                fill="#1a1a1a"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
