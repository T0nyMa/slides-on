/**
 * generate-plan.ts — ChangeImpact → TestPlan JSON
 *
 * Converts a ChangeImpact analysis result into a concrete test plan with
 * ordered L0 → L1 → L2 steps, estimated times, and CLI commands.
 *
 * Usage:
 *   bun scripts/qa/generate-plan.ts [base-ref]
 *
 * Programmatic:
 *   import { generatePlan, TestPlan } from "./scripts/qa/generate-plan";
 *   const plan = generatePlan(impact);
 */

import * as path from "node:path";
import { type ChangeImpact } from "./analyze-changes.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TestStep {
  layer: "L0" | "L1" | "L2";
  tool: string;
  decks: number | string[];
  estTime: string;
  command?: string;
}

export interface TestPlan {
  change: string;
  affectedDecks: [string, number];
  riskLevel: string;
  canvasProfiles: string[];
  steps: TestStep[];
  focusDecks: string[];
  focusChecklist: string[];
}

// ---------------------------------------------------------------------------
// Plan generation
// ---------------------------------------------------------------------------

export function generatePlan(impact: ChangeImpact): TestPlan {
  const deckCount = impact.affectedDecks.length;
  const steps: TestStep[] = [
    {
      layer: "L0",
      tool: "validate-slides.ts",
      decks: deckCount,
      estTime: `${Math.max(1, Math.ceil(deckCount * 0.1))}s`,
    },
    {
      layer: "L1",
      tool: "visual-qa.ts",
      decks: deckCount,
      estTime: `${Math.max(2, Math.ceil(deckCount * 2))}s`,
    },
  ];

  if (impact.riskLevel === "high") {
    const sampleDecks = impact.focusDecks.slice(0, 3);
    steps.push({
      layer: "L2",
      tool: "baseline.ts compare",
      decks: sampleDecks,
      estTime: `${sampleDecks.length * 20}s`,
      command: sampleDecks
        .map((d) => `bun scripts/qa/baseline.ts compare --deck ${d}`)
        .join(" && "),
    });
  }

  return {
    change: impact.files.join(", "),
    affectedDecks: [impact.allDecks ? "ALL" : "selected", deckCount],
    riskLevel: impact.riskLevel,
    canvasProfiles: impact.canvasProfiles,
    steps,
    focusDecks: impact.focusDecks,
    focusChecklist: impact.checklist,
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

if (import.meta.main) {
  const { analyzeChanges } = await import("./analyze-changes.js");

  const baseRef = process.argv[2] || "HEAD~1";
  const ROOT = path.resolve(import.meta.dir, "../..");

  const proc = Bun.spawnSync(["git", "diff", "--name-only", baseRef, "HEAD"], {
    cwd: ROOT,
  });
  const files = new TextDecoder()
    .decode(proc.stdout)
    .trim()
    .split("\n")
    .filter(Boolean);

  if (files.length === 0) {
    console.log("No changes detected. Nothing to QA.");
    process.exit(0);
  }

  const impact = analyzeChanges(files);
  const plan = generatePlan(impact);
  console.log(JSON.stringify(plan, null, 2));
}
