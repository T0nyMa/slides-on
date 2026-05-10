# 3:4 Portrait Canvas — Content Rules

3:4 画布（810×1080px, 1cqi≈8.1px）专属内容规范。在 Step 2 确定目标画布为 3:4 后按需加载。16:9 规范见 `content-rules.md`。

## 核心原则

3:4 画布窄且高。内容纵向堆叠，每页像一个"移动端卡片流"——从上到下、逐块阅读。

与 16:9 的关键差异：
- **不能多列并排**：`c-row` 在 3:4 下自动纵排，同一行最多 2 个小组件
- **组件即页**：每页 3-5 个纵向组件块，超过拆页
- **字更少、更大**：手机屏幕阅读距离更近，但画布更窄，标题和正文都需要更大字号占比

## Design CSS 体系

3:4 画布的推荐架构是 `Slides = Template × Design × Content`：

```
Template    = .portrait + chrome HTML（chr-* 页面壳） + c-* 组件实例
Design      = assets/designs/{name}.css（CSS 变量 + chrome 样式 + c-* 扩展）
Content     = c-* 组件（assets/components.css），通过 var(--accent) 等自动染上 Design 色
```

**加载顺序**（不可颠倒）：
```html
<link rel="stylesheet" href="assets/fonts.css">
<link rel="stylesheet" href="assets/base.css">
<link rel="stylesheet" href="assets/components.css">
<link rel="stylesheet" href="assets/designs/pastel-card.css">
<body class="d-pastel-card portrait">
```

**Template 提供 Chrome HTML + c-* 组件实例，Design CSS 决定它们长什么样。** 同一个 Chrome 结构（`chr-topbar` + `chr-blob`）在不同 Design CSS 下可以呈现完全不同的视觉效果。

**已有 Design CSS**：`pastel-card`（马卡龙色块）、`white-editorial`（白底杂志）、`xhs-post`（手绘涂鸦）。完整实现见 `templates/full-decks/xhs-*/`。

## 一页一观点（同 16:9，但更严格）

每个 slide 传达一个观点。3:4 下信息密度须更低——窄画布没有横向空间分散注意力，每块内容必然被顺序阅读。

**测试**：能用一句话概括这页吗？需要"还有..."就拆页。

## 组件大小体系

组件视觉权重 = 占屏比例。占屏越大，cqi 越大，字数越少。

### 全宽组件（占屏 ≥ 80% 宽度）

| 角色 | 组件 / 类名 | cqi 范围 | 实际 px | 字数上限 |
|------|------------|---------|---------|---------|
| 封面标题 | `h1` / `.h1` | 7-8.5cqi | 57-69 | ≤ 15 字 |
| 封面副标题 | `.lede` | 2-2.5cqi | 16-20 | ≤ 30 字 |
| 分隔页标题 | `.h1` | 6-7cqi | 49-57 | ≤ 8 字 |
| 大引用 | `.c-quote` | 3-3.5cqi | 24-28 | ≤ 40 字 |

### 标题级（占屏 60-80% 宽度）

| 角色 | 组件 / 类名 | cqi 范围 | 实际 px | 字数上限 |
|------|------------|---------|---------|---------|
| Slide 标题 | `h2` / `.h2` | 5-6cqi | 40-48 | ≤ 10 字 |
| 组件标题 | `.c-title` | 2.5-3.5cqi | 20-28 | ≤ 15 字 |
| 步骤标题 | `.c-step-title` | 2.5-3cqi | 20-24 | ≤ 15 字 |
| 图标行标题 | `.c-icon-row-title` | 2-2.5cqi | 16-20 | ≤ 12 字 |

### 正文级（占屏 40-60% 宽度）

| 角色 | 组件 / 类名 | cqi 范围 | 实际 px | 字数上限 |
|------|------------|---------|---------|---------|
| 卡片正文 | `.c-body` | 1.5-2cqi | 12-16 | ≤ 60 字 |
| 步骤正文 | `.c-step-body` | 1.5-2cqi | 12-16 | ≤ 50 字 |
| 图标行正文 | `.c-icon-row-body` | 1.5-1.8cqi | 12-15 | ≤ 40 字 |
| 警告/提示正文 | `.c-warn-body` / `.c-note-body` | 1.5-1.8cqi | 12-15 | ≤ 50 字 |

### 小组件（占屏 20-40% 宽度）

| 角色 | 组件 / 类名 | cqi 范围 | 实际 px | 字数上限 |
|------|------------|---------|---------|---------|
| KPI 数值 | `.c-kpi-value` | 6-8cqi | 49-65 | ≤ 6 字 |
| KPI 标签 | `.c-kpi-label` | 1.5-2cqi | 12-16 | ≤ 8 字 |
| Badge | `.c-badge` | 1.3-1.6cqi | 10-13 | ≤ 6 字 |
| 公式框 | `.c-formula` | 2.5-3cqi | 20-24 | ≤ 30 字 |

### 微组件（行内）

