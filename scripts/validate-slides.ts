/**
 * validate-slides.ts — slides.json quality validator
 *
 * Reads slides.json and runs structural/semantic checks defined in
 * references/quality-spec.md. No rendering needed.
 *
 * Usage:
 *   bun scripts/validate-slides.ts --input slides.json
 *   cat slides.json | bun scripts/validate-slides.ts --stdin
 *   bun scripts/validate-slides.ts --input slides.json --output report.json
 */

import * as fs from "fs";
import * as path from "path";
import { getKnownDesigns, loadAllManifests } from "./assemble/manifest-loader";

// ─── Types ────────────────────────────────────────────────────────────────

type Severity = "FAIL" | "WARN" | "INFO";

interface CheckResult {
  check: string;
  pass: boolean;
  severity: Severity;
  message: string;
}

interface SlideResult {
  index: number;
  type: string;
  title: string;
  checks: CheckResult[];
}

interface ValidationReport {
  valid: boolean;
  slides: SlideResult[];
  summary: {
    total: number;
    passed: number;
    fail: number;
    warn: number;
  };
}

// ─── Design Capability Matrix ─────────────────────────────────────────────

const KNOWN_DESIGNS = getKnownDesigns();

const VALID_TYPOGRAPHIES = ["geometric", "editorial", "humanist", "handwritten", "technical"];
const VALID_TEXTURES = ["clean", "paper", "grid", "organic", "pixel"];
const VALID_DENSITIES = ["minimal", "balanced", "dense"];

const DESIGN_COLORS: Record<string, string[]> = {};

function getDesignColors(): Record<string, string[]> {
  if (Object.keys(DESIGN_COLORS).length === 0) {
    for (const m of loadAllManifests()) {
      DESIGN_COLORS[m.name] = m.qa.cardColors;
    }
  }
  return DESIGN_COLORS;
}

const WARN_COLORS = new Set(["peach", "rose", "pink", "orange"]);
const ACCENT_COLORS = new Set(["mint", "green", "blue", "purple", "sky", "lilac", "lemon"]);

const VALID_SLIDE_TYPES = [
  "cover", "section", "cards-2x2", "cards-3",
  "quote", "steps", "code", "table", "thanks", "bullets", "kpi", "html", "layout",
] as const;

const VALID_BLOBS = ["b1", "b2", "b3"];

// ─── Helpers ──────────────────────────────────────────────────────────────

function charCount(s: string): number {
  // Count CJK characters as 1, other counting includes spaces
  return s.replace(/\s/g, "").length;
}

function fail(check: string, message: string): CheckResult {
  return { check, pass: false, severity: "FAIL", message };
}

function warn(check: string, message: string): CheckResult {
  return { check, pass: false, severity: "WARN", message };
}

function info(check: string, message: string): CheckResult {
  return { check, pass: false, severity: "INFO", message };
}

function pass(check: string, message: string): CheckResult {
  return { check, pass: true, severity: "INFO" as any, message };
}

// ─── Checkers ─────────────────────────────────────────────────────────────

