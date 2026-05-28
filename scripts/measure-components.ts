/**
 * measure-components.ts
 * Renders a test page at 3:4 viewport and measures actual component heights.
 * Usage: npx tsx scripts/measure-components.ts
 */
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const HTML_PATH = `file://${__dirname}/measure-components.html`;

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // 3:4 portrait viewport (810 × 1080)
  await page.setViewportSize({ width: 810, height: 1080 });
  await page.goto(HTML_PATH, { waitUntil: 'networkidle' });

  // Wait for fonts / layout
  await page.waitForTimeout(500);

  const results: { label: string; height: number; width: number }[] = [];

  const slides = await page.$$('.slide');
  for (const slide of slides) {
    const label = await slide.getAttribute('data-label');
    if (!label) continue;

    // Activate this slide
    await slide.evaluate((el) => {
      document.querySelectorAll('.slide').forEach((s) => s.classList.remove('is-active'));
      (el as HTMLElement).classList.add('is-active');
    });
    await page.waitForTimeout(100);

    // Find the first non-absolute child (the actual component)
    const box = await slide.evaluate((el) => {
      // Get the slide's content area
      const style = window.getComputedStyle(el);
      const padTop = parseFloat(style.paddingTop);
      const padLeft = parseFloat(style.paddingLeft);

      // Find all non-absolute direct children
      const children = Array.from(el.children).filter((c) => {
        const cs = window.getComputedStyle(c);
        return cs.position !== 'absolute' && cs.position !== 'fixed';
      });

      if (children.length === 0) return null;

      const first = children[0];
      const rect = first.getBoundingClientRect();
      const slideRect = el.getBoundingClientRect();

      return {
        height: Math.round(rect.height),
        width: Math.round(rect.width),
        // Content area start (top padding of slide)
        contentTop: Math.round(slideRect.top + padTop),
      };
    });

    if (box) {
      results.push({ label, height: box.height, width: box.width });
    }
  }

  // Print results as a markdown table
  console.log('\n## tech-fresh Design CSS — 3:4 实测组件高度 (810×1080)');
  console.log('');
  console.log('| 组件 | 实测高度(px) | 实测宽度(px) |');
  console.log('|------|-------------|-------------|');

  const categories: Record<string, typeof results> = {};
  for (const r of results) {
    const cat = r.label.split(' (')[0];
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(r);
  }

  for (const r of results) {
    console.log(`| ${r.label} | ${r.height} | ${r.width} |`);
  }

  // Also print a compact version for copy-paste into content-rules-portrait.md
  console.log('\n\n--- 速查表格式 (可直接替换) ---\n');
  for (const r of results) {
    console.log(`| ${r.label} | ${r.height} |`);
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
