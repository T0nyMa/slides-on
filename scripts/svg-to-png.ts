/**
 * svg-to-png.ts — SVG to @2x PNG converter
 *
 * Uses sharp to render SVG files to high-resolution PNG output.
 * Supports both file and stdin input, configurable scale factor,
 * and explicit width/height overrides.
 *
 * Usage:
 *   bun scripts/svg-to-png.ts input.svg
 *   bun scripts/svg-to-png.ts input.svg --output out.png --scale 2
 *   bun scripts/svg-to-png.ts input.svg --width 1920 --height 1080
 *   cat input.svg | bun scripts/svg-to-png.ts -
 */

import sharp from "sharp";
import * as path from "path";
import * as fs from "fs";

// ─── Types ───────────────────────────────────────────────────────────

interface CliOptions {
  input: string;
  output: string | null;
  scale: number;
  width: number | null;
  height: number | null;
}

// ─── Argument parsing ────────────────────────────────────────────────

function parseArgs(args: string[]): CliOptions {
  const opts: CliOptions = {
    input: "",
    output: null,
    scale: 2,
    width: null,
    height: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--output":
      case "-o":
        opts.output = args[++i];
        break;
      case "--scale":
      case "-s":
        opts.scale = parseFloat(args[++i]);
        if (isNaN(opts.scale) || opts.scale <= 0) {
          console.error("Error: --scale must be a positive number");
          process.exit(1);
        }
        break;
      case "--width":
      case "-w":
        opts.width = parseInt(args[++i], 10);
        if (isNaN(opts.width!) || opts.width! <= 0) {
          console.error("Error: --width must be a positive integer");
          process.exit(1);
        }
        break;
      case "--height":
      case "-h":
        opts.height = parseInt(args[++i], 10);
        if (isNaN(opts.height!) || opts.height! <= 0) {
          console.error("Error: --height must be a positive integer");
          process.exit(1);
        }
        break;
      default:
        if (!arg.startsWith("-") && !opts.input) {
          opts.input = arg;
        }
    }
  }

  if (!opts.input) {
    printUsage();
    process.exit(1);
  }

  return opts;
}

function printUsage(): void {
  console.log(`Usage: bun scripts/svg-to-png.ts <input.svg> [options]
       bun scripts/svg-to-png.ts -      (stdin mode)

Options:
  --output, -o   Output PNG path (default: input-stem.png)
  --scale,  -s   Scale factor for @Nx output (default: 2)
  --width,  -w   Explicit output width (overrides --scale)
  --height, -h   Explicit output height (overrides --scale)
`);
}

// ─── Path helpers ────────────────────────────────────────────────────

function getStem(filePath: string): string {
  return path.basename(filePath, path.extname(filePath));
}

function resolveOutput(input: string, output: string | null): string {
  if (output) return output;
  if (input === "-") return "output.png";
  const stem = getStem(input);
  const dir = path.dirname(input);
  return path.join(dir, `${stem}.png`);
}

// ─── SVG content loading ─────────────────────────────────────────────

async function loadSvgContent(input: string): Promise<Buffer> {
  if (input === "-") {
    // Read from stdin
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  const resolvedPath = path.resolve(input);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found: ${resolvedPath}`);
  }
  return fs.readFileSync(resolvedPath);
}

// ─── Density extraction (from SVG width/height attributes) ───────────

function extractSvgDimensions(svgBuffer: Buffer): { width: number; height: number } | null {
  const svgStr = svgBuffer.toString("utf-8");
  // Match viewBox for aspect ratio
  const viewBoxMatch = svgStr.match(/viewBox=["']([^"']+)["']/);
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].split(/\s+/);
    if (parts.length === 4) {
      return { width: parseFloat(parts[2]), height: parseFloat(parts[3]) };
    }
  }
  // Fallback: match width/height attributes
  const widthMatch = svgStr.match(/<svg[^>]*\swidth=["'](\d+(?:\.\d+)?)/);
  const heightMatch = svgStr.match(/<svg[^>]*\sheight=["'](\d+(?:\.\d+)?)/);
  if (widthMatch && heightMatch) {
    return { width: parseFloat(widthMatch[1]), height: parseFloat(heightMatch[1]) };
  }
  return null;
}

// ─── Main ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));

  try {
    // Load SVG
    const svgBuffer = await loadSvgContent(opts.input);
    if (svgBuffer.length === 0) {
      throw new Error("Empty SVG input");
    }

    // Prepare sharp pipeline
    let pipeline = sharp(svgBuffer);

    // Determine dimensions
    if (opts.width || opts.height) {
      // Explicit dimensions provided
      const w = opts.width;
      const h = opts.height;
      if (w && h) {
        pipeline = pipeline.resize(w, h, { fit: "fill" });
      } else if (w) {
        pipeline = pipeline.resize(w, undefined, { fit: "inside" });
      } else if (h) {
        pipeline = pipeline.resize(undefined, h, { fit: "inside" });
      }
    } else if (opts.scale !== 1) {
      // Scale factor mode: multiply density
      const density = Math.round(72 * opts.scale);
      pipeline = sharp(svgBuffer, { density });
    }

    // Output
    const outputPath = resolveOutput(opts.input, opts.output);
    const result = await pipeline.png().toFile(outputPath);

    // Report
    const sizeKB = (result.size / 1024).toFixed(1);
    const dims = extractSvgDimensions(svgBuffer);
    const dimLabel = dims
      ? `${Math.round(dims.width * opts.scale)}×${Math.round(dims.height * opts.scale)}`
      : `${result.width}×${result.height}`;

    console.log(`${outputPath}  (${dimLabel}, ${sizeKB} KB)`);
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

const isMain =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("svg-to-png.ts");

if (isMain) {
  main();
}
