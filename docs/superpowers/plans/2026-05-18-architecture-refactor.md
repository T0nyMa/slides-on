# Architecture Refactor: Design × Component 自由组合

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Design 声明化 — 删除 322 行 TypeScript designs.ts，用 5 个 JSON manifest + 1 个通用 variant 渲染器替代；slides.ts 直接消费 DesignManifest；QA 选择器从 manifest 自动聚合；打通 31 个 single-page layout。

**Architecture:** JSON manifest 声明每个 Design 的 class 映射、chrome 样式、组件 variant、QA 元数据。design-renderer.ts 实现穷举的 4 组 variant 分支（card/step/code 各 2-4 种 + 统一的 quote/chrome 渲染）。slides.ts 的函数签名从 `(d: DesignTemplate)` 改为 `(m: DesignManifest)`，调用 design-renderer 的 renderCard/Step/Code/Quote 等。

**Tech Stack:** TypeScript (Bun), JSON manifests, pixelmatch screenshot diff (L2 regression)

---

### Task 0.1: Fix VALID_SLIDE_TYPES missing "table"

**Files:** Modify `scripts/validate-slides.ts:63-66`

- [ ] **Step 1: Add "table" to VALID_SLIDE_TYPES**

```typescript
const VALID_SLIDE_TYPES = [
  "cover", "section", "cards-2x2", "cards-3",
  "quote", "steps", "code", "thanks", "bullets", "kpi", "table", "html",
] as const;
```

- [ ] **Step 2: Verify L0 passes**

Run: `bun scripts/validate-slides.ts --input templates/full-decks/hermes-cyber-terminal/slides.json`
Expected: PASS (this deck has a table slide)

- [ ] **Step 3: Commit**

```bash
git add scripts/validate-slides.ts
git commit -m "fix(qa): add missing table to VALID_SLIDE_TYPES"
```

---

### Task 1.1: Add DesignManifest type, remove DesignTemplate from types.ts

**Files:** Modify `scripts/assemble/types.ts`

- [ ] **Step 1: Add DesignManifest interface, mark DesignTemplate deprecated**

After line 127 (end of DesignTemplate interface), append:

```typescript
// ─── Design Manifest (replaces DesignTemplate) ──────────────────────────

export interface DesignManifest {
  name: string;
  css: string | null;
  classes: {
    title: string;
    subtitle: string;
    kicker: string;
    body: string;
    titleTag: string;
  };
  chrome: {
    topbar: "standard" | "dot-badge" | "terminal" | null;
    footer: boolean;
    footerTag: "span" | "div";
    divider: boolean;
    decorations: string[];
    pageFormat: "dot" | "slash";
  };
  variants: {
    card: "standard" | "editorial" | "terminal" | "handdrawn";
    step: "standard" | "editorial" | "card-as-step" | "terminal";
    code: "standard" | "card-wrapped";
  };
  qa: {
    decorativeClasses: string[];
    chromeSelectors: string[];
    cardColors: string[];
  };
}
```

- [ ] **Step 2: Add "layout" to SlideType**

Change line 17-29:

```typescript
export type SlideType =
  | "cover" | "section" | "cards-2x2" | "cards-3"
  | "quote" | "steps" | "code" | "thanks" | "bullets" | "kpi"
  | "table" | "html" | "layout";
```

- [ ] **Step 3: Add slots field to SlideData**

After line 85 (badges field), add:

```typescript
  slots?: Record<string, string>;
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `bun run --print 'import "./scripts/assemble/types"' 2>&1`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add scripts/assemble/types.ts
git commit -m "feat(types): add DesignManifest interface, add layout SlideType"
```

---

### Task 1.2: Create 5 Design manifests

**Files:** Create `scripts/assemble/design-manifests/*.json`

- [ ] **Step 1: Create base.json**

```json
{
  "name": "base",
  "css": null,
  "classes": { "title": "chr-title", "subtitle": "chr-sub", "kicker": "chr-kicker", "body": "chr-sub", "titleTag": "h1" },
  "chrome": { "topbar": "standard", "footer": true, "footerTag": "span", "divider": true, "decorations": [], "pageFormat": "dot" },
  "variants": { "card": "standard", "step": "standard", "code": "standard" },
  "qa": { "decorativeClasses": [], "chromeSelectors": [], "cardColors": [] }
}
```

- [ ] **Step 2: Create pastel-card.json**

```json
{
  "name": "pastel-card",
  "css": "assets/designs/pastel-card.css",
  "classes": { "title": "chr-title", "subtitle": "chr-sub", "kicker": "chr-kicker", "body": "chr-sub", "titleTag": "h1" },
  "chrome": { "topbar": "standard", "footer": true, "footerTag": "span", "divider": true, "decorations": ["chr-blob"], "pageFormat": "dot" },
  "variants": { "card": "standard", "step": "standard", "code": "standard" },
  "qa": { "decorativeClasses": ["chr-blob"], "chromeSelectors": [], "cardColors": ["peach", "mint", "sky", "lilac", "lemon", "rose"] }
}
```

- [ ] **Step 3: Create white-editorial.json**

