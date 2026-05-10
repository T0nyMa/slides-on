---
name: slides-on
description: >
  Build presentation slides, PPT, slide decks, 演示文稿, keynotes, 小红书图文, or
  image cards from any document. Use this whenever the user asks to create slides,
  做PPT, 做演示文稿, 做slides, 帮我做个汇报, 整理成图文, 做成小红书, 生成图文,
  make a deck, generate a PPT, weekly report, pitch deck, 周报, 提案, 分享,
  or any document-to-slides task — even if they don't say "slides" explicitly
  (e.g. "帮我整理一下这个文档", "把这篇做成卡片"). One pipeline: content analysis
  → style decision → review → HTML rendering → export (PNG/PPTX/PDF).
---

# slides-on — 统一演示文稿制作

五步流水线：**内容分析 → 风格决策 → Review 验证 → HTML 渲染 → 导出**。

## 核心约束

1. Pipeline 严格按序执行，不可跳步。每步产出写入工作目录
2. AI 图片生成使用 prompt 文件机制，保证可复现
3. 所有视觉样式收归 Design CSS，页面 HTML 只负责结构和内容

## Pipeline 详细流程

### Step 1: 内容分析

**输入**：用户提供的原始文档（Markdown、文本、或已有大纲）

**处理**：
1. **解析文档**：提取标题、副标题、作者等元信息；识别章节边界
2. **章节划分**：按 H2/主题将文档拆分为 section，每 section 包含若干 slide
3. **内容类型识别**：为每页标注内容类型（文字、图表、代码、架构图、信息图、AI 插图）
4. **页数推算**（启发式）：
   - < 1000 字 → 5-10 页
   - 1000-3000 字 → 10-18 页
   - > 3000 字 → 18-30 页
5. **信号检测**：扫描关键词匹配推荐 design（详见 `references/style-decision-matrix.md`）
6. **Engagement 分析**（社交场景）：当目标场景为小红书/社交媒体/图文卡片时，加载 `references/engagement-analysis.md`，补充 engagement 指标到分析输出中（Hook 类型与评分、受众画像、滑动流设计、保存/分享/评论触发点）
7. **Ghost Deck Test**：只读标题序列能否讲述完整论点？不能则重排

**产出**：`outline.md`（slides 结构大纲），格式：
```markdown
# Slides: <标题>

## Cover
- 标题: ...
- 副标题: ...
- 作者: ...

## Section 1: <章节名>
### Slide 1.1: <页面标题>
- 原型: 痛点页 | 核心概念页 | 流程页 | 对比页 | 金句页 | 数据页 | 分类页 | 速查页 | 行动页 | Thanks页
- 锚点: c-card-warn | c-kpi | c-steps | c-glass | c-formula | ...
- 组件: c-stack(c-card-warn × 2 + c-card-accent × 1) + c-formula
- 字数: ~120 字
- 内容: ...
```

> **页面原型和组件配方**：详见 `references/component-recipes.md`，覆盖 10 种页面原型 + 组件组合 + 密度预算。Step 1 使用此文档决定每页的页面原型和组件组合。

**参考文档**：
- `references/analysis-framework.md` — 详细分析框架
- `references/engagement-analysis.md` — Engagement 驱动分析框架（小红书/社交媒体场景）
- `references/component-recipes.md` — 内容语义 → 页面原型 → 组件配方（含密度预算、溢出处理）
- `references/content-rules.md` — 内容规范
- `references/style-decision-matrix.md` — 信号→design 映射表

### Step 2: 风格决策

**输入**：`outline.md`

**两级决策**：

**Slides 级 — 选择 Design（视觉皮肤）**：
1. 从 18 个 design 概念中选择（`references/designs/`，或读取 EXTEND.md 默认值）。其中 3 个有完整 Design CSS + assemble pipeline 支持：`pastel-card`、`white-editorial`、`xhs-post`。其余 15 个可用于 AI 图片生成（style-definitions）
2. Design = 可移植的 CSS 变量覆盖层，决定颜色 / 字体 / 纹理 / 密度 / 动画偏好
3. 支持 4 维自定义覆盖（Texture × Mood × Typography × Density）
4. 3:4 画布推荐使用 Design CSS（`assets/designs/{name}.css`，现有 3 个：pastel-card, white-editorial, xhs-post），从极简（仅 CSS 变量，~30行）到完整（+ Chrome 样式 + c-* 扩展，~200行）渐进式构建。详见 `references/portrait-user-guide.md`

