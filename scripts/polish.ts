/**
 * polish.ts — Post-processing visual polish engine
 *
 * Reads assembled index.html + associated CSS, applies deterministic design rules,
 * and outputs polish.css with corrective styles.
 *
 * Rules (deterministic, CSS-variable-aware):
 *   1. Color contrast    — WCAG AA between text and background
 *   2. Font hierarchy    — clear size progression h1→h2→h3→body
 *   3. Density relief    — overcrowded slides (>6 components on 3:4, >8 on 16:9)
 *   4. Spacing uniformity — normalize gaps between same-type adjacent components
 *   5. Variable health    — flag overrides that break Design CSS intent
 *   6. Cascade audit       — CSS specificity conflicts (position/display/visibility/opacity)
 *   7. Chrome consistency   — verify topbar/footer/page-number on every slide
 *
 * AI polish (Step 4b in pipeline): Claude reviews the rendered deck and appends
 * additional tweaks to polish.css for subjective visual quality.
 *
 * Usage:
 *   bun scripts/polish.ts --input index.html [--output polish.css] [--check-only]
 *   bun scripts/polish.ts --input index.html --ai-polish   # AI-assisted mode
 */

import * as fs from "fs";
import * as path from "path";

// ─── Types ──────────────────────────────────────────────────────────────

interface PolishIssue {
  rule: string;
  severity: "error" | "warn" | "info";
  slide?: number;
  selector: string;
  message: string;
  fix?: string; // CSS snippet to fix
}

interface CSSVarMap {
  [key: string]: string;
}

interface SlideInfo {
  index: number;
  componentCount: number;
  components: string[]; // class names of c-* components
  hasInlineStyle: boolean;
}

// ─── Color utilities ────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] | null {
  hex = hex.replace(/^#/, "").trim();
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  if (hex.length !== 6) return null;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return [r, g, b];
}

function relativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(hex1: string, hex2: string): number | null {
  const rgb1 = hexToRgb(hex1), rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return null;
  const l1 = relativeLuminance(...rgb1), l2 = relativeLuminance(...rgb2);
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Lighten or darken a hex color by a given ratio to meet contrast target.
 * ratio < 1 → darken, ratio > 1 → lighten.
 */
function adjustColor(hex: string, ratio: number): string | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const adjusted = rgb.map((c) => Math.round(Math.min(255, Math.max(0, c * ratio))));
  return `#${adjusted.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

// ─── CSS Parsing ────────────────────────────────────────────────────────

/** Extract CSS variable values from multiple CSS sources. Last match wins (cascade order). */
function extractCSSVars(...cssSources: string[]): CSSVarMap {
  const vars: CSSVarMap = {};
  for (const css of cssSources) {
    if (!css) continue;
    const matches = css.matchAll(/--([\w-]+):\s*([^;]+);/g);
    for (const m of matches) {
      vars[m[1]!] = m[2]!.trim();
    }
  }
  return vars;
}

/** Extract named font-size rules from CSS. Returns { selector: fontSize }. */
function extractFontSizes(css: string): Map<string, string> {
  const map = new Map<string, string>();
  // Match selector + font-size pairs: .className { ... font-size: value; ... }
  const ruleRegex = /([^{]+)\{([^}]+)\}/g;
  let ruleMatch;
  while ((ruleMatch = ruleRegex.exec(css)) !== null) {
    const selector = ruleMatch[1]!.trim();
    const body = ruleMatch[2]!;
    const fsMatch = body.match(/font-size:\s*([^;]+);/);
    if (fsMatch) {
      for (const sel of selector.split(",")) {
        map.set(sel.trim(), fsMatch[1]!.trim());
      }
    }
  }
  return map;
}

// ─── HTML Parsing ───────────────────────────────────────────────────────

/** Extract per-slide component info from assembled HTML */
function parseSlides(html: string): SlideInfo[] {
  const slides: SlideInfo[] = [];
  const slideRegex = /<section class="slide([^"]*)"[^>]*>([\s\S]*?)<\/section>/gi;
  let match;
  let idx = 0;
  while ((match = slideRegex.exec(html)) !== null) {
    const content = match[2]!;
    // Count c-* component classes
    const componentClasses = new Set<string>();
    const classRegex = /class="([^"]*)"/g;
    let cm;
    while ((cm = classRegex.exec(content)) !== null) {
      const classes = cm[1]!.split(/\s+/);
      for (const c of classes) {
        if (c.startsWith("c-") && !c.startsWith("c-spacer") && !c.startsWith("c-divider")) {
          componentClasses.add(c);
        }
      }
    }
    slides.push({
      index: idx++,
      componentCount: componentClasses.size,
      components: [...componentClasses],
      hasInlineStyle: /style="[^"]*"/.test(content),
    });
  }
  return slides;
}

/** Collect all CSS from the assembled HTML: inline <style> blocks + linked files */
function collectCSS(html: string, htmlDir: string): string[] {
  const cssBlocks: string[] = [];

  // Inline <style> blocks
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match;
  while ((match = styleRegex.exec(html)) !== null) {
    cssBlocks.push(match[1]!);
  }

  // Linked stylesheets (resolve relative to HTML dir)
  const linkRegex = /<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/gi;
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1]!;
    if (href.startsWith("http")) continue; // skip external
    const resolved = path.resolve(htmlDir, href);
    if (fs.existsSync(resolved)) {
      cssBlocks.push(fs.readFileSync(resolved, "utf-8"));
    }
  }

  return cssBlocks;
}

// ─── Effective color extraction ────────────────────────────────────────

/** Extract effective background/color from CSS rules that target body/deck/design.
 *  Scans for `background:` and `color:` properties in rules that apply to the page
 *  container (body, .deck, .slide, or design classes like .d-pastel-card). */
function extractEffectiveColors(css: string): { bg: string | null; text: string | null } {
  const ruleRegex = /([^{]+)\{([^}]+)\}/g;
  let match;
  const result = { bg: null as string | null, text: null as string | null };

  while ((match = ruleRegex.exec(css)) !== null) {
    const selector = match[1]!.trim();
    const body = match[2]!;

    // Only consider rules targeting the page container
    const isPageRule = selector.includes("body") || selector.includes(".deck") ||
      selector.includes(".d-") || selector.includes(".portrait") ||
      selector.includes(".landscape") || selector === ":root" ||
      selector.includes(".slide") && !selector.includes(".slide-");

    if (!isPageRule) continue;

    // Extract background (skip gradients, images — only solid colors)
    const bgMatch = body.match(/(?:[{;])\s*background\s*:\s*(#[0-9a-fA-F]{3,6})\s*[;!}]/);
    if (bgMatch && !result.bg) result.bg = bgMatch[1]!;

    // Extract color
    const colorMatch = body.match(/(?:[{;])\s*color\s*:\s*(#[0-9a-fA-F]{3,6})\s*[;!}]/);
    if (colorMatch && !result.text) result.text = colorMatch[1]!;
  }

  return result;
}

// ─── Rule 1: Color Contrast ─────────────────────────────────────────────

function checkContrast(vars: CSSVarMap, combinedCSS: string): PolishIssue[] {
  const issues: PolishIssue[] = [];

  // Priority: CSS variable values, then effective rendered colors from CSS rules
  const varBg = vars["bg"];
  const varText1 = vars["text-1"];
  const varText2 = vars["text-2"];
  const effective = extractEffectiveColors(combinedCSS);

  const bg = varBg || effective.bg || "#ffffff";
  const text1 = varText1 || effective.text || "#111216";
  const text2 = varText2 || effective.text || "#55596a";

  const cr1 = contrastRatio(bg, text1);
  const cr2 = contrastRatio(bg, text2);

  if (cr1 !== null && cr1 < 4.5) {
    const l1 = relativeLuminance(...(hexToRgb(bg) || [255, 255, 255]));
    const darkBg = l1 < 0.5;
    const adjusted = adjustColor(text1, darkBg ? 1.3 : 0.7);
    issues.push({
      rule: "contrast",
      severity: "error",
      selector: ":root",
      message: `--text-1 (${text1}) vs --bg (${bg}) contrast ${cr1.toFixed(2)}:1 — below WCAG AA (4.5:1)`,
      fix: adjusted ? `:root { --text-1: ${adjusted}; }` : undefined,
    });
  }

  if (cr2 !== null && cr2 < 3.0) {
    issues.push({
      rule: "contrast",
      severity: "warn",
      selector: ":root",
      message: `--text-2 (${text2}) vs --bg (${bg}) contrast ${cr2.toFixed(2)}:1 — below 3:1 for secondary text`,
    });
  }

  return issues;
}

// ─── Rule 2: Font Hierarchy ─────────────────────────────────────────────

const FONT_SIZE_ORDER: Record<string, number> = { px: 1, pt: 1.333, rem: 1, cqi: 1 };

function parseFontSize(val: string): number {
  const num = parseFloat(val);
  if (val.endsWith("cqi")) return num;
  if (val.endsWith("pt")) return num * 1.333;
  if (val.endsWith("rem")) return num * 16;
  if (val.endsWith("px")) return num;
  return num; // assume px
}

function checkFontHierarchy(cssBlocks: string[], vars: CSSVarMap): PolishIssue[] {
  const issues: PolishIssue[] = [];
  const combinedCSS = cssBlocks.join("\n");
  const sizes = extractFontSizes(combinedCSS);

  // Check chr-title → chr-heading → chr-sub hierarchy
  const titleSizes: { selector: string; size: number }[] = [];
  for (const [sel, val] of sizes) {
    if (sel.includes("chr-title") || sel.includes("h1") || sel.includes("chr-heading") ||
        sel.includes("h2") || sel.includes("chr-sub") || sel.includes(".lede")) {
      titleSizes.push({ selector: sel, size: parseFontSize(val) });
    }
  }

  // Group by type
  const h1Sizes = titleSizes.filter((t) => t.selector.includes("chr-title") || t.selector === "h1" || t.selector === ".h1").map((t) => t.size);
  const h2Sizes = titleSizes.filter((t) => t.selector.includes("chr-heading") || t.selector === "h2" || t.selector === ".h2").map((t) => t.size);
  const h3Sizes = titleSizes.filter((t) => t.selector.includes("chr-sub") || t.selector === "h3" || t.selector === ".lede").map((t) => t.size);

  const maxH1 = Math.max(...h1Sizes, 0);
  const maxH2 = Math.max(...h2Sizes, 0);
  const maxH3 = Math.max(...h3Sizes, 0);

  if (maxH1 > 0 && maxH2 > 0 && maxH2 >= maxH1 * 0.95) {
    issues.push({
      rule: "font-hierarchy",
      severity: "warn",
      selector: ".chr-heading",
      message: `h2 (${maxH2}) too close to h1 (${maxH1}) — hierarchy unclear. Aim for h2 ≤ 0.75× h1`,
      fix: `.chr-heading { font-size: ${(maxH1 * 0.7).toFixed(1)}px !important; }`,
    });
  }

  if (maxH2 > 0 && maxH3 > 0 && maxH3 >= maxH2) {
    issues.push({
      rule: "font-hierarchy",
      severity: "warn",
      selector: ".chr-sub",
      message: `h3/sub (${maxH3}) ≥ h2 (${maxH2}) — inverted hierarchy`,
    });
  }

  return issues;
}

// ─── Rule 3: Density Relief ─────────────────────────────────────────────

function checkDensity(slides: SlideInfo[], isPortrait: boolean): PolishIssue[] {
  const issues: PolishIssue[] = [];
  const maxComponents = isPortrait ? 6 : 8;

  for (const slide of slides) {
    if (slide.componentCount > maxComponents) {
      issues.push({
        rule: "density",
        severity: "warn",
        slide: slide.index + 1,
        selector: `.slide:nth-child(${slide.index + 1})`,
        message: `Slide #${slide.index + 1}: ${slide.componentCount} components (max ${maxComponents} for ${isPortrait ? "3:4" : "16:9"}) — consider splitting or reducing`,
        fix: `.slide:nth-child(${slide.index + 1}) .c-stack > * + * { margin-top: 0.8cqi; }\n.slide:nth-child(${slide.index + 1}) .c-card { padding: 0.8cqi 1.2cqi; }`,
      });
    }
  }
  return issues;
}

