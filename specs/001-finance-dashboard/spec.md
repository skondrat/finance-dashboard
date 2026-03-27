# Feature Specification: Finance Dashboard

**Feature Branch**: `001-finance-dashboard`
**Created**: 2026-03-25
**Status**: Draft
**Input**: User description: "Personal finance dashboard combining portfolio tracking with budgeting & cash-flow analytics, following the Editorial Ledger design system."

## Clarifications

### Session 2026-03-25

- Q: What cost basis calculation method should be used for P/L calculations? → A: Average cost — single weighted average price across all buys, adjusted on each new purchase.
- Q: When a budget transaction is tagged as an investment, does it link to portfolio transactions? → A: Independent — the budget "investment" tag is for cash-flow/rate tracking only; portfolio transactions are managed separately.
- Q: How should CSV column mapping work for bank statement imports? → A: Saved bank profiles — user creates a reusable mapping profile per bank and selects the profile on upload.
- Q: How should asset price data be refreshed? → A: On-demand — prices refresh when a user opens the Portfolio tab or clicks a refresh button; cached until next request.
- Q: Can a single account hold positions denominated in different currencies? → A: Yes — each transaction/position stores its own currency; a single account can hold assets in any currency.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Portfolio Overview & Net Worth Tracking (Priority: P1)

As a user, I want to see my total net worth, portfolio performance, and individual position details at a glance so I can understand my financial standing without navigating multiple tools.

**Why this priority**: Net worth and portfolio visibility is the foundational value proposition. Without it, no other feature (budgeting, cashflow) has context. This is the primary reason users open the app.

**Independent Test**: Can be fully tested by adding accounts, entering positions/transactions, and verifying that KPI indicators (net worth, total return, return %, invested capital) display correctly and update when positions change.

**Acceptance Scenarios**:

1. **Given** a user with one or more investment accounts, **When** they navigate to the Portfolio tab, **Then** they see a KPI strip showing net worth, total return, return %, saving rate, investment rate, and invested capital.
2. **Given** a user viewing the Portfolio tab, **When** they look at the positions list, **Then** each position shows asset name/ticker, buy-in price, current market value, quantity, P/L (absolute and percentage), and weight in the portfolio.
3. **Given** a user viewing the Portfolio tab, **When** they select a time range (1D, 1W, 1M, YTD, 1Y, MAX), **Then** the performance chart and position P/L values update to reflect that time window.
4. **Given** a user with positions in multiple accounts, **When** they view the aggregated portfolio, **Then** all positions across accounts are summed and displayed together.

---

### User Story 2 - Budget & Spend Tracking (Priority: P1)

As a user, I want to import bank statements, categorize transactions, set budgets per category, and see my spending patterns so I can control my monthly expenses and understand where my money goes.

**Why this priority**: Budgeting is a co-equal pillar of the dashboard alongside portfolio tracking. It provides the spending/saving data that feeds saving rate and investment rate calculations used across the app.

**Independent Test**: Can be fully tested by uploading a bank statement file, verifying parsed transactions appear, categorizing them, setting a monthly budget for a category, and confirming the spend-vs-budget progress bar and KPI strip update correctly.

**Acceptance Scenarios**:

1. **Given** a user on the Budget tab, **When** they upload a CSV/OFX/MT940 bank statement, **Then** the system parses it, deduplicates entries, and shows a preview table for the user to confirm or discard.
2. **Given** imported transactions, **When** the user views spend by category, **Then** each category row shows budget, spent, remaining, and percentage of total spend with a progress bar.
3. **Given** a user with auto-categorization rules (e.g., "LIDL" maps to Food & Groceries), **When** a new statement is imported, **Then** matching transactions are automatically assigned to the correct category.
4. **Given** a user viewing the Budget tab, **When** they switch time aggregation (Monthly, YTD, Yearly, Custom), **Then** all KPIs, charts, and tables recalculate for the selected period.

---

### User Story 3 - Currency Conversion (Priority: P1)

As a user, I want to toggle between EUR and USD so that all monetary values across the entire dashboard convert in real time, allowing me to view my finances in my preferred currency.

**Why this priority**: Currency conversion is a cross-cutting concern that affects every monetary display. It must work correctly for all other features to be usable by users who operate in multiple currencies.

