/**
 * assemble-deck.ts — Slide deck assembly from structured data
 *
 * Reads slides.json (or --stdin) and produces a complete index.html.
 * Claude handles content analysis (Step 1) + style decisions (Step 2),
 * then writes slides.json. This script handles Step 3: HTML assembly.
 *
 * Usage:
 *   bun scripts/assemble-deck.ts --input slides.json
 *   bun scripts/assemble-deck.ts --input slides.json --output dist/index.html
 *   cat slides.json | bun scripts/assemble-deck.ts --stdin > index.html
 */

import * as fs from "fs";
import * as path from "path";
import type { DeckConfig, SlideData, DesignConfig } from "./assemble/types";
import { getDesignTemplate } from "./assemble/designs";
import { renderSlide } from "./assemble/slides";
import { renderDeck } from "./assemble/skeleton";

// ─── CLI ──────────────────────────────────────────────────────────────

interface CliArgs {
  input?: string;
  stdin?: boolean;
  output?: string;
}

function parseArgs(args: string[]): CliArgs {
  const opts: CliArgs = {};
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--input": case "-i":
        opts.input = args[++i]; break;
      case "--stdin":
        opts.stdin = true; break;
      case "--output": case "-o":
        opts.output = args[++i]; break;
      case "--help": case "-h":
        console.log(`Usage: bun scripts/assemble-deck.ts --input slides.json [--output index.html]
       cat slides.json | bun scripts/assemble-deck.ts --stdin > index.html

Input format (slides.json):
  {
    "config": {
      "title": "My Deck",
      "design": "pastel-card",
      "canvas": "3:4",
      "author": "Author Name"
    },
    "slides": [
      {
        "type": "cover",
        "title": "My Title",
        "subtitle": "Subtitle text",
        "kicker": "Label",
        "chip": "Tag text",
        "chipColor": "mint",
        "blobs": ["b1", "b2", "b3"]
      },
      ...
    ]
  }

Slide types: cover | section | cards-2x2 | cards-3 | quote | steps | code | thanks | bullets | kpi | html
Designs: pastel-card | white-editorial | xhs-post
Canvas: 3:4 | 16:9
`);
        process.exit(0);
    }
  }
  return opts;
}

// ─── Input ────────────────────────────────────────────────────────────

interface DeckInput {
  config: DeckConfig;
  slides: SlideData[];
}

function readInput(cli: CliArgs): DeckInput {
  let raw: string;

  if (cli.stdin) {
    raw = fs.readFileSync("/dev/stdin", "utf-8");
  } else if (cli.input) {
    const inputPath = path.resolve(cli.input);
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }
    raw = fs.readFileSync(inputPath, "utf-8");
  } else {
    throw new Error("Either --input <file> or --stdin is required");
  }

  const data = JSON.parse(raw);

  if (!data.config || !data.slides) {
    throw new Error("Input must have { config: {...}, slides: [...] }");
  }

  return data as DeckInput;
}

// ─── Main ────────────────────────────────────────────────────────────

function main(): void {
  const cli = parseArgs(process.argv.slice(2));

  try {
    const input = readInput(cli);
    const { config, slides } = input;

    // Validate
    if (!slides.length) throw new Error("No slides in input");

    const designName = typeof config.design === "string" ? config.design : (config.design as DesignConfig).design || "base";
    const design = getDesignTemplate(designName);
    const total = slides.length;

    // Render each slide
    const slidesHTML = slides.map((s, i) => {
      return renderSlide(design, s, { page: i + 1, total });
    });

    // Wrap in deck skeleton (inline style.css if exists in output dir)
    let stylePath: string | undefined;
    if (cli.output) {
      const outDir = path.dirname(path.resolve(cli.output));
      const candidate = path.join(outDir, "style.css");
      if (fs.existsSync(candidate)) stylePath = candidate;
    }
    const html = renderDeck(config, slidesHTML, stylePath);

    // Output
    if (cli.output) {
      const outPath = path.resolve(cli.output);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, html);
      const designLabel = typeof config.design === "string" ? config.design : JSON.stringify(config.design);
      console.log(`Written: ${outPath} (${slides.length} slides, design: ${designLabel}, canvas: ${config.canvas})`);
      console.log(`💡 直接打开 ${outPath}  →  按 E 可视化编辑（无需 server）`);

      // Run visual QA if available
      try {
        const scriptDir = path.dirname(path.resolve(__filename));
        const qaScript = path.join(scriptDir, "visual-qa.ts");
        if (fs.existsSync(qaScript)) {
          const proc = Bun.spawnSync(["bun", qaScript, "--input", outPath, "--check-only"]);
          if (proc.success) {
            console.log(`QA passed`);
          } else {
            const stderr = new TextDecoder().decode(proc.stderr).trim();
            if (stderr) console.log(`QA: ${stderr.split("\n").slice(0, 3).join("; ")}`);
          }
        }
      } catch {
        // visual-qa is optional — silently skip if unavailable
      }
    } else {
      console.log(html);
    }
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
