# Quickstart: User Menu

**Feature**: 021-user-menu | **Date**: 2026-03-29

## What This Feature Does

Adds a user menu dropdown to the top navigation bar. The avatar button (currently showing a static "U") will display the logged-in user's initials. Clicking it opens a dropdown showing the user's name/email and a logout button.

## Files to Create

| File | Purpose |
|------|---------|
| `frontend/src/components/layout/user-menu.tsx` | UserMenu component with avatar trigger + dropdown |

## Files to Modify

| File | Change |
|------|--------|
| `frontend/src/components/layout/top-bar.tsx` | Replace static avatar div with `<UserMenu />` component |

## Key Integration Points

- **Auth store** (`frontend/src/stores/auth-store.ts`): Read `user` for display name/email/initials, call `logout()` on sign out
- **Next.js router**: `useRouter()` for redirect to `/login` after logout
- **Design tokens** (`frontend/src/app/globals.css`): Use `surface-container-lowest`, `on-surface`, `outline-variant` for dropdown styling

## How to Verify

1. Start frontend dev server: `cd frontend && npm run dev`
2. Log in with a test account
3. Verify avatar shows user's initials (not static "U")
4. Click avatar → dropdown appears with name/email + "Log out"
5. Click "Log out" → tokens cleared, redirected to `/login`
6. Try navigating back to a dashboard page → should be redirected to `/login`
