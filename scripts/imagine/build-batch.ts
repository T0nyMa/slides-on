/**
 * build-batch.ts — Batch AI image generation from prompt files
 *
 * Reads prompts from a batch file or directory of .md files,
 * generates images in parallel with configurable concurrency.
 *
 * Batch file format (one path per line, # comments):
 *   slide-03-architecture.md
 *   slide-07-illustration.md
 *   # this is a comment
 *   prompts/concept-art.md
 *
 * Each .md prompt file contains the raw prompt text (markdown stripped).
 *
 * Usage:
 *   bun scripts/imagine/build-batch.ts --batchfile prompts.txt
 *   bun scripts/imagine/build-batch.ts --batchfile prompts.txt --jobs 5
 *   bun scripts/imagine/build-batch.ts --dir prompts/
 *   bun scripts/imagine/build-batch.ts --dir prompts/ --provider openai --quality 2k
 */

import * as path from "path";
import * as fs from "fs";
import type { ImagineOptions, BatchJob, BatchResult } from "./types";

// ─── CLI Parsing ─────────────────────────────────────────────────────

interface BatchCliArgs {
  batchfile?: string;
  dir?: string;
  provider?: string;
  quality?: "normal" | "2k";
  aspect?: string;
  reference?: string;
  negative?: string;
  style?: string;
  jobs: number;
}

function parseArgs(args: string[]): BatchCliArgs {
  const opts: BatchCliArgs = { jobs: 3 };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--batchfile":
        opts.batchfile = args[++i];
        break;
      case "--dir":
        opts.dir = args[++i];
        break;
      case "--provider":
        opts.provider = args[++i];
        break;
      case "--quality":
      case "-q": {
        const v = args[++i];
        opts.quality = v === "2k" ? "2k" : "normal";
        break;
      }
      case "--aspect":
      case "-a":
        opts.aspect = args[++i];
        break;
      case "--reference":
      case "-r":
        opts.reference = args[++i];
        break;
      case "--negative":
      case "-n":
        opts.negative = args[++i];
        break;
      case "--style":
      case "-s":
        opts.style = args[++i];
        break;
      case "--jobs":
      case "-j":
        opts.jobs = parseInt(args[++i], 10);
        if (isNaN(opts.jobs) || opts.jobs < 1) opts.jobs = 3;
        break;
      case "--help":
      case "-h":
        printUsage();
        process.exit(0);
    }
  }
  return opts;
}

function printUsage(): void {
  console.log(`Usage: bun scripts/imagine/build-batch.ts --batchfile <file> [options]
       bun scripts/imagine/build-batch.ts --dir <dir> [options]

Options:
  --batchfile       Path to batch file (one .md prompt file per line)
  --dir             Directory of .md prompt files (processed alphabetically)
  --provider         Provider name for all jobs
  --quality,  -q     Quality: "normal" or "2k"
  --aspect,   -a     Aspect ratio for all jobs
  --reference, -r    Reference image for all jobs
  --negative,  -n    Negative prompt for all jobs
  --style,    -s     Style preset for all jobs
  --jobs,     -j     Max parallel jobs (default: 3)
  --help,     -h     Show this help
`);
}

// ─── Prompt File Discovery ───────────────────────────────────────────

function findPromptFiles(cliArgs: BatchCliArgs): string[] {
  if (cliArgs.dir) {
    const dirPath = path.resolve(cliArgs.dir);
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      throw new Error(`Directory not found: ${dirPath}`);
    }
    return fs
      .readdirSync(dirPath)
      .filter((f) => f.endsWith(".md"))
      .sort()
      .map((f) => path.join(dirPath, f));
  }

  if (cliArgs.batchfile) {
    const filePath = path.resolve(cliArgs.batchfile);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Batch file not found: ${filePath}`);
    }
    const batchDir = path.dirname(filePath);
    const content = fs.readFileSync(filePath, "utf-8");
    return content
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"))
      .map((l) => {
        const resolved = path.resolve(batchDir, l);
        if (!fs.existsSync(resolved)) {
          console.warn(`Warning: referenced file not found, skipping: ${l}`);
          return null;
        }
        return resolved;
      })
      .filter((f): f is string => f !== null);
  }

  throw new Error("Either --batchfile or --dir is required");
}

// ─── Prompt Loading ──────────────────────────────────────────────────

function loadPromptFromFile(filePath: string): string {
  let content = fs.readFileSync(filePath, "utf-8");
  content = content
    .replace(/^#.*$/gm, "")
    .replace(/^##.*$/gm, "")
    .replace(/^###.*$/gm, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[*_~`]+/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return content || "";
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

  try {
    const promptFiles = findPromptFiles(cliArgs);
    if (promptFiles.length === 0) {
      console.log("No prompt files found.");
      return;
    }

    console.log(`Found ${promptFiles.length} prompt file(s), max ${cliArgs.jobs} parallel job(s):\n`);

    const jobs: BatchJob[] = promptFiles.map((f) => ({
      promptFile: f,
      prompt: "",
      output: path.join(path.dirname(f), `${path.basename(f, ".md")}.png`),
      status: "pending" as const,
    }));

    // Phase 1: Load all prompts
    for (const job of jobs) {
      job.prompt = loadPromptFromFile(job.promptFile);
      const preview = job.prompt.slice(0, 60);
      console.log(`  ${path.basename(job.promptFile)}: "${preview}${job.prompt.length > 60 ? "..." : ""}"`);
    }

    if (jobs.some((j) => !j.prompt)) {
      console.error("\nError: Some prompt files are empty.");
      process.exit(1);
    }

    console.log(`\nGenerating images...\n`);

    const startTime = Date.now();

    // Phase 2: Generate in parallel
    await runWithPool(jobs, cliArgs.jobs, async (job, index) => {
      job.status = "running";
      const label = `[${index + 1}/${jobs.length}]`;

      try {
        const options: ImagineOptions = {
          prompt: job.prompt,
          provider: cliArgs.provider,
          quality: cliArgs.quality || "normal",
          aspect: cliArgs.aspect,
          reference: cliArgs.reference,
          negative: cliArgs.negative,
          output: job.output,
          style: cliArgs.style,
        };

        // Import main to reuse provider selection + generation logic
        const { generate } = await import("./main");
        // We need direct access to provider module, so we'll use the main flow
        // By importing and calling the core generate function directly

        // Instead, dynamically import the provider
        const providerName = cliArgs.provider || "openai";

        // Route to provider
        const providerMap: Record<string, string> = {
          azure: "./providers/azure",
          dashscope: "./providers/dashscope",
          google: "./providers/google",
          jimeng: "./providers/jimeng",
          minimax: "./providers/minimax",
          openai: "./providers/openai",
          openrouter: "./providers/openrouter",
          replicate: "./providers/replicate",
          seedream: "./providers/seedream",
          zai: "./providers/zai",
        };

        const modulePath = providerMap[providerName];
        if (!modulePath) {
          throw new Error(`Unknown provider: ${providerName}`);
        }
        const providerModule = await import(modulePath);
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
        job.result = {
          success: false,
          provider: cliArgs.provider || "unknown",
          error: err.message,
          duration: 0,
        };
        console.log(`  ${label} ${path.basename(job.promptFile)}  ERROR  ${err.message}`);
      }
    });

    const totalDuration = Date.now() - startTime;
    const succeeded = jobs.filter((j) => j.status === "done").length;
    const failed = jobs.filter((j) => j.status === "failed").length;

    // Summary
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
