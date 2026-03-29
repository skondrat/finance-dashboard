# Tasks: Portfolio Account List & Delete

**Input**: Design documents from `/specs/020-portfolio-account-list/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, quickstart.md

**Tests**: Not requested — visual verification via Playwright MCP.

**Organization**: Two user stories — US1 (account list) depends on foundational hook; US2 (delete) builds on US1.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: Foundational

**Purpose**: Add the delete mutation hook needed by US2 (and useful for US1 to set up the queries file)

- [x] T001 Add `useDeleteAccount` mutation hook in `frontend/src/lib/queries/accounts.ts` — follow the pattern of `useCreateAccount` in the same file and `useDeleteNetworthAccount` in `frontend/src/lib/queries/networth.ts`. Use `DELETE /api/v1/accounts/{id}`, invalidate `["accounts"]` and `["portfolio-summary"]` queries on success.

**Checkpoint**: Delete hook available for use by UI components.

---

## Phase 2: User Story 1 - View Account List in Sidebar (Priority: P1)

**Goal**: Show existing portfolio accounts (name + type) below the "Add Account" button in the sidebar Accounts section.

**Independent Test**: Open Portfolio page with accounts. Verify each account appears listed with its name and type below the "Add Account" button.

- [x] T002 [US1] Add account list to the Accounts sidebar section in `frontend/src/app/(dashboard)/portfolio/page.tsx` — import `useAccounts` from `@/lib/queries/accounts`, render each account below `<AddAccountModal />` showing name and type. If no accounts, render nothing extra. Style consistently with `frontend/src/components/networth/accounts-table.tsx` (compact rows, monospace type label).

**Checkpoint**: Account list visible in sidebar. Each account shows name and type.

---

## Phase 3: User Story 2 - Delete an Account (Priority: P2)

**Goal**: Allow users to delete accounts from the sidebar list with a confirmation prompt.

**Independent Test**: Click delete (×) button on an account → confirm → account disappears from list and Positions filter tabs.

- [x] T003 [US2] Add delete button and confirmation to each account row in `frontend/src/app/(dashboard)/portfolio/page.tsx` — add a × button to each account row (from T002), wire it to `useDeleteAccount` from T001 with `window.confirm("Delete account '{name}' and all its transactions?")` before calling mutate. Handle the edge case where the deleted account is currently selected in PositionsList by resetting `selectedAccountId` to undefined.

**Checkpoint**: Full delete flow works — confirm → account removed from list and Positions tabs. Cancel → no change. Deleting selected account resets to Aggregated view.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Foundational)**: No dependencies — start immediately.
- **Phase 2 (US1)**: Can start after Phase 1 (needs queries file set up).
- **Phase 3 (US2)**: Depends on Phase 1 (delete hook) and Phase 2 (account list UI).

### Parallel Opportunities

- T001 is independent — can start immediately.
- T002 depends on `useAccounts` (already exists) — can start immediately in parallel with T001.
- T003 depends on both T001 and T002.

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Complete T001: Add delete hook
2. Complete T002: Add account list to sidebar
3. **VALIDATE**: Verify accounts visible in sidebar

### Full Feature

4. Complete T003: Add delete buttons with confirmation
5. **VALIDATE**: Full delete flow via Playwright MCP
6. Commit and push

---

## Notes

- Backend delete endpoint already exists at `DELETE /api/v1/accounts/{account_id}`
- `useAccounts()` hook already exists — no new fetch needed for the list
- Reference pattern: `frontend/src/components/networth/accounts-table.tsx` for styling
- 2 files modified total: `accounts.ts` (add hook) + `page.tsx` (add list + delete UI)
