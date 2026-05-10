# Component Palette（组件调色板）

共享组件库，与 design/theme 无关，16:9 和 3:4 通用。通过 CSS Variables 自动适配任意 theme。

## 使用方式

在 HTML 中加载 `components.css`（在 base.css 和 theme 之后）：

```html
<link rel="stylesheet" href="assets/base.css">
<link rel="stylesheet" href="assets/fonts.css">
<link rel="stylesheet" href="assets/themes/tokyo-night.css">
<link rel="stylesheet" href="assets/components.css">
```

3:4 画布推荐使用 Design CSS 替代 theme，提供完整视觉皮肤：

```html
<link rel="stylesheet" href="assets/base.css">
<link rel="stylesheet" href="assets/fonts.css">
<link rel="stylesheet" href="assets/components.css">
<link rel="stylesheet" href="assets/designs/pastel-card.css">
<body class="d-pastel-card portrait">
```

## Chrome 片段（chr-*）

Chrome 是页面的"壳"——topbar、footer、页码、装饰性背景元素等。它们与 c-* 内容组件正交：Chrome 提供页面框架，c-* 填充内容。

Chrome 元素的类名统一使用 `chr-*` 前缀，由 Design CSS 赋予视觉样式：

| Chrome 元素 | 类名 | 说明 |
|------------|------|------|
| 顶部栏 | `.chr-topbar` | 标签 + 页码的顶部栏 |
| 胶囊标签 | `.chr-chip` | 顶部栏中的圆角标签（含 `::before` 色点） |
| 页码 | `.chr-page` | 页码指示器（"01 / 08"） |
| 分类标签 | `.chr-kicker` | 标题上方的全大写标签 |
| 底部栏 | `.chr-footer` | 底部状态栏（章节名 + 页码） |
| 装饰分隔线 | `.chr-divider` | 渐变短分隔线（如 pastel-card 的桃色渐变线） |
| 顶部渐变线 | `.chr-topline` | 页面顶部的彩虹渐变线（如 white-editorial） |
| 装饰贴纸 | `.chr-sticker` | 旋转的虚线边框贴纸（如 xhs-post） |
| 背景模糊圆 | `.chr-blob` | 绝对定位的径向渐变圆形（如 pastel-card） |
| 圆形编号 | `.chr-num-circle` | 大号步骤编号圆圈（如 xhs-post） |

Chrome 元素不是通用组件——每个 Design CSS 可以选择性地定义它们。如果某个 Design CSS 未定义 `.chr-blob`，HTML 中放置的 blob div 将不可见（无尺寸、无背景）。

见 `assets/designs/*.css` 中的完整 Chrome 样式实现。

## 核心理念

**Slide = 组件自由组合，而非固定布局填空。**

3:4 画布上，单一 layout 填不满。用组件堆叠来构建每页：

```html
<section class="slide">
  <h2 class="h2">Slide Title</h2>
  <div class="c-stack">
    <div class="c-card-accent">...</div>
    <div class="c-row">
      <div class="c-kpi"><span class="c-kpi-value">40%</span></div>
      <div class="c-kpi"><span class="c-kpi-value">2x</span></div>
    </div>
    <div class="c-warn">...</div>
  </div>
</section>
```

16:9 下 `c-row` 横排，3:4 下自动纵排。所有尺寸用 `cqi` 单位等比缩放。

## 组件目录

### 布局容器

| 组件 | 类名 | 说明 |
|------|------|------|
| Stack | `.c-stack` | 纵向堆叠，子元素自动间距 |
| Row | `.c-row` | 横向排列，3:4 自动变为纵排 |
| Grid 2 | `.c-grid-2` | 2 列网格，3:4 变为 1 列 |
| Grid 3 | `.c-grid-3` | 3 列网格，3:4 变为 2 列 |
| Divider | `.c-divider` | 全宽分隔线 |
| Divider accent | `.c-divider-accent` | 短强调分隔线 |
| Spacer | `.c-spacer-sm / md / lg` | 垂直间距占位 |

### 内容容器

| 组件 | 类名 | 说明 |
|------|------|------|
| Card | `.c-card` | 基础卡片（surface 背景 + 阴影） |
| Card accent | `.c-card-accent` | 顶部 3px accent 色强调线 |
| Card warn | `.c-card-warn` | 左侧 4px warn 色警告线 |
| Card soft | `.c-card-soft` | 浅色背景，低对比 |
| Section | `.c-section` | 带标签的分区容器 |
| Glass | `.c-glass` | 毛玻璃效果卡片 |

