/**
 * seedream.ts — Seedream (豆包) ByteDance provider
 *
 * Uses ByteDance's Doubao Seedream model via the Volcano Engine Ark API
 * for high-quality image generation with strong Chinese text support.
 *
 * Environment: SEEDREAM_API_KEY     — Volcano Engine Ark API key
 *              SEEDREAM_ENDPOINT    — Optional custom endpoint
 *                                      (default: "https://ark.cn-beijing.volces.com/api/v3")
 *
 * API Reference: https://www.volcengine.com/docs/82379 (Ark Platform)
 *
 * Note: Seedream is a ByteDance product accessible via the Ark platform.
 * It shares the same API infrastructure as Jimeng (即梦) but uses a
 * different model ID. The Ark platform provides OpenAI-compatible endpoints.
 */

import type { ImagineOptions, GenerateResult } from "../types";
import { ASPECT_DIMENSIONS } from "../types";

const ENV_KEY = "SEEDREAM_API_KEY";
const ENV_ENDPOINT = "SEEDREAM_ENDPOINT";

export const name = "seedream";
export const envKey = ENV_KEY;

// Seedream model ID on the Ark platform
// Common model IDs: "doubao-seedream-2.0-t2i", "doubao-seedream-2.1-t2i"
const DEFAULT_MODEL = "doubao-seedream-2.1-t2i";

export async function generate(
  prompt: string,
  options: ImagineOptions
): Promise<GenerateResult> {
  const start = Date.now();

  const apiKey = process.env[ENV_KEY];
  if (!apiKey) {
    return {
      success: false,
      provider: "seedream",
      error: `${ENV_KEY} environment variable not set`,
      duration: 0,
    };
  }

  try {
    const baseUrl = process.env[ENV_ENDPOINT] || "https://ark.cn-beijing.volces.com/api/v3";
    const url = `${baseUrl}/images/generations`;

    const dims = ASPECT_DIMENSIONS[options.aspect || "1:1"] || ASPECT_DIMENSIONS["1:1"];
    const size = `${dims.width}x${dims.height}`;

    const body: Record<string, any> = {
      model: DEFAULT_MODEL,
      prompt,
      n: 1,
      size,
      response_format: "url",
    };

    if (options.negative) {
      body.negative_prompt = options.negative;
    }
    if (options.style) {
      body.style = options.style;
    }
    // Seedream 2.1 supports reference image for style transfer
    if (options.reference) {
      const refBuffer = await loadImageBase64(options.reference);
      body.reference_image = refBuffer;
    }

    const response = await fetch(url, {
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
        data.error?.message || data.error?.code || `Seedream API error: ${response.status}`
      );
    }

    const images = data.data;
    if (!images?.length) throw new Error("No images in response");

    const imageUrl = images[0].url;
    if (!imageUrl) throw new Error("No image URL in response");

    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) throw new Error(`Failed to download image: ${imgResponse.status}`);
    const buffer = await imgResponse.arrayBuffer();

    const outputPath = options.output || `seedream_${Date.now()}.png`;
    await Bun.write(outputPath, new Uint8Array(buffer));

    return {
      success: true,
      path: outputPath,
      url: imageUrl,
      provider: "seedream",
      duration: Date.now() - start,
    };
  } catch (err: any) {
    return {
      success: false,
      provider: "seedream",
      error: err.message,
      duration: Date.now() - start,
    };
  }
}

async function loadImageBase64(path: string): Promise<string> {
  const file = Bun.file(path);
  const buffer = await file.arrayBuffer();
  const mime = path.endsWith(".png") ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${Buffer.from(buffer).toString("base64")}`;
}