**Independent Test**: Can be fully tested by toggling the currency selector in the top bar and verifying that all displayed monetary values (portfolio, budget, cashflow) convert using the appropriate exchange rate.

**Acceptance Scenarios**:

1. **Given** a user viewing any tab, **When** they switch currency from EUR to USD (or vice versa), **Then** all monetary values on the page update immediately without a page reload.
2. **Given** amounts stored in their original currency, **When** displayed in the alternate currency, **Then** the conversion uses the exchange rate for the relevant date (latest rate for portfolio summaries, transaction-date rate for historical items).

---

### User Story 4 - Transaction & Account Management (Priority: P2)

As a user, I want to manually add investment transactions (buy/sell) and manage multiple accounts (brokerage, crypto, bank) so I can maintain an accurate record of my portfolio even for brokerages I don't import from.

**Why this priority**: Manual entry is the fallback for data that cannot be imported. It ensures complete portfolio coverage regardless of data source.

**Independent Test**: Can be fully tested by creating an account, adding a buy transaction for a specific asset, and confirming the position appears in the portfolio with correct cost basis and market value.

**Acceptance Scenarios**:

1. **Given** a user on the Portfolio tab, **When** they click "+ Add account", **Then** a modal appears where they can enter account name, type (brokerage, crypto exchange, bank), and optional notes.
2. **Given** a user on the Transactions view, **When** they click "+ Add transaction", **Then** they can enter asset, quantity, price, date, and transaction type (buy/sell), and the position list updates after saving.
3. **Given** a user with multiple accounts, **When** they filter positions by a specific account, **Then** only positions belonging to that account are displayed.

---

### User Story 5 - Cashflow Visualization (Priority: P2)

As a user, I want to see a Sankey diagram of last month's cash flow showing how my income flows into spending, saving, and investments so I can visualize the big picture of my money movement.

**Why this priority**: The cashflow Sankey provides a unique high-level view that ties together income, spending, and investment data. It depends on budget and portfolio data being in place first.

**Independent Test**: Can be fully tested by having at least one month of categorized budget transactions and income entries, navigating to the Cashflow tab, and verifying the Sankey diagram renders with correct flow values from income sources to spending/saving/investment categories.

**Acceptance Scenarios**:

1. **Given** a user with categorized transactions and income for the previous month, **When** they navigate to the Cashflow tab, **Then** a Sankey diagram displays showing income flowing into spending categories, savings, and investments.
2. **Given** the Sankey diagram is displayed, **When** the user hovers over a flow, **Then** a tooltip shows the exact amount and percentage of total income.

---

### User Story 6 - Budget Analytics & Charts (Priority: P2)

As a user, I want to see charts showing income vs. spend over time, savings trends, investment rate trends, and per-category spending trends so I can identify patterns and make informed financial decisions.

**Why this priority**: Analytics charts turn raw data into actionable insights. They require accumulated transaction data to be meaningful.

**Independent Test**: Can be fully tested by having multiple months of categorized transactions, navigating to the Budget tab, and verifying that the Income vs. Spend bar chart, Savings Over Time area chart, Investment Rate Trend line chart, and Category Spend Distribution pie chart render with correct data.

**Acceptance Scenarios**:

1. **Given** a user with at least 3 months of budget data, **When** they view the Budget tab charts, **Then** they see grouped bar charts comparing monthly income vs. spend, an area chart of savings over time, and a line chart of investment rate trends.
2. **Given** a user viewing the category table, **When** they look at category sparklines, **Then** each category shows a 6-month mini trend line of spending in that category.

---

### User Story 7 - Portfolio Allocation & Performance Analytics (Priority: P2)

As a user, I want to see how my portfolio is allocated (by type, position, region, sector, industry) and view detailed performance breakdowns (price gains, dividends, realized losses, costs, IRR, TWR) so I can evaluate and optimize my investment strategy.

**Why this priority**: Deep analytics differentiate this from a simple portfolio tracker and provide advanced users with the data they need for investment decisions.

**Independent Test**: Can be fully tested by having a diversified portfolio with multiple asset types, navigating to the right-rail sidebar, and verifying the allocation donut chart segments and performance breakdown figures are accurate.

**Acceptance Scenarios**:

