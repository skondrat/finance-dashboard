"use client";

import { useState } from "react";
import { KpiStrip } from "@/components/portfolio/kpi-strip";
import { PerformanceChart } from "@/components/portfolio/performance-chart";
import { PositionsList } from "@/components/portfolio/positions-list";
import { AddAccountModal } from "@/components/portfolio/add-account-modal";
import { TransactionsView } from "@/components/portfolio/transactions-view";
import { AllocationDonut } from "@/components/portfolio/allocation-donut";
import { PerformanceBreakdown } from "@/components/portfolio/performance-breakdown";

export default function PortfolioPage() {
  const [selectedAccountId, setSelectedAccountId] = useState<
    string | undefined
  >(undefined);

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Main content — 8 columns */}
      <div className="col-span-12 space-y-6 lg:col-span-8">
        <KpiStrip />
        <PerformanceChart />
        <PositionsList onAccountChange={setSelectedAccountId} />
        {selectedAccountId && (
          <TransactionsView accountId={selectedAccountId} />
        )}
      </div>

      {/* Metadata rail — 4 columns */}
      <div className="col-span-12 space-y-6 lg:col-span-4">
        <div className="rounded-2xl bg-surface-container-low p-6">
          <h2 className="font-display text-xl font-medium text-on-surface mb-4">
            Accounts
          </h2>
          <AddAccountModal />
        </div>
        <AllocationDonut />
        <PerformanceBreakdown />
      </div>
    </div>
  );
}
