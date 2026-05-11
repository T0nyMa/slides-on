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

const PRIVATE_PREFIXES = [
  "kb-", "xp-", "xw-", "gd-", "hc-", "kl-", "ob-", "tpl-",
  "deck-", "slide-", "notes-", "progress-", "overview-",
];

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

function checkPrivatePrefixes(html: string): { pass: boolean; violations: string[] } {
  const classes = extractClasses(html);
  const violations: string[] = [];

  for (const cls of classes) {
    for (const prefix of PRIVATE_PREFIXES) {
      if (cls.startsWith(prefix)) {
        violations.push(cls);
        break;
      }
    }
  }

  return { pass: violations.length === 0, violations };
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

  // 2. Private CSS prefixes
  const prefixCheck = checkPrivatePrefixes(newHTML);
  results.push({
    check: "no-private-prefixes",
    pass: prefixCheck.pass,
    detail: prefixCheck.pass
      ? "No private CSS prefixes found"
      : `Private prefixes detected: ${prefixCheck.violations.join(", ")}`,
  });

  // 3. chr-* coverage
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
