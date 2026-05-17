/**
 * visual-qa.ts — Unified visual quality engine (Playwright)
 *
 * Unified visual QA engine — detects all issues in live browser context.
 * All detection runs inside Playwright via page.evaluate for accuracy.
 *
 * Detection groups:
 *   1. Text overflow      — scrollHeight > clientHeight (BLOCKER)
 *   2. Element occlusion  — rect intersection (BLOCKER/WARN)
 *   3. Whitespace         — area coverage + quadrant balance (BLOCKER/WARN)
 *   4. Spacing consistency — same-type element gap variance (WARN/INFO)
 *   5. Contrast           — getComputedStyle text vs ancestor bg (BLOCKER/WARN)
 *   6. Font hierarchy     — rendered size progression + cross-slide consistency (BLOCKER/WARN/INFO)
 *   7. Chrome position    — topbar/footer Y consistency (WARN) [migrated]
 *   8. Chrome presence    — topbar/footer per-slide presence (WARN) [migrated]
 *   9. CSS var health     — critical vars defined (BLOCKER) [migrated]
 *  10. Component density  — max components per slide (WARN) [migrated]
 *  11. Chrome-content boundary — topbar/footer overlap with content (BLOCKER)
 *  12. Canvas fill         — portrait bottom emptiness ratio (BLOCKER/WARN)
 *
 * Usage:
 *   bun scripts/visual-qa.ts --input index.html
 *   bun scripts/visual-qa.ts --input index.html --check-only
 *   bun scripts/visual-qa.ts --input index.html --report report.json
 */

import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";
import { detectCanvas, PROFILES, type CanvasProfile } from "./qa/profiles.js";

// ─── Types ──────────────────────────────────────────────────────────────

type Severity = "BLOCKER" | "WARN" | "INFO";

interface Issue {
  group: string;
  severity: Severity;
  slide: number;
  element: string;
  message: string;
  fix?: string;
}

interface QAReport {
  total: number;
  blockers: number;
  warns: number;
  infos: number;
  issues: Issue[];
}

// ─── CLI ────────────────────────────────────────────────────────────────

interface CliArgs {
  input?: string;
  checkOnly?: boolean;
  report?: string;
}

function parseArgs(args: string[]): CliArgs {
  const opts: CliArgs = {};
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--input": case "-i": opts.input = args[++i]; break;
      case "--check-only": opts.checkOnly = true; break;
      case "--report": case "-r": opts.report = args[++i]; break;
      case "--help": case "-h":
        console.log(`Usage: bun scripts/visual-qa.ts --input index.html [--check-only] [--report report.json]

Unified visual QA engine. Runs all checks inside Playwright for accuracy.

Options:
  --input, -i     Path to index.html
  --check-only    Report only, do not modify HTML
  --report, -r    Write JSON report to file

Detection groups:
  1. Text overflow       BLOCKER   scrollHeight > clientHeight
  2. Element occlusion   BLOCKER   rect intersection > 10%
  3. Whitespace          WARN      area fill < 15% or > 85%
  4. Spacing consistency WARN      same-type gap variance > 50%
  5. Contrast            BLOCKER   WCAG AA text vs background
  6. Font hierarchy      WARN      size progression violations
  7. Chrome position     WARN      Y pos drift across slides
  8. Chrome presence     WARN      missing topbar/footer
  9. CSS var health      BLOCKER   critical vars undefined
 10. Component density   WARN      too many components per slide`);
        process.exit(0);
    }
  }
  return opts;
}

// ─── Color utilities ────────────────────────────────────────────────────

function parseRGBString(rgb: string): [number, number, number] | null {
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  return [parseInt(m[1]!), parseInt(m[2]!), parseInt(m[3]!)];
}

function hexToRgb(hex: string): [number, number, number] | null {
  hex = hex.replace(/^#/, "").trim();
  if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
  if (hex.length !== 6) return null;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return [r, g, b];
}

function relativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const l1 = relativeLuminance(...rgb1);
  const l2 = relativeLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function adjustColorForContrast(rgb: [number, number, number], bgLuminance: number): string {
  const darkBg = bgLuminance < 0.5;
  const ratio = darkBg ? 1.4 : 0.6;
  const adjusted = rgb.map(c => Math.round(Math.min(255, Math.max(0, c * ratio))));
  return `#${adjusted.map(c => c.toString(16).padStart(2, "0")).join("")}`;
}

// ─── Browser helpers ────────────────────────────────────────────────────

async function loadPage(htmlPath: string) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle" });
  await page.waitForSelector(".slide", { timeout: 5000 });
  await page.evaluate("window.__name = function(t) { return t; }");
  return { browser, page };
}

async function getSlideCount(page: any): Promise<number> {
  return page.evaluate(() => document.querySelectorAll(".deck > .slide").length);
}

async function activateSlide(page: any, index: number): Promise<void> {
  await page.evaluate((i: number) => {
    const slides = document.querySelectorAll(".deck > .slide");
    slides.forEach((s: Element) => s.classList.remove("is-active"));
    slides[i]?.classList.add("is-active");
  }, index);
  await page.waitForTimeout(150);
}

function isPortrait(html: string): boolean {
  return detectCanvas(html) === "portrait";
}

// ─── Shared constants ───────────────────────────────────────────────────

const DECORATIVE_CLASSES = [
  "chr-blob", "bg-glow", "bg-grid", "chr-hc-grid",
  "chr-hc-scanlines", "chr-hc-vignette",
];

const CHROME_SELECTORS = [
  ".chr-topbar", ".chr-footer", ".chr-page", ".chr-page-dot",
  ".chr-chip", ".chr-sticker", ".chr-kicker",
].join(", ");

const TEXT_SELECTORS = [
  "h1", "h2", "h3", "h4", "p", "li", "span",
  ".c-card", ".c-card-soft", ".c-step", ".c-kpi",
  ".c-note", ".c-quote", ".c-badge",
  ".chr-title", ".chr-heading", ".chr-sub",
].join(", ");

const CONTENT_SELECTORS = [
  "h1", "h2", "h3", "h4", "p", "li", "img", "svg", "pre", "code",
  ".c-card", ".c-card-soft", ".c-step", ".c-kpi", ".c-row", ".c-grid",
  ".c-note", ".c-quote", ".c-badge", ".c-badge-row",
  ".c-stack", ".c-steps", ".c-divider",
  ".chr-title", ".chr-heading", ".chr-sub",
].join(", ");

// ─── Group 1: Text overflow ─────────────────────────────────────────────

