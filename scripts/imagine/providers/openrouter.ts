/**
 * openrouter.ts — OpenRouter provider
 *
 * Multi-model API gateway that provides a single interface to access
 * multiple image generation providers (OpenAI, Google, etc.).
 *
 * Environment: OPENROUTER_API_KEY — OpenRouter API key
 *
 * API Reference: https://openrouter.ai/docs
 *
 * Note: At the time of writing, OpenRouter primarily focuses on LLM
 * text generation. Image generation support is experimental and model-dependent.
 * Check https://openrouter.ai/models for currently available image models.
 */

import type { ImagineOptions, GenerateResult } from "../types";

const ENV_KEY = "OPENROUTER_API_KEY";
const ENDPOINT = "https://openrouter.ai/api/v1/images/generations";

export const name = "openrouter";
export const envKey = ENV_KEY;

// Recommended image models available via OpenRouter
const DEFAULT_IMAGE_MODEL = "openai/dall-e-3";

export async function generate(
  prompt: string,
  options: ImagineOptions
): Promise<GenerateResult> {
  const start = Date.now();

  const apiKey = process.env[ENV_KEY];
  if (!apiKey) {
    return {
      success: false,
      provider: "openrouter",
      error: `${ENV_KEY} environment variable not set`,
      duration: 0,
    };
  }

  try {
    const url = ENDPOINT;

    // Use the model specified in style, or default to DALL-E 3
    const model = options.style || DEFAULT_IMAGE_MODEL;

    const body: Record<string, any> = {
      model,
      prompt,
      n: 1,
      response_format: "url",
    };

    if (options.aspect) {
      body.size = aspectToSize(options.aspect);
    }
    if (options.quality === "2k") {
      body.quality = "hd";
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/anthropics/claude-code", // Required by OpenRouter
        "X-Title": "slides-on imagine",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        data.error?.message || data.error?.code || `OpenRouter API error: ${response.status}`
      );
    }

    const images = data.data;
    if (!images?.length) throw new Error("No images in response");

    const imageUrl = images[0].url;
    if (!imageUrl) throw new Error("No image URL in response");

    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) throw new Error(`Failed to download image: ${imgResponse.status}`);
    const buffer = await imgResponse.arrayBuffer();

    const outputPath = options.output || `openrouter_${Date.now()}.png`;
    await Bun.write(outputPath, new Uint8Array(buffer));

    return {
      success: true,
      path: outputPath,
      url: imageUrl,
      provider: "openrouter",
      duration: Date.now() - start,
    };
  } catch (err: any) {
    return {
      success: false,
      provider: "openrouter",
      error: err.message,
      duration: Date.now() - start,
    };
  }
}

function aspectToSize(aspect: string): string {
  const sizes: Record<string, string> = {
    "1:1": "1024x1024",
    "16:9": "1792x1024",
    "9:16": "1024x1792",
    "4:3": "1024x768",
    "3:4": "768x1024",
  };
  return sizes[aspect] || "1024x1024";
}