```json
{
  "name": "white-editorial",
  "css": "assets/designs/white-editorial.css",
  "classes": { "title": "chr-title", "subtitle": "chr-sub", "kicker": "chr-kicker", "body": "chr-sub", "titleTag": "h1" },
  "chrome": { "topbar": "standard", "footer": true, "footerTag": "span", "divider": false, "decorations": ["chr-topline"], "pageFormat": "slash" },
  "variants": { "card": "editorial", "step": "editorial", "code": "standard" },
  "qa": { "decorativeClasses": ["chr-topline"], "chromeSelectors": [], "cardColors": ["purple", "pink", "blue", "green", "orange"] }
}
```

- [ ] **Step 4: Create xhs-post.json**

```json
{
  "name": "xhs-post",
  "css": "assets/designs/xhs-post.css",
  "classes": { "title": "h1", "subtitle": "lede", "kicker": "lede", "body": "lede", "titleTag": "h1" },
  "chrome": { "topbar": "dot-badge", "footer": true, "footerTag": "div", "divider": false, "decorations": [], "pageFormat": "dot" },
  "variants": { "card": "handdrawn", "step": "card-as-step", "code": "card-wrapped" },
  "qa": { "decorativeClasses": [], "chromeSelectors": [".chr-page-dot"], "cardColors": [] }
}
```

- [ ] **Step 5: Create hermes-cyber-terminal.json**

```json
{
  "name": "hermes-cyber-terminal",
  "css": "assets/designs/hermes-cyber-terminal.css",
  "classes": { "title": "chr-title", "subtitle": "chr-sub", "kicker": "chr-hc-prompt", "body": "chr-sub", "titleTag": "h1" },
  "chrome": { "topbar": "terminal", "footer": true, "footerTag": "span", "divider": false, "decorations": ["chr-hc-grid", "chr-hc-scanlines"], "pageFormat": "dot" },
  "variants": { "card": "terminal", "step": "terminal", "code": "standard" },
  "qa": { "decorativeClasses": ["chr-hc-grid", "chr-hc-scanlines", "chr-hc-vignette"], "chromeSelectors": [".chr-hc-tag"], "cardColors": [] }
}
```

- [ ] **Step 6: Verify JSON is valid**

Run: `for f in scripts/assemble/design-manifests/*.json; do echo "$f:"; bun -e "JSON.parse(require('fs').readFileSync('$f','utf-8'))" && echo "  ok" || echo "  FAIL"; done`
Expected: all 5 "ok"

- [ ] **Step 7: Commit**

```bash
git add scripts/assemble/design-manifests/
git commit -m "feat: add 5 Design manifests — base, pastel-card, white-editorial, xhs-post, hermes-cyber-terminal"
```

---

### Task 1.3: Create manifest-loader.ts

**Files:** Create `scripts/assemble/manifest-loader.ts`

- [ ] **Step 1: Write manifest-loader.ts**

```typescript
/**
 * manifest-loader.ts — Load and validate DesignManifest JSON files
 */
import * as fs from "fs";
import * as path from "path";
import type { DesignManifest } from "./types";

const ROOT = path.resolve(import.meta.dir, "../..");
const MANIFEST_DIR = path.join(import.meta.dir, "design-manifests");

const VALID_TOPBAR = new Set(["standard", "dot-badge", "terminal", null]);
const VALID_PAGE_FORMAT = new Set(["dot", "slash"]);
const VALID_CARD_VARIANTS = new Set(["standard", "editorial", "terminal", "handdrawn"]);
const VALID_STEP_VARIANTS = new Set(["standard", "editorial", "card-as-step", "terminal"]);
const VALID_CODE_VARIANTS = new Set(["standard", "card-wrapped"]);

function loadManifest(name: string): DesignManifest {
  const filePath = path.join(MANIFEST_DIR, `${name}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Unknown design "${name}". Design manifest not found: ${filePath}`
    );
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  const m = JSON.parse(raw) as DesignManifest;

  // Validate required fields
  if (!m.name) throw new Error(`Manifest ${name}: missing "name"`);
  if (!m.classes?.titleTag) throw new Error(`Manifest ${name}: missing classes.titleTag`);
  if (!m.chrome) throw new Error(`Manifest ${name}: missing "chrome"`);
  if (!m.variants) throw new Error(`Manifest ${name}: missing "variants"`);
  if (!m.qa) throw new Error(`Manifest ${name}: missing "qa"`);

  // Validate enum values
  if (!VALID_TOPBAR.has(m.chrome.topbar)) {
    throw new Error(`Manifest ${name}: invalid chrome.topbar "${m.chrome.topbar}"`);
  }
  if (!VALID_PAGE_FORMAT.has(m.chrome.pageFormat)) {
    throw new Error(`Manifest ${name}: invalid chrome.pageFormat "${m.chrome.pageFormat}"`);
  }
  if (!VALID_CARD_VARIANTS.has(m.variants.card)) {
    throw new Error(`Manifest ${name}: invalid variants.card "${m.variants.card}"`);
  }
  if (!VALID_STEP_VARIANTS.has(m.variants.step)) {
    throw new Error(`Manifest ${name}: invalid variants.step "${m.variants.step}"`);
  }
  if (!VALID_CODE_VARIANTS.has(m.variants.code)) {
    throw new Error(`Manifest ${name}: invalid variants.code "${m.variants.code}"`);
  }

  return m;
}

function loadAllManifests(): DesignManifest[] {
  if (!fs.existsSync(MANIFEST_DIR)) return [];
  return fs.readdirSync(MANIFEST_DIR)
    .filter(f => f.endsWith(".json"))
    .map(f => loadManifest(f.replace(".json", "")));
}

/** Get list of known design names */
function getKnownDesigns(): string[] {
  if (!fs.existsSync(MANIFEST_DIR)) return [];
  return fs.readdirSync(MANIFEST_DIR)
    .filter(f => f.endsWith(".json"))
    .map(f => f.replace(".json", ""));
}

/** Build body class from design name */
function getDesignBodyClass(name: string): string {
  const bodyClasses: Record<string, string> = {
    "pastel-card": "d-pastel-card",
    "white-editorial": "d-white-editorial",
    "xhs-post": "d-xhs-post",
    "hermes-cyber-terminal": "d-hermes-cyber-terminal",
  };
  return bodyClasses[name] || `d-${name}`;
}

export { loadManifest, loadAllManifests, getKnownDesigns, getDesignBodyClass };
```

