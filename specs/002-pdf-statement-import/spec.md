# Feature Specification: PDF Statement Import with Intelligent Categorization

**Feature Branch**: `002-pdf-statement-import`
**Created**: 2026-03-27
**Status**: Draft
**Input**: Import PDF bank statements with source selection, predefined column mappings for known sources, AI-powered mapping for unknown sources, and a learning categorization system that remembers description-to-category mappings.

## Clarifications

### Session 2026-03-27

- Q: What does the "Type" field represent in extracted transactions? → A: Debit/Credit (direction of money flow: incoming vs. outgoing)
- Q: What happens when AI service is unavailable during import? → A: Block import entirely (both known and "Other" sources)
- Q: How are initial categories bootstrapped before first import? → A: User provides a CSV file with column "Categories" (required) and optionally "Examples" (pipe-separated example descriptions per category)
- Q: Should description-to-category matching be case-sensitive? → A: Case-insensitive (e.g., "NETFLIX" and "Netflix" share one mapping)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Import PDF Statement from a Known Source (Priority: P1)

As a user, I want to upload a PDF bank statement and select its source (Payoneer, Monobank, or Millenium) so that the system extracts transactions using predefined column mappings for Date, Description, Amount, Currency, and Type.

**Why this priority**: This is the core import functionality. Without the ability to parse and extract transactions from known sources, no other feature (categorization, review) can work.

**Independent Test**: Can be fully tested by uploading a sample Payoneer PDF, selecting "Payoneer" as the source, and verifying that transactions appear with correct Date, Description, Amount, Currency, and Type fields.

**Acceptance Scenarios**:

1. **Given** I am on the import page, **When** I see the source selector, **Then** I can choose from Payoneer, Monobank, Millenium, or Other.
2. **Given** I select "Payoneer" and upload a valid Payoneer PDF statement, **When** the system processes the file, **Then** transactions are extracted with correct Date, Description, Amount, Currency, and Type using the Payoneer column mapping.
3. **Given** I select "Monobank" and upload a valid Monobank PDF statement, **When** the system processes the file, **Then** transactions are extracted using the Monobank column mapping.
4. **Given** I select "Millenium" and upload a valid Millenium PDF statement, **When** the system processes the file, **Then** transactions are extracted using the Millenium column mapping.
5. **Given** I upload an invalid or corrupted PDF, **When** the system attempts to parse it, **Then** a clear error message is displayed explaining the file could not be processed.

---

### User Story 2 - Automatic and Learning Transaction Categorization (Priority: P1)

As a user, I want my transactions to be automatically categorized based on their descriptions so that I don't manually categorize every transaction. The system should learn from my choices over time.

**Why this priority**: Categorization is essential for the dashboard to provide meaningful financial insights. The learning mechanism saves significant time on repeated imports.

**Independent Test**: Can be tested by importing a statement with both previously-seen and new transaction descriptions, verifying auto-categorization for known descriptions and AI-suggested categories for new ones.

**Acceptance Scenarios**:

1. **Given** a transaction description that exactly matches a previously saved mapping, **When** the transaction is processed, **Then** the system automatically assigns the saved category without calling AI.
2. **Given** a transaction description that has never been seen before, **When** the transaction is processed, **Then** the system uses AI to suggest a category, providing existing description-to-category mappings as examples in the prompt.
3. **Given** the AI suggests a category for a new description, **When** I review the import, **Then** I can accept the suggested category or change it to a different one.
4. **Given** I confirm the import (with or without category changes), **When** the import completes, **Then** the final category for each transaction description is saved to the persistent mapping file for future imports.
5. **Given** a transaction description has no match in the mapping file but matches an existing keyword rule, **When** the transaction is processed, **Then** the system assigns the category from the keyword rule without calling AI.

---

### User Story 3 - Review and Confirm Import (Priority: P1)

As a user, I want to review all extracted transactions with their assigned categories before confirming the import, so I can correct any errors before data is committed.

**Why this priority**: Data integrity is critical for a finance dashboard. Users must verify and correct before committing transactions.

**Independent Test**: Can be tested by completing an import to the review stage and verifying all transactions are displayed with editable categories and confirm/cancel actions.

**Acceptance Scenarios**:

1. **Given** transactions have been extracted and categorized, **When** I reach the review step, **Then** I see all transactions listed with Date, Description, Amount, Currency, Type, and assigned Category.
2. **Given** I am on the review screen, **When** I change a category for any transaction, **Then** the change is reflected immediately.
3. **Given** I have reviewed all transactions, **When** I confirm the import, **Then** all transactions are saved and all description-to-category mappings are updated with my final choices.
4. **Given** I am on the review screen, **When** I cancel the import, **Then** no transactions are saved and no category mappings are changed.

