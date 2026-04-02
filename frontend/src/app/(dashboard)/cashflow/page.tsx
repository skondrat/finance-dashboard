"use client";

import { useState, useCallback } from "react";
import { CashflowKpiStrip } from "@/components/cashflow/kpi-strip";
import { SankeyDiagram } from "@/components/cashflow/sankey-diagram";
import { BreakdownRow } from "@/components/cashflow/breakdown-row";
import { MonthNavigator } from "@/components/cashflow/month-navigator";

function getLastCompletedMonth(): { year: number; month: number } {
  const now = new Date();
  const m = now.getMonth(); // 0-11
  if (m === 0) return { year: now.getFullYear() - 1, month: 12 };
  return { year: now.getFullYear(), month: m };
}

export default function CashflowPage() {
  const lastCompleted = getLastCompletedMonth();
  const [year, setYear] = useState(lastCompleted.year);
  const [month, setMonth] = useState(lastCompleted.month);

  const isNextDisabled =
    year === lastCompleted.year && month === lastCompleted.month;

  const handlePrev = useCallback(() => {
    setMonth((m) => {
      if (m === 1) {
        setYear((y) => y - 1);
        return 12;
      }
      return m - 1;
    });
  }, []);

  const handleNext = useCallback(() => {
    if (isNextDisabled) return;
    setMonth((m) => {
      if (m === 12) {
        setYear((y) => y + 1);
        return 1;
      }
      return m + 1;
    });
  }, [isNextDisabled]);

  return (
    <div className="space-y-6">
      {/* Month navigator */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-on-surface">
          Cashflow
        </h1>
        <MonthNavigator
          year={year}
          month={month}
          onPrev={handlePrev}
          onNext={handleNext}
          isNextDisabled={isNextDisabled}
        />
      </div>

      {/* KPI strip — full width */}
      <CashflowKpiStrip year={year} month={month} />

      {/* Sankey diagram — full width, surface-container-low panel */}
      <SankeyDiagram year={year} month={month} />

      {/* Breakdown row — 6+6 grid */}
      <BreakdownRow year={year} month={month} />
    </div>
  );
}