- [ ] **Step 2: Verify all manifests load**

Run: `bun -e "import { loadAllManifests } from './scripts/assemble/manifest-loader'; console.log(loadAllManifests().map(m => m.name))"`
Expected: `["base", "pastel-card", "white-editorial", "xhs-post", "hermes-cyber-terminal"]`

- [ ] **Step 3: Commit**

```bash
git add scripts/assemble/manifest-loader.ts
git commit -m "feat: add manifest-loader — load + validate DesignManifest JSON"
```

---

### Task 1.4: Create design-renderer.ts (generic variant renderers)

**Files:** Create `scripts/assemble/design-renderer.ts`

- [ ] **Step 1: Write design-renderer.ts**

```typescript
/**
 * design-renderer.ts — Generic variant-based Design renderers
 *
 * Replaces designs.ts by switching on manifest.variants.*
 * Each function takes a DesignManifest + data, returns an HTML string.
 */
import type { DesignManifest, CardItem, StepItem } from "./types";

function p(n: number, total: number): string {
  return `${String(n).padStart(2, "0")} · ${String(total).padStart(2, "0")}`;
}
function pageDiv(n: number, total: number): string {
  return `${String(n).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
}
function pageStr(fmt: "dot" | "slash", n: number, total: number): string {
  return fmt === "slash" ? pageDiv(n, total) : p(n, total);
}

// ─── Card ───────────────────────────────────────────────────────────────

function renderCard(m: DesignManifest, card: CardItem): string {
  const color = card.color ? ` ${card.color}` : "";
  switch (m.variants.card) {
    case "editorial":
      return `<div class="c-card${color}">
        <div class="chr-card-label">${card.num || ""}</div>
        <div class="chr-card-main">${card.title}</div>
        <div class="chr-card-desc">${card.body}</div>
      </div>`;
    case "terminal":
      return `<div class="c-card${color}">
        <div class="chr-hc-lbl">${card.num || ""}</div>
        <div class="chr-hc-val">${card.title}</div>
        <div class="chr-hc-desc">${card.body}</div>
      </div>`;
    case "handdrawn":
      return `<div class="c-card">
        <b>${card.num ? card.num + " " : ""}${card.title}</b>
        <p class="dim">${card.body}</p>
      </div>`;
    default: // "standard"
      const num = card.num ? `<div class="chr-card-num">${card.num}</div>\n        ` : "";
      return `<div class="c-card${color}">
        ${num}<h4>${card.title}</h4>
        <p>${card.body}</p>
      </div>`;
  }
}

// ─── Step ───────────────────────────────────────────────────────────────

function renderStep(m: DesignManifest, step: StepItem): string {
  switch (m.variants.step) {
    case "editorial":
      return `<div class="c-step">
        <div class="c-step-num">${step.num}</div>
        <div class="c-step-content">
          <div class="c-step-title">${step.title}</div>
        </div>
      </div>`;
    case "card-as-step":
      return `<div class="c-card">
        <b>${step.num}. ${step.title}</b>
        ${step.body ? `<p class="dim">${step.body}</p>` : ""}
      </div>`;
    case "terminal":
      return `<div class="c-step">
        <div class="chr-hc-val">${step.num}</div>
        <div class="c-step-content">
          <div class="c-step-title">${step.title}</div>
          ${step.body ? `<div class="c-step-body">${step.body}</div>` : ""}
        </div>
      </div>`;
    default: // "standard"
      return `<div class="c-step">
        <div class="c-step-num">${step.num}</div>
        <div class="c-step-content">
          <div class="c-step-title">${step.title}</div>
          ${step.body ? `<div class="c-step-body">${step.body}</div>` : ""}
        </div>
      </div>`;
  }
}

// ─── Code ───────────────────────────────────────────────────────────────

function renderCode(m: DesignManifest, code: string): string {
  if (m.variants.code === "card-wrapped") {
    return `<div class="c-card"><pre style="overflow:auto">${code}</pre></div>`;
  }
  return `<pre class="chr-codebox">${code}</pre>`;
}

// ─── Quote (unified — all designs identical) ────────────────────────────

function renderQuote(m: DesignManifest, quote: string, attr?: string): string {
  return `<div class="c-quote">${quote}</div>${attr ? `\n      <div class="c-quote-attr">${attr}</div>` : ""}`;
}

