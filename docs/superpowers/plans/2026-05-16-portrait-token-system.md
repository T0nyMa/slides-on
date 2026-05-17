# Portrait Token System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace scattered 3:4 portrait adaption logic with centralized CSS token system, add canvas-aware vertical distribution to renderers.

**Architecture:** 20+ CSS sizing tokens in `:root` with `.portrait` overrides. Renderers accept canvas param for structural decisions (column count, vertical fill mode). All other CSS (components, designs) reference tokens — no more `@container` or `.portrait` branches.

**Tech Stack:** Bun, TypeScript (slides.ts), CSS custom properties, cqi units

**Spec:** `docs/superpowers/specs/2026-05-16-portrait-token-system-design.md`

---

### Task 1: Token System + Vertical Distribution in base.css

**Files:**
- Modify: `assets/base.css`

- [ ] **Step 1: Add sizing token definitions to `:root`**

After the existing `:root` block (after `--bg-texture` etc., around line 41), add:

```css
  /* Sizing tokens — shared across 16:9 and 3:4 (overridden by .portrait) */
  --h1-size: 72px;
  --h2-size: 54px;
  --h3-size: 32px;
  --h4-size: 22px;
  --lede-size: 22px;
  --kicker-size: 14px;
  --eyebrow-size: 13px;
  --body-font-size: 16px;
  --slide-pad-x: 96px;
  --slide-pad-y: 72px;
  --slide-pad-bottom: 72px;
  --card-pad: 26px 28px;
  --grid-cols-2: repeat(2, 1fr);
  --grid-cols-3: repeat(3, 1fr);
  --grid-cols-4: repeat(4, 1fr);
  --slide-justify: center;
  --stack-gap-val: 14px;
```

- [ ] **Step 2: Update typography rules to use tokens (lines 76-82)**

```css
.eyebrow{font-size:var(--eyebrow-size);font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:var(--text-3)}
.kicker{font-size:var(--kicker-size);font-weight:600;color:var(--accent);letter-spacing:.08em;text-transform:uppercase}
h1.title,.h1{font-family:var(--font-display);font-size:var(--h1-size);line-height:1.05;font-weight:800;letter-spacing:var(--letter-tight);margin:0 0 18px;color:var(--text-1)}
h2.title,.h2{font-family:var(--font-display);font-size:var(--h2-size);line-height:1.1;font-weight:700;letter-spacing:var(--letter-tight);margin:0 0 14px}
h3,.h3{font-size:var(--h3-size);line-height:1.2;font-weight:600;letter-spacing:var(--letter-normal);margin:0 0 10px}
h4,.h4{font-size:var(--h4-size);line-height:1.3;font-weight:600;margin:0 0 8px}
.lede{font-size:var(--lede-size);line-height:1.55;color:var(--text-2);font-weight:300;max-width:62ch}
```

- [ ] **Step 3: Update `.slide` padding and justify to use tokens (line 62)**

```css
.slide{
  position:absolute;inset:0;
  display:flex;flex-direction:column;justify-content:var(--slide-justify);
  padding:var(--slide-pad-y) var(--slide-pad-x) var(--slide-pad-bottom);
  box-sizing:border-box;
  opacity:0;pointer-events:none;
  transition:opacity .5s var(--ease), transform .5s var(--ease);
  transform:translateX(30px);
  overflow:hidden;
}
```

- [ ] **Step 4: Update grid primitives to use tokens (lines 94-96)**

```css
.g2{display:grid;grid-template-columns:var(--grid-cols-2)}
.g3{display:grid;grid-template-columns:var(--grid-cols-3)}
.g4{display:grid;grid-template-columns:var(--grid-cols-4)}
```

- [ ] **Step 5: Update card padding and stack gap to use tokens (lines 90, 104)**

```css
.stack>*+*{margin-top:var(--stack-gap-val)}
```
```css
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);
  padding:var(--card-pad);box-shadow:var(--shadow);position:relative;overflow:hidden}
```

- [ ] **Step 6: Add `.portrait` token overrides (after line 217 `.portrait .slide`)**

Replace lines 214-217 with fuller `.portrait` block:

