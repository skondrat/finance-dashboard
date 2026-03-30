"use client";

import { useState, useEffect, useRef } from "react";
import { KpiStrip } from "@/components/portfolio/kpi-strip";
import { PerformanceChart } from "@/components/portfolio/performance-chart";
import { PositionsList } from "@/components/portfolio/positions-list";
import { AddAccountModal } from "@/components/portfolio/add-account-modal";
import { TransactionsView } from "@/components/portfolio/transactions-view";
import { AllocationDonut } from "@/components/portfolio/allocation-donut";
import { PerformanceBreakdown } from "@/components/portfolio/performance-breakdown";
import { useAccounts, useDeleteAccount } from "@/lib/queries/accounts";
import { useRefreshPrices, usePortfolioSummary } from "@/lib/queries/portfolio";
import { cn } from "@/lib/utils";

export default function PortfolioPage() {
  const [selectedAccountId, setSelectedAccountId] = useState<
    string | undefined
  >(undefined);
  const { data: accounts } = useAccounts();
  const deleteAccount = useDeleteAccount();
  const refreshPrices = useRefreshPrices();
  const { data: summary } = usePortfolioSummary(selectedAccountId);
  const autoRefreshDone = useRef(false);

  useEffect(() => {
    if (autoRefreshDone.current || refreshPrices.isPending) return;
    if (!summary) return;

    const lastRefresh = summary.last_refreshed_at
      ? new Date(summary.last_refreshed_at).getTime()
      : 0;
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    if (lastRefresh < oneHourAgo) {
      autoRefreshDone.current = true;
      refreshPrices.mutate();
    }
  }, [summary, refreshPrices.isPending]);

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Account selector — full width, top */}
      {accounts && accounts.length > 0 && (
        <div className="col-span-12 flex items-center gap-4 overflow-x-auto">
          <button
            onClick={() => setSelectedAccountId(undefined)}
            className={cn(
              "shrink-0 pb-1 font-mono text-xs uppercase tracking-[0.1em] transition-colors",
              selectedAccountId === undefined
                ? "text-on-surface border-b-2 border-on-surface"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            Aggregated
          </button>
          {accounts.map((account) => (
            <button
              key={account.id}
              onClick={() => setSelectedAccountId(account.id)}
              className={cn(
                "shrink-0 pb-1 font-mono text-xs uppercase tracking-[0.1em] transition-colors",
                selectedAccountId === account.id
                  ? "text-on-surface border-b-2 border-on-surface"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              {account.name}
            </button>
          ))}
        </div>
      )}

      {/* KPI strip — full width */}
      <div className="col-span-12 flex items-start justify-between gap-4">
        <div className="flex-1">
          <KpiStrip accountId={selectedAccountId} />
        </div>
        <button
          onClick={() => refreshPrices.mutate()}
          disabled={refreshPrices.isPending}
          className="mt-2 shrink-0 rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface disabled:opacity-50"
          title="Refresh Prices"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={refreshPrices.isPending ? "animate-spin" : ""}
          >
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        </button>
      </div>

      {/* Main content — 8 columns */}
      <div className="col-span-12 space-y-6 lg:col-span-8">
        <PerformanceChart accountId={selectedAccountId} />
        <PositionsList accountId={selectedAccountId} />
        <TransactionsView accountId={selectedAccountId} />
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
