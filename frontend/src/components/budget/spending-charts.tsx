"use client";

import { CategoryDistributionChart } from "@/components/budget/charts/category-distribution";
import { IncomeVsSpendChart } from "@/components/budget/charts/income-vs-spend";
import { MonthComparison } from "@/components/budget/charts/month-comparison";

interface SpendingChartsProps {
  period?: string;
  month?: number;
  year?: number;
}

export function SpendingCharts({ period, month, year }: SpendingChartsProps) {
  return (
    <div className="space-y-6">
      <CategoryDistributionChart period={period} month={month} year={year} />
      {period === "monthly" && month && year && (
        <MonthComparison month={month} year={year} />
      )}
      <IncomeVsSpendChart />
    </div>
  );
}
