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

function generateColors(count: number): string[] {
  if (count === 0) return [];

  const colors: string[] = [];
  colors.push("#2E7D32");

  for (let i = 1; i < count; i++) {
    const lightness = 30 + Math.round((i / count) * 50);
    colors.push(`hsl(0 0% ${lightness}%)`);
  }

  return colors;
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
                  stroke="none"
                >
                  {segments.map((_, idx) => (
                    <Cell key={idx} fill={colors[idx]} />
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
            <div key={seg.label} className="flex items-center justify-between">
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
