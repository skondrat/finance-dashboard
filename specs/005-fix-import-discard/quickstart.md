# Quickstart: Fix Import Discard

**Feature**: 005-fix-import-discard

## How to Test

1. Clear DB: delete all from `budget_transactions` and `statement_imports`
2. Navigate to Budget > Import Statement
3. Upload `data/monthly_statement_3_2026.pdf` with source "Payoneer"
4. Wait for preview to appear (~60s)
5. Click **Discard**
6. Upload the same PDF again with source "Payoneer"
7. Verify: preview shows ~101 transactions with **0 duplicates skipped**

## Also Test: Modal Close

1. Upload PDF, wait for preview
2. Click **X** (close button) instead of Discard
3. Re-upload same PDF
4. Verify: 0 duplicates skipped
