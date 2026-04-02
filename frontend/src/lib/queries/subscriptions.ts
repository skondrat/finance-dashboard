import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface Subscription {
  id: string;
  name: string;
  cadence: string;
  amount: number;
  currency: string;
  payment_day: number | null;
  payment_source: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionSuggestion {
  description: string;
  amount: number;
  currency: string;
  months_detected: number;
  latest_date: string;
}

export interface CreateSubscriptionPayload {
  name: string;
  cadence?: string;
  amount: number;
  currency?: string;
  payment_day?: number | null;
  payment_source?: string | null;
}

export interface UpdateSubscriptionPayload {
  name?: string;
  cadence?: string;
  amount?: number;
  currency?: string;
  payment_day?: number | null;
  payment_source?: string | null;
}

export function useSubscriptions() {
  return useQuery<Subscription[]>({
    queryKey: ["subscriptions"],
    queryFn: () => apiFetch<Subscription[]>("/subscriptions"),
  });
}

export function useCreateSubscription() {
  const qc = useQueryClient();
  return useMutation<Subscription, Error, CreateSubscriptionPayload>({
    mutationFn: (payload) =>
      apiFetch<Subscription>("/subscriptions", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions"] }),
  });
}

export function useUpdateSubscription() {
  const qc = useQueryClient();
  return useMutation<Subscription, Error, { id: string } & UpdateSubscriptionPayload>({
    mutationFn: ({ id, ...payload }) =>
      apiFetch<Subscription>(`/subscriptions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions"] }),
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation<Subscription, Error, string>({
    mutationFn: (id) =>
      apiFetch<Subscription>(`/subscriptions/${id}/cancel`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions"] }),
  });
}

export function useReactivateSubscription() {
  const qc = useQueryClient();
  return useMutation<Subscription, Error, string>({
    mutationFn: (id) =>
      apiFetch<Subscription>(`/subscriptions/${id}/reactivate`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions"] }),
  });
}

export function useDeleteSubscription() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      apiFetch<void>(`/subscriptions/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions"] }),
  });
}

export function useSyncSubscriptionsFromBudget() {
  const qc = useQueryClient();
  return useMutation<{ created: unknown[]; count: number }, Error, void>({
    mutationFn: () =>
      apiFetch("/subscriptions/sync-from-budget", { method: "POST" }),
    onSuccess: (data) => {
      if (data.count > 0) {
        qc.invalidateQueries({ queryKey: ["subscriptions"] });
      }
    },
  });
}

export function useSubscriptionSuggestions(enabled: boolean) {
  return useQuery<{ suggestions: SubscriptionSuggestion[] }>({
    queryKey: ["subscriptions", "suggestions"],
    queryFn: () =>
      apiFetch<{ suggestions: SubscriptionSuggestion[] }>("/subscriptions/suggestions"),
    enabled,
  });
}

export function useDismissSuggestion() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (description) =>
      apiFetch<void>("/subscriptions/suggestions/dismiss", {
        method: "POST",
        body: JSON.stringify({ description }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions"] }),
  });
}

export function usePaymentSources() {
  return useQuery<{ sources: string[] }>({
    queryKey: ["subscriptions", "payment-sources"],
    queryFn: () =>
      apiFetch<{ sources: string[] }>("/subscriptions/payment-sources"),
  });
}
