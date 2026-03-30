# Implementation Plan: Add Current Price Column

**Branch**: `026-add-current-price-column` | **Date**: 2026-03-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/026-add-current-price-column/spec.md`

## Summary

Add a "Current" column to the portfolio positions table showing the current price per unit for each asset. The data already exists in the API response (`current_price` field) — it just needs to be displayed. Single-file frontend change.

## Technical Context

**Language/Version**: TypeScript 5 (frontend only)
**Primary Dependencies**: Next.js 16, React 19
**Storage**: N/A (no data changes)
**Testing**: Manual browser testing via Playwright MCP
**Target Platform**: Web browser
**Project Type**: Web application (frontend only)

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Keep It Simple | PASS | Single file change, no new abstractions |
| Always Test with Browser | PASS | Will verify via Playwright MCP |
| Git Hygiene | PASS | On dedicated branch from main |

## Project Structure

### Source Code

```text
frontend/
└── src/
    └── components/
        └── portfolio/
            └── positions-list.tsx   # Only file to modify
```

## Implementation Approach

1. Add "Current" to the column headers between "Buy In" and "Position"
2. Add `current_price` to the sortable column keys
3. Render the formatted current price in each position row
4. Handle zero/missing price gracefully (show "—")

No research.md, data-model.md, or contracts/ needed — this is a pure UI column addition.
