"use client";

import { useState } from "react";
import Link from "next/link";
import { BudgetKpiStrip } from "@/components/budget/kpi-strip";
import { TimeAggregation, type Period } from "@/components/budget/time-aggregation";
import { CategoryTable } from "@/components/budget/category-table";
import { ImportModal } from "@/components/budget/import-modal";
import { AddSpendModal } from "@/components/budget/add-spend-modal";
import { IncomeManager } from "@/components/budget/income-manager";
import { DebugMenu } from "@/components/budget/debug-menu";
import { SpendingCharts } from "@/components/budget/spending-charts";
import { SettingsMenu } from "@/components/budget/settings-menu";
import { TransactionList } from "@/components/budget/transaction-list";
import { useImportCategories } from "@/lib/queries/budget";

function readSessionInt(key: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  const v = sessionStorage.getItem(key);
  return v ? parseInt(v, 10) : fallback;
}

export default function BudgetPage() {
  const now = new Date();
  const [period, setPeriod] = useState<Period>("monthly");
  const [month, setMonthRaw] = useState(() => readSessionInt("budget_month", now.getMonth() + 1));
  const [year, setYearRaw] = useState(() => readSessionInt("budget_year", now.getFullYear()));
  const setMonth = (m: number) => { sessionStorage.setItem("budget_month", String(m)); setMonthRaw(m); };
  const setYear = (y: number) => { sessionStorage.setItem("budget_year", String(y)); setYearRaw(y); };
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [txCategoryFilter, setTxCategoryFilter] = useState<string | null>(null);

  const { data: categoriesData, isLoading: categoriesLoading } =
    useImportCategories();
  const categories = categoriesData?.categories ?? [];
  const hasCategories = categories.length > 0;

  const summaryMonth = period === "monthly" ? month : undefined;
  const summaryYear =
    period === "monthly" || period === "yearly" ? year : undefined;
  const summaryFrom = period === "custom" ? fromDate : undefined;
  const summaryTo = period === "custom" ? toDate : undefined;

  // Compute from/to dates for transaction list based on period
  const txFrom = (() => {
    if (period === "monthly") return `${year}-${String(month).padStart(2, "0")}-01`;
    if (period === "yearly") return `${year}-01-01`;
    if (period === "ytd") return `${year}-01-01`;
    if (period === "custom") return fromDate || undefined;
    return undefined;
  })();
  const txTo = (() => {
    if (period === "monthly") {
      const lastDay = new Date(year, month, 0).getDate();
      return `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    }
    if (period === "yearly") return `${year}-12-31`;
    if (period === "ytd") return new Date().toISOString().split("T")[0];
    if (period === "custom") return toDate || undefined;
    return undefined;
  })();

  if (categoriesLoading) {
    return null;
  }

  if (!hasCategories) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="absolute top-6 right-6">
          <SettingsMenu />
        </div>
        <div className="text-center space-y-3">
          <h2 className="font-display text-xl font-medium text-on-surface">
            No categories set up
          </h2>
          <p className="font-body text-sm text-on-surface-variant max-w-md">
            Set up your spending categories before importing statements.
          </p>
        </div>
        <Link
          href="/budget/categories"
          className="rounded-xl bg-on-surface px-6 py-3 font-mono text-xs uppercase tracking-[0.1em] text-surface transition-colors hover:bg-on-surface/90"
        >
          Init Categories
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Full-width KPI strip */}
      <BudgetKpiStrip period={period} month={summaryMonth} year={summaryYear} fromDate={summaryFrom} toDate={summaryTo} />

      {/* 12-col grid: 8 + 4 */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left column — 8 cols */}
        <div className="col-span-12 space-y-6 lg:col-span-8">
          <TimeAggregation
            period={period}
            month={month}
            year={year}
            fromDate={fromDate}
            toDate={toDate}
            onPeriodChange={setPeriod}
            onMonthChange={setMonth}
            onYearChange={setYear}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
          />
          <CategoryTable
            period={period}
            month={summaryMonth}
            year={summaryYear}
            fromDate={summaryFrom}
            toDate={summaryTo}
            onCategoryClick={(categoryId) => {
              setTxCategoryFilter(categoryId);
              document.getElementById("transaction-list")?.scrollIntoView({ behavior: "smooth" });
            }}
          />
          <TransactionList
            from={txFrom}
            to={txTo}
            filterCategoryId={txCategoryFilter}
            onClearCategoryFilter={() => setTxCategoryFilter(null)}
          />
        </div>

        {/* Right column — 4 cols */}
        <div className="col-span-12 space-y-6 lg:col-span-4">
          <div className="flex items-center gap-2">
            <ImportModal />
            <AddSpendModal month={summaryMonth} year={summaryYear} />
            <SettingsMenu />
          </div>
          <IncomeManager year={summaryYear} month={summaryMonth} />

          <SpendingCharts period={period} month={summaryMonth} year={summaryYear} />

          <DebugMenu />
        </div>
      </div>
    </div>
  );
}
