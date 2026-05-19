---
name: fantasy-animation
category: artistic
text_baking: false
---

# Fantasy Animation — AI Image Style Definition

Enchanting fantasy art with an animated feature-film quality. Dreamy lighting, ethereal atmospheres, magical glow effects, and storybook wonder. Evokes Studio Ghibli serenity, classic Disney painterly backgrounds, and contemporary animated fantasy concept art.

## Style Lock (跨页复用)

```text
Dreamy fantasy animation art style — painterly digital background with soft brush textures and luminous atmospheric lighting.
Ethereal color palette: twilight lavender #8B7BB5, enchanted forest emerald #4A9E7E, sunset peach #F0B5A0, celestial gold #F5D57A, misty blue #A8C8E8, starlight silver #E8E8F0, magical coral #F0A0A0.
Soft volumetric lighting: god rays filtering through canopy or clouds, gentle rim light on subjects, ambient glow from magical light sources.
Painterly brush texture on all surfaces — visible digital brush strokes, not flat vector fills. Soft edge blending between color areas.
Atmospheric depth layering: foreground elements in sharper focus, midground luminous and detailed, background softly fading into mist.
Magical particle effects: floating light motes (tiny glowing dots), stardust trails, gentle firefly-like sparkles, soft bokeh circles in light areas.
Organic, flowing shapes: no sharp angles, no rigid geometry — everything feels natural, curved, and alive. Whimsical architectural elements (curved roofs, arched windows, winding paths).
Lush environmental elements: magical forests, floating islands, crystal caves, ancient libraries, celestial observatories — always with an enchanted twist.
Emotional warmth: the image should evoke wonder, serenity, or gentle melancholy — never dark horror or aggressive action.
No dark oppressive tones, no cyberpunk grit, no photorealistic harshness — pure animated fantasy warmth.
```

## Color Palette

| Role | Color | Hex |
|------|------|-----|
| Sky / Mist | Misty blue | #A8C8E8 |
| Sky / Dusk | Twilight lavender | #8B7BB5 |
| Environment | Enchanted emerald | #4A9E7E |
| Warm light | Sunset peach | #F0B5A0 |
| Magical light | Celestial gold | #F5D57A |
| Sparkle / Star | Starlight silver | #E8E8F0 |
| Accent warm | Magical coral | #F0A0A0 |
| Deep shadow | Deep forest purple | #2D2450 |
| Highlight | Pure light white | #FFFEF5 |
| Bokeh | Soft bokeh circles | rgba(255,254,245,0.15) |
| Light motes | Glowing particles | rgba(245,213,122,0.6) |

## Visual Elements

- Painterly digital brushwork — visible strokes, soft edges, no vector flatness
- God rays and volumetric light beams streaming through the scene
- Magical floating particles: light motes, stardust trails, soft bokeh circles
- Lush environmental storytelling: enchanted forests, floating islands, crystal formations, ancient stone arches
- Whimsical architecture: curved roofs with upturned eaves, spiral staircases, arched bridges, glowing windows
- Soft, organic shapes throughout — no hard geometric forms, no sharp corners
- Atmospheric mist layers creating depth between foreground, midground, and background
- Gentle rim lighting on subjects from the magical light source
- Small, charming details: tiny glowing creatures, wind-swept petals, rippling water reflections
- Emotional color grading: warm golden hour, serene blue twilight, or soft rose dawn
- Subtle lens effects: soft bloom on bright areas, gentle vignette, slight chromatic warmth at edges

## Typography

- Text should NOT be baked into fantasy animation images (text_baking: false)
- The painterly, atmospheric nature makes text rendering unreliable — text would break the visual immersion
- If any text must appear, use delicate hand-lettered serif or flowing script, rendered as if painted with a fine brush
- Text must be minimal and positioned in clear, less-textured areas of the composition
- All primary text for slides should be overlaid by the HTML/PPTX rendering engine

## Composition

- Atmospheric depth layering: foreground (sharp) → midground (luminous focal) → background (soft mist)
- Central focal element in the midground, illuminated by the primary light source
- Winding visual paths leading the eye through the scene — rivers, paths, light trails
- Generous atmospheric space: 30–45% of canvas is mist, sky, or soft background
- Rule-of-thirds placement for the main subject
- Asymmetrical but harmonious balance — like a well-composed landscape painting
- Fixed shell: painterly brush style, atmospheric lighting, magical particle language, emotional warmth
- Vary environment setting, light color (golden / lavender / emerald), and season/time-of-day across pages

## Negative Constraints

- NO flat vector graphics — everything must have painterly texture and soft edges
- NO dark, oppressive, or horror aesthetics — this is warm fantasy, not grimdark
- NO cyberpunk, NO sci-fi industrial, NO dystopian elements
- NO photorealistic 3D rendering — must feel hand-painted and animated
- NO sharp geometric shapes, NO rigid angles — everything is organic and flowing
- NO neon or electric colors — palette is natural and magical, not synthetic
- NO aggressive action scenes, NO weapons, NO combat — serenity over conflict
- NO text baked into the image — text overlay is handled separately
- NO characters with realistic human proportions — stylized, animated-feature-film proportions
- NO crowded or busy compositions — atmosphere requires breathing room
- NO modern technology or contemporary urban settings — fantasy worlds only

## Role-Specific Prompt Fragments

### illustration

```
Visual role: fantasy animation illustration / background for story-driven or creative slides.
Painterly digital background with soft brush textures and luminous atmospheric lighting.
Magical environment: enchanted forest, floating island, celestial observatory, or crystal cavern.
God rays, floating light motes, soft mist layers. Main focal element in midground, illuminated by magical light.
NO text, NO words, NO labels — text will be overlaid by the slide engine on clearer atmospheric areas.
Leave 30–40% of canvas as softer mist/sky areas suitable for text overlay (bottom or side zones).
Warm, enchanting, serene — suitable for creative keynotes, storytelling presentations, vision slides, and emotional closings.
```

### content-page

```
Fantasy animation style is NOT recommended for content-page role.
The painterly atmospheric aesthetic makes text rendering unreliable, and the style is designed
for emotional impact rather than information delivery. Use illustration role for cover/section-divider/thanks pages.
For content-heavy pages, pair with a clean style (minimal, corporate, scientific) for the text layer.
If content-page is absolutely necessary, limit to 1–3 short lines of hand-lettered text only.
```
