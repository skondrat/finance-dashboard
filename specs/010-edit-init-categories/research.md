# Research: Edit Init Categories

## R1: Backend Support for Category Updates

**Decision**: Use the existing `PATCH /budget/categories/{category_id}` endpoint for budget edits.

**Rationale**: The endpoint already exists and accepts `CategoryUpdate` with optional `monthly_budget` field. No backend changes needed for budget editing.

**Alternatives considered**: Creating a dedicated "update budget" endpoint — rejected because the generic PATCH endpoint already handles this.

## R2: Backend Support for Category Deletion

**Decision**: Add a `DELETE /budget/categories/{category_id}` endpoint that hard-deletes the category.

**Rationale**: The model supports soft deletion via `is_archived`, but during Init Categories the user is curating their list before first import — there are no transactions referencing these categories yet. Hard delete is simpler and more appropriate for this pre-import phase. If categories have associated transactions (post-import), the endpoint should return a 409 Conflict.

**Alternatives considered**:
- Soft delete via `is_archived` — overkill for pre-import cleanup, adds complexity to the Init list query which would need to filter archived categories.
- Frontend-only removal (don't persist) — rejected because categories are already persisted server-side when the CSV is uploaded. Removing only from UI would leave orphaned categories.

## R3: Frontend Mutation Hooks

**Decision**: Add `useUpdateCategory()` and `useDeleteCategory()` hooks in `budget.ts`, following the same pattern as `useCreateCategory()`.

**Rationale**: Consistent with existing code patterns. Both hooks invalidate the `["budget"]` query key to refresh the categories list.

## R4: Inline Edit UX Pattern

**Decision**: Click-to-edit pattern on the budget cell. Display mode shows formatted value; edit mode shows a number input. Confirm on blur/Enter, cancel on Escape.

**Rationale**: Matches common inline edit patterns. Minimal UI footprint — no separate edit modal or form needed. The table already shows budget values, so editing in place is natural.

**Alternatives considered**: Separate edit modal per row — rejected as too heavy for a single field edit.

## R5: Delete UX Pattern

**Decision**: Small "x" or trash icon button on each row, no confirmation dialog.

**Rationale**: The action is easily reversible (re-upload CSV or manually re-add), and the Init Categories screen is a staging area, not a permanent data management view. Confirmation dialogs would slow down the cleanup flow.
