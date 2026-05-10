# 3:4 竖版 Slides 制作指南

---

## 核心架构

3:4 竖版 Slides 统一采用 `Template × Design × Content` 三层分离：

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
<link rel="stylesheet" href="assets/designs/{design}.css">
<body class="d-{design} portrait">
```

## Design CSS 的两种用法

同一套架构，Design CSS 可以极简也可以完整：

### 极简 Design（~30行）

只设 CSS 变量，无 Chrome 壳层。适合内容干货为主、视觉不需要太强的场景。

```css
.d-my-deck {
  --bg: #fff; --surface: #fff; --text-1: #111; --text-2: #555;
  --accent: #3b6cff; --radius: 18px; --shadow: 0 10px 30px rgba(0,0,0,.08);
  --font-display: 'Inter', 'Noto Sans SC', sans-serif;
  --font-sans: 'Inter', 'Noto Sans SC', sans-serif;
  background: var(--bg); color: var(--text-1); font-family: var(--font-sans);
}
```

页面直接用 `h1 / h2 / lede` + `c-*` 组件拼装，无 topbar / footer / blob 等装饰。

### 完整 Design（~200行）

CSS 变量 + Chrome 样式 + c-* 扩展。适合需要品牌辨识度、社交平台发布的场景。

包含：`chr-topbar`（顶栏）、`chr-chip`（标签）、`chr-footer`（底栏）、`chr-blob`（装饰背景）、卡片颜色变体、排版专属类等。

已有完整 Design：`pastel-card`（马卡龙色块）、`white-editorial`（白底杂志）、`xhs-post`（手绘涂鸦）。实现见 `templates/full-decks/xhs-*/` 和 `assets/designs/`。

**极简和完整之间是渐进式的**——从极简 Design 开始，需要什么 Chrome 就加什么，逐步丰富。

---

## 制作方法论

### 1. 先内容后视觉

先确定内容骨架（10 页左右），再选/写 Design CSS。同一套内容换 Design CSS 即可换皮。

典型骨架：
```
cover → 痛点 → 核心概念 → 速查/清单 → 金句 → 场景/分类 → 流程/步骤 → 数据/工具 → 行动号召 → thanks
```

### 2. 一页一观点

每页只传达一个核心信息。3:4 画布比 16:9 更严格——窄画布没有横向空间分散注意力。

### 3. 组件数量 3-5 个/页

太少显空，太多显乱。语法速查页（9 个 `c-icon-row`）是密度上限。

### 4. 自定义 CSS = 0

所有视觉样式收归 Design CSS。页面 HTML 只负责结构和内容，不写 `<style>` 和内联样式（chrome 定位除外）。

---

## 组件使用经验

### 信息层次靠卡片颜色变体

卡片颜色即信息层级，不需要额外说明：

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

锚点：`h1` 标题。用 `c-section` 嵌套 `c-icon-row` 做"本期内容"目录预告。

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

锚点：`c-glass` + `c-quote`。用 `c-grid-2` 做对比让金句有具体支撑。

#### 场景 / 分类页

```
h2 → lede → c-grid-2（c-card-accent × 4）
```

锚点：四宫格卡片。每个卡片 `c-title` + `c-body`。

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

加 `c-section` 嵌套 `c-icon-row` 做"本期内容"目录摘要，让 Cover 同时预告全文结构。

### 金句页加对比卡片

`c-grid-2` 放"没有 X" vs "有了 X" 的对比（`c-card-warn` vs `c-card-accent`），让金句有具体支撑。

### Thanks 页加回顾要点

`c-section` + `c-icon-row` × 3 做要点回顾，让最后一页也有信息量，值得截图保存。

### 用 c-spacer 控制节奏

`c-spacer-sm` 和 `c-spacer-md` 交替使用，制造阅读节奏。

### 首尾呼应

Cover 和 Thanks 的 `c-badge-row` 使用相同标签，形成闭环。

---

## 尺寸参考

| 项目 | 值 |
|------|-----|
| 画布 | 810 × 1080 px |
| @2x 输出 | 1620 × 2160 px |
| 1 cqi | ≈ 8.1 px |
| Slide padding | 4.5cqi（默认，Design CSS 可覆盖） |
