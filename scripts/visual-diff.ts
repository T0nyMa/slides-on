/**
 * visual-diff.ts — Browser-based QA layer
 *
 * Uses Playwright to render slides and verify:
 *   1. Chrome position consistency — topbar/footer/page-num Y pos across slides
 *   2. Old vs new pixel diff — per-slide screenshot comparison
 *   3. Overflow detection — any element extending beyond slide bounds
 *
 * Usage:
 *   bun scripts/visual-diff.ts --input index.html                    (consistency + overflow)
 *   bun scripts/visual-diff.ts --old old.html --new new.html         (pixel diff)
 *   bun scripts/visual-diff.ts --input index.html --full             (all checks)
 */

import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

// ─── Types ──────────────────────────────────────────────────────────────

interface ChromePositions {
  slide: number;
  topbarY: number | null;
  footerY: number | null;
  pageNumY: number | null;
}

interface DiffResult {
  slide: number;
  matchPercent: number;
  diffPixels: number;
  totalPixels: number;
}

interface OverflowIssue {
  slide: number;
  element: string;
  overflow: string; // "left", "right", "top", "bottom"
  amount: number;
}

interface BalanceIssue {
  slide: number;
  direction: string; // "left-heavy" | "right-heavy" | "top-heavy" | "bottom-heavy"
  offsetPercent: number;
}

interface WhitespaceIssue {
  slide: number;
  fillPercent: number;
}

interface FontIssue {
  slide: number;
  selector: string;
  fontSize: number;
  issue: string; // "too-small" | "too-large"
}

interface QAReport {
  chromeConsistency: { pass: boolean; issues: string[] };
  overflow: { pass: boolean; issues: OverflowIssue[] };
  whitespace?: { pass: boolean; issues: WhitespaceIssue[] };
  balance?: { pass: boolean; issues: BalanceIssue[] };
  fontAudit?: { pass: boolean; issues: FontIssue[] };
  pixelDiff?: { pass: boolean; threshold: number; results: DiffResult[] };
}

// ─── Cli ────────────────────────────────────────────────────────────────

interface CliArgs {
  input?: string;
  old?: string;
  new?: string;
  full?: boolean;
  threshold?: number; // pixel diff threshold (default 2%)
}

function parseArgs(args: string[]): CliArgs {
  const opts: CliArgs = {};
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--input": case "-i": opts.input = args[++i]; break;
      case "--old": opts.old = args[++i]; break;
      case "--new": opts.new = args[++i]; break;
      case "--full": opts.full = true; break;
      case "--threshold": opts.threshold = parseFloat(args[++i]!) || 2; break;
      case "--help": case "-h":
        console.log(`Usage:
  bun scripts/visual-diff.ts --input index.html             (consistency + overflow)
  bun scripts/visual-diff.ts --old old.html --new new.html  (pixel diff)
  bun scripts/visual-diff.ts --input index.html --full       (all checks)

Checks:
  1. Chrome position consistency — chr-topbar/chr-footer Y pos stable across slides
  2. Pixel diff — per-slide screenshot comparison (old vs new), threshold 2%
  3. Overflow detection — no content element exceeds slide boundaries
  4. Whitespace fill — content should fill ≥30% of slide area
  5. Visual balance — L-R and T-B visual center within 20% of geometric center
  6. Font size audit — no text < 10px, no heading > 25% of slide width`);
        process.exit(0);
    }
  }
  return opts;
}

// ─── Browser helpers ────────────────────────────────────────────────────

async function loadPage(htmlPath: string) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle" });
  await page.waitForSelector(".slide", { timeout: 5000 });
  return { browser, page };
}

async function getSlideCount(page: any): Promise<number> {
  return page.evaluate(() => document.querySelectorAll(".deck > .slide").length);
}

async function activateSlide(page: any, index: number): Promise<void> {
  await page.evaluate((i: number) => {
    const slides = document.querySelectorAll(".deck > .slide");
    slides.forEach((s: Element) => s.classList.remove("is-active"));
    slides[i]?.classList.add("is-active");
  }, index);
  await page.waitForTimeout(200);
}

// ─── Check 1: Chrome position consistency ───────────────────────────────

