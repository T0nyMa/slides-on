/**
 * main.ts — AI image generation entry point (single image)
 *
 * Uses config.ts for provider registry, defaults, and common CLI parsing.
 * Structured prompt mode (--design): assembles 3-layer prompts via prompt-assembler.
 * Legacy mode (--prompt/--file): passes prompt directly to provider.
 *
 * Usage:
 *   bun scripts/imagine/main.ts --design sketch-notes --archetype "horizontal process" ...
 *   bun scripts/imagine/main.ts --prompt "a futuristic city skyline"
 *   bun scripts/imagine/main.ts --file slide-03-architecture.md
 *   bun scripts/imagine/main.ts --list-providers
 */

import * as path from "path";
import * as fs from "fs";
import type { ImagineOptions } from "./types";
import { assemblePrompt } from "./prompt-assembler";
import {
  PROVIDERS,
  getDefaultConfig,
  selectProvider,
  parseCommonCliArgs,
  resolveConfig,
  printProviders,
  printCommonHelp,
} from "./config";

// ─── CLI Parsing ───────────────────────────────────────────────────────

interface MainCliArgs {
  // Common (parsed by config.ts)
  provider?: string;
  model?: string;
  quality?: "normal" | "2k";
  aspect?: string;
  reference?: string;
  negative?: string;
  output?: string;
  style?: string;
  design?: string;
  archetype?: string;
  role?: "illustration" | "content-page";
  textSafe?: boolean;
  // Main-specific
  prompt?: string;
  file?: string;
  content?: string;
  title?: string;
  subtitle?: string;
  labels?: string;
  anchorRef?: string;
  listProviders?: boolean;
}

function parseArgs(args: string[]): MainCliArgs {
  const { opts: common, remaining } = parseCommonCliArgs(args);

  const cli: MainCliArgs = { ...common };
  for (let i = 0; i < remaining.length; i++) {
    switch (remaining[i]) {
      case "--prompt": case "-p":
        cli.prompt = remaining[++i]; break;
      case "--file": case "-f":
        cli.file = remaining[++i]; break;
      case "--content": case "-c":
        cli.content = remaining[++i]; break;
      case "--title":
        cli.title = remaining[++i]; break;
      case "--subtitle":
        cli.subtitle = remaining[++i]; break;
      case "--labels":
        cli.labels = remaining[++i]; break;
      case "--anchor-ref":
        cli.anchorRef = remaining[++i]; break;
    }
  }
  return cli;
}

function printUsage(): void {
  console.log(`Usage: bun scripts/imagine/main.ts [options]

Structured prompt mode (--design required):
  --design,  -d   Style definition name (sketch-notes, chalkboard, notion, etc.)
  --archetype      Composition archetype (10 types, e.g. "horizontal process")
  --role           Image role: "illustration" (default) or "content-page"
  --content, -c    Free-text scene / composition description
  --title          Title text (content-page role)
  --subtitle       Subtitle text (content-page role)
  --labels         Comma-separated label texts (content-page role)
  --text-safe      Leave blank label spaces, no text baked in

Legacy flat prompt mode:
  --prompt,    -p   Image generation prompt (required unless --file)
  --file,      -f   Read prompt from .md prompt file

External anchor reference:
  --anchor-ref      Path to external anchor reference image`);
  printCommonHelp();
}

// ─── Prompt Loading ──────────────────────────────────────────────────

function loadPrompt(cliArgs: MainCliArgs): string {
  if (cliArgs.prompt) return cliArgs.prompt.trim();

  if (cliArgs.file) {
    const filePath = path.resolve(cliArgs.file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Prompt file not found: ${filePath}`);
    }
    let content = fs.readFileSync(filePath, "utf-8");
    content = content
      .replace(/^#.*$/gm, "")
      .replace(/^##.*$/gm, "")
      .replace(/^###.*$/gm, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/[*_~`]+/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    return content || "";
  }

  throw new Error("Either --prompt, --file, or --design is required");
}

// ─── Main ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const cliArgs = parseArgs(process.argv.slice(2));

  if (cliArgs.listProviders) {
    printProviders();
    return;
  }

  if (cliArgs.help) {
    printUsage();
    return;
  }

  try {
    // Resolve config: env defaults → CLI overrides
    const defaults = getDefaultConfig();
    const config = resolveConfig(defaults, cliArgs);

    let prompt: string;
    let metadata: Record<string, string> = {};

    // ─── Structured prompt mode ───
    if (config.design) {
      const result = assemblePrompt({
        design: config.design,
        archetype: cliArgs.archetype,
        role: config.role || "illustration",
        aspect: config.aspect || "16:9",
        content: cliArgs.content,
        title: cliArgs.title,
        subtitle: cliArgs.subtitle,
        labels: cliArgs.labels ? cliArgs.labels.split(",").map(s => s.trim()) : undefined,
        textSafe: config.textSafe,
        quality: config.quality || "normal",
      });

      prompt = result.fullPrompt;
      if (result.negativePrompt && !config.negative) {
        config.negative = result.negativePrompt;
      }
      metadata = result.metadata;

      console.log(`Design: ${metadata.design} | Archetype: ${metadata.archetype} | Role: ${metadata.role}`);
    } else {
      prompt = loadPrompt(cliArgs);
    }

    const providerName = selectProvider(config.provider);
    const providerInfo = PROVIDERS[providerName]!;

    console.log(`Prompt: ${prompt.slice(0, 80)}${prompt.length > 80 ? "..." : ""}`);
    console.log(`Provider: ${providerName}${config.model ? ` | Model: ${config.model}` : ""}`);

    const provider = await import(providerInfo.module);
    const outputPath = config.output || `imagine_${providerName}_${Date.now()}.png`;

    // Anchor reference: append text anchor clause if provider doesn't support native refs
    if (cliArgs.anchorRef) {
      if (!providerInfo.supportsReference) {
        prompt += `\n\nMatch the visual style, line weight, color palette, paper tone, title treatment, and diagram density of the reference image exactly. Same illustrator, same paper, same pen, same hand.`;
      }
    }

    const options: ImagineOptions = {
      prompt,
      provider: providerName,
      model: config.model,
      quality: config.quality || "normal",
      aspect: config.aspect,
      reference: config.reference || cliArgs.anchorRef,
      negative: config.negative,
      output: outputPath,
      style: config.style,
    };

    // Write assembled prompt to .prompt.txt for reproducibility
    if (config.design && config.output) {
      const promptFile = config.output.replace(/\.png$/i, ".prompt.txt");
      const header = [
        `# AI Image Generation Prompt`,
        `# Design: ${metadata.design || "N/A"}`,
        `# Archetype: ${metadata.archetype || "N/A"}`,
        `# Role: ${metadata.role || "N/A"}`,
        `# Provider: ${providerName}${config.model ? ` (${config.model})` : ""}`,
        `# Aspect: ${config.aspect || "16:9"}`,
        `# Generated: ${new Date().toISOString()}`,
        ``,
        `## Full Prompt`,
        prompt,
      ];
      if (config.negative) {
        header.push(``, `## Negative Prompt`, config.negative);
      }
      fs.writeFileSync(promptFile, header.join("\n"));
      console.log(`Prompt file: ${promptFile}`);
    }

    const result = await provider.generate(prompt, options);

    if (result.success) {
      console.log(`Success! Output: ${result.path}`);
      console.log(`Duration: ${result.duration}ms`);
      if (result.url) console.log(`URL: ${result.url}`);
    } else {
      console.error(`Generation failed: ${result.error}`);
      process.exit(1);
    }
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

const isMain =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("/main.ts");

if (isMain) {
  main();
}
