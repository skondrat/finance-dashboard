# Tasks: Portfolio Layout — Full-Width KPI Strip

**Input**: Design documents from `/specs/019-portfolio-layout-fullwidth/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, quickstart.md

**Tests**: Not requested — visual verification via Playwright MCP.

**Organization**: Single user story (P1), single file change.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)
- Include exact file paths in descriptions

## Phase 1: User Story 1 - Full-Width KPI Strip on Desktop (Priority: P1)

**Goal**: Move `<KpiStrip />` out of the 8-column main content div so it spans the full 12-column page width. The Accounts section drops below the KPI strip in the sidebar.

**Independent Test**: Open Portfolio page at >=1024px width. KPI cards span full width. Accounts box appears below, in the sidebar column. Mobile layout unchanged.

### Implementation

- [x] T001 [US1] Move KpiStrip to full-width position in `frontend/src/app/(dashboard)/portfolio/page.tsx` — extract `<KpiStrip />` from the `lg:col-span-8` div and place it as a `col-span-12` element directly inside the 12-column grid, above both the main content and sidebar divs. Wrap in `<div className="col-span-12">` if KpiStrip doesn't accept className prop.

**Checkpoint**: KPI strip spans full width, Accounts section sits below it in sidebar, mobile stacking unchanged.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (US1)**: Single task, no dependencies — can start immediately.

### Parallel Opportunities

- None needed — single task.

---

## Implementation Strategy

### MVP (Complete Feature)

1. Complete T001: Move KpiStrip to col-span-12
2. **VALIDATE**: Visual verification via Playwright MCP at desktop and mobile widths
3. Commit and push

---

## Notes

- Single file change: `frontend/src/app/(dashboard)/portfolio/page.tsx`
- No component changes needed — only grid placement
- No backend changes