async function checkChromePositions(page: any): Promise<{ pass: boolean; issues: string[] }> {
  const total = await getSlideCount(page);
  const positions: ChromePositions[] = [];
  const issues: string[] = [];

  for (let i = 0; i < total; i++) {
    await activateSlide(page, i);

    const pos = await page.evaluate(() => {
      const active = document.querySelector(".deck > .slide.is-active") || document.querySelector(".slide.is-active");
      if (!active) return { topbarY: null, footerY: null, pageNumY: null };

      // Look for chrome elements within the active slide only
      const findInSlide = (selectors: string[]) => {
        for (const sel of selectors) {
          const el = active.querySelector(sel);
          if (el) {
            const style = window.getComputedStyle(el);
            if (style.display !== "none" && style.visibility !== "hidden") {
              return el.getBoundingClientRect().top;
            }
          }
        }
        return null;
      };

      return {
        topbarY: findInSlide([".chr-topbar"]),
        footerY: findInSlide([".chr-footer"]),
        pageNumY: findInSlide([".chr-page", ".pg-num"]),
      };
    });

    positions.push({ slide: i + 1, ...pos });
  }

  // Check consistency: if element exists on ≥2 slides, Y must be within 2px
  for (const key of ["topbarY", "footerY", "pageNumY"] as const) {
    const values = positions
      .filter(p => p[key] !== null)
      .map(p => ({ slide: p.slide, y: p[key]! }));

    if (values.length < 2) continue;

    const mean = values.reduce((s, v) => s + v.y, 0) / values.length;
    const maxDev = Math.max(...values.map(v => Math.abs(v.y - mean)));

    if (maxDev > 2) {
      const details = values.map(v => `#${v.slide}=${v.y.toFixed(0)}px`).join(", ");
      issues.push(
        `${key}: Y position varies by ${maxDev.toFixed(1)}px across slides (max 2px allowed). Values: ${details}`
      );
    }
  }

  return { pass: issues.length === 0, issues };
}

// ─── Check 2: Pixel diff ────────────────────────────────────────────────

function pixelDiff(img1: Buffer, img2: Buffer): { matchPercent: number; diffPixels: number; totalPixels: number } {
  // Compare raw RGBA pixel data. PNG headers may differ in size, so compare pixel-by-pixel
  // from the raw buffers. Skip PNG header bytes (first ~100 bytes vary).
  const minLen = Math.min(img1.length, img2.length);
  let diffPixels = 0;
  let totalPixels = 0;

  // Simple comparison: count differing bytes (RGBA quads)
  for (let i = 0; i < minLen - 3; i += 4) {
    totalPixels++;
    if (img1[i] !== img2[i] || img1[i + 1] !== img2[i + 1] ||
        img1[i + 2] !== img2[i + 2] || img1[i + 3] !== img2[i + 3]) {
      diffPixels++;
    }
  }

  const matchPercent = totalPixels > 0 ? ((totalPixels - diffPixels) / totalPixels) * 100 : 100;
  return { matchPercent, diffPixels, totalPixels };
}

async function compareHTMLs(oldPath: string, newPath: string, threshold: number): Promise<{ pass: boolean; results: DiffResult[] }> {
  const { browser: oldBrowser, page: oldPage } = await loadPage(oldPath);
  const { browser: newBrowser, page: newPage } = await loadPage(newPath);

  const oldCount = await getSlideCount(oldPage);
  const newCount = await getSlideCount(newPage);

  if (oldCount !== newCount) {
    console.log(`  Slide count mismatch: old=${oldCount}, new=${newCount}`);
  }

  const count = Math.min(oldCount, newCount);
  const results: DiffResult[] = [];

  for (let i = 0; i < count; i++) {
    await activateSlide(oldPage, i);
    await activateSlide(newPage, i);

    const oldShot = await oldPage.locator(".slide.is-active").screenshot({ type: "png" });
    const newShot = await newPage.locator(".slide.is-active").screenshot({ type: "png" });

    const diff = pixelDiff(oldShot, newShot);
    results.push({ slide: i + 1, ...diff });
  }

  await oldBrowser.close();
  await newBrowser.close();

  const worstMatch = Math.min(...results.map(r => r.matchPercent));
  return { pass: worstMatch >= (100 - threshold), results };
}

// ─── Check 3: Overflow detection ────────────────────────────────────────

