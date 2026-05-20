---
name: slides-comic
description: Knowledge comic creator — 知识漫画/教育漫画/comic/manga generation. 6 art styles × 7 tones × 7 layouts. Create original educational comics with character consistency.
---

# slides-comic — Knowledge Comic Creator

Create original knowledge comics with flexible art × tone × layout combinations.

## Quick Reference

| Dimension | Options (6 × 7 × 7) |
|-----------|---------------------|
| Art styles | ligne-claire, manga, realistic, ink-brush, chalk, minimalist |
| Tones | neutral, warm, dramatic, romantic, energetic, vintage, action |
| Layouts | standard, cinematic, dense, splash, mixed, webtoon, four-panel |
| Presets | ohmsha, wuxia, shoujo, concept-story, four-panel |

Detailed reference: `art-styles/`, `tones/`, `layouts/`, `presets/`.

## Workflow

### Step 1: Content Analysis
Read the user's source material. Determine:
- Narrative type (tutorial, biography, concept explainer, story)
- Complexity (pages needed)
- Target audience (affects art style and tone)

### Step 2: Confirm Style (REQUIRED)
Ask user to confirm:
- Art style + tone (or preset)
- Page count estimate
- Character requirements

### Step 3: Storyboard
Create a storyboard using `storyboard-template.md`. Each page gets a panel breakdown:
```yaml
page: 1
panels: 3
layout: standard
description: "Introduction — protagonist encounters the problem"
```

### Step 4: Character Design
If characters are involved, create a character sheet using `character-template.md`.
Generate the character reference sheet FIRST (see Step 7.1).

### Step 5: Generate Prompts
For each page, assemble a prompt using slides-imagine with `role: comic-page`:
```bash
bun ../../scripts/imagine/main.ts --design manga --role comic-page \
  --art-style ligne-claire --tone warm --comic-layout standard \
  --characters "..." --panel-breakdown "..." --content "..."
```

Write each prompt to `prompts/NN-page-[slug].md` before generating.

### Step 6: Generate Images
1. Generate character sheet first at `characters/characters.png` (4:3 aspect, JPEG 80%)
2. Generate each page passing `--ref characters/characters.png` for consistency
3. Character reference ensures same faces, costumes, body proportions across pages

### Step 7: Merge to PDF
```bash
bun ../../scripts/imagine/merge-to-pdf.ts --input pages/ --output comic.pdf
```

## Text Fidelity

Never post-process generated comic images to fix text. If text is wrong, regenerate from a corrected prompt. See `slides-imagine/text-fidelity.md`.

## Image Generation Backend

Delegates to `slides-imagine/SKILL.md` with `role: comic-page`. The prompt assembler loads art-style + tone files for Layer 2 (visual style) and panel breakdown + character descriptions for Layer 3 (content).
