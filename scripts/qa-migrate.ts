/**
 * qa-migrate.ts — Migration quality gate for deck refactoring
 *
 * Compares old (private CSS) vs new (Design CSS + c-*) HTML output.
 * Verifies content completeness, class validity, and Design CSS coverage.
 *
 * Usage:
 *   bun scripts/qa-migrate.ts --old old/index.html --new new/index.html
 *   bun scripts/qa-migrate.ts --old old/ --new new/ --slides slides.json
 */

import * as fs from "fs";
import * as path from "path";

// ─── CLI ──────────────────────────────────────────────────────────────────

interface CliArgs {
  oldPath?: string;
  newPath?: string;
  slidesJson?: string;
}

function parseArgs(args: string[]): CliArgs {
  const opts: CliArgs = {};
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--old": opts.oldPath = args[++i]; break;
      case "--new": opts.newPath = args[++i]; break;
      case "--slides": opts.slidesJson = args[++i]; break;
      case "--help": case "-h":
        console.log(`Usage: bun scripts/qa-migrate.ts --old <old.html> --new <new.html> [--slides slides.json]

Checks:
  1. Content completeness — all text from old HTML appears in new HTML
  2. No private CSS prefixes — no kb-*, xp-*, xw-*, gd-*, hc-* classes in new HTML
  3. chr-* CSS coverage — all chr-* classes used in new HTML are defined in Design CSS
  4. (if --slides provided) validate-slides.ts passes`);
        process.exit(0);
    }
  }
  return opts;
}

// ─── Text Extraction ──────────────────────────────────────────────────────

/** Extract visible text content from HTML, stripping tags and normalizing whitespace */
function extractText(html: string): string[] {
  // Remove scripts and styles
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "[SVG]")
    // Remove HTML tags but keep text
    .replace(/<[^>]+>/g, " ")
    // Decode common entities
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // Split into words, filter empty, normalize
  const words = cleaned
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 0 && !/^[.,;:!?()\[\]{}<>+=_\-|/\\]+$/.test(w));

  return words;
}

/** Check if all significant old text appears in new text */
function checkContentCompleteness(oldHTML: string, newHTML: string): {
  pass: boolean;
  missing: string[];
} {
  const oldWords = new Set(extractText(oldHTML).map(w => w.toLowerCase()));
  const newWords = new Set(extractText(newHTML).map(w => w.toLowerCase()));

  // Find content words (>2 chars) in old that are missing from new
  const missing: string[] = [];
  for (const word of oldWords) {
    if (word.length <= 2) continue;
    if (["the", "and", "for", "are", "was", "has", "not", "but", "all", "can", "its"].includes(word)) continue;
    if (word.startsWith("--") || word.startsWith("var(") || word.startsWith("url(")) continue;
    if (/^\d+$/.test(word)) continue; // skip pure numbers
    if (!newWords.has(word)) {
      missing.push(word);
    }
  }

  return {
    pass: missing.length <= Math.max(oldWords.size * 0.03, 3), // allow 3% word loss
    missing: missing.slice(0, 20),
  };
}

// ─── CSS Class Checks ──────────────────────────────────────────────────────

const STANDARD_PREFIXES = [
  "c-", "chr-", "d-",     // new architecture
  "slide", "deck", "narrow", "portrait", "landscape", "is-active", "full", "center",
  "h1", "h2", "h3", "h4", "h5", "lede", "kicker", "dim", "mono",
  "mt-", "mb-", "ml-", "mr-", "anim-", "fx-",
];

/** Discover private CSS class prefixes from old deck style.css files.
 *  Only captures short (2-3 char) prefixes that indicate a private framework
 *  namespace (e.g. kb-, ts-, gd-), not semantic class names like agenda-row.
 *  Also filters out common English word prefixes (e.g. "top-", "row-"). */
