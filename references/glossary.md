# Glossary

Unified terminology for the slides-on project, organized hierarchically from deck to element.

## Term Hierarchy

```
Deck
├── Section
│   └── Slide
│       ├── Layout
│       ├── Component
│       └── Animation
├── Template
├── Theme
├── Preset
└── Style
```

## Core Terms

### Deck
A complete presentation, containing all slides. A deck is rendered as a single HTML file with multiple `.slide` elements. The deck is the output product -- everything else serves it.

**File**: `index.html` with `runtime.js`, `base.css`, and a theme CSS linked.

### Slide
A single page within a deck. Rendered as a `<section class="slide">` element inside a `.deck` container. Only one slide is visible at a time via the `.is-active` class. Slides are navigated by keyboard (arrows, space, PageUp/Down, Home/End), URL hash (`#/N`), or touch swipe.

**Key attributes**:
- `data-anim="fade-up"` — entrance animation (24 named animations)
- `data-fx="chain-react"` — Canvas effect (20 FX modules)
- `data-title="..."` — slide title (used in overview and presenter mode)
- `.notes` div — presenter notes (hidden from audience, shown in presenter mode)

### Section
A logically related group of slides, typically introduced by a `section-divider` slide. Sections correspond to chapters or major topic transitions in the source document.

**In outline.md**: `## Section: <name>`

### Template
**Deck-level page sequence skeleton.** A template defines the ordered sequence of page types that make up a complete deck (e.g., `cover → toc → sections → cta → thanks`). 15 full-deck templates exist in `templates/full-decks/`, each with its own recommended theme and structural pattern.

**Scope**: Deck-level. A template references multiple layouts across slides.

### Layout
**Single-page content arrangement.** A layout is an HTML fragment that defines how content is organized within one `.slide` -- two-column, bullets, chart, code, etc. 31 built-in layouts exist in `templates/single-page/`.

**Scope**: Slide-level. A layout is used inside a single `.slide` div.

**Key distinction -- Template vs Layout**:
- Template = deck-level page sequence (the "what pages go where")
- Layout = slide-level content arrangement (the "how this page looks")

A template references many layouts; a layout is used within one slide.

### Theme
**CSS Variables set.** A theme is a single CSS file that overrides `:root` variables to control the visual appearance of an entire deck. 36 built-in themes exist in `assets/themes/`.

**Variables defined**:
```css
:root {
  --bg: #ffffff;           /* Page background */
  --surface: #f5f5f5;      /* Card/panel background */
  --surface-2: #e8e8e8;    /* Secondary surface */
  --text-1: #1a1a1a;       /* Primary text */
  --text-2: #555555;       /* Secondary text */
  --text-3: #999999;       /* Tertiary/helper text */
  --accent: #2563eb;       /* Primary accent */
  --accent-2: #7c3aed;     /* Secondary accent */
  --grad: linear-gradient(...); /* Gradient */
  --border: rgba(0,0,0,0.1);
  --font-sans: "Inter", ...;
  --font-mono: "JetBrains Mono", ...;
  --radius: 8px;
  --shadow: 0 4px 24px rgba(0,0,0,0.08);
}
```

**Scope**: Deck-level. One theme per deck, applied via `<link>` tag.

### Preset
**Scene-specific configuration bundle.** A preset bundles: theme + layout preferences + animation style + density. 17 presets are defined (e.g., `blueprint`, `scientific`, `corporate`, `hand-drawn-edu`). Presets provide a higher-level decision: "make this look like a technical talk" rather than "use blueprint theme with fade-up animation at balanced density."

**Scope**: Deck-level. A preset is a convenience layer above individual theme/layout/animation choices.

**Key distinction -- Theme vs Preset**:
- Theme = visual variables only (colors, fonts, spacing)
- Preset = theme + layout preference + animation + density -- a complete behavior bundle

A preset *includes* a theme, but adds behavioral decisions the theme alone doesn't make.

### Component
A reusable HTML content block within a layout. Examples: callout box, metric card, timeline item, tag, badge. Components are referenced within layouts and filled with specific content during Step 3 (HTML rendering).

**In base.css**:
- `.tag` -- inline label with rounded background
- `.badge` -- accent-filled label
- `.card` -- surface panel with border and padding
- `.callout` -- left-accent-bordered note box

### Animation
Visual transition effect on slide elements. Declared via HTML attributes and triggered by `runtime.js` when a slide becomes active.

**Types**:
- **CSS animations** (24 named, plus staggered variants): declared via `data-anim="fade-up"`, `data-anim="rise-in"`, etc.
- **Canvas FX** (20 modules): declared via `data-fx="chain-react"`, `data-fx="particle-burst"`, etc.
- **Stagger**: use class `anim-stagger-list` with `data-anim-target` on parent for staggered child entrance

**Scope**: Slide-level or element-level. Defined per-slide via data attributes.

### Style
The final computed CSS property values on HTML elements. Style is the *result* of applying a theme's variables, not something configured directly.

**Key distinction -- Style vs Theme**:
- Theme = variable definitions (what `--accent` equals)
- Style = computed result on elements (what `color: #2563eb` looks like on screen)

In practice: "change the theme" means switching which CSS variable file is loaded. "The style looks good" means the rendered visual result is pleasing.

## Confusion-Prone Distinctions

| Pair | Key Difference |
|------|---------------|
| **Theme vs Preset** | Theme = CSS variables. Preset = theme + layout preference + animation + density (a complete scene bundle) |
| **Template vs Layout** | Template = deck-level page sequence. Layout = single-page content arrangement |
| **Style vs Theme** | Style = computed CSS result. Theme = variable definitions that produce style |

## Source Origins

| Term | Primary Source |
|------|---------------|
| Deck, Slide, Section, Template, Layout, Theme, Animation | html-ppt-skill |
| Preset, Component | baoyu-skills |
| Style | CSS/web standard |
