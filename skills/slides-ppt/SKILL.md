---
name: slides-ppt
description: >
  Build 16:9 landscape presentations, PPT slides, 演示文稿, slide decks,
  keynotes from any document. Use whenever the user asks to create PPT, 做PPT,
  做演示文稿, 做slides, 汇报, 周报, 提案, 路演, 技术分享, weekly report,
  pitch deck, make a deck, or any presentation task. Pipeline: content
  analysis → style decision → L0 validation → HTML assembly → L1 QA gate
  (18 groups) → repair → visual polish → export (PNG/PPTX/PDF).
  QA at every gate: BLOCKER (must fix) / WARN (should review).
---

# slides-ppt — 16:9 演示文稿

流水线：**内容分析 → 风格决策 → L0 验证 → HTML 渲染 → L1 QA 门禁 → 修复循环 → 可视化微调 → 导出**

可视化编辑器：生成的 HTML 自带编辑器，**浏览器直接打开**，按 **E** 所见即所得地编辑。

## 核心约束

1. canvas 固定 `16:9`（landscape），body class `landscape`
2. 使用 single-page layout + c-* 组件混合渲染
3. 所有视觉样式收归 Design CSS，页面 HTML 只负责结构和内容
4. QA 门禁：L0 渲染前（validate-slides），L1 渲染后（visual-qa 18 项），BLOCKER > 0 阻塞

## Pipeline

### Step 1: 内容分析

解析文档 → 章节划分 → 页数推算 → 信号检测（匹配 design）→ Ghost Deck Test（标题序列验证）。

**页数**：< 1000 字 5-10 页，1000-3000 字 10-18 页，> 3000 字 18-30 页。

**产出**：`outline.md`，每页含组件规划表。

### Step 2: 风格决策

**Slides 级** — 4 维自由组合：

- **typography**：`geometric` | `editorial` | `humanist` | `handwritten` | `technical`
- **texture**：`clean` | `paper` | `grid` | `organic` | `pixel`
- **density**：`minimal` | `balanced` | `dense`
- **theme**：36 个颜色主题（`../../assets/themes/`）

常用预设：`white-editorial`（白底杂志）、`hermes-cyber-terminal`（终端）、自由组合。

**Slide 级** — 选择渲染引擎：

| 内容类型 | 引擎 | 产出 |
|---------|------|------|
| 文字排版 | HTML layout（31 种）| HTML |
| 数据图表 | HTML layout（chart-*）| HTML |
| 代码展示 | HTML layout（code, terminal）| HTML |
| 架构图/流程图 | slides-diagram | SVG |
| AI 插图/信息图 | slides-imagine | PNG |

**产出**：`style-decision.md`。

### Step 3: L0 验证

```bash
bun ../../scripts/validate-slides.ts --input slides.json
```

检查 Schema、密度预算（2-6 组件）、字数上限（卡片 ≤ 40 字）。BLOCKER > 0 阻塞。

### Step 4: HTML 渲染

整理 `slides.json`，然后：

```bash
bun ../../scripts/assemble-deck.ts --input slides.json --output index.html
```

Slide 类型：`cover` | `section` | `cards-2x2` | `cards-3` | `quote` | `steps` | `code` | `thanks` | `bullets` | `kpi` | `table` | `html` | `layout`

**图片支持**：SlideData 原生 `image` 字段（hero/background/inline）。

**表格**：`tableColumns` + `tableRows`，≥ 10 行自动字号缩放。

渲染后运行 L1 QA：

```bash
bun ../../scripts/qa.ts --check --deck <name>
```

BLOCKER > 0 → Step 5 修复循环。

**`slides.json` 格式**：
```json
{
  "config": { "title": "My Deck", "canvas": "16:9", "design": { "typography": "editorial", "texture": "clean", "density": "balanced", "theme": "minimal-white" } },
  "slides": [
    { "type": "cover", "title": "演示文稿标题", "subtitle": "副标题", "kicker": "标签", "chip": "01" },
    { "type": "cards-2x2", "title": "核心观点", "cards": [{ "num": "01", "title": "卡片", "body": "内容", "color": "peach" }] },
    { "type": "table", "title": "指标对比", "tableColumns": [{ "header": "指标" }, { "header": "Q4", "align": "right" }], "tableRows": [["日活", "2.4M"]] }
  ]
}
```

### Step 5: 修复循环

分类 → 修 slides.json 或 style.css → reassemble → re-QA → 确认 BLOCKER = 0。

### Step 6: 可视化微调

浏览器打开 `index.html`，按 **E** 编辑。⌘S 保存。

### Step 7: 导出

```bash
# PNG 截图（@2x Retina）
bun ../../scripts/render-precise.ts index.html --canvas 16:9 --slides auto --output ./png-out/

# PPTX 可编辑
bun ../../scripts/html-to-pptx.ts index.html --output deck.pptx

# PDF 拼合
bun ../../scripts/merge-to-pdf.ts png-out/ --output deck.pdf
```

## 快速参考：Layout → 用途

| 类别 | Layout |
|------|--------|
| 开篇 | cover, toc, section-divider |
| 文字 | bullets, big-quote, three-column, two-column |
| 数据 | chart-bar, chart-line, chart-pie, kpi-grid, stat-highlight |
| 代码 | code, terminal, diff |
| 对比 | comparison, pros-cons, table |
| 流程 | process-steps, roadmap, timeline, gantt, flow-diagram |
| 图形 | arch-diagram, mindmap, image-grid, image-hero |
| 结尾 | cta, thanks, todo-checklist |

## 交互快捷键

生成的 HTML 支持：←→ 翻页、F 全屏、O 概览、S 演示者模式、E 编辑。

## 核心参考

- `../../references/content-rules.md` — 16:9 内容规范
- `../../references/layouts.md` — 31 种布局参考
- `../../references/themes.md` — 36 主题
- `../../references/designs/` — 18 个 design 概念
- `../../references/dimensions/` — 4 维调整指南
- `../../references/analysis-framework.md` — 内容分析框架
- `../../references/component-recipes.md` — 页面原型 + 组件配方
- `../../references/content-planning.md` — 内容语义 → 组件查表
- `../../references/ai-visuals.md` — AI 图片生成 → 用 slides-imagine
- `../../references/diagram/` — SVG 架构图 → 用 slides-diagram
- `../../references/glossary.md` — 术语表