async function checkTextOverflow(page: any, slideIndex: number): Promise<Issue[]> {
  return page.evaluate((args: { idx: number; selectors: string }) => {
    const slide = document.querySelector(".deck > .slide.is-active");
    if (!slide) return [];
    const issues: any[] = [];

    for (const el of slide.querySelectorAll(args.selectors)) {
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;

      const rect = (el as HTMLElement).getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;

      if (style.overflow === "visible" && style.overflowX === "visible"
          && style.overflowY === "visible") continue;

      const text = (el as HTMLElement).innerText?.trim();
      if (!text || text.length < 2) continue;

      const overflowY = (el as HTMLElement).scrollHeight - (el as HTMLElement).clientHeight;
      const overflowX = (el as HTMLElement).scrollWidth - (el as HTMLElement).clientWidth;

      const tag = el.tagName.toLowerCase();
      const cls = el.getAttribute("class")?.split(" ").slice(0, 2).join(".") || "";
      const label = cls ? `${tag}.${cls}` : tag;

      const hasLineClamp = style.webkitLineClamp && style.webkitLineClamp !== "none";

      if (overflowY > 2) {
        issues.push({
          group: "text-overflow",
          severity: hasLineClamp ? "INFO" : "BLOCKER",
          slide: args.idx + 1,
          element: label,
          message: hasLineClamp
            ? `文字被 line-clamp 截断，实际内容超出 ${overflowY}px`
            : `文字纵向溢出容器 ${overflowY}px`,
          overflowPx: overflowY,
          fontSize: parseFloat(style.fontSize),
          clientHeight: (el as HTMLElement).clientHeight,
          scrollHeight: (el as HTMLElement).scrollHeight,
        });
      }

      if (overflowX > 2) {
        issues.push({
          group: "text-overflow",
          severity: "BLOCKER",
          slide: args.idx + 1,
          element: label,
          message: `文字横向溢出容器 ${overflowX}px`,
        });
      }
    }
    return issues;
  }, { idx: slideIndex, selectors: TEXT_SELECTORS });
}

// ─── Group 2: Element occlusion + boundary overflow ──────────────────────

/** Occlusion check: content × content, chrome × content, and boundary overflow */
async function checkOcclusion(page: any, slideIndex: number): Promise<Issue[]> {
  return page.evaluate((args: { idx: number; contentSel: string; chromeSel: string; decoClasses: string[] }) => {
    const slide = document.querySelector(".deck > .slide.is-active");
    if (!slide) return [];
    const slideRect = slide.getBoundingClientRect();
    const issues: any[] = [];

    // Collect content elements + chrome elements separately
    interface ElInfo { rect: DOMRect; area: number; label: string; isChrome: boolean; _el: Element; }
    const contentEls: ElInfo[] = [];
    const chromeEls: ElInfo[] = [];

    const collect = (sel: string, isChrome: boolean) => {
      for (const el of slide.querySelectorAll(sel)) {
        const cls = el.getAttribute("class") || "";
        if (args.decoClasses.some(c => cls.includes(c))) continue;
        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") continue;
        if (!isChrome && style.pointerEvents === "none" &&
            (style.position === "absolute" || style.position === "fixed")) continue;
        if (parseFloat(style.opacity) < 0.1) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width < 5 || rect.height < 5) continue;
        const tag = el.tagName.toLowerCase();
        const clsShort = cls.split(" ").slice(0, 2).join(".") || "";
        (isChrome ? chromeEls : contentEls).push({
          rect, area: rect.width * rect.height,
          label: clsShort ? `${tag}.${clsShort}` : tag, isChrome, _el: el,
        });
      }
    };
    collect(args.contentSel, false);
    // Chrome: skip elements already in contentEls (avoid self-overlap from selector overlap)
    const contentElSet = new Set(contentEls.map(e => e._el));
    collect(args.chromeSel, true);
    // Remove chrome entries that are already counted as content
    for (let i = chromeEls.length - 1; i >= 0; i--) {
      if (contentElSet.has(chromeEls[i]!._el)) chromeEls.splice(i, 1);
    }

    const isAncestor = (a: ElInfo, b: ElInfo) =>
      a._el.contains(b._el) || b._el.contains(a._el);

    // ── 1. Content × Content overlap ──
    for (let i = 0; i < contentEls.length; i++) {
      for (let j = i + 1; j < contentEls.length; j++) {
        if (isAncestor(contentEls[i]!, contentEls[j]!)) continue;
        const a = contentEls[i]!.rect, b = contentEls[j]!.rect;
        const ox = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
        const oy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        if (ox * oy === 0) continue;
        const ratio = (ox * oy) / Math.min(contentEls[i]!.area, contentEls[j]!.area);
        if (ratio > 0.1) {
          issues.push({ group: "occlusion",
            severity: ratio > 0.3 ? "BLOCKER" : "WARN", slide: args.idx + 1,
            element: `${contentEls[i]!.label} × ${contentEls[j]!.label}`,
            message: `内容元素遮挡 ${(ratio * 100).toFixed(0)}%` });
        }
      }
    }

    // ── 2. Chrome × Content overlap ──
    for (const chrome of chromeEls) {
      for (const content of contentEls) {
        if (isAncestor(chrome, content)) continue;
        const ox = Math.max(0, Math.min(chrome.rect.right, content.rect.right) - Math.max(chrome.rect.left, content.rect.left));
        const oy = Math.max(0, Math.min(chrome.rect.bottom, content.rect.bottom) - Math.max(chrome.rect.top, content.rect.top));
        if (ox * oy === 0) continue;
        const ratio = (ox * oy) / Math.min(chrome.area, content.area);
        if (ratio > 0.15) {
          issues.push({ group: "occlusion",
            severity: "BLOCKER", slide: args.idx + 1,
            element: `${chrome.label} ⇄ ${content.label}`,
            message: `Chrome 遮挡内容 ${(ratio * 100).toFixed(0)}%（交叉 ${Math.round(ox*oy)}px²），检查定位` });
        }
      }
    }

    // ── 3. Boundary overflow — elements extending beyond slide edges ──
    const allEls = [...contentEls, ...chromeEls];
    for (const el of allEls) {
      const r = el.rect;
      const dirs: string[] = [];
      if (r.left < slideRect.left - 2) dirs.push(`左溢出 ${Math.round(slideRect.left - r.left)}px`);
      if (r.right > slideRect.right + 2) dirs.push(`右溢出 ${Math.round(r.right - slideRect.right)}px`);
      if (r.top < slideRect.top - 2) dirs.push(`上溢出 ${Math.round(slideRect.top - r.top)}px`);
      if (r.bottom > slideRect.bottom + 2) dirs.push(`下溢出 ${Math.round(r.bottom - slideRect.bottom)}px`);
      if (dirs.length > 0) {
        const isChrome = el.isChrome;
        issues.push({ group: "occlusion",
          severity: isChrome ? "BLOCKER" : "BLOCKER", slide: args.idx + 1,
          element: el.label,
          message: `${isChrome ? "Chrome" : "内容"}元素溢出 slide 边界（${dirs.join("，")}），可能被 overflow:hidden 裁切` });
      }
    }

    return issues;
  }, { idx: slideIndex, contentSel: CONTENT_SELECTORS, chromeSel: CHROME_SELECTORS, decoClasses: DECORATIVE_CLASSES });
}

// ─── Group 3: Whitespace ────────────────────────────────────────────────

