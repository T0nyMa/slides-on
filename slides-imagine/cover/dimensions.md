# Cover Dimensions

## Text
---
name: text-dimension
description: Text density dimension for cover images
---

# Text Dimension

Controls text density and information hierarchy on cover images.

## Values

| Value | Title | Subtitle | Tags | Visual Area |
|-------|:-----:|:--------:|:----:|:-----------:|
| `none` | - | - | - | 100% |
| `title-only` | ✓ | - | - | 85% |
| `title-subtitle` | ✓ | ✓ | - | 75% |
| `text-rich` | ✓ | ✓ | ✓ (2-4) | 60% |

## Detail

### none

Pure visual cover with no text elements.

**Use Cases**:
- Photography-focused covers
- Abstract art pieces
- Visual-only social sharing
- When title added externally

**Composition**:
- Full visual area available
- No reserved text zones
- Emphasis on visual metaphor

### title-only

Single headline, maximum impact.

**Use Cases**:
- Most article covers (default)
- Clear single message
- Strong brand recognition

**Composition**:
- Title: prominent placement
- Reserved zone: top or bottom 15%
- Visual supports title message

**Title Guidelines**:
- Use exact title from source content or user-provided title
- Do NOT invent or modify titles
- Match content language

### title-subtitle

Title with supporting context.

**Use Cases**:
- Technical articles needing clarification
- Series with episode/part info
- Content with dual messages

**Composition**:
- Title: primary element
- Subtitle: secondary element
- Reserved zone: 25%
- Clear hierarchy between title/subtitle

**Title Guidelines**:
- Use exact title from source content or user-provided title
- Do NOT invent or modify titles

**Subtitle Guidelines**:
- Clarify or contextualize title
- Can include series name, author, date
- Smaller, less prominent than title

### text-rich

Information-dense cover with multiple text elements.

**Use Cases**:
- Infographic-style covers
- Event announcements with details
- Promotional material with features
- Content with multiple key points

**Composition**:
- Title: primary focus
- Subtitle: supporting info
- Tags: 2-4 keyword labels
- Reserved zone: 40%
- Clear visual hierarchy

**Title Guidelines**:
- Use exact title from source content or user-provided title
- Do NOT invent or modify titles

**Tag Guidelines**:
- 2-4 tags maximum
- Short keywords (1-2 words each)
- Positioned as badges/labels
- Can highlight: category, date, author, key features

## Type Compatibility

| Type | none | title-only | title-subtitle | text-rich |
|------|:----:|:----------:|:--------------:|:---------:|
| hero | ✓ | ✓✓ | ✓✓ | ✓ |
| conceptual | ✓✓ | ✓✓ | ✓ | ✓ |
| typography | ✗ | ✓ | ✓✓ | ✓✓ |
| metaphor | ✓✓ | ✓ | ✓ | ✗ |
| scene | ✓✓ | ✓ | ✓ | ✗ |
| minimal | ✓✓ | ✓✓ | ✓ | ✗ |

✓✓ = highly recommended | ✓ = compatible | ✗ = not recommended

## Auto Selection

When `--text` is omitted, select based on signals:

| Signals | Text Level |
|---------|------------|
| Visual-only, photography, abstract, art | `none` |
| Article, blog, standard cover | `title-only` |
| Series, tutorial, technical with context | `title-subtitle` |
| Announcement, features, multiple points, infographic | `text-rich` |

Default: `title-only`

## Mood
---
name: mood-dimension
description: Emotional intensity dimension for cover images
---

# Mood Dimension

Controls emotional intensity and visual weight of cover images.

## Values

| Value | Contrast | Saturation | Weight | Energy |
|-------|:--------:|:----------:|:------:|:------:|
| `subtle` | Low | Muted | Light | Calm |
| `balanced` | Medium | Normal | Medium | Moderate |
| `bold` | High | Vivid | Heavy | Dynamic |

## Detail

### subtle

Calm, understated visual presence.

**Characteristics**:
- Low contrast between elements
- Muted, desaturated colors
- Light visual weight
- Gentle, refined aesthetic
- Soft edges and transitions

**Use Cases**:
- Thought leadership content
- Professional/corporate communications
- Meditation, wellness topics
- Academic or scholarly articles
- Luxury brand aesthetics

**Color Guidance**:
- Pastels, earth tones, neutrals
- Low saturation (30-50%)
- Soft gradients
- Minimal color variety (2-3 colors)

