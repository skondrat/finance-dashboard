# Implementation Plan: Networth Month Selector

**Branch**: `077-networth-month-selector` | **Date**: 2026-05-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/077-networth-month-selector/spec.md`

## Summary

Add a month/year selector to the Networth page that drives only the accounts table below. Top KPI cards and the historical line chart stay locked to "latest." For past months, the table renders rows from that month's snapshot breakdown and lets the user inline-edit each account's recorded balance — persisting back to the snapshot only, never to the live account. Add/Edit/Delete account controls are hidden for past months. Future months are not selectable. Months with no snapshot show an empty state pointing at the existing "Import previous networth" flow.

This is a **frontend-only** feature. The backend already exposes everything we need: `GET /networth/history` returns all snapshots with their per-account breakdowns, and `PATCH /networth/snapshots/{id}` persists updates to a snapshot's breakdown and total. No new endpoints, no schema changes.

## Technical Context

**Language/Version**: TypeScript 5 (frontend only — no backend changes)
**Primary Dependencies**: Next.js 16, TanStack Query v5, Zustand, Tailwind CSS v4
**Storage**: N/A (reads existing `networth_snapshots` table via existing endpoints)
**Testing**: Manual browser verification with Playwright MCP per Constitution III
**Target Platform**: Web (desktop + mobile responsive)
**Project Type**: Web app (frontend-only change)
**Performance Goals**: Switching months redraws the table in <2s perceived (SC-001); editing a past balance persists in <30s end-to-end (SC-002)
**Constraints**: Must reuse existing endpoints; selected month must persist within session via `sessionStorage` (matches Budget page convention)
**Scale/Scope**: One page (`/networth`), ~3 new/modified components, ~1 modified hook

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance |
|-----------|------------|
| I. Feature Delivery Workflow | Following spec → plan → tasks → implement → test → commit → PR → merge |
| II. Combine Small Related Features | N/A — single feature |
| III. Always Test with Browser | Will run Playwright MCP after implementation to verify all P1/P2 acceptance scenarios |
| IV. Ideas Tracking | Will check `ideas.md` for matching backlog item and strikethrough on merge |
| V. Git Hygiene | Branch already cut from main; will commit, push, PR, merge |
| VI. Keep It Simple | Frontend-only; no `data-model.md` or `contracts/` artifacts (per VI: skip steps that add no value for trivial changes). Reuses existing endpoints — no new API surface |

**Result**: All gates pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/077-networth-month-selector/
├── plan.md              # This file
├── research.md          # Phase 0 — design decisions
├── quickstart.md        # Phase 1 — manual verification steps
├── spec.md              # Feature specification
└── checklists/
    └── requirements.md  # Spec quality checklist (already passed)
```

No `data-model.md` (no schema/entity changes) and no `contracts/` directory (no new endpoints) per Constitution principle VI.

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── app/(dashboard)/networth/
│   │   └── page.tsx                          # MODIFIED — month selector state, conditional rendering
│   └── components/networth/
│       ├── month-selector.tsx                # NEW — month + year dropdowns
│       ├── accounts-table.tsx                # MODIFIED — accept selectedMonth prop, branch live vs historical
│       ├── historical-accounts-table.tsx     # NEW (or merged into accounts-table.tsx) — renders breakdown rows with inline edit that hits useUpdateSnapshot
│       └── add-account-modal.tsx             # UNCHANGED
└── (no backend changes)
```

**Structure Decision**: Frontend-only. The page component (`networth/page.tsx`) gains a `selectedMonth`/`selectedYear` piece of state (sessionStorage-backed). The accounts table receives the selection as a prop and either renders the existing live behavior (when current month is selected) or a historical view (when a past month is selected). The historical view is small enough to live inside `accounts-table.tsx` as a sibling render branch — we'll decide between "single file" vs. "split file" during implementation based on resulting size, but the default is to keep it in one file for locality.

## Complexity Tracking

> **No constitution violations.** Section intentionally empty.
