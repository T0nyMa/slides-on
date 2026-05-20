/**
 * openai.ts — OpenAI DALL-E / GPT Image provider
 *
 * Supports gpt-image-2 (default), gpt-image-1, dall-e-3, dall-e-2.
 * Dual API dialect for /images/generations: openai-native (pixel sizes) or ratio-metadata (aspect ratio strings).
 * Reference images via /images/edits (gpt-image models only) or chat completions fallback.
 *
 * Environment: OPENAI_API_KEY         — OpenAI API key
 *              OPENAI_BASE_URL        — Optional custom base URL
 *              OPENAI_IMAGE_USE_CHAT  — If "true", route through chat completions
 *
 * API Reference: https://platform.openai.com/docs/api-reference/images
 */

import type { ImagineOptions, GenerateResult } from "../types";
import { ASPECT_DIMENSIONS } from "../types";
import * as fs from "fs";

const ENV_KEY = "OPENAI_API_KEY";
const ENV_BASE_URL = "OPENAI_BASE_URL";
const ENV_USE_CHAT = "OPENAI_IMAGE_USE_CHAT";
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

export const name = "openai";
export const envKey = ENV_KEY;

// ─── Model & Dialect Helpers ──────────────────────────────────────────

type ApiDialect = "openai-native" | "ratio-metadata";

function isGptImageModel(model: string): boolean {
  return model.startsWith("gpt-image");
}

function getDefaultModel(): string {
  return process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
}

function getApiDialect(model: string): ApiDialect {
  if (process.env.OPENAI_IMAGE_USE_CHAT === "true") return "openai-native";
  return "openai-native";
}

// ─── Size Resolution ──────────────────────────────────────────────────

function roundToMultiple(n: number, m: number): number {
  return Math.round(n / m) * m;
}

interface PixelSize {
  width: number;
  height: number;
}

function buildGptImage2Size(
  targetWidth: number,
  targetHeight: number,
  quality: "normal" | "2k"
): PixelSize {
  const maxEdge = quality === "2k" ? 3840 : 2048;
  let width = roundToMultiple(targetWidth, 16);
  let height = roundToMultiple(targetHeight, 16);

  // Clamp to max edge
  if (width > maxEdge) {
    height = roundToMultiple((height / width) * maxEdge, 16);
    width = maxEdge;
  }
  if (height > maxEdge) {
    width = roundToMultiple((width / height) * maxEdge, 16);
    height = maxEdge;
  }

  // Ensure minimum total pixels
  const MIN_PIXELS = 655360;
  if (width * height < MIN_PIXELS) {
    const scale = Math.sqrt(MIN_PIXELS / (width * height));
    width = roundToMultiple(width * scale, 16);
    height = roundToMultiple(height * scale, 16);
  }

  return { width, height };
}

function getSizeForModel(
  model: string,
  aspect: string,
  quality: "normal" | "2k"
): string {
  const dims = ASPECT_DIMENSIONS[aspect] || ASPECT_DIMENSIONS["1:1"]!;

  if (isGptImageModel(model)) {
    const size = buildGptImage2Size(dims.width, dims.height, quality);
    return `${size.width}x${size.height}`;
  }

  // DALL-E legacy sizes
  switch (dims.width + "x" + dims.height) {
    case "1280x720": return "1792x1024";
    case "720x1280": return "1024x1792";
    default: return "1024x1024";
  }
}

// ─── Error Classification ─────────────────────────────────────────────

function isRetryableError(error: Error): boolean {
  const msg = error.message.toLowerCase();
  const nonRetryable = [
    "invalid_request_error",
    "content_policy_violation",
    "reference image",
    "not supported",
    "api error (400)",
    "api error (401)",
    "invalid ",
    "no api key found",
  ];
  for (const marker of nonRetryable) {
    if (msg.includes(marker.toLowerCase())) return false;
  }
  return true;
}

// ─── Reference Image Loading ──────────────────────────────────────────