### balanced

Versatile, harmonious visual presence.

**Characteristics**:
- Medium contrast
- Natural saturation levels
- Balanced visual weight
- Clear but not aggressive
- Standard aesthetic approach

**Use Cases**:
- General articles (default)
- Most blog content
- Educational material
- Product documentation
- News and updates

**Color Guidance**:
- Standard saturation (50-70%)
- Complementary color schemes
- Clear foreground/background separation
- Moderate color variety (3-4 colors)

### bold

Dynamic, high-impact visual presence.

**Characteristics**:
- High contrast between elements
- Vivid, saturated colors
- Heavy visual weight
- Energetic, attention-grabbing
- Sharp edges and strong shapes

**Use Cases**:
- Product launches
- Promotional announcements
- Event marketing
- Call-to-action content
- Entertainment/gaming topics

**Color Guidance**:
- High saturation (70-100%)
- Vibrant, primary colors
- Strong contrast ratios
- Dynamic color combinations (4+ colors)

## Type Compatibility

| Type | subtle | balanced | bold |
|------|:------:|:--------:|:----:|
| hero | ✓ | ✓✓ | ✓✓ |
| conceptual | ✓✓ | ✓✓ | ✓ |
| typography | ✓ | ✓✓ | ✓✓ |
| metaphor | ✓✓ | ✓✓ | ✓ |
| scene | ✓✓ | ✓✓ | ✓ |
| minimal | ✓✓ | ✓✓ | ✗ |

✓✓ = highly recommended | ✓ = compatible | ✗ = not recommended

## Palette Interaction

Mood modifies the base palette characteristics:

| Palette Category | subtle | balanced | bold |
|------------------|--------|----------|------|
| Warm palettes (warm, earth, pastel) | More whitespace, softer tones | Standard colors | Deeper, richer warm tones |
| Cool palettes (cool, mono, elegant) | Lighter lines, muted colors | Standard colors | Stronger contrast, sharper definition |
| Dark palettes (dark, vivid) | Reduced contrast, softer glow | Standard colors | Maximum impact, vivid saturation |
| Vintage palettes (retro) | More faded, sepia-heavy | Standard colors | Bolder retro contrasts |
| Duotone palettes (duotone) | Softer contrast between pair | Standard two-color split | Maximum contrast, stark separation |

## Rendering Interaction

Mood adjusts rendering characteristics:

| Rendering | subtle | balanced | bold |
|-----------|--------|----------|------|
| flat-vector | Thinner strokes, lighter fills | Standard weight | Thicker strokes, stronger fills |
| hand-drawn | Lighter pencil pressure, more space | Standard strokes | Heavier marker strokes, denser elements |
| painterly | Diluted washes, more white | Standard brush | Thicker paint, saturated strokes |
| digital | Reduced shadows, lower contrast | Standard rendering | Stronger shadows, sharper edges |
| pixel | Fewer colors, simpler shapes | Standard palette | More colors, denser pixel detail |
| chalk | Lighter chalk, more board showing | Standard chalk | Heavy chalk, vivid colors, dense marks |
| screen-print | Fewer colors (2), lighter halftone | Standard 3-4 colors, medium halftone | More colors (4-5), dense halftone, stronger misregistration |

## Auto Selection

When `--mood` is omitted, select based on signals:

| Signals | Mood Level |
|---------|------------|
| Professional, corporate, thought leadership, academic, luxury | `subtle` |
| General, educational, standard, blog, documentation | `balanced` |
| Launch, announcement, promotion, event, gaming, entertainment | `bold` |

Default: `balanced`

## Font
---
name: font-dimension
description: Typography style dimension for cover images
---

# Font Dimension

Controls typography style and character feel.

## Values

| Font | Visual Style | Line Quality | Character |
|------|--------------|--------------|-----------|
| `clean` | Geometric sans-serif | Sharp, uniform | Modern, precise, neutral |
| `handwritten` | Hand-lettered, brush | Organic, varied | Warm, personal, friendly |
| `serif` | Classic serifs, elegant | Refined, structured | Editorial, authoritative |
| `display` | Bold, decorative | Heavy, expressive | Attention-grabbing, playful |

## Detail

### clean

Modern, universal typography with neutral character.

**Characteristics**:
- Geometric sans-serif letterforms
- Sharp, uniform line weight
- Clean edges, no flourishes
- High readability at all sizes
- Minimal personality, maximum clarity

