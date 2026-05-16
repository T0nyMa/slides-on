/**
 * editor-server.ts — visual editor dev server
 *
 * Serves deck directory + injects editor.js/editor.css into HTML.
 * Handles save APIs for slides.json and edit-log.
 *
 * Usage:
 *   bun scripts/editor-server.ts <html-file> [--port 3456]
 */

import * as fs from "fs";
import * as path from "path";

const args = process.argv.slice(2);
let htmlFile = "";
let port = 3456;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--port" && args[i + 1]) { port = parseInt(args[i + 1]!, 10); i++; }
  else if (!args[i]!.startsWith("-")) { htmlFile = args[i]!; }
}

if (!htmlFile || !fs.existsSync(htmlFile)) {
  console.error("Usage: bun scripts/editor-server.ts <html-file> [--port 3456]");
  process.exit(1);
}

const htmlPath = path.resolve(htmlFile);
const deckDir = path.dirname(htmlPath);
const htmlName = path.basename(htmlPath);
const scriptDir = path.dirname(path.resolve(__filename));
const assetsDir = path.resolve(scriptDir, "../assets");

// Backup on first launch
for (const f of ["slides.json"]) {
  const src = path.join(deckDir, f);
  const bak = src + ".bak";
  if (fs.existsSync(src) && !fs.existsSync(bak)) {
    fs.copyFileSync(src, bak);
    console.log(`Backup: ${f} → ${f}.bak`);
  }
}

const MIME: Record<string, string> = {
  ".html": "text/html", ".css": "text/css", ".js": "application/javascript",
  ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2",
  ".woff": "font/woff", ".ttf": "font/ttf",
};

function serveFile(filePath: string): Response | null {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return null;
  const ext = path.extname(filePath);
  return new Response(fs.readFileSync(filePath), {
    headers: { "Content-Type": MIME[ext] || "application/octet-stream" },
  });
}

Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = decodeURIComponent(url.pathname);

    // API endpoints
    if (req.method === "POST") {
      const body = await req.json();

      if (pathname === "/api/save-json") {
        const jsonPath = path.join(deckDir, "slides.json");
        if (!fs.existsSync(jsonPath)) return Response.json({ error: "no slides.json" }, { status: 404 });
        const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
        const { slide, field, value } = body;
        if (typeof slide === "number" && data.slides[slide] && field) {
          data.slides[slide][field] = value;
          fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
          const assembleScript = path.resolve(scriptDir, "assemble-deck.ts");
          if (fs.existsSync(assembleScript)) {
            Bun.spawnSync(["bun", assembleScript, "--input", jsonPath, "--output", htmlPath]);
          }
        }
        return Response.json({ ok: true });
      }

      if (pathname === "/api/log") {
        const logPath = path.join(deckDir, "edit-log.jsonl");
        fs.appendFileSync(logPath, JSON.stringify(body) + "\n");
        return Response.json({ ok: true });
      }

      return Response.json({ error: "unknown endpoint" }, { status: 404 });
    }

    // Editor assets
    if (pathname === "/_editor/editor.js") return serveFile(path.join(assetsDir, "editor.js"));
    if (pathname === "/_editor/editor.css") return serveFile(path.join(assetsDir, "editor.css"));

    // HTML injection (skip if editor.js already embedded by skeleton.ts)
    if (pathname === "/" || pathname === `/${htmlName}`) {
      let html = fs.readFileSync(htmlPath, "utf-8");
      if (!html.includes('editor.js')) {
        const injection = `<link rel="stylesheet" href="/_editor/editor.css">\n<script src="/_editor/editor.js" defer><\/script>`;
        html = html.replace("</head>", `${injection}\n</head>`);
      }
      return new Response(html, { headers: { "Content-Type": "text/html" } });
    }

    // Static files from deck directory
    const deckResp = serveFile(path.join(deckDir, pathname.slice(1)));
    if (deckResp) return deckResp;

    // Resolve relative paths (e.g. ../../../assets/base.css)
    const resolvedPath = path.resolve(deckDir, pathname.slice(1));
    if (fs.existsSync(resolvedPath) && !fs.statSync(resolvedPath).isDirectory()) {
      return serveFile(resolvedPath);
    }

    // Fallback: try project root (browser normalizes ../../../assets/ to /assets/)
    const projectRoot = path.resolve(scriptDir, "..");
    const rootResp = serveFile(path.join(projectRoot, pathname.slice(1)));
    if (rootResp) return rootResp;

    return new Response("Not found", { status: 404 });
  },
});

console.log(`Editor server running at http://localhost:${port}`);
console.log(`Press E in browser to enter edit mode`);

Bun.spawn(["open", `http://localhost:${port}`]);