// ─── Rule 4: Spacing Uniformity ──────────────────────────────────────────

function checkSpacing(html: string): PolishIssue[] {
  const issues: PolishIssue[] = [];

  // Find inline margin-top values on c-card siblings
  const cardMarginRegex = /class="c-card[^"]*"[^>]*style="[^"]*margin-top:\s*([^";]+)/gi;
  const margins: number[] = [];
  let match;
  while ((match = cardMarginRegex.exec(html)) !== null) {
    const val = parseFloat(match[1]!);
    if (!isNaN(val)) margins.push(val);
  }

  if (margins.length >= 2) {
    const avg = margins.reduce((a, b) => a + b, 0) / margins.length;
    const maxDev = Math.max(...margins.map((m) => Math.abs(m - avg) / avg));
    if (maxDev > 0.25) {
      issues.push({
        rule: "spacing",
        severity: "warn",
        selector: ".c-card",
        message: `Card margin-top varies by ${(maxDev * 100).toFixed(0)}% across deck — inconsistent rhythm`,
        fix: `.c-stack > .c-card + .c-card { margin-top: ${avg.toFixed(1)}cqi; }`,
      });
    }
  }

  return issues;
}

// ─── Rule 5: Variable Health ────────────────────────────────────────────

function checkVariableHealth(vars: CSSVarMap, designName: string): PolishIssue[] {
  const issues: PolishIssue[] = [];

  // Check that Design CSS variables are not completely overridden
  const criticalVars = ["--accent", "--bg", "--text-1", "--font-sans"];
  const designDefaults: Record<string, string> = {
    "pastel-card": "#3b6cff",
    "white-editorial": "#1a56db",
    "xhs-post": "#ff5c8a",
    "hermes-cyber-terminal": "#28c840",
  };

  for (const v of criticalVars) {
    if (!vars[v.replace("--", "")]) {
      issues.push({
        rule: "variable-health",
        severity: "warn",
        selector: ":root",
        message: `${v} is not defined — Design CSS may be missing or overridden by style.css`,
      });
    }
  }

  return issues;
}

