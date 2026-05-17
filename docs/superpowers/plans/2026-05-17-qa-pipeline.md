# QA Pipeline & Regression System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build unified QA pipeline (17 detection groups × dual canvas profiles) + change-aware regression system + superpowers workflow integration.

**Architecture:** New `scripts/qa/` module (profiles, analyze-changes, generate-plan, baseline) + unified `scripts/qa.ts` CLI + enhanced `scripts/visual-qa.ts` with 7 new detection groups and profile-driven thresholds. All integrated into superpowers development workflow via CLAUDE.md.

**Tech Stack:** TypeScript (Bun runtime), Playwright (screenshot + DOM evaluation), pixelmatch + pngjs (regression diff)

---

### Task 1: Create profiles.ts + refactor visual-qa.ts to use profiles

**Files:**
- Create: `scripts/qa/profiles.ts`
- Modify: `scripts/visual-qa.ts:354-538` (whitespace thresholds)
- Modify: `scripts/visual-qa.ts:1004-1053` (density thresholds)
- Modify: `scripts/visual-qa.ts:158-160` (isPortrait + profile detection)

- [ ] **Step 1: Create profiles.ts with portrait/landscape threshold configs**

```typescript
// scripts/qa/profiles.ts

export interface CanvasProfile {
  fillMin: number;
  fillMax: number;
  componentMin: number;
  componentMax: number;
  bottomEmptyMaxRatio: number;   // 底部空白区域最大占比（0 = 不检查）
  gridMaxCols: number;           // 最大网格列数（0 = 不检查）
  bodyMinCqi: number;            // 最小正文字号（cqi）
  fontNoPx: boolean;             // 是否禁止 px 字号
  h1MinCqi: number;
  h1MaxCqi: number;
  bodyMinCqiAbs: number;
  bodyMaxCqi: number;
}

export const PROFILES: Record<string, CanvasProfile> = {
  portrait: {
    fillMin: 0.50,
    fillMax: 0.85,
    componentMin: 4,
    componentMax: 8,
    bottomEmptyMaxRatio: 0.25,
    gridMaxCols: 2,
    bodyMinCqi: 1.4,
    fontNoPx: true,
    h1MinCqi: 5,
    h1MaxCqi: 9,
    bodyMinCqiAbs: 1.4,
    bodyMaxCqi: 2.5,
  },
  landscape: {
    fillMin: 0.20,
    fillMax: 0.85,
    componentMin: 2,
    componentMax: 6,
    bottomEmptyMaxRatio: 0,
    gridMaxCols: 0,
    bodyMinCqi: 0,
    fontNoPx: false,
    h1MinCqi: 0,
    h1MaxCqi: 0,
    bodyMinCqiAbs: 0,
    bodyMaxCqi: 0,
  },
};

export function detectCanvas(html: string): "portrait" | "landscape" {
  return /class="[^"]*portrait/.test(html) || /class='[^']*portrait/.test(html)
    ? "portrait" : "landscape";
}
```

- [ ] **Step 2: Verify profile module compiles**

Run: `bun run --print 'import "./scripts/qa/profiles.ts"; console.log("OK")'`
Expected: "OK" without errors

- [ ] **Step 3: Refactor visual-qa.ts isPortrait() to use detectCanvas and pass profile to checks**

In `scripts/visual-qa.ts`, replace the `isPortrait` function and the main orchestration:

At line 158, replace `isPortrait`:
```typescript
import { detectCanvas, PROFILES, type CanvasProfile } from "./qa/profiles.js";

function isPortrait(html: string): boolean {
  return detectCanvas(html) === "portrait";
}
```

In `main()`, after detecting portrait (~line 1175), add profile object:
```typescript
const portrait = isPortrait(html);
const profile = portrait ? PROFILES.portrait : PROFILES.landscape;
```

- [ ] **Step 4: Update checkWhitespace to accept and use profile object**

Change signature at line 354:
```typescript
async function checkWhitespace(page: any, slideIndex: number, profile: CanvasProfile): Promise<Issue[]> {
```

Inside the evaluate, replace `args.portrait` usages with profile fields:
- Line 421-422: Replace `const thresholdLow = args.portrait ? 18 : 15; const thresholdWarn = args.portrait ? 35 : 30;` with:
```javascript
const thresholdLow = args.profile.fillMin * 100;
const thresholdWarn = (args.profile.fillMin + 0.15) * 100;
```
- Add bottom-empty check at end of evaluate (after line 535):
```javascript
// Bottom emptiness check (portrait-specific)
if (args.profile.bottomEmptyMaxRatio > 0 && bottomWhitespace > args.profile.bottomEmptyMaxRatio) {
  issues.push({ group: "canvas-fill", severity: "WARN", slide: args.idx + 1,
    element: ".slide", message: `底部 ${(bottomWhitespace * 100).toFixed(0)}% 空白（> ${(args.profile.bottomEmptyMaxRatio * 100).toFixed(0)}%），3:4 需更高信息密度` });
}
```

Update the evaluate call at line 538:
```typescript
}, { idx: slideIndex, selectors: CONTENT_SELECTORS, decoClasses: DECORATIVE_CLASSES, profile });
```

- [ ] **Step 5: Update checkDensity to use profile**

Change signature at line 1006:
```typescript
async function checkDensity(page: any, slideIndex: number, profile: CanvasProfile): Promise<Issue[]> {
```

Replace the threshold logic at line 1039:
```javascript
const max = args.profile.componentMax;
const min = args.profile.componentMin;
```

Add under-max check after existing count check:
```javascript
if (args.profile.componentMin > 0 && count < args.profile.componentMin) {
  return [{
    group: "density",
    severity: "WARN",
    slide: args.idx + 1,
    element: ".slide",
    message: `仅 ${count} 个组件（最少 ${args.profile.componentMin}），3:4 建议增加组件填充`,
  }];
}
```

Update evaluate call:
```typescript
}, { idx: slideIndex, profile });
```

- [ ] **Step 6: Update main() orchestration to pass profile**

In `main()`, update calls to checkWhitespace and checkDensity at lines 1197-1204:
```typescript
const [overflow, occlusion, whitespace, spacing, contrast, density] = await Promise.all([
  checkTextOverflow(page, i),
  checkOcclusion(page, i),
  checkWhitespace(page, i, profile),
  checkSpacing(page, i),
  checkContrast(page, i),
  checkDensity(page, i, profile),
]);
```

- [ ] **Step 7: Run visual-qa against knowledge-arch-blueprint-3x4 to verify no breakage**

Run: `bun scripts/visual-qa.ts --input templates/full-decks/knowledge-arch-blueprint-3x4/index.html --check-only`
Expected: Output shows portrait profile active, no JS errors

- [ ] **Step 8: Commit**

```bash
git add scripts/qa/profiles.ts scripts/visual-qa.ts
git commit -m "feat: add CanvasProfile system + refactor visual-qa to use profile thresholds"
```

---

