"use client";

import { useState, type FormEvent } from "react";
import { useCreateTransaction } from "@/lib/queries/accounts";
import { useCurrencyStore } from "@/stores/currency-store";
import { cn } from "@/lib/utils";

interface AddTransactionFormProps {
  accountId: string;
  onSuccess?: () => void;
}

export function AddTransactionForm({
  accountId,
  onSuccess,
}: AddTransactionFormProps) {
  const [ticker, setTicker] = useState("");
  const [quantity, setQuantity] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [txType, setTxType] = useState<"buy" | "sell">("buy");
  const currency = useCurrencyStore((s) => s.currency);

  const createTransaction = useCreateTransaction(accountId);

  function resetForm() {
    setTicker("");
    setQuantity("");
    setPricePerUnit("");
    setDate(new Date().toISOString().split("T")[0]);
    setTxType("buy");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const qty = parseFloat(quantity);
    const price = parseFloat(pricePerUnit);
    if (!ticker.trim() || isNaN(qty) || isNaN(price) || qty <= 0 || price <= 0)
      return;

    createTransaction.mutate(
      {
        asset_ticker: ticker.trim().toUpperCase(),
        type: txType,
        quantity: qty,
        price_per_unit: price,
        currency,
        date,
      },
      {
        onSuccess: () => {
          resetForm();
          createTransaction.reset();
          onSuccess?.();
        },
      }
    );
  }

  const totalAmount =
    (parseFloat(quantity) || 0) * (parseFloat(pricePerUnit) || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Asset Ticker */}
      <div>
        <label className="block font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant mb-1.5">
          Asset Ticker
        </label>
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          placeholder="e.g. AAPL"
          className="w-full rounded-md bg-surface-container-highest px-3 py-2.5 font-mono text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:bg-surface-container-lowest focus:outline focus:outline-outline-variant/20"
        />
      </div>

      {/* Buy / Sell toggle */}
      <div>
        <label className="block font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant mb-1.5">
          Type
        </label>
        <div className="flex gap-1 rounded-md bg-surface-container-highest p-1">
          <button
            type="button"
            onClick={() => setTxType("buy")}
            className={cn(
              "flex-1 rounded-md px-3 py-2 font-mono text-xs uppercase tracking-[0.1em] transition-colors",
              txType === "buy"
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => setTxType("sell")}
            className={cn(
              "flex-1 rounded-md px-3 py-2 font-mono text-xs uppercase tracking-[0.1em] transition-colors",
              txType === "sell"
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            Sell
          </button>
        </div>
      </div>

      {/* Quantity + Price row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant mb-1.5">
            Quantity
          </label>
          <input
            type="number"
            step="any"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            className="w-full rounded-md bg-surface-container-highest px-3 py-2.5 font-mono text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:bg-surface-container-lowest focus:outline focus:outline-outline-variant/20"
          />
        </div>
        <div>
          <label className="block font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant mb-1.5">
            Price per Unit
          </label>
          <input
            type="number"
            step="any"
            min="0"
            value={pricePerUnit}
            onChange={(e) => setPricePerUnit(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-md bg-surface-container-highest px-3 py-2.5 font-mono text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:bg-surface-container-lowest focus:outline focus:outline-outline-variant/20"
          />
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="block font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant mb-1.5">
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-md bg-surface-container-highest px-3 py-2.5 font-mono text-sm text-on-surface focus:bg-surface-container-lowest focus:outline focus:outline-outline-variant/20"
        />
      </div>

      {/* Currency + Total display */}
      <div className="flex items-center justify-between rounded-md bg-surface-container-low px-3 py-2.5">
        <span className="font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant">
          Total ({currency})
        </span>
        <span className="font-mono text-sm font-medium text-on-surface">
          {totalAmount > 0
            ? new Intl.NumberFormat("en-US", {
                style: "currency",
                currency,
              }).format(totalAmount)
            : "\u2014"}
        </span>
      </div>

      {/* Error */}
      {createTransaction.isError && (
        <p className="font-mono text-xs text-on-error-container">
          {createTransaction.error.message}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={
          createTransaction.isPending ||
          !ticker.trim() ||
          !quantity ||
          !pricePerUnit
        }
        className="w-full rounded-xl bg-primary px-4 py-2.5 font-mono text-xs uppercase tracking-[0.1em] text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {createTransaction.isPending
          ? "Submitting..."
          : `${txType === "buy" ? "Buy" : "Sell"} ${ticker || "Asset"}`}
      </button>
    </form>
  );
}
