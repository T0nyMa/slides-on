---
name: vintage
category: retro
text_baking: true
---

# Vintage — AI Image Style Definition

Vintage and retro illustration style with aged paper textures, nostalgic color palettes, and classic print aesthetics. Evokes mid-century editorial, 1950s–1970s graphic design, old botanical prints, and vintage travel posters.

## Style Lock (跨页复用)

```text
Vintage illustration on aged paper background: warm parchment #F2E8D5 or antique cream #F5EDDC with subtle tea-stain edges and light paper fiber texture.
Retro color palette limited to 3–5 colors per image, all muted and time-worn: vintage brick red #B5533C, faded mustard #D4A843, dusty teal #4A7C82, olive drab #6B7052, muted navy #3D4551, cream highlight #FDF8F0.
Linework with a slight irregularity — not wobble, but the soft imperfection of letterpress or screen printing. Dark sepia ink (#3C2415) for outlines, 1–1.5pt weight.
Halftone dot shading for depth — small, evenly-spaced dots in the primary ink color, 10–30% density, mimicking old print techniques.
Decorative border elements: thin ornamental rules, corner flourishes, or simple geometric frame borders reminiscent of vintage bookplates.
Subtle paper aging effects: slight yellowing at edges (vignette), occasional foxing spots (tiny brown speckles at 3–5% opacity), gentle crease lines.
Vintage monogram or decorative initial caps as typographic ornaments. Ornamental dividers: thin rules with center diamond or circle motifs.
No digital smoothness, no neon, no modern flat-design elements — every detail should feel like it came from a mid-century print shop.
```

## Color Palette

| Role | Color | Hex |
|------|------|-----|
| Background | Warm parchment | #F2E8D5 |
| Background alt | Antique cream | #F5EDDC |
| Highlight | Cream highlight | #FDF8F0 |
| Ink primary | Dark sepia ink | #3C2415 |
| Accent 1 | Vintage brick red | #B5533C |
| Accent 2 | Faded mustard | #D4A843 |
| Accent 3 | Dusty teal | #4A7C82 |
| Accent 4 | Olive drab | #6B7052 |
| Accent 5 | Muted navy | #3D4551 |
| Aging spots | Foxing brown | rgba(139,109,82,0.05) |
| Halftone | Sepia halftone dots | rgba(60,36,21,0.15) |

## Visual Elements

- Aged paper texture as the dominant background — warm, slightly yellowed, with subtle fiber texture
- Tea-stain or oxidation vignette at page edges — slightly darker warm tone bleeding inward
- Halftone dot shading for all depth and shadow — small, evenly spaced dots mimicking screen printing
- Ornamental borders and frames: thin decorative rules, corner flourishes, vintage bookplate styling
- Vintage-style illustrations of objects: old tools, botanical specimens, astronomical diagrams, mechanical parts
- Decorative initial caps (drop caps) at the start of text sections, ornate and slightly flourished
- Ornamental dividers: thin rules with centered diamond, circle, or leaf motifs between sections
- Simple geometric patterns: classic Greek key, meander, or diamond repeat borders
- Subtle foxing spots — tiny brown speckles scattered randomly at very low opacity
- Worn or distressed edges: slight fading, ink bleed, or paper roughness at the image border
- Silhouette illustrations in dark sepia ink — classic vintage field-guide style

## Typography

- ALL text as vintage typography — serif typefaces with classic proportions (Garamond, Caslon, Baskerville style)
- Main titles: bold serif, deep sepia ink (#3C2415), centered or left-aligned with ornamental rule beneath
- Subtitles: italic serif, slightly smaller, muted brick red or dusty teal for contrast
- Body text: regular serif, well-leaded, justified or left-aligned, sepia ink
- Decorative drop caps: large, ornate initial letters at paragraph starts (2–3 lines tall)
- Labels and captions: small italic serif, placed beneath illustrations in muted ink
- Page numbers: small serif numerals in top or bottom corners, often with ornamental brackets
- NO sans-serif fonts — vintage aesthetic requires classic serif typography throughout
- NO modern geometric fonts — type should feel pre-digital, like letterpress or hot metal typesetting
- Title: 4–10 words, evocative and classic
- Labels: 2–6 per page, 2–8 words each, italic style

## Composition

- Formal, balanced compositions with classical proportions (golden ratio or rule of thirds)
- Central illustration or diagram framed by ornamental border elements
- Wide generous margins (12–18%) with decorative rules or corner ornaments
- Text blocks clearly separated from illustration areas
- Symmetrical or near-symmetrical balance — not modernist asymmetry
- Fixed shell: paper texture, ink color, border style, halftone convention, ornamental rules
- Vary only the central illustration subject and text content across pages
- Bottom area often features a decorative tailpiece or finial ornament

## Negative Constraints

- NO digital smoothness — all lines should show slight print-texture irregularity
- NO neon colors — palette is muted, aged, and time-softened
- NO pure black ink — use dark sepia (#3C2415) instead
- NO gradients or digital shading — use halftone dots for all depth
- NO modern sans-serif fonts — serif only
- NO photorealistic elements — everything should feel like print illustration
- NO bright white backgrounds — always aged paper tones
- NO 3D rendering, NO digital 3D effects
- NO vector-perfect curves — slight irregularity from print process is essential
- NO mixed historical periods — stick to one vintage era (mid-century) consistently
- NO modern UI elements or contemporary references

## Role-Specific Prompt Fragments

### illustration

```
Visual role: vintage illustration / background for retro-themed or historical slides.
Aged parchment or antique cream paper background (#F2E8D5 or #F5EDDC) with subtle tea-stain edges.
Vintage-style central illustration in dark sepia ink (#3C2415) with halftone dot shading.
Ornamental border or decorative frame elements. NO text, NO words, NO labels.
Leave 30–40% of canvas as clean aged-paper space for text overlay by the slide engine.
Suitable for history topics, classic literature presentations, heritage brand stories, or nostalgic-themed decks.
```

### content-page

```
Visual role: complete vintage page — standalone deliverable with all text and illustration baked.
Aged paper background with tea-stain edges, fiber texture, and subtle foxing spots.
ALL visible text as classic serif typography: bold sepia titles, italic brick-red subtitles, regular sepia body.
Ornamental drop caps at section starts. Halftone dot shading on all illustrated elements.
Decorative rules, corner ornaments, and vintage dividers between content sections.
Keep text evocative and classic — see Required text only below.
NO sans-serif fonts, NO modern language, NO digital aesthetic — everything must feel like a mid-century print artifact.
```