### Task 2: Add detection groups 11 (chrome-content-boundary) + 12 (canvas-fill)

**Files:**
- Modify: `scripts/visual-qa.ts` (add two new check functions + wire into main)

- [ ] **Step 1: Add checkChromeContentBoundary function**

Insert after the checkDensity function (after line 1053):

```typescript
// ─── Group 11: Chrome-content boundary ────────────────────────────────────

async function checkChromeContentBoundary(page: any, slideIndex: number): Promise<Issue[]> {
  return page.evaluate((args: { idx: number }) => {
    const active = document.querySelector(".deck > .slide.is-active");
    if (!active) return [];

    const issues: any[] = [];
    const slideRect = active.getBoundingClientRect();

    // Find chr-topbar and chr-footer
    const topbar = active.querySelector(".chr-topbar") as HTMLElement | null;
    const footer = active.querySelector(".chr-footer") as HTMLElement | null;

    // Get all direct content children (not chrome, not decorative)
    const contentChildren: Element[] = [];
    for (const el of active.children) {
      const cls = el.getAttribute("class") || "";
      if (cls.includes("chr-topbar") || cls.includes("chr-footer") ||
          cls.includes("chr-blob") || cls.includes("bg-") || cls.includes("chr-hc-")) continue;
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;
      if (style.position === "absolute" || style.position === "fixed") continue;
      contentChildren.push(el);
    }

    // Check topbar overlaps with first content element
    if (topbar) {
      const tbRect = topbar.getBoundingClientRect();
      const tbBottom = tbRect.bottom - slideRect.top;

      for (const child of contentChildren) {
        const childRect = child.getBoundingClientRect();
        const childTop = childRect.top - slideRect.top;
        const overlap = tbBottom - childTop;
        if (overlap > 5) {
          issues.push({
            group: "chrome-content-boundary",
            severity: "BLOCKER",
            slide: args.idx + 1,
            element: ".chr-topbar",
            message: `chr-topbar 与内容重叠 ${overlap.toFixed(0)}px，建议增加间距或调整 padding-top`,
          });
          break;
        }
      }
    }

    // Check footer overlaps with last content element
    if (footer) {
      const ftRect = footer.getBoundingClientRect();
      const ftTop = ftRect.top - slideRect.top;

      let lastChild: Element | null = null;
      let maxBottom = 0;
      for (const child of contentChildren) {
        const childRect = child.getBoundingClientRect();
        const childBottom = childRect.bottom - slideRect.top;
        if (childBottom > maxBottom) {
          maxBottom = childBottom;
          lastChild = child;
        }
      }

      if (lastChild) {
        const overlap = maxBottom - ftTop;
        if (overlap > 5) {
          issues.push({
            group: "chrome-content-boundary",
            severity: "BLOCKER",
            slide: args.idx + 1,
            element: ".chr-footer",
            message: `chr-footer 与内容重叠 ${overlap.toFixed(0)}px`,
          });
        }
      }
    }

    return issues;
  }, { idx: slideIndex });
}
```

- [ ] **Step 2: Add checkCanvasFill function** (portrait-specific bottom emptiness)

Insert after checkChromeContentBoundary:

```typescript
// ─── Group 12: Canvas fill (portrait bottom emptiness) ─────────────────────

async function checkCanvasFill(page: any, slideIndex: number, profile: CanvasProfile): Promise<Issue[]> {
  if (profile.bottomEmptyMaxRatio <= 0) return []; // landscape: skip

  return page.evaluate((args: { idx: number; bottomEmptyMaxRatio: number }) => {
    const active = document.querySelector(".deck > .slide.is-active");
    if (!active) return [];

    const slideRect = active.getBoundingClientRect();
    const slideH = slideRect.height;
    const issues: any[] = [];

    // Find lowest content element (excluding chrome)
    let lowestBottom = 0;
    const children = active.children;
    for (const el of children) {
      const cls = el.getAttribute("class") || "";
      if (cls.includes("chr-topbar") || cls.includes("chr-footer") ||
          cls.includes("chr-blob") || cls.includes("bg-") || cls.includes("chr-hc-")) continue;
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;
      if (style.position === "absolute" || style.position === "fixed") continue;
      const rect = el.getBoundingClientRect();
      const relBottom = (rect.bottom - slideRect.top) / slideH;
      if (relBottom > lowestBottom) lowestBottom = relBottom;
    }

    const bottomEmpty = 1 - lowestBottom;
    if (bottomEmpty > args.bottomEmptyMaxRatio) {
      issues.push({
        group: "canvas-fill",
        severity: (bottomEmpty > args.bottomEmptyMaxRatio * 1.5) ? "BLOCKER" : "WARN",
        slide: args.idx + 1,
        element: ".slide",
        message: `底部 ${(bottomEmpty * 100).toFixed(0)}% 空白（阈值 ${(args.bottomEmptyMaxRatio * 100).toFixed(0)}%），建议增加组件或使用 .v-distribute`,
      });
    }

    return issues;
  }, { idx: slideIndex, bottomEmptyMaxRatio: profile.bottomEmptyMaxRatio });
}
```

- [ ] **Step 3: Wire new checks into main() orchestration**

In `main()`, add to the per-slide checks Promise.all (~line 1197):
```typescript
const [overflow, occlusion, whitespace, spacing, contrast, density,
       chromeBoundary, canvasFill] = await Promise.all([
  checkTextOverflow(page, i),
  checkOcclusion(page, i),
  checkWhitespace(page, i, profile),
  checkSpacing(page, i),
  checkContrast(page, i),
  checkDensity(page, i, profile),
  checkChromeContentBoundary(page, i),
  checkCanvasFill(page, i, profile),
]);

allIssues.push(...overflow, ...occlusion, ...whitespace, ...spacing, ...contrast, ...density,
  ...chromeBoundary, ...canvasFill);
```

- [ ] **Step 4: Run against blueprint-3x4 to verify new checks work**

Run: `bun scripts/visual-qa.ts --input templates/full-decks/knowledge-arch-blueprint-3x4/index.html --check-only`
Expected: New groups appear in output (chrome-content-boundary, canvas-fill), no JS errors

- [ ] **Step 5: Commit**

```bash
git add scripts/visual-qa.ts
git commit -m "feat: add QA groups 11 (chrome-content-boundary) + 12 (canvas-fill)"
```

---

### Task 3: Add detection groups 13 (font-unit) + 14 (css-loading-integrity)

**Files:**
- Modify: `scripts/visual-qa.ts`

- [ ] **Step 1: Add checkFontUnit function**

Insert after checkCanvasFill:

