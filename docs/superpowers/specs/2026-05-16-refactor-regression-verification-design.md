# Refactor Regression Verification Design

## Goal

Verify that the self-contained HTML refactoring (inline CSS/JS, no external refs) produces
visually identical output to the previous `<link>`-based architecture.

## Baseline

Commit `e044f20` (the last commit before refactoring started).

## Layer 1: CSS Variable Consistency (full coverage, fast)

Script iterates all 17 decks in `templates/full-decks/`:

1. Extract old skeleton (`git show e044f20:scripts/assemble/skeleton.ts`)
2. For each deck's `slides.json`:
   - Assemble with old skeleton → old HTML
   - Assemble with new skeleton → new HTML
3. For each HTML, extract computed `:root` CSS variables:
   `--bg`, `--text-1`, `--text-2`, `--text-3`, `--accent`, `--accent-2`, `--accent-3`,
   `--font-sans`, `--font-mono`, `--radius`, `--shadow`, `--slide-padding`,
   `--c-gap`, `--h1-size`, `--body-size`, `--page-margin`
4. Diff old vs new variable values per deck. Any difference = regression.

## Layer 2: Screenshot Pixel Diff (sample coverage, visual)

Sample 3 decks with diverse designs:
- `xhs-post` (3:4 portrait, hand-drawn design)
- `xhs-white-editorial` (3:4 portrait, editorial design)
- `hermes-cyber-terminal` (16:9, dark terminal design)

For each:
1. Assemble old and new HTML
2. Playwright screenshot each slide @2x
3. Pixelmatch diff old vs new per slide
4. Threshold: > 1% pixel difference = flag for manual review

## Layer 3: web-design-guidelines Audit (new detection)

Run the web-design-guidelines skill against the generated HTML to catch issues
in categories: Interactions, Animations, Layout, Content, Design.

## Output

Single report file: `docs/superpowers/specs/2026-05-16-verification-report.md`

Contains per-deck: variable diff → screenshot diff → guidelines findings → pass/fail.
