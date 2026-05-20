/**
 * dashscope.ts — Alibaba DashScope provider
 *
 * Supports 4 model families via unified multimodal-generation endpoint:
 *   - qwen2 (qwen-image-2.0-*): Flexible pixel sizes, pixel-budget based, negative prompt
 *   - qwenFixed (qwen-image-max/plus/image): 5 fixed sizes keyed to aspect ratio
 *   - wan27 (wan2.7-*): Wide size range, up to 9 reference images
 *   - legacy (wanx-v1 etc.): Standard sizes, async task polling
 *
 * Environment: DASHSCOPE_API_KEY — Alibaba Cloud DashScope API key
 *
 * API Reference:
 *   Qwen-Image: https://www.alibabacloud.com/help/en/model-studio/qwen-image-api
 *   Wanx:       https://help.aliyun.com/document_detail/dashscope.html
 */

import type { ImagineOptions, GenerateResult } from "../types";
import { ASPECT_DIMENSIONS } from "../types";
import * as fs from "fs";

const ENV_KEY = "DASHSCOPE_API_KEY";
const ENDPOINT = "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

// Qwen-Image fixed sizes (qwenFixed family)
const QWEN_FIXED_SIZES: Record<string, string> = {
  "1:1": "1024*1024",
  "16:9": "1664*928",
  "9:16": "928*1664",
  "4:3": "1184*896",
  "3:4": "896*1184",
};

// Qwen2 recommended sizes
const QWEN2_SIZES: Record<string, string> = {
  "1:1": "2048*2048",
  "16:9": "2688*1536",
  "9:16": "1536*2688",
  "4:3": "2368*1728",
  "3:4": "1728*2368",
};

export const name = "dashscope";
export const envKey = ENV_KEY;

// ─── Model Family Detection ──────────────────────────────────────────

interface ModelSpec {
  family: "qwen2" | "qwenFixed" | "wan27" | "legacy";
  maxWidth?: number;
  maxHeight?: number;
  minPixels?: number;
  maxPixels?: number;
  supportsReference?: boolean;
  maxReferences?: number;
}

const MODEL_SPECS: Record<string, ModelSpec> = {
  "qwen-image-2.0-pro": { family: "qwen2", maxWidth: 2048, maxHeight: 2048, minPixels: 262144, maxPixels: 4194304 },
  "qwen-image-2.0": { family: "qwen2", maxWidth: 2048, maxHeight: 2048, minPixels: 262144, maxPixels: 4194304 },
  "qwen-image-max": { family: "qwenFixed" },
  "qwen-image-plus": { family: "qwenFixed" },
  "qwen-image": { family: "qwenFixed" },
  "wan2.7-image-pro": { family: "wan27", maxWidth: 4096, maxHeight: 4096, minPixels: 262144, maxPixels: 16777216, supportsReference: true, maxReferences: 9 },
};

function getModelSpec(model: string): ModelSpec {
  return MODEL_SPECS[model] || detectModelSpec(model);
}

function detectModelSpec(model: string): ModelSpec {
  if (model.startsWith("qwen-image-2")) return { family: "qwen2" };
  if (model.startsWith("qwen-image")) return { family: "qwenFixed" };
  if (model.startsWith("wan2.7-")) return { family: "wan27", supportsReference: true, maxReferences: 9 };
  return { family: "legacy" };
}

// ─── Size Resolution ─────────────────────────────────────────────────

function roundToMultiple(n: number, m: number): number {
  return Math.round(n / m) * m;
}

function getQwen2Size(aspect: string): string {
  const target = QWEN2_SIZES[aspect] || QWEN2_SIZES["1:1"]!;
  return target;
}

function getQwenFixedSize(aspect: string): string {
  return QWEN_FIXED_SIZES[aspect] || QWEN_FIXED_SIZES["1:1"]!;
}

function getWan27Size(aspect: string, quality: "normal" | "2k"): string {
  const dims = ASPECT_DIMENSIONS[aspect] || ASPECT_DIMENSIONS["1:1"]!;
  const maxEdge = quality === "2k" ? 4096 : 2048;
  let w = dims.width;
  let h = dims.height;

  if (w > maxEdge) { h = Math.round((h / w) * maxEdge); w = maxEdge; }
  if (h > maxEdge) { w = Math.round((w / h) * maxEdge); h = maxEdge; }

  return `${w}*${h}`;
}

// ─── Error Classification ─────────────────────────────────────────────

function isRetryableError(error: Error): boolean {
  const msg = error.message.toLowerCase();
  const nonRetryable = [
    "invalid",
    "not supported",
    "no api key",
    "content filter",
    "content policy",
  ];
  for (const marker of nonRetryable) {
    if (msg.includes(marker)) return false;
  }
  return true;
}

// ─── Reference Image Loading ──────────────────────────────────────────