### 排版组件

| 组件 | 类名 | 说明 |
|------|------|------|
| Title | `.c-title` | 组件内标题（16:9 ≈ 42px, 3:4 ≈ 28px） |
| Subtitle | `.c-subtitle` | 组件内副标题 |
| Body | `.c-body` | 正文 |
| Small | `.c-small` | 辅助文字 |
| Grad text | `.c-grad` | 渐变文字（使用 `--grad` 变量） |
| Badge | `.c-badge` | 圆角标签，变体：`.accent` `.good` `.warn` `.bad` |
| Badge row | `.c-badge-row` | 标签横排容器 |

### 数据组件

| 组件 | 类名 | 说明 |
|------|------|------|
| KPI | `.c-kpi` | 大数字 + 标签 + 变化量（`.up` `.down` `.flat`） |
| Quote | `.c-quote` | 衬线引用，`::before` 引号 + `.c-quote-attr` 出处 |

### 流程组件

| 组件 | 类名 | 说明 |
|------|------|------|
| Steps | `.c-steps` + `.c-step` | 编号圆圈 + 标题 + 正文，纵向 |
| Connector | `.c-connector` | 步骤间箭头 + 说明文字 |
| Icon row | `.c-icon-row` | 图标 + 标题 + 描述 |

### 特殊框

| 组件 | 类名 | 说明 |
|------|------|------|
| Formula | `.c-formula` | 居中高亮概念/公式框 |
| Warn box | `.c-warn` | 红色边框警告框（危险/注意事项） |
| Note box | `.c-note` | 蓝色提示框（建议/技巧/最佳实践） |
| Example | `.c-example` | 示例/案例框 |

## HTML 结构参考

### Card 系列

```html
<!-- 基础卡片 -->
<div class="c-card">
  <div class="c-title">Card Title</div>
  <div class="c-body">Card content text</div>
</div>

<!-- 强调卡片 -->
<div class="c-card-accent">
  <div class="c-title">Key Point</div>
  <div class="c-body">This is important</div>
</div>

<!-- 警告卡片 -->
<div class="c-card-warn">
  <div class="c-title">Watch Out</div>
  <div class="c-body">Be careful about this</div>
</div>
```

### KPI

```html
<div class="c-row">
  <div class="c-kpi">
    <div class="c-kpi-value">99.9%</div>
    <div class="c-kpi-label">Uptime</div>
    <div class="c-kpi-delta up">+0.5%</div>
  </div>
  <div class="c-kpi">
    <div class="c-kpi-value">12ms</div>
    <div class="c-kpi-label">P99 Latency</div>
    <div class="c-kpi-delta down">-3ms</div>
  </div>
</div>
```

### Steps

```html
<div class="c-steps">
  <div class="c-step">
    <div class="c-step-num">1</div>
    <div class="c-step-content">
      <div class="c-step-title">First Step</div>
      <div class="c-step-body">Description of the first step</div>
    </div>
  </div>
  <div class="c-connector">
    <span class="c-connector-arrow">↓</span>
    <span class="c-connector-text">Then proceed to</span>
  </div>
  <div class="c-step">
    <div class="c-step-num">2</div>
    <div class="c-step-content">
      <div class="c-step-title">Second Step</div>
      <div class="c-step-body">Description of the second step</div>
    </div>
  </div>
</div>
```

### Icon Row

```html
<div class="c-stack">
  <div class="c-icon-row">
    <div class="c-icon-row-icon">🔍</div>
    <div class="c-icon-row-text">
      <div class="c-icon-row-title">Research</div>
      <div class="c-icon-row-body">Gather info and summarize</div>
    </div>
  </div>
  <div class="c-icon-row">
    <div class="c-icon-row-icon">✏️</div>
    <div class="c-icon-row-text">
      <div class="c-icon-row-title">Content</div>
      <div class="c-icon-row-body">Write, rewrite, transform</div>
    </div>
  </div>
</div>
```

### Warn / Note / Example

