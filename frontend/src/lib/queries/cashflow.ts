import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useCurrencyStore } from "@/stores/currency-store";

export interface SankeyNode {
  id: string;
  label: string;
  type: "income" | "expense" | "savings" | "investments";
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface CashflowSankeyData {
  month: string;
  total_income: number;
  total_spend: number;
  total_savings: number;
  total_investments: number;
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export function useCashflowSankey() {
  const currency = useCurrencyStore((s) => s.currency);

  return useQuery<CashflowSankeyData>({
    queryKey: ["cashflow", "sankey", currency],
    queryFn: () => {
      const params = new URLSearchParams();
      if (currency) params.set("currency", currency);
      const query = params.toString();
      return apiFetch<CashflowSankeyData>(
        `/cashflow/sankey${query ? `?${query}` : ""}`
      );
    },
  });
}
