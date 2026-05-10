/**
 * types.ts — Shared TypeScript types for the imagine system
 */

// ─── Imagine Options ─────────────────────────────────────────────────

export interface ImagineOptions {
  prompt: string;
  provider?: string;
  model?: string;
  quality?: "normal" | "2k";
  aspect?: string; // "16:9", "1:1", "9:16", "4:3", "3:4"
  reference?: string; // path to reference image
  negative?: string; // negative prompt
  output?: string; // output file path
  style?: string; // preset style name
}

// ─── Provider Configuration ──────────────────────────────────────────

export interface ProviderConfig {
  name: string;
  apiKey?: string;
  endpoint: string;
  model: string;
  envKey: string; // environment variable name for API key
}

// ─── Generation Result ───────────────────────────────────────────────

export interface GenerateResult {
  success: boolean;
  path?: string;
  url?: string;
  provider: string;
  error?: string;
  duration: number; // ms
}

// ─── Provider Module Interface ───────────────────────────────────────

export interface Provider {
  name: string;
  envKey: string;
  generate: (prompt: string, options: ImagineOptions) => Promise<GenerateResult>;
}

// ─── Batch Types ─────────────────────────────────────────────────────

export interface BatchJob {
  promptFile: string;
  prompt: string;
  output: string;
  status: "pending" | "running" | "done" | "failed";
  result?: GenerateResult;
}

export interface BatchResult {
  total: number;
  succeeded: number;
  failed: number;
  jobs: BatchJob[];
  totalDuration: number;
}

// ─── Aspect Ratio Mapping ────────────────────────────────────────────

export interface AspectDimension {
  width: number;
  height: number;
}

/**
 * Standard aspect ratios → pixel dimensions.
 * Providers may have different limits; the provider implementation
 * should clamp or pick the closest supported size.
 */
export const ASPECT_DIMENSIONS: Record<string, AspectDimension> = {
  "1:1": { width: 1024, height: 1024 },
  "16:9": { width: 1280, height: 720 },
  "9:16": { width: 720, height: 1280 },
  "4:3": { width: 1024, height: 768 },
  "3:4": { width: 768, height: 1024 },
};