async function loadRef(path: string): Promise<string> {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const buf = fs.readFileSync(path);
  const mime = path.endsWith(".webp") ? "image/webp"
    : path.endsWith(".jpg") || path.endsWith(".jpeg") ? "image/jpeg"
    : "image/png";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

// ─── Main Generate ───────────────────────────────────────────────────

export async function generate(
  prompt: string,
  options: ImagineOptions
): Promise<GenerateResult> {
  const start = Date.now();

  const apiKey = process.env[ENV_KEY];
  if (!apiKey) {
    return {
      success: false,
      provider: "dashscope",
      error: `${ENV_KEY} environment variable not set`,
      duration: 0,
    };
  }

  const model = options.model || "qwen-image-2.0-pro";
  const spec = getModelSpec(model);
  const aspect = options.aspect || "1:1";

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const content: Array<Record<string, any>> = [];

      // Reference images (wan27 only)
      if (spec.supportsReference && options.reference) {
        const refs = options.reference.split(",").map(s => s.trim()).filter(Boolean);
        for (let i = 0; i < Math.min(refs.length, spec.maxReferences || 9); i++) {
          const uri = await loadRef(refs[i]!);
          content.push({ image: uri });
        }
      }

      content.push({ text: prompt });

      const body: Record<string, any> = {
        model,
        input: {
          messages: [{ role: "user", content }],
        },
        parameters: {
          n: 1,
          watermark: false,
        },
      };

      // Size per family
      if (spec.family === "qwen2") {
        body.parameters.size = getQwen2Size(aspect);
        body.parameters.prompt_extend = false;
        if (options.negative) body.parameters.negative_prompt = options.negative;
        if (options.seed !== undefined) body.parameters.seed = options.seed;
      } else if (spec.family === "qwenFixed") {
        body.parameters.size = getQwenFixedSize(aspect);
        body.parameters.prompt_extend = false;
        if (options.negative) body.parameters.negative_prompt = options.negative;
        if (options.seed !== undefined) body.parameters.seed = options.seed;
      } else if (spec.family === "wan27") {
        body.parameters.size = getWan27Size(aspect, options.quality || "normal");
        if (options.seed !== undefined) body.parameters.seed = options.seed;
      } else {
        // Legacy — async polling
        body.parameters.size = getQwenFixedSize(aspect);
      }

      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.code || `DashScope API error: ${response.status}`
        );
      }

      // Check for async task (legacy models)
      if (data.output?.task_id) {
        const resultUrl = await pollTask(data.output.task_id, apiKey);
        const imgResponse = await fetch(resultUrl);
        if (!imgResponse.ok) throw new Error(`Failed to download image: ${imgResponse.status}`);
        const buffer = await imgResponse.arrayBuffer();
        const outputPath = options.output || `dashscope_${Date.now()}.png`;
        await Bun.write(outputPath, new Uint8Array(buffer));

        return {
          success: true,
          path: outputPath,
          url: resultUrl,
          provider: "dashscope",
          duration: Date.now() - start,
        };
      }

      // Sync response: output.choices[0].message.content[]
      const contents = data.output?.choices?.[0]?.message?.content;
      if (!contents?.length) {
        throw new Error(`No content in DashScope response: ${JSON.stringify(data).slice(0, 200)}`);
      }

      let resultUrl: string | null = null;
      for (const item of contents) {
        if (item.image) { resultUrl = item.image; break; }
      }
      if (!resultUrl) {
        throw new Error("No image URL in DashScope response");
      }

      const imgResponse = await fetch(resultUrl);
      if (!imgResponse.ok) throw new Error(`Failed to download image: ${imgResponse.status}`);
      const buffer = await imgResponse.arrayBuffer();

      const outputPath = options.output || `dashscope_${Date.now()}.png`;
      await Bun.write(outputPath, new Uint8Array(buffer));

      return {
        success: true,
        path: outputPath,
        url: resultUrl,
        provider: "dashscope",
        duration: Date.now() - start,
      };
    } catch (err: any) {
      lastError = err;

      if (!isRetryableError(err)) {
        return {
          success: false,
          provider: "dashscope",
          error: err.message,
          duration: Date.now() - start,
        };
      }

      if (attempt < MAX_ATTEMPTS - 1) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }
  }

  return {
    success: false,
    provider: "dashscope",
    error: lastError?.message || "Max retries exhausted",
    duration: Date.now() - start,
  };
}

// ─── Async Task Polling (legacy models) ──────────────────────────────

async function pollTask(taskId: string, apiKey: string): Promise<string> {
  const pollEndpoint = `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`;
  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(pollEndpoint, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await response.json();

    if (data.output?.task_status === "SUCCEEDED") {
      const results = data.output?.results;
      if (results?.length) return results[0].url;
      throw new Error("No results in completed task");
    }
    if (data.output?.task_status === "FAILED") {
      throw new Error(`Task failed: ${data.output?.message || data.message}`);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Task polling timed out");
}
