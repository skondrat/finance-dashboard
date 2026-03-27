# Implementation Summary

## Overview

Personal finance dashboard combining portfolio tracking, budgeting, and cashflow visualization. Built as a Python/FastAPI backend with SQLite storage and a Next.js 15/TypeScript frontend, following the Editorial Ledger design system.

## Backend (57 API routes)

- **Framework**: FastAPI + SQLAlchemy 2.0 + Alembic with SQLite
- **12 models**: User, Account, Asset, InvestmentTransaction, AssetPrice, Category, AutoCatRule, BudgetTransaction, BankProfile, StatementImport, IncomeSource, ExchangeRate
- **8 services**: portfolio, price, budget, import, categorization, fx, auth, plus parsers (CSV/OFX/MT940)
- **12 API routers**: auth, accounts, transactions, portfolio, categories, import, budget, income, exchange rates, cashflow, budget charts, users
- JWT authentication with registration, login, refresh tokens
- IRR/TWR calculations, currency conversion, Sankey data computation

## Frontend (7 pages, 30+ components)

- **Framework**: Next.js 15 App Router with TypeScript + Tailwind CSS 4
- **Pages**: Portfolio, Budget, Cashflow, Login, Register (+ root redirect)
- **Design system**: Editorial Ledger — monochromatic surfaces, Geist Mono / Space Grotesk / Inter typography, no borders, tonal stacking
- **Charts**: Recharts (area, bar, line, donut) + d3-sankey for cashflow
- **State**: Zustand (currency, theme, auth) + TanStack Query (server state)
- Dark/light theme toggle with localStorage persistence
- Auth guard, error boundaries, skeleton/empty states
- Docker support with multi-stage Dockerfiles

## Implementation Phases

| Phase | Scope | Tasks |
|-------|-------|-------|
| 1. Setup | Project init, dependencies, tooling | T001-T008 |
| 2. Foundational | FastAPI entry, DB, models, frontend scaffold | T009-T025 |
| 3. US1 Portfolio | Positions, KPIs, performance chart, price service | T026-T044 |
| 4. US2 Budget | Statement import, categorization, spend tracking | T045-T076 |
| 5. US3 Currency | EUR/USD toggle, FX service, cache invalidation | T077-T085 |
| 6. US4 Transaction Mgmt | Account/transaction CRUD UI, modals, filters | T086-T090 |
| 7. US5 Cashflow | Sankey diagram, KPI strip, breakdown row | T091-T097 |
| 8. US6 Budget Analytics | Income vs spend, savings, trends, distribution | T098-T104 |
| 9. US7 Portfolio Analytics | Allocation donut, performance breakdown, IRR/TWR | T105-T110 |
| 10. US8 Theme | Dark/light toggle, CSS custom properties | T111-T115 |
| 11. US9 Auth | JWT auth, login/register, auth guard | T116-T125 |
| 12. Polish | Skeletons, empty states, error boundaries, Docker | T126-T131 |

## Key Technical Decisions

- **Average cost method** for position P/L calculations
- **On-demand price fetching** via Finnhub (stocks/ETFs) + CoinGecko (crypto)
- **ECB daily rates** via exchangerate.host for currency conversion
- **SHA-256 deduplication** for bank statement imports
- **Parser registry pattern** for CSV/OFX/MT940 formats
- **Saved bank profiles** for CSV column mapping
- **Newton-Raphson solver** for IRR calculation
- **CSS custom properties** for theme switching (no Tailwind dark: prefix needed)

## Project Structure

```
finance-dashboard/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, router registration
│   │   ├── config.py            # Settings from env vars
│   │   ├── database.py          # SQLAlchemy engine + session
│   │   ├── models/              # 12 SQLAlchemy ORM models
│   │   ├── api/                 # 12 FastAPI routers + deps
│   │   ├── services/            # Business logic (7 services)
│   │   ├── parsers/             # CSV/OFX/MT940 parsers
│   │   └── schemas/             # Pydantic request/response models
│   ├── alembic/                 # Database migrations
│   ├── tests/                   # pytest test fixtures
│   ├── pyproject.toml           # Python dependencies (uv)
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js App Router pages
│   │   │   ├── (dashboard)/     # Portfolio, Budget, Cashflow
│   │   │   └── (auth)/          # Login, Register
│   │   ├── components/          # 30+ React components
│   │   │   ├── layout/          # TopBar, CurrencyToggle, ThemeToggle
│   │   │   ├── portfolio/       # KPIs, chart, positions, donut, etc.
│   │   │   ├── budget/          # KPIs, categories, import, charts
│   │   │   ├── cashflow/        # Sankey, KPIs, breakdown
│   │   │   └── ui/              # Skeleton, EmptyState, ErrorBoundary
│   │   ├── lib/                 # API client, utils, query hooks
│   │   └── stores/              # Zustand (currency, theme, auth)
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── DESIGN.md                    # Editorial Ledger design system
├── SPEC.md                      # Product specification
└── specs/                       # Feature specs, plans, tasks
```
