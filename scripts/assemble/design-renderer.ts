/**
 * design-renderer.ts — Generic variant-based Design renderers
 *
 * Replaces designs.ts by switching on manifest.variants.*
 * Each function takes a DesignManifest + data, returns an HTML string.
 */
import type { DesignManifest, CardItem, StepItem, SlideImage } from "./types";

function p(n: number, total: number): string {
  return `${String(n).padStart(2, "0")} · ${String(total).padStart(2, "0")}`;
}
function pageDiv(n: number, total: number): string {
  return `${String(n).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
}
function pageStr(fmt: "dot" | "slash", n: number, total: number): string {
  return fmt === "slash" ? pageDiv(n, total) : p(n, total);
}

// ─── Image ──────────────────────────────────────────────────────────────

function imageStyle(m: DesignManifest): string {
  const img = m.image;
  if (!img) return "";
  const parts: string[] = [`border-radius:${img.radius}`];
  if (img.shadow && img.shadow !== "none") parts.push(`box-shadow:${img.shadow}`);
  if (img.border) parts.push(`border:${img.border}`);
  return parts.join(";");
}

function renderImage(m: DesignManifest, image: SlideImage, mode: "hero" | "background"): string {
  const fit = image.fit || "cover";
  const alt = image.alt ? ` alt="${image.alt}"` : "";
  const istyle = imageStyle(m);
  const imgTag = `<img src="${image.src}"${alt} style="width:100%;height:100%;object-fit:${fit};${istyle}">`;

  if (mode === "background") {
    return `<div class="c-image-bg">${imgTag}</div>`;
  }
  return `<div class="c-image-hero">${imgTag}</div>`;
}

function renderInlineImage(m: DesignManifest, src: string, alt?: string): string {
  const istyle = imageStyle(m);
  const altAttr = alt ? ` alt="${alt}"` : "";
  return `<div class="c-image-inline"><img src="${src}"${altAttr} style="width:100%;height:100%;object-fit:cover;${istyle}"></div>`;
}

// ─── Card ───────────────────────────────────────────────────────────────

function renderCard(m: DesignManifest, card: CardItem): string {
  const color = card.color ? ` ${card.color}` : "";
  const img = card.image ? renderInlineImage(m, card.image) : "";
  switch (m.variants.card) {
    case "editorial":
      return `<div class="c-card${color}">
        ${img}
        <div class="chr-card-label">${card.num || ""}</div>
        <div class="chr-card-main">${card.title}</div>
        <div class="chr-card-desc">${card.body}</div>
      </div>`;
    case "terminal":
      return `<div class="c-card${color}">
        ${img}
        <div class="chr-hc-lbl">${card.num || ""}</div>
        <div class="chr-hc-val">${card.title}</div>
        <div class="chr-hc-desc">${card.body}</div>
      </div>`;
    case "handdrawn":
      return `<div class="c-card">
        ${img}
        <b>${card.num ? card.num + " " : ""}${card.title}</b>
        <p class="dim">${card.body}</p>
      </div>`;
    default: // "standard"
      const num = card.num ? `<div class="chr-card-num">${card.num}</div>\n        ` : "";
      return `<div class="c-card${color}">
        ${img}${num}<h4>${card.title}</h4>
        <p>${card.body}</p>
      </div>`;
  }
}

// ─── Step ───────────────────────────────────────────────────────────────

function renderStep(m: DesignManifest, step: StepItem): string {
  const img = step.image ? renderInlineImage(m, step.image) : "";
  switch (m.variants.step) {
    case "editorial":
      return `<div class="c-step">
        <div class="c-step-num">${step.num}</div>
        ${img}
        <div class="c-step-content">
          <div class="c-step-title">${step.title}</div>
        </div>
      </div>`;
    case "card-as-step":
      return `<div class="c-card">
        ${img}
        <b>${step.num}. ${step.title}</b>
        ${step.body ? `<p class="dim">${step.body}</p>` : ""}
      </div>`;
    case "terminal":
      return `<div class="c-step">
        <div class="chr-hc-val">${step.num}</div>
        ${img}
        <div class="c-step-content">
          <div class="c-step-title">${step.title}</div>
          ${step.body ? `<div class="c-step-body">${step.body}</div>` : ""}
        </div>
      </div>`;
    default: // "standard"
      return `<div class="c-step">
        <div class="c-step-num">${step.num}</div>
        ${img}
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
    return `<div class="c-card"><pre class="chr-codebox">${code}</pre></div>`;
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
  return decorations.map(d => `<div class="${d}"></div>`).join("\n    ");
}

function renderDivider(m: DesignManifest): string {
  return m.chrome.divider ? `<div class="chr-divider"></div>` : "";
}

export { renderCard, renderStep, renderCode, renderQuote, renderTopbar, renderFooter, renderDecorations, renderDivider, renderImage, renderInlineImage };
