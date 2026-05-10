---
name: slides-on
description: >
  Unified presentation skill. Builds interactive HTML slide decks with AI visuals,
  then exports to PNG/PPTX/PDF. One pipeline: content analysis → style decision →
  HTML rendering → export. 36 themes, 31 layouts, AI visuals, SVG diagrams, infographics.
---

# slides-on — 统一演示文稿制作

四步流水线：**内容分析 → 风格决策 → HTML 渲染 → 导出**。

## 触发条件

用户请求包含以下任一意图时激活此 skill：
- "做一个 PPT"、"生成演示文稿"、"帮我做 slides"、"做个 deck"
- "把这个文档转成幻灯片"、"生成 presentation"
- "渲染截图"、"导出 PNG/PPTX/PDF"（仅导出阶段）

## 核心约束

1. **不修改已有 skill 源码**，只通过路径引用和编排调用
2. Pipeline 严格按序执行，不可跳步。每步产出写入工作目录
3. AI 图片生成使用 prompt 文件机制，保证可复现

## Pipeline 详细流程

### Step 1: 内容分析

**输入**：用户提供的原始文档（Markdown、文本、或已有大纲）

**处理**：
1. **解析文档**：提取标题、副标题、作者等元信息；识别章节边界
2. **章节划分**：按 H2/主题将文档拆分为 section，每 section 包含若干 slide
3. **内容类型识别**：为每页标注内容类型（文字、图表、代码、架构图、信息图、AI 插图）
4. **页数推算**（启发式）：
   - < 1000 字 → 5-10 页
   - 1000-3000 字 → 10-18 页
   - > 3000 字 → 18-30 页
5. **信号检测**：扫描关键词匹配推荐 design（详见 `references/style-decision-matrix.md`）
6. **Ghost Deck Test**：只读标题序列能否讲述完整论点？不能则重排

**产出**：`outline.md`（slides 结构大纲），格式：
```markdown
# Slides: <标题>

## Cover
- 标题: ...
- 副标题: ...
- 作者: ...

## Section 1: <章节名>
### Slide 1.1: <页面标题>
- 类型: bullets | code | chart | diagram | ai-image | infographic
- 内容: ...
- 推荐布局: ...

### Slide 1.2: ...
...

## Section 2: ...
```

**参考文档**：
- `references/analysis-framework.md` — 详细分析框架
- `references/content-rules.md` — 内容规范
- `references/style-decision-matrix.md` — 信号→design 映射表

### Step 2: 风格决策

**输入**：`outline.md`

**两级决策**：

**Slides 级 — 选择 Design（视觉皮肤）**：
1. 从 17 个 design 中选择（或读取 EXTEND.md 默认值）
2. Design = 可移植的 CSS 变量覆盖层，决定颜色 / 字体 / 纹理 / 密度 / 动画偏好
3. 支持 4 维自定义覆盖（Texture × Mood × Typography × Density）
4. 也可直接选择 36 个 theme 作为视觉基础

**Slide 级 — 选择渲染引擎**：

| 内容类型 | 推荐引擎 | 产出 |
|---------|---------|------|
| 文字排版 | HTML layout | HTML 片段 |
| 数据图表 | HTML layout（chart-*）| HTML 片段 |
| 代码展示 | HTML layout（code, terminal）| HTML 片段 |
| 架构图/流程图 | SVG diagram | SVG 文件 |
| AI 插图/概念图 | AI image | PNG 图片 |
| 信息图 | AI infographic | PNG 图片 |
| 封面图 | AI cover image | PNG 图片 |
| 分隔页 | HTML layout | HTML 片段 |
| 3:4 手机画布 | Component palette | 组件自由组合（`c-*` classes） |

> **3:4 画布特殊处理**：当目标画布为 3:4（手机端），不推荐使用单一 layout，而是使用 **Component Palette**（`assets/components.css`）自由拼装组件（卡片、步骤、KPI、图标行、警告框等），纵向堆叠填满屏幕。详见 `references/components.md`。

**产出**：`style-decision.md`，记录每个 slide 的 theme、layout、渲染引擎选择。

**参考文档**：
- `references/themes.md` — 36 个 theme 详情
- `references/layouts.md` — 31 个 layout 详情
- `references/components.md` — 共享组件库（card、step、KPI、quote 等）
- `references/designs/` — 17 个 design
- `references/dimensions/` — 4 维自定义
- `references/diagram/` — 4 种架构图类型
- `references/infographic/` — 信息图 layout + style

### Step 3: HTML 渲染

**输入**：`outline.md` + `style-decision.md`

**处理**：
1. 从 `templates/full-decks/` 选择匹配的 Template（或从 `templates/deck.html` 骨架开始）
2. 从 `templates/single-page/` 选取每个 slide 的 layout HTML；**3:4 画布则从 `assets/components.css` 选择组件自由拼装**
3. 应用 theme（`assets/themes/` 中选择 CSS 文件）
4. 填写实际内容到 layout 中
5. **混合渲染**：对于 AI 图片/SVG 图页面，在 HTML 中以 `<img>` 引用生成的文件
6. 添加 `data-anim` 属性声明动画

