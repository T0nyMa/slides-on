/**
 * config.ts — Shared provider registry, defaults, and CLI parsing
 *
 * Single source of truth for:
 *   - Provider registry (names, env keys, descriptions, ref support)
 *   - Default configuration (from IMAGINE_* env vars)
 *   - Common CLI flag parsing (used by both main.ts and build-batch.ts)
 *
 * Environment variables for defaults:
 *   IMAGINE_PROVIDER   — default provider (e.g. "dashscope")
 *   IMAGINE_MODEL      — default model (e.g. "qwen-image-2.0-pro-2026-04-22")
 *   IMAGINE_QUALITY    — default quality ("normal" | "2k")
 *   IMAGINE_ASPECT     — default aspect ratio (e.g. "3:4", "16:9")
 *   IMAGINE_DESIGN     — default style definition for structured prompts
 *   DASHSCOPE_API_KEY, OPENAI_API_KEY, ... — provider-specific API keys
 */

// ─── Provider Registry ─────────────────────────────────────────────────

export interface ProviderInfo {
  module: string;
  envKey: string;
  description: string;
  supportsReference: boolean;
}

export const PROVIDERS: Record<string, ProviderInfo> = {
  azure: {
    module: "./providers/azure",
    envKey: "AZURE_OPENAI_API_KEY",
    description: "Azure OpenAI DALL-E — Microsoft-hosted DALL-E models",
    supportsReference: false,
  },
  dashscope: {
    module: "./providers/dashscope",
    envKey: "DASHSCOPE_API_KEY",
    description: "DashScope / Tongyi Wanxiang (通义万象) — Alibaba Cloud",
    supportsReference: false,
  },
  google: {
    module: "./providers/google",
    envKey: "GOOGLE_API_KEY",
    description: "Google Imagen — Vertex AI image generation",
    supportsReference: true,
  },
  jimeng: {
    module: "./providers/jimeng",
    envKey: "JIMENG_API_KEY",
    description: "Jimeng (即梦) — ByteDance image generation",
    supportsReference: false,
  },
  minimax: {
    module: "./providers/minimax",
    envKey: "MINIMAX_API_KEY",
    description: "MiniMax (海螺AI) — Chinese AI image generation",
    supportsReference: false,
  },
  openai: {
    module: "./providers/openai",
    envKey: "OPENAI_API_KEY",
    description: "OpenAI DALL-E / GPT Image — OpenAI image generation",
    supportsReference: true,
  },
  openrouter: {
    module: "./providers/openrouter",
    envKey: "OPENROUTER_API_KEY",
    description: "OpenRouter — Multi-model API gateway",
    supportsReference: false,
  },
  replicate: {
    module: "./providers/replicate",
    envKey: "REPLICATE_API_TOKEN",
    description: "Replicate — FLUX, SDXL, and community models",
    supportsReference: true,
  },
  seedream: {
    module: "./providers/seedream",
    envKey: "SEEDREAM_API_KEY",
    description: "Seedream (豆包) — ByteDance Seedream via Ark",
    supportsReference: true,
  },
  zai: {
    module: "./providers/zai",
    envKey: "ZHIPU_API_KEY",
    description: "Z.AI / Zhipu (智谱) — CogView image generation",
    supportsReference: false,
  },
};

export const PROVIDER_ORDER_PLAIN: string[] = [
  "dashscope", "openai", "minimax", "replicate",
  "zai", "openrouter", "azure", "google", "jimeng", "seedream",
];

export const PROVIDER_ORDER_REFERENCE: string[] = ["google", "openai", "azure"];

// ─── Default Configuration ─────────────────────────────────────────────

/** Config fields settable via env vars or CLI */
export interface ImagineConfig {
  provider?: string;
  model?: string;
  quality?: "normal" | "2k";
  aspect?: string;
  design?: string;
  role?: "illustration" | "content-page";
  textSafe?: boolean;
  negative?: string;
  style?: string;
  reference?: string;
}

/** Read defaults from IMAGINE_* environment variables.
 *  These can be overridden by CLI flags at invocation time. */
export function getDefaultConfig(): ImagineConfig {
  return {
    provider: process.env.IMAGINE_PROVIDER || undefined,
    model: process.env.IMAGINE_MODEL || undefined,
    quality: (process.env.IMAGINE_QUALITY as "normal" | "2k") || undefined,
    aspect: process.env.IMAGINE_ASPECT || undefined,
    design: process.env.IMAGINE_DESIGN || undefined,
  };
}

// ─── Provider Selection ────────────────────────────────────────────────

/** Auto-select a provider based on available API keys in environment.
 *  Priority: explicit preferred → IMAGINE_PROVIDER env → auto-detect from key envs. */
export function selectProvider(preferred?: string): string {
  if (preferred) {
    if (!PROVIDERS[preferred]) {
      throw new Error(
        `Unknown provider: ${preferred}. Available: ${Object.keys(PROVIDERS).join(", ")}`
      );
    }
    return preferred;
  }

  const envProvider = process.env.IMAGINE_PROVIDER;
  if (envProvider && PROVIDERS[envProvider]) {
    return envProvider;
  }

  const order = PROVIDER_ORDER_PLAIN;
  for (const name of order) {
    const info = PROVIDERS[name];
    if (info && process.env[info.envKey]) return name;
  }

  throw new Error(
    "No provider API key found. Set one of:\n" +
      Object.entries(PROVIDERS)
        .map(([, info]) => `  ${info.envKey}`)
        .join("\n") +
      "\nOr set IMAGINE_PROVIDER to specify explicitly."
  );
}