async function checkWhitespace(page: any, slideIndex: number, profile: CanvasProfile): Promise<Issue[]> {
  return page.evaluate((args: { idx: number; selectors: string; decoClasses: string[]; profile: CanvasProfile }) => {
    const slide = document.querySelector(".deck > .slide.is-active");
    if (!slide) return [];

    const slideRect = slide.getBoundingClientRect();
    const slideW = slideRect.width;
    const slideH = slideRect.height;
    const slideArea = slideW * slideH;
    if (slideArea === 0) return [];

    interface ContentEl { rect: DOMRect; tag: string; cls: string; }
    const items: ContentEl[] = [];
    for (const el of slide.querySelectorAll(args.selectors)) {
      const cls = el.getAttribute("class") || "";
      if (args.decoClasses.some(c => cls.includes(c))) continue;
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;
      if (style.pointerEvents === "none" &&
          (style.position === "absolute" || style.position === "fixed")) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 5 || rect.height < 5) continue;
      if (rect.left >= slideRect.right || rect.right <= slideRect.left) continue;
      items.push({ rect, tag: el.tagName.toLowerCase(), cls });
    }

    if (items.length === 0) return [];

    // ── 1. Grid coverage + quadrant balance (existing) ──
    const GRID = 200;
    const cellW = slideW / GRID;
    const cellH = slideH / GRID;
    const covered = new Uint8Array(GRID * GRID);
    let contentTop = slideH, contentBottom = 0, contentLeft = slideW, contentRight = 0;

    for (const { rect } of items) {
      const x1 = Math.max(0, Math.floor((rect.left - slideRect.left) / cellW));
      const x2 = Math.min(GRID - 1, Math.floor((rect.right - slideRect.left) / cellW));
      const y1 = Math.max(0, Math.floor((rect.top - slideRect.top) / cellH));
      const y2 = Math.min(GRID - 1, Math.floor((rect.bottom - slideRect.top) / cellH));
      for (let y = y1; y <= y2; y++)
        for (let x = x1; x <= x2; x++)
          covered[y * GRID + x] = 1;
      if (rect.top < contentTop) contentTop = rect.top;
      if (rect.bottom > contentBottom) contentBottom = rect.bottom;
      if (rect.left < contentLeft) contentLeft = rect.left;
      if (rect.right > contentRight) contentRight = rect.right;
    }

    const totalCovered = covered.reduce((a, b) => a + b, 0);
    const fillPercent = Math.round((totalCovered / (GRID * GRID)) * 100);

    const half = GRID / 2;
    const quadrantFills: number[] = [];
    for (const [qy, qx] of [[0, 0], [0, half], [half, 0], [half, half]]) {
      let count = 0;
      for (let y = qy; y < qy + half; y++)
        for (let x = qx; x < qx + half; x++)
          count += covered[y * GRID + x]!;
      quadrantFills.push(count / (half * half));
    }
    const maxQ = Math.max(...quadrantFills);
    const minQ = Math.min(...quadrantFills);

    const issues: any[] = [];

    // ── Fill percent ──
    const thresholdLow = args.profile.fillMin * 100;
    const thresholdWarn = Math.min(args.profile.fillMin + 0.15, 0.50) * 100;
    if (fillPercent < thresholdLow) {
      issues.push({ group: "whitespace", severity: "BLOCKER", slide: args.idx + 1,
        element: ".slide", message: `填充率仅 ${fillPercent}%（< ${thresholdLow}%），内容严重不足` });
    } else if (fillPercent < thresholdWarn) {
      issues.push({ group: "whitespace", severity: "WARN", slide: args.idx + 1,
        element: ".slide", message: `填充率 ${fillPercent}%（< ${thresholdWarn}%），内容稀疏` });
    } else if (fillPercent > 85) {
      issues.push({ group: "whitespace", severity: "WARN", slide: args.idx + 1,
        element: ".slide", message: `填充率 ${fillPercent}%（> 85%），过于密集` });
    }

    // ── Quadrant balance ──
    if (maxQ > 0 && minQ / maxQ < 0.1) {
      const labels = ["左上", "右上", "左下", "右下"];
      const empty = quadrantFills.map((f, i) => f < 0.05 ? labels[i] : null).filter(Boolean);
      if (empty.length > 0) {
        issues.push({ group: "whitespace", severity: "WARN", slide: args.idx + 1,
          element: ".slide", message: `内容分布不均衡，${empty.join("/")} 区域几乎空白` });
      }
    }

    // ── 2. Vertical center-of-mass ──
    const relTop = (contentTop - slideRect.top) / slideH;
    const relBottom = (contentBottom - slideRect.top) / slideH;
    const contentMidY = (relTop + relBottom) / 2;
    const centerOffset = Math.abs(contentMidY - 0.5);
    if (centerOffset > 0.18) {
      const dir = contentMidY < 0.5 ? "偏上" : "偏下";
      issues.push({ group: "whitespace", severity: "WARN", slide: args.idx + 1,
        element: ".slide", message: `内容重心${dir}（偏移 ${(centerOffset * 100).toFixed(0)}%），${args.profile.fillMin > 0.40 ? "3:4建议居中" : "建议调整分布"}` });
    } else if (centerOffset > 0.12) {
      issues.push({ group: "whitespace", severity: "INFO", slide: args.idx + 1,
        element: ".slide", message: `内容重心略偏（偏移 ${(centerOffset * 100).toFixed(0)}%）` });
    }

    // ── 3. Top/bottom whitespace ratio ──
    const topWhitespace = relTop;
    const bottomWhitespace = 1 - relBottom;
    if (topWhitespace > 0.3 && bottomWhitespace < 0.1) {
      issues.push({ group: "whitespace", severity: "WARN", slide: args.idx + 1,
        element: ".slide", message: `顶部大面积留白（${(topWhitespace * 100).toFixed(0)}%），内容沉底` });
    } else if (bottomWhitespace > 0.3 && topWhitespace < 0.1) {
      issues.push({ group: "whitespace", severity: "WARN", slide: args.idx + 1,
        element: ".slide", message: `底部大面积留白（${(bottomWhitespace * 100).toFixed(0)}%），内容堆顶` });
    }
    if (topWhitespace > 0.25 && bottomWhitespace > 0.25) {
      const gap = Math.max(topWhitespace, bottomWhitespace) / Math.max(0.01, Math.min(topWhitespace, bottomWhitespace));
      if (gap > 2.5) {
        issues.push({ group: "whitespace", severity: "WARN", slide: args.idx + 1,
          element: ".slide", message: `上下留白比 ${gap.toFixed(1)}:1，严重不均（上${(topWhitespace*100).toFixed(0)}% 下${(bottomWhitespace*100).toFixed(0)}%）` });
      }
    }

    // ── 4. Edge margin checks ──
    const marginTop = (contentTop - slideRect.top) / slideH;
    const marginBottom = (slideRect.bottom - contentBottom) / slideH;
    const marginLeft = (contentLeft - slideRect.left) / slideW;
    const marginRight = (slideRect.right - contentRight) / slideW;
    const minEdgePx = 4;

    // Only check vertical edges — horizontal full-width is normal on narrow canvases
    for (const [label, edgePx] of [
      ["上边距", contentTop - slideRect.top],
      ["下边距", slideRect.bottom - contentBottom],
    ] as const) {
      if (edgePx < minEdgePx && edgePx >= 0 && edgePx / slideH < 0.005) {
        issues.push({ group: "whitespace", severity: "BLOCKER", slide: args.idx + 1,
          element: ".slide", message: `${label}仅 ${edgePx.toFixed(0)}px，内容太贴边可能被裁切` });
      }
    }

    // ── 5. Component-specific whitespace diagnosis ──
    // Find the lowest content element — the one with largest bottom
    let lastEl: ContentEl | null = null;
    for (const item of items) {
      if (!lastEl || item.rect.bottom > lastEl.rect.bottom) lastEl = item;
    }
    if (lastEl && bottomWhitespace > 0.3) {
      const elH = lastEl.rect.height;
      const availableH = slideH - (lastEl.rect.top - slideRect.top);
      const elFillRatio = elH / availableH;

      // Table-specific: table too small for available space
      if (lastEl.cls.includes("c-table") || lastEl.cls.includes("c-table-wrap") || lastEl.tag === "table") {
        if (elFillRatio < 0.25) {
          issues.push({ group: "whitespace", severity: "WARN", slide: args.idx + 1,
            element: ".c-table", message: `表格仅占可用空间 ${(elFillRatio*100).toFixed(0)}%，增大 --tbl-font 或使用更少列` });
        }
      }
      // Single small component at bottom with lots of empty space
      else if (elFillRatio < 0.2 && items.length <= 3) {
        const compType = lastEl.cls.split(" ")[0] || lastEl.tag;
        issues.push({ group: "whitespace", severity: "INFO", slide: args.idx + 1,
          element: compType, message: `${compType} 仅占可用空间 ${(elFillRatio*100).toFixed(0)}%，考虑加 c-badge-row、c-note 或增大字体` });
      }
    }

    // ── 6. Gap variance between vertically stacked siblings ──
    const gaps: number[] = [];
    const sorted = [...items].sort((a, b) => a.rect.top - b.rect.top);
    for (let i = 1; i < sorted.length; i++) {
      const gap = sorted[i].rect.top - sorted[i-1].rect.bottom;
      if (gap > 2 && gap < slideH * 0.5) gaps.push(gap);
    }
    if (gaps.length >= 2) {
      const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const variance = gaps.reduce((s, g) => s + (g - mean) ** 2, 0) / gaps.length;
      const stddev = Math.sqrt(variance);
      if (mean > 0 && stddev / mean > 0.5) {
        issues.push({ group: "whitespace", severity: "INFO", slide: args.idx + 1,
          element: ".slide", message: `组件间距不一致（stddev ${(stddev/mean*100).toFixed(0)}%），范围 ${gaps[0].toFixed(0)}-${gaps[gaps.length-1].toFixed(0)}px` });
      }
    }

    return issues;
  }, { idx: slideIndex, selectors: CONTENT_SELECTORS, decoClasses: DECORATIVE_CLASSES, profile });
}

