# Implementation Plan: Finance Dashboard

**Branch**: `001-finance-dashboard` | **Date**: 2026-03-25 | **Spec**: [spec.md](spec.md)
**Design System**: [`DESIGN.md`](../../DESIGN.md) — Editorial Ledger surfaces, typography, elevation, components
**UI Layouts**: [`SPEC.md`](../../SPEC.md) sections 3-6 — authoritative source for page wireframes, component placement, grid structure, chart styling, and per-element typography sizing
**Input**: Feature specification from `/specs/001-finance-dashboard/spec.md`

## Summary

A personal finance dashboard combining portfolio tracking (positions, transactions, allocation, performance analytics) with budgeting (statement import, categorization, spend tracking) and cashflow visualization (Sankey diagram). Built as a Python/FastAPI backend with SQLite storage and a Next.js 15/TypeScript frontend, following the Editorial Ledger design system (monochromatic, borderless, typographically driven). Key technical decisions: average cost basis for P/L, on-demand price fetching (Finnhub + CoinGecko), saved bank profiles for CSV column mapping, independent budget/portfolio data models.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5 (frontend)
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0, Alembic (backend); Next.js 15, Tailwind CSS 4, shadcn/ui, Recharts, TanStack Query, Zustand (frontend)
**Storage**: SQLite (single file, zero-config) via SQLAlchemy 2.0
**Testing**: pytest + httpx (backend), Vitest + React Testing Library (frontend)
**Target Platform**: Desktop web (1280px+, graceful at 1024px), self-hosted (Docker Compose or direct)
**Project Type**: Web application (separate backend API + frontend SPA)
**Performance Goals**: API responses <200ms (cached), chart endpoints <500ms, currency toggle <1s, statement import <30s
**Constraints**: Desktop-first (no mobile layout), single SQLite file, free-tier price APIs only
**Scale/Scope**: Single-user (multi-user ready), ~5 screens (3 tabs + auth + settings), ~30 API endpoints

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is unconfigured (template placeholders only). No active gates to evaluate. Proceeding without constraints.

**Post-Phase 1 re-check**: No violations. The two-project structure (backend + frontend) is the natural split for a web application with separate API and SPA concerns.

## Project Structure

### Documentation (this feature)

```text
specs/001-finance-dashboard/
├── plan.md              # This file
├── research.md          # Phase 0: technology decisions and rationale
├── data-model.md        # Phase 1: SQLite schema (12 entities)
├── quickstart.md        # Phase 1: developer setup guide
├── contracts/
│   └── api.md           # Phase 1: REST API contracts (~30 endpoints)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── main.py                  # FastAPI app, CORS, middleware
│   ├── config.py                # Settings (env vars, JWT config)
│   ├── database.py              # SQLAlchemy engine + session
│   ├── models/                  # SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── account.py
│   │   ├── asset.py
│   │   ├── investment_transaction.py
│   │   ├── asset_price.py
│   │   ├── category.py
│   │   ├── auto_cat_rule.py
│   │   ├── budget_transaction.py
│   │   ├── bank_profile.py
│   │   ├── statement_import.py
│   │   ├── income_source.py
│   │   └── exchange_rate.py
│   ├── api/                     # Route handlers (FastAPI routers)
│   │   ├── auth.py
│   │   ├── accounts.py
│   │   ├── portfolio.py
│   │   ├── transactions.py
│   │   ├── budget.py
│   │   ├── categories.py
│   │   ├── import_.py
│   │   ├── income.py
│   │   ├── cashflow.py
│   │   └── exchange_rates.py
│   ├── services/                # Business logic
│   │   ├── auth_service.py
│   │   ├── portfolio_service.py # Position calc, TWR, IRR, allocation
│   │   ├── budget_service.py    # KPIs, spend aggregation, analytics
│   │   ├── import_service.py    # Statement parsing + dedup
│   │   ├── price_service.py     # Finnhub + CoinGecko fetching
│   │   ├── fx_service.py        # Exchange rate fetching + conversion
│   │   └── categorization_service.py
│   ├── parsers/                 # Statement format parsers
│   │   ├── registry.py
│   │   ├── csv_parser.py
│   │   ├── ofx_parser.py
│   │   └── mt940_parser.py
│   └── schemas/                 # Pydantic request/response models
│       ├── auth.py
│       ├── account.py
│       ├── portfolio.py
│       ├── budget.py
│       └── common.py
├── alembic/                     # Database migrations
│   ├── alembic.ini
│   └── versions/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── conftest.py
├── pyproject.toml               # Dependencies (managed by uv)
├── uv.lock                      # Lockfile
└── Dockerfile

frontend/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── layout.tsx           # Root layout (fonts, providers, nav)
│   │   ├── page.tsx             # Redirect to /portfolio
│   │   ├── portfolio/
│   │   │   └── page.tsx
│   │   ├── budget/
│   │   │   └── page.tsx
│   │   ├── cashflow/
│   │   │   └── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── components/
│   │   ├── ui/                  # shadcn/ui restyled components
│   │   ├── layout/
│   │   │   ├── top-bar.tsx
│   │   │   ├── currency-toggle.tsx
│   │   │   └── theme-toggle.tsx
│   │   ├── portfolio/
│   │   │   ├── kpi-strip.tsx
│   │   │   ├── performance-chart.tsx
│   │   │   ├── positions-list.tsx
│   │   │   ├── transactions-view.tsx
│   │   │   ├── allocation-donut.tsx
│   │   │   └── performance-breakdown.tsx
│   │   ├── budget/
│   │   │   ├── kpi-strip.tsx
│   │   │   ├── category-table.tsx
│   │   │   ├── import-modal.tsx
│   │   │   ├── income-manager.tsx
│   │   │   └── charts/
│   │   │       ├── income-vs-spend.tsx
│   │   │       ├── savings-over-time.tsx
│   │   │       ├── investment-rate-trend.tsx
│   │   │       └── category-distribution.tsx
│   │   └── cashflow/
│   │       └── sankey-diagram.tsx
│   ├── lib/
│   │   ├── api.ts               # API client (fetch wrapper)
│   │   ├── queries/             # TanStack Query hooks
│   │   └── utils.ts             # Formatting, currency helpers
│   ├── stores/
│   │   ├── currency-store.ts    # Zustand: selected currency
│   │   └── theme-store.ts       # Zustand: theme preference
│   └── styles/
│       └── globals.css          # Tailwind + design tokens
├── public/
├── tailwind.config.ts           # Design token preset from DESIGN.md
├── tsconfig.json
├── package.json
├── vitest.config.ts
└── Dockerfile

docker-compose.yml
DESIGN.md
SPEC.md
```

**Structure Decision**: Web application with separate `backend/` (Python/FastAPI) and `frontend/` (Next.js/TypeScript) directories. This matches the SPEC.md section 10 project structure and cleanly separates API from UI concerns. Docker Compose orchestrates both services.

## Complexity Tracking

No constitution violations to justify.
