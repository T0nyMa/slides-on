# AI Image Prompt Construction

结构化 prompt 组装指南。替代 `base-prompt.md` 中遗留的扁平 style token 方式。

## 核心原则

**三层 Prompt 结构**：每层独立定义、组装时合并：

```
Layer 1: Image Specs & Universal Constraints  ← Image Role 决定
Layer 2: Style Visual DNA                     ← Design 决定 (style-definitions/)
Layer 3: Content & Composition                ← 单张图具体内容决定
```

**两个 Image Role**：图表角色不同，Layer 1 分支：

| Role | 使用场景 | 文字策略 |
|------|---------|---------|
| **illustration** | 幻灯片背景图、概念插图、封面底图 | NO text — 文字走 HTML 层 |
| **content-page** | 手绘教学页、完整信息图页、小红书风格卡片 | Text baked-in — 手写体中文 |

## Image Role: illustration

幻灯片插图/背景，文字由 HTML 层精确渲染。图负责视觉氛围。

### Layer 1 模板

```text
Visual role: illustration / background image for a presentation slide.
NO text, NO labels, NO numbers, NO words, NO letters, NO watermarks in the image.
Text will be overlaid by the slide rendering engine — leave clean empty zones for text.
Main subject positioned slightly off-center, leave 35–45% of one side as text-safe empty space.
Suitable for presentation slide background — visually engaging but not too busy.
Aspect ratio: {aspect_ratio}.
Quality: high quality, 2k, detailed, professional, clean composition.
```

### Layer 2 组装

从 `references/style-definitions/{design}.md` 加载以下内容并插入：

```text
Apply {design} visual style with these exact specifications:

## Color Palette
{paste the Color Palette table — include hex values}

## Visual Elements
{paste the Visual Elements section — concrete enumeration of what to draw}

## Composition
{paste the Composition section}

Apply strictly:
{paste the Negative Constraints}
```

### Layer 3 组装

```text
## Scene Description
{具体构图描述：主体是什么、位置在哪、氛围如何}

## Text Safety
- Main subject in center-right area, leave left 40% clean empty space for text overlay
- No text, no labels, no numbers anywhere in the image
- Uncluttered background, clear focal area

## Composition Check
- Subject clarity: single clear subject, centered or slightly offset
- Slide fit: suitable for presentation slide background, not too busy
- Same visual style as other images in this deck
```

### 完整组装示例 (sketch-notes, illustration role)

```text
high quality, 2k, detailed, professional, clean composition.

Visual role: illustration / background image for a presentation slide.
NO text, NO labels, NO numbers, NO words, NO letters in the image.
Text will be overlaid — leave clean empty zones.
Main subject slightly off-center, leave 40% left side empty for text.
Aspect ratio: 16:9.

Apply sketch-notes visual style:

Color Palette:
- Background: warm cream paper #F5F0E8
- Ink: deep brown-black #3D2B1F  
- Accent blocks: macaron blue #A8D8EA, lavender #D5C6E0, mint #B5E5CF, peach #F8D5C4
- Emphasis: coral red #E8655A

Visual Elements:
- Hand-drawn wobble on all lines — stable but slightly irregular
- Thin ink pen lines (0.3–0.5mm visual weight)
- Paper texture background with subtle grain
- Curved hand-drawn arrows, slim and quiet
- Rounded-rect content blocks with single-weight outlines

Composition:
- Large negative space 40–50% whitespace
- Sparse corner construction marks: faint grey dots and ruler ticks

Avoid strictly:
- NO full-page border, NO yellow/beige paper
- NO photorealistic, NO 3D render, NO computer-generated look
- NO gradients, NO shadows, NO neon
- NO thick marker strokes, NO many characters
- NO bullet dumps, NO dense text blocks

Scene: A small, refined hand-drawn illustration of three connected concept nodes 
with curved arrows between them, placed in the center-right area. 
Each node is a rounded-rect with a pale pastel fill and thin ink outline. 
Left 40% of the canvas is clean empty cream paper for text overlay.
Single clear subject, not too busy, suitable for presentation slide background.
```

## Image Role: content-page

完整页面图，中文文字 baked into image。手写体约束 + Required Text Only。

### Layer 1 模板

```text
Visual role: complete content page — standalone deliverable image.
This is page {N}/{TOTAL} of a coherent visual deck.
ALL visible Chinese text MUST be hand-drawn style, baked into the final image.
Text should feel like a person carefully wrote it on paper — natural, slightly irregular.
Aspect ratio: {aspect_ratio}.
Preferred final size: {target_size}.
Quality: 2k, detailed, professional, clean composition.
```

