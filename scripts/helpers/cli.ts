/** Minimal CLI argument parser for render-precise.ts */

export interface RenderOptions {
  input: string;
  output: string;
  slides: number | "auto";
  canvas: string;
  dsf: number;
  format: "png" | "jpeg";
  quality: number;
  waitAnimations: boolean;
  extraDelay: number;
  verbose: boolean;
}

export function parseArgs(args: string[]): RenderOptions {
  const positional: string[] = [];
  const opts: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        opts[key] = next;
        i++;
      } else {
        opts[key] = "true";
      }
    } else if (a.startsWith("-")) {
      const key = a.slice(1);
      const next = args[i + 1];
      if (next && !next.startsWith("-")) {
        opts[key] = next;
        i++;
      } else {
        opts[key] = "true";
      }
    } else {
      positional.push(a);
    }
  }

  return {
    input: positional[0] || "",
    output: opts.output || opts.o || "",
    slides: opts.slides === "auto" ? "auto" : parseInt(opts.slides) || "auto",
    canvas: opts.canvas || opts.c || "16:9",
    dsf: parseFloat(opts.dsf || opts.d || "2"),
    format: (opts.format || opts.f || "png") as "png" | "jpeg",
    quality: parseInt(opts.quality || opts.q || "90"),
    waitAnimations: opts["wait-animations"] === "true" || opts.a === "true",
    extraDelay: parseInt(opts["extra-delay"] || opts.e || "500"),
    verbose: opts.verbose === "true" || opts.v === "true",
  };
}

export function printUsage(): string {
  return `
render-precise.ts — High-precision HTML slide deck → PNG/JPEG renderer

Usage: bun scripts/render-precise.ts <html-file> [options]

Options:
  --slides N|auto      Number of slides or auto-detect (default: auto)
  --canvas PRESET|WxH  Canvas size (default: 16:9)
                       Presets: 16:9, 4:3, 3:4 (XHS), 9:16, 1:1, 2.35:1, a4-landscape
                       Custom: 810x1080
  --dsf N              Device scale factor (default: 2)
  --format png|jpeg    Output format (default: png)
  --quality N          JPEG quality 1-100 (default: 90)
  --output DIR         Output directory (default: <input-stem>-png/)
  --wait-animations    Wait for CSS animations to complete (slower but accurate)
  --extra-delay MS     Extra delay after all waits in ms (default: 500)
  --verbose            Print detailed progress

Examples:
  bun scripts/render-precise.ts deck.html
  bun scripts/render-precise.ts deck.html --canvas 3:4 --dsf 2
  bun scripts/render-precise.ts deck.html --slides 9 --canvas 16:9 --dsf 3
  bun scripts/render-precise.ts deck.html --slides auto --canvas 810x1080 --output ./out/
`;
}
