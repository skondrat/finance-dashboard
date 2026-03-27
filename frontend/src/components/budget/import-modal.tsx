"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  useImportUpload,
  useConfirmImport,
  type ImportResponse,
} from "@/lib/queries/budget";
import { cn, formatCurrency } from "@/lib/utils";
import { useCurrencyStore } from "@/stores/currency-store";

function PreviewTable({
  data,
  currency,
}: {
  data: ImportResponse;
  currency: string;
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
            <th className="pb-2 text-left font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant">
              Category
            </th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, idx) => (
            <tr
              key={idx}
              className="border-b border-on-surface-variant/5 last:border-0"
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
                {formatCurrency(row.amount, currency)}
              </td>
              <td className="py-2 font-mono text-xs text-on-surface-variant">
                {row.category_guess ?? "\u2014"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ImportModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [preview, setPreview] = useState<ImportResponse | null>(null);
  const currency = useCurrencyStore((s) => s.currency);

  const uploadMutation = useImportUpload();
  const confirmMutation = useConfirmImport();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      uploadMutation.mutate(file, {
        onSuccess: (data) => {
          setPreview(data);
        },
      });
    },
    [uploadMutation]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/octet-stream": [".ofx", ".mt940"],
    },
    multiple: false,
  });

  function handleConfirm() {
    if (!preview) return;
    confirmMutation.mutate(preview.id, {
      onSuccess: () => {
        setPreview(null);
        setIsOpen(false);
      },
    });
  }

  function handleDiscard() {
    setPreview(null);
    uploadMutation.reset();
  }

  function handleClose() {
    setPreview(null);
    uploadMutation.reset();
    setIsOpen(false);
  }

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
          <div className="relative z-10 w-full max-w-2xl mx-4 rounded-2xl bg-surface-container-lowest/80 backdrop-blur-[20px] p-6 shadow-ambient">
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
                    Drop CSV / OFX / MT940
                  </p>
                  <p className="mt-2 font-body text-xs text-on-surface-variant/60">
                    or click to browse
                  </p>
                </div>

                {uploadMutation.isPending && (
                  <p className="mt-4 text-center font-mono text-xs text-on-surface-variant animate-pulse">
                    Uploading...
                  </p>
                )}

                {uploadMutation.isError && (
                  <p className="mt-4 text-center font-mono text-xs text-on-error-container">
                    {uploadMutation.error.message}
                  </p>
                )}
              </>
            ) : (
              <>
                {/* Preview */}
                <p className="mb-3 font-mono text-xs text-on-surface-variant">
                  {preview.file_name} &mdash; {preview.rows.length} transactions
                </p>
                <PreviewTable data={preview} currency={currency} />

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
                    {confirmMutation.isPending ? "Confirming..." : "Confirm Import"}
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