async function loadRefAsBase64(path: string): Promise<string> {
  const buf = fs.readFileSync(path);
  const mime = path.endsWith(".webp")
    ? "image/webp"
    : path.endsWith(".jpg") || path.endsWith(".jpeg")
    ? "image/jpeg"
    : "image/png";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

// ─── /images/generations ──────────────────────────────────────────────

async function generateWithGenerations(
  prompt: string,
  options: ImagineOptions,
  apiKey: string,
  model: string,
  baseUrl: string
): Promise<GenerateResult> {
  const url = `${baseUrl}/v1/images/generations`;
  const dialect = getApiDialect(model);
  const aspect = options.aspect || "1:1";

  const body: Record<string, any> = {
    model,
    prompt,
    n: 1,
    response_format: "url",
  };

  if (dialect === "openai-native") {
    body.size = getSizeForModel(model, aspect, options.quality || "normal");
    if (isGptImageModel(model)) {
      body.quality = options.quality === "2k" ? "high" : "medium";
    }
  } else {
    body.size = aspect;
    body.metadata = {
      resolution: options.quality === "2k" ? "high" : "standard",
    };
  }

  if (isGptImageModel(model) && options.seed !== undefined) {
    body.seed = options.seed;
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
    duration: 0,
  };
}

// ─── /images/edits ────────────────────────────────────────────────────

async function generateWithEdits(
  prompt: string,
  options: ImagineOptions,
  apiKey: string,
  model: string,
  baseUrl: string
): Promise<GenerateResult> {
  const url = `${baseUrl}/v1/images/edits`;
  const refPath = options.reference;
  if (!refPath) throw new Error("Reference image path required for edits endpoint");

  const size = getSizeForModel(model, options.aspect || "1:1", options.quality || "normal");

  const formData = new FormData();
  formData.append("model", model);
  formData.append("prompt", prompt);
  formData.append("size", size);
  formData.append("n", "1");
  formData.append("response_format", "url");

  const refBuffer = fs.readFileSync(refPath);
  const refBlob = new Blob([refBuffer]);
  formData.append("image", refBlob, "reference.png");

  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      data.error?.message || `OpenAI edits API error: ${response.status}`
    );
  }

  const images = data.data;
  if (!images?.length) throw new Error("No images in edits response");

  const imageUrl = images[0].url;
  if (!imageUrl) throw new Error("No image URL in edits response");

  const imgResponse = await fetch(imageUrl);
  if (!imgResponse.ok) throw new Error(`Failed to download image: ${imgResponse.status}`);
  const buffer = await imgResponse.arrayBuffer();

  const outputPath = options.output || `openai_edit_${Date.now()}.png`;
  await Bun.write(outputPath, new Uint8Array(buffer));

  return {
    success: true,
    path: outputPath,
    url: imageUrl,
    provider: "openai",
    duration: 0,
  };
}

// ─── Chat Completions Fallback ────────────────────────────────────────

async function generateWithChat(
  prompt: string,
  options: ImagineOptions,
  apiKey: string,
  model: string,
  baseUrl: string
): Promise<GenerateResult> {
  const url = `${baseUrl}/v1/chat/completions`;
  const imageModel = model.replace("gpt-image", "gpt-4o");

  const body: Record<string, any> = {
    model: imageModel,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
        ],
      },
    ],
    max_tokens: 4096,
  };

  if (options.reference) {
    const dataUrl = await loadRefAsBase64(options.reference);
    body.messages[0].content.push({
      type: "image_url",
      image_url: { url: dataUrl },
    });
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
      data.error?.message || `OpenAI chat API error: ${response.status}`
    );
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("No content in chat response");

  // Extract base64 image from markdown data: URI
  const match = text.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
  if (!match) throw new Error("No base64 image found in chat response");

  const b64Data = match[0].split(",")[1];
  if (!b64Data) throw new Error("Invalid base64 data");

  const outputPath = options.output || `openai_chat_${Date.now()}.png`;
  await Bun.write(outputPath, Buffer.from(b64Data, "base64"));

  return {
    success: true,
    path: outputPath,
    provider: "openai",
    duration: 0,
  };
}

// ─── Main Generate ────────────────────────────────────────────────────

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

  const baseUrl = process.env[ENV_BASE_URL] || "https://api.openai.com";
  const model = options.model || getDefaultModel();
  const useChat = process.env[ENV_USE_CHAT] === "true";

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      let result: GenerateResult;

      if (useChat) {
        result = await generateWithChat(prompt, options, apiKey, model, baseUrl);
      } else if (options.reference && isGptImageModel(model)) {
        result = await generateWithEdits(prompt, options, apiKey, model, baseUrl);
      } else {
        result = await generateWithGenerations(prompt, options, apiKey, model, baseUrl);
      }

      result.duration = Date.now() - start;
      return result;
    } catch (err: any) {
      lastError = err;

      if (!isRetryableError(err)) {
        return {
          success: false,
          provider: "openai",
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
    provider: "openai",
    error: lastError?.message || "Max retries exhausted",
    duration: Date.now() - start,
  };
}