**Slide 级 — 选择渲染引擎**：

| 内容类型 | 推荐引擎 | 产出 |
|---------|---------|------|
| 文字排版 | HTML layout | HTML 片段 |
| 数据图表 | HTML layout（chart-*）| HTML 片段 |
| 代码展示 | HTML layout（code, terminal）| HTML 片段 |
| 架构图/流程图 | SVG diagram | SVG 文件 |
| AI 插图/概念图 | AI image（结构化 prompt 组装） | PNG 图片 |
| 信息图 | AI infographic（结构化 prompt 组装） | PNG 图片 |
| 封面图 | AI cover image（结构化 prompt 组装） | PNG 图片 |
| 分隔页 | HTML layout | HTML 片段 |
| 3:4 手机画布 | Component palette | 组件自由组合（`c-*` classes） |

> **3:4 画布特殊处理**：当目标画布为 3:4（手机端），不推荐使用单一 layout，而是使用 **Component Palette**（`assets/components.css`）自由拼装组件（卡片、步骤、KPI、图标行、警告框等），纵向堆叠填满屏幕。组件大小、字数上限、页面密度等规范见 `references/content-rules-portrait.md`。组合示例见 `references/components.md`。

**产出**：`style-decision.md`，记录每个 slide 的 theme、layout、渲染引擎选择。

**参考文档**：
- `references/themes.md` — 36 个 theme 详情
- `references/layouts.md` — 31 个 layout 详情
- `references/content-rules-portrait.md` — 3:4 画布内容规范（组件大小、字数、密度、Design CSS 用法）
- `references/portrait-user-guide.md` — 3:4 竖版制作指南（Design CSS 渐进式用法，组件搭配模式）
- `references/components.md` — 共享组件库（card、step、KPI、quote、Chrome 片段等）
- `references/designs/` — 18 个 design 概念文档
- `assets/designs/` — Design CSS 实现（可移植视觉皮肤，3 个）
- `references/style-definitions/` — Design 的结构化生图数据（hex 色值、视觉元素、排版指令）
- `references/prompt-construction.md` — AI 图片结构化 prompt 组装指南
- `references/diagram/` — 4 种架构图类型
- `references/infographic/` — 信息图 layout + style

### Step 3: Review 验证

**输入**：`outline.md` + `style-decision.md`

**处理**：在进入 HTML 渲染前，逐页检查三项，不通过则回 Step 1/2 调整：

1. **内容溢出检查** — 组件容量 < 内容量？
   - c-card 正文 > 60 字 → 精简或拆为 2 卡片
   - c-steps > 7 步 → 拆为两页
   - c-icon-row > 10 项 → 拆页或分组
   - c-quote > 40 字 → 只保留核心句
   - 组件总数 > 6 → 拆页
2. **留白过大检查** — 组件 < 3 个？
   - 加 c-badge-row（3-4 标签）、c-note（关键提示）、c-card-soft（补充说明）
   - 或合并到相邻页
3. **风格匹配检查** — Design 的 mood/texture 与内容调性是否冲突？
   - 严肃/学术内容 + 马卡龙/手绘风 → 换 Design 或降 mood
   - 年轻/社交内容 + corporate → 换 Design
   - 数据密集内容 + 极简 Design → 检查组件颜色变体是否够区分信息层级

**产出**：`review.md`，记录每页判定（pass / adjust）和调整决策。

```
# Review

## Slide 1.1: 封面
- 溢出: pass
- 留白: adjust — 加 c-section(c-icon-row × 3) 做目录预告
- 风格: pass

## Slide 1.2: 核心痛点
- 溢出: pass
- 留白: pass
- 风格: pass

## Slide 2.3: 实施路径
- 溢出: adjust — 7 步拆为两页（步骤 1-4 / 5-7）
- 留白: pass
- 风格: pass
```

> Review 不通过则回到对应步骤调整，直到全部 pass 才进入 Step 4。

### Step 4: HTML 渲染

**输入**：`outline.md` + `style-decision.md` + `review.md`

