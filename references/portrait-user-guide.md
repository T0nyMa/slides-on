# 3:4 竖版 Slides 制作指南

---

## 两种制作路线

### 轻装路线（Quick Theme）

`.portrait` + `components.css` + theme CSS。自定义 CSS ≤ 30 行。

```html
<link rel="stylesheet" href="assets/base.css">
<link rel="stylesheet" href="assets/fonts.css">
<link rel="stylesheet" href="assets/themes/{theme}.css">
<link rel="stylesheet" href="assets/components.css">
<link rel="stylesheet" href="style.css">
<body class="portrait {scope-class}">
```

| 维度 | 说明 |
|------|------|
| 自定义 CSS | ≤ 30 行，仅内容级微调（如 code 样式、1-2 个专用类） |
| 页面结构 | `h1/h2/lede` + `c-*` 组件直接拼 |
| 换皮 | 换 theme CSS 一行，36 个 theme 随选 |
| Chrome 壳层 | 无——没有 topbar、footer、blob 等装饰 |
| 适用场景 | 知识分享、教程干货、内部培训、读书笔记、技术科普 |
| 代表 example | `examples/markdown-intro-components/` |

### 品牌路线（Branded Design）

`.portrait` + `components.css` + Design CSS + Chrome HTML。自定义 CSS = 0 行。

```html
<link rel="stylesheet" href="assets/fonts.css">
<link rel="stylesheet" href="assets/base.css">
<link rel="stylesheet" href="assets/components.css">
<link rel="stylesheet" href="assets/designs/{design}.css">
<body class="d-{design} portrait">
```

| 维度 | 说明 |
|------|------|
| 自定义 CSS | 0 行，视觉全在 Design CSS 里 |
| 页面结构 | `chr-*` Chrome 壳层 + `c-*` 组件填充内容 |
| 换皮 | 换 Design CSS + body class，Chrome HTML 结构通用 |
| Chrome 壳层 | 有——topbar / chip / footer / blob / sticker / divider 等 |
| 适用场景 | 小红书图文、社交媒体卡片、品牌发布、产品介绍、个人 IP 内容 |
| 已有 Design | `pastel-card`（马卡龙色块）、`white-editorial`（白底杂志）、`xhs-post`（手绘涂鸦） |
| 代表 example | `templates/full-decks/xhs-pastel-card/` 等 |

### 如何选择

| 判断条件 | → 路线 |
|---------|--------|
| 内容干货为主，视觉不需要太强 | 轻装路线 |
| 需要品牌辨识度 / 社交平台发布 | 品牌路线 |
| 想快速出 10 页，半小时搞定 | 轻装路线 |
| 有现成 Design CSS 可复用 | 品牌路线 |
| 需要 topbar / footer / 装饰元素 | 品牌路线 |
| 对视觉没特殊要求，换个配色就行 | 轻装路线 |

**一句话：内容驱动选轻装，视觉驱动选品牌。**

---

## 制作方法论

### 1. 先内容后视觉

先确定 10 页内容骨架（不强制），再选视觉皮肤。同一套内容可以换皮输出不同风格。

典型骨架：
```
cover → 痛点 → 核心概念 → 速查/清单 → 金句 → 场景/分类 → 流程/步骤 → 数据/工具 → 行动号召 → thanks
```

### 2. 一页一观点

每页只传达一个核心信息。3:4 画布比 16:9 更严格——窄画布没有横向空间分散注意力，每块内容必然被顺序阅读。

### 3. 组件数量 3-5 个/页

每页控制在 3-5 个组件块。太少显空，太多显乱。语法速查页（9 个 `c-icon-row`）是密度上限。

### 4. 自定义 CSS 红线

`style.css` 超过 30 行 = 信号：应该把样式收归到 Design CSS 或组件库。轻装路线通常 ≤ 25 行。

---

## 组件使用经验

### 信息层次靠卡片颜色变体

卡片颜色即信息层级，不需要额外说明就能让读者感知信息权重：