### Layer 2 组装

与 illustration role 相同，但额外插入 Typography 指令（来自 style-definition），因为文字现在是核心。

### Layer 3 组装

```text
## Page Content
Title exactly: {short Chinese title, 5–12 characters}
Subtitle exactly: {optional short subtitle, 3–12 characters, or omit}
Archetype: {layout archetype — horizontal process | left-right contrast | circular mechanism | branching map | classification map | takeaway | single concept}
Main point: {one sentence summarizing this page}

## Composition
{specific layout description based on archetype — describe the hand-drawn diagram, not generic boxes}

## Required Text Only
- Title: {exact Chinese title}
- Subtitle: {exact Chinese subtitle, or omit}
- Label 1: {text}
- Label 2: {text}
- ... (2–5 labels, each 2–8 Chinese characters)
- Caption: {optional, short}

## Text Rendering Rules
- ALL text hand-drawn Chinese — NO printed fonts, NO computer typesetting
- Main title: hand-lettering feel, medium weight, prominent
- Keywords: enlarged + highlighter-pastel marker block behind text
- Labels: small hand-drawn inside pastel marker boxes
```

### 完整组装示例 (sketch-notes, content-page role)

```text
Use case: productivity-visual.
Asset type: one complete Chinese hand-drawn educational page image, final raster page.
Preferred final size: 1920x1080 (16:9) or 810x1080 (3:4) depending on canvas.

Create page 03/12 of a coherent deck.
Page role: content page.
Page number text exactly: 03 / 12
Title exactly: 推荐系统三阶段
Subtitle exactly: 召回·精排·重排
Archetype: horizontal process
Main point: 推荐系统从海量商品库到最终推荐结果，经过召回、精排、重排三个关键阶段

Apply sketch-notes visual style:
{full visual DNA copied from style-definitions/sketch-notes.md — 
 color palette hex values, visual elements, composition rules, negative constraints}

ALL visible Chinese text MUST be hand-drawn style:
- Main titles hand-drawn Chinese, prominent, with pale blue hand-drawn underline
- Keywords with pastel highlighter blocks behind text  
- Labels in small pastel marker boxes (macaron blue, lavender, mint, peach)
- NO printed fonts, NO computer typesetting, NO realistic text

Composition:
Three calm stations across the middle with slim curved arrows between them.
Station 1 (Recalling): macaron blue rounded card, detailed hand-drawn filter/sieve object, label above
Station 2 (Ranking): macaron lavender card, hand-drawn magnifying glass and scale, label above
Station 3 (Re-ranking): macaron mint card, hand-drawn cards being reordered, label above
Small coral red star marks on key details.
Keep the three-station group compact: about 55–60% page width.
Leave wide margins and quiet negative space. Near-white warm cream paper. Faint corner marks only.
At most one tiny reader figure in the lower-right corner.

Required text only:
- Title: 推荐系统三阶段
- Subtitle: 召回·精排·重排
- Station labels: 海量召回, 精排打分, 重排策略
- Captions: 万级→千级, 千级→百级, 百级→数十
- Key terms: 粗筛, 精准, 调权

Avoid:
full-page border, yellow paper, beige paper, oversized central objects, oversized body-page title,
heavy bottom boxes, extra text, invented micro-labels, gibberish, English, watermark,
crowded composition, many people, childish cartoons, thick outlines, saturated colors, corporate template look.
```

## Image-1 Anchor Chain

**多图生成一致性规则**（移植自 baoyu-skills，最重要的 consistency trick）：

```
1. 首图 (cover 或 image-01) 不带 --ref 生成 → 建立视觉锚点
2. 后续每张图必须带 --ref <image-01.png> 生成
3. 如果 Provider 不支持参考图（如 OpenAI DALL-E），在每张后续图的 prompt 中追加:
   
   "Match the visual style, line weight, color palette, paper tone, title treatment, 
    corner marks, and diagram density of the first image in this series exactly.
    This must look like the same illustrator drew all pages. Same paper, same pen, same hand."

4. 如果 Provider 支持 session ID，使用统一 session ID: slides-{deck-name}-{timestamp}
5. 生成后做 Contact Sheet 检查：背景色是否漂移、标题是否一致、线条是否匹配
```

