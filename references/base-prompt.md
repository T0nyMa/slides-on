# Base AI Image Generation Prompt

Default prompt template for generating slide illustrations via AI image providers.

## Prompt Template Structure

Every AI image prompt is assembled from four parts:

```
[Quality Tokens] + [Style Tokens] + [Composition Description] + [Negative Prompt]
```

## Quality Tokens

Default prefix applied to all prompts:
```
high quality, 2k, detailed, professional, clean composition
```

- `high quality` -- triggers higher resolution outputs
- `2k` -- requests 2K resolution (approximately 2560x1440)
- `detailed` -- favors refined, non-sketchy output
- `professional` -- avoids amateurish, clip-art look
- `clean composition` -- favors balanced, uncluttered layouts

## Style Tokens (Mapped to Presets)

| Preset | Style Token | Character |
|--------|------------|-----------|
| `blueprint` | `clean schematic, blueprint style, white lines on blue background, technical drawing` | Technical diagram aesthetic |
| `dark-atmospheric` | `dark atmospheric, cinematic lighting, high contrast, dramatic shadows` | Mood-driven tech imagery |
| `minimal` | `minimalist, clean, flat design, generous whitespace` | Uncluttered simplicity |
| `scientific` | `clean diagram, scientific illustration, precise, labeled, academic style` | Research-grade figures |
| `corporate` | `professional business style, clean, modern, confident` | Boardroom-ready visuals |
| `bold-editorial` | `bold editorial, high contrast, magazine quality, striking` | Publication-grade visuals |
| `hand-drawn-edu` | `hand-drawn educational illustration, sketch style, warm, inviting` | Friendly instructional art |
| `chalkboard` | `chalkboard style, black background, chalk drawing texture, classroom aesthetic` | Classic teaching aesthetic |
| `xiaohongshu-white` | `clean pastel, soft lighting, lifestyle photography style, gentle colors` | Social media friendly |
| `notion` | `notion style, clean, organized, modular, soft neutral tones` | Productivity tool aesthetic |
| `sketch-notes` | `sketch notes style, hand-drawn, doodle, notebook aesthetic, quick strokes` | Idea-capture aesthetic |
| `watercolor` | `watercolor painting, soft edges, translucent washes, artistic` | Organic artistic feel |
| `vector-illustration` | `flat vector illustration, geometric, modern, clean lines` | Modern app-like visuals |
| `editorial-infographic` | `editorial infographic, data-rich, clean typography, structured` | Data journalism style |
| `vintage` | `vintage illustration, retro colors, aged paper texture, nostalgic` | Historical feel |
| `pixel-art` | `pixel art, 16-bit style, crisp pixels, retro game aesthetic` | Gaming/retro tech vibe |
| `fantasy-animation` | `fantasy art, animated style, dreamy, ethereal lighting, soft glow` | Whimsical narrative |

## Aspect Ratio Defaults

| Canvas | Prompt Suffix |
|--------|--------------|
| `16:9` | `, 16:9 aspect ratio` |
| `3:4` | `, 3:4 portrait aspect ratio` |
| `9:16` | `, 9:16 portrait aspect ratio` |
| `1:1` | `, square 1:1 aspect ratio` |

## Composition Guidelines

Instructions included in the prompt to steer composition:

- **Subject clarity**: "single clear subject, centered, uncluttered background"
- **Text safety**: "no text, no labels, no numbers, no words" (AI-generated text is unreliable)
- **Slide fit**: "suitable for presentation slide background, not too busy"
- **Focal area**: "main subject in center-right, leave left 40% empty for text overlay"
- **Consistency**: "same visual style, same color palette, consistent lighting"

## Negative Prompts

Default negative prompt applied to all image generation:

```
no text, no letters, no words, no watermark, no logo, no signature,
not blurry, not distorted, not photorealistic face, not cluttered,
not dark corners, not amateur, not clip art, not low resolution
```

### Preset-Specific Negative Additions

| Preset | Additional Negative |
|--------|-------------------|
| `blueprint` | `no color, monochrome only, no photos, no gradients` |
| `hand-drawn-edu` | `no photorealistic, no 3D render, no computer-generated look` |
| `corporate` | `no casual style, no hand-drawn, no graffiti` |
| `scientific` | `no decorative elements, no artistic flourishes, no stylized` |

## Provider-Specific Adjustments

### DashScope (Qwen image)
- Best with Chinese descriptions for Chinese content
- Add `, 高画质` prefix for Max model
- Aspect ratio via API parameter, not prompt text

### OpenAI (DALL-E)
- Shorter prompts (400 char limit for DALL-E 3)
- Drop quality tokens, let `quality: hd` parameter handle it
- Composition as first sentence, style as second

### Google (Imagen)
- Strict safety filters -- avoid any prompt that could trigger filtering
- Use positive framing (describe what you want, not what to avoid)
- Add `, professional illustration` suffix

### Replicate (Flux/Stable Diffusion)
- Supports full prompt including negative prompt
- Add `--ar 16:9` for aspect ratio (Midjourney-style syntax)
- Best with detailed composition descriptions

## Prompt File Mechanism

To ensure reproducibility, every AI image generation writes a `.prompt.txt` file alongside the output image. The file contains:

```
# AI Image Generation Prompt
# Provider: <provider>
# Preset: <preset>
# Aspect: <aspect-ratio>
# Generated: <timestamp>

## Full Prompt
<complete assembled prompt>

## Negative Prompt
<negative prompt>
```

This allows re-generating images later with the same prompt, even if the prompt template has been updated.

## Example

For a `blueprint` preset, `16:9` aspect, on DashScope:

```
high quality, 2k, detailed, professional, clean composition,
clean schematic, blueprint style, white lines on blue background, technical drawing,
a distributed system with three server nodes connected by arrows,
single clear subject, centered, uncluttered background,
no text, no labels, no numbers, no words,
suitable for presentation slide background, not too busy,
, 16:9 aspect ratio, 高画质
```

Negative:
```
no text, no letters, no words, no watermark, no logo, no signature,
not blurry, not distorted, not photorealistic face, not cluttered,
not dark corners, not amateur, not clip art, not low resolution,
no color, monochrome only, no photos, no gradients
```
