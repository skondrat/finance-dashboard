# Research: Budget Month Clear & Import Currency Selector

**Feature**: 076-budget-clear-import-currency
**Date**: 2026-04-30

## Research Tasks

### R1: How does the Debug menu currently work?

**Decision**: Extend the existing DebugMenu component with a new "Clear current month" action.

**Rationale**: DebugMenu (`frontend/src/components/budget/debug-menu.tsx`) is a self-contained component with no props. It currently has "Reset all data" (nuclear wipe) and an LLM model selector. The budget page (`frontend/src/app/(dashboard)/budget/page.tsx`) manages month/year via `useState` + sessionStorage. DebugMenu is rendered at line 179 with zero props — we need to pass `month` and `year` as props.

**Alternatives considered**:
- Reading sessionStorage directly from DebugMenu — rejected because it couples the component to a storage implementation detail and bypasses React's state flow.
- Adding a Zustand store for month/year — rejected as over-engineering; props are sufficient since DebugMenu is a direct child of the budget page.

### R2: What backend endpoint is needed for month-scoped deletion?

**Decision**: Add a new `POST /budget/debug/reset-month` endpoint that accepts `month` and `year` query parameters.

**Rationale**: The existing `POST /budget/debug/reset` deletes everything (all transactions, categories, imports, rules, mappings). A month-scoped delete should only remove `BudgetTransaction` rows where the `date` falls within the given month. The `ix_budget_transactions_user_date` index on `(user_id, date)` makes date-range filtering efficient. Categories, imports, and rules should NOT be deleted.

**Alternatives considered**:
- Adding optional month/year params to the existing reset endpoint — rejected to avoid breaking the existing "reset all" behavior and to keep semantics clear.
- Deleting by import_id for imports within a month — rejected because an import may span multiple months; we want precise month-based deletion.

### R3: How does the upload endpoint handle currency?

**Decision**: Add a `currency` Form parameter to the upload endpoint and pass it to `import_service.create_import()`.

**Rationale**: The upload endpoint (`POST /budget/import/upload`) currently accepts `file` and `source` as Form parameters. The `create_import()` service function already has a `currency` parameter (defaults to `"EUR"`), but the endpoint never passes it. Adding `currency: Optional[str] = Form(default="EUR")` to the endpoint and forwarding it to `create_import()` is a minimal change. For PDFs, per-row currencies from the parser take precedence via `row.get("currency", currency)`, but the user-selected currency serves as the fallback default.

**Alternatives considered**:
- Making currency a query parameter instead of Form data — rejected for consistency; the endpoint already uses Form for `source`.
- Storing currency at the import level instead of per-transaction — rejected because the existing model already stores currency per-transaction and the service already handles it.

### R4: Where should the currency selector appear in the import modal?

**Decision**: Show a currency selector (EUR/USD/UAH buttons or dropdown) in the import modal for all file types, visible before the upload begins.

**Rationale**: The import modal (`frontend/src/components/budget/import-modal.tsx`) already has a source selector that appears for PDFs. For non-PDFs, files upload immediately on drop. We need to change the flow so non-PDF files also wait for currency selection before uploading, OR show the currency selector in the dropzone area with EUR pre-selected so immediate upload uses the default. The simplest approach: show currency selector always (above or within the dropzone), default to EUR, and pass it along with the upload.

**Alternatives considered**:
- Showing currency selector only after file is dropped — rejected because non-PDFs upload immediately; the selector must be visible before drop.
- Requiring explicit "Upload" button click for all file types — rejected as it changes the existing UX for CSV/OFX imports unnecessarily.