**处理**：
1. 根据 outline.md 和 style-decision.md，整理为结构化 JSON（`slides.json`），包含每页的 type、title、cards、steps 等数据
2. **AI 图片生成**（如有）：使用 `scripts/imagine/prompt-assembler.ts` 自动组装三层结构化 prompt（Layer 1: Image Role → Layer 2: Style Lock → Layer 3: Archetype + Content），或参考 `references/prompt-construction.md` 手动组装。通过 `bun scripts/imagine/main.ts --design <name> --archetype <name> --content "..."` 调用（单张）或 `build-batch.ts`（批量）。Provider、Model 等默认配置通过 `IMAGINE_*` 环境变量或 EXTEND.md 的 `ai_image` 节设置，CLI 参数可覆盖
3. **HTML 组装**：`bun scripts/assemble-deck.ts --input slides.json --output index.html`。脚本自动完成 CSS 加载、Chrome 片段、c-* 组件拼装。`--asset-depth 2` 用于 `examples/` 输出路径
4. **SVG 图**（如有）：直接内联到 slides.json 的 `html` 字段，或 `<img>` 引用
5. 添加 `data-anim` 属性声明动画

**产出**：一个完整的 `index.html`（可浏览器打开交互演示）

**`slides.json` 格式示例**（完整类型定义见 `scripts/assemble/types.ts`）：
```json
{
  "config": {
    "title": "My Deck",
    "design": "pastel-card",
    "canvas": "3:4",
    "author": "Author Name"
  },
  "slides": [
    {
      "type": "cover",
      "title": "演示文稿标题",
      "subtitle": "副标题或一句话摘要",
      "kicker": "标签文字",
      "chip": "01",
      "chipColor": "mint",
      "blobs": ["b1", "b2"]
    },
    {
      "type": "cards-2x2",
      "title": "核心观点",
      "cards": [
        { "num": "01", "title": "卡片标题", "body": "卡片内容说明", "color": "peach" },
        { "num": "02", "title": "卡片标题", "body": "卡片内容说明", "color": "mint" }
      ]
    },
    {
      "type": "steps",
      "title": "实施路径",
      "steps": [
        { "num": "1", "title": "第一步", "body": "具体描述" },
        { "num": "2", "title": "第二步", "body": "具体描述" }
      ]
    },
    { "type": "html", "html": "<section class=\"slide is-active\"><!-- 自定义 HTML --></section>" }
  ]
}
```
Slide 类型：`cover` | `section` | `cards-2x2` | `cards-3` | `quote` | `steps` | `code` | `thanks` | `bullets` | `kpi` | `html`

**关键文件**：
- `scripts/assemble-deck.ts` — HTML 组装入口（JSON → index.html）
- `scripts/assemble/types.ts` — SlideData、DeckConfig 类型定义
- `scripts/assemble/designs.ts` — Design 模板注册表（per-design 渲染函数）
- `scripts/assemble/slides.ts` — 10 个渲染函数（覆盖 11 种 slide 类型）
- `scripts/assemble/skeleton.ts` — Deck HTML 骨架生成
- `scripts/imagine/prompt-assembler.ts` — 三层结构化 prompt 组装引擎
- `scripts/imagine/main.ts` — AI 图片生成入口
- `scripts/imagine/config.ts` — Provider 注册表 + 环境变量默认值
- `assets/base.css` — 设计系统（150行，30+ CSS Variables）
- `assets/components.css` — 共享组件库（cqi + CSS vars，c-* 组件）
- `assets/designs/` — Design CSS 文件（3 个：pastel-card, white-editorial, xhs-post）
- `assets/runtime.js` — 交互引擎（960行，slide 切换、键盘导航、presenter 模式）

**参考文档**：
- `references/authoring-guide.md` — HTML 编写指南
- `references/presenter-mode.md` — Presenter 模式
- `references/animations.md` — 动画系统
- `references/html-engine.md` — HTML 渲染引擎详解
- `references/ai-visuals.md` — AI 视觉内容生成
- `references/prompt-construction.md` — AI 图片结构化 prompt 组装（三层结构 + Image-1 Anchor Chain）
- `references/components.md` — 组件调色板（3:4 自由拼装）

### Step 5: 导出

**输入**：`index.html`（+ AI 图片 + SVG 文件）

**三条导出路径**：

| 路径 | 命令 | 产出 | 适用场景 |
|------|------|------|---------|
| A. PNG 截图 | `bun scripts/render-precise.ts` | @2x PNG 序列 | 预览、社交媒体 |
| B. PPTX（可编辑） | `bun scripts/html-to-pptx.ts` | .pptx（原生文本/形状） | 分发、协作编辑 |
| C. PDF（拼合） | `bun scripts/merge-to-pdf.ts` | .pdf（图片拼合） | 打印、邮件 |