```typescript
// ─── Group 13: Font unit check (portrait: no px font-size) ─────────────────

async function checkFontUnit(page: any, slideIndex: number, profile: CanvasProfile): Promise<Issue[]> {
  if (!profile.fontNoPx) return [];

  return page.evaluate((args: { idx: number; bodyMinCqi: number }) => {
    const active = document.querySelector(".deck > .slide.is-active");
    if (!active) return [];

    const issues: any[] = [];
    const contentSelectors = [
      "h1", "h2", "h3", "h4", "p", "li", "span",
      ".c-card", ".c-card-soft", ".c-step", ".c-kpi",
      ".c-note", ".c-quote", ".c-badge",
      ".chr-title", ".chr-heading", ".chr-sub",
    ];

    for (const sel of contentSelectors) {
      for (const el of active.querySelectorAll(sel)) {
        const style = window.getComputedStyle(el);
        const fontSize = style.fontSize;
        // Check if using px (not cqi or CSS var via cqi)
        if (fontSize.endsWith("px")) {
          const px = parseFloat(fontSize);
          // Convert to approximate cqi (deck container ~810px in portrait)
          const activeSlide = document.querySelector(".deck > .slide.is-active");
          const slideW = activeSlide ? activeSlide.getBoundingClientRect().width : 810;
          const approxCqi = (px / slideW) * 100;
          if (args.bodyMinCqi > 0 && approxCqi < args.bodyMinCqi) {
            const cls = el.getAttribute("class") || el.tagName.toLowerCase();
            issues.push({
              group: "font-unit",
              severity: "WARN",
              slide: args.idx + 1,
              element: cls.split(" ")[0] || el.tagName.toLowerCase(),
              message: `字号 ${px}px（≈${approxCqi.toFixed(1)}cqi）< ${args.bodyMinCqi}cqi 最小值，建议使用 --c-* token 或 cqi 单位`,
            });
          }
        }
      }
    }

    return issues;
  }, { idx: slideIndex, bodyMinCqi: profile.bodyMinCqi });
}
```

- [ ] **Step 2: Add checkCSSLoadingIntegrity function**

Insert after checkFontUnit:

```typescript
// ─── Group 14: CSS loading integrity ───────────────────────────────────────

async function checkCSSLoadingIntegrity(page: any): Promise<Issue[]> {
  return page.evaluate(() => {
    const issues: any[] = [];
    const body = document.body;
    const bodyClass = body.getAttribute("class") || "";

    // Check 1: body has d-xxx class → corresponding design CSS must be loaded
    const designMatch = bodyClass.match(/d-([a-z-]+)/);
    if (designMatch) {
      const designName = designMatch[1];
      const styleTags = document.querySelectorAll("style");
      let foundDesignCSS = false;
      for (const tag of styleTags) {
        if ((tag.textContent || "").includes(`design: ${designName}`) ||
            (tag.textContent || "").includes(`${designName}.css`)) {
          foundDesignCSS = true;
          break;
        }
      }
      // Also check inline style blocks for design-specific selectors
      if (!foundDesignCSS) {
        // Check if .d-xxx selector exists in any style
        for (const tag of styleTags) {
          if ((tag.textContent || "").includes(`.d-${designName}`)) {
            foundDesignCSS = true;
            break;
          }
        }
      }
      if (!foundDesignCSS) {
        issues.push({
          group: "css-loading-integrity",
          severity: "BLOCKER",
          slide: 0,
          element: "body",
          message: `body class "d-${designName}" 但未找到对应 design CSS，设计样式可能缺失`,
        });
      }
    }

    // Check 2: body class must match expected canvas
    const hasPortrait = bodyClass.includes("portrait");
    const hasLandscape = bodyClass.includes("landscape");
    const deckEl = document.querySelector(".deck");
    if (deckEl) {
      const deckStyle = window.getComputedStyle(deckEl);
      const deckWidth = deckEl.getBoundingClientRect().width;
      // Portrait deck should be narrower than landscape
      if (hasPortrait && deckWidth > 1200) {
        issues.push({
          group: "css-loading-integrity",
          severity: "WARN",
          slide: 0,
          element: ".deck",
          message: `body.portrait 但 deck 宽度 ${deckWidth.toFixed(0)}px（> 1200px），canvas 可能未正确应用`,
        });
      }
    }

    return issues;
  });
}
```

- [ ] **Step 3: Wire new checks into main()**

Add `checkFontUnit` to per-slide Promise.all:
```typescript
checkFontUnit(page, i, profile),
```

Add `checkCSSLoadingIntegrity` to cross-slide Promise.all (~line 1217):
```typescript
const [chromePos, chromePresence, cssVars, cssLoading] = await Promise.all([
  checkChromePositions(page, totalSlides),
  checkChromePresence(page, totalSlides),
  checkCSSVarHealth(page),
  checkCSSLoadingIntegrity(page),
]);
allIssues.push(...chromePos, ...chromePresence, ...cssVars, ...cssLoading);
```

- [ ] **Step 4: Run against blueprint-3x4 to verify**

Run: `bun scripts/visual-qa.ts --input templates/full-decks/knowledge-arch-blueprint-3x4/index.html --check-only`
Expected: font-unit and css-loading-integrity groups in output

- [ ] **Step 5: Commit**

```bash
git add scripts/visual-qa.ts
git commit -m "feat: add QA groups 13 (font-unit) + 14 (css-loading-integrity)"
```

---

### Task 4: Add detection groups 15 (grid-collapse) + 16 (chrome-z-index)

**Files:**
- Modify: `scripts/visual-qa.ts`

- [ ] **Step 1: Add checkGridCollapse function**

Insert after checkCSSLoadingIntegrity:

```typescript
// ─── Group 15: Grid collapse (portrait: g3/g4 must collapse) ───────────────

async function checkGridCollapse(page: any, slideIndex: number, profile: CanvasProfile): Promise<Issue[]> {
  if (profile.gridMaxCols <= 0) return [];

  return page.evaluate((args: { idx: number; gridMaxCols: number }) => {
    const active = document.querySelector(".deck > .slide.is-active");
    if (!active) return [];

    const issues: any[] = [];
    const gridSelectors = [".g3", ".g4", ".c-grid-3", ".c-grid-4"];

    for (const sel of gridSelectors) {
      for (const grid of active.querySelectorAll(sel)) {
        const style = window.getComputedStyle(grid);
        const cols = style.gridTemplateColumns.split(" ").length;
        if (cols > args.gridMaxCols) {
          issues.push({
            group: "grid-collapse",
            severity: "WARN",
            slide: args.idx + 1,
            element: sel,
            message: `${sel} 网格 ${cols} 列 > ${args.gridMaxCols} 列（3:4 最大），窄画布需减少列数`,
          });
        }
      }
    }

    return issues;
  }, { idx: slideIndex, gridMaxCols: profile.gridMaxCols });
}
```

- [ ] **Step 2: Add checkChromeZIndex function**

Insert after checkGridCollapse:

```typescript
// ─── Group 16: Chrome z-index ──────────────────────────────────────────────

async function checkChromeZIndex(page: any, slideIndex: number): Promise<Issue[]> {
  return page.evaluate((args: { idx: number }) => {
    const active = document.querySelector(".deck > .slide.is-active");
    if (!active) return [];

    const issues: any[] = [];

    // Check all chr-* elements with absolute positioning
    for (const el of active.querySelectorAll("[class*='chr-']")) {
      const style = window.getComputedStyle(el);
      if (style.position === "absolute" || style.position === "fixed") {
        const zIndex = parseInt(style.zIndex) || 0;

        // Check if any CSS rule overrides position on chr-* elements
        // Look for .slide > * { position: relative } type rules
        const parent = el.parentElement;
        if (parent && parent.classList.contains("slide")) {
          // Check if there's a global rule setting position:relative on slide children
          // We detect this by checking if a non-chrome sibling has position:relative
          for (const sibling of parent.children) {
            if (sibling === el) continue;
            const sibCls = sibling.getAttribute("class") || "";
            if (!sibCls.includes("chr-")) {
              const sibPos = window.getComputedStyle(sibling).position;
              if (sibPos === "relative") {
                // This is expected — but verify chr-* still has absolute
                if (style.position !== "absolute") {
                  issues.push({
                    group: "chrome-z-index",
                    severity: "BLOCKER",
                    slide: args.idx + 1,
                    element: el.getAttribute("class")?.split(" ")[0] || "chr-*",
                    message: `Chrome 元素 position 被覆盖为 ${style.position}（应为 absolute），检查 .slide > * 规则`,
                  });
                }
              }
            }
          }
        }

        // Verify z-index is above content (content typically z-index 1-2)
        if (zIndex < 3 && zIndex > 0) {
          // Only flag if z-index is explicitly set low
        }
      }
    }

    return issues;
  }, { idx: slideIndex });
}
```

- [ ] **Step 3: Wire into main()**

Add to per-slide Promise.all:
```typescript
checkGridCollapse(page, i, profile),
checkChromeZIndex(page, i),
```

- [ ] **Step 4: Run against blueprint-3x4 to verify**

Run: `bun scripts/visual-qa.ts --input templates/full-decks/knowledge-arch-blueprint-3x4/index.html --check-only`
Expected: grid-collapse and chrome-z-index groups in output

- [ ] **Step 5: Commit**

```bash
git add scripts/visual-qa.ts
git commit -m "feat: add QA groups 15 (grid-collapse) + 16 (chrome-z-index)"
```

---

### Task 5: Add detection group 17 (font-container-ratio) — font-to-component proportion perception

**Files:**
- Modify: `scripts/visual-qa.ts`

- [ ] **Step 1: Add font-container ratio comfort zones + check function**

Insert after checkChromeZIndex:

```typescript
// ─── Group 17: Font-container ratio ────────────────────────────────────────

const FONT_CONTAINER_RATIOS: Record<string, { titleMin: number; titleMax: number; bodyMin: number; bodyMax: number }> = {
  "c-card":       { titleMin: 0.06, titleMax: 0.10, bodyMin: 0.04, bodyMax: 0.07 },
  "c-card-soft":  { titleMin: 0.06, titleMax: 0.10, bodyMin: 0.04, bodyMax: 0.07 },
  "c-card-accent":{ titleMin: 0.06, titleMax: 0.10, bodyMin: 0.04, bodyMax: 0.07 },
  "c-hero":       { titleMin: 0.08, titleMax: 0.14, bodyMin: 0,     bodyMax: 0 },
  "c-hero-num":   { titleMin: 0.08, titleMax: 0.14, bodyMin: 0,     bodyMax: 0 },
  "c-step":       { titleMin: 0.05, titleMax: 0.08, bodyMin: 0.03, bodyMax: 0.05 },
  "c-codebox":    { titleMin: 0,     titleMax: 0,     bodyMin: 0.02, bodyMax: 0.03 },
  "c-quote":      { titleMin: 0,     titleMax: 0,     bodyMin: 0.05, bodyMax: 0.08 },
  "c-kpi":        { titleMin: 0.08, titleMax: 0.12, bodyMin: 0.03, bodyMax: 0.05 },
};

async function checkFontContainerRatio(page: any, slideIndex: number): Promise<Issue[]> {
  return page.evaluate((args: { idx: number; ratios: Record<string, any> }) => {
    const active = document.querySelector(".deck > .slide.is-active");
    if (!active) return [];

    const issues: any[] = [];

    for (const [baseClass, zone] of Object.entries(args.ratios)) {
      const components = active.querySelectorAll(`.${baseClass}`);
      for (const comp of components) {
        const compRect = comp.getBoundingClientRect();
        const compWidth = compRect.width;
        if (compWidth < 50) continue; // skip tiny elements

        // Check title font
        if (zone.titleMin > 0) {
          const titleEl = comp.querySelector("h1, h2, h3, h4, .c-title, .chr-heading, .c-hero-num-value, .c-kpi-value");
          if (titleEl) {
            const fontSize = parseFloat(window.getComputedStyle(titleEl).fontSize);
            const ratio = fontSize / compWidth;
            if (ratio < zone.titleMin) {
              issues.push({
                group: "font-container-ratio",
                severity: "WARN",
                slide: args.idx + 1,
                element: `.${baseClass} title`,
                message: `标题占容器 ${(ratio * 100).toFixed(1)}%（建议 ${(zone.titleMin * 100).toFixed(0)}-${(zone.titleMax * 100).toFixed(0)}%），字体偏小`,
              });
            }
          }
        }

        // Check body font
        if (zone.bodyMin > 0) {
          const bodyEls = comp.querySelectorAll("p, .c-body, .c-sub, .c-step-body, .c-quote-text, .c-note-body");
          for (const bodyEl of bodyEls) {
            // Only check direct or near-direct children
            if (bodyEl.closest(`.${baseClass}`) !== comp) continue;
            const fontSize = parseFloat(window.getComputedStyle(bodyEl).fontSize);
            const ratio = fontSize / compWidth;
            if (ratio < zone.bodyMin) {
              issues.push({
                group: "font-container-ratio",
                severity: "WARN",
                slide: args.idx + 1,
                element: `.${baseClass} body`,
                message: `正文占容器 ${(ratio * 100).toFixed(1)}%（建议 ${(zone.bodyMin * 100).toFixed(0)}-${(zone.bodyMax * 100).toFixed(0)}%），字体偏小`,
              });
              break; // one warning per component per type
            }
          }
        }
      }
    }

    return issues;
  }, { idx: slideIndex, ratios: FONT_CONTAINER_RATIOS });
}
```

- [ ] **Step 2: Wire into main() per-slide checks**

```typescript
checkFontContainerRatio(page, i),
```

- [ ] **Step 3: Run against blueprint-3x4 to verify**

Run: `bun scripts/visual-qa.ts --input templates/full-decks/knowledge-arch-blueprint-3x4/index.html --check-only`
Expected: font-container-ratio group in output, identifies font proportion issues

- [ ] **Step 4: Commit**

```bash
git add scripts/visual-qa.ts
git commit -m "feat: add QA group 17 (font-container-ratio) — component proportion perception"
```

