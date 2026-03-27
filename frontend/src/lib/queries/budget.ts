import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useCurrencyStore } from "@/stores/currency-store";

export interface BudgetSummary {
  income: number;
  spend: number;
  savings: number;
  saving_rate: number;
  investment_rate: number;
  budget_remaining: number;
}

export interface SpendByCategoryItem {
  category: {
    id: string;
    name: string;
    color: string;
    monthly_budget: number | null;
    is_archived: boolean;
    is_default: boolean;
  };
  budget: number | null;
  spent: number;
  remaining: number | null;
  pct_of_total: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  budget: number | null;
}

export interface BudgetTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category_id: string | null;
  category_name: string | null;
  account_id: string;
}

export interface IncomeSource {
  id: string;
  label: string;
  amount: number;
  currency: string;
  year: number;
  month: number;
}

export interface ImportResponse {
  id: string;
  rows: Array<{
    date: string;
    description: string;
    amount: number;
    category_guess: string | null;
  }>;
  file_name: string;
}

export function useBudgetSummary(
  period: string,
  month?: number,
  year?: number
) {
  const currency = useCurrencyStore((s) => s.currency);

  return useQuery<BudgetSummary>({
    queryKey: ["budget", "summary", period, month, year, currency],
    queryFn: () => {
      const params = new URLSearchParams({ period });
      if (month !== undefined) params.set("month", String(month));
      if (year !== undefined) params.set("year", String(year));
      if (currency) params.set("currency", currency);
      return apiFetch<BudgetSummary>(
        `/budget/summary?${params.toString()}`
      );
    },
  });
}

export function useSpendByCategory(
  period: string,
  month?: number,
  year?: number
) {
  const currency = useCurrencyStore((s) => s.currency);

  return useQuery<SpendByCategoryItem[]>({
    queryKey: ["budget", "spend-by-category", period, month, year, currency],
    queryFn: () => {
      const params = new URLSearchParams({ period });
      if (month !== undefined) params.set("month", String(month));
      if (year !== undefined) params.set("year", String(year));
      if (currency) params.set("currency", currency);
      return apiFetch<SpendByCategoryItem[]>(
        `/budget/spend-by-category?${params.toString()}`
      );
    },
  });
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["budget", "categories"],
    queryFn: () => apiFetch<Category[]>("/budget/categories"),
  });
}

export function useBudgetTransactions(params?: {
  category_id?: string;
  month?: number;
  year?: number;
  limit?: number;
  offset?: number;
}) {
  const currency = useCurrencyStore((s) => s.currency);

  return useQuery<BudgetTransaction[]>({
    queryKey: ["budget", "transactions", params, currency],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (params?.category_id) qs.set("category_id", params.category_id);
      if (params?.month !== undefined) qs.set("month", String(params.month));
      if (params?.year !== undefined) qs.set("year", String(params.year));
      if (params?.limit !== undefined) qs.set("limit", String(params.limit));
      if (params?.offset !== undefined)
        qs.set("offset", String(params.offset));
      if (currency) qs.set("currency", currency);
      const query = qs.toString();
      return apiFetch<BudgetTransaction[]>(
        `/budget/transactions${query ? `?${query}` : ""}`
      );
    },
  });
}

export function useIncomes(year?: number, month?: number) {
  const currency = useCurrencyStore((s) => s.currency);

  return useQuery<IncomeSource[]>({
    queryKey: ["budget", "income", year, month, currency],
    queryFn: () => {
      const params = new URLSearchParams();
      if (year !== undefined) params.set("year", String(year));
      if (month !== undefined) params.set("month", String(month));
      if (currency) params.set("currency", currency);
      const query = params.toString();
      return apiFetch<IncomeSource[]>(
        `/budget/income${query ? `?${query}` : ""}`
      );
    },
  });
}

export function useImportUpload() {
  const queryClient = useQueryClient();

  return useMutation<ImportResponse, Error, File>({
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append("file", file);

      return apiFetch<ImportResponse>("/budget/import/upload", {
        method: "POST",
        body: formData,
        headers: {},
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget"] });
    },
  });
}

export function useConfirmImport() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (importId) =>
      apiFetch<void>(`/budget/import/${importId}/confirm`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget"] });
    },
  });
}
