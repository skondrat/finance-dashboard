import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useCurrencyStore } from "@/stores/currency-store";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AllocationSegment {
  label: string;
  value: number;
  percentage: number;
}

export interface AllocationResponse {
  group_by: string;
  total: number;
  segments: AllocationSegment[];
}

export interface PerformanceBreakdownResponse {
  capital: number;
  price_gain: number;
  price_gain_pct: number;
  dividends: number;
  dividends_pct: number;
  realized_losses: number;
  realized_losses_pct: number;
  transaction_costs: number;
  total_return: number;
  total_return_pct: number;
  irr: number;
  twr: number;
  currency: string;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useAllocation(groupBy: string) {
  const currency = useCurrencyStore((s) => s.currency);

  return useQuery<AllocationResponse>({
    queryKey: ["portfolio", "allocation", groupBy, currency],
    queryFn: () => {
      const params = new URLSearchParams({ group_by: groupBy });
      if (currency) params.set("currency", currency);
      return apiFetch<AllocationResponse>(
        `/portfolio/allocation?${params.toString()}`
      );
    },
  });
}

export function usePerformanceBreakdown() {
  const currency = useCurrencyStore((s) => s.currency);

  return useQuery<PerformanceBreakdownResponse>({
    queryKey: ["portfolio", "performance-breakdown", currency],
    queryFn: () =>
      apiFetch<PerformanceBreakdownResponse>(
        "/portfolio/performance-breakdown",
        { currency }
      ),
  });
}