// ─── Group 4: Spacing consistency ───────────────────────────────────────

async function checkSpacing(page: any, slideIndex: number): Promise<Issue[]> {
  return page.evaluate((args: { idx: number }) => {
    const slide = document.querySelector(".deck > .slide.is-active");
    if (!slide) return [];

    const groups: Record<string, Element[]> = {
      cards: [...slide.querySelectorAll(".c-card, .c-card-soft")],
      steps: [...slide.querySelectorAll(".c-step")],
      kpis: [...slide.querySelectorAll(".c-kpi")],
      badges: [...slide.querySelectorAll(".c-badge")],
      bullets: [...slide.querySelectorAll("li")],
    };

    const issues: any[] = [];

    for (const [type, elements] of Object.entries(groups)) {
      if (elements.length < 3) continue;

      const rects = elements.map(el => el.getBoundingClientRect());

      // Detect direction: compare X variance vs Y variance
      const xs = rects.map(r => r.left);
      const ys = rects.map(r => r.top);
      const xVar = Math.max(...xs) - Math.min(...xs);
      const yVar = Math.max(...ys) - Math.min(...ys);
      const direction = yVar >= xVar ? "vertical" : "horizontal";

      // Sort by position
      if (direction === "vertical") {
        rects.sort((a, b) => a.top - b.top);
      } else {
        rects.sort((a, b) => a.left - b.left);
      }

      const gaps: number[] = [];
      for (let i = 1; i < rects.length; i++) {
        const gap = direction === "vertical"
          ? rects[i]!.top - rects[i - 1]!.bottom
          : rects[i]!.left - rects[i - 1]!.right;
        if (gap < 0) continue; // overlap → handled by occlusion check
        gaps.push(gap);
      }

      if (gaps.length < 2) continue;

      const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      if (avg === 0) continue;
      const maxDev = Math.max(...gaps.map(g => Math.abs(g - avg)));
      const devPercent = (maxDev / avg) * 100;

      if (devPercent > 50) {
        issues.push({
          group: "spacing",
          severity: "WARN",
          slide: args.idx + 1,
          element: `.${type}`,
          message: `${type} ${direction === "vertical" ? "纵向" : "横向"}间距偏差 ${Math.round(devPercent)}%（最大 ${Math.round(maxDev)}px，平均 ${Math.round(avg)}px）`,
          fix: direction === "vertical"
            ? `.slide:nth-of-type(${args.idx + 1}) .c-${type === "bullets" ? "stack > li + li" : type + " + .c-" + type} { margin-top: ${avg.toFixed(1)}px; }`
            : undefined,
        });
      } else if (devPercent > 25) {
        issues.push({
          group: "spacing",
          severity: "INFO",
          slide: args.idx + 1,
          element: `.${type}`,
          message: `${type} 间距略有不均（偏差 ${Math.round(devPercent)}%）`,
        });
      }
    }
    return issues;
  }, { idx: slideIndex });
}

// ─── Group 5: Contrast ──────────────────────────────────────────────────

