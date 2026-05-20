# AI Image Generation Alignment Design

Align slides-on's image generation capabilities with 5 baoyu-skills consumer skills: article-illustrator, comic, cover-image, image-cards, and infographic. Provider scope limited to DashScope + OpenAI.

## Context

slides-on generates interactive HTML presentations with optional AI illustrations. The upstream project baoyu-skills has 5 mature consumer-level image generation skills that slides-on should align with. The core strategy is injecting baoyu's content layer (Type templates, Palette dimension, Consumer prompt modes, preset system) into slides-on's existing engine layer (prompt-assembler.ts, Style Lock, Role separation).

### Current State

- `prompt-assembler.ts`: 3-layer assembly engine with 2 roles (`illustration`, `content-page`)
- 17 style-definitions with Style Lock blocks, hex palettes, negative constraints, role fragments
- 10 archetype compositions for slide layouts
- 10 providers (only DashScope + OpenAI will be upgraded)
- `slides-imagine/infographic/`: 21 layout + 22 style files copied from baoyu but not wired into the pipeline

### Key Architectural Advantage

slides-on's prompt assembler is deterministic TypeScript code, while baoyu relies on AI-driven template filling at runtime. This means slides-on can guarantee reproducible prompts for the same inputs — a property baoyu cannot provide.

## Architecture

```
slides-imagine/SKILL.md (route dispatch)
  │
  ├─ mode: illustration     ← existing, slide background images
  ├─ mode: content-page     ← existing, text baked into image
  ├─ mode: infographic      ← new, 21 layout × 22 style
  ├─ mode: cover            ← new, 6 type × 11 palette × 7 rendering
  ├─ mode: image-card       ← new, 12 style × 8 layout × 3 palette
  └─ mode: comic-page       ← new, 6 art × 7 tone × 7 layout
      │
      ▼
  prompt-assembler.ts (deterministic assembly)
  ┌─ Layer 1: Role template (selected by mode)
  ├─ Layer 2: Style Lock (from style-definitions/, overridable by palette)
  └─ Layer 3: Content layer (archetype / layout-guideline / type-composition)
      │
      ▼
  providers/ (DashScope + OpenAI only upgraded)
```

All 6 roles share the same assembler code path. Layer 2 (Style Lock) is the visual DNA that ensures cross-mode consistency. Layer 1 and Layer 3 vary per role.

## Provider Layer

### OpenAI (`scripts/imagine/providers/openai.ts`)

- Default model: `dall-e-3` → `gpt-image-2`
- Dual API dialect support:
  - `/images/generations` (standard, gpt-image-2 native with custom sizes)
  - `/chat/completions` (fallback for endpoints that only expose chat interface)
- Reference image: implement via `/images/edits` endpoint (currently declared in config but not implemented in code)
- Retain dall-e-3 as fallback when `quality: "standard"`

### DashScope (`scripts/imagine/providers/dashscope.ts`)

- Default model: `wanx-v1` → `qwen-image-2.0-pro`
- Existing qwen model detection (`model.startsWith("qwen-")`) already works, only default value changes

### Shared Provider Changes

- `scripts/imagine/config.ts`: align `supportsReference` flags with actual implementations
- Retry logic: `MAX_ATTEMPTS = 3`, 2s delay between retries, failed items retried without regenerating successful ones
- Restore text-fidelity policy: `slides-imagine/text-fidelity.md` — never paint over bitmap text, regenerate from corrected prompt if text is wrong

## Prompt Assembler Extension

### Role Types

```typescript
type PromptRole =
  | "illustration"    // existing: pure visual, no text
  | "content-page"    // existing: text baked into image
  | "infographic"     // new: structured info visualization
  | "cover"           // new: article/deck cover image
  | "image-card"      // new: social media card (pure image)
  | "comic-page"      // new: comic page with characters
```

Each role has its own Layer 1 template function. All roles share Layer 2 Style Lock loading.

### Palette Dimension

New independent axis. `AssemblyParams.palette?: string`.

