/**
 * dashscope.ts — Alibaba DashScope / Tongyi Wanxiang (通义万象) provider
 *
 * Uses DashScope text-to-image API with wanx-v1 model.
 * Best for Chinese-language prompts and cultural context.
 *
 * Environment: DASHSCOPE_API_KEY — Alibaba Cloud DashScope API key
 *
 * API Reference: https://help.aliyun.com/document_detail/dashscope.html
 */

import type { ImagineOptions, GenerateResult } from "../types";
import { ASPECT_DIMENSIONS } from "../types";

const ENV_KEY = "DASHSCOPE_API_KEY";
const ENDPOINT = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis";

export const name = "dashscope";
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
      provider: "dashscope",
      error: `${ENV_KEY} environment variable not set`,
      duration: 0,
    };
  }

  try {
    const dims = ASPECT_DIMENSIONS[options.aspect || "1:1"] || ASPECT_DIMENSIONS["1:1"];
    // DashScope wanx-v1 supports: 1:1 (1024x1024), 16:9 (1280x720), 9:16 (720x1280)
    const size = `${dims.width}x${dims.height}`;

    const body: Record<string, any> = {
      model: "wanx-v1",
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
      // wanx-v1 does not have explicit "hd" mode; note this for the user
      console.warn("Note: DashScope wanx-v1 does not support 2k/hd quality mode; using standard.");
    }

    // Step 1: Submit task (async API)
    const response = await fetch(ENDPOINT, {
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
        data.message || data.code || `DashScope API error: ${response.status}`
      );
    }

    // Step 2: Poll for task completion
    const taskId = data.output?.task_id;
    if (!taskId) throw new Error("No task_id in DashScope response");

    const resultUrl = await pollTask(taskId, apiKey);

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

async function pollTask(taskId: string, apiKey: string): Promise<string> {
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
      throw new Error("No results in completed DashScope task");
    }
    if (data.output?.task_status === "FAILED") {
      throw new Error(`DashScope task failed: ${data.output?.message || data.message}`);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("DashScope task polling timed out");
}
