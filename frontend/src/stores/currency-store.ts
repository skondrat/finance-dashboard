import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { create } from "zustand";

interface CurrencyState {
  currency: "EUR" | "USD";
  setCurrency: (currency: "EUR" | "USD") => void;
}

export const useCurrencyStore = create<CurrencyState>((set) => ({
  currency: "EUR",
  setCurrency: (currency) => set({ currency }),
}));

/**
 * Hook that invalidates all TanStack Query caches whenever the selected
 * display currency changes. Drop this into a top-level layout component
 * so every data query re-fetches with the new currency.
 */
export function useCurrencyInvalidation() {
  const queryClient = useQueryClient();
  const currency = useCurrencyStore((s) => s.currency);
  const prevCurrency = useRef(currency);

  useEffect(() => {
    if (prevCurrency.current !== currency) {
      prevCurrency.current = currency;
      queryClient.invalidateQueries();
    }
  }, [currency, queryClient]);
}
