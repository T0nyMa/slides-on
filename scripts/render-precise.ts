/**
 * render-precise.ts v2 — HTML page elements → PNG/JPEG renderer
 *
 * Simplified: loads HTML once, finds all elements matching --selector,
 * screenshots each directly. No slide navigation, no navMode detection,
 * no editor UI hiding.
 *
 * Usage:
 *   bun scripts/render-precise.ts deck.html
 *   bun scripts/render-precise.ts card.html --canvas 3:4 --selector .slide
 */

import { chromium } from "playwright";
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
    console.log(`Selector: ${opts.selector}`);
    console.log(`Format:   ${opts.format.toUpperCase()}`);
    console.log();
  }

  const result = await renderElements(htmlPath, outDir, canvas, opts);

  console.log(`\nDone. ${result.count} elements → ${outDir}/`);
  if (result.errors.length > 0) {
    console.log(`Warnings: ${result.errors.length} element(s) had issues:`);
    for (const e of result.errors) console.log(`  - ${e}`);
  }
}

// ─── Core rendering ──────────────────────────────────────────────────

interface RenderResult {
  count: number;
  errors: string[];
}

async function renderElements(
  htmlPath: string,
  outDir: string,
  canvas: { width: number; height: number },
  opts: RenderOptions
): Promise<RenderResult> {
  fs.mkdirSync(outDir, { recursive: true });

  const fileUrl = `file://${htmlPath}`;
  const errors: string[] = [];
  const ext = opts.format === "jpeg" ? "jpg" : "png";

  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    viewport: { width: canvas.width, height: canvas.height },
    deviceScaleFactor: opts.dsf,
  });
  const page = await context.newPage();

  await page.goto(fileUrl, { waitUntil: "networkidle", timeout: 30000 });

  // Wait for fonts
  await page.evaluate(() => document.fonts.ready).catch(() => {});

  // Short breather for any remaining layout
  await page.waitForTimeout(300);

  // Find all target elements
  const handles = await page.$$(opts.selector);
  if (handles.length === 0) {
    console.error(`No elements found matching selector "${opts.selector}"`);
    await context.close();
    await browser.close();
    return { count: 0, errors: ["No matching elements"] };
  }

  if (opts.verbose) console.log(`Found ${handles.length} element(s) matching "${opts.selector}"`);

  for (let i = 0; i < handles.length; i++) {
    const outFile = path.join(outDir, `page_${String(i + 1).padStart(2, "0")}.${ext}`);

    try {
      await handles[i].screenshot({
        path: outFile,
        type: opts.format,
        quality: opts.format === "jpeg" ? opts.quality : undefined,
      });

      const sizeKB = Math.round(fs.statSync(outFile).size / 1024);
      const box = await handles[i].boundingBox();
      const w = box ? Math.round(box.width * opts.dsf) : "?";
      const h = box ? Math.round(box.height * opts.dsf) : "?";

      console.log(`  [${i + 1}/${handles.length}] page_${String(i + 1).padStart(2, "0")}.${ext}  (${w}×${h}, ${sizeKB} KB)`);
    } catch (err: any) {
      const msg = `Element ${i + 1}: ${err?.message ?? String(err)}`;
      errors.push(msg);
      console.error(`  [${i + 1}/${handles.length}] FAILED — ${err.message}`);
    }
  }

  await context.close();
  await browser.close();

  return { count: handles.length, errors };
}

// ─── Run ─────────────────────────────────────────────────────────────

const isMain = import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("render-precise.ts");
if (isMain) {
  main().catch((err) => {
    console.error("Fatal:", err.message);
    process.exit(1);
  });
}

export { renderElements };
export type { RenderOptions, RenderResult };
