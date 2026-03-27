"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useSavingsOverTime } from "@/lib/queries/budget-charts";
import { useCurrencyStore } from "@/stores/currency-store";
import { formatCurrency } from "@/lib/utils";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
  currency: string;
}

function ChartTooltip({ active, payload, label, currency }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl bg-surface-container-lowest/80 backdrop-blur-[20px] shadow-ambient px-4 py-3">
      <p className="font-mono text-xs text-on-surface-variant mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4">
          <span className="font-mono text-xs text-on-surface-variant capitalize">
            {entry.dataKey === "cumulative" ? "Cumulative" : "Monthly"}
          </span>
          <span className="font-display text-sm font-medium text-on-surface">
            {formatCurrency(entry.value, currency)}
          </span>
        </div>
      ))}
    </div>
  );
}

interface SavingsOverTimeChartProps {
  months?: number;
}

export function SavingsOverTimeChart({ months = 12 }: SavingsOverTimeChartProps) {
  const { data, isLoading } = useSavingsOverTime(months);
  const currency = useCurrencyStore((s) => s.currency);

  return (
    <div className="rounded-2xl bg-surface-container-low p-6">
      <h2 className="font-display text-xl font-medium text-on-surface mb-6">
        Savings Over Time
      </h2>

      <div className="h-72">
        {isLoading || !data ? (
          <div className="h-full w-full animate-pulse rounded-xl bg-surface-container-lowest" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#009668" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#009668" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                cursor={false}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#009668"
                strokeWidth={1.5}
                fill="url(#savingsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
