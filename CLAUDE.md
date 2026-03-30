# finance-dashboard Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-30

## Active Technologies
- Python 3.11 (backend), TypeScript 5 (frontend) + FastAPI, SQLAlchemy 2.0, pdfplumber (PDF table extraction), anthropic (Anthropic Python SDK), Next.js 16, TanStack Query, Zustand, react-dropzone (002-pdf-statement-import)
- SQLite via SQLAlchemy (transactions, categories), Markdown file (description→category mappings), JSON file (source column mappings), CSV file (seed categories) (002-pdf-statement-import)
- Python 3.11 (backend only — no frontend changes) + FastAPI, pdfplumber (text extraction only), anthropic (Anthropic Python SDK), SQLAlchemy 2.0 (003-llm-pdf-parsing)
- SQLite via SQLAlchemy (unchanged) (003-llm-pdf-parsing)
- Python 3.11 (backend), TypeScript 5 (frontend) + FastAPI (SSE via StreamingResponse), anthropic (async client), Next.js, TanStack Query (004-parallel-categorization-progress)
- TypeScript 5 (frontend only) + Next.js, TanStack Query (005-fix-import-discard)
- N/A (backend unchanged) (005-fix-import-discard)
- TypeScript 5 (frontend only) + Next.js, Reac (006-auto-match-categories)
- Python 3.11 (backend), TypeScript 5 (frontend) + FastAPI, SQLAlchemy 2.0, anthropic (backend); Next.js 16, TanStack Query, Zustand (frontend) (007-categorization-quality)
- SQLite via SQLAlchemy (no schema changes) (007-categorization-quality)
- Python 3.11 (backend), TypeScript 5 (frontend) + FastAPI, SQLAlchemy 2.0, anthropic SDK (backend); Next.js 16, TanStack Query, Zustand (frontend) (008-atm-cash-categorization)
- Python 3.11 (backend), TypeScript 5 (frontend) + FastAPI, SQLAlchemy 2.0 (backend); Next.js 16, TanStack Query, Zustand (frontend) (009-init-categories-flow)
- SQLite via SQLAlchemy (no schema changes — `monthly_budget` field already exists on Category) (009-init-categories-flow)
- TypeScript 5 (frontend only) + Next.js 16, TanStack Query, Zustand (013-budget-ui-improvements)
- N/A (no backend changes) (013-budget-ui-improvements)
- Python 3.11 (backend), TypeScript 5 (frontend) + FastAPI, SQLAlchemy 2.0 (backend); Next.js 16, TanStack Query (frontend) (014-add-spend-default-categories)
- Python 3.11 (backend only) + FastAPI, SQLAlchemy 2.0 (015-auto-income-from-statement)
- SQLite via SQLAlchemy (no schema changes — reuses IncomeSource model) (015-auto-income-from-statement)
- Python 3.11 (backend), TypeScript 5 (frontend) + FastAPI, SQLAlchemy 2.0 (backend); Next.js 16, TanStack Query v5, Zustand v5, Tailwind CSS v4 (frontend) (018-networth-tab)
- SQLite via SQLAlchemy (Alembic migrations) (018-networth-tab)
- TypeScript 5 (frontend only) + Next.js 16, Tailwind CSS v4 (019-portfolio-layout-fullwidth)
- N/A (no data changes) (019-portfolio-layout-fullwidth)
- TypeScript 5 (frontend only) + Next.js 16, TanStack Query v5, Tailwind CSS v4 (020-portfolio-account-list)
- N/A (backend unchanged — delete endpoint already exists) (020-portfolio-account-list)
- TypeScript 5 (frontend only) + Next.js 16, React 19, Zustand (auth store), Tailwind CSS v4 (021-user-menu)
- N/A (reads from existing auth store) (021-user-menu)
- Python 3.11 (backend), TypeScript 5 (frontend) + FastAPI, SQLAlchemy 2.0, Alembic (backend); Next.js 16, React 19, Recharts 3, TanStack Query, Zustand (frontend) (022-networth-history)
- SQLite via SQLAlchemy (new `networth_snapshots` table + Alembic migration) (022-networth-history)
- Python 3.11 (backend), TypeScript 5 (frontend) + FastAPI, SQLAlchemy 2.0, Alembic (backend); Next.js 16, React 19, TanStack Query, Zustand, Tailwind CSS v4 (frontend) (024-subscriptions)
- SQLite via SQLAlchemy (new `subscriptions` + `dismissed_suggestions` tables + Alembic migration) (024-subscriptions)
- Python 3.11 (backend), TypeScript 5 (frontend) + FastAPI, SQLAlchemy 2.0, finnhub-python, pycoingecko (backend); Next.js 16, TanStack Query, Zustand (frontend) (025-fix-portfolio-prices)
- SQLite via SQLAlchemy (existing `assets`, `asset_prices` tables) (025-fix-portfolio-prices)

- Python 3.11 (backend), TypeScript 5 (frontend) + FastAPI, SQLAlchemy 2.0, Alembic (backend); Next.js 15, Tailwind CSS 4, shadcn/ui, Recharts, TanStack Query, Zustand (frontend) (001-finance-dashboard)

## Project Structure

```text
src/
tests/
```

## Commands

cd src [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] pytest [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] ruff check .

## Code Style

Python 3.11 (backend), TypeScript 5 (frontend): Follow standard conventions

## Recent Changes
- 025-fix-portfolio-prices: Added Python 3.11 (backend), TypeScript 5 (frontend) + FastAPI, SQLAlchemy 2.0, finnhub-python, pycoingecko (backend); Next.js 16, TanStack Query, Zustand (frontend)
- 024-subscriptions: Added Python 3.11 (backend), TypeScript 5 (frontend) + FastAPI, SQLAlchemy 2.0, Alembic (backend); Next.js 16, React 19, TanStack Query, Zustand, Tailwind CSS v4 (frontend)
- 022-networth-history: Added Python 3.11 (backend), TypeScript 5 (frontend) + FastAPI, SQLAlchemy 2.0, Alembic (backend); Next.js 16, React 19, Recharts 3, TanStack Query, Zustand (frontend)


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
