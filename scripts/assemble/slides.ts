/**
 * slides.ts — Slide type renderers
 *
 * Each function takes SlideData + DesignTemplate + page info,
 * returns a complete <section class="slide"> HTML string.
 */

import type { SlideData, DesignTemplate } from "./types";

interface PageContext {
  page: number;
  total: number;
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

function chromeTop(d: DesignTemplate, s: SlideData, ctx: PageContext): string {
  if (s.hideChrome) return "";
  const parts: string[] = [];
  if (s.blobs) parts.push(d.blobHTML(s.blobs));
  if (s.chip) parts.push(d.topbarHTML(s.chip, s.chipColor || "", ctx.page, ctx.total));
  return parts.join("\n    ");
}

function chromeBottom(d: DesignTemplate, s: SlideData, ctx: PageContext, right: string): string {
  if (s.hideChrome) return "";
  const left = s.subtitle || s.kicker || s.title || `slide ${ctx.page}`;
  return d.footerHTML(left.slice(0, 30), right);
}

function slideAttrs(s: SlideData, ctx: PageContext): string {
  const parts: string[] = [];
  if (ctx.page === 1) parts.push('is-active');
  if (s.center) parts.push('style="margin:auto 0;text-align:center"');
  else if (s.style) parts.push(`style="${s.style}"`);
  return parts.length ? ` class="${parts.filter(p => !p.startsWith('style')).join(' ')}"` : '';
}

// ─── Slide Renderers ──────────────────────────────────────────────────

export function renderCover(d: DesignTemplate, s: SlideData, ctx: PageContext): string {
  return `<section class="slide is-active">
    ${chromeTop(d, s, ctx)}
    <div class="${d.kickerClass}">${esc(s.kicker || "")}</div>
    <${d.titleTag} class="${d.titleClass}">${s.title || ""}</${d.titleTag}>
    ${d.dividerHTML()}
    <p class="${d.subtitleClass}">${esc(s.subtitle || "")}</p>
    ${chromeBottom(d, s, ctx, "cover")}
  </section>`;
}

export function renderSection(d: DesignTemplate, s: SlideData, ctx: PageContext): string {
  return `<section class="slide">
    ${chromeTop(d, s, ctx)}
    <div ${s.center ? 'style="margin:auto 0;text-align:center"' : 'style="margin:auto 0"'}>
      <div class="${d.kickerClass}">${esc(s.kicker || "")}</div>
      <${d.titleTag} class="${d.titleClass}">${s.title || ""}</${d.titleTag}>
      ${s.subtitle ? `<p class="${d.subtitleClass}">${esc(s.subtitle)}</p>` : ""}
    </div>
    ${chromeBottom(d, s, ctx, `section · ${s.chip || ""}`)}
  </section>`;
}

export function renderCards(d: DesignTemplate, s: SlideData, ctx: PageContext, cols: 2 | 3): string {
  const gridClass = cols === 2 ? "c-grid-2" : "c-grid-3";
  const cards = s.cards || [];
  return `<section class="slide">
    ${chromeTop(d, s, ctx)}
    <${d.titleTag === "h1" ? "h2" : "h2"} class="${d.titleClass === "chr-title" ? "chr-heading" : d.titleClass}">${s.title || ""}</${d.titleTag === "h1" ? "h2" : "h2"}>
    <div class="${gridClass}">
      ${cards.map((c) => "      " + d.cardHTML(c)).join("\n")}
    </div>
    ${chromeBottom(d, s, ctx, `content · ${cols}x${Math.ceil(cards.length / cols)}`)}
  </section>`;
}

export function renderQuote(d: DesignTemplate, s: SlideData, ctx: PageContext): string {
  return `<section class="slide">
    ${chromeTop(d, s, ctx)}
    <div class="c-card chr-hero" style="padding:4.94cqi 5.68cqi;margin-top:3.46cqi">
      ${d.quoteHTML(s.quote || "", s.quoteAttr)}
      ${d.dividerHTML()}
      <p class="${d.subtitleClass}">${esc(s.subtitle || "")}</p>
    </div>
    ${chromeBottom(d, s, ctx, "quote")}
  </section>`;
}

export function renderSteps(d: DesignTemplate, s: SlideData, ctx: PageContext): string {
  const steps = s.steps || [];
  return `<section class="slide">
    ${chromeTop(d, s, ctx)}
    <${d.titleTag === "h1" ? "h2" : "h2"} class="${d.titleClass === "chr-title" ? "chr-heading" : d.titleClass}">${s.title || ""}</${d.titleTag === "h1" ? "h2" : "h2"}>
    <div class="c-steps">
      ${steps.map((st) => "      " + d.stepHTML(st)).join("\n")}
    </div>
    ${chromeBottom(d, s, ctx, "content · steps")}
  </section>`;
}

export function renderCode(d: DesignTemplate, s: SlideData, ctx: PageContext): string {
  return `<section class="slide">
    ${chromeTop(d, s, ctx)}
    <${d.titleTag === "h1" ? "h2" : "h2"} class="${d.titleClass === "chr-title" ? "chr-heading" : d.titleClass}">${s.title || ""}</${d.titleTag === "h1" ? "h2" : "h2"}>
    ${d.codeHTML(s.code || "")}
    ${chromeBottom(d, s, ctx, "content · code")}
  </section>`;
}

export function renderThanks(d: DesignTemplate, s: SlideData, ctx: PageContext): string {
  const badges = s.badges || [];
  return `<section class="slide">
    ${chromeTop(d, s, ctx)}
    <div style="margin:auto 0;text-align:center">
      <div class="${d.kickerClass}" style="text-align:center">thanks for reading</div>
      <${d.titleTag} class="${d.titleClass}" style="font-size:160px;text-align:center">${s.title || "谢谢 · thanks"}</${d.titleTag}>
      ${d.dividerHTML() ? d.dividerHTML().replace('margin:2.47cqi 0', 'margin:24px auto') : ''}
      <p class="${d.subtitleClass}" style="margin:0 auto">${esc(s.subtitle || "")}</p>
      ${badges.length ? `
      <div style="margin-top:40px">
        ${badges.map((b) => `<span class="chr-pill">${esc(b)}</span>`).join("\n        ")}
      </div>` : ""}
    </div>
    ${chromeBottom(d, s, ctx, "end")}
  </section>`;
}

export function renderBullets(d: DesignTemplate, s: SlideData, ctx: PageContext): string {
  const items = s.bullets || [];
  return `<section class="slide">
    ${chromeTop(d, s, ctx)}
    <${d.titleTag === "h1" ? "h2" : "h2"} class="${d.titleClass === "chr-title" ? "chr-heading" : d.titleClass}">${s.title || ""}</${d.titleTag === "h1" ? "h2" : "h2"}>
    <div class="c-stack">
      ${items.map((item) => `
      <div class="c-icon-row">
        <div class="c-icon-row-icon">${esc(item.icon)}</div>
        <div class="c-icon-row-text">
          <div class="c-icon-row-title">${esc(item.title)}</div>
          <div class="c-icon-row-body">${esc(item.body)}</div>
        </div>
      </div>`).join("")}
    </div>
    ${chromeBottom(d, s, ctx, "content · bullets")}
  </section>`;
}

export function renderKpi(d: DesignTemplate, s: SlideData, ctx: PageContext): string {
  const kpis = s.kpis || [];
  return `<section class="slide">
    ${chromeTop(d, s, ctx)}
    <${d.titleTag === "h1" ? "h2" : "h2"} class="${d.titleClass === "chr-title" ? "chr-heading" : d.titleClass}">${s.title || ""}</${d.titleTag === "h1" ? "h2" : "h2"}>
    <div class="c-row">
      ${kpis.map((k) => `
      <div class="c-kpi">
        <div class="c-kpi-value">${esc(k.value)}</div>
        <div class="c-kpi-label">${esc(k.label)}</div>
        ${k.delta ? `<div class="c-kpi-delta ${k.deltaDir || "flat"}">${esc(k.delta)}</div>` : ""}
      </div>`).join("")}
    </div>
    ${chromeBottom(d, s, ctx, "content · kpi")}
  </section>`;
}

export function renderHtml(_d: DesignTemplate, s: SlideData, _ctx: PageContext): string {
  return s.html || "";
}

// ─── Router ───────────────────────────────────────────────────────────

export function renderSlide(d: DesignTemplate, s: SlideData, ctx: PageContext): string {
  switch (s.type) {
    case "cover":     return renderCover(d, s, ctx);
    case "section":   return renderSection(d, s, ctx);
    case "cards-2x2": return renderCards(d, s, ctx, 2);
    case "cards-3":   return renderCards(d, s, ctx, 3);
    case "quote":     return renderQuote(d, s, ctx);
    case "steps":     return renderSteps(d, s, ctx);
    case "code":      return renderCode(d, s, ctx);
    case "thanks":    return renderThanks(d, s, ctx);
    case "bullets":   return renderBullets(d, s, ctx);
    case "kpi":       return renderKpi(d, s, ctx);
    case "html":      return renderHtml(d, s, ctx);
    default:          return `<!-- Unknown slide type: ${(s as any).type} -->`;
  }
}
