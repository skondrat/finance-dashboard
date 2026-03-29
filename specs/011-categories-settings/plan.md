# Implementation Plan: Categories Settings Page

**Branch**: `011-categories-settings` | **Date**: 2026-03-29 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/011-categories-settings/spec.md`

## Summary

Move category initialization and management out of the Import Statement flow into a dedicated Categories page accessible from the Budget page. Add a settings gear icon with a dropdown menu, an "Init Categories" empty state when no categories exist, and disable the Import button until categories are set up. The backend gets one new endpoint to ensure required categories ("Other" and "ATM Withdrawal") exist.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5 (frontend)
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0 (backend); Next.js 16, TanStack Query, Zustand (frontend)
**Storage**: SQLite via SQLAlchemy (no schema changes)
**Testing**: pytest (backend), manual browser testing (frontend)
**Target Platform**: Web application (desktop browsers)
**Project Type**: Web application (fullstack)
**Performance Goals**: Standard web app — instant page transitions, <500ms API responses
**Constraints**: No database migration required
**Scale/Scope**: Single-user personal finance dashboard

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

No constitution defined (template only). No gates to evaluate.

**Post-design re-check**: N/A — constitution is blank template.

## Project Structure

### Documentation (this feature)

```text
specs/011-categories-settings/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: Research decisions
├── data-model.md        # Phase 1: Data model (no changes)
├── quickstart.md        # Phase 1: Dev quickstart
├── contracts/
│   └── api.md           # Phase 1: API contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/
│   │   ├── categories.py          # MODIFY: add ensure-required endpoint
│   │   └── import_.py             # UNCHANGED
│   ├── models/
│   │   └── category.py            # UNCHANGED
│   ├── services/
│   │   ├── seed_service.py        # UNCHANGED
│   │   └── budget_service.py      # UNCHANGED
│   └── schemas/
│       └── budget.py              # MODIFY: add EnsureRequiredResponse schema
└── tests/
    └── unit/                      # ADD: test for ensure-required endpoint

frontend/
├── src/
│   ├── app/
│   │   └── (dashboard)/
│   │       └── budget/
│   │           ├── page.tsx           # MODIFY: add gear menu, empty state, conditional Import
│   │           └── categories/
│   │               └── page.tsx       # CREATE: categories page
│   ├── components/
│   │   └── budget/
│   │       ├── settings-menu.tsx      # CREATE: gear icon dropdown
│   │       └── import-modal.tsx       # MODIFY: remove InitCategories flow
│   └── lib/
│       └── queries/
│           └── budget.ts              # MODIFY: add useEnsureRequiredCategories mutation
```

**Structure Decision**: Existing web application structure with backend/ and frontend/ directories. New categories page is a nested route under `/budget/categories/`. New settings-menu component created separately for reusability.
