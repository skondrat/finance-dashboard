# UI/UX Requirements Quality Checklist: Finance Dashboard

**Purpose**: Validate that UI/UX layout and design system requirements are precise enough for an AI implementer to build without ambiguity
**Created**: 2026-03-25
**Feature**: [spec.md](../spec.md) | [SPEC.md](../../../SPEC.md) sections 3-6 | [DESIGN.md](../../../DESIGN.md)

## Requirement Completeness — Layout & Structure

- [x] CHK001 - Is the Cashflow tab layout structure defined with the same level of detail as Portfolio (§5) and Budget (§6)? [RESOLVED — SPEC.md §7 now provides KPI strip §7.2, Sankey §7.3, breakdown row §7.4]
- [ ] CHK002 - Are responsive behavior requirements specified for viewport widths between 1024px and 1280px? [Completeness, Gap — SC-010 says "graceful usability at 1024px" but no layout adaptation rules are defined]
- [ ] CHK003 - Is the relationship between the Portfolio positions list time-range selector and the performance chart time-range selector specified — are they synced or independent? [Clarity, SPEC.md §5.2/§5.3 — both define separate pill groups]
- [ ] CHK004 - Are empty state layouts defined for all data-dependent views (no accounts, no positions, no transactions, no budget data, no income sources)? [Completeness, Gap]
- [ ] CHK005 - Is the "settings flyout" opened by the user avatar specified with content, layout, and dismissal behavior? [Completeness, Gap — SPEC.md §4 mentions it but provides no detail]
- [ ] CHK006 - Are loading/skeleton state requirements defined for async data fetches (portfolio positions, chart data, budget tables, price refresh)? [Completeness, Gap]
- [ ] CHK007 - Is the Budget category settings sub-page layout defined beyond "accessible from a gear icon"? [Completeness, Gap — SPEC.md §6.4 describes functionality but not page layout]

## Requirement Clarity — Typography & Sizing

- [x] CHK008 - Are type scale sizes (`headline-lg`, `headline-md`, `headline-sm`, `display-sm`, `label-md`, `label-sm`, `body-md`) mapped to specific pixel/rem values? [RESOLVED — DESIGN.md §3 Type Scale table defines all tokens: display-sm 36px, headline-lg 32px, headline-md 28px, headline-sm 24px, body-md 14px, label-md 14px, label-sm 12px]
- [x] CHK009 - Is the font weight specified for each typography usage (e.g., Space Grotesk headline — regular, medium, or bold)? [RESOLVED — DESIGN.md §3 Type Scale table specifies weight 500 for display/headline tokens, 400 for body/label tokens]
- [ ] CHK010 - Is the KPI strip card sizing specified — fixed width per card, equal distribution, or content-driven? [Clarity, Gap — SPEC.md §5.1 says "full-width row of large KPI cards" without dimensions]
- [ ] CHK011 - Are the chart axis label typography and formatting requirements specified for all chart types? [Clarity, SPEC.md §6.8 says "Geist Mono axis labels" but no size/color/spacing]

## Requirement Clarity — Color & Theming

- [x] CHK012 - Is the dark theme color palette defined with the same specificity as the light theme (all surface levels, text colors, accent colors)? [RESOLVED — DESIGN.md §2 "Complete Dark Theme Palette" table defines all 16 tokens with dark hex values]
- [ ] CHK013 - Are chart color requirements specified for multi-segment charts (allocation donut, category distribution pie) — how many shades, what progression? [Clarity, SPEC.md §5.5 says "monochromatic shades (grays + the single green accent)" but no specific palette]
- [ ] CHK014 - Is the color for the performance chart area fill fully specified for dark mode? [Completeness, Gap — SPEC.md §5.2 defines `primary (#000) at 8% opacity` for light mode only]
- [ ] CHK015 - Are the progress bar colors for spend-vs-budget specified for the case where no budget is set? [Clarity, Gap — SPEC.md §6.6 defines green/red for under/over budget]

## Requirement Consistency — Cross-Section Alignment

