import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = path.resolve(import.meta.dir, "../..");

/** Enumerate all deck directories that contain an index.html file. */
export function getAllDecks(): string[] {
  const deckDir = path.join(ROOT, "templates", "full-decks");
  try {
    return fs.readdirSync(deckDir).filter((d) => {
      const p = path.join(deckDir, d);
      try {
        return fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, "index.html"));
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
}

/** Detect canvas orientation from HTML content. */
export function isPortraitDeck(html: string): boolean {
  return /class="[^"]*portrait/.test(html) || /class='[^']*portrait/.test(html);
}

/** Get Playwright viewport for a canvas orientation. */
export function getViewport(portrait: boolean) {
  return portrait
    ? { width: 810, height: 1080 }
    : { width: 1920, height: 1080 };
}

export { ROOT };