---

### Task 6: Create analyze-changes.ts — git diff → affected decks

**Files:**
- Create: `scripts/qa/analyze-changes.ts`

- [ ] **Step 1: Write the change analysis module**

```typescript
// scripts/qa/analyze-changes.ts

export interface ChangeImpact {
  files: string[];
  affectedDecks: string[];
  allDecks: boolean;
  riskLevel: "high" | "medium" | "low";
  canvasProfiles: string[];
  focusDecks: string[];
  checklist: string[];
}

const ROOT = import.meta.dir.replace("/scripts/qa", "");

const DECK_DIR = `${ROOT}/templates/full-decks`;

const RULES: { pattern: RegExp; decks: string[] | "ALL"; risk: "high" | "medium" | "low"; profiles: string[]; checklist: string[] }[] = [
  { pattern: /assets\/base\.css/, decks: "ALL", risk: "high", profiles: ["portrait", "landscape"], checklist: ["font-hierarchy", "whitespace", "chrome-content-boundary"] },
  { pattern: /assets\/components\.css/, decks: "ALL", risk: "high", profiles: ["portrait", "landscape"], checklist: ["font-container-ratio", "density", "grid-collapse"] },
  { pattern: /assets\/fonts\.css/, decks: "ALL", risk: "medium", profiles: ["portrait", "landscape"], checklist: ["font-hierarchy"] },
  { pattern: /assets\/base-design-chrome\.css/, decks: "ALL", risk: "high", profiles: ["portrait", "landscape"], checklist: ["chrome-content-boundary", "chrome-z-index", "chrome-position"] },
  { pattern: /assets\/designs\/(.+)\.css/, decks: "ALL", risk: "medium", profiles: ["portrait", "landscape"], checklist: ["css-loading-integrity", "font-hierarchy"] },
  { pattern: /assets\/layers\/density\//, decks: "ALL", risk: "low", profiles: ["portrait", "landscape"], checklist: ["density"] },
  { pattern: /assets\/layers\//, decks: "ALL", risk: "low", profiles: ["portrait", "landscape"], checklist: [] },
  { pattern: /scripts\/assemble\/skeleton\.ts/, decks: "ALL", risk: "high", profiles: ["portrait", "landscape"], checklist: ["css-loading-integrity", "chrome-presence"] },
  { pattern: /scripts\/assemble\/slides\.ts/, decks: "ALL", risk: "high", profiles: ["portrait", "landscape"], checklist: ["density", "whitespace", "canvas-fill"] },
  { pattern: /scripts\/assemble\/types\.ts/, decks: "ALL", risk: "medium", profiles: ["portrait", "landscape"], checklist: [] },
  { pattern: /templates\/full-decks\/([^/]+)\//, decks: [], risk: "low", profiles: [], checklist: [] },
];

function getAllDecks(): string[] {
  const decks: string[] = [];
  for (const entry of new Bun.Glob("*").scanSync(DECK_DIR)) {
    const fullPath = `${DECK_DIR}/${entry}`;
    try {
      if (Bun.statSync(fullPath).isDirectory() && Bun.file(`${fullPath}/index.html`).size > 0) {
        decks.push(entry);
      }
    } catch {}
  }
  return decks;
}

export function analyzeChanges(files: string[]): ChangeImpact {
  const allDecks = getAllDecks();
  let affectedDecks: Set<string> = new Set();
  let riskLevel: "high" | "medium" | "low" = "low";
  let allDeckMode = false;
  const profiles = new Set<string>();
  const checklist: string[] = [];

  for (const file of files) {
    for (const rule of RULES) {
      if (rule.pattern.test(file)) {
        if (rule.decks === "ALL") {
          allDeckMode = true;
        } else if (Array.isArray(rule.decks)) {
          for (const d of rule.decks) affectedDecks.add(d);
        }
        // Match deck-specific: templates/full-decks/<name>/slides.json
        const deckMatch = file.match(/templates\/full-decks\/([^/]+)\//);
        if (deckMatch) affectedDecks.add(deckMatch[1]);

        if (rule.risk === "high") riskLevel = "high";
        else if (rule.risk === "medium" && riskLevel !== "high") riskLevel = "medium";

        for (const p of rule.profiles) profiles.add(p);
        for (const c of rule.checklist) if (!checklist.includes(c)) checklist.push(c);
      }
    }
  }

  const deckList = allDeckMode ? allDecks : [...affectedDecks];

  // Determine focus decks: portrait decks for portrait-related changes
  const portraitDecks = deckList.filter(d =>
    d.startsWith("xhs-") || d.includes("3x4") || d.includes("portrait") || d === "component-showcase"
  );

  return {
    files,
    affectedDecks: deckList,
    allDecks: allDeckMode,
    riskLevel,
    canvasProfiles: profiles.size > 0 ? [...profiles] : ["portrait", "landscape"],
    focusDecks: portraitDecks.length > 0 ? portraitDecks.slice(0, 4) : deckList.slice(0, 4),
    checklist: checklist.length > 0 ? checklist : ["text-overflow", "occlusion", "contrast"],
  };
}

// CLI: run via `bun scripts/qa/analyze-changes.ts [base-ref]`
if (import.meta.main) {
  const baseRef = process.argv[2] || "HEAD~1";
  const proc = Bun.spawnSync(["git", "diff", "--name-only", baseRef, "HEAD"], { cwd: ROOT });
  const files = new TextDecoder().decode(proc.stdout).trim().split("\n").filter(Boolean);
  const impact = analyzeChanges(files);
  console.log(JSON.stringify(impact, null, 2));
}
```

- [ ] **Step 2: Test with current git diff**

Run: `bun scripts/qa/analyze-changes.ts HEAD~5`
Expected: JSON output with affected files, decks, risk level

- [ ] **Step 3: Commit**

```bash
git add scripts/qa/analyze-changes.ts
git commit -m "feat: add change impact analyzer (analyze-changes.ts)"
```

---

### Task 7: Create generate-plan.ts + baseline.ts

**Files:**
- Create: `scripts/qa/generate-plan.ts`
- Create: `scripts/qa/baseline.ts`

- [ ] **Step 1: Write generate-plan.ts**

