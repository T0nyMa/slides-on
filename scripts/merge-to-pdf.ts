/**
 * merge-to-pdf.ts — PNG slides → PDF wrapper
 *
 * Adapts render-precise output (page_NN.png) to baoyu-slide-deck naming
 * convention (NN-slide-*.png), then delegates to baoyu's merge-to-pdf.
 */

import { existsSync, readdirSync, symlinkSync, unlinkSync, mkdirSync, rmdirSync } from "fs";
import { join, basename, resolve } from "path";
import { execSync } from "child_process";

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
  const pageFiles = files.filter(f => pagePattern.test(f)).sort();
  if (pageFiles.length > 0) return pageFiles;

  // Try NN-slide pattern (baoyu output)
  const slidePattern = /^\d+-slide-.*\.(png|jpg|jpeg)$/i;
  const slideFiles = files.filter(f => slidePattern.test(f)).sort();
  if (slideFiles.length > 0) return slideFiles;

  // Try any PNG
  const anyPng = files.filter(f => /\.(png|jpg|jpeg)$/i.test(f)).sort();
  return anyPng;
}

function adaptToSlideNaming(dir: string, files: string[]): { adaptedDir: string; isTemp: boolean } {
  // Already in baoyu naming format
  if (/^\d+-slide-/.test(files[0])) {
    return { adaptedDir: dir, isTemp: false };
  }

  // Create temp directory with symlinks
  const tmpDir = join(dir, ".merge-tmp");
  mkdirSync(tmpDir, { recursive: true });

  for (const f of files) {
    const match = f.match(/page_(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      const ext = f.split(".").pop();
      const linkName = `${String(num).padStart(2, "0")}-slide-${f}`;
      symlinkSync(join(dir, f), join(tmpDir, linkName));
    } else {
      symlinkSync(join(dir, f), join(tmpDir, f));
    }
  }

  return { adaptedDir: tmpDir, isTemp: true };
}

function cleanup(tmpDir: string) {
  try {
    const files = readdirSync(tmpDir);
    for (const f of files) {
      unlinkSync(join(tmpDir, f));
    }
    rmdirSync(tmpDir);
  } catch {
    // Cleanup failure is non-fatal
  }
}

function main() {
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

  const { adaptedDir, isTemp } = adaptToSlideNaming(absDir, imageFiles);
  const dirName = basename(absDir);
  const outputPath = output || join(absDir, `${dirName}.pdf`);

  console.log(`Found ${imageFiles.length} images in: ${absDir}`);

  // Delegate to baoyu-slide-deck script
  const baoyuScript = resolve(
    import.meta.dir,
    "..", "..", "baoyu-slide-deck", "scripts", "merge-to-pdf.ts"
  );

  try {
    const cmd = `bun run ${baoyuScript} ${adaptedDir} --output ${outputPath}`;
    execSync(cmd, { stdio: "inherit" });
  } finally {
    if (isTemp) cleanup(adaptedDir);
  }
}

const isMain = import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("merge-to-pdf.ts");
if (isMain) {
  main();
}