1. **Given** a user with multiple positions, **When** they view the allocation donut chart and switch between sub-tabs (Type, Positions, Regions, Sectors, Industries), **Then** the chart segments update to reflect that grouping with the total net worth displayed in the center.
2. **Given** a user viewing performance breakdown, **When** they look at the sidebar, **Then** they see capital, price gain, dividends, realized losses, transaction costs, and total return values with correct positive/negative coloring.
3. **Given** a user with transaction history, **When** they view internal rates, **Then** IRR and TWR are calculated and displayed accurately.

---

### User Story 8 - Theme Toggle & Visual Design (Priority: P3)

As a user, I want to switch between dark and light themes so I can use the dashboard comfortably in different lighting conditions, with the entire UI following the Editorial Ledger design system.

**Why this priority**: Theme support is a quality-of-life enhancement. The core design system (light mode) must be implemented first; dark mode is an incremental addition.

**Independent Test**: Can be fully tested by toggling the theme switch in the top bar and verifying all surfaces, text colors, chart elements, and interactive components update to the alternate theme consistently.

**Acceptance Scenarios**:

1. **Given** a user on any tab, **When** they toggle the theme from light to dark (or vice versa), **Then** all surfaces, typography, charts, and interactive elements update to reflect the selected theme without layout shifts.
2. **Given** the Editorial Ledger design system, **When** the dashboard renders in either theme, **Then** it uses card-based layout with tonal stacking (no borders, no drop-shadows on cards), Geist Mono for numbers, Space Grotesk for headers, and Inter for body text.

---

### User Story 9 - User Authentication (Priority: P3)

As a user, I want to register, log in, and have my data secured behind authentication so that my financial information is private and only accessible to me.

**Why this priority**: Authentication is essential for production use but can be deferred during early development where a single-user setup suffices.

**Independent Test**: Can be fully tested by registering a new account, logging in, verifying access to dashboard data, logging out, and confirming that data is not accessible without authentication.

**Acceptance Scenarios**:

1. **Given** a new user, **When** they register with credentials, **Then** an account is created and they are logged in with access to an empty dashboard.
2. **Given** two different users, **When** each logs in, **Then** they see only their own accounts, positions, transactions, and budget data (row-level data isolation).
3. **Given** a logged-in user, **When** their session expires, **Then** they are prompted to re-authenticate and can resume without data loss.

---

### Edge Cases

