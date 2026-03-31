# Implementation Plan: Fix USD Import Currency Conversion

**Branch**: `037-fix-usd-import` | **Date**: 2026-03-31 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/037-fix-usd-import/spec.md`

## Summary

The `/budget/transactions` endpoint does not accept or filter by the `currency` query parameter. When the frontend requests EUR-mode data, USD transactions are returned with raw USD amounts, which the frontend then displays with a EUR symbol (e.g., $9,487.15 → €9,487.15). The fix is to add currency filtering to the transactions endpoint, matching the approach already used by `/budget/summary` and `/budget/spend-by-category`.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5 (frontend)
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0 (backend); Next.js 16, TanStack Query (frontend)
**Storage**: SQLite via SQLAlchemy
**Testing**: Manual browser testing via Playwright MCP
**Target Platform**: Web application
**Project Type**: Web service (backend API + frontend SPA)
**Performance Goals**: N/A (simple filter addition)
**Constraints**: N/A
**Scale/Scope**: Single endpoint fix

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| VI. Keep It Simple | ✅ Pass | 1-file backend fix, no new abstractions needed |
| III. Always Test with Browser | ✅ Will do | Test after implementation |

## Project Structure

### Documentation (this feature)

```text
specs/037-fix-usd-import/
├── plan.md              # This file
├── research.md          # Root cause analysis
└── spec.md              # Feature specification
```

### Source Code (repository root)

```text
backend/
├── app/
│   └── api/
│       └── budget.py          # Fix: add currency filter to list_transactions
```

**Structure Decision**: Single file change in existing backend API. No new files, models, or contracts needed.

## Complexity Tracking

No violations — this is a minimal, targeted fix.
