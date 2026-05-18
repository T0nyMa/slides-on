/**
 * manifest-loader.ts -- Load and validate DesignManifest JSON files
 */
import * as fs from "fs";
import * as path from "path";
import type { DesignManifest } from "./types";

const MANIFEST_DIR = path.join(import.meta.dir, "design-manifests");

const VALID_TOPBAR = new Set(["standard", "dot-badge", "terminal", null]);
const VALID_PAGE_FORMAT = new Set(["dot", "slash"]);
const VALID_CARD_VARIANTS = new Set(["standard", "editorial", "terminal", "handdrawn"]);
const VALID_STEP_VARIANTS = new Set(["standard", "editorial", "card-as-step", "terminal"]);
const VALID_CODE_VARIANTS = new Set(["standard", "card-wrapped"]);

function loadManifest(name: string): DesignManifest {
  const filePath = path.join(MANIFEST_DIR, `${name}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Unknown design "${name}". Design manifest not found: ${filePath}`
    );
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  const m = JSON.parse(raw) as DesignManifest;

  // Validate required fields
  if (!m.name) throw new Error(`Manifest ${name}: missing "name"`);
  if (!m.classes?.titleTag) throw new Error(`Manifest ${name}: missing classes.titleTag`);
  if (!m.chrome) throw new Error(`Manifest ${name}: missing "chrome"`);
  if (!m.variants) throw new Error(`Manifest ${name}: missing "variants"`);
  if (!m.qa) throw new Error(`Manifest ${name}: missing "qa"`);

  // Validate enum values
  if (!VALID_TOPBAR.has(m.chrome.topbar)) {
    throw new Error(`Manifest ${name}: invalid chrome.topbar "${m.chrome.topbar}"`);
  }
  if (!VALID_PAGE_FORMAT.has(m.chrome.pageFormat)) {
    throw new Error(`Manifest ${name}: invalid chrome.pageFormat "${m.chrome.pageFormat}"`);
  }
  if (!VALID_CARD_VARIANTS.has(m.variants.card)) {
    throw new Error(`Manifest ${name}: invalid variants.card "${m.variants.card}"`);
  }
  if (!VALID_STEP_VARIANTS.has(m.variants.step)) {
    throw new Error(`Manifest ${name}: invalid variants.step "${m.variants.step}"`);
  }
  if (!VALID_CODE_VARIANTS.has(m.variants.code)) {
    throw new Error(`Manifest ${name}: invalid variants.code "${m.variants.code}"`);
  }

  return m;
}

function loadAllManifests(): DesignManifest[] {
  if (!fs.existsSync(MANIFEST_DIR)) return [];
  return fs.readdirSync(MANIFEST_DIR)
    .filter(f => f.endsWith(".json"))
    .map(f => loadManifest(f.replace(".json", "")));
}

/** Get list of known design names */
function getKnownDesigns(): string[] {
  if (!fs.existsSync(MANIFEST_DIR)) return [];
  return fs.readdirSync(MANIFEST_DIR)
    .filter(f => f.endsWith(".json"))
    .map(f => f.replace(".json", ""));
}

/** Build body class from design name */
function getDesignBodyClass(name: string): string {
  const bodyClasses: Record<string, string> = {
    "pastel-card": "d-pastel-card",
    "white-editorial": "d-white-editorial",
    "xhs-post": "d-xhs-post",
    "hermes-cyber-terminal": "d-hermes-cyber-terminal",
  };
  return bodyClasses[name] || `d-${name}`;
}

export { loadManifest, loadAllManifests, getKnownDesigns, getDesignBodyClass };
