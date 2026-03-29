# Implementation Plan: Portfolio Layout — Full-Width KPI Strip

**Branch**: `019-portfolio-layout-fullwidth` | **Date**: 2026-03-29 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/019-portfolio-layout-fullwidth/spec.md`

## Summary

Move the KPI metric strip to span the full page width on desktop by extracting it from the 8-column main content column and placing it as a full-width (12-column) element above the existing 8/4 two-column split. The Accounts section remains in the 4-column sidebar, now starting at the same level as the Performance chart instead of next to the KPI strip.

## Technical Context

**Language/Version**: TypeScript 5 (frontend only)
**Primary Dependencies**: Next.js 16, Tailwind CSS v4
**Storage**: N/A (no data changes)
**Testing**: Visual verification via Playwright MCP
**Target Platform**: Web browser (desktop >=1024px, tablet, mobile)
**Project Type**: Web application (frontend only)
**Performance Goals**: N/A (layout-only change)
**Constraints**: Must not alter mobile/tablet stacking behavior
**Scale/Scope**: Single file change (`portfolio/page.tsx`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| I. Feature Delivery Workflow | PASS | Following full speckit pipeline |
| II. Combine Small Related Features | N/A | Single feature |
| III. Always Test with Browser | PASS | Will verify with Playwright after implementation |
| IV. Ideas Tracking | N/A | Not from ideas.md backlog |
| V. Git Hygiene | PASS | Branch created from main |
| VI. Keep It Simple | PASS | Frontend-only; skipping data-model.md and contracts/ |

No violations. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/019-portfolio-layout-fullwidth/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Layout approach analysis
├── quickstart.md        # Implementation guide
└── tasks.md             # (Phase 2 — /speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
└── src/
    └── app/
        └── (dashboard)/
            └── portfolio/
                └── page.tsx    # Only file modified
```

**Structure Decision**: Single file change in the existing frontend structure. No new files, components, or directories needed.
