# Feature Specification: LLM Model Selector

**Feature Branch**: `012-llm-model-selector`
**Created**: 2026-03-29
**Status**: Draft
**Input**: User description: "Add LLM selector (between claude-sonnet-4-6 and claude-haiku-4-5) under the debug button. It will be the model used for all LLM calls. By default it's haiku."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Select LLM Model (Priority: P1)

A user opens the budget dashboard and wants to control which AI model is used for transaction categorization and other LLM-powered features. They click the Debug button to expand the debug panel, see a model selector showing the currently active model (defaulting to Haiku), and can switch to Sonnet for higher quality results when needed.

**Why this priority**: This is the core and only feature — without the selector, the feature has no value.

**Independent Test**: Can be fully tested by opening the debug menu, changing the model, and triggering an LLM operation (e.g., importing a statement) to verify the selected model is used.

**Acceptance Scenarios**:

1. **Given** the debug menu is closed, **When** the user clicks the Debug button, **Then** the debug panel expands showing a model selector alongside existing debug options.
2. **Given** the debug menu is open, **When** the user views the model selector, **Then** it displays the currently active model (Haiku by default).
3. **Given** the debug menu is open with Haiku selected, **When** the user selects Sonnet, **Then** the system immediately uses Sonnet for all subsequent LLM calls.
4. **Given** the user has selected Sonnet, **When** they trigger a categorization or PDF import, **Then** the system uses Sonnet for that operation.

---

### User Story 2 - Model Selection Persists During Session (Priority: P2)

A user selects Sonnet as their preferred model. As they navigate between pages and return to the budget dashboard, the model selection remains Sonnet for the duration of the session.

**Why this priority**: Without persistence, users would need to re-select the model every time the debug menu re-renders, which is frustrating.

**Independent Test**: Select a model, navigate away, return to the budget page, open the debug menu, and verify the selection is retained.

**Acceptance Scenarios**:

1. **Given** the user has selected Sonnet, **When** they navigate to another page and return to the budget dashboard, **Then** the debug menu still shows Sonnet as the active model.

---

### Edge Cases

- What happens if the currently selected model becomes unavailable (API error)? The system should proceed with normal error handling — no special fallback to the other model.
- What happens on a fresh page load / new session? The model resets to the default (Haiku).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a model selector within the debug menu showing the two available models: claude-haiku-4-5 and claude-sonnet-4-6.
- **FR-002**: The default selected model MUST be claude-haiku-4-5.
- **FR-003**: When the user selects a different model, all subsequent LLM operations MUST use the newly selected model.
- **FR-004**: The model selector MUST visually indicate which model is currently active.
- **FR-005**: The model selection MUST persist within the current browser session (surviving page navigations).
- **FR-006**: The model selector MUST be placed inside the existing debug menu panel, below the existing "Reset all data" button.

### Key Entities

- **LLM Model Setting**: The currently selected model identifier. Two allowed values: `claude-haiku-4-5` and `claude-sonnet-4-6`. Default: `claude-haiku-4-5`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can switch the active LLM model in under 3 seconds (two clicks: open debug menu, select model).
- **SC-002**: 100% of LLM operations use the user-selected model after switching.
- **SC-003**: Model selection survives page navigation within the same session.

## Assumptions

- This is a developer/power-user feature exposed only through the debug menu — no need for prominent UI placement.
- Only two models are supported initially; no need for a generic/extensible model list.
- The model selection does not need to persist across browser sessions (no local storage required, but acceptable if implemented).
- The existing backend already centralizes all LLM calls through a single model configuration — the feature leverages this.
