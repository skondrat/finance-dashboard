"use client";

import { useState, useCallback } from "react";
import { Treemap, ResponsiveContainer, Tooltip, type TreemapNode } from "recharts";
import { useSpendByCategory, type SpendByCategoryItem } from "@/lib/queries/budget";
import { useCurrencyStore } from "@/stores/currency-store";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface TreemapDataItem {
  [key: string]: unknown;
  name: string;
  categoryId: string;
  value: number;
  pctChange: number | null;
  currentSpent: number;
  baselineValue: number | null;
  baselineLabel: string;
  color: string;
}

type ComparisonBaseline =
  | { type: "month"; month: number; year: number }
  | { type: "budget" };

// ── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  { value: 1, label: "Jan" },
  { value: 2, label: "Feb" },
  { value: 3, label: "Mar" },
  { value: 4, label: "Apr" },
  { value: 5, label: "May" },
  { value: 6, label: "Jun" },
  { value: 7, label: "Jul" },
  { value: 8, label: "Aug" },
  { value: 9, label: "Sep" },
  { value: 10, label: "Oct" },
  { value: 11, label: "Nov" },
  { value: 12, label: "Dec" },
];

const YEARS = [2025, 2026];

const NEUTRAL_COLOR = "#9CA3AF";

const selectClass =
  "rounded-lg border border-on-surface-variant/20 bg-surface-container-lowest px-1.5 py-0.5 font-mono text-[10px] text-on-surface focus:outline-none appearance-none cursor-pointer";

// ── Color utility ────────────────────────────────────────────────────────────

