import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useCurrencyStore } from "@/stores/currency-store";

export interface SankeyNode {
  id: string;
  label: string;
  type: "income" | "major" | "expense" | "savings" | "investments";
  level?: number;
  color?: string;
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

export type CashflowPeriod = "monthly" | "yearly" | "ytd";

export function useCashflowSankey(
  year?: number,
  month?: number,
  period: CashflowPeriod = "monthly"
) {
  const currency = useCurrencyStore((s) => s.currency);

  return useQuery<CashflowSankeyData>({
    queryKey: ["cashflow", "sankey", currency, period, year, month],
    queryFn: () => {
      const params = new URLSearchParams();
      if (currency) params.set("currency", currency);
      params.set("period", period);
      if (year !== undefined) params.set("year", String(year));
      if (period === "monthly" && month !== undefined)
        params.set("month", String(month));
      const query = params.toString();
      return apiFetch<CashflowSankeyData>(
        `/cashflow/sankey${query ? `?${query}` : ""}`
      );
    },
  });
}