**Use Cases**:
- Technical documentation
- Professional/corporate content
- Minimal design approaches
- Data-driven articles
- Modern brand aesthetics

**Prompt Hints**:
- Use clean geometric sans-serif typography
- Modern, minimal letterforms
- Sharp edges, uniform stroke weight
- High contrast against background

### handwritten

Warm, organic typography with personal character.

**Characteristics**:
- Hand-lettered or brush style
- Organic, varied line weight
- Natural imperfections
- Approachable, human feel
- Casual yet intentional

**Use Cases**:
- Personal stories
- Lifestyle content
- Wellness and self-improvement
- Creative tutorials
- Friendly brand voices

**Prompt Hints**:
- Use warm hand-lettered typography with organic brush strokes
- Friendly, personal feel
- Natural variation in stroke weight
- Approachable, human character

### serif

Classic, elegant typography with editorial authority.

**Characteristics**:
- Traditional serif letterforms
- Refined, structured strokes
- Elegant proportions
- Timeless sophistication
- Formal, trustworthy feel

**Use Cases**:
- Editorial content
- Academic articles
- Luxury brand content
- Historical topics
- Literary pieces

**Prompt Hints**:
- Use elegant serif typography with refined letterforms
- Classic, editorial character
- Structured, proportional spacing
- Authoritative, sophisticated feel

### display

Bold, decorative typography for maximum impact.

**Characteristics**:
- Heavy, expressive letterforms
- Decorative elements
- Strong visual presence
- Playful or dramatic character
- Designed for headlines

**Use Cases**:
- Announcements
- Entertainment content
- Promotional materials
- Event marketing
- Gaming topics

**Prompt Hints**:
- Use bold decorative display typography
- Heavy, expressive headlines
- Strong visual impact
- Attention-grabbing character

## Default

`clean` — Universal, pairs well with most rendering styles.

## Rendering Compatibility

| Font × Rendering | flat-vector | hand-drawn | painterly | digital | pixel | chalk | screen-print |
|------------------|:-----------:|:----------:|:---------:|:-------:|:-----:|:-----:|:------------:|
| clean | ✓✓ | ✗ | ✗ | ✓✓ | ✓ | ✗ | ✓ |
| handwritten | ✓ | ✓✓ | ✓✓ | ✓ | ✗ | ✓✓ | ✗ |
| serif | ✓ | ✗ | ✓ | ✓✓ | ✗ | ✗ | ✓ |
| display | ✓✓ | ✓ | ✓ | ✓✓ | ✓✓ | ✓ | ✓✓ |

✓✓ = highly recommended | ✓ = compatible | ✗ = not recommended

## Type Compatibility

| Font × Type | hero | conceptual | typography | metaphor | scene | minimal |
|-------------|:----:|:----------:|:----------:|:--------:|:-----:|:-------:|
| clean | ✓ | ✓✓ | ✓✓ | ✓ | ✗ | ✓✓ |
| handwritten | ✓✓ | ✓ | ✓ | ✓✓ | ✓✓ | ✓ |
| serif | ✓ | ✓ | ✓✓ | ✓ | ✓ | ✓ |
| display | ✓✓ | ✓ | ✓✓ | ✓ | ✓ | ✗ |

## Palette Interaction

Font style adapts to palette characteristics:

| Palette Category | clean | handwritten | serif | display |
|------------------|-------|-------------|-------|---------|
| Warm (warm, earth, pastel) | Softer weight | Natural fit | Warm tones | Playful energy |
| Cool (cool, mono, elegant) | Perfect match | Contrast | Classic pairing | Bold statement |
| Dark (dark, vivid) | High contrast | Glow effects | Dramatic | Maximum impact |
| Vintage (retro) | Modern contrast | Nostalgic fit | Period-appropriate | Retro headlines |
| Duotone (duotone) | Sharp contrast | Not recommended | Dramatic pairing | Cinematic impact |

## Auto Selection

When `--font` is omitted, select based on signals:

| Signals | Font |
|---------|------|
| Personal, lifestyle, human, warm, friendly, story | `handwritten` |
| Technical, professional, clean, modern, minimal, data | `clean` |
| Editorial, academic, luxury, classic, literary | `serif` |
| Announcement, entertainment, promotion, bold, event, gaming | `display` |

Default: `clean`
