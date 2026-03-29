# Research: User Menu

**Feature**: 021-user-menu | **Date**: 2026-03-29

## Research Summary

Minimal research needed — this is a frontend-only feature using existing infrastructure.

## Findings

### 1. Existing Auth Infrastructure

- **Decision**: Reuse existing `useAuthStore` from `frontend/src/stores/auth-store.ts`
- **Rationale**: Store already provides `user` (with `display_name` and `email`), `logout()`, and `isAuthenticated`. No new state management or API calls needed.
- **Alternatives considered**: Creating a dedicated user menu store — rejected as unnecessary; auth store already has everything needed.

### 2. Dropdown Implementation Approach

- **Decision**: Native React state + click-outside handler (no library)
- **Rationale**: The project uses no external UI component library (no shadcn/ui, Radix, Headless UI). A simple dropdown with `useState` + `useEffect` + `useRef` for click-outside is the simplest approach consistent with existing patterns (CurrencyToggle and ThemeToggle are also built with native React).
- **Alternatives considered**:
  - Headless UI `Menu` component — rejected to avoid adding a new dependency for one component.
  - CSS-only `:focus-within` dropdown — rejected for insufficient accessibility control.

### 3. Logout Redirect Strategy

- **Decision**: Client-side token clearing + `router.push("/login")`
- **Rationale**: Per spec clarification, logout is client-side only. The existing `AuthGuard` already redirects unauthenticated users to `/login`, but an explicit redirect provides better UX (immediate navigation vs. waiting for guard re-evaluation).
- **Alternatives considered**: Server-side token revocation — rejected per spec clarification session (2026-03-29) to keep implementation simple.

### 4. Design System Alignment

- **Decision**: Use existing Editorial Ledger design tokens for dropdown styling
- **Rationale**: The dropdown should use `bg-surface-container-lowest` for the panel, `text-on-surface` for text, `outline-variant` for borders, matching the existing top-bar aesthetic.
- **Alternatives considered**: None — the design system is well-established and the dropdown must match.

## Unresolved Items

None. All technical decisions are clear.