- [x] CHK016 - Are the KPI strip requirements consistent between Portfolio (§5.1) and Budget (§6.2) — same card styling, same surface hierarchy, same label/value typography? [RESOLVED — SPEC.md §6.2 and §7.2 explicitly reference "Same visual treatment as Portfolio KPI strip"]
- [ ] CHK017 - Is the time range selector behavior consistent between the performance chart (§5.2) and the positions list (§5.3) — same component, same styling, same state management? [Consistency, SPEC.md §5.2/§5.3]
- [x] CHK018 - Does the "No-Line Rule" from DESIGN.md §2 conflict with the active tab "2px bottom accent line" in SPEC.md §4? Is this an intentional exception? [RESOLVED — DESIGN.md §2 "Allowed exceptions" explicitly lists "Active tab indicator — a 2px bottom accent line using primary"]
- [x] CHK019 - Are the upload zone styling requirements in SPEC.md §6.3 ("dashed-outline region") consistent with the "No-Line Rule" in DESIGN.md §2? [RESOLVED — DESIGN.md §2 "Allowed exceptions" explicitly lists "File upload drop zone — dashed outline, outline-variant at 40% opacity, 2px dashed"]

## Scenario Coverage — Interaction States

- [ ] CHK020 - Are sort indicator requirements defined for the positions list table headers (asc/desc icon or style)? [Coverage, Gap — SPEC.md §5.3 says "sortable" but no visual indicator spec]
- [ ] CHK021 - Are focus/keyboard navigation requirements defined for the tab navigation, time range selector pills, and allocation sub-tabs? [Coverage, Gap — accessibility mentioned in SPEC.md §12 but no per-component keyboard spec]
- [ ] CHK022 - Are the expandable category row animation/transition requirements defined? [Coverage, Gap — SPEC.md §6.6 says "expandable rows reveal individual transactions" but no expand/collapse behavior]
- [ ] CHK023 - Is the currency toggle interaction defined — dropdown menu, segmented control, or toggle switch? [Clarity, Ambiguity — SPEC.md §4 says "minimal dropdown or segmented control" without deciding]
- [ ] CHK024 - Are tooltip dismiss/persistence requirements defined for chart tooltips (dismiss on mouse-out, click-to-pin, etc.)? [Coverage, Gap]

## Edge Case Coverage — UI Boundary Conditions

- [ ] CHK025 - Are truncation/overflow requirements defined for long asset names, category names, and transaction descriptions? [Edge Case, Gap]
- [ ] CHK026 - Are number formatting requirements defined for large values (thousands separator), small values (decimal places), and zero values? [Edge Case, Gap — sample formats shown but no explicit rules]
- [ ] CHK027 - Is the maximum number of categories in the allocation donut chart specified before the chart becomes unreadable (collapse to "Other")? [Edge Case, Gap]
- [ ] CHK028 - Are requirements defined for how the Sankey diagram handles months with only income and no expenses (or vice versa)? [Edge Case, Gap]
- [ ] CHK029 - Is the behavior specified for the monthly selector at boundary months (first month of data, current month with incomplete data)? [Edge Case, Gap — SPEC.md §6.7]

## Non-Functional — Accessibility

- [ ] CHK030 - Are WCAG 2.1 AA contrast ratio requirements validated for the ghost border at 15% opacity against its background? [Non-Functional, DESIGN.md §4 — `outline-variant` at 15% opacity may fail contrast checks]
- [ ] CHK031 - Are color-blind-safe requirements defined for the green/red positive/negative markers, given these are the only color signals? [Non-Functional, Gap — DESIGN.md §5 relies on green/red distinction]
- [ ] CHK032 - Are screen reader requirements defined for chart data (area chart, donut chart, Sankey diagram, sparklines)? [Non-Functional, Gap]
- [ ] CHK033 - Are aria-label or role requirements specified for the surface-hierarchy-based layout separation (since there are no visible borders)? [Non-Functional, Gap]

## Notes

- Focus: UI/UX requirements quality for AI implementer clarity
- Depth: Standard (~33 items)
- Audience: AI implementer (Claude executing `/speckit.implement`)
- Primary sources: SPEC.md sections 3-6, DESIGN.md, spec.md FR-001/FR-025 + UI Layout Reference
- Items marked [Gap] indicate requirements that are absent and should be added before implementation
- Items marked [Consistency] flag potential conflicts between DESIGN.md rules and SPEC.md component specs
