# Feature Specification: Categorization Quality Improvements

**Feature Branch**: `007-categorization-quality`
**Created**: 2026-03-29
**Status**: Draft
**Input**: User description: "Improve categorization quality: flag Other for review, harmonize identical descriptions, exclude transfers between balances, add ATM Withdrawal category"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Exclude Internal Transfers from Import (Priority: P1)

When a user imports a bank statement (PDF or CSV), transactions with descriptions matching "Transfer between balances" are internal account movements (e.g., USD to EUR conversions). These are not real income or expenses and pollute budget data if imported. The system should automatically detect these and exclude them from the import preview entirely so they never enter the user's budget.

**Why this priority**: Internal transfers distort spending/income totals significantly (e.g., €9,793 of phantom spend). This is the highest-impact data quality fix because it removes noise at the source.

**Independent Test**: Import a PDF statement containing transfer-between-balances transactions. Verify they do not appear in the preview table and are not saved when the import is confirmed.

**Acceptance Scenarios**:

1. **Given** a PDF statement with 10 transactions including 3 "Transfer between balances" entries, **When** the user uploads the statement, **Then** only 7 transactions appear in the import preview and the 3 transfers are excluded.
2. **Given** a CSV import with a row described "Transfer between balances (USD to EUR)", **When** the user uploads the file, **Then** that row is excluded from the preview.
3. **Given** a statement with descriptions like "Transfer between balances" with varied casing or trailing text (e.g., "TRANSFER BETWEEN BALANCES", "Transfer between balances (USD)"), **When** uploaded, **Then** all variants are excluded (case-insensitive prefix match).
4. **Given** a statement where all transactions are transfers, **When** uploaded, **Then** the preview shows an empty state message indicating all transactions were excluded as internal transfers.

---

### User Story 2 - ATM Withdrawal Auto-Categorization (Priority: P2)

When a user imports a statement containing ATM withdrawal transactions, these should be automatically categorized as "ATM Withdrawal" without relying on AI. A dedicated "ATM Withdrawal" category should exist in the seed categories list. Any description starting with "ATM withdrawal" should be mapped to this category via a deterministic rule that runs before AI categorization.

**Why this priority**: ATM withdrawals are common, unambiguous, and currently get miscategorized as "Other". A simple prefix rule eliminates this problem completely without AI cost.

**Independent Test**: Import a statement with ATM withdrawal transactions. Verify they are auto-categorized as "ATM Withdrawal" with a "rule" source badge, not sent to AI.

**Acceptance Scenarios**:

1. **Given** a statement with "ATM withdrawal (Optica Mutualista)" and "ATM withdrawal (New Souvenires)", **When** imported, **Then** both are categorized as "ATM Withdrawal" with category source "rule".
2. **Given** the seed categories CSV does not yet include "ATM Withdrawal", **When** the user loads seed categories, **Then** "ATM Withdrawal" is included automatically as a built-in category.
3. **Given** a description "ATM WITHDRAWAL" (all caps) or "Atm Withdrawal" (mixed case), **When** imported, **Then** the rule matches and categorizes it as "ATM Withdrawal" (case-insensitive prefix match).
4. **Given** a description "ATM card payment" (starts with "ATM" but not "ATM withdrawal"), **When** imported, **Then** it is NOT auto-categorized by this rule and proceeds to normal categorization.

---

### User Story 3 - Harmonize Identical Descriptions (Priority: P3)

After AI categorization completes for a batch of transactions, the system should post-process results to ensure identical descriptions receive the same category. Currently, independent AI calls sometimes assign different categories to the same description. The system should group results by description and apply the majority-voted category to all transactions in each group.

**Why this priority**: Inconsistent categorization is confusing and requires manual correction. This is a straightforward post-processing step that improves quality without additional AI cost.

**Independent Test**: Import a statement with multiple transactions sharing the same description. Verify all receive the same category after AI categorization completes.

**Acceptance Scenarios**:

1. **Given** 8 transactions with description "Transfer between balances" where 7 get "Transfers" and 1 gets null from AI, **When** post-processing runs, **Then** all 8 get "Transfers" (majority vote wins).
2. **Given** 4 transactions with description "UBER EATS" where 2 get "Restaurants" and 2 get "Food & Dining", **When** post-processing runs, **Then** all 4 get the same category (first-encountered category breaks ties).
3. **Given** transactions where all instances of a description got the same category from AI, **When** post-processing runs, **Then** no changes are made (no-op for already-consistent results).
4. **Given** a group where some transactions were categorized by mapping/rule and others by AI, **When** post-processing runs, **Then** mapping/rule results take precedence (only AI-sourced results within the group are harmonized).

