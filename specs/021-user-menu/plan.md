# Implementation Plan: User Menu

**Branch**: `021-user-menu` | **Date**: 2026-03-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/021-user-menu/spec.md`

## Summary

Add a user menu dropdown to the existing avatar button in the top bar. The avatar shows the logged-in user's initials. Clicking it opens a dropdown displaying the user's full name/email and a "Log out" button. Logout clears client-side tokens and redirects to `/login`. Frontend-only change — no backend modifications needed.

## Technical Context

**Language/Version**: TypeScript 5 (frontend only)
**Primary Dependencies**: Next.js 16, React 19, Zustand (auth store), Tailwind CSS v4
**Storage**: N/A (reads from existing auth store)
**Testing**: Playwright MCP (browser-based manual verification)
**Target Platform**: Web (desktop browser)
**Project Type**: Web application (frontend)
**Performance Goals**: Menu opens in <100ms (client-side state, no network call)
**Constraints**: Must match Editorial Ledger design system tokens; no external UI libraries
**Scale/Scope**: 1 new component (UserMenu), 1 modified component (TopBar)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Feature Delivery Workflow | PASS | Following full pipeline |
| II. Combine Small Features | N/A | Single feature |
| III. Always Test with Browser | PLANNED | Will verify with Playwright MCP |
| IV. Ideas Tracking | PLANNED | Will update ideas.md if applicable |
| V. Git Hygiene | PASS | On feature branch from main |
| VI. Keep It Simple | PASS | Frontend-only, no unnecessary abstractions, skip data-model.md and contracts/ |

All gates pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/021-user-menu/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
frontend/src/
├── components/
│   └── layout/
│       ├── top-bar.tsx          # MODIFY — replace static "U" avatar with UserMenu component
│       └── user-menu.tsx        # CREATE — dropdown menu component
├── stores/
│   └── auth-store.ts            # READ ONLY — consume user + logout
└── app/
    └── globals.css              # READ ONLY — uses existing design tokens
```

**Structure Decision**: Single new component `user-menu.tsx` in the existing `components/layout/` directory. TopBar imports it in place of the static avatar div. No new directories, stores, or utilities needed.

## Design Decisions

### Dropdown Implementation

Build the dropdown with native React state (`useState` for open/close) and a click-outside handler (`useEffect` with document event listener). No need for a portal or external library — the top bar already has `z-50` and the dropdown will be positioned absolutely below the avatar.

### Avatar Initials Logic

Extract initials from `display_name` (first letter of first and last name) or fall back to first letter of `email`. Computed inline — no utility function needed for a single use.

### Logout Flow

1. Call `useAuthStore.getState().logout()` (clears tokens from memory + localStorage)
2. Call `router.push("/login")` to redirect
3. The existing `AuthGuard` will prevent re-access to protected routes

### Accessibility

- `button` element for the trigger with `aria-expanded` and `aria-haspopup="menu"`
- `role="menu"` on dropdown, `role="menuitem"` on logout button
- `Escape` key closes dropdown
- Click outside closes dropdown

## Complexity Tracking

No constitution violations. Table not needed.
