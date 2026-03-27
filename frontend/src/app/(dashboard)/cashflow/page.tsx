"use client";

import { CashflowKpiStrip } from "@/components/cashflow/kpi-strip";
import { SankeyDiagram } from "@/components/cashflow/sankey-diagram";
import { BreakdownRow } from "@/components/cashflow/breakdown-row";

export default function CashflowPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-medium text-on-surface">
        Cashflow
      </h1>

      {/* KPI strip — full width */}
      <CashflowKpiStrip />

      {/* Sankey diagram — full width, surface-container-low panel */}
      <SankeyDiagram />

      {/* Breakdown row — 6+6 grid */}
      <BreakdownRow />
    </div>
  );
}
