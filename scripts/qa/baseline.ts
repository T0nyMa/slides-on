/**
 * baseline.ts — Screenshot baseline management + pixelmatch regression comparison
 *
 * Subcommands:
 *   init [--deck <name>]   Capture and store reference screenshots for one or all decks
 *   compare --deck <name>  Capture current screenshots and pixel-diff against baseline
 *
 * Baselines are stored in .qa/baselines/<deck>/slide-NN.png.
 * Diff reports are written to .qa/reports/<timestamp>/.
 *
 * Usage:
 *   bun scripts/qa/baseline.ts init                           # all decks
 *   bun scripts/qa/baseline.ts init --deck xhs-pastel-card    # single deck
 *   bun scripts/qa/baseline.ts compare --deck xhs-pastel-card # regression
 */

import { chromium } from "playwright";
import * as fs from "node:fs";
import * as path from "node:path";
import { getAllDecks, isPortraitDeck, getViewport, ROOT } from "./utils.ts";
const BASELINE_DIR = path.join(ROOT, ".qa", "baselines");
const REPORT_DIR = path.join(ROOT, ".qa", "reports");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDeckHtmlPath(deckName: string): string {
  return path.join(ROOT, "templates", "full-decks", deckName, "index.html");
}

// ---------------------------------------------------------------------------
// Screenshot capture
// ---------------------------------------------------------------------------

async function captureDeck(deckName: string): Promise<string[]> {
  const htmlPath = getDeckHtmlPath(deckName);
  if (!fs.existsSync(htmlPath)) {
    throw new Error(`HTML not found: ${htmlPath}`);
  }

  const html = fs.readFileSync(htmlPath, "utf-8");
  const portrait = isPortraitDeck(html);
  const viewport = getViewport(portrait);

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
      slides.forEach((s) => s.classList.remove("is-active"));
      (slides[idx] as HTMLElement)?.classList.add("is-active");
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

// ---------------------------------------------------------------------------
// Regression compare
// ---------------------------------------------------------------------------

async function compareDeck(
  deckName: string,
): Promise<{ deck: string; diffs: { slide: number; diffPercent: number }[] }> {
  const htmlPath = getDeckHtmlPath(deckName);
  const baselineDir = path.join(BASELINE_DIR, deckName);

  if (!fs.existsSync(baselineDir)) {
    throw new Error(
      `No baseline for ${deckName}. Run: bun scripts/qa/baseline.ts init --deck ${deckName}`,
    );
  }

  const html = fs.readFileSync(htmlPath, "utf-8");
  const portrait = isPortraitDeck(html);
  const viewport = getViewport(portrait);

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
    const baselineFile = path.join(
      baselineDir,
      `slide-${String(i + 1).padStart(2, "0")}.png`,
    );
    if (!fs.existsSync(baselineFile)) {
      diffs.push({ slide: i + 1, diffPercent: 100 });
      continue;
    }

    await page.evaluate((idx) => {
      const slides = document.querySelectorAll(".deck > .slide");
      slides.forEach((s) => s.classList.remove("is-active"));
      (slides[idx] as HTMLElement)?.classList.add("is-active");
    }, i);
    await page.waitForTimeout(300);

    const currentScreenshot = await page.screenshot({ type: "png" });
    const currentImg = PNG.sync.read(currentScreenshot);
    const baselineImg = PNG.sync.read(fs.readFileSync(baselineFile));

    if (
      currentImg.width !== baselineImg.width ||
      currentImg.height !== baselineImg.height
    ) {
      diffs.push({ slide: i + 1, diffPercent: 100 });
      continue;
    }

    const { width, height } = currentImg;
    const diffImg = new PNG({ width, height });
    const diffPixels = pixelmatch(
      baselineImg.data,
      currentImg.data,
      diffImg.data,
      width,
      height,
      { threshold: 0.1 },
    );

    const diffPercent = (diffPixels / (width * height)) * 100;
    diffs.push({
      slide: i + 1,
      diffPercent: Math.round(diffPercent * 100) / 100,
    });

    if (diffPixels > 0) {
      fs.writeFileSync(
        path.join(
          diffDir,
          `slide-${String(i + 1).padStart(2, "0")}-diff.png`,
        ),
        PNG.sync.write(diffImg),
      );
    }
  }

  await browser.close();

  const report = {
    deck: deckName,
    timestamp: new Date().toISOString(),
    diffs,
  };
  fs.mkdirSync(path.join(REPORT_DIR, timestamp), { recursive: true });
  fs.writeFileSync(
    path.join(REPORT_DIR, timestamp, "report.json"),
    JSON.stringify(report, null, 2),
  );

  return { deck: deckName, diffs };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (cmd === "init" || cmd === "update") {
    const deckIdx = args.indexOf("--deck");

    if (deckIdx >= 0) {
      const deckName = args[deckIdx + 1];
      console.log(`Capturing baseline for: ${deckName}`);
      const files = await captureDeck(deckName);
      console.log(`  ${files.length} slides saved`);
    } else {
      // Init all decks
      const decks = getAllDecks();

      console.log(`Initializing baselines for ${decks.length} decks...`);
      for (const deck of decks) {
        console.log(`  Capturing: ${deck}`);
        try {
          const files = await captureDeck(deck);
          console.log(`    ${files.length} slides saved`);
        } catch (err: any) {
          console.log(`    FAILED: ${err.message}`);
        }
      }

      // Write manifest
      const commitProc = Bun.spawnSync(["git", "rev-parse", "HEAD"], {
        cwd: ROOT,
      });
      const commit = new TextDecoder()
        .decode(commitProc.stdout)
        .trim();

      const manifest: any = {
        commit,
        timestamp: new Date().toISOString(),
        decks: {},
      };
      for (const deck of decks) {
        const ddir = path.join(BASELINE_DIR, deck);
        try {
          const slides = fs
            .readdirSync(ddir)
            .filter((f) => f.endsWith(".png")).length;
          if (slides > 0) manifest.decks[deck] = { slides };
        } catch {
          // deck dir wasn't created (capture failed)
        }
      }

      fs.mkdirSync(BASELINE_DIR, { recursive: true });
      fs.writeFileSync(
        path.join(BASELINE_DIR, "manifest.json"),
        JSON.stringify(manifest, null, 2),
      );
      console.log(
        `Baseline initialized (${Object.keys(manifest.decks).length} decks).`,
      );
    }
  } else if (cmd === "compare") {
    const deckIdx = args.indexOf("--deck");
    if (deckIdx < 0) {
      console.error("--deck <name> required for compare");
      process.exit(1);
    }
    const deckName = args[deckIdx + 1];
    console.log(`Regression: ${deckName}`);
    try {
      const result = await compareDeck(deckName);
      for (const d of result.diffs) {
        const icon =
          d.diffPercent < 1 ? "PASS" : d.diffPercent < 5 ? "WARN" : "FAIL";
        console.log(`  ${icon} Slide ${d.slide}: ${d.diffPercent}% diff`);
      }
      const maxDiff = Math.max(...result.diffs.map((d) => d.diffPercent));
      if (maxDiff > 5) process.exit(1);
    } catch (err: any) {
      console.error(`  Error: ${err.message}`);
      process.exit(1);
    }
  } else {
    console.log(`Usage:
  bun scripts/qa/baseline.ts init [--deck <name>]     # Capture baselines
  bun scripts/qa/baseline.ts update [--deck <name>]   # Re-capture (alias for init)
  bun scripts/qa/baseline.ts compare --deck <name>    # Regression compare`);
    process.exit(1);
  }
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(`Fatal: ${err.message}`);
    process.exit(1);
  });
}
