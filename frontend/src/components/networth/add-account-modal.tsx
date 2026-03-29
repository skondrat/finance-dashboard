"use client";

import { useState, useEffect, type FormEvent } from "react";
import {
  useCreateNetworthAccount,
  useUpdateNetworthAccount,
} from "@/lib/queries/networth";
import { cn } from "@/lib/utils";

const ACCOUNT_TYPES = [
  { value: "bank", label: "Bank" },
  { value: "crypto", label: "Crypto" },
  { value: "cash", label: "Cash" },
  { value: "debt", label: "Debt" },
] as const;

const CURRENCIES = [
  { value: "EUR", label: "EUR" },
  { value: "USD", label: "USD" },
  { value: "PLN", label: "PLN" },
  { value: "GBP", label: "GBP" },
] as const;

interface EditAccountData {
  id: string;
  name: string;
  balance: number;
  currency: string;
  account_type: string;
}

interface AddAccountModalProps {
  open: boolean;
  onClose: () => void;
  editAccount?: EditAccountData | null;
}

export function AddAccountModal({
  open,
  onClose,
  editAccount,
}: AddAccountModalProps) {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("0");
  const [currency, setCurrency] = useState("EUR");
  const [accountType, setAccountType] = useState("bank");

  const createMutation = useCreateNetworthAccount();
  const updateMutation = useUpdateNetworthAccount();

  const isEdit = !!editAccount;
  const mutation = isEdit ? updateMutation : createMutation;

  useEffect(() => {
    if (editAccount) {
      setName(editAccount.name);
      setBalance(String(editAccount.balance));
      setCurrency(editAccount.currency);
      setAccountType(editAccount.account_type);
    } else {
      setName("");
      setBalance("0");
      setCurrency("EUR");
      setAccountType("bank");
    }
  }, [editAccount, open]);

  function handleClose() {
    createMutation.reset();
    updateMutation.reset();
    onClose();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedBalance = parseFloat(balance);
    if (isNaN(parsedBalance)) return;

    if (isEdit && editAccount) {
      updateMutation.mutate(
        {
          id: editAccount.id,
          name: name.trim(),
          balance: parsedBalance,
          currency,
          account_type: accountType,
        },
        { onSuccess: handleClose }
      );
    } else {
      createMutation.mutate(
        {
          name: name.trim(),
          balance: parsedBalance,
          currency,
          account_type: accountType,
        },
        { onSuccess: handleClose }
      );
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-on-surface/40"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl bg-surface-container-lowest p-6 shadow-ambient">
        <h2 className="font-display text-xl font-medium text-on-surface mb-6">
          {isEdit ? "Edit Account" : "Add Account"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Wise, Revolut, Cash"
              className="w-full rounded-md bg-surface-container-highest px-3 py-2.5 font-body text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:bg-surface-container-lowest focus:outline focus:outline-outline-variant/20"
            />
          </div>

          {/* Balance */}
          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant mb-1.5">
              Balance
            </label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              step="0.01"
              className="w-full rounded-md bg-surface-container-highest px-3 py-2.5 font-mono text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:bg-surface-container-lowest focus:outline focus:outline-outline-variant/20"
            />
          </div>

          {/* Currency */}
          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant mb-1.5">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full appearance-none rounded-md bg-surface-container-highest px-3 py-2.5 font-body text-sm text-on-surface focus:bg-surface-container-lowest focus:outline focus:outline-outline-variant/20"
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant mb-1.5">
              Type
            </label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              className="w-full appearance-none rounded-md bg-surface-container-highest px-3 py-2.5 font-body text-sm text-on-surface focus:bg-surface-container-lowest focus:outline focus:outline-outline-variant/20"
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Error */}
          {mutation.isError && (
            <p className="font-mono text-xs text-on-error-container">
              {mutation.error.message}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={mutation.isPending}
              className="rounded-xl bg-surface-container-high px-4 py-2.5 font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant transition-colors hover:bg-surface-container-highest disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !name.trim()}
              className={cn(
                "rounded-xl bg-primary px-4 py-2.5 font-mono text-xs uppercase tracking-[0.1em] text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-50"
              )}
            >
              {mutation.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 font-mono text-sm text-on-surface-variant transition-colors hover:text-on-surface"
          aria-label="Close"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
