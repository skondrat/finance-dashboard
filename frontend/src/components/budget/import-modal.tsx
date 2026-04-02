"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  useImportUpload,
  useImportWithProgress,
  useConfirmImport,
  useImportCategories,
  useSplitAtmCash,
  type ImportResponse,
  type ImportRow,
  type CategoryOverride,
  type ImportCategory,
  type SplitState,
  type CashSplitItem,
  type SplitOverride,
} from "@/lib/queries/budget";
import { cn, formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useCurrencyStore } from "@/stores/currency-store";

const SOURCES = [
  { value: "payoneer", label: "Payoneer" },
  { value: "monobank", label: "Monobank" },
  { value: "millenium", label: "Millenium" },
  { value: "other", label: "Other" },
] as const;

function CategorySourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    mapping: "bg-on-tertiary-container/10 text-on-tertiary-container",
    rule: "bg-on-secondary-container/10 text-on-secondary-container",
    ai: "bg-on-primary-container/10 text-on-primary-container",
    none: "bg-on-surface-variant/10 text-on-surface-variant",
  };
  const labels: Record<string, string> = {
    mapping: "map",
    rule: "rule",
    ai: "ai",
    none: "",
  };
  if (source === "none") return null;
  return (
    <span
      className={cn(
        "ml-1 inline-block rounded px-1 py-0.5 font-mono text-[10px] uppercase",
        colors[source] ?? colors.none
      )}
    >
      {labels[source] ?? source}
    </span>
  );
}

function CategorySelector({
  categories,
  selectedId,
  onChange,
}: {
  categories: ImportCategory[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
}) {
  return (
    <select
      className="w-full max-w-32 rounded border border-on-surface-variant/20 bg-surface-container-lowest px-1.5 py-1 font-mono text-xs text-on-surface"
      value={selectedId ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
    >
      <option value="">-- None --</option>
      {categories.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.name}
        </option>
      ))}
    </select>
  );
}

function EditableAmount({
  value,
  currency,
  isNegative,
  onChange,
}: {
  value: number;
  currency: string;
  isNegative: boolean;
  onChange: (amount: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  if (editing) {
    return (
      <input
        type="number"
        step="0.01"
        className="w-24 rounded border border-on-surface-variant/30 bg-surface-container-lowest px-1.5 py-0.5 text-right font-mono text-sm text-on-surface"
        value={draft}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const parsed = parseFloat(draft);
          if (!isNaN(parsed) && parsed !== 0) {
            onChange(isNegative ? -Math.abs(parsed) : Math.abs(parsed));
          }
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setEditing(false);
        }}
      />
    );
  }

  return (
    <span
      className="cursor-pointer hover:underline decoration-dotted"
      title="Click to edit amount"
      onClick={() => {
        setDraft(String(Math.abs(value)));
        setEditing(true);
      }}
    >
      {formatCurrency(value, currency)}
    </span>
  );
}

