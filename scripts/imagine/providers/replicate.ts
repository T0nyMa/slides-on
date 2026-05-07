/**
 * replicate.ts — Replicate provider
 *
 * Uses Replicate's hosted model platform for open-source image models
 * (FLUX, SDXL, community fine-tunes, ControlNet, etc.).
 *
 * Environment: REPLICATE_API_TOKEN — Replicate API token
 *
 * API Reference: https://replicate.com/docs/reference/http
 *
 * Default model: black-forest-labs/flux-schnell (fast, high quality)
 * Other good options:
 *   - black-forest-labs/flux-dev  (higher quality, slower)
 *   - stability-ai/sdxl           (very fast, good for simple scenes)
 *   - stability-ai/stable-diffusion-3 (balanced)
 */

import type { ImagineOptions, GenerateResult } from "../types";
import { ASPECT_DIMENSIONS } from "../types";

const ENV_KEY = "REPLICATE_API_TOKEN";
const ENDPOINT = "https://api.replicate.com/v1/predictions";

export const name = "replicate";
export const envKey = ENV_KEY;

// Default model: fast and high quality
const DEFAULT_MODEL = "black-forest-labs/flux-schnell";

export async function generate(
  prompt: string,
  options: ImagineOptions
): Promise<GenerateResult> {
  const start = Date.now();

  const apiToken = process.env[ENV_KEY];
  if (!apiToken) {
    return {
      success: false,
      provider: "replicate",
      error: `${ENV_KEY} environment variable not set`,
      duration: 0,
    };
  }

  try {
    const dims = ASPECT_DIMENSIONS[options.aspect || "1:1"] || ASPECT_DIMENSIONS["1:1"];

    const model = options.style || DEFAULT_MODEL;
    const modelVersion = await resolveModelVersion(model);

    const input: Record<string, any> = {
      prompt,
      width: dims.width,
      height: dims.height,
      num_outputs: 1,
    };

    // Common SDXL/FLUX parameters
    if (options.negative) {
      input.negative_prompt = options.negative;
    }
    if (options.reference) {
      // Some models support image input; pass the image path
      const refBuffer = await loadImageBase64(options.reference);
      input.image = refBuffer;
    }

    // Step 1: Create prediction
    const createResponse = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: modelVersion,
        input,
      }),
    });

    const prediction = await createResponse.json();
    if (!createResponse.ok) {
      throw new Error(
        prediction.detail || prediction.error || `Replicate API error: ${createResponse.status}`
      );
    }

    // Step 2: Poll until complete
    const result = await pollPrediction(prediction.id, apiToken);

    // Step 3: Download image
    const imageUrl = Array.isArray(result.output)
      ? result.output[0]
      : result.output;
    if (!imageUrl) throw new Error("No image URL in Replicate prediction output");

    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) throw new Error(`Failed to download image: ${imgResponse.status}`);
    const buffer = await imgResponse.arrayBuffer();

    const outputPath = options.output || `replicate_${Date.now()}.png`;
    await Bun.write(outputPath, new Uint8Array(buffer));

    return {
      success: true,
      path: outputPath,
      url: imageUrl,
      provider: "replicate",
      duration: Date.now() - start,
    };
  } catch (err: any) {
    return {
      success: false,
      provider: "replicate",
      error: err.message,
      duration: Date.now() - start,
    };
  }
}

// ─── Helpers ────────────────────────────────────────────────────────

async function resolveModelVersion(model: string): Promise<string> {
  // If it already contains a version hash, return as-is
  if (model.includes(":")) return model;

  // Fetch latest version from Replicate API
  try {
    const response = await fetch(`https://api.replicate.com/v1/models/${model}`);
    const data = await response.json();
    if (data.latest_version?.id) {
      return `${model}:${data.latest_version.id}`;
    }
  } catch {
    // Fall back: Replicate can resolve by model name alone
  }
  return model;
}

async function pollPrediction(
  predictionId: string,
  apiToken: string
): Promise<any> {
  const url = `https://api.replicate.com/v1/predictions/${predictionId}`;
  const maxAttempts = 120; // Up to 10 minutes for slow cold starts
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });
    const data = await response.json();

    if (data.status === "succeeded") return data;
    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(`Replicate prediction ${data.status}: ${data.error || "unknown error"}`);
    }
    // Exponential backoff: 1s, 1.5s, 2.25s, ...
    const delay = Math.min(1000 * Math.pow(1.5, i), 10000);
    await new Promise((r) => setTimeout(r, delay));
  }
  throw new Error("Replicate prediction polling timed out");
}

async function loadImageBase64(path: string): Promise<string> {
  const file = Bun.file(path);
  const buffer = await file.arrayBuffer();
  const mime = path.endsWith(".png") ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${Buffer.from(buffer).toString("base64")}`;
}
