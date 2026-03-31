"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useCreateAccount, useUpdateAccount, type Account } from "@/lib/queries/accounts";
import { useCurrencyStore } from "@/stores/currency-store";
import { cn } from "@/lib/utils";

const ACCOUNT_TYPES = [
  { value: "brokerage", label: "Brokerage" },
  { value: "crypto_exchange", label: "Crypto Exchange" },
  { value: "bank", label: "Bank" },
] as const;

interface AddAccountModalProps {
  editAccount?: Account | null;
  onClose?: () => void;
}

export function AddAccountModal({ editAccount, onClose }: AddAccountModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("brokerage");
  const [notes, setNotes] = useState("");
  const currency = useCurrencyStore((s) => s.currency);

  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();

  const isEdit = !!editAccount;
  const mutation = isEdit ? updateAccount : createAccount;

  // When editAccount changes, open modal and populate form
  useEffect(() => {
    if (editAccount) {
      setName(editAccount.name);
      setType(editAccount.type);
      setNotes("");
      setIsOpen(true);
    }
  }, [editAccount]);

  function resetForm() {
    setName("");
    setType("brokerage");
    setNotes("");
  }

  function handleClose() {
    resetForm();
    createAccount.reset();
    updateAccount.reset();
    setIsOpen(false);
    onClose?.();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEdit) {
      updateAccount.mutate(
        {
          id: editAccount!.id,
          payload: { name: name.trim(), type, currency },
        },
        { onSuccess: () => handleClose() }
      );
    } else {
      createAccount.mutate(
        { name: name.trim(), type, currency },
        { onSuccess: () => handleClose() }
      );
    }
  }

  return (
    <>
      {!isEdit && (
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-xl bg-surface-container-high px-4 py-2.5 font-mono text-xs uppercase tracking-[0.1em] text-on-surface transition-colors hover:bg-surface-container-highest"
        >
          Add Account
        </button>
      )}

      {isOpen && (
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
                  placeholder="e.g. Interactive Brokers"
                  className="w-full rounded-md bg-surface-container-highest px-3 py-2.5 font-body text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:bg-surface-container-lowest focus:outline focus:outline-outline-variant/20"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant mb-1.5">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full appearance-none rounded-md bg-surface-container-highest px-3 py-2.5 font-body text-sm text-on-surface focus:bg-surface-container-lowest focus:outline focus:outline-outline-variant/20"
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant mb-1.5">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Optional notes..."
                  className="w-full resize-none rounded-md bg-surface-container-highest px-3 py-2.5 font-body text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:bg-surface-container-lowest focus:outline focus:outline-outline-variant/20"
                />
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
      )}
    </>
  );
}
