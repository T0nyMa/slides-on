/**
 * minimax.ts — MiniMax (海螺AI) provider
 *
 * Uses MiniMax image generation API (image-01 model).
 * Excellent photorealism, fast generation speed.
 *
 * Environment: MINIMAX_API_KEY      — MiniMax API key
 *              MINIMAX_GROUP_ID     — MiniMax group ID (optional, for enterprise)
 *
 * API Reference: https://platform.minimax.chat/document/image
 */

import type { ImagineOptions, GenerateResult } from "../types";

const ENV_KEY = "MINIMAX_API_KEY";
const ENV_GROUP_ID = "MINIMAX_GROUP_ID";
const ENDPOINT = "https://api.minimax.chat/v1/image_generation";

export const name = "minimax";
export const envKey = ENV_KEY;

export async function generate(
  prompt: string,
  options: ImagineOptions
): Promise<GenerateResult> {
  const start = Date.now();

  const apiKey = process.env[ENV_KEY];
  if (!apiKey) {
    return {
      success: false,
      provider: "minimax",
      error: `${ENV_KEY} environment variable not set`,
      duration: 0,
    };
  }

  // MiniMax group_id is required for some enterprise accounts
  const groupId = process.env[ENV_GROUP_ID];

  try {
    const body: Record<string, any> = {
      model: "image-01",
      prompt,
      n: 1,
      response_format: "url",
    };

    // MiniMax supported aspect ratios: 1:1, 16:9, 9:16, 4:3, 3:4
    if (options.aspect) {
      // MiniMax uses "aspect_ratio" parameter
      body.aspect_ratio = options.aspect;
    }
    if (options.negative) {
      body.negative_prompt = options.negative;
    }
    if (options.style) {
      body.style = options.style;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
    if (groupId) {
      headers["group_id"] = groupId;
    }

    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        data.base_resp?.status_msg ||
          data.error?.message ||
          `MiniMax API error: ${response.status}`
      );
    }

    // MiniMax response format: { data: { image_urls: [...] } } or { data: [...] }
    const images = data.data?.image_urls || data.data;
    if (!images?.length) throw new Error("No images in MiniMax response");

    const imageUrl = typeof images[0] === "string" ? images[0] : images[0].url;
    if (!imageUrl) throw new Error("No image URL in MiniMax response");

    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) throw new Error(`Failed to download image: ${imgResponse.status}`);
    const buffer = await imgResponse.arrayBuffer();

    const outputPath = options.output || `minimax_${Date.now()}.png`;
    await Bun.write(outputPath, new Uint8Array(buffer));

    return {
      success: true,
      path: outputPath,
      url: imageUrl,
      provider: "minimax",
      duration: Date.now() - start,
    };
  } catch (err: any) {
    return {
      success: false,
      provider: "minimax",
      error: err.message,
      duration: Date.now() - start,
    };
  }
}
