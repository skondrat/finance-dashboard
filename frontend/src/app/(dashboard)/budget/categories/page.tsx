"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  useImportCategories,
  useSeedCategoriesUpload,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useEnsureRequiredCategories,
  type ImportCategory,
} from "@/lib/queries/budget";
import { cn } from "@/lib/utils";

const IMMUTABLE_CATEGORIES = ["Other", "ATM Withdrawal"];

function BudgetCell({ category }: { category: ImportCategory }) {
  const updateMutation = useUpdateCategory();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  function startEdit() {
    setEditValue(
      category.monthly_budget != null
        ? String(Number(category.monthly_budget))
        : ""
    );
    setEditing(true);
  }

  function confirmEdit() {
    setEditing(false);
    const trimmed = editValue.trim();
    const newBudget = trimmed === "" ? null : parseFloat(trimmed);

    if (newBudget !== null && (isNaN(newBudget) || newBudget < 0)) return;

    const current =
      category.monthly_budget != null ? Number(category.monthly_budget) : null;
    if (newBudget === current) return;

    updateMutation.mutate({ id: category.id, monthly_budget: newBudget });
  }

  function cancelEdit() {
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        type="number"
        min="0"
        step="0.01"
        autoFocus
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={confirmEdit}
        onKeyDown={(e) => {
          if (e.key === "Enter") confirmEdit();
          if (e.key === "Escape") cancelEdit();
        }}
        className="w-20 rounded border border-on-surface-variant/30 bg-surface-container-lowest px-1.5 py-0.5 text-right font-mono text-xs text-on-surface focus:outline-none"
      />
    );
  }

  return (
    <span
      onClick={startEdit}
      className={cn(
        "cursor-pointer rounded px-1.5 py-0.5 font-mono text-xs transition-colors hover:bg-surface-container-low",
        updateMutation.isPending && "animate-pulse opacity-50"
      )}
    >
      {category.monthly_budget != null
        ? `\u20AC${Number(category.monthly_budget).toFixed(2)}`
        : "\u2014"}
    </span>
  );
}

export default function CategoriesPage() {
  const router = useRouter();
  const { data: categoriesData } = useImportCategories();
  const categories = categoriesData?.categories ?? [];

  const seedMutation = useSeedCategoriesUpload();
  const createMutation = useCreateCategory();
  const deleteMutation = useDeleteCategory();
  const ensureMutation = useEnsureRequiredCategories();

  const [newName, setNewName] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const isInitMode = categories.length === 0;

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (files) => {
      const file = files[0];
      if (!file) return;
      seedMutation.mutate(file);
    },
    accept: { "text/csv": [".csv"] },
    multiple: false,
  });

  function handleAddCategory() {
    const name = newName.trim();
    if (!name) return;

    setAddError(null);
    const budget = newBudget.trim() ? parseFloat(newBudget) : undefined;

    createMutation.mutate(
      { name, monthly_budget: budget },
      {
        onSuccess: () => {
          setNewName("");
          setNewBudget("");
        },
        onError: (err) => {
          setAddError(err.message);
        },
      }
    );
  }

  function handleSave() {
    ensureMutation.mutate(undefined, {
      onSuccess: () => {
        router.push("/budget");
      },
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-medium text-on-surface">
        Categories
      </h1>

      {/* CSV Upload — init mode only */}
      {isInitMode && (
        <>
          <p className="font-body text-sm text-on-surface-variant">
            Set up your spending categories. Upload a CSV or add them manually.
          </p>

          <div
            {...getRootProps()}
            className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-xl outline-2 outline-dashed outline-on-surface-variant/40 transition-colors hover:bg-surface-container-low"
          >
            <input {...getInputProps()} />
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant">
              Drop categories CSV here
            </p>
            <p className="mt-1 font-body text-[11px] text-on-surface-variant/60">
              Columns: Categories (required), Examples, Budget (optional)
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
          {seedMutation.isSuccess && seedMutation.data && (
            <p className="text-center font-mono text-xs text-on-tertiary-container">
              Loaded {seedMutation.data.categories_loaded} categories,{" "}
              {seedMutation.data.examples_loaded} examples
              {seedMutation.data.budgets_loaded > 0 &&
                `, ${seedMutation.data.budgets_loaded} budgets`}
            </p>
          )}
        </>
      )}

      {/* Category list */}
      {categories.length > 0 && (
        <div className="max-h-96 overflow-y-auto rounded-xl border border-on-surface-variant/10 p-3">
          <table className="w-full">
            <thead>
              <tr className="border-b border-on-surface-variant/10">
                <th className="pb-2 text-left font-mono text-[10px] uppercase tracking-[0.1em] text-on-surface-variant">
                  Category
                </th>
                <th className="pb-2 text-right font-mono text-[10px] uppercase tracking-[0.1em] text-on-surface-variant">
                  Budget
                </th>
                <th className="w-8 pb-2" />
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => {
                const isImmutable = IMMUTABLE_CATEGORIES.includes(cat.name);
                return (
                  <tr
                    key={cat.id}
                    className="group border-b border-on-surface-variant/5 last:border-0"
                  >
                    <td className="py-1.5 font-body text-sm text-on-surface">
                      {cat.name}
                    </td>
                    <td className="py-1.5 text-right text-on-surface-variant">
                      <BudgetCell category={cat} />
                    </td>
                    <td className="py-1.5 text-center">
                      {!isImmutable && (
                        <button
                          onClick={() => deleteMutation.mutate(cat.id)}
                          disabled={deleteMutation.isPending}
                          className="invisible rounded p-0.5 text-on-surface-variant/40 transition-colors hover:text-on-error-container group-hover:visible disabled:opacity-50"
                          title={`Remove ${cat.name}`}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual add form */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-on-surface-variant">
            Category name
          </label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
            placeholder="e.g. Groceries"
            className="mt-1 w-full rounded-lg border border-on-surface-variant/20 bg-surface-container-lowest px-3 py-2 font-body text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-on-surface-variant/40"
          />
        </div>
        <div className="w-28">
          <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-on-surface-variant">
            Budget ({"\u20AC"})
          </label>
          <input
            type="number"
            value={newBudget}
            onChange={(e) => setNewBudget(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
            placeholder="0.00"
            className="mt-1 w-full rounded-lg border border-on-surface-variant/20 bg-surface-container-lowest px-3 py-2 font-body text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-on-surface-variant/40"
          />
        </div>
        <button
          onClick={handleAddCategory}
          disabled={!newName.trim() || createMutation.isPending}
          className="rounded-lg bg-on-surface px-3 py-2 font-mono text-xs uppercase tracking-[0.1em] text-surface transition-colors hover:bg-on-surface/90 disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {addError && (
        <p className="font-mono text-xs text-on-error-container">{addError}</p>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={ensureMutation.isPending}
        className="w-full rounded-xl bg-on-surface px-4 py-2.5 font-mono text-xs uppercase tracking-[0.1em] text-surface transition-colors hover:bg-on-surface/90 disabled:opacity-50"
      >
        {ensureMutation.isPending ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
