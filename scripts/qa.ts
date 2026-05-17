#!/usr/bin/env bun
// scripts/qa.ts — Unified QA CLI
//
// Usage:
//   bun scripts/qa.ts --plan              # Generate test plan from git diff
//   bun scripts/qa.ts --check             # L0 + L1 (all decks)
//   bun scripts/qa.ts --check --deck xxx  # L0 + L1 (single deck)
//   bun scripts/qa.ts --regress           # L0 + L1 + L2 (full regression)
//   bun scripts/qa.ts --baseline init     # Initialize screenshot baselines
//   bun scripts/qa.ts --baseline update   # Update baselines

import * as path from "node:path";
import * as fs from "node:fs";

const ROOT = path.resolve(import.meta.dir, "..");

interface CliArgs {
  plan?: boolean;
  check?: boolean;
  regress?: boolean;
  baseline?: string;
  deck?: string;
  help?: boolean;
}

function parseArgs(args: string[]): CliArgs {
  const opts: CliArgs = {};
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--plan": opts.plan = true; break;
      case "--check": opts.check = true; break;
      case "--regress": opts.regress = true; break;
      case "--baseline": opts.baseline = args[++i]; break;
      case "--deck": opts.deck = args[++i]; break;
      case "--help": case "-h": opts.help = true; break;
    }
  }
  return opts;
}

function getAllDecks(): string[] {
  const deckDir = path.join(ROOT, "templates", "full-decks");
  try {
    return fs.readdirSync(deckDir).filter(d => {
      const p = path.join(deckDir, d);
      try { return fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, "index.html")); }
      catch { return false; }
    });
  } catch { return []; }
}

async function runCheck(decks: string[]): Promise<{ passed: number; failed: number }> {
  let passed = 0, failed = 0;

  for (const deck of decks) {
    const slidesPath = path.join(ROOT, "templates", "full-decks", deck, "slides.json");
    let deckFailed = false;

    console.log(`\n━━━ ${deck} ━━━`);

    // L0: validate-slides.ts
    if (fs.existsSync(slidesPath)) {
      const l0 = Bun.spawnSync(["bun", path.join(ROOT, "scripts/validate-slides.ts"), "--input", slidesPath]);
      const l0out = new TextDecoder().decode(l0.stdout) + new TextDecoder().decode(l0.stderr);
      if (l0.exitCode === 0) {
        console.log(`  [L0] ✅ validate-slides.ts passed`);
      } else {
        console.log(`  [L0] ❌ validate-slides.ts failed`);
        console.log(l0out.split("\n").filter((l: string) => l.includes("❌") || l.includes("错误")).slice(0, 5).join("\n"));
        deckFailed = true;
      }
    }

    // L1: visual-qa.ts
    const htmlPath = path.join(ROOT, "templates", "full-decks", deck, "index.html");
    if (fs.existsSync(htmlPath)) {
      const l1 = Bun.spawnSync(["bun", path.join(ROOT, "scripts/visual-qa.ts"), "--input", htmlPath, "--check-only"]);
      const l1out = new TextDecoder().decode(l1.stdout);
      // Count BLOCKERs from output
      const blockerCount = (l1out.match(/❌/g) || []).length;
      if (l1.exitCode === 0 && blockerCount === 0) {
        console.log(`  [L1] ✅ visual-qa.ts passed (0 BLOCKER)`);
      } else {
        console.log(`  [L1] ❌ visual-qa.ts: ${blockerCount} BLOCKER(s)`);
        // Show first few BLOCKER lines
        const lines = l1out.split("\n");
        for (const line of lines) {
          if (line.includes("❌")) { console.log(`    ${line.trim().slice(0, 120)}`); }
        }
        deckFailed = true;
      }
    }

    if (deckFailed) failed++; else passed++;
  }

  return { passed, failed };
}

