# SPEC.md — Finance Dashboard

## 1. Product Overview

A personal finance dashboard that combines **portfolio tracking** (inspired by getquin) with **budgeting & cash-flow analytics**. The UI follows the "Editorial Ledger" design system defined in `DESIGN.md`—monochromatic, borderless, typographically driven, with Geist Mono for all numerical data.

### Core Tabs

| Tab | Purpose |
|---|---|
| **Portfolio** | Net worth, positions, transactions, allocation, performance |
| **Budget** | Statement imports, category management, income entry, spend analytics |
| **Cashflow** | SankeyMATIC showing last month cash flow - from input into spending, saving and investments. 

These are present in Top NavBar.

A **currency toggle (EUR / USD)** is always visible in the top bar. All monetary values across both tabs convert in real time when the user switches currency.
Also a theme toggle (DARK / LIGHT).

---

## 2. Technology Stack

### Backend — Python

| Layer | Technology |
|---|---|
| Framework | **FastAPI** |
| ORM | **SQLAlchemy 2.0** (sync, aiosqlite not needed for SQLite) |
| Database | **SQLite** (single file, zero-config) |
| Migrations | **Alembic** |
| Background work | **FastAPI BackgroundTasks** (for statement parsing, price fetches) |
| Auth | **JWT** (access + refresh tokens, httpOnly cookies) |
| FX rates | Open API (e.g. ECB daily feed or exchangerate.host), cached in SQLite |
| Statement parsing | Custom parsers per bank format (CSV/OFX/MT940); extensible via a parser registry |
| Testing | **pytest** + **httpx** (async client) |
| Containerisation | Docker Compose (api + frontend) or run directly |

### Frontend — TypeScript

| Layer | Technology |
|---|---|
| Framework | **Next.js 15** (App Router) |
| Language | **TypeScript 5** |
| Styling | **Tailwind CSS 4** with design-token preset from `DESIGN.md` |
| UI primitives | **shadcn/ui** — unstyled accessible components (Dialog, Tabs, Dropdown, etc.) restyled to match `DESIGN.md` |
| Charts | **Recharts** (lightweight, composable, React-native) |
| State | **TanStack Query** (server state) + **Zustand** (client state: currency, filters) |
| Forms | **React Hook Form** + **Zod** validation |
| File upload | **react-dropzone** |
| Fonts | **Geist Mono**, **Space Grotesk**, **Inter** (self-hosted via `next/font`) |
| Testing | **Vitest** + **React Testing Library** |

---

## 3. Design System Application

All visual decisions defer to `DESIGN.md`. 
Card-based layout — very typical of modern portfolio trackers and wealth management apps (Robinhood, Wealthfront, etc.). 
The background with slightly elevated card surfaces creates depth through subtle contrast rather than borders.
Key enforcement rules:

