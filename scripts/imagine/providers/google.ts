/**
 * google.ts — Google Imagen provider
 *
 * Uses Google Vertex AI Imagen model for image generation.
 * Supports reference-image-guided generation (inpainting/editing).
 *
 * Environment: GOOGLE_API_KEY       — Google AI Studio API key
 *              GOOGLE_PROJECT_ID    — GCP project ID (for Vertex AI)
 *              GOOGLE_LOCATION      — GCP region (default: "us-central1")
 *
 * Uses the Generative AI (Gemini-flavored) Imagen endpoint when GOOGLE_API_KEY
 * is available; falls back to Vertex AI endpoint when GOOGLE_PROJECT_ID is set.
 *
 * API Reference: https://ai.google.dev/gemini-api/docs/imagen
 *               https://cloud.google.com/vertex-ai/generative-ai/docs/image/generate-images
 */

import type { ImagineOptions, GenerateResult } from "../types";
import { ASPECT_DIMENSIONS } from "../types";

const ENV_API_KEY = "GOOGLE_API_KEY";
const ENV_PROJECT = "GOOGLE_PROJECT_ID";
const ENV_LOCATION = "GOOGLE_LOCATION";

export const name = "google";
export const envKey = ENV_API_KEY;

export async function generate(
  prompt: string,
  options: ImagineOptions
): Promise<GenerateResult> {
  const start = Date.now();

  const apiKey = process.env[ENV_API_KEY];
  const projectId = process.env[ENV_PROJECT];

  if (apiKey) {
    return generateWithAIStudio(prompt, options, apiKey, start);
  }
  if (projectId) {
    return generateWithVertexAI(prompt, options, projectId, start);
  }

  return {
    success: false,
    provider: "google",
    error: `Neither ${ENV_API_KEY} nor ${ENV_PROJECT} environment variable set`,
    duration: 0,
  };
}

// ─── AI Studio Path (simpler, recommended) ──────────────────────────

async function generateWithAIStudio(
  prompt: string,
  options: ImagineOptions,
  apiKey: string,
  start: number
): Promise<GenerateResult> {
  try {
    // Imagen 3 via Generative Language API
    // Note: At time of writing, this endpoint is the AI Studio preview
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          ...(options.reference && {
            referenceImage: await loadReferenceImage(options.reference),
          }),
          ...(options.negative && { negativePrompt: options.negative }),
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        data.error?.message || `Google API error: ${response.status}`
      );
    }

    const predictions = data.predictions;
    if (!predictions?.length) throw new Error("No predictions in response");

    // Response may be bytesBase64Encoded or a GCS URL
    let buffer: ArrayBuffer;
    if (predictions[0].bytesBase64Encoded) {
      buffer = Buffer.from(predictions[0].bytesBase64Encoded, "base64").buffer;
    } else if (predictions[0].gcsUri) {
      const imgResp = await fetch(predictions[0].gcsUri);
      buffer = await imgResp.arrayBuffer();
    } else {
      throw new Error("Unexpected response format from Google Imagen");
    }

    const outputPath = options.output || `google_${Date.now()}.png`;
    await Bun.write(outputPath, new Uint8Array(buffer));

    return {
      success: true,
      path: outputPath,
      provider: "google",
      duration: Date.now() - start,
    };
  } catch (err: any) {
    return {
      success: false,
      provider: "google",
      error: err.message,
      duration: Date.now() - start,
    };
  }
}

// ─── Vertex AI Path (enterprise) ────────────────────────────────────

async function generateWithVertexAI(
  prompt: string,
  options: ImagineOptions,
  projectId: string,
  start: number
): Promise<GenerateResult> {
  const location = process.env[ENV_LOCATION] || "us-central1";

  try {
    // Vertex AI requires OAuth2 token for authentication
    const accessToken = await getVertexAccessToken();
    if (!accessToken) {
      return {
        success: false,
        provider: "google",
        error: "Failed to obtain Vertex AI access token. Set GOOGLE_APPLICATION_CREDENTIALS.",
        duration: 0,
      };
    }

    const url =
      `https://${location}-aiplatform.googleapis.com/v1/` +
      `projects/${projectId}/locations/${location}/publishers/google/models/imagegeneration@006:predict`;

    const dims = ASPECT_DIMENSIONS[options.aspect || "1:1"] || ASPECT_DIMENSIONS["1:1"];

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: options.aspect || "1:1",
          ...(options.negative && { negativePrompt: options.negative }),
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        data.error?.message || `Vertex AI error: ${response.status}`
      );
    }

    const predictions = data.predictions;
    if (!predictions?.length) throw new Error("No predictions in response");

    let buffer: ArrayBuffer;
    if (predictions[0].bytesBase64Encoded) {
      buffer = Buffer.from(predictions[0].bytesBase64Encoded, "base64").buffer;
    } else {
      throw new Error("Unexpected Vertex AI response format");
    }

    const outputPath = options.output || `google_${Date.now()}.png`;
    await Bun.write(outputPath, new Uint8Array(buffer));

    return {
      success: true,
      path: outputPath,
      provider: "google",
      duration: Date.now() - start,
    };
  } catch (err: any) {
    return {
      success: false,
      provider: "google",
      error: err.message,
      duration: Date.now() - start,
    };
  }
}

// ─── Helpers ────────────────────────────────────────────────────────

async function loadReferenceImage(refPath: string): Promise<string> {
  const file = Bun.file(refPath);
  const buffer = await file.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

async function getVertexAccessToken(): Promise<string | null> {
  try {
    // Try to get token from gcloud CLI
    const proc = Bun.spawnSync(["gcloud", "auth", "print-access-token"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    if (proc.exitCode === 0) {
      return new TextDecoder().decode(proc.stdout).trim();
    }

    // Fallback: try Application Default Credentials flow
    // This would require a more complex OAuth2 implementation;
    // for now, just note that gcloud is the expected method.
    return null;
  } catch {
    return null;
  }
}
