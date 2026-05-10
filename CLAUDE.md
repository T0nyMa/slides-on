# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

slides-on 是一个 Claude Code skill，提供统一的演示文稿制作能力。用户提供原始文档，自动生成可交互 HTML 演示 + 导出 PNG/PPTX/PDF。

## Skill Structure

项目遵循 Claude Code skill 标准结构：

- **SKILL.md** — skill 入口（YAML frontmatter: name + description），包含 pipeline 工作流指令，< 500 行
- **EXTEND.md** — 用户级扩展配置（自定义 theme/layout/component/design/brand/导出偏好）
- **references/** — 渐进式披露的详细参考文档，SKILL.md 按需引用
- **templates/** — Template 文件（full-decks/）和单页布局模板（single-page/）
- **assets/** — CSS（base.css + themes/）、JS（runtime.js）、静态资源
- **scripts/** — 导出工具（render-precise.ts、html-to-pptx.ts、merge-to-pdf.ts）
- **examples/** — 示例 slides
- **package.json** — 发布元数据

```
slides-on/
├── SKILL.md                        # Skill 入口（pipeline 工作流 + 触发条件）
├── EXTEND.md                       # 用户扩展配置
├── CLAUDE.md                       # 开发者指南（不随 skill 分发）
├── package.json                    # 发布元数据
│
├── references/                     # 渐进式披露参考文档
│   ├── glossary.md                 #   术语表
│   ├── themes.md                   #   theme 目录
│   ├── layouts.md                  #   layout 目录
│   ├── animations.md               #   animation 目录
│   ├── full-decks.md               #   full-deck template 目录
│   ├── presenter-mode.md           #   presenter 模式指南
│   ├── authoring-guide.md          #   HTML 编写指南
│   │
│   ├── designs/                    #   17 个 design 定义
│   │   ├── blueprint.md            #     17 个 design
│   │   ├── bold-editorial.md
│   │   ├── chalkboard.md
│   │   ├── corporate.md
│   │   ├── dark-atmospheric.md
│   │   ├── editorial-infographic.md
│   │   ├── fantasy-animation.md
│   │   ├── hand-drawn-edu.md
│   │   ├── intuition-machine.md
│   │   ├── minimal.md
│   │   ├── notion.md
│   │   ├── pixel-art.md
│   │   ├── scientific.md
│   │   ├── sketch-notes.md
│   │   ├── vector-illustration.md
│   │   ├── vintage.md
│   │   └── watercolor.md
│   │
│   ├── dimensions/                 #   4 维自定义（Texture × Mood × Typography × Density）
│   │   ├── density.md
│   │   ├── mood.md
│   │   ├── texture.md
│   │   ├── typography.md
│   │   └── designs.md              #     design → dimension 映射表
│   │
│   ├── infographic/                #   信息图（21 布局 × 22 视觉风格）
│   │   ├── layouts/                #     21 种信息图布局
│   │   │   ├── bento-grid.md
│   │   │   ├── binary-comparison.md
│   │   │   ├── bridge.md
│   │   │   ├── circular-flow.md
│   │   │   ├── comic-strip.md
│   │   │   ├── comparison-matrix.md
│   │   │   ├── dashboard.md
│   │   │   ├── dense-modules.md
│   │   │   ├── funnel.md
│   │   │   ├── hierarchical-layers.md
│   │   │   ├── hub-spoke.md
│   │   │   ├── iceberg.md
│   │   │   ├── isometric-map.md
│   │   │   ├── jigsaw.md
│   │   │   ├── linear-progression.md
│   │   │   ├── periodic-table.md
│   │   │   ├── story-mountain.md
│   │   │   ├── structural-breakdown.md
│   │   │   ├── tree-branching.md
│   │   │   ├── venn-diagram.md
│   │   │   └── winding-roadmap.md
│   │   └── styles/                 #     22 种信息图视觉风格
│   │       ├── aged-academia.md
│   │       ├── bold-graphic.md
│   │       ├── chalkboard.md
│   │       ├── claymation.md
│   │       ├── corporate-memphis.md
│   │       ├── craft-handmade.md
│   │       ├── cyberpunk-neon.md
│   │       ├── hand-drawn-edu.md
│   │       ├── ikea-manual.md
│   │       ├── kawaii.md
│   │       ├── knolling.md
│   │       ├── lego-brick.md
│   │       ├── morandi-journal.md
│   │       ├── origami.md
│   │       ├── pixel-art.md
│   │       ├── pop-laboratory.md
│   │       ├── retro-pop-grid.md
│   │       ├── retro-popup-pop.md
│   │       ├── storybook-watercolor.md
│   │       ├── subway-map.md
│   │       ├── technical-schematic.md
│   │       └── ui-wireframe.md
│   │
│   ├── diagram/                    #   SVG 架构图（4 种类型）
│   │   ├── architecture.md         #     4 个详细图类型参考
│   │   ├── flowchart.md
│   │   ├── sequence.md
│   │   └── structural.md
│   │
│   ├── imagine/                    #   AI 图片生成（10 个 Provider）
│   │   └── providers/              #     Provider 参考文档
│   │       ├── dashscope.md
│   │       ├── minimax.md
│   │       ├── openrouter.md
│   │       ├── replicate.md
│   │       └── zai.md
│   │
│   ├── analysis-framework.md      #   内容分析框架
│   ├── archetypes.md               #   10 种语义构图模板
│   ├── engagement-analysis.md      #   Engagement 驱动分析框架
│   ├── text-fidelity.md            #   文字兜底策略
│   ├── base-prompt.md              #   AI 图片基础 prompt（遗留 style token）
│   ├── prompt-construction.md       #   AI 图片结构化 prompt 组装（三层结构）
│   ├── content-rules.md            #   16:9 内容规范
│   ├── content-rules-portrait.md   #   3:4 内容规范（组件大小、密度）
│   ├── portrait-user-guide.md      #   3:4 竖版制作指南（轻装/品牌双路线）
│   ├── design-guidelines.md        #   设计指南
│   ├── export.md                   #   导出选项
│   ├── html-engine.md              #   HTML 渲染引擎详解
│   ├── ai-visuals.md               #   AI 视觉内容生成
│   ├── components.md               #   共享组件库（card/step/KPI/quote 等）
│   │
│   ├── style-definitions/          #   Design 的结构化生图定义（7 个，逐 hex 色值+视觉元素）
│   │   ├── sketch-notes.md
│   │   ├── hand-drawn-edu.md
│   │   ├── chalkboard.md
│   │   ├── notion.md
│   │   ├── watercolor.md
│   │   ├── pixel-art.md
│   │   └── blueprint.md
│
├── templates/                      # HTML 模板
│   ├── full-decks/                 #   15 个 deck template
│   │   ├── course-module/          #     每个含 index.html + style.css + README.md
│   │   ├── dir-key-nav-minimal/
│   │   ├── graphify-dark-graph/
│   │   ├── hermes-cyber-terminal/
│   │   ├── knowledge-arch-blueprint/
│   │   ├── obsidian-claude-gradient/
│   │   ├── pitch-deck/
│   │   ├── presenter-mode-reveal/
│   │   ├── product-launch/
│   │   ├── tech-sharing/
│   │   ├── testing-safety-alert/
│   │   ├── weekly-report/
│   │   ├── xhs-pastel-card/
│   │   ├── xhs-post/
│   │   └── xhs-white-editorial/
│   │
│   ├── single-page/               #   31 个 slide layout
│   │   ├── arch-diagram.html
│   │   ├── big-quote.html
│   │   ├── bullets.html
│   │   ├── chart-bar.html
│   │   ├── chart-line.html
│   │   ├── chart-pie.html
│   │   ├── chart-radar.html
│   │   ├── code.html
│   │   ├── comparison.html
│   │   ├── cover.html
│   │   ├── cta.html
│   │   ├── diff.html
│   │   ├── flow-diagram.html
│   │   ├── gantt.html
│   │   ├── image-grid.html
│   │   ├── image-hero.html
│   │   ├── kpi-grid.html
│   │   ├── mindmap.html
│   │   ├── process-steps.html
│   │   ├── pros-cons.html
│   │   ├── roadmap.html
│   │   ├── section-divider.html
│   │   ├── stat-highlight.html
│   │   ├── table.html
│   │   ├── terminal.html
│   │   ├── thanks.html
│   │   ├── three-column.html
│   │   ├── timeline.html
│   │   ├── toc.html
│   │   ├── todo-checklist.html
│   │   └── two-column.html
│   │
│   ├── deck.html                   #   新建 slides 起始骨架
│   └── showcases/                  #   theme/layout/animation 展示页
│       ├── theme-showcase.html
│       ├── layout-showcase.html
│       ├── animation-showcase.html
│       └── full-decks-index.html
│
├── assets/                         # 静态资源
│   ├── base.css                    #   设计系统（150 行 30+ CSS vars）
│   ├── fonts.css                   #   系统字体栈
│   ├── components.css              #   共享组件库（cqi + CSS vars, 3:4 自适应）
│   ├── runtime.js                  #   交互引擎 960 行
│   ├── designs/                    #   3 个 Design CSS（可移植视觉皮肤）
│   │   ├── pastel-card.css         #     马卡龙色块风
│   │   ├── white-editorial.css     #     白底杂志风
│   │   └── xhs-post.css            #     手绘涂鸦风
│   ├── themes/                     #   36 个 theme CSS
│   │   ├── academic-paper.css
│   │   ├── arctic-cool.css
│   │   ├── aurora.css
│   │   ├── ... (36 files total)
│   │   └── y2k-chrome.css
│   └── animations/                 #   动画系统（27 CSS + 20 Canvas FX）
│       ├── animations.css          #     27 个 CSS animation
│       ├── fx-runtime.js           #     Canvas FX 运行时
│       └── fx/                     #     20 个 Canvas FX 模块
│           ├── _util.js
│           ├── chain-react.js
│           ├── ... (20 FX modules)
│           └── word-cascade.js
│
├── scripts/                        # 工具脚本
│   ├── render-precise.ts           #   Playwright 高精度截图（新增，替代 render.sh）
│   ├── html-to-pptx.ts            #   HTML → 可编辑 PPTX（dom-to-pptx）
│   ├── merge-to-pdf.ts            #   PNG → PDF（pdf-lib 自包含）
│   ├── svg-to-png.ts              #   SVG → @2x PNG
│   ├── new-deck.sh                 #   新建 deck 脚手架
│   └── imagine/                    #   AI 图片生成
│       ├── main.ts                 #     图片生成入口
│       ├── build-batch.ts          #     批量生成
│       ├── types.ts                #     类型定义
│       └── providers/              #     10 个 Provider 实现
│           ├── azure.ts
│           ├── dashscope.ts
│           ├── google.ts
│           ├── jimeng.ts
│           ├── minimax.ts
│           ├── openai.ts
│           ├── openrouter.ts
│           ├── replicate.ts
│           ├── seedream.ts
│           └── zai.ts
│
└── examples/                       # 示例 deck
```

## Glossary

项目统一术语。核心公式：**Slides = Template × Design × Content**。

```
Slides（最终产物 = index.html）
├── Section（章节 = 一组逻辑相关的 Slide）
│   └── Slide（单页 = 一个 <section class="slide">）
│       ├── Layout（单页内容排列方式）
│       ├── Component（可复用 HTML 内容块）
│       └── Animation（进入/过渡效果）
├── Template（结构容器 = HTML骨架 + 组件体系 + 默认视觉 + 画布格式）
├── Design（视觉皮肤 = CSS变量覆盖层：颜色/字体/纹理/密度/动画偏好）
└── Style（最终计算出的 CSS 属性值）
```

| 术语 | 定义 | 角色 |
|------|------|------|
| **Slides** | 最终产物 — Template × Design × Content 的结合体，一个 index.html | 产出 |
| **Template** | 结构容器 — 定义页面上有什么、放哪里。自带默认视觉，可被 Design 覆盖 | 结构 |
| **Design** | 视觉皮肤 — 可移植的 CSS 变量覆盖层。不碰 HTML 结构，只定义颜色/字体/纹理/密度/动画 | 视觉 |
| **Slide** | Slides 中的一页，`.slide` 元素 | 页面 |
| **Section** | 逻辑相关的一组 Slide，由 section-divider 引导 | 章节 |
| **Layout** | 单页内容排列方式（双栏、代码、图表等），31 种内置 | 排版 |
| **Theme** | 单一 CSS 变量文件（36 个）。Theme 是 Design 的子集——Design 还包含纹理、密度、动画等非颜色维度 | 配色 |
| **Component** | 布局内可复用的 HTML 内容块（callout、metric-card 等） | 组件 |
| **Animation** | 页面元素的视觉过渡效果，`data-anim` + `data-fx` 声明 | 动效 |
| **Style** | 最终计算出的 CSS 属性值，是 Design + Template 共同作用的结果 | 结果 |

**易混淆辨析**：
- **Template vs Layout**：Template = Slides 级结构容器（整套格式）。Layout = Slide 级内容排列（单页排版）
- **Design vs Theme**：Design = 完整视觉皮肤（颜色 + 纹理 + 密度 + 动画）。Theme = 单一 CSS 变量文件（仅颜色字体）
- **Style vs Design**：Design = 变量定义（"accent 是什么颜色"）。Style = 计算结果（屏幕上的实际像素）

## Pipeline

用户提供原始文档后，系统按四步流水线处理：

```
原始文档 → Step 1: 内容分析 → Step 2: 风格决策 → Step 3: HTML 渲染 → Step 4: 导出
```

### Step 1: 内容分析

解析原始文档，生成演示结构：
- **Cover 页**：提取标题、副标题、作者等元信息
- **章节划分**：识别文档逻辑段落，拆分为 section（section-divider）
- **内容框架**：每个 section 内的 slide 分配，确定每页的内容类型（文字、图表、代码、架构图、信息图、AI 插图等）
- **页数推算**：基于文档长度的启发式（<1000 字 → 5-10 页, 1000-3000 → 10-18 页, >3000 → 18-30 页）
- **信号检测**：根据内容关键词自动匹配推荐的 design
- **Ghost Deck Test**：只读标题序列应能讲述完整论点
- 输出：结构化的 slides 大纲（cover → sections → slides → content slots）

### Step 2: 风格决策

两级决策（36 主题系统 + 4 维风格 + 信息图视觉风格）：
- **Slides 级**：选择 design（17 个 design 或自定义），确定 theme（36 个 HTML theme）+ layout 偏好 + animation + 密度，支持 4 维自定义（Texture × Mood × Typography × Density）
- **Slide 级**：根据每页内容类型匹配
  - HTML layout（31 种 single-page 布局）用于文字、代码、图表等
  - Infographic layout（21 种信息图布局）+ visual style（22 种视觉风格）用于信息图页
  - Diagram type（9 种 SVG 图类型）用于架构图页
  - AI 图片风格用于需要 AI 生成插图的页面

### Step 3: HTML 渲染

将 Template + Design + 内容组装为完整的 HTML slides：
- 基于 CSS Variables 的 theme 系统（`--bg`, `--text-1`, `--accent`, `--font-sans` 等）
- `.is-active` 类切换 slide，URL `#/N` 深链接，键盘导航
- 27 种 CSS animation + 20 种 Canvas FX，通过 `data-anim` / `data-fx` 声明
- Presenter 模式：`BroadcastChannel` 双向同步，拖拽笔记卡片
- **混合渲染**：单个 deck 内可混合多种内容来源
  - HTML 排版（文字、代码、图表）→ 直接使用 layout 模板
  - SVG 架构图 → `<svg>` 内联或 `<img>` 引用
  - AI 生成插图（10 个 Provider）→ `<img>` 引用
  - AI 信息图（21 layout × 22 style）→ `<img>` 引用
- 产出：可在浏览器中直接交互演示的 HTML 文件

### Step 4: 导出

从 HTML 导出为目标格式：
- **PNG**：Playwright 高精度逐页截图（`document.fonts.ready` + `getAnimations().finished`，@2x Retina）
- **PPTX**：dom-to-pptx 直接导出可编辑 PPTX（`html-to-pptx.ts`），原生文本/形状，非截图
- **PDF**：Playwright 截图 → merge-to-pdf（pdf-lib 自包含）

## Extension Points (EXTEND.md)

系统通过 `EXTEND.md` 提供用户级扩展，不修改核心代码即可自定义行为。EXTEND.md 按 pipeline 阶段组织，每个阶段都有明确的扩展点：

### Step 1 扩展：内容分析

- **自定义 template**：覆盖默认的 `cover → toc → sections → cta → thanks` 骨架，定义自己的页面序列模式
- **章节拆分规则**：自定义文档如何拆分为章节的启发式规则（如按 H2 拆分、按主题拆分等）
- **页数策略**：覆盖默认的文档长度 → 页数映射

### Step 2 扩展：风格

- **自定义 theme**：定义新的 CSS Variables 集合（`--bg`, `--text-1`, `--accent` 等），放入 `assets/themes/`
- **自定义 layout**：新增或覆盖单页布局 HTML 模板（如 `my-two-column.html`），放入 `templates/single-page/`
- **默认 preset**：设定默认的 preset、字体、配色方案、animation 等，避免每次重复指定
- **品牌配置**：公司 logo、品牌色、固定页脚等跨 deck 复用的视觉元素

### Step 3 扩展：渲染

- **自定义 component**：可复用的 HTML 片段（如 callout box、timeline、metric card），在 layout 中通过约定方式引用
- **自定义 animation**：新增 CSS 动画，通过 `data-anim="my-animation"` 使用
- **AI 图片 Provider**：配置默认的图片生成 Provider 及 API 参数

### Step 4 扩展：导出

- **导出预设**：PNG 分辨率/DPI、PPTX 导出路径选择（拼合/原生/混合）、PDF 页面尺寸等默认配置

### EXTEND.md 格式

```markdown
# EXTEND.md

## defaults
- preset: technical
- theme: my-dark-theme
- font-sans: "Inter"
- font-mono: "JetBrains Mono"
- animation: fade
- export: png @2x

## brand
- logo: assets/logo.svg
- primary-color: "#1a73e8"
- footer: "© 2026 My Company"

## deck-structure
- sequence: cover, toc, [sections], summary, qna

## custom-themes
- my-dark-theme: assets/themes/my-dark-theme.css

## custom-layouts
- my-two-column: templates/single-page/my-two-column.html

## custom-components
- callout: assets/components/callout.html
- metric-card: assets/components/metric-card.html

## ai-image
- provider: dashscope
- quality: 2k
```

## Technology Stack

- **Runtime**: Bun（`bun scripts/...` 执行 TypeScript）
- **截图/渲染**: Playwright `scripts/render-precise.ts`
  - `document.fonts.ready` 精确字体等待
  - `getAnimations().finished` 动画完成检测（自动跳过 infinite 动画）
  - `deviceScaleFactor: 2` @2x Retina 输出
  - 元素级截图（`.slide` 元素，不含 body 背景）
  - 自动检测页面类型（deck 多页 vs single 单页）和画布尺寸
- **PPTX 生成**: HTML → `html-to-pptx.ts`（dom-to-pptx 原生形状/文本）
- **PDF 生成**: PNG 截图 → `merge-to-pdf.ts`（pdf-lib）
- **SVG 转 PNG**: `svg-to-png.ts`（sharp）
- **AI 图片生成**: `scripts/imagine/`（10 个 Provider，含 OpenAI / Google / DashScope 等）
- **SVG 架构图**: `references/diagram/`（4 种类型：architecture / flowchart / sequence / structural）
- **信息图**: `references/infographic/`（21 布局 × 22 视觉风格）
- **风格系统**: CSS Variables（36 个 theme），通过 `:root` 覆盖切换
- **组件系统**: `assets/components.css`（cqi 单位 + CSS vars），3:4 自适应。卡片、步骤、KPI、引用、图标行等组件自由组合，`c-row` / `c-grid` 在窄画布自动纵排

## Scripts 使用方式

```bash
# 截图：HTML → PNG（@2x）
bun scripts/render-precise.ts <html-file> --slides auto --output <dir>

# HTML → 可编辑 PPTX
bun scripts/html-to-pptx.ts <html-file> [--output filename.pptx]

# PNG → PDF
bun scripts/merge-to-pdf.ts <png-dir> [--output filename.pdf]

# SVG → PNG
bun scripts/svg-to-png.ts <svg-file>

# 新建 deck 脚手架
bash scripts/new-deck.sh <name>
```

## 画布尺寸

| 模板类型 | 画布 | 截图输出（@2x） |
|---------|------|----------------|
| 标准 16:9 deck | 1920×1080 | 3840×2160 |
| xhs-post 3:4 | 810×1080 | 1620×2160 |
| 自定义单页 | CSS 指定 | 自动检测 |

`render-precise.ts` 自动处理所有尺寸，无需手动配置。

## 画布适配：16:9 与 3:4

项目支持两种画布比例，在 pipeline 开始时确定。

### 16:9（默认）

标准 landscape 画布，`.slide` 默认 `padding: 72px 96px; justify-content: center`。

### 3:4 portrait（手机端）

通过 `<body class="portrait">` 一键切换。`.portrait` 类定义在 `base.css`：

```css
.portrait .deck {
  width: min(100vw, calc(100vh * 3 / 4));
  height: min(100vh, calc(100vw * 4 / 3));
  margin: auto; overflow: hidden;
  container-type: inline-size;
}
```

Container Query 自动启用，`cqi` 单位等比缩放。所有 3:4 模板（xhs-*、component-showcase）均使用 `.portrait`，不再各自复制 canvas CSS。

内容策略：3:4 使用 `assets/components.css` 的 `c-*` 组件自由拼装，而非 16:9 的 single-page layout。详见 `references/components.md`。

### 窄视口兜底

`base.css` 两层自动兜底（无需手动加 class）：
1. **`@container (max-width: 1000px)`** — 容器查询，`cqi` 字号/间距缩放 + `grid` 降级（主要路径）
2. **`@media (max-width: 900px)`** — 视口查询，`px` 字号缩小 + `grid` 降级（旧浏览器兜底）

`.narrow` class 保留用于 JS 手动触发场景（如 runtime.js 在窄视口激活）。

## Key Design Principles

- Pipeline 流程严格遵循：原始文档 → outline.md → HTML → 渲染导出，不可跳步
- AI 图片使用 prompt 文件机制保证可复现性
- SVG 架构图严格 z-order 分层：背景 → 区域边界 → 连接箭头 → 遮罩矩形 → 组件框 → 文本 → 图例 → 标题
- **Design CSS 架构**：`Slides = Template × Design × Content`。Template 决定页面上有什么（chrome HTML + c-* 组件），Design 决定长什么样（CSS 变量 + chrome 样式 + c-* 扩展），Content 用 c-* 通用组件填充。Design CSS 可在不同 Template 间移植
- Chrome 元素（`chr-*`）：页面壳层 HTML 片段（topbar, footer, blobs, stickers 等），由 Design CSS 赋予视觉样式。与 c-* 内容组件正交

## 来源项目

| 来源 | 贡献内容 | 仓库 |
|------|---------|------|
| html-ppt-skill | 36 themes、31 layouts、15 deck 模板、27+20 动画、base.css、runtime.js | `github.com/lewislulu/html-ppt-skill` |
| baoyu-skills | 17 presets、21 信息图布局、22 视觉风格、10 AI 图片 Provider | `github.com/JimLiu/baoyu-skills` |
| academic-pptx-skill | 学术演示规范（Action Titles、Ghost Deck Test、一页一观点） | — |
