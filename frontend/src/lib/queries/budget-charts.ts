import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useCurrencyStore } from "@/stores/currency-store";

export interface IncomeVsSpendPoint {
  month: string;
  income: number;
  spend: number;
}

export interface SavingsPoint {
  month: string;
  savings: number;
  cumulative: number;
}

export interface InvestmentRatePoint {
  month: string;
  rate: number;
}

export interface CategoryDistributionItem {
  category_id: string | null;
  category_name: string;
  color: string;
  amount: number;
  pct: number;
}

export interface CategoryDistributionData {
  total_spend: number;
  categories: CategoryDistributionItem[];
}

export function useIncomeVsSpend(months: number = 12) {
  const currency = useCurrencyStore((s) => s.currency);

  return useQuery<IncomeVsSpendPoint[]>({
    queryKey: ["budget", "charts", "income-vs-spend", months, currency],
    queryFn: () => {
      const params = new URLSearchParams({
        months: String(months),
      });
      if (currency) params.set("currency", currency);
      return apiFetch<IncomeVsSpendPoint[]>(
        `/budget/charts/income-vs-spend?${params.toString()}`
      );
    },
  });
}

export function useSavingsOverTime(months: number = 12) {
  const currency = useCurrencyStore((s) => s.currency);

  return useQuery<SavingsPoint[]>({
    queryKey: ["budget", "charts", "savings-over-time", months, currency],
    queryFn: () => {
      const params = new URLSearchParams({
        months: String(months),
      });
      if (currency) params.set("currency", currency);
      return apiFetch<SavingsPoint[]>(
        `/budget/charts/savings-over-time?${params.toString()}`
      );
    },
  });
}

export function useInvestmentRateTrend(months: number = 12) {
  const currency = useCurrencyStore((s) => s.currency);

  return useQuery<InvestmentRatePoint[]>({
    queryKey: ["budget", "charts", "investment-rate-trend", months, currency],
    queryFn: () => {
      const params = new URLSearchParams({
        months: String(months),
      });
      if (currency) params.set("currency", currency);
      return apiFetch<InvestmentRatePoint[]>(
        `/budget/charts/investment-rate-trend?${params.toString()}`
      );
    },
  });
}

export function useCategoryDistribution(
  period: string = "monthly",
  month?: number,
  year?: number
) {
  const currency = useCurrencyStore((s) => s.currency);

  return useQuery<CategoryDistributionData>({
    queryKey: [
      "budget",
      "charts",
      "category-distribution",
      period,
      month,
      year,
      currency,
    ],
    queryFn: () => {
      const params = new URLSearchParams({ period });
      if (month !== undefined) params.set("month", String(month));
      if (year !== undefined) params.set("year", String(year));
      if (currency) params.set("currency", currency);
      return apiFetch<CategoryDistributionData>(
        `/budget/charts/category-distribution?${params.toString()}`
      );
    },
  });
}
