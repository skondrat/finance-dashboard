"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BudgetKpiStrip } from "@/components/budget/kpi-strip";
import { TimeAggregation, type Period } from "@/components/budget/time-aggregation";
import { CategoryTable } from "@/components/budget/category-table";
import { ImportModal } from "@/components/budget/import-modal";
import { IncomeManager } from "@/components/budget/income-manager";
import { DebugMenu } from "@/components/budget/debug-menu";

export default function BudgetPage() {
  const now = new Date();
  const [period, setPeriod] = useState<Period>("monthly");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const summaryMonth = period === "monthly" ? month : undefined;
  const summaryYear =
    period === "monthly" || period === "yearly" ? year : undefined;

  return (
    <div className="space-y-6">
      {/* Full-width KPI strip */}
      <BudgetKpiStrip period={period} month={summaryMonth} year={summaryYear} />

      {/* 12-col grid: 8 + 4 */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left column — 8 cols */}
        <div className="col-span-12 space-y-6 lg:col-span-8">
          <TimeAggregation
            period={period}
            month={month}
            year={year}
            onPeriodChange={setPeriod}
            onMonthChange={setMonth}
            onYearChange={setYear}
          />
          <CategoryTable
            period={period}
            month={summaryMonth}
            year={summaryYear}
          />
        </div>

        {/* Right column — 4 cols */}
        <div className="col-span-12 space-y-6 lg:col-span-4">
          <ImportModal />
          <IncomeManager year={summaryYear} month={summaryMonth} />

          {/* Placeholder for budget analytics charts (Phase 8) */}
          <div className="rounded-2xl bg-surface-container-low p-6">
            <h2 className="font-display text-xl font-medium text-on-surface mb-4">
              Spending Trends
            </h2>
            <p className="font-body text-sm text-on-surface-variant">
              Spending trend charts coming in Phase 8.
            </p>
          </div>

          <DebugMenu />
        </div>
      </div>
    </div>
  );
}
