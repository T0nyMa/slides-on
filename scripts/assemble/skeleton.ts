/**
 * skeleton.ts — Deck HTML skeleton generator
 *
 * Wraps slide HTML fragments in a complete deck document.
 */

import type { DeckConfig, DesignConfig } from "./types";

const DESIGN_BODY_CLASS: Record<string, string> = {
  "pastel-card": "d-pastel-card",
  "white-editorial": "d-white-editorial",
  "xhs-post": "d-xhs-post",
  "hermes-cyber-terminal": "d-hermes-cyber-terminal",
};

/** Valid values for each layer dimension */
const VALID_TYPOGRAPHY = ["geometric", "editorial", "humanist", "handwritten", "technical"];
const VALID_TEXTURE = ["clean", "paper", "grid", "organic", "pixel"];
const VALID_DENSITY = ["minimal", "balanced", "dense"];

/**
 * Compute asset prefix based on output path depth from project root.
 * Depth 3 (templates/full-decks/XX/index.html) → "../../../assets"
 * Depth 2 (examples/XX/index.html) → "../../assets"
 */
export function assetPrefix(depth: number): string {
  return "../".repeat(depth) + "assets";
}

const DEFAULT_DEPTH = 3; // templates/full-decks/<name>/index.html

/** Build CSS <link> tags based on design config type */
function buildDesignLinks(prefix: string, design: string | DesignConfig): { links: string; bodyClass: string } {
  if (typeof design === "string") {
    // Preset mode — single Design CSS file (backward compatible)
    const bodyClass = DESIGN_BODY_CLASS[design] || `d-${design}`;
    const designPath = design.startsWith("/") || design.startsWith(".")
      ? design
      : `${prefix}/designs/${design}.css`;
    return { links: `<link rel="stylesheet" href="${designPath}">`, bodyClass };
  }

  // Free-form composition mode — layer CSS files + base chrome
  const d = design as DesignConfig;
  const links: string[] = [];

  // Theme (color variables)
  if (d.theme) {
    const themePath = d.theme.startsWith("/") || d.theme.startsWith(".")
      ? d.theme
      : `${prefix}/themes/${d.theme}.css`;
    links.push(`<link rel="stylesheet" href="${themePath}">`);
  }

  // Typography layer
  if (d.typography && VALID_TYPOGRAPHY.includes(d.typography)) {
    links.push(`<link rel="stylesheet" href="${prefix}/layers/typography/${d.typography}.css">`);
  }

  // Texture layer
  if (d.texture && VALID_TEXTURE.includes(d.texture)) {
    links.push(`<link rel="stylesheet" href="${prefix}/layers/texture/${d.texture}.css">`);
  }

  // Density layer
  if (d.density && VALID_DENSITY.includes(d.density)) {
    links.push(`<link rel="stylesheet" href="${prefix}/layers/density/${d.density}.css">`);
  }

  // Base chrome (minimal chr-* defaults for free-form composition)
  links.push(`<link rel="stylesheet" href="${prefix}/base-design-chrome.css">`);

  const bodyClass = "d-composed"; // neutral class for free-form
  return { links: links.join("\n"), bodyClass };
}

export function renderDeck(config: DeckConfig, slidesHTML: string[], assetDepth: number = DEFAULT_DEPTH): string {
  const prefix = assetPrefix(assetDepth);
  const { links: designLinks, bodyClass } = buildDesignLinks(prefix, config.design);

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
${designLinks}
<link rel="stylesheet" href="polish.css">
<link rel="stylesheet" href="style.css">
<link rel="stylesheet" href="${prefix}/editor.css">
</head>
<body class="${bodyClass}${canvasClass}">
<div class="deck">

  ${slidesStr}

</div>
<script src="${prefix}/runtime.js"></script>
<script src="${prefix}/editor.js" defer></script>
</body>
</html>
`;
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
