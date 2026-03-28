# E2E Test Findings: PDF Import Flow

**Date**: 2026-03-28
**Test**: Fresh import of `monthly_statement_3_2026.pdf` (Payoneer, 103 transactions) with clean DB and empty category mappings

## Issues

- **Discard button doesn't call backend API** — The frontend `handleDiscard` in `import-modal.tsx` only resets client-side state but never calls `POST /budget/import/{id}/discard`. This leaves orphaned preview transactions in the DB. On a subsequent import of the same PDF, all transactions show as "duplicates skipped" because the old preview transactions still have dedup hashes in the DB. The SSE flow makes this worse because `handleDiscard` doesn't even have the import ID (the SSE result contains it, but it's only set in `preview` state after completion).

- **40 out of 101 transactions are uncategorized** — Many common transactions that should match existing categories remain uncategorized (e.g., MERCADONA → Groceries, EL CORTE INGLES → Shopping, Preply → Education, IHERB.COM → Supplements, CONTINENTE → Groceries). The AI categorization assigned these correctly for *some* instances but missed others with the same description. This is because `suggest_category_async` makes independent calls per transaction without context of what was already categorized — the same description can get different results.

- **"Other" category is a catch-all with €4,690 (50.7% of total spend)** — Large ATM withdrawals (Optica Mutualista €2,027, New Souvenires €1,371 + €1,017) are categorized as "Other" which is unhelpful. These are likely rent/cash payments that should be specifically categorized or at least flagged for user review. The "Other" default category from the system absorbs too many transactions.

- **Feb 28 transaction included in March statement** — The Payoneer PDF includes a Feb 28, 2026 transaction (MERCADONA -€26.87) which the LLM correctly extracted. It shows in the March view because the budget filters by import date, not transaction date. This is technically correct behavior (it was in the March statement) but may be confusing to the user.

- **Credit transactions (transfers in) invisible in category view** — The Monthly Spend shows €9,249.79 (only negative amounts, correctly). However, the "Transfers" category shows €0.00 in the spend breakdown because transfers are positive amounts. The user can't see their transfer activity in the category view — 8 transfers totaling €9,793.09 are invisible.

- **One transfer not categorized** — 7 of 8 "Transfer between balances" transactions are categorized as "Transfers", but one (€1,000 on Mar 14) is uncategorized (category_id = NULL). Inconsistent AI results for identical descriptions.

- **Categorization speed still slow (~2+ minutes for 103 transactions)** — Despite the semaphore(10) parallelism, the total categorization time was ~120 seconds. The Anthropic API appears to be rate-limiting, so 10 concurrent requests don't actually run 10x faster. The effective concurrency may be lower than expected.
