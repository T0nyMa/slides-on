/**
 * main.ts — AI image generation entry point
 *
 * Reads prompt from --prompt or --file, routes to the appropriate provider,
 * and saves the generated image to the output path.
 *
 * Usage:
 *   bun scripts/imagine/main.ts --prompt "a futuristic city skyline"
 *   bun scripts/imagine/main.ts --file slide-03-architecture.md
 *   bun scripts/imagine/main.ts --prompt "..." --provider openai --quality 2k
 *   bun scripts/imagine/main.ts --list-providers
 */

import * as path from "path";
import * as fs from "fs";
import type { ImagineOptions } from "./types";

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
  listProviders: boolean;
}

function parseArgs(args: string[]): CliArgs {
  const opts: CliArgs = { listProviders: false };
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
      case "--model":
      case "-m":
        opts.model = args[++i];
        break;
      case "--style":
      case "-s":
        opts.style = args[++i];
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

Options:
  --prompt,     -p   Image generation prompt (required unless --file)
  --file,       -f   Read prompt from .md prompt file
  --provider        Provider name (dashscope, minimax, openai, replicate, etc.)
  --quality,    -q   Image quality: "normal" or "2k" (default: normal)
  --aspect,     -a   Aspect ratio: "16:9", "1:1", "9:16", "4:3", "3:4"
  --reference,  -r   Path to reference image (provider-dependent)
  --negative,   -n   Negative prompt
  --output,     -o   Output file path (default: auto-generated)
  --style,      -s   Preset style name
  --list-providers  List all available providers
  --help,       -h   Show this help
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

/**
 * Provider selection priority (when --provider not specified):
 *
 * With reference image:
 *   1. Google Imagen  (best inpainting/editing)
 *   2. OpenAI DALL-E  (good variant/inpainting)
 *   3. Azure DALL-E    (same as OpenAI but Azure-hosted)
 *
 * Without reference:
 *   Tries providers in the order defined by DEFAULT_ORDER_PLAIN.
 *   The first provider to have its API key set will be used.
 */
const DEFAULT_ORDER_PLAIN: string[] = [
  "dashscope",
  "openai",
  "minimax",
  "replicate",
  "zai",
  "openrouter",
  "azure",
  "google",
  "jimeng",
  "seedream",
];

const DEFAULT_ORDER_REFERENCE: string[] = [
  "google",
  "openai",
  "azure",
];

// ─── Prompt Loading ──────────────────────────────────────────────────

function loadPrompt(cliArgs: CliArgs): string {
  if (cliArgs.prompt) return cliArgs.prompt.trim();

  if (cliArgs.file) {
    const filePath = path.resolve(cliArgs.file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Prompt file not found: ${filePath}`);
    }
    let content = fs.readFileSync(filePath, "utf-8");
    // Strip markdown formatting: remove headers, code fences, bold/italic markers
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

  throw new Error("Either --prompt or --file is required");
}

// ─── Provider Selection ──────────────────────────────────────────────

async function selectProvider(cliArgs: CliArgs): Promise<string> {
  // Explicit provider
  if (cliArgs.provider) {
    if (!PROVIDER_MAP[cliArgs.provider]) {
      throw new Error(
        `Unknown provider: ${cliArgs.provider}. Use --list-providers to see available options.`
      );
    }
    return cliArgs.provider;
  }

  // Auto-selection: check reference priority first, then plain order
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

  // List providers
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
    const prompt = loadPrompt(cliArgs);
    const providerName = await selectProvider(cliArgs);

    console.log(`Prompt: ${prompt.slice(0, 80)}${prompt.length > 80 ? "..." : ""}`);
    console.log(`Provider: ${providerName}`);

    // Dynamically load the provider module
    const modulePath = PROVIDER_MAP[providerName];
    const provider = await import(modulePath);

    // Determine output path
    const output = cliArgs.output || `imagine_${providerName}_${Date.now()}.png`;

    const options: ImagineOptions = {
      prompt,
      provider: providerName,
      model: cliArgs.model,
      quality: cliArgs.quality || "normal",
      aspect: cliArgs.aspect,
      reference: cliArgs.reference,
      negative: cliArgs.negative,
      output,
      style: cliArgs.style,
    };

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
