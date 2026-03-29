"use client";

import { useState, useEffect } from "react";
import {
  useCreateSubscription,
  useUpdateSubscription,
  usePaymentSources,
  type Subscription,
} from "@/lib/queries/subscriptions";

interface Props {
  open: boolean;
  onClose: () => void;
  editSubscription: Subscription | null;
}

export function SubscriptionModal({ open, onClose, editSubscription }: Props) {
  const createMutation = useCreateSubscription();
  const updateMutation = useUpdateSubscription();
  const { data: sourcesData } = usePaymentSources();

  const [name, setName] = useState("");
  const [cadence, setCadence] = useState("monthly");
  const [amount, setAmount] = useState("");
  const [paymentDay, setPaymentDay] = useState("");
  const [paymentSource, setPaymentSource] = useState("");

  useEffect(() => {
    if (editSubscription) {
      setName(editSubscription.name);
      setCadence(editSubscription.cadence);
      setAmount(String(editSubscription.amount));
      setPaymentDay(editSubscription.payment_day ? String(editSubscription.payment_day) : "");
      setPaymentSource(editSubscription.payment_source || "");
    } else {
      setName("");
      setCadence("monthly");
      setAmount("");
      setPaymentDay("");
      setPaymentSource("");
    }
  }, [editSubscription, open]);

  if (!open) return null;

  const canSave = name.trim() && amount.trim() && parseFloat(amount) > 0;

  function handleSave() {
    const payload = {
      name: name.trim(),
      cadence,
      amount: parseFloat(amount),
      payment_day: paymentDay ? parseInt(paymentDay, 10) : null,
      payment_source: paymentSource.trim() || null,
    };

    if (editSubscription) {
      updateMutation.mutate(
        { id: editSubscription.id, ...payload },
        { onSuccess: onClose }
      );
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  }

  const sources = sourcesData?.sources ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-lg">
        <h2 className="font-display text-lg font-medium text-on-surface mb-4">
          {editSubscription ? "Edit Subscription" : "Add Subscription"}
        </h2>

        <div className="space-y-3">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-on-surface-variant">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Netflix"
              className="mt-1 w-full rounded-lg border border-on-surface-variant/20 bg-surface-container-lowest px-3 py-2 font-body text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-on-surface-variant/40"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-on-surface-variant">
                Amount
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1 w-full rounded-lg border border-on-surface-variant/20 bg-surface-container-lowest px-3 py-2 font-body text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-on-surface-variant/40"
              />
            </div>
            <div className="w-32">
              <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-on-surface-variant">
                Cadence
              </label>
              <select
                value={cadence}
                onChange={(e) => setCadence(e.target.value)}
                className="mt-1 w-full rounded-lg border border-on-surface-variant/20 bg-surface-container-lowest px-3 py-2 font-body text-sm text-on-surface focus:outline-none cursor-pointer"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-28">
              <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-on-surface-variant">
                Payment Day
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={paymentDay}
                onChange={(e) => setPaymentDay(e.target.value)}
                placeholder="1-31"
                className="mt-1 w-full rounded-lg border border-on-surface-variant/20 bg-surface-container-lowest px-3 py-2 font-body text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-on-surface-variant/40"
              />
            </div>
            <div className="flex-1">
              <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-on-surface-variant">
                Payment Source
              </label>
              <input
                type="text"
                list="payment-sources"
                value={paymentSource}
                onChange={(e) => setPaymentSource(e.target.value)}
                placeholder="e.g. monobank"
                className="mt-1 w-full rounded-lg border border-on-surface-variant/20 bg-surface-container-lowest px-3 py-2 font-body text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-on-surface-variant/40"
              />
              <datalist id="payment-sources">
                {sources.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || createMutation.isPending || updateMutation.isPending}
            className="rounded-lg bg-on-surface px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] text-surface transition-colors hover:bg-on-surface/90 disabled:opacity-50 cursor-pointer"
          >
            {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
