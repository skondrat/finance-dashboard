# Implementation Plan: Categorization Quality Improvements

**Branch**: `007-categorization-quality` | **Date**: 2026-03-29 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/007-categorization-quality/spec.md`

## Summary

Four categorization quality improvements for the import pipeline: (1) exclude "Transfer between balances" transactions from import entirely, (2) auto-categorize ATM withdrawals via a built-in prefix rule with a dedicated category, (3) harmonize AI categorization results so identical descriptions always get the same category, and (4) visually flag "Other"-categorized transactions in the import preview for user review.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5 (frontend)
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0, anthropic (backend); Next.js 16, TanStack Query, Zustand (frontend)
**Storage**: SQLite via SQLAlchemy (no schema changes)
**Testing**: pytest (backend), manual browser testing (frontend)
**Target Platform**: Web application (localhost dev)
**Project Type**: Full-stack web application
**Performance Goals**: No regression in import speed; harmonization adds negligible overhead
**Constraints**: No database migrations; no new dependencies
**Scale/Scope**: Single-user personal finance tool

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is an unfilled template — no gates to enforce. Proceeding.

**Post-Phase 1 re-check**: No violations. All changes are in existing service/component files. No new abstractions or patterns introduced.

## Project Structure

### Documentation (this feature)

```text
specs/007-categorization-quality/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── import-api.md    # Updated import response contract
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── services/
│   │   ├── categorization_service.py  # ATM rule + harmonization
│   │   └── import_service.py          # Transfer exclusion + excluded_count
│   └── schemas/
│       └── budget.py                  # excluded_count field
└── data/
    └── (no changes)

frontend/
└── src/
    ├── components/budget/
    │   └── import-modal.tsx           # "Other" highlighting + excluded count
    └── lib/queries/
        └── budget.ts                  # excluded_count in ImportResponse

data/
└── categories.csv                     # Add "ATM Withdrawal" row
```

**Structure Decision**: Existing web application structure (backend/ + frontend/). All changes are modifications to existing files. No new files or directories needed in src/.

## Implementation Approach

### Change 1: Exclude "Transfer between balances" (P1)

**File**: `backend/app/services/import_service.py`
**Location**: `create_import()`, after parsing rows (line ~116), before categorization

- Add a filter step that removes rows where `description.lower().strip().startswith("transfer between balances")`
- Track count of excluded rows
- Pass only non-excluded rows to categorization and preview building
- Add `excluded_count` to the return dict

**File**: `backend/app/schemas/budget.py`
- Add `excluded_count: int = 0` to `ImportUploadResponse`

**File**: `frontend/src/lib/queries/budget.ts`
- Add `excluded_count: number` to `ImportResponse`

**File**: `frontend/src/components/budget/import-modal.tsx`
- Display `excluded_count` in the preview summary line (alongside duplicates/skipped)

### Change 2: ATM Withdrawal auto-categorization (P2)

**File**: `backend/app/services/categorization_service.py`
**Location**: Both `categorize_transactions_batch()` and `categorize_transactions_batch_async()`, as a new Step 0 before mapping file lookup

- Before Steps 1-3, check if description starts with "atm withdrawal" (case-insensitive)
- If matched: look up "ATM Withdrawal" category for the user. If it doesn't exist, create it.
- Return result with `category_source: "rule"`
- Extract the built-in rule check into a helper function `_check_builtin_rules(db, user_id, description, category_by_name)` to avoid duplicating logic

**File**: `data/categories.csv`
- Add `ATM Withdrawal,` row to seed file

### Change 3: Harmonize identical descriptions (P3)

**File**: `backend/app/services/categorization_service.py`
**Location**: New function `_harmonize_ai_results(results)` called at the end of both batch functions, after AI categorization

- Group results by `description.lower().strip()` (need descriptions passed alongside results)
- For each group: collect all `category_source == "ai"` entries
- If group has mixed categories: find majority category_id, apply to all AI entries in group
- Tie-break: first occurrence (lowest index)
- Return modified results dict

### Change 4: Flag "Other" transactions in preview (P4)

**File**: `frontend/src/components/budget/import-modal.tsx`
**Location**: `PreviewTable` component, in the row rendering

- Determine effective category name for each row (considering overrides)
- If category name is "Other", apply amber/warning styling to the `<tr>`:
  - Background: `bg-amber-50/50 dark:bg-amber-950/20` or equivalent using the design system tokens
  - Small warning indicator near the category selector
- When user overrides from "Other" to another category, the highlight disappears reactively (already handled by existing override logic changing the displayed category name)

## Complexity Tracking

No constitution violations to justify.
