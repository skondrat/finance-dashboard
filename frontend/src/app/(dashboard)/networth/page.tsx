"use client";

import { useState } from "react";
import { SummaryKpi } from "@/components/networth/summary-kpi";
import { AccountsTable } from "@/components/networth/accounts-table";
import { AddAccountModal } from "@/components/networth/add-account-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { useNetworthSummary } from "@/lib/queries/networth";

export default function NetworthPage() {
  const { data: summary, isLoading } = useNetworthSummary();
  const [modalOpen, setModalOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<{
    id: string;
    name: string;
    balance: number;
    currency: string;
    account_type: string;
  } | null>(null);

  const hasAccounts =
    summary && summary.accounts.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-medium text-on-surface">
          Net Worth
        </h1>
        <button
          onClick={() => {
            setEditAccount(null);
            setModalOpen(true);
          }}
          className="rounded-xl bg-surface-container-high px-4 py-2.5 font-mono text-xs uppercase tracking-[0.1em] text-on-surface transition-colors hover:bg-surface-container-highest"
        >
          Add Account
        </button>
      </div>

      <SummaryKpi />

      {!isLoading && !hasAccounts ? (
        <EmptyState
          title="No accounts yet"
          description="Add your bank accounts, crypto wallets, and cash savings to see your total net worth."
          action={{
            label: "Add Account",
            onClick: () => {
              setEditAccount(null);
              setModalOpen(true);
            },
          }}
        />
      ) : (
        <AccountsTable
          onEdit={(acct) => {
            setEditAccount(acct);
            setModalOpen(true);
          }}
        />
      )}

      <AddAccountModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditAccount(null);
        }}
        editAccount={editAccount}
      />
    </div>
  );
}
