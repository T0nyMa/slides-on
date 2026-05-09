# Content Analysis Framework (Step 1)

This document defines the methodology for Step 1 of the slides-on pipeline: parsing input documents into a structured deck outline.

## Overview

```
Input Document (MD/text)
    │
    ▼
┌─────────────────────────────┐
│ 1. Parse metadata           │
│ 2. Identify chapter bounds  │
│ 3. Detect content types     │
│ 4. Estimate slide count     │
│ 5. Signal detection         │
│ 6. Ghost Deck Test          │
└─────────────────────────────┘
    │
    ▼
outline.md
```

## 1. Document Parsing

### Metadata Extraction

Extract from the source document in order of priority:

| Field | Extraction Rule |
|-------|----------------|
| **Title** | First H1 heading (`# Title`), or first line if no headings |
| **Subtitle** | First H2 after title, or second paragraph if short (< 80 chars) |
| **Author** | Pattern match: `作者`, `Author`, `by`, or frontmatter `author:` field |
| **Date** | Pattern match: `YYYY-MM-DD`, or frontmatter `date:` field |
| **Event/Context** | Pattern match: `报告`, `汇报`, `presentation`, `talk`, or frontmatter `event:` field |

### Content Units

The parser treats each of the following as an independent content unit:
- Paragraphs of text (split at blank lines)
- Bullet lists (`-` or `*` items)
- Numbered lists
- Code blocks (fenced with ```````)
- Blockquotes (`>` lines)
- Tables
- Image references (`![]()`)

## 2. Chapter Boundary Identification

### Rules for Section Splitting

| Document Feature | Splitting Strategy |
|-----------------|-------------------|
| Has H2 headings | Each H2 becomes a Section; H3s become individual Slides |
| Has H3 headings only | Each H3 becomes a Section; group 2-3 consecutive logical units per slide |
| No headings, < 500 words | Single Section with 3-6 Slides (by paragraphs) |
| No headings, 500-3000 words | Split by semantic topic shifts (every 3-5 paragraphs = one section) |
| No headings, > 3000 words | Split by semantic topic shifts (every 5-8 paragraphs = one section) |
| Contains code blocks | Code blocks always get their own Slide (never combined with text) |
| Contains tables | Tables get their own Slide unless small (< 4 rows) |

### Section Naming Convention

- If from H2: use the H2 text directly
- If auto-generated: synthesize a < 20-char label from the first sentence's topic
- Format: `## Section: <Section Name>`

## 3. Content Type Detection

Each slide's content is classified into one type, which determines its rendering engine.

### Detection by Content Features

| Content Feature | Type | Rendering Engine |
|----------------|------|-----------------|
| Paragraph text, bullet lists | `bullets` | html-ppt layout |
| Single powerful quote/slogan | `big-quote` | html-ppt layout |
| 2-3 parallel ideas | `two-column` / `three-column` | html-ppt layout |
| Code block | `code` | html-ppt layout |
| Shell commands / terminal output | `terminal` | html-ppt layout |
| Diff / code change | `diff` | html-ppt layout |
| Data table | `table` | html-ppt layout |
| Trend data / time series | `chart-line` | html-ppt layout |
| Ranking / comparison data | `chart-bar` | html-ppt layout |
| Proportion / composition data | `chart-pie` | html-ppt layout |
| Multi-dimension metrics | `chart-radar` | html-ppt layout |
| Key metrics (3-4 KPIs) | `kpi-grid` | html-ppt layout |
| Single standout number | `stat-highlight` | html-ppt layout |
| Architecture / system design description | `arch-diagram` | SVG diagram |
| Process / flow description | `flow-diagram` | HTML layout or SVG diagram |
| Timeline / history | `timeline` | HTML layout |
| Step-by-step process | `process-steps` | HTML layout |
| A vs B comparison | `comparison` / `pros-cons` | HTML layout |
| Concept / idea needing visual | `ai-image` | AI image → PNG |
| Data story / complex visual | `infographic` | AI infographic → PNG |
| Cover / title page | `cover` | HTML layout or AI cover |
| Section transition | `section-divider` | HTML layout |
| Table of contents | `toc` | HTML layout |
| Call to action | `cta` | html-ppt layout |
| Closing / thanks | `thanks` | html-ppt layout |

### Signal Word Mapping

Keywords in the source text trigger type assignments:

| Signal Words | Inferred Type |
|-------------|--------------|
| `架构`, `系统设计`, `architecture`, `system` | `arch-diagram` |
| `流程`, `步骤`, `pipeline`, `workflow` | `flow-diagram` or `process-steps` |
| `对比`, `vs`, `比较`, `优劣` | `comparison` or `pros-cons` |
| `数据`, `指标`, `增长`, `提升`, `%` | `kpi-grid` or `chart-*` |
| `代码`, `实现`, `算法`, `伪代码` | `code` |
| `时间线`, `历史`, `演进`, `发展` | `timeline` |
| `概念`, `示意`, `插图` | `ai-image` |
| `总结`, `结论`, `展望` | `bullets` (Summary section) |

## 4. Slide Count Estimation

Heuristic based on source document character count (Chinese chars):

| Document Length | Suggested Slides | Use Case |
|----------------|:---:|---------|
| < 500 chars | 3-6 | Micro-deck (lightning talk, quick update) |
| 500-1000 chars | 5-10 | Short article / blog post conversion |
| 1000-3000 chars | 10-18 | Standard tech talk |
| 3000-5000 chars | 15-25 | Deep-dive article / tutorial |
| > 5000 chars | 20-35 | Course / lecture series |

**Refinement rules**:
- Code blocks: count each block as 1 slide
- Tables: count each as 1 slide
- Images: count each as 1 slide (in addition to text slides)
- The estimate is an upper bound, not a target. Actual count depends on content structure.
- EXTEND.md can override via `slide_count.per_1000_chars` and `slide_count.ratios`.

### EXTEND.md Override

Users can customize via:
```yaml
slide_count:
  min: 5
  max: 30
  per_1000_chars: 6
  ratios:
    under_500: 0.01
    under_1000: 0.01
    under_3000: 0.008
    over_3000: 0.006
```

## 5. Signal Detection for Preset Recommendation

Scan the document for scene-signaling keywords. The detected scene maps to a recommended preset.

| Scene | Signal Words | Recommended Preset |
|-------|-------------|-------------------|
| Tech sharing | 代码, 架构, API, 系统, 开源, 框架, 性能 | `blueprint`, `dark-atmospheric`, or `minimal` |
| Academic | 研究, 实验, 方法, 数据, 结论, 论文, 博士 | `scientific` or `minimal` |
| Business | 产品, 市场, 增长, 收入, KPI, 战略 | `corporate` or `bold-editorial` |
| Teaching | 学习, 基础, 入门, 练习, 教程, 指南 | `hand-drawn-edu` or `chalkboard` |
| Social media | 小红书, 分享, 干货, 推荐, 技巧 | `xiaohongshu-white` or `notion` |
| Creative | 概念, 愿景, 未来, 设计, 品牌 | `sketch-notes` or `watercolor` |
| Data report | 数据分析, 趋势, 统计, 指标 | `editorial-infographic` or `corporate` |
| Weekly report | 周报, 进展, OKR, 复盘, todo | `notion` or `minimal` |

When multiple scenes match, choose the one with more keyword hits.

## 6. Ghost Deck Test

After generating the outline, perform the Ghost Deck Test:

> **Read only the slide titles (action titles) in sequence. Do they tell a complete argument?**

Expected argument flow:
```
Cover title → What is the problem? → Why does it matter? → How did we solve it? →
What were the results? → What does this mean? → What's next?
```

If the title sequence fails to tell a coherent story, restructure:
- Reorder slides to create logical flow
- Revise slide titles to be complete sentences that carry the argument
- Add missing argument steps (e.g., a "Why This Matters" slide before the solution)
- Split overloaded slides (one slide = one idea)

The Ghost Deck Test is mandatory for academic presentations per academic-pptx conventions.

## 7. Output Format: `outline.md`

```markdown
# Deck: <Deck Title>

## Cover
- Title: <Complete sentence stating the core argument>
- Subtitle: <Context / scope>
- Author: <Name>
- Date: <YYYY-MM-DD>
- Event: <Occasion>

## Section: <Section Name>
### Slide 1: <Action Title — complete sentence>
- Type: bullets | code | chart | diagram | ai-image | infographic | ...
- Content: <Key points for this slide>
- Recommended layout: <layout name>
- Notes: <Optional presenter notes>

### Slide 2: <Action Title>
- Type: ...
- Content: ...
- Recommended layout: ...
- Notes: ...

## Section: <Section Name>
### Slide 3: ...
...

## Section: Summary / Conclusions
### Slide N: <Action Title>
- Type: bullets
- Content: <3-4 key takeaways>
- Recommended layout: bullets
```

## Edge Cases

- **No headings in source**: Generate a single Section with slides split by content unit count
- **Very short document (< 200 chars)**: Still produce 1-3 slides (cover + 1-2 content slides)
- **Very long document (> 8000 chars)**: Force-split at notional H2 boundaries (topic shifts); cap at 40 slides maximum
- **Mixed languages (Chinese + English)**: Count both character sets; treat code blocks as 0 chars for estimation purposes
- **Document is already an outline**: Skip parsing; validate against Ghost Deck Test; fill in missing metadata only