```typescript
// scripts/qa/generate-plan.ts

import { analyzeChanges, type ChangeImpact } from "./analyze-changes.js";
import { PROFILES } from "./profiles.js";

interface TestStep {
  layer: "L0" | "L1" | "L2";
  tool: string;
  decks: number | string[];
  estTime: string;
  command?: string;
}

interface TestPlan {
  change: string;
  affectedDecks: [string, number];
  riskLevel: string;
  canvasProfiles: string[];
  steps: TestStep[];
  focusDecks: string[];
  focusChecklist: string[];
}

export function generatePlan(impact: ChangeImpact): TestPlan {
  const deckCount = impact.affectedDecks.length;
  const steps: TestStep[] = [
    {
      layer: "L0",
      tool: "validate-slides.ts",
      decks: deckCount,
      estTime: `${Math.ceil(deckCount * 0.1)}s`,
    },
    {
      layer: "L1",
      tool: "visual-qa.ts",
      decks: deckCount,
      estTime: `${Math.ceil(deckCount * 2)}s`,
    },
  ];

  if (impact.riskLevel === "high") {
    const sampleDecks = impact.focusDecks.slice(0, 3);
    steps.push({
      layer: "L2",
      tool: "baseline.ts compare",
      decks: sampleDecks,
      estTime: `${sampleDecks.length * 20}s`,
      command: sampleDecks.map(d => `bun scripts/qa/baseline.ts compare --deck ${d}`).join(" && "),
    });
  }

  return {
    change: impact.files.join(", "),
    affectedDecks: [impact.allDecks ? "ALL" : "selected", deckCount],
    riskLevel: impact.riskLevel,
    canvasProfiles: impact.canvasProfiles,
    steps,
    focusDecks: impact.focusDecks,
    focusChecklist: impact.checklist,
  };
}

// CLI
if (import.meta.main) {
  const baseRef = process.argv[2] || "HEAD~1";
  const ROOT = import.meta.dir.replace("/scripts/qa", "");
  const proc = Bun.spawnSync(["git", "diff", "--name-only", baseRef, "HEAD"], { cwd: ROOT });
  const files = new TextDecoder().decode(proc.stdout).trim().split("\n").filter(Boolean);

  if (files.length === 0) {
    console.log("No changes detected. Nothing to QA.");
    process.exit(0);
  }

  const impact = analyzeChanges(files);
  const plan = generatePlan(impact);
  console.log(JSON.stringify(plan, null, 2));
}
```

- [ ] **Step 2: Verify generate-plan runs**

Run: `bun scripts/qa/generate-plan.ts HEAD~1`
Expected: JSON test plan output

- [ ] **Step 3: Write baseline.ts — screenshot capture + pixelmatch compare**

```typescript
// scripts/qa/baseline.ts

import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(import.meta.dir, "../..");
const BASELINE_DIR = path.join(ROOT, ".qa", "baselines");
const REPORT_DIR = path.join(ROOT, ".qa", "reports");

interface Manifest {
  commit: string;
  timestamp: string;
  decks: Record<string, { slides: number; viewport: { width: number; height: number } }>;
}

// ─── Screenshot capture ────────────────────────────────────────────────────

async function captureDeck(deckName: string): Promise<string[]> {
  const htmlPath = path.join(ROOT, "templates", "full-decks", deckName, "index.html");
  if (!fs.existsSync(htmlPath)) throw new Error(`HTML not found: ${htmlPath}`);

  const html = fs.readFileSync(htmlPath, "utf-8");
  const isPortrait = /class="[^"]*portrait/.test(html);
  const viewport = isPortrait
    ? { width: 810, height: 1080 }
    : { width: 1920, height: 1080 };

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });

  await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle" });
  await page.waitForSelector(".slide", { timeout: 10000 });

  const slideCount = await page.evaluate(() =>
    document.querySelectorAll(".deck > .slide").length
  );

  const deckDir = path.join(BASELINE_DIR, deckName);
  fs.mkdirSync(deckDir, { recursive: true });

  const files: string[] = [];

  for (let i = 0; i < slideCount; i++) {
    await page.evaluate((idx) => {
      const slides = document.querySelectorAll(".deck > .slide");
      slides.forEach(s => s.classList.remove("is-active"));
      slides[idx]?.classList.add("is-active");
    }, i);
    await page.waitForTimeout(300);

    const filename = `slide-${String(i + 1).padStart(2, "0")}.png`;
    const filepath = path.join(deckDir, filename);
    await page.screenshot({ path: filepath, type: "png" });
    files.push(filepath);
  }

  await browser.close();
  return files;
}

// ─── Regression compare ────────────────────────────────────────────────────

async function compareDeck(deckName: string): Promise<{ deck: string; diffs: { slide: number; diffPercent: number }[] }> {
  const htmlPath = path.join(ROOT, "templates", "full-decks", deckName, "index.html");
  const baselineDir = path.join(BASELINE_DIR, deckName);

  if (!fs.existsSync(baselineDir)) {
    throw new Error(`No baseline for ${deckName}. Run: bun scripts/qa/baseline.ts init --deck ${deckName}`);
  }

  const html = fs.readFileSync(htmlPath, "utf-8");
  const isPortrait = /class="[^"]*portrait/.test(html);
  const viewport = isPortrait
    ? { width: 810, height: 1080 }
    : { width: 1920, height: 1080 };

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
  await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle" });
  await page.waitForSelector(".slide", { timeout: 10000 });

  const slideCount = await page.evaluate(() =>
    document.querySelectorAll(".deck > .slide").length
  );

  const { PNG } = await import("pngjs");
  const pixelmatch = (await import("pixelmatch")).default;

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const diffDir = path.join(REPORT_DIR, timestamp, "diffs", deckName);
  fs.mkdirSync(diffDir, { recursive: true });

  const diffs: { slide: number; diffPercent: number }[] = [];

  for (let i = 0; i < slideCount; i++) {
    const baselineFile = path.join(baselineDir, `slide-${String(i + 1).padStart(2, "0")}.png`);
    if (!fs.existsSync(baselineFile)) {
      diffs.push({ slide: i + 1, diffPercent: 100 });
      continue;
    }

    await page.evaluate((idx) => {
      const slides = document.querySelectorAll(".deck > .slide");
      slides.forEach(s => s.classList.remove("is-active"));
      slides[idx]?.classList.add("is-active");
    }, i);
    await page.waitForTimeout(300);

    const currentScreenshot = await page.screenshot({ type: "png" });
    const currentImg = PNG.sync.read(currentScreenshot);
    const baselineImg = PNG.sync.read(fs.readFileSync(baselineFile));

    if (currentImg.width !== baselineImg.width || currentImg.height !== baselineImg.height) {
      diffs.push({ slide: i + 1, diffPercent: 100 });
      continue;
    }

    const { width, height } = currentImg;
    const diffImg = new PNG({ width, height });
    const diffPixels = pixelmatch(baselineImg.data, currentImg.data, diffImg.data, width, height, { threshold: 0.1 });

    const diffPercent = (diffPixels / (width * height)) * 100;
    diffs.push({ slide: i + 1, diffPercent: Math.round(diffPercent * 100) / 100 });

    if (diffPixels > 0) {
      fs.writeFileSync(path.join(diffDir, `slide-${String(i + 1).padStart(2, "0")}-diff.png`), PNG.sync.write(diffImg));
    }
  }

  await browser.close();

  // Write report
  const report = { deck: deckName, timestamp: new Date().toISOString(), diffs };
  fs.writeFileSync(path.join(REPORT_DIR, timestamp, "report.json"), JSON.stringify(report, null, 2));

  return { deck: deckName, diffs };
}

// ─── CLI ───────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (cmd === "init") {
    const deckName = args[args.indexOf("--deck") + 1];
    if (!deckName) {
      // Init all decks
      const deckDir = path.join(ROOT, "templates", "full-decks");
      const decks = fs.readdirSync(deckDir).filter(d => {
        const p = path.join(deckDir, d);
        return fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, "index.html"));
      });

      console.log(`Initializing baselines for ${decks.length} decks...`);
      for (const deck of decks) {
        console.log(`  Capturing: ${deck}`);
        const files = await captureDeck(deck);
        console.log(`    ${files.length} slides saved`);
      }

      // Write manifest
      const proc = Bun.spawnSync(["git", "rev-parse", "HEAD"], { cwd: ROOT });
      const commit = new TextDecoder().decode(proc.stdout).trim();

      const manifest: Manifest = {
        commit,
        timestamp: new Date().toISOString(),
        decks: {},
      };
      for (const deck of decks) {
        const deckDir2 = path.join(BASELINE_DIR, deck);
        const slides = fs.readdirSync(deckDir2).filter(f => f.endsWith(".png")).length;
        manifest.decks[deck] = { slides, viewport: { width: 0, height: 0 } };
      }
      fs.writeFileSync(path.join(BASELINE_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
      console.log("Baseline initialized.");
    } else {
      console.log(`Capturing baseline for: ${deckName}`);
      const files = await captureDeck(deckName);
      console.log(`  ${files.length} slides saved`);
    }
  } else if (cmd === "compare") {
    const deckName = args[args.indexOf("--deck") + 1];
    if (!deckName) {
      console.error("--deck <name> required for compare");
      process.exit(1);
    }
    const result = await compareDeck(deckName);
    console.log(`\nRegression: ${result.deck}`);
    for (const d of result.diffs) {
      const icon = d.diffPercent < 1 ? "✅" : d.diffPercent < 5 ? "⚠️" : "❌";
      console.log(`  ${icon} Slide ${d.slide}: ${d.diffPercent}% diff`);
    }
    const maxDiff = Math.max(...result.diffs.map(d => d.diffPercent));
    process.exit(maxDiff > 5 ? 1 : 0);
  } else {
    console.log(`Usage:
  bun scripts/qa/baseline.ts init [--deck <name>]   # 建立基线
  bun scripts/qa/baseline.ts compare --deck <name>  # 回归对比`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
