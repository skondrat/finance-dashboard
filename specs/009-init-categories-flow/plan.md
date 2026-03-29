# Implementation Plan: Init Categories Flow

**Branch**: `009-init-categories-flow` | **Date**: 2026-03-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-init-categories-flow/spec.md`

## Summary

Add a dedicated "Init Categories" step to the Import Statement modal that appears when a user has no categories. Users can upload a CSV with category names, example descriptions, and optional monthly budget amounts (in euros), then manually add more categories before proceeding to their first statement import. Extends the existing seed CSV parser to support a `Budget` column and enhances the frontend import modal with a multi-step Init flow.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5 (frontend)
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0 (backend); Next.js 16, TanStack Query, Zustand (frontend)
**Storage**: SQLite via SQLAlchemy (no schema changes — `monthly_budget` field already exists on Category)
**Testing**: Manual browser testing via Playwright MCP
**Target Platform**: Web application (localhost)
**Project Type**: Web application (full-stack)
**Performance Goals**: N/A (personal finance app, single user)
**Constraints**: None specific to this feature
**Scale/Scope**: Single user, ~30 categories max

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is a blank template with no defined principles — no gates to enforce. Proceeding.

**Post-Phase 1 re-check**: No violations. No new dependencies, no schema changes, minimal API surface change (one field added to response schema).

## Project Structure

### Documentation (this feature)

```text
specs/009-init-categories-flow/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api.md           # API contract changes
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── schemas/
│   │   └── budget.py            # Add budgets_loaded to SeedCategoriesResponse
│   └── services/
│       └── seed_service.py      # Add Budget column parsing
└── (no other backend changes)

frontend/
├── src/
│   ├── components/
│   │   └── budget/
│   │       └── import-modal.tsx  # Init Categories step UI
│   └── lib/
│       └── queries/
│           └── budget.ts         # Update response type

data/
└── init_categories.csv           # Test data file (new)
```

**Structure Decision**: Existing web application structure (backend/ + frontend/). No new directories needed. Changes are localized to 4 existing files + 1 new test data file.

## Complexity Tracking

No violations to justify — feature is a straightforward extension of existing patterns.
