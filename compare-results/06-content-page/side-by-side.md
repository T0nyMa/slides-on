# Content Page — 技术架构图（含烘焙文字）

## slides-on (deterministic TypeScript)

Use case: productivity-visual.
Asset type: one complete styled content page image, final raster page.
Aspect ratio: 16:9.
high quality, 2k, detailed, professional, clean composition.

Visual role: complete content page — standalone deliverable image.
ALL visible Chinese text MUST be styled according to the visual style rules below.

TEXT SAFE MODE: Leave clean blank label spaces for all Chinese text items.
Use empty pastel marker boxes or clean paper areas where text will be placed.
Do NOT render any Chinese characters — only blank reserved spaces.

Apply this exact visual style:

Clean technical schematic on deep blueprint blue background (#1A2744) with visible engineering grid.
Fine square grid covering entire canvas at low opacity (rgba(60,120,200,0.15)).
White-blue (#D0E4F7) primary line work, cyan (#4FC3F7) secondary, pale cyan dimension lines.
Precise geometric shapes: circles, arcs, rectangles, polygons with exact vertices — no hand-drawn irregularity.
Dashed lines for hidden edges. Cross-hair center marks on circles. Compass-drawn construction arcs (faint).
Dimension lines with arrowheads and measurement annotations. Border frame with title block (bottom-right).
Orthographic or isometric projection only. Engineering drawing precision throughout.
Amber (#FFB74D) for warning/emphasis marks only. Pale blue (#90CAF9) for annotations.
No hand-drawn wobble, no organic shapes, no natural forms, no color beyond the blueprint palette.
No photorealistic, no 3D perspective, no artistic flourishes, no decorative elements.

Role-specific instruction:
This is a content-page page. Text rendering rules: - Text is NOT baked into blueprint illustration images by default (text_baking: false)
- If text IS needed: clean technical lettering, monospaced or architectural hand-lettering
- All-caps short labels for technical annotations
- Title block text: project name, date, scale, sheet number
- NO decorative fonts, NO cursive, NO handwriting — clean technical lettering only

## Composition Archetype: Horizontal Process（水平流程）

- 一条从左到右的主轴线（线或箭头链）
- 4–7 个节点均匀分布在轴线上
- 每个节点：上方标签 + 中心简图 + 下方简短说明
- 节点间用细箭头连接
- 1–2 个注释框浮在轴线上下

## Scene Description
端云协同推理架构：端侧轻量模型处理80%简单请求（<10ms），云侧大模型处理20%复杂请求（<50ms），动态路由根据请求复杂度实时分流

## Required Text Only
- Title: 端云协同推理架构

## Composition Check
- Subject clarity: clear, centered or slightly offset
- Slide fit: suitable for presentation, not too busy
- Same visual style as other images in this deck (style lock applied)


---

## baoyu (LLM-generated via skill instructions)

---
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
- Total latency savings vs. cloud-only: ~40%
