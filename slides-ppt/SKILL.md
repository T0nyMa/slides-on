---
name: slides-ppt
description: >
  Build 16:9 landscape presentation slides (演示文稿, PPT, slides, 汇报, 周报,
  提案, 路演, 技术分享, keynote, pitch deck). Use when the user asks to create
  presentations meant for a speaker on stage. Pipeline: content analysis →
  style decision → direct HTML authoring → self-check → export (PNG/PPTX/PDF).
---

# slides-ppt — 16:9 演示文稿

流水线：**内容分析 → 风格决策 → 直接编写 HTML → 自检 → 导出**

PPT 是演讲辅助媒介——有演讲者、标题即论点、正文精简、页面之间有逻辑链。
Claude 直接编写完整的单文件 HTML，不依赖任何中间 JSON 格式。

## 核心约束

1. canvas 固定 `16:9`（landscape），body class `.landscape`
2. Claude 直接编写完整 HTML，所有 CSS/JS 内联（无外部依赖）
3. 使用 single-page layout 结构 + c-* 组件 class 混合渲染
4. 标题 ≤ 10 字，单行不换行；正文 ≥ 18px（投影仪可读）
5. Ghost Deck Test：仅读标题序列即可串成完整论点链

## Pipeline

### Step 1: 内容分析

解析文档 → 章节划分 → 页数推算 → 信号检测（匹配 design）。

**页数**：< 1000 字 5-10 页，1000-3000 字 10-18 页，> 3000 字 18-30 页。

**产出**：`outline.md`，每页含 Action Title（完整论点句）+ 推荐 layout + 内容要点。

> **读 `./layouts.md`**（31 种布局参考）：
> 根据内容类型匹配 layout（cover/bullets/chart/code/process-steps 等），
> 确定每页用什么布局骨架。如需 c-* 组件，读 `../../references/component-recipes.md`。

**Ghost Deck Test**：仅读 outline 中的每页标题，应能串成完整论证链：
`封面 → 问题 → 方案 → 结果 → 结论 → 下一步`。不通过则调整标题。

### Step 2: 风格决策

**四维自由组合**：
- **typography**：`geometric` | `editorial` | `humanist` | `handwritten` | `technical`
- **texture**：`clean` | `paper` | `grid` | `organic` | `pixel`
- **density**：`minimal` | `balanced` | `dense`
- **theme**：36 个颜色主题（`../../assets/themes/`）

常用预设：`white-editorial`（白底杂志）、`hermes-cyber-terminal`（终端）、自由组合。

**混合渲染策略**：在单个 deck 中，不同类型内容使用不同渲染引擎：

| 内容类型 | 渲染方式 |
|---------|---------|
| 文字排版/数据图表/代码 | HTML（single-page layout + c-* 组件） |
| 架构图/流程图/时序图 | `../../slides-diagram/SKILL.md` → SVG 内联 |
| AI 插图/封面图/信息图 | `../../slides-imagine/SKILL.md` → PNG 引用或内联为 `<img>` |

**产出**：`style-decision.md`。

### Step 3: 编写 HTML

Claude 根据 outline.md + style-decision.md + layouts.md 直接编写
完整单文件 HTML。**所有 CSS/JS 资产内联到单一 HTML 文件中。**

**步骤**：
1. 用 Read 工具读取以下资产的**完整内容**，直接写入 HTML 中（⛔ 禁止使用 `<link>` 标签引用外部文件）：
   `assets/fonts.css`、`assets/base.css`、`assets/components.css`（如需 c-*）、
   `assets/themes/{name}.css`、`assets/animations/animations.css`（如需）、`assets/runtime.js`
2. 如果使用 slides-diagram，生成 SVG 并内联到 HTML 中（推荐，保持矢量质量）
3. 如果使用 slides-imagine，先运行生图，将 PNG 路径引用到 HTML 的 `<img>` 标签中
4. 将 CSS 内容直接写入 `<style>` 标签中，JS 写入 `<script>` 标签中（不是引用外部文件）
5. 每页一个 `<section class="slide">`，用 single-page layout 结构或 c-* 组件编写内容
6. 产出 `index.html`

> **简单请求（≤5 页）**：outline 和 style-decision 可在脑中规划，直接写 HTML。
> **复杂请求（>5 页）**：建议先写 `outline.md` 和 `style-decision.md` 到磁盘，再据此写 HTML。

**模板骨架**：
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{标题}</title>
<style>
  /* fonts.css 内联 */
  /* base.css 内联 */
  /* components.css 内联（如需 c-* 组件） */
  /* themes/{name}.css 内联 */
  /* animations/animations.css 内联（如需） */
</style>
</head>
<body class="landscape">
<div class="deck">
  <section class="slide is-active" data-anim="fade-up">
    <!-- single-page layout 结构或 c-* 组件 -->
  </section>
  <!-- more slides -->
</div>
<script>
  /* runtime.js 内联 */
</script>
</body>
</html>
```

**关键规则**：
- 标题 ≤ 10 字，单行不换行
- 正文 ≥ 18px（投影仪可读）
- 每页一个观点，两个不相关的概念拆成两页
- 图表/架构图/SVG 直接内联到 HTML 中
- AI 图片先生成后引用 PNG 路径

### Step 4: 自检

对照 `../../references/self-check-checklist.md` 逐项自检。
不通过则回到 Step 3 修改 HTML。

### Step 5: 导出

```bash
# PNG 截图（@2x Retina）
bun ../../scripts/render-precise.ts index.html --canvas 16:9 --selector .slide

# PPTX 可编辑
bun ../../scripts/html-to-pptx.ts index.html --output deck.pptx

# PDF 拼合
bun ../../scripts/merge-to-pdf.ts png-out/ --output deck.pdf
```

## 快速参考：Layout → 用途

| 类别 | Layout（参照 `templates/single-page/` 目录） |
|------|------|
| 开篇 | cover, toc, section-divider |
| 文字 | bullets, big-quote, three-column, two-column |
| 数据 | chart-bar, chart-line, chart-pie, kpi-grid, stat-highlight |
| 代码 | code, terminal, diff |
| 对比 | comparison, pros-cons, table |
| 流程 | process-steps, roadmap, timeline, gantt, flow-diagram |
| 图形 | arch-diagram, mindmap, image-grid, image-hero |
| 结尾 | cta, thanks, todo-checklist |

## 交互快捷键

生成的 HTML 支持：←→ 翻页、F 全屏、O 概览、S 演示者模式。

## 核心参考

- `content-rules.md` — 16:9 内容规范
- `layouts.md` — 31 种布局参考
- `themes.md` — 36 主题
- `pipeline.md` — 流水线详解
- `analysis-framework.md` — 内容分析框架
- `html-engine.md` — HTML 引擎详解
- `animations.md` — 27 CSS 动画 + 20 Canvas FX
- `export.md` — PNG/PPTX/PDF 导出指南
- `authoring-guide.md` — 手写 HTML 编写指南
- `presenter-mode.md` — 演示者模式指南
- `../../references/component-recipes.md` — 页面原型 + 组件配方
- `../../references/self-check-checklist.md` — 自检清单（生成后必查）
- `../../references/glossary.md` — 术语表
- `../../references/ai-visuals.md` — AI 图片生成 → 用 slides-imagine
- `../slides-diagram/` — SVG 架构图 → 用 slides-diagram
