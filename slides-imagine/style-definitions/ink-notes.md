---
name: ink-notes
category: editorial
text_baking: true
---

# Ink Notes — AI Image Style Definition

Disciplined hand-drawn ink style on pure white. Black ink dominant (#1A1A1A) with sparse semantic accent colors (coral, teal, lavender). Sketchbook aesthetic — controlled imperfection, visible pen strokes, cross-hatched shading.

## Style Lock (跨页复用)

```text
Hand-drawn ink illustration on pure white paper background (#FFFFFF).
Black ink (#1A1A1A) for all primary lines — visible pen strokes with natural wobble, variable line weight (0.5–2pt).
Cross-hatched shading for depth — parallel ink lines at 45°, density varies from sparse to tight.
Sparse semantic accent colors: coral (#E8725A) for emphasis, teal (#5A9E8F) for secondary, lavender (#9B8EC4) for tertiary. Total colored pixels under 10%.
Dotted separator lines — evenly spaced dots, hand-drawn spacing.
Arrows and connectors: simple pen-drawn with filled arrowheads.
Rounded corner boxes (radius 8–12px equivalent) with slight pen overshoot at corners.
No gradients, no fills larger than a postage stamp, no digital smoothness.
Paper texture: faint grain, no grid, no lines.
```

## Color Palette

| Role | Color | Hex |
|------|-------|-----|
| Background | Pure white | #FFFFFF |
| Primary ink | Near-black | #1A1A1A |
| Accent warm | Coral | #E8725A |
| Accent cool | Teal | #5A9E8F |
| Accent calm | Lavender | #9B8EC4 |
| Shading | Light gray ink | rgba(26,26,26,0.15) |

## Visual Elements

- Black ink lines with controlled wobble and variable weight
- Cross-hatched shading for depth and emphasis
- Dotted separators and borders
- Pen-drawn arrows with filled heads
- Rounded boxes with corner overshoot
- Sparse color fills (under 10% of canvas)
- Faint paper grain texture

## Typography

- Hand-lettered, ink-pen style — slightly irregular baselines
- Title: large, double-weight black ink
- Labels: smaller, single-weight, legible
- NO typewriter, NO digital fonts, NO all-caps blocks

## Composition

- Full white canvas (no margin color)
- Central content area with generous whitespace (40%+ whitespace)
- Ink structure elements (boxes, arrows, dividers) define the layout grid
- Accent colors used sparingly as visual anchors — one per content zone
- Balanced left-right weight distribution

## Negative Constraints

- NO filled rectangles larger than a small label
- NO gradients, NO drop shadows, NO digital effects
- NO straight/mechanical lines — everything is hand-drawn
- NO color-rich — accent colors total under 10% of canvas
- NO dark backgrounds, NO colored backgrounds
- NO photorealistic elements

## Role-Specific Prompt Fragments

### illustration

```
Visual role: hand-drawn ink illustration on white paper, suitable for editorial/opinion backgrounds.
NO text, NO labels — pure visual atmosphere.
Black ink dominant with sparse accent color marks.
40%+ whitespace for text overlay. Paper-like texture, controlled hand-drawn imperfection.
```

### content-page

```
Visual role: hand-drawn ink content page on white paper.
Black ink text, hand-lettered. Accent colors used sparingly for emphasis boxes.
Structured layout with ink-drawn boxes, arrows, and dotted dividers.
All Chinese text must be hand-lettered ink style — slightly irregular, human, warm.
```