// ─── Chrome ─────────────────────────────────────────────────────────────

function renderTopbar(m: DesignManifest, chip: string, chipColor: string, page: number, total: number): string {
  switch (m.chrome.topbar) {
    case "dot-badge":
      return `<div class="chr-page-dot">${pageStr(m.chrome.pageFormat, page, total)}</div>`;
    case "terminal":
      const tagHTML = chip ? `<span class="chr-hc-tag">${chip}</span>` : "";
      return `<div class="chr-topbar"><div class="dots"><span></span><span></span><span></span></div><div>${tagHTML} · ${pageStr(m.chrome.pageFormat, page, total)}</div></div>`;
    case null:
      return "";
    default: // "standard"
      const cc = chipColor ? ` ${chipColor}` : "";
      const chipHTML = chip ? `<div class="chr-chip${cc}">${chip}</div>` : "";
      return `<div class="chr-topbar">${chipHTML}<div class="chr-page">${pageStr(m.chrome.pageFormat, page, total)}</div></div>`;
  }
}

function renderFooter(m: DesignManifest, left: string, right: string): string {
  const tag = m.chrome.footerTag;
  return `<div class="chr-footer"><${tag}>${left}</${tag}><${tag}>${right}</${tag}></div>`;
}

function renderDecorations(m: DesignManifest, blobs?: string[]): string {
  // Map blob names for pastel-card (b1, b2, b3 → chr-blob classes)
  const decorations = [...m.chrome.decorations];
  if (blobs && decorations.includes("chr-blob")) {
    return blobs.map(b => `<div class="chr-blob ${b}"></div>`).join("\n    ");
  }
  return decorations.map(d => {
    if (d === "chr-topline") return `<div class="chr-topline"></div>`;
    if (d === "chr-hc-grid") return `<div class="chr-hc-grid"></div>`;
    if (d === "chr-hc-scanlines") return `<div class="chr-hc-scanlines"></div>`;
    return "";
  }).filter(Boolean).join("\n    ");
}

function renderDivider(m: DesignManifest): string {
  return m.chrome.divider ? `<div class="chr-divider"></div>` : "";
}

export { renderCard, renderStep, renderCode, renderQuote, renderTopbar, renderFooter, renderDecorations, renderDivider };
```

- [ ] **Step 2: Verify module loads**

Run: `bun -e "import { renderCard, renderStep, renderCode, renderQuote } from './scripts/assemble/design-renderer'; console.log('ok')"`
Expected: "ok"

- [ ] **Step 3: Commit**

```bash
git add scripts/assemble/design-renderer.ts
git commit -m "feat: add design-renderer — generic variant-based Design renderers"
```

---

### Task 1.5: Migrate xhs-post inline styles to CSS

**Files:** Modify `assets/designs/xhs-post.css`, Modify `scripts/assemble/design-renderer.ts`

- [ ] **Step 1: Add card/step internal styles to xhs-post.css**

Append to `assets/designs/xhs-post.css`:

```css
/* ══════════════════════════════════════════════════════
   CARD/STEP INTERNALS — migrated from designs.ts inline style
   ══════════════════════════════════════════════════════ */

