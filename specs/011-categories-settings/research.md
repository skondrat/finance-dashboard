# Research: Categories Settings Page

**Branch**: `011-categories-settings` | **Date**: 2026-03-29

## Decision 1: Categories Page Route

**Decision**: Create a new route at `/(dashboard)/budget/categories/page.tsx`

**Rationale**: Keeping it under `/budget/` maintains the information hierarchy — categories are a budget concept. The `(dashboard)` layout group provides the shared TopBar and AuthGuard. Using a nested route under `/budget/` keeps navigation scope clear.

**Alternatives considered**:
- `/(dashboard)/categories/` — Too top-level for something that's budget-specific
- `/(dashboard)/settings/categories/` — Premature; settings page doesn't exist yet

## Decision 2: Ensure Required Categories (Other + ATM Withdrawal)

**Decision**: Add a new backend endpoint `POST /budget/categories/ensure-required` that creates "Other" and "ATM Withdrawal" if they don't exist for the user. Call this from the frontend Save action.

**Rationale**: Keeps business logic on the server. The frontend Save button calls this endpoint, then navigates back. This is more reliable than the frontend checking and creating individually, and it's atomic.

**Alternatives considered**:
- Frontend-driven: Check and create missing categories via individual POST calls — Race conditions possible, more network calls, business logic leaks to frontend
- Hook into existing seed endpoint — Would couple seed CSV flow with ensure-required logic unnecessarily

## Decision 3: Immutability of Other + ATM Withdrawal

**Decision**: Determine immutability by checking category name against a hardcoded list (`["Other", "ATM Withdrawal"]`) on the frontend. No schema change needed.

**Rationale**: The Category model has no `is_immutable` flag. Adding one would require a migration and retroactive data fix for existing users. Since there are only 2 immutable categories and they're known by name, a frontend check is sufficient and simpler. The backend already prevents deletion of categories with transactions (409 error), providing a safety net.

**Alternatives considered**:
- Add `is_immutable` column to Category model — Requires migration, data backfill, more backend changes. Overkill for 2 known categories
- Backend enforcement on delete endpoint — Could add, but frontend hiding the button is sufficient UX

## Decision 4: Categories Page UX Mode

**Decision**: Single unified page that shows CSV upload area + manual add when no categories exist (init mode), and hides CSV upload when categories already exist (manage mode). The list, budget editing, add, and remove controls are always visible.

**Rationale**: The user described init as something that happens "if there are not categories." Once categories exist, the primary interaction is management (edit budgets, add/remove). CSV upload is a bulk init tool, not an ongoing management feature. This matches the existing InitCategories component behavior.

**Alternatives considered**:
- Always show CSV upload — Confusing UX when categories already exist; CSV re-upload could conflict with existing categories
- Separate init and manage pages — Unnecessary complexity for a single feature

## Decision 5: Save Behavior

**Decision**: Individual operations (add category, remove category, edit budget) hit the API immediately. The "Save" button triggers the ensure-required endpoint and navigates back. No batching.

**Rationale**: The existing InitCategories component already uses immediate API calls (POST to create, PATCH to update budget, DELETE to remove). This pattern is proven and simple. The Save button's primary job is to ensure required categories exist and signal "I'm done."

**Alternatives considered**:
- Batch all changes locally, submit on Save — Major frontend complexity (tracking adds/removes/edits in local state, conflict resolution). Existing pattern works well.

## Decision 6: Budget Page Empty State

**Decision**: When no categories exist, show a centered empty state with "Init Categories" button. Hide the normal budget content (KPI strip, category table, income manager). Keep the gear icon visible in the top-right area. The Import button in the right column is hidden (not just disabled).

**Rationale**: An empty budget page with zero data is not useful. A clean empty state with a clear call-to-action is better UX than showing empty tables and zero KPIs alongside a disabled Import button.

**Alternatives considered**:
- Show all budget UI with zeros + Init button — Cluttered, confusing, suggests the page is broken
- Disable Import but keep everything else — The user said "button in the center of the budget page" implying a prominent empty state
