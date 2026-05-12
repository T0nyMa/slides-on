/**
 * render-precise.ts — High-precision HTML slide deck → PNG/JPEG renderer
 *
 * Replaces render.sh (headless Chrome) and render_xhs.js (custom Playwright)
 * with a single, production-quality rendering engine.
 *
 * Key capabilities:
 *   - Auto-detect slide count from DOM (replaces hardcoded N and grep hacks)
 *   - document.fonts.ready for precise font loading (replaces --virtual-time-budget guessing)
 *   - CSS animation completion detection (replaces arbitrary timeouts)
 *   - Element-level screenshot (.slide.is-active div) — captures only the slide,
 *     not the viewport. Output dimensions = slide rendered size × deviceScaleFactor.
 *   - deviceScaleFactor for @2x Retina; CSS viewport stays at design canvas size
 *     so @media queries and container queries see correct breakpoints.
 *   - 7 canvas size presets + custom WxH
 *   - Per-slide error resilience with aggregated report
 *
 * Usage:
 *   bun scripts/render-precise.ts deck.html
 *   bun scripts/render-precise.ts deck.html --canvas 3:4 --dsf 2 --slides auto
 */

import { chromium, Browser, Page } from "playwright";
import * as path from "path";
import * as fs from "fs";
import { resolveCanvas } from "./helpers/canvas-presets";
import { parseArgs, printUsage } from "./helpers/cli";
import type { RenderOptions } from "./helpers/cli";

// ─── Entry ───────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (!opts.input) {
    console.log(printUsage());
    process.exit(1);
  }

  const htmlPath = path.resolve(opts.input);
  if (!fs.existsSync(htmlPath)) {
    console.error(`Error: file not found: ${htmlPath}`);
    process.exit(1);
  }

  const canvas = resolveCanvas(opts.canvas);
  const outDir = opts.output || path.join(path.dirname(htmlPath), `${path.basename(htmlPath, path.extname(htmlPath))}-png`);

  if (opts.verbose) {
    console.log(`Input:    ${htmlPath}`);
    console.log(`Output:   ${outDir}`);
    console.log(`Canvas:   ${canvas.width}×${canvas.height} (${canvas.label})`);
    console.log(`DSF:      ${opts.dsf}×`);
    console.log(`Format:   ${opts.format.toUpperCase()}`);
    console.log(`Slides:   ${opts.slides}`);
    console.log(`AnimWait: ${opts.waitAnimations}`);
    console.log();
  }

  const result = await renderDeck(htmlPath, outDir, canvas, opts);

  console.log(`\nDone. ${result.slides} slides → ${outDir}/`);
  if (result.errors.length > 0) {
    console.log(`Warnings: ${result.errors.length} slide(s) had issues:`);
    for (const e of result.errors) console.log(`  - ${e}`);
  }
}

// ─── Core rendering ──────────────────────────────────────────────────

interface RenderResult {
  slides: number;
  errors: string[];
}