```css
.portrait .deck {
  width: min(100vw, calc(100vh * 3 / 4));
  height: min(100vh, calc(100vw * 4 / 3));
  margin: auto; overflow: hidden;
  container-type: inline-size;
}

/* 3:4 sizing token overrides */
.portrait {
  --h1-size: 7cqi;
  --h2-size: 5.2cqi;
  --h3-size: 3.7cqi;
  --h4-size: 2.5cqi;
  --lede-size: 2.5cqi;
  --kicker-size: 1.8cqi;
  --eyebrow-size: 1.6cqi;
  --body-font-size: 2cqi;
  --slide-pad-x: 4.5cqi;
  --slide-pad-y: 4.5cqi;
  --slide-pad-bottom: 3cqi;
  --card-pad: 2.5cqi 3cqi;
  --grid-cols-2: 1fr;
  --grid-cols-3: repeat(2, 1fr);
  --grid-cols-4: repeat(2, 1fr);
  --slide-justify: flex-start;
  --stack-gap-val: 1.8cqi;
}
```

Remove old `.portrait .slide` block (lines 214-217) since `.slide` now uses `var(--slide-justify)`, `var(--slide-pad-*)`.

- [ ] **Step 7: Add `.landscape` explicit defaults**

After `.portrait` block:

```css
.landscape {
  --h1-size: 72px;
  --h2-size: 54px;
  --h3-size: 32px;
  --h4-size: 22px;
  --lede-size: 22px;
  --kicker-size: 14px;
  --eyebrow-size: 13px;
  --body-font-size: 16px;
  --slide-pad-x: 96px;
  --slide-pad-y: 72px;
  --slide-pad-bottom: 72px;
  --card-pad: 26px 28px;
  --grid-cols-2: repeat(2, 1fr);
  --grid-cols-3: repeat(3, 1fr);
  --grid-cols-4: repeat(4, 1fr);
  --slide-justify: center;
  --stack-gap-val: 14px;
}
```

- [ ] **Step 8: Remove `@container (max-width: 1000px)` size overrides**

Delete lines 186-196 (the `@container` block that overrides h1/h2/h3/lede/slide padding/layout). Keep the `@media (max-width: 900px)` fallback (lines 175-183) since it handles arbitrary viewport narrowing, but update it to use tokens:

```css
@media (max-width: 900px) {
  .slide{ padding: 48px 40px; }
  .g4, .g3{ grid-template-columns: repeat(2, 1fr); }
  .g5, .g6{ grid-template-columns: repeat(3, 1fr); }
  h1.title, .h1{ font-size: 48px; }
  h2.title, .h2{ font-size: 38px; }
  h3, .h3{ font-size: 26px; }
  .lede{ font-size: 18px; }
}
```

(Line 175-183 stays as-is — this is the viewport-based fallback for narrow browser windows, not portrait-specific.)

- [ ] **Step 9: Keep `.narrow` class block (lines 198-205)**

Keep unchanged — JS-driven manual trigger for narrow viewports.

- [ ] **Step 10: Add vertical distribution utility classes**

Add before the `/* PRINT */` section (line 231):

```css
/* ================= VERTICAL DISTRIBUTION (3:4 fill strategies) ================= */
.v-fill       { flex: 1; }
.v-center     { margin: auto 0; }
.v-bottom     { margin-top: auto; }
.v-distribute { display: flex; flex-direction: column; justify-content: space-between; width: 100%; }
```

- [ ] **Step 11: Update `.landscape .slide` block (lines 226-229)**

```css
.landscape .deck {
  width: min(100vw, calc(100vh * 16 / 9));
  height: min(100vh, calc(100vw * 9 / 16));
  margin: auto; overflow: hidden;
  container-type: inline-size;
}
.landscape .slide {
  padding: 3.5cqi 5cqi;
  justify-content: center;
}
```

