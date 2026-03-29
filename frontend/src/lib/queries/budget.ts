import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, getAccessToken } from "@/lib/api";
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

export interface ImportRow {
  date: string;
  description: string;
  amount: number;
  currency: string;
  type: string;
  category_id: string | null;
  category_name: string | null;
  category_source: string;
  category_guess: string | null;
}

export interface ImportResponse {
  id: string;
  status: string;
  file_name: string;
  source: string | null;
  row_count: number;
  duplicate_count: number;
  skipped_count: number;
  excluded_count: number;
  rows: ImportRow[];
}

export interface ImportCategory {
  id: string;
  name: string;
  color: string;
  monthly_budget?: number | null;
}

export interface CategoryOverride {
  row_index: number;
  category_id: string;
}

export interface CashSplitItem {
  description: string;
  amount: number;
  category_id: string | null;
  category_name: string | null;
}

export interface SplitAtmResponse {
  items: CashSplitItem[];
  remainder: number;
}

export interface SplitState {
  original: ImportRow;
  items: CashSplitItem[];
  remainder: number;
}

export interface SplitConfirmItem {
  description: string;
  amount: number;
  category_id: string | null;
}

export interface SplitOverride {
  row_index: number;
  items: SplitConfirmItem[];
}

export interface UploadParams {
  file: File;
  source?: string;
}

export function useBudgetSummary(
  period: string,
  month?: number,
  year?: number,
  fromDate?: string,
  toDate?: string
) {
  const currency = useCurrencyStore((s) => s.currency);

  return useQuery<BudgetSummary>({
    queryKey: ["budget", "summary", period, month, year, fromDate, toDate, currency],
    queryFn: () => {
      const params = new URLSearchParams({ period });
      if (month !== undefined) params.set("month", String(month));
      if (year !== undefined) params.set("year", String(year));
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      if (currency) params.set("currency", currency);
      return apiFetch<BudgetSummary>(
        `/budget/summary?${params.toString()}`
      );
    },
    enabled: period !== "custom" || (!!fromDate && !!toDate),
  });
}