---

### User Story 4 - Import Statement from Unknown Source (Priority: P2)

As a user, I want to import a PDF statement from a source not in the predefined list by selecting "Other," so that the system uses AI to determine the column mapping automatically.

**Why this priority**: Extends the feature beyond the three known sources, making it flexible for any bank statement. Lower priority because users primarily use the known sources.

**Independent Test**: Can be tested by uploading a PDF from an unsupported bank with "Other" selected, verifying that AI identifies and maps columns correctly.

**Acceptance Scenarios**:

1. **Given** I select "Other" as the source and upload a PDF, **When** the system processes the file, **Then** AI determines the mapping of columns to Date, Description, Amount, Currency, and Type.
2. **Given** AI identifies column mappings for an "Other" source, **When** the mapping is complete, **Then** the extracted transactions are displayed for review (same flow as known sources).
3. **Given** AI cannot confidently determine column mappings, **When** the attempt fails, **Then** a clear error message is displayed to the user.

---

### User Story 5 - Upload Seed Categories (Priority: P2)

As a user, I want to upload a CSV file with my initial set of categories (and optional example descriptions) so that the system has a starting vocabulary for AI categorization.

**Why this priority**: Without seed categories, the AI has no valid category set to choose from on the first import.

**Independent Test**: Can be tested by uploading a CSV with categories and verifying they appear in the category selector during import review.

**Acceptance Scenarios**:

1. **Given** I have a CSV file with a "Categories" column, **When** I upload it, **Then** all listed categories are created in the system.
2. **Given** my CSV also has an "Examples" column with pipe-separated descriptions, **When** I upload it, **Then** the example descriptions are pre-populated into the category mapping file as known mappings.
3. **Given** I upload a CSV missing the required "Categories" column, **When** the system processes the file, **Then** an error message is displayed stating "Missing required 'Categories' column."
4. **Given** I initiate my first import and no categories exist yet, **When** I start the import flow, **Then** the system prompts me to upload a seed categories CSV before proceeding.

---

### Edge Cases

- What happens when the PDF contains no recognizable transaction data (e.g., a cover page or summary-only statement)?
- What happens when the PDF is password-protected? → Rejected with error asking user to upload an unprotected version.
- What happens when a transaction has missing fields (e.g., no currency column or empty description)? → Rows with missing Description or Amount are skipped; skipped count shown in review.
- What happens when the AI service is unavailable? → Import is blocked entirely; user is informed AI connectivity is required.
- What happens when the category mapping file doesn't exist yet (first-ever import)? → Auto-created as empty with headers only.
- What happens when the PDF contains transactions in multiple currencies within one statement?
- What happens when the AI returns an invalid or empty category suggestion? → Transaction left uncategorized and flagged for user review.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a statement source selector with options: Payoneer, Monobank, Millenium, Other.
- **FR-002**: System MUST accept PDF file uploads for statement import, with a maximum file size of 10 MB.
- **FR-003**: System MUST extract transaction data (Date, Description, Amount, Currency, Type) from uploaded PDFs using predefined column mappings for known sources (Payoneer, Monobank, Millenium). The Type field (Debit/Credit) MUST be mapped to the sign of the Amount value during extraction: negative for debit (outgoing), positive for credit (incoming). No separate Type column is stored.
- **FR-004**: Predefined column mappings for each known source MUST be stored in a configurable file that can be updated without code changes. Each source mapping MUST include the debit/credit indicator values used by that source (e.g., `"debit_value": "D", "credit_value": "C"`) and optionally a table index for PDFs with multiple tables (default: first table).
- **FR-005**: When "Other" is selected as the source, the system MUST use AI to automatically determine the column-to-field mapping from the PDF content. The AI response MUST contain all 5 required field mappings (Date, Description, Amount, Currency, Type) in a parseable format; otherwise the import MUST fail with an error.
- **FR-006**: System MUST maintain a persistent file that stores the mapping of transaction descriptions to categories. If the file does not exist, the system MUST auto-create it as an empty file with headers only.
- **FR-007**: When a transaction description matches a previously categorized description (case-insensitive), the system MUST automatically assign the saved category without invoking AI.
- **FR-008**: When a transaction description is encountered for the first time, the system MUST use AI to suggest a category, including up to 50 existing description-to-category mappings as few-shot examples in the prompt (most recently added first).
- **FR-009**: System MUST present all extracted and categorized transactions to the user for review in a scrollable table before final import.
- **FR-010**: Users MUST be able to change the assigned category for any transaction during the review step.
- **FR-011**: Upon import confirmation, the system MUST save the final category for each transaction description to the persistent mapping file for future use. If a description already exists in the mapping file, the new category MUST overwrite the previous one.
- **FR-012**: The AI service MUST be configured via an API key stored in an environment configuration file, with a configurable default model.
- **FR-013**: System MUST display error messages that include: (a) the error type (e.g., "Invalid PDF", "AI service unavailable"), and (b) a suggested user action (e.g., "Upload a valid PDF file", "Check your API key and try again").
- **FR-014**: When the AI service is unavailable and AI calls are needed (new descriptions without existing mappings, or "Other" source column mapping), the system MUST block the import and inform the user that AI connectivity is required. If all transaction descriptions already have known mappings and the source is not "Other", the import MAY proceed without AI.
- **FR-015**: System MUST support loading an initial category set from a user-provided CSV file with a required "Categories" column and an optional "Examples" column (pipe-separated example descriptions per category). If no categories exist in the system when a user initiates their first import, the system MUST prompt the user to upload a seed categories CSV before proceeding.
- **FR-016**: When AI categorizes new descriptions, it MUST constrain suggestions to categories from the loaded category set (CSV + any previously learned mappings). AI MUST NOT invent new category names outside this set. If AI returns a category not in the known set or returns an empty/unparseable response, the transaction MUST be left uncategorized and flagged for user review.
- **FR-017**: System MUST reject password-protected PDFs with an error message asking the user to upload an unprotected version.
- **FR-018**: When a transaction row has missing or empty required fields (Description or Amount), the system MUST skip that row. The total count of skipped rows MUST be displayed to the user in the review step.
- **FR-019**: AI calls MUST use a 30-second timeout per request with 1 automatic retry on timeout before treating the service as unavailable.
- **FR-020**: If the source mapping configuration file is missing or malformed, the system MUST display an error when a known source is selected, preventing the import from proceeding.
- **FR-021**: If the category mapping file is corrupted or unparseable, the system MUST log a warning, treat it as empty (no existing mappings), and recreate it on the next confirmed import.

