---
name: slides-imagine
description: >
  Generate AI images for presentations — illustrations, cover images,
  infographics, concept art. Use whenever the user asks to generate images
  for slides, AI 生图, 插图, 封面图, 信息图, 配图, make an illustration,
  create a cover image, generate visual content for a presentation. Features
  10 providers, AI-driven prompt writing with content analysis, 23 style
  definitions, 12 palettes, and 6 content roles. Outputs PNG files that can
  be embedded into slides-card or slides-ppt via HTML <img> tags.
---

# slides-imagine — AI 图片生成

10 个 Provider，AI-driven prompt writing，23 个 style definition，12 个 palette，6 种内容角色。

## 核心理念

Prompt 由 AI（Claude）分析内容后写出，不是模板拼接。每个 prompt 写入文件后再生图，文件即复现记录。

Reference 文件（style-definitions、palettes、archetypes、infographic/、cover/、image-cards/）提供知识库，Claude 阅读后根据具体内容定制化写 prompt。

## 6 步 AI-Driven Workflow

### Step 0: 读取偏好 (EXTEND.md) ⛔ BLOCKING

检查 `EXTEND.md` 中的 `ai_image` 配置节（provider、model、quality、aspect、design 等默认值）。

### Step 1: 分析内容

根据用户输入确定：
- **Role**: illustration / content-page / infographic / cover / image-card / comic-page
- **推荐 Design**: 根据内容风格推荐 style-definition（见下方角色表）
- **推荐 Palette**（可选）
- **语言**：与用户输入一致

| Role | 用途 | 触发词 | 推荐 Design |
|------|------|--------|-------------|
| `illustration` | 幻灯片背景/插图（无文字） | 默认 | sketch-notes |
| `content-page` | 含烘焙文字的独立内容页 | 文字烘焙 | notion / blueprint |
| `infographic` | 结构化信息图 | 信息图/infographic | sketch-notes |
| `cover` | 文章/演示封面图 | 封面图/cover image | dark-atmospheric / minimal |
| `image-card` | 社交媒体图片卡片 | AI图片卡片/小红书 | xiaohongshu-white |
| `comic-page` | 知识漫画页面 | 漫画/comic | (用 art-style + tone) |

### Step 2: 读 Reference 文件

根据 role 读取对应的 reference 文件作为 prompt 写作的知识库：

**所有 role 共用**：
- `style-definitions/{design}.md` — 选定 style 的 Style Lock、Typography、Negative Constraints
- `archetypes.md` — 10 种构图原型（illustration/content-page 时必读）
- `palettes/{palette}.md` — 调色板 hex 值和语义约束

**按 role**：
- `infographic`: 读 `infographic/structured-content-template.md` + `infographic/analysis-framework.md`
- `cover`: 读 `cover/types.md` + `cover/dimensions.md` + `cover/renderings/`
- `image-card`: 读 `image-cards/prompt-assembly.md` + `image-cards/styles/` + `image-cards/elements/`
- `comic-page`: 读 `../slides-comic/art-styles/{style}.md` + `../slides-comic/tones/{tone}.md` + `../slides-comic/layouts/{layout}.md`

### Step 3: 确认选项 ⚠️

**默认确认后再生图**。用 AskUserQuestion 一次性确认：

| 优先级 | 问题 | 何时问 |
|--------|------|--------|
| 1 | Role + Design + Palette 推荐 | 始终 |
| 2 | Aspect ratio | 始终 |
| 3 | Image backend | 多个可用时 |

跳过确认需用户明确说 "直接生成" / "不用确认" / `--quick`。跳过时声明最终选项。

### Step 4: 写 Prompt → `prompts/NN-{type}-{slug}.md`

**⛔ HARD REQUIREMENT**: 必须在生图前写入文件。文件是复现记录。

**Prompt 写作要求**：

1. **英译所有中文文本内容**（prompt 本身用英文写，但明确所有烘焙文字的语言）
2. **包含 YAML frontmatter**（type, style, palette, aspect, language）
3. **使用 style-definition 中的视觉描述**，但用贴合具体内容的方式重写——不要照抄 Style Lock
4. **结构化内容**：标题 → 模块 → 数据指标 → 视觉元素建议
5. **颜色约束**：hex 值是渲染指导，不要作为可见文字显示在图中
6. **text-fidelity.md 规则**：永远不要用代码修补位图文字错误，重新生成

**Prompt 结构模板**：

```markdown
---
type: {role}
style: {design}
palette: {palette}
aspect: {ratio}
language: {zh|en}
---

# Image Role
{从 role 表派生的角色说明}

## Visual Style
{从 style-definition 解读后重写的视觉描述 — 贴合当前内容}

## Palette
{从 palette 文件提取的颜色映射 — hex + 语义角色}

## Content Structure
{根据内容定制的结构化描述 — 标题、分区、数据指标、视觉隐喻}

## Composition
{从 archetype 或 layout 参考文件解读的构图指引}

## Technical Specs
- Aspect ratio, quality, text language
- Negative constraints from style-definition
```

