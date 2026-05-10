/**
 * designs.ts — Design template registry
 *
 * Each design defines how its sub-elements render: cards, chrome, typography.
 * This is the "view" layer — structural HTML patterns specific to each design.
 * The Design CSS handles colors/fonts; this file handles HTML structure.
 */

import type { DesignTemplate, CardItem, StepItem } from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────

const p = (n: number, total: number): string =>
  `${String(n).padStart(2, "0")} · ${String(total).padStart(2, "0")}`;

const pageDiv = (n: number, total: number): string =>
  `${String(n).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

// ─── pastel-card ──────────────────────────────────────────────────────

const pastelCard: DesignTemplate = {
  titleTag: "h1",
  titleClass: "chr-title",
  subtitleClass: "chr-sub",
  kickerClass: "chr-kicker",
  bodyClass: "chr-sub",

  topbarHTML(chip, chipColor, page, total) {
    const cc = chipColor ? ` ${chipColor}` : "";
    const chipHTML = chip ? `<div class="chr-chip${cc}">${chip}</div>` : "";
    return `<div class="chr-topbar">${chipHTML}<div class="chr-page">${p(page, total)}</div></div>`;
  },

  footerHTML(left, right) {
    return `<div class="chr-footer"><span>${left}</span><span>${right}</span></div>`;
  },

  blobHTML(blobs) {
    return blobs.map((b) => `<div class="chr-blob ${b}"></div>`).join("\n    ");
  },

  dividerHTML() {
    return `<div class="chr-divider"></div>`;
  },

  cardHTML(card: CardItem) {
    const color = card.color ? ` ${card.color}` : "";
    const num = card.num ? `<div class="chr-card-num">${card.num}</div>\n        ` : "";
    return `<div class="c-card${color}">
        ${num}<h4>${card.title}</h4>
        <p>${card.body}</p>
      </div>`;
  },

  cardNumHTML(num: string) {
    return `<div class="chr-card-num">${num}</div>`;
  },

  stepHTML(step: StepItem) {
    return `<div class="c-step">
        <div class="c-step-num">${step.num}</div>
        <div class="c-step-content">
          <div class="c-step-title">${step.title}</div>
          ${step.body ? `<div class="c-step-body">${step.body}</div>` : ""}
        </div>
      </div>`;
  },

  codeHTML(code: string) {
    return `<pre class="chr-codebox">${code}</pre>`;
  },

  quoteHTML(quote: string, attr?: string) {
    return `<div class="c-quote">${quote}</div>${attr ? `\n      <div class="c-quote-attr">${attr}</div>` : ""}`;
  },
};

// ─── white-editorial ──────────────────────────────────────────────────

const whiteEditorial: DesignTemplate = {
  titleTag: "h1",
  titleClass: "chr-title",
  subtitleClass: "chr-sub",
  kickerClass: "chr-kicker",
  bodyClass: "chr-sub",

  topbarHTML(chip, _chipColor, page, total) {
    const chipHTML = chip ? `<div class="chr-chip">${chip}</div>` : "";
    return `<div class="chr-topbar">${chipHTML}<div class="chr-page">${pageDiv(page, total)}</div></div>`;
  },

  footerHTML(left, right) {
    return `<div class="chr-footer"><span>${left}</span><span>${right}</span></div>`;
  },

  blobHTML(_blobs) {
    return `<div class="chr-topline"></div>`;
  },

  dividerHTML() {
    return ""; // no divider in this design
  },

  cardHTML(card: CardItem) {
    const color = card.color ? ` ${card.color}` : "";
    return `<div class="c-card${color}">
        <div class="chr-card-label">${card.num || ""}</div>
        <div class="chr-card-main">${card.title}</div>
        <div class="chr-card-desc">${card.body}</div>
      </div>`;
  },

  cardNumHTML(num: string) {
    return `<div class="chr-card-label">${num}</div>`;
  },

  stepHTML(step: StepItem) {
    return `<div class="c-step">
        <div class="c-step-num">${step.num}</div>
        <div class="c-step-content">
          <div class="c-step-title">${step.title}</div>
        </div>
      </div>`;
  },

  codeHTML(code: string) {
    return `<pre class="chr-codebox">${code}</pre>`;
  },

  quoteHTML(quote: string, attr?: string) {
    return `<div class="c-quote">${quote}</div>${attr ? `\n      <div class="c-quote-attr">${attr}</div>` : ""}`;
  },
};

// ─── xhs-post ─────────────────────────────────────────────────────────

const xhsPost: DesignTemplate = {
  titleTag: "h1",
  titleClass: "h1",       // xhs-post uses base.css classes overridden by design CSS
  subtitleClass: "lede",
  kickerClass: "lede",
  bodyClass: "lede",

  topbarHTML(_chip, _chipColor, page, total) {
    return `<div class="chr-page-dot">${p(page, total)}</div>`;
  },

  footerHTML(left, right) {
    return `<div class="chr-footer"><div>${left}</div><div>${right}</div></div>`;
  },

  blobHTML(_blobs) {
    return ""; // xhs-post uses slide::before for background gradients
  },

  dividerHTML() {
    return "";
  },

  cardHTML(card: CardItem) {
    // xhs-post cards use hand-drawn boxes with bold + dim text
    const num = card.num ? `${card.num} ` : "";
    return `<div class="c-card">
        <b style="font-size:2.72cqi">${num}${card.title}</b>
        <p class="dim" style="font-size:1.98cqi;margin-top:0.49cqi">${card.body}</p>
      </div>`;
  },

  cardNumHTML(num: string) {
    return `<span style="font-size:2.72cqi;font-weight:800">${num}</span>`;
  },

  stepHTML(step: StepItem) {
    return `<div class="c-card">
        <b style="font-size:2.72cqi">${step.num}. ${step.title}</b>
        ${step.body ? `<p class="dim" style="font-size:1.98cqi;margin-top:0.49cqi">${step.body}</p>` : ""}
      </div>`;
  },

  codeHTML(code: string) {
    // xhs-post doesn't have a code block; use base card + pre
    return `<div class="c-card"><pre style="font-size:1.85cqi;line-height:1.75;overflow:auto">${code}</pre></div>`;
  },

  quoteHTML(quote: string, attr?: string) {
    return `<div class="c-quote">${quote}</div>${attr ? `\n      <div class="c-quote-attr">${attr}</div>` : ""}`;
  },
};

// ─── Registry ─────────────────────────────────────────────────────────

export const DESIGN_TEMPLATES: Record<string, DesignTemplate> = {
  "pastel-card": pastelCard,
  "white-editorial": whiteEditorial,
  "xhs-post": xhsPost,
};

export function getDesignTemplate(name: string): DesignTemplate {
  const tpl = DESIGN_TEMPLATES[name];
  if (!tpl) throw new Error(`Unknown design: ${name}. Available: ${Object.keys(DESIGN_TEMPLATES).join(", ")}`);
  return tpl;
}
