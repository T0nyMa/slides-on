/**
 * main.ts — AI image generation entry point
 *
 * Reads prompt from --prompt or --file, routes to the appropriate provider,
 * and saves the generated image to the output path.
 *
 * Structured prompt mode (new):
 *   bun scripts/imagine/main.ts --design sketch-notes --archetype "horizontal process" ...
 *
 * Legacy flat prompt mode:
 *   bun scripts/imagine/main.ts --prompt "a futuristic city skyline"
 *   bun scripts/imagine/main.ts --file slide-03-architecture.md
 *
 * Usage:
 *   bun scripts/imagine/main.ts --prompt "a futuristic city skyline"
 *   bun scripts/imagine/main.ts --file slide-03-architecture.md
 *   bun scripts/imagine/main.ts --design sketch-notes --archetype "horizontal process" --aspect 3:4 ...
 *   bun scripts/imagine/main.ts --list-providers
 */

import * as path from "path";
import * as fs from "fs";
import type { ImagineOptions } from "./types";
import { assemblePrompt } from "./prompt-assembler";

// ─── CLI Parsing ─────────────────────────────────────────────────────

interface CliArgs {
  prompt?: string;
  file?: string;
  provider?: string;
  model?: string;
  quality?: "normal" | "2k";
  aspect?: string;
  reference?: string;
  negative?: string;
  output?: string;
  style?: string;
  // Structured prompt mode
  design?: string;
  archetype?: string;
  role?: "illustration" | "content-page";
  content?: string;
  title?: string;
  subtitle?: string;
  labels?: string;
  textSafe: boolean;
  anchorRef?: string;
  listProviders: boolean;
}

function parseArgs(args: string[]): CliArgs {
  const opts: CliArgs = { listProviders: false, textSafe: false };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--prompt":
      case "-p":
        opts.prompt = args[++i];
        break;
      case "--file":
      case "-f":
        opts.file = args[++i];
        break;
      case "--provider":
        opts.provider = args[++i];
        break;
      case "--model":
      case "-m":
        opts.model = args[++i];
        break;
      case "--quality":
      case "-q": {
        const v = args[++i];
        opts.quality = v === "2k" ? "2k" : "normal";
        break;
      }
      case "--aspect":
      case "-a":
        opts.aspect = args[++i];
        break;
      case "--reference":
      case "-r":
        opts.reference = args[++i];
        break;
      case "--negative":
      case "-n":
        opts.negative = args[++i];
        break;
      case "--output":
      case "-o":
        opts.output = args[++i];
        break;
      case "--style":
      case "-s":
        opts.style = args[++i];
        break;
      // Structured prompt mode
      case "--design":
      case "-d":
        opts.design = args[++i];
        break;
      case "--archetype":
        opts.archetype = args[++i];
        break;
      case "--role":
        opts.role = args[++i] as "illustration" | "content-page";
        break;
      case "--content":
      case "-c":
        opts.content = args[++i];
        break;
      case "--title":
        opts.title = args[++i];
        break;
      case "--subtitle":
        opts.subtitle = args[++i];
        break;
      case "--labels":
        opts.labels = args[++i];
        break;
      case "--text-safe":
        opts.textSafe = true;
        break;
      case "--anchor-ref":
        opts.anchorRef = args[++i];
        break;
      case "--list-providers":
        opts.listProviders = true;
        break;
      case "--help":
      case "-h":
        printUsage();
        process.exit(0);
    }
  }
  return opts;
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
  --text-safe      Leave blank label spaces, no text baked in (text fidelity fallback)

Legacy flat prompt mode:
  --prompt,    -p   Image generation prompt (required unless --file)
  --file,      -f   Read prompt from .md prompt file

