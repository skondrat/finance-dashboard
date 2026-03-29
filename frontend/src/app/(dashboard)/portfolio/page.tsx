"use client";

import { useState } from "react";
import { KpiStrip } from "@/components/portfolio/kpi-strip";
import { PerformanceChart } from "@/components/portfolio/performance-chart";
import { PositionsList } from "@/components/portfolio/positions-list";
import { AddAccountModal } from "@/components/portfolio/add-account-modal";
import { TransactionsView } from "@/components/portfolio/transactions-view";
import { AllocationDonut } from "@/components/portfolio/allocation-donut";
import { PerformanceBreakdown } from "@/components/portfolio/performance-breakdown";
import { useAccounts, useDeleteAccount } from "@/lib/queries/accounts";

export default function PortfolioPage() {
  const [selectedAccountId, setSelectedAccountId] = useState<
    string | undefined
  >(undefined);
  const { data: accounts } = useAccounts();
  const deleteAccount = useDeleteAccount();

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* KPI strip — full width */}
      <div className="col-span-12">
        <KpiStrip />
      </div>

      {/* Main content — 8 columns */}
      <div className="col-span-12 space-y-6 lg:col-span-8">
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
          {accounts && accounts.length > 0 && (
            <div className="mt-4 space-y-1">
              {accounts.map((acct) => (
                <div
                  key={acct.id}
                  className="flex items-center justify-between rounded-xl bg-surface-container-lowest px-4 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="font-body text-sm text-on-surface truncate">
                      {acct.name}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-on-surface-variant">
                      {acct.type.replace("_", " ")}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Delete "${acct.name}" and all its transactions?`
                        )
                      ) {
                        if (selectedAccountId === acct.id) {
                          setSelectedAccountId(undefined);
                        }
                        deleteAccount.mutate(acct.id);
                      }
                    }}
                    disabled={deleteAccount.isPending}
                    className="ml-2 font-mono text-lg text-on-surface-variant transition-colors hover:text-on-error-container disabled:opacity-50"
                    title="Delete"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <AllocationDonut />
        <PerformanceBreakdown />
      </div>
    </div>
  );
}