- What happens when a user uploads a duplicate bank statement? The system deduplicates by date + amount + reference and skips already-imported rows, informing the user of the count.
- How does the system handle an exchange rate that is unavailable for a given date? It falls back to the most recent available rate prior to that date.
- What happens when a user sets no budget for a category? The category still tracks spending but shows no budget bar or "remaining" value.
- How does the system handle a position with zero quantity (fully sold)? It remains visible in the transaction history but is excluded from the active positions list unless a "show closed positions" toggle is enabled.
- What happens when income is zero for a month? Saving rate and investment rate display as "N/A" rather than dividing by zero.
- What happens when statement parsing fails (malformed file)? The user sees a clear error message identifying the problem and can retry with a corrected file.
- How does the portfolio chart handle days with no market data? It interpolates between the nearest available data points and indicates non-trading days visually.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a top navigation bar with Portfolio, Budget, and Cashflow tabs, a currency toggle (EUR/USD), a theme toggle (dark/light), and a user avatar.
- **FR-002**: System MUST convert and display all monetary values in the user's selected currency using date-appropriate exchange rates.
- **FR-003**: System MUST allow users to create, view, and manage multiple financial accounts (brokerage, crypto exchange, bank) each with a name, type, and optional notes.
- **FR-004**: System MUST allow users to add, edit, and delete investment transactions (buy/sell) with fields for asset, quantity, price, date, and associated account.
- **FR-005**: System MUST calculate and display portfolio KPIs: net worth, total return (absolute), return percentage (TWR), saving rate, investment rate, and invested capital.
- **FR-006**: System MUST render a portfolio performance chart with selectable time ranges (1D, 1W, 1M, YTD, 1Y, MAX).
- **FR-026**: System MUST fetch and cache asset prices on-demand (when the user opens the Portfolio tab or clicks a refresh button) and store historical daily prices to support the performance chart.
- **FR-007**: System MUST display a sortable positions list showing asset name/ticker, buy-in price, current position value, quantity, P/L (absolute and percentage), and portfolio weight.
- **FR-008**: System MUST display a chronological transaction list grouped by month, with search/filter by asset, and a button to add new transactions.
- **FR-009**: System MUST render an allocation chart with groupings for Type, Positions, Regions, Sectors, and Industries.
- **FR-010**: System MUST calculate and display performance breakdown including capital, price gain, dividends, realized losses, transaction costs, and total return.
- **FR-011**: System MUST calculate and display Internal Rate of Return (IRR) and Time-Weighted Rate of Return (TWR).
- **FR-012**: System MUST accept bank statement uploads in CSV, OFX, and MT940 formats via drag-and-drop. For CSV imports, the system MUST support saved bank profiles (reusable column mapping configurations) that users create once per bank and select on subsequent uploads.
- **FR-013**: System MUST parse uploaded statements, deduplicate entries (by date + amount + reference), and present a preview for user confirmation.
- **FR-014**: System MUST provide default transaction categories (Housing, Food & Groceries, Transport, Entertainment, Health, Shopping, Subscriptions, Utilities, Investments, Income, Transfers, Other) and allow users to create, rename, recolor, merge, and archive categories.
- **FR-015**: System MUST support auto-categorization rules (keyword-to-category mappings) applied on import and retroactively.
- **FR-016**: System MUST allow users to set optional monthly budgets per category and display spend-vs-budget progress.
- **FR-017**: System MUST support manual income entry with multiple income sources (salary, dividends, etc.) and auto-detection from statement rows categorized as "Income".
- **FR-018**: System MUST display budget KPIs: monthly income, monthly spend, monthly savings, saving rate, investment rate, and budget remaining.
- **FR-019**: System MUST support time aggregation for budget data: Monthly (with month selector), YTD, Yearly, and Custom date range.
- **FR-020**: System MUST render budget analytics charts: Income vs. Spend (grouped bar), Savings Over Time (area), Investment Rate Trend (line), Category Trends (sparklines), and Category Spend Distribution (pie/donut).
- **FR-021**: System MUST render a Sankey diagram on the Cashflow tab showing last month's income flowing into spending, saving, and investment categories.
- **FR-022**: System MUST support user registration, login, and logout with data isolation between users.
- **FR-023**: System MUST persist user theme preference (dark/light) and apply it consistently across all views.
- **FR-024**: System MUST store all amounts in their original currency and perform display-time conversion only.
- **FR-025**: System MUST follow the Editorial Ledger design system defined in [`DESIGN.md`](../../DESIGN.md): card-based layout with tonal stacking, no borders or drop-shadows on cards, specified typography (Geist Mono for numbers, Space Grotesk for headers, Inter for body), and monochromatic color palette with green/red accents for positive/negative values. All UI implementation MUST reference `DESIGN.md` for surfaces, colors, elevation, typography, and component styling rules.

### UI Layout & Styling Reference

All UI implementation MUST follow the detailed layout specifications in [`SPEC.md`](../../SPEC.md) and [`DESIGN.md`](../../DESIGN.md):

- **Global Shell & Navigation** — SPEC.md section 4: sticky top bar wireframe, tab navigation styling, currency toggle, avatar
- **Portfolio Tab Layout** — SPEC.md section 5: KPI strip (5.1), performance area chart with gradient fill (5.2), positions list with row styling (5.3), transactions view (5.4), right-rail 4-column metadata sidebar with allocation donut + performance breakdown + IRR/TWR (5.5), account management modal (5.6)
- **Budget Tab Layout** — SPEC.md section 6: 8+4 column grid wireframe (6.1), budget KPI strip (6.2), statement import upload zone + preview modal (6.3), category settings sub-page via gear icon (6.4), income entry (6.5), spend-by-category table with progress bars + expandable rows (6.6), time aggregation segmented control with averages/totals (6.7), analytics charts with specific chart types and styling (6.8)
- **Cashflow Tab Layout** — SPEC.md section 7: KPI strip (7.2), full-width Sankey diagram with monochromatic flows and glassmorphism tooltips (7.3), 6+6 column bottom row with income source breakdown and top spending categories (7.4)
- **Design System Rules** — SPEC.md section 3 + DESIGN.md: surface hierarchy, typography sizing per element, color signals, elevation, asymmetric 8+4 grid, spacing scale, component styling
- **Tailwind Design Tokens** — SPEC.md section 11: complete token preset for colors, fonts, radii, shadows

