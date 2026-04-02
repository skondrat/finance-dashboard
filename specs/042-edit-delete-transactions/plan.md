# Implementation Plan: Edit and Delete Budget Transactions

**Branch**: `042-edit-delete-transactions` | **Date**: 2026-04-02 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/042-edit-delete-transactions/spec.md`

## Summary

Add inline amount editing (pencil icon) and delete (trash icon) buttons to each transaction row on the Budget page. The backend DELETE endpoint already exists; the PATCH endpoint needs `amount` added to its update schema. The frontend needs a delete mutation hook, inline edit UI, and a confirmation dialog for deletions.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5 (frontend)  
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0 (backend); Next.js 16, TanStack Query, Zustand (frontend)  
**Storage**: SQLite via SQLAlchemy (existing `budget_transactions` table)  
**Testing**: Manual browser testing via Playwright MCP  
**Target Platform**: Web application (localhost)  
**Project Type**: Web application (frontend + backend)  
**Performance Goals**: Edit/delete operations complete within 2 seconds  
**Constraints**: Inline editing must not disrupt existing category editing UX  
**Scale/Scope**: Single-user finance dashboard

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Keep It Simple | PASS | Minimal changes — extend existing PATCH schema + add 2 UI buttons |
| Always Test with Browser | WILL DO | Playwright MCP testing after implementation |
| Git Hygiene | PASS | Working on feature branch, will PR to main |

## Project Structure

### Documentation (this feature)

```text
specs/042-edit-delete-transactions/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/
│   │   └── budget.py              # PATCH endpoint — add amount to update schema
│   └── schemas/
│       └── budget.py              # BudgetTransactionUpdate — add amount field
└── tests/

frontend/
├── src/
│   ├── components/
│   │   └── budget/
│   │       └── transaction-list.tsx  # Add trash + pencil buttons, inline edit, confirm dialog
│   └── lib/
│       └── queries/
│           └── budget.ts            # Add useDeleteBudgetTransaction mutation hook
└── tests/
```

**Structure Decision**: Existing web app structure (backend/ + frontend/). Changes are minimal — 4 files total.
