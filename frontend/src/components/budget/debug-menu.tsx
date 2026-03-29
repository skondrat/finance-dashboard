"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export function DebugMenu() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    apiFetch<{ model: string; available_models: string[] }>(
      "/budget/debug/model"
    ).then((res) => {
      setCurrentModel(res.model);
      setAvailableModels(res.available_models);
    });
  }, [open]);

  async function handleReset() {
    setStatus("Resetting...");
    try {
      const res = await apiFetch<{
        transactions_deleted: number;
        categories_deleted: number;
        imports_deleted: number;
        rules_deleted: number;
      }>("/budget/debug/reset", { method: "POST" });
      setStatus(
        `Deleted ${res.categories_deleted} categories, ${res.transactions_deleted} transactions, ${res.imports_deleted} imports`
      );
      queryClient.invalidateQueries({ queryKey: ["budget"] });
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Reset failed");
    }
  }

  async function handleModelChange(model: string) {
    setCurrentModel(model);
    try {
      await apiFetch("/budget/debug/model", {
        method: "PUT",
        body: JSON.stringify({ model }),
      });
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Model change failed");
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="font-mono text-[10px] uppercase tracking-[0.1em] text-on-surface-variant/40 transition-colors hover:text-on-surface-variant"
      >
        Debug
      </button>

      {open && (
        <div className="mt-1 rounded-lg border border-on-surface-variant/10 bg-surface-container-low p-3 space-y-2">
          <button
            onClick={handleReset}
            className="w-full rounded-lg px-3 py-1.5 text-left font-mono text-xs text-on-surface-variant transition-colors hover:bg-surface-container-lowest hover:text-on-error-container"
          >
            Reset all data
          </button>

          {availableModels.length > 0 && (
            <div className="space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-on-surface-variant/60 px-3">
                LLM Model
              </p>
              {availableModels.map((model) => (
                <button
                  key={model}
                  onClick={() => handleModelChange(model)}
                  className={`w-full rounded-lg px-3 py-1.5 text-left font-mono text-xs transition-colors ${
                    currentModel === model
                      ? "bg-primary/10 text-primary"
                      : "text-on-surface-variant hover:bg-surface-container-lowest"
                  }`}
                >
                  {model.replace("claude-", "")}
                </button>
              ))}
            </div>
          )}

          {status && (
            <p className="font-mono text-[10px] text-on-surface-variant/60">
              {status}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