function checkSchema(config: any, slides: any[]): CheckResult[] {
  const results: CheckResult[] = [];

  if (!config || typeof config !== "object") {
    results.push(fail("schema.config", "config is missing"));
    return results;
  }

  if (!config.title || typeof config.title !== "string" || !config.title.trim()) {
    results.push(fail("schema.config.title", "config.title is required and must be non-empty"));
  } else {
    results.push(pass("schema.config.title", `title: "${config.title.slice(0, 30)}"`));
  }

  // Accept string preset or free-form object
  if (typeof config.design === "string") {
    if (!KNOWN_DESIGNS.includes(config.design)) {
      results.push(fail("schema.config.design",
        `Unknown design "${config.design}". Must be one of: ${KNOWN_DESIGNS.join(", ")}`));
    } else {
      results.push(pass("schema.config.design", `design: ${config.design}`));
    }
  } else if (typeof config.design === "object" && config.design !== null) {
    const d = config.design;
    if (d.typography && !VALID_TYPOGRAPHIES.includes(d.typography)) {
      results.push(fail("schema.config.design.typography",
        `Unknown typography "${d.typography}". Must be one of: ${VALID_TYPOGRAPHIES.join(", ")}`));
    } else if (d.typography) {
      results.push(pass("schema.config.design.typography", d.typography));
    }
    if (d.texture && !VALID_TEXTURES.includes(d.texture)) {
      results.push(fail("schema.config.design.texture",
        `Unknown texture "${d.texture}". Must be one of: ${VALID_TEXTURES.join(", ")}`));
    } else if (d.texture) {
      results.push(pass("schema.config.design.texture", d.texture));
    }
    if (d.density && !VALID_DENSITIES.includes(d.density)) {
      results.push(fail("schema.config.design.density",
        `Unknown density "${d.density}". Must be one of: ${VALID_DENSITIES.join(", ")}`));
    } else if (d.density) {
      results.push(pass("schema.config.design.density", d.density));
    }
    if (d.design && !KNOWN_DESIGNS.includes(d.design)) {
      results.push(fail("schema.config.design.design",
        `Unknown design "${d.design}". Must be one of: ${KNOWN_DESIGNS.join(", ")}`));
    } else if (d.design) {
      results.push(pass("schema.config.design.design", d.design));
    }
    const keys = [d.design && "design", d.typography && "typography", d.texture && "texture", d.density && "density", d.theme && "theme"].filter(Boolean);
    results.push(pass("schema.config.design", `free-form: ${keys.join(", ")}`));
  } else {
    results.push(fail("schema.config.design", "design must be a string or object"));
  }

  if (!["3:4", "16:9"].includes(config.canvas)) {
    results.push(fail("schema.config.canvas",
      `Unknown canvas "${config.canvas}". Must be "3:4" or "16:9"`));
  } else {
    results.push(pass("schema.config.canvas", `canvas: ${config.canvas}`));
  }

  if (!Array.isArray(slides) || slides.length === 0) {
    results.push(fail("schema.slides", "slides must be a non-empty array"));
  } else {
    results.push(pass("schema.slides", `${slides.length} slides`));
  }

  return results;
}

function checkSlideType(slide: any): CheckResult[] {
  const results: CheckResult[] = [];

  if (!VALID_SLIDE_TYPES.includes(slide.type)) {
    results.push(fail("schema.slide.type",
      `Unknown slide type "${slide.type}". Valid: ${VALID_SLIDE_TYPES.join(", ")}`));
    return results;
  }

  results.push(pass("schema.slide.type", `type: ${slide.type}`));

  // Title required except for types that have their own primary content
  if (slide.type !== "html" && slide.type !== "cover" && slide.type !== "quote" && slide.type !== "thanks") {
    if (!slide.title || typeof slide.title !== "string" || !slide.title.trim()) {
      results.push(fail("schema.slide.title", "title is required for non-cover/non-html slides"));
    }
  }

  return results;
}

