/**
 * build-batch.ts — Batch AI image generation from prompt files
 *
 * Uses config.ts for provider registry, defaults, and common CLI parsing.
 *
 * Batch file format (one path per line, # comments):
 *   slide-03-architecture.md
 *   slide-07-illustration.md
 *   # optional: pipe-separated archetype
 *   slide-01-cover.md | cover-metaphor
 *
 * Structured prompt mode (with --design):
 *   Uses prompt-assembler to build 3-layer structured prompts.
 *
 * Anchor Chain mode (with --anchor):
 *   Generates image 1 first (no ref) as visual anchor,
 *   then chains remaining images with --reference to image 1.
 *
 * Usage:
 *   bun scripts/imagine/build-batch.ts --batchfile prompts.txt
 *   bun scripts/imagine/build-batch.ts --dir prompts/ --design sketch-notes --anchor
 *   bun scripts/imagine/build-batch.ts --dir prompts/ --design notion --anchor --jobs 1
 */

import * as path from "path";
import * as fs from "fs";
import type { ImagineOptions, BatchJob } from "./types";
import { assemblePrompt } from "./prompt-assembler";
import {
  PROVIDERS,
  getDefaultConfig,
  selectProvider,
  supportsReferenceImage,
  parseCommonCliArgs,
  resolveConfig,
  printProviders,
  printCommonHelp,
} from "./config";

// ─── CLI Parsing ─────────────────────────────────────────────────────

interface BatchCliArgs {
  // Common (parsed by config.ts)
  provider?: string;
  model?: string;
  quality?: "normal" | "2k";
  aspect?: string;
  reference?: string;
  negative?: string;
  style?: string;
  design?: string;
  role?: "illustration" | "content-page";
  textSafe?: boolean;
  jobs?: number;
  // Batch-specific
  batchfile?: string;
  dir?: string;
  anchor?: boolean;
}

function parseArgs(args: string[]): BatchCliArgs {
  const { opts: common, remaining } = parseCommonCliArgs(args);

  const cli: BatchCliArgs = { ...common, anchor: false };
  for (let i = 0; i < remaining.length; i++) {
    switch (remaining[i]) {
      case "--batchfile":
        cli.batchfile = remaining[++i]; break;
      case "--dir":
        cli.dir = remaining[++i]; break;
      case "--anchor":
        cli.anchor = true; break;
    }
  }
  return cli;
}

function printUsage(): void {
  console.log(`Usage: bun scripts/imagine/build-batch.ts --batchfile <file> [options]
       bun scripts/imagine/build-batch.ts --dir <dir> [options]

Batch-specific options:
  --batchfile       Path to batch file (one .md prompt file per line)
  --dir             Directory of .md prompt files (processed alphabetically)
  --anchor          Enable Image-1 Anchor Chain (serial first, then chained)
  --design,   -d    Structured prompt mode: style-definition name (shared across all)
  --role            Image role: "illustration" (default) or "content-page"`);
  printCommonHelp();
}

// ─── Prompt File Discovery ───────────────────────────────────────────

interface PromptFileEntry {
  path: string;
  archetype?: string;
}

