# Research: Subscriptions

**Feature**: 024-subscriptions | **Date**: 2026-03-29

## Findings

### 1. Recurring Expense Detection Query

- **Decision**: SQL query grouping budget_transactions by LOWER(description) and month, filtering for descriptions appearing in 2+ consecutive calendar months
- **Rationale**: budget_transactions already has description, date, amount, and user_id. A simple GROUP BY + window function or self-join finds consecutive months efficiently. SQLite supports STRFTIME for month extraction.
- **Alternatives considered**:
  - LLM-based detection — rejected as overkill for exact matching
  - Background job — rejected per clarification (on-demand is simpler)

### 2. Suggestion Persistence Strategy

- **Decision**: Suggestions are computed on-the-fly (not persisted). Only dismissals are stored in a `dismissed_suggestions` table.
- **Rationale**: Suggestions change as new statements are imported. Persisting them would require invalidation logic. Computing on-demand from raw transactions is simple and always fresh. Only dismissals need persistence (small table).
- **Alternatives considered**:
  - Persisted suggestions table with status — rejected as it requires sync/invalidation when new imports arrive

### 3. Payment Source Data

- **Decision**: Query DISTINCT source values from user's statement_imports table to populate the dropdown
- **Rationale**: The StatementImport model already has a `source` field with values like "monobank", "payoneer", "millenium". A simple distinct query provides the list. Custom entry allows values not from imports.
- **Alternatives considered**: Hardcoded list — rejected as it wouldn't reflect the user's actual data

### 4. Navigation Tab Placement

- **Decision**: Add "SUBSCRIPTIONS" tab between CASHFLOW and NETWORTH in top-bar.tsx
- **Rationale**: Subscriptions are a budget/spending concept, so placement near BUDGET/CASHFLOW makes sense. After NETWORTH would feel disconnected.
- **Alternatives considered**: After NETWORTH — rejected for logical grouping reasons

## Unresolved Items

None.