function checkBudget(slide: any, design: string): CheckResult[] {
  const results: CheckResult[] = [];
  let componentCount = 0;

  // Count non-chrome components
  if (slide.kicker) componentCount++;
  if (slide.title) componentCount++;
  if (slide.subtitle) componentCount++;
  if (slide.body) componentCount++;
  if (slide.cards) componentCount += slide.cards.length >= 4 ? 2 : 1; // dense grid counts as 2
  if (slide.steps) componentCount++; // c-steps counts as 1
  if (slide.bullets) componentCount++; // c-stack counts as 1
  if (slide.kpis) componentCount++; // c-row counts as 1
  if (slide.quote) componentCount++;
  if (slide.badges?.length) componentCount++;
  if (slide.html) componentCount += 3; // assume custom HTML fills the page

  if (slide.type === "html") {
    // Can't validate html type
    results.push(pass("budget.component-count", `html type: skipping component count`));
    return results;
  }

  const minComponents = slide.type === "section" ? 1 : 3;
  if (componentCount < minComponents) {
    results.push(warn("budget.whitespace",
      `Only ${componentCount} components (min ${minComponents}). Add c-badge-row, c-note, or c-card-soft to fill whitespace`));
  } else if (componentCount > 5) {
    results.push(warn("budget.density",
      `${componentCount} components (max 5). Consider splitting into two slides`));
  } else {
    results.push(pass("budget.component-count", `${componentCount} components (3-5 OK)`));
  }

  // Title length
  if (slide.title) {
    const len = charCount(slide.title);
    const max = slide.type === "cover" || slide.type === "section" || slide.type === "thanks" ? 15 : 10;
    if (len > max) {
      results.push(warn("budget.title-length", `Title too long: ${len} chars (max ${max})`));
    } else {
      results.push(pass("budget.title-length", `Title: ${len} chars (max ${max})`));
    }
  }

  // Subtitle/lede length
  if (slide.subtitle) {
    const len = charCount(slide.subtitle);
    if (len > 30) {
      results.push(warn("budget.subtitle-length", `Subtitle too long: ${len} chars (max 30)`));
    }
  }

  // Card checks
  if (slide.cards) {
    for (let i = 0; i < slide.cards.length; i++) {
      const card = slide.cards[i];
      if (card.title && charCount(card.title) > 15) {
        results.push(warn("budget.card-title", `Card[${i}] title too long: ${charCount(card.title)} chars (max 15)`));
      }
      if (card.body && charCount(card.body) > 60) {
        results.push(warn("budget.card-body", `Card[${i}] body too long: ${charCount(card.body)} chars (max 60)`));
      }
      if (card.color && design === "xhs-post") {
        results.push(info("design.color-unsupported", `Card[${i}] color "${card.color}" ignored by xhs-post design`));
      }
    }

    if (slide.type === "cards-2x2" && slide.cards.length > 4) {
      results.push(warn("budget.cards-count", `cards-2x2 has ${slide.cards.length} cards (max 4 for 2-column grid)`));
    }
    if (slide.type === "cards-3" && slide.cards.length > 6) {
      results.push(warn("budget.cards-count", `cards-3 has ${slide.cards.length} cards (max 6)`));
    }
  }

  // Step checks
  if (slide.steps) {
    if (slide.steps.length < 3) {
      results.push(warn("budget.steps-count", `Only ${slide.steps.length} steps (min 3). Use c-row(c-card) instead`));
    } else if (slide.steps.length > 7) {
      results.push(fail("budget.steps-count", `${slide.steps.length} steps (max 7). Must split into two pages`));
    } else {
      results.push(pass("budget.steps-count", `${slide.steps.length} steps (3-7 OK)`));
    }

    for (let i = 0; i < slide.steps.length; i++) {
      const step = slide.steps[i];
      if (step.title && charCount(step.title) > 15) {
        results.push(warn("budget.step-title", `Step[${i}] title too long: ${charCount(step.title)} chars (max 15)`));
      }
      if (step.body && charCount(step.body) > 50) {
        results.push(warn("budget.step-body", `Step[${i}] body too long: ${charCount(step.body)} chars (max 50)`));
      }
    }
  }

  // Quote length
  if (slide.quote && charCount(slide.quote) > 40) {
    results.push(warn("budget.quote-length", `Quote too long: ${charCount(slide.quote)} chars (max 40)`));
  }

  // KPI checks
  if (slide.kpis) {
    if (slide.kpis.length > 4) {
      results.push(warn("budget.kpis-count", `${slide.kpis.length} KPIs (max 4)`));
    }
    for (let i = 0; i < slide.kpis.length; i++) {
      if (slide.kpis[i].value && charCount(slide.kpis[i].value) > 6) {
        results.push(warn("budget.kpi-value", `KPI[${i}] value too long: ${charCount(slide.kpis[i].value)} chars (max 6)`));
      }
    }
  }

  // Bullet checks
  if (slide.bullets) {
    if (slide.bullets.length < 3) {
      results.push(warn("budget.bullets-count", `Only ${slide.bullets.length} bullets (min 3)`));
    } else if (slide.bullets.length > 10) {
      results.push(warn("budget.bullets-count", `${slide.bullets.length} bullets (max 10). Consider grouping`));
    }
    for (let i = 0; i < slide.bullets.length; i++) {
      if (slide.bullets[i].title && charCount(slide.bullets[i].title) > 12) {
        results.push(warn("budget.bullet-title", `Bullet[${i}] title too long: ${charCount(slide.bullets[i].title)} chars (max 12)`));
      }
    }
  }

  // Badge count
  if (slide.badges && slide.badges.length > 4) {
    results.push(warn("budget.badges-count", `${slide.badges.length} badges (max 4)`));
  }

  return results;
}