async function renderDeck(
  htmlPath: string,
  outDir: string,
  canvas: { width: number; height: number },
  opts: RenderOptions
): Promise<RenderResult> {
  fs.mkdirSync(outDir, { recursive: true });

  const fileUrl = `file://${htmlPath}`;
  const errors: string[] = [];

  const browser = await chromium.launch({ headless: true });

  // Step 1: Determine slide count by loading the deck once
  const probePage = await browser.newPage();
  await probePage.setViewportSize({ width: canvas.width, height: canvas.height });
  await probePage.goto(fileUrl, { waitUntil: "networkidle" });

  const slideCount = opts.slides === "auto" ? await detectSlideCount(probePage) : opts.slides;
  const navMode = await detectNavMode(probePage, fileUrl);

  if (opts.verbose) console.log(`Detected: ${slideCount} slides, nav mode: ${navMode}`);

  await probePage.close();

  // Step 2: Render each slide via element screenshot (not viewport clip).
  // Set viewport to design canvas size (CSS px) and use deviceScaleFactor
  // for @2x Retina. Screenshot the .slide.is-active element directly so
  // output dimensions = element's rendered size × dsf.
  const ext = opts.format === "jpeg" ? "jpg" : "png";

  const context = await browser.newContext({
    viewport: { width: canvas.width, height: canvas.height },
    deviceScaleFactor: opts.dsf,
  });
  const page = await context.newPage();

  const startN = opts.slide ?? 1;
  const endN = opts.slide ?? slideCount;

  for (let n = startN; n <= endN; n++) {
    const outFile = path.join(outDir, `page_${String(n).padStart(2, "0")}.${ext}`);

    try {
      await renderSlide(page, fileUrl, n, navMode, opts);

      // Get the active slide element directly from the browser context.
      // Using evaluateHandle avoids Playwright locator strict-mode issues.
      const handle = await page.evaluateHandle(() => {
        const deck = document.querySelector(".deck");
        return deck ? deck.querySelector(".slide.is-active") : null;
      });
      const slideEl = handle.asElement();
      if (!slideEl) throw new Error("No .slide.is-active element found");

      await slideEl.screenshot({
        path: outFile,
        type: opts.format,
        quality: opts.format === "jpeg" ? opts.quality : undefined,
      });

      const sizeKB = Math.round(fs.statSync(outFile).size / 1024);
      const box = await slideEl.boundingBox();
      const w = box ? Math.round(box.width * opts.dsf) : canvas.width * opts.dsf;
      const h = box ? Math.round(box.height * opts.dsf) : canvas.height * opts.dsf;

      // Overflow check (optional)
      let overflowNote = "";
      if (opts.checkOverflow) {
        const overflows = await checkSlideOverflow(page);
        if (overflows.length > 0) {
          overflowNote = `  ⚠ OVERFLOW: ${overflows.join("; ")}`;
        }
      }

      console.log(`  [${n}/${slideCount}] page_${String(n).padStart(2, "0")}.${ext}  (${w}×${h}, ${sizeKB} KB)${overflowNote}`);
    } catch (err: any) {
      const msg = `Slide ${n}: ${err.message}`;
      errors.push(msg);
      console.error(`  [${n}/${slideCount}] FAILED — ${err.message}`);
    }
  }

  await context.close();
  await browser.close();

  return { slides: slideCount, errors };
}

// ─── Slide rendering ─────────────────────────────────────────────────

async function renderSlide(
  page: Page,
  fileUrl: string,
  n: number,
  navMode: string,
  opts: RenderOptions
) {
  if (navMode === "query") {
    await page.goto(`${fileUrl}?slide=${n}`, { waitUntil: "networkidle", timeout: 30000 });
  } else {
    // Hash mode: page.goto with #/N on file:// URLs doesn't reliably trigger
    // hashchange. Use full navigation for slide 1, then evaluate for the rest.
    if (n === 1) {
      await page.goto(`${fileUrl}#/1`, { waitUntil: "networkidle", timeout: 30000 });
    } else {
      // Direct slide activation: toggle is-active on the target, remove from others.
      // This is more reliable than hashchange-based navigation for headless rendering,
      // since Playwright's file:// URL navigation with hash fragments is inconsistent.
      await page.evaluate((slideNum) => {
        const deck = document.querySelector('.deck');
        if (!deck) return;
        const slides = deck.querySelectorAll(':scope > .slide');
        slides.forEach((s, i) => {
          const isTarget = (i === slideNum - 1);
          s.classList.toggle('is-active', isTarget);
          s.classList.toggle('is-prev', i < slideNum - 1);
        });
        // Also update the hash so the URL reflects the current slide
        if (window.location.hash !== '#/' + slideNum) {
          try { history.replaceState(null, '', '#/' + slideNum); } catch(e) {}
        }
      }, n);
      // Short delay to let any CSS transitions settle
      await page.waitForTimeout(150);
    }
  }

  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready).catch(() => {
    // Font loading timeout is non-fatal; continue with fallback fonts
  });

  // Optionally wait for CSS animations to settle
  if (opts.waitAnimations) {
    await waitForAnimations(page);
  }

  // Extra safety delay for any remaining async rendering
  if (opts.extraDelay > 0) {
    await page.waitForTimeout(opts.extraDelay);
  }
}

