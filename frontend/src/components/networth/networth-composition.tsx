"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useNetworthComposition } from "@/lib/queries/networth";
import { useCurrencyStore } from "@/stores/currency-store";
import { cn, formatCurrency } from "@/lib/utils";

const TABS = [
  { key: "account", label: "Account" },
  { key: "type", label: "Type" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const VIBRANT_PALETTE = [
  "#3B82F6", "#22C55E", "#EAB308", "#A855F7", "#EF4444",
  "#F97316", "#06B6D4", "#EC4899", "#10B981", "#8B5CF6",
  "#14B8A6", "#F59E0B", "#6366F1", "#84CC16", "#D946EF",
  "#0EA5E9", "#E11D48", "#059669", "#7C3AED", "#DC2626",
  "#EA580C", "#0891B2", "#DB2777", "#2563EB", "#65A30D",
  "#CA8A04", "#9333EA", "#0D9488", "#C026D3", "#4F46E5",
];

function generateColors(count: number): string[] {
  return Array.from({ length: count }, (_, i) => VIBRANT_PALETTE[i % VIBRANT_PALETTE.length]);
}

interface DonutTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: { label: string; value: number; percentage: number };
  }>;
  currency: string;
}

function DonutTooltip({ active, payload, currency }: DonutTooltipProps) {
  if (!active || !payload?.length) return null;

  const segment = payload[0].payload;
  return (
    <div className="relative z-50 rounded-xl bg-surface-container-lowest/95 backdrop-blur-[20px] shadow-ambient px-4 py-3">
      <p className="font-mono text-xs text-on-surface-variant mb-1">
        {segment.label}
      </p>
      <p className="font-display text-base font-medium text-on-surface">
        {formatCurrency(segment.value, currency)}
      </p>
      <p className="font-mono text-xs text-on-surface-variant">
        {Number(segment.percentage).toFixed(1)}%
      </p>
    </div>
  );
}

const SMALL_SEGMENT_THRESHOLD = 2; // percent

export function NetworthComposition() {
  const [activeTab, setActiveTab] = useState<TabKey>("account");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { data, isLoading } = useNetworthComposition(activeTab);
  const currency = useCurrencyStore((s) => s.currency);

  // Group small segments into "Other"
  let segments = data?.segments ?? [];
  if (segments.length > 0) {
    const significant = segments.filter(
      (s) => s.percentage >= SMALL_SEGMENT_THRESHOLD
    );
    const small = segments.filter(
      (s) => s.percentage < SMALL_SEGMENT_THRESHOLD
    );
    if (small.length > 0) {
      const otherValue = small.reduce((sum, s) => sum + s.value, 0);
      const otherPct = small.reduce((sum, s) => sum + s.percentage, 0);
      segments = [
        ...significant,
        {
          label: "Other",
          value: Math.round(otherValue * 100) / 100,
          percentage: Math.round(otherPct * 10) / 10,
        },
      ];
    }
  }

  const total = data?.total ?? 0;
  const colors = generateColors(segments.length);

  return (
    <div className="rounded-2xl bg-surface-container-low p-6">
      <h2 className="font-display text-xl font-medium text-on-surface mb-4">
        Composition
      </h2>

      {/* Sub-tabs */}
      <div className="mb-4 flex gap-1 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-3 py-1.5 font-mono text-xs transition-colors",
              tab.key === activeTab
                ? "text-on-surface border-b-2 border-on-surface"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Donut chart */}
      <div className="h-56 relative">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-full w-full animate-pulse rounded-xl bg-surface-container-lowest" />
          </div>
        ) : segments.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="font-body text-sm text-on-surface-variant">
              No composition data
            </p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segments}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="80%"
                  paddingAngle={2}
                  strokeWidth={0}
                  onMouseEnter={(_, idx) => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {segments.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={colors[idx]}
                      opacity={activeIndex === null || activeIndex === idx ? 1 : 0.4}
                      stroke={activeIndex === idx ? colors[idx] : "none"}
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
                  content={<DonutTooltip currency={currency} />}
                  wrapperStyle={{ zIndex: 10 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
              <span className="font-mono font-display text-xl text-on-surface">
                {formatCurrency(total, currency)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Legend */}
      {segments.length > 0 && (
        <div className="mt-4 space-y-2">
          {segments.map((seg, idx) => (
            <div
              key={seg.label}
              className="flex items-center justify-between cursor-pointer rounded px-1 py-0.5 transition-all duration-150"
              style={{
                opacity: activeIndex === null || activeIndex === idx ? 1 : 0.4,
                backgroundColor: activeIndex === idx ? `${colors[idx]}15` : "transparent",
              }}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: colors[idx] }}
                />
                <span className="font-mono text-xs text-on-surface-variant">
                  {seg.label}
                </span>
              </div>
              <span className="font-mono text-xs text-on-surface">
                {Number(seg.percentage).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