Assembly logic:
1. Load `style-definitions/{design}.md` → get Style Lock with default colors
2. If palette specified, load `slides-imagine/palettes/{palette}.md` → get replacement color table
3. Replace hex values in Style Lock: palette colors replace style's defaults, style's rendering rules (line weights, textures, do/don't) are preserved
4. Palette background replaces style's background color

Initial palettes (4 from baoyu-article-illustrator, 7 from baoyu-cover-image):
- `macaron`: soft pastels on warm cream (#F5F0E8)
- `warm`: earth tones on soft peach (#FFECD2)
- `neon`: bright neon on dark purple (#1A1025)
- `mono-ink`: near-black on pure white, <10% color
- `elegant`, `cool`, `dark`, `earth`, `vivid`, `pastel`, `retro`, `duotone`

Palette file format:
```markdown
## Background
[color + hex]

## Colors
| Role | Color | Hex |
|------|-------|-----|
...

## Semantic Constraint
[usage rules, e.g. "NO cool colors" for warm palette]
```

### Preset System

New convenience layer. `AssemblyParams.preset?: string`.

Presets stored in `slides-imagine/presets.json` as a flat mapping:
```json
{
  "hand-drawn-edu": { "design": "sketch-notes", "palette": "macaron", "archetype": "horizontal-process" },
  "knowledge-card": { "design": "notion", "layout": "dense" },
  "poster": { "design": "screen-print", "layout": "sparse" }
}
```

Resolution order: preset expands first → explicit params override preset values.

### Layer 3 per Role

| Role | Layer 3 Content |
|------|----------------|
| illustration | archetype (existing 10) |
| content-page | archetype + text items (existing) |
| infographic | `infographic/layouts/{layout}.md` guideline + `infographic/styles/{style}.md` guideline + structured content |
| cover | `cover/types.md` type composition + mood/font/text-level dimension directives |
| image-card | `image-cards/elements/` system + layout density rules + content |
| comic-page | character descriptions (from characters.md) + panel breakdown + consistency reminder |

### AssemblyParams Interface

```typescript
export interface AssemblyParams {
  // shared
  design: string;
  role: PromptRole;
  aspect: string;
  content?: string;
  quality?: "normal" | "2k";
  palette?: string;
  preset?: string;
  ref?: string;

  // illustration / content-page
  archetype?: string;
  title?: string;
  subtitle?: string;
  labels?: string[];
  textSafe?: boolean;

  // infographic
  layout?: string;
  infographicStyle?: string;
  language?: string;
  textLabels?: string[];

  // cover
  coverType?: string;
  mood?: string;
  font?: string;
  textLevel?: string;
  rendering?: string;

  // image-card
  cardStyle?: string;
  cardLayout?: string;
  position?: string;

  // comic-page
  artStyle?: string;
  tone?: string;
  comicLayout?: string;
  characters?: string;
  panelBreakdown?: string;
}
```

## Consumer Mode Specifications

### Infographic Mode

Files already present in `slides-imagine/infographic/` (21 layouts, 22 styles). Three files to add as pipeline glue:

| File | Purpose | Source |
|------|---------|--------|
| `infographic/base-prompt.md` | 8-placeholder template ({{LAYOUT}}, {{STYLE}}, {{ASPECT_RATIO}}, {{LANGUAGE}}, {{LAYOUT_GUIDELINES}}, {{STYLE_GUIDELINES}}, {{CONTENT}}, {{TEXT_LABELS}}) | Port from baoyu-infographic |
| `infographic/analysis-framework.md` | Content analysis methodology (6 dimensions: core content, context, audience, value proposition, narrative potential, adaptation) | Port from baoyu-infographic |
| `infographic/structured-content-template.md` | Bridge between analysis and visual design (3-phase: outline → section development → data integrity check) | Port from baoyu-infographic |

Routing: trigger words "信息图/infographic/可视化/高密度信息大图" → `mode: infographic`.

### Cover Mode

New directory `slides-imagine/cover/`:

| File | Content |
|------|---------|
| `cover/types.md` | 6 type composition guidelines (hero/conceptual/typography/metaphor/scene/minimal) with composition rules |
| `cover/renderings/` | 7 rendering style files (flat-vector, hand-drawn, painterly, digital, pixel, chalk, screen-print) |
| `cover/dimensions.md` | mood (subtle/balanced/bold) × font (clean/handwritten/serif/display) × text-level (none/title-only/title-subtitle/text-rich) rules |
| `cover/auto-selection.md` | Content signal → dimension recommendation tables |

Palettes shared from `slides-imagine/palettes/` (11 total, used across all modes).

Routing: trigger words "封面图/cover image/文章封面/make cover" → `mode: cover`.

### Image-Card Mode

Not a new sub-skill. Routes through slides-card with a mode switch: user explicitly asks for "AI 图片卡片/图片版/手绘风" → `mode: ai-image`, otherwise default `mode: html`.

New directory `slides-imagine/image-cards/`:

| File | Content |
|------|---------|
| `image-cards/styles/` | 12 style files (cute, fresh, warm, bold, minimal, retro, pop, notion, chalkboard, study-notes, screen-print, sketch-notes) with element combinations, color palettes, do/don't rules |
| `image-cards/elements/canvas.md` | 8 layout definitions (sparse/balanced/dense/list/comparison/flow/mindmap/quadrant) with density rules |
| `image-cards/elements/decorations.md` | Decorative asset catalog |
| `image-cards/elements/image-effects.md` | Cutout, stroke, filter effects |
| `image-cards/elements/typography.md` | Text hierarchy and decorated text types |
| `image-cards/prompt-assembly.md` | Assembly rules and examples |

Image-1 anchor chain is handled by the caller, not the assembler. Caller generates image 1 first, then passes its path as `ref` parameter to subsequent `assemblePrompt()` calls. The assembler injects `--ref` instruction into the prompt but does not manage generation order.

Routing: slides-card SKILL.md internal branch, `mode: html` (default) vs `mode: ai-image`.

### Comic Mode

New sub-skill `slides-comic/` at root level (peer to slides-card, slides-ppt):

| File | Content |
|------|---------|
| `slides-comic/SKILL.md` | Comic workflow: analyze → confirm → storyboard → characters → prompts → generate → PDF |
| `slides-comic/art-styles/` | 6 files: ligne-claire, manga, realistic, ink-brush, chalk, minimalist |
| `slides-comic/tones/` | 7 files: neutral, warm, dramatic, romantic, energetic, vintage, action |
| `slides-comic/layouts/` | 7 files: standard, cinematic, dense, splash, mixed, webtoon, four-panel |
| `slides-comic/presets/` | 5 files: ohmsha, wuxia, shoujo, concept-story, four-panel |
| `slides-comic/character-template.md` | Character sheet format with appearance, costume, expression range, age variants |
| `slides-comic/storyboard-template.md` | YAML frontmatter + per-page panel breakdown |
| `slides-comic/base-prompt.md` | Comic page prompt base (panel borders, speech bubbles, narrator boxes, scientific visualization) |
| `slides-comic/workflow.md` | 9-step detailed procedures |
| `slides-comic/auto-selection.md` | Content signal → art+tone+layout+preset mapping |

Root SKILL.md routing table adds: trigger words "漫画/comic/manga/教育漫画/知识漫画" → `slides-comic/SKILL.md`.

Comic prompts use assembler `role: "comic-page"`. Layer 2 loads `art-styles/{art}.md` + `tones/{tone}.md` instead of standard style-definitions. Layer 3 contains character descriptions + panel breakdown + consistency reminder block.

Character reference chain: generate `characters/characters.png` first (aspect 4:3), compress to JPEG 80%, pass as `ref` to all subsequent page generations.

### Article-Illustrator Capability

Not a standalone mode. Its capabilities are distributed across the assembler's existing dimensions:

- 6 Type templates → archetype extensions (infographic, scene, flowchart, comparison, framework, timeline already partially covered by existing 10 archetypes)
- 23 styles → 17 already have style-definitions, 6 to be added (ink-notes, screen-print, flat-doodle, nature, playful, retro)
- 4 palettes → ported to `slides-imagine/palettes/`
- 26 presets → added to `slides-imagine/presets.json`

## Testing and Quality Assurance

### Prompt Snapshot Tests

Maintain golden prompt baselines in `slides-imagine/prompt-snapshots/`:

```
illustration--sketch-notes--cover-metaphor.txt
content-page--sketch-notes--horizontal-process.txt
infographic--craft-handmade--bento-grid.txt
cover--hero--warm--hand-drawn.txt
image-card--cute--balanced.txt
comic-page--manga--neutral--standard.txt
```

New script `scripts/imagine/snapshot-test.ts`:
1. Parse filename to extract assembler parameters
2. Call `assemblePrompt()` with those parameters
3. Diff output against baseline file
4. Exit non-zero on unexpected differences

Integrated into `bun scripts/qa.ts --check`.

### Style Definition Completeness Check

Extend `scripts/validate-slides.ts`:
- Every style-definition must contain: Style Lock, Color Palette, Negative Constraints, at least one Role Fragment
- Every palette file must contain: Background, Colors table, Semantic Constraint
- Every preset in presets.json must reference existing design/palette/archetype
- Infographic layout/style file existence validated

### End-to-End Verification

For each consumer mode at delivery:
1. Select 2-3 representative inputs
2. Generate prompts via assembler
3. Run through both DashScope and OpenAI
4. Visual comparison with equivalent baoyu output (manual)
5. Freeze verified prompts as snapshot baselines

## File Changes Summary

### New Files (~80)

```
slides-imagine/
  palettes/                         ← 11 palette files
    macaron.md, warm.md, neon.md, mono-ink.md,
    elegant.md, cool.md, dark.md, earth.md,
    vivid.md, pastel.md, retro.md, duotone.md
  cover/                            ← cover mode
    types.md, dimensions.md, auto-selection.md
    renderings/ (7 files)
  image-cards/                      ← image-card mode
    styles/ (12 files)
    elements/ (4 files)
    prompt-assembly.md
  infographic/                      ← infographic pipeline glue
    base-prompt.md
    analysis-framework.md
    structured-content-template.md
  presets.json                      ← preset expansion table
  text-fidelity.md                  ← restored policy
  prompt-snapshots/ (6+ files)      ← golden prompt baselines
  style-definitions/ (6 new files)  ← ink-notes, screen-print, flat-doodle, nature, playful, retro

slides-comic/                       ← new sub-skill
  SKILL.md
  art-styles/ (6 files)
  tones/ (7 files)
  layouts/ (7 files)
  presets/ (5 files)
  character-template.md
  storyboard-template.md
  base-prompt.md
  workflow.md
  auto-selection.md

scripts/imagine/
  snapshot-test.ts                   ← snapshot diff script
```

### Modified Files (~8)

```
scripts/imagine/prompt-assembler.ts  ← core: 6 roles + palette + preset
scripts/imagine/providers/openai.ts  ← gpt-image-2 + ref image + retry
scripts/imagine/providers/dashscope.ts ← qwen-image-2.0-pro default
scripts/imagine/config.ts            ← provider config alignment
slides-imagine/SKILL.md              ← add infographic/cover mode routing
slides-card/SKILL.md                 ← add mode: ai-image branch
SKILL.md (root)                      ← routing table adds slides-comic
scripts/validate-slides.ts           ← style-definition completeness checks
```

## Implementation Phases

```
Phase 0: Provider upgrade (prerequisite for all modes)
  ├── OpenAI gpt-image-2 + dual API dialect
  ├── DashScope qwen-image-2.0-pro
  ├── OpenAI ref image implementation
  ├── Retry logic (MAX_ATTEMPTS=3)
  └── Restore text-fidelity policy

Phase 1: Assembler core extension
  ├── 6 role types in prompt-assembler.ts
  ├── Palette loading + override logic
  ├── Preset expansion
  ├── 6 new style-definitions
  ├── 11 palette files
  └── Snapshot test infrastructure

Phase 2: Infographic mode (minimal increment, files already present)
  └── Wire base-prompt template + analysis framework + structured content bridge

Phase 3: Cover mode (single image output, relatively simple)
  └── types.md + renderings/ + dimensions + auto-selection

Phase 4: Image-card mode (needs anchor chain)
  └── slides-card dual mode + 12 styles + 8 layouts + element system

Phase 5: Comic sub-skill (largest scope, new sub-skill)
  └── Full slides-comic/ directory + character system + storyboard + ref chain + PDF merge
```
