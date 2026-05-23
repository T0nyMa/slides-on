# slides-on Prompt — Content Page — 技术架构图（含烘焙文字）

**Role**: content-page
**Design**: blueprint
**Aspect**: 16:9

---

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