.d-xhs-post .c-card b { font-size: 2.72cqi; font-weight: 800; }
.d-xhs-post .c-card p.dim { font-size: 1.98cqi; margin-top: 0.49cqi; }
.d-xhs-post .chr-codebox { font-size: 1.85cqi; line-height: 1.75; overflow: auto; }
```

- [ ] **Step 2: Verify design-renderer.ts handdrawn/card-wrapped has no inline style**

The handdrawn card and card-wrapped code in Task 1.4 already use no inline styles — verify they render only class-based HTML.

Run: `bun -e "import {loadManifest} from './scripts/assemble/manifest-loader'; import {renderCard,renderCode} from './scripts/assemble/design-renderer'; const m=loadManifest('xhs-post'); console.log(renderCard(m,{title:'T',body:'B',num:'1'})); console.log(renderCode(m,'const x=1'))"`
Expected: no `style=` in output

- [ ] **Step 3: Commit**

```bash
git add assets/designs/xhs-post.css
git commit -m "refactor(xhs-post): migrate inline styles to CSS — card b/p.dim, chr-codebox"
```

---

### Task 1.6: Rewrite slides.ts to consume DesignManifest directly

**Files:** Modify `scripts/assemble/slides.ts`

This task replaces all `d: DesignTemplate` parameters with `m: DesignManifest`, and replaces `d.cardHTML()`, `d.stepHTML()` etc. with the renderer functions.

- [ ] **Step 1: Update imports and types**

Replace lines 7-8:

```typescript
import type { SlideData, DesignManifest } from "./types";
import { renderCard, renderStep, renderCode, renderQuote, renderTopbar, renderFooter, renderDecorations, renderDivider } from "./design-renderer";
```

- [ ] **Step 2: Rewrite chromeTop to use renderer**

Replace function `chromeTop` (lines 27-33):

```typescript
function chromeTop(m: DesignManifest, s: SlideData, ctx: PageContext): string {
  if (s.hideChrome) return "";
  const parts: string[] = [];
  if (!s.hideChrome) parts.push(renderDecorations(m, s.blobs));
  parts.push(renderTopbar(m, s.chip || "", s.chipColor || "", ctx.page, ctx.total));
  return parts.filter(Boolean).join("\n    ");
}
```

- [ ] **Step 3: Rewrite chromeBottom to use renderer**

Replace function `chromeBottom` (lines 35-38):

```typescript
function chromeBottom(m: DesignManifest, s: SlideData, ctx: PageContext, right: string): string {
  if (s.hideChrome) return "";
  const left = s.subtitle || s.kicker || s.title || `slide ${ctx.page}`;
  return renderFooter(m, left.slice(0, 30), right);
}
```

- [ ] **Step 4: Update all render functions — change `d: DesignTemplate` to `m: DesignManifest`**

Replace ALL occurrences systematically:

| Current | Replace with |
|---------|-------------|
| `d: DesignTemplate` | `m: DesignManifest` |
| `d.kickerClass` | `m.classes.kicker` |
| `d.titleClass` | `m.classes.title` |
| `d.titleTag` | `m.classes.titleTag` |
| `d.subtitleClass` | `m.classes.subtitle` |
| `d.bodyClass` | `m.classes.body` |
| `d.cardHTML(c)` | `renderCard(m, c)` |
| `d.stepHTML(st)` | `renderStep(m, st)` |
| `d.codeHTML(s.code \|\| "")` | `renderCode(m, s.code \|\| "")` |
| `d.quoteHTML(s.quote \|\| "", s.quoteAttr)` | `renderQuote(m, s.quote \|\| "", s.quoteAttr)` |
| `d.dividerHTML()` | `renderDivider(m)` |

Render functions to update: renderCover, renderSection, renderCards, renderQuote, renderSteps, renderCode, renderThanks, renderBullets, renderKpi, renderTable.

Also update `renderHtml`: change `_d: DesignTemplate` to `_m: DesignManifest`.

- [ ] **Step 5: Update renderSlide router — add "layout" case**

In renderSlide (line 230-245), add after "html" case:

```typescript
    case "layout":    return renderLayout(m, s, ctx);
```

- [ ] **Step 6: Add renderLayout function**

After renderHtml (line 188), add:

```typescript
function renderLayout(_m: DesignManifest, s: SlideData, _ctx: PageContext): string {
  const layoutName = (s as any).layout || "blank";
  const layoutPath = path.join(ROOT, "templates", "single-page", `${layoutName}.html`);
  let inner: string;
  try {
    inner = fs.readFileSync(layoutPath, "utf-8");
  } catch {
    inner = s.html || `<!-- layout not found: ${layoutName} -->`;
  }
  // Inject slots
  if (s.slots) {
    for (const [key, val] of Object.entries(s.slots)) {
      inner = inner.replaceAll(`{{${key}}}`, val);
    }
  }
  if (inner.includes("<section")) return inner;
  return `<section class="slide">\n${inner}\n</section>`;
}
```

Add at top of file:
```typescript
import * as fs from "fs";
import * as path from "path";
const ROOT = path.resolve(import.meta.dir, "../..");
```

- [ ] **Step 7: Verify TypeScript compiles**

Run: `bun run --print 'import { renderSlide } from "./scripts/assemble/slides"' 2>&1`
Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add scripts/assemble/slides.ts
git commit -m "refactor(slides): consume DesignManifest directly, use design-renderer helpers"
```

---

### Task 1.7: Update assemble-deck.ts to use loadManifest

**Files:** Modify `scripts/assemble/assemble-deck.ts`

- [ ] **Step 1: Update imports**

Replace line 17:
```typescript
import { getDesignTemplate } from "./assemble/designs";
```
with:
```typescript
import { loadManifest } from "./assemble/manifest-loader";
```

- [ ] **Step 2: Update design loading**

Replace lines 118-119:
```typescript
    const designName = typeof config.design === "string" ? config.design : (config.design as DesignConfig).design || "base";
    const design = getDesignTemplate(designName);
```
with:
```typescript
    const designName = typeof config.design === "string" ? config.design : (config.design as DesignConfig).design || "base";
    const manifest = loadManifest(designName);
```

- [ ] **Step 3: Update renderSlide call — pass manifest**

Replace line 124:
```typescript
      return renderSlide(design, s, { page: i + 1, total, canvas: config.canvas as "16:9" | "3:4" });
```
with:
```typescript
      return renderSlide(manifest, s, { page: i + 1, total, canvas: config.canvas as "16:9" | "3:4" });
```

- [ ] **Step 4: Update DESIGN_BODY_CLASS in skeleton.ts to use getDesignBodyClass**

Modify `scripts/assemble/skeleton.ts`:
- Import: add `import { getDesignBodyClass } from "./manifest-loader";`
- Delete `DESIGN_BODY_CLASS` constant (lines 15-20)
- In `getBodyClass`, replace `DESIGN_BODY_CLASS[design]` with `getDesignBodyClass(design)`
- In `getBodyClass`, replace `DESIGN_BODY_CLASS[d.design]` with `getDesignBodyClass(d.design)`

- [ ] **Step 5: Verify assembly works**

Run: `bun scripts/assemble-deck.ts -i templates/full-decks/knowledge-arch-blueprint-3x4/slides.json -o /tmp/test-refactor.html 2>&1`
Expected: `Written: /tmp/test-refactor.html (N slides, ...)`

