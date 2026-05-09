# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

slides-on 是一个 Claude Code skill，提供统一的演示文稿制作能力。用户提供原始文档，自动生成可交互 HTML 演示 + 导出 PNG/PPTX/PDF。

## Skill Structure

项目遵循 Claude Code skill 标准结构，安装后位于 `~/.claude/skills/slides-on/`：

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
│   ├── themes.md                   #   theme 目录（← html-ppt references/themes.md）
│   ├── layouts.md                  #   layout 目录（← html-ppt references/layouts.md）
│   ├── animations.md               #   animation 目录（← html-ppt references/animations.md）
│   ├── full-decks.md               #   full-deck template 目录（← html-ppt references/full-decks.md）
│   ├── presenter-mode.md           #   presenter 模式指南（← html-ppt references/presenter-mode.md）
│   ├── authoring-guide.md          #   HTML 编写指南（← html-ppt references/authoring-guide.md）
│   │
│   ├── designs/                    #   design 定义（← baoyu-slide-deck styles/）
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
│   ├── dimensions/                 #   4 维自定义（← baoyu-slide-deck dimensions/）
│   │   ├── density.md
│   │   ├── mood.md
│   │   ├── texture.md
│   │   ├── typography.md
│   │   └── designs.md              #     design → dimension 映射表
│   │
│   ├── infographic/                #   信息图（← baoyu-infographic）
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
│   ├── diagram/                    #   SVG 架构图（← baoyu-diagram）
│   │   ├── architecture.md         #     4 个详细图类型参考
│   │   ├── flowchart.md
│   │   ├── sequence.md
│   │   └── structural.md
│   │
│   ├── imagine/                    #   AI 图片生成（← baoyu-imagine）
│   │   └── providers/              #     Provider 参考文档
│   │       ├── dashscope.md
│   │       ├── minimax.md
│   │       ├── openrouter.md
│   │       ├── replicate.md
│   │       └── zai.md
│   │
│   ├── analysis-framework.md      #   内容分析框架（← baoyu-slide-deck）
│   ├── base-prompt.md              #   AI 图片基础 prompt（← baoyu-slide-deck）
│   ├── content-rules.md            #   内容规范（← baoyu-slide-deck）
│   ├── design-guidelines.md        #   设计指南（← baoyu-slide-deck）
│   └── export.md                   #   导出选项
│
├── templates/                      # HTML 模板
│   ├── full-decks/                 #   15 个 deck template（← html-ppt）
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
│   ├── single-page/               #   31 个 slide layout（← html-ppt）
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
│   ├── deck.html                   #   新建 slides 起始骨架（← html-ppt）
│   └── showcases/                  #   展示页（← html-ppt）
│       ├── theme-showcase.html
│       ├── layout-showcase.html
│       ├── animation-showcase.html
│       └── full-decks-index.html
│
├── assets/                         # 静态资源
│   ├── base.css                    #   设计系统（← html-ppt, 150 行 30+ CSS vars）
│   ├── fonts.css                   #   Google Fonts 引入（← html-ppt）
│   ├── runtime.js                  #   交互引擎 960 行（← html-ppt）
│   ├── themes/                     #   36 个 theme CSS（← html-ppt）
│   │   ├── academic-paper.css
│   │   ├── arctic-cool.css
│   │   ├── aurora.css
│   │   ├── ... (36 files total)
│   │   └── y2k-chrome.css
│   └── animations/                 #   动画系统（← html-ppt）
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
│   ├── svg-to-png.ts              #   SVG → @2x PNG（← baoyu-diagram）
│   ├── new-deck.sh                 #   新建 deck 脚手架（← html-ppt）
│   └── imagine/                    #   AI 图片生成（← baoyu-imagine）
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
| **Slide** | Slides 中的一页，html-ppt: `.slide` 元素 | 页面 |
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

解析原始文档，生成演示结构（融合 baoyu-slide-deck 分析框架 + academic-pptx 结构规范）：
- **Cover 页**：提取标题、副标题、作者等元信息
- **章节划分**：识别文档逻辑段落，拆分为 section（section-divider）
- **内容框架**：每个 section 内的 slide 分配，确定每页的内容类型（文字、图表、代码、架构图、信息图、AI 插图等）
- **页数推算**：基于文档长度的启发式（← baoyu-slide-deck: <1000 字 → 5-10 页, 1000-3000 → 10-18 页, ...）
- **信号检测**：根据内容关键词自动匹配推荐的 design（← baoyu-slide-deck 信号检测机制）
- **Ghost Deck Test**：只读标题序列应能讲述完整论点（← academic-pptx QA 检查）
- 输出：结构化的 slides 大纲（cover → sections → slides → content slots）

### Step 2: 风格决策

