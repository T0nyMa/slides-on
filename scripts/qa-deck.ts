/**
 * qa-deck.ts — minimal deck QA: detect the 3 fatal issues only.
 * Usage: npx tsx scripts/qa-deck.ts index.html [--canvas 3:4|16:9]
 *
 * Checks per slide:
 *   1. OVERFLOW — any child element extends beyond slide bottom
 *   2. CHROME OVERLAP — absolute chrome (topbar/footer) intersects content
 *   3. FILL — content area fill rate < 50% or > 98%
 *
 * Exit code 0 = clean, 1 = issues found (with JSON report on stdout).
 */

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Issue {
  slide: number;
  type: 'overflow' | 'chrome-overlap' | 'underfill' | 'overfill';
  detail: string;
}

interface SlideReport {
  slide: number;
  fillPct: number;
  issues: Issue[];
}

function resolvePath(input: string): string {
  if (input.startsWith('file://') || input.startsWith('http')) return input;
  if (path.isAbsolute(input)) return `file://${input}`;
  return `file://${path.resolve(process.cwd(), input)}`;
}

async function main() {
  const args = process.argv.slice(2);
  const htmlPath = args[0];
  const canvas = args.includes('--canvas') ? args[args.indexOf('--canvas') + 1] : '3:4';

  if (!htmlPath) {
    console.error('Usage: npx tsx scripts/qa-deck.ts <index.html> [--canvas 3:4|16:9]');
    process.exit(2);
  }

  const url = resolvePath(htmlPath);
  const viewport = canvas === '16:9'
    ? { width: 1280, height: 720 }
    : { width: 810, height: 1080 };

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const reports: SlideReport[] = await page.$$eval('.slide', (slides) => {
    interface RawReport {
      slide: number;
      fillPct: number;
      issues: { type: string; detail: string }[];
    }

    return slides.map((slide, i): RawReport => {
      const issues: { type: string; detail: string }[] = [];
      const slideRect = slide.getBoundingClientRect();
      const slideBottom = slideRect.bottom;

      // Find absolute-positioned chrome elements
      const chromeEls: Element[] = [];
      slide.querySelectorAll('[class*="chr-topbar"], [class*="chr-footer"], [class*="chr-dots"]').forEach((el) => {
        const style = window.getComputedStyle(el);
        if (style.position === 'absolute' || style.position === 'fixed') {
          chromeEls.push(el);
        }
      });

      // Find content children (non-absolute, non-chrome)
      const contentChildren: Element[] = [];
      slide.querySelectorAll(':scope > *').forEach((child) => {
        const style = window.getComputedStyle(child);
        const isChrome = child.className && (
          child.className.includes('chr-topbar') ||
          child.className.includes('chr-footer') ||
          child.className.includes('chr-dots')
        );
        if (style.position !== 'absolute' && style.position !== 'fixed' && !isChrome) {
          contentChildren.push(child);
        }
      });

      // 1. OVERFLOW — any child extends beyond slide
      slide.querySelectorAll('*').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom > slideBottom + 2) {
          const tag = el.tagName.toLowerCase();
          const cls = (el.className && typeof el.className === 'string') ? el.className.slice(0, 40) : '';
          const text = (el.textContent || '').trim().slice(0, 30);
          issues.push({
            type: 'overflow',
            detail: `<${tag}${cls ? '.' + cls.split(' ')[0] : ''}> "${text}..." overflows by ${Math.round(rect.bottom - slideBottom)}px`,
          });
        }
      });

      // 2. CHROME OVERLAP — absolute chrome intersects content
      const chromeRects = chromeEls.map((el) => el.getBoundingClientRect());
      for (const child of contentChildren) {
        const childRect = child.getBoundingClientRect();
        for (const cr of chromeRects) {
          if (
            childRect.bottom > cr.top + 2 &&
            childRect.top < cr.bottom - 2 &&
            childRect.right > cr.left &&
            childRect.left < cr.right
          ) {
            const text = (child.textContent || '').trim().slice(0, 30);
            issues.push({
              type: 'chrome-overlap',
              detail: `"${text}..." overlaps with chrome at y=${Math.round(cr.top)}`,
            });
            break; // one overlap per child is enough
          }
        }
      }

      // 3. FILL — content area fill rate
      if (contentChildren.length > 0) {
        const firstTop = contentChildren[0].getBoundingClientRect().top;
        const lastBottom = contentChildren[contentChildren.length - 1].getBoundingClientRect().bottom;
        const contentHeight = lastBottom - firstTop;

        const slideStyle = window.getComputedStyle(slide);
        const padTop = parseFloat(slideStyle.paddingTop);
        const padBottom = parseFloat(slideStyle.paddingBottom);
        const available = slideRect.height - padTop - padBottom;
        const fillPct = Math.round((contentHeight / available) * 100);

        // Cover (slide 1) and last slide (thanks/end) allow low fill
        const isCoverOrEnd = i === 0 || i === slides.length - 1;
        if (fillPct < 50 && !isCoverOrEnd) {
          issues.push({ type: 'underfill', detail: `fill rate ${fillPct}% — consider adding components or increasing text length` });
        }
        if (fillPct > 98) {
          issues.push({ type: 'overfill', detail: `fill rate ${fillPct}% — content may overflow with font variations` });
        }

        return { slide: i + 1, fillPct, issues };
      }

      return { slide: i + 1, fillPct: 0, issues };
    });
  });

  await browser.close();

  // Output
  const totalIssues = reports.reduce((sum, r) => sum + r.issues.length, 0);

  if (totalIssues === 0) {
    console.log('✓ All slides pass QA');
    console.log('');
    for (const r of reports) {
      console.log(`  Slide ${r.slide}: ${r.fillPct}% fill`);
    }
    process.exit(0);
  }

  console.log(`✗ ${totalIssues} issue(s) found:\n`);
  for (const r of reports) {
    if (r.issues.length === 0) continue;
    console.log(`── Slide ${r.slide} (${r.fillPct}% fill) ──`);
    for (const issue of r.issues) {
      const icon = { overflow: '↧', 'chrome-overlap': '⊞', underfill: '⬚', overfill: '⬛' }[issue.type];
      console.log(`  ${icon} [${issue.type}] ${issue.detail}`);
    }
    console.log('');
  }
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
