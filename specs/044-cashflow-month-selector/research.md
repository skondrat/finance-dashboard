# Research: Cashflow Month Selector

## Decision 1: Month Selection UI Pattern

**Decision**: Use a simple left/right arrow navigator with month+year label (e.g., "March 2026"), not the Budget page's full TimeAggregation (which supports monthly/ytd/yearly/custom periods). Cashflow only needs monthly granularity.

**Rationale**: The Cashflow page is inherently monthly — the Sankey shows income sources flowing to expense categories for a single month. Multi-month aggregation would produce confusing overlapping flows. A simpler navigator is more appropriate and faster to use.

**Alternatives considered**:
- Reuse Budget's TimeAggregation component — rejected because cashflow doesn't need ytd/yearly/custom modes
- Month dropdown — rejected because arrow navigation is more fluid for sequential browsing

## Decision 2: State Management

**Decision**: Use React `useState` in the cashflow page component to hold `year` and `month`, pass them as props to child components and the query hook.

**Rationale**: Follows the established pattern from the Budget page. No need for Zustand store since the month selection is page-local state.

**Alternatives considered**:
- Zustand store — rejected as unnecessary; state doesn't need to persist across pages
- URL search params — rejected; not needed since cashflow is a single-page view

## Decision 3: Backend Parameter Approach

**Decision**: Add optional `year` and `month` query parameters to `GET /api/v1/cashflow/sankey`. Default to `_last_completed_month()` when not provided.

**Rationale**: Backward compatible — existing clients that don't pass year/month still get the same behavior. Minimal change to the existing endpoint.

**Alternatives considered**:
- New endpoint — rejected; unnecessary when existing endpoint can be parameterized
- Date range instead of year/month — rejected; cashflow is always exactly one calendar month

## Decision 4: Forward Navigation Limit

**Decision**: Compute the "last completed month" on the frontend (same logic as backend) to disable the forward arrow. The right arrow is disabled when viewing the last completed month.

**Rationale**: Avoids an extra API call to determine the max selectable month. The logic is trivial (current month - 1) and deterministic.

**Alternatives considered**:
- Backend endpoint to return available months — rejected; over-engineered for this use case
