/**
 * selectors.ts — Build QA selector constants from Design manifests
 */
import { loadAllManifests } from "../assemble/manifest-loader";

// Base selectors always present regardless of design
const BASE_DECORATIVE = ["bg-glow", "bg-grid"];
const BASE_CHROME = [".chr-topbar", ".chr-footer", ".chr-page", ".chr-chip", ".chr-kicker", ".chr-sticker", ".chr-card-num"];

const BASE_TEXT = [
  "h1", "h2", "h3", "h4", "p", "li", "span",
  ".c-body", ".c-step-body", ".c-note-body", ".c-small",
  ".chr-title", ".chr-heading", ".chr-sub",
];

const BASE_CONTENT = [
  "h1", "h2", "h3", "h4", "p", "li", "img", "svg", "pre", "code",
  ".c-card", ".c-card-soft", ".c-step", ".c-kpi", ".c-row", ".c-grid",
  ".c-note", ".c-quote", ".c-badge", ".c-badge-row",
  ".c-stack", ".c-steps", ".c-divider",
  ".chr-title", ".chr-heading", ".chr-sub",
];

export interface SelectorRegistry {
  decorative: string[];
  chrome: string[];
  text: string[];
  content: string[];
}

let _cached: SelectorRegistry | null = null;

export function buildSelectorRegistry(): SelectorRegistry {
  if (_cached) return _cached;

  const manifests = loadAllManifests();
  const extraDeco = manifests.flatMap(m => m.qa.decorativeClasses);
  const extraChrome = manifests.flatMap(m => m.qa.chromeSelectors);

  _cached = {
    decorative: [...new Set([...BASE_DECORATIVE, ...extraDeco])],
    chrome: [...new Set([...BASE_CHROME, ...extraChrome])],
    text: [...BASE_TEXT],
    content: [...BASE_CONTENT],
  };
  return _cached;
}
