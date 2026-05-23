# Pipeline 详细文档

slides-on 的四步流水线将原始文档转化为可交互 HTML 演示文稿，再导出为目标格式。

## 架构总览

```
原始文档
  │
  ▼
Step 1: 内容分析 ──── 产出 outline.md
  │
  ▼
Step 2: 风格决策 ──── 产出 style-decision.md
  │
  ▼
Step 3: HTML 渲染 ──── 产出 index.html（+ AI 图片 + SVG）
  │
  ▼
Step 4: 导出 ──────── 产出 PNG / PPTX / PDF
```

## Step 1: 内容分析

### 1.1 文档解析

从用户提供的原始文档中提取结构化信息：

- **元信息**：标题（第一个 H1）、副标题、作者、日期
- **章节边界**：按 H2 或语义主题分隔识别章节
- **内容节点**：每个段落、列表、代码块、图片作为独立内容单元
- **信号词**：扫描关键词（"架构"、"流程图"、"对比"、"数据"等）用于后续风格决策

### 1.2 章节划分规则

| 文档特征 | 拆分策略 |
|---------|---------|
| 有 H2/H3 标题 | 按 H2 为 section，H3 为 slide |
| 无标题纯文本 | 按语义主题拆分，每 3-5 段为一 slide |
| 含代码块 | 代码块独立成 slide（code/terminal layout） |
| 含数据/表格 | 数据独立成 slide（chart/table layout） |

### 1.3 页数推算

基于源文档字数（中文字符数）的启发式：

| 文档长度 | 建议页数 | 说明 |
|---------|:---:|------|
| < 500 字 | 3-6 页 | 微型演示（闪电演讲） |
| 500-1000 字 | 5-10 页 | 短文/博客转 deck |
| 1000-3000 字 | 10-18 页 | 标准技术分享 |
| 3000-5000 字 | 15-25 页 | 深度长文/教程 |
| > 5000 字 | 20-35 页 | 课程/系列讲座 |

实际页数以内容结构为准，启发式仅作上限参考。

### 1.4 内容类型识别

| 内容特征 | 类型标记 | 推荐渲染引擎 |
|---------|---------|------------|
| 段落文字、列表 | `bullets` | html-ppt layout |
| 标题+要点 | `bullets` / `big-quote` | html-ppt layout |
| 代码块 | `code` / `terminal` | html-ppt layout |
| 数据表格 | `table` / `chart-bar` | html-ppt layout |
| 架构描述 | `arch-diagram` | SVG diagram |
| 流程/步骤 | `process-steps` / `flow-diagram` | HTML layout 或 SVG diagram |
| 对比分析 | `comparison` / `pros-cons` | HTML layout |
| 概念插图 | `ai-image` | AI image |
| 数据故事 | `infographic` | AI infographic |
| 封面 | `cover` | HTML layout 或 AI cover |
| 结束页 | `cta` / `thanks` | HTML layout |

### 1.5 Ghost Deck Test

只读 outline.md 中每页的标题（action title），应能串成完整论点链：

```
封面标题 → 问题是什么 → 为什么重要 → 我们怎么做 → 结果如何 → 这意味着什么 → 下一步
```

如果标题序列无法讲述完整故事，回到 outline 调整页面标题。

### 1.6 产出格式

```markdown
# Deck: <标题>

## Cover
- 标题: <完整句子，陈述核心论点>
- 副标题: <补充上下文>
- 元信息: 作者、日期、场合

## Section: <章节名>
### Slide N: <Action Title — 完整句子>
- 类型: bullets | code | chart | diagram | ai-image | infographic
- 内容要点: ...
- 推荐 layout: ...
- 备注: ...

## Section: <章节名>
### Slide N+1: ...
```

## Step 2: 风格决策

### 2.1 Deck 级决策流程

```
内容信号 → 场景判断 → preset 推荐 → 用户确认/覆盖 → 4 维微调
```

