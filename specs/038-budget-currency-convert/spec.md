# Feature Specification: Convert Budget Amounts Across Currencies

**Feature Branch**: `038-budget-currency-convert`  
**Created**: 2026-03-31  
**Status**: Draft  
**Input**: User description: "The income should stay visible but converted to selected currency. Monthly Income KPI should show all income across currencies converted to display currency."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Monthly Income KPI aggregates all income converted to display currency (Priority: P1)

When the user views the budget in EUR mode, the Monthly Income KPI card should show the total of ALL income sources (from any currency) converted to EUR. Currently it only shows EUR-denominated income, hiding USD salary entirely. Similarly, when viewing in USD mode, EUR income should be converted to USD and included in the total.

**Why this priority**: The Monthly Income KPI is the most visible number on the budget page. If it excludes a user's primary salary just because it was received in a different currency, the entire budget picture is wrong — savings rate, budget remaining, and savings all become meaningless.

**Independent Test**: Import a USD statement with salary income, switch to EUR view, and verify Monthly Income includes the salary converted to EUR at the applicable exchange rate.

**Acceptance Scenarios**:

1. **Given** a $9,487.15 USD salary and a €6,417.18 EUR income exist for February, **When** the user views the budget in EUR mode, **Then** Monthly Income shows both amounts summed, with the USD amount converted to EUR (e.g., ~€8,700 + €6,417 ≈ ~€15,100 depending on rate).
2. **Given** the same income sources, **When** the user switches to USD mode, **Then** Monthly Income shows both amounts summed, with the EUR amount converted to USD.
3. **Given** only EUR income exists, **When** the user views in EUR mode, **Then** Monthly Income shows the EUR total unchanged (no conversion needed).

---

### User Story 2 - Income Sources sidebar shows all sources converted to display currency (Priority: P1)

The Income Sources sidebar should always display ALL income sources regardless of their original currency, with amounts converted to the currently selected display currency.

**Why this priority**: Equally important to the KPI — the sidebar is where users see the breakdown. Hiding income sources by currency makes the data incomplete.

**Independent Test**: Import USD and EUR statements with income, verify all income sources appear in the sidebar with amounts converted to the selected display currency.

**Acceptance Scenarios**:

1. **Given** a USD salary of $9,487.15 and an EUR income of €6,417.18 exist, **When** viewing in EUR mode, **Then** both income sources appear in the sidebar with the USD salary displayed as its EUR equivalent.
2. **Given** the same sources, **When** switching to USD mode, **Then** both income sources appear with the EUR income displayed as its USD equivalent.

---

### User Story 3 - Monthly Spend and Savings reflect cross-currency totals (Priority: P2)

Monthly Spend, Monthly Savings, and Saving Rate should aggregate transactions from all currencies, converting each to the display currency. This ensures the full financial picture is visible regardless of which currency mode is selected.

**Why this priority**: Follows naturally from income conversion — if income is converted, spend and savings should be too for consistency.

**Independent Test**: Import EUR and USD statements with spending, verify Monthly Spend in EUR mode includes converted USD spend.

**Acceptance Scenarios**:

1. **Given** EUR and USD spending transactions exist, **When** viewing in EUR mode, **Then** Monthly Spend includes all transactions converted to EUR.
2. **Given** converted totals, **When** viewing budget summary, **Then** Savings = Income - Spend using the fully converted totals.

---

### Edge Cases

- What happens when no exchange rate is available for a transaction's date? Use the nearest available earlier rate.
- What happens when viewing in a currency with no native transactions? All transactions should still appear, converted from their original currencies.
- How does Spend by Category handle cross-currency? Each category total should include converted amounts from all currencies.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Monthly Income KPI MUST aggregate income from all currencies, converting each to the user's selected display currency using exchange rates.
- **FR-002**: Income Sources sidebar MUST display all income sources regardless of original currency, with amounts converted to the display currency.
- **FR-003**: Monthly Spend KPI MUST aggregate spending from all currencies, converting each to the display currency.
- **FR-004**: Monthly Savings and Saving Rate MUST be calculated from the fully cross-currency-converted income and spend totals.
- **FR-005**: Spend by Category MUST aggregate spending from all currencies per category, converting to the display currency.
- **FR-006**: Transaction list MUST show transactions from all currencies, with amounts converted to the display currency.
- **FR-007**: Currency conversion MUST use the exchange rate closest to (but not after) the transaction date.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Monthly Income KPI reflects 100% of income regardless of original currency, with correct conversion to display currency.
- **SC-002**: All income sources appear in the sidebar in every display currency mode.
- **SC-003**: Budget totals (spend, savings, saving rate) are consistent and account for all transactions across currencies.
- **SC-004**: Switching between EUR and USD display modes shows the same data converted, not different subsets.

## Assumptions

- Exchange rates between USD and EUR are already stored in the system and kept reasonably up-to-date.
- Only EUR and USD currencies need cross-conversion for now.
- The exchange rate lookup uses the nearest earlier date when an exact date match is unavailable.
- The existing transaction list currency filter (from feature 037) will be replaced with cross-currency conversion instead of filtering.