```

- [ ] **Step 4: Verify baseline.ts compiles**

Run: `bun run --print 'import "./scripts/qa/baseline.ts"; console.log("OK")'`
Expected: "OK"

- [ ] **Step 5: Commit**

```bash
git add scripts/qa/generate-plan.ts scripts/qa/baseline.ts
git commit -m "feat: add test plan generator + screenshot baseline manager"
```

---

### Task 8: Create unified qa.ts CLI + update qa.sh + update CLAUDE.md

**Files:**
- Create: `scripts/qa.ts`
- Modify: `scripts/qa.sh`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Write unified CLI (scripts/qa.ts)**

```typescript
#!/usr/bin/env bun
// scripts/qa.ts — Unified QA CLI entry point
//
// Usage:
//   bun scripts/qa.ts --plan              # Generate test plan
//   bun scripts/qa.ts --check             # L0 + L1 (all decks)
//   bun scripts/qa.ts --check --deck xxx  # L0 + L1 (single deck)
//   bun scripts/qa.ts --regress           # L0 + L1 + L2 (full regression)
//   bun scripts/qa.ts --baseline init     # Initialize screenshot baselines
//   bun scripts/qa.ts --baseline update   # Update baselines

import * as path from "path";
import * as fs from "fs";

const ROOT = path.resolve(import.meta.dir, "..");

interface CliArgs {
  plan?: boolean;
  check?: boolean;
  regress?: boolean;
  baseline?: string;
  deck?: string;
  help?: boolean;
}

function parseArgs(args: string[]): CliArgs {
  const opts: CliArgs = {};
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--plan": opts.plan = true; break;
      case "--check": opts.check = true; break;
      case "--regress": opts.regress = true; break;
      case "--baseline": opts.baseline = args[++i]; break;
      case "--deck": opts.deck = args[++i]; break;
      case "--help": case "-h": opts.help = true; break;
    }
  }
  return opts;
}

function getAllDecks(): string[] {
  const deckDir = path.join(ROOT, "templates", "full-decks");
  return fs.readdirSync(deckDir).filter(d => {
    const p = path.join(deckDir, d);
    try { return fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, "index.html")); }
    catch { return false; }
  });
}

async function runCheck(decks: string[]): Promise<{ decks: number; passed: number; failed: number; blockers: number }> {
  console.log(`\n━━━ L0: validate-slides.ts ━━━\n`);
  let passed = 0, failed = 0, totalBlockers = 0;

  for (const deck of decks) {
    const slidesPath = path.join(ROOT, "templates", "full-decks", deck, "slides.json");
    if (!fs.existsSync(slidesPath)) {
      console.log(`  ⏭ ${deck}: no slides.json, skipping L0`);
    } else {
      const proc = Bun.spawnSync(["bun", path.join(ROOT, "scripts/validate-slides.ts"), "--input", slidesPath]);
      const out = new TextDecoder().decode(proc.stdout) + new TextDecoder().decode(proc.stderr);
      if (proc.exitCode === 0) {
        console.log(`  ✅ ${deck}: L0 passed`);
        passed++;
      } else {
        console.log(`  ❌ ${deck}: L0 failed`);
        failed++;
      }
    }

    const htmlPath = path.join(ROOT, "templates", "full-decks", deck, "index.html");
    if (!fs.existsSync(htmlPath)) {
      console.log(`  ⏭ ${deck}: no index.html, skipping L1`);
      continue;
    }

    console.log(`\n  [L1] visual-qa.ts: ${deck}`);
    const qaProc = Bun.spawnSync(["bun", path.join(ROOT, "scripts/visual-qa.ts"), "--input", htmlPath, "--check-only"]);
    const qaOut = new TextDecoder().decode(qaProc.stdout);
    console.log(qaOut.split("\n").filter(l => l.includes("❌") || l.includes("⚠️") || l.includes("✅")).join("\n").slice(0, 500));

    if (qaProc.exitCode === 0) passed++; else failed++;
  }

  return { decks: decks.length, passed, failed, blockers: totalBlockers };
}

