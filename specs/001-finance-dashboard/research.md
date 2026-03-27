# Research: Finance Dashboard

**Feature**: 001-finance-dashboard
**Date**: 2026-03-25

## 1. Asset Price API

**Decision**: Hybrid — Finnhub (primary for stocks/ETFs/bonds) + CoinGecko (crypto)

**Rationale**: Finnhub offers the most generous free tier (60 req/min) covering stocks, ETFs, forex, and bonds with an official API and Python SDK. CoinGecko is the gold standard for crypto pricing (30 req/min free tier). Both have documented rate limits and high reliability, unlike yfinance which is frequently blocked.

**Alternatives considered**:
- yfinance: No official API, frequent IP blocking, unreliable for production use
- Alpha Vantage: Only 25 requests/day on free tier — too restrictive
- EODHD: Only 20 calls/day on free tier — too restrictive

**Implementation notes**:
- Prices are fetched on-demand when the user opens Portfolio tab or clicks refresh
- Historical daily prices are cached in the `asset_price` table
- A provider abstraction allows swapping APIs without changing business logic
- Python packages: `finnhub-python`, `pycoingecko`

## 2. Exchange Rate API

**Decision**: ECB daily feed via exchangerate.host (free, no API key required)

**Rationale**: ECB publishes daily reference rates for EUR/USD (and many other pairs). exchangerate.host wraps this into a clean JSON API. For a personal finance tool needing daily rates, this is sufficient and free.

**Alternatives considered**:
- Direct ECB XML feed: Requires XML parsing, less convenient
- Open Exchange Rates: Requires API key, limited free tier
- Fixer.io: Paid-only since 2024

**Implementation notes**:
- Fetch daily EUR/USD rate and cache in `exchange_rate` table
- Fallback to most recent available rate if a specific date is missing
- Python package: `httpx` for API calls (already in the stack)

## 3. Statement Parsing Libraries

**Decision**: `ofxparse` (OFX) + `mt-940` (MT940) + stdlib `csv` with custom column mapping (CSV)

**Rationale**: All three are well-maintained, production-ready Python packages that cover the three supported bank statement formats. Using stdlib `csv` with custom bank profiles (saved column mappings) is simpler than adding pandas as a dependency for this use case.

**Alternatives considered**:
- pandas for CSV: Overkill for column mapping; adds a large dependency
- mt940-parser: Less widely adopted than mt-940
- ofx (pure Python): More verbose, slower

**Implementation notes**:
- Parser registry pattern: `StatementFormat` enum → parser class mapping
- CSV bank profiles stored in DB with column mappings, date format, delimiter
- Deduplication via composite key: date + amount + reference (normalized)
- Python packages: `ofxparse>=0.3.3`, `mt-940>=4.0`

## 4. Sankey Diagram

**Decision**: D3-sankey via a lightweight React wrapper or custom Recharts extension

**Rationale**: The SPEC.md mentions "SankeyMATIC" as inspiration for the Cashflow tab. Recharts does not include a built-in Sankey component. D3-sankey is the standard library for Sankey layouts and can be wrapped in a React component that follows the Editorial Ledger design system. Alternatively, `react-sankey` or `@nivo/sankey` can be evaluated.

**Alternatives considered**:
- SankeyMATIC embed: External tool, not embeddable as a React component
- @nivo/sankey: Full-featured but adds a large dependency tree
- Custom SVG: Too much effort for a single chart type

**Implementation notes**:
- npm package: `d3-sankey` + custom React SVG component
- Styled to match DESIGN.md: monochromatic palette, glassmorphism tooltips, Geist Mono labels
- Data flows: Income sources → spending categories + savings + investments

## 5. Financial Calculations

**Decision**: Custom implementation in Python backend

**Rationale**: TWR, IRR, saving rate, and investment rate are domain-specific formulas that are straightforward to implement. Using a financial library (e.g., numpy-financial) would add a dependency for only 4 functions.

**Implementation notes**:
- **TWR**: Product of (1 + HPR_i) - 1 across sub-periods between cash flows
- **IRR**: Newton-Raphson numerical solver on the cash flow series
- **Saving Rate**: (income - spend) / income * 100
- **Investment Rate**: investments / income * 100
- **Average Cost Basis**: Weighted average price across all buys; recalculated on each purchase; sells reduce quantity without changing average cost
- All calculations tested against known reference data (SC-009)

## 6. Authentication

**Decision**: JWT with httpOnly refresh cookies (per SPEC.md section 2)

**Rationale**: Specified in the tech stack. JWT access tokens in Authorization header + refresh tokens in httpOnly cookies is a secure, stateless pattern suitable for a single-page app with a separate API backend.

**Implementation notes**:
- Access token: short-lived (15 min), sent via Authorization header
- Refresh token: long-lived (7 days), httpOnly cookie, rotated on use
- Single-user mode acceptable for early development (per spec assumptions)
- Python package: `python-jose[cryptography]` for JWT encoding/decoding, `passlib[bcrypt]` for password hashing
