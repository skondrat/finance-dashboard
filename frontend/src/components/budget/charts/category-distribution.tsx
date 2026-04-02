"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useCategoryDistribution } from "@/lib/queries/budget-charts";
import { useCurrencyStore } from "@/stores/currency-store";
import { formatCurrency } from "@/lib/utils";

const VIBRANT_PALETTE = [
  "#3B82F6", // blue
  "#22C55E", // green
  "#EAB308", // yellow
  "#A855F7", // purple
  "#EF4444", // red
  "#F97316", // orange
  "#06B6D4", // cyan
  "#EC4899", // pink
  "#10B981", // emerald
  "#8B5CF6", // violet
  "#14B8A6", // teal
  "#F59E0B", // amber
  "#64748B", // slate
  "#6366F1", // indigo
  "#84CC16", // lime
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: { category_name: string; pct: number };
  }>;
  currency: string;
}

function ChartTooltip({ active, payload, currency }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const entry = payload[0];
  return (
    <div className="rounded-xl bg-surface-container-lowest/80 backdrop-blur-[20px] shadow-ambient px-4 py-3">
      <p className="font-mono text-xs text-on-surface-variant mb-1">
        {entry.payload.category_name}
      </p>
      <p className="font-display text-sm font-medium text-on-surface">
        {formatCurrency(entry.value, currency)}
      </p>
      <p className="font-mono text-xs text-on-surface-variant">
        {entry.payload.pct.toFixed(1)}%
      </p>
    </div>
  );
}

interface CategoryDistributionChartProps {
  period?: string;
  month?: number;
  year?: number;
  onCategoryClick?: (categoryId: string) => void;
}

export function CategoryDistributionChart({
  period = "monthly",
  month,
  year,
  onCategoryClick,
}: CategoryDistributionChartProps) {
  const { data, isLoading } = useCategoryDistribution(period, month, year);
  const currency = useCurrencyStore((s) => s.currency);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chartData = data?.categories.map((cat, idx) => ({
    ...cat,
    fill: cat.color || VIBRANT_PALETTE[idx % VIBRANT_PALETTE.length],
  })) ?? [];

  return (
    <div className="rounded-2xl bg-surface-container-low p-6">
      <h2 className="font-display text-xl font-medium text-on-surface mb-6">
        Spending by Category
      </h2>

      <div className="h-72">
        {isLoading || !data ? (
          <div className="h-full w-full animate-pulse rounded-xl bg-surface-container-lowest" />
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="font-mono text-sm text-on-surface-variant">
              No spending data
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="amount"
                nameKey="category_name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                strokeWidth={0}
                onMouseEnter={(_, idx) => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(null)}
                onClick={(_, idx) => {
                  const cat = chartData[idx];
                  if (cat?.category_id && onCategoryClick) onCategoryClick(cat.category_id);
                }}
              >
                {chartData.map((entry, idx) => (
                  <Cell
                    key={entry.category_id ?? idx}
                    fill={entry.fill}
                    opacity={activeIndex === null || activeIndex === idx ? 1 : 0.4}
                    stroke={activeIndex === idx ? entry.fill : "none"}
                    strokeWidth={activeIndex === idx ? 3 : 0}
                    style={{
                      transition: "opacity 150ms, transform 150ms",
                      filter: activeIndex === idx ? "brightness(1.15)" : "none",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </Pie>
              <Tooltip
                content={<ChartTooltip currency={currency} />}
              />
              {/* Center label */}
              <text
                x="50%"
                y="48%"
                textAnchor="middle"
                dominantBaseline="central"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  fill: "var(--color-on-surface-variant, #666)",
                }}
              >
                TOTAL SPEND
              </text>
              <text
                x="50%"
                y="56%"
                textAnchor="middle"
                dominantBaseline="central"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 14,
                  fontWeight: 500,
                  fill: "var(--color-on-surface, #1a1a1a)",
                }}
              >
                {formatCurrency(data.total_spend, currency)}
              </text>
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      {data && chartData.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {chartData.slice(0, 8).map((entry, idx) => (
            <div
              key={entry.category_id ?? idx}
              className="flex items-center gap-2 cursor-pointer rounded px-1 py-0.5 transition-all duration-150"
              style={{
                opacity: activeIndex === null || activeIndex === idx ? 1 : 0.4,
                backgroundColor: activeIndex === idx ? `${entry.fill}15` : "transparent",
              }}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={() => {
                if (entry.category_id && onCategoryClick) onCategoryClick(entry.category_id);
              }}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: entry.fill }}
              />
              <span className="font-mono text-xs text-on-surface-variant truncate">
                {entry.category_name}
              </span>
              <span className="font-mono text-xs text-on-surface-variant ml-auto">
                {entry.pct.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
