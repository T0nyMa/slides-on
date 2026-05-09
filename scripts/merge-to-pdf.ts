/**
 * merge-to-pdf.ts — PNG slides → PDF
 *
 * Reads render-precise output (page_NN.png) and combines them into a
 * single PDF. Each PNG becomes one page, sized to match the image.
 *
 * Usage:
 *   bun scripts/merge-to-pdf.ts <png-dir> [--output filename.pdf]
 */

import { existsSync, readdirSync } from "fs";
import { join, basename, resolve } from "path";
import { PDFDocument } from "pdf-lib";
import * as fs from "fs";

function parseArgs(): { dir: string; output?: string } {
  const args = process.argv.slice(2);
  let dir = "";
  let output: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--output" || args[i] === "-o") {
      output = args[++i];
    } else if (!args[i].startsWith("-")) {
      dir = args[i];
    }
  }

  if (!dir) {
    console.error("Usage: bun merge-to-pdf.ts <png-dir> [--output filename.pdf]");
    process.exit(1);
  }

  return { dir, output };
}

function findImages(dir: string): string[] {
  const files = readdirSync(dir);

  // Try page_NN pattern (render-precise output)
  const pagePattern = /^page_\d+\.(png|jpg|jpeg)$/i;
  const pageFiles = files.filter((f) => pagePattern.test(f)).sort();
  if (pageFiles.length > 0) return pageFiles;

  // Try any PNG/JPEG
  const anyImg = files
    .filter((f) => /\.(png|jpg|jpeg)$/i.test(f))
    .sort();
  return anyImg;
}

async function main() {
  const { dir, output } = parseArgs();
  const absDir = resolve(dir);

  if (!existsSync(absDir)) {
    console.error(`Directory not found: ${absDir}`);
    process.exit(1);
  }

  const imageFiles = findImages(absDir);
  if (imageFiles.length === 0) {
    console.error(`No images found in: ${absDir}`);
    process.exit(1);
  }

  const dirName = basename(absDir);
  const outputPath = resolve(output || join(absDir, `${dirName}.pdf`));

  console.log(`Found ${imageFiles.length} images in: ${absDir}`);

  const pdfDoc = await PDFDocument.create();

  for (const file of imageFiles) {
    const imgPath = join(absDir, file);
    const imgBytes = fs.readFileSync(imgPath);

    let image;
    if (file.endsWith(".png")) {
      image = await pdfDoc.embedPng(imgBytes);
    } else {
      image = await pdfDoc.embedJpg(imgBytes);
    }

    // Use image's intrinsic dimensions, scale to fit within a reasonable page size
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);

  const sizeKB = Math.round(pdfBytes.length / 1024);
  console.log(`Done: ${outputPath} (${sizeKB} KB, ${imageFiles.length} pages)`);
}

const isMain =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("merge-to-pdf.ts");
if (isMain) {
  main().catch((err) => {
    console.error("Fatal:", err.message);
    process.exit(1);
  });
}
