/**
 * azure.ts — Azure OpenAI DALL-E provider
 *
 * Uses Azure OpenAI Service DALL-E models for image generation.
 * Supports DALL-E 3 and DALL-E 2 quality levels.
 *
 * Environment: AZURE_OPENAI_API_KEY — your Azure OpenAI key
 *              AZURE_OPENAI_ENDPOINT — e.g. "https://my-resource.openai.azure.com"
 *              AZURE_OPENAI_DEPLOYMENT — deployment name (default: "dall-e-3")
 *
 * API Reference: https://learn.microsoft.com/en-us/azure/ai-services/openai/
 */

import type { ImagineOptions, GenerateResult } from "../types";
import { ASPECT_DIMENSIONS } from "../types";

const ENV_KEY = "AZURE_OPENAI_API_KEY";
const ENV_ENDPOINT = "AZURE_OPENAI_ENDPOINT";
const ENV_DEPLOYMENT = "AZURE_OPENAI_DEPLOYMENT";

export const name = "azure";
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
      provider: "azure",
      error: `${ENV_KEY} environment variable not set`,
      duration: 0,
    };
  }

  const endpoint = process.env[ENV_ENDPOINT];
  if (!endpoint) {
    return {
      success: false,
      provider: "azure",
      error: `${ENV_ENDPOINT} environment variable not set (e.g. "https://my-resource.openai.azure.com")`,
      duration: 0,
    };
  }

  const deployment = process.env[ENV_DEPLOYMENT] || "dall-e-3";

  try {
    const dims = ASPECT_DIMENSIONS[options.aspect || "1:1"] || ASPECT_DIMENSIONS["1:1"];
    // Azure DALL-E supports: 1024x1024, 1792x1024, 1024x1792 (DALL-E 3)
    const size = `${dims.width}x${dims.height}`;
    const quality = options.quality === "2k" ? "hd" : "standard";

    const apiVersion = "2024-02-15-preview";
    const url = `${endpoint}/openai/images/generations:submit?api-version=${apiVersion}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: deployment,
        prompt,
        n: 1,
        size,
        quality,
        style: options.style || "vivid",
      }),
    });

    // Azure async operation: returns operation-location header
    if (response.status === 202) {
      const operationLocation = response.headers.get("operation-location");
      if (!operationLocation) {
        throw new Error("No operation-location header in async response");
      }
      const result = await pollAzureOperation(operationLocation, apiKey);
      return await downloadResult(result.url, options.output, start);
    }

    // Direct response
    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        data.error?.message || `Azure API error: ${response.status}`
      );
    }

    const imageUrl = data.data?.[0]?.url;
    if (!imageUrl) throw new Error("No image URL in response");

    return await downloadResult(imageUrl, options.output, start);
  } catch (err: any) {
    return {
      success: false,
      provider: "azure",
      error: err.message,
      duration: Date.now() - start,
    };
  }
}

async function pollAzureOperation(
  operationUrl: string,
  apiKey: string
): Promise<{ url: string }> {
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(operationUrl, {
      headers: { "api-key": apiKey },
    });
    const data = await response.json();

    if (data.status === "succeeded") {
      return { url: data.result?.data?.[0]?.url };
    }
    if (data.status === "failed") {
      throw new Error(`Azure operation failed: ${JSON.stringify(data.error)}`);
    }
    // Wait before polling again
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Azure operation timed out");
}

async function downloadResult(
  imageUrl: string,
  output: string | undefined,
  start: number
): Promise<GenerateResult> {
  const imgResponse = await fetch(imageUrl);
  if (!imgResponse.ok) throw new Error(`Failed to download image: ${imgResponse.status}`);

  const buffer = await imgResponse.arrayBuffer();
  const outputPath = output || `azure_${Date.now()}.png`;
  await Bun.write(outputPath, new Uint8Array(buffer));

  return {
    success: true,
    path: outputPath,
    url: imageUrl,
    provider: "azure",
    duration: Date.now() - start,
  };
}