// ─── Slide detection ─────────────────────────────────────────────────

async function detectSlideCount(page: Page): Promise<number> {
  // Count .slide elements inside .deck, excluding runtime-created clones in .overview/.mini-slide
  let count = await page.evaluate(() => {
    const deck = document.querySelector(".deck");
    if (!deck) return 0;
    return deck.querySelectorAll(".slide").length;
  });
  if (count > 0) return count;

  // Try .deck > section.slide (html5 semantic variant)
  count = await page.evaluate(() => {
    const deck = document.querySelector(".deck");
    if (!deck) return 0;
    return deck.querySelectorAll(":scope > .slide, :scope > section.slide").length;
  });
  if (count > 0) return count;

  // Try data-slide attribute
  count = await page.evaluate(() => document.querySelectorAll("[data-slide]").length);
  if (count > 0) return count;

  throw new Error("Could not detect slide count. Use --slides N to specify manually.");
}

// ─── Navigation mode detection ───────────────────────────────────────

async function detectNavMode(page: Page, fileUrl: string): Promise<"hash" | "query"> {
  // Check if the page responds to ?slide=N query parameter
  const hasQuerySupport = await page.evaluate(() => {
    const url = new URL(location.href);
    return url.searchParams.has("slide");
  });

  // If the page already has ?slide in URL, it uses query mode
  if (hasQuerySupport || fileUrl.includes("?slide")) return "query";

  // Otherwise default to html-ppt standard hash navigation #/N
  return "hash";
}

// ─── Overflow detection ──────────────────────────────────────────────

async function checkSlideOverflow(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    const issues: string[] = [];
    const slide = document.querySelector(".slide.is-active") as HTMLElement | null;
    if (!slide) return issues;
    const slideRect = slide.getBoundingClientRect();
    const decorativeClasses = ["chr-blob", "chr-hc-grid", "chr-hc-scanlines", "bg-glow", "chr-bg"];
    const children = slide.querySelectorAll("*");
    children.forEach((el) => {
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return;
      if (style.position === "absolute" || style.position === "fixed") return;
      if (style.pointerEvents === "none") return;
      if (decorativeClasses.some((c) => el.classList.contains(c))) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dirs: string[] = [];
      if (rect.right - slideRect.right > 2) dirs.push(`${Math.round(rect.right - slideRect.right)}px right`);
      if (rect.bottom - slideRect.bottom > 2) dirs.push(`${Math.round(rect.bottom - slideRect.bottom)}px bottom`);
      if (slideRect.left - rect.left > 2) dirs.push(`${Math.round(slideRect.left - rect.left)}px left`);
      if (dirs.length > 0) {
        const text = (el.textContent || "").slice(0, 30).replace(/\s+/g, " ");
        const cls = el.className ? "." + (typeof el.className === "string" ? el.className.split(" ")[0] : "") : "";
        issues.push(`${el.tagName.toLowerCase()}${cls} "${text}" → ${dirs.join(", ")}`);
      }
    });
    return issues;
  });
}

// ─── Animation waiting ───────────────────────────────────────────────

async function waitForAnimations(page: Page): Promise<void> {
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      const maxWait = 5000; // 5s safety ceiling
      const start = Date.now();

      function check() {
        const animating = document.getAnimations().filter(
          (a) => a.playState === "running" || a.playState === "pending"
        );
        if (animating.length === 0) return resolve();
        if (Date.now() - start > maxWait) return resolve(); // safety bailout
        requestAnimationFrame(check);
      }

      // Give the browser a tick to start animations
      setTimeout(check, 100);
    });
  }).catch(() => {
    // Non-fatal: continue even if animation waiting fails
  });
}

// ─── Run ─────────────────────────────────────────────────────────────

const isMain = import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("render-precise.ts");
if (isMain) {
  main().catch((err) => {
    console.error("Fatal:", err.message);
    process.exit(1);
  });
}

export { renderDeck };
export type { RenderOptions, RenderResult };