**路径 A — PNG 截图**（默认导出方式）：
```bash
bun scripts/render-precise.ts <index.html> \
  --canvas 16:9 \      # 或 3:4, 4:3, 9:16, 1:1, 2.35:1, a4-landscape, WxH
  --dsf 2 \            # 设备像素比（默认 @2x Retina）
  --slides auto \      # 自动检测页数，或指定 N
  --format png \       # png 或 jpeg
  --output ./png-out/  # 输出目录
```

**路径 B — PPTX（可编辑）**：
```bash
bun scripts/html-to-pptx.ts <index.html> --output deck.pptx
```

**路径 C — PDF 拼合**：
```bash
bun scripts/merge-to-pdf.ts <png-dir> --output deck.pdf
```


**画布尺寸参考**：

| 模板类型 | 画布 | @2x 输出 |
|---------|------|---------|
| 标准 16:9 | 1920×1080 | 3840×2160 |
| XHS 3:4 | 810×1080 | 1620×2160 |
| Stories 9:16 | 1080×1920 | 2160×3840 |
| Square 1:1 | 1080×1080 | 2160×2160 |

**参考文档**：`references/export.md`

## 快速参考：Layout → 用途

| 类别 | Layout | 用途 |
|------|--------|------|
| 开篇 | cover, toc, section-divider | 封面、目录、章节分隔 |
| 文字 | bullets, big-quote, three-column, two-column | 要点、引言、多栏 |
| 数据 | chart-bar, chart-line, chart-pie, chart-radar, kpi-grid, stat-highlight | 图表、指标 |
| 代码 | code, terminal, diff | 代码展示、终端、Diff |
| 对比 | comparison, pros-cons, table | 对比、优劣、表格 |
| 流程 | process-steps, roadmap, timeline, gantt, flow-diagram | 步骤、路线图、时间线 |
| 图形 | arch-diagram, mindmap, image-grid, image-hero | 架构图、思维导图、图片 |
| 结尾 | cta, thanks, todo-checklist | 行动号召、致谢、清单 |

> 上表为 16:9 画布的 31 个 single-page layout。3:4 画布使用 assemble-deck 的 11 种 slide 类型（cover, section, cards-2x2, cards-3, quote, steps, code, thanks, bullets, kpi, html），见 Step 4 的 slides.json 格式。

## 画布适配：16:9 与 3:4

Pipeline 一开始就确定画布比例，两种画布采用不同策略：

### 16:9 画布（默认）

使用 `templates/deck.html` 骨架 + `templates/single-page/` 中的 layout。
默认 `.slide{ padding:72px 96px; justify-content:center }`，适合横向宽屏。

### 3:4 画布（手机端）

**一步切换**：在 `<body>` 上加 `class="portrait"` 即可。

```html
<body class="d-pastel-card portrait">
```

`.portrait` 自动完成：
- Deck 约束为 3:4 比例（`min(100vw, 100vh * 3/4)`）
- 启用 Container Query（`container-type: inline-size`），`cqi` 单位等比缩放
- Slide 默认 `padding: 4.5cqi; justify-content: flex-start`（内容从上排列）

**内容策略**：3:4 不推荐使用单一 layout 模板。改用 **Component Palette**（`assets/components.css`），通过 `c-stack`、`c-row`、`c-card`、`c-steps` 等组件自由拼装，纵向堆叠填满屏幕。详见 `references/components.md`。

**导出**：`bun scripts/render-precise.ts --canvas 3:4` 渲染为 810×1080 @2x。

### 窄视口兜底

`base.css` 内置两层兜底，当 deck 在窄视口下自动触发（无需手动加 class）：
1. `@container (max-width: 1000px)` — 容器查询，cqi 字号/间距缩放（主要路径）
2. `@media (max-width: 900px)` — 视口查询，px 字号缩小 + grid 降级（旧浏览器兜底）

## 交互快捷键

生成的 HTML deck 支持键盘翻页、theme/animation 切换、全屏、概览网格、Presenter 模式。详见 `references/keyboard-shortcuts.md`。

## EXTEND.md 扩展

用户可在 `EXTEND.md` 中自定义：
- **defaults**：默认 design、theme、字体、动画、导出偏好、AI 图片 provider
- **brand**：Logo、品牌色、页脚
- **slides-structure**：自定义 slides 页面序列模式
- **custom-themes/layouts/components**：扩展视觉和布局
- **ai-image**：默认图片生成 provider 和参数

详见 `EXTEND.md`。
