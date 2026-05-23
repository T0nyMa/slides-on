# baoyu Prompt — Content Page — 技术架构图（含烘焙文字）

**Skill**: baoyu-article-illustrator + baoyu-infographic
**Description**: Generate a text-rich content page explaining an AI inference architecture

---

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