// ─── Rule 6: Cascade Audit (specificity conflict detection) ─────────────

interface CSSRule {
  selector: string;
  specificity: number;
  properties: Map<string, string>;
  line: number;
}

/** Compute CSS specificity as a comparable number: a*10000 + b*100 + c */
function computeSpecificity(selector: string): number {
  let a = 0, b = 0, c = 0;
  const idMatches = selector.match(/#[\w-]+/g);
  if (idMatches) a = idMatches.length;
  const classMatches = selector.match(/\.([\w-]+)/g);
  if (classMatches) b = classMatches.length;
  const attrMatches = selector.match(/\[[\w-]+(?:[~|^$*]?=\s*[^\]]+)?\]/g);
  if (attrMatches) b += attrMatches.length;
  const pseudoClassMatches = selector.match(/:(?!:)[\w-]+(?:\([^)]*\))?/g);
  if (pseudoClassMatches) b += pseudoClassMatches.length;
  const elemMatches = selector.match(/(?:^|[\s>+~])(?![.#])([a-zA-Z][\w-]*)/g);
  if (elemMatches) c = elemMatches.length;
  const pseudoElemMatches = selector.match(/::[\w-]+/g);
  if (pseudoElemMatches) c += pseudoElemMatches.length;
  return a * 10000 + b * 100 + c;
}

/** Properties tracked by cascade audit, with "intended values" that shouldn't be overridden */
const CASCADE_WATCH: Record<string, { intended: string[]; overrider: string[]; label: string }> = {
  position:  { intended: ["absolute", "fixed"],      overrider: ["relative", "static"], label: "position" },
  display:   { intended: ["grid", "flex", "inline-flex"], overrider: ["block", "none"], label: "display" },
  visibility:{ intended: ["visible"],                 overrider: ["hidden"],            label: "visibility" },
  opacity:   { intended: ["1"],                       overrider: ["0"],                 label: "opacity" },
};

/** Parse all CSS rules. Extracts all cascade-watched properties, not just position. */
function parseCSSRules(combinedCSS: string): CSSRule[] {
  const rules: CSSRule[] = [];
  const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  let idx = 0;
  while ((match = ruleRegex.exec(combinedCSS)) !== null) {
    const rawSelector = match[1]!.trim();
    const body = match[2]!.trim();
    if (!rawSelector || !body) continue;
    if (rawSelector.startsWith("@")) continue;
    if (rawSelector.startsWith("/*")) continue;

    const selectors = rawSelector.split(",").map(s => s.trim()).filter(Boolean);
    const properties = new Map<string, string>();

    for (const prop of Object.keys(CASCADE_WATCH)) {
      const m = body.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)\\s*(?:;|$)`, "m"));
      if (m) properties.set(prop, m[1]!.trim());
    }
    if (properties.size === 0) continue;

    for (const sel of selectors) {
      rules.push({ selector: sel, specificity: computeSpecificity(sel), properties, line: idx });
    }
    idx++;
  }
  return rules;
}

/** Check if overrider selector could plausibly match the same elements as overridden. */
function couldMatchSame(overrider: string, overridden: string, html: string): boolean {
  if (!overrider.includes("> *")) return false;
  const parentPart = overrider.replace(/\s*>\s*\*.*$/, "").trim();
  const parentClasses = parentPart.match(/\.([\w-]+)/g);
  if (!parentClasses) return false;
  const directParentClass = parentClasses[parentClasses.length - 1]!;
  const overriddenMatch = overridden.match(/^\.([\w-]+)/);
  if (!overriddenMatch) return false;
  const overriddenClass = overriddenMatch[1]!;

  const slideContentRegex = new RegExp(
    `<[^>]*class="[^"]*${directParentClass.slice(1)}[^"]*"[^>]*>([\\s\\S]*?)<\\/section>`, "gi"
  );
  let sm;
  while ((sm = slideContentRegex.exec(html)) !== null) {
    if (new RegExp(`class="[^"]*${overriddenClass}[^"]*"`).test(sm[1]!)) return true;
  }
  return false;
}

function checkCascadeAudit(combinedCSS: string, html: string): PolishIssue[] {
  const issues: PolishIssue[] = [];
  const rules = parseCSSRules(combinedCSS);

  for (const [prop, watch] of Object.entries(CASCADE_WATCH)) {
    const intendedRules = rules.filter(r => {
      const val = r.properties.get(prop);
      return val && watch.intended.some(iv => val === iv || val.startsWith(iv));
    });
    const overriderRules = rules.filter(r => {
      const val = r.properties.get(prop);
      return val && watch.overrider.some(ov => val === ov || val.startsWith(ov));
    });

    for (const intended of intendedRules) {
      for (const overrider of overriderRules) {
        if (overrider.specificity < intended.specificity) continue;
        if (overrider.specificity === intended.specificity && overrider.line <= intended.line) continue;
        if (!couldMatchSame(overrider.selector, intended.selector, html)) continue;

        issues.push({
          rule: "cascade-audit",
          severity: "error",
          selector: intended.selector,
          message: `${intended.selector} { ${prop}: ${intended.properties.get(prop)} } (spec ${intended.specificity}) overridden by ${overrider.selector} { ${prop}: ${overrider.properties.get(prop)} } (spec ${overrider.specificity}) — ${watch.label} silently lost`,
          fix: `${intended.selector} { ${prop}: ${intended.properties.get(prop)} !important; }`,
        });
      }
    }
  }

  // Deduplicate by selector+property
  const seen = new Set<string>();
  return issues.filter(i => {
    const key = `${i.selector}|${i.message.split("{")[0]}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Rule 7: Chrome Consistency ────────────────────────────────────────

interface ChromePresence {
  slide: number;
  hasTopbar: boolean;
  hasFooter: boolean;
  hasPageNum: boolean;
  classes: string;
}

function checkChromeConsistency(html: string): PolishIssue[] {
  const issues: PolishIssue[] = [];
  const slides: ChromePresence[] = [];

  const slideRegex = /<section class="slide([^"]*)"[^>]*>([\s\S]*?)<\/section>/gi;
  let match;
  let idx = 0;
  while ((match = slideRegex.exec(html)) !== null) {
    const slideAttrs = match[1]!;
    const content = match[2]!;
    slides.push({
      slide: idx + 1,
      hasTopbar: /chr-topbar/.test(content),
      hasFooter: /chr-footer/.test(content),
      hasPageNum: /chr-page|pg-num|data-slide/.test(content),
      classes: slideAttrs.trim(),
    });
    idx++;
  }

  if (slides.length === 0) return issues;

  // Check: if most slides have topbar, ALL should
  const topbarCount = slides.filter(s => s.hasTopbar).length;
  if (topbarCount > 0 && topbarCount < slides.length) {
    const missing = slides.filter(s => !s.hasTopbar).map(s => `#${s.slide}`);
    issues.push({
      rule: "chrome-consistency",
      severity: "warn",
      selector: ".chr-topbar",
      message: `chr-topbar missing on slide(s) ${missing.join(", ")} (${topbarCount}/${slides.length} have it) — inconsistent chrome`,
    });
  }

  // Check: if most slides have footer, ALL should
  const footerCount = slides.filter(s => s.hasFooter).length;
  if (footerCount > 0 && footerCount < slides.length) {
    const missing = slides.filter(s => !s.hasFooter).map(s => `#${s.slide}`);
    issues.push({
      rule: "chrome-consistency",
      severity: "warn",
      selector: ".chr-footer",
      message: `chr-footer missing on slide(s) ${missing.join(", ")} (${footerCount}/${slides.length} have it) — inconsistent chrome`,
    });
  }

  // Check: page number presence
  const pageCount = slides.filter(s => s.hasPageNum).length;
  if (pageCount > 0 && pageCount < slides.length) {
    const missing = slides.filter(s => !s.hasPageNum).map(s => `#${s.slide}`);
    issues.push({
      rule: "chrome-consistency",
      severity: "info",
      selector: ".chr-page",
      message: `Page number missing on slide(s) ${missing.join(", ")} (${pageCount}/${slides.length} have it)`,
    });
  }

  return issues;
}

// ─── CSS Generation ─────────────────────────────────────────────────────

function generatePolishCSS(issues: PolishIssue[]): string {
  const errors = issues.filter((i) => i.severity === "error");
  const warns = issues.filter((i) => i.severity === "warn");

  let css = "/* polish.css — auto-generated visual corrections */\n";

  for (const issue of [...errors, ...warns]) {
    if (issue.fix) {
      css += `\n/* ${issue.rule}: ${issue.message} */\n`;
      css += `${issue.fix}\n`;
    }
  }

  if (errors.length === 0 && warns.filter((w) => w.fix).length === 0) {
    css += "\n/* All checks passed — no corrections needed */\n";
  }

  return css;
}

// ─── Report ──────────────────────────────────────────────────────────────

function printReport(issues: PolishIssue[]): void {
  const errors = issues.filter((i) => i.severity === "error");
  const warns = issues.filter((i) => i.severity === "warn");
  const infos = issues.filter((i) => i.severity === "info");

  console.log(`\n  Polish Report — ${issues.length} issue(s)`);
  console.log(`  ${errors.length} error(s), ${warns.length} warning(s), ${infos.length} info(s)\n`);

  for (const issue of issues) {
    const icon = issue.severity === "error" ? "❌" : issue.severity === "warn" ? "⚠️ " : "ℹ️ ";
    const location = issue.slide ? `slide #${issue.slide}` : issue.selector;
    console.log(`  ${icon} [${issue.rule}] ${location}`);
    console.log(`     ${issue.message}`);
    if (issue.fix) {
      console.log(`     → fix: ${issue.fix.slice(0, 80)}${issue.fix.length > 80 ? "..." : ""}`);
    }
  }
  console.log();
}

// ─── Main ────────────────────────────────────────────────────────────────

interface CliArgs {
  input?: string;
  output?: string;
  checkOnly?: boolean;
}

function parseArgs(args: string[]): CliArgs {
  const opts: CliArgs = {};
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--input": case "-i": opts.input = args[++i]; break;
      case "--output": case "-o": opts.output = args[++i]; break;
      case "--check-only": opts.checkOnly = true; break;
      case "--help": case "-h":
        console.log(`Usage: bun scripts/polish.ts --input index.html [--output polish.css] [--check-only]

Rules applied:
  1. Color contrast — WCAG AA (4.5:1 body, 3:1 large)
  2. Font hierarchy — h1 > h2 > h3 > body
  3. Density relief — flag overcrowded slides
  4. Spacing uniformity — normalize component gaps
  5. Variable health — ensure critical CSS vars are defined
  6. Cascade audit — detect CSS specificity conflicts (position overrides)`);
        process.exit(0);
    }
  }
  return opts;
}

