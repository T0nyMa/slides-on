/**
 * snapshot-test.ts — Golden prompt snapshot diff tool
 *
 * Reads prompt snapshot baselines from slides-imagine/prompt-snapshots/,
 * reassembles prompts with the same parameters, and diffs against baselines.
 * Non-zero exit on unexpected differences.
 *
 * Usage:
 *   bun scripts/imagine/snapshot-test.ts --check        # verify all snapshots
 *   bun scripts/imagine/snapshot-test.ts --update       # regenerate all baselines
 */

import * as fs from "fs";
import * as path from "path";
import { assemblePrompt } from "./prompt-assembler";
import type { AssemblyParams, PromptRole } from "./prompt-assembler";

const SNAPSHOTS_DIR = path.resolve(import.meta.dir, "../../slides-imagine/prompt-snapshots");

interface SnapshotEntry {
  file: string;
  params: AssemblyParams;
}

function parseFilename(filename: string): AssemblyParams | null {
  const name = filename.replace(/\.txt$/, "");
  const parts = name.split("--");
  if (parts.length < 2) return null;

  const role = parts[0] as PromptRole;
  const design = parts[1]!;
  const archetype = parts[2] || undefined;

  return {
    design,
    role,
    archetype,
    aspect: "16:9",
    quality: "normal",
  };
}

function discoverSnapshots(): SnapshotEntry[] {
  if (!fs.existsSync(SNAPSHOTS_DIR)) return [];

  const files = fs.readdirSync(SNAPSHOTS_DIR).filter(f => f.endsWith(".txt"));
  const entries: SnapshotEntry[] = [];

  for (const file of files) {
    const params = parseFilename(file);
    if (params) {
      entries.push({ file, params });
    } else {
      console.warn(`Skipping unparseable snapshot: ${file}`);
    }
  }

  return entries;
}

function diffPrompt(expected: string, actual: string): string | null {
  if (expected === actual) return null;

  const expectedLines = expected.split("\n");
  const actualLines = actual.split("\n");
  const diff: string[] = [];

  const maxLen = Math.max(expectedLines.length, actualLines.length);
  for (let i = 0; i < maxLen; i++) {
    const e = expectedLines[i] || "(EOF)";
    const a = actualLines[i] || "(EOF)";
    if (e !== a) {
      diff.push(`Line ${i + 1}:`);
      diff.push(`  Expected: ${e}`);
      diff.push(`  Actual:   ${a}`);
      if (diff.length > 40) {
        diff.push(`  ... (truncated)`);
        break;
      }
    }
  }

  return diff.join("\n");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const mode: "check" | "update" = args.includes("--update") ? "update" : "check";

  if (mode === "update") {
    console.log("Regenerating prompt snapshots...\n");
    mkdirSyncSafe(SNAPSHOTS_DIR);

    const entries = discoverSnapshots();
    if (entries.length === 0) {
      console.log("No existing snapshots found to update. Create snapshot baselines first.");
      return;
    }

    for (const entry of entries) {
      const result = assemblePrompt(entry.params);
      fs.writeFileSync(path.join(SNAPSHOTS_DIR, entry.file), result.fullPrompt);
      console.log(`  ${entry.file} — updated`);
    }

    console.log(`\n${entries.length} snapshots updated.`);
    return;
  }

  console.log("Verifying prompt snapshots...\n");
  const entries = discoverSnapshots();

  if (entries.length === 0) {
    console.log("No snapshots found. Create baselines with --update.");
    return;
  }

  let passed = 0;
  let failed = 0;

  for (const entry of entries) {
    const expected = fs.readFileSync(path.join(SNAPSHOTS_DIR, entry.file), "utf-8").trim();
    const actual = assemblePrompt(entry.params).fullPrompt.trim();
    const diff = diffPrompt(expected, actual);

    if (diff) {
      console.log(`  FAIL: ${entry.file}`);
      console.log(diff);
      console.log();
      failed++;
    } else {
      console.log(`  PASS: ${entry.file}`);
      passed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed, ${entries.length} total.`);

  if (failed > 0) {
    process.exit(1);
  }
}

function mkdirSyncSafe(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const isMain =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("/snapshot-test.ts");

if (isMain) {
  main();
}