/** Check if a provider supports native reference images */
export function supportsReferenceImage(provider: string): boolean {
  return PROVIDERS[provider]?.supportsReference ?? false;
}

// ─── Common CLI Parsing ────────────────────────────────────────────────

export interface CommonCliArgs {
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
  jobs?: number;
  help?: boolean;
  listProviders?: boolean;
}

/** Recognized common flag set — used to decide when to stop parsing */
const COMMON_FLAGS = new Set([
  "--provider", "--model", "-m",
  "--quality", "-q", "--aspect", "-a",
  "--reference", "-r", "--negative", "-n",
  "--output", "-o", "--style", "-s",
  "--design", "-d", "--archetype",
  "--role", "--text-safe",
  "--jobs", "-j",
  "--list-providers", "--help", "-h",
]);

/**
 * Parse common CLI flags from a position in args.
 * Stops at the first positional arg that doesn't look like a flag value,
 * or at an unrecognized flag — caller handles the rest.
 *
 * Returns parsed opts and remaining unparsed args.
 */
export function parseCommonCliArgs(args: string[]): { opts: CommonCliArgs; remaining: string[] } {
  const opts: CommonCliArgs = {};
  const remaining: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;

    // If we see a positional that's not a flag, everything from here is remaining
    if (!arg.startsWith("-")) {
      remaining.push(...args.slice(i));
      break;
    }

    // If it's not a recognized flag, treat as remaining
    if (!COMMON_FLAGS.has(arg)) {
      remaining.push(...args.slice(i));
      break;
    }

    switch (arg) {
      case "--provider":
        opts.provider = args[++i]; break;
      case "--model": case "-m":
        opts.model = args[++i]; break;
      case "--quality": case "-q": {
        const v = args[++i];
        opts.quality = v === "2k" ? "2k" : "normal";
        break;
      }
      case "--aspect": case "-a":
        opts.aspect = args[++i]; break;
      case "--reference": case "-r":
        opts.reference = args[++i]; break;
      case "--negative": case "-n":
        opts.negative = args[++i]; break;
      case "--output": case "-o":
        opts.output = args[++i]; break;
      case "--style": case "-s":
        opts.style = args[++i]; break;
      case "--design": case "-d":
        opts.design = args[++i]; break;
      case "--archetype":
        opts.archetype = args[++i]; break;
      case "--role":
        opts.role = args[++i] as "illustration" | "content-page"; break;
      case "--text-safe":
        opts.textSafe = true; break;
      case "--jobs": case "-j": {
        const n = parseInt(args[++i]!, 10);
        opts.jobs = isNaN(n) || n < 1 ? 3 : n;
        break;
      }
      case "--list-providers":
        opts.listProviders = true; break;
      case "--help": case "-h":
        opts.help = true; break;
    }
  }

  return { opts, remaining };
}

/** Merge env defaults + CLI overrides into final config.
 *  CLI args take precedence over env vars. */
export function resolveConfig(defaults: ImagineConfig, cli: CommonCliArgs): ImagineConfig {
  return {
    provider: cli.provider || defaults.provider,
    model: cli.model || defaults.model,
    quality: cli.quality || defaults.quality,
    aspect: cli.aspect || defaults.aspect,
    design: cli.design || defaults.design,
    role: cli.role || defaults.role,
    textSafe: cli.textSafe ?? defaults.textSafe,
    negative: cli.negative || defaults.negative,
    style: cli.style || defaults.style,
    reference: cli.reference || defaults.reference,
  };
}

// ─── Display Helpers ───────────────────────────────────────────────────

export function printProviders(): void {
  console.log("Available AI image providers:\n");
  for (const [name, info] of Object.entries(PROVIDERS)) {
    const status = process.env[info.envKey] ? "[key set]" : "[no key]";
    const ref = info.supportsReference ? " [ref]" : "";
    console.log(`  ${name.padEnd(12)} ${info.description}  ${status}${ref}`);
  }
  console.log(`\nEnv vars for defaults:`);
  console.log(`  IMAGINE_PROVIDER   IMAGINE_MODEL   IMAGINE_QUALITY   IMAGINE_ASPECT   IMAGINE_DESIGN`);
}

export function printCommonHelp(): void {
  console.log(`
Common options (main.ts & build-batch.ts):
  --provider        Provider name (dashscope, openai, minimax, ...)
  --model,    -m    Model name (e.g. qwen-image-2.0-pro-2026-04-22)
  --quality,  -q    Quality: "normal" or "2k"
  --aspect,   -a    Aspect ratio: "16:9", "1:1", "9:16", "4:3", "3:4"
  --reference, -r   Reference image path
  --negative,  -n   Negative prompt
  --output,   -o    Output file path
  --style,    -s    Preset style name
  --design,   -d    Structured prompt: style-definition name
  --archetype        Composition archetype name
  --role             "illustration" (default) or "content-page"
  --text-safe        Leave blank label spaces (no baked text)
  --jobs,     -j    Max parallel jobs (batch only, default: 3)
  --list-providers   List all providers
  --help,     -h    Show help

Env vars for persistent defaults:
  IMAGINE_PROVIDER   IMAGINE_MODEL   IMAGINE_QUALITY   IMAGINE_ASPECT   IMAGINE_DESIGN
`);
}