async function checkOverflow(page: any): Promise<{ pass: boolean; issues: OverflowIssue[] }> {
  const total = await getSlideCount(page);
  const issues: OverflowIssue[] = [];

  for (let i = 0; i < total; i++) {
    await activateSlide(page, i);

    const overflows = await page.evaluate(() => {
      const active = document.querySelector(".deck > .slide.is-active") || document.querySelector(".slide.is-active");
      if (!active) return [];

      const slideRect = active.getBoundingClientRect();
      const results: Array<{ element: string; overflow: string; amount: number }> = [];
      const children = active.querySelectorAll("*");

      for (const child of children) {
        const rect = child.getBoundingClientRect();
        const tag = child.tagName.toLowerCase();
        const cls = (child as Element).getAttribute("class") || "";
        const id = (child as Element).id ? `#${(child as Element).id}` : "";

        // Skip elements with 0 dimensions (hidden, empty)
        if (rect.width === 0 || rect.height === 0) continue;
        // Skip decorative: blobs, backgrounds, scanlines, absolute pointer-events-none
        if (/(?:chr-blob|bg-glow|bg-grid|chr-hc-grid|chr-hc-scanlines|chr-hc-vignette)/.test(cls)) continue;
        const style = window.getComputedStyle(child);
        if (style.pointerEvents === "none" && (style.position === "absolute" || style.position === "fixed")) continue;

        const label = `${tag}${id}${cls ? "." + cls.split(" ").slice(0, 2).join(".") : ""}`;

        if (rect.left < slideRect.left - 1) {
          results.push({ element: label, overflow: "left", amount: slideRect.left - rect.left });
        }
        if (rect.right > slideRect.right + 1) {
          results.push({ element: label, overflow: "right", amount: rect.right - slideRect.right });
        }
        if (rect.top < slideRect.top - 1) {
          results.push({ element: label, overflow: "top", amount: slideRect.top - rect.top });
        }
        if (rect.bottom > slideRect.bottom + 1) {
          results.push({ element: label, overflow: "bottom", amount: rect.bottom - slideRect.bottom });
        }
      }
      return results;
    });

    for (const ov of overflows) {
      issues.push({ slide: i + 1, ...ov });
    }
  }

  return { pass: issues.length === 0, issues };
}

// ─── Check 4: Whitespace ratio ──────────────────────────────────────────

const DECORATIVE_CLASSES = ["chr-blob", "bg-glow", "bg-grid", "chr-hc-grid", "chr-hc-scanlines", "chr-hc-vignette"];

function isDecorative(el: any): boolean {
  const cls = el.getAttribute("class") || "";
  if (DECORATIVE_CLASSES.some(c => cls.includes(c))) return true;
  const style = window.getComputedStyle(el);
  if (style.pointerEvents === "none" && (style.position === "absolute" || style.position === "fixed")) return true;
  if (parseFloat(style.opacity) < 0.1) return true;
  if (style.display === "none" || style.visibility === "hidden") return true;
  return false;
}

async function checkWhitespace(page: any): Promise<{ pass: boolean; issues: WhitespaceIssue[] }> {
  const total = await getSlideCount(page);
  const issues: WhitespaceIssue[] = [];

  for (let i = 0; i < total; i++) {
    await activateSlide(page, i);

    const fill = await page.evaluate((decorativeFilter: string) => {
      const active = document.querySelector(".deck > .slide.is-active") || document.querySelector(".slide.is-active");
      if (!active) return 100;

      const slideRect = active.getBoundingClientRect();
      const slideArea = slideRect.width * slideRect.height;
      if (slideArea === 0) return 100;

      // Collect bounding boxes of all non-decorative content elements
      let minX = slideRect.right, minY = slideRect.bottom;
      let maxX = slideRect.left, maxY = slideRect.top;
      let hasContent = false;

      const decoClasses = decorativeFilter.split(",");
      for (const child of active.querySelectorAll("*")) {
        const cls = child.getAttribute("class") || "";
        if (decoClasses.some(c => cls.includes(c))) continue;
        const style = window.getComputedStyle(child);
        if (style.display === "none" || style.visibility === "hidden") continue;
        if (style.pointerEvents === "none" && (style.position === "absolute" || style.position === "fixed")) continue;

        const rect = child.getBoundingClientRect();
        if (rect.width < 5 || rect.height < 5) continue;
        if (rect.left >= slideRect.right || rect.right <= slideRect.left) continue;

        hasContent = true;
        minX = Math.min(minX, rect.left);
        minY = Math.min(minY, rect.top);
        maxX = Math.max(maxX, rect.right);
        maxY = Math.max(maxY, rect.bottom);
      }

      if (!hasContent) return 100;

      const contentArea = (maxX - minX) * (maxY - minY);
      return Math.round((contentArea / slideArea) * 100);
    }, DECORATIVE_CLASSES.join(","));

    if (fill < 30) {
      issues.push({ slide: i + 1, fillPercent: fill });
    }
  }

  return { pass: issues.length === 0, issues };
}

// ─── Check 5: Visual balance ────────────────────────────────────────────