function checkPortraitBudget(config: any, slides: any[]): CheckResult[] {
  const results: CheckResult[] = [];
  if (config.canvas !== "3:4") return results;

  for (let i = 0; i < slides.length; i++) {
    const s = slides[i];
    const prefix = `portrait-budget.slide[${i}].${s.type}`;

    // Cover/section title: max 15 chars
    if ((s.type === "cover" || s.type === "section") && s.title && charCount(s.title) > 15) {
      results.push(fail(prefix, `Title too long for 3:4: "${s.title.slice(0, 20)}..." (${charCount(s.title)} chars, max 15)`));
    }

    // H2 titles (cards, steps, code, kpi, bullets, table): max 10 chars
    const headingTypes = ["cards-2x2", "cards-3", "steps", "code", "kpi", "bullets", "table"];
    if (headingTypes.includes(s.type) && s.title && charCount(s.title) > 10) {
      results.push(fail(prefix, `H2 title too long for 3:4: "${s.title.slice(0, 20)}..." (${charCount(s.title)} chars, max 10)`));
    }

    // Count total components (cards + steps + kpis + bullets)
    let componentCount = 0;
    if (s.cards) componentCount += s.cards.length;
    if (s.steps) componentCount += s.steps.length;
    if (s.kpis) componentCount += s.kpis.length;
    if (s.bullets) componentCount += s.bullets.length;
    if (componentCount > 6) {
      results.push(fail(prefix, `Too many components for 3:4: ${componentCount} (max 6)`));
    }

    // Steps limit: max 5
    if (s.steps && s.steps.length > 5) {
      results.push(fail(prefix, `Too many steps for 3:4: ${s.steps.length} (max 5)`));
    }

    // KPI limit: max 4
    if (s.kpis && s.kpis.length > 4) {
      results.push(fail(prefix, `Too many KPIs for 3:4: ${s.kpis.length} (max 4)`));
    }

    // Card body length: max 60 chars
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

function checkAnchor(slide: any): CheckResult[] {
  const results: CheckResult[] = [];

  switch (slide.type) {
    case "cover":
      if (!slide.title) results.push(warn("anchor.missing", "Cover has no title — no visual anchor"));
      else results.push(pass("anchor.present", "Anchor: h1 title"));
      break;

    case "section":
      if (!slide.title) results.push(warn("anchor.missing", "Section divider has no title"));
      else results.push(pass("anchor.present", "Anchor: h1 section title"));
      break;

    case "cards-2x2":
    case "cards-3": {
      const cardsWithNum = slide.cards?.filter((c: any) => c.num)?.length || 0;
      if (cardsWithNum < 2) {
        results.push(warn("anchor.weak", "Cards lack visual anchors — add 'num' field to at least 2 cards"));
      } else {
        results.push(pass("anchor.present", `Anchor: ${cardsWithNum} cards with num markers`));
      }
      break;
    }

    case "steps":
      if (!slide.steps?.length) {
        results.push(warn("anchor.missing", "Steps page has no steps defined"));
      } else {
        results.push(pass("anchor.present", `Anchor: ${slide.steps.length} steps`));
      }
      break;

    case "quote":
      if (!slide.quote) results.push(warn("anchor.missing", "Quote page has no quote text"));
      else results.push(pass("anchor.present", `Anchor: quote (${charCount(slide.quote)} chars)`));
      break;

    case "kpi":
      if (!slide.kpis?.length) results.push(warn("anchor.missing", "KPI page has no KPIs"));
      else results.push(pass("anchor.present", `Anchor: ${slide.kpis.length} KPI(s)`));
      break;

    case "bullets":
      if (!slide.bullets?.length || slide.bullets.length < 3) {
        results.push(warn("anchor.weak", "Bullet page has < 3 items — page may feel sparse"));
      } else {
        results.push(pass("anchor.present", `Anchor: ${slide.bullets.length} bullet items`));
      }
      break;

    case "thanks":
      if (!slide.title) results.push(warn("anchor.missing", "Thanks page has no title"));
      else results.push(pass("anchor.present", "Anchor: h1 thanks title"));
      break;

    case "code":
    case "html":
      // html/code types are freeform — minimal anchor check
      if (!slide.code && !slide.html && !slide.title) {
        results.push(warn("anchor.missing", "Content slide has no visible content"));
      } else {
        results.push(pass("anchor.present", "Anchor: content present"));
      }
      break;
  }

  return results;
}

function checkColorSemantics(slide: any, design: string): CheckResult[] {
  const results: CheckResult[] = [];
  const cards = slide.cards;
  if (!cards?.length) return results;

  if (design === "xhs-post") return results; // xhs-post has no color variants

  const warnCards = cards.filter((c: any) => c.color && WARN_COLORS.has(c.color));
  const accentCards = cards.filter((c: any) => c.color && ACCENT_COLORS.has(c.color));

  if (warnCards.length >= 2 && accentCards.length === 0) {
    results.push(warn("color.no-contrast",
      `${warnCards.length} warn-color cards with no accent card. Every problem should have a solution`));
  }

  if (warnCards.length > 0 && accentCards.length > 0) {
    results.push(pass("color.ok", `Color contrast: ${warnCards.length} warn + ${accentCards.length} accent`));
  }

  return results;
}

function checkDesignCompat(slide: any, design: string): CheckResult[] {
  const results: CheckResult[] = [];

  // Blobs only supported in pastel-card
  if (slide.blobs?.length && design !== "pastel-card") {
    results.push(warn("design.blob-unsupported",
      `blobs set but design "${design}" does not render blobs (only pastel-card supports them)`));
  }

  // Validate blob names
  if (slide.blobs && design === "pastel-card") {
    for (const b of slide.blobs) {
      if (!VALID_BLOBS.includes(b)) {
        results.push(warn("design.blob-invalid",
          `Unknown blob "${b}". Valid: ${VALID_BLOBS.join(", ")}`));
      }
    }
  }

  // Validate chip color
  if (slide.chipColor) {
    if (design === "pastel-card") {
      const validChipColors = ["mint", "sky", "lilac", "rose"];
      if (!validChipColors.includes(slide.chipColor)) {
        results.push(info("design.chip-color-invalid",
          `chipColor "${slide.chipColor}" not recognized by pastel-card (uses: ${validChipColors.join(", ")})`));
      }
    } else if (design === "xhs-post") {
      results.push(info("design.chip-color-ignored", "chipColor ignored by xhs-post design"));
    }
    // white-editorial ignores chipColor
  }

  // Validate card colors against design
  if (slide.cards && typeof design === "string" && design !== "xhs-post") {
    const validColors = getDesignColors()[design] || [];
    for (let i = 0; i < slide.cards.length; i++) {
      const color = slide.cards[i].color;
      if (color && !validColors.includes(color)) {
        results.push(info("design.card-color-invalid",
          `Card[${i}] color "${color}" not in ${design} palette (${validColors.join(", ")}). Will render as default card`));
      }
    }
  }

  return results;
}

// ─── Main Validation ──────────────────────────────────────────────────────

function validate(input: any): ValidationReport {
  const { config, slides } = input;

  const slideResults: SlideResult[] = [];

  // Config-level checks
  const configChecks = checkSchema(config, slides);
  if (configChecks.some(c => c.severity === "FAIL")) {
    // Can't proceed with per-slide checks if config is broken
    slideResults.push({
      index: -1,
      type: "config",
      title: config?.title || "(missing)",
      checks: configChecks,
    });
    const failCount = configChecks.filter(c => c.severity === "FAIL" && !c.pass).length;
    return {
      valid: false,
      slides: slideResults,
      summary: {
        total: 0,
        passed: 0,
        fail: failCount,
        warn: configChecks.filter(c => c.severity === "WARN" && !c.pass).length,
      },
    };
  }

  const design = config.design;

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const checks: CheckResult[] = [];

    // Run all check categories
    checks.push(...checkSlideType(slide));
    checks.push(...checkBudget(slide, design));
    checks.push(...checkAnchor(slide));
    checks.push(...checkColorSemantics(slide, design));
    checks.push(...checkDesignCompat(slide, design));

    slideResults.push({
      index: i,
      type: slide.type || "unknown",
      title: slide.title || "(untitled)",
      checks,
    });
  }

  // Portrait budget (3:4 only)
  const portraitChecks = checkPortraitBudget(config, slides);
  if (portraitChecks.length > 0) {
    slideResults.push({
      index: -2,
      type: "portrait-budget",
      title: "3:4 Portrait Budget Rules",
      checks: portraitChecks,
    });
  }

  // Summary
  let failCount = 0;
  let warnCount = 0;
  let totalChecks = 0;
  for (const sr of slideResults) {
    for (const c of sr.checks) {
      if (!c.pass) {
        if (c.severity === "FAIL") failCount++;
        else if (c.severity === "WARN") warnCount++;
      }
      totalChecks++;
    }
  }

  return {
    valid: failCount === 0,
    slides: slideResults,
    summary: {
      total: totalChecks,
      passed: totalChecks - failCount - warnCount,
      fail: failCount,
      warn: warnCount,
    },
  };
}

// ─── Output ───────────────────────────────────────────────────────────────

function printReport(report: ValidationReport, jsonOutput: boolean): void {
  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  const status = report.valid ? "✅ PASS" : "❌ FAIL";
  console.log(`\n  Validation: ${status}`);
  console.log(`  Checks: ${report.summary.total} total, ${report.summary.passed} pass, ${report.summary.fail} fail, ${report.summary.warn} warn\n`);

  for (const sr of report.slides) {
    const failed = sr.checks.filter(c => !c.pass);
    if (failed.length === 0) {
      console.log(`  Slide ${sr.index} (${sr.type}): ${sr.title}  ✅`);
      continue;
    }

    console.log(`  Slide ${sr.index} (${sr.type}): ${sr.title}`);
    for (const c of sr.checks) {
      if (c.pass) continue;
      const icon = c.severity === "FAIL" ? "❌" : c.severity === "WARN" ? "⚠️" : "ℹ️";
      console.log(`    ${icon} [${c.severity}] ${c.check}: ${c.message}`);
    }
    console.log();
  }
}

// ─── CLI ──────────────────────────────────────────────────────────────────

function parseArgs(args: string[]) {
  const opts: { input?: string; stdin?: boolean; output?: string; json?: boolean } = {};
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--input": case "-i": opts.input = args[++i]; break;
      case "--stdin": opts.stdin = true; break;
      case "--output": case "-o": opts.output = args[++i]; break;
      case "--json": opts.json = true; break;
      case "--help": case "-h":
        console.log(`Usage: bun scripts/validate-slides.ts --input slides.json
       cat slides.json | bun scripts/validate-slides.ts --stdin

Validates slides.json against quality standards defined in references/quality-spec.md.
Exit code 0 = all FAIL checks pass. Exit code 1 = FAIL or error.

Options:
  --input, -i   Path to slides.json
  --stdin       Read slides.json from stdin
  --output, -o  Write JSON report to file
  --json        Output report as JSON to stdout`);
        process.exit(0);
    }
  }
  return opts;
}

function main(): void {
  const opts = parseArgs(process.argv.slice(2));

  let raw: string;
  if (opts.stdin) {
    raw = fs.readFileSync("/dev/stdin", "utf-8");
  } else if (opts.input) {
    raw = fs.readFileSync(path.resolve(opts.input), "utf-8");
  } else {
    console.error("Either --input <file> or --stdin is required");
    process.exit(1);
  }

  let input: any;
  try {
    input = JSON.parse(raw);
  } catch {
    console.error("Invalid JSON input");
    process.exit(1);
  }

  const report = validate(input);

  if (opts.output) {
    fs.writeFileSync(path.resolve(opts.output), JSON.stringify(report, null, 2));
    console.log(`Report written: ${opts.output}`);
  } else {
    printReport(report, !!opts.json);
  }

  process.exit(report.valid ? 0 : 1);
}

main();