### Step 5: 生成图片

```bash
bun ../../scripts/imagine/main.ts --file prompts/NN-{type}-{slug}.md --aspect {ratio} --quality 2k
```

或指定 provider：
```bash
bun ../../scripts/imagine/main.ts --file prompts/NN-{type}-{slug}.md --provider dashscope --model qwen-image-2.0-pro
```

**参考图**：如有 reference image，先复制到 `refs/` 目录，生图时加 `--ref` 参数。

**失败重试**：自动重试一次。如需修正文字：写新 prompt 文件 + 新输出路径，保留失败版本对照。

### Step 6: 输出摘要

报告：role、design、palette、aspect、backend、输出路径、文件列表。

---

## 直接 Prompt 模式（简单场景）

简单生图不需要结构化 prompt 时：

```bash
bun ../../scripts/imagine/main.ts --prompt "a futuristic city skyline at night" --aspect 16:9
```

## 批量生成

```bash
bun ../../scripts/imagine/build-batch.ts --dir prompts/ --design sketch-notes --jobs 3
bun ../../scripts/imagine/build-batch.ts --batchfile prompts.txt --anchor --jobs 1
```

`--anchor` 模式：第一张建立视觉锚点，后续图片参考第一张保持跨页一致性。

## 10 个 Provider

**无参考图优先级**：DashScope → OpenAI → MiniMax → Replicate → Z.AI → OpenRouter → Azure → Google → Jimeng → Seedream

**有参考图**（4 家支持）：Google → OpenAI → Azure → DashScope

默认 Provider 通过环境变量设置：

```bash
export IMAGINE_PROVIDER="dashscope"
export IMAGINE_MODEL="qwen-image-2.0-pro-2026-04-22"
export IMAGINE_QUALITY="2k"
export IMAGINE_ASPECT="3:4"
export IMAGINE_DESIGN="sketch-notes"
```

## 嵌入 slides

生成的 PNG 通过 HTML `<img>` 标签引用到 slides-card 或 slides-ppt：

```html
<!-- Hero 图（封面大图） -->
<section class="slide"><img src="imgs/hero.png" class="chr-hero"></section>

<!-- 背景图 -->
<section class="slide" style="background-image: url('imgs/bg.png')">

<!-- 卡片内联图 -->
<div class="c-card"><img src="imgs/card.png"><h4>标题</h4></div>
```

## 10 种构图原型（Archetype）

| 内容语义 | Archetype |
|---------|-----------|
| 开篇/章节起始 | Cover metaphor |
| 定义/概念解释 | Single concept |
| 对比/前后/A vs B | Left-right contrast |
| 步骤/流水线/阶段 | Horizontal process |
| 循环/反馈/迭代 | Circular mechanism |
| 决策/条件分支 | Branching map |
| 分类/框架/体系 | Classification map |
| 多维对比/评估 | Matrix table |
| 抽象系统隐喻 | Main metaphor diagram |
| 总结/结论/行动号召 | Takeaway |

详见 `archetypes.md`。

## 23 个 Style Definition + 12 个 Palette

Style definitions（23 个）：blueprint, bold-editorial, chalkboard, corporate, dark-atmospheric, editorial-infographic, fantasy-animation, flat-doodle, hand-drawn-edu, ink-notes, minimal, nature, notion, pixel-art, playful, retro, scientific, screen-print, sketch-notes, vector-illustration, vintage, watercolor, xiaohongshu-white

Palettes（12 个）：macaron, warm, neon, mono-ink, elegant, cool, dark, earth, vivid, pastel, retro, duotone

详见 `style-definitions/` 和 `palettes/`。

## Preset 系统

`presets.json` 提供 26 个快捷预设。用作推荐的起点，不是硬性约束。

## 配置

`../EXTEND.md` 中 `ai_image` 节可配置默认 Provider、Model、Quality、Aspect 等。详见 `../../scripts/imagine/config.ts`。

## 核心参考

- `prompt-construction.md` — Prompt 写作规范
- `archetypes.md` — 10 种构图模板
- `text-fidelity.md` — 文字保真策略
- `style-definitions/` — 23 个 Style Lock 定义
- `palettes/` — 12 个调色板定义
- `presets.json` — 26 个快捷预设
- `infographic/` — 信息图：分析框架、内容模板、结构化指南
- `cover/` — 封面图：6 种类型 × 7 种渲染 × 维度配置
- `image-cards/` — 图片卡片：12 种风格 × 8 种布局 × 元素系统
- `../../references/ai-visuals.md` — AI 视觉总览
- `providers/` — 5 个 Provider 详情
