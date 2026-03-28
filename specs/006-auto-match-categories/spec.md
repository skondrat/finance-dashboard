# Feature Specification: Auto-Match Categories for Identical Descriptions

**Feature Branch**: `006-auto-match-categories`
**Created**: 2026-03-28
**Status**: Draft
**Input**: User description: "When user assigns a category to an uncategorized transaction in the import preview, all other uncategorized transactions with the same description should automatically get the same category."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Category Override Propagates to Matching Descriptions (Priority: P1)

A user uploads a PDF statement and sees the preview table. Several transactions have the same description (e.g., 8 "Card charge (MERCADONA)" entries) but some are uncategorized or incorrectly categorized. When the user selects a category for one of these transactions, all other transactions with the same description that are currently uncategorized automatically receive the same category assignment.

**Why this priority**: This is the core usability fix. With 103 transactions and 40+ uncategorized, manually fixing each one is tedious. Propagating a single category choice to all matching descriptions saves significant time.

**Independent Test**: Upload a PDF with multiple identical descriptions (e.g., several MERCADONA entries). Verify some are uncategorized. Select "Groceries" for one uncategorized MERCADONA entry. Verify all other uncategorized MERCADONA entries also switch to "Groceries".

**Acceptance Scenarios**:

1. **Given** 5 transactions with description "Card charge (MERCADONA)" where 3 are uncategorized, **When** the user selects "Groceries" for one of the uncategorized ones, **Then** the other 2 uncategorized MERCADONA transactions also become "Groceries".
2. **Given** a transaction already categorized as "Shopping" by AI and another with the same description that is uncategorized, **When** the user overrides the uncategorized one to "Groceries", **Then** the AI-categorized "Shopping" one remains unchanged (only uncategorized transactions are auto-matched).
3. **Given** the user has auto-matched several transactions, **When** they click "Confirm Import", **Then** all the auto-matched categories are included in the confirmed import.
4. **Given** the user auto-matched a category and then manually changes one of the auto-matched transactions to a different category, **Then** only that specific transaction changes — it does not re-propagate.

---

### Edge Cases

- What if the user selects "-- None --" (uncategorize) for a transaction? This should NOT propagate — only positive category assignments propagate.
- What if all transactions with that description are already categorized (none are uncategorized)? No propagation occurs — only uncategorized transactions are affected.
- Case sensitivity: descriptions should match case-insensitively since the same merchant may appear with slightly different casing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a user assigns a category to a transaction in the import preview, the system MUST automatically assign the same category to all other transactions with the same description that currently have no category (uncategorized).
- **FR-002**: Auto-matching MUST only affect transactions that are uncategorized (category_source = "none" and no user override). Transactions already categorized by AI, mapping, or rule MUST NOT be changed.
- **FR-003**: Auto-matched categories MUST be treated as user overrides and included when confirming the import.
- **FR-004**: Setting a transaction to "-- None --" (removing category) MUST NOT propagate to other transactions.
- **FR-005**: Description matching MUST be case-insensitive.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A single category selection fixes all identical uncategorized transactions — the user does not need to repeat the same selection more than once per unique description.
- **SC-002**: After auto-matching, the number of uncategorized transactions in a typical import drops by at least 50%.
- **SC-003**: The auto-matching happens instantly (under 100ms) with no visible delay.

## Assumptions

- This is a frontend-only change — the category override logic in the import preview already supports per-row overrides; this feature extends that by auto-populating overrides for matching descriptions.
- The backend confirm endpoint already handles the overrides map correctly — no backend changes needed.
- Description matching uses exact match (case-insensitive) — no fuzzy matching or normalization beyond lowercasing.
