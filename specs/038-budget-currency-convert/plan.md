# Implementation Plan: Convert Budget Amounts Across Currencies

**Branch**: `038-budget-currency-convert` | **Date**: 2026-03-31 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/038-budget-currency-convert/spec.md`

## Summary

Change all budget endpoints from "filter by currency" to "return all transactions/income converted to the display currency". The FX service (`get_rate`, `convert`) already exists. The core work is in `budget_service.py` helper functions that currently filter by currency — they need to fetch all currencies and convert amounts using exchange rates.

## Technical Context

**Language/Version**: Python 3.11 (backend)
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0, fx_service (existing)
**Storage**: SQLite via SQLAlchemy (exchange_rates, budget_transactions, income_sources tables)
**Testing**: Manual browser testing via Playwright MCP
**Target Platform**: Web application
**Project Type**: Web service backend changes only (frontend already sends currency param)
**Constraints**: Must handle missing exchange rates gracefully (fallback to nearest earlier date, already in fx_service)

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| VI. Keep It Simple | ✅ Pass | Modifying existing service functions, no new abstractions |
| III. Always Test with Browser | ✅ Will do | Test after implementation |

## Project Structure

### Source Code Changes

```text
backend/
├── app/
│   ├── api/
│   │   ├── budget.py              # Remove currency filter from list_transactions
│   │   └── income.py              # Remove currency filter, add conversion
│   └── services/
│       └── budget_service.py      # Core changes: _income_for_period, _spend_for_period, get_spend_by_category
```

**Key approach**: In each helper function, remove the `currency ==` filter, query all currencies, and convert non-display-currency amounts using `fx_service.get_rate()` + `fx_service.convert()`.
