# Research: Budget Spend Treemap

## Decision 1: Treemap Library

**Decision**: Use Recharts Treemap component (already installed as recharts v3.8.1)
**Rationale**: Recharts is already the charting library used across all budget charts. It provides a `Treemap` component with `content` prop for custom rectangle rendering, `onClick` for click-to-filter, and works with `ResponsiveContainer` for responsive sizing.
**Alternatives considered**:
- d3-hierarchy + custom SVG: More control but much more code, inconsistent with existing chart patterns
- react-treemap: Additional dependency, not needed when Recharts supports it
- visx/treemap: Additional dependency from Airbnb, heavier

## Decision 2: Data Fetching Strategy

**Decision**: Reuse existing `useSpendByCategory` hook, called twice (current month + comparison month)
**Rationale**: The `SpendByCategoryItem` response already contains `spent`, `budget` (monthly_budget), `category.name`, `category.color`, and `pct_of_total`. No new backend endpoint is needed. For "Budget" comparison mode, only one call is needed since `budget` is included in each item.
**Alternatives considered**:
- New dedicated backend endpoint: Unnecessary complexity since existing data is sufficient
- Single endpoint returning both months: Would require backend changes for marginal benefit

## Decision 3: Color Gradient Implementation

**Decision**: Compute HSL-based color interpolation in the frontend based on percentage change
**Rationale**: Dynamic scaling requires knowing the full range of percentage changes across all categories, then mapping each category's change to a position on the green-to-red spectrum. HSL interpolation (hue from 120° green to 0° red) provides smooth, visually appealing gradients. Gray (#9CA3AF) for categories with no baseline.
**Alternatives considered**:
- Fixed color thresholds (buckets): Less visual information, doesn't adapt to data range
- CSS gradient/opacity: Less precise control over the color mapping

## Decision 4: Comparison Selector UI

**Decision**: Compact dropdown selector above the treemap with month options + "Budget" option
**Rationale**: Fits within the narrow 4-column right sidebar. Selector shows "vs [Month Year]" or "vs Budget" label. Defaults to previous month. Month list uses same hardcoded MONTHS/YEARS pattern as existing MonthComparison component.
**Alternatives considered**:
- Toggle buttons: Takes too much horizontal space in 4-col layout
- Separate month/year dropdowns: Too many controls for the narrow column

## Decision 5: Click-to-Filter Integration

**Decision**: Use the existing `onCategoryClick` prop pattern from SpendingCharts
**Rationale**: The SpendingCharts wrapper already receives and passes down `onCategoryClick` to child charts (e.g., CategoryDistributionChart). The treemap will use Recharts `onClick` handler to extract the category ID and call this prop, maintaining the same UX as clicking a pie chart slice.
**Alternatives considered**:
- Zustand store for category filter: Overkill — existing prop-based approach works fine