Common options:
  --provider        Provider name (dashscope, minimax, openai, replicate, etc.)
  --model,     -m   Model name (e.g. qwen-image-2.0-pro-2026-04-22)
  --quality,   -q   Image quality: "normal" or "2k" (default: normal)
  --aspect,    -a   Aspect ratio: "16:9", "1:1", "9:16", "4:3", "3:4"
  --reference, -r   Path to reference image (provider-dependent)
  --negative,  -n   Negative prompt
  --output,    -o   Output file path (default: auto-generated)
  --style,     -s   Preset style name
  --anchor-ref      Path to external anchor reference image
  --list-providers  List all available providers
  --help,      -h   Show this help
`);
}

// ─── Provider Registry ───────────────────────────────────────────────

const PROVIDER_MAP: Record<string, string> = {
  azure: "./providers/azure",
  dashscope: "./providers/dashscope",
  google: "./providers/google",
  jimeng: "./providers/jimeng",
  minimax: "./providers/minimax",
  openai: "./providers/openai",
  openrouter: "./providers/openrouter",
  replicate: "./providers/replicate",
  seedream: "./providers/seedream",
  zai: "./providers/zai",
};

const PROVIDER_DESCRIPTIONS: Record<string, string> = {
  azure: "Azure OpenAI DALL-E — Microsoft-hosted DALL-E models",
  dashscope: "DashScope / Tongyi Wanxiang (通义万象) — Alibaba Cloud",
  google: "Google Imagen — Vertex AI image generation",
  jimeng: "Jimeng (即梦) — ByteDance image generation",
  minimax: "MiniMax (海螺AI) — Chinese AI image generation",
  openai: "OpenAI DALL-E / GPT Image — OpenAI image generation",
  openrouter: "OpenRouter — Multi-model API gateway",
  replicate: "Replicate — FLUX, SDXL, and community models",
  seedream: "Seedream (豆包) — ByteDance Seedream via Ark",
  zai: "Z.AI / Zhipu (智谱) — CogView image generation",
};

const DEFAULT_ORDER_PLAIN: string[] = [
  "dashscope", "openai", "minimax", "replicate",
  "zai", "openrouter", "azure", "google", "jimeng", "seedream",
];

const DEFAULT_ORDER_REFERENCE: string[] = ["google", "openai", "azure"];

// ─── Prompt Loading ──────────────────────────────────────────────────

function loadPrompt(cliArgs: CliArgs): string {
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

// ─── Provider Selection ──────────────────────────────────────────────

async function selectProvider(cliArgs: CliArgs): Promise<string> {
  if (cliArgs.provider) {
    if (!PROVIDER_MAP[cliArgs.provider]) {
      throw new Error(
        `Unknown provider: ${cliArgs.provider}. Use --list-providers to see available options.`
      );
    }
    return cliArgs.provider;
  }

  const order = cliArgs.reference ? DEFAULT_ORDER_REFERENCE : DEFAULT_ORDER_PLAIN;

  for (const name of order) {
    const envKey = getProviderEnvKey(name);
    if (process.env[envKey]) {
      console.log(`Auto-selected provider: ${name} (${envKey} found)`);
      return name;
    }
  }

  throw new Error(
    "No provider API key found. Set one of:\n" +
      "  DASHSCOPE_API_KEY, OPENAI_API_KEY, MINIMAX_API_KEY, REPLICATE_API_TOKEN, " +
      "ZHIPU_API_KEY, OPENROUTER_API_KEY, AZURE_OPENAI_API_KEY, GOOGLE_API_KEY, " +
      "JIMENG_API_KEY, SEEDREAM_API_KEY\n" +
      "Or specify a provider explicitly with --provider."
  );
}

function getProviderEnvKey(provider: string): string {
  const map: Record<string, string> = {
    azure: "AZURE_OPENAI_API_KEY",
    dashscope: "DASHSCOPE_API_KEY",
    google: "GOOGLE_API_KEY",
    jimeng: "JIMENG_API_KEY",
    minimax: "MINIMAX_API_KEY",
    openai: "OPENAI_API_KEY",
    openrouter: "OPENROUTER_API_KEY",
    replicate: "REPLICATE_API_TOKEN",
    seedream: "SEEDREAM_API_KEY",
    zai: "ZHIPU_API_KEY",
  };
  return map[provider] || "";
}

// ─── Main ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const cliArgs = parseArgs(process.argv.slice(2));

  if (cliArgs.listProviders) {
    console.log("Available AI image providers:\n");
    for (const [name, desc] of Object.entries(PROVIDER_DESCRIPTIONS)) {
      const envKey = getProviderEnvKey(name);
      const status = process.env[envKey] ? "[key set]" : "[no key]";
      console.log(`  ${name.padEnd(12)} ${desc}  ${status}`);
    }
    return;
  }

  try {
    let prompt: string;
    let metadata: Record<string, string> = {};

    // ─── Structured prompt mode ───
    if (cliArgs.design) {
      const result = assemblePrompt({
        design: cliArgs.design,
        archetype: cliArgs.archetype,
        role: cliArgs.role || "illustration",
        aspect: cliArgs.aspect || "16:9",
        content: cliArgs.content,
        title: cliArgs.title,
        subtitle: cliArgs.subtitle,
        labels: cliArgs.labels ? cliArgs.labels.split(",").map(s => s.trim()) : undefined,
        textSafe: cliArgs.textSafe,
        quality: cliArgs.quality || "normal",
      });

      prompt = result.fullPrompt;
      if (result.negativePrompt && !cliArgs.negative) {
        cliArgs.negative = result.negativePrompt;
      }
      metadata = result.metadata;

      console.log(`Design: ${metadata.design} | Archetype: ${metadata.archetype} | Role: ${metadata.role}`);
    } else {
      // Legacy mode
      prompt = loadPrompt(cliArgs);
    }

    const providerName = await selectProvider(cliArgs);

    console.log(`Prompt: ${prompt.slice(0, 80)}${prompt.length > 80 ? "..." : ""}`);
    console.log(`Provider: ${providerName}`);

    const modulePath = PROVIDER_MAP[providerName];
    const provider = await import(modulePath);

    const output = cliArgs.output || `imagine_${providerName}_${Date.now()}.png`;

    // If --anchor-ref is provided and provider doesn't support native refs,
    // append a text anchor clause to the prompt
    if (cliArgs.anchorRef) {
      if (!["seedream", "replicate", "google"].includes(providerName)) {
        prompt += `\n\nMatch the visual style, line weight, color palette, paper tone, title treatment, corner marks, and diagram density of the reference image exactly. This must look like the same illustrator drew all pages. Same paper, same pen, same hand.`;
      }
    }

    const options: ImagineOptions = {
      prompt,
      provider: providerName,
      model: cliArgs.model,
      quality: cliArgs.quality || "normal",
      aspect: cliArgs.aspect,
      reference: cliArgs.reference || cliArgs.anchorRef,
      negative: cliArgs.negative,
      output,
      style: cliArgs.style,
    };

    // Write assembled prompt to .prompt.txt for reproducibility
    if (cliArgs.design && cliArgs.output) {
      const promptFile = cliArgs.output.replace(/\.png$/i, ".prompt.txt");
      const header = [
        `# AI Image Generation Prompt`,
        `# Design: ${metadata.design || "N/A"}`,
        `# Archetype: ${metadata.archetype || "N/A"}`,
        `# Role: ${metadata.role || "N/A"}`,
        `# Provider: ${providerName}`,
        `# Aspect: ${cliArgs.aspect || "16:9"}`,
        `# Generated: ${new Date().toISOString()}`,
        ``,
        `## Full Prompt`,
        prompt,
      ];
      if (cliArgs.negative) {
        header.push(``, `## Negative Prompt`, cliArgs.negative);
      }
      fs.writeFileSync(promptFile, header.join("\n"));
      console.log(`Prompt file: ${promptFile}`);
    }

    const result = await provider.generate(prompt, options);

    if (result.success) {
      console.log(`Success! Output: ${result.path}`);
      console.log(`Duration: ${result.duration}ms`);
      if (result.url) {
        console.log(`URL: ${result.url}`);
      }
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
