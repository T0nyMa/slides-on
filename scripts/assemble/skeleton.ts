/**
 * skeleton.ts — Deck HTML skeleton generator
 *
 * Generates self-contained HTML with all CSS and JS inlined.
 * No external file references — single file, open anywhere.
 */

import * as fs from "fs";
import * as path from "path";
import type { DeckConfig, DesignConfig } from "./types";
import { getDesignBodyClass } from "./manifest-loader";

const ROOT = path.resolve(import.meta.dir, "../..");
const ASSETS = path.join(ROOT, "assets");


const VALID_TYPOGRAPHY = ["geometric", "editorial", "humanist", "handwritten", "technical"];
const VALID_TEXTURE = ["clean", "paper", "grid", "organic", "pixel"];
const VALID_DENSITY = ["minimal", "balanced", "dense"];

function readCSS(filename: string): string {
  const filePath = path.join(ASSETS, filename);
  if (fs.existsSync(filePath)) {
    return `<style>/* ${filename} */\n${fs.readFileSync(filePath, "utf-8").trim()}\n</style>`;
  }
  console.warn(`Warning: CSS file not found: ${filePath}`);
  return `<!-- ${filename} not found -->`;
}

function readDesignCSS(relPath: string): string {
  const filePath = relPath.startsWith("/") ? relPath : path.join(ROOT, relPath);
  if (fs.existsSync(filePath)) {
    return `<style>/* ${path.basename(filePath)} */\n${fs.readFileSync(filePath, "utf-8").trim()}\n</style>`;
  }
  console.warn(`Warning: design CSS not found: ${filePath}`);
  return `<!-- ${relPath} not found -->`;
}

function buildInlineCSS(design: string | DesignConfig): string {
  const blocks: string[] = [];

  // Always needed
  blocks.push(readCSS("fonts.css"));
  blocks.push(readCSS("base.css"));
  blocks.push(readCSS("components.css"));
  blocks.push(readCSS("editor.css"));

  if (typeof design === "string") {
    if (design.startsWith("/") || design.startsWith(".")) {
      blocks.push(readDesignCSS(design));
    } else {
      blocks.push(readCSS(`designs/${design}.css`));
    }
  } else {
    // Free-form composition
    const d = design as DesignConfig;
    // Load design CSS first (chrome styles: stickers, blobs, etc.) — theme overrides it
    if (d.design) {
      if (d.design.startsWith("/") || d.design.startsWith(".")) {
        blocks.push(readDesignCSS(d.design));
      } else {
        blocks.push(readCSS(`designs/${d.design}.css`));
      }
    }
    if (d.theme) {
      if (d.theme.startsWith("/") || d.theme.startsWith(".")) {
        blocks.push(readDesignCSS(d.theme));
      } else {
        blocks.push(readCSS(`themes/${d.theme}.css`));
      }
    }
    if (d.typography && VALID_TYPOGRAPHY.includes(d.typography)) {
      blocks.push(readCSS(`layers/typography/${d.typography}.css`));
    }
    if (d.texture && VALID_TEXTURE.includes(d.texture)) {
      blocks.push(readCSS(`layers/texture/${d.texture}.css`));
    }
    if (d.density && VALID_DENSITY.includes(d.density)) {
      blocks.push(readCSS(`layers/density/${d.density}.css`));
    }
    blocks.push(readCSS("base-design-chrome.css"));
  }

  return blocks.join("\n");
}

function readJS(filename: string): string {
  const filePath = path.join(ASSETS, filename);
  if (fs.existsSync(filePath)) {
    return `<script>/* ${filename} */\n${fs.readFileSync(filePath, "utf-8").trim()}\n</script>`;
  }
  console.warn(`Warning: JS file not found: ${filePath}`);
  return `<!-- ${filename} not found -->`;
}

function buildInlineJS(): string {
  return readJS("runtime.js") + "\n" + readJS("editor.js");
}

function getBodyClass(design: string | DesignConfig): string {
  if (typeof design === "string") {
    return getDesignBodyClass(design);
  }
  const d = design as DesignConfig;
  if (d.design) {
    return getDesignBodyClass(d.design);
  }
  return "d-composed";
}

export function renderDeck(config: DeckConfig, slidesHTML: string[], styleCSS?: string): string {
  const inlineCSS = buildInlineCSS(config.design);
  const inlineJS = buildInlineJS();
  const bodyClass = getBodyClass(config.design);

  // Deck-level style overrides (from template directory)
  let deckStyleBlock = "";
  if (styleCSS && fs.existsSync(styleCSS)) {
    deckStyleBlock = `<style>/* style.css */\n${fs.readFileSync(styleCSS, "utf-8").trim()}\n</style>\n`;
  }

  const isPortrait = config.canvas === "3:4";
  const canvasClass = isPortrait ? " portrait" : " landscape";

  const slidesStr = slidesHTML.map((html, i) => {
    if (i === 0 && !html.includes("is-active")) {
      return html.replace('<section class="slide"', '<section class="slide is-active"');
    }
    return html;
  }).join("\n\n  ");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escHtml(config.title)}</title>
${inlineCSS}
${deckStyleBlock}<style id="editor-overrides"></style>
</head>
<body class="${bodyClass}${canvasClass}">
<div class="deck">

  ${slidesStr}

</div>
${inlineJS}
</body>
</html>
`;
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
