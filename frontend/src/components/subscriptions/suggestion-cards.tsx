"use client";

import {
  useSubscriptionSuggestions,
  useCreateSubscription,
  useDismissSuggestion,
} from "@/lib/queries/subscriptions";
import { formatCurrency } from "@/lib/utils";

export function SuggestionCards() {
  const { data } = useSubscriptionSuggestions();
  const confirmMutation = useCreateSubscription();
  const dismissMutation = useDismissSuggestion();

  const suggestions = data?.suggestions ?? [];

  if (suggestions.length === 0) return null;

  function handleConfirm(description: string, amount: number, currency: string) {
    confirmMutation.mutate({
      name: description,
      cadence: "monthly",
      amount,
      currency,
    });
  }

  return (
    <div className="rounded-2xl bg-surface-container-lowest p-6">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.1em] text-on-surface-variant mb-4">
        Detected Subscriptions ({suggestions.length})
      </h3>
      <div className="space-y-2">
        {suggestions.map((s) => (
          <div
            key={s.description}
            className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3"
          >
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm font-medium text-on-surface truncate">
                {s.description}
              </p>
              <p className="font-mono text-xs text-on-surface-variant">
                Found in {s.months_detected} consecutive months
              </p>
            </div>
            <div className="text-right mr-4">
              <p className="font-mono text-sm text-on-surface">
                {formatCurrency(s.amount, s.currency)}/mo
              </p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => handleConfirm(s.description, s.amount, s.currency)}
                disabled={confirmMutation.isPending}
                className="rounded-lg bg-on-surface px-3 py-1.5 font-mono text-xs uppercase tracking-[0.1em] text-surface hover:bg-on-surface/90 transition-colors cursor-pointer disabled:opacity-50"
              >
                Confirm
              </button>
              <button
                onClick={() => dismissMutation.mutate(s.description)}
                disabled={dismissMutation.isPending}
                className="rounded-lg px-3 py-1.5 font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-50"
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
