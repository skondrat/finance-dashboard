# Feature Specification: Parallel Categorization with Import Progress

**Feature Branch**: `004-parallel-categorization-progress`
**Created**: 2026-03-28
**Status**: Draft
**Input**: User description: "I want suggest category to work not per each transaction but in parallel (not more than 10 at a time). also in the FE I want to have some indication of progress (e.g. at which stage is it now, how many transaction analyzing etc)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Faster PDF Import via Parallel Categorization (Priority: P1)

A user uploads a PDF bank statement with ~100 transactions. Currently, categorization happens one transaction at a time, each requiring an AI call, making the import take 5+ minutes. With this change, the system processes up to 10 categorization requests concurrently, reducing import time dramatically.

**Why this priority**: This is the core performance fix. Without parallel categorization, the import is unusably slow for statements with many transactions.

**Independent Test**: Upload a PDF with ~100 transactions. Verify the total import time is reduced by at least 5x compared to sequential processing (e.g., from ~5 minutes to under 1 minute).

**Acceptance Scenarios**:

1. **Given** a PDF with 100 transactions requiring AI categorization, **When** the user uploads it, **Then** the system processes categorization requests in batches of up to 10 concurrently, completing significantly faster than sequential processing.
2. **Given** one AI categorization request fails in a batch, **When** the batch completes, **Then** the failed transaction is marked as uncategorized and the remaining transactions in the batch are unaffected.
3. **Given** a PDF with 5 transactions (fewer than the concurrency limit), **When** the user uploads it, **Then** all 5 are categorized concurrently in a single batch without waiting.

---

### User Story 2 - Import Progress Indication in the UI (Priority: P2)

While a PDF import is processing, the user sees a progress indicator in the import modal showing what stage the import is at and how many transactions have been processed. This replaces the current "Processing..." button with a more informative status display.

**Why this priority**: Users need feedback that the system is working, especially during a multi-stage process that takes 30+ seconds. Without progress indication, users may think the import is stuck and refresh the page.

**Independent Test**: Upload a PDF and verify the UI shows: (1) the current processing stage (extracting, categorizing, saving), and (2) a count of how many transactions have been categorized out of the total.

**Acceptance Scenarios**:

1. **Given** a user has uploaded a PDF, **When** the system is extracting transactions from the PDF, **Then** the UI shows a status like "Extracting transactions..."
2. **Given** the system is categorizing transactions, **When** progress updates arrive, **Then** the UI shows something like "Categorizing: 30 / 100 transactions"
3. **Given** the system has finished categorization and is saving results, **When** the final stage begins, **Then** the UI shows "Preparing preview..."
4. **Given** the import completes successfully, **When** the preview is ready, **Then** the progress indicator is replaced by the transaction preview table with the transaction count.

---

### Edge Cases

- What happens if the AI service goes down mid-batch during categorization? Remaining transactions in-flight should complete or timeout gracefully; subsequent batches should not be dispatched; already-categorized transactions retain their results; uncategorized transactions are marked as such.
- What happens if the user closes the import modal while processing is in progress? The backend continues processing; if the user reopens, they see the current state (either still processing or the completed preview).
- What happens if the PDF has 0 transactions that need AI categorization (all matched by mapping file or keyword rules)? The categorization stage should complete instantly and the progress should skip to the final stage.
- What happens if the network connection drops during progress updates? The UI should show a reconnection message or gracefully degrade to "Processing..." without losing the import.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST categorize transactions concurrently with a maximum of 10 simultaneous AI requests.
- **FR-002**: The system MUST preserve the existing 3-step categorization resolution chain (mapping file match, keyword rule match, AI suggestion) — parallelism only applies to the AI suggestion step.
- **FR-003**: A failure in one concurrent categorization request MUST NOT affect other requests in the same batch or subsequent batches.
- **FR-004**: The system MUST report import progress to the frontend, including the current processing stage and the number of transactions processed.
- **FR-005**: The progress display MUST show at minimum three stages: extracting transactions, categorizing transactions (with count), and preparing preview.
- **FR-006**: The progress count during categorization MUST update as each transaction completes, not only at batch boundaries.
- **FR-007**: The system MUST maintain the same categorization quality and accuracy as the sequential approach — parallelism must not alter which category is assigned to any transaction.
- **FR-008**: The system MUST complete the import of a 100-transaction PDF in under 60 seconds (assuming normal AI service latency).

### Key Entities

- **Import Progress**: Represents the real-time state of an import operation. Attributes: current stage (extracting/categorizing/saving), total transaction count, categorized count, started timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Import of a 100-transaction PDF completes in under 60 seconds (down from 5+ minutes with sequential processing).
- **SC-002**: Users see progress updates at least every 3 seconds during categorization of a 100-transaction import.
- **SC-003**: 100% of transactions that would be categorized sequentially are also categorized in the parallel approach (no accuracy regression).
- **SC-004**: Users can see at a glance which stage the import is in and how much work remains, reducing perceived wait time.
- **SC-005**: Zero data loss if an individual categorization request fails — the transaction is imported as uncategorized.

## Assumptions

- The AI service (Anthropic API) supports at least 10 concurrent requests without rate limiting issues for this use case.
- The existing import endpoint remains synchronous from the frontend's perspective — progress is communicated via a polling or streaming mechanism within the same request lifecycle.
- The maximum concurrency of 10 is a reasonable default that balances speed with API rate limits; it does not need to be user-configurable.
- The backend is the sole source of progress state — the frontend only displays what the backend reports.