```html
<!-- 警告框：负面/危险信息，红色 -->
<div class="c-warn">
  <div class="c-warn-icon">⚠️</div>
  <div class="c-warn-content">
    <div class="c-warn-title">Over-engineering Warning</div>
    <div class="c-warn-body">Don't add vector DB before confirming you need memory.</div>
  </div>
</div>

<!-- 提示框：正面/中性建议，accent 色 -->
<div class="c-note">
  <div class="c-note-icon">💡</div>
  <div class="c-note-content">
    <div class="c-note-title">Pro Tip</div>
    <div class="c-note-body">Start simple. Most agents work fine with just a clear prompt.</div>
  </div>
</div>

<div class="c-example">
  <div class="c-example-label">Example</div>
  Role: Crypto Research Assistant<br>
  Tools: Web Search, File Search, Calculator
</div>
```

### Section

```html
<div class="c-section">
  <div class="c-section-label">Core Loop</div>
  <div class="c-stack">
    <div class="c-card-soft">
      <div class="c-title">LLM = Brain</div>
      <div class="c-body">Handles reasoning and decision-making</div>
    </div>
    <div class="c-card-soft">
      <div class="c-title">Tools = Hands</div>
      <div class="c-body">Execute search, compute, I/O</div>
    </div>
  </div>
</div>
```

## 典型组合模式

### 模式 1：标题 + 要点卡片（适合 3:4 开屏）

```html
<section class="slide">
  <h1 class="h1">Topic Title</h1>
  <p class="lede">One-line summary</p>
  <div class="c-stack mt-l">
    <div class="c-card-accent">
      <div class="c-title">Point 1</div>
      <div class="c-body">Explanation</div>
    </div>
    <div class="c-card">
      <div class="c-title">Point 2</div>
      <div class="c-body">Explanation</div>
    </div>
    <div class="c-card">
      <div class="c-title">Point 3</div>
      <div class="c-body">Explanation</div>
    </div>
  </div>
</section>
```

### 模式 2：KPI 仪表盘（16:9 横排，3:4 纵排）

```html
<section class="slide">
  <h2 class="h2">Metrics</h2>
  <div class="c-row mt-l">
    <div class="c-kpi">
      <div class="c-kpi-value">40%</div>
      <div class="c-kpi-label">Efficiency Gain</div>
      <div class="c-kpi-delta up">+12%</div>
    </div>
    <div class="c-kpi">
      <div class="c-kpi-value">2x</div>
      <div class="c-kpi-label">Throughput</div>
      <div class="c-kpi-delta up">+100%</div>
    </div>
    <div class="c-kpi">
      <div class="c-kpi-value">-28%</div>
      <div class="c-kpi-label">Training Cost</div>
      <div class="c-kpi-delta down">↓</div>
    </div>
  </div>
</section>
```

### 模式 3：步骤教程（3:4 原生设计）

```html
<section class="slide">
  <h2 class="h2">How to Build Your First Agent</h2>
  <div class="c-steps mt-l">
    <div class="c-step">
      <div class="c-step-num">1</div>
      <div class="c-step-content">
        <div class="c-step-title">Write a one-sentence description</div>
        <div class="c-step-body">Be specific! Agent = Role + Goal + Tools + Rules + Output</div>
      </div>
    </div>
    <div class="c-connector"><span class="c-connector-arrow">↓</span></div>
    <div class="c-step">
      <div class="c-step-num">2</div>
      <div class="c-step-content">
        <div class="c-step-title">Let AI design your agent</div>
        <div class="c-step-body">Feed your description to Claude or ChatGPT</div>
      </div>
    </div>
    <div class="c-connector"><span class="c-connector-arrow">↓</span></div>
    <div class="c-step">
      <div class="c-step-num">3</div>
      <div class="c-step-content">
        <div class="c-step-title">Build the smallest working version</div>
        <div class="c-step-body">One agent + one prompt + max two tools</div>
      </div>
    </div>
  </div>
</section>
```

### 模式 4：分隔页 + 图标列表

```html
<section class="slide">
  <h2 class="h2">Five Agent Types</h2>
  <div class="c-stack mt-l">
    <div class="c-icon-row">
      <div class="c-icon-row-icon">🔍</div>
      <div class="c-icon-row-text">
        <div class="c-icon-row-title">Research Agent</div>
        <div class="c-icon-row-body">Gather info and summarize. Needs: web search + structured output</div>
      </div>
    </div>
    <div class="c-icon-row">
      <div class="c-icon-row-icon">✏️</div>
      <div class="c-icon-row-text">
        <div class="c-icon-row-title">Content Agent</div>
        <div class="c-icon-row-body">Write, rewrite, transform. Needs: strong system prompt + style examples</div>
      </div>
    </div>
  </div>
</section>
```
