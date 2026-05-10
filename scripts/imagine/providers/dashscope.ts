/**
 * dashscope.ts — Alibaba DashScope provider
 *
 * Supports two API modes depending on model:
 *   - Qwen-Image models: multimodal-generation (sync, messages format)
 *   - Wanx models: text2image/image-synthesis (async, task polling)
 *
 * Environment: DASHSCOPE_API_KEY — Alibaba Cloud DashScope API key
 *
 * API Reference:
 *   Qwen-Image: https://www.alibabacloud.com/help/en/model-studio/qwen-image-api
 *   Wanx:       https://help.aliyun.com/document_detail/dashscope.html
 */

import type { ImagineOptions, GenerateResult } from "../types";

const ENV_KEY = "DASHSCOPE_API_KEY";
const WANX_ENDPOINT = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis";
const QWEN_ENDPOINT = "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";

// Qwen-Image recommended resolutions (total pixels 512² – 2048²)
const QWEN_SIZES: Record<string, string> = {
  "1:1": "2048*2048",
  "16:9": "2688*1536",
  "9:16": "1536*2688",
  "4:3": "2368*1728",
  "3:4": "1728*2368",
};

export const name = "dashscope";
export const envKey = ENV_KEY;

function isQwenModel(model?: string): boolean {
  return !!(model && model.startsWith("qwen-"));
}

export async function generate(
  prompt: string,
  options: ImagineOptions
): Promise<GenerateResult> {
  const start = Date.now();

  const apiKey = process.env[ENV_KEY];
  if (!apiKey) {
    return {
      success: false,
      provider: "dashscope",
      error: `${ENV_KEY} environment variable not set`,
      duration: 0,
    };
  }

  const model = options.model || "wanx-v1";

  if (isQwenModel(model)) {
    return generateQwen(prompt, options, apiKey, model, start);
  }
  return generateWanx(prompt, options, apiKey, model, start);
}

// ─── Qwen-Image (multimodal-generation, sync) ──────────────────────────

async function generateQwen(
  prompt: string,
  options: ImagineOptions,
  apiKey: string,
  model: string,
  start: number
): Promise<GenerateResult> {
  try {
    const size = QWEN_SIZES[options.aspect || "1:1"] || QWEN_SIZES["1:1"];

    const body: Record<string, any> = {
      model,
      input: {
        messages: [
          {
            role: "user",
            content: [{ text: prompt }],
          },
        ],
      },
      parameters: {
        n: 1,
        watermark: false,
        size,
        prompt_extend: false, // don't rewrite our carefully crafted prompt
      },
    };

    if (options.negative) {
      body.parameters.negative_prompt = options.negative;
    }
    if (options.seed !== undefined) {
      body.parameters.seed = options.seed;
    }

    const response = await fetch(QWEN_ENDPOINT, {
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
        data.message || data.code || `Qwen-Image API error: ${response.status}`
      );
    }

    // Qwen-Image returns sync: output.choices[0].message.content[]
    const contents = data.output?.choices?.[0]?.message?.content;
    if (!contents?.length) {
      throw new Error(`No content in Qwen-Image response: ${JSON.stringify(data).slice(0, 200)}`);
    }

    // Find the first image URL in the response
    let resultUrl: string | null = null;
    for (const item of contents) {
      if (item.image) {
        resultUrl = item.image;
        break;
      }
    }
    if (!resultUrl) {
      throw new Error(`No image URL in Qwen-Image response`);
    }

    // Download image
    const imgResponse = await fetch(resultUrl);
    if (!imgResponse.ok) throw new Error(`Failed to download image: ${imgResponse.status}`);
    const buffer = await imgResponse.arrayBuffer();

    const outputPath = options.output || `dashscope_${Date.now()}.png`;
    await Bun.write(outputPath, new Uint8Array(buffer));

    return {
      success: true,
      path: outputPath,
      url: resultUrl,
      provider: "dashscope",
      duration: Date.now() - start,
    };
  } catch (err: any) {
    return {
      success: false,
      provider: "dashscope",
      error: err.message,
      duration: Date.now() - start,
    };
  }
}

// ─── Wanx (text2image/image-synthesis, async) ──────────────────────────

async function generateWanx(
  prompt: string,
  options: ImagineOptions,
  apiKey: string,
  model: string,
  start: number
): Promise<GenerateResult> {
  try {
    const { ASPECT_DIMENSIONS } = await import("../types");
    const dims = ASPECT_DIMENSIONS[options.aspect || "1:1"] || ASPECT_DIMENSIONS["1:1"];
    const size = `${dims.width}x${dims.height}`;

    const body: Record<string, any> = {
      model,
      input: {
        prompt,
      },
      parameters: {
        size,
        n: 1,
      },
    };

    if (options.negative) {
      body.input.negative_prompt = options.negative;
    }
    if (options.style) {
      body.parameters.style = options.style;
    }
    if (options.quality === "2k") {
      console.warn("Note: wanx-v1 does not support 2k/hd quality mode; using standard.");
    }

    // Step 1: Submit task (async)
    const response = await fetch(WANX_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        data.message || data.code || `Wanx API error: ${response.status}`
      );
    }

    // Step 2: Poll for task completion
    const taskId = data.output?.task_id;
    if (!taskId) throw new Error("No task_id in Wanx response");

    const resultUrl = await pollWanxTask(taskId, apiKey);

    // Step 3: Download image
    const imgResponse = await fetch(resultUrl);
    if (!imgResponse.ok) throw new Error(`Failed to download image: ${imgResponse.status}`);
    const buffer = await imgResponse.arrayBuffer();

    const outputPath = options.output || `dashscope_${Date.now()}.png`;
    await Bun.write(outputPath, new Uint8Array(buffer));

    return {
      success: true,
      path: outputPath,
      url: resultUrl,
      provider: "dashscope",
      duration: Date.now() - start,
    };
  } catch (err: any) {
    return {
      success: false,
      provider: "dashscope",
      error: err.message,
      duration: Date.now() - start,
    };
  }
}

async function pollWanxTask(taskId: string, apiKey: string): Promise<string> {
  const pollEndpoint = `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`;
  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(pollEndpoint, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await response.json();

    if (data.output?.task_status === "SUCCEEDED") {
      const results = data.output?.results;
      if (results?.length) return results[0].url;
      throw new Error("No results in completed Wanx task");
    }
    if (data.output?.task_status === "FAILED") {
      throw new Error(`Wanx task failed: ${data.output?.message || data.message}`);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Wanx task polling timed out");
}
