# Implementation Plan: Subscriptions

**Branch**: `024-subscriptions` | **Date**: 2026-03-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/024-subscriptions/spec.md`

## Summary

Add a Subscriptions tab with full CRUD (including cancel/reactivate), on-demand auto-detection of recurring expenses from imported statements, and payment source selection. Backend provides subscription CRUD, dismissed-suggestion tracking, and a detection endpoint that queries budget_transactions. Frontend adds a new route, subscription list with total monthly cost, suggestion cards, and add/edit modal.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5 (frontend)
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0, Alembic (backend); Next.js 16, React 19, TanStack Query, Zustand, Tailwind CSS v4 (frontend)
**Storage**: SQLite via SQLAlchemy (new `subscriptions` + `dismissed_suggestions` tables + Alembic migration)
**Testing**: Playwright MCP (browser-based verification)
**Target Platform**: Web (desktop browser)
**Project Type**: Web application (full-stack)
**Performance Goals**: Page load <1s, detection query <2s
**Constraints**: Must match Editorial Ledger design system; detection uses exact case-insensitive description matching
**Scale/Scope**: 2 new models, ~6 new endpoints, 1 new page route, 3 new components, 1 modified component (top-bar)

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Feature Delivery Workflow | PASS | Following full pipeline |
| II. Combine Small Features | N/A | Single feature |
| III. Always Test with Browser | PLANNED | Will verify with Playwright MCP |
| IV. Ideas Tracking | PLANNED | Will update ideas.md |
| V. Git Hygiene | PASS | On feature branch from main |
| VI. Keep It Simple | PASS | No over-engineering; detection is a simple SQL query |

## Project Structure

### Documentation (this feature)

```text
specs/024-subscriptions/
├── plan.md
├── research.md
├── data-model.md
├── contracts/
│   └── subscriptions-api.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── models/
│   │   └── subscription.py          # CREATE — Subscription + DismissedSuggestion models
│   ├── schemas/
│   │   └── subscription.py          # CREATE — request/response schemas
│   ├── api/
│   │   └── subscriptions.py         # CREATE — CRUD + detect + dismiss endpoints
│   └── services/
│       └── subscription_service.py  # CREATE — detection logic
├── alembic/
│   └── versions/
│       └── xxx_add_subscriptions.py # CREATE — migration

frontend/
├── src/
│   ├── app/
│   │   └── (dashboard)/
│   │       └── subscriptions/
│   │           └── page.tsx         # CREATE — subscriptions page
│   ├── components/
│   │   ├── layout/
│   │   │   └── top-bar.tsx          # MODIFY — add SUBSCRIPTIONS tab
│   │   └── subscriptions/
│   │       ├── subscription-list.tsx      # CREATE — active + cancelled list
│   │       ├── subscription-modal.tsx     # CREATE — add/edit form modal
│   │       └── suggestion-cards.tsx       # CREATE — auto-detected suggestion cards
│   └── lib/
│       └── queries/
│           └── subscriptions.ts     # CREATE — query hooks
```

## Design Decisions

### Detection Algorithm

Query `budget_transactions` grouped by LOWER(description) and month (STRFTIME('%Y-%m', date)), then find descriptions appearing in 2+ consecutive months. Run on-demand when user visits the subscriptions page. Filter out descriptions that match existing subscription names or dismissed suggestions.

### Subscription Lifecycle

Active → Cancel (soft-delete, kept in history) → Reactivate (back to active). Permanent Delete available from any state. Cancelled subscriptions shown in a collapsible "Cancelled" section.

### Monthly Cost Normalization

- Monthly: value as-is
- Yearly: value / 12
- Weekly: value × 4.33 (52 weeks / 12 months)

Computed on the frontend for display; not stored.

### Dismissed Suggestions

Separate lightweight table storing (user_id, description_hash) pairs. Simpler than adding status to a suggestions table since suggestions are computed on-the-fly, not persisted.

## Complexity Tracking

No constitution violations. Table not needed.
