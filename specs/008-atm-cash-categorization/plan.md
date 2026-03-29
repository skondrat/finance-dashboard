# Implementation Plan: ATM Cash Expense Categorization

**Branch**: `008-atm-cash-categorization` | **Date**: 2026-03-29 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/008-atm-cash-categorization/spec.md`

## Summary

Add a post-categorization "Split Cash" feature for ATM Withdrawal rows in the import preview. Users enter free-text spending notes (e.g., "200 cosmetics, 50 taxi"), a single LLM call parses notes and matches to existing categories, and the preview table updates to show split line items with a remainder. Split state is managed in the frontend; the backend provides an LLM parsing endpoint and handles splits at confirm time.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5 (frontend)
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0, anthropic SDK (backend); Next.js 16, TanStack Query, Zustand (frontend)
**Storage**: SQLite via SQLAlchemy (no schema changes)
**Testing**: pytest (backend), manual browser testing (frontend)
**Target Platform**: Web application (localhost dev)
**Project Type**: Web service (full-stack)
**Performance Goals**: LLM response within 30 seconds (SC-001)
**Constraints**: Single LLM call per split; amounts must be explicit numerics
**Scale/Scope**: 1-5 ATM rows per statement; single user

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is a blank template — no gates defined. Pass.

**Post-Phase 1 re-check**: No violations. Feature uses existing patterns (LLM structured output, preview-then-confirm flow, frontend state management).

## Project Structure

### Documentation (this feature)

```text
specs/008-atm-cash-categorization/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── split-atm-cash.md
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/
│   │   └── import_.py          # + split-atm-cash endpoint
│   ├── services/
│   │   ├── llm_service.py      # + parse_cash_notes()
│   │   └── import_service.py   # + split handling in confirm
│   └── schemas/
│       └── budget.py           # + split request/response schemas

frontend/
├── src/
│   ├── components/
│   │   └── budget/
│   │       └── import-modal.tsx # + split UI (button, textarea, results)
│   └── lib/
│       └── queries/
│           └── budget.ts       # + split mutation, types
```

**Structure Decision**: Follows existing web application layout. All changes are additions to existing files — no new files needed.
