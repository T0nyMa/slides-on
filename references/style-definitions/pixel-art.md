---
name: pixel-art
category: retro
text_baking: true
---

# Pixel Art — AI Image Style Definition

Crisp 8-bit/16-bit pixel art style with visible pixel grid, high-saturation colors, and sharp aliased edges. Retro game aesthetic, highly distinctive.

## Style Lock (跨页复用)

```text
Crisp pixel art with visible square pixel grid — all shapes composed of distinct pixels, no anti-aliasing.
Dark retro game background: deep space blue #1A1C2C or dark purple #2D1B4E.
Sharp aliased edges on everything — no smooth curves, no bezier curves, no gradients.
High-saturation accent colors: cyber yellow #FFD700, neon cyan #00F5FF, hot magenta #FF00FF, electric green #39FF14, pixel orange #FF6B35.
Dithering for all shading: checkerboard patterns, ordered dither, no smooth gradients.
8-bit sprite-style elements at consistent pixel resolution. Scanline overlay optional for CRT monitor feel.
Pixel-perfect alignment — everything snaps to invisible pixel grid.
Central pixel art scene with dark border margins (25–30% canvas edge). Retro game HUD elements as decoration.
No anti-aliasing, no smooth curves, no photorealistic, no 3D, no mixed resolutions.
No fonts that aren't pixel-bitmap. Pure pixel art consistency across all elements.
```

## Color Palette

| Role | Color | Hex |
|------|-------|-----|
| Background 1 | Deep space blue | #1A1C2C |
| Background 2 | Dark purple | #2D1B4E |
| Ink / Outline | Near-black | #0F0F1A |
| Primary | Cyber yellow | #FFD700 |
| Accent 1 | Neon cyan | #00F5FF |
| Accent 2 | Hot magenta | #FF00FF |
| Accent 3 | Electric green | #39FF14 |
| Accent 4 | Pixel orange | #FF6B35 |
| Highlight | Pure white | #FFFFFF |
| Shadow | Dark pixel | #2A2A3A |

## Visual Elements

- Visible pixel grid — all shapes composed of distinct square pixels
- Sharp aliased edges — NO anti-aliasing, NO smooth curves
- 8-bit sprite-style icons and characters (16×16 to 32×32 virtual pixel size)
- Chunkier pixel clusters for larger objects, following pixel-perfect alignment
- Dithering patterns for shading (checkerboard, ordered dither, no gradient)
- Scanline overlay effect (optional, subtle horizontal lines)
- Retro game UI elements: health bars, coin counters, dialog boxes
- Sprite animation frames if multiple images in sequence
- Pixel-art text using blocky letterforms (like 8-bit game font)
- NO smooth lines, NO bezier curves, NO gradients — everything is pixel-grid-aligned

## Typography

- ALL text as pixel-art bitmap letterforms — blocky, monospaced, 8-bit game font style
- Each character composed of visible square pixels on grid
- Main titles: larger pixel size (equivalent to 16–20px bitmap font)
- Labels: smaller pixel size (equivalent to 8–12px bitmap font)
- Text often set in dark dialog-box rectangles with light pixel border
- NO smooth vector fonts, NO anti-aliased text
- Title: 5–12 Chinese characters (Chinese pixel fonts require larger grid, ~16×16 per character min)
- Labels: 2–4 per page, 2–6 characters each

## Composition

- Pixel-perfect alignment — everything snaps to the pixel grid
- Central focal area with generous dark border/margin (25–30% canvas edge as decorative pixel border)
- Retro game screen composition: main content area + optional HUD elements
- Dialog box at bottom for key text (classic RPG style)
- Sprite characters positioned at grid-aligned coordinates
- Fixed shell: pixel border style, color palette, dithering pattern, scanline presence
- Vary central pixel art scene across pages

## Negative Constraints

- NO anti-aliasing, NO smooth curves, NO gradients
- NO photorealistic elements, NO 3D rendering
- NO vector art, NO clean geometric shapes — everything is blocky pixels
- NO mixed resolutions — all pixels same size
- NO fonts that aren't pixel-bitmap style
- NO watercolor, NO hand-drawn, NO sketch — this is PURE pixel art
- NO fake English in text boxes, NO filler text
- NO high-res sprites mixed with low-res pixels — consistency is key

## Role-Specific Prompt Fragments

### illustration

```
Visual role: pixel art illustration / background for retro-tech or gaming slides.
NO text, NO words, NO labels in the image (pixel text would be unreadable when overlaid).
Pixel art scene: visible pixel grid, sharp aliased edges, dithering for shading.
Main pixel-art subject in center-right area, leave 35–40% left/dark area for HTML text overlay.
8-bit/16-bit game aesthetic, scanlines optional, dark space background.
Suitable for retro gaming, creative coding, or indie-dev presentation backgrounds.
```

### content-page

```
Visual role: complete pixel art page — retro game screen aesthetic.
ALL visible Chinese text MUST be pixel-art bitmap lettering, blocky and monospaced.
Text in dark dialog-box rectangles with light pixel border (classic RPG style).
Dithering for all shading, scanline overlay for CRT monitor feel.
Keep text short and exact — see Required text only below — Chinese pixel text requires 16×16 grid per character minimum.
NO smooth fonts, NO anti-aliased text — everything is crisp pixel-grid-aligned.
```
