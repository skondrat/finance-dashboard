# Quickstart: Budget UI Improvements

## Files to modify

1. **`frontend/src/components/budget/category-table.tsx`** — Add sort state, sortable headers with arrows, sort logic, and verify/fix progress bar grey color for no-budget categories.

## Implementation order

1. Add sort state (`sortColumn`, `sortDirection`) with `useState`
2. Make column headers clickable with sort arrow indicators
3. Add sort logic that sorts the data array before rendering
4. Verify and fix the ProgressBar component for no-budget categories

## Manual test

1. Open budget page, verify categories display
2. Click each column header — verify sort works and arrow shows
3. Click same header again — verify direction toggles
4. Verify categories with €0.00 budget have grey progress bars
5. Verify categories with budget have green progress bars