async function main() {
  const cli = parseArgs(process.argv.slice(2));

  if (cli.help || (Object.keys(cli).length === 1 && !cli.plan && !cli.check && !cli.regress && !cli.baseline)) {
    console.log(`QA Pipeline CLI

Usage:
  bun scripts/qa.ts --plan              生成 Test Plan（变更感知）
  bun scripts/qa.ts --check             快速检查 L0+L1（所有 deck）
  bun scripts/qa.ts --check --deck xxx  检查单个 deck
  bun scripts/qa.ts --regress           完整回归 L0+L1+L2（需基线）
  bun scripts/qa.ts --baseline init     建立截图基线
  bun scripts/qa.ts --baseline update   更新基线

Profiles:
  Portrait 3:4  — fill 50-85%, 3-6 comp, bottom 25% check, no px, grid ≤2 cols
  Landscape 16:9 — fill 20-85%, 2-6 comp, relaxed rules

Detection: 18 groups (text-overflow, occlusion, whitespace, spacing, contrast,
  font-hierarchy, chrome-position, chrome-presence, css-var-health, density,
  chrome-content-boundary, canvas-fill, font-unit, css-loading-integrity,
  grid-collapse, chrome-z-index, font-container-ratio, inline-row-wrap)`);
    process.exit(0);
  }

  // --plan: generate test plan
  if (cli.plan) {
    const baseIdx = process.argv.indexOf("--base");
    const baseRef = baseIdx >= 0 ? process.argv[baseIdx + 1] : "HEAD~1";
    console.log(`Analyzing changes since ${baseRef}...`);
    const proc = Bun.spawnSync(["bun", path.join(ROOT, "scripts/qa/generate-plan.ts"), baseRef]);
    console.log(new TextDecoder().decode(proc.stdout));
    process.exit(0);
  }

  // --check: run L0 + L1
  if (cli.check) {
    const decks = cli.deck ? [cli.deck] : getAllDecks();
    console.log(`\nQA Check: ${decks.length} deck(s)`);
    if (decks.length === 0) {
      console.log("No decks found.");
      process.exit(1);
    }
    const { passed, failed } = await runCheck(decks);
    console.log(`\n═══════════════════════════════════════`);
    console.log(`  ${passed + failed} decks: ✅ ${passed} passed ❌ ${failed} failed`);
    console.log(`═══════════════════════════════════════`);
    process.exit(failed > 0 ? 1 : 0);
  }

  // --regress: L0 + L1 + L2 (sample decks)
  if (cli.regress) {
    console.log("Running full regression (L0 + L1 + L2)...");
    const decks = getAllDecks();
    const { passed, failed } = await runCheck(decks);

    // L2: Screenshot regression for sample decks
    console.log(`\n━━━ L2: Screenshot Regression ━━━`);
    const portraitDecks = decks.filter(d => d.startsWith("xhs-") || d.includes("3x4"));
    const landscapeDecks = decks.filter(d => !portraitDecks.includes(d));
    const sample = [...portraitDecks.slice(0, 3), ...landscapeDecks.slice(0, 2)];

    for (const deck of sample) {
      console.log(`\n  Comparing: ${deck}`);
      const proc = Bun.spawnSync(["bun", path.join(ROOT, "scripts/qa/baseline.ts"), "compare", "--deck", deck]);
      console.log(new TextDecoder().decode(proc.stdout));
      if (proc.exitCode !== 0) {
        console.log(`  ⚠️  ${deck}: regression detected`);
      }
    }

    process.exit(failed > 0 ? 1 : 0);
  }

  // --baseline: baseline management
  if (cli.baseline) {
    const args = ["init"];
    if (cli.deck) args.push("--deck", cli.deck);
    const proc = Bun.spawnSync(["bun", path.join(ROOT, "scripts/qa/baseline.ts"), ...args], {
      stdio: ["inherit", "inherit", "inherit"],
    });
    process.exit(proc.exitCode || 0);
  }
}

main().catch(err => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
