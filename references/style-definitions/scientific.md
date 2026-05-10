---
name: scientific
category: academic
text_baking: false
---

# Scientific — AI Image Style Definition

Clean scientific and academic diagram style. Precise technical linework on neutral backgrounds, clear labeling zones, consistent annotation systems. Suitable for research papers, technical presentations, and engineering documentation.

## Style Lock (跨页复用)

```text
Clean scientific technical diagram on neutral white (#FFFFFF) or very light warm-gray (#FAFBFC) background.
Precise technical linework: ruler-straight black lines (#1E1E1E) at consistent 1–1.5pt for primary strokes, 0.5pt for secondary/hidden detail.
Mathematical annotation style: thin callout lines with small dot terminators at attachment points.
Architectural diagram aesthetic: boxes with 2–4pt radius rounded corners, crisp outlines, and light fills at 5–10% opacity.
Scientific color coding: methodology blue #4472C4, data orange #ED7D31, result green #70AD47, caution yellow #FFC000, attention red #E74C3C.
Arrow conventions: thin lines with filled triangular arrowheads for flow, open arrowheads for inheritance, dashed lines for optional/alternative paths.
Layered depth: elements separated into 2–3 z-depth layers — background grid, midground diagram, foreground annotations.
Faint technical grid or dot-grid on background (3–5% opacity, #D0D0D0) for spatial precision.
Axis lines with tick marks, measurement brackets, or dimension lines where needed for technical precision.
No hand-drawn wobble, no artistic textures, no decorative elements — everything serves a technical purpose.
```

## Color Palette

| Role | Color | Hex |
|------|------|-----|
| Background | Clean white | #FFFFFF |
| Background alt | Light warm-gray | #FAFBFC |
| Primary line | Technical black | #1E1E1E |
| Grid | Faint technical grid | #D0D0D0 |
| Methodology | Science blue | #4472C4 |
| Data / Results | Data orange | #ED7D31 |
| Performance | Result green | #70AD47 |
| Caution / Note | Signal yellow | #FFC000 |
| Attention | Alert red | #E74C3C |
| Secondary line | Annotation gray | #8C8C8C |
| Fill light | Subtle fill 5% | rgba(30,30,30,0.05) |

## Visual Elements

- Precision linework: ruler-straight lines, mathematically accurate curves, consistent stroke weights
- Technical boxes and panels: rounded rectangles with crisp outlines and subtle fills
- Arrow conventions: filled heads for flow, open heads for inheritance/type, dashed for optional paths
- Scientific annotation system: thin callout lines with dot terminators at attachment points
- Faint dot-grid or line-grid background for spatial precision (3–5% opacity)
- Axis lines with tick marks and labels (when data visualization is implied)
- Measurement brackets and dimension lines for scale reference
- Layered z-depth: background grid → midground diagram → foreground labels
- Architecture diagram elements: layers, modules, interfaces, data flow — clearly delineated
- Node-and-edge graph structures with disciplined layout algorithms (layered, radial, or force-directed appearance)
- Component boundary boxes with dashed outlines and subtle fills for grouping

## Typography

- Text should NOT be baked into scientific images by default (text_baking: false)
- If text must be baked, use clean technical sans-serif: Helvetica, Arial, or equivalent
- Labels: 7–10pt equivalent, left-aligned or centered within their element boxes
- Annotations: small, precise, connected via thin callout lines
- NO decorative fonts, NO serif display faces — pure technical clarity
- Formula notation: mathematical style when needed (italic variables, upright functions)
- All text must be perfectly horizontal — no rotated or angled labels (accessibility)
- Text color: near-black (#1E1E1E) for primary, annotation gray (#8C8C8C) for secondary

## Composition

- Clean, ordered layout with clear visual hierarchy
- Background grid layer (3–5% opacity) establishing spatial reference
- Primary diagram occupies 55–65% of canvas — centered with generous margins
- Annotation zones in margins (left, right, or bottom) connected via callout lines
- Consistent spacing: equal padding between diagram elements, equal margin on all sides
- Fixed shell: background grid, line style, color code conventions, arrow standards
- Vary only the central diagram content across pages
- Title zone at top 8–10% (if baked), or left empty for slide engine overlay
- Legend or key block in bottom-right corner when multiple coded elements are present

## Negative Constraints

- NO hand-drawn wobble or artistic line irregularity
- NO watercolor, NO paint textures, NO artistic paper backgrounds
- NO cartoon elements, NO character figures, NO anthropomorphic representations
- NO 3D perspective views — use flat 2D orthographic (isometric acceptable if strictly technical)
- NO decorative flourishes, NO ornamental borders, NO "pretty" gradients
- NO photorealistic elements — pure technical diagram aesthetic
- NO dark backgrounds — maintain bright, high-contrast technical readability
- NO text rendered at angles — all labels horizontal (accessibility requirement)
- NO inconsistent arrow styles — strictly follow the defined arrow conventions
- NO color-coding that relies on color alone — complement with shape, pattern, or label differentiation
- NO crowd-sourced or informal visual style — maintain rigorous academic/professional tone

## Role-Specific Prompt Fragments

### illustration

```
Visual role: scientific technical diagram / background illustration.
Clean white or light warm-gray background (#FFFFFF or #FAFBFC).
Precise technical linework with consistent 1–1.5pt primary strokes and 0.5pt secondary detail.
Scientific color-coded elements (blue #4472C4, orange #ED7D31, green #70AD47).
Faint dot-grid background for spatial precision. NO text, NO labels, NO annotations in the image.
Leave clear annotation zones in the margins for text overlay by the slide engine.
Suitable for research presentations, engineering reviews, and technical documentation slides.
```

### content-page

```
Visual role: complete scientific diagram page — standalone deliverable with baked annotations.
Clean white background with faint dot-grid. Precise technical linework in center (55–65% of canvas).
ALL visible text as clean technical sans-serif: labels connected via thin callout lines with dot terminators.
Text rendered at 7–10pt equivalent, perfectly horizontal, left-aligned or centered within element boxes.
Scientific color coding maintained throughout (blue=method, orange=data, green=result, yellow=caution, red=attention).
Keep text minimal and technical — see Required text only below. Use mathematical precision in all labels.
NO decorative fonts, NO angled text, NO informal language — everything reads like a peer-reviewed diagram.
```
