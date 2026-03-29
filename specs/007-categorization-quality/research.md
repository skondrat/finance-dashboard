# Research: Categorization Quality Improvements

**Branch**: `007-categorization-quality` | **Date**: 2026-03-29

## R1: Where to filter excluded transactions (transfers)

**Decision**: Filter in `import_service.create_import()` after parsing but before categorization and preview row creation.

**Rationale**: Filtering at the service layer (not the parser) keeps parsers format-agnostic. Filtering before categorization avoids wasting AI calls on transfers. The count of excluded transactions is returned in the response for user visibility.

**Alternatives considered**:
- Filter in parser: Couples parser to business logic, different parsers would need the same logic.
- Filter in frontend: Backend still processes and saves them; data quality issue persists.
- Mark as "Excluded" category: Adds complexity; user doesn't need these at all.

## R2: Where to add ATM Withdrawal auto-categorization rule

**Decision**: Add a built-in prefix rule in `categorization_service.py` that runs before Step 1 (mapping file). This is a hardcoded rule, not an `AutoCatRule` DB record, to ensure it always exists regardless of user setup.

**Rationale**: The ATM withdrawal rule is universal (not user-specific) and should work immediately without seed categories or manual rule creation. Using a prefix check (`description.lower().startswith("atm withdrawal")`) is more precise than substring matching.

**Alternatives considered**:
- Add as AutoCatRule in DB: Requires user to have the category first and create the rule. Too fragile.
- Add to seed CSV only: User might not upload seeds; rule wouldn't exist.
- Add to AI prompt: Still costs API calls and can be inconsistent.

## R3: Where to ensure "ATM Withdrawal" category exists

**Decision**: Auto-create the "ATM Withdrawal" category in `categorization_service.py` (both batch functions) when the built-in rule matches and the category doesn't exist yet. This is a lazy-creation approach.

**Rationale**: Creating on-demand avoids modifying the seed service or requiring migrations. The category only appears when it's actually needed (ATM transactions exist in the import).

**Alternatives considered**:
- Create in seed service: Only works if user uploads seeds.
- Create via migration: Forces category on all users even if they never import ATM transactions.

## R4: Harmonization strategy for identical descriptions

**Decision**: Post-process AI results after `categorize_transactions_batch_async()` returns, grouping by description (case-insensitive). For each group with mixed AI-sourced categories, apply majority vote. Tie-break by first occurrence order.

**Rationale**: Post-processing is simpler than modifying the concurrent AI calls. It only touches AI-sourced results, preserving mapping/rule assignments. Majority vote is intuitive and handles the common case (7/8 agree).

**Alternatives considered**:
- De-duplicate AI calls (one per unique description): Would require restructuring the concurrent pipeline and re-mapping results. More complex, less incremental.
- Frontend-only harmonization: Wouldn't persist; inconsistency would remain in saved data.

## R5: "Other" flagging mechanism

**Decision**: Frontend-only change. In `PreviewTable`, detect when a row's effective category name is "Other" and apply an amber/warning visual treatment (background highlight + small warning badge). No backend changes needed.

**Rationale**: This is purely a visual indicator. The backend already returns `category_name` in each row, which is sufficient to detect "Other" on the frontend. When the user overrides the category, the display updates reactively.

**Alternatives considered**:
- Backend flag field: Adds complexity to the API contract for a purely visual concern.
- Special "review needed" source type: Conflates source tracking with review status.

## R6: Response contract changes

**Decision**: Add `excluded_count` field to `ImportUploadResponse` and `ImportResponse` types. This tells the user how many transactions were filtered out as internal transfers.

**Rationale**: Users need to know that transactions were excluded, not just silently dropped. A count in the response summary is the minimal, non-breaking change.
