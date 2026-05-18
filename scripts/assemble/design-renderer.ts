/**
 * design-renderer.ts — Generic variant-based Design renderers
 *
 * Replaces designs.ts by switching on manifest.variants.*
 * Each function takes a DesignManifest + data, returns an HTML string.
 */
import type { DesignManifest, CardItem, StepItem } from "./types";

function p(n: number, total: number): string {
  return `${String(n).padStart(2, "0")} · ${String(total).padStart(2, "0")}`;
}
function pageDiv(n: number, total: number): string {
  return `${String(n).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
}
function pageStr(fmt: "dot" | "slash", n: number, total: number): string {
  return fmt === "slash" ? pageDiv(n, total) : p(n, total);
}

// ─── Card ───────────────────────────────────────────────────────────────

function renderCard(m: DesignManifest, card: CardItem): string {
  const color = card.color ? ` ${card.color}` : "";
  switch (m.variants.card) {
    case "editorial":
      return `<div class="c-card${color}">
        <div class="chr-card-label">${card.num || ""}</div>
        <div class="chr-card-main">${card.title}</div>
        <div class="chr-card-desc">${card.body}</div>
      </div>`;
    case "terminal":
      return `<div class="c-card${color}">
        <div class="chr-hc-lbl">${card.num || ""}</div>
        <div class="chr-hc-val">${card.title}</div>
        <div class="chr-hc-desc">${card.body}</div>
      </div>`;
    case "handdrawn":
      return `<div class="c-card">
        <b>${card.num ? card.num + " " : ""}${card.title}</b>
        <p class="dim">${card.body}</p>
      </div>`;
    default: // "standard"
      const num = card.num ? `<div class="chr-card-num">${card.num}</div>\n        ` : "";
      return `<div class="c-card${color}">
        ${num}<h4>${card.title}</h4>
        <p>${card.body}</p>
      </div>`;
  }
}

// ─── Step ───────────────────────────────────────────────────────────────

function renderStep(m: DesignManifest, step: StepItem): string {
  switch (m.variants.step) {
    case "editorial":
      return `<div class="c-step">
        <div class="c-step-num">${step.num}</div>
        <div class="c-step-content">
          <div class="c-step-title">${step.title}</div>
        </div>
      </div>`;
    case "card-as-step":
      return `<div class="c-card">
        <b>${step.num}. ${step.title}</b>
        ${step.body ? `<p class="dim">${step.body}</p>` : ""}
      </div>`;
    case "terminal":
      return `<div class="c-step">
        <div class="chr-hc-val">${step.num}</div>
        <div class="c-step-content">
          <div class="c-step-title">${step.title}</div>
          ${step.body ? `<div class="c-step-body">${step.body}</div>` : ""}
        </div>
      </div>`;
    default: // "standard"
      return `<div class="c-step">
        <div class="c-step-num">${step.num}</div>
        <div class="c-step-content">
          <div class="c-step-title">${step.title}</div>
          ${step.body ? `<div class="c-step-body">${step.body}</div>` : ""}
        </div>
      </div>`;
  }
}

// ─── Code ───────────────────────────────────────────────────────────────

function renderCode(m: DesignManifest, code: string): string {
  if (m.variants.code === "card-wrapped") {
    return `<div class="c-card"><pre style="overflow:auto">${code}</pre></div>`;
  }
  return `<pre class="chr-codebox">${code}</pre>`;
}

// ─── Quote (unified — all designs identical) ────────────────────────────

function renderQuote(m: DesignManifest, quote: string, attr?: string): string {
  return `<div class="c-quote">${quote}</div>${attr ? `\n      <div class="c-quote-attr">${attr}</div>` : ""}`;
}

// ─── Chrome ─────────────────────────────────────────────────────────────

function renderTopbar(m: DesignManifest, chip: string, chipColor: string, page: number, total: number): string {
  switch (m.chrome.topbar) {
    case "dot-badge":
      return `<div class="chr-page-dot">${pageStr(m.chrome.pageFormat, page, total)}</div>`;
    case "terminal":
      const tagHTML = chip ? `<span class="chr-hc-tag">${chip}</span>` : "";
      return `<div class="chr-topbar"><div class="dots"><span></span><span></span><span></span></div><div>${tagHTML} · ${pageStr(m.chrome.pageFormat, page, total)}</div></div>`;
    case null:
      return "";
    default: // "standard"
      const cc = chipColor ? ` ${chipColor}` : "";
      const chipHTML = chip ? `<div class="chr-chip${cc}">${chip}</div>` : "";
      return `<div class="chr-topbar">${chipHTML}<div class="chr-page">${pageStr(m.chrome.pageFormat, page, total)}</div></div>`;
  }
}

function renderFooter(m: DesignManifest, left: string, right: string): string {
  const tag = m.chrome.footerTag;
  return `<div class="chr-footer"><${tag}>${left}</${tag}><${tag}>${right}</${tag}></div>`;
}

function renderDecorations(m: DesignManifest, blobs?: string[]): string {
  const decorations = m.chrome.decorations;
  // Map blob names for pastel-card (b1, b2, b3 → chr-blob classes)
  if (blobs && blobs.length > 0 && decorations.includes("chr-blob")) {
    return blobs.map(b => `<div class="chr-blob ${b}"></div>`).join("\n    ");
  }
  return decorations.map(d => {
    if (d === "chr-topline") return `<div class="chr-topline"></div>`;
    if (d === "chr-hc-grid") return `<div class="chr-hc-grid"></div>`;
    if (d === "chr-hc-scanlines") return `<div class="chr-hc-scanlines"></div>`;
    return "";
  }).filter(Boolean).join("\n    ");
}

function renderDivider(m: DesignManifest): string {
  return m.chrome.divider ? `<div class="chr-divider"></div>` : "";
}

export { renderCard, renderStep, renderCode, renderQuote, renderTopbar, renderFooter, renderDecorations, renderDivider };