### Key Entities

- **Statement**: An uploaded PDF file representing a financial statement from a specific source. Contains multiple transactions.
- **Transaction**: A single financial record extracted from a statement. Attributes: Date, Description, Amount, Currency, Type (Debit or Credit — indicating direction of money flow), Category.
- **Statement Source**: The financial institution that issued the statement (Payoneer, Monobank, Millenium, or Other). Determines which column mapping is used.
- **Column Mapping Configuration**: A definition of how columns in a specific source's statement map to the standard transaction fields (Date, Description, Amount, Currency, Type).
- **Category Mapping**: A persistent record linking a specific transaction description text to a spending/income category. Grows over time as new descriptions are encountered and categorized.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the full import workflow (upload, review, confirm) for a known-source statement in under 2 minutes for a typical statement (under 100 transactions).
- **SC-002**: 95% of transactions from known sources are extracted with correct field mapping on the first attempt, measured by comparing extracted values against a manually verified sample of 20 transactions per source.
- **SC-003**: Previously categorized transaction descriptions are auto-categorized with 100% accuracy (exact-match lookup).
- **SC-004**: AI-suggested categories for new transaction descriptions are accepted by users without change at least 80% of the time, measured as the percentage of AI-categorized transactions not modified by the user during the review step across all imports.
- **SC-005**: The category mapping grows over time, reducing AI calls needed per import by at least 50% after 5 imports from the same source, measured as the ratio of (AI calls / total transactions) comparing the 1st import to the 5th import.
- **SC-006**: Users can identify and correct miscategorized transactions before import confirmation with no more than one click per correction.

## Assumptions

- PDF statements from the three known sources (Payoneer, Monobank, Millenium) contain extractable text/table data (not scanned images requiring OCR).
- The three known sources have reasonably consistent statement formats that don't change frequently.
- A single PDF contains transactions from only one source.
- The initial category set is user-defined via a CSV file. AI suggestions are constrained to known categories from this set plus any previously learned mappings.
- The user has access to an AI service API key for AI-powered features.
- Duplicate detection across imports is out of scope for the initial version.
- The feature is for a single user — multi-user access control for the category mapping file is not required.
- The persistent category mapping file is initialized as empty on first use and grows with each import. For a single user, the file is not expected to grow beyond a manageable size (thousands of entries at most). No pruning mechanism is needed for v1.
