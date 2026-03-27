"use client";

import { useCurrencyStore } from "@/stores/currency-store";
import { cn } from "@/lib/utils";

export function CurrencyToggle() {
  const { currency, setCurrency } = useCurrencyStore();

  return (
    <div className="flex rounded-md overflow-hidden font-mono text-sm uppercase tracking-wider">
      {(["EUR", "USD"] as const).map((c) => (
        <button
          key={c}
          onClick={() => setCurrency(c)}
          className={cn(
            "px-3 py-1.5 transition-colors",
            currency === c
              ? "bg-primary text-on-primary"
              : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
          )}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