### 工具调用示例

```bash
# 首图 — 无 ref，建立锚点
bun scripts/imagine/main.ts \
  --file prompts/01-cover-sketch-notes.md \
  --provider dashscope \
  --aspect 16:9 \
  --quality 2k \
  --output out/01-cover.png

# 后续图 — 带 ref，锚定视觉
bun scripts/imagine/main.ts \
  --file prompts/02-content-process.md \
  --provider dashscope \
  --aspect 16:9 \
  --quality 2k \
  --reference out/01-cover.png \
  --output out/02-content.png
```

## Style Definition 选择规则

根据 pipeline Step 2 选定的 design，加载对应的 style-definition：

```
design → references/style-definitions/{design}.md

如果 style-definition 不存在 → 使用 base-prompt.md 中的 legacy style token（降级）
如果 style-definition 存在 → 使用结构化 prompt 组装（升级路径）
```

**当前可用的 style-definition（7 个）**：

| Design | text_baking | 特点 |
|--------|-------------|------|
| sketch-notes | yes | 手绘教育图，macaron 色板，纸纹理 |
| hand-drawn-edu | yes | 手绘教学，纸笔记本风，马克笔强调 |
| chalkboard | yes | 黑板教学，粉笔纹理，深绿底 |
| notion | yes | 知识卡片，极简手绘，最大留白 |
| watercolor | no | 水彩艺术，轻柔透明 wash，不适合作内容页 |
| pixel-art | yes | 像素艺术，8-bit 风格，高饱和 |
| blueprint | no | 蓝图技术，蓝图蓝底白色线框，不适合作内容页 |

## Provider-Specific 适配

从 `base-prompt.md` 迁移的 Provider 特定调整，在组装 prompt 时应用：

### DashScope (wanx-v1)

- 中文 prompt 效果最佳
- 添加 `, 高画质` 前缀
- 宽高比通过 API 参数，不在 prompt 中重复
- 不支持参考图 → Image-1 Anchor Chain 用文本锚定方式

### OpenAI (DALL-E 3)

- 400 字符 prompt 限制 → 精简 Layer 2 的风格描述，只保留关键色值和核心视觉元素
- 用 `quality: hd` 参数处理质量
- 构图放第一句，风格放第二句
- 不支持参考图 → 用文本锚定方式

### Google (Imagen)

- 严格安全过滤 → 用正面表述，不说"不要XX"，说"请确保XX"
- 支持参考图（AI Studio 路径）→ Image-1 Anchor Chain 可直接传图
- 添加 `, professional illustration` 后缀

### Replicate (Flux)

- 支持完整 prompt + negative prompt
- 支持参考图 → Image-1 Anchor Chain 可用
- `--ar {aspect_ratio}` 语法传宽高比

### Seedream (豆包 2.1)

- 支持参考图（`reference_image`）→ Image-1 Anchor Chain 可用
- 中文 prompt 效果最佳
- 支持 negative prompt

### 通用规则

- 所有 Provider：首先尝试用 API 参数传宽高比，prompt 中的比例后缀仅作备份
- 不支持参考图的 Provider：在后续图 prompt 中追加文本锚定子句
- 所有生成的图旁都写入 `.prompt.txt` 记录完整 prompt

## Assembly Checklist

生成图片前检查：

- [ ] Image role 确定（illustration or content-page）
- [ ] 加载了正确的 style-definition 文件
- [ ] Layer 1 包含了正确的 aspect ratio 和质量 token
- [ ] Layer 2 包含了 hex 色值、视觉元素枚举、composition 规则、negative constraints
- [ ] Layer 3 包含了具体的构图描述
- [ ] 如果是 content-page：Required Text Only 列表完整且精确
- [ ] 如果是 content-page：文字渲染规则已包含（hand-drawn Chinese, highlighter, pastel markers）
- [ ] 如果是 illustration：no text 约束已包含
- [ ] Image-1 Anchor Chain 已考虑：首图无 ref，后续有 ref 或文本锚定

## 与 Legacy base-prompt.md 的关系

`base-prompt.md` 中的 style token 表（一行一句描述）标记为 **legacy**。在以下场景仍可使用：
- 对应的 style-definition 文件尚未创建（P2 及以后的 9 个 design）
- 需要快速原型，不需要精确视觉控制

对于有 style-definition 文件的 7 个 design（P0+P1），**必须**使用本文档的结构化 prompt 组装方式。
