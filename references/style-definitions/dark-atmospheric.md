---
name: dark-atmospheric
category: cinematic
text_baking: false
---

# Dark Atmospheric — AI Image Style Definition

Cinematic, moody, high-contrast aesthetic. Deep black backgrounds, dramatic single-source lighting, volumetric haze, and selective highlights. Evokes tension, mystery, and premium production value.

## Style Lock (跨页复用)

```text
Cinematic dark atmospheric composition on deep void-black background (#0A0A0C), subtly shaded with near-black vignette (#111118 → #060608 edges).
Dramatic single-source volumetric lighting: warm-amber rim light (#E8A850), cool-blue edge kicker (#4A90D9), or crimson under-light (#C0392B) — one dominant source per image.
Soft atmospheric haze (volumetric fog) in the midground, lit by the key light. Lens flares thin and controlled — horizontal anamorphic streak style.
Central subject illuminated by key light at 30–40% of canvas area, rest falling into deep shadow.
Minimalist composition: one focal element, vast negative space (60–70% dark void). Dark cinematic color grade with crushed blacks and subtle teal/orange split-tone.
Texture: subtle film grain overlay, slight chromatic aberration at high-contrast edges.
No bright backgrounds, no flat lighting, no busy compositions, no text rendering in the image — text would be invisible on dark backgrounds.
```

## Color Palette

| Role | Color | Hex |
|------|-------|-----|
| Background | Void black | #0A0A0C |
| Near-black vignette | Deep shadow | #060608 |
| Dark mid-tone | Cinematic shadow | #111118 |
| Key light warm | Amber rim light | #E8A850 |
| Key light cool | Blue edge kicker | #4A90D9 |
| Key light warm-alt | Crimson under-light | #C0392B |
| Haze mid-tone | Volumetric fog | rgba(180,160,130,0.12) |
| Highlight spark | Pure white flare | #FFFFFF |
| Subtle accent | Teal split-tone | #2AA198 |

## Visual Elements

- Dramatic single-source lighting casting long, moody shadows across the frame
- Volumetric haze/fog illuminated by the key light, creating depth layers
- Subtle lens flares: thin horizontal anamorphic streaks, not circular bloom flares
- Film grain overlay (subtle, 2–3% opacity) adding cinematic texture
- Slight chromatic aberration at high-contrast light/dark edges
- Central subject (abstract shape, architectural element, or symbolic object) emerging from shadow
- Deep crushed blacks with shadow detail barely visible — moody and mysterious
- Selective highlight areas drawing the eye to 1–2 focal points
- Cinematic color grade: teal shadows, warm amber highlights (split-tone)
- Clean geometric or organic forms as subjects — nothing busy or cluttered

## Typography

- Text should NOT be baked into dark atmospheric images (text_baking: false)
- Dark backgrounds make baked text nearly impossible to read reliably
- If any text must appear, use thin geometric sans-serif in pure white (#FFFFFF) at low opacity (60–70%), positioned in lit areas only
- All text for slides should be overlaid by the HTML/PPTX rendering engine on bright areas

## Composition

- Vast negative space (60–70% dark void) — emptiness is the aesthetic
- Central subject occupies 25–35% of canvas, illuminated by key light
- Strong rule-of-thirds placement for the focal element
- Lighting guides the eye: brightest element first, then haze midground, then shadow
- Heavy vignette: edges 2–3 stops darker than center
- Asymmetric balance — weighted to one side, countered by negative space
- Fixed shell: void-black background, film grain, vignette, color grade
- Vary only the central subject and lighting color across pages

## Negative Constraints

- NO bright backgrounds, NO white backgrounds — this is a DARK aesthetic
- NO flat, even lighting — must have dramatic light/shadow contrast
- NO busy compositions, NO multiple focal points — one subject per image
- NO text-heavy or information-dense layouts — cinematic is for mood
- NO cartoon or illustrative style — must feel photographic/cinematic
- NO saturated rainbow colors — palette is restrained: amber, blue, crimson, teal
- NO sharp vector graphics — subjects should feel organic or architectural
- NO HDR or over-processed look — cinematic grade is subtle, not aggressive
- NO people or faces — use abstract forms, objects, or environments
- NO daylight or outdoor scenes — all lighting is artificial, controlled, studio-like
- NO heavy lens flares — thin anamorphic streaks only, not JJ Abrams bloom

## Role-Specific Prompt Fragments

### illustration

```
Visual role: cinematic dark atmospheric illustration / background image.
NO text, NO words, NO labels — text will be overlaid by the slide engine on lit areas.
Deep void-black background (#0A0A0C) with dramatic single-source lighting.
One focal subject illuminated by warm amber or cool blue rim light, rest in shadow.
Volumetric haze, subtle film grain, cinematic color grade (teal/orange split-tone).
Leave 50–60% of canvas as dark negative space — text overlay zones should be positioned in lit or mid-tone areas.
Moody, premium, cinematic — suitable for keynote covers, dramatic section dividers, or high-impact visual breaks.
```

### content-page

```
Dark atmospheric style is NOT recommended for content-page role.
The deep black backgrounds make baked text unreadable, and the dramatic lighting does not support
information-dense layouts. Use illustration role for cover/divider pages only.
For content pages, pair with a clean theme (minimal, corporate, scientific) for the text overlay.
```
