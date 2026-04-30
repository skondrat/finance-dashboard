# Implementation Plan: Budget Month Clear & Import Currency Selector

**Branch**: `076-budget-clear-import-currency` | **Date**: 2026-04-30 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/076-budget-clear-import-currency/spec.md`

## Summary

Two enhancements to the budget workflow: (1) a scoped "Clear current month data" option in the Debug menu that deletes only budget transactions for the selected month, and (2) a currency selector (EUR/USD/UAH) in the import modal so the user controls which currency is assigned to imported transactions.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5 (frontend)
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0 (backend); Next.js 16, TanStack Query v5, Zustand (frontend)
**Storage**: SQLite via SQLAlchemy (existing `budget_transactions` table — no schema changes)
**Testing**: Manual browser testing via Playwright MCP
**Target Platform**: Web application (localhost dev)
**Project Type**: Web service (backend API + frontend SPA)
**Performance Goals**: Standard — month deletion uses existing `(user_id, date)` index
**Constraints**: None specific
**Scale/Scope**: Single user, local SQLite

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Feature Delivery Workflow | PASS | Following full pipeline: specify → plan → tasks → implement → test → commit → push → PR → merge |
| Combine Small Related Features | PASS | Two related budget features combined into single branch/spec |
| Always Test with Browser | PASS | Will test with Playwright MCP after implementation |
| Git Hygiene | PASS | Branch created from main |
| Keep It Simple | PASS | No schema changes, no new abstractions, minimal file modifications |

**Post-Phase 1 Re-check**: All gates still pass. No schema migrations needed, no new dependencies, 6 files modified total.

## Project Structure

### Documentation (this feature)

```text
specs/076-budget-clear-import-currency/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research findings
├── data-model.md        # Existing model documentation
├── quickstart.md        # Dev quickstart guide
├── contracts/
│   └── api.md           # API contract changes
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/
│   │   └── import_.py          # Modified: new reset-month endpoint + currency param on upload
│   └── services/
│       └── import_service.py   # No changes (already accepts currency)

frontend/
├── src/
│   ├── app/(dashboard)/budget/
│   │   └── page.tsx            # Modified: pass month/year to DebugMenu
│   ├── components/budget/
│   │   ├── debug-menu.tsx      # Modified: add month/year props + clear month action
│   │   └── import-modal.tsx    # Modified: add currency selector UI
│   └── lib/queries/
│       └── budget.ts           # Modified: add currency to upload mutations
```

**Structure Decision**: Existing web app structure (backend/ + frontend/) — no new files created, only modifications to 5 existing files.

## Implementation Details

### Feature 1: Clear Current Month Data

**Backend** (`backend/app/api/import_.py`):
- New endpoint `POST /budget/debug/reset-month?month={m}&year={y}`
- Query `BudgetTransaction` where `user_id` matches and `date` is between first and last day of the given month
- Delete matching rows, return `{ transactions_deleted: N }`

**Frontend** (`frontend/src/components/budget/debug-menu.tsx`):
- Add `month: number` and `year: number` props to DebugMenu
- Add "Clear current month data" button below "Reset all data"
- On click: show `window.confirm()` with month/year in the message
- On confirm: POST to `/budget/debug/reset-month?month={m}&year={y}`
- Invalidate `["budget"]` queries on success

**Frontend** (`frontend/src/app/(dashboard)/budget/page.tsx`):
- Pass `month={month}` and `year={year}` to `<DebugMenu />` on line 179

### Feature 2: Import Currency Selector

**Backend** (`backend/app/api/import_.py`):
- Add `currency: Optional[str] = Form(default="EUR")` to `upload_import()` endpoint
- Pass `currency` to `import_service.create_import()` call (both PDF and non-PDF code paths)

**Frontend** (`frontend/src/components/budget/import-modal.tsx`):
- Add `selectedCurrency` state, default `"EUR"`
- Render currency selector (3 buttons: EUR, USD, UAH) in the dropzone area, visible for all file types
- Pass `currency` in the `uploadMutation.mutate()` call and `sseUpload()` call

**Frontend** (`frontend/src/lib/queries/budget.ts`):
- Add `currency?: string` to `UploadParams` interface
- Append `currency` to FormData in both `useImportUpload()` and `useImportWithProgress()`

## Complexity Tracking

No constitution violations. No complexity justifications needed.