### Key Entities

- **User**: Represents a registered individual. Owns all accounts, transactions, budget data, and preferences. Key attributes: credentials, display name, preferred currency, theme preference.
- **Account**: A financial account (brokerage, crypto exchange, or bank). Belongs to a user. Has a name, type, and optional notes. Contains positions and transactions.
- **Position**: A holding of a specific asset within an account. Derived from aggregating buy/sell transactions using the **average cost method** (weighted average price across all buys, recalculated on each purchase; sells reduce quantity but do not change average cost). Key attributes: asset reference, quantity, average cost basis, current market value.
- **Asset**: A tradeable financial instrument (stock, ETF, crypto, bond). Key attributes: name, ticker symbol, asset type, region, sector, industry.
- **Investment Transaction**: A buy or sell event for an asset. Key attributes: date, asset, quantity, price per unit, **transaction currency** (each transaction stores its own currency; a single account may hold multi-currency positions), transaction type, fees, associated account.
- **Budget Transaction**: A credit or debit from a bank statement. Key attributes: date, description, amount, reference, category, whether it is an investment (cash-flow tag only — no link to portfolio transactions), source file.
- **Category**: A spending/income classification. Key attributes: name, color, optional monthly budget, auto-categorization rules, archive status.
- **Auto-Categorization Rule**: A keyword-to-category mapping for automatic transaction classification. Key attributes: keyword pattern, target category.
- **Income Source**: A labeled monthly income entry. Key attributes: label (salary, dividends, etc.), amount, month/year.
- **Exchange Rate**: A currency pair rate for a specific date. Key attributes: base currency, target currency, rate, date.
- **Statement Import**: A record of an uploaded bank statement file. Key attributes: filename, upload date, row count, status (parsed, confirmed, discarded).
- **Bank Profile**: A reusable CSV column mapping configuration for a specific bank. Key attributes: profile name, column-to-field mappings (date, amount, description, reference), date format, delimiter, associated user.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view their complete net worth across all accounts within 3 seconds of opening the Portfolio tab.
- **SC-002**: Users can import a bank statement and see categorized transactions within 30 seconds of upload.
- **SC-003**: Currency conversion updates all visible monetary values within 1 second of toggling.
- **SC-004**: Users can add a new investment transaction in under 1 minute (open form, fill fields, save).
- **SC-005**: Budget charts and KPIs recalculate within 2 seconds when changing time aggregation period.
- **SC-006**: Auto-categorization correctly classifies at least 80% of transactions that match existing keyword rules.
- **SC-007**: The Cashflow Sankey diagram accurately reflects income, spending, saving, and investment totals that reconcile with Budget tab data to within rounding tolerance.
- **SC-008**: Users can complete initial onboarding (create account, add first position or import first statement) in under 5 minutes.
- **SC-009**: All financial calculations (TWR, IRR, saving rate, investment rate) produce results consistent with standard financial formulas when verified against known test data.
- **SC-010**: Dashboard renders correctly at 1280px+ viewport width with graceful usability at 1024px.

## Assumptions

- The application is desktop-first; mobile-optimized layouts are out of scope for v1.
- A single-user mode is acceptable during early development; multi-user authentication can be layered in later.
- Asset price data (current market prices) is fetched on-demand (when the user opens the Portfolio tab or clicks refresh) from a free public API and cached; real-time streaming prices are not required.
- Exchange rates are sourced from a free public API (e.g., ECB daily feed) and cached; sub-minute rate freshness is not required.
- PDF statement parsing is listed in the upload zone label but is out of scope for v1; supported formats are CSV, OFX, and MT940.
- The Sankey diagram on the Cashflow tab shows last month's data only; historical month selection for Cashflow is out of scope for v1.
- Region, sector, and industry metadata for assets will be sourced from a reference dataset or entered manually; automatic enrichment from a financial data provider is not required for v1.
- Data retention follows standard practices; users can delete their own data at any time.
- The application runs as a self-hosted tool; managed cloud hosting and SaaS features are out of scope.
