# AI Image Prompt Construction

结构化 prompt 组装指南。替代 `base-prompt.md` 中遗留的扁平 style token 方式。

## 核心原则

**三层 Prompt 结构 × 正交设计**：

```
Layer 1: Image Specs & Universal Constraints  ← Image Role 决定
Layer 2: Style Lock                           ← Design 决定 (style-definitions/*.md 的 style_lock)
Layer 3: Archetype Composition + Content      ← Archetype 决定 (references/archetypes.md)
```

**Universal × Design-specific 正交**：
- **Archetype（通用层）**：10 种语义构图模板 — 只管几何布局、节点数量、流向、留白比例。与风格无关
- **Style Lock（设计层）**：每个 design 的浓缩视觉描述 — 只管颜色、线条、纹理、材质。与布局无关
- **组装公式**：`Layer 3 = Archetype 构图模板` + `Layer 2 = Style Lock` → 同一张 horizontal process 在 sketch-notes 和 blueprint 下完全不同

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

**单页生成**：从 `references/style-definitions/{design}.md` 加载完整 Visual DNA。

**多页生成**：使用该文件的 `style_lock`（浓缩 8–12 行段落），**原样粘贴**到每页 prompt 中，保证跨页一致性。仅在首张图 prompt 中附带完整 Color Palette 供初次锚定。

```text
Apply this exact visual style to every page in this deck:

{粘贴 style_lock 全文 — 包含精确 hex 色值、线型、纹理、禁止项}

This style lock is identical across all pages. Only the central diagram layout changes per page.
```

### Layer 3 组装

从 `references/archetypes.md` 选择匹配的语义 Archetype，加载其通用构图模板，替换其中的占位符。

```text
## Archetype: {archetype name}
{paste 对应 archetype 的"通用结构"描述 — 节点数、流向、留白比例}

## Scene Adaptation
{将 archetype 的通用结构适配到当前页面的具体内容：
 - 节点对应哪个概念
 - 流向对应哪个过程  
 - 具体场景氛围和细节
}

## Illustration-Role Adaptation
{根据 archetype 的 "Illustration Role 适配" 规则调整：
 - 标注/标签区改为空白区域
 - 留白区精确位置标注（供 HTML 层叠字）
}
```

**Archetype 选择参考**：

| 内容语义 | Archetype | 关键结构 |
|---------|-----------|---------|
| 开篇/章节起始 | Cover metaphor | 1 主体居中，上方留白 25-30% |
| 定义/概念 | Single concept | 1 中心 + 2-4 注释辐射 |
| 对比/A vs B | Left-right contrast | 左右 2 区 + 中线分隔 |
| 步骤/流程 | Horizontal process | 4-7 节点水平排列 + 箭头链 |
| 循环/迭代 | Circular mechanism | 3-6 节点环形排列 |
| 决策/分支 | Branching map | 1 决策点 + 3-5 分支散开 |
| 分类/框架 | Classification map | 1 父 + 3-5 子层级展开 |
| 多维对比 | Matrix table | 3-5 行 × 2-3 列网格 |
| 抽象隐喻 | Main metaphor diagram | 1 主体 + 3-6 标注环绕 |
| 总结/收束 | Takeaway | 1 核心 + 2-4 支撑点 |

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

与 illustration role 相同：从 `references/archetypes.md` 选择 Archetype，但额外加入中文文字列表。

```text
## Page Content
Archetype: {从 archetypes.md 选择 — horizontal process | left-right contrast | circular mechanism | branching map | classification map | takeaway | single concept | cover metaphor | matrix table | main metaphor diagram}
Main point: {one sentence summarizing this page}

## Composition
{paste archetype 的"通用结构"描述 + 具体内容适配}

## Required Text Only
Title exactly: {short Chinese title, 5–12 characters}
Subtitle exactly: {optional short subtitle, 3–12 characters, or omit}
- Label 1: {text}
- Label 2: {text}
- ... (2–5 labels, each 2–8 Chinese characters)
- Caption: {optional, short}

## Text Rendering Rules
{从 style-definition 的 Typography 段装载具体指令：
 - sketch-notes: hand-drawn Chinese, highlighter blocks behind keywords, pastel marker boxes for labels
 - chalkboard: chalk-drawn Chinese text, powdery edges, colored chalk keywords
 - pixel-art: pixel bitmap lettering, blocky monospaced, in dialog-box rectangles
 - ...}
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

设置环境变量后可省略重复参数（详见 `scripts/imagine/config.ts`）：
```bash
export IMAGINE_PROVIDER="dashscope"
export IMAGINE_MODEL="qwen-image-2.0-pro-2026-04-22"
export IMAGINE_QUALITY="2k"
export IMAGINE_ASPECT="16:9"
```

```bash
# 首图 — 无 ref，建立锚点（provider/quality/aspect 从 env 读取）
bun scripts/imagine/main.ts \
  --file prompts/01-cover-sketch-notes.md \
  --output out/01-cover.png

# 后续图 — 带 ref，锚定视觉
bun scripts/imagine/main.ts \
  --file prompts/02-content-process.md \
  --reference out/01-cover.png \
  --output out/02-content.png

# 结构化 prompt 模式（--design 触发三层组装）
bun scripts/imagine/main.ts \
  --design sketch-notes --archetype "horizontal process" \
  --content "推荐系统三阶段：召回→精排→重排" \
  --output out/03-process.png
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

Provider 注册表和自动选择逻辑在 `scripts/imagine/config.ts`。以下为各 Provider 的 prompt 适配建议：

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
- [ ] Archetype 已从 `references/archetypes.md` 选择，匹配内容语义
- [ ] Style-definition 文件已加载，`style_lock` 已提取
- [ ] Layer 1 包含正确的 aspect ratio 和质量 token
- [ ] Layer 2 粘贴了完整的 style_lock（多页时原样复用，不修改）
- [ ] Layer 3 粘贴了 archetype 通用结构 + 页面具体内容适配
- [ ] 如果是 content-page：Required Text Only 列表完整且精确，Typography 指令已从 style-definition 装载
- [ ] 如果是 illustration：no text 约束 + 留白 zone 位置已标注
- [ ] Image-1 Anchor Chain 已考虑：首图无 ref，后续有 ref 或文本锚定
- [ ] 多页生成时：style_lock 跨页完全一致，只改变 central diagram 区域的内容

## 与 Legacy base-prompt.md 的关系

`base-prompt.md` 中的 style token 表（一行一句描述）标记为 **legacy**。在以下场景仍可使用：
- 对应的 style-definition 文件尚未创建（P2 及以后的 9 个 design）
- 需要快速原型，不需要精确视觉控制

对于有 style-definition 文件的 7 个 design（P0+P1），**必须**使用本文档的结构化 prompt 组装方式。