两级决策（融合 html-ppt 主题系统 + baoyu-slide-deck 4 维风格 + baoyu-infographic 视觉风格）：
- **Slides 级**：选择 design（17 个 design 或自定义），确定 theme（36 个 HTML theme）+ layout 偏好 + animation + 密度，支持 4 维自定义（Texture × Mood × Typography × Density）
- **Slide 级**：根据每页内容类型匹配
  - HTML layout（31 种 single-page 布局）用于文字、代码、图表等
  - Infographic layout（21 种信息图布局）+ visual style（22 种视觉风格）用于信息图页
  - Diagram type（9 种 SVG 图类型）用于架构图页
  - AI 图片风格用于需要 AI 生成插图的页面

### Step 3: HTML 渲染

将 Template + Design + 内容组装为完整的 HTML slides（以 html-ppt 引擎为核心）：
- 基于 CSS Variables 的 theme 系统（`--bg`, `--text-1`, `--accent`, `--font-sans` 等）
- `.is-active` 类切换 slide，URL `#/N` 深链接，键盘导航
- 27 种 CSS animation + 20 种 Canvas FX，通过 `data-anim` / `data-fx` 声明
- Presenter 模式：`BroadcastChannel` 双向同步，拖拽笔记卡片
- **混合渲染**：单个 deck 内可混合多种内容来源
  - HTML 排版（文字、代码、图表）→ 直接使用 layout 模板
  - SVG 架构图（← baoyu-diagram）→ `<svg>` 内联或 `<img>` 引用
  - AI 生成插图（← baoyu-imagine, 10 个 Provider）→ `<img>` 引用
  - AI 信息图（← baoyu-infographic, 21 layout × 22 style）→ `<img>` 引用
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

- **Runtime**: Node.js（npx tsx 执行 TypeScript）
- **截图/渲染**: Playwright `scripts/render-precise.ts`
  - `document.fonts.ready` 精确字体等待
  - `getAnimations().finished` 动画完成检测（自动跳过 infinite 动画）
  - `deviceScaleFactor: 2` @2x Retina 输出
  - 元素级截图（`.slide` 元素，不含 body 背景）
  - 自动检测页面类型（deck 多页 vs single 单页）和画布尺寸
- **PPTX 生成**: HTML → `html-to-pptx.ts`（dom-to-pptx 原生形状/文本）
- **PDF 生成**: PNG 截图 → `merge-to-pdf.ts`（pdf-lib 拼合）
- **SVG 转 PNG**: `svg-to-png.ts`（sharp 库）
- **风格系统**: CSS Variables（36 个 theme），通过 `:root` 覆盖切换

## Scripts 使用方式

```bash
# 截图：HTML → PNG（@2x）
npx tsx scripts/render-precise.ts <html-file> [all|N] [--output dir] [--scale 2]

# 示例
npx tsx scripts/render-precise.ts examples/tmux-cheatsheet/index.html all
npx tsx scripts/render-precise.ts examples/tmux-cheatsheet/shortcuts.html

# HTML → 可编辑 PPTX
npx tsx scripts/html-to-pptx.ts <html-file> [--output filename.pptx]

# PNG → PDF
npx tsx scripts/merge-to-pdf.ts <png-dir> [--output filename.pdf]

# SVG → PNG
npx tsx scripts/svg-to-png.ts <svg-file>

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

## 窄画布适配

`base.css` 包含两种窄画布适配机制：

1. **`@media (max-width: 900px)`** — 自动检测视口宽度，触发 grid 降级（g4/g3→2列, g5/g6→3列）、字号缩小（h1 72→48px, h2 54→38px, h3 32→26px）、padding 收紧（72px→48px）
2. **`.narrow` class** — 手动触发相同规则，用于非视口场景

xhs-post (`.tpl-xhs-post`) 使用 CSS Container Queries (`cqi` 单位) 实现 3:4 比例响应式缩放，deck 通过 `min(100vw, 100vh * 3/4)` 填充视口并保持比例。导出时 `render-precise.ts --canvas 3:4` 渲染为 810×1080。

## Key Design Principles

- Pipeline 流程严格遵循：原始文档 → outline.md → HTML → 渲染导出，不可跳步
- AI 图片使用 prompt 文件机制保证可复现性
- SVG 架构图严格 z-order 分层：背景 → 区域边界 → 连接箭头 → 遮罩矩形 → 组件框 → 文本 → 图例 → 标题

## 来源项目

| 来源 | 贡献内容 | 仓库 |
|------|---------|------|
| html-ppt-skill | 36 themes、31 layouts、15 deck 模板、27+20 动画、base.css、runtime.js | `github.com/lewislulu/html-ppt-skill` |
| baoyu-skills | 17 presets、21 信息图布局、22 视觉风格、10 AI 图片 Provider | `github.com/JimLiu/baoyu-skills` |
| academic-pptx-skill | 学术演示规范（Action Titles、Ghost Deck Test、一页一观点） | — |