| 组件 | 语义 | 用途 |
|------|------|------|
| `c-card-warn` | 问题 / 痛点 / 反面 | 红/橙调，"这个不好" |
| `c-card` | 中性 / 普通信息 | 默认样式 |
| `c-card-accent` | 答案 / 推荐 / 正面 | 强调色，"这个好" |
| `c-card-soft` | 补充说明 / 背景信息 | 柔和底色，"顺便说一句" |
| `c-note` | 正面提示 / 关键认知 | 强调色 callout，"记住这个" |

### 每页一个"锚点组件"

每页需要一个视觉重心（锚点），其他组件围绕它展开：

| 页面类型 | 锚点组件 |
|---------|---------|
| 金句页 | `c-glass` + `c-quote` |
| 数据页 | `c-kpi`（大数字） |
| 公式 / 结论页 | `c-formula` |
| 流程页 | `c-steps` + `c-connector` |
| 速查页 | 多个 `c-icon-row`（密度型锚点） |
| 对比页 | `c-grid-2`（c-card-warn vs c-card-accent） |

### 常用组件搭配模式

#### Cover

```
kicker → h1 → lede → c-divider-accent → c-card-soft（摘要）→ c-section（目录预告）→ c-badge-row
```

锚点：`h1` 标题。用 `c-section` 嵌套 `c-icon-row` 做"本期内容"目录预告，Cover 不只是标题页。

#### 痛点页

```
h2 → lede → c-stack（c-card-warn × 2 + c-card-accent × 1）→ c-formula
```

锚点：`c-card-warn` 和 `c-card-accent` 的对比。最后一个卡片用 accent 色反转，给出答案。

#### 核心概念页

```
h2 → lede → c-row（c-card × 3，每个含居中大符号/图标）→ c-example → c-badge-row
```

锚点：三个并排卡片中的大符号。`c-example` 补充具体用法。

#### 速查 / 清单页

```
h2 → c-section（c-section-label + c-stack → c-icon-row × N）
```

锚点：密集的 `c-icon-row` 列表。`c-section-label` 给列表加标题分组。

#### 金句页

```
c-glass（c-quote）→ c-divider-accent → c-card-soft（解释）→ c-grid-2（对比卡片）→ c-badge-row
```

锚点：`c-glass` + `c-quote`。用 `c-grid-2` 做"没有 X" vs "有了 X" 对比，让金句有具体支撑。

#### 场景 / 分类页

```
h2 → lede → c-grid-2（c-card-accent × 4）
```

锚点：四宫格卡片。每个卡片 `c-title` + `c-body`，简短有力。

#### 流程 / 步骤页

```
h2 → lede → c-steps（c-step + c-connector 交替）→ c-note
```

锚点：`c-steps` 编号流程。`c-connector` 连接每一步，`c-note` 补充关键提示。

#### 数据 / 工具页

```
h2 → lede → c-kpi → c-card-accent（代码/命令）→ c-icon-row（支持的类型）→ c-badge-row
```

锚点：`c-kpi` 大数字。`c-card-accent` 放可操作的代码命令。

#### 行动号召页

```
h2 → c-formula → c-steps（3 步）→ c-example（完整示例）→ c-card-soft（结语）
```

锚点：`c-formula` 核心行动。`c-example` 给一个可直接复制的完整示例。

#### Thanks 页

```
c-glass（h1 + c-quote + c-quote-attr）→ c-section（回顾要点 → c-icon-row × 3）→ c-badge-row
```

锚点：`c-glass` 大标题。`c-section` 做要点回顾让 Thanks 页有信息量。

---

## 填满画面的技巧

### Cover 不要只放标题

加 `c-section` 嵌套 `c-icon-row` 做"本期内容"目录摘要，让 Cover 同时预告全文结构。比单独的标题 + 副标题丰富得多。

### 金句页加对比卡片

`c-grid-2` 放"没有 X" vs "有了 X" 的对比（`c-card-warn` vs `c-card-accent`），让金句有具体支撑而非空喊口号。

### Thanks 页加回顾要点

`c-section` + `c-icon-row` × 3 做要点回顾，让最后一页也有信息量，值得截图保存。

### 用 c-spacer 控制节奏

`c-spacer-sm` 和 `c-spacer-md` 交替使用，制造阅读节奏。不要让组件贴在一起，也不要全用大间距。

### 首尾呼应

Cover 和 Thanks 的 `c-badge-row` 使用相同标签，形成闭环。

---
