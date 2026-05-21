/**
 * compare-prompts.ts — slides-on vs baoyu prompt comparison harness
 *
 * Generates prompts from slides-on's deterministic assemblePrompt() for
 * representative test cases. For each test case, also generates the
 * baoyu-equivalent prompt (what an LLM would write following baoyu's
 * skill instructions), enabling side-by-side structural comparison.
 *
 * Usage:
 *   bun scripts/imagine/compare-prompts.ts
 */

import { assemblePrompt } from "./prompt-assembler";
import type { AssemblyParams, PromptRole } from "./prompt-assembler";
import * as fs from "fs";
import * as path from "path";

// ─── Test Cases ──────────────────────────────────────────────────────

interface TestCase {
  id: string;
  label: string;
  description: string;
  slidesOnParams: AssemblyParams;
  // The baoyu prompt is what a Claude agent following baoyu's skill
  // instructions would generate for the same input
  baoyuPrompt: string;
  // Which baoyu skill this maps to
  baoyuSkill: string;
}

const OUT_DIR = path.resolve(import.meta.dir, "../../compare-results");

// ─── Main ────────────────────────────────────────────────────────────

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const cases = buildTestCases();

  const results: any[] = [];

  for (const tc of cases) {
    console.log(`\n${"=".repeat(70)}`);
    console.log(`[${tc.id}] ${tc.label}`);
    console.log(`${"=".repeat(70)}`);

    // Generate slides-on prompt
    let slidesOnPrompt = "";
    let slidesOnMeta: any = {};
    let slidesOnError = "";

    try {
      const result = assemblePrompt(tc.slidesOnParams);
      slidesOnPrompt = result.fullPrompt;
      slidesOnMeta = result.metadata;
    } catch (err: any) {
      slidesOnError = err.message;
      console.log(`  slides-on ERROR: ${err.message}`);
    }

    // Save comparison files
    const caseDir = path.join(OUT_DIR, tc.id);
    fs.mkdirSync(caseDir, { recursive: true });

    // slides-on prompt
    fs.writeFileSync(
      path.join(caseDir, "slides-on-prompt.md"),
      `# slides-on Prompt — ${tc.label}\n\n` +
      `**Role**: ${tc.slidesOnParams.role}\n` +
      `**Design**: ${tc.slidesOnParams.design}\n` +
      (tc.slidesOnParams.palette ? `**Palette**: ${tc.slidesOnParams.palette}\n` : "") +
      (tc.slidesOnParams.preset ? `**Preset**: ${tc.slidesOnParams.preset}\n` : "") +
      `**Aspect**: ${tc.slidesOnParams.aspect}\n\n` +
      `---\n\n${slidesOnPrompt}`
    );

    // baoyu prompt
    fs.writeFileSync(
      path.join(caseDir, "baoyu-prompt.md"),
      `# baoyu Prompt — ${tc.label}\n\n` +
      `**Skill**: ${tc.baoyuSkill}\n` +
      `**Description**: ${tc.description}\n\n` +
      `---\n\n${tc.baoyuPrompt}`
    );

    // Summary JSON
    const summary = {
      id: tc.id,
      label: tc.label,
      description: tc.description,
      baoyuSkill: tc.baoyuSkill,
      slidesOn: {
        role: tc.slidesOnParams.role,
        design: tc.slidesOnParams.design,
        metadata: slidesOnMeta,
        promptLength: slidesOnPrompt.length,
        promptLines: slidesOnPrompt.split("\n").length,
        error: slidesOnError || null,
      },
      baoyu: {
        promptLength: tc.baoyuPrompt.length,
        promptLines: tc.baoyuPrompt.split("\n").length,
      },
    };
    results.push(summary);

    // Per-case comparison
    fs.writeFileSync(
      path.join(caseDir, "comparison.json"),
      JSON.stringify(summary, null, 2)
    );

    // Side-by-side markdown
    fs.writeFileSync(
      path.join(caseDir, "side-by-side.md"),
      `# ${tc.label}\n\n` +
      `## slides-on (deterministic TypeScript)\n\n` +
      `${slidesOnError ? `**ERROR**: ${slidesOnError}` : slidesOnPrompt}\n\n` +
      `---\n\n` +
      `## baoyu (LLM-generated via skill instructions)\n\n` +
      `${tc.baoyuPrompt}\n`
    );

    console.log(`  slides-on: ${slidesOnPrompt.length} chars, ${slidesOnPrompt.split("\n").length} lines`);
    console.log(`  baoyu:     ${tc.baoyuPrompt.length} chars, ${tc.baoyuPrompt.split("\n").length} lines`);
    console.log(`  Saved → ${caseDir}/`);
  }

  // Aggregate report
  const report = generateReport(results);
  fs.writeFileSync(path.join(OUT_DIR, "report.md"), report);
  fs.writeFileSync(path.join(OUT_DIR, "results.json"), JSON.stringify(results, null, 2));

  console.log(`\n${"=".repeat(70)}`);
  console.log(`Report → ${OUT_DIR}/report.md`);
  console.log(`JSON   → ${OUT_DIR}/results.json`);
}

