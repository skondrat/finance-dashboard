# Research: Budget UI Improvements

## Sorting approach

- **Decision**: Use React `useState` for sort column and direction. Apply `Array.sort()` on the data array before rendering. No external library needed.
- **Rationale**: The dataset is small (<50 categories), so in-memory sorting is instant. No need for a table library.
- **Alternatives considered**: TanStack Table — overkill for adding sort to a single table with simple data types.

## Sort arrow icons

- **Decision**: Use inline SVG chevron/triangle icons matching the existing monospace design style.
- **Rationale**: Consistent with the existing icon approach in the codebase (inline SVGs in settings-menu.tsx, debug-menu.tsx). No icon library needed.

## Progress bar fix

- **Decision**: The existing `ProgressBar` component already returns a grey bar for `budget === null || budget === 0`. Need to verify this is actually working or if there's a data issue where budget=0 categories still show green.
- **Rationale**: The code logic at line 30 of category-table.tsx handles this case, but the user reports seeing green bars. May need to check if budget values are coming as `0` vs some other falsy value, or if the progress bar's empty state div itself looks green in certain themes.
