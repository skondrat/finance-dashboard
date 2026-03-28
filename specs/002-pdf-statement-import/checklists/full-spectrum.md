# Full-Spectrum Requirements Quality Checklist: PDF Statement Import

**Purpose**: Validate completeness, clarity, consistency, and coverage of all requirements before implementation
**Created**: 2026-03-27
**Feature**: [spec.md](../spec.md)
**Audience**: Author self-review + peer reviewer

## Requirement Completeness

- [x] CHK001 - Are requirements defined for handling password-protected PDFs? → FR-017 added [Spec §FR-017]
- [x] CHK002 - Is the maximum allowed PDF file size specified? → 10 MB limit added [Spec §FR-002]
- [x] CHK003 - Are requirements defined for when a transaction has missing or empty fields? → FR-018 added: skip rows, show count [Spec §FR-018]
- [x] CHK004 - Is the seed categories CSV loading trigger specified? → On first import if no categories exist [Spec §FR-015]
- [x] CHK005 - Are requirements defined for updating an existing description→category mapping? → Overwrite with latest [Spec §FR-011]
- [x] CHK006 - Is there a requirement for the first-ever import when mapping file doesn't exist? → Auto-create empty [Spec §FR-006]
- [x] CHK007 - Are requirements specified for when all transactions already have known mappings? → Proceed without AI [Spec §FR-014]

## Requirement Clarity

- [x] CHK008 - Is "clear error message" in FR-013 defined with specific structure? → Error type + suggested action [Spec §FR-013]
- [x] CHK009 - Is the confidence threshold defined for AI column mapping? → Must contain all 5 fields in parseable format [Spec §FR-005]
- [x] CHK010 - Is a limit specified for few-shot examples in AI prompt? → Max 50, most recent first [Spec §FR-008]
- [x] CHK011 - Is behavior specified when AI returns unknown category? → Left uncategorized, flagged for review [Spec §FR-016]
- [x] CHK012 - Are Debit/Credit indicator values defined per source? → Source config must include indicator values [Spec §FR-004]

## Requirement Consistency

- [x] CHK013 - Does duplicate import edge case conflict with out-of-scope assumption? → Edge case removed, assumption stands [Spec §Assumptions]
- [x] CHK014 - Does FR-014 blocking ALL imports conflict with known sources not needing AI? → Already resolved by CHK007 update [Spec §FR-014]
- [x] CHK015 - Is the Type-to-Amount-sign mapping explicitly documented? → Added to FR-003 [Spec §FR-003]

## Acceptance Criteria Quality

- [x] CHK016 - Is SC-002 measurable? → Compared against 20 manually verified transactions per source [Spec §SC-002]
- [x] CHK017 - Is SC-004 measurable? → Percentage of AI-categorized not modified during review [Spec §SC-004]
- [x] CHK018 - Is SC-005 measurable? → Ratio of AI calls/total transactions, 1st vs 5th import [Spec §SC-005]

## Scenario Coverage

- [x] CHK019 - Are acceptance scenarios defined for seed CSV upload? → User Story 5 added [Spec §US5]
- [x] CHK020 - Are acceptance scenarios defined for category resolution cascade? → Keyword rule step added to US2 [Spec §US2 Scenario 5]
- [x] CHK021 - Are requirements defined for large statement review? → Scrollable table specified [Spec §FR-009]

## Edge Case Coverage

- [x] CHK022 - Are AI timeout and unavailability handled as distinct failure modes? → 30s timeout + 1 retry, then treat as unavailable [Spec §FR-019]
- [x] CHK023 - Is behavior specified when source_mappings.json is missing/malformed? → Error on known source selection [Spec §FR-020]
- [x] CHK024 - Is behavior specified when category_mappings.md is corrupted? → Log warning, treat as empty, recreate [Spec §FR-021]
- [x] CHK025 - Are requirements defined for PDFs with multiple tables? → Optional table index in source config [Spec §FR-004]

## Non-Functional Requirements

- [x] CHK026 - Are AI call timeout and retry requirements specified? → 30s timeout, 1 retry [Spec §FR-019]
- [x] CHK027 - Is mapping file growth management addressed? → Documented in assumptions, no pruning needed for v1 [Spec §Assumptions]

## Notes

- All 27 items resolved on 2026-03-27
- Spec updated from FR-001–FR-016 to FR-001–FR-021 (5 new requirements added)
- User Story 5 (Seed Categories) added
- All success criteria now include measurement methodology
