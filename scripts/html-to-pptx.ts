/**
 * html-to-pptx.ts — HTML slide deck → editable PPTX via dom-to-pptx
 *
 * Opens the deck in Playwright, injects dom-to-pptx, and exports
 * native editable PowerPoint shapes/text (not screenshots).
 *
 * Usage:
 *   bun scripts/html-to-pptx.ts deck.html
 *   bun scripts/html-to-pptx.ts deck.html --output out.pptx
 */

import { chromium } from "playwright";
import * as path from "path";
import * as fs from "fs";

function parseArgs() {
  const args = process.argv.slice(2);
  let input = "", output = "";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--output" || args[i] === "-o") output = args[++i];
    else if (!args[i].startsWith("-")) input = args[i];
  }
  if (!input) {
    console.log("Usage: bun scripts/html-to-pptx.ts <html-file> [--output file.pptx]");
    process.exit(1);
  }
  return { input, output };
}

async function main() {
  const { input, output } = parseArgs();
  const htmlPath = path.resolve(input);
  if (!fs.existsSync(htmlPath)) {
    console.error(`File not found: ${htmlPath}`);
    process.exit(1);
  }

  const outPath = path.resolve(
    output || path.join(
      path.dirname(htmlPath),
      `${path.basename(htmlPath, path.extname(htmlPath))}.pptx`
    )
  );

  const bundlePath = path.resolve(
    import.meta.dir,
    "..",
    "node_modules",
    "dom-to-pptx",
    "dist",
    "dom-to-pptx.bundle.js"
  );
  if (!fs.existsSync(bundlePath)) {
    console.error("dom-to-pptx bundle not found. Run: bun add dom-to-pptx");
    process.exit(1);
  }

  console.log(`Input:  ${htmlPath}`);
  console.log(`Output: ${outPath}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });

  await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle", timeout: 30000 });

  // Ensure Google Fonts links have crossorigin for font embedding
  await page.evaluate(() => {
    document.querySelectorAll('link[href*="fonts.googleapis.com"]').forEach((link) => {
      if (!link.getAttribute("crossorigin")) {
        link.setAttribute("crossorigin", "anonymous");
      }
    });
  });

  // Wait for fonts
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  console.log("Fonts loaded.");

  // Detect deck dimensions
  const dims = await page.evaluate(() => {
    const deck = document.querySelector(".deck");
    if (!deck) return null;
    const rect = (deck as HTMLElement).getBoundingClientRect();
    return { width: Math.round(rect.width), height: Math.round(rect.height) };
  });

  if (!dims || dims.width === 0 || dims.height === 0) {
    console.error("No .deck element found or zero dimensions.");
    await browser.close();
    process.exit(1);
  }

  const slideCount = await page.evaluate(() => {
    const deck = document.querySelector(".deck");
    return deck ? deck.querySelectorAll(":scope > .slide, :scope > section.slide").length : 0;
  });

  console.log(`Deck: ${dims.width}×${dims.height}, ${slideCount} slides`);

  // Inject dom-to-pptx bundle
  await page.addScriptTag({ path: bundlePath });
  const hasLib = await page.evaluate(() => typeof (window as any).domToPptx !== "undefined");
  if (!hasLib) {
    console.error("Failed to inject dom-to-pptx bundle.");
    await browser.close();
    process.exit(1);
  }
  console.log("dom-to-pptx injected.");

  // Export
  console.log("Exporting...");
  const pptxBase64 = await page.evaluate(
    async ({ width, height }) => {
      // Make all slides visible for measurement
      const slides = document.querySelectorAll(".deck > .slide, .deck > section.slide");
      slides.forEach((s: any) => {
        s.style.opacity = "1";
        s.style.transform = "none";
        s.style.pointerEvents = "auto";
        s.style.transition = "none";
      });

      // Let styles settle
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => setTimeout(r, 200));

      // Calculate PPTX dimensions in inches
      const aspect = width / height;
      let wIn: number, hIn: number;
      if (aspect < 1) {
        hIn = 10;
        wIn = +(hIn * aspect).toFixed(3);
      } else {
        wIn = 10;
        hIn = +(wIn / aspect).toFixed(3);
      }

      const blob: Blob = await (window as any).domToPptx.exportToPptx(
        Array.from(slides),
        {
          skipDownload: true,
          autoEmbedFonts: true,
          width: wIn,
          height: hIn,
        }
      );

      // Blob → base64
      const buf = await blob.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let bin = "";
      const chunk = 8192;
      for (let i = 0; i < bytes.length; i += chunk) {
        bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
      }
      return btoa(bin);
    },
    { width: dims.width, height: dims.height }
  );

  // Save
  const buffer = Buffer.from(pptxBase64, "base64");
  fs.writeFileSync(outPath, buffer);

  const sizeKB = Math.round(buffer.length / 1024);
  console.log(`\nDone: ${outPath} (${sizeKB} KB, ${slideCount} slides)`);

  await browser.close();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
