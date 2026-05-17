export interface CanvasProfile {
  fillMin: number;
  fillMax: number;
  componentMin: number;
  componentMax: number;
  bottomEmptyMaxRatio: number;
  gridMaxCols: number;
  bodyMinCqi: number;
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
    componentMin: 4,
    componentMax: 8,
    bottomEmptyMaxRatio: 0.25,
    gridMaxCols: 2,
    bodyMinCqi: 1.4,
    fontNoPx: true,
    h1MinCqi: 5,
    h1MaxCqi: 9,
    bodyMinCqiAbs: 1.4,
    bodyMaxCqi: 2.5,
  },
  landscape: {
    fillMin: 0.20,
    fillMax: 0.85,
    componentMin: 2,
    componentMax: 6,
    bottomEmptyMaxRatio: 0,
    gridMaxCols: 0,
    bodyMinCqi: 0,
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
