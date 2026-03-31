# Feature Specification: Fix USD Import Currency Conversion

**Feature Branch**: `037-fix-usd-import`  
**Created**: 2026-03-31  
**Status**: Draft  
**Input**: User description: "Fix USD import: amounts stored without currency conversion — raw USD numbers displayed as EUR"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - USD transactions display correctly in EUR view (Priority: P1)

When a user imports a Payoneer USD statement and views the budget in EUR mode, all USD transactions should be converted to EUR using the applicable exchange rate — not displayed as raw USD numbers labeled as EUR. Currently, a $9,487.15 salary payment appears as €9,487.15 in EUR view, which is incorrect.

**Why this priority**: This is a data accuracy issue. Incorrect currency display makes the entire budget unreliable and misleading. Users cannot trust any totals or category breakdowns when amounts are wrong.

**Independent Test**: Import a USD statement, switch to EUR display, and verify that USD amounts are converted using exchange rates rather than shown as-is with a EUR symbol.

**Acceptance Scenarios**:

1. **Given** a USD transaction of $100.00 exists, **When** the user views the budget in EUR mode, **Then** the transaction amount is displayed converted to EUR using the applicable exchange rate (not shown as €100.00).
2. **Given** a USD transaction of $9,487.15 (salary) exists, **When** the user views the Monthly Income KPI in EUR mode, **Then** the income amount reflects the EUR-equivalent value, not $9,487.15 relabeled as EUR.
3. **Given** multiple USD and EUR transactions exist for the same month, **When** the user views the budget summary in EUR mode, **Then** all totals (spend, income, savings) correctly aggregate EUR amounts with converted-USD amounts.

---

### Edge Cases

- What happens when no exchange rate is available for the transaction date? The system should use the nearest available rate or display a warning.
- What happens when a USD transaction is viewed in USD mode? It should display the original USD amount without conversion.
- What happens when the user switches between EUR and USD display modes? Totals should recalculate to show only transactions in the selected currency, or convert all transactions to the selected currency.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST convert USD transaction amounts to EUR using exchange rates when displaying in EUR mode, rather than showing raw USD numbers as EUR.
- **FR-002**: System MUST display original USD amounts without conversion when the display currency is set to USD.
- **FR-003**: System MUST correctly aggregate converted amounts across currencies when computing budget totals (income, spend, savings).
- **FR-004**: System MUST use the exchange rate closest to the transaction date for conversion.

### Key Entities

- **Budget Transaction**: Has a currency field (EUR, USD, etc.) and an amount in the original currency. Display amounts must be converted based on the user's selected display currency.
- **Exchange Rate**: Provides conversion rates between currencies for specific dates, used when displaying cross-currency totals.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All imported USD transactions display correctly converted EUR amounts when viewed in EUR mode — no raw USD values shown as EUR.
- **SC-002**: Monthly totals (income, spend, savings) in EUR mode accurately reflect currency-converted values from all imported statements regardless of original currency.
- **SC-003**: Users can still view original USD amounts by switching to USD display mode.

## Assumptions

- Exchange rates between USD and EUR are already available in the system (the app has an `exchange_rates` table).
- The budget summary endpoint already supports currency conversion logic for EUR-denominated transactions; the fix extends this to properly handle USD transactions.
- Only EUR and USD currencies are in scope for now.