- [ ] **Step 6: Commit**

```bash
git add scripts/assemble/assemble-deck.ts scripts/assemble/skeleton.ts
git commit -m "refactor: assemble-deck uses loadManifest instead of getDesignTemplate"
```

---

### Task 1.8: Delete designs.ts + remove DesignTemplate from types.ts

**Files:** Delete `scripts/assemble/designs.ts`, Modify `scripts/assemble/types.ts`

- [ ] **Step 1: Remove DesignTemplate interface from types.ts**

Delete lines 104-127 (the `DesignTemplate` interface).

- [ ] **Step 2: Remove DESIGN_TEMPLATES import from validate-slides.ts**

In `scripts/validate-slides.ts`, replace:
```typescript
import { DESIGN_TEMPLATES } from "../assemble/designs";
```
with:
```typescript
import { getKnownDesigns, loadAllManifests } from "../assemble/manifest-loader";
```

Replace:
```typescript
const KNOWN_DESIGNS = Object.keys(DESIGN_TEMPLATES);
```
with:
```typescript
const KNOWN_DESIGNS = getKnownDesigns();
```

Replace DESIGN_COLORS (lines 54-58):
```typescript
const DESIGN_COLORS: Record<string, string[]> = {};
// Built lazily from manifests
function getDesignColors(): Record<string, string[]> {
  if (Object.keys(DESIGN_COLORS).length === 0) {
    for (const m of loadAllManifests()) {
      DESIGN_COLORS[m.name] = m.qa.cardColors;
    }
  }
  return DESIGN_COLORS;
}
```

And update `checkDesignCompat` to use `getDesignColors()` instead of `DESIGN_COLORS`.

- [ ] **Step 3: Remove DESIGN_TEMPLATES import from visual-qa.ts if any**

Check: `grep -n 'DESIGN_TEMPLATES\|from.*designs' scripts/visual-qa.ts` — if found, replace similarly.

- [ ] **Step 4: Delete designs.ts**

```bash
rm scripts/assemble/designs.ts
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `bun run --print 'import { renderSlide } from "./scripts/assemble/slides"' 2>&1`
Expected: no errors

- [ ] **Step 6: Full assembly test on 2 decks (one portrait, one landscape)**

```bash
bun scripts/assemble-deck.ts -i templates/full-decks/knowledge-arch-blueprint-3x4/slides.json -o /tmp/test-bp.html 2>&1
bun scripts/assemble-deck.ts -i templates/full-decks/hermes-cyber-terminal/slides.json -o /tmp/test-hc.html 2>&1
```
Expected: both "Written" with no errors

- [ ] **Step 7: Commit**

```bash
git rm scripts/assemble/designs.ts
git add scripts/assemble/types.ts scripts/validate-slides.ts
git commit -m "refactor: delete designs.ts — replaced by design-manifests + design-renderer"
```

---

### Task 2.1: Create QA selectors.ts (Manifest-driven selector registry)

**Files:** Create `scripts/qa/selectors.ts`

- [ ] **Step 1: Write selectors.ts**

```typescript
/**
 * selectors.ts — Build QA selector constants from Design manifests
 */
import { loadAllManifests } from "../assemble/manifest-loader";

// Base selectors always present regardless of design
const BASE_DECORATIVE = ["bg-glow", "bg-grid"];
const BASE_CHROME = [".chr-topbar", ".chr-footer", ".chr-page", ".chr-chip", ".chr-kicker", ".chr-sticker", ".chr-card-num"];

const BASE_TEXT = [
  "h1", "h2", "h3", "h4", "p", "li", "span",
  ".c-body", ".c-step-body", ".c-note-body", ".c-small",
  ".chr-title", ".chr-heading", ".chr-sub",
];

const BASE_CONTENT = [
  "h1", "h2", "h3", "h4", "p", "li", "img", "svg", "pre", "code",
  ".c-card", ".c-card-soft", ".c-step", ".c-kpi", ".c-row", ".c-grid",
  ".c-note", ".c-quote", ".c-badge", ".c-badge-row",
  ".c-stack", ".c-steps", ".c-divider",
  ".chr-title", ".chr-heading", ".chr-sub",
];

export interface SelectorRegistry {
  decorative: string[];
  chrome: string;
  text: string;
  content: string;
}

let _cached: SelectorRegistry | null = null;

