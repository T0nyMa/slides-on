# Design Guidelines

Visual design principles for slide decks produced by the slides-on pipeline. These guidelines inform both theme selection (Step 2) and layout composition (Step 3).

## White Space

White space (negative space) is the primary tool for visual hierarchy.

- **Padding**: Each `.slide` has `padding: 72px 96px` (standard) or tightened on narrow canvas. Do not override unless the layout specifically requires edge-to-edge design.
- **Between elements**: Use the `.mt-s`, `.mt-m`, `.mt-l` spacing utility classes for consistent vertical rhythm. Never use arbitrary `margin` values.
- **Text density**: Dense slides (many elements) harm comprehension. If a slide feels crowded, split it. White space is not wasted space -- it directs attention.
- **Breathing room**: Content is laid out naturally within the slide; use `.center` and `.tc` classes for centered layouts. Do not force content to fill the entire slide height.

## Contrast and Hierarchy

### Text Hierarchy (4 levels)

| Level | Element | Font Size | Weight | Color |
|-------|---------|:---------:|:------:|-------|
| 1 | Slide title (h2.h2) | 54px | 600 | `--text-1` |
| 2 | Section headers within slide (h3) | 32px | 600 | `--text-1` |
| 3 | Body text, bullets | 18px | 400 | `--text-2` |
| 4 | Footer, citations, notes | 13px | 400 | `--text-3` |

The title is always the most prominent element. Body text should never visually compete with the title.

### Color Contrast

- **Text on background**: `--text-1` against `--bg` should have a contrast ratio >= 4.5:1 (WCAG AA).
- **Accent usage**: `--accent` is for emphasis -- links, key numbers, highlight borders, badges. Never use accent as body text color.
- **Semantic colors** (`--good`, `--warn`, `--bad`): Use sparingly. Only for their semantic meaning (improvement = good/green, degradation = bad/red).

### Visual Weight Distribution

```
┌─────────────────────────────────────┐
│  Title (strongest)                   │  ← Top of slide
│                                      │
│     Body Content                     │
│     (medium weight, centered)        │  ← Middle (focal area)
│                                      │
│  Footer / Citation (lightest)        │  ← Bottom of slide
└─────────────────────────────────────┘
```

## Color Palette Limits

| Context | Max Colors | Notes |
|---------|:---------:|------|
| Academic | 3 | Background + text + one accent. Grayscale counts as one. |
| Technical / Corporate | 4 | Background + text + accent + one semantic color |
| Creative / Social | 5 | Background + text + accent + 2 complementary colors |
| Data visualization | 6-8 | Categorical palette for charts (exception to the rule) |

### Palette Composition (Academic)
```
Background: white / off-white (--bg)
Text:       near-black (--text-1), dark gray (--text-2)
Accent:     one color for emphasis (--accent), used at < 10% of surface area
Surface:    light gray (--surface), used for cards/panels
```

### Palette Composition (Technical)
```
Background: dark blue (#0d1b2a) or white
Text:       high contrast to background
Accent:     electric blue / cyan
Semantic:   green (--good), amber (--warn), red (--bad) -- used sparingly
```

## Font Pairing

### Default Pairing (from `base.css`)
- **Sans-serif** (`--font-sans`): `"Inter", "Noto Sans SC", -apple-system, ...` -- for headings and body text
- **Monospace** (`--font-mono`): `"JetBrains Mono", "Fira Code", "Cascadia Code", ...` -- for code blocks only

### Rules
- **One sans-serif family per deck**. Do not mix 2+ sans-serif fonts on different slides.
- **Monospace is for code only**. Never use monospace for body text or titles.
- **Chinese + English**: `"Noto Sans SC"` handles Chinese characters. Place it after `"Inter"` so English uses Inter and CJK falls back to Noto Sans SC.
- **Font loading**: `fonts.css` loads fonts from Google Fonts. If a font fails to load, the system fallback stack (`-apple-system, BlinkMacSystemFont, ...`) ensures readable text.

## Alignment and Consistency