**场景判断**：
| 场景 | 信号词 | 推荐 preset |
|------|--------|------------|
| 技术分享 | 代码、架构、API、系统 | blueprint / dark-atmospheric / minimal |
| 学术报告 | 研究、实验、数据、结论 | scientific / minimal |
| 商业演示 | 产品、市场、增长、收入 | corporate / bold-editorial |
| 教学课件 | 学习、基础、入门、实践 | hand-drawn-edu / chalkboard |
| 社交媒体 | 小红书、朋友圈、分享 | xiaohongshu-white / notion |
| 创意提案 | 概念、愿景、未来、设计 | sketch-notes / watercolor |

### 2.2 4 维自定义

4 维自定义系统：

| 维度 | 可选值 | 影响 |
|------|--------|------|
| **Texture** | clean / grid / organic / pixel / paper | 背景质感 |
| **Mood** | professional / warm / cool / vibrant / dark / neutral | 色彩情绪 |
| **Typography** | geometric / humanist / handwritten / editorial / technical | 字体风格 |
| **Density** | minimal / balanced / dense | 信息密度 |

### 2.3 Slide 级 Layout 选择

根据内容类型匹配 html-ppt layout（31 种）：

详见 `layouts.md`

### 2.4 混合渲染策略

在单个 deck 中，不同类型的 slide 使用不同渲染引擎：

```
Deck
├── Slide 1 (Cover)    → AI cover → PNG → <img> 嵌入 HTML
├── Slide 2 (TOC)      → HTML layout (toc)
├── Slide 3 (架构图)    → SVG diagram → SVG → 内联或 <img>
├── Slide 4-6 (内容)    → HTML layout (bullets/code)
├── Slide 7 (信息图)    → AI infographic → PNG → <img>
├── Slide 8 (概念插图)  → AI image → PNG → <img>
└── Slide 9 (结束)     → HTML layout (thanks)
```

## Step 3: HTML 渲染

### 3.1 组装流程

### 3.1 HTML 编写流程

1. 用 Read 工具读取资产文件（`assets/fonts.css`、`base.css`、theme CSS 等），内联到 HTML
2. 参照 `templates/single-page/<layout>.html` 的结构编写每页内容
3. 每页一个 `<section class="slide">`，置于 `<body class="landscape"><div class="deck">` 中
4. 对于 AI 图片/SVG 页面：插入 `<img>` 标签或内联 SVG
5. 添加 `data-anim` / `data-fx` 属性声明动画
6. 所有 CSS/JS 内联到单一 HTML 文件中

> 单页 layout 结构参考见 `templates/single-page/` 目录。

### 3.2 关键 CSS Variables

`base.css` 定义了 30+ 个 CSS 自定义属性，theme CSS 覆盖这些变量：

```css
:root {
  --bg: ...           /* 页面背景 */
  --bg-soft: ...      /* 次级背景 */
  --surface: ...      /* 卡片/面板背景 */
  --surface-2: ...    /* 次级 surface */
  --border: ...       /* 边框色 */
  --border-strong: .../* 强调边框 */
  --text-1: ...       /* 主文字色 */
  --text-2: ...       /* 次要文字色 */
  --text-3: ...       /* 辅助文字色 */
  --accent: ...       /* 强调色 */
  --good: ...         /* 正向语义色 */
  --warn: ...         /* 警告语义色 */
  --bad: ...          /* 负向语义色 */
  --grad: ...         /* 渐变色 */
  --grad-soft: ...    /* 柔和渐变 */
  --font-sans: ...    /* 无衬线字体 */
  --font-serif: ...   /* 衬线字体 */
  --font-mono: ...    /* 等宽字体 */
  --font-display: ... /* 展示字体 */
  --radius: ...       /* 圆角（大） */
  --radius-sm: ...    /* 圆角（小） */
  --radius-lg: ...    /* 圆角（超大） */
  --shadow: ...       /* 投影 */
  --shadow-lg: ...    /* 大投影 */
}
```

### 3.3 动画声明

通过 HTML 属性声明动画，`runtime.js` 在 slide 激活时触发：

```html
<!-- CSS 动画 -->
<section class="slide" data-anim="fade-up">
  ...
</section>

<!-- Canvas 特效 -->
<section class="slide" data-fx="chain-react">
  ...
</section>
```

详见 `animations.md`

## Step 4: 导出

详见 `export.md`
