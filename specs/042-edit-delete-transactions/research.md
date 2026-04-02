# Research: Edit and Delete Budget Transactions

## R1: Backend DELETE endpoint availability

**Decision**: Reuse existing DELETE `/api/v1/budget/transactions/{transaction_id}` endpoint.
**Rationale**: Endpoint already exists at `backend/app/api/budget.py:145-167`, returns 204, checks user ownership. No changes needed.
**Alternatives considered**: Creating a soft-delete mechanism — rejected per spec assumption that deletions are permanent.

## R2: Backend PATCH endpoint — amount field support

**Decision**: Add `amount: Optional[FloatDecimal] = None` to `BudgetTransactionUpdate` schema in `backend/app/schemas/budget.py`.
**Rationale**: The existing PATCH endpoint at `budget.py:109-137` uses `model_dump(exclude_unset=True)` and `setattr`, so adding the field to the schema is sufficient — no endpoint code changes needed.
**Alternatives considered**: Creating a separate PUT endpoint for amount — rejected as unnecessary; PATCH with optional fields is the existing pattern.

## R3: Frontend delete mutation hook

**Decision**: Create `useDeleteBudgetTransaction()` mutation hook in `frontend/src/lib/queries/budget.ts`.
**Rationale**: The update mutation (`useUpdateBudgetTransaction`) already exists and follows the pattern: call API, invalidate `["budget"]` query keys. Delete hook follows the same pattern with a DELETE request returning 204.
**Alternatives considered**: None — this is the standard TanStack Query pattern used throughout the project.

## R4: Inline edit UX pattern

**Decision**: Use inline input with pencil icon trigger, Enter/check to save, Escape to cancel — matching the existing inline category edit pattern in the same component.
**Rationale**: The transaction list already supports inline category editing via dropdown (`transaction-list.tsx`). Amount editing should follow the same interaction style for consistency.
**Alternatives considered**: Modal-based editing — rejected as too heavyweight for a single-field edit.

## R5: Delete confirmation UX

**Decision**: Use a simple browser-native `window.confirm()` dialog or a lightweight inline confirmation.
**Rationale**: Keeps implementation simple per constitution. No need for a custom modal for a destructive single-item action.
**Alternatives considered**: Custom modal component — viable but over-engineered for this use case.
