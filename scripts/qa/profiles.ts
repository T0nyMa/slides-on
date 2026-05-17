export interface CanvasProfile {
  fillMin: number;
  fillMax: number;
  componentMin: number;
  componentMax: number;
  bottomEmptyMaxRatio: number;
  gridMaxCols: number;
  bodyMinCqi: number;         // 正文最小 cqi（p, c-body, c-step-body 等）
  uiTextMinCqi: number;       // UI 文本最小 cqi（c-badge, c-kpi-label 等）
  fontNoPx: boolean;
  h1MinCqi: number;
  h1MaxCqi: number;
  bodyMinCqiAbs: number;
  bodyMaxCqi: number;
}

export const PROFILES: Record<string, CanvasProfile> = {
  portrait: {
    fillMin: 0.50,
    fillMax: 0.85,
    componentMin: 3,          // 2x 字体下每页 3-6 组件即可
    componentMax: 6,
    bottomEmptyMaxRatio: 0.25,
    gridMaxCols: 2,
    bodyMinCqi: 3.0,          // 3:4 正文至少 3cqi (24px) — "大一倍" 规范，step/note body 3cqi 可接受
    uiTextMinCqi: 2.2,        // UI 文本 (badge/label) 至少 2.2cqi (18px)
    fontNoPx: true,
    h1MinCqi: 5,
    h1MaxCqi: 9,
    bodyMinCqiAbs: 3.0,       // 绝对最小 3cqi (24px) — 警告
    bodyMaxCqi: 5.5,          // 正文上限
  },
  landscape: {
    fillMin: 0.20,
    fillMax: 0.85,
    componentMin: 2,
    componentMax: 6,
    bottomEmptyMaxRatio: 0,
    gridMaxCols: 0,
    bodyMinCqi: 0,
    uiTextMinCqi: 0,
    fontNoPx: false,
    h1MinCqi: 0,
    h1MaxCqi: 0,
    bodyMinCqiAbs: 0,
    bodyMaxCqi: 0,
  },
};

export function detectCanvas(html: string): "portrait" | "landscape" {
  return /class="[^"]*portrait/.test(html) || /class='[^']*portrait/.test(html)
    ? "portrait" : "landscape";
}
