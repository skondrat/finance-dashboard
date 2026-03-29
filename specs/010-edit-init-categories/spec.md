# Feature Specification: Edit Init Categories

**Feature Branch**: `010-edit-init-categories`
**Created**: 2026-03-29
**Status**: Draft
**Input**: User description: "Here at the step when I import init categories in Budget, I want to be able (after it gets inited with a csv) to modify budget and to remove the category out of the list."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edit Budget Amount Inline (Priority: P1)

A user uploads a categories CSV during the Init Categories step. After the categories appear in the list, the user notices that some budget amounts need adjustment. They click on a budget value in the list and edit it directly -- changing the amount or clearing it. The updated value is saved and reflected immediately in the list.

**Why this priority**: Budget amounts from the CSV may not be accurate or up-to-date. Users need the ability to correct budgets before proceeding with their first import, since budgets drive spending tracking on the Budget page.

**Independent Test**: Can be fully tested by uploading a CSV with budget amounts, clicking on a budget value in the categories list, changing it, and verifying the new value persists in the list.

**Acceptance Scenarios**:

1. **Given** categories have been loaded from a CSV with budget amounts, **When** the user clicks on a budget value in the list, **Then** the value becomes editable inline.
2. **Given** a budget value is in edit mode, **When** the user enters a new numeric value and confirms (blur or Enter), **Then** the budget is updated and the list reflects the new amount.
3. **Given** a budget value is in edit mode, **When** the user clears the field and confirms, **Then** the budget is removed (shown as a dash) for that category.
4. **Given** a category was added without a budget (shown as a dash), **When** the user clicks on the dash, **Then** they can enter a budget amount.
5. **Given** a budget value is in edit mode, **When** the user presses Escape, **Then** the edit is cancelled and the original value is restored.

---

### User Story 2 - Remove Category from List (Priority: P1)

After uploading a CSV, the user sees categories they don't want. They click a remove/delete button on a category row, and the category is removed from the list. This prevents unwanted categories from being created when the user proceeds to import.

**Why this priority**: Equally important as budget editing -- CSV files may contain categories the user doesn't need, and there's currently no way to remove them before committing to the import flow.

**Independent Test**: Can be tested by uploading a CSV, clicking the remove button on a category, and verifying it disappears from the list and is not present after proceeding.

**Acceptance Scenarios**:

1. **Given** categories have been loaded from a CSV, **When** the user clicks the remove button on a category row, **Then** the category is removed from the list immediately.
2. **Given** a category was manually added, **When** the user clicks the remove button on it, **Then** the category is removed from the list.
3. **Given** all categories have been removed, **When** the user views the Init screen, **Then** the "Continue to Import" button is disabled.
4. **Given** a category has been removed, **When** the user re-uploads a CSV containing that category, **Then** the category reappears in the list.

---

### Edge Cases

- What happens when the user removes all categories? The "Continue to Import" button should be disabled, matching existing behavior that requires at least one category.
- What happens when the user edits a budget to a non-numeric value? The input should only accept valid numeric values; invalid input is rejected.
- What happens when the user edits a budget to a negative number? Negative values should be rejected since budgets represent spending limits.
- What happens when the user tries to remove a category while a save is in progress? The remove action should be disabled or queued until the current operation completes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a remove/delete control on each category row in the Init Categories list.
- **FR-002**: System MUST allow the user to click on a budget value (or dash) in the Init Categories list to edit it inline.
- **FR-003**: System MUST accept valid numeric values (zero or positive) for budget edits and reject non-numeric or negative input.
- **FR-004**: System MUST persist budget changes when the user confirms the edit (via blur or pressing Enter).
- **FR-005**: System MUST cancel budget edits when the user presses Escape, restoring the original value.
- **FR-006**: System MUST remove the category from the list and from the system when the user clicks the remove control.
- **FR-007**: System MUST disable the "Continue to Import" button when no categories remain after removals.
- **FR-008**: System MUST allow both CSV-loaded and manually-added categories to be edited and removed using the same controls.

### Key Entities

- **Category**: A spending category with a name and optional monthly budget amount. Can be created via CSV upload or manual entry. Budget can be edited and the category can be removed during the Init step.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can modify any category's budget amount within the Init Categories list in under 5 seconds per edit.
- **SC-002**: Users can remove any unwanted category from the Init Categories list with a single click.
- **SC-003**: 100% of budget edits are reflected immediately in the list without requiring a page reload.
- **SC-004**: The "Continue to Import" button correctly reflects category count -- disabled when empty, enabled when at least one category exists.

## Assumptions

- This feature applies only to the Init Categories step within the Import Statement modal, not to categories on the main Budget page.
- Budget edits and removals are persisted to the server immediately (not batched), consistent with how manual category addition currently works.
- The remove action does not require a confirmation dialog, since the user can re-upload the CSV or manually re-add the category.
- The existing category list table layout can accommodate an additional remove control column without significant layout changes.
