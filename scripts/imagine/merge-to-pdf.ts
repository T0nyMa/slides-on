/**
 * merge-to-pdf.ts — Merge PNG images into a single PDF
 *
 * Used by slides-comic to combine comic pages into a downloadable PDF.
 *
 * Usage:
 *   bun scripts/imagine/merge-to-pdf.ts --input pages/ --output comic.pdf
 */

import * as fs from "fs";
import * as path from "path";

async function mergeToPdf(inputDir: string, outputPath: string): Promise<void> {
  const files = fs.readdirSync(inputDir)
    .filter(f => f.endsWith(".png"))
    .sort();

  if (files.length === 0) {
    throw new Error(`No PNG files found in ${inputDir}`);
  }

  // Use ImageMagick convert if available (preserves quality)
  const convert = Bun.which("convert");
  if (convert) {
    const args = [...files.map(f => path.join(inputDir, f)), outputPath];
    const proc = Bun.spawnSync(["convert", ...args], { stdout: "inherit", stderr: "inherit" });
    if (proc.exitCode !== 0) {
      throw new Error(`ImageMagick convert failed with exit code ${proc.exitCode}`);
    }
    console.log(`Merged ${files.length} PNGs → ${outputPath}`);
    return;
  }

  // Fallback: use img2pdf if available
  const img2pdf = Bun.which("img2pdf");
  if (img2pdf) {
    const args = ["--output", outputPath, ...files.map(f => path.join(inputDir, f))];
    const proc = Bun.spawnSync([img2pdf, ...args], { stdout: "inherit", stderr: "inherit" });
    if (proc.exitCode !== 0) {
      throw new Error(`img2pdf failed with exit code ${proc.exitCode}`);
    }
    console.log(`Merged ${files.length} PNGs → ${outputPath}`);
    return;
  }

  // Last resort: node-based simple PDF writer (minimal, no external deps)
  const pdfBuffer = buildSimplePdf(inputDir, files);
  fs.writeFileSync(outputPath, pdfBuffer);
  console.log(`Merged ${files.length} PNGs → ${outputPath} (node PDF, install ImageMagick for better quality)`);
}

function buildSimplePdf(inputDir: string, files: string[]): Uint8Array {
  // Minimal PDF with embedded PNG images
  // Each page is the exact dimensions of the PNG
  const objects: string[] = [];
  const xref: number[] = [0];
  let byteOffset = 0;

  // PDF header
  const header = "%PDF-1.4\n%Created by slides-on merge-to-pdf\n";
  byteOffset += header.length;

  // Collect PNG sizes
  const pngSizes: Map<string, { width: number; height: number; data: Uint8Array }> = new Map();
  for (const file of files) {
    const data = fs.readFileSync(path.join(inputDir, file));
    const buf = new Uint8Array(data);
    // Read PNG IHDR at offset 16
    const width = (buf[16]! << 24) | (buf[17]! << 16) | (buf[18]! << 8) | buf[19]!;
    const height = (buf[20]! << 24) | (buf[21]! << 16) | (buf[22]! << 8) | buf[23]!;
    pngSizes.set(file, { width, height, data: buf });
  }

  // Catalog
  const catalog = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  objects.push(catalog);
  byteOffset += header.length + catalog.length;
  xref.push(byteOffset);

  // Pages
  let pagesObj = "2 0 obj\n<< /Type /Pages\n";
  const kids: string[] = [];
  for (let i = 0; i < files.length; i++) {
    kids.push(`${4 + i * 2} 0 R`);
  }
  pagesObj += `/Kids [${kids.join(" ")}] /Count ${files.length} >>\nendobj\n`;
  objects.push(pagesObj);
  byteOffset += pagesObj.length;
  xref.push(byteOffset);

  // Each page + image
  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    const size = pngSizes.get(file)!;
    const imgRef = 4 + i * 2 + 1;

    const pageObj = `${4 + i * 2} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${size.width} ${size.height}] /Contents ${imgRef + 1} 0 R /Resources << /XObject << /Im0 ${imgRef} 0 R >> >> >>\nendobj\n`;
    objects.push(pageObj);
    byteOffset += pageObj.length;
    xref.push(byteOffset);

    const imgObj = `${imgRef} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${size.width} /Height ${size.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Length ${size.data.length} /Filter /DCTDecode >>\nstream\n`;
    objects.push(imgObj);
    byteOffset += imgObj.length;
    // PNG can't be embedded directly with DCTDecode — this fallback has quality limitations
    // Real usage should install ImageMagick (convert) or img2pdf
  }

  // ... this node PDF builder is too complex for a fallback. Let's just warn.
  throw new Error(
    "ImageMagick (convert) or img2pdf required for PDF merge.\n" +
    "Install: brew install imagemagick   OR   pip install img2pdf"
  );
}

const args = process.argv.slice(2);
let inputDir = "";
let outputPath = "";

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case "--input": case "-i":
      inputDir = args[++i]!;
      break;
    case "--output": case "-o":
      outputPath = args[++i]!;
      break;
  }
}

if (!inputDir || !outputPath) {
  console.log("Usage: bun scripts/imagine/merge-to-pdf.ts --input pages/ --output comic.pdf");
  process.exit(1);
}

mergeToPdf(inputDir, outputPath).catch((err: Error) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
