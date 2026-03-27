import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useCurrencyStore } from "@/stores/currency-store";

export interface PortfolioSummary {
  net_worth: number;
  total_return: number;
  return_pct: number;
  saving_rate: number;
  investment_rate: number;
  invested_capital: number;
}

export interface PositionAsset {
  id: string;
  ticker: string;
  name: string;
  asset_type: string;
}

export interface Position {
  asset: PositionAsset;
  quantity: number;
  avg_cost_basis: number;
  total_cost: number;
  current_price: number;
  current_value: number;
  pnl_absolute: number;
  pnl_percent: number;
  weight: number;
  currency: string;
}

export interface PerformancePoint {
  date: string;
  value: number;
}

export function usePortfolioSummary() {
  const currency = useCurrencyStore((s) => s.currency);

  return useQuery<PortfolioSummary>({
    queryKey: ["portfolio", "summary", currency],
    queryFn: () =>
      apiFetch<PortfolioSummary>("/portfolio/summary", { currency }),
  });
}

export function usePositions(accountId?: string) {
  const currency = useCurrencyStore((s) => s.currency);

  return useQuery<Position[]>({
    queryKey: ["portfolio", "positions", currency, accountId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (accountId) params.set("account_id", accountId);
      if (currency) params.set("currency", currency);
      const qs = params.toString();
      return apiFetch<Position[]>(`/portfolio/positions${qs ? `?${qs}` : ""}`);
    },
  });
}

interface PerformanceResponse {
  range: string;
  data_points: PerformancePoint[];
}

export function usePerformanceChart(range: string) {
  const currency = useCurrencyStore((s) => s.currency);

  return useQuery<PerformancePoint[]>({
    queryKey: ["portfolio", "performance", range, currency],
    queryFn: async () => {
      const params = new URLSearchParams({ range });
      if (currency) params.set("currency", currency);
      const res = await apiFetch<PerformanceResponse>(
        `/portfolio/performance?${params.toString()}`
      );
      return res.data_points;
    },
  });
}
