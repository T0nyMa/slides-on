/**
 * jimeng.ts — Jimeng (即梦) ByteDance provider
 *
 * Uses ByteDance Volcano Engine Ark API for image generation.
 * Supports text-to-image generation with various style presets.
 *
 * Environment: JIMENG_API_KEY       — Volcano Engine Ark API key
 *              JIMENG_ENDPOINT      — Optional custom endpoint
 *                                        (default: "https://ark.cn-beijing.volces.com/api/v3")
 *
 * API Reference: https://www.volcengine.com/docs/82379
 */

import type { ImagineOptions, GenerateResult } from "../types";
import { ASPECT_DIMENSIONS } from "../types";

const ENV_KEY = "JIMENG_API_KEY";
const ENV_ENDPOINT = "JIMENG_ENDPOINT";

export const name = "jimeng";
export const envKey = ENV_KEY;

// Note: Jimeng model IDs vary by region and access level.
// Common model: "doubao-seedream-2.0-t2i" or similar.
const DEFAULT_MODEL = "doubao-seedream-2.0-t2i";

export async function generate(
  prompt: string,
  options: ImagineOptions
): Promise<GenerateResult> {
  const start = Date.now();

  const apiKey = process.env[ENV_KEY];
  if (!apiKey) {
    return {
      success: false,
      provider: "jimeng",
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
        data.error?.message || data.error?.code || `Jimeng API error: ${response.status}`
      );
    }

    const images = data.data;
    if (!images?.length) throw new Error("No images in response");

    const imageUrl = images[0].url;
    if (!imageUrl) throw new Error("No image URL in response");

    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) throw new Error(`Failed to download image: ${imgResponse.status}`);
    const buffer = await imgResponse.arrayBuffer();

    const outputPath = options.output || `jimeng_${Date.now()}.png`;
    await Bun.write(outputPath, new Uint8Array(buffer));

    return {
      success: true,
      path: outputPath,
      url: imageUrl,
      provider: "jimeng",
      duration: Date.now() - start,
    };
  } catch (err: any) {
    return {
      success: false,
      provider: "jimeng",
      error: err.message,
      duration: Date.now() - start,
    };
  }
}
