/**
 * skeleton.ts — Deck HTML skeleton generator
 *
 * Wraps slide HTML fragments in a complete deck document.
 */

import type { DeckConfig } from "./types";

const DESIGN_BODY_CLASS: Record<string, string> = {
  "pastel-card": "d-pastel-card",
  "white-editorial": "d-white-editorial",
  "xhs-post": "d-xhs-post",
  "hermes-cyber-terminal": "d-hermes-cyber-terminal",
};

/**
 * Compute asset prefix based on output path depth from project root.
 * Depth 3 (templates/full-decks/XX/index.html) → "../../../assets"
 * Depth 2 (examples/XX/index.html) → "../../assets"
 */
export function assetPrefix(depth: number): string {
  return "../".repeat(depth) + "assets";
}

const DEFAULT_DEPTH = 3; // templates/full-decks/<name>/index.html

export function renderDeck(config: DeckConfig, slidesHTML: string[], assetDepth: number = DEFAULT_DEPTH): string {
  const prefix = assetPrefix(assetDepth);
  const bodyClass = DESIGN_BODY_CLASS[config.design] || `d-${config.design}`;
  const designPath = config.design.startsWith("/") || config.design.startsWith(".")
    ? config.design
    : `${prefix}/designs/${config.design}.css`;

  const isPortrait = config.canvas === "3:4";
  const canvasClass = isPortrait ? " portrait" : " landscape";
  const componentsLink = `\n<link rel="stylesheet" href="${prefix}/components.css">`;

  const slidesStr = slidesHTML.map((html, i) => {
    // Ensure first slide has is-active
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
<link rel="stylesheet" href="${prefix}/fonts.css">
<link rel="stylesheet" href="${prefix}/base.css">${componentsLink}
<link rel="stylesheet" href="${designPath}">
<link rel="stylesheet" href="style.css">
<link rel="stylesheet" href="polish.css">
</head>
<body class="${bodyClass}${canvasClass}">
<div class="deck">

  ${slidesStr}

</div>
<script src="${prefix}/runtime.js"></script>
</body>
</html>
`;
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
