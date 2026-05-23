/** Minimal CLI argument parser for render-precise.ts v2 */

export interface RenderOptions {
  input: string;
  output: string;
  canvas: string;
  dsf: number;
  selector: string;
  format: "png" | "jpeg";
  quality: number;
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
    canvas: opts.canvas || opts.c || "16:9",
    dsf: parseFloat(opts.dsf || opts.d || "2"),
    selector: opts.selector || opts.s || ".slide",
    format: (opts.format || opts.f || "png") as "png" | "jpeg",
    quality: parseInt(opts.quality || opts.q || "90"),
    verbose: opts.verbose === "true" || opts.v === "true",
  };
}

export function printUsage(): string {
  return `
render-precise.ts — HTML page elements → PNG/JPEG renderer

Usage: bun scripts/render-precise.ts <html-file> [options]

Options:
  --canvas PRESET|WxH  Canvas size (default: 16:9)
                       Presets: 16:9, 4:3, 3:4, 9:16, 1:1, 2.35:1, a4-landscape
                       Custom: 810x1080
  --dsf N              Device scale factor (default: 2)
  --selector SEL       CSS selector for page elements (default: .slide)
  --format png|jpeg    Output format (default: png)
  --quality N          JPEG quality 1-100 (default: 90)
  --output DIR         Output directory (default: <input-stem>-png/)
  --verbose            Print detailed progress

Examples:
  bun scripts/render-precise.ts deck.html
  bun scripts/render-precise.ts card.html --canvas 3:4 --selector .slide
  bun scripts/render-precise.ts page.html --selector .card --dsf 2
  bun scripts/render-precise.ts deck.html --canvas 16:9 --output ./out/
`;
}