---

### User Story 4 - Flag "Other" Transactions for Review (Priority: P4)

In the import preview, transactions categorized as "Other" should be visually highlighted to draw the user's attention. This helps the user identify transactions that need manual re-categorization before confirming the import.

**Why this priority**: While important for user experience, this is a visual enhancement that builds on top of the other categorization improvements. The other stories reduce the number of "Other" transactions first; this story handles the remaining ones.

**Independent Test**: Import a statement where some transactions are categorized as "Other". Verify those rows have a distinct visual indicator in the preview table.

**Acceptance Scenarios**:

1. **Given** an import preview with 3 transactions categorized as "Other" among 20 total, **When** the preview table renders, **Then** the 3 "Other" rows have a visible highlight (e.g., yellow/amber background or warning badge) distinguishing them from properly categorized rows.
2. **Given** an import where no transactions are categorized as "Other", **When** the preview renders, **Then** no special highlighting appears.
3. **Given** a user manually changes a transaction's category from "Other" to "Groceries" via the dropdown, **When** the override is applied, **Then** the highlight is removed from that row.
4. **Given** all transactions are categorized as "Other", **When** the preview renders, **Then** all rows are highlighted and the user can still re-categorize each one individually.

---

### Edge Cases

- What happens when a transaction description partially matches "Transfer between balances" (e.g., "Transfer to savings")? Only exact prefix matches of "Transfer between balances" should be excluded; other transfer types proceed normally.
- What happens if the "ATM Withdrawal" category was previously deleted or archived by the user? The rule still matches based on description prefix; if the category doesn't exist, the transaction falls through to AI categorization.
- What happens when a description group has all different categories from AI (no majority)? The first-encountered category (by transaction order) is used as the tiebreaker.
- What happens if a user has a custom category named "Other"? The flagging uses the category name "Other" for highlighting, so it will match any category with that exact name.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST exclude transactions whose description starts with "Transfer between balances" (case-insensitive) from the import preview and from being saved.
- **FR-002**: System MUST display a count of excluded transfer transactions to the user in the import preview (e.g., "3 internal transfers excluded").
- **FR-003**: System MUST include "ATM Withdrawal" as a built-in category that is always available, regardless of whether the user uploads seed categories.
- **FR-004**: System MUST auto-categorize transactions whose description starts with "ATM withdrawal" (case-insensitive) using a deterministic rule, bypassing AI categorization.
- **FR-005**: System MUST assign category source "rule" to ATM withdrawal auto-categorized transactions.
- **FR-006**: After AI categorization completes, system MUST post-process results to harmonize categories for identical descriptions using majority vote.
- **FR-007**: When majority vote results in a tie, system MUST use the first-encountered category as the tiebreaker.
- **FR-008**: Harmonization MUST only modify AI-sourced categorizations; mapping-sourced and rule-sourced categorizations are not changed.
- **FR-009**: In the import preview, system MUST visually highlight transactions categorized as "Other" to prompt user review.
- **FR-010**: When a user re-categorizes a highlighted "Other" transaction, the highlight MUST be removed.

### Key Entities

- **Category ("ATM Withdrawal")**: New built-in category for ATM cash withdrawals. Created automatically when not present.
- **Excluded Transactions**: Transactions filtered out before preview. Not persisted. Count communicated to user.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Internal transfer transactions (matching "Transfer between balances") never appear in import preview or saved data.
- **SC-002**: ATM withdrawal transactions are correctly auto-categorized 100% of the time without AI involvement.
- **SC-003**: After import, all transactions sharing the same description have the same category assigned.
- **SC-004**: Users can identify "Other"-categorized transactions at a glance in the import preview without reading each row's category.

## Assumptions

- The phrase "Transfer between balances" is the standard description used by the bank statements this application processes. If other banks use different phrasing for internal transfers, those will not be excluded by this feature.
- "ATM Withdrawal" is a universally applicable category name. Users who prefer a different name can rename it after creation.
- The existing auto-match feature (which propagates manual category selections to identical descriptions in the frontend) continues to work alongside the new backend harmonization. Backend harmonization runs first; frontend auto-match handles subsequent user overrides.
- The "Other" category is identified by its name string, not by a special flag or ID. This matches the current system behavior where categories are matched by name.
