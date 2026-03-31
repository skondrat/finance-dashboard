# Implementation Plan: Transaction List View

**Branch**: `033-transaction-list-view` | **Date**: 2026-03-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/033-transaction-list-view/spec.md`

## Summary

Add a transaction list view to the Budget section that displays individual budget transactions with date, description, amount, and category. Users can access it by clicking a category row (pre-filtered) or via a dedicated section. Includes text search and category filter. This is a frontend-only feature — the backend `/api/v1/budget/transactions` endpoint with pagination and filtering already exists.

## Technical Context

**Language/Version**: TypeScript 5 (frontend only)  
**Primary Dependencies**: Next.js 16, TanStack Query v5, Zustand, Tailwind CSS v4  
**Storage**: N/A (uses existing backend API)  
**Testing**: Playwright MCP (browser-based manual testing)  
**Target Platform**: Web (desktop browser)  
**Project Type**: Web application (frontend feature)  
**Performance Goals**: Transaction list loads within 1 second for up to 500 transactions  
**Constraints**: Must integrate with existing Budget tab layout and time period selector  
**Scale/Scope**: Single new component area within existing Budget page

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Feature Delivery Workflow | PASS | Following full pipeline: specify → plan → tasks → implement → test → commit → push → PR → merge |
| Always Test with Browser | PASS | Will test with Playwright MCP after implementation |
| Ideas Tracking | PASS | Will mark done in ideas.md after merge |
| Git Hygiene | PASS | Started from main, dedicated branch created |
| Keep It Simple | PASS | Frontend-only change — skipping data-model.md and contracts/ |

## Project Structure

### Documentation (this feature)

```text
specs/033-transaction-list-view/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── app/(dashboard)/budget/
│   │   └── page.tsx                  # Modified: add transaction list section + category row click handler
│   ├── components/budget/
│   │   └── transaction-list.tsx      # NEW: transaction list component with search, filter, sort, pagination
│   └── lib/queries/
│       └── budget.ts                 # Existing: useBudgetTransactions hook already defined
```

**Structure Decision**: Frontend-only. One new component (`transaction-list.tsx`) plus modifications to the existing budget page and potentially the category table component to wire up click-to-filter navigation.