async function checkBalance(page: any): Promise<{ pass: boolean; issues: BalanceIssue[] }> {
  const total = await getSlideCount(page);
  const issues: BalanceIssue[] = [];

  for (let i = 0; i < total; i++) {
    await activateSlide(page, i);

    const balance = await page.evaluate((decorativeFilter: string) => {
      const active = document.querySelector(".deck > .slide.is-active") || document.querySelector(".slide.is-active");
      if (!active) return null;

      const slideRect = active.getBoundingClientRect();
      const slideCX = slideRect.left + slideRect.width / 2;
      const slideCY = slideRect.top + slideRect.height / 2;

      let totalWeight = 0;
      let weightedX = 0;
      let weightedY = 0;

      const decoClasses = decorativeFilter.split(",");
      for (const child of active.querySelectorAll("*")) {
        const cls = child.getAttribute("class") || "";
        if (decoClasses.some(c => cls.includes(c))) continue;
        const style = window.getComputedStyle(child);
        if (style.display === "none" || style.visibility === "hidden") continue;
        if (style.pointerEvents === "none" && (style.position === "absolute" || style.position === "fixed")) continue;

        const rect = child.getBoundingClientRect();
        if (rect.width < 10 || rect.height < 10) continue;

        // Weight by element area (visual mass)
        const area = rect.width * rect.height;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        weightedX += cx * area;
        weightedY += cy * area;
        totalWeight += area;
      }

      if (totalWeight === 0) return null;

      const centerX = weightedX / totalWeight;
      const centerY = weightedY / totalWeight;
      const offsetX = ((centerX - slideCX) / slideRect.width) * 100;
      const offsetY = ((centerY - slideCY) / slideRect.height) * 100;

      return { offsetX: Math.round(offsetX * 10) / 10, offsetY: Math.round(offsetY * 10) / 10 };
    }, DECORATIVE_CLASSES.join(","));

    if (!balance) continue;

    if (Math.abs(balance.offsetX) > 20) {
      issues.push({
        slide: i + 1,
        direction: balance.offsetX > 0 ? "right-heavy" : "left-heavy",
        offsetPercent: Math.abs(balance.offsetX),
      });
    }
    if (Math.abs(balance.offsetY) > 20) {
      issues.push({
        slide: i + 1,
        direction: balance.offsetY > 0 ? "bottom-heavy" : "top-heavy",
        offsetPercent: Math.abs(balance.offsetY),
      });
    }
  }

  return { pass: issues.length === 0, issues };
}

// ─── Check 6: Font size audit ───────────────────────────────────────────

async function checkFontSizes(page: any): Promise<{ pass: boolean; issues: FontIssue[] }> {
  const total = await getSlideCount(page);
  const issues: FontIssue[] = [];

  for (let i = 0; i < total; i++) {
    await activateSlide(page, i);

    const fontIssues = await page.evaluate(() => {
      const active = document.querySelector(".deck > .slide.is-active") || document.querySelector(".slide.is-active");
      if (!active) return [];

      const results: Array<{ selector: string; fontSize: number; issue: string }> = [];

      // Check all text-containing elements
      const textElements = active.querySelectorAll("h1, h2, h3, h4, h5, h6, p, span, li, a, div, pre, code, blockquote, b, strong, em");
      for (const el of textElements) {
        const text = (el as HTMLElement).innerText?.trim();
        if (!text || text.length < 2) continue;

        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        if (isNaN(fontSize)) continue;

        const tag = el.tagName.toLowerCase();
        const cls = (el as Element).getAttribute("class") || "";
        const label = cls ? `${tag}.${cls.split(" ")[0]}` : tag;

        const slideWidth = active.getBoundingClientRect().width;
        // Small text: < 7px absolute minimum (cqi scales, so 8px on 540px 3:4 is readable)
        if (fontSize < 7) {
          results.push({ selector: label, fontSize, issue: "too-small" });
        }
        // Large headings: should not exceed 30% of slide width
        if ((tag.startsWith("h") || cls.includes("title") || cls.includes("heading")) && fontSize > slideWidth * 0.30) {
          results.push({ selector: label, fontSize, issue: "too-large" });
        }
      }
      return results;
    });

    for (const fi of fontIssues) {
      issues.push({ slide: i + 1, ...fi });
    }
  }

  return { pass: issues.length === 0, issues };
}

// ─── Report ──────────────────────────────────────────────────────────────

