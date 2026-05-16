/**
 * verify-refactor.ts — Regression verification for self-contained HTML refactoring
 *
 * Compares screenshots of old (<link>-based) vs new (inline) HTML for sample decks.
 *
 * Usage:
 *   bun scripts/verify-refactor.ts --deck hermes-cyber-terminal
 *   bun scripts/verify-refactor.ts --all       # sample 3 decks
 */

import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(import.meta.dir, "..");
const WORKTREE = "/tmp/slides-on-old";
const SAMPLE_DECKS = ["hermes-cyber-terminal", "xhs-post", "xhs-white-editorial"];

interface DiffResult {
  deck: string;
  slide: number;
  diffPercent: number;
  diffPixels: number;
  totalPixels: number;
}

// ─── Screenshot capture ─────────────────────────────────────────────────

async function screenshotSlides(htmlPath: string, viewport: { width: number; height: number }): Promise<Buffer[]> {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });

  await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle" });
  await page.waitForSelector(".slide.is-active", { timeout: 10000 });

  // Count slides
  const slideCount = await page.evaluate(() => document.querySelectorAll(".slide").length);
  const screenshots: Buffer[] = [];

  for (let i = 0; i < slideCount; i++) {
    // Activate slide i
    await page.evaluate((idx) => {
      const slides = document.querySelectorAll(".slide");
      slides.forEach((s) => s.classList.remove("is-active"));
      slides[idx].classList.add("is-active");
    }, i);

    await page.waitForTimeout(500); // let CSS transitions settle

    // Use page screenshot with clip to avoid locator visibility issues
    const screenshot = await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
    });
    screenshots.push(screenshot);
  }

  await browser.close();
  return screenshots;
}

// ─── Pixel comparison ───────────────────────────────────────────────────

async function diffScreenshots(oldBuf: Buffer, newBuf: Buffer): Promise<{ diffPercent: number; diffPixels: number; totalPixels: number }> {
  const { PNG } = await import("pngjs");
  const pixelmatch = (await import("pixelmatch")).default;

  const oldImg = PNG.sync.read(oldBuf);
  const newImg = PNG.sync.read(newBuf);

  if (oldImg.width !== newImg.width || oldImg.height !== newImg.height) {
    return { diffPercent: 100, diffPixels: -1, totalPixels: oldImg.width * oldImg.height };
  }

  const { width, height } = oldImg;
  const diff = new PNG({ width, height });

  const diffPixels = pixelmatch(oldImg.data, newImg.data, diff.data, width, height, { threshold: 0.1 });
  const totalPixels = width * height;

  return {
    diffPercent: Math.round((diffPixels / totalPixels) * 10000) / 100,
    diffPixels,
    totalPixels,
  };
}

// ─── Main ────────────────────────────────────────────────────────────────

async function verifyDeck(deck: string): Promise<DiffResult[]> {
  console.log(`\n📸 ${deck}`);

  // Determine viewport
  const isPortrait = deck.includes("xhs");
  const viewport = isPortrait
    ? { width: 810, height: 1080 }
    : { width: 1920, height: 1080 };

  // Generate old HTML in worktree
  const oldSlides = path.join(WORKTREE, "templates/full-decks", deck, "slides.json");
  const oldHtml = path.join(WORKTREE, "templates/full-decks", deck, "index.old-gen.html");

  if (!fs.existsSync(oldSlides)) {
    console.log(`  ⚠️  No slides.json in worktree, skipping old generation`);
    return [];
  }

  // Run old assemble
  const proc = Bun.spawnSync(["bun", "scripts/assemble-deck.ts", "-i", oldSlides, "-o", oldHtml], {
    cwd: WORKTREE,
  });
  if (!proc.success) {
    console.log(`  ❌ Old assemble failed: ${new TextDecoder().decode(proc.stderr)}`);
    return [];
  }
  console.log(`  Old HTML generated`);

  // Generate new HTML
  const newSlides = path.join(ROOT, "templates/full-decks", deck, "slides.json");
  const newHtml = path.join(ROOT, "templates/full-decks", deck, "index.html");
  const proc2 = Bun.spawnSync(["bun", "scripts/assemble-deck.ts", "-i", newSlides, "-o", newHtml], {
    cwd: ROOT,
  });
  if (!proc2.success) {
    console.log(`  ❌ New assemble failed: ${new TextDecoder().decode(proc2.stderr)}`);
    return [];
  }
  console.log(`  New HTML generated`);

  // Screenshot old
  console.log(`  Screenshotting old...`);
  const oldShots = await screenshotSlides(oldHtml, viewport);
  console.log(`  ${oldShots.length} old slides captured`);

  // Screenshot new
  console.log(`  Screenshotting new...`);
  const newShots = await screenshotSlides(newHtml, viewport);
  console.log(`  ${newShots.length} new slides captured`);

  // Compare
  const results: DiffResult[] = [];
  const minSlides = Math.min(oldShots.length, newShots.length);

  for (let i = 0; i < minSlides; i++) {
    const diff = await diffScreenshots(oldShots[i], newShots[i]);
    const icon = diff.diffPercent < 1 ? "✅" : diff.diffPercent < 5 ? "⚠️" : "❌";
    console.log(`  ${icon} Slide ${i + 1}: ${diff.diffPercent}% diff (${diff.diffPixels}/${diff.totalPixels} px)`);
    results.push({ deck, slide: i + 1, ...diff });
  }

  // Cleanup old generated HTML
  try { fs.unlinkSync(oldHtml); } catch {}

  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const decks = args.includes("--all") ? SAMPLE_DECKS : args.filter((a) => !a.startsWith("-"));

  if (decks.length === 0) {
    console.log("Usage: bun scripts/verify-refactor.ts --all | --deck <name>");
    process.exit(1);
  }

  // Verify worktree exists
  if (!fs.existsSync(path.join(WORKTREE, "scripts/assemble/skeleton.ts"))) {
    console.error(`❌ Worktree not found at ${WORKTREE}. Run: git worktree add /tmp/slides-on-old HEAD`);
    process.exit(1);
  }

  const allResults: DiffResult[] = [];
  for (const deck of decks) {
    const results = await verifyDeck(deck);
    allResults.push(...results);
  }

  // Summary
  console.log(`\n═══════════════════════════════════════════════════════════`);
  console.log(`  Screenshot Comparison Summary`);
  console.log(`═══════════════════════════════════════════════════════════`);
  for (const r of allResults) {
    const icon = r.diffPercent < 1 ? "✅" : r.diffPercent < 5 ? "⚠️" : "❌";
    console.log(`  ${icon} ${r.deck} slide #${r.slide}: ${r.diffPercent}% diff`);
  }

  const regressions = allResults.filter((r) => r.diffPercent >= 5);
  if (regressions.length > 0) {
    console.log(`\n  ❌ ${regressions.length} slides with ≥5% diff — possible regressions`);
  } else {
    console.log(`\n  ✅ All slides pass (<5% diff threshold)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