Keep — landscape slide overrides stay (they're cqi-based and independent of the token system).

- [ ] **Step 12: Commit**

```bash
git add assets/base.css
git commit -m "feat: add sizing token system + .portrait overrides + .v-* utilities to base.css"
```

---

### Task 2: Update components.css to Use Tokens

**Files:**
- Modify: `assets/components.css`

- [ ] **Step 1: Replace hardcoded cqi values with `var(--c-*)` references**

Each component class currently has hardcoded cqi. Replace with token references:

| Line | Current | Replace with |
|------|---------|-------------|
| 34 | `font-size: 2.2cqi` (in `.c-title`) | `font-size: var(--c-title-size, 2.2cqi)` |
| 35 | `font-size: 1.5cqi` (in `.c-subtitle`) | `font-size: var(--c-subtitle-size, 1.5cqi)` |
| 36 | `font-size: 1.2cqi` (in `.c-body`) | `font-size: var(--c-body-size, 1.2cqi)` |
| 37 | `font-size: 0.95cqi` (in `.c-small`) | `font-size: var(--c-small-size, 0.95cqi)` |
| 51 | `padding: 1.5cqi 1.8cqi` (in `.c-card`) | `padding: var(--c-card-padding, 1.5cqi 1.8cqi)` |
| 53 | Same in `.c-card-accent` | Same |
| 61 | Same in `.c-card-warn` | Same |
| 68 | Same in `.c-card-soft` | Same |
| 73 | `gap: 1.5cqi` (in `.c-row`) | `gap: var(--c-row-gap, 1.5cqi)` |
| 74 | Same in `.c-grid-2/.c-grid-3` | `gap: var(--c-grid-gap, 1.5cqi)` |
| 82 | `font-size: 1.3cqi` (in `.c-section-label`) | `font-size: var(--c-section-label-size, 1.3cqi)` |
| 88 | `padding: 1.8cqi` (in `.c-glass`) | `padding: var(--c-glass-padding, 1.8cqi)` |
| 102 | `font-size: 0.85cqi` (in `.c-badge`) | `font-size: var(--c-badge-size, 0.85cqi)` |
| 119 | `font-size: 4.5cqi` (in `.c-kpi-value`) | `font-size: var(--c-kpi-value-size, 4.5cqi)` |
| 120 | `font-size: 1.1cqi` (in `.c-kpi-label`) | `font-size: var(--c-kpi-label-size, 1.1cqi)` |
| 130 | `font-size: 2.2cqi` (in `.c-quote`) | `font-size: var(--c-quote-size, 2.2cqi)` |
| 141 | `width: 3cqi; height: 3cqi` (in `.c-step-num`) | `width: var(--c-step-num-size, 3cqi); height: var(--c-step-num-size, 3cqi)` |
| 144 | `font-size: 1.3cqi` (in `.c-step-num`) | `font-size: var(--c-step-num-font, 1.3cqi)` |
| 147 | `font-size: 1.6cqi` (in `.c-step-title`) | `font-size: var(--c-step-title-size, 1.6cqi)` |
| 167 | `font-size: 1.5cqi` (in `.c-icon-row-title`) | `font-size: var(--c-icon-row-title-size, 1.5cqi)` |
| 226 | `font-size: 1.4cqi` (in `.c-codebox`) | `font-size: var(--c-codebox-size, 1.4cqi)` |
| 227 | `padding: 2.5cqi 3cqi` (in `.c-codebox`) | `padding: var(--c-codebox-padding, 2.5cqi 3cqi)` |
| 274 | `font-size: 1.8cqi` (in `.c-formula`) | `font-size: var(--c-formula-size, 1.8cqi)` |

Also add default values for these new tokens in `:root` within `components.css` (or in `base.css`). Add them to `base.css` `:root` alongside the existing ones — they're the 16:9 defaults. These go into Task 1's Step 1 additions:

```css
/* Component sizing tokens — 16:9 defaults */
--c-title-size: 2.2cqi;
--c-subtitle-size: 1.5cqi;
--c-body-size: 1.2cqi;
--c-small-size: 0.95cqi;
--c-card-padding: 1.5cqi 1.8cqi;
--c-row-gap: 1.5cqi;
--c-grid-gap: 1.5cqi;
--c-section-label-size: 1.3cqi;
--c-glass-padding: 1.8cqi;
--c-badge-size: 0.85cqi;
--c-kpi-value-size: 4.5cqi;
--c-kpi-label-size: 1.1cqi;
--c-quote-size: 2.2cqi;
--c-step-num-size: 3cqi;
--c-step-num-font: 1.3cqi;
--c-step-title-size: 1.6cqi;
--c-icon-row-title-size: 1.5cqi;
--c-codebox-size: 1.4cqi;
--c-codebox-padding: 2.5cqi 3cqi;
--c-formula-size: 1.8cqi;
```

- [ ] **Step 2: Delete the entire `@container (max-width: 1000px)` block**

Delete lines 316-379. The booster values are now in `.portrait` token overrides (Task 1 Step 6).

- [ ] **Step 3: Delete the 3:4 table `@container` block**

Delete lines 208-215 (the `@container (max-width: 1000px)` for `.c-table`).

- [ ] **Step 4: Add token defaults for c-* in `.portrait` block (Task 1 Step 6 expansion)**

Add to `.portrait` token block in base.css:

```css
  --c-title-size: 3.5cqi;
  --c-subtitle-size: 2.5cqi;
  --c-body-size: 2cqi;
  --c-small-size: 1.6cqi;
  --c-card-padding: 2.5cqi 3cqi;
  --c-row-gap: 2.5cqi;
  --c-grid-gap: 2.5cqi;
  --c-section-label-size: 2.3cqi;
  --c-glass-padding: 3cqi;
  --c-badge-size: 1.5cqi;
  --c-kpi-value-size: 8cqi;
  --c-kpi-label-size: 2cqi;
  --c-quote-size: 3.5cqi;
  --c-step-num-size: 5cqi;
  --c-step-num-font: 2.2cqi;
  --c-step-title-size: 2.8cqi;
  --c-icon-row-title-size: 2.5cqi;
  --c-codebox-size: 2.2cqi;
  --c-codebox-padding: 3cqi 3.5cqi;
  --c-formula-size: 3cqi;
```

And add them to `.landscape` block too (same as :root defaults):

```css
  --c-title-size: 2.2cqi;
  --c-subtitle-size: 1.5cqi;
  --c-body-size: 1.2cqi;
  /* ... all c-* tokens with 16:9 values */
```

- [ ] **Step 5: Also update remaining hardcoded values in components.css**

For `.c-section` (line 80): `padding: var(--c-section-padding, 1.8cqi)`

Add `--c-section-padding: 1.8cqi` to `:root` and `.portrait { --c-section-padding: 3cqi }`.

For `.c-stack > * + *` (line 10): `margin-top: var(--c-stack-gap, 1.5cqi)`

For `.c-step` (line 139): `gap: var(--c-step-gap, 1.5cqi)`

For `.c-icon-row` (line 159): `gap: var(--c-icon-row-gap, 1.5cqi)`

For `.c-quote::before` (line 131): `font-size: var(--c-quote-mark-size, 5cqi)` and `top: var(--c-quote-mark-top, -1cqi)`

Add all these tokens to `:root`, `.portrait`, `.landscape`.

- [ ] **Step 6: Commit**

```bash
git add assets/components.css assets/base.css
git commit -m "feat: components.css uses CSS token references, delete @container booster block"
```

---

### Task 3: Clean Up Design CSS Files

**Files:**
- Modify: `assets/designs/pastel-card.css`
- Modify: `assets/designs/white-editorial.css`
- Modify: `assets/designs/xhs-post.css`
- Modify: `assets/designs/hermes-cyber-terminal.css`

- [ ] **Step 1: pastel-card.css — remove `.portrait` / `.landscape` padding branches**

Delete lines 81-82:
```css
.d-pastel-card.portrait .slide { padding-top: 10cqi; }
.d-pastel-card.landscape .slide { padding-top: 9cqi; }
```

Replace with token-based override within `.d-pastel-card`:
```css
.d-pastel-card.portrait { --slide-pad-y: 10cqi; }
.d-pastel-card.landscape { --slide-pad-y: 9cqi; }
```

- [ ] **Step 2: pastel-card.css — delete `@container` grid override block**

Delete lines 206-214:
```css
@container (max-width: 1000px) {
  .d-pastel-card .c-grid-2 { grid-template-columns: repeat(2, 1fr); }
  .d-pastel-card .c-grid-3 { grid-template-columns: repeat(3, 1fr); }
  ...
}
```

Replace with token-based approach — override `--grid-cols-2`/`--grid-cols-3` in `.d-pastel-card.portrait`:
```css
.d-pastel-card.portrait {
  --grid-cols-2: repeat(2, 1fr);
  --grid-cols-3: repeat(3, 1fr);
}
```

- [ ] **Step 3: pastel-card.css — chrome position to token**

Line 76: `left: 11.11cqi; right: 11.11cqi` → `left: var(--slide-pad-x); right: var(--slide-pad-x)`
Line 113: `left: 11.11cqi; right: 11.11cqi` → `left: var(--slide-pad-x); right: var(--slide-pad-x)`

- [ ] **Step 4: white-editorial.css — same pattern**

Delete lines 63-64:
```css
.d-white-editorial.portrait .slide { padding-top: 9cqi; }
.d-white-editorial.landscape .slide { padding-top: 8cqi; }
```

Replace:
```css
.d-white-editorial.portrait { --slide-pad-y: 9cqi; }
.d-white-editorial.landscape { --slide-pad-y: 8cqi; }
```

Delete `@container` grid override block (lines 211-214). Replace:
```css
.d-white-editorial.portrait {
  --grid-cols-2: repeat(2, 1fr);
  --grid-cols-3: repeat(3, 1fr);
}
```

Chrome position (line 60, 86): `left: 11.11cqi` → `left: var(--slide-pad-x)`

- [ ] **Step 5: xhs-post.css — check for hardcoded values**

xhs-post.css has no `.portrait` branch and no `@container` block (portrait-only design). But check chrome positions:
Line 92: `left: 7.9cqi; right: 7.9cqi` → `left: var(--slide-pad-x); right: var(--slide-pad-x)`

No other changes needed.

- [ ] **Step 6: hermes-cyber-terminal.css — check for hardcoded values**

Line 71: `left: 84px; right: 84px` → `left: var(--slide-pad-x); right: var(--slide-pad-x)`
Line 76: `.d-hermes-cyber-terminal.landscape .slide { padding-top: 80px; }` → `.d-hermes-cyber-terminal.landscape { --slide-pad-y: 80px; }`
Line 90: `left: 84px; right: 84px` → `left: var(--slide-pad-x); right: var(--slide-pad-x)`

Delete `@container` block (lines 203+):
Replace with `.d-hermes-cyber-terminal` token overrides if needed.

- [ ] **Step 7: Commit**

```bash
git add assets/designs/
git commit -m "refactor: design CSS uses token refs, remove .portrait/@container branches"
```

---

### Task 4: Update Renderers for Canvas-Aware Structure

**Files:**
- Modify: `scripts/assemble/slides.ts`
- Modify: `scripts/assemble-deck.ts` (pass canvas to renderers)

- [ ] **Step 1: Add `canvas` to PageContext and update `renderSlide`**

In `slides.ts`, update `PageContext`:

```typescript
interface PageContext {
  page: number;
  total: number;
  canvas: "16:9" | "3:4";
}
```

Update `renderSlide` to accept and pass canvas:

```typescript
export function renderSlide(d: DesignTemplate, s: SlideData, ctx: PageContext): string {
  switch (s.type) {
    case "cover":     return renderCover(d, s, ctx);
    // ... all cases pass ctx unchanged
  }
}
```

- [ ] **Step 2: Update `renderCover` — 3:4 vertical fill**

```typescript
export function renderCover(d: DesignTemplate, s: SlideData, ctx: PageContext): string {
  const isPortrait = ctx.canvas === "3:4";
  return `<section class="slide">
    ${chromeTop(d, s, ctx)}
    <div class="${isPortrait ? "v-fill" : ""}" style="${isPortrait ? "display:flex;flex-direction:column;justify-content:center" : ""}">
      <div class="${d.kickerClass}">${esc(s.kicker || "")}</div>
      <${d.titleTag} class="${d.titleClass}">${s.title || ""}</${d.titleTag}>
      ${d.dividerHTML()}
      <p class="${d.subtitleClass}">${esc(s.subtitle || "")}</p>
    </div>
    ${chromeBottom(d, s, ctx, "cover")}
  </section>`;
}
```

- [ ] **Step 3: Update `renderSection` — 3:4 v-center**

```typescript
export function renderSection(d: DesignTemplate, s: SlideData, ctx: PageContext): string {
  const isPortrait = ctx.canvas === "3:4";
  return `<section class="slide">
    ${chromeTop(d, s, ctx)}
    <div class="${isPortrait ? "v-center" : ""}" style="${s.center || isPortrait ? "text-align:center" : ""}">
      <div class="${d.kickerClass}">${esc(s.kicker || "")}</div>
      <${d.titleTag} class="${d.titleClass}">${s.title || ""}</${d.titleTag}>
      ${s.subtitle ? `<p class="${d.subtitleClass}">${esc(s.subtitle)}</p>` : ""}
    </div>
    ${chromeBottom(d, s, ctx, `section · ${s.chip || ""}`)}
  </section>`;
}
```

- [ ] **Step 4: Update `renderCards` — 3:4 vertical fill + token-driven columns**

No structural change needed — `--grid-cols-N` token handled by CSS. Add `v-fill` wrapper:

```typescript
export function renderCards(d: DesignTemplate, s: SlideData, ctx: PageContext, cols: 2 | 3): string {
  const gridClass = cols === 2 ? "c-grid-2" : "c-grid-3";
  const isPortrait = ctx.canvas === "3:4";
  const cards = s.cards || [];
  return `<section class="slide">
    ${chromeTop(d, s, ctx)}
    <h2 class="${d.titleClass === "chr-title" ? "chr-heading" : d.titleClass}">${s.title || ""}</h2>
    <div class="${gridClass}${isPortrait ? " v-fill" : ""}">
      ${cards.map((c) => "      " + d.cardHTML(c)).join("\n")}
    </div>
    ${chromeBottom(d, s, ctx, `content · ${cols}x${Math.ceil(cards.length / cols)}`)}
  </section>`;
}
```

- [ ] **Step 5: Update `renderSteps` — 3:4 v-distribute for ≤4 steps**

```typescript
export function renderSteps(d: DesignTemplate, s: SlideData, ctx: PageContext): string {
  const steps = s.steps || [];
  const isPortrait = ctx.canvas === "3:4";
  const useDistribute = isPortrait && steps.length <= 4;
  return `<section class="slide">
    ${chromeTop(d, s, ctx)}
    <h2 class="${d.titleClass === "chr-title" ? "chr-heading" : d.titleClass}">${s.title || ""}</h2>
    <div class="c-steps${useDistribute ? " v-distribute" : ""}">
      ${steps.map((st) => "      " + d.stepHTML(st)).join("\n")}
    </div>
    ${chromeBottom(d, s, ctx, "content · steps")}
  </section>`;
}
```

- [ ] **Step 6: Update `renderCode` — 3:4 v-fill code block**

```typescript
export function renderCode(d: DesignTemplate, s: SlideData, ctx: PageContext): string {
  return `<section class="slide">
    ${chromeTop(d, s, ctx)}
    <h2 class="${d.titleClass === "chr-title" ? "chr-heading" : d.titleClass}">${s.title || ""}</h2>
    <div class="${ctx.canvas === "3:4" ? "v-fill" : ""}" style="overflow:auto">
      ${d.codeHTML(s.code || "")}
    </div>
    ${chromeBottom(d, s, ctx, "content · code")}
  </section>`;
}
```

- [ ] **Step 7: Update `renderKpi` — 3:4 vertical stack**

```typescript
export function renderKpi(d: DesignTemplate, s: SlideData, ctx: PageContext): string {
  const kpis = s.kpis || [];
  const isPortrait = ctx.canvas === "3:4";
  return `<section class="slide">
    ${chromeTop(d, s, ctx)}
    <h2 class="${d.titleClass === "chr-title" ? "chr-heading" : d.titleClass}">${s.title || ""}</h2>
    <div class="c-row${isPortrait ? " v-fill" : ""}">
      ${kpis.map((k) => `
      <div class="c-kpi">
        <div class="c-kpi-value">${esc(k.value)}</div>
        <div class="c-kpi-label">${esc(k.label)}</div>
        ${k.delta ? `<div class="c-kpi-delta ${k.deltaDir || "flat"}">${esc(k.delta)}</div>` : ""}
      </div>`).join("")}
    </div>
    ${chromeBottom(d, s, ctx, "content · kpi")}
  </section>`;
}
```

- [ ] **Step 8: Update `renderQuote` — 3:4 v-center**

```typescript
export function renderQuote(d: DesignTemplate, s: SlideData, ctx: PageContext): string {
  const isPortrait = ctx.canvas === "3:4";
  return `<section class="slide">
    ${chromeTop(d, s, ctx)}
    <div class="c-card chr-hero${isPortrait ? " v-center" : ""}" style="padding:4.94cqi 5.68cqi;${isPortrait ? "" : "margin-top:3.46cqi"}">
      ${d.quoteHTML(s.quote || "", s.quoteAttr)}
      ${d.dividerHTML()}
      <p class="${d.subtitleClass}">${esc(s.subtitle || "")}</p>
    </div>
    ${chromeBottom(d, s, ctx, "quote")}
  </section>`;
}
```

- [ ] **Step 9: Update `renderThanks` — 3:4 v-center**

```typescript
export function renderThanks(d: DesignTemplate, s: SlideData, ctx: PageContext): string {
  const badges = s.badges || [];
  const isPortrait = ctx.canvas === "3:4";
  return `<section class="slide">
    ${chromeTop(d, s, ctx)}
    <div class="${isPortrait ? "v-center" : ""}" style="text-align:center">
      <div class="${d.kickerClass}" style="text-align:center">thanks for reading</div>
      <${d.titleTag} class="${d.titleClass}" style="font-size:${isPortrait ? "8cqi" : "160px"};text-align:center">${s.title || "谢谢 · thanks"}</${d.titleTag}>
      ${d.dividerHTML()}
      <p class="${d.subtitleClass}" style="margin:0 auto">${esc(s.subtitle || "")}</p>
      ${badges.length ? `
      <div style="margin-top:40px">
        ${badges.map((b) => `<span class="chr-pill">${esc(b)}</span>`).join("\n        ")}
      </div>` : ""}
    </div>
    ${chromeBottom(d, s, ctx, "end")}
  </section>`;
}
```

- [ ] **Step 10: Update `renderBullets` — 3:4 v-fill c-stack**

```typescript
export function renderBullets(d: DesignTemplate, s: SlideData, ctx: PageContext): string {
  const items = s.bullets || [];
  const isPortrait = ctx.canvas === "3:4";
  return `<section class="slide">
    ${chromeTop(d, s, ctx)}
    <h2 class="${d.titleClass === "chr-title" ? "chr-heading" : d.titleClass}">${s.title || ""}</h2>
    <div class="c-stack${isPortrait ? " v-fill" : ""}">
      ${items.map((item) => `
      <div class="c-icon-row">
        <div class="c-icon-row-icon">${esc(item.icon)}</div>
        <div class="c-icon-row-text">
          <div class="c-icon-row-title">${esc(item.title)}</div>
          <div class="c-icon-row-body">${esc(item.body)}</div>
        </div>
      </div>`).join("")}
    </div>
    ${chromeBottom(d, s, ctx, "content · bullets")}
  </section>`;
}
```

- [ ] **Step 11: Update assemble-deck.ts to pass canvas to renderSlide**

In `scripts/assemble-deck.ts`, update line 124:

```typescript
const slidesHTML = slides.map((s, i) => {
  return renderSlide(design, s, { page: i + 1, total, canvas: config.canvas as "16:9" | "3:4" });
});
```

- [ ] **Step 12: Commit**

```bash
git add scripts/assemble/slides.ts scripts/assemble-deck.ts
git commit -m "feat: renderers accept canvas param, 3:4 structural decisions (v-fill/v-center/v-distribute)"
```

---

### Task 5: Add 3:4 Budget Rules to validate-slides.ts

**Files:**
- Modify: `scripts/validate-slides.ts`

- [ ] **Step 1: Add portrait-specific budget check function**

After existing `checkBudget` function, add:

```typescript
function checkPortraitBudget(config: any, slides: any[]): CheckResult[] {
  const results: CheckResult[] = [];
  if (config.canvas !== "3:4") return results;

  for (let i = 0; i < slides.length; i++) {
    const s = slides[i];
    const prefix = `portrait-budget.slide[${i}].${s.type}`;

    // Title character limits
    if (s.title && charCount(s.title) > 15) {
      results.push(fail(prefix, `Title too long for 3:4: "${s.title.slice(0, 20)}..." (${charCount(s.title)} chars, max 15)`));
    }

    // H2 title limit
    const headingTypes = ["cards-2x2", "cards-3", "steps", "code", "kpi", "bullets", "table"];
    if (headingTypes.includes(s.type) && s.title && charCount(s.title) > 10) {
      results.push(fail(prefix, `H2 title too long for 3:4: "${s.title.slice(0, 20)}..." (${charCount(s.title)} chars, max 10)`));
    }

    // Component count limit (count cards, steps, kpis, bullets)
    let componentCount = 0;
    if (s.cards) componentCount += s.cards.length;
    if (s.steps) componentCount += s.steps.length;
    if (s.kpis) componentCount += s.kpis.length;
    if (s.bullets) componentCount += s.bullets.length;
    if (componentCount > 6) {
      results.push(fail(prefix, `Too many components for 3:4: ${componentCount} (max 6)`));
    }

    // Steps limit
    if (s.steps && s.steps.length > 5) {
      results.push(fail(prefix, `Too many steps for 3:4: ${s.steps.length} (max 5)`));
    }

    // KPI limit
    if (s.kpis && s.kpis.length > 4) {
      results.push(fail(prefix, `Too many KPIs for 3:4: ${s.kpis.length} (max 4)`));
    }

    // Card body length
    if (s.cards) {
      s.cards.forEach((c: any, ci: number) => {
        if (c.body && charCount(c.body) > 60) {
          results.push(fail(prefix, `Card[${ci}] body too long for 3:4: ${charCount(c.body)} chars (max 60)`));
        }
      });
    }
  }

  if (results.length === 0) {
    results.push(pass("portrait-budget", "All 3:4 portrait budget rules passed"));
  }
  return results;
}
```

- [ ] **Step 2: Call checkPortraitBudget in main()**

Add to the main validation flow after `checkBudget()`:

```typescript
const portraitResults = checkPortraitBudget(config, slides);
results.push(...portraitResults);
```

- [ ] **Step 3: Commit**

```bash
git add scripts/validate-slides.ts
git commit -m "feat: add 3:4 portrait budget validation rules to validate-slides.ts"
```

---

### Task 6: Regenerate + Verify

**Files:**
- Modify: `templates/full-decks/*/index.html` (5 portrait decks)

- [ ] **Step 1: Regenerate all 5 portrait decks**

```bash
for deck in xhs-post xhs-white-editorial xhs-pastel-card xhs-tech-tutorial component-showcase; do
  bun scripts/assemble-deck.ts \
    -i "templates/full-decks/$deck/slides.json" \
    -o "templates/full-decks/$deck/index.html"
done
```

- [ ] **Step 2: Run visual-qa on portrait decks**

```bash
for deck in xhs-post xhs-white-editorial xhs-pastel-card xhs-tech-tutorial component-showcase; do
  echo "=== $deck ==="
  bun scripts/visual-qa.ts --input "templates/full-decks/$deck/index.html" --check-only 2>&1 | grep -E "BLOCKER|WARN|Slide"
done
```

- [ ] **Step 3: Verify 16:9 decks unaffected**

```bash
for deck in hermes-cyber-terminal pitch-deck; do
  bun scripts/assemble-deck.ts \
    -i "templates/full-decks/$deck/slides.json" \
    -o "templates/full-decks/$deck/index.html"
  echo "=== $deck ==="
  bun scripts/visual-qa.ts --input "templates/full-decks/$deck/index.html" --check-only 2>&1 | grep -E "BLOCKER|WARN"
done
```

- [ ] **Step 4: Token consistency check — no hardcoded px in portrait paths**

```bash
# Check that no .portrait or @container block has hardcoded 72px/54px/32px
grep -rn "72px\|54px\|32px\|22px" assets/ --include="*.css" | grep -v ":root\|.landscape\|@media\|.narrow"
```

Expected: no output (all hardcoded px should only appear in `:root`, `.landscape`, or `@media` fallback).

- [ ] **Step 5: Verify v-* classes present in rendered portrait HTML**

```bash
grep -c "v-fill\|v-center\|v-distribute" templates/full-decks/xhs-post/index.html
```

Expected: non-zero count.

- [ ] **Step 6: Commit**

```bash
git add templates/full-decks/
git commit -m "chore: regenerate portrait templates with token system + canvas-aware renderers"
```

---

## Verification Summary

1. `bun scripts/qa.sh --all` — all 17 decks must pass with no new BLOCKERs
2. `bun scripts/validate-slides.ts -i templates/full-decks/xhs-post/slides.json` — 3:4 rules active
3. Token consistency: `grep -rn "72px\|54px" assets/*.css | grep -v ":root\|.landscape"` → empty
4. xhs-post visual inspection: cover page fills vertically, cards use correct grid, chrome centered