export function buildSelectorRegistry(): SelectorRegistry {
  if (_cached) return _cached;

  const manifests = loadAllManifests();
  const extraDeco = manifests.flatMap(m => m.qa.decorativeClasses);
  const extraChrome = manifests.flatMap(m => m.qa.chromeSelectors);

  _cached = {
    decorative: [...new Set([...BASE_DECORATIVE, ...extraDeco])],
    chrome: [...new Set([...BASE_CHROME, ...extraChrome])].join(", "),
    text: BASE_TEXT.join(", "),
    content: BASE_CONTENT.join(", "),
  };
  return _cached;
}
```

- [ ] **Step 2: Verify selector aggregation**

Run: `bun -e "import {buildSelectorRegistry} from './scripts/qa/selectors'; const r = buildSelectorRegistry(); console.log('deco:', r.decorative.length, 'chrome:', r.chrome.split(',').length)"`
Expected: deco >= 5, chrome >= 8

- [ ] **Step 3: Commit**

```bash
git add scripts/qa/selectors.ts
git commit -m "feat(qa): add manifest-driven selector registry"
```

---

### Task 2.2: Rewire visual-qa.ts to use selector registry

**Files:** Modify `scripts/visual-qa.ts`

- [ ] **Step 1: Add import**

After existing imports, add:
```typescript
import { buildSelectorRegistry } from "./qa/selectors";
```

- [ ] **Step 2: Replace 4 hardcoded constant arrays**

Replace lines 167-190 (DECORATIVE_CLASSES, CHROME_SELECTORS, TEXT_SELECTORS, CONTENT_SELECTORS):

```typescript
const registry = buildSelectorRegistry();
const DECORATIVE_CLASSES = registry.decorative;
const CHROME_SELECTORS = registry.chrome;
const TEXT_SELECTORS = registry.text;
const CONTENT_SELECTORS = registry.content;
```

- [ ] **Step 3: Verify QA still runs**

Run: `bun scripts/visual-qa.ts --input templates/full-decks/knowledge-arch-blueprint-3x4/index.html --check-only 2>&1 | tail -5`
Expected: BLOCKER count unchanged from before

- [ ] **Step 4: Commit**

```bash
git add scripts/visual-qa.ts
git commit -m "refactor(qa): visual-qa uses manifest-driven selector registry"
```

---

### Task 2.3: Update validate-slides.ts design validation

**Files:** Modify `scripts/validate-slides.ts`

This was partially done in Task 1.8. Complete remaining work:

- [ ] **Step 1: Add "table" and "layout" to VALID_SLIDE_TYPES** (if not already done)

Line 63-66:
```typescript
const VALID_SLIDE_TYPES = [
  "cover", "section", "cards-2x2", "cards-3",
  "quote", "steps", "code", "thanks", "bullets", "kpi", "table", "html", "layout",
] as const;
```

- [ ] **Step 2: Use getDesignColors() in checkDesignCompat**

In `checkDesignCompat` (line 469), replace `DESIGN_COLORS[design]` with `getDesignColors()[design]`.

- [ ] **Step 3: Verify L0 validation passes**

Run: `bun scripts/validate-slides.ts --input templates/full-decks/hermes-cyber-terminal/slides.json 2>&1`
Expected: PASS with no FAIL

- [ ] **Step 4: Commit**

```bash
git add scripts/validate-slides.ts
git commit -m "fix(validate): add table+layout types, manifest-driven design validation"
```

---

### Task 2.4: Update analyze-changes.ts rules

**Files:** Modify `scripts/qa/analyze-changes.ts`

- [ ] **Step 1: Add design-manifests rule**

In RULES array, after the existing `designs.ts` rule (or add as new), insert:

```typescript
  {
    pattern: /scripts\/assemble\/design-manifests\//,
    decks: "ALL",
    risk: "medium",
    profiles: ["portrait", "landscape"],
    checklist: ["css-loading-integrity", "chrome-presence", "density"],
  },
  {
    pattern: /scripts\/assemble\/design-renderer\.ts/,
    decks: "ALL",
    risk: "high",
    profiles: ["portrait", "landscape"],
    checklist: ["density", "whitespace", "canvas-fill", "chrome-content-boundary", "font-container-ratio"],
  },