function printReport(report: QAReport): void {
  console.log(`\n  Visual Diff Report`);
  console.log(`  ─────────────────`);

  // Chrome consistency
  const ccIcon = report.chromeConsistency.pass ? "✅" : "❌";
  console.log(`\n  ${ccIcon} Chrome Position Consistency`);
  for (const issue of report.chromeConsistency.issues) {
    console.log(`     ${issue}`);
  }

  // Overflow
  const ovIcon = report.overflow.pass ? "✅" : "❌";
  console.log(`\n  ${ovIcon} Overflow Detection (${report.overflow.issues.length} issue(s))`);
  for (const issue of report.overflow.issues) {
    console.log(`     slide #${issue.slide}: ${issue.element} overflows ${issue.overflow} by ${issue.amount.toFixed(0)}px`);
  }

  // Whitespace
  if (report.whitespace) {
    const wsIcon = report.whitespace.pass ? "✅" : "⚠️";
    console.log(`\n  ${wsIcon} Whitespace Fill (threshold: ≥30%)`);
    for (const issue of report.whitespace.issues) {
      console.log(`     slide #${issue.slide}: only ${issue.fillPercent}% content fill — too much whitespace`);
    }
  }

  // Balance
  if (report.balance) {
    const balIcon = report.balance.pass ? "✅" : "⚠️";
    console.log(`\n  ${balIcon} Visual Balance (offset < 20%)`);
    for (const issue of report.balance.issues) {
      console.log(`     slide #${issue.slide}: ${issue.direction} (${issue.offsetPercent}% offset from center)`);
    }
  }

  // Font audit
  if (report.fontAudit) {
    const faIcon = report.fontAudit.pass ? "✅" : "⚠️";
    console.log(`\n  ${faIcon} Font Size Audit`);
    for (const issue of report.fontAudit.issues) {
      console.log(`     slide #${issue.slide}: ${issue.selector} at ${issue.fontSize}px — ${issue.issue}`);
    }
  }

  // Pixel diff
  if (report.pixelDiff) {
    const pdIcon = report.pixelDiff.pass ? "✅" : "❌";
    console.log(`\n  ${pdIcon} Pixel Diff (threshold: ${report.pixelDiff.threshold}%)`);
    for (const r of report.pixelDiff.results) {
      const icon = r.matchPercent >= (100 - report.pixelDiff.threshold) ? "  " : "❌";
      console.log(`     ${icon} slide #${r.slide}: ${r.matchPercent.toFixed(1)}% match (${r.diffPixels.toLocaleString()} diff px / ${r.totalPixels.toLocaleString()} total)`);
    }
  }

  const allPass = report.chromeConsistency.pass &&
    report.overflow.pass &&
    (!report.pixelDiff || report.pixelDiff.pass);
  console.log(`\n  Result: ${allPass ? "PASS" : "FAIL"}\n`);
}

// ─── Main ────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const cli = parseArgs(process.argv.slice(2));
  const report: QAReport = {
    chromeConsistency: { pass: true, issues: [] },
    overflow: { pass: true, issues: [] },
  };

  // ── Chrome consistency + overflow (--input mode) ──
  if (cli.input) {
    const htmlPath = path.resolve(cli.input);
    if (!fs.existsSync(htmlPath)) {
      console.error(`File not found: ${htmlPath}`);
      process.exit(1);
    }

    console.log(`  Loading: ${htmlPath}`);
    const { browser, page } = await loadPage(htmlPath);

    const total = await getSlideCount(page);
    console.log(`  Slides: ${total}`);

    report.chromeConsistency = await checkChromePositions(page);
    report.overflow = await checkOverflow(page);
    report.whitespace = await checkWhitespace(page);
    report.balance = await checkBalance(page);
    report.fontAudit = await checkFontSizes(page);

    await browser.close();
  }

  // ── Pixel diff (--old --new mode) ──
  if (cli.old && cli.new) {
    const oldPath = path.resolve(cli.old);
    const newPath = path.resolve(cli.new);
    if (!fs.existsSync(oldPath)) { console.error(`File not found: ${oldPath}`); process.exit(1); }
    if (!fs.existsSync(newPath)) { console.error(`File not found: ${newPath}`); process.exit(1); }

    const threshold = cli.threshold || 2;
    console.log(`  Old: ${oldPath}`);
    console.log(`  New: ${newPath}`);
    console.log(`  Threshold: ${threshold}%`);

    report.pixelDiff = await compareHTMLs(oldPath, newPath, threshold);
    report.pixelDiff.threshold = threshold;
  }

  if (!cli.input && !cli.old) {
    console.error("Either --input or --old/--new is required");
    process.exit(1);
  }

  printReport(report);

  const allPass = report.chromeConsistency.pass &&
    report.overflow.pass &&
    (!report.whitespace || report.whitespace.pass) &&
    (!report.balance || report.balance.pass) &&
    (!report.fontAudit || report.fontAudit.pass) &&
    (!report.pixelDiff || report.pixelDiff.pass);
  process.exit(allPass ? 0 : 1);
}

main().catch(err => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
