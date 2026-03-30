"use client";

import { useState, useRef, useEffect } from "react";
import { NetworthChart } from "@/components/networth/networth-chart";
import { SummaryKpi } from "@/components/networth/summary-kpi";
import { AccountsTable } from "@/components/networth/accounts-table";
import { AddAccountModal } from "@/components/networth/add-account-modal";
import { ImportNetworthModal } from "@/components/networth/import-networth-modal";
import { NetworthComposition } from "@/components/networth/networth-composition";
import { EmptyState } from "@/components/ui/empty-state";
import { useNetworthSummary, useNetworthHistory, useDeleteManualSnapshots } from "@/lib/queries/networth";

function SettingsDropdown({
  showDebts,
  onToggleDebts,
  onImportNetworth,
  onRemoveManual,
  hasManualEntries,
}: {
  showDebts: boolean;
  onToggleDebts: () => void;
  onImportNetworth: () => void;
  onRemoveManual: () => void;
  hasManualEntries: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="rounded-xl bg-surface-container-high p-2.5 text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface"
        title="Settings"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path
            fillRule="evenodd"
            d="M8.34 1.804A1 1 0 0 1 9.32 1h1.36a1 1 0 0 1 .98.804l.295 1.473c.497.144.971.342 1.416.587l1.25-.834a1 1 0 0 1 1.262.125l.962.962a1 1 0 0 1 .125 1.262l-.834 1.25c.245.445.443.919.587 1.416l1.473.295a1 1 0 0 1 .804.98v1.361a1 1 0 0 1-.804.98l-1.473.295a6.95 6.95 0 0 1-.587 1.416l.834 1.25a1 1 0 0 1-.125 1.262l-.962.962a1 1 0 0 1-1.262.125l-1.25-.834a6.953 6.953 0 0 1-1.416.587l-.295 1.473a1 1 0 0 1-.98.804H9.32a1 1 0 0 1-.98-.804l-.295-1.473a6.957 6.957 0 0 1-1.416-.587l-1.25.834a1 1 0 0 1-1.262-.125l-.962-.962a1 1 0 0 1-.125-1.262l.834-1.25a6.957 6.957 0 0 1-.587-1.416l-1.473-.295A1 1 0 0 1 1 10.68V9.32a1 1 0 0 1 .804-.98l1.473-.295c.144-.497.342-.971.587-1.416l-.834-1.25a1 1 0 0 1 .125-1.262l.962-.962A1 1 0 0 1 5.38 3.03l1.25.834a6.957 6.957 0 0 1 1.416-.587l.294-1.473ZM13 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 rounded-xl bg-surface-container-lowest p-4 shadow-ambient min-w-[220px] space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showDebts}
              onChange={onToggleDebts}
              className="h-4 w-4 rounded accent-primary"
            />
            <span className="font-mono text-xs uppercase tracking-[0.1em] text-on-surface">
              Show Debts
            </span>
          </label>
          <hr className="border-outline-variant/20" />
          <button
            onClick={() => {
              setOpen(false);
              onImportNetworth();
            }}
            className="w-full text-left font-mono text-xs uppercase tracking-[0.1em] text-on-surface hover:text-primary transition-colors py-1"
          >
            Import previous networth
          </button>
          {hasManualEntries && (
            <button
              onClick={() => {
                setOpen(false);
                onRemoveManual();
              }}
              className="w-full text-left font-mono text-xs uppercase tracking-[0.1em] text-on-error-container hover:text-on-error-container/80 transition-colors py-1"
            >
              Remove all manual NW entries
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function NetworthPage() {
  const { data: summary, isLoading } = useNetworthSummary();
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [showDebts, setShowDebts] = useState(false);
  const [editAccount, setEditAccount] = useState<{
    id: string;
    name: string;
    balance: number;
    currency: string;
    account_type: string;
  } | null>(null);

  const deleteManualMutation = useDeleteManualSnapshots();

  const { data: history } = useNetworthHistory();
  const hasManualEntries =
    (history?.snapshots ?? []).some((s) => s.source === "manual");

  const hasAccounts =
    summary && summary.accounts.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          <SettingsDropdown
            showDebts={showDebts}
            onToggleDebts={() => setShowDebts(!showDebts)}
            onImportNetworth={() => setImportModalOpen(true)}
            onRemoveManual={() => {
              if (window.confirm("Are you sure you want to remove all manually imported networth entries? This cannot be undone.")) {
                deleteManualMutation.mutate();
              }
            }}
            hasManualEntries={hasManualEntries}
          />
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
      </div>

      <SummaryKpi showDebts={showDebts} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <NetworthChart />
        <NetworthComposition />
      </div>

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
          showDebts={showDebts}
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

      <ImportNetworthModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
      />
    </div>
  );
}
