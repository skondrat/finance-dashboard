# Implementation Plan: Portfolio Account List & Delete

**Branch**: `020-portfolio-account-list` | **Date**: 2026-03-29 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/020-portfolio-account-list/spec.md`

## Summary

Add a visible list of portfolio accounts in the sidebar Accounts section (below the "Add Account" button) and a delete capability with confirmation prompt. The backend delete endpoint already exists — this is frontend-only: add a `useDeleteAccount` query hook and build account list UI following the Networth accounts table pattern.

## Technical Context

**Language/Version**: TypeScript 5 (frontend only)
**Primary Dependencies**: Next.js 16, TanStack Query v5, Tailwind CSS v4
**Storage**: N/A (backend unchanged — delete endpoint already exists)
**Testing**: Visual verification via Playwright MCP
**Target Platform**: Web browser (desktop + mobile)
**Project Type**: Web application (frontend only)
**Performance Goals**: N/A
**Constraints**: Must reuse existing `useAccounts()` data, no extra API calls
**Scale/Scope**: 2 files modified, 0-1 new files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| I. Feature Delivery Workflow | PASS | Following full speckit pipeline |
| II. Combine Small Related Features | PASS | List + delete combined in one spec |
| III. Always Test with Browser | PASS | Will verify with Playwright |
| IV. Ideas Tracking | N/A | Not from ideas.md backlog |
| V. Git Hygiene | PASS | Branch created from latest main |
| VI. Keep It Simple | PASS | Frontend-only; skipping data-model.md and contracts/ |

No violations. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/020-portfolio-account-list/
├── plan.md              # This file
├── research.md          # Existing code analysis
├── quickstart.md        # Implementation guide
└── tasks.md             # (Phase 2 — /speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
└── src/
    ├── app/
    │   └── (dashboard)/
    │       └── portfolio/
    │           └── page.tsx              # Add account list to sidebar section
    ├── components/
    │   └── portfolio/
    │       └── add-account-modal.tsx     # Existing — may extend or keep as-is
    └── lib/
        └── queries/
            └── accounts.ts              # Add useDeleteAccount hook
```

**Structure Decision**: Modify existing frontend files. The account list UI is small enough to live directly in `page.tsx` inline, or as a simple section within the existing Accounts sidebar div. No new component file needed unless the list+delete logic grows complex.
