import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useCurrencyStore } from "@/stores/currency-store";

export interface NetworthAccount {
  id: string;
  name: string;
  balance: number;
  currency: string;
  account_type: string;
  created_at: string;
  updated_at: string;
}

export interface NetworthSummaryAccount {
  id: string;
  name: string;
  balance: number;
  original_currency: string;
  converted_balance: number;
  percentage: number;
  source: "manual" | "investment";
  account_type: string | null;
  conversion_available: boolean;
}

export interface NetworthSummary {
  total_networth: number;
  manual_total: number;
  investment_total: number;
  currency: string;
  accounts: NetworthSummaryAccount[];
}

export interface CreateNetworthAccountPayload {
  name: string;
  balance?: number;
  currency?: string;
  account_type?: string;
}

export interface UpdateNetworthAccountPayload {
  name?: string;
  balance?: number;
  currency?: string;
  account_type?: string;
}

export function useNetworthAccounts() {
  return useQuery<NetworthAccount[]>({
    queryKey: ["networth", "accounts"],
    queryFn: () => apiFetch<NetworthAccount[]>("/networth/accounts"),
  });
}

export function useNetworthSummary() {
  const currency = useCurrencyStore((s) => s.currency);

  return useQuery<NetworthSummary>({
    queryKey: ["networth", "summary", currency],
    queryFn: () =>
      apiFetch<NetworthSummary>("/networth/summary", { currency }),
  });
}

export function useCreateNetworthAccount() {
  const queryClient = useQueryClient();

  return useMutation<NetworthAccount, Error, CreateNetworthAccountPayload>({
    mutationFn: (payload) =>
      apiFetch<NetworthAccount>("/networth/accounts", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["networth"] });
    },
  });
}

export function useUpdateNetworthAccount() {
  const queryClient = useQueryClient();

  return useMutation<
    NetworthAccount,
    Error,
    { id: string } & UpdateNetworthAccountPayload
  >({
    mutationFn: ({ id, ...payload }) =>
      apiFetch<NetworthAccount>(`/networth/accounts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["networth"] });
    },
  });
}

export function useDeleteNetworthAccount() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      apiFetch<void>(`/networth/accounts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["networth"] });
    },
  });
}
