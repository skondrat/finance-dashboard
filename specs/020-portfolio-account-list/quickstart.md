# Quickstart: Portfolio Account List & Delete

**Feature**: 020-portfolio-account-list

## Files to Modify

1. `frontend/src/lib/queries/accounts.ts` — add `useDeleteAccount()` hook
2. `frontend/src/app/(dashboard)/portfolio/page.tsx` — add account list with delete buttons to sidebar

## Step 1: Add Delete Hook

In `frontend/src/lib/queries/accounts.ts`, add a `useDeleteAccount` mutation following the existing `useCreateAccount` pattern:

- Method: `DELETE /api/v1/accounts/{id}`
- On success: invalidate `["accounts"]` and `["portfolio-summary"]` queries
- Returns: mutation object

Reference: `useDeleteNetworthAccount()` in `frontend/src/lib/queries/networth.ts`

## Step 2: Add Account List to Sidebar

In `frontend/src/app/(dashboard)/portfolio/page.tsx`, within the Accounts sidebar div:

1. Import `useAccounts` and `useDeleteAccount`
2. After the `<AddAccountModal />`, render the account list:
   - For each account: show name, type, and a delete (×) button
   - Delete button triggers `window.confirm()` then calls `deleteAccount.mutate(id)`
3. If no accounts, show nothing extra (just the Add Account button)

Reference: `AccountsTable` in `frontend/src/components/networth/accounts-table.tsx` for styling patterns

## Verification

1. Start frontend: `cd frontend && npm run dev`
2. Open Portfolio page
3. Verify existing accounts appear in sidebar below "Add Account"
4. Click × on an account → confirm → verify it disappears
5. Verify Positions filter tabs update accordingly
6. Test with no accounts — verify clean empty state
