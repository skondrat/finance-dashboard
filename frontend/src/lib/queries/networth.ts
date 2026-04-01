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

export interface NetworthSnapshot {
  id: string;
  snapshot_month: string;
  total_networth: number;
  currency: string;
  source: string;
  breakdown: Array<{
    name: string;
    balance: number;
    source: string;
    account_type: string | null;
  }> | null;
  updated_at: string;
}

export interface NetworthHistory {
  snapshots: NetworthSnapshot[];
}

export function useNetworthHistory() {
  const currency = useCurrencyStore((s) => s.currency);

  return useQuery<NetworthHistory>({
    queryKey: ["networth", "history", currency],
    queryFn: () =>
      apiFetch<NetworthHistory>(`/networth/history?currency=${currency}`),
  });
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

// ---------------------------------------------------------------------------
// Manual snapshot import
// ---------------------------------------------------------------------------

export interface CreateManualSnapshotPayload {
  snapshot_month: string;
  total_networth: number;
  currency?: string;
}

export interface ManualSnapshotResponse {
  id: string;
  snapshot_month: string;
  total_networth: number;
  currency: string;
  source: string;
  created_at: string;
}

export function useCreateManualSnapshot() {
  const queryClient = useQueryClient();

  return useMutation<ManualSnapshotResponse, Error, CreateManualSnapshotPayload>({
    mutationFn: (payload) =>
      apiFetch<ManualSnapshotResponse>("/networth/snapshots", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["networth"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Delete all manual snapshots
// ---------------------------------------------------------------------------

export interface DeleteManualSnapshotsResponse {
  deleted_count: number;
}

export function useDeleteManualSnapshots() {
  const queryClient = useQueryClient();

  return useMutation<DeleteManualSnapshotsResponse, Error, void>({
    mutationFn: () =>
      apiFetch<DeleteManualSnapshotsResponse>("/networth/snapshots/manual", {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["networth"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Update snapshot
// ---------------------------------------------------------------------------

export interface UpdateSnapshotPayload {
  total_networth: number;
  breakdown: Array<{
    name: string;
    balance: number;
    source: string;
    account_type: string | null;
  }> | null;
}

export function useUpdateSnapshot() {
  const queryClient = useQueryClient();

  return useMutation<NetworthSnapshot, Error, { id: string } & UpdateSnapshotPayload>({
    mutationFn: ({ id, ...payload }) =>
      apiFetch<NetworthSnapshot>(`/networth/snapshots/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["networth"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Networth composition (donut chart)
// ---------------------------------------------------------------------------

export interface CompositionSegment {
  label: string;
  value: number;
  percentage: number;
}

export interface CompositionResponse {
  group_by: string;
  total: number;
  currency: string;
  segments: CompositionSegment[];
}

export function useNetworthComposition(groupBy: string) {
  const currency = useCurrencyStore((s) => s.currency);

  return useQuery<CompositionResponse>({
    queryKey: ["networth", "composition", groupBy, currency],
    queryFn: () => {
      const params = new URLSearchParams({ group_by: groupBy });
      if (currency) params.set("currency", currency);
      return apiFetch<CompositionResponse>(
        `/networth/composition?${params.toString()}`
      );
    },
  });
}
