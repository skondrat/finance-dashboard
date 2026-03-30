# Feature Specification: Fix Performance Chart

**Feature Branch**: `029-fix-performance-chart`
**Created**: 2026-03-30
**Status**: Draft
**Input**: User description: "The performance chart looks bad. Line color should be green. Dates only go back to 2025 but first transaction was in 2023. Should look like a smooth green line chart (reference image provided)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Smooth Green Line Chart with Full History (Priority: P1)

The performance chart currently has several visual issues: the line is dark/black (hard to see on dark background), the chart looks jagged with vertical bar-like artifacts instead of a smooth curve, and date labels overlap. The user wants a clean, smooth green line chart similar to professional portfolio trackers — with a green line on a dark background showing portfolio value over time.

Additionally, the chart only shows data from Apr 2025 onward, but the first transaction dates back to Jun 2023. The historical price seeding currently only fetches 1 year of data — it needs to go back to the first transaction date.

**Why this priority**: The chart is the most prominent visual element on the portfolio page. In its current state it's hard to read and doesn't tell the full story.

**Independent Test**: Navigate to /portfolio, select MAX on the performance chart. Verify: green smooth line, data starting from Jun 2023, clean non-overlapping date labels, no vertical bar artifacts.

**Acceptance Scenarios**:

1. **Given** a user with transactions dating back to Jun 2023, **When** they select MAX, **Then** the chart shows the full history from Jun 2023 to today as a smooth green line.
2. **Given** the chart is displayed, **When** the user looks at it, **Then** the line is green colored (matching the app's tertiary/positive color), not black or dark gray.
3. **Given** the chart spans multiple years, **When** date labels are rendered, **Then** they are spaced appropriately and do not overlap.
4. **Given** a shorter range like 1M is selected, **When** the chart renders, **Then** it still shows a smooth green line for that time period.

---

### Edge Cases

- What happens on weekends/holidays with no price data? The system must carry forward the last known price for each asset — not drop to zero. The chart should show a continuous line with no zero-dips on non-trading days.
- What happens when the date range has very few data points? Show the available points connected by the line.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The performance chart line MUST be green colored (consistent with the app's positive/gain color).
- **FR-002**: The chart MUST render as a smooth line (not vertical bars or jagged steps).
- **FR-003**: The "MAX" range MUST show data from the first transaction date (Jun 2023) to today.
- **FR-004**: Historical price data MUST be seeded from the first transaction date, not just the last 365 days.
- **FR-005**: Date labels on the X-axis MUST be spaced to avoid overlapping.
- **FR-006**: The Y-axis MUST start from 0 or a reasonable minimum, not cutting off the bottom of the chart.
- **FR-007**: On days without price data (weekends, holidays), the system MUST carry forward the last known price for each asset rather than treating missing prices as zero. The chart line must be continuous with no zero-dips.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The chart line is visibly green on the dark background.
- **SC-002**: The MAX range shows data spanning from 2023 to 2026 (the full portfolio lifetime).
- **SC-003**: No date labels overlap on the X-axis.
- **SC-004**: The line is smooth with no vertical bar-like artifacts.

## Assumptions

- The chart library already supports line color and curve type configuration — this is a styling change.
- Historical price data for dates before Apr 2025 needs to be fetched from providers (yfinance supports multi-year history).
- CoinGecko free API supports historical data up to 365 days — for crypto, older data may not be available (acceptable limitation).
- The existing seed_historical_prices function needs its date range extended from 365 days to the first transaction date.
