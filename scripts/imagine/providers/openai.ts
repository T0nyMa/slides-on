/**
 * openai.ts — OpenAI DALL-E / GPT Image provider
 *
 * Uses OpenAI Images API for DALL-E 2/3 and GPT-4o image generation.
 *
 * Environment: OPENAI_API_KEY  — OpenAI API key
 *              OPENAI_BASE_URL — Optional custom base URL (for proxies/gateways)
 *
 * API Reference: https://platform.openai.com/docs/api-reference/images
 */

import type { ImagineOptions, GenerateResult } from "../types";
import { ASPECT_DIMENSIONS } from "../types";

const ENV_KEY = "OPENAI_API_KEY";
const ENV_BASE_URL = "OPENAI_BASE_URL";

export const name = "openai";
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
      provider: "openai",
      error: `${ENV_KEY} environment variable not set`,
      duration: 0,
    };
  }

  try {
    const baseUrl = process.env[ENV_BASE_URL] || "https://api.openai.com";
    const url = `${baseUrl}/v1/images/generations`;

    // DALL-E 3 supports: 1024x1024, 1792x1024, 1024x1792
    // DALL-E 2 supports: 256x256, 512x512, 1024x1024
    const dims = ASPECT_DIMENSIONS[options.aspect || "1:1"] || ASPECT_DIMENSIONS["1:1"];

    // Map known aspect ratios to DALL-E 3 sizes
    let size: string;
    switch (dims.width + "x" + dims.height) {
      case "1280x720":
        size = "1792x1024"; // DALL-E 3 landscape
        break;
      case "720x1280":
        size = "1024x1792"; // DALL-E 3 portrait
        break;
      default:
        size = "1024x1024"; // Default square
    }

    const model = options.quality === "2k" ? "dall-e-3-hd" : "dall-e-3";
    const quality = options.quality === "2k" ? "hd" : "standard";

    const body: Record<string, any> = {
      model,
      prompt,
      n: 1,
      size,
      quality,
      response_format: "url",
      style: options.style || "vivid",
    };

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
        data.error?.message || `OpenAI API error: ${response.status}`
      );
    }

    const images = data.data;
    if (!images?.length) throw new Error("No images in response");

    const imageUrl = images[0].url;
    if (!imageUrl) throw new Error("No image URL in response");

    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) throw new Error(`Failed to download image: ${imgResponse.status}`);
    const buffer = await imgResponse.arrayBuffer();

    const outputPath = options.output || `openai_${Date.now()}.png`;
    await Bun.write(outputPath, new Uint8Array(buffer));

    return {
      success: true,
      path: outputPath,
      url: imageUrl,
      provider: "openai",
      duration: Date.now() - start,
    };
  } catch (err: any) {
    return {
      success: false,
      provider: "openai",
      error: err.message,
      duration: Date.now() - start,
    };
  }
}
