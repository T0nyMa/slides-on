---
name: blueprint
category: technical
text_baking: false
---

# Blueprint — AI Image Style Definition

Clean technical schematic style. Dark blue background with white/cyan line work, grid overlay, precise geometric precision. Engineering drawing aesthetic — exact, measured, authoritative.

## Color Palette

| Role | Color | Hex |
|------|-------|-----|
| Background | Deep blueprint blue | #1A2744 |
| Grid lines | Subtle blue grid | rgba(60,120,200,0.15) |
| Primary lines | White-blue | #D0E4F7 |
| Secondary lines | Cyan | #4FC3F7 |
| Dimension lines | Pale cyan | rgba(79,195,247,0.5) |
| Highlight | Bright white | #FFFFFF |
| Warning/Accent | Amber | #FFB74D |
| Annotation | Pale blue | #90CAF9 |

## Visual Elements

- Grid overlay: fine square grid covering entire canvas (engineering graph paper)
- White/cyan line work on dark blue background — like a diazo blueprint
- Precise geometric shapes: circles, arcs, rectangles, polygons with exact vertices
- Dimension lines with arrowheads and measurement annotations
- Dashed lines for hidden edges or alternative paths
- Cross-hair center marks on circles
- Border frame with title block (bottom-right, engineering drawing style)
- Compass-drawn construction arcs (faint)
- Annotation callout lines pointing to specific features
- NO organic shapes, NO hand-drawn irregularities — this is TECHNICAL

## Typography

- Text is NOT baked into blueprint illustration images by default (text_baking: false)
- If text IS needed: clean technical lettering, monospaced or architectural hand-lettering
- All-caps short labels for technical annotations
- Title block text: project name, date, scale, sheet number
- NO decorative fonts, NO cursive, NO handwriting — clean technical lettering only

## Composition

- Full canvas engineering drawing aesthetic
- Main technical illustration centered, occupying 60–70% of canvas
- Title block in bottom-right corner
- Grid lines visible throughout at low opacity
- Dimension lines, cross-hairs, and construction marks visible
- Symmetrical where appropriate, balanced where not
- Fixed shell: blueprint blue, grid type, line weight, title block position
- Vary the central technical drawing subject across pages

## Negative Constraints

- NO hand-drawn wobble — lines must be precise, straight, mechanical
- NO organic shapes, NO natural forms — everything is engineered geometry
- NO color beyond the blueprint palette (white, cyan, amber, pale blue)
- NO photorealistic rendering, NO 3D perspective (orthographic/isometric projection only)
- NO gradients (except subtle vignette on blueprint paper)
- NO decorative elements, NO artistic flourishes
- NO text that would compete with overlaid HTML text (illustration role)
- NO fake spec text, NO filler labels

## Role-Specific Prompt Fragments

### illustration

```
Visual role: blueprint technical illustration background for engineering/architecture slides.
NO text, NO labels, NO annotations, NO words in the image — text is overlaid by the slide engine.
Clean technical schematic on dark blueprint blue with white/cyan line work and visible grid.
Precise geometric shapes, dimension lines, engineering drawing precision.
Main subject centered, leave 20–25% margins as clean grid area for text overlay.
Suitable for technical architecture, system design, or engineering presentation backgrounds.
```

### content-page

```
Blueprint style is NOT recommended for content-page role.
The technical nature and dark background make text overlay integration difficult.
Use illustration role for visual atmosphere, and let the HTML slide engine handle text.
If content-page is absolutely required, use white annotation text in engineering-drawing title-block style, with dimension lines pointing to key features.
```
