"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useInvestmentRateTrend } from "@/lib/queries/budget-charts";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl bg-surface-container-lowest/80 backdrop-blur-[20px] shadow-ambient px-4 py-3">
      <p className="font-mono text-xs text-on-surface-variant mb-1">{label}</p>
      <p className="font-display text-base font-medium text-on-surface">
        {payload[0].value.toFixed(2)}%
      </p>
    </div>
  );
}

interface InvestmentRateTrendChartProps {
  months?: number;
}

export function InvestmentRateTrendChart({
  months = 12,
}: InvestmentRateTrendChartProps) {
  const { data, isLoading } = useInvestmentRateTrend(months);

  return (
    <div className="rounded-2xl bg-surface-container-low p-6">
      <h2 className="font-display text-xl font-medium text-on-surface mb-6">
        Investment Rate Trend
      </h2>

      <div className="h-72">
        {isLoading || !data ? (
          <div className="h-full w-full animate-pulse rounded-xl bg-surface-container-lowest" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fontFamily: "var(--font-mono)" }}
                className="text-on-surface-variant"
              />
              <YAxis
                tickFormatter={(v) => `${v}%`}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fontFamily: "var(--font-mono)" }}
                className="text-on-surface-variant"
                width={60}
                domain={[0, "auto"]}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={false}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#1a1a1a"
                strokeWidth={1.5}
                dot={{ r: 3, fill: "#1a1a1a", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#1a1a1a", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