// ─── Test Case Definitions ───────────────────────────────────────────

function buildTestCases(): TestCase[] {
  return [
    // ─── Case 1: Infographic ───
    {
      id: "01-infographic",
      label: "Infographic — 推荐系统三阶段流程",
      description: "Generate an infographic explaining a 3-stage recommendation system pipeline",
      slidesOnParams: {
        design: "sketch-notes",
        role: "infographic",
        aspect: "3:4",
        content: "推荐系统三阶段流程：召回（从亿级商品池粗筛数千候选）→ 粗排（轻量模型打分，截断至数百）→ 精排（深度模型精准排序，输出Top50）",
        layout: "linear-progression",
        infographicStyle: "craft-handmade",
        language: "zh",
        title: "推荐系统三阶段流程",
        palette: "macaron",
        quality: "2k",
      },
      baoyuSkill: "baoyu-infographic",
      // This is what a Claude agent following baoyu-infographic SKILL.md
      // would generate after Steps 1-5 (analyze → structured content → confirm → prompt)
      baoyuPrompt: `---
layout: linear-progression
style: craft-handmade
aspect: 3:4
language: zh
---

Create a professional infographic following these specifications:

## Image Specifications

- **Type**: Infographic
- **Layout**: linear-progression
- **Style**: craft-handmade
- **Aspect Ratio**: 3:4
- **Language**: Chinese (zh)

## Core Principles

- Follow the layout structure precisely for information architecture
- Apply style aesthetics consistently throughout
- Hand-drawn quality throughout — paper texture, organic lines, craft aesthetic
- Keep information concise, highlight keywords and core concepts
- Use ample whitespace for visual clarity
- Maintain clear visual hierarchy

## Text Requirements

- All text must match the craft-handmade style — hand-drawn lettering feel
- Main titles should be prominent and readable
- Key concepts should be visually emphasized with highlighter or underline effects
- Labels should be clear and appropriately sized
- All text in Chinese

## Layout: linear-progression

Linear-progression presents information as a sequential flow from left to right (or top to bottom for portrait). Each stage connects to the next with directional cues (arrows, dotted lines, stepped elements).

**Structure**:
- Header zone: title spanning full width at top
- Flow zone: 3 connected stages arranged in vertical progression (portrait 3:4)
- Each stage: numbered step marker → stage name → key details (1-2 bullet points) → data metric
- Footer zone: source/citation line

**Visual Elements**:
- Numbered circular badges (01, 02, 03) as step markers
- Connecting arrows or dashed lines between stages
- Icon per stage representing the concept (filter funnel, scoring gauge, target/pinpoint)

## Style: craft-handmade

**Color Palette** (Macaron override):
- Background: warm cream #FFF8F0
- Primary text: dark brown #4A3728
- Accent 1: soft coral #FF8C7A
- Accent 2: mint green #7EC8A0
- Accent 3: butter yellow #FFD93D
- Accent 4: lavender #C3B1E1

**Visual Elements**:
- Paper texture background with subtle grain
- Hand-drawn wobbly borders and dividers
- Torn paper edge effects on content cards
- Hand-drawn icons with irregular strokes
- Dotted or dashed connecting lines

**Typography**: Warm hand-lettered style — rounded, slightly irregular characters with organic stroke weight variation

**Style Rules**:
- No perfect geometric shapes — everything looks hand-crafted
- Slight wobble in lines and borders
- Color fills slightly outside the lines

## Content

**Title**: 推荐系统三阶段流程

**Stage 1 — 召回 (Recall)**:
- 从亿级商品池粗筛数千候选
- Key metric: 亿级 → 数千
- Icon: filter/funnel

**Stage 2 — 粗排 (Pre-Ranking)**:
- 轻量模型打分，截断至数百
- Key metric: 数千 → 数百
- Icon: gauge/scale

**Stage 3 — 精排 (Ranking)**:
- 深度模型精准排序，输出Top50
- Key metric: 数百 → Top50
- Icon: target/bullseye

## Aspect Ratio Note
Portrait 3:4 — vertical flow, stages stacked top to bottom with generous inter-stage spacing.`,
    },

    // ─── Case 2: Cover Image ───
    {
      id: "02-cover",
      label: "Cover Image — 分布式系统技术博客封面",
      description: "Generate a hero cover image for a tech blog about distributed systems",
      slidesOnParams: {
        design: "dark-atmospheric",
        role: "cover",
        aspect: "16:9",
        content: "Building Resilient Distributed Systems: A Practical Guide to Consensus, Replication, and Fault Tolerance",
        coverType: "hero",
        mood: "bold",
        font: "clean",
        textLevel: "title-only",
        quality: "2k",
      },
      baoyuSkill: "baoyu-cover-image",
      baoyuPrompt: `---
type: cover
palette: dark
rendering: digital
---

# Content Context
Article title: Building Resilient Distributed Systems: A Practical Guide to Consensus, Replication, and Fault Tolerance
Content summary: Technical guide covering distributed consensus algorithms, data replication strategies, and fault tolerance patterns for building reliable distributed systems. Targets senior engineers and architects.
Keywords: distributed systems, consensus, replication, fault tolerance, resilience, architecture, raft, paxos

# Visual Design
Cover theme: Network resilience — interconnected nodes surviving failure
Type: hero
Palette: dark
Rendering: digital
Font: clean
Text level: title-only
Mood: bold
Aspect ratio: 16:9
Language: en

# Text Elements
Title: Building Resilient Distributed Systems

# Mood Application
Bold: Use high contrast, vivid saturated accent colors against dark background, heavy visual weight, dynamic energy. Bright neon-like accents on deep navy/charcoal.

# Font Application
Clean: Use clean geometric sans-serif typography. Modern, minimal letterforms. White or light text on dark background.

# Composition
Type composition (hero):
- Large focal visual occupies 60-70% of the area
- Title overlaid on lower third with clean separation
- Dramatic composition with strong focal point

Visual composition:
- Main visual: Abstract network topology — interconnected nodes forming a resilient mesh. Some nodes dimmed (simulating failure) while the network routes around them. Glowing data paths finding alternative routes.
- Layout: Central network diagram fills ~65% of canvas. Title bar at bottom with dark gradient overlay for readability.
- Decorative: Subtle grid pattern in background. Particles/particle streams between nodes.

Color scheme:
- Background: deep navy #0A0E27
- Primary accent: electric blue #00D4FF
- Secondary accent: amber/warning #FFB347
- Text: white #FFFFFF

Rendering notes (digital): Clean vector-style rendering with subtle glow effects. Sharp lines for network topology. Soft bloom on active nodes. Gradient overlays for depth.

Type notes (hero): Dramatic, large-scale visual with title overlay. The visual tells the story; the title anchors it.

Palette notes (dark): Deep dark background with bright, saturated accent colors. High contrast. Cinematic lighting feel.

# Reference Style — MUST INCORPORATE (extracted from visual analysis)
No reference images provided. Use the content themes to drive visual metaphor:
- Network/graph topology as primary visual
- Active vs. failed nodes showing resilience
- Particle streams representing data flow finding alternative paths`,
    },

    // ─── Case 3: Illustration (no text) ───
    {
      id: "03-illustration",
      label: "Illustration — 未来城市天际线（无文字背景图）",
      description: "Generate a futuristic city skyline illustration for a slide background",
      slidesOnParams: {
        design: "sketch-notes",
        role: "illustration",
        aspect: "16:9",
        content: "a futuristic city skyline at dusk with flying vehicles and holographic billboards",
        archetype: "cover metaphor",
        quality: "2k",
      },
      baoyuSkill: "baoyu-article-illustrator",
      baoyuPrompt: `---
type: scene
style: sketch-notes
aspect: 16:9
---

Create a professional illustration for a presentation slide following these specifications.

## Image Role
Illustration / background image for a presentation slide.
NO text, NO labels, NO numbers, NO words, NO letters, NO watermarks in the image.
Text will be overlaid by the slide rendering engine — leave clean empty zones for text.

## Visual Content
A futuristic city skyline at dusk with flying vehicles and holographic billboards.
The scene should evoke technological progress and urban innovation.

## Composition
Main subject positioned slightly off-center (golden ratio), leaving 35-45% of one side as text-safe empty space for overlaid slide text. The text-safe zone should be visually calm — sky gradient or smooth surface, not busy architectural detail.

Suitable for presentation slide background — visually engaging but not too busy to compete with overlaid content.

## Style: Sketch-Notes
- Hand-drawn quality with organic, slightly wobbly lines
- Paper texture background
- Warm, approachable feel — not cold or clinical
- Simplified architectural forms — suggestion of buildings rather than photorealistic detail
- Dotted or dashed accent lines for energy

## Color Palette
- Warm cream/off-white background (paper tone)
- Deep navy silhouettes for buildings
- Warm amber/orange glow for dusk sky and holographic elements
- Small pops of teal/mint for accent

## Aspect Ratio
16:9 — widescreen landscape. City skyline spans the full width with text-safe zone on the right third.

## Technical Requirements
- High quality, 2k resolution
- Professional, clean composition
- No text elements of any kind`,
    },

    // ─── Case 4: Image Card (social media) ───
    {
      id: "04-image-card",
      label: "Image Card — 小红书推荐系统科普卡片",
      description: "Generate a 3:4 social media card for Xiaohongshu about recommendation systems",
      slidesOnParams: {
        design: "xiaohongshu-white",
        role: "image-card",
        aspect: "3:4",
        content: "推荐系统是如何猜中你的心的？三个关键步骤：1) 用户画像——你的每一次点击都在塑造数字分身；2) 协同过滤——找到与你相似的人在看什么；3) 深度学习——神经网络理解内容的本质",
        cardStyle: "hand-drawn-edu",
        cardLayout: "flow",
        position: "cover",
        palette: "macaron",
        title: "推荐系统如何猜中你的心？",
        quality: "2k",
      },
      baoyuSkill: "baoyu-image-cards",
      baoyuPrompt: `---
type: infographic
style: hand-drawn-edu
layout: flow
aspect: 3:4
position: cover
---

Create a Xiaohongshu (Little Red Book) style infographic following these guidelines:

## Image Specifications

- **Type**: Infographic
- **Orientation**: Portrait (vertical)
- **Aspect Ratio**: 3:4
- **Style**: Hand-drawn illustration, educational

## Core Principles

- Hand-drawn quality throughout — NO realistic or photographic elements
- Warm, approachable educational feel — like a teacher's whiteboard notes
- Keep information concise, highlight keywords and core concepts
- Use ample whitespace for easy visual scanning on mobile
- Maintain clear visual hierarchy with playful energy

## Text Style (CRITICAL)

- **ALL text MUST be hand-drawn style** — rounded, slightly irregular
- Main title prominent and eye-catching — larger, bolder, with decorative underline
- Key concepts bold and enlarged
- Use highlighter effects (soft pastel blocks behind text) to emphasize keywords
- **DO NOT use realistic or computer-generated fonts**
- All text in Chinese

## Color Palette (Macaron Override)

- Background: warm white #FFFAF5
- Primary text: dark brown #5D4037
- Accent/Title highlight: soft coral #FF8C7A
- Secondary accent: mint green #7EC8A0
- Tertiary accent: butter yellow #FFD93D
- Highlighter: soft lavender #E8D5F5

## Visual Elements (Hand-Drawn Edu)

- Stick figure characters with simple expressions
- Hand-drawn icons (magnifying glass, heart, brain/neural network)
- Wobbly arrows connecting steps
- Numbered badges (01, 02, 03) drawn as hand-sketched circles
- Scattered small decorative elements (stars, sparkles, dots)

## Layout: Flow (Vertical)

**Information Density**: Medium
**Whitespace**: 35-40%

**Structure**:
- Top zone: Title with decorative banner (20% height)
- Middle zone: 3 steps flowing top-to-bottom with connecting arrows (55% height)
- Bottom zone: CTA or summary tagline (15% height)
- Remaining: breathing room

## Content

**Title**: 推荐系统如何猜中你的心？

**Step 1 — 用户画像**:
- 你的每一次点击都在塑造数字分身
- Visual: stick figure with profile card, click/tap indicators
- Keyword emphasis: "数字分身"

**Step 2 — 协同过滤**:
- 找到与你相似的人在看什么
- Visual: two connected stick figures with shared thought bubble
- Keyword emphasis: "相似的人"

**Step 3 — 深度学习**:
- 神经网络理解内容的本质
- Visual: simplified neural network diagram (hand-drawn circles and lines)
- Keyword emphasis: "理解内容"

**Footer**: 淘宝闪购推荐系统技术团队`,
    },

    // ─── Case 5: Comic Page ───
    {
      id: "05-comic",
      label: "Comic Page — 神经网络工作原理（日式漫画风）",
      description: "Generate a manga-style educational comic explaining how neural networks work",
      slidesOnParams: {
        design: "sketch-notes",
        role: "comic-page",
        aspect: "3:4",
        content: "神经网络就像一个多层的信息处理工厂。第一层（输入层）接收原始数据，就像工厂的原料仓库。中间层（隐藏层）是加工车间，每一层都在提取更抽象的特征。最后一层（输出层）给出最终答案——这是一只猫！",
        artStyle: "japanese-manga",
        tone: "warm",
        comicLayout: "classic-4-panel",
        characters: "一个好奇的机器人学徒和一位智慧的老教授猫",
        panelBreakdown: "Panel 1: 原料仓库（输入层）；Panel 2: 加工车间（隐藏层）；Panel 3: 质检包装（输出层）；Panel 4: 最终揭晓——猫的图片",
        quality: "2k",
      },
      baoyuSkill: "baoyu-comic",
      baoyuPrompt: `---
type: comic-page
art_style: japanese-manga
tone: warm
layout: classic-4-panel
aspect: 3:4
language: zh
---

# Knowledge Comic — 神经网络工作原理

## Visual Style: Japanese Manga (日式漫画)

**Art Style Characteristics**:
- Clean, expressive line art with varied line weight (G-pen for outlines, maru-pen for details)
- Large expressive eyes for characters, simplified but emotionally readable faces
- Speed lines and action effects for emphasis
- Screen tone (dot patterns) for shading and texture — NOT gradients
- Dynamic panel compositions with occasional border-breaking elements
- SFX (sound effects) rendered as hand-drawn katakana/Chinese characters integrated into the art

**Tone: Warm**:
- Soft, inviting color temperature — cream/beige base with sepia undertones
- Gentle lighting — like afternoon sunlight through a window
- Warm accent colors: amber, soft coral, golden yellow
- Background: warm off-white or tea-stained paper tone
- No cold blues or harsh whites

## Characters

**Character 1 — 好奇的机器人学徒 (Curious Robot Apprentice)**:
- Small, round robotic figure with expressive LED eyes (can show emotion through eye shape)
- Antenna on head that wiggles when curious
- Metallic but warm-toned (copper/brass accents)
- Always shown learning/observing
- Key expression: wide-eyed curiosity

**Character 2 — 智慧的老教授猫 (Wise Old Professor Cat)**:
- Elderly cat with half-moon spectacles
- Wears a small academic scarf or bow tie
- Carries a pointer stick or chalk
- Calm, patient expression — slightly squinted eyes
- White/grey fur with tabby stripes

**Consistency**: Both characters MUST maintain identical appearance across all 4 panels.

## Layout: Classic 4-Panel (四格漫画)

**Structure**: Vertical 3:4 canvas divided into 4 equal-height horizontal panels

**Panel flow**: Top → Bottom, reading order is ↓↓↓

Each panel:
- Clean black border, 2-3px weight
- Small gutter (gap) between panels for breathing room
- Panel number discreetly placed in corner (optional)

## Panel Breakdown

### Panel 1: 原料仓库（输入层）
**Scene**: The Robot Apprentice stands at the entrance of a massive warehouse filled with floating raw data icons (images, numbers, text symbols hovering in the air). The Professor Cat gestures toward the warehouse with his pointer.
**Caption**: "第一层：输入层 — 接收原始数据"
**Dialogue**: Professor Cat: "这是原料仓库，所有信息都从这里进入。" Robot: "哇，好多数据！"
**Visual notes**: Warehouse shelves stocked with abstract data cubes/pixels. "INPUT" sign above warehouse door. Warm lighting from overhead lamps.

### Panel 2: 加工车间（隐藏层）
**Scene**: Inside a multi-level workshop. Conveyor belts carry data between floors. On each level, small robot workers (simpler versions of the apprentice) examine and transform the data — shapes become more refined at each level. The Professor Cat points to a cross-section diagram on the wall.
**Caption**: "中间层：隐藏层 — 逐层提取特征"
**Dialogue**: Professor Cat: "每一层车间都在提取更抽象的特征。" Robot: "原来如此！一层比一层更懂数据！"
**Visual notes**: 3-4 visible workshop levels. Bottom level shows raw shapes → middle shows edges/patterns → top shows recognizable parts (ear shape, eye shape). Warm industrial lighting.

### Panel 3: 质检包装（输出层）
**Scene**: A final inspection station. The most refined data has arrived. The Professor Cat examines a glowing card that has just emerged from the final machine. The Robot Apprentice peers over eagerly.
**Caption**: "最后一层：输出层 — 给出最终答案"
**Dialogue**: Professor Cat: "最后一步：质检包装。答案即将揭晓..." Robot: "会是什么呢？好紧张！"
**Visual notes**: A packaging machine with a "RESULT" output slot. Glowing card emerging. Dramatic spotlight effect on the output area.

### Panel 4: 最终揭晓
**Scene**: The Professor Cat triumphantly holds up the result card — it shows a cute cat illustration with the label "猫！". The Robot Apprentice has LED eyes shaped like stars, jumping with excitement. Confetti/small stars in the background.
**Caption**: "答案揭晓：这是一只猫！"
**Dialogue**: Robot: "是猫！太神奇了！" Professor Cat: "神经网络，很简单吧？"
**Visual notes**: The cat on the card should look like a simplified version of the Professor Cat himself (meta joke). Celebration effects — small stars, sparkles, motion lines around the jumping Robot.

## Technical Specifications

- **Aspect Ratio**: 3:4 (portrait)
- **Quality**: 2K, high detail
- **Text**: All dialogue and captions in Chinese
- **Color**: Warm tone palette — cream/sepia base, amber/gold/copper accents, soft coral highlights
- **NO**: Photorealistic elements, 3D renders, gradient shading (use screen tones instead)

## Text Fidelity
All dialogue, captions, and labels embedded in the image must be clear and readable. The text is an integral part of the comic — it must be rendered correctly in Chinese.`,
    },

    // ─── Case 6: Content Page (text-rich infographic with baked text) ───
    {
      id: "06-content-page",
      label: "Content Page — 技术架构图（含烘焙文字）",
      description: "Generate a text-rich content page explaining an AI inference architecture",
      slidesOnParams: {
        design: "blueprint",
        role: "content-page",
        aspect: "16:9",
        content: "端云协同推理架构：端侧轻量模型处理80%简单请求（<10ms），云侧大模型处理20%复杂请求（<50ms），动态路由根据请求复杂度实时分流",
        archetype: "horizontal process",
        title: "端云协同推理架构",
        textSafe: true,
        quality: "2k",
      },
      baoyuSkill: "baoyu-article-illustrator + baoyu-infographic",
      baoyuPrompt: `---
type: infographic
style: technical-schematic
aspect: 16:9
language: zh
---

Create a professional infographic following these specifications:

## Image Specifications

- **Type**: Infographic / Architecture Diagram
- **Layout**: Horizontal flow — left to right pipeline
- **Style**: Technical schematic / blueprint
- **Aspect Ratio**: 16:9
- **Language**: Chinese (zh)

## Core Principles

- Technical blueprint aesthetic — blueprint grid background
- Clean engineering diagram style with precise lines
- Information architecture: overview → components → flow
- Keep text concise and technical
- Clear visual hierarchy with consistent styling

## Text Requirements

- ALL visible Chinese text MUST be styled according to the visual style rules
- The image is a standalone deliverable — text is baked into the image
- Main title: prominent, centered at top
- Component labels: clear, consistent positioning
- Data metrics: highlighted with visual emphasis (callout boxes, badges)
- All text in Chinese

## Style: Technical Schematic / Blueprint

**Color Palette**:
- Background: blueprint blue #1a3a5c
- Grid lines: lighter blue #2a5a8c
- Primary text/lines: white #FFFFFF
- Accent highlights: amber #FFB347
- Secondary accent: cyan #00D4FF

**Visual Elements**:
- Blueprint grid pattern across entire canvas
- Precise architectural lines with 90° angles
- Technical annotations with leader lines
- Geometric framing: rounded rectangles for components
- Coordinate markers in corners

**Typography**: Mono or technical sans-serif — precise, consistent letterforms. Clean uppercase labels for component names.

**Style Rules**:
- All elements appear as technical drawings on a blueprint
- Consistent line weights (thin for details, medium for borders, thick for emphasis)
- Data flow arrows: dashed lines with arrowheads
- Component boxes: white/cyan borders on blueprint background

## Layout: Horizontal Process (Left → Right)

**Zone 1 — Left: 端侧 (Edge/On-Device)**:
- Label: "端侧推理 (Edge Inference)"
- Components: 轻量模型 (Lightweight Model)
- Metrics: <10ms latency, 80% traffic share
- Visual: smartphone/edge device icon with local processing indicator
- Color accent: cyan

**Zone 2 — Center: 动态路由 (Dynamic Router)**:
- Label: "动态路由 (Dynamic Router)"
- Components: 复杂度评估 → 实时分流
- Metrics: Real-time decision
- Visual: branching node / traffic splitter diagram
- Color accent: amber

**Zone 3 — Right: 云侧 (Cloud)**:
- Label: "云侧推理 (Cloud Inference)"
- Components: 大模型 (Large Model)
- Metrics: <50ms latency, 20% traffic share
- Visual: server/cloud icon with GPU indicators
- Color accent: cyan

**Flow Indicators**:
- Left → Center: arrow labeled "简单请求 80%"
- Center → Right: arrow labeled "复杂请求 20%"
- Dashed return arrow: Right → Left labeled "模型同步/更新"

## Content

**Title**: 端云协同推理架构

**Core Concept**: Dynamic routing splits inference between edge and cloud based on request complexity. Edge handles simple cases with ultra-low latency; cloud handles complex cases with powerful models.

**Data Points**:
- Edge: 80% traffic, <10ms
- Cloud: 20% traffic, <50ms
- Total latency savings vs. cloud-only: ~40%`,
    },
  ];
}