### Grid System
Use the grid classes (`g2` through `g6`) for multi-column content. Never manually position elements with absolute positioning for content layout.

```
.g2 { grid-template-columns: repeat(2, 1fr); }   -- Two-column
.g3 { grid-template-columns: repeat(3, 1fr); }   -- Three-column
.g4 { grid-template-columns: repeat(4, 1fr); }   -- Four-column
.g5 { grid-template-columns: repeat(5, 1fr); }   -- Five-column (use sparingly)
.g6 { grid-template-columns: repeat(6, 1fr); }   -- Six-column (data-dense only)
```

### Per-Deck Consistency
- **Same theme** on every slide (one CSS file for the whole deck)
- **Same font sizes** throughout (CSS variables ensure this)
- **Same padding** on every slide (unless a layout specifically needs edge-to-edge)
- **Same animation style** across all slides (all `fade-up` or all `rise-in`, not mixed)
- **Consistent title position**: All `.h2` / `.h1` title elements at the same vertical position across slides

## Common Pitfalls

| Pitfall | Why It Happens | How to Avoid |
|---------|---------------|-------------|
| Too much text | Trying to "document" on slides | Move detail to speaker notes (`data-notes`). Slides are visual aids, not handouts. |
| Low contrast | Theme with similar text/bg colors | Choose a theme with `--text-1` / `--bg` contrast >= 4.5:1. Test: squint -- can you still read it? |
| Overcrowding | Fear of too many slides | More slides with less on each is always better. There is no penalty for having more slides. |
| Inconsistent spacing | Using arbitrary px values instead of spacing utility classes | Always use `.mt-s`/`.mt-m`/`.mt-l` or consistent `var(--radius)` values. Avoid magic numbers. |
| Inconsistent colors | Using `--accent-2` or inline colors randomly | Stick to the palette. If you need another color, add a semantic variable to the theme CSS. |
| Font size too small | Trying to fit more content | Split the slide. Minimum readable size on a projector: 18px body (standard) or 14px (code). |
| Title too long | Wrapping to 2+ lines at `.h2` (54px) | Shorten the title. `.h1` (72px) and `.h2` (54px) titles should fit on one line. |

## Narrow Canvas Adaptation

Implemented in `assets/base.css` via two mechanisms:

**1. `@media (max-width: 900px)`** — automatic viewport-based detection:
- **Grid columns reduce**: `.g4` and `.g3` become 2 columns; `.g5` and `.g6` become 3 columns
- **Font sizes shrink**: `.h1` 72px → 48px, `.h2` 54px → 38px, `.h3` 32px → 26px
- **Padding tightens**: `72px 96px` → `48px 40px`
- **`.lede`**: 22px → 18px

**2. `.narrow` class** — manual trigger for the same rules (useful for non-viewport triggers, JS-driven contexts, or combined with `.tpl-xhs-post` in preview mode).

**Content note**: A bullet list that works at 16:9 may still need splitting at 3:4 — the grid and type reductions help, but they don't replace editorial judgment.

### XHS Post Mode (3:4, `.tpl-xhs-post`)

xhs-post uses CSS Container Queries (`cqi` units) for proportional scaling. The deck maintains a 3:4 aspect ratio via `width: min(100vw, calc(100vh * 3/4))` — it fills available viewport space while respecting the ratio. All internal dimensions (fonts, spacing, borders) scale proportionally against the 810px reference width.

For export: `bun scripts/render-precise.ts <deck> --canvas 3:4` renders at 810×1080 (native 小红书 dimensions).

When using single-page layouts inside xhs-post: the narrow canvas `@media` rules in base.css apply automatically, reducing grid columns and type sizes. Prefer single-column or two-column layouts; avoid `.g4` and `.g5`.

## Accessibility

- **Color is not the only differentiator**: If color conveys meaning (e.g., red = bad, green = good), also use an icon or label.
- **Focus indicators**: Interactive elements (links, buttons) should have visible focus states.
- **Font sizing**: No text below 13px on standard canvas (body is 18px, dim text is 15px, captions 13px).