**产出**：一个完整的 `index.html`（可浏览器打开交互演示）

**关键文件**：
- `assets/base.css` — 设计系统（150行，30+ CSS Variables）
- `assets/runtime.js` — 交互引擎（960行，slide 切换、键盘导航、presenter 模式）
- `assets/fonts.css` — Google Fonts 引入
- `assets/animations/` — 27 CSS 动画 + 20 Canvas FX
- `templates/deck.html` — 新建 deck 起始骨架

**参考文档**：
- `references/authoring-guide.md` — HTML 编写指南
- `references/presenter-mode.md` — Presenter 模式
- `references/animations.md` — 动画系统
- `references/html-engine.md` — HTML 渲染引擎详解
- `references/ai-visuals.md` — AI 视觉内容生成
- `references/components.md` — 组件调色板（3:4 自由拼装）

### Step 4: 导出

**输入**：`index.html`（+ AI 图片 + SVG 文件）

**三条导出路径**：

| 路径 | 命令 | 产出 | 适用场景 |
|------|------|------|---------|
| A. PNG 截图 | `bun scripts/render-precise.ts` | @2x PNG 序列 | 预览、社交媒体 |
| B. PPTX（可编辑） | `bun scripts/html-to-pptx.ts` | .pptx（原生文本/形状） | 分发、协作编辑 |
| C. PDF（拼合） | `bun scripts/merge-to-pdf.ts` | .pdf（图片拼合） | 打印、邮件 |

**路径 A — PNG 截图**（默认导出方式）：
```bash
bun scripts/render-precise.ts <index.html> \
  --canvas 16:9 \      # 或 3:4, 4:3, 9:16, 1:1, 2.35:1, a4-landscape, WxH
  --dsf 2 \            # 设备像素比（默认 @2x Retina）
  --slides auto \      # 自动检测页数，或指定 N
  --format png \       # png 或 jpeg
  --output ./png-out/  # 输出目录
```

**路径 B — PPTX（可编辑）**：
```bash
bun scripts/html-to-pptx.ts <index.html> --output deck.pptx
```

**路径 C — PDF 拼合**：
```bash
bun scripts/merge-to-pdf.ts <png-dir> --output deck.pdf
```


**画布尺寸参考**：

| 模板类型 | 画布 | @2x 输出 |
|---------|------|---------|
| 标准 16:9 | 1920×1080 | 3840×2160 |
| XHS 3:4 | 810×1080 | 1620×2160 |
| Stories 9:16 | 1080×1920 | 2160×3840 |
| Square 1:1 | 1080×1080 | 2160×2160 |

**参考文档**：`references/export.md`

## 快速参考：Layout → 用途

| 类别 | Layout | 用途 |
|------|--------|------|
| 开篇 | cover, toc, section-divider | 封面、目录、章节分隔 |
| 文字 | bullets, big-quote, three-column, two-column | 要点、引言、多栏 |
| 数据 | chart-bar, chart-line, chart-pie, chart-radar, kpi-grid, stat-highlight | 图表、指标 |
| 代码 | code, terminal, diff | 代码展示、终端、Diff |
| 对比 | comparison, pros-cons, table | 对比、优劣、表格 |
| 流程 | process-steps, roadmap, timeline, gantt, flow-diagram | 步骤、路线图、时间线 |
| 图形 | arch-diagram, mindmap, image-grid, image-hero | 架构图、思维导图、图片 |
| 结尾 | cta, thanks, todo-checklist | 行动号召、致谢、清单 |

## 窄画布适配

`base.css` 内置窄画布规则（`.narrow` / `.tpl-xhs-post`），当画布 ≤ 900px 时自动：
- 列数降级（g4 → 2 列，g3 → 2 列）
- 字号缩小（h1 56px、h2 40px、h3 26px）
- 间距收紧
- 特定 layout 适配（arch、vs、gantt、flow、steps）

生成 XHS 内容时使用 `--canvas 3:4` 自动触发窄画布模式。

## 交互快捷键

生成的 HTML deck 支持以下键盘操作：

| 按键 | 功能 |
|------|------|
| `←` `→` | 前后翻页 |
| `Home` / `End` | 跳转首页 / 末页 |
| `Space` | 下一页 |
| `T` | 循环切换 theme |
| `A` | 循环切换 animation |
| `F` | 全屏 |
| `O` | 概览网格（所有 slide 缩略图） |
| `P` | Presenter 模式（独立窗口 + 笔记） |
| `S` | 显示/隐藏 speaker notes |

## EXTEND.md 扩展

用户可在 `EXTEND.md` 中自定义：
- **defaults**：默认 design、theme、字体、动画、导出偏好、AI 图片 provider
- **brand**：Logo、品牌色、页脚
- **slides-structure**：自定义 slides 页面序列模式
- **custom-themes/layouts/components**：扩展视觉和布局
- **ai-image**：默认图片生成 provider 和参数

详见 `EXTEND.md`。
