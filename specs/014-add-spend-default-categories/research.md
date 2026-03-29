# Research: Add Spend & Default Categories

## Add Spend approach

- **Decision**: Create a new `AddSpendModal` component. Reuse existing `POST /api/v1/budget/transactions` endpoint.
- **Rationale**: Backend already supports creating transactions with `BudgetTransactionCreate` schema. Frontend just needs a modal form.
- **Form fields**: Category selector (dropdown from existing categories), Amount (number input), Description (text input, optional).
- **Transaction defaults**: date = today, currency = current selected currency, amount stored as negative (expense).

## Default categories approach

- **Decision**: After `load_seed_categories()` in `seed_service.py`, ensure "Debt" and "Investments" exist (case-insensitive check).
- **Rationale**: Simplest integration point — the seed service already creates categories and can append defaults.
- **Default colors**: Debt = "#DC2626" (red), Investments = "#10B981" (green/teal).
