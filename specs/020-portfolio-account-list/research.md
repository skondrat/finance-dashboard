# Research: Portfolio Account List & Delete

**Feature**: 020-portfolio-account-list
**Date**: 2026-03-29

## Existing Backend Support

The backend already has a complete delete endpoint:

- **Endpoint**: `DELETE /api/v1/accounts/{account_id}` → 204 No Content
- **File**: `backend/app/api/accounts.py` (lines 97-114)
- **Behavior**: Deletes account and cascading transactions via SQLAlchemy relationship
- **Error handling**: Returns 404 if account not found

No backend changes needed.

## Existing Frontend Queries

**File**: `frontend/src/lib/queries/accounts.ts`

Current hooks:
- `useAccounts()` — fetches all portfolio accounts (already used by PositionsList for filter tabs)
- `useCreateAccount()` — creates account, invalidates `["accounts"]` query

Missing:
- `useDeleteAccount()` — needs to be added, following same pattern as `useCreateAccount()`

## Reference Pattern: Networth Accounts Table

**File**: `frontend/src/components/networth/accounts-table.tsx`

The Networth tab already has a full account management table with:
- Account name and type display
- Delete button (× icon) with `window.confirm()` confirmation
- Inline balance editing
- Uses `useDeleteNetworthAccount()` hook

**Decision**: Follow the same visual and interaction pattern for the Portfolio account list, but simpler (no inline editing, no balance display — just name, type, and delete button).

**Rationale**: Consistent UX across Portfolio and Networth tabs. Users who manage accounts in Networth will recognize the pattern.

**Alternatives considered**:
- *Swipe-to-delete on mobile*: Adds complexity, not consistent with existing patterns
- *Context menu / dropdown*: Over-engineered for a single action (delete)
- *Separate management page*: Unnecessary — the sidebar list is sufficient

## Delete Hook Pattern

**Decision**: Add `useDeleteAccount()` to `frontend/src/lib/queries/accounts.ts` following the exact pattern of `useDeleteNetworthAccount()` from `frontend/src/lib/queries/networth.ts`.

**Pattern**:
- `useMutation` with `DELETE /api/v1/accounts/{id}`
- `onSuccess`: invalidate `["accounts"]` and `["portfolio-summary"]` queries
- Confirmation via `window.confirm()` in the click handler (not in the hook)

## Account List UI

**Decision**: Add the account list directly in `portfolio/page.tsx` within the existing Accounts sidebar `<div>`. Each account is a row with name, type badge, and a delete (×) button.

**Rationale**: The list is small (typically 1-5 accounts) and doesn't warrant a separate component file. Keeping it inline in the page reduces file count and matches the simplicity principle.
