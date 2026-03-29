# Feature Specification: Subscriptions

**Feature Branch**: `024-subscriptions`
**Created**: 2026-03-29
**Status**: Draft
**Input**: User description: "Subscriptions tracking with auto-detection and manual management. Add a new SUBSCRIPTIONS tab in the top navigation. Auto-detect recurring expenses from imported statements - if the same description appears in consecutive months (e.g. Netflix, Spotify), flag it as a subscription. Subscriptions can also be manually added. Each subscription has: name, cadence (monthly/yearly/weekly), value, payment date, payment source (selector populated from statement import sources). The subscriptions page shows a list of all subscriptions with total monthly cost. Auto-detected subscriptions appear as suggestions that users can confirm or dismiss."

## Clarifications

### Session 2026-03-29

- Q: When should recurring expense detection run? → A: On-demand when the user navigates to the subscriptions page.
- Q: Should users be able to cancel (soft-delete) vs hard-delete subscriptions? → A: Both — "Cancel" marks inactive (kept in history), "Delete" removes permanently.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View and Manage Subscriptions (Priority: P1)

As a user, I want a dedicated Subscriptions page where I can see all my active subscriptions in one place with the total monthly cost, so that I can understand my recurring financial commitments.

**Why this priority**: The subscriptions page is the core of the feature — without it, there is no place to display or manage subscriptions. Manual add provides immediate value even before auto-detection exists.

**Independent Test**: Navigate to the Subscriptions tab, manually add a subscription (e.g., "Netflix", monthly, €13.99, 15th of month, "monobank"), and verify it appears in the list with the total monthly cost updated.

**Acceptance Scenarios**:

1. **Given** I am logged in, **When** I click the "SUBSCRIPTIONS" tab in the top navigation, **Then** I see the subscriptions page.
2. **Given** I am on the subscriptions page, **When** I click "Add Subscription", **Then** a form appears with fields for name, cadence (monthly/yearly/weekly), value, payment date, and payment source.
3. **Given** I fill in the subscription form, **When** I click save, **Then** the subscription appears in the list and the total monthly cost is updated.
4. **Given** I have subscriptions with different cadences, **When** I view the total monthly cost, **Then** yearly subscriptions are divided by 12 and weekly subscriptions are multiplied by 4.33 to normalize to a monthly equivalent.
5. **Given** I have an existing subscription, **When** I click edit, **Then** I can update any field and the changes are saved.
6. **Given** I have an active subscription, **When** I click "Cancel", **Then** the subscription is marked as cancelled, removed from the active list, and no longer counted in the total monthly cost — but preserved in history.
7. **Given** I have a cancelled subscription, **When** I view the subscriptions page, **Then** I can see it in a separate "Cancelled" section and reactivate it.
8. **Given** I have a subscription (active or cancelled), **When** I click "Delete", **Then** the subscription is permanently removed.

---

### User Story 2 - Auto-Detect Recurring Expenses (Priority: P2)

As a user, I want the system to automatically detect recurring expenses from my imported bank statements so that I don't have to manually track every subscription.

**Why this priority**: Auto-detection adds significant value but depends on having imported statement data. It builds on the manual subscription management from US1.

**Independent Test**: Import statements for at least two consecutive months containing a recurring charge (e.g., "NETFLIX" appearing in both), then navigate to the subscriptions page and verify a suggestion appears for that recurring charge.

**Acceptance Scenarios**:

1. **Given** I have imported statements for two or more consecutive months, **When** the system detects the same transaction description appearing in consecutive months, **Then** it creates a subscription suggestion.
2. **Given** subscription suggestions exist, **When** I view the subscriptions page, **Then** I see a "Suggestions" section above or below my confirmed subscriptions showing detected recurring charges.
3. **Given** I see a subscription suggestion, **When** I click "Confirm", **Then** it becomes a confirmed subscription with pre-filled name, value (from the latest occurrence), and cadence (monthly by default).
4. **Given** I see a subscription suggestion, **When** I click "Dismiss", **Then** the suggestion is hidden and that description pattern is not suggested again.
5. **Given** a transaction description appears in only one month, **When** the system runs detection, **Then** it is NOT flagged as a recurring expense.

