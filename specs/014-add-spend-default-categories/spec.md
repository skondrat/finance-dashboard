# Feature Specification: Add Spend Button & Default Categories

**Feature Branch**: `014-add-spend-default-categories`
**Created**: 2026-03-29
**Status**: Draft
**Input**: User description: "Add spend button for manual expense entry (category selector, value, description) next to Import Statement. Also include Debt and Investments as default categories after init, alongside ATM Withdrawal and Other."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add Manual Expense (Priority: P1)

A user wants to quickly record a one-off expense without importing a bank statement. They click the "Add Spend" button (next to "Import Statement"), fill in a category, amount, and description, and submit. The expense is added to the current month's budget immediately.

**Why this priority**: This is the primary feature — it unlocks a quick entry workflow that avoids the overhead of importing a full statement.

**Independent Test**: Click "Add Spend", fill in category/amount/description, submit, and verify the expense appears in the Spend by Category table with updated totals.

**Acceptance Scenarios**:

1. **Given** the budget page is displayed, **When** the user clicks "Add Spend", **Then** a form/modal appears with a category selector, amount input, and description input.
2. **Given** the Add Spend form is open, **When** the user selects a category, enters an amount, types a description, and submits, **Then** the expense is saved and the budget table updates to reflect the new spend.
3. **Given** the Add Spend form is open, **When** the user submits without filling all required fields (category, amount), **Then** the form shows a validation error and does not submit.
4. **Given** the Add Spend form is open, **When** the user clicks cancel or outside the form, **Then** the form closes without saving.
5. **Given** an expense was just added, **When** the user views the budget summary, **Then** Monthly Spend, Remaining, and category totals reflect the new expense.

---

### User Story 2 - Default Categories Include Debt and Investments (Priority: P2)

After the initial categories setup (CSV upload), the system automatically ensures that "Debt" and "Investments" categories exist alongside the user's imported categories. This is similar to how "ATM Withdrawal" and "Other" are already expected to be present.

**Why this priority**: Ensures every user has essential financial categories from day one, without needing to add them manually.

**Independent Test**: Upload a seed categories CSV that does not include Debt or Investments. After upload, verify that Debt and Investments categories exist in the category list.

**Acceptance Scenarios**:

1. **Given** a user uploads a seed categories CSV without Debt or Investments, **When** the seed process completes, **Then** Debt and Investments categories are automatically created.
2. **Given** a user uploads a seed categories CSV that already includes Debt and Investments, **When** the seed process completes, **Then** no duplicate categories are created.
3. **Given** Debt and Investments are auto-created, **When** the user views the categories settings, **Then** they appear in the list with default colors and no budget set.

---

### Edge Cases

- What if the user enters a zero or negative amount in Add Spend? The amount must be a positive number.
- What if the user's currency is different? The expense should use the currently selected currency.
- What if the seed CSV already has categories named "Debt" or "Investments" with different casing? Match case-insensitively to avoid duplicates.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: An "Add Spend" button MUST appear next to the "Import Statement" button on the budget page.
- **FR-002**: Clicking "Add Spend" MUST open a form with: category selector (dropdown of existing categories), amount input (positive number), and description text input.
- **FR-003**: The form MUST validate that category and amount are provided before submission.
- **FR-004**: The amount MUST be stored as a negative value (expense) in the current currency.
- **FR-005**: The transaction date MUST be set to today's date.
- **FR-006**: After successful submission, the budget table and summary MUST refresh to reflect the new expense.
- **FR-007**: The form MUST be dismissible via cancel button or clicking outside.
- **FR-008**: After seed categories import, the system MUST ensure "Debt" and "Investments" categories exist.
- **FR-009**: If "Debt" or "Investments" already exist (case-insensitive match), the system MUST NOT create duplicates.
- **FR-010**: Auto-created Debt and Investments categories MUST have no budget set (null) and use default colors.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can add a manual expense in under 15 seconds (open form, fill 3 fields, submit).
- **SC-002**: 100% of seed category imports result in Debt and Investments categories being present.
- **SC-003**: Manually added expenses immediately appear in the budget summary and category breakdown.

## Assumptions

- The existing backend endpoint for creating transactions (POST) will be reused — no new backend endpoint needed for Add Spend.
- The Add Spend form is a simple modal/popover, not a full page.
- Description is optional (amount and category are required).
- Default colors for Debt and Investments will be chosen from the existing palette.
