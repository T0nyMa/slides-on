/**
 * zai.ts — Z.AI / Zhipu (智谱) CogView provider
 *
 * Uses Zhipu AI's CogView model for text-to-image generation.
 * Strong Chinese language and text-in-image rendering support.
 *
 * Environment: ZHIPU_API_KEY        — Zhipu API key
 *              ZHIPU_API_SECRET     — Optional, for JWT authentication
 *
 * API Reference: https://open.bigmodel.cn/dev/api/normal-model/cogview
 *
 * Models:
 *   - cogview-3        (standard quality, fast)
 *   - cogview-3-plus   (enhanced quality, slower, supports reference images)
 */

import type { ImagineOptions, GenerateResult } from "../types";
import { ASPECT_DIMENSIONS } from "../types";

const ENV_KEY = "ZHIPU_API_KEY";
const ENDPOINT = "https://open.bigmodel.cn/api/paas/v4/images/generations";

export const name = "zai";
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
      provider: "zai",
      error: `${ENV_KEY} environment variable not set`,
      duration: 0,
    };
  }

  try {
    const model = options.quality === "2k" ? "cogview-3-plus" : "cogview-3";
    const dims = ASPECT_DIMENSIONS[options.aspect || "1:1"] || ASPECT_DIMENSIONS["1:1"];
    const size = `${dims.width}x${dims.height}`;

    // Zhipu authentication: Bearer token with JWT
    // If ZHIPU_API_SECRET is provided, generate a JWT; otherwise use the API key directly
    const authToken = await getAuthToken(apiKey);

    const body: Record<string, any> = {
      model,
      prompt,
      n: 1,
      size,
      response_format: "url",
    };

    if (options.style) {
      body.style = options.style;
    }
    if (options.quality === "2k" && model === "cogview-3-plus") {
      body.quality = "hd";
    }

    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        data.error?.message || `Zhipu API error: ${response.status}`
      );
    }

    const images = data.data;
    if (!images?.length) throw new Error("No images in Zhipu response");

    const imageUrl = images[0].url;
    if (!imageUrl) throw new Error("No image URL in Zhipu response");

    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) throw new Error(`Failed to download image: ${imgResponse.status}`);
    const buffer = await imgResponse.arrayBuffer();

    const outputPath = options.output || `zhipu_${Date.now()}.png`;
    await Bun.write(outputPath, new Uint8Array(buffer));

    return {
      success: true,
      path: outputPath,
      url: imageUrl,
      provider: "zai",
      duration: Date.now() - start,
    };
  } catch (err: any) {
    return {
      success: false,
      provider: "zai",
      error: err.message,
      duration: Date.now() - start,
    };
  }
}

// ─── Authentication Helper ──────────────────────────────────────────

async function getAuthToken(apiKey: string): Promise<string> {
  const apiSecret = process.env["ZHIPU_API_SECRET"];
  if (!apiSecret) {
    // Simple mode: use API key directly as Bearer token
    return apiKey;
  }

  // JWT mode: generate a short-lived JWT for authentication
  try {
    const jwt = await generateJWT(apiKey, apiSecret);
    return jwt;
  } catch {
    // Fall back to simple API key
    console.warn("Warning: JWT generation failed, using API key directly.");
    return apiKey;
  }
}

async function generateJWT(apiKey: string, apiSecret: string): Promise<string> {
  // Zhipu JWT format: Header.Payload.Signature
  const header = {
    alg: "HS256",
    sign_type: "SIGN",
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    api_key: apiKey,
    exp: now + 3600, // 1 hour
    timestamp: now,
  };

  // Use Web Crypto API for HMAC-SHA256
  const encoder = new TextEncoder();
  const headerB64 = btoaUrl(JSON.stringify(header));
  const payloadB64 = btoaUrl(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const keyData = encoder.encode(apiSecret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(signingInput)
  );

  const sigB64 = btoaUrl(
    String.fromCharCode(...new Uint8Array(signature))
  );

  return `${signingInput}.${sigB64}`;
}

function btoaUrl(data: string): string {
  return Buffer.from(data)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