---

### User Story 3 - Payment Source Selection (Priority: P3)

As a user, I want to associate each subscription with a payment source (e.g., my bank or payment platform) so that I can track which account each subscription is charged to.

**Why this priority**: Payment source association is a nice-to-have detail that enriches the data but is not required for basic subscription tracking.

**Independent Test**: When adding or editing a subscription, verify the payment source dropdown is populated with sources from previously imported statements (e.g., "monobank", "payoneer").

**Acceptance Scenarios**:

1. **Given** I am adding a subscription, **When** I open the payment source dropdown, **Then** I see a list of sources from my imported statements plus an option to type a custom source.
2. **Given** I select a payment source for a subscription, **When** I save and view the subscription list, **Then** the payment source is displayed alongside the subscription details.

---

### Edge Cases

- What happens when a user has no imported statements? The auto-detection section shows no suggestions, and the payment source dropdown is empty (manual entry still allowed).
- What happens when a recurring charge changes amount between months (e.g., price increase)? The suggestion uses the most recent amount, and the user can adjust when confirming.
- What happens when a subscription is detected but the user already manually added it? The system should match by name similarity and not create a duplicate suggestion for already-tracked subscriptions.
- What happens when a user deletes all their subscriptions? The page shows an empty state with a prompt to add subscriptions manually or import statements to enable auto-detection.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST add a "SUBSCRIPTIONS" tab to the top navigation bar, accessible from all authenticated pages.
- **FR-002**: System MUST allow users to manually add subscriptions with the following fields: name (required), cadence (monthly/yearly/weekly), value (required), payment date (day of month, 1-31), and payment source (optional).
- **FR-003**: System MUST display a list of all confirmed subscriptions with name, cadence, value, payment date, and payment source.
- **FR-004**: System MUST calculate and display the total monthly cost by normalizing all subscriptions to a monthly equivalent (yearly / 12, weekly × 4.33).
- **FR-005**: System MUST allow users to edit, cancel (soft-delete), reactivate, and permanently delete subscriptions. Cancelled subscriptions are preserved in history and excluded from the total monthly cost.
- **FR-006**: System MUST auto-detect potential subscriptions on-demand when the user navigates to the subscriptions page, by finding transaction descriptions that appear in two or more consecutive months within imported statements.
- **FR-007**: Auto-detected subscriptions MUST appear as suggestions that users can confirm (converting them into active subscriptions) or dismiss.
- **FR-008**: Dismissed suggestions MUST not reappear for the same transaction description pattern.
- **FR-009**: The payment source selector MUST be populated with sources from the user's imported statements (e.g., "monobank", "payoneer") and allow custom text entry.
- **FR-010**: The system MUST NOT create duplicate suggestions for transaction descriptions that match an already-confirmed subscription name.

### Key Entities

- **Subscription**: A recurring financial commitment. Key attributes: name, cadence, value, currency, payment date, payment source, status (active/cancelled), user. Cancelled subscriptions are kept for history; permanent deletion removes the record entirely.
- **SubscriptionSuggestion**: An auto-detected recurring charge awaiting user action. Key attributes: detected description, detected amount, detection source (which statements), status (pending/confirmed/dismissed), user.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view all their subscriptions and total monthly cost within 1 second of navigating to the subscriptions page.
- **SC-002**: Users can add a new subscription manually in under 30 seconds.
- **SC-003**: Auto-detected suggestions appear within 2 seconds of page load when the user has qualifying imported statement data.
- **SC-004**: Users can confirm or dismiss a suggestion in a single click.

## Assumptions

- The existing statement import system provides sufficient transaction data (descriptions and dates) for recurring charge detection.
- "Consecutive months" means the same description appears in at least 2 months that are adjacent on the calendar (e.g., January and February, not January and March).
- The matching algorithm uses exact description matching (case-insensitive). Fuzzy matching is out of scope for v1.
- Statement import sources (monobank, payoneer, millenium, other) are the values used to populate the payment source selector.
- Currency for subscriptions defaults to the user's preferred currency (EUR).
- This feature does not include notifications or reminders for upcoming payments — that is a potential future enhancement.
