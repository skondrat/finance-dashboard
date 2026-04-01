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

const ALL_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface ChartDataPoint {
  month: string;
  income: number;
  spend: number;
  savings: number;
}

function padTo12Months(data: Array<{ month: string; income: number; spend: number }>): ChartDataPoint[] {
  const byLabel = new Map<string, { income: number; spend: number }>();

  for (const d of data) {
    // API returns "YYYY-MM" — extract short month label
    const [, mm] = d.month.split("-");
    const idx = parseInt(mm, 10) - 1;
    const label = ALL_MONTHS[idx] ?? d.month;
    byLabel.set(label, { income: d.income, spend: d.spend });
  }

  return ALL_MONTHS.map((label) => {
    const entry = byLabel.get(label);
    const income = entry?.income ?? 0;
    const spend = entry?.spend ?? 0;
    return { month: label, income, spend, savings: income - spend };
  });
}

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

  const chartData = data ? padTo12Months(data) : [];

  return (
    <div className="rounded-2xl bg-surface-container-low p-6">
      <h2 className="font-display text-xl font-medium text-on-surface mb-6">
        Monthly Overview
      </h2>

      <div className="h-72">
        {isLoading || !data ? (
          <div className="h-full w-full animate-pulse rounded-xl bg-surface-container-lowest" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={2} barCategoryGap="20%">
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                className="text-on-surface-variant"
              />
              <YAxis
                tickFormatter={(v) => formatCurrency(v, currency)}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                className="text-on-surface-variant"
                width={80}
              />
              <Tooltip
                content={<ChartTooltip currency={currency} />}
                cursor={{ fill: "var(--on-surface)", opacity: 0.04 }}
              />
              <Legend
                wrapperStyle={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                }}
              />
              <Bar
                dataKey="income"
                name="Income"
                fill="#EAB308"
                radius={[3, 3, 0, 0]}
                maxBarSize={24}
              />
              <Bar
                dataKey="spend"
                name="Spendings"
                fill="#EF4444"
                radius={[3, 3, 0, 0]}
                maxBarSize={24}
              />
              <Bar
                dataKey="savings"
                name="Savings"
                fill="#3B82F6"
                radius={[3, 3, 0, 0]}
                maxBarSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
