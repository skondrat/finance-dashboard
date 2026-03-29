# Ideas & Backlog

## LLM / Performance

* ~~Add LLM selector (between claude-sonnet-4-6 and claude-haiku-4-5) under the debug button. it will be the model used for all LLM calls. by defaule it's haiku~~ (DONE - PR #11)

## Improve Budget UI

* ~~All columns need to have a sort arrow (desc/asc)~~ (DONE - PR #12)
* ~~If category has No budget set up, it's progress bar has to be grey, not green~~ (DONE - PR #12)

## Budget Functionality

* ~~Add button Add spend (next to Import Statement) - a simple way to add add an expect to current month without importing statements. it has a category selector, value edit and description.~~ (DONE - PR #13)

* ~~Categories after init should by default also have categories (alongside with ATM Withdrawals and Others) - Debt, Investments~~ (DONE - PR #13)

* ~~Income is deducted from Statement - if it has a plus sign, and it's not a transfer from self account, then it has to be added to Income Source with corresponding label and value.~~ (DONE - PR #14)

---

## New Ideas

### Spending Trends (Charts)

* Replace the "Spending Trends coming in Phase 8" placeholder with actual charts. Show a bar or line chart of spending by category over the last 3-6 months so users can spot trends (e.g. groceries creeping up). Use Recharts (already in deps).

### Transaction List View

* There's no way to see individual transactions after import. Add a transaction list view (accessible from clicking a category row or a new tab) with date, description, amount, category. Include search/filter.

### Month-over-Month Comparison

* Add a comparison view: show this month vs last month side-by-side for each category. Highlight categories where spending increased or decreased significantly (e.g. >20% change).

### Copy Budget from Previous Month

* When starting a new month, allow copying the previous month's budget and income setup. Currently users must re-enter income sources each month manually.

### Recurring Expenses

* Track recurring expenses automatically. If the same description appears in consecutive months (e.g. "Netflix", "Spotify"), flag it as recurring and optionally auto-create it for future months.

### ~~Decimal Serialization Fix~~ (DONE - PR #16)

* ~~Pydantic serializes Decimal fields as strings in JSON responses (discovered in PR #12 — sort and progress bars broke). Audit all Pydantic models and add `json_serializers` or `model_config` to serialize Decimals as floats consistently, rather than patching each frontend consumer with `Number()`.~~

### ~~Dark Mode Polish~~ (DONE - PR #15)

* ~~Dark mode toggle exists but hasn't been tested across all new components (Add Spend modal, sort arrows, debug menu model selector). Do a full dark mode audit.~~

---

## Glacier (Low Priority / Someday)

### Export to CSV/PDF

* Add an export button to download the current month's budget summary as CSV or PDF. Useful for record-keeping or sharing with a partner/accountant.