### Surfaces (no borders)
- Page background: `surface` (#faf9f9)
- Section panels: `surface-container-low` (#f4f3f3)
- Cards / interactive rows: `surface-container-lowest` (#ffffff)
- Overlays / tooltips: `surface-bright`, 80% opacity, `backdrop-blur: 20px`

### Typography
- All currency values, percentages, rates → **Geist Mono** `label-md`
- Section headers → **Space Grotesk** `headline-sm`
- Metadata labels → **Geist Mono** `label-sm`, `uppercase`, `tracking-[0.1em]`
- Body / descriptions → **Inter** `body-md`
- Body text color: `on-surface-variant` (#4c4546), never #000000

### Colour Signals
- Positive values (gains, surplus): `on-tertiary-container` (#009668) on `tertiary-fixed` (#6ffbbe) with `+` prefix
- Negative values (losses, overspend): `on-error-container` (#93000a) on `error-container` (#ffdad6) with `-` prefix

### Elevation
- No drop-shadows on cards—use tonal stacking only
- Floating tooltips: `box-shadow: 0 8px 40px -4px rgba(26,28,28,0.06)`

### Layout
- Asymmetric grid: 8 + 4 column split (main content + metadata rail)
- Spacing scale: 8 / 12 / 16 px between dense data sections
- No icon clutter—use monospaced text labels

### Components
- Buttons: primary (#000 fill), secondary (#e8e8e8 fill, no border), tertiary (Geist Mono underline-on-hover)
- Inputs: `surface-container-highest` (#e2e2e2) background, no border; focus → `surface-container-lowest` + ghost border at 20% opacity
- Lists: no divider lines; 8px vertical gap + `surface-container-low` hover
- CTAs / overlays: subtle 135° gradient `#000000 → #1b1b1b`

---

## 4. Global Shell & Navigation

```
┌──────────────────────────────────────────────────────────────┐
│  LOGO          [Portfolio]  [Budget]       [EUR ▾]  [Avatar] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                      PAGE CONTENT                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

- **Top bar** — sticky, `surface` background, no bottom border (separation via tonal shift with content area below)
- **Tab navigation** — text-only (`Geist Mono`, `label-md`, uppercase, tracked). Active tab: `on-surface` (#1a1c1c); inactive: `on-surface-variant` (#4c4546). Active indicator: 2px bottom accent line using `primary` (#000)
- **Currency toggle** — segmented control: `EUR` | `USD`. Active segment: `primary` (#000) background with `on-primary` (#fff) text; inactive segment: `surface-container-high` (#e8e8e8) background with `on-surface-variant` text. Radius: `md`. Stored in Zustand; propagated to all API calls via query param `?currency=EUR`
- **User avatar** — initials in a circle, opens settings flyout

---

## 5. Portfolio Tab

### 5.1 Key Indicators Strip

A full-width row of large KPI cards sitting on `surface-container-low`, directly below the top bar. Each card is `surface-container-lowest`.

| Indicator | Source | Format |
|---|---|---|
| **NET WORTH** | Sum of all position market values | `$371,480.92` |
| **TOTAL RETURN** | Absolute P&L | `+$58,470.81` (green) or `-$…` (red) |
| **RETURN %** | Time-weighted rate of return | `+18.99%` |
| **SAVING RATE** | (monthly_savings / monthly_income) × 100 | `32%` |
| **INVESTMENT RATE** | (monthly_investments / monthly_income) × 100 | `48%` |
| **INVESTED CAPITAL** | Total cost basis | `$312,985.07` |

- Label: `Geist Mono`, `label-sm`, uppercase, tracked
- Value: `Space Grotesk`, `headline-lg` or `display-sm` for the primary NET WORTH, `headline-md` for the rest
- Positive/negative colouring per DESIGN.md rules

### 5.2 Portfolio Performance Chart

- **Chart type:** area chart (filled line) with gradient fill from `primary` (#000) at 8% opacity → transparent
- **Time range selector:** pill group — `1D` `1W` `1M` `YTD` `1Y` `MAX` (Geist Mono, `label-sm`)
- **Tooltip:** glassmorphism overlay showing date + value in Geist Mono
- Sits on `surface-container-low` panel

### 5.3 Positions List

Below the chart. Full-width table on `surface-container-low`.

| Column | Content |
|---|---|
| **Asset** | Name + ticker (Geist Mono ticker, Inter name) |
| **Buy In** | Average cost per unit |
| **Position** | Current market value + quantity |
| **P/L** | Absolute + percentage, coloured |
| **Weight** | % of total portfolio |

- Rows: `surface-container-lowest` cards with 8px gap, hover → `surface-container-low`
- Sortable columns (click header toggles asc/desc)
- Sub-tabs above list: `Aggregated` | per-account filters

- **Time range selector:** pill group — `1D` `1W` `1M` `YTD` `1Y` `MAX` (Geist Mono, `label-sm`)

### 5.4 Transactions View

Toggled via a sub-tab or scroll section below Positions.

- Search bar to enter asset type or name for filter
- Chronological list grouped by month (`Space Grotesk` month header)
- Each row: date | asset icon/initial | name + details ("Bought x24 at $104.55") | amount
- **"+ Add transaction"** primary button

### 5.5 Right Rail — Metadata Sidebar (4 columns)

#### Allocation Donut Chart
- Sub-tabs: `Type` | `Positions` | `Regions` | `Sectors` | `Industries`
- Center label: total net worth in Geist Mono
- Segments in monochromatic shades (grays + the single green accent for the largest holding)

#### Performance Breakdown
- Performance bar chart (yearly bars)
- **Capital:** Invested capital value
- **Price gain:** absolute + %
- **Dividends:** absolute + %
- **Realized losses:** absolute + %
- **Transaction costs:** costs, taxes, ongoing costs (each on its own row)
- **Total return:** bold, highlighted

#### Internal Rates
- Internal Rate of Return (IRR)
- True Time-Weighted Rate of Return (TWR)

### 5.6 Account Management

- **"+ Add account"** button opens a modal to create a brokerage/crypto wallet/bank account
- Each account has a name, type (brokerage, crypto exchange, bank), and optional notes
- Positions and transactions are scoped to accounts; aggregated view sums all

---

## 6. Budget Tab

### 6.1 Layout Overview

```
┌────────────────────────────────────────────┬──────────────────┐
│          BUDGET KPI STRIP (full width)     │                  │
├────────────────────────────────────────────┤   INCOME vs      │
│                                            │   SPEND CHART    │
│        CATEGORY BREAKDONW                  │ (bar chart)      │
│        (area / bar chart)                  │                  │
│                                            │                  │
├────────────────────────────────────────────┤                  │
│                                            │                  │
│        TRANSACTION LIST (categorised)      │                  │
│                                            │                  │
└────────────────────────────────────────────┴──────────────────┘
```

### 6.2 Budget KPI Strip

Same visual treatment as Portfolio KPI strip.

| Indicator | Definition |
|---|---|
| **MONTHLY INCOME** | Manually entered or derived from categorised statement credits |
| **MONTHLY SPEND** | Sum of all categorised debits for the selected month |
| **MONTHLY SAVINGS** | Income − Spend |
| **SAVING RATE** | (Savings / Income) × 100% |
| **INVESTMENT RATE** | (Investments / Income) × 100% — investments are either auto-tagged from statements or manually flagged |
| **BUDGET REMAINING** | Total budget − Spend (if per-category budgets are set) |

### 6.3 Statement Import 
- A button that will open statement import pipeline flow:

- **Upload zone:** drag-and-drop area (`react-dropzone`) styled as a dashed-outline region on `surface-container-highest`, with Geist Mono label "DROP CSV / OFX / MT940 / PDF"
- Supported formats: CSV (with configurable column mapping), OFX, MT940
- On upload → backend FastAPI BackgroundTask parses, deduplicates (by date + amount + reference), and returns preview
- **Preview modal:** table of parsed rows — user confirms or discards; uncategorised rows are flagged
- **Import history:** list of past imports with date, file name, row count, status

### 6.4 Category Management
- Default categories: Housing, Food & Groceries, Transport, Entertainment, Health, Shopping, Subscriptions, Utilities, Investments, Income, Transfers, Other
- User can **create**, **rename**, **recolor** (from the monochromatic palette + green/red accents), **merge**, and **archive** categories
- Each category has an optional **monthly budget** (numeric input)
- **Auto-categorisation rules:** user defines keyword → category mappings (e.g., "LIDL" → Food & Groceries). Stored as rules; applied on import and re-applicable retroactively
- UI: a settings sub-page accessible from a gear icon on the Budget tab to manage categories

### 6.5 Income Entry

- Manual monthly income field at the top of Budget settings
- Alternatively, income can be auto-detected from statement rows categorised as "Income"
- Supports multiple income sources (salary, debts, dividends) each with a label and amount
- Income history stored per month for accurate historical saving/investment rate calculations

### 6.6 Spend by Category

#### Table View
- Rows: one per category
- Columns: Category name | Budget | Spent | Remaining | % of total spend
- Progress bar inside each row showing spent vs budget (fill uses `on-tertiary-container` green if under budget, `on-error-container` red if over)
- Expandable rows reveal individual transactions within that category

#### Charts
- **Donut chart:** spend distribution by category for selected period
- **Stacked bar chart:** monthly spend by category over time (up to 12 months)

### 6.7 Time Aggregation

A segmented control at the top of Budget content area:

| Period | Behaviour |
|---|---|
| **Monthly** | Single month selector (← Feb 2026 →). Shows that month's data |
| **YTD** | Jan 1 → today. Averages and totals |
| **Yearly** | Full calendar year selector. Averages and totals |
| **Custom** | Date range picker |

All KPIs, charts, and tables recalculate for the selected period. "Monthly" values in YTD/Yearly views show **averages** with a separate **total** line.

### 6.8 Budget Analytics Charts

Displayed in the main content column, toggleable:

| Chart | Type | Data |
|---|---|---|
| **Income vs Spend** | Grouped bar chart (monthly bars) | Green bars = income, dark bars = spend |
| **Savings Over Time** | Area chart | Monthly savings amount (income − spend) |
| **Investment Rate Trend** | Line chart | Monthly investment rate % over time |
| **Category Trends** | Sparklines per category | 6-month mini trend lines in the category table |
| **Category Spend Distribution** | Pie chart | Spend share per category for the selected period; monochromatic palette with green/red accents for positive/negative categories |

All charts follow DESIGN.md: no heavy gridlines, Geist Mono axis labels, glassmorphism tooltips, monochromatic palette with green/red accents only for positive/negative signals.

---

## 7. Cashflow Tab

### 7.1 Layout Overview

```
┌──────────────────────────────────────────────────────────────┐
│          CASHFLOW KPI STRIP (full width)                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                    SANKEY DIAGRAM                             │
│            (income → spending / saving / investments)        │
│                                                              │
├─────────────────────────────┬────────────────────────────────┤
│  INCOME SOURCES             │  TOP CATEGORIES                │
│  breakdown list             │  breakdown list                │
└─────────────────────────────┴────────────────────────────────┘
```

### 7.2 Cashflow KPI Strip

Same visual treatment as Portfolio and Budget KPI strips.

| Indicator | Definition |
|---|---|
| **TOTAL INCOME** | Sum of all income sources for last month |
| **TOTAL SPEND** | Sum of all categorised debits for last month |
| **TOTAL SAVINGS** | Income − Spend |
| **TOTAL INVESTMENTS** | Sum of budget transactions where `is_investment = true` for last month |

### 7.3 Sankey Diagram

- **Full-width** section on `surface-container-low` panel
- **Left nodes**: Income sources (salary, dividends, etc.) — labeled in `Geist Mono`, `label-md`
- **Right nodes**: Spending categories + Savings + Investments — labeled in `Geist Mono`, `label-md`
- **Flows**: Monochromatic shades (grays); the Savings flow uses `on-tertiary-container` green accent
- **Tooltip**: Glassmorphism overlay showing flow label, amount, and percentage of total income in `Geist Mono`
- **Data**: Last completed calendar month only (per Assumptions)

### 7.4 Bottom Breakdown Row

6 + 6 column split on `surface-container-low`:

**Left — Income Sources**:
- List of income sources with label and amount
- Each row: `surface-container-lowest` card with 8px gap
- Total income at the bottom, bold

**Right — Top Spending Categories**:
- Top categories by spend amount for last month
- Each row: category color dot + name + amount + percentage of total spend
- Rows: `surface-container-lowest` cards with 8px gap
- Shows top 8 categories; remaining grouped as "Other"

---

## 8. Data Model

TBD

---

## 8. API Design (REST)

Base: `/api/v1`

TBD

## 9. Key Calculations

### Saving Rate
```
saving_rate = (monthly_income - monthly_spend) / monthly_income × 100
```

### Investment Rate
```
investment_rate = monthly_investments / monthly_income × 100
```
Where `monthly_investments` = sum of `BudgetTransaction` rows where `is_investment = true` for the month, or sum of `InvestmentTransaction` buys for the month.

### Time-Weighted Rate of Return (TWR)
```
TWR = ∏(1 + HPR_i) - 1
```
Where each sub-period return `HPR_i` is calculated between each external cash flow.

### Internal Rate of Return (IRR)
Solved numerically (Newton-Raphson) on the cash flow series of all investment transactions.

### Currency Conversion
All amounts are stored in their original currency. Display conversion uses `ExchangeRate` for the relevant date. Portfolio summary uses latest available rate.

---

## 10. Project Structure

```
finance-dashboard/
├── backend/
├── frontend/
├── docker-compose.yml               # api + frontend
├── DESIGN.md
├── SPEC.md
└── README.md
```

---

## 11. Tailwind Design Token Preset

```ts
// tailwind.config.ts (excerpt)
// Light theme colors are the defaults; dark theme applied via Tailwind `dark:` variant
{
  theme: {
    extend: {
      colors: {
        // Light theme (default)
        surface:                    '#faf9f9',
        'surface-container-low':    '#f4f3f3',
        'surface-container-lowest': '#ffffff',
        'surface-container-high':   '#e8e8e8',
        'surface-container-highest':'#e2e2e2',
        'surface-bright':           '#faf9f9',
        primary:                    '#000000',
        'primary-container':        '#1b1b1b',
        'on-primary':               '#ffffff',
        'on-surface':               '#1a1c1c',
        'on-surface-variant':       '#4c4546',
        'outline-variant':          '#cfc4c5',
        'tertiary-fixed':           '#6ffbbe',
        'on-tertiary-container':    '#009668',
        'error-container':          '#ffdad6',
        'on-error-container':       '#93000a',
      },
      // Dark theme overrides — use CSS custom properties toggled by .dark class
      // See DESIGN.md "Complete Dark Theme Palette" for all dark hex values
      // dark:surface=#121212, dark:surface-container-low=#1a1a1a,
      // dark:surface-container-lowest=#0e0e0e, dark:surface-container-high=#2a2a2a,
      // dark:surface-container-highest=#333333, dark:surface-bright=#1e1e1e,
      // dark:primary=#ffffff, dark:primary-container=#e8e8e8,
      // dark:on-primary=#000000, dark:on-surface=#e6e1e1,
      // dark:on-surface-variant=#a09a9b, dark:outline-variant=#3d3738,
      // dark:tertiary-fixed=#1a4d3a, dark:on-tertiary-container=#4ddfaa,
      // dark:error-container=#4d1f1a, dark:on-error-container=#ff6b6b
      fontFamily: {
        mono:    ['Geist Mono', 'monospace'],
        display: ['Space Grotesk', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
      borderRadius: {
        md: '0.375rem',
        xl: '0.75rem',
      },
      boxShadow: {
        ambient: '0 8px 40px -4px rgba(26,28,28,0.06)',
      },
      backdropBlur: {
        glass: '20px',
      },
    },
  },
}
```

---

## 12. Non-Functional Requirements

| Concern | Target |
|---|---|
| **Auth** | JWT with httpOnly refresh cookie; access token in Authorization header |
| **Performance** | API responses < 200ms for cached data; chart data endpoints < 500ms |
| **Responsiveness** | Desktop-first (1280px+); gracefully usable at 1024px; mobile is not a priority |
| **Accessibility** | WCAG 2.1 AA — ghost borders on focus states, sufficient contrast ratios, keyboard navigation |
| **Data privacy** | All data per-user; row-level security enforced at the ORM layer |
| **Deployment** | Run directly (`uvicorn` + `next dev`) or via Docker Compose; SQLite DB file lives in a mounted volume |
| **Testing** | Backend: unit + integration (pytest); Frontend: component tests (Vitest + RTL) |
