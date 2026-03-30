import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionAsset {
  id: string;
  ticker: string;
  name: string;
  type: string;
}

export interface Transaction {
  id: string;
  asset: TransactionAsset;
  type: string;
  quantity: number;
  price_per_unit: number;
  currency: string;
  fees: number;
  date: string;
}

export interface CreateAccountPayload {
  name: string;
  type: string;
  currency: string;
}

export interface CreateTransactionPayload {
  asset_ticker: string;
  type: string;
  quantity: number;
  price_per_unit: number;
  currency: string;
  fees?: number;
  date: string;
}

export function useAccounts() {
  return useQuery<Account[]>({
    queryKey: ["accounts"],
    queryFn: () => apiFetch<Account[]>("/accounts"),
  });
}

export function useTransactions(accountId: string) {
  return useQuery<Transaction[]>({
    queryKey: ["accounts", accountId, "transactions"],
    queryFn: () =>
      apiFetch<Transaction[]>(`/accounts/${accountId}/transactions`),
    enabled: !!accountId,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation<Account, Error, CreateAccountPayload>({
    mutationFn: (payload) =>
      apiFetch<Account>("/accounts", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      apiFetch<void>(`/accounts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-summary"] });
    },
  });
}

export interface UpdateTransactionPayload {
  asset_ticker?: string;
  type?: string;
  quantity?: number;
  price_per_unit?: number;
  currency?: string;
  fees?: number;
  date?: string;
}

export function useUpdateTransaction(accountId: string) {
  const queryClient = useQueryClient();

  return useMutation<Transaction, Error, { txnId: string; payload: UpdateTransactionPayload }>({
    mutationFn: ({ txnId, payload }) =>
      apiFetch<Transaction>(`/accounts/${accountId}/transactions/${txnId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

export function useDeleteTransaction(accountId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (txnId) =>
      apiFetch<void>(`/accounts/${accountId}/transactions/${txnId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

export function useCreateTransaction(accountId: string) {
  const queryClient = useQueryClient();

  return useMutation<Transaction, Error, CreateTransactionPayload>({
    mutationFn: (payload) =>
      apiFetch<Transaction>(`/accounts/${accountId}/transactions`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["accounts", accountId, "transactions"],
      });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
