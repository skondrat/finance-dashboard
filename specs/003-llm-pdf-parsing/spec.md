# Feature Specification: LLM-Powered PDF Statement Parsing

**Feature Branch**: `003-llm-pdf-parsing`
**Created**: 2026-03-28
**Status**: Draft
**Input**: User description: "when importing a statement in Budget section, I want to use LLM to convert pdf statement into structured data that can be used further"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Import PDF Statement via LLM Extraction (Priority: P1)

A user uploads a PDF bank statement (e.g., Payoneer, Monobank, or any other bank) through the Budget section's "Import Statement" flow. Instead of relying on table-detection libraries that fail when PDFs lack proper table borders or merge all columns into a single string, the system sends the PDF content to an LLM which intelligently parses each transaction row into structured fields: date, description, amount, currency, and running balance.

**Why this priority**: This is the core feature. The current pdfplumber-based extraction fails on real-world Payoneer statements because columns are rendered as visual spacing rather than actual table cells, resulting in 0 transactions extracted. LLM-based parsing is the only reliable way to handle the variety of PDF layouts banks produce.

**Independent Test**: Can be fully tested by uploading a Payoneer PDF statement and verifying that all transactions appear in the preview table with correct dates, descriptions, amounts, currencies, and transaction types.

**Acceptance Scenarios**:

1. **Given** a user has a Payoneer PDF statement with ~90 transactions, **When** they upload it and select "Payoneer" as the source, **Then** all transactions are extracted and displayed in the preview table with correct date, description, amount, currency, and debit/credit type.
2. **Given** a user uploads a PDF where pdfplumber extracts rows as single-string cells (no column separation), **When** the system processes it, **Then** the LLM correctly splits each row into structured fields.
3. **Given** a user uploads a multi-page PDF statement, **When** the system processes it, **Then** transactions from all pages are extracted and combined into a single list.

---

### User Story 2 - Automatic Category Assignment Using LLM (Priority: P2)

After the LLM extracts structured transaction data from the PDF, the system uses the user's existing spending categories (seeded from categories.csv or previously created) to automatically suggest a category for each transaction. The LLM considers the transaction description and the available category list to make intelligent assignments.

**Why this priority**: Category assignment transforms raw transaction data into actionable budget insights. Without categories, transactions are just a list of charges; with them, users can see spending breakdowns by category.

**Independent Test**: Can be tested by uploading a PDF after seeding categories, and verifying that transactions like "IHERB.COM" are categorized as "Supplements", "MERCADONA" as "Groceries", "RYANAIR" as "Airplane Tickets", etc.

**Acceptance Scenarios**:

1. **Given** a user has seeded categories (e.g., Groceries, Supplements, Coffee shops, Airplane Tickets), **When** the PDF is processed and transactions are extracted, **Then** each transaction is assigned a suggested category from the user's category list.
2. **Given** a transaction description doesn't match any existing category, **When** the LLM processes it, **Then** it either assigns the closest reasonable category or marks it as uncategorized for the user to review.
3. **Given** a user reviews the categorized preview, **When** they disagree with a suggestion, **Then** they can override the category before confirming the import.

---

### User Story 3 - Source-Agnostic PDF Import (Priority: P3)

A user uploads a PDF from an unknown bank (not Payoneer, Monobank, or Millenium). Instead of requiring pre-configured column mappings, the LLM analyzes the PDF content and intelligently extracts transactions regardless of the specific bank format.

**Why this priority**: Eliminates the need to maintain per-bank configuration files. The LLM can adapt to any reasonable statement format, making the feature work for any bank the user might use.

**Independent Test**: Can be tested by uploading a PDF from a bank not in the pre-configured list and verifying transactions are extracted correctly.

**Acceptance Scenarios**:

1. **Given** a user selects "Other" as the source, **When** they upload a PDF statement from an unknown bank, **Then** the LLM extracts transactions with correct dates, descriptions, amounts, and currencies.
2. **Given** a PDF has a non-standard date format or column order, **When** the LLM processes it, **Then** it adapts to the format and produces correctly structured data.

---

### Edge Cases

- What happens when a PDF is password-protected? System should reject with a clear error message.
- What happens when a PDF contains no transaction data (e.g., a summary-only statement)? System should indicate that no transactions were found.
- What happens when the LLM misinterprets a transaction row (e.g., treats a running balance as an amount)? The preview step allows users to catch and discard bad imports.
- What happens when the PDF has transactions spanning multiple currencies? Each transaction should retain its original currency.
- How does the system handle amounts with different decimal/thousand separators (e.g., European "1.234,56" vs US "1,234.56")? The LLM should normalize amounts to a standard numeric format.
- What happens if the LLM service is unavailable? System should return a clear error rather than an empty result.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST use an LLM to extract structured transaction data from uploaded PDF statements, replacing unreliable table-detection approaches for PDFs where column boundaries are not machine-readable.
- **FR-002**: System MUST extract the following fields from each transaction row: date, description, amount, currency, and transaction type (debit/credit).
- **FR-003**: System MUST handle multi-page PDF statements, combining transactions from all pages into a single ordered list.
- **FR-004**: System MUST present extracted transactions in a preview table before the user confirms the import, allowing them to review and override categories.
- **FR-005**: System MUST assign spending categories to extracted transactions using the user's existing category list.
- **FR-006**: System MUST support PDF statements up to 10 MB in size.
- **FR-007**: System MUST reject password-protected PDFs with a user-friendly error message.
- **FR-008**: System MUST return a clear error message if the LLM fails to extract any transactions from a PDF.
- **FR-009**: System MUST normalize extracted dates to a standard format (YYYY-MM-DD) regardless of the source format (e.g., "27 Mar, 2026", "03/27/2026", "27.03.2026").
- **FR-010**: System MUST normalize extracted amounts to standard decimal format, handling various thousand/decimal separator conventions.
- **FR-011**: System MUST determine debit/credit type from the amount sign (negative = debit, positive = credit) when no explicit type column exists.
- **FR-012**: System MUST deduplicate transactions against previously imported records to prevent double-counting.

### Key Entities

- **Transaction**: A single financial operation extracted from the statement. Key attributes: date, description, amount, currency, type (debit/credit), category assignment.
- **Statement Import**: Represents a single upload session. Tracks source, file name, row count, duplicate count, and status (parsing/preview/confirmed/discarded).
- **Category**: A spending category defined by the user. Used for grouping and analyzing transactions.
- **Category Mapping**: A learned association between a transaction description and a category, built up over time from confirmed imports.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% or more of transactions in a well-formatted PDF statement are correctly extracted with accurate date, description, amount, and currency fields.
- **SC-002**: Users can complete a PDF import (upload through preview) in under 30 seconds for statements with up to 100 transactions.
- **SC-003**: 80% or more of transactions are assigned a reasonable category on first import when the user has seeded their category list.
- **SC-004**: The system successfully extracts transactions from PDF statements of at least 3 different bank formats without requiring per-bank configuration changes.
- **SC-005**: Zero silent failures: every import attempt results in either a populated preview table or a clear error message explaining what went wrong.

## Assumptions

- The user has an active LLM API key configured in the system (Anthropic API).
- PDF statements follow a generally tabular layout with recognizable transaction rows (date, description, amount pattern), even if not machine-readable as table cells.
- The existing import UI flow (upload, source selection, preview, confirm/discard) is preserved; only the backend extraction mechanism changes.
- The existing categorization service and category mapping persistence are reused.
- The user's category list is populated (via seed CSV or manual creation) before import for best categorization results.
- LLM costs per import are acceptable to the user (typically a few cents per statement).