| 角色 | 组件 / 类名 | cqi 范围 | 实际 px | 字数上限 |
|------|------------|---------|---------|---------|
| 脚注 / 辅助 | `.c-small` | 1.2-1.6cqi | 10-13 | ≤ 30 字 |
| 引用出处 | `.c-quote-attr` | 1.5-1.8cqi | 12-15 | ≤ 20 字 |
| Connector 文字 | `.c-connector-text` | 1.3-1.6cqi | 10-13 | ≤ 10 字 |

## 页面密度约束

### 组件数量

| 组件类型 | 每页上限 | 说明 |
|---------|---------|------|
| 标题（h2 / c-title） | 1 个 | 每页一个主标题 |
| 卡片（c-card 系列） | 3-4 个 | 单列排列时 3 个，2 列网格时 4 个 |
| 步骤（c-step） | 5 个 | 超过 5 步分两页 |
| 图标行（c-icon-row） | 5 个 | 超过 5 个分两页 |
| KPI（c-kpi） | 3 个 | `c-row` 横排 3 个或纵排 3 个 |
| 特殊框（c-warn / c-note / c-example） | 2 个 | 框本身占空间大 |
| 总组件块数 | 3-5 块 | 标题算 1 块，每个卡片/步骤/框各算 1 块 |

### 字数预算

| 内容元素 | 字数上限 | 为什么 |
|---------|---------|--------|
| 页面标题 | ≤ 10 字 | h2 @ 5-6cqi，1 行不换行 |
| 卡片标题 | ≤ 15 字 | c-title @ 2.5-3.5cqi |
| 卡片正文 | ≤ 60 字 | c-body @ 1.5-2cqi，约 3-4 行 |
| 步骤标题 + 正文 | ≤ 50 字 | 标题 + 描述合计 |
| 整页正文 | ≤ 120 字 | 等同于 3-4 个卡片的正文总和 |

## 纵向填充策略

3:4 画布高 1080px。内容不是"居中放中间"，而是"从上到下填满"。三种策略：

### 策略 1：flex:1 分布（默认，适用 80% 的页面）

标题顶置 + 内容区 `flex:1`（自动撑开）+ 底部补充。

```html
<section class="slide">
  <h2 class="h2">标题顶置</h2>
  <div class="c-stack" style="flex:1">
    <!-- 内容自然撑满中部空间 -->
  </div>
  <div class="c-small">底部脚注</div>
</section>
```

`c-stack` 设置 `flex:1` 后，组件间距自动拉开，填满标题到脚注之间的全部垂直空间。适合步骤、列表、多卡片页。

### 策略 2：center 居中

标题 + 内容居中，上下留白对称。

```html
<section class="slide center">
  <div>
    <p class="kicker">Label</p>
    <h1 class="h1">Title</h1>
    <p class="lede">Subtitle</p>
  </div>
</section>
```

适合封面、引用、单 KPI 页。内容少时用留白撑气场。

### 策略 3：space-between 分区

标题顶置 + 核心内容居中 + 底部补充顶底撑开。

```html
<section class="slide" style="justify-content:space-between">
  <h2 class="h2">Section Title</h2>
  <div class="c-formula">核心概念</div>
  <div class="c-divider-accent"></div>
</section>
```

适合分隔页、强调页——头/身/尾三区视觉权重均衡。

## 组件选择速查表

根据内容类型和期望的视觉权重选择组件：

| 我想展示... | 占屏大 | 占屏中 | 占屏小 |
|------------|--------|--------|--------|
| 一个核心观点 | `h1` + `lede` | `h2` + `c-card-accent` | `c-card` + `c-body` |
| 多个并列要点 | `c-icon-row` × 3 | `c-card` × 3 (c-stack) | `c-grid-2` × 4 |
| 步骤/流程 | `c-step` × 4 | `c-step` × 3 | `c-step` × 5 (紧凑) |
| 数据/指标 | `c-kpi-value` 大号 | `c-row` 3 KPI | `c-kpi` 嵌入 `c-card` |
| 警告/提示 | `c-warn` / `c-note` 全宽 | 嵌入 `c-section` | 嵌入 `c-card-warn` |
| 引用 | `c-quote` (c-glass 包裹) | `c-quote` 纯文字 | 嵌入 `c-card` |

## 常见违规

| 违规 | 修复 |
|------|------|
| 标题超过 1 行 | 缩短到 ≤ 10 字 |
| 一页 6+ 个组件块 | 拆成两页 |
| 卡片正文超过 4 行 | 精简到 ≤ 60 字，多余内容拆到新卡片 |
| 用 h1 当 slide 标题 | h1 仅用于封面和分隔页；slide 标题用 h2 |
| 3:4 下使用 g3/g4 网格 | 3:4 下 c-grid-3 降为 2 列，c-grid-2 降为 1 列；如需保留多列，在 Design CSS 中添加 `@container (max-width: 1000px) { .d-xxx .c-grid-2 { grid-template-columns: repeat(2, 1fr); } }` |
| 组件太小看不清 | 检查 cqi 值是否低于上表下限；3:4 下正文不 < 1.5cqi |
