---
name: slides-card
description: >
  Build 3:4 portrait knowledge cards and social-media images (小红书图文,
  知识卡片, 独立阅读内容), not presentation slides. Use when the user asks
  for 小红书, 图文, 卡片, social posts, image cards, 知识卡片, or any
  portrait-format standalone visual content. Pipeline: content analysis →
  style decision → direct HTML authoring → self-check → export.
---

# slides-card — 3:4 知识卡片（独立阅读媒介）

流水线：**内容分析 → 风格决策 → 直接编写 HTML → 自检 → 导出**

卡片是独立阅读媒介——没有演讲者、字号更大、文字更完整、页面之间独立不连续。
Claude 直接编写完整的单文件 HTML，不依赖任何中间 JSON 格式。

## 核心约束

1. canvas 固定 `3:4`（portrait），body class `.portrait`
2. Claude 直接编写完整 HTML，所有 CSS/JS 内联（无外部依赖）
3. 使用 c-* 组件 class（c-card、c-steps、c-kpi、c-grid-2 等）+
   Design CSS（`.d-{name}` 命名空间覆盖视觉变量）
4. 3:4 下字号使用 cqi 单位，严禁 px
5. 卡片正文 ≤ 100 字，整页正文 ≤ 200 字，组件数由像素预算决定

## Pipeline

### Step 1: 内容分析

解析文档 → 章节划分 → 页数推算 → 信号检测（匹配 design）。

**页数**：< 500 字 3-5 页，500-1500 字 5-8 页，> 1500 字 8-12 页。

**产出**：`outline.md`，每页含内容要点 + 推荐组件组合。

> **像素预算**（读 `./content-rules-portrait.md` 的「像素预算」章节）：
> 每页在 outline 中标注预估总高和填充率。可用高度：无 chrome 1000px / 有 chrome 920px。
> 加总组件 px 高度 + 间隙(20px/个)，填充率 70-95% 合格。不合格则调整组件或字数。

> **读 `../../references/component-recipes.md`**（内容语义 → 组件配方）：
> 根据每页的内容语义（痛点/数据/流程/对比/概念/金句），查表匹配页面原型和组件组合。
> 它回答"这页该用什么组件"——不是怎么用，那是 components.md 的事。

### Step 2: 风格决策

**品牌路线**（Design CSS）— 完整视觉皮肤（Chrome + 卡片背景 + 阴影 + 装饰 + 组件覆盖）：

**3:4 原生**：`pastel-card` | `white-editorial` | `xhs-post`

**通用**（全部 15 个）：
`blueprint` | `course-module` | `graphify` | `hermes-cyber-terminal` |
`minimal` | `news-broadcast` | `obsidian-gradient` | `pitch-deck` |
`product-launch` | `tech-sharing` | `testing-safety-alert` | `weekly-report`

完整列表见 `assets/designs/`。

**轻装路线**（Theme only）— 四维自由组合，只换颜色不加 Chrome 壳层：
- **typography**：`geometric` | `editorial` | `humanist` | `handwritten` | `technical`
- **texture**：`clean` | `paper` | `grid` | `organic` | `pixel`
- **density**：`minimal` | `balanced` | `dense`
- **theme**：36 个颜色主题（`../../assets/themes/`）

**产出**：`style-decision.md`。

### Step 3: 编写 HTML

Claude 根据 outline.md + style-decision.md + component-recipes.md 直接编写
完整单文件 HTML。**所有 CSS/JS 资产内联到单一 HTML 文件中。**

**步骤**：
1. 用 Read 工具读取以下资产的**完整内容**，直接写入 HTML 中（⛔ 禁止使用 `<link>` 标签引用外部文件）：
   `assets/fonts.css`、`assets/base.css`、`assets/components.css`、
   `assets/designs/{name}.css`（或 `assets/themes/{name}.css`）、`assets/runtime.js`
2. 将 CSS 内容直接写入 `<style>` 标签中，JS 写入 `<script>` 标签中（不是引用外部文件）
3. 每页一个 `<section class="slide">`，用 c-* 组件 class 编写内容
4. 产出 `index.html`

> **简单请求（≤3 页）**：outline 和 style-decision 可在脑中规划，直接写 HTML。
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
  /* components.css 内联 */
  /* designs/{name}.css 内联 */
</style>
</head>
<body class="d-{name} portrait">
<div class="deck">
  <section class="slide is-active">
    <!-- c-* 组件：c-card, c-steps, c-kpi, c-grid-2, c-article 等 -->
  </section>
  <!-- more slides -->
</div>
<script>
  /* runtime.js 内联（翻页导航用） */
</script>
</body>
</html>
```

**关键规则**：
- 3:4 下所有字号用 cqi，严禁 px
- 使用 c-* 组件 class，语义同 components.css 定义
- body class 格式：`.d-{design-name} portrait`
- 每页 `.slide` 应有清晰的视觉重心（c-card-accent / c-kpi / c-quote）
- 底部用 c-badge-row / c-note / c-card-soft 兜底，避免大面积空白

> **写组件前读 `./components.md`**（组件参考手册）：
> 查 c-card、c-steps、c-kpi、c-quote、c-article 等组件的 HTML 结构、
> class 名、参数写法。它回答"每个组件具体怎么写"。

### Step 4: 自检

对照 `../../references/self-check-checklist.md` 逐项自检。
不通过则回到 Step 3 修改 HTML。

> **像素预算验证**：逐页加总组件高度（查 `./content-rules-portrait.md` 速查表），
> 对比可用高度，填充率 < 70% 则加组件或增加正文，> 95% 则精简或拆页。
> Cover / Thanks 页允许低于 70%（center 布局，留白撑气场）。

### Step 5: 导出

```bash
bun ../../scripts/render-precise.ts index.html --canvas 3:4 --selector .slide
```

@2x Retina 输出 1620×2160 PNG。

## 3:4 画布关键差异

`.portrait` 自动完成：deck 约束 3:4 比例、Container Query 缩放、
slide 默认 `padding:4.5cqi;justify-content:flex-start`。

内容策略：`c-stack` 纵排 + `c-grid-2` 两列 + `c-row` 横行（自动纵排）。
`v-half` 限制横向组件最大 55% 高度。`v-fill` 撑满剩余空间。`v-distribute` 均匀分布。

## 核心参考

- `content-rules-portrait.md` — 3:4 内容规范（组件大小、字数、密度）
- `portrait-user-guide.md` — 竖版制作指南
- `components.md` — 组件库参考
- `../../references/component-recipes.md` — 页面原型 + 组件配方 + 内容语义 → 组件查表
- `../../references/self-check-checklist.md` — 自检清单（生成后必查）
- `../../references/ai-visuals.md` — AI 图片生成 → 用 slides-imagine
- `../../references/design-guidelines.md` — 设计指南
- `../../references/glossary.md` — 术语表