function findPromptFiles(cliArgs: BatchCliArgs): PromptFileEntry[] {
  const files: PromptFileEntry[] = [];

  if (cliArgs.dir) {
    const dirPath = path.resolve(cliArgs.dir);
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      throw new Error(`Directory not found: ${dirPath}`);
    }
    const entries = fs
      .readdirSync(dirPath)
      .filter((f) => f.endsWith(".md"))
      .sort()
      .map((f) => ({ path: path.join(dirPath, f) }));
    files.push(...entries);
  } else if (cliArgs.batchfile) {
    const filePath = path.resolve(cliArgs.batchfile);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Batch file not found: ${filePath}`);
    }
    const batchDir = path.dirname(filePath);
    const content = fs.readFileSync(filePath, "utf-8");
    for (const line of content.split("\n").map((l) => l.trim())) {
      if (!line || line.startsWith("#")) continue;
      const parts = line.split("|").map((s) => s.trim());
      const resolved = path.resolve(batchDir, parts[0]!);
      if (!fs.existsSync(resolved)) {
        console.warn(`Warning: referenced file not found, skipping: ${line}`);
        continue;
      }
      files.push({ path: resolved, archetype: parts[1] });
    }
  } else {
    throw new Error("Either --batchfile or --dir is required");
  }

  return files;
}

// ─── Prompt Loading ──────────────────────────────────────────────────

function loadPromptFromFile(
  filePath: string,
  archetype?: string,
  config?: { design?: string; role?: "illustration" | "content-page"; aspect?: string; textSafe?: boolean; quality?: "normal" | "2k" }
): { prompt: string; negative?: string } {
  let content = fs.readFileSync(filePath, "utf-8");

  // Structured prompt mode
  if (config?.design) {
    const bodyText = content
      .replace(/^#.*$/gm, "")
      .replace(/^##.*$/gm, "")
      .replace(/^###.*$/gm, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/[*_~`]+/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    const resolvedArchetype = archetype || inferArchetypeFromFile(filePath);
    const result = assemblePrompt({
      design: config.design,
      archetype: resolvedArchetype,
      role: config.role || "illustration",
      aspect: config.aspect || "3:4",
      content: bodyText.slice(0, 500),
      textSafe: config.textSafe,
      quality: config.quality || "normal",
    });

    return { prompt: result.fullPrompt, negative: result.negativePrompt };
  }

  // Legacy mode: strip markdown, return as-is
  content = content
    .replace(/^#.*$/gm, "")
    .replace(/^##.*$/gm, "")
    .replace(/^###.*$/gm, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[*_~`]+/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { prompt: content || "" };
}

function inferArchetypeFromFile(filePath: string): string | undefined {
  const name = path.basename(filePath, ".md").toLowerCase();
  if (name.includes("cover")) return "cover-metaphor";
  if (name.includes("process") || name.includes("step") || name.includes("flow")) return "horizontal-process";
  if (name.includes("contrast") || name.includes("compare") || name.includes("vs")) return "left-right-contrast";
  if (name.includes("concept") || name.includes("single")) return "single-concept";
  if (name.includes("branch") || name.includes("decision")) return "branching-map";
  if (name.includes("cycle") || name.includes("loop") || name.includes("circular")) return "circular-mechanism";
  if (name.includes("classify") || name.includes("category") || name.includes("taxonomy")) return "classification-map";
  if (name.includes("table") || name.includes("matrix")) return "matrix-table";
  if (name.includes("metaphor") || name.includes("main")) return "main-metaphor-diagram";
  if (name.includes("takeaway") || name.includes("summary") || name.includes("end")) return "takeaway";
  if (name.includes("toc")) return "cover-metaphor";
  return undefined;
}

// ─── Worker Pool ─────────────────────────────────────────────────────

async function runWithPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>
): Promise<void> {
  let index = 0;

  async function runNext(): Promise<void> {
    while (index < items.length) {
      const current = index++;
      await worker(items[current], current);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () =>
    runNext()
  );
  await Promise.all(workers);
}

// ─── Main ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const cliArgs = parseArgs(process.argv.slice(2));

  if (cliArgs.help) {
    printUsage();
    return;
  }

  try {
    const promptFileEntries = findPromptFiles(cliArgs);
    if (promptFileEntries.length === 0) {
      console.log("No prompt files found.");
      return;
    }

    // Resolve config: env defaults → CLI overrides
    const defaults = getDefaultConfig();
    const config = resolveConfig(defaults, cliArgs);

    const providerName = selectProvider(config.provider);
    const providerInfo = PROVIDERS[providerName]!;

    console.log(`Found ${promptFileEntries.length} prompt file(s), concurrency ${cliArgs.anchor ? 1 : (config.jobs ? cliArgs.jobs || 3 : 3)}`);
    if (config.design) console.log(`Design: ${config.design} | Role: ${config.role || "illustration"}`);
    if (config.model) console.log(`Model: ${config.model}`);
    if (cliArgs.anchor) console.log(`Anchor Chain: enabled (image 1 → anchor → remaining)`);
    console.log();

    const providerModule = await import(providerInfo.module);

    // Build jobs
    const jobs: BatchJob[] = promptFileEntries.map((entry) => ({
      promptFile: entry.path,
      prompt: "",
      output: path.join(path.dirname(entry.path), `${path.basename(entry.path, ".md")}.png`),
      status: "pending" as const,
    }));

    // Load prompts
    for (let i = 0; i < jobs.length; i++) {
      const entry = promptFileEntries[i];
      const { prompt, negative } = loadPromptFromFile(entry.path, entry.archetype, {
        design: config.design,
        role: config.role || "illustration",
        aspect: config.aspect,
        textSafe: config.textSafe,
        quality: config.quality || "normal",
      });
      jobs[i]!.prompt = prompt;
      if (negative && !config.negative) {
        config.negative = negative;
      }
      const preview = jobs[i]!.prompt.slice(0, 60);
      const archetypeLabel = entry.archetype ? ` [${entry.archetype}]` : "";
      console.log(`  ${path.basename(jobs[i]!.promptFile)}${archetypeLabel}: "${preview}${jobs[i]!.prompt.length > 60 ? "..." : ""}"`);
    }

    if (jobs.some((j) => !j.prompt)) {
      console.error("\nError: Some prompt files are empty.");
      process.exit(1);
    }

    console.log(`\nGenerating images...\n`);

    const startTime = Date.now();

    // ─── Anchor Chain Mode ──────────────────────────────────────────
    if (cliArgs.anchor && jobs.length > 1) {
      const anchorJob = jobs[0]!;
      anchorJob.status = "running";

      console.log(`  [1/${jobs.length}] ${path.basename(anchorJob.promptFile)}  (ANCHOR — establishing visual reference)...`);

      const anchorOptions: ImagineOptions = {
        prompt: anchorJob.prompt,
        provider: providerName,
        model: config.model,
        quality: config.quality || "normal",
        aspect: config.aspect,
        reference: config.reference,
        negative: config.negative,
        output: anchorJob.output,
        style: config.style,
      };

      const anchorResult = await providerModule.generate(anchorJob.prompt, anchorOptions);
      anchorJob.status = anchorResult.success ? "done" : "failed";
      anchorJob.result = anchorResult;

      if (!anchorResult.success || !anchorResult.path) {
        console.error(`\nAnchor image failed: ${anchorResult.error}`);
        console.error("Aborting batch — anchor image is required for consistency.");
        process.exit(1);
      }

      console.log(`  [1/${jobs.length}] ${path.basename(anchorJob.promptFile)}  OK  ${anchorResult.path}  (${anchorResult.duration}ms)`);
      console.log(`  → Using as visual anchor for remaining ${jobs.length - 1} images\n`);

      // Remaining jobs: chain with anchor reference
      const remainingJobs = jobs.slice(1);
      const anchorPath = anchorResult.path;
      const needsTextAnchor = !supportsReferenceImage(providerName);

      await runWithPool(remainingJobs, 1, async (job, poolIdx) => {
        const globalIdx = poolIdx + 1;
        job.status = "running";
        const label = `[${globalIdx + 1}/${jobs.length}]`;

        try {
          let prompt = job.prompt;
          if (needsTextAnchor) {
            prompt += `\n\nMatch the visual style, line weight, color palette, paper tone, title treatment, corner marks, and diagram density of the first image exactly. Same illustrator, same paper, same pen, same hand.`;
          }

          const options: ImagineOptions = {
            prompt,
            provider: providerName,
            model: config.model,
            quality: config.quality || "normal",
            aspect: config.aspect,
            reference: needsTextAnchor ? undefined : anchorPath,
            negative: config.negative,
            output: job.output,
            style: config.style,
          };

          const result = await providerModule.generate(prompt, options);
          job.status = result.success ? "done" : "failed";
          job.result = result;

          if (result.success) {
            console.log(`  ${label} ${path.basename(job.promptFile)}  OK  ${result.path}  (${result.duration}ms)`);
          } else {
            console.log(`  ${label} ${path.basename(job.promptFile)}  FAIL  ${result.error}`);
          }
        } catch (err: any) {
          job.status = "failed";
          job.result = { success: false, provider: providerName, error: err.message, duration: 0 };
          console.log(`  ${label} ${path.basename(job.promptFile)}  ERROR  ${err.message}`);
        }
      });

    } else {
      // Normal parallel mode
      const concurrency = cliArgs.jobs || 3;
      await runWithPool(jobs, concurrency, async (job, index) => {
        job.status = "running";
        const label = `[${index + 1}/${jobs.length}]`;

        try {
          const options: ImagineOptions = {
            prompt: job.prompt,
            provider: providerName,
            model: config.model,
            quality: config.quality || "normal",
            aspect: config.aspect,
            reference: config.reference,
            negative: config.negative,
            output: job.output,
            style: config.style,
          };

          const result = await providerModule.generate(job.prompt, options);
          job.status = result.success ? "done" : "failed";
          job.result = result;

          if (result.success) {
            console.log(`  ${label} ${path.basename(job.promptFile)}  OK  ${result.path}  (${result.duration}ms)`);
          } else {
            console.log(`  ${label} ${path.basename(job.promptFile)}  FAIL  ${result.error}`);
          }
        } catch (err: any) {
          job.status = "failed";
          job.result = { success: false, provider: providerName, error: err.message, duration: 0 };
          console.log(`  ${label} ${path.basename(job.promptFile)}  ERROR  ${err.message}`);
        }
      });
    }

    const totalDuration = Date.now() - startTime;
    const succeeded = jobs.filter((j) => j.status === "done").length;
    const failed = jobs.filter((j) => j.status === "failed").length;

    console.log(`\n${"─".repeat(50)}`);
    console.log(`Total:  ${jobs.length}`);
    console.log(`OK:     ${succeeded}`);
    console.log(`Failed: ${failed}`);
    console.log(`Time:   ${(totalDuration / 1000).toFixed(1)}s`);
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

const isMain =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("/build-batch.ts");

if (isMain) {
  main();
}
