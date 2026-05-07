/** Canvas dimension presets for different output formats. */
export interface CanvasSize {
  width: number;
  height: number;
  label: string;
}

export const CANVAS_PRESETS: Record<string, CanvasSize> = {
  "16:9": { width: 1920, height: 1080, label: "Standard widescreen" },
  "4:3": { width: 1024, height: 768, label: "Classic" },
  "3:4": { width: 810, height: 1080, label: "Xiaohongshu / Vertical" },
  "9:16": { width: 1080, height: 1920, label: "Stories / Full vertical" },
  "1:1": { width: 1080, height: 1080, label: "Square" },
  "2.35:1": { width: 1920, height: 817, label: "Cinematic" },
  "a4-landscape": { width: 1123, height: 794, label: "A4 Landscape" },
};

/** Parse a canvas argument: "16:9" | "3:4" | "810x1080" */
export function resolveCanvas(raw: string): CanvasSize {
  // Check presets first
  if (CANVAS_PRESETS[raw]) return CANVAS_PRESETS[raw];

  // Check "WxH" format
  const m = /^(\d+)x(\d+)$/.exec(raw);
  if (m) return { width: parseInt(m[1]), height: parseInt(m[2]), label: `${m[1]}×${m[2]}` };

  throw new Error(
    `Unknown canvas "${raw}". Use a preset (${Object.keys(CANVAS_PRESETS).join(", ")}) or WxH format.`
  );
}