async function checkContrast(page: any, slideIndex: number): Promise<Issue[]> {
  return page.evaluate((args: { idx: number; selectors: string }) => {
    const slide = document.querySelector(".deck > .slide.is-active");
    if (!slide) return [];

    const parseRGB = (color: string): [number, number, number] | null => {
      const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!m) return null;
      return [parseInt(m[1]!), parseInt(m[2]!), parseInt(m[3]!)];
    };

    const luminance = (r: number, g: number, b: number): number => {
      const toL = (c: number) => {
        c /= 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * toL(r) + 0.7152 * toL(g) + 0.0722 * toL(b);
    };

    const cr = (c1: [number, number, number], c2: [number, number, number]): number => {
      const l1 = luminance(...c1);
      const l2 = luminance(...c2);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    };

    const findBgColor = (el: Element): [number, number, number] => {
      let ancestor: Element | null = el;
      while (ancestor && ancestor !== document.documentElement) {
        const bg = window.getComputedStyle(ancestor).backgroundColor;
        if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
          const parsed = parseRGB(bg);
          if (parsed) return parsed;
        }
        ancestor = ancestor.parentElement;
      }
      // Fallback: check --bg variable
      const bgVar = window.getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
      if (bgVar) {
        // Handle hex
        const hex = bgVar.replace(/^#/, "");
        if (hex.length === 6) {
          return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
        }
      }
      return [255, 255, 255]; // ultimate fallback
    };

    const issues: any[] = [];
    const seen = new Set<string>();

    for (const el of slide.querySelectorAll(args.selectors)) {
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;

      const text = (el as HTMLElement).innerText?.trim();
      if (!text || text.length < 2) continue;

      const textColor = parseRGB(style.color);
      if (!textColor) continue;

      const bgColor = findBgColor(el);

      const ratio = cr(textColor, bgColor);
      const fontSize = parseFloat(style.fontSize);
      const fontWeight = parseInt(style.fontWeight) || 400;
      const isLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
      const threshold = isLarge ? 3.0 : 4.5;

      const tag = el.tagName.toLowerCase();
      const cls = el.getAttribute("class")?.split(" ").slice(0, 2).join(".") || "";
      const label = cls ? `${tag}.${cls}` : tag;

      // Deduplicate same element type + similar ratio
      const key = `${label}-${Math.round(ratio * 10)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      if (ratio < threshold) {
        issues.push({
          group: "contrast",
          severity: "BLOCKER",
          slide: args.idx + 1,
          element: label,
          message: `对比度 ${ratio.toFixed(2)}:1（需 ${threshold}:1），文字色 rgb(${textColor}) vs 背景色 rgb(${bgColor})`,
          textColor: `rgb(${textColor.join(",")})`,
          bgColor: `rgb(${bgColor.join(",")})`,
          bgLuminance: luminance(...bgColor),
        });
      } else if (ratio < threshold * 1.2) {
        issues.push({
          group: "contrast",
          severity: "WARN",
          slide: args.idx + 1,
          element: label,
          message: `对比度 ${ratio.toFixed(2)}:1 刚好及格（阈值 ${threshold}:1），建议提升`,
        });
      }
    }
    return issues;
  }, { idx: slideIndex, selectors: TEXT_SELECTORS });
}

// ─── Group 6: Font hierarchy ────────────────────────────────────────────

interface FontRecord {
  slide: number;
  role: string;
  size: number;
  element: string;
}

async function collectFontSizes(page: any, slideIndex: number): Promise<FontRecord[]> {
  return page.evaluate((args: { idx: number; selectors: string }) => {
    const slide = document.querySelector(".deck > .slide.is-active");
    if (!slide) return [];

    const classifyRole = (el: Element): string => {
      const tag = el.tagName;
      const cls = el.getAttribute("class") || "";
      if (tag === "H1" || cls.includes("chr-title")) return "title";
      if (tag === "H2" || tag === "H3" || cls.includes("chr-heading") || cls.includes("chr-sub")) return "heading";
      if (cls.includes("c-badge") || cls.includes("c-note") || cls.includes("chr-footer")) return "caption";
      return "body";
    };

    const records: any[] = [];
    for (const el of slide.querySelectorAll(args.selectors)) {
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;

      const text = (el as HTMLElement).innerText?.trim();
      if (!text || text.length < 2) continue;

      const fontSize = parseFloat(style.fontSize);
      if (isNaN(fontSize) || fontSize === 0) continue;

      const tag = el.tagName.toLowerCase();
      const cls = el.getAttribute("class")?.split(" ").slice(0, 2).join(".") || "";

      records.push({
        slide: args.idx + 1,
        role: classifyRole(el),
        size: fontSize,
        element: cls ? `${tag}.${cls}` : tag,
      });
    }
    return records;
  }, { idx: slideIndex, selectors: TEXT_SELECTORS });
}

function analyzeFontHierarchy(allRecords: FontRecord[], slideWidth: number, portrait: boolean): Issue[] {
  const issues: Issue[] = [];

  // Per-slide checks
  const bySlide = new Map<number, FontRecord[]>();
  for (const r of allRecords) {
    if (!bySlide.has(r.slide)) bySlide.set(r.slide, []);
    bySlide.get(r.slide)!.push(r);
  }

  for (const [slideNum, records] of bySlide) {
    const avgByRole = (role: string) => {
      const sizes = records.filter(r => r.role === role).map(r => r.size);
      return sizes.length > 0 ? sizes.reduce((a, b) => a + b, 0) / sizes.length : 0;
    };

    const title = avgByRole("title");
    const heading = avgByRole("heading");
    const body = avgByRole("body");
    const minSize = portrait ? 10 : 7;

    // Hierarchy inversion
    if (title > 0 && heading > 0 && heading >= title * 0.95) {
      issues.push({
        group: "font-hierarchy",
        severity: "WARN",
        slide: slideNum,
        element: ".chr-heading",
        message: `h2 (${heading.toFixed(0)}px) 接近 h1 (${title.toFixed(0)}px)，层级不清晰`,
        fix: `.slide:nth-of-type(${slideNum}) .chr-heading { font-size: ${(title * 0.7).toFixed(0)}px; }`,
      });
    }

    if (heading > 0 && body > 0 && body >= heading * 0.9) {
      issues.push({
        group: "font-hierarchy",
        severity: "WARN",
        slide: slideNum,
        element: "p",
        message: `正文 (${body.toFixed(0)}px) 接近标题 (${heading.toFixed(0)}px)，层级模糊`,
      });
    }

    // Too small
    for (const r of records) {
      if (r.size < minSize) {
        issues.push({
          group: "font-hierarchy",
          severity: "BLOCKER",
          slide: slideNum,
          element: r.element,
          message: `字号 ${r.size.toFixed(0)}px 过小（最小 ${minSize}px）`,
          fix: `.slide:nth-of-type(${slideNum}) ${r.element.split(".")[0]} { font-size: ${minSize}px; }`,
        });
      }
    }

    // Too large
    if (title > slideWidth * 0.25) {
      issues.push({
        group: "font-hierarchy",
        severity: "WARN",
        slide: slideNum,
        element: ".chr-title",
        message: `标题字号 ${title.toFixed(0)}px 超过 slide 宽度 25%（${(slideWidth * 0.25).toFixed(0)}px）`,
      });
    }
  }

  // Cross-slide consistency
  const roleGlobal = new Map<string, number[]>();
  for (const r of allRecords) {
    if (!roleGlobal.has(r.role)) roleGlobal.set(r.role, []);
    roleGlobal.get(r.role)!.push(r.size);
  }

  for (const [role, sizes] of roleGlobal) {
    if (sizes.length < 3) continue;
    const avg = sizes.reduce((a, b) => a + b, 0) / sizes.length;
    if (avg === 0) continue;
    const maxDev = Math.max(...sizes.map(s => Math.abs(s - avg)));
    const devPercent = (maxDev / avg) * 100;

    if (devPercent > 30) {
      issues.push({
        group: "font-hierarchy",
        severity: "INFO",
        slide: 0,
        element: role,
        message: `"${role}" 角色字号跨 slide 不一致（偏差 ${devPercent.toFixed(0)}%，范围 ${Math.min(...sizes).toFixed(0)}-${Math.max(...sizes).toFixed(0)}px）`,
      });
    }
  }

  return issues;
}

// ─── Group 7: Chrome position consistency ───────────────────────────────

async function checkChromePositions(page: any, totalSlides: number): Promise<Issue[]> {
  const positions: { slide: number; topbarY: number | null; footerY: number | null; pageNumY: number | null }[] = [];

  for (let i = 0; i < totalSlides; i++) {
    await activateSlide(page, i);
    const pos = await page.evaluate(() => {
      const active = document.querySelector(".deck > .slide.is-active");
      if (!active) return { topbarY: null, footerY: null, pageNumY: null };

      const find = (selectors: string[]) => {
        for (const sel of selectors) {
          const el = active.querySelector(sel);
          if (el) {
            const style = window.getComputedStyle(el);
            if (style.display !== "none" && style.visibility !== "hidden") {
              return el.getBoundingClientRect().top;
            }
          }
        }
        return null;
      };

      return {
        topbarY: find([".chr-topbar"]),
        footerY: find([".chr-footer"]),
        pageNumY: find([".chr-page", ".pg-num"]),
      };
    });
    positions.push({ slide: i + 1, ...pos });
  }

  const issues: Issue[] = [];

  for (const key of ["topbarY", "footerY", "pageNumY"] as const) {
    const values = positions.filter(p => p[key] !== null).map(p => ({ slide: p.slide, y: p[key]! }));
    if (values.length < 2) continue;

    const mean = values.reduce((s, v) => s + v.y, 0) / values.length;
    const maxDev = Math.max(...values.map(v => Math.abs(v.y - mean)));

    if (maxDev > 2) {
      issues.push({
        group: "chrome-position",
        severity: "WARN",
        slide: 0,
        element: key.replace("Y", ""),
        message: `${key} 位置跨 slide 偏差 ${maxDev.toFixed(1)}px（允许 2px）`,
      });
    }
  }

  return issues;
}

// ─── Group 8: Chrome presence ───────────────────────────────────────────

async function checkChromePresence(page: any, totalSlides: number): Promise<Issue[]> {
  const presence: { slide: number; topbar: boolean; footer: boolean; pageNum: boolean }[] = [];

  for (let i = 0; i < totalSlides; i++) {
    await activateSlide(page, i);
    const p = await page.evaluate(() => {
      const active = document.querySelector(".deck > .slide.is-active");
      if (!active) return { topbar: false, footer: false, pageNum: false };
      return {
        topbar: !!active.querySelector(".chr-topbar"),
        footer: !!active.querySelector(".chr-footer"),
        pageNum: !!(active.querySelector(".chr-page") || active.querySelector(".pg-num")),
      };
    });
    presence.push({ slide: i + 1, ...p });
  }

  const issues: Issue[] = [];

  const checkElement = (key: "topbar" | "footer" | "pageNum", label: string, sev: Severity) => {
    const count = presence.filter(p => p[key]).length;
    if (count > 0 && count < totalSlides) {
      const missing = presence.filter(p => !p[key]).map(p => `#${p.slide}`);
      issues.push({
        group: "chrome-presence",
        severity: sev,
        slide: 0,
        element: `.chr-${label}`,
        message: `${label} 缺失于 slide ${missing.join(", ")}（${count}/${totalSlides} 页有）`,
      });
    }
  };

  checkElement("topbar", "topbar", "WARN");
  checkElement("footer", "footer", "WARN");
  checkElement("pageNum", "page-num", "INFO");

  return issues;
}

// ─── Group 9: CSS variable health ───────────────────────────────────────

async function checkCSSVarHealth(page: any): Promise<Issue[]> {
  return page.evaluate(() => {
    const body = document.body;
    const bodyStyle = window.getComputedStyle(body);
    const criticalVars = ["--accent", "--bg", "--text-1", "--font-sans"];
    const issues: any[] = [];

    // Quick sanity: if body has a background color, CSS is loading correctly
    const bodyBg = bodyStyle.backgroundColor;
    const cssIsLoading = bodyBg && bodyBg !== "rgba(0, 0, 0, 0)" && bodyBg !== "transparent";

    for (const v of criticalVars) {
      const val = bodyStyle.getPropertyValue(v).trim();
      if (!val && cssIsLoading) {
        issues.push({
          group: "css-var-health",
          severity: "BLOCKER",
          slide: 0,
          element: ":root",
          message: `${v} 未定义 — Design CSS 可能缺失`,
        });
      }
    }
    // If CSS isn't loading at all, that's a bigger problem
    if (!cssIsLoading) {
      issues.push({
        group: "css-var-health",
        severity: "BLOCKER",
        slide: 0,
        element: ":root",
        message: "CSS 文件加载失败，body 无背景色",
      });
    }
    return issues;
  });
}

// ─── Group 10: Component density ────────────────────────────────────────

async function checkDensity(page: any, slideIndex: number, profile: CanvasProfile): Promise<Issue[]> {
  return page.evaluate((args: { idx: number; profile: CanvasProfile }) => {
    const slide = document.querySelector(".deck > .slide.is-active");
    if (!slide) return [];

    // Sub-element classes that are always children of a parent component
    const SUB_COMPONENTS = new Set([
      "c-step-num", "c-step-content", "c-step-title", "c-step-body",
      "c-connector", "c-connector-arrow", "c-connector-text", "c-connector-line",
      "c-kpi-value", "c-kpi-label", "c-kpi-delta",
      "c-card-num",
      "c-icon-row-icon", "c-icon-row-text", "c-icon-row-title", "c-icon-row-body",
      "c-terminal-dot", "c-terminal-topbar", "c-terminal-title", "c-terminal-body",
      "c-note-icon", "c-note-content", "c-note-title", "c-note-body",
      "c-warn-icon", "c-warn-content", "c-warn-title", "c-warn-body",
      "c-example-label",
      "c-table-wrap", // wrapper, not a standalone component
      "c-hero-num-label",
      "c-quote-attr",
      "c-section-label",
    ]);

    const componentClasses = new Set<string>();
    for (const el of slide.querySelectorAll("*")) {
      const cls = el.getAttribute("class") || "";
      for (const c of cls.split(/\s+/)) {
        if (!c.startsWith("c-")) continue;
        if (c.startsWith("c-spacer") || c.startsWith("c-divider")) continue;
        if (SUB_COMPONENTS.has(c)) continue;
        componentClasses.add(c);
      }
    }

    const max = args.profile.componentMax;
    const count = componentClasses.size;

    if (count > max) {
      return [{
        group: "density",
        severity: "WARN",
        slide: args.idx + 1,
        element: ".slide",
        message: `${count} 个组件（最多 ${max}），建议拆页或精简`,
      }];
    }

    if (args.profile.componentMin > 0 && count < args.profile.componentMin) {
      return [{
        group: "density",
        severity: "WARN",
        slide: args.idx + 1,
        element: ".slide",
        message: `仅 ${count} 个组件（最少 ${args.profile.componentMin}），${args.profile.componentMin > 3 ? "3:4 建议增加组件填充" : "内容稀疏"}`,
      }];
    }
    return [];
  }, { idx: slideIndex, profile });
}

// ─── Group 11: Chrome-content boundary ────────────────────────────────────

async function checkChromeContentBoundary(page: any, slideIndex: number): Promise<Issue[]> {
  return page.evaluate((args: { idx: number }) => {
    const active = document.querySelector(".deck > .slide.is-active");
    if (!active) return [];

    const issues: any[] = [];
    const slideRect = active.getBoundingClientRect();

    const topbar = active.querySelector(".chr-topbar") as HTMLElement | null;
    const footer = active.querySelector(".chr-footer") as HTMLElement | null;

    const contentChildren: Element[] = [];
    for (const el of active.children) {
      const cls = el.getAttribute("class") || "";
      if (cls.includes("chr-topbar") || cls.includes("chr-footer") ||
          cls.includes("chr-blob") || cls.includes("bg-") || cls.includes("chr-hc-")) continue;
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;
      if (style.position === "absolute" || style.position === "fixed") continue;
      contentChildren.push(el);
    }

    if (topbar) {
      const tbRect = topbar.getBoundingClientRect();
      const tbBottom = tbRect.bottom - slideRect.top;

      for (const child of contentChildren) {
        const childRect = child.getBoundingClientRect();
        const childTop = childRect.top - slideRect.top;
        const overlap = tbBottom - childTop;
        if (overlap > 5) {
          issues.push({
            group: "chrome-content-boundary",
            severity: "BLOCKER",
            slide: args.idx + 1,
            element: ".chr-topbar",
            message: `chr-topbar 与内容重叠 ${overlap.toFixed(0)}px，建议增加间距或调整 padding-top`,
          });
          break;
        }
      }
    }

    if (footer) {
      const ftRect = footer.getBoundingClientRect();
      const ftTop = ftRect.top - slideRect.top;

      let maxBottom = 0;
      for (const child of contentChildren) {
        const childRect = child.getBoundingClientRect();
        const childBottom = childRect.bottom - slideRect.top;
        if (childBottom > maxBottom) maxBottom = childBottom;
      }

      const overlap = maxBottom - ftTop;
      if (overlap > 5) {
        issues.push({
          group: "chrome-content-boundary",
          severity: "BLOCKER",
          slide: args.idx + 1,
          element: ".chr-footer",
          message: `chr-footer 与内容重叠 ${overlap.toFixed(0)}px`,
        });
      }
    }

    return issues;
  }, { idx: slideIndex });
}

// ─── Group 12: Canvas fill (portrait bottom emptiness) ─────────────────────

async function checkCanvasFill(page: any, slideIndex: number, profile: CanvasProfile): Promise<Issue[]> {
  if (profile.bottomEmptyMaxRatio <= 0) return [];

  return page.evaluate((args: { idx: number; bottomEmptyMaxRatio: number }) => {
    const active = document.querySelector(".deck > .slide.is-active");
    if (!active) return [];

    const slideRect = active.getBoundingClientRect();
    const slideH = slideRect.height;
    const issues: any[] = [];

    let lowestBottom = 0;
    for (const el of active.children) {
      const cls = el.getAttribute("class") || "";
      if (cls.includes("chr-topbar") || cls.includes("chr-footer") ||
          cls.includes("chr-blob") || cls.includes("bg-") || cls.includes("chr-hc-")) continue;
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;
      if (style.position === "absolute" || style.position === "fixed") continue;
      const rect = el.getBoundingClientRect();
      const relBottom = (rect.bottom - slideRect.top) / slideH;
      if (relBottom > lowestBottom) lowestBottom = relBottom;
    }

    const bottomEmpty = 1 - lowestBottom;
    if (bottomEmpty > args.bottomEmptyMaxRatio) {
      issues.push({
        group: "canvas-fill",
        severity: (bottomEmpty > args.bottomEmptyMaxRatio * 1.5) ? "BLOCKER" : "WARN",
        slide: args.idx + 1,
        element: ".slide",
        message: `底部 ${(bottomEmpty * 100).toFixed(0)}% 空白（阈值 ${(args.bottomEmptyMaxRatio * 100).toFixed(0)}%），建议增加组件或使用 .v-distribute`,
      });
    }

    return issues;
  }, { idx: slideIndex, bottomEmptyMaxRatio: profile.bottomEmptyMaxRatio });
}

// ─── Group 13: Font unit check (portrait: no px font-size) ─────────────────

async function checkFontUnit(page: any, slideIndex: number, profile: CanvasProfile): Promise<Issue[]> {
  if (!profile.fontNoPx) return [];

  return page.evaluate((args: { idx: number; bodyMinCqi: number }) => {
    const active = document.querySelector(".deck > .slide.is-active");
    if (!active) return [];

    const issues: any[] = [];
    const contentSelectors = [
      "h1", "h2", "h3", "h4", "p", "li", "span",
      ".c-card", ".c-card-soft", ".c-step", ".c-kpi",
      ".c-note", ".c-quote", ".c-badge",
      ".chr-title", ".chr-heading", ".chr-sub",
    ];

    for (const sel of contentSelectors) {
      for (const el of active.querySelectorAll(sel)) {
        const style = window.getComputedStyle(el);
        const fontSize = style.fontSize;
        if (fontSize.endsWith("px")) {
          const px = parseFloat(fontSize);
          const activeSlide = document.querySelector(".deck > .slide.is-active");
          const slideW = activeSlide ? activeSlide.getBoundingClientRect().width : 810;
          const approxCqi = (px / slideW) * 100;
          if (args.bodyMinCqi > 0 && approxCqi < args.bodyMinCqi) {
            const cls = (el.getAttribute("class") || el.tagName.toLowerCase()).split(" ")[0];
            issues.push({
              group: "font-unit",
              severity: "WARN",
              slide: args.idx + 1,
              element: cls,
              message: `字号 ${px}px（≈${approxCqi.toFixed(1)}cqi）< ${args.bodyMinCqi}cqi 最小值，建议使用 --c-* token 或 cqi 单位`,
            });
          }
        }
      }
    }

    return issues;
  }, { idx: slideIndex, bodyMinCqi: profile.bodyMinCqi });
}

// ─── Group 14: CSS loading integrity ───────────────────────────────────────

async function checkCSSLoadingIntegrity(page: any): Promise<Issue[]> {
  return page.evaluate(() => {
    const issues: any[] = [];
    const body = document.body;
    const bodyClass = body.getAttribute("class") || "";

    // Check: body has d-xxx class but corresponding design CSS not found
    const designMatch = bodyClass.match(/d-([a-z-]+)/);
    if (designMatch) {
      const designName = designMatch[1];
      const styleTags = document.querySelectorAll("style");
      let foundDesignCSS = false;
      for (const tag of styleTags) {
        const content = tag.textContent || "";
        if (content.includes(`.d-${designName}`)) {
          foundDesignCSS = true;
          break;
        }
      }
      if (!foundDesignCSS) {
        issues.push({
          group: "css-loading-integrity",
          severity: "BLOCKER",
          slide: 0,
          element: "body",
          message: `body class "d-${designName}" 但未找到对应 design CSS，设计样式可能缺失`,
        });
      }
    }

    // Check: portrait class consistency
    const hasPortrait = bodyClass.includes("portrait");
    const deckEl = document.querySelector(".deck");
    if (deckEl && hasPortrait) {
      const deckWidth = deckEl.getBoundingClientRect().width;
      if (deckWidth > 1200) {
        issues.push({
          group: "css-loading-integrity",
          severity: "WARN",
          slide: 0,
          element: ".deck",
          message: `body.portrait 但 deck 宽度 ${deckWidth.toFixed(0)}px（> 1200px），canvas 可能未正确应用`,
        });
      }
    }

    return issues;
  });
}

// ─── Fix generation ─────────────────────────────────────────────────────

function generateFixes(issues: Issue[]): string {
  const fixableIssues = issues.filter(i => i.fix && (i.severity === "BLOCKER" || i.severity === "WARN"));

  if (fixableIssues.length === 0) {
    return "/* visual-qa: all checks passed — no corrections needed */\n";
  }

  let css = "/* visual-qa.css — auto-generated visual corrections */\n";
  const seen = new Set<string>();

  for (const issue of fixableIssues) {
    if (seen.has(issue.fix!)) continue;
    seen.add(issue.fix!);
    css += `\n/* [${issue.severity}] ${issue.group}: ${issue.message} */\n`;
    css += `${issue.fix}\n`;
  }

  // Text overflow fixes
  for (const issue of issues.filter(i => i.group === "text-overflow" && i.severity === "BLOCKER")) {
    const data = issue as any;
    if (data.overflowPx && data.fontSize && data.clientHeight && data.scrollHeight) {
      const ratio = data.clientHeight / data.scrollHeight;
      if (ratio > 0.8) {
        const newSize = Math.floor(data.fontSize * ratio);
        const rule = `.slide:nth-of-type(${issue.slide}) ${issue.element.split(".")[0]} { font-size: ${newSize}px; }`;
        if (!seen.has(rule)) {
          seen.add(rule);
          css += `\n/* text-overflow auto-fix: shrink font */\n${rule}\n`;
        }
      }
    }
    if (issue.message.includes("横向")) {
      const rule = `.slide:nth-of-type(${issue.slide}) ${issue.element.split(".")[0]} { word-break: break-word; min-width: 0; }`;
      if (!seen.has(rule)) {
        seen.add(rule);
        css += `\n/* text-overflow auto-fix: word-break */\n${rule}\n`;
      }
    }
  }

  // Contrast fixes
  for (const issue of issues.filter(i => i.group === "contrast" && i.severity === "BLOCKER")) {
    const data = issue as any;
    if (data.textColor && data.bgLuminance !== undefined) {
      const textRgb = parseRGBString(data.textColor);
      if (textRgb) {
        const fixed = adjustColorForContrast(textRgb, data.bgLuminance);
        const rule = `.slide:nth-of-type(${issue.slide}) ${issue.element.split(".")[0]} { color: ${fixed}; }`;
        if (!seen.has(rule)) {
          seen.add(rule);
          css += `\n/* contrast auto-fix */\n${rule}\n`;
        }
      }
    }
  }

  return css;
}

// ─── Report ─────────────────────────────────────────────────────────────

function printReport(issues: Issue[], totalSlides: number): void {
  const blockers = issues.filter(i => i.severity === "BLOCKER");
  const warns = issues.filter(i => i.severity === "WARN");
  const infos = issues.filter(i => i.severity === "INFO");

  console.log(`\n  Visual QA Report (${totalSlides} slides)`);
  console.log(`  ─────────────────────────────`);
  console.log(`  BLOCKER ${blockers.length} | WARN ${warns.length} | INFO ${infos.length}\n`);

  const grouped = new Map<string, Issue[]>();
  for (const issue of issues) {
    if (!grouped.has(issue.group)) grouped.set(issue.group, []);
    grouped.get(issue.group)!.push(issue);
  }

  for (const [group, groupIssues] of grouped) {
    const icon = groupIssues.some(i => i.severity === "BLOCKER") ? "❌"
      : groupIssues.some(i => i.severity === "WARN") ? "⚠️" : "ℹ️";
    console.log(`  ${icon} ${group} (${groupIssues.length})`);

    for (const issue of groupIssues.slice(0, 15)) {
      const sev = issue.severity === "BLOCKER" ? "❌" : issue.severity === "WARN" ? "⚠️" : "ℹ️";
      const loc = issue.slide > 0 ? `slide #${issue.slide}` : "deck";
      console.log(`     ${sev} ${loc} ${issue.element}: ${issue.message}`);
      if (issue.fix) {
        console.log(`       → ${issue.fix.slice(0, 80)}${issue.fix.length > 80 ? "..." : ""}`);
      }
    }
    if (groupIssues.length > 15) {
      console.log(`     ... and ${groupIssues.length - 15} more`);
    }
  }

  if (issues.length === 0) {
    console.log(`  ✅ All checks passed`);
  }
  console.log();
}

// ─── Main ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const cli = parseArgs(process.argv.slice(2));

  if (!cli.input) {
    console.error("--input <file> is required");
    process.exit(1);
  }

  const htmlPath = path.resolve(cli.input);
  if (!fs.existsSync(htmlPath)) {
    console.error(`File not found: ${htmlPath}`);
    process.exit(1);
  }

  const html = fs.readFileSync(htmlPath, "utf-8");
  const portrait = isPortrait(html);
  const profile = portrait ? PROFILES.portrait : PROFILES.landscape;
  const htmlDir = path.dirname(htmlPath);

  console.log(`  Loading: ${htmlPath}`);
  console.log(`  Canvas: ${portrait ? "3:4 portrait" : "16:9 landscape"}`);

  const { browser, page } = await loadPage(htmlPath);
  const totalSlides = await getSlideCount(page);
  console.log(`  Slides: ${totalSlides}`);

  const allIssues: Issue[] = [];
  const allFontRecords: FontRecord[] = [];

  // Get slide width for font checks
  const slideWidth = await page.evaluate(() => {
    const slide = document.querySelector(".deck > .slide");
    return slide ? slide.getBoundingClientRect().width : 810;
  });

  // ── Per-slide checks (Groups 1-6, 10-12) ──
  for (let i = 0; i < totalSlides; i++) {
    await activateSlide(page, i);

    const [overflow, occlusion, whitespace, spacing, contrast, density,
           chromeBoundary, canvasFill, fontUnit] = await Promise.all([
      checkTextOverflow(page, i),
      checkOcclusion(page, i),
      checkWhitespace(page, i, profile),
      checkSpacing(page, i),
      checkContrast(page, i),
      checkDensity(page, i, profile),
      checkChromeContentBoundary(page, i),
      checkCanvasFill(page, i, profile),
      checkFontUnit(page, i, profile),
    ]);

    allIssues.push(...overflow, ...occlusion, ...whitespace, ...spacing, ...contrast, ...density,
      ...chromeBoundary, ...canvasFill, ...fontUnit);

    // Collect font records for cross-slide analysis
    const fonts = await collectFontSizes(page, i);
    allFontRecords.push(...fonts);
  }

  // ── Font hierarchy analysis (Group 6 cross-slide) ──
  allIssues.push(...analyzeFontHierarchy(allFontRecords, slideWidth, portrait));

  // ── Cross-slide checks (Groups 7-9) ──
  const [chromePos, chromePresence, cssVars, cssLoading] = await Promise.all([
    checkChromePositions(page, totalSlides),
    checkChromePresence(page, totalSlides),
    checkCSSVarHealth(page),
    checkCSSLoadingIntegrity(page),
  ]);
  allIssues.push(...chromePos, ...chromePresence, ...cssVars, ...cssLoading);

  await browser.close();

  // ── Sort by severity ──
  const severityOrder: Record<Severity, number> = { BLOCKER: 0, WARN: 1, INFO: 2 };
  allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // ── Output ──
  printReport(allIssues, totalSlides);

  if (!cli.checkOnly) {
    const fixesCSS = generateFixes(allIssues);
    const ruleCount = fixesCSS.split("\n").filter(l => l.trim() && !l.startsWith("/*")).length;

    if (ruleCount > 0) {
      // Embed fixes directly into HTML as <style id="qa-fixes">
      let html = fs.readFileSync(htmlPath, "utf-8");
      const tagStart = html.indexOf('id="editor-overrides"');
      if (tagStart !== -1) {
        // Insert QA fixes before editor overrides (editor takes precedence)
        html = html.substring(0, tagStart) +
          `<style id="qa-fixes">\n${fixesCSS}\n</style>\n` +
          html.substring(tagStart);
      } else {
        // No editor-overrides tag — insert before </head>
        html = html.replace("</head>", `<style id="qa-fixes">\n${fixesCSS}\n</style>\n</head>`);
      }
      fs.writeFileSync(htmlPath, html);
      console.log(`  Written QA fixes to ${htmlPath} (${ruleCount} CSS rule(s))\n`);
    }
  }

  if (cli.report) {
    const report: QAReport = {
      total: allIssues.length,
      blockers: allIssues.filter(i => i.severity === "BLOCKER").length,
      warns: allIssues.filter(i => i.severity === "WARN").length,
      infos: allIssues.filter(i => i.severity === "INFO").length,
      issues: allIssues,
    };
    fs.writeFileSync(path.resolve(cli.report), JSON.stringify(report, null, 2));
    console.log(`  Report: ${cli.report}\n`);
  }

  const hasBlockers = allIssues.some(i => i.severity === "BLOCKER");
  process.exit(hasBlockers ? 1 : 0);
}

main().catch(err => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
