# Design System: The Financial Monolith

## 1. Overview & Creative North Star
**Creative North Star: "The Editorial Ledger"**

This design system moves away from the cluttered, "widget-heavy" aesthetic of traditional FinTech. Instead, it adopts the high-contrast, intentional spatiality of a premium broadsheet newspaper crossed with a modern architectural blueprint. It is designed to feel authoritative yet invisible—prioritizing the data (the "truth") over the UI.

By leveraging **Geist Mono** and a brutalist-adjacent grayscale palette, we create a "Digital Curator" experience. The system breaks the standard dashboard template through **intentional asymmetry**, ultra-wide tracking on labels, and a **tonal layering strategy** that replaces traditional borders with atmospheric depth.

## 2. Colors & Surface Logic
The palette is rooted in absolute monochromatic clarity, punctuated by sophisticated functional tones.

### The "No-Line" Rule
**Explicit Instruction:** Do not use `1px solid` borders for sectioning or containment.
Structure is defined through background shifts. A `surface-container-low` section sitting on a `surface` background provides all the separation required. If you feel the urge to draw a line, use white space (from the Spacing Scale) instead.

**Allowed exceptions** (exhaustive list):
1. **Active tab indicator** — a 2px bottom accent line using `primary` to mark the selected tab in the top navigation.
2. **File upload drop zone** — a dashed outline on `surface-container-highest` to indicate the drag-and-drop target area. Use `outline-variant` at 40% opacity, 2px dashed.
3. **Input focus state** — the "Ghost Border" fallback at 15-20% opacity (see §4 Elevation & Depth).

No other borders or lines are permitted.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of vellum or architectural paper.

