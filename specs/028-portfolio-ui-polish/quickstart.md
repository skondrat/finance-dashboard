# Quickstart: Portfolio UI Polish

**Feature**: 028-portfolio-ui-polish

## Verification Steps

### US1: Performance Chart
1. Navigate to `http://localhost:3000/portfolio`
2. Click "Refresh Prices" (or the icon) — this should seed historical prices
3. Select "MAX" on the performance chart
4. Verify the chart shows multiple data points spanning the portfolio's lifetime

### US2: Aggregated Transactions
1. On /portfolio, ensure "Aggregated" tab is selected in Positions
2. Verify a transactions list appears below the positions table
3. Verify it shows transactions from both Interactive Brokers and Kraken
4. Switch to a specific account — verify only that account's transactions show

### US3: Icon Refresh Button
1. Look at the top-right area near KPIs
2. Verify there's a small icon button (not a text button)
3. Click it — verify it spins during refresh
4. Verify portfolio values update after refresh completes
