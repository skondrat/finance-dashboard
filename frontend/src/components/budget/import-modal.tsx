"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  useImportUpload,
  useImportWithProgress,
  useConfirmImport,
  useImportCategories,
  useSeedCategoriesUpload,
  type ImportResponse,
  type ImportRow,
  type CategoryOverride,
  type ImportCategory,
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

function PreviewTable({
  data,
  currency,
  categories,
  overrides,
  onOverride,
}: {
  data: ImportResponse;
  currency: string;
  categories: ImportCategory[];
  overrides: Map<number, string | null>;
  onOverride: (rowIndex: number, categoryId: string | null) => void;
}) {
  return (
    <div className="max-h-72 overflow-y-auto">
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
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, idx) => {
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

            return (
              <tr
                key={idx}
                className={cn(
                  "border-b border-on-surface-variant/5 last:border-0",
                  isOther && "bg-on-error-container/5"
                )}
              >
                <td className="py-2 font-mono text-xs text-on-surface">
                  {row.date}
                </td>
                <td className="py-2 font-body text-sm text-on-surface max-w-48 truncate">
                  {row.description}
                </td>
                <td
                  className={cn(
                    "py-2 text-right font-mono text-sm",
                    row.amount < 0
                      ? "text-on-error-container"
                      : "text-on-tertiary-container"
                  )}
                >
                  {formatCurrency(row.amount, row.currency || currency)}
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
                    </div>
                  ) : (
                    <span className="font-mono text-xs text-on-surface-variant">
                      {currentCatName ?? "\u2014"}
                      {row.category_source !== "none" && (
                        <CategorySourceBadge source={row.category_source} />
                      )}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SeedCategoriesUpload({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const seedMutation = useSeedCategoriesUpload();

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (files) => {
      const file = files[0];
      if (!file) return;
      seedMutation.mutate(file, { onSuccess: onComplete });
    },
    accept: { "text/csv": [".csv"] },
    multiple: false,
  });

  return (
    <div className="space-y-3">
      <p className="font-body text-sm text-on-surface-variant">
        No categories found. Upload a seed categories CSV to get started.
      </p>
      <div
        {...getRootProps()}
        className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-xl outline-2 outline-dashed outline-on-surface-variant/40 transition-colors hover:bg-surface-container-low"
      >
        <input {...getInputProps()} />
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant">
          Drop CSV here
        </p>
      </div>
      {seedMutation.isPending && (
        <p className="text-center font-mono text-xs text-on-surface-variant animate-pulse">
          Uploading...
        </p>
      )}
      {seedMutation.isError && (
        <p className="text-center font-mono text-xs text-on-error-container">
          {seedMutation.error.message}
        </p>
      )}
      {seedMutation.isSuccess && (
        <p className="text-center font-mono text-xs text-on-tertiary-container">
          Loaded {seedMutation.data.categories_loaded} categories,{" "}
          {seedMutation.data.examples_loaded} examples
        </p>
      )}
      <button
        onClick={onComplete}
        className="w-full rounded-xl px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant transition-colors hover:text-on-surface"
      >
        Skip for now
      </button>
    </div>
  );
}

export function ImportModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [preview, setPreview] = useState<ImportResponse | null>(null);
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showSeedUpload, setShowSeedUpload] = useState(false);
  const [overrides, setOverrides] = useState<Map<number, string | null>>(
    new Map()
  );
  const currency = useCurrencyStore((s) => s.currency);

  const uploadMutation = useImportUpload();
  const { progress: sseProgress, upload: sseUpload, reset: sseReset } = useImportWithProgress();
  const confirmMutation = useConfirmImport();
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

  function handleConfirm() {
    if (!preview) return;

    const categoryOverrides: CategoryOverride[] = [];
    overrides.forEach((catId, rowIndex) => {
      if (catId !== null) {
        categoryOverrides.push({ row_index: rowIndex, category_id: catId });
      }
    });

    confirmMutation.mutate(
      {
        importId: preview.id,
        categoryOverrides:
          categoryOverrides.length > 0 ? categoryOverrides : undefined,
      },
      {
        onSuccess: () => {
          setPreview(null);
          setOverrides(new Map());
          setSelectedFile(null);
          setSelectedSource("");
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
    setSelectedFile(null);
    setSelectedSource("");
    setShowSeedUpload(false);
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
        onClick={() => setIsOpen(true)}
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
          <div className="relative z-10 w-full max-w-3xl mx-4 rounded-2xl bg-surface-container-lowest/80 backdrop-blur-[20px] p-6 shadow-ambient">
            <h2 className="font-display text-xl font-medium text-on-surface mb-4">
              Import Statement
            </h2>

            {showSeedUpload ? (
              <SeedCategoriesUpload
                onComplete={() => setShowSeedUpload(false)}
              />
            ) : !preview ? (
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

                {/* Seed categories link */}
                <div className="mt-3 flex items-center justify-center gap-1.5">
                  <button
                    onClick={() => setShowSeedUpload(true)}
                    className="font-mono text-xs text-on-surface-variant/60 transition-colors hover:text-on-surface-variant"
                  >
                    Upload seed categories CSV
                  </button>
                  <div className="group relative">
                    <span className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-on-surface-variant/30 font-mono text-[10px] leading-none text-on-surface-variant/50 transition-colors group-hover:border-on-surface-variant group-hover:text-on-surface-variant">
                      i
                    </span>
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-lg bg-on-surface px-3 py-2 text-left opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                      <p className="font-mono text-[11px] leading-relaxed text-surface">
                        CSV with two columns:<br />
                        <span className="text-surface/70">Categories</span> — category name (required)<br />
                        <span className="text-surface/70">Examples</span> — descriptions, pipe-separated (optional)<br />
                        <br />
                        <span className="text-surface/50">e.g. Food &amp; Dining,uber eats|mcdonalds</span>
                      </p>
                      <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-on-surface" />
                    </div>
                  </div>
                </div>
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

                <PreviewTable
                  data={preview}
                  currency={currency}
                  categories={categories}
                  overrides={overrides}
                  onOverride={handleOverride}
                />

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
