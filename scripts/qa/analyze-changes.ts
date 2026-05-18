/**
 * analyze-changes.ts — git diff → affected decks + risk level
 *
 * Consumes a list of changed files (from `git diff --name-only`) and produces
 * a ChangeImpact object describing which decks are affected and at what risk level.
 *
 * The RULES table encodes domain knowledge about which source files affect which
 * decks and what QA checklist items should be run.
 *
 * Usage:
 *   bun scripts/qa/analyze-changes.ts [base-ref]
 *   echo "assets/base.css" | bun scripts/qa/analyze-changes.ts
 *
 * Programmatic:
 *   import { analyzeChanges, ChangeImpact } from "./scripts/qa/analyze-changes";
 *   const impact = analyzeChanges(["assets/base.css"]);
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { getAllDecks } from "./utils.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChangeImpact {
  /** Input: the changed file paths */
  files: string[];
  /** Output: names of affected deck directories */
  affectedDecks: string[];
  /** Whether this change touches infrastructure that affects every deck */
  allDecks: boolean;
  /** Highest risk across all matched rules */
  riskLevel: "high" | "medium" | "low";
  /** Canvas profiles to test against (at least one of "portrait" / "landscape") */
  canvasProfiles: string[];
  /** Up to 4 decks to run first (portrait priority for portrait-related changes) */
  focusDecks: string[];
  /** QA checklist items to run */
  checklist: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROOT = path.resolve(import.meta.dir, "../..");
const FULL_DECKS_DIR = path.join(ROOT, "templates", "full-decks");

// ---------------------------------------------------------------------------
// Change rules
// ---------------------------------------------------------------------------

interface ChangeRule {
  /** Regex tested against each changed file path */
  pattern: RegExp;
  /** Deck names to add, or "ALL" to mark every deck */
  decks: string[] | "ALL";
  /** Risk contributed by this rule */
  risk: "high" | "medium" | "low";
  /** Canvas profiles to test */
  profiles: string[];
  /** QA checklist items to append */
  checklist: string[];
}

const RULES: ChangeRule[] = [
  {
    pattern: /assets\/base\.css/,
    decks: "ALL",
    risk: "high",
    profiles: ["portrait", "landscape"],
    checklist: ["font-hierarchy", "whitespace", "chrome-content-boundary"],
  },
  {
    pattern: /assets\/components\.css/,
    decks: "ALL",
    risk: "high",
    profiles: ["portrait", "landscape"],
    checklist: ["font-container-ratio", "density", "grid-collapse"],
  },
  {
    pattern: /assets\/fonts\.css/,
    decks: "ALL",
    risk: "medium",
    profiles: ["portrait", "landscape"],
    checklist: ["font-hierarchy"],
  },
  {
    pattern: /assets\/base-design-chrome\.css/,
    decks: "ALL",
    risk: "high",
    profiles: ["portrait", "landscape"],
    checklist: ["chrome-content-boundary", "chrome-z-index", "chrome-position"],
  },
  {
    pattern: /assets\/designs\//,
    decks: "ALL",
    risk: "medium",
    profiles: ["portrait", "landscape"],
    checklist: ["css-loading-integrity", "font-hierarchy"],
  },
  {
    pattern: /assets\/layers\/density\//,
    decks: "ALL",
    risk: "low",
    profiles: ["portrait", "landscape"],
    checklist: ["density"],
  },
  {
    pattern: /assets\/layers\//,
    decks: "ALL",
    risk: "low",
    profiles: ["portrait", "landscape"],
    checklist: [],
  },
  {
    pattern: /scripts\/assemble\/skeleton\.ts/,
    decks: "ALL",
    risk: "high",
    profiles: ["portrait", "landscape"],
    checklist: ["css-loading-integrity", "chrome-presence"],
  },
  {
    pattern: /scripts\/assemble\/slides\.ts/,
    decks: "ALL",
    risk: "high",
    profiles: ["portrait", "landscape"],
    checklist: ["density", "whitespace", "canvas-fill"],
  },
  {
    pattern: /scripts\/assemble\/types\.ts/,
    decks: "ALL",
    risk: "medium",
    profiles: ["portrait", "landscape"],
    checklist: [],
  },
  {
    // Deck-specific changes — matched by the deckMatch logic in analyzeChanges,
    // but this rule ensures the risk floor is "low".
    pattern: /templates\/full-decks\/([^/]+)\//,
    decks: [],
    risk: "low",
    profiles: [],
    checklist: [],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Enumerate all deck directories under templates/full-decks/ that contain
 * an index.html file.
 */
// ---------------------------------------------------------------------------
// Core analysis
// ---------------------------------------------------------------------------

export function analyzeChanges(files: string[]): ChangeImpact {
  const allDecks = getAllDecks();
  const affectedSet = new Set<string>();
  let riskLevel: "high" | "medium" | "low" = "low";
  let allDeckMode = false;
  const profiles = new Set<string>();
  const checklist: string[] = [];

  for (const file of files) {
    // 1. Direct deck match from file path
    const deckMatch = file.match(/templates\/full-decks\/([^/]+)\//);
    if (deckMatch) {
      affectedSet.add(deckMatch[1]);
    }

    // 2. Rule-based matching
    for (const rule of RULES) {
      if (rule.pattern.test(file)) {
        if (rule.decks === "ALL") {
          allDeckMode = true;
        } else if (Array.isArray(rule.decks)) {
          for (const d of rule.decks) {
            affectedSet.add(d);
          }
        }

        // Escalate risk: high > medium > low
        if (rule.risk === "high") {
          riskLevel = "high";
        } else if (rule.risk === "medium" && riskLevel !== "high") {
          riskLevel = "medium";
        }

        for (const p of rule.profiles) {
          profiles.add(p);
        }
        for (const c of rule.checklist) {
          if (!checklist.includes(c)) {
            checklist.push(c);
          }
        }
      }
    }
  }

  const deckList = allDeckMode ? allDecks : [...affectedSet];

  // Focus decks: prioritize portrait for portrait-related changes
  const portraitDecks = deckList.filter(
    (d) =>
      d.startsWith("xhs-") ||
      d.includes("3x4") ||
      d.includes("portrait") ||
      d === "component-showcase",
  );
  const focusDecks =
    portraitDecks.length > 0
      ? portraitDecks.slice(0, 4)
      : deckList.slice(0, 4);

  return {
    files,
    affectedDecks: deckList,
    allDecks: allDeckMode,
    riskLevel,
    canvasProfiles:
      profiles.size > 0 ? [...profiles] : ["portrait", "landscape"],
    focusDecks,
    checklist:
      checklist.length > 0
        ? checklist
        : ["text-overflow", "occlusion", "contrast"],
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

if (import.meta.main) {
  const baseRef = process.argv[2];
  let files: string[];

  if (baseRef) {
    // git diff between baseRef and HEAD
    const proc = Bun.spawnSync(
      ["git", "diff", "--name-only", baseRef, "HEAD"],
      { cwd: ROOT },
    );
    const raw = new TextDecoder().decode(proc.stdout);
    files = raw
      .trim()
      .split("\n")
      .filter((f) => f.length > 0);
  } else {
    // Read file list from stdin (pipe mode, e.g. echo "assets/base.css" | ...)
    const raw = fs.readFileSync(0, "utf-8");
    files = raw
      .trim()
      .split("\n")
      .filter((f) => f.length > 0);
  }

  const impact = analyzeChanges(files);
  console.log(JSON.stringify(impact, null, 2));
}
