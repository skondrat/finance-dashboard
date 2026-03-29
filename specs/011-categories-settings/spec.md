# Feature Specification: Categories Settings Page

**Feature Branch**: `011-categories-settings`
**Created**: 2026-03-29
**Status**: Draft
**Input**: User description: "on the budget page I want to have a setting button with a gear icon. It will have a droplist with 1 option now - Categories. If I click it I go to categories page. This is where I init them (if there are not categories) with a CSV or manually or both (just like in existing subflow), not during first import. Also after init, it checks if there are Other and ATM Withdrawals categories, if not - adds them. This is where I can set up categories budget, remove them and add them (Other and ATM Withdrawals are immutable though). After I click save, I get back to Budget page. From the Import Statement, the subflow with init categories is removed completely. if there were no init categories - the Import button is simply unavailable and there is a button in the center of the budget page - Init Categories, which leads to same categories page."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Initialize categories from the Budget page (Priority: P1)

A user who has no categories set up yet visits the Budget page. Instead of the normal budget view, they see a prominent "Init Categories" button in the center of the page. The Import button is grayed out/unavailable. Clicking "Init Categories" navigates them to a dedicated Categories page where they can upload a CSV file, manually add categories, or do both. After saving, "Other" and "ATM Withdrawal" categories are automatically ensured to exist. The user is redirected back to the Budget page where the Import button is now available.

**Why this priority**: Without categories, no budget tracking or importing is possible. This is the foundational flow that gates all other functionality.

**Independent Test**: Can be fully tested by navigating to the Budget page with zero categories, clicking "Init Categories", uploading a CSV or adding categories manually, saving, and verifying return to Budget page with Import enabled.

**Acceptance Scenarios**:

1. **Given** a user with no categories, **When** they visit the Budget page, **Then** they see a centered "Init Categories" button and the Import button is disabled/unavailable.
2. **Given** a user on the Categories page with no categories, **When** they upload a valid CSV, **Then** categories are created from the CSV and displayed in a list.
3. **Given** a user on the Categories page, **When** they manually add a category by name, **Then** the category appears in the list.
4. **Given** a user on the Categories page who has added categories but "Other" or "ATM Withdrawal" are missing, **When** they click Save, **Then** the system automatically adds the missing "Other" and/or "ATM Withdrawal" categories before saving.
5. **Given** a user who has just saved categories, **When** the save completes, **Then** they are navigated back to the Budget page and the Import button is now available.

---

### User Story 2 - Access Categories page via Settings gear (Priority: P2)

A user who already has categories set up wants to manage them. On the Budget page, they click a gear icon (settings button). A dropdown menu appears with a "Categories" option. Clicking it navigates them to the Categories page where they can view, edit budgets, add new categories, or remove existing ones.

**Why this priority**: This is the primary ongoing interaction path for managing categories after initial setup.

**Independent Test**: Can be fully tested by clicking the gear icon on the Budget page, selecting "Categories" from the dropdown, and verifying the Categories page loads with existing categories.

**Acceptance Scenarios**:

1. **Given** a user on the Budget page with categories initialized, **When** they click the gear icon, **Then** a dropdown menu appears with a "Categories" option.
2. **Given** the settings dropdown is open, **When** the user clicks "Categories", **Then** they are navigated to the Categories page showing all existing categories.
3. **Given** the settings dropdown is open, **When** the user clicks outside the dropdown, **Then** the dropdown closes.

---

### User Story 3 - Manage categories on the Categories page (Priority: P2)

A user on the Categories page can edit monthly budgets for any category, add new categories, and remove categories that have no associated transactions. "Other" and "ATM Withdrawal" categories cannot be removed or renamed (they are immutable). After making changes, clicking Save persists everything and navigates back to the Budget page.

**Why this priority**: Category management (budgets, adding, removing) is essential for accurate budget tracking and is the core purpose of the Categories page.

**Independent Test**: Can be fully tested by navigating to Categories, editing a budget value, adding a new category, removing an unused category, and verifying changes persist after save.

**Acceptance Scenarios**:

1. **Given** a user on the Categories page, **When** they edit a category's monthly budget, **Then** the new budget value is displayed and will be saved when they click Save.
2. **Given** a user on the Categories page, **When** they add a new category, **Then** it appears in the category list.
3. **Given** a user on the Categories page with a category that has no transactions, **When** they click remove on that category, **Then** the category is removed from the list.
4. **Given** a user on the Categories page, **When** they attempt to remove "Other" or "ATM Withdrawal", **Then** the remove action is not available for these categories (button hidden or disabled).
5. **Given** a user on the Categories page who has made changes, **When** they click Save, **Then** all changes are persisted and they are navigated back to the Budget page.

