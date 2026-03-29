# Implementation Plan: Networth Tab

**Branch**: `018-networth-tab` | **Date**: 2026-03-29 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/018-networth-tab/spec.md`

## Summary

Add a "Networth" tab that shows the user's total net worth by combining manually entered account balances (bank accounts, crypto wallets, cash) with per-account investment portfolio values from the existing Portfolio system. Users can add/edit/delete manual accounts and quickly update balances inline. All values convert to the display currency.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5 (frontend)
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0 (backend); Next.js 16, TanStack Query v5, Zustand v5, Tailwind CSS v4 (frontend)
**Storage**: SQLite via SQLAlchemy (Alembic migrations)
**Testing**: pytest (backend), Playwright MCP browser testing
**Target Platform**: Web application (localhost:3000 frontend, localhost:8000 backend)
**Project Type**: Web application (fullstack)
**Performance Goals**: Sub-second page load, instant inline balance updates
**Constraints**: Single-user personal dashboard, no concurrent editing concerns
**Scale/Scope**: Tens of manual accounts at most

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Feature Delivery Workflow | PASS | Following full speckit pipeline |
| Combine Small Features | N/A | Single feature |
| Always Test with Browser | WILL DO | Playwright MCP after implementation |
| Git Hygiene | PASS | Working on dedicated branch 018-networth-tab |
| Keep It Simple | PASS | Both backend and frontend changes needed; no unnecessary abstractions |

## Project Structure

### Documentation (this feature)

```text
specs/018-networth-tab/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output
    └── networth-api.md
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── models/
│   │   └── networth_account.py    # NEW - NetworthAccount ORM model
│   ├── schemas/
│   │   └── networth.py            # NEW - Pydantic request/response schemas
│   ├── api/
│   │   └── networth.py            # NEW - CRUD + summary endpoints
│   └── main.py                    # MODIFIED - register networth router
├── alembic/
│   └── versions/
│       └── xxx_add_networth_accounts.py  # NEW - migration

frontend/
├── src/
│   ├── app/(dashboard)/
│   │   └── networth/
│   │       └── page.tsx           # NEW - Networth page
│   ├── components/
│   │   ├── layout/
│   │   │   └── top-bar.tsx        # MODIFIED - add NETWORTH tab
│   │   └── networth/
│   │       ├── summary-kpi.tsx    # NEW - total net worth display
│   │       ├── accounts-table.tsx # NEW - breakdown table with inline edit
│   │       └── add-account-modal.tsx # NEW - add/edit account form
│   └── lib/
│       └── queries/
│           └── networth.ts        # NEW - TanStack Query hooks
```

**Structure Decision**: Follows existing web application pattern — new model/schema/api in backend, new page/components/queries in frontend. Mirrors the structure of existing features (portfolio, budget, cashflow).
