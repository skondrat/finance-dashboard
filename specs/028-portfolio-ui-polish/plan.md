# Implementation Plan: Portfolio UI Polish

**Branch**: `028-portfolio-ui-polish` | **Date**: 2026-03-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/028-portfolio-ui-polish/spec.md`

## Summary

Three portfolio fixes: (1) Performance chart only shows today because `asset_prices` table lacks historical data — seed it using `YFinanceProvider.fetch_historical()` and `CoinGeckoProvider.fetch_historical()`. (2) Aggregated transactions requires a new backend endpoint `GET /portfolio/transactions` since all existing transaction endpoints are scoped to a single account. (3) Replace the "Refresh Prices" text button with a compact icon button.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5 (frontend)
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0 (backend); Next.js 16, React 19, Recharts 3, TanStack Query (frontend)
**Storage**: SQLite via SQLAlchemy (no schema changes)
**Testing**: Manual browser testing via Playwright MCP

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Keep It Simple | PASS | Reusing existing fetch_historical() providers, small API addition |
| Always Test with Browser | PASS | Will verify chart, transactions, and icon via Playwright |
| Git Hygiene | PASS | Dedicated branch from main |

## Project Structure

### Source Code

```text
backend/
├── app/
│   ├── api/
│   │   └── portfolio.py            # Add GET /portfolio/transactions endpoint
│   ├── services/
│   │   ├── portfolio_service.py    # Add get_all_transactions()
│   │   └── price_service.py        # Add seed_historical_prices() function
│   └── schemas/
│       └── account.py              # Extend TransactionResponse with account_name

frontend/
├── src/
│   ├── app/(dashboard)/portfolio/
│   │   └── page.tsx                # Show TransactionsView for aggregated, icon button
│   ├── components/portfolio/
│   │   └── transactions-view.tsx   # Support optional accountId (show all when undefined)
│   └── lib/queries/
│       ├── portfolio.ts            # Add useAllTransactions hook
│       └── accounts.ts             # (no changes)
```

## Implementation Approach

### US1: Fix Performance Chart
The chart logic is correct but there's no historical price data. The providers already have `fetch_historical()` methods. Approach:
1. Add a `seed_historical_prices()` function that fetches historical prices for all held assets (e.g., last 1 year)
2. Call it as part of the price refresh flow (or on first load)
3. Once prices exist for past dates, the chart query will return multiple data points

### US2: Aggregated Transactions
No backend endpoint returns all transactions. Approach:
1. Add `GET /portfolio/transactions` endpoint that queries all user transactions across accounts
2. Include account name in each transaction response for context
3. Frontend: add `useAllTransactions()` hook, render TransactionsView when accountId is undefined

### US3: Icon Refresh Button
Simple frontend change — replace the text button with a refresh icon (SVG circular arrows), add tooltip, keep loading state.
