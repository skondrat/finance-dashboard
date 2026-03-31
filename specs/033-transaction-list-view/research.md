# Research: Transaction List View

**Date**: 2026-03-31

## Findings

### 1. Existing Backend API

**Decision**: Reuse the existing `/api/v1/budget/transactions` GET endpoint.  
**Rationale**: Endpoint already supports pagination (`skip`, `limit`), `category_id` filter, and `from_date`/`to_date` range filters. No backend work needed.  
**Alternatives considered**: Creating a dedicated search endpoint — rejected because client-side description filtering on paginated results is sufficient for the expected data volume (< 500 transactions/month).

### 2. Frontend Query Hook

**Decision**: Use the existing `useBudgetTransactions()` TanStack Query hook.  
**Rationale**: Hook is already defined in `frontend/src/lib/queries/budget.ts` but unused in the Budget page. Wiring it up avoids duplication.  
**Alternatives considered**: Custom fetch — rejected, hook already handles caching and invalidation.

### 3. Category Row Click Navigation

**Decision**: Use Zustand store state to pass the selected category filter (not URL params).  
**Rationale**: The Budget page is a single page with tab-like sections. Using component state or a store avoids URL complexity and keeps the transaction list as a section within the page rather than a separate route.  
**Alternatives considered**: URL query params — viable but adds routing complexity for an in-page interaction.

### 4. Search Implementation

**Decision**: Client-side filtering on loaded transactions.  
**Rationale**: The typical page size (50-100 transactions) makes client-side string matching instant. Server-side search would require a new endpoint and adds latency for no benefit at this scale.  
**Alternatives considered**: Server-side search endpoint — overkill for current data volumes.

### 5. Pagination Strategy

**Decision**: Use server-side pagination via the existing API's `skip`/`limit` parameters with a page size of 50.  
**Rationale**: Keeps memory usage low and aligns with the existing API contract.  
**Alternatives considered**: Infinite scroll — more complex UX, simple pagination is sufficient.