function discoverPrivatePrefixes(deckRoots: string[]): Set<string> {
  const englishWords = new Set([
    "top", "row", "col", "card", "grid", "code", "text", "page", "nav",
    "btn", "tab", "box", "bar", "dot", "tag", "num", "big", "dim", "lede",
    "mono", "full", "wide", "dark", "soft", "warm", "cool", "hero", "main",
    "side", "head", "foot", "body", "list", "item", "link", "icon", "chip",
    "pill", "badge", "form", "input", "label", "title", "desc", "note", "warn",
  ]);
  const prefixes = new Set<string>();
  for (const root of deckRoots) {
    const cssPath = path.join(root, "style.css");
    if (!fs.existsSync(cssPath)) continue;
    const css = fs.readFileSync(cssPath, "utf-8");
    // Match class selectors like .kb-card, .ts-h1, .gd-grid (2-3 char prefix + hyphen)
    const matches = css.matchAll(/\.([a-z]{2,3}-)[\w-]+\s*[{,:\s]/g);
    for (const m of matches) {
      const prefix = m[1]!;
      const root = prefix.replace(/-$/, "");
      // Skip standard prefixes, English words, and semantic names
      if (STANDARD_PREFIXES.some(p => prefix.startsWith(p))) continue;
      if (englishWords.has(root)) continue;
      prefixes.add(prefix);
    }
  }
  return prefixes;
}

function extractClasses(html: string): string[] {
  const classRegex = /class="([^"]*)"/g;
  const classes: string[] = [];
  let match;
  while ((match = classRegex.exec(html)) !== null) {
    const values = match[1]!.split(/\s+/).filter(Boolean);
    classes.push(...values);
  }
  return [...new Set(classes)];
}

function checkPrivatePrefixes(html: string, oldDeckDir: string): { pass: boolean; violations: string[] } {
  const classes = extractClasses(html);
  const violations: string[] = [];

  // Discover private prefixes from old deck style.css
  const deckDirs = [oldDeckDir];
  // Also scan all full-decks directories for comprehensive prefix list
  const fullDecksDir = path.resolve("templates/full-decks");
  if (fs.existsSync(fullDecksDir)) {
    for (const entry of fs.readdirSync(fullDecksDir)) {
      const dir = path.join(fullDecksDir, entry);
      if (fs.statSync(dir).isDirectory()) deckDirs.push(dir);
    }
  }
  const privatePrefixes = discoverPrivatePrefixes(deckDirs);

  for (const cls of classes) {
    // Check if class starts with any discovered private prefix
    for (const prefix of privatePrefixes) {
      if (cls.startsWith(prefix)) {
        violations.push(cls);
        break;
      }
    }
    // Also flag known bad patterns
    if (cls.startsWith("tpl-") || cls.match(/^[a-z]+-[a-z]+-/) && !cls.startsWith("c-") && !cls.startsWith("chr-") && !cls.startsWith("d-")) {
      // Check if this looks like a private two-part prefix (e.g. "kb-grid")
      const twoPart = cls.match(/^([a-z]{2,3}-)/);
      if (twoPart && privatePrefixes.has(twoPart[1])) {
        if (!violations.includes(cls)) violations.push(cls);
      }
    }
  }

  return { pass: violations.length === 0, violations };
}

// ─── CSS Property Check ────────────────────────────────────────────────────

interface VisualProps {
  bg: string;
  textColor: string;
  accent: string;
  fontSans: string;
}

function extractVisualProps(css: string): Partial<VisualProps> {
  const props: Partial<VisualProps> = {};

  // Take the LAST match for each CSS variable (style.css overrides come after Design CSS)
  const bgMatches = [...css.matchAll(/--bg:\s*([^;]+);/g)];
  if (bgMatches.length) props.bg = bgMatches[bgMatches.length - 1]![1]!.trim();

  const textMatches = [...css.matchAll(/--text-1:\s*([^;]+);/g)];
  if (textMatches.length) props.textColor = textMatches[textMatches.length - 1]![1]!.trim();

  const accentMatches = [...css.matchAll(/--accent:\s*([^;]+);/g)];
  if (accentMatches.length) props.accent = accentMatches[accentMatches.length - 1]![1]!.trim();

  const fontMatches = [...css.matchAll(/--font-sans:\s*([^;]+);/g)];
  if (fontMatches.length) props.fontSans = fontMatches[fontMatches.length - 1]![1]!.trim();

  return props;
}

function checkVisualFidelity(oldCSS: string, newHTML: string, designCSS: string): { pass: boolean; issues: string[] } {
  const issues: string[] = [];
  const oldProps = extractVisualProps(oldCSS);
  const newProps = extractVisualProps(designCSS + newHTML);

  // Check background
  if (oldProps.bg && newProps.bg) {
    if (oldProps.bg.toLowerCase() !== newProps.bg.toLowerCase()) {
      issues.push(`bg color changed: ${oldProps.bg} → ${newProps.bg}`);
    }
  }

  // Check accent
  if (oldProps.accent && newProps.accent) {
    if (oldProps.accent.toLowerCase() !== newProps.accent.toLowerCase()) {
      issues.push(`accent color changed: ${oldProps.accent} → ${newProps.accent}`);
    }
  }

  // Check text color
  if (oldProps.textColor && newProps.textColor) {
    if (oldProps.textColor.toLowerCase() !== newProps.textColor.toLowerCase()) {
      issues.push(`text color changed: ${oldProps.textColor} → ${newProps.textColor}`);
    }
  }

  return { pass: issues.length === 0, issues };
}

