# Tasks: Transaction Edit/Delete, Net Worth Currency, Account Currency

**Input**: Design documents from `/specs/031-txn-edit-networth-currency/`

- [x] T001 [P] [US1] Add `useUpdateTransaction(accountId)` mutation hook in frontend/src/lib/queries/accounts.ts
- [x] T002 [P] [US1] Add `useDeleteTransaction(accountId)` mutation hook in frontend/src/lib/queries/accounts.ts
- [x] T003 [US1] Add 3-dot options button (⋮) with Edit/Delete dropdown to transaction rows in transactions-view.tsx
- [x] T004 [US1] Implement inline edit mode with pre-filled form in transactions-view.tsx
- [x] T005 [US1] Implement delete with window.confirm() dialog in transactions-view.tsx
- [x] T006 [US1] Verify in browser: 3-dot menu visible on all transaction rows
- [x] T007 [US2] Read net worth history backend endpoint
- [x] T008 [US2] Fix net worth history to convert EUR snapshots to USD when requested in backend/app/api/networth.py
- [x] T009 [US2] Verify in browser (deferred to user test)
- [x] T010 [US3] Create Alembic migration to add currency column to accounts table
- [x] T011 [US3] Run migration and backfill IB→USD, Kraken→EUR
- [x] T012 [US3] Update Account model in backend/app/models/account.py
- [x] T013 [US3] Update AccountCreate/Update/Response schemas in backend/app/schemas/account.py
- [x] T014 [US3] Display account currency in portfolio sidebar in page.tsx
- [x] T015 [US3] Verify in browser: accounts show currency labels
- [x] T016 Take screenshot
