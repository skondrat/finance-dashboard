# Feature Specification: Cashflow Sankey Redesign

**Feature Branch**: `046-cashflow-sankey-redesign`  
**Created**: 2026-04-02  
**Status**: Draft  
**Input**: User description: "Left side should show Income source -> Income bar -> Major categories -> Final categories"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Four-Level Cashflow Visualization (Priority: P1)

A user opens the Cashflow page and sees a 4-level Sankey diagram:
1. **Income Sources** (leftmost) — individual income sources (e.g., "Gainsight Salary", "Paysera Tech")
2. **Income** (second level) — a single merged "Income" node where all sources converge
3. **Major Categories** (third level) — grouped spending areas (e.g., Housing, Food & Dining, Transportation)
4. **Final Categories** (rightmost) — individual budget categories (e.g., Rent, Groceries, Coffee shops)

Plus Savings and Investments nodes on the right side if applicable.

**Why this priority**: This is the entire feature — transforming the flat 2-level Sankey into a meaningful 4-level flow that tells a complete financial story.

**Independent Test**: Open the Cashflow page and verify the Sankey shows 4 distinct columns of nodes with flows between them.

**Acceptance Scenarios**:

1. **Given** the user has multiple income sources for a month, **When** viewing the Cashflow page, **Then** all income sources appear on the left, converging into a single "Income" node.
2. **Given** the Income node exists, **When** viewing the diagram, **Then** flows split from Income into major category groups (Housing, Food & Dining, etc.).
3. **Given** major categories exist, **When** viewing the diagram, **Then** each major category splits into its constituent final categories with proportional flow widths.
4. **Given** the user has savings for the month, **When** viewing the diagram, **Then** a "Savings" node appears branching from Income.
5. **Given** the user has only one income source, **When** viewing the diagram, **Then** the single source still flows through the Income node into major/final categories.

---

### Edge Cases

- What if a category doesn't map to any major category? It falls under an "Other" major category.
- What if there's only one final category in a major category? The major category still shows as an intermediate node with a single outgoing flow.
- What if there are no expenses but there is income? Income flows entirely to Savings.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST return a 4-level node structure: income sources → income → major categories → final categories (plus savings/investments).
- **FR-002**: System MUST define a mapping of existing budget categories to major category groups (Housing, Food & Dining, Transportation, Health & Wellness, Entertainment, Financial, Shopping, Communication, Other).
- **FR-003**: The Sankey diagram MUST render 4 distinct columns of nodes with flows between adjacent levels only.
- **FR-004**: Flow widths MUST be proportional to the monetary amounts they represent.
- **FR-005**: Categories with no explicit major category mapping MUST fall under "Other".
- **FR-006**: Savings and Investments nodes MUST appear at the same level as major categories, branching directly from Income.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The Sankey diagram displays exactly 4 levels of nodes when both income and expenses exist.
- **SC-002**: Every final expense category is reachable via a major category from the Income node.
- **SC-003**: The sum of flows into any node equals the sum of flows out of that node (conservation of flow).
- **SC-004**: Users can visually trace any expense back through its major category to the income pool.

## Assumptions

- Major category groupings are defined as a static mapping in the backend — not user-configurable in this iteration.
- The existing response shape changes (nodes get a "level" field; links connect adjacent levels only).
- The Sankey component width may need to increase to accommodate 4 columns.
- Tooltip behavior remains the same (hover shows source → target with amount).