function computeColor(pctChange: number | null, maxAbsChange: number): string {
  if (pctChange === null || maxAbsChange === 0) return NEUTRAL_COLOR;

  // Normalize to [-1, 1] range based on data range
  const normalized = Math.max(-1, Math.min(1, pctChange / maxAbsChange));

  // Positive pctChange = more spend = red (hue 0)
  // Negative pctChange = less spend = green (hue 140)
  const hue = normalized > 0 ? 0 : 140;
  const saturation = 75;
  const absNorm = Math.abs(normalized);
  // Lightness: 85% at 0 change → 30% at max change (vivid at extremes)
  const lightness = 85 - absNorm * 55;

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function textColorForBg(pctChange: number | null, maxAbsChange: number): string {
  if (pctChange === null || maxAbsChange === 0) return "#374151";
  const absNorm = Math.min(1, Math.abs(pctChange) / maxAbsChange);
  return absNorm > 0.5 ? "#FFFFFF" : "#1F2937";
}

// ── Data merging ─────────────────────────────────────────────────────────────

function mergeData(
  current: SpendByCategoryItem[],
  comparison: SpendByCategoryItem[] | null,
  baseline: ComparisonBaseline,
): TreemapDataItem[] {
  const baselineLabel =
    baseline.type === "budget"
      ? "Budget"
      : `${MONTHS.find((m) => m.value === baseline.month)?.label} ${baseline.year}`;

  const compMap = new Map<string, SpendByCategoryItem>();
  if (comparison) {
    for (const item of comparison) {
      compMap.set(item.category.name, item);
    }
  }

  return current
    .filter((item) => item.spent > 0)
    .map((item) => {
      let baselineValue: number | null = null;
      let pctChange: number | null = null;

      if (baseline.type === "budget") {
        baselineValue = item.category.monthly_budget;
        if (baselineValue !== null && baselineValue > 0) {
          pctChange = ((item.spent - baselineValue) / baselineValue) * 100;
        } else if (baselineValue !== null && baselineValue === 0 && item.spent > 0) {
          // Budget is 0 but spending exists → treat as 100% over
          pctChange = 100;
        }
      } else {
        const comp = compMap.get(item.category.name);
        baselineValue = comp ? comp.spent : null;
        if (baselineValue !== null && baselineValue > 0) {
          pctChange = ((item.spent - baselineValue) / baselineValue) * 100;
        } else if (baselineValue !== null && baselineValue === 0 && item.spent > 0) {
          // No spending in comparison month but spending now → treat as 100% increase
          pctChange = 100;
        }
        // baselineValue === null means category didn't exist in comparison → stays gray
      }

      return {
        name: item.category.name,
        categoryId: item.category.id,
        value: item.spent,
        pctChange,
        currentSpent: item.spent,
        baselineValue,
        baselineLabel,
        color: "", // computed after we know max range
      };
    });
}

function applyColors(items: TreemapDataItem[]): TreemapDataItem[] {
  const changes = items.map((i) => i.pctChange).filter((c): c is number => c !== null);
  // Use 90th percentile as max to prevent outliers from washing out all colors
  const sorted = changes.map(Math.abs).sort((a, b) => a - b);
  const p90Index = Math.floor(sorted.length * 0.9);
  const maxAbsChange = sorted.length > 0 ? sorted[Math.min(p90Index, sorted.length - 1)] : 0;

  return items.map((item) => ({
    ...item,
    color: computeColor(item.pctChange, maxAbsChange),
  }));
}

// ── Custom rectangle content ─────────────────────────────────────────────────

interface TreemapContentProps {
  x: number;
  y: number;
  width: number;
  height: number;
  name?: string;
  pctChange?: number | null;
  currentSpent?: number;
  color?: string;
  currency: string;
  maxAbsChange: number;
}

function TreemapRect({
  x,
  y,
  width,
  height,
  name,
  pctChange,
  currentSpent,
  color = NEUTRAL_COLOR,
  currency,
  maxAbsChange,
}: TreemapContentProps) {
  const textColor = textColorForBg(pctChange ?? null, maxAbsChange);
  const showName = width > 50 && height > 30;
  const showAmount = width > 60 && height > 44;
  const showPct = width > 40 && height > 56;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        fill={color}
        stroke="var(--color-surface-container-low, #f5f5f5)"
        strokeWidth={2}
        style={{ cursor: "pointer" }}
      />
      {showName && (
        <text
          x={x + width / 2}
          y={y + (showAmount ? height * 0.3 : height / 2)}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: Math.min(11, width / 8),
            fontWeight: 600,
            fill: textColor,
            pointerEvents: "none",
          }}
        >
          {name && name.length > width / 7 ? name.slice(0, Math.floor(width / 7)) + "…" : name}
        </text>
      )}
      {showAmount && currentSpent !== undefined && (
        <text
          x={x + width / 2}
          y={y + height * 0.52}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: Math.min(10, width / 9),
            fontWeight: 500,
            fill: textColor,
            opacity: 0.9,
            pointerEvents: "none",
          }}
        >
          {formatCurrency(currentSpent, currency)}
        </text>
      )}
      {showPct && pctChange != null && (
        <text
          x={x + width / 2}
          y={y + height * 0.72}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: Math.min(9, width / 10),
            fontWeight: 500,
            fill: textColor,
            opacity: 0.8,
            pointerEvents: "none",
          }}
        >
          {formatPercent(pctChange)}
        </text>
      )}
    </g>
  );
}

// ── Custom tooltip ───────────────────────────────────────────────────────────

interface TooltipPayloadItem {
  payload: TreemapDataItem;
}

function TreemapTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  currency: string;
}) {
  if (!active || !payload?.length) return null;

  const item = payload[0].payload;

  return (
    <div className="rounded-xl bg-surface-container-lowest/80 backdrop-blur-[20px] shadow-ambient px-4 py-3 max-w-[200px]">
      <p className="font-mono text-xs font-medium text-on-surface mb-1">
        {item.name}
      </p>
      <div className="space-y-0.5">
        <p className="font-mono text-xs text-on-surface-variant">
          Current: {formatCurrency(item.currentSpent, currency)}
        </p>
        <p className="font-mono text-xs text-on-surface-variant">
          {item.baselineLabel}:{" "}
          {item.baselineValue !== null
            ? formatCurrency(item.baselineValue, currency)
            : item.baselineLabel === "Budget"
              ? "No budget set"
              : "New"}
        </p>
        {item.pctChange !== null && (
          <p
            className={cn(
              "font-mono text-xs font-medium",
              item.pctChange > 0
                ? "text-on-error-container"
                : item.pctChange < 0
                  ? "text-on-tertiary-container"
                  : "text-on-surface-variant",
            )}
          >
            {formatPercent(item.pctChange)}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

interface SpendTreemapProps {
  period?: string;
  month?: number;
  year?: number;
  onCategoryClick?: (categoryId: string) => void;
}

export function SpendTreemap({
  period,
  month,
  year,
  onCategoryClick,
}: SpendTreemapProps) {
  const currency = useCurrencyStore((s) => s.currency);

  // Default comparison: previous month
  const defaultPrevMonth = month === 1 ? 12 : (month ?? 1) - 1;
  const defaultPrevYear = month === 1 ? (year ?? 2026) - 1 : year ?? 2026;

  const [baseline, setBaseline] = useState<ComparisonBaseline>({
    type: "month",
    month: defaultPrevMonth,
    year: defaultPrevYear,
  });

  // Current month data
  const { data: currentData, isLoading: loadingCurrent } = useSpendByCategory(
    "monthly",
    month,
    year,
  );

  // Comparison month data (only when baseline is a month)
  const { data: compData, isLoading: loadingComp } = useSpendByCategory(
    "monthly",
    baseline.type === "month" ? baseline.month : undefined,
    baseline.type === "month" ? baseline.year : undefined,
  );

  const isLoading = loadingCurrent || (baseline.type === "month" && loadingComp);

  // Build treemap data
  const rawItems = currentData
    ? mergeData(currentData, baseline.type === "month" ? compData ?? null : null, baseline)
    : [];
  const treemapData = applyColors(rawItems);

  const maxAbsChange = (() => {
    const changes = treemapData.map((i) => i.pctChange).filter((c): c is number => c !== null);
    return changes.length > 0 ? Math.max(...changes.map(Math.abs)) : 0;
  })();

  // Check if all categories lack budgets (for budget mode hint)
  const allLackBudgets =
    baseline.type === "budget" &&
    currentData &&
    currentData.filter((i) => i.spent > 0).every((i) => i.category.monthly_budget === null);

  const handleClick = useCallback(
    (node: TreemapNode) => {
      const categoryId = node.categoryId as string | undefined;
      if (categoryId && onCategoryClick) {
        onCategoryClick(categoryId);
      }
    },
    [onCategoryClick],
  );

  // Baseline selector handlers
  const handleBaselineChange = (value: string) => {
    if (value === "budget") {
      setBaseline({ type: "budget" });
    } else {
      const [m, y] = value.split("-").map(Number);
      setBaseline({ type: "month", month: m, year: y });
    }
  };

  const baselineValue =
    baseline.type === "budget" ? "budget" : `${baseline.month}-${baseline.year}`;

  return (
    <div className="rounded-2xl bg-surface-container-low p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-medium text-on-surface">
          Spend Heatmap
        </h2>
      </div>

      {/* Comparison selector */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        <span className="font-mono text-xs text-on-surface-variant">vs</span>
        <select
          value={baselineValue}
          onChange={(e) => handleBaselineChange(e.target.value)}
          className={selectClass}
        >
          <option value="budget">Budget</option>
          {YEARS.flatMap((y) =>
            MONTHS.map((m) => (
              <option key={`${m.value}-${y}`} value={`${m.value}-${y}`}>
                {m.label} {y}
              </option>
            )),
          )}
        </select>
      </div>

      {/* Chart */}
      <div className="h-72">
        {isLoading ? (
          <div className="h-full w-full animate-pulse rounded-xl bg-surface-container-lowest" />
        ) : treemapData.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="font-mono text-sm text-on-surface-variant">
              No spending data
            </p>
          </div>
        ) : allLackBudgets ? (
          <div className="flex flex-col h-full items-center justify-center gap-2">
            <p className="font-mono text-sm text-on-surface-variant">
              No budgets configured
            </p>
            <p className="font-mono text-xs text-on-surface-variant/60">
              Set monthly budgets for categories to compare
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={treemapData}
              dataKey="value"
              nameKey="name"
              content={
                <TreemapRect
                  x={0}
                  y={0}
                  width={0}
                  height={0}
                  currency={currency}
                  maxAbsChange={maxAbsChange}
                />
              }
              onClick={handleClick}
              isAnimationActive={false}
            >
              <Tooltip
                content={<TreemapTooltip currency={currency} />}
              />
            </Treemap>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
