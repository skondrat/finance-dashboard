# Research: Cashflow Period Selector

## R1: How to aggregate income for yearly/YTD periods

**Decision**: Query `IncomeSource` rows for all months in the date range, not just a single month. Group by label and sum amounts.

**Rationale**: The `IncomeSource` model stores income per (user, year, month, label). For yearly, query months 1-12. For YTD in current year, query months 1 through last completed month. For YTD in past year, query months 1-12.

**Alternatives considered**: 
- A separate yearly income table — rejected, unnecessary schema change.
- Client-side aggregation (fetch 12 monthly responses) — rejected, too many API calls.

## R2: How to calculate the date range per period

**Decision**: Backend resolves date range based on `period` parameter:
- `monthly`: `start = date(year, month, 1)`, `end = date(year, month+1, 1)` (existing logic)
- `yearly`: `start = date(year, 1, 1)`, `end = date(year+1, 1, 1)`
- `ytd`: If year == current year: `start = date(year, 1, 1)`, `end = date(year, last_completed_month+1, 1)`. If past year: same as yearly.

**Rationale**: Keeps all date logic server-side. Frontend just sends `period`, `year`, and optionally `month`.

## R3: Frontend period selector approach

**Decision**: Reuse the segmented control style from `budget/time-aggregation.tsx` but without the "Custom" option. Create inline period controls in the cashflow page rather than extracting a new component (to keep it simple).

**Rationale**: The budget tab already has a validated design pattern. Three segments (Monthly, Yearly, YTD) with conditional month/year dropdowns. No need for the arrow-based navigator anymore — dropdowns give direct access to any month/year.

**Alternatives considered**:
- Keep arrow navigation + add period tabs — rejected, mixing navigation paradigms is confusing.
- Extract a shared `PeriodSelector` component — rejected per constitution ("keep it simple"), only two consumers.

## R4: Query key strategy for TanStack Query

**Decision**: Include `period` in the query key: `["cashflow", "sankey", currency, period, year, month]`. When period is "yearly" or "ytd", month is undefined so TanStack Query naturally caches per-period+year.

**Rationale**: Ensures correct cache invalidation when switching periods.