async function main() {
  const cli = parseArgs(process.argv.slice(2));

  if (cli.help || Object.keys(cli).length === 0) {
    console.log(`QA Pipeline CLI

Usage:
  bun scripts/qa.ts --plan              生成 Test Plan（变更感知）
  bun scripts/qa.ts --check             快速检查 L0+L1（所有 deck）
  bun scripts/qa.ts --check --deck xxx  检查单个 deck
  bun scripts/qa.ts --regress           完整回归 L0+L1+L2（需基线）
  bun scripts/qa.ts --baseline init     建立截图基线
  bun scripts/qa.ts --baseline update   更新基线`);
    process.exit(0);
  }

  if (cli.plan) {
    const baseRef = process.argv.includes("--base") ? process.argv[process.argv.indexOf("--base") + 1] : "HEAD~1";
    const proc = Bun.spawnSync(["bun", path.join(ROOT, "scripts/qa/generate-plan.ts"), baseRef]);
    console.log(new TextDecoder().decode(proc.stdout));
    process.exit(0);
  }

  if (cli.check) {
    const decks = cli.deck ? [cli.deck] : getAllDecks();
    console.log(`QA Check: ${decks.length} deck(s)`);
    const result = await runCheck(decks);
    console.log(`\n${result.passed}/${result.decks} passed, ${result.failed} failed`);
    process.exit(result.failed > 0 ? 1 : 0);
  }

  if (cli.regress) {
    console.log("Running full regression (L0 + L1 + L2)...");
    const decks = getAllDecks();
    const result = await runCheck(decks);

    // L2: screenshot regression
    console.log(`\n━━━ L2: Screenshot Regression ━━━\n`);
    // Sample 3 portrait decks + 2 landscape decks
    const portraitDecks = decks.filter(d => d.startsWith("xhs-") || d.includes("3x4"));
    const landscapeDecks = decks.filter(d => !portraitDecks.includes(d));
    const sample = [...portraitDecks.slice(0, 3), ...landscapeDecks.slice(0, 2)];

    for (const deck of sample) {
      const proc = Bun.spawnSync(["bun", path.join(ROOT, "scripts/qa/baseline.ts"), "compare", "--deck", deck]);
      console.log(new TextDecoder().decode(proc.stdout));
    }
  }

  if (cli.baseline) {
    const args = cli.baseline === "init" ? ["init"] : ["init"];
    const proc = Bun.spawnSync(["bun", path.join(ROOT, "scripts/qa/baseline.ts"), ...args]);
    console.log(new TextDecoder().decode(proc.stdout));
  }
}

main().catch(err => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
```

- [ ] **Step 2: Verify qa.ts --plan works**

Run: `bun scripts/qa.ts --plan`
Expected: JSON test plan output

- [ ] **Step 3: Update qa.sh to delegate to qa.ts**

Replace `scripts/qa.sh` content:

```bash
#!/bin/bash
# qa.sh — Compatibility wrapper: delegates to unified qa.ts
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ $# -eq 0 ]; then
  exec bun "$ROOT/scripts/qa.ts" --help
fi

# Map old flags to new CLI
ARGS=()
while [ $# -gt 0 ]; do
  case "$1" in
    --all) ARGS+=(--check) ;;
    --help|-h) ARGS+=(--help) ;;
    *) ARGS+=(--deck "$1") ; ARGS+=(--check) ;;
  esac
  shift
done

exec bun "$ROOT/scripts/qa.ts" "${ARGS[@]}"
```

- [ ] **Step 4: Test qa.sh compatibility**

Run: `bash scripts/qa.sh --help`
Expected: QA Pipeline CLI help output

- [ ] **Step 5: Update CLAUDE.md — add QA workflow instructions**

Append to CLAUDE.md (after the "Scripts 使用方式" section):

```markdown
## QA Pipeline

所有代码变更必须通过 QA Pipeline 验证。统一入口：`bun scripts/qa.ts`

### 开发流程中的 QA 集成

1. **改代码前**：`bun scripts/qa.ts --plan` 生成 Test Plan，了解影响范围
2. **改代码后**：`bun scripts/qa.ts --check` 快速验证（L0+L1），0 BLOCKER 才能提交
3. **重大重构前**：`bun scripts/qa.ts --baseline init` 建立截图基线
4. **重大重构后**：`bun scripts/qa.ts --regress` 完整回归（含截图对比）

### Superpowers 集成

当使用 subagent-driven-development 时：
- **Implementer subagent** 完成后自动运行 `bun scripts/qa.ts --check`，QA 报告附在 self-review 中
- **Spec reviewer subagent** 验证 QA 报告，BLOCKER 数量不能增加
- **Code reviewer subagent** 关注 font-container-ratio、canvas-fill 等 WARN 是否恶化
- **finishing-a-development-branch** 前运行 `bun scripts/qa.ts --check`，0 BLOCKER 才能合入

### 检测组（17 组）

| # | 检测组 | Portrait | Landscape |
|---|--------|----------|------------|
| 1 | text-overflow | ✅ | ✅ |
| 2 | occlusion | ✅ | ✅ |
| 3 | whitespace | fill 50-85% | fill 20-85% |
| 4 | spacing | ✅ | ✅ |
| 5 | contrast | WCAG AA | WCAG AA |
| 6 | font-hierarchy | h1 5-9cqi | h1 72px |
| 7 | chrome-position | ✅ | ✅ |
| 8 | chrome-presence | ✅ | ✅ |
| 9 | css-var-health | ✅ | ✅ |
| 10 | density | 4-8 comp | 2-6 comp |
| 11 | chrome-content-boundary | ✅ | ✅ |
| 12 | canvas-fill | bottom 25% | — |
| 13 | font-unit | no px | — |
| 14 | css-loading-integrity | ✅ | ✅ |
| 15 | grid-collapse | ≤ 2 cols | — |
| 16 | chrome-z-index | ✅ | ✅ |
| 17 | font-container-ratio | ✅ | ✅ |
```

- [ ] **Step 6: Run full QA pipeline to verify end-to-end**

Run: `bun scripts/qa.ts --check`
Expected: All 17 detection groups run against all decks, summary output

- [ ] **Step 7: Final commit**

```bash
git add scripts/qa.ts scripts/qa.sh CLAUDE.md
git commit -m "feat: unified QA CLI + superpowers workflow integration"
```

---

### Task 9: Initialize baselines + create .gitignore

**Files:**
- Modify: `.gitignore`
- Run: baseline initialization

- [ ] **Step 1: Add .qa/baselines/*.png and .qa/reports/ to .gitignore**

Append to `.gitignore`:
```
# QA baselines (large PNG files)
.qa/baselines/*.png
.qa/baselines/*/
.qa/reports/
```

- [ ] **Step 2: Initialize baselines for all decks**

Run: `bun scripts/qa.ts --baseline init`
Expected: Screenshots captured for all ~20 decks, manifest.json written

- [ ] **Step 3: Verify baselines exist**

Run: `ls .qa/baselines/manifest.json && cat .qa/baselines/manifest.json | head -20`
Expected: manifest.json with commit hash and deck list

- [ ] **Step 4: Run regression to verify zero-diff against self**

Run: `bun scripts/qa/baseline.ts compare --deck knowledge-arch-blueprint-3x4`
Expected: All slides 0% diff

- [ ] **Step 5: Commit**

```bash
git add .gitignore .qa/baselines/manifest.json
git commit -m "chore: initialize QA baselines + .gitignore"
```
