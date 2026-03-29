"use client";

import { useState } from "react";
import { SubscriptionList } from "@/components/subscriptions/subscription-list";
import { SubscriptionModal } from "@/components/subscriptions/subscription-modal";
import { SuggestionCards } from "@/components/subscriptions/suggestion-cards";
import { useSubscriptions, type Subscription } from "@/lib/queries/subscriptions";
import { EmptyState } from "@/components/ui/empty-state";

export default function SubscriptionsPage() {
  const { data: subscriptions, isLoading } = useSubscriptions();
  const [modalOpen, setModalOpen] = useState(false);
  const [editSub, setEditSub] = useState<Subscription | null>(null);
  const [detectEnabled, setDetectEnabled] = useState(false);

  const hasSubscriptions = subscriptions && subscriptions.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => setDetectEnabled(true)}
          className="rounded-xl bg-surface-container-high px-4 py-2.5 font-mono text-xs uppercase tracking-[0.1em] text-on-surface transition-colors hover:bg-surface-container-highest cursor-pointer"
        >
          Detect
        </button>
        <button
          onClick={() => {
            setEditSub(null);
            setModalOpen(true);
          }}
          className="rounded-xl bg-surface-container-high px-4 py-2.5 font-mono text-xs uppercase tracking-[0.1em] text-on-surface transition-colors hover:bg-surface-container-highest cursor-pointer"
        >
          Add Subscription
        </button>
      </div>

      <SuggestionCards enabled={detectEnabled} />

      {!isLoading && !hasSubscriptions ? (
        <EmptyState
          title="No subscriptions yet"
          description="Add your recurring expenses to track your total monthly commitment, or import bank statements to auto-detect subscriptions."
          action={{
            label: "Add Subscription",
            onClick: () => {
              setEditSub(null);
              setModalOpen(true);
            },
          }}
        />
      ) : (
        <SubscriptionList
          onEdit={(sub) => {
            setEditSub(sub);
            setModalOpen(true);
          }}
        />
      )}

      <SubscriptionModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditSub(null);
        }}
        editSubscription={editSub}
      />
    </div>
  );
}
