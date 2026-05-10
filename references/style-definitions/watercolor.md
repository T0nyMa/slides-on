---
name: watercolor
category: artistic
text_baking: false
---

# Watercolor — AI Image Style Definition

Soft watercolor painting style with translucent washes, bleeding edges, and organic color transitions. Artistic, dreamy, emotionally expressive.

## Color Palette

| Role | Color | Hex |
|------|-------|-----|
| Background | Soft cream paper | #FDFBF7 |
| Primary wash | Soft blue wash | rgba(100,149,237,0.4) |
| Secondary wash | Warm rose wash | rgba(220,130,130,0.35) |
| Tertiary wash | Soft green wash | rgba(130,190,150,0.35) |
| Accent | Deep indigo | #3D5A80 |
| Highlight | Pale gold | #E8D5A5 |

Note: Watercolor colors are inherently translucent and blend at edges. Hex values describe the approximate pigment — actual rendering should show dilution, bleeding, and paper texture showing through.

## Visual Elements

- Soft translucent washes of color with visible brush strokes
- Bleeding edges where colors meet — no hard boundaries
- Visible watercolor paper texture (cold-press, subtle grain)
- Salt-effect or bloom textures in larger wash areas (optional)
- Paint concentration: darker at stroke edges (drying edge effect), lighter in washes
- Color mixing on paper: overlapped washes create new hues
- Splatter dots near focal areas (tiny, controlled)
- Simple botanical or organic forms if decorative elements needed
- Soft, diffused edges on all shapes
- NO hard outlines — shapes defined by color boundaries, not lines

## Typography

- Text should NOT be baked into watercolor images by default (text_baking: false)
- If text is needed, use delicate hand-lettering with fine brush script
- Text should appear as if written with a fine brush or fountain pen
- Keep text minimal — watercolor style is about visual mood, not information density

## Composition

- Organic, asymmetrical balance — not rigidly centered
- Focal subject in one area, colors bleeding softly into surrounding whitespace
- Large areas of clean paper showing through (40–50% whitespace)
- Color transitions guide the eye across the composition
- Soft vignette effect: colors fade toward edges
- Atmospheric, emotional — the image should evoke a feeling, not just convey information

## Negative Constraints

- NO hard edges, NO sharp vector lines
- NO flat color blocks, NO solid fills — everything must show wash translucency
- NO digital art look, NO gradient tool look
- NO photorealistic rendering
- NO dark or heavy compositions — keep light and airy
- NO text-heavy layouts — watercolor is for mood, not data
- NO neon colors, NO saturated pigments — watercolor is naturally muted
- NO clip art, NO stock illustration feel

## Role-Specific Prompt Fragments

### illustration

```
Visual role: watercolor illustration / background for artistic, emotional slides.
NO text, NO words, NO labels in the image.
Soft watercolor washes on textured paper, translucent colors bleeding gently at edges.
Main subject in center or off-center, with large areas of clean paper for text overlay.
Atmospheric, dreamy, emotionally warm — not informational.
Drying edge effect on brush strokes, paper grain visible through paint.
Suitable for cover slides, emotional storytelling, or artistic presentation backgrounds.
```

### content-page

```
Watercolor style is NOT recommended for content-page role.
The soft, diffuse nature of watercolor makes text rendering unreliable.
Use illustration role instead, or choose a hand-drawn style for text-heavy pages.
```