function main(): void {
  const cli = parseArgs(process.argv.slice(2));

  if (!cli.input) {
    console.error("--input <file> is required");
    process.exit(1);
  }

  const htmlPath = path.resolve(cli.input);
  if (!fs.existsSync(htmlPath)) {
    console.error(`Input file not found: ${htmlPath}`);
    process.exit(1);
  }

  const html = fs.readFileSync(htmlPath, "utf-8");
  const htmlDir = path.dirname(htmlPath);

  // Collect all CSS sources
  const cssSources = collectCSS(html, htmlDir);
  const combinedCSS = cssSources.join("\n");
  const vars = extractCSSVars(combinedCSS);

  // Detect canvas from HTML body class
  const isPortrait = html.includes("portrait");
  const designMatch = html.match(/designs\/([^.]+)\.css/);
  const designName = designMatch ? designMatch[1]! : "unknown";

  // Parse slides
  const slides = parseSlides(html);

  // ── Run all rules ──

  const allIssues: PolishIssue[] = [];

  allIssues.push(...checkContrast(vars, combinedCSS));
  allIssues.push(...checkFontHierarchy(cssSources, vars));
  allIssues.push(...checkDensity(slides, isPortrait));
  allIssues.push(...checkSpacing(html));
  allIssues.push(...checkVariableHealth(vars, designName));
  allIssues.push(...checkCascadeAudit(combinedCSS, html));
  allIssues.push(...checkChromeConsistency(html));

  // ── Output ──

  printReport(allIssues);

  if (!cli.checkOnly) {
    const css = generatePolishCSS(allIssues);
    const outPath = cli.output || path.join(htmlDir, "polish.css");
    fs.writeFileSync(outPath, css);
    console.log(`  Written: ${outPath} (${css.split("\n").filter(l => l.trim() && !l.startsWith("/*")).length - 1} CSS rule(s))\n`);
  }

  process.exit(allIssues.filter(i => i.severity === "error").length > 0 ? 1 : 0);
}

main();