export function useSpendByCategory(
  period: string,
  month?: number,
  year?: number,
  fromDate?: string,
  toDate?: string
) {
  const currency = useCurrencyStore((s) => s.currency);

  return useQuery<SpendByCategoryItem[]>({
    queryKey: ["budget", "spend-by-category", period, month, year, fromDate, toDate, currency],
    queryFn: () => {
      const params = new URLSearchParams({ period });
      if (month !== undefined) params.set("month", String(month));
      if (year !== undefined) params.set("year", String(year));
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      if (currency) params.set("currency", currency);
      return apiFetch<SpendByCategoryItem[]>(
        `/budget/spend-by-category?${params.toString()}`
      );
    },
    enabled: period !== "custom" || (!!fromDate && !!toDate),
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

  return useMutation<ImportResponse, Error, UploadParams>({
    mutationFn: ({ file, source }) => {
      const formData = new FormData();
      formData.append("file", file);
      if (source) {
        formData.append("source", source);
      }

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

export interface ImportProgress {
  stage: "idle" | "extracting" | "categorizing" | "saving" | "complete" | "error";
  total: number;
  done: number;
  result: ImportResponse | null;
  importId: string | null;
  error: string | null;
  isProcessing: boolean;
}

export function useImportWithProgress() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<ImportProgress>({
    stage: "idle",
    total: 0,
    done: 0,
    result: null,
    importId: null,
    error: null,
    isProcessing: false,
  });

  const upload = useCallback(
    async (file: File, source?: string) => {
      setProgress({
        stage: "extracting",
        total: 0,
        done: 0,
        result: null,
        importId: null,
        error: null,
        isProcessing: true,
      });

      const API_BASE =
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

      const formData = new FormData();
      formData.append("file", file);
      if (source) {
        formData.append("source", source);
      }

      try {
        const headers: Record<string, string> = {};
        const token = getAccessToken();
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}/budget/import/upload`, {
          method: "POST",
          body: formData,
          credentials: "include",
          headers,
        });

        if (!response.ok || !response.body) {
          const error = await response
            .json()
            .catch(() => ({ detail: response.statusText }));
          const detail = error.detail;
          const message =
            typeof detail === "string"
              ? detail
              : typeof detail === "object" && detail.message
                ? `${detail.message} ${detail.action ?? ""}`
                : `API error: ${response.status}`;
          setProgress((p) => ({
            ...p,
            stage: "error",
            error: message,
            isProcessing: false,
          }));
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events from buffer
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6);
            if (!jsonStr.trim()) continue;

            try {
              const evt = JSON.parse(jsonStr);

              if (evt.stage === "extracting") {
                setProgress((p) => ({ ...p, stage: "extracting" }));
              } else if (evt.stage === "categorizing") {
                setProgress((p) => ({
                  ...p,
                  stage: "categorizing",
                  total: evt.total ?? p.total,
                  done: evt.done ?? p.done,
                }));
              } else if (evt.stage === "saving") {
                setProgress((p) => ({ ...p, stage: "saving" }));
              } else if (evt.stage === "complete") {
                setProgress({
                  stage: "complete",
                  total: 0,
                  done: 0,
                  result: evt.result,
                  importId: evt.result?.id ?? null,
                  error: null,
                  isProcessing: false,
                });
                queryClient.invalidateQueries({ queryKey: ["budget"] });
              } else if (evt.stage === "error") {
                setProgress((p) => ({
                  ...p,
                  stage: "error",
                  error: evt.message ?? "Import failed",
                  isProcessing: false,
                }));
              }
            } catch {
              // skip malformed SSE lines
            }
          }
        }
      } catch (err) {
        setProgress((p) => ({
          ...p,
          stage: "error",
          error:
            err instanceof Error
              ? err.message
              : "Connection lost. The import may still be processing.",
          isProcessing: false,
        }));
      }
    },
    [queryClient]
  );

  const reset = useCallback(() => {
    setProgress({
      stage: "idle",
      total: 0,
      done: 0,
      result: null,
      importId: null,
      error: null,
      isProcessing: false,
    });
  }, []);

  return { progress, upload, reset };
}

export function useSplitAtmCash() {
  return useMutation<
    SplitAtmResponse,
    Error,
    { importId: string; rowIndex: number; notes: string }
  >({
    mutationFn: ({ importId, rowIndex, notes }) =>
      apiFetch<SplitAtmResponse>(
        `/budget/import/${importId}/split-atm-cash`,
        {
          method: "POST",
          body: JSON.stringify({ row_index: rowIndex, notes }),
        }
      ),
  });
}

export function useConfirmImport() {
  const queryClient = useQueryClient();

  return useMutation<
    { id: string; status: string; row_count: number; mappings_updated: number },
    Error,
    {
      importId: string;
      categoryOverrides?: CategoryOverride[];
      splits?: SplitOverride[];
    }
  >({
    mutationFn: ({ importId, categoryOverrides, splits }) =>
      apiFetch(`/budget/import/${importId}/confirm`, {
        method: "POST",
        body: JSON.stringify({
          category_overrides: categoryOverrides ?? null,
          splits: splits ?? null,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget"] });
    },
  });
}

export function useImportCategories() {
  return useQuery<{ categories: ImportCategory[] }>({
    queryKey: ["budget", "import-categories"],
    queryFn: () =>
      apiFetch<{ categories: ImportCategory[] }>(
        "/budget/import/categories"
      ),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation<
    { id: string; name: string; color: string; monthly_budget: number | null },
    Error,
    { name: string; monthly_budget?: number }
  >({
    mutationFn: (data) =>
      apiFetch("/budget/categories", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation<
    { id: string; name: string; color: string; monthly_budget: number | null },
    Error,
    { id: string; monthly_budget?: number | null }
  >({
    mutationFn: ({ id, ...data }) =>
      apiFetch(`/budget/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      apiFetch(`/budget/categories/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget"] });
    },
  });
}

export function useEnsureRequiredCategories() {
  const queryClient = useQueryClient();

  return useMutation<{ created: string[] }, Error, void>({
    mutationFn: () =>
      apiFetch("/budget/categories/ensure-required", {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget"] });
    },
  });
}

export function useSeedCategoriesUpload() {
  const queryClient = useQueryClient();

  return useMutation<
    { categories_loaded: number; examples_loaded: number; budgets_loaded: number },
    Error,
    File
  >({
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiFetch("/budget/import/seed-categories", {
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
