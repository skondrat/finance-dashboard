# Feature Specification: Init Categories Flow

**Feature Branch**: `009-init-categories-flow`
**Created**: 2026-03-29
**Status**: Draft
**Input**: User description: "Change the budget import flow so that when no categories exist, the user sees an Init Categories step before importing. Users can upload a CSV with categories, examples, and optional budget amounts, then optionally add categories manually before proceeding to their first import."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - First-Time Category Initialization via CSV (Priority: P1)

A new user navigates to the Budget page and clicks "Import Statement". Since no categories exist yet, instead of the normal import dropzone, they see an "Init Categories" screen. The user uploads a CSV file containing category names, optional example descriptions, and optional budget amounts (in euros by default). The system creates all categories with their budget limits and populates the description-to-category mappings from the examples. After successful upload, the user sees the created categories listed and can proceed to their first statement import.

**Why this priority**: This is the core of the feature -- without category initialization, new users cannot meaningfully import and categorize transactions. The CSV upload is the fastest path to getting a useful set of categories.

**Independent Test**: Can be fully tested by creating a fresh user with no categories, clicking "Import Statement", uploading a CSV with categories/examples/budgets, and verifying all categories appear with correct budget amounts.

**Acceptance Scenarios**:

1. **Given** a user with no categories, **When** they click "Import Statement", **Then** they see an Init Categories screen with an option to upload a CSV file instead of the normal import dropzone.
2. **Given** the Init Categories screen is displayed, **When** the user uploads a valid CSV with columns "Categories", "Examples", and "Budget", **Then** categories are created with the specified budget amounts and example mappings are saved.
3. **Given** a CSV with only "Categories" column (no "Examples" or "Budget"), **When** uploaded, **Then** categories are created with no budget limit and no example mappings.
4. **Given** a CSV with a "Budget" column containing numeric values, **When** uploaded, **Then** each category's monthly budget is set to the specified amount in euros.

---

### User Story 2 - Manual Category Addition After CSV Upload (Priority: P2)

After uploading a CSV (or skipping CSV upload), the user can manually add individual categories with a name and optional budget amount. This allows users to supplement the CSV-imported categories or create categories from scratch if they prefer not to use a CSV.

**Why this priority**: Some users may want to fine-tune their categories beyond what the CSV provides, or may not have a CSV ready. Manual addition is a necessary complement to CSV upload.

**Independent Test**: Can be tested by going through the Init flow, skipping or completing CSV upload, then manually adding a category with a name and budget, and verifying it appears in the list.

**Acceptance Scenarios**:

1. **Given** the Init Categories screen after CSV upload, **When** the user enters a category name and optional budget amount and clicks "Add", **Then** the category is created and appears in the categories list.
2. **Given** the Init Categories screen without any CSV upload, **When** the user manually adds categories one by one, **Then** each category is created and listed.
3. **Given** a category name that already exists (from CSV upload), **When** the user tries to add it manually, **Then** the system shows a validation error indicating the category already exists.

---

### User Story 3 - Completing Init and Proceeding to Import (Priority: P2)

After the user has set up their categories (via CSV, manual addition, or both), they click a "Continue to Import" button. The Init flow closes and the normal import dropzone appears, allowing the user to upload their first bank statement. On subsequent visits, the Init screen is no longer shown since categories already exist.

**Why this priority**: This completes the Init-to-Import transition and ensures the flow is seamless. Without this, users would be stuck in the Init screen.

**Independent Test**: Can be tested by completing category initialization, clicking "Continue to Import", and verifying the normal import dropzone appears. On a subsequent visit, verify the Init screen is skipped.

**Acceptance Scenarios**:

1. **Given** the user has added at least one category (via CSV or manually), **When** they click "Continue to Import", **Then** the Init screen transitions to the normal import dropzone.
2. **Given** the user has categories from a previous session, **When** they click "Import Statement", **Then** they see the normal import dropzone directly (Init screen is skipped).
3. **Given** the user is on the Init screen with no categories added yet, **When** they try to proceed, **Then** the "Continue to Import" button is disabled or shows a message requiring at least one category.

---

### Edge Cases

- What happens when the CSV contains duplicate category names? The system should deduplicate, creating each category only once and using the last occurrence's budget value.
- What happens when the CSV has malformed rows (missing category name, non-numeric budget)? The system should skip invalid rows and report how many were skipped.
- What happens when the user uploads a CSV but all categories already exist (e.g., re-uploading)? The system should report that no new categories were created and show the existing ones.
- What happens if the user closes the Init modal without finishing? On next "Import Statement" click, the Init screen should appear again if no categories exist.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST detect when a user has no categories and show the Init Categories screen instead of the normal import dropzone when "Import Statement" is clicked.
- **FR-002**: System MUST accept a CSV file upload with a required "Categories" column and optional "Examples" and "Budget" columns.
- **FR-003**: System MUST create Category records from the CSV with the specified names and monthly budget amounts (in euros).
- **FR-004**: System MUST populate description-to-category mappings from the "Examples" column (pipe-separated values).
- **FR-005**: System MUST allow the user to manually add categories with a name and optional budget amount after CSV upload.
- **FR-006**: System MUST prevent duplicate category names (both within CSV and between CSV and manually added categories).
- **FR-007**: System MUST provide a "Continue to Import" action that transitions from the Init screen to the normal import dropzone, enabled only when at least one category exists.
- **FR-008**: System MUST skip the Init screen entirely when the user already has categories.
- **FR-009**: System MUST display the list of created categories (with budget amounts) after CSV upload and after manual additions.
- **FR-010**: System MUST handle CSV parsing errors gracefully, skipping invalid rows and reporting the count of skipped rows to the user.

### Key Entities

- **Category**: Represents a spending category with a name, optional monthly budget amount (euros), and optional example transaction descriptions for auto-matching.
- **Init Categories CSV**: A CSV file with columns: "Categories" (required), "Examples" (optional, pipe-separated descriptions), "Budget" (optional, numeric amount in euros).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user with no categories can complete the Init flow (CSV upload + optional manual additions) and start their first import within 2 minutes.
- **SC-002**: Categories uploaded via CSV are immediately available for transaction categorization during the first import.
- **SC-003**: Budget amounts from the CSV are correctly reflected in the Budget page's "Spend by Category" table after import.
- **SC-004**: 100% of valid CSV rows result in created categories; invalid rows are skipped with a user-visible count.

## Assumptions

- The existing seed categories CSV upload endpoint and service can be extended to support the "Budget" column rather than building from scratch.
- Currency for budget amounts defaults to euros; no currency column is needed in the CSV.
- The Init Categories screen replaces the import dropzone within the same Import Statement modal, not a separate page or modal.
- The user must create at least one category before they can proceed to import.
- The feature builds on the existing seed categories upload flow, enhancing it with budget support and a dedicated Init UI step.
