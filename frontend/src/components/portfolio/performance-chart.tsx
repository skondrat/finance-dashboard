"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { usePerformanceChart } from "@/lib/queries/portfolio";
import { useCurrencyStore } from "@/stores/currency-store";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const RANGES = ["1D", "1W", "1M", "YTD", "1Y", "MAX"] as const;
type Range = (typeof RANGES)[number];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  currency: string;
}

function ChartTooltip({ active, payload, label, currency }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl bg-surface-container-lowest/80 backdrop-blur-[20px] shadow-ambient px-4 py-3">
      <p className="font-mono text-xs text-on-surface-variant mb-1">
        {label ? formatDate(label) : ""}
      </p>
      <p className="font-display text-base font-medium text-on-surface">
        {formatCurrency(payload[0].value, currency)}
      </p>
    </div>
  );
}

export function PerformanceChart({ accountId }: { accountId?: string } = {}) {
  const [range, setRange] = useState<Range>("1Y");
  const { data, isLoading } = usePerformanceChart(range, accountId);
  const currency = useCurrencyStore((s) => s.currency);

  return (
    <div className="rounded-2xl bg-surface-container-low p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-xl font-medium text-on-surface">
          Performance
        </h2>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-lg px-3 py-1.5 font-mono text-xs transition-colors",
                r === range
                  ? "bg-surface-container-lowest text-on-surface"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72">
        {isLoading || !data ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-full w-full animate-pulse rounded-xl bg-surface-container-lowest" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ade80" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickFormatter={(v) => formatDate(v)}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                className="text-on-surface-variant"
                interval="preserveStartEnd"
                minTickGap={60}
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
                dataKey="value"
                stroke="#4ade80"
                strokeWidth={1.5}
                fill="url(#areaGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