```

- [ ] **Step 2: Verify analyzeChanges picks up manifest changes**

Run: `bun -e "import {analyzeChanges} from './scripts/qa/analyze-changes'; const r = analyzeChanges(['scripts/assemble/design-manifests/pastel-card.json']); console.log(r.risk, r.profiles, r.checklist)"`
Expected: `medium ["portrait","landscape"] ["css-loading-integrity","chrome-presence","density"]`

- [ ] **Step 3: Commit**

```bash
git add scripts/qa/analyze-changes.ts
git commit -m "fix(qa): add design-manifests + design-renderer to analyze-changes rules"
```

---

### Task 3.1: Add renderLayout to slides.ts

**Files:** Modify `scripts/assemble/slides.ts`

This was partially done in Task 1.6 step 6. Verify it's complete.

- [ ] **Step 1: Verify renderLayout exists and works**

Check `grep -n 'renderLayout' scripts/assemble/slides.ts` — should exist.

- [ ] **Step 2: Test layout rendering**

Create a test slides.json:
```json
{"config":{"title":"Test","design":"base","canvas":"16:9"},"slides":[{"type":"layout","layout":"two-column","slots":{"left":"<h2>Left</h2><p>Content</p>","right":"<h2>Right</h2><p>Content</p>"},"title":"Test Layout"}]}
```

Run: `echo '{"config":{"title":"Test","design":"base","canvas":"16:9"},"slides":[{"type":"layout","layout":"two-column","slots":{"left":"<h2>Left</h2>","right":"<h2>Right</h2>"},"title":"Test"}]}' | bun scripts/assemble-deck.ts --stdin > /tmp/test-layout.html 2>&1`
Expected: no errors, output contains `<section class="slide"`

- [ ] **Step 3: Verify "html" type still works as backward-compat alias**

Same test but with `"type":"html"` and `"html":"<div>custom</div>"`.

- [ ] **Step 4: Commit if any changes needed**

```bash
git add scripts/assemble/slides.ts
git commit -m "feat: add layout SlideType with slot injection"
```

---

### Task 4.1: Migrate hermes-cyber-terminal px to cqi

**Files:** Modify `assets/designs/hermes-cyber-terminal.css`

The file has 47 px values across ~10 distinct sizing contexts. Convert using 1cqi ≈ 19.2px (for landscape 1920px container).

- [ ] **Step 1: Convert token-level px → cqi**

| Current | Convert to | Rationale |
|---------|-----------|-----------|
| `--radius: 10px` | `--radius: 0.52cqi` | 10/19.2 |
| `--radius-sm: 4px` | `--radius-sm: 0.21cqi` | 4/19.2 |
| `--radius-lg: 10px` | `--radius-lg: 0.52cqi` | 10/19.2 |
| `padding: 60px 84px` | `padding: 3.13cqi 4.38cqi` | 60/19.2, 84/19.2 |

- [ ] **Step 2: Convert grid/background px**

| Current | Convert to |
|---------|-----------|
| `rgba(...,.025) 3px, ... 4px` | `... 0.16cqi, ... 0.21cqi` |
| `rgba(...) 1px, transparent 1px` | `... 0.052cqi, transparent 0.052cqi` |
| `background-size: 56px 56px` | `background-size: 2.92cqi 2.92cqi` |

- [ ] **Step 3: Convert typography px**

| Current font-size | Convert to |
|-------------------|-----------|
| `11px` (topbar text) | `0.57cqi` |
| `10px` (footer) | `0.52cqi` |
| `72px` (hero number) | `3.75cqi` |
| `46px` (headline) | `2.40cqi` |
| `22px` (subtitle) | `1.15cqi` |
| `18px` (body) | `0.94cqi` |
| `--slide-pad-y: 80px` | `--slide-pad-y: 4.17cqi` |

- [ ] **Step 4: Convert spacing/margin px**

| Current | Convert to |
|---------|-----------|
| `top: 32px; left: 84px; right: 84px` | `top: 1.67cqi; left: 4.38cqi; right: 4.38cqi` |
| `bottom: 32px; left: 84px; right: 84px` | `bottom: 1.67cqi; left: 4.38cqi; right: 4.38cqi` |
| `padding-top: 14px` | `padding-top: 0.73cqi` |
| `margin: 14px 0 12px` | `margin: 0.73cqi 0 0.63cqi` |
| `margin: 0 0 10px` | `margin: 0 0 0.52cqi` |
| `margin-left: 6px` | `margin-left: 0.31cqi` |
| `gap: 8px` | `gap: 0.42cqi` |
| `width: 11px; height: 11px` | `width: 0.57cqi; height: 0.57cqi` |
| `width: 12px` | `width: 0.63cqi` |
| `border-radius: 10px` (card) | `border-radius: 0.52cqi` |
| `padding: 20px 24px` | `padding: 1.04cqi 1.25cqi` |
| `max-width: 780px` | `max-width: 40.63cqi` |
| `text-shadow: 0 0 30px..., 0 0 60px...` | `text-shadow: 0 0 1.56cqi..., 0 0 3.13cqi...` |

- [ ] **Step 5: Rebuild hermes deck**

Run: `bun scripts/assemble-deck.ts -i templates/full-decks/hermes-cyber-terminal/slides.json -o /tmp/test-hermes.html 2>&1`
Expected: "Written"

- [ ] **Step 6: Run font-unit check**

Run: `bun scripts/visual-qa.ts --input /tmp/test-hermes.html --check-only 2>&1 | grep 'font-unit'`
Expected: 0 font-unit BLOCKER (was 0 before, should stay 0)

- [ ] **Step 7: Commit**

```bash
git add assets/designs/hermes-cyber-terminal.css
git commit -m "refactor(hermes): migrate all px to cqi — 47 values, container-responsive"
```

---

### Task 5.1: End-to-end regression verification

**Files:** None (verification only)

- [ ] **Step 1: Run QA --check on all decks**

```bash
bun scripts/qa.ts --check 2>&1 | tail -10
```
Expected: BLOCKER count per deck should NOT increase vs pre-refactor baseline.

- [ ] **Step 2: Screenshot baseline compare on 3 sample decks**

```bash
bun scripts/qa/baseline.ts compare --deck knowledge-arch-blueprint-3x4 2>&1
bun scripts/qa/baseline.ts compare --deck xhs-post 2>&1
bun scripts/qa/baseline.ts compare --deck hermes-cyber-terminal 2>&1
```
Expected: all slides < 5% diff. xhs-post may have slight diff due to inline style → CSS migration.

- [ ] **Step 3: Verify all 5 manifests load without error**

```bash
bun -e "import {loadAllManifests} from './scripts/assemble/manifest-loader'; console.log(loadAllManifests().length + ' manifests OK')"
```
Expected: "5 manifests OK"

- [ ] **Step 4: Verify designs.ts is deleted**

```bash
test -f scripts/assemble/designs.ts && echo "STILL EXISTS - FAIL" || echo "Deleted - OK"
```
Expected: "Deleted - OK"

- [ ] **Step 5: Commit any final fixes, then push**

```bash
git push
```
