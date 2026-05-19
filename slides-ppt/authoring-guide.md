# Authoring guide

How to turn a user request ("make me a deck about X") into a finished
html-ppt deck. Follow these steps in order.

## 1. Understand the deck

Before touching files, clarify:

1. **Audience** — engineers? designers? executives? consumers?
2. **Length** — 5 min lightning? 20 min share? 45 min talk?
3. **Language** — Chinese, English, bilingual? (Noto Sans SC is preloaded.)
4. **Format** — on-screen live, PDF export, 小红书图文?
5. **Tone** — clinical / playful / editorial / cyber?

The audience + tone map to a theme; the length maps to slide count; the
format maps to runtime features (live → notes + T-cycle; PDF → page-break
CSS, already handled in `base.css`).

## 2. Pick a visual skin

**16:9 landscape**: Pick a theme from `references/themes.md`. When in doubt:

- **Engineers** → `catppuccin-mocha` / `tokyo-night` / `dracula`.
- **Designers / product** → `editorial-serif` / `aurora` / `soft-pastel`.
- **Execs** → `minimal-white` / `arctic-cool` / `swiss-grid`.
- **Consumers** → `xiaohongshu-white` / `sunset-warm` / `soft-pastel`.
- **Cyber / CLI / infra** → `terminal-green` / `blueprint` / `gruvbox-dark`.
- **Pitch / bold** → `neo-brutalism` / `sharp-mono` / `bauhaus`.
- **Launch / product reveal** → `glassmorphism` / `aurora`.

Wire the theme as `<link rel="stylesheet" href="assets/themes/NAME.css">`
and list alternatives in `data-themes` so the user can press T to audition.

**3:4 portrait**: Use a Design CSS file from `assets/designs/`. Load order:
```html
<link rel="stylesheet" href="assets/fonts.css">
<link rel="stylesheet" href="assets/base.css">
<link rel="stylesheet" href="assets/components.css">
<link rel="stylesheet" href="assets/designs/{name}.css">
<body class="d-{name} portrait">
```
Available designs: `pastel-card` (马卡龙色块), `white-editorial` (白底杂志), `xhs-post` (手绘涂鸦). See `references/portrait-user-guide.md`.

## 3. Outline the deck

A solid 20-minute deck is usually:

```
cover → toc → section-divider #1 → [2-4 body pages] →
section-divider #2 → [2-4 body pages] → section-divider #3 →
[2-4 body pages] → cta → thanks
```

Pick 1 layout per page from `references/layouts.md`. Don't repeat the same
layout twice in a row.

## 4. Scaffold the deck

```bash
./scripts/new-deck.sh my-talk
```

This copies `templates/deck.html` into `examples/my-talk/index.html` with
paths rewritten. Add/remove `<section class="slide">` blocks to match your
outline.

## 5. Author each slide

**16:9 landscape**: For each outline item:
1. Open the matching single-page layout, e.g. `templates/single-page/kpi-grid.html`.
2. Copy the `<section class="slide">…</section>` block, paste into your deck.
3. Replace demo data with real data. Keep the class structure intact.
4. Set `data-title="..."` (used by the Overview grid).
5. Add `<div class="notes">…</div>` with speaker notes.

**3:4 portrait**: Use Chrome fragments (`chr-*`) + `c-*` components to build each slide:
1. Add chrome shell: `chr-topbar`, `chr-blob`, `chr-footer` etc. (see the Design's template for which chrome elements to include).
2. Fill with `c-*` components: `c-card`, `c-grid-2/3`, `c-quote`, `c-steps`, `c-kpi`, `c-badge` etc.
3. Follow the component patterns in `references/portrait-user-guide.md` for each page type (cover, pain page, concept page, steps, CTA, thanks).

## 6. Add animations sparingly

Rules of thumb:

- Cover/title: `rise-in` or `blur-in`.
- Body content: `fade-up` for the hero element, `stagger-list` for grids/lists.
- Stat pages: `counter-up`.
- Section dividers: `perspective-zoom` or `cube-rotate-3d`.
- Closer: `confetti-burst` on the "Thanks" text.

Pick **one** accent animation per slide. Everything else should be calm.

## 7. Chinese + English decks

- Fonts are already imported in `fonts.css` (Noto Sans SC + Noto Serif SC).
- Use `lang="zh-CN"` on `<html>`.
- For bilingual titles, stack lines: `<h1 class="h1">主标题<br><span class="dim">English subtitle</span></h1>`.
- Keep English subtitles in a lighter weight (300) and dim color to avoid
  visual competition.

## 8. Review in-browser

```bash
open examples/my-talk/index.html
```

Walk through every slide with ← →. Press:

- **O** — overview grid; catch any layout clipping.
- **T** — cycle themes; make sure nothing looks broken in any theme.
- **S** — open speaker notes; verify every slide has notes.

## 9. Export to PNG

```bash
# All slides, auto-detect count, @2x Retina
bun scripts/render-precise.ts examples/my-talk/index.html --slides auto --output out/

# 3:4 portrait canvas for 小红书
bun scripts/render-precise.ts examples/my-talk/index.html --canvas 3:4 --slides auto

# Explicit slide count + custom DSF
bun scripts/render-precise.ts examples/my-talk/index.html --slides 12 --dsf 2 --output out/
```

See `references/export.md` for PPTX and PDF export options.

## 10. What to NOT do

- Don't hand-author from a blank file.
- Don't use raw hex colors in slide markup. Use tokens.
- Don't load heavy animation frameworks. Everything should stay within the
  CSS/JS that already ships.
- Don't add more than one new template file unless a genuinely new layout
  type is needed. Prefer composition.
- Don't delete slides from the showcase decks.
- **Don't put presenter-only text on the slide.** Any descriptive text,
  narration cues, or explanations meant for the speaker (e.g. "这一页的重点是…",
  "Note: mention X here", small grey captions explaining the slide's purpose)
  MUST go inside `<div class="notes">`, not as visible elements. The `.notes`
  div is hidden (`display:none`) and only shown via the S overlay. Slides
  should contain ONLY audience-facing content.

## Troubleshooting

- **Theme doesn't switch with T**: check `data-themes` on `<body>` and
  `data-theme-base` pointing to the themes directory.
- **Design CSS not applying**: check that `<body>` has `class="d-{name}"`, the
  design CSS is loaded after `components.css`, and the body class matches the
  CSS selector (e.g. `.d-pastel-card`).
- **c-* components look wrong on 3:4**: make sure `<body class="portrait">` is
  set — this activates Container Query and `cqi` unit scaling.
- **Chrome elements invisible**: check that the Design CSS defines the
  corresponding `chr-*` styles. Not all Designs define all chrome elements.
- **Fonts fall back**: make sure `fonts.css` is linked before the theme/design.
- **PNG too small**: use `--dsf 2` for @2x Retina output in `render-precise.ts`.
