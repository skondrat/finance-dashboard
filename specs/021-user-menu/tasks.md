# Tasks: User Menu

**Input**: Design documents from `/specs/021-user-menu/`
**Prerequisites**: plan.md (required), spec.md (required)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Exact file paths included in descriptions

---

## Phase 1: User Story 1 — View Current User Identity (Priority: P1) 🎯 MVP

**Goal**: Logged-in user sees their initials in the avatar and their full name/email in a dropdown menu.

**Independent Test**: Log in → avatar shows correct initials → click avatar → dropdown shows name and email.

### Implementation for User Story 1

- [x] T001 [US1] Create UserMenu component with avatar button displaying user initials (derived from display_name or email fallback) in frontend/src/components/layout/user-menu.tsx
- [x] T002 [US1] Add dropdown panel to UserMenu with open/close state, click-outside dismiss, and Escape key handling in frontend/src/components/layout/user-menu.tsx
- [x] T003 [US1] Display user's full name and email in the dropdown header section in frontend/src/components/layout/user-menu.tsx

**Checkpoint**: UserMenu component renders avatar initials and opens a dropdown showing user identity.

---

## Phase 2: User Story 2 — Log Out (Priority: P1)

**Goal**: User can log out via the dropdown menu, clearing tokens and redirecting to login page.

**Independent Test**: Open user menu → click "Log out" → tokens cleared from memory/localStorage → redirected to /login → cannot access dashboard without re-authenticating.

### Implementation for User Story 2

- [x] T004 [US2] Add "Log out" button to UserMenu dropdown that calls auth store logout and redirects to /login in frontend/src/components/layout/user-menu.tsx

**Checkpoint**: Full logout flow works end-to-end from the dropdown.

---

## Phase 3: Integration

**Purpose**: Wire UserMenu into the application layout.

- [x] T005 Replace static avatar div with UserMenu component in frontend/src/components/layout/top-bar.tsx

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (US1)**: No dependencies — can start immediately
- **Phase 2 (US2)**: Depends on T002 (dropdown must exist to add logout button)
- **Phase 3 (Integration)**: Depends on T001–T004 (component must be complete before wiring into TopBar)

### Within User Story 1

- T001 (avatar trigger) → T002 (dropdown behavior) → T003 (identity display)
- Sequential: each task builds on the previous within the same component

### Parallel Opportunities

- T001–T003 are sequential (same file, each builds on prior)
- T004 depends on T002 (needs dropdown)
- T005 depends on T004 (needs complete component)
- Limited parallelism due to single-component scope — this is expected for a small feature

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001–T003: UserMenu with identity display
2. Wire into TopBar (T005 can be done early for visual testing)
3. **VALIDATE**: Avatar shows initials, dropdown shows name/email

### Full Delivery

1. T001–T003: Identity display (US1)
2. T004: Logout button (US2)
3. T005: TopBar integration
4. Browser verification via Playwright MCP
