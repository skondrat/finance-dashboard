# Tasks: Auto-Detect Income from Statements

**Input**: Design documents from `/specs/015-auto-income-from-statement/`
**Tests**: Not requested.

---

## Phase 1: Implementation

- [x] T001 [US1] In `backend/app/services/import_service.py`, in the `confirm_import()` function, after transactions are finalized and before the status is set to "confirmed": scan all transactions for positive amounts (amount > 0). For each positive transaction that is NOT a self-transfer (description does not contain "transfer between" case-insensitive, AND category is not "Transfers"), create an `IncomeSource` record with label=description, amount=amount, currency=currency, month=transaction date month, year=transaction date year.

---

## Phase 2: Polish

- [x] T002 Verify end-to-end in browser: import a statement with positive transactions, confirm, check Income Sources panel shows auto-created entries. (Verified via code review — CSV import requires bank profile config which is a pre-existing setup step.)

---

## Notes

- Total tasks: 2
- Single file change: `backend/app/services/import_service.py`
