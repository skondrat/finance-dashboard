# Implementation Plan: Edit Init Categories

**Branch**: `010-edit-init-categories` | **Date**: 2026-03-29 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/010-edit-init-categories/spec.md`

## Summary

Add inline budget editing and category removal to the Init Categories screen within the Import Statement modal. Users can click on any budget value to edit it in place, and click an "x" button to remove unwanted categories from the list. The backend already supports budget updates via PATCH; a new DELETE endpoint is needed for category removal.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5 (frontend)
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0 (backend); Next.js 16, TanStack Query, Zustand (frontend)
**Storage**: SQLite via SQLAlchemy (no schema changes)
**Testing**: Manual testing via browser
**Target Platform**: Web application
**Project Type**: Web service + SPA frontend
**Performance Goals**: Instant UI feedback on edit/delete (<200ms perceived)
**Constraints**: None specific beyond standard web responsiveness
**Scale/Scope**: Single modal component, 1 new API endpoint, 2 new frontend hooks

## Constitution Check

*No constitution principles defined — gate passes by default.*

## Project Structure

### Documentation (this feature)

```text
specs/010-edit-init-categories/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api.md           # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/
│   │   └── categories.py    # Add DELETE endpoint
│   ├── models/
│   │   └── category.py      # No changes
│   └── schemas/
│       └── budget.py        # No changes

frontend/
├── src/
│   ├── components/
│   │   └── budget/
│   │       └── import-modal.tsx  # Update InitCategories component
│   └── lib/
│       └── queries/
│           └── budget.ts         # Add useUpdateCategory, useDeleteCategory
```

**Structure Decision**: Standard web application layout — backend API + frontend SPA. No new files, only modifications to existing files.
