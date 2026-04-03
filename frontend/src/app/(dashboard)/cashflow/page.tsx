"use client";

import { useState } from "react";
import { CashflowKpiStrip } from "@/components/cashflow/kpi-strip";
import { SankeyDiagram } from "@/components/cashflow/sankey-diagram";
import { BreakdownRow } from "@/components/cashflow/breakdown-row";
import { cn } from "@/lib/utils";
import type { CashflowPeriod } from "@/lib/queries/cashflow";

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

const SEGMENTS: { key: CashflowPeriod; label: string }[] = [
  { key: "monthly", label: "Monthly" },
  { key: "ytd", label: "YTD" },
  { key: "yearly", label: "Yearly" },
];

const selectClass =
  "rounded-lg border border-on-surface-variant/20 bg-surface-container-lowest px-2 py-1 font-mono text-sm text-on-surface focus:outline-none focus:border-on-surface-variant/40 appearance-none cursor-pointer";

function getLastCompletedMonth(): { year: number; month: number } {
  const now = new Date();
  const m = now.getMonth(); // 0-11
  if (m === 0) return { year: now.getFullYear() - 1, month: 12 };
  return { year: now.getFullYear(), month: m };
}

export default function CashflowPage() {
  const lastCompleted = getLastCompletedMonth();
  const [period, setPeriod] = useState<CashflowPeriod>("monthly");
  const [year, setYear] = useState(lastCompleted.year);
  const [month, setMonth] = useState(lastCompleted.month);

  return (
    <div className="space-y-6">
      {/* Header + Period selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-semibold text-on-surface">
          Cashflow
        </h1>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Segmented control */}
          <div className="flex gap-1 rounded-xl bg-surface-container-low p-1">
            {SEGMENTS.map((seg) => (
              <button
                key={seg.key}
                onClick={() => setPeriod(seg.key)}
                className={cn(
                  "rounded-lg px-3 py-1.5 font-mono text-xs uppercase tracking-[0.1em] transition-colors",
                  period === seg.key
                    ? "bg-on-surface text-surface"
                    : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                {seg.label}
              </button>
            ))}
          </div>

          {/* Month + Year selectors */}
          <div className="flex items-center gap-2">
            {period === "monthly" && (
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className={selectClass}
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            )}
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className={selectClass}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI strip — full width */}
      <CashflowKpiStrip year={year} month={month} period={period} />

      {/* Sankey diagram — full width, surface-container-low panel */}
      <SankeyDiagram year={year} month={month} period={period} />

      {/* Breakdown row — 6+6 grid */}
      <BreakdownRow year={year} month={month} period={period} />
    </div>
  );
}