// ─── Report Generation ────────────────────────────────────────────────

function generateReport(results: any[]): string {
  const lines: string[] = [];

  lines.push("# slides-on vs baoyu — Prompt Comparison Report");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| # | Test Case | slides-on Role | baoyu Skill | slides-on (chars) | baoyu (chars) | Ratio |");
  lines.push("|---|-----------|---------------|-------------|-------------------|---------------|-------|");

  let totalSlidesOn = 0;
  let totalBaoyu = 0;

  for (const r of results) {
    const ratio = r.baoyu.promptLength > 0
      ? (r.slidesOn.promptLength / r.baoyu.promptLength * 100).toFixed(0) + "%"
      : "N/A";
    lines.push(`| ${r.id} | ${r.label} | ${r.slidesOn.role} | ${r.baoyuSkill} | ${r.slidesOn.promptLength} | ${r.baoyu.promptLength} | ${ratio} |`);
    totalSlidesOn += r.slidesOn.promptLength;
    totalBaoyu += r.baoyu.promptLength;
  }

  lines.push(`| **Total** | | | | **${totalSlidesOn}** | **${totalBaoyu}** | **${(totalSlidesOn / totalBaoyu * 100).toFixed(0)}%** |`);
  lines.push("");

  lines.push("## Key Differences");
  lines.push("");
  lines.push("### slides-on (deterministic TypeScript)");
  lines.push("- **3-layer assembly**: Layer 1 (Role template) → Layer 2 (Style Lock + Palette) → Layer 3 (Content composition)");
  lines.push("- **Same input → same output**: No LLM variance");
  lines.push("- **Structured**: Role-specific templates with typed parameters");
  lines.push("- **Style definitions**: Loaded from markdown files, applied programmatically");
  lines.push("- **Palette override**: Hex value replacement while preserving rendering rules");
  lines.push("");
  lines.push("### baoyu (LLM-generated via skill instructions)");
  lines.push("- **AI agent interprets instructions**: No deterministic code for prompt assembly");
  lines.push("- **Content analysis first**: Creates analysis.md → structured-content.md → prompt");
  lines.push("- **YAML frontmatter**: Rich metadata in prompts (type, palette, references)");
  lines.push("- **Confirmation workflow**: Multi-step user interaction before generation");
  lines.push("- **Reference-driven design**: Detailed visual element extraction from reference images");
  lines.push("");

  lines.push("## Structural Comparison by Role");
  lines.push("");

  for (const r of results) {
    lines.push(`### ${r.id}: ${r.label}`);
    lines.push("");
    lines.push(`- **slides-on role**: \`${r.slidesOn.role}\`, design: \`${r.slidesOn.design}\``);
    lines.push(`- **baoyu skill**: \`${r.baoyuSkill}\``);
    lines.push(`- **slides-on**: ${r.slidesOn.promptLines} lines`);
    lines.push(`- **baoyu**: ${r.baoyu.promptLines} lines`);

    if (r.slidesOn.error) {
      lines.push(`- **slides-on ERROR**: ${r.slidesOn.error}`);
    }

    lines.push("");
    lines.push(`See: \`compare-results/${r.id}/side-by-side.md\``);
    lines.push("");
  }

  return lines.join("\n");
}

// ─── Run ──────────────────────────────────────────────────────────────

main();