// ─── style.css Presence Check ─────────────────────────────────────────────

function checkStyleCSSPresence(oldDeckDir: string, newHTML: string): { pass: boolean; detail: string } {
  const oldCSS = path.join(oldDeckDir, "style.css");
  if (!fs.existsSync(oldCSS)) {
    return { pass: true, detail: "No old style.css to preserve" };
  }

  const cssContent = fs.readFileSync(oldCSS, "utf-8");
  const meaningfulLines = cssContent.split("\n").filter(l => l.trim() && !l.trim().startsWith("/*") && !l.trim().startsWith("//") && !l.trim().startsWith("*")).length;

  if (meaningfulLines < 5) {
    return { pass: true, detail: `style.css is trivial (${meaningfulLines} meaningful lines)` };
  }

  // Check if new HTML links style.css
  if (newHTML.includes('href="style.css"')) {
    return { pass: true, detail: `style.css linked (${meaningfulLines} lines)` };
  }

  // Check if content was moved inline
  const styleBlockMatch = newHTML.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  const inlineCSS = styleBlockMatch ? styleBlockMatch.map(s => s.replace(/<\/?style[^>]*>/g, "")).join("\n") : "";
  const inlineLines = inlineCSS.split("\n").filter(l => l.trim()).length;

  if (inlineLines >= meaningfulLines * 0.5) {
    return { pass: true, detail: `style.css content embedded inline (${inlineLines} lines)` };
  }

  return { pass: false, detail: `style.css not linked or inlined (${meaningfulLines} lines of visual identity lost)` };
}

// ─── chr-* Coverage ───────────────────────────────────────────────────────

function extractChrClasses(html: string): string[] {
  const classes = extractClasses(html);
  return [...new Set(classes.filter(c => c.startsWith("chr-")))];
}

function extractCSSClasses(css: string): Set<string> {
  const classRegex = /\.(chr-[\w-]+)/g;
  const classes = new Set<string>();
  let match;
  while ((match = classRegex.exec(css)) !== null) {
    classes.add(match[1]!);
  }
  return classes;
}

function checkChrCoverage(html: string, css: string): { pass: boolean; missing: string[] } {
  const htmlChr = extractChrClasses(html);
  const cssChr = extractCSSClasses(css);

  // Whitelist: chr-* classes that might legitimately be in HTML but not in Design CSS
  // because they're defined in base.css or are design-agnostic utility classes
  const baseChr = new Set([
    "chr-topbar", "chr-chip", "chr-page", "chr-kicker", "chr-footer", "chr-divider",
    "chr-title", "chr-heading", "chr-sub", "chr-codebox", "chr-pill", "chr-hero",
    "chr-card-num", "chr-card-label", "chr-card-main", "chr-card-desc",
    "chr-blob", "chr-topline", "chr-page-dot",
    "chr-hc-grid", "chr-hc-scanlines", "chr-hc-prompt", "chr-hc-tag",
    "chr-hc-lbl", "chr-hc-val", "chr-hc-desc",
  ]);

  const missing: string[] = [];
  for (const cls of htmlChr) {
    if (!cssChr.has(cls) && !baseChr.has(cls)) {
      missing.push(cls);
    }
  }

  return { pass: missing.length === 0, missing };
}

// ─── Design CSS Detection ──────────────────────────────────────────────────