---

### User Story 4 - Import flow without category initialization (Priority: P1)

The Import Statement flow no longer includes a category initialization step. When a user with existing categories clicks Import, they go directly to file upload. The entire InitCategories subflow is removed from the import modal.

**Why this priority**: Simplifying the import flow by decoupling category setup is a core requirement of this feature.

**Independent Test**: Can be fully tested by opening the Import modal with categories already initialized and verifying the flow starts at file upload with no category setup step.

**Acceptance Scenarios**:

1. **Given** a user with categories initialized, **When** they click Import, **Then** the import modal opens directly to the file upload step (no category initialization).
2. **Given** a user with no categories, **When** they view the Budget page, **Then** the Import button is unavailable/disabled.

---

### Edge Cases

- What happens when a user tries to save with zero categories added? The system auto-adds "Other" and "ATM Withdrawal", resulting in two categories after save.
- What happens when CSV upload contains categories named "Other" or "ATM Withdrawal"? The system skips creating duplicates during the auto-ensure step.
- What happens when a user removes all manually-added categories, leaving only the immutable ones? This is a valid state — the user has two categories ("Other" and "ATM Withdrawal").
- What happens when the user navigates away from the Categories page without saving? Unsaved changes are discarded (no confirmation dialog for v1).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Budget page MUST display a gear icon settings button in a visible location.
- **FR-002**: Settings button MUST open a dropdown menu containing at least one option: "Categories".
- **FR-003**: Clicking "Categories" in the dropdown MUST navigate the user to a dedicated Categories page.
- **FR-004**: Categories page MUST support CSV upload for bulk category creation (same format as existing seed flow: Categories | Examples | Budget).
- **FR-005**: Categories page MUST support manual category addition by name and optional budget.
- **FR-006**: Categories page MUST support both CSV and manual addition in the same session.
- **FR-007**: After category initialization (CSV or manual), the system MUST automatically ensure "Other" and "ATM Withdrawal" categories exist, adding them if missing.
- **FR-008**: Categories page MUST allow editing monthly budget for any category.
- **FR-009**: Categories page MUST allow removing categories that have no associated transactions.
- **FR-010**: "Other" and "ATM Withdrawal" categories MUST be immutable — users cannot remove or rename them.
- **FR-011**: Clicking Save on the Categories page MUST persist all changes and navigate the user back to the Budget page.
- **FR-012**: The Import Statement flow MUST NOT include any category initialization step.
- **FR-013**: When no categories exist, the Import button on the Budget page MUST be disabled/unavailable.
- **FR-014**: When no categories exist, the Budget page MUST display a centered "Init Categories" button that navigates to the Categories page.
- **FR-015**: The "Init Categories" button and the settings gear "Categories" option MUST navigate to the same Categories page.
- **FR-016**: If CSV upload includes categories named "Other" or "ATM Withdrawal", the system MUST not create duplicates when auto-ensuring these categories.

### Key Entities

- **Category**: Represents a spending category with name, color, monthly budget, and immutability status (for "Other" and "ATM Withdrawal"). Categories can be created via CSV or manually.
- **Settings Menu**: A gear-icon dropdown on the Budget page providing access to configuration pages. Currently contains only "Categories" but designed to hold future options.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can initialize categories and return to the Budget page in under 2 minutes.
- **SC-002**: The Import button becomes available immediately after categories are saved.
- **SC-003**: "Other" and "ATM Withdrawal" categories are always present after any category save operation.
- **SC-004**: The import flow has zero category-related setup steps — users go directly to file upload.
- **SC-005**: All category management (add, remove, edit budget) can be performed from a single page.

## Assumptions

- The existing CSV seed format (Categories | Examples | Budget) is reused without changes.
- The existing category CRUD endpoints are reused; the change is primarily a frontend routing/flow reorganization.
- The Categories page is a new route, not a modal.
- Unsaved changes on the Categories page are discarded if the user navigates away (no confirmation dialog required for v1).
- The gear icon settings dropdown will be extensible for future settings options but only "Categories" is implemented now.
- The "Init Categories" centered button only appears when the category count is zero.
