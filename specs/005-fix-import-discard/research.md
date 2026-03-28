# Research: Fix Import Discard

**Feature**: 005-fix-import-discard
**Date**: 2026-03-28

## R1: Where to get the import ID in the SSE flow

**Decision**: The SSE `complete` event already contains `result.id` (the import UUID). Store it in the `useImportWithProgress` hook's state alongside the result. Expose it so the modal component can pass it to the discard call.

**Rationale**: No new API calls or backend changes needed. The ID is already available in the SSE response.

## R2: Discard on modal close

**Decision**: The `handleClose` function should also call discard if a preview is active (i.e., import ID exists and no confirm has happened). Same logic as handleDiscard.

**Rationale**: Closing the modal with X while a preview is showing is semantically the same as discarding.
