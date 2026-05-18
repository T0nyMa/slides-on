/**
 * slides.ts — Slide type renderers
 *
 * Each function takes SlideData + DesignManifest + page info,
 * returns a complete <section class="slide"> HTML string.
 */

import type { SlideData, DesignManifest } from "./types";
import { renderCard, renderStep, renderCode as renderDesignCode, renderQuote as renderDesignQuote, renderTopbar, renderFooter, renderDecorations, renderDivider } from "./design-renderer";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(import.meta.dir, "../..");

interface PageContext {
  page: number;
  total: number;
  canvas: "16:9" | "3:4";
}

/** Escape HTML entities in text content, but preserve intentional HTML tags */
function esc(s: string): string {
  // If content has HTML tags, pass through as-is (caller's responsibility)
  if (/<[a-zA-Z/][^>]*>/.test(s)) return s;
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function chromeTop(m: DesignManifest, s: SlideData, ctx: PageContext): string {
  if (s.hideChrome) return "";
  const parts: string[] = [];
  if (!s.hideChrome) parts.push(renderDecorations(m, s.blobs));
  parts.push(renderTopbar(m, s.chip || "", s.chipColor || "", ctx.page, ctx.total));
  return parts.filter(Boolean).join("\n    ");
}

function chromeBottom(m: DesignManifest, s: SlideData, ctx: PageContext, right: string): string {
  if (s.hideChrome) return "";
  const left = s.subtitle || s.kicker || s.title || `slide ${ctx.page}`;
  return renderFooter(m, left.slice(0, 30), right);
}

// ─── Slide Renderers ──────────────────────────────────────────────────

export function renderCover(m: DesignManifest, s: SlideData, ctx: PageContext): string {
  const isPortrait = ctx.canvas === "3:4";
  const wrapClass = isPortrait ? "v-fill" : "";
  return `<section class="slide">
    ${chromeTop(m, s, ctx)}
    <div class="${wrapClass}" style="${isPortrait ? "display:flex;flex-direction:column;justify-content:center" : ""}">
      <div class="${m.classes.kicker}">${esc(s.kicker || "")}</div>
      <${m.classes.titleTag} class="${m.classes.title}">${s.title || ""}</${m.classes.titleTag}>
      ${renderDivider(m)}
      <p class="${m.classes.subtitle}">${esc(s.subtitle || "")}</p>
    </div>
    ${chromeBottom(m, s, ctx, "cover")}
  </section>`;
}

export function renderSection(m: DesignManifest, s: SlideData, ctx: PageContext): string {
  const isPortrait = ctx.canvas === "3:4";
  const marginClass = s.center || isPortrait ? (isPortrait ? "v-center" : "") : "";
  const style = s.center || isPortrait ? 'style="text-align:center"' : '';
  return `<section class="slide">
    ${chromeTop(m, s, ctx)}
    <div class="${marginClass}" ${style}>
      <div class="${m.classes.kicker}">${esc(s.kicker || "")}</div>
      <${m.classes.titleTag} class="${m.classes.title}">${s.title || ""}</${m.classes.titleTag}>
      ${s.subtitle ? `<p class="${m.classes.subtitle}">${esc(s.subtitle)}</p>` : ""}
    </div>
    ${chromeBottom(m, s, ctx, `section · ${s.chip || ""}`)}
  </section>`;
}

export function renderCards(m: DesignManifest, s: SlideData, ctx: PageContext, cols: 2 | 3): string {
  const gridClass = cols === 2 ? "c-grid-2" : "c-grid-3";
  const isPortrait = ctx.canvas === "3:4";
  const cards = s.cards || [];
  return `<section class="slide">
    ${chromeTop(m, s, ctx)}
    <h2 class="${m.classes.title === "chr-title" ? "chr-heading" : m.classes.title}">${s.title || ""}</h2>
    <div class="${gridClass}${isPortrait ? " v-fill" : ""}">
      ${cards.map((c) => "      " + renderCard(m, c)).join("\n")}
    </div>
    ${chromeBottom(m, s, ctx, `content · ${cols}x${Math.ceil(cards.length / cols)}`)}
  </section>`;
}

export function renderQuote(m: DesignManifest, s: SlideData, ctx: PageContext): string {
  const isPortrait = ctx.canvas === "3:4";
  return `<section class="slide">
    ${chromeTop(m, s, ctx)}
    <div class="c-card chr-hero${isPortrait ? " v-center" : ""}" style="padding:4.94cqi 5.68cqi;${isPortrait ? "" : "margin-top:3.46cqi"}">
      ${renderDesignQuote(m, s.quote || "", s.quoteAttr)}
      ${renderDivider(m)}
      <p class="${m.classes.subtitle}">${esc(s.subtitle || "")}</p>
    </div>
    ${chromeBottom(m, s, ctx, "quote")}
  </section>`;
}

export function renderSteps(m: DesignManifest, s: SlideData, ctx: PageContext): string {
  const steps = s.steps || [];
  const isPortrait = ctx.canvas === "3:4";
  const useDistribute = isPortrait && steps.length <= 4;
  return `<section class="slide">
    ${chromeTop(m, s, ctx)}
    <h2 class="${m.classes.title === "chr-title" ? "chr-heading" : m.classes.title}">${s.title || ""}</h2>
    <div class="c-steps${useDistribute ? " v-distribute" : ""}">
      ${steps.map((st) => "      " + renderStep(m, st)).join("\n")}
    </div>
    ${chromeBottom(m, s, ctx, "content · steps")}
  </section>`;
}

export function renderCode(m: DesignManifest, s: SlideData, ctx: PageContext): string {
  const isPortrait = ctx.canvas === "3:4";
  return `<section class="slide">
    ${chromeTop(m, s, ctx)}
    <h2 class="${m.classes.title === "chr-title" ? "chr-heading" : m.classes.title}">${s.title || ""}</h2>
    <div class="${isPortrait ? "v-fill" : ""}" style="overflow:auto">
      ${renderDesignCode(m, s.code || "")}
    </div>
    ${chromeBottom(m, s, ctx, "content · code")}
  </section>`;
}

export function renderThanks(m: DesignManifest, s: SlideData, ctx: PageContext): string {
  const badges = s.badges || [];
  const isPortrait = ctx.canvas === "3:4";
  const titleSize = isPortrait ? "8cqi" : "160px";
  return `<section class="slide">
    ${chromeTop(m, s, ctx)}
    <div class="${isPortrait ? "v-center" : ""}" style="text-align:center">
      <div class="${m.classes.kicker}" style="text-align:center">thanks for reading</div>
      <${m.classes.titleTag} class="${m.classes.title}" style="font-size:${titleSize};text-align:center">${s.title || "谢谢 · thanks"}</${m.classes.titleTag}>
      ${renderDivider(m)}
      <p class="${m.classes.subtitle}" style="margin:0 auto">${esc(s.subtitle || "")}</p>
      ${badges.length ? `
      <div style="margin-top:40px">
        ${badges.map((b) => `<span class="chr-pill">${esc(b)}</span>`).join("\n        ")}
      </div>` : ""}
    </div>
    ${chromeBottom(m, s, ctx, "end")}
  </section>`;
}

export function renderBullets(m: DesignManifest, s: SlideData, ctx: PageContext): string {
  const items = s.bullets || [];
  const isPortrait = ctx.canvas === "3:4";
  return `<section class="slide">
    ${chromeTop(m, s, ctx)}
    <h2 class="${m.classes.title === "chr-title" ? "chr-heading" : m.classes.title}">${s.title || ""}</h2>
    <div class="c-stack${isPortrait ? " v-fill" : ""}">
      ${items.map((item) => `
      <div class="c-icon-row">
        <div class="c-icon-row-icon">${esc(item.icon)}</div>
        <div class="c-icon-row-text">
          <div class="c-icon-row-title">${esc(item.title)}</div>
          <div class="c-icon-row-body">${esc(item.body)}</div>
        </div>
      </div>`).join("")}
    </div>
    ${chromeBottom(m, s, ctx, "content · bullets")}
  </section>`;
}

export function renderKpi(m: DesignManifest, s: SlideData, ctx: PageContext): string {
  const kpis = s.kpis || [];
  const isPortrait = ctx.canvas === "3:4";
  return `<section class="slide">
    ${chromeTop(m, s, ctx)}
    <h2 class="${m.classes.title === "chr-title" ? "chr-heading" : m.classes.title}">${s.title || ""}</h2>
    <div class="c-row${isPortrait ? " v-fill" : ""}">
      ${kpis.map((k) => `
      <div class="c-kpi">
        <div class="c-kpi-value">${esc(k.value)}</div>
        <div class="c-kpi-label">${esc(k.label)}</div>
        ${k.delta ? `<div class="c-kpi-delta ${k.deltaDir || "flat"}">${esc(k.delta)}</div>` : ""}
      </div>`).join("")}
    </div>
    ${chromeBottom(m, s, ctx, "content · kpi")}
  </section>`;
}

export function renderHtml(_m: DesignManifest, s: SlideData, _ctx: PageContext): string {
  const inner = s.html || "";
  if (inner.includes("<section")) return inner; // already wrapped
  return `<section class="slide">\n${inner}\n</section>`;
}

function renderLayout(_m: DesignManifest, s: SlideData, _ctx: PageContext): string {
  const layoutName = (s as any).layout || "blank";
  const layoutPath = path.join(ROOT, "templates", "single-page", `${layoutName}.html`);
  let inner: string;
  try {
    inner = fs.readFileSync(layoutPath, "utf-8");
  } catch {
    inner = s.html || `<!-- layout not found: ${layoutName} -->`;
  }
  if (s.slots) {
    for (const [key, val] of Object.entries(s.slots)) {
      inner = inner.replaceAll(`{{${key}}}`, val);
    }
  }
  if (inner.includes("<section")) return inner;
  return `<section class="slide">\n${inner}\n</section>`;
}

export function renderTable(m: DesignManifest, s: SlideData, ctx: PageContext): string {
  const cols = s.tableColumns || [];
  const rows = s.tableRows || [];
  const rowCount = rows.length;
  // Enable adaptive sizing at 10/12/15 rows
  const dataRowsAttr = rowCount >= 10 ? ` data-rows="${Math.min(rowCount, 15)}"` : "";

  const headerRow = `<tr>${cols.map((c) => {
    const alignClass = c.align === "right" ? "num" : c.align === "center" ? "center" : "";
    return `<th class="${alignClass}"${c.width ? ` style="width:${c.width}"` : ""}>${esc(c.header)}</th>`;
  }).join("")}</tr>`;

  const bodyRows = rows.map((row) =>
    `<tr>${row.map((cell, i) => {
      const align = cols[i]?.align;
      const alignClass = align === "right" ? "num" : align === "center" ? "center" : "";
      return `<td class="${alignClass}">${esc(cell)}</td>`;
    }).join("")}</tr>`
  ).join("\n        ");

  const headingClass = m.classes.title === "chr-title" ? "chr-heading" : m.classes.title;

  return `<section class="slide">
    ${chromeTop(m, s, ctx)}
    ${s.title ? `<h2 class="${headingClass}">${s.title}</h2>` : ""}
    <div class="c-table-wrap">
      <table class="c-table c-table-striped"${dataRowsAttr}>
        <thead>${headerRow}</thead>
        <tbody>
        ${bodyRows}
        </tbody>
      </table>
    </div>
    ${s.subtitle ? `<p class="${m.classes.subtitle}" style="margin-top:1cqi">${esc(s.subtitle)}</p>` : ""}
    ${chromeBottom(m, s, ctx, `data · ${rows.length} rows`)}
  </section>`;
}

// ─── Router ───────────────────────────────────────────────────────────

export function renderSlide(m: DesignManifest, s: SlideData, ctx: PageContext): string {
  switch (s.type) {
    case "cover":     return renderCover(m, s, ctx);
    case "section":   return renderSection(m, s, ctx);
    case "cards-2x2": return renderCards(m, s, ctx, 2);
    case "cards-3":   return renderCards(m, s, ctx, 3);
    case "quote":     return renderQuote(m, s, ctx);
    case "steps":     return renderSteps(m, s, ctx);
    case "code":      return renderCode(m, s, ctx);
    case "thanks":    return renderThanks(m, s, ctx);
    case "bullets":   return renderBullets(m, s, ctx);
    case "kpi":       return renderKpi(m, s, ctx);
    case "table":     return renderTable(m, s, ctx);
    case "html":      return renderHtml(m, s, ctx);
    case "layout":    return renderLayout(m, s, ctx);
    default:          return `<!-- Unknown slide type: ${(s as any).type} -->`;
  }
}
