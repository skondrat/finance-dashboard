# Implementation Plan: Fix Portfolio Prices

**Branch**: `025-fix-portfolio-prices` | **Date**: 2026-03-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/025-fix-portfolio-prices/spec.md`

## Summary

Portfolio positions display €0.00 because: (1) price provider Python packages aren't installed, (2) BTC/ETH are mistyped as "stock" instead of "crypto", (3) CoinGecko ID mapping is wrong (uses "btc" instead of "bitcoin"), (4) Finnhub tickers lack exchange suffixes for European ETFs, and (5) no frontend UI triggers price refresh. Fix all five issues and add auto-refresh on page load.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5 (frontend)
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0, finnhub-python, pycoingecko (backend); Next.js 16, TanStack Query, Zustand (frontend)
**Storage**: SQLite via SQLAlchemy (existing `assets`, `asset_prices` tables)
**Testing**: Manual browser testing via Playwright MCP
**Target Platform**: Local dev (macOS)
**Project Type**: Web application (full-stack)
**Performance Goals**: Price refresh <10 seconds for up to 20 assets
**Constraints**: Finnhub free tier (60 calls/min), CoinGecko free API (no key)
**Scale/Scope**: Single user, 4 assets currently

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| Feature Delivery Workflow | PASS | Following full pipeline: specify→plan→tasks→implement→test→commit→push→PR→merge |
| Always Test with Browser | PASS | Will verify with Playwright MCP after implementation |
| Keep It Simple | PASS | Minimal changes: fix data, install packages, add one button + auto-refresh hook |
| Git Hygiene | PASS | On dedicated branch 025-fix-portfolio-prices from main |

## Project Structure

### Documentation (this feature)

```text
specs/025-fix-portfolio-prices/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── services/
│   │   └── price_service.py     # Fix CoinGecko ID mapping, EUR currency
│   ├── api/
│   │   └── portfolio.py         # Add last_refreshed_at to summary (optional)
│   └── models/
│       └── asset.py             # No changes (schema is fine)
├── pyproject.toml               # Already has deps, just need install
└── data/
    └── finance.db               # Fix asset_type for BTC/ETH, ticker suffixes

frontend/
├── src/
│   ├── app/(dashboard)/portfolio/
│   │   └── page.tsx             # Add refresh button, auto-refresh logic
│   ├── components/portfolio/
│   │   └── (no changes needed)
│   └── lib/queries/
│       └── portfolio.ts         # Add useRefreshPrices mutation hook
```

**Structure Decision**: Existing web application structure (backend/ + frontend/) — no new directories needed. Changes are limited to fixing existing service code, updating database records, and adding a small amount of frontend wiring.

## Implementation Approach

### Step 1: Install Missing Packages
Run `pip install finnhub-python pycoingecko` in the backend virtualenv. Verify imports succeed.

### Step 2: Fix Database Records
- Update BTC and ETH `asset_type` from `"stock"` to `"crypto"`
- Update IUAA ticker to `"IUAA.DE"` and ISAC ticker to `"ISAC.DE"` (Xetra suffix for Finnhub)

### Step 3: Fix CoinGecko Provider
Add a static ticker→CoinGecko ID mapping dict (e.g., `{"btc": "bitcoin", "eth": "ethereum"}`). Change `vs_currencies` from `"usd"` to `"eur"`.

### Step 4: Wire Frontend Refresh
- Add `useRefreshPrices()` mutation hook in `portfolio.ts`
- Add a "Refresh Prices" button on the portfolio page
- Add auto-refresh: on page load, call refresh-prices if no prices exist or last fetch was >1 hour ago

### Step 5: Test End-to-End
- Trigger refresh, verify `asset_prices` table gets populated
- Verify positions show non-zero values
- Verify KPIs calculate correctly

## Complexity Tracking

No constitution violations — no complexity tracking needed.
