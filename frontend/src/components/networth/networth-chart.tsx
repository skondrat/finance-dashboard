"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useNetworthHistory } from "@/lib/queries/networth";
import { useCurrencyStore } from "@/stores/currency-store";
import { cn, formatCurrency } from "@/lib/utils";

const RANGES = ["6M", "YTD", "1Y", "ALL"] as const;
type Range = (typeof RANGES)[number];

function formatMonth(ym: string): string {
  const [year, month] = ym.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(month, 10) - 1]} ${year.slice(2)}`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { month: string; value: number } }>;
  currency: string;
}

function ChartTooltip({ active, payload, currency }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;
  return (
    <div className="rounded-xl bg-surface-container-lowest/80 backdrop-blur-[20px] shadow-ambient px-4 py-3">
      <p className="font-mono text-xs text-on-surface-variant mb-1">
        {formatMonth(point.month)}
      </p>
      <p className="font-display text-base font-medium text-on-surface">
        {formatCurrency(point.value, currency)}
      </p>
    </div>
  );
}

function filterByRange(
  data: Array<{ month: string; value: number }>,
  range: Range
): Array<{ month: string; value: number }> {
  if (range === "ALL") return data;

  const now = new Date();
  let cutoff: string;

  if (range === "YTD") {
    cutoff = `${now.getFullYear()}-01`;
  } else if (range === "6M") {
    const d = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    cutoff = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  } else {
    // 1Y
    const d = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);
    cutoff = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  return data.filter((d) => d.month >= cutoff);
}

export function NetworthChart() {
  const [range, setRange] = useState<Range>("ALL");
  const { data: history, isLoading } = useNetworthHistory();
  const currency = useCurrencyStore((s) => s.currency);

  const chartData = useMemo(() => {
    if (!history?.snapshots?.length) return [];
    const all = history.snapshots.map((s) => ({
      month: s.snapshot_month,
      value: s.total_networth,
    }));
    return filterByRange(all, range);
  }, [history, range]);

  const hasData = chartData.length > 0;

  return (
    <div className="rounded-2xl bg-surface-container-low p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-xl font-medium text-on-surface">
          Net Worth
        </h2>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-lg px-3 py-1.5 font-mono text-xs transition-colors cursor-pointer",
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
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-full w-full animate-pulse rounded-xl bg-surface-container-lowest" />
          </div>
        ) : !hasData ? (
          <div className="flex h-full items-center justify-center">
            <p className="font-mono text-xs text-on-surface-variant">
              No history yet — add or update accounts to start tracking.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="networthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#000000" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#000000" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                tickFormatter={formatMonth}
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
                dataKey="value"
                stroke="#000000"
                strokeWidth={1.5}
                fill="url(#networthGradient)"
                dot={chartData.length === 1}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