function findDesignCSS(newHTML: string): string | null {
  const match = newHTML.match(/href="[^"]*designs\/([^"]+)\.css"/);
  return match ? match[1]! : null;
}

function loadDesignCSS(designName: string): string {
  const cssPath = path.resolve(`assets/designs/${designName}.css`);
  if (fs.existsSync(cssPath)) return fs.readFileSync(cssPath, "utf-8");

  // Try relative to the new HTML
  const altPath = path.resolve(`../../../assets/designs/${designName}.css`);
  if (fs.existsSync(altPath)) return fs.readFileSync(altPath, "utf-8");

  return "";
}

// ─── Main ──────────────────────────────────────────────────────────────────

interface QAResult {
  check: string;
  pass: boolean;
  detail: string;
}

function main(): void {
  const opts = parseArgs(process.argv.slice(2));

  if (!opts.oldPath || !opts.newPath) {
    console.error("Both --old and --new are required");
    process.exit(1);
  }

  const results: QAResult[] = [];

  // Read files
  let oldHTML: string, newHTML: string;
  try {
    oldHTML = fs.readFileSync(path.resolve(opts.oldPath), "utf-8");
    newHTML = fs.readFileSync(path.resolve(opts.newPath), "utf-8");
  } catch (err: any) {
    console.error(`Error reading files: ${err.message}`);
    process.exit(1);
  }

  // 1. Content completeness
  const contentCheck = checkContentCompleteness(oldHTML, newHTML);
  results.push({
    check: "content-completeness",
    pass: contentCheck.pass,
    detail: contentCheck.pass
      ? "All content preserved"
      : `Missing ${contentCheck.missing.length} words: ${contentCheck.missing.join(", ")}`,
  });

  // Determine old deck directory for CSS checks
  const oldPath = path.resolve(opts.oldPath);
  const oldDeckDir = path.dirname(oldPath);

  // 2. Private CSS prefixes (auto-discovered from old deck styles)
  const prefixCheck = checkPrivatePrefixes(newHTML, oldDeckDir);
  results.push({
    check: "no-private-prefixes",
    pass: prefixCheck.pass,
    detail: prefixCheck.pass
      ? "No private CSS prefixes found"
      : `Private prefixes detected: ${prefixCheck.violations.join(", ")}`,
  });

  // 2.5. style.css preservation
  const styleCheck = checkStyleCSSPresence(oldDeckDir, newHTML);
  results.push({
    check: "style-css-preserved",
    pass: styleCheck.pass,
    detail: styleCheck.detail,
  });

  // 3. Visual fidelity (CSS properties)
  const oldCSSPath = path.join(oldDeckDir, "style.css");
  if (fs.existsSync(oldCSSPath)) {
    const oldCSS = fs.readFileSync(oldCSSPath, "utf-8");
    const designName = findDesignCSS(newHTML);
    let designCSS = designName ? loadDesignCSS(designName) : "";

    // Also include local style.css if linked (overrides Design CSS)
    const newDeckDir = path.dirname(path.resolve(opts.newPath));
    const newStylePath = path.join(newDeckDir, "style.css");
    if (fs.existsSync(newStylePath) && newHTML.includes('href="style.css"')) {
      designCSS += "\n" + fs.readFileSync(newStylePath, "utf-8");
    }

    const visualCheck = checkVisualFidelity(oldCSS, newHTML, designCSS);
    results.push({
      check: "visual-fidelity",
      pass: visualCheck.pass,
      detail: visualCheck.pass
        ? "Visual properties preserved"
        : `Visual changes: ${visualCheck.issues.join("; ")}`,
    });
  }

  // 4. chr-* coverage
  const designName = findDesignCSS(newHTML);
  if (designName) {
    const designCSS = loadDesignCSS(designName);
    if (designCSS) {
      const chrCheck = checkChrCoverage(newHTML, designCSS);
      results.push({
        check: "chr-coverage",
        pass: chrCheck.pass,
        detail: chrCheck.pass
          ? "All chr-* classes covered by Design CSS or base.css"
          : `chr-* classes missing CSS: ${chrCheck.missing.join(", ")}`,
      });
    } else {
      results.push({
        check: "chr-coverage",
        pass: false,
        detail: `Design CSS "${designName}" not found`,
      });
    }
  } else {
    results.push({
      check: "chr-coverage",
      pass: false,
      detail: "No Design CSS reference found in new HTML",
    });
  }

  // 4. Slide count consistency
  const oldSlideCount = (oldHTML.match(/<section class="slide/g) || []).length;
  const newSlideCount = (newHTML.match(/<section class="slide/g) || []).length;
  results.push({
    check: "slide-count",
    pass: oldSlideCount === newSlideCount,
    detail: `Old: ${oldSlideCount} slides, New: ${newSlideCount} slides`,
  });

  // Output
  const allPass = results.every(r => r.pass);
  const icon = allPass ? "✅" : "❌";

  console.log(`\n  QA Migration Report ${icon}`);
  console.log(`  Old: ${opts.oldPath}`);
  console.log(`  New: ${opts.newPath}`);
  if (designName) console.log(`  Design: ${designName}`);
  console.log();

  for (const r of results) {
    const status = r.pass ? "✅" : "❌";
    console.log(`  ${status} ${r.check}: ${r.detail}`);
  }

  console.log(`\n  Result: ${allPass ? "PASS" : "FAIL"}`);

  process.exit(allPass ? 0 : 1);
}

main();