function PreviewTable({
  data,
  currency,
  categories,
  overrides,
  onOverride,
  splitStates,
  onSplitCategoryChange,
  onStartSplit,
  onUndoSplit,
  splittingRowIndex,
  excludedRows,
  onExcludeRow,
  onRestoreRow,
  amountOverrides,
  onAmountChange,
}: {
  data: ImportResponse;
  currency: string;
  categories: ImportCategory[];
  overrides: Map<number, string | null>;
  onOverride: (rowIndex: number, categoryId: string | null) => void;
  splitStates: Map<number, SplitState>;
  onSplitCategoryChange: (rowIndex: number, itemIndex: number, categoryId: string | null) => void;
  onStartSplit: (rowIndex: number) => void;
  onUndoSplit: (rowIndex: number) => void;
  splittingRowIndex: number | null;
  excludedRows: Set<number>;
  onExcludeRow: (rowIndex: number) => void;
  onRestoreRow: (rowIndex: number) => void;
  amountOverrides: Map<number, number>;
  onAmountChange: (rowIndex: number, amount: number) => void;
}) {
  return (
    <div className="max-h-96 overflow-y-auto scrollbar-visible">
      <table className="w-full">
        <thead>
          <tr className="border-b border-on-surface-variant/10">
            <th className="pb-2 text-left font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant">
              Date
            </th>
            <th className="pb-2 text-left font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant">
              Description
            </th>
            <th className="pb-2 text-right font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant">
              Amount
            </th>
            {data.source && (
              <>
                <th className="pb-2 text-left font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant">
                  Cur
                </th>
                <th className="pb-2 text-left font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant">
                  Type
                </th>
              </>
            )}
            <th className="pb-2 text-left font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant">
              Category
            </th>
            <th className="pb-2 text-center font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant w-10">
            </th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, idx) => {
            const split = splitStates.get(idx);

            // If this row has been split, render split items instead
            if (split) {
              const colSpan = data.source ? 6 : 4;
              return (
                <React.Fragment key={idx}>
                  {split.items.map((item, itemIdx) => {
                    const isOther = item.category_name === "Other";
                    return (
                      <tr
                        key={`${idx}-split-${itemIdx}`}
                        className={cn(
                          "border-b border-on-surface-variant/5",
                          isOther && "bg-on-error-container/5"
                        )}
                      >
                        <td className="py-2 pl-4 font-mono text-xs text-on-surface-variant">
                          {row.date}
                        </td>
                        <td className="py-2 pl-4 font-body text-sm text-on-surface max-w-sm break-words">
                          <span className="text-on-surface-variant/50 mr-1">{"\u21B3"}</span>
                          {item.description}
                        </td>
                        <td className="py-2 text-right font-mono text-sm text-on-error-container">
                          {formatCurrency(-Math.abs(item.amount), row.currency || currency)}
                        </td>
                        {data.source && (
                          <>
                            <td className="py-2 font-mono text-xs text-on-surface-variant">
                              {row.currency}
                            </td>
                            <td className="py-2 font-mono text-xs text-on-surface-variant capitalize">
                              {row.type}
                            </td>
                          </>
                        )}
                        <td className="py-2">
                          {categories.length > 0 ? (
                            <div className="flex items-center">
                              <CategorySelector
                                categories={categories}
                                selectedId={item.category_id}
                                onChange={(id) => onSplitCategoryChange(idx, itemIdx, id)}
                              />
                              <CategorySourceBadge source="ai" />
                            </div>
                          ) : (
                            <span className="font-mono text-xs text-on-surface-variant">
                              {item.category_name ?? "\u2014"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {split.remainder > 0 && (
                    <tr className="border-b border-on-surface-variant/5">
                      <td className="py-2 pl-4 font-mono text-xs text-on-surface-variant">
                        {row.date}
                      </td>
                      <td className="py-2 pl-4 font-body text-sm text-on-surface max-w-sm break-words">
                        <span className="text-on-surface-variant/50 mr-1">{"\u21B3"}</span>
                        {row.description}
                        <span className="ml-1 text-on-surface-variant/50 text-xs">(remainder)</span>
                      </td>
                      <td className="py-2 text-right font-mono text-sm text-on-error-container">
                        {formatCurrency(-Math.abs(split.remainder), row.currency || currency)}
                      </td>
                      {data.source && (
                        <>
                          <td className="py-2 font-mono text-xs text-on-surface-variant">
                            {row.currency}
                          </td>
                          <td className="py-2 font-mono text-xs text-on-surface-variant capitalize">
                            {row.type}
                          </td>
                        </>
                      )}
                      <td className="py-2">
                        <span className="font-mono text-xs text-on-surface-variant">ATM Withdrawal</span>
                        <CategorySourceBadge source="rule" />
                      </td>
                    </tr>
                  )}
                  <tr className="border-b border-on-surface-variant/5">
                    <td colSpan={colSpan} className="py-1">
                      <button
                        onClick={() => onUndoSplit(idx)}
                        className="font-mono text-[10px] uppercase tracking-[0.1em] text-on-surface-variant/60 hover:text-on-surface-variant transition-colors"
                      >
                        Undo Split
                      </button>
                    </td>
                  </tr>
                </React.Fragment>
              );
            }

            const isExcluded = excludedRows.has(idx);
            const overriddenCatId = overrides.get(idx);
            const currentCatId =
              overriddenCatId !== undefined
                ? overriddenCatId
                : row.category_id;
            const currentCatName =
              overriddenCatId !== undefined
                ? categories.find((c) => c.id === overriddenCatId)?.name ??
                  null
                : row.category_name;
            const isOther = currentCatName === "Other";
            const isAtm = row.category_name === "ATM Withdrawal" && overriddenCatId === undefined;
            const isSplitting = splittingRowIndex === idx;
            const displayAmount = amountOverrides.get(idx) ?? row.amount;

            return (
              <React.Fragment key={idx}>
                <tr
                  className={cn(
                    "border-b border-on-surface-variant/5 last:border-0",
                    isOther && "bg-on-error-container/5",
                    isExcluded && "opacity-30 line-through"
                  )}
                >
                  <td className="py-2 font-mono text-xs text-on-surface">
                    {row.date}
                  </td>
                  <td className="py-2 font-body text-sm text-on-surface max-w-sm break-words">
                    {row.description}
                  </td>
                  <td
                    className={cn(
                      "py-2 text-right font-mono text-sm",
                      displayAmount < 0
                        ? "text-on-error-container"
                        : "text-on-tertiary-container"
                    )}
                  >
                    {isExcluded ? (
                      formatCurrency(displayAmount, row.currency || currency)
                    ) : (
                      <EditableAmount
                        value={displayAmount}
                        currency={row.currency || currency}
                        isNegative={row.amount < 0}
                        onChange={(amount) => onAmountChange(idx, amount)}
                      />
                    )}
                  </td>
                  {data.source && (
                    <>
                      <td className="py-2 font-mono text-xs text-on-surface-variant">
                        {row.currency}
                      </td>
                      <td className="py-2 font-mono text-xs text-on-surface-variant capitalize">
                        {row.type}
                      </td>
                    </>
                  )}
                  <td className="py-2">
                    {!isExcluded && (
                      <div className="flex items-center gap-1">
                        {categories.length > 0 ? (
                          <>
                            <CategorySelector
                              categories={categories}
                              selectedId={currentCatId}
                              onChange={(id) => onOverride(idx, id)}
                            />
                            <CategorySourceBadge
                              source={
                                overriddenCatId !== undefined
                                  ? "mapping"
                                  : row.category_source
                              }
                            />
                          </>
                        ) : (
                          <span className="font-mono text-xs text-on-surface-variant">
                            {currentCatName ?? "\u2014"}
                            {row.category_source !== "none" && (
                              <CategorySourceBadge source={row.category_source} />
                            )}
                          </span>
                        )}
                        {isAtm && !isSplitting && (
                          <button
                            onClick={() => onStartSplit(idx)}
                            className="ml-1 rounded bg-on-surface-variant/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.05em] text-on-surface-variant hover:bg-on-surface-variant/20 transition-colors"
                          >
                            Split
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-2 text-center">
                    {isExcluded ? (
                      <button
                        onClick={() => onRestoreRow(idx)}
                        className="font-mono text-[10px] uppercase tracking-[0.05em] text-on-tertiary-container hover:text-on-tertiary-container/80 transition-colors"
                        title="Restore transaction"
                      >
                        Undo
                      </button>
                    ) : (
                      <button
                        onClick={() => onExcludeRow(idx)}
                        className="font-mono text-[10px] text-on-error-container/60 hover:text-on-error-container transition-colors"
                        title="Remove transaction"
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ImportModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [preview, setPreview] = useState<ImportResponse | null>(null);
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [overrides, setOverrides] = useState<Map<number, string | null>>(
    new Map()
  );
  const [splitStates, setSplitStates] = useState<Map<number, SplitState>>(
    new Map()
  );
  const [excludedRows, setExcludedRows] = useState<Set<number>>(new Set());
  const [amountOverrides, setAmountOverrides] = useState<Map<number, number>>(new Map());
  const [splittingRowIndex, setSplittingRowIndex] = useState<number | null>(null);
  const [splitNotes, setSplitNotes] = useState("");
  const [splitError, setSplitError] = useState<string | null>(null);
  const currency = useCurrencyStore((s) => s.currency);

  const uploadMutation = useImportUpload();
  const { progress: sseProgress, upload: sseUpload, reset: sseReset } = useImportWithProgress();
  const confirmMutation = useConfirmImport();
  const splitMutation = useSplitAtmCash();
  const { data: categoriesData } = useImportCategories();
  const categories = categoriesData?.categories ?? [];

  const isPdf = selectedFile?.name?.toLowerCase().endsWith(".pdf") ?? false;

  // When SSE import completes, set preview
  if (sseProgress.stage === "complete" && sseProgress.result && !preview) {
    setPreview(sseProgress.result);
  }

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setSelectedFile(file);

      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "pdf") {
        // Wait for source selection before uploading
        return;
      }

      // Non-PDF: upload immediately
      uploadMutation.mutate(
        { file },
        {
          onSuccess: (data) => {
            setPreview(data);
          },
        }
      );
    },
    [uploadMutation]
  );

  function handleUploadPdf() {
    if (!selectedFile || !selectedSource) return;
    sseUpload(selectedFile, selectedSource);
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/pdf": [".pdf"],
      "application/octet-stream": [".ofx", ".mt940"],
    },
    multiple: false,
  });

  function handleOverride(rowIndex: number, categoryId: string | null) {
    const rows = preview?.rows ?? sseProgress.result?.rows;

    setOverrides((prev) => {
      const next = new Map(prev);
      next.set(rowIndex, categoryId);

      // Auto-match: propagate to other uncategorized rows with same description
      if (categoryId && rows) {
        const desc = rows[rowIndex]?.description?.toLowerCase();
        if (desc) {
          rows.forEach((row, idx) => {
            if (
              idx !== rowIndex &&
              row.description?.toLowerCase() === desc &&
              row.category_source === "none" &&
              !prev.has(idx)
            ) {
              next.set(idx, categoryId);
            }
          });
        }
      }

      return next;
    });
  }

  function handleStartSplit(rowIndex: number) {
    setSplittingRowIndex(rowIndex);
    setSplitNotes("");
    setSplitError(null);
  }

  function handleSubmitSplit() {
    if (!preview || splittingRowIndex === null) return;

    // Client-side validation: notes must contain at least one number
    if (!/\d+/.test(splitNotes)) {
      setSplitError("Notes must contain at least one numeric amount");
      return;
    }

    setSplitError(null);
    splitMutation.mutate(
      {
        importId: preview.id,
        rowIndex: splittingRowIndex,
        notes: splitNotes,
      },
      {
        onSuccess: (result) => {
          const row = preview.rows[splittingRowIndex!];
          setSplitStates((prev) => {
            const next = new Map(prev);
            next.set(splittingRowIndex!, {
              original: row,
              items: result.items,
              remainder: result.remainder,
            });
            return next;
          });
          setSplittingRowIndex(null);
          setSplitNotes("");
        },
        onError: (err) => {
          setSplitError(err.message);
        },
      }
    );
  }

  function handleCancelSplit() {
    setSplittingRowIndex(null);
    setSplitNotes("");
    setSplitError(null);
  }

  function handleUndoSplit(rowIndex: number) {
    setSplitStates((prev) => {
      const next = new Map(prev);
      next.delete(rowIndex);
      return next;
    });
  }

  function handleSplitCategoryChange(
    rowIndex: number,
    itemIndex: number,
    categoryId: string | null
  ) {
    setSplitStates((prev) => {
      const next = new Map(prev);
      const split = next.get(rowIndex);
      if (!split) return prev;
      const newItems = [...split.items];
      const catName = categories.find((c) => c.id === categoryId)?.name ?? null;
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        category_id: categoryId,
        category_name: catName,
      };
      next.set(rowIndex, { ...split, items: newItems });
      return next;
    });
  }

  function handleConfirm() {
    if (!preview) return;

    const categoryOverrides: CategoryOverride[] = [];
    overrides.forEach((catId, rowIndex) => {
      if (catId !== null) {
        categoryOverrides.push({ row_index: rowIndex, category_id: catId });
      }
    });

    // Build splits payload from splitStates
    const splits: SplitOverride[] = [];
    splitStates.forEach((split, rowIndex) => {
      const items = split.items.map((item) => ({
        description: item.description,
        amount: item.amount,
        category_id: item.category_id,
      }));
      // Add remainder as an ATM Withdrawal item if > 0
      if (split.remainder > 0) {
        const originalRow = preview.rows[rowIndex];
        const atmCatId = originalRow?.category_id ?? null;
        items.push({
          description: originalRow?.description ?? "ATM Withdrawal",
          amount: split.remainder,
          category_id: atmCatId,
        });
      }
      splits.push({ row_index: rowIndex, items });
    });

    const excludedArr = Array.from(excludedRows);
    const amountArr = Array.from(amountOverrides.entries()).map(
      ([row_index, amount]) => ({ row_index, amount })
    );

    confirmMutation.mutate(
      {
        importId: preview.id,
        categoryOverrides:
          categoryOverrides.length > 0 ? categoryOverrides : undefined,
        splits: splits.length > 0 ? splits : undefined,
        excludedRows: excludedArr.length > 0 ? excludedArr : undefined,
        amountOverrides: amountArr.length > 0 ? amountArr : undefined,
      },
      {
        onSuccess: () => {
          setPreview(null);
          setOverrides(new Map());
          setSplitStates(new Map());
          setExcludedRows(new Set());
          setAmountOverrides(new Map());
          setSplittingRowIndex(null);
          setSplitNotes("");
          setSelectedFile(null);
          setSelectedSource("");
          uploadMutation.reset();
          sseReset();
          setIsOpen(false);
        },
      }
    );
  }

  function discardOnBackend() {
    const importId = preview?.id ?? sseProgress.importId;
    if (importId) {
      apiFetch(`/budget/import/${importId}/discard`, { method: "POST" }).catch(
        (err) => console.error("Failed to discard import:", err)
      );
    }
  }

  function handleDiscard() {
    discardOnBackend();
    setPreview(null);
    setOverrides(new Map());
    setSplitStates(new Map());
    setExcludedRows(new Set());
    setAmountOverrides(new Map());
    setSplittingRowIndex(null);
    setSplitNotes("");
    setSelectedFile(null);
    setSelectedSource("");
    uploadMutation.reset();
    sseReset();
  }

  function handleClose() {
    if (preview || sseProgress.result) {
      discardOnBackend();
    }
    setPreview(null);
    setOverrides(new Map());
    setSplitStates(new Map());
    setSplittingRowIndex(null);
    setSplitNotes("");
    setSelectedFile(null);
    setSelectedSource("");
    uploadMutation.reset();
    sseReset();
    setIsOpen(false);
  }

  // Parse error detail from API or SSE
  const errorMessage = sseProgress.error
    ? sseProgress.error
    : uploadMutation.isError
      ? (() => {
          try {
            const parsed = JSON.parse(uploadMutation.error.message);
            if (parsed.message && parsed.action) {
              return `${parsed.message} ${parsed.action}`;
            }
          } catch {
            // not JSON
          }
          return uploadMutation.error.message;
        })()
      : null;

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
        }}
        className="rounded-xl bg-on-surface px-4 py-2.5 font-mono text-xs uppercase tracking-[0.1em] text-surface transition-colors hover:bg-on-surface/90"
      >
        Import Statement
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-on-surface/40"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-5xl mx-4 rounded-2xl bg-surface-container-lowest/80 backdrop-blur-[20px] p-6 shadow-ambient">
            <h2 className="font-display text-xl font-medium text-on-surface mb-4">
              Import Statement
            </h2>

            {!preview ? (
              <>
                {/* Dropzone */}
                <div
                  {...getRootProps()}
                  className={cn(
                    "flex h-40 cursor-pointer flex-col items-center justify-center rounded-xl outline-2 outline-dashed outline-on-surface-variant/40 transition-colors",
                    isDragActive
                      ? "bg-surface-container-low"
                      : "bg-surface-container-lowest hover:bg-surface-container-low"
                  )}
                >
                  <input {...getInputProps()} />
                  <p className="font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant">
                    Drop CSV / OFX / MT940 / PDF
                  </p>
                  <p className="mt-2 font-body text-xs text-on-surface-variant/60">
                    or click to browse
                  </p>
                </div>

                {/* Source selector for PDF */}
                {isPdf && selectedFile && !preview && (
                  <div className="mt-4 space-y-3">
                    <p className="font-mono text-xs text-on-surface-variant">
                      PDF detected: <span className="text-on-surface">{selectedFile.name}</span>
                    </p>
                    <div className="flex items-center gap-3">
                      <label className="font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant">
                        Source:
                      </label>
                      <select
                        className="flex-1 rounded-xl border border-on-surface-variant/20 bg-surface-container-lowest px-3 py-2 font-mono text-sm text-on-surface"
                        value={selectedSource}
                        onChange={(e) => setSelectedSource(e.target.value)}
                      >
                        <option value="">Select source...</option>
                        {SOURCES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleUploadPdf}
                        disabled={!selectedSource || sseProgress.isProcessing}
                        className="rounded-xl bg-on-surface px-4 py-2.5 font-mono text-xs uppercase tracking-[0.1em] text-surface transition-colors hover:bg-on-surface/90 disabled:opacity-50"
                      >
                        {sseProgress.isProcessing
                          ? "Processing..."
                          : "Upload"}
                      </button>
                    </div>
                    {selectedSource === "other" && !sseProgress.isProcessing && (
                      <p className="font-body text-xs text-on-surface-variant/60">
                        AI will attempt to detect column layout automatically.
                      </p>
                    )}
                    {/* SSE Progress Display */}
                    {sseProgress.isProcessing && (
                      <div className="mt-3 space-y-2">
                        <p className="font-mono text-xs text-on-surface-variant animate-pulse">
                          {sseProgress.stage === "extracting" && "Extracting transactions..."}
                          {sseProgress.stage === "categorizing" &&
                            `Categorizing: ${sseProgress.done} / ${sseProgress.total} transactions`}
                          {sseProgress.stage === "saving" && "Preparing preview..."}
                        </p>
                        {sseProgress.stage === "categorizing" && sseProgress.total > 0 && (
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-on-surface-variant/10">
                            <div
                              className="h-full rounded-full bg-on-surface transition-all duration-300"
                              style={{
                                width: `${Math.round((sseProgress.done / sseProgress.total) * 100)}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {uploadMutation.isPending && !isPdf && (
                  <p className="mt-4 text-center font-mono text-xs text-on-surface-variant animate-pulse">
                    Uploading...
                  </p>
                )}

                {errorMessage && (
                  <p className="mt-4 text-center font-mono text-xs text-on-error-container">
                    {errorMessage}
                  </p>
                )}

              </>
            ) : (
              <>
                {/* Preview */}
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-mono text-xs text-on-surface-variant">
                    {preview.file_name} &mdash; {preview.rows.length}{" "}
                    transactions
                    {preview.duplicate_count > 0 && (
                      <span>
                        {" "}
                        ({preview.duplicate_count} duplicates skipped)
                      </span>
                    )}
                    {preview.skipped_count > 0 && (
                      <span>
                        {" "}
                        ({preview.skipped_count} rows skipped)
                      </span>
                    )}
                    {preview.excluded_count > 0 && (
                      <span>
                        {" "}
                        ({preview.excluded_count} internal transfers excluded)
                      </span>
                    )}
                  </p>
                  {preview.source && (
                    <span className="rounded-lg bg-on-surface-variant/10 px-2 py-1 font-mono text-xs uppercase text-on-surface-variant">
                      {preview.source}
                    </span>
                  )}
                </div>

                {(() => {
                  const uncategorized = preview.rows.filter(
                    (r, i) => !excludedRows.has(i) && !splitStates.has(i) && r.category_source === "none" && !overrides.has(i)
                  ).length;
                  return uncategorized > 0 ? (
                    <p className="mb-2 font-mono text-xs text-on-error-container">
                      {uncategorized} transaction{uncategorized !== 1 ? "s" : ""} still need manual categorization
                    </p>
                  ) : null;
                })()}

                <PreviewTable
                  data={preview}
                  currency={currency}
                  categories={categories}
                  overrides={overrides}
                  onOverride={handleOverride}
                  splitStates={splitStates}
                  onSplitCategoryChange={handleSplitCategoryChange}
                  onStartSplit={handleStartSplit}
                  onUndoSplit={handleUndoSplit}
                  splittingRowIndex={splittingRowIndex}
                  excludedRows={excludedRows}
                  onExcludeRow={(idx) => setExcludedRows((prev) => new Set(prev).add(idx))}
                  onRestoreRow={(idx) => {
                    setExcludedRows((prev) => {
                      const next = new Set(prev);
                      next.delete(idx);
                      return next;
                    });
                  }}
                  amountOverrides={amountOverrides}
                  onAmountChange={(idx, amount) =>
                    setAmountOverrides((prev) => new Map(prev).set(idx, amount))
                  }
                />

                {/* Split input */}
                {splittingRowIndex !== null && (
                  <div className="mt-3 rounded-xl border border-on-surface-variant/20 bg-surface-container-low p-3 space-y-2">
                    <p className="font-mono text-xs text-on-surface-variant">
                      Enter cash spending notes for row {splittingRowIndex + 1}:
                    </p>
                    <textarea
                      value={splitNotes}
                      onChange={(e) => setSplitNotes(e.target.value)}
                      placeholder="e.g. 200 cosmetics, 50 taxi, 30 groceries"
                      className="w-full rounded-lg border border-on-surface-variant/20 bg-surface-container-lowest px-3 py-2 font-body text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-on-surface-variant/40"
                      rows={2}
                    />
                    {splitError && (
                      <p className="font-mono text-xs text-on-error-container">
                        {splitError}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={handleSubmitSplit}
                        disabled={splitMutation.isPending || !splitNotes.trim()}
                        className="rounded-lg bg-on-surface px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-surface transition-colors hover:bg-on-surface/90 disabled:opacity-50"
                      >
                        {splitMutation.isPending ? "Splitting..." : "Split Cash"}
                      </button>
                      <button
                        onClick={handleCancelSplit}
                        disabled={splitMutation.isPending}
                        className="rounded-lg px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-on-surface-variant transition-colors hover:text-on-surface"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    onClick={handleDiscard}
                    disabled={confirmMutation.isPending}
                    className="rounded-xl px-4 py-2.5 font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant transition-colors hover:text-on-surface disabled:opacity-50"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={confirmMutation.isPending}
                    className="rounded-xl bg-on-surface px-4 py-2.5 font-mono text-xs uppercase tracking-[0.1em] text-surface transition-colors hover:bg-on-surface/90 disabled:opacity-50"
                  >
                    {confirmMutation.isPending
                      ? "Confirming..."
                      : "Confirm Import"}
                  </button>
                </div>

                {confirmMutation.isError && (
                  <p className="mt-3 text-center font-mono text-xs text-on-error-container">
                    {confirmMutation.error.message}
                  </p>
                )}
              </>
            )}

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
