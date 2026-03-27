import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface LatestRate {
  base_currency: string;
  target_currency: string;
  rate: number;
  date: string;
}

export interface HistoricalRateEntry {
  date: string;
  rate: number;
}

export interface HistoricalRates {
  base_currency: string;
  target_currency: string;
  rates: HistoricalRateEntry[];
}

export function useLatestRate(base = "EUR", target = "USD") {
  return useQuery<LatestRate>({
    queryKey: ["exchange-rates", "latest", base, target],
    queryFn: () =>
      apiFetch<LatestRate>(
        `/exchange-rates/latest?base=${encodeURIComponent(base)}&target=${encodeURIComponent(target)}`
      ),
  });
}

export function useHistoricalRates(
  from: string,
  to: string,
  base = "EUR",
  target = "USD"
) {
  return useQuery<HistoricalRates>({
    queryKey: ["exchange-rates", base, target, from, to],
    queryFn: () =>
      apiFetch<HistoricalRates>(
        `/exchange-rates?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&base=${encodeURIComponent(base)}&target=${encodeURIComponent(target)}`
      ),
    enabled: !!from && !!to,
  });
}