**Light theme:**
*   **Base:** `surface` (#faf9f9)
*   **Sub-Section:** `surface-container-low` (#f4f3f3)
*   **Interactive Cards:** `surface-container-lowest` (#ffffff)
*   **Elevated Overlays:** `surface-bright` (#faf9f9) with Glassmorphism.

**Dark theme:**
*   **Base:** `surface` (#121212)
*   **Sub-Section:** `surface-container-low` (#1a1a1a)
*   **Interactive Cards:** `surface-container-lowest` (#0e0e0e)
*   **Elevated Overlays:** `surface-bright` (#1e1e1e) with Glassmorphism.

### Complete Dark Theme Palette

| Token | Light | Dark |
|-------|-------|------|
| `surface` | #faf9f9 | #121212 |
| `surface-container-low` | #f4f3f3 | #1a1a1a |
| `surface-container-lowest` | #ffffff | #0e0e0e |
| `surface-container-high` | #e8e8e8 | #2a2a2a |
| `surface-container-highest` | #e2e2e2 | #333333 |
| `surface-bright` | #faf9f9 | #1e1e1e |
| `primary` | #000000 | #ffffff |
| `primary-container` | #1b1b1b | #e8e8e8 |
| `on-primary` | #ffffff | #000000 |
| `on-surface` | #1a1c1c | #e6e1e1 |
| `on-surface-variant` | #4c4546 | #a09a9b |
| `outline-variant` | #cfc4c5 | #3d3738 |
| `tertiary-fixed` | #6ffbbe | #1a4d3a |
| `on-tertiary-container` | #009668 | #4ddfaa |
| `error-container` | #ffdad6 | #4d1f1a |
| `on-error-container` | #93000a | #ff6b6b |

### The "Glass & Gradient" Rule
To prevent the dashboard from feeling "flat" or "cheap," use **Glassmorphism** for hovering info blocks. Apply `surface-container-lowest` at 80% opacity with a `20px` backdrop-blur.
*   **Signature Texture (light):** Subtle linear gradient from `primary` (#000000) to `primary-container` (#1b1b1b) at 135 degrees.
*   **Signature Texture (dark):** Subtle linear gradient from `primary` (#ffffff) to `primary-container` (#e8e8e8) at 135 degrees.

## 3. Typography: Monospaced Authority
The typographic system uses a high-contrast pairing between technical Monospace and approachable Sans-Serif.

*   **Geist Mono (Metadata & Data Points):** Used for all numerical values, labels, and "pros/cons" markers. It signals precision and transparency.
*   **Space Grotesk (Display & Headlines):** Used for high-level summaries. Its geometric nature complements the rigid grid while feeling modern.
*   **Inter (Body & Narrative):** Used for long-form explanations to ensure maximum readability.

### Type Scale

| Token | Font | Size | Weight | Use |
|-------|------|------|--------|-----|
| `display-sm` | Space Grotesk | 36px / 2.25rem | 500 | NET WORTH primary value |
| `headline-lg` | Space Grotesk | 32px / 2rem | 500 | Alternative primary KPI size |
| `headline-md` | Space Grotesk | 28px / 1.75rem | 500 | Secondary KPI values |
| `headline-sm` | Space Grotesk | 24px / 1.5rem | 500 | Section headers |
| `body-md` | Inter | 14px / 0.875rem | 400 | Body text, descriptions |
| `label-md` | Geist Mono | 14px / 0.875rem | 400 | Currency values, percentages, rates |
| `label-sm` | Geist Mono | 12px / 0.75rem | 400 | Metadata labels (uppercase, tracked) |

**Editorial Tip:** Use `label-sm` with `10% letter-spacing` and `uppercase` for metadata headers. This creates an "architectural label" look that feels premium and intentional.

## 4. Elevation & Depth
In this design system, shadows are atmospheric, not structural.

*   **Tonal Layering:** Depth is achieved by "stacking." Place a `surface-container-lowest` card on a `surface-container-low` section to create a soft, natural lift without a shadow.
*   **Ambient Shadows:** For floating elements (like map tooltips), use:
    *   `blur`: 40px
    *   `spread`: -4px
    *   `color`: `on-surface` (#1a1c1c) at 6% opacity.
*   **The "Ghost Border" Fallback:** If accessibility requires a stroke (e.g., input focus), use `outline-variant` (#cfc4c5) at **15% opacity**. Pure black or high-contrast borders are forbidden.

## 5. Components

### Buttons
*   **Primary:** Solid `primary` (#000000) with `on-primary` (#ffffff) text. Radius: `md` (0.375rem).
*   **Secondary:** `surface-container-high` (#e8e8e8) with `on-surface` text. No border.
*   **Tertiary/Ghost:** `Geist Mono` text with `1.5` spacing. Underline on hover only.

### Pros & Cons Markers (Financial Metadata)
*   **Positive Marker:** `on-tertiary-container` (#009668) text on a `tertiary-fixed` (#6ffbbe) subtle background. Use `+` prefix.
*   **Negative Marker:** `on-error-container` (#93000a) text on a `error-container` (#ffdad6) background. Use `-` prefix.
*   *Style:* Use `label-md` with `Geist Mono` for these indicators.

### Cards & Lists
*   **The Forbid Rule:** No divider lines between list items. Use `8px` of vertical space (Spacing Scale `2`) and a hover state of `surface-container-low` to define rows.
*   **Interactive Map Overlays:** Use `surface-container-lowest` with 85% opacity and a `12px` backdrop blur. Ensure a `xl` (0.75rem) corner radius for floating map modules.

### Input Fields
*   **Default State:** Background: `surface-container-highest` (#e2e2e2). No border.
*   **Focus State:** Background: `surface-container-lowest`. Soft "Ghost Border" at 20% opacity.

## 6. Do's and Don'ts

### Do
*   **DO** use asymmetric layouts (e.g., a wide 8-column data visualization next to a narrow 4-column metadata rail).
*   **DO** use Geist Mono for all currency and percentage values to emphasize the "Ledger" aesthetic.
*   **DO** rely on the Spacing Scale (specifically `8`, `12`, and `16`) to create "breathing room" between high-density data sets.

### Don't
*   **DON'T** use `000000` for body text. Use `on-surface-variant` (#4c4546) to reduce visual fatigue on white backgrounds.
*   **DON'T** use standard Material Design drop shadows. If it looks like a "box" sitting on a "page," the shadow is too dark.
*   **DON'T** use icons unless they are strictly necessary for navigation. Rely on clear, monospaced text labels instead to maintain the high-end editorial feel.