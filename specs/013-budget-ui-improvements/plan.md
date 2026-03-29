# Implementation Plan: Budget UI Improvements

**Branch**: `013-budget-ui-improvements` | **Date**: 2026-03-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-budget-ui-improvements/spec.md`

## Summary

Frontend-only changes to the Spend by Category table: (1) add sortable column headers with direction arrows, (2) fix progress bar color for no-budget categories to be grey instead of green. All changes are in a single component file.

## Technical Context

**Language/Version**: TypeScript 5 (frontend only)
**Primary Dependencies**: Next.js 16, TanStack Query, Zustand
**Storage**: N/A (no backend changes)
**Testing**: Manual browser testing
**Target Platform**: Web application (localhost)
**Project Type**: Web application (frontend only)
**Performance Goals**: N/A — sorting small lists (<50 items)
**Constraints**: Must not break existing table layout or data flow
**Scale/Scope**: 1 component file modified

## Constitution Check

Constitution is a blank template — no project-specific principles defined. No gates to evaluate.

## Project Structure

### Documentation (this feature)

```text
specs/013-budget-ui-improvements/
├── plan.md
├── research.md
├── quickstart.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
frontend/
├── src/
│   └── components/budget/
│       └── category-table.tsx    # All changes here — sort state, sort arrows, progress bar fix
```

**Structure Decision**: Single component file. The category-table.tsx already contains the table headers, rows, and ProgressBar component. All changes are localized.

## Complexity Tracking

No constitution violations — section not applicable.
