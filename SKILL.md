---
name: slides-on
description: >
  Unified presentation skill. Builds interactive HTML slide decks with AI visuals,
  then exports to PNG/PPTX/PDF. One pipeline: content analysis → style decision →
  HTML rendering → export. Integrates html-ppt (36 themes, 31 layouts), baoyu skills
  (AI images, SVG diagrams, infographics), and academic-pptx conventions.
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
4. 学术场景应用 academic-pptx 规范（Action Titles, Ghost Deck Test）

## 来源路径映射

```
{html-ppt}        = .agents/skills/html-ppt/          # 36 主题 + 31 布局 + 15 deck 模板
{baoyu-slide}     = .claude/skills/baoyu-slide-deck/  # 17 preset + merge 脚本
{baoyu-diagram}   = .claude/skills/baoyu-diagram/     # SVG 架构图（4 种类型）
{baoyu-imagine}   = .claude/skills/baoyu-imagine/     # AI 图片生成（10 Provider）
{baoyu-infographic}=.claude/skills/baoyu-infographic/ # 信息图（21 布局 × 22 风格）
{baoyu-cover}     = .claude/skills/baoyu-cover-image/ # 封面图生成
```

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
5. **信号检测**：扫描关键词匹配推荐 preset（详见 `references/style-decision-matrix.md`）
6. **Ghost Deck Test**：只读标题序列能否讲述完整论点？不能则重排

**产出**：`outline.md`（deck 结构大纲），格式：
```markdown
# Deck: <标题>

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
- `{baoyu-slide}/references/analysis-framework.md` — 详细分析框架
- `{baoyu-slide}/references/content-rules.md` — 内容规范
- `references/style-decision-matrix.md` — 信号→preset 映射表

### Step 2: 风格决策

**输入**：`outline.md`

**两级决策**：

**Deck 级 — 选择 Preset**：
1. 从 17 个 slide-deck preset 中选择（或读取 EXTEND.md 默认值）
2. Preset = theme + layout 偏好 + animation + 密度，是一个场景化捆绑包
3. 支持 4 维自定义覆盖（Texture × Mood × Typography × Density）
4. 也可直接选择 36 个 html-ppt theme 作为视觉基础

**Slide 级 — 选择渲染引擎**：

| 内容类型 | 推荐引擎 | 产出 |
|---------|---------|------|
| 文字排版 | html-ppt layout | HTML 片段 |
| 数据图表 | html-ppt layout（chart-*）| HTML 片段 |
| 代码展示 | html-ppt layout（code, terminal）| HTML 片段 |
| 架构图/流程图 | baoyu-diagram | SVG 文件 |
| AI 插图/概念图 | baoyu-imagine | PNG 图片 |
| 信息图 | baoyu-infographic | PNG 图片 |
| 封面图 | baoyu-cover-image | PNG 图片 |
| 分隔页 | html-ppt layout | HTML 片段 |

**产出**：`style-decision.md`，记录每个 slide 的 theme、layout、渲染引擎选择。

**参考文档**：
- `{html-ppt}/references/themes.md` — 36 个 theme 详情
- `{html-ppt}/references/layouts.md` — 31 个 layout 详情
- `{baoyu-slide}/references/styles/` — 17 个 preset
- `{baoyu-slide}/references/dimensions/` — 4 维自定义
- `{baoyu-diagram}/references/` — 4 种架构图类型
- `{baoyu-infographic}/references/` — 信息图 layout + style

### Step 3: HTML 渲染

**输入**：`outline.md` + `style-decision.md`

**处理**：
1. 从 `{html-ppt}/templates/full-decks/` 选择匹配的 deck 模板（或从 `templates/deck.html` 骨架开始）
2. 从 `{html-ppt}/templates/single-page/` 选取每个 slide 的 layout HTML
3. 应用 theme（`{html-ppt}/assets/themes/` 中选择 CSS 文件）
4. 填写实际内容到 layout 中
5. **混合渲染**：对于 AI 图片/SVG 图页面，在 HTML 中以 `<img>` 引用生成的文件
6. 添加 `data-anim` 属性声明动画

**产出**：一个完整的 `index.html`（可浏览器打开交互演示）

**关键文件**：
- `{html-ppt}/assets/base.css` — 设计系统（150行，30+ CSS Variables）
- `{html-ppt}/assets/runtime.js` — 交互引擎（960行，slide 切换、键盘导航、presenter 模式）
- `{html-ppt}/assets/fonts.css` — Google Fonts 引入
- `{html-ppt}/assets/animations/` — 27 CSS 动画 + 20 Canvas FX
- `{html-ppt}/templates/deck.html` — 新建 deck 起始骨架

**参考文档**：
- `{html-ppt}/references/authoring-guide.md` — HTML 编写指南
- `{html-ppt}/references/presenter-mode.md` — Presenter 模式
- `{html-ppt}/references/animations.md` — 动画系统
- `references/integration-html-ppt.md` — html-ppt 集成详解
- `references/integration-baoyu.md` — baoyu skills 集成详解

### Step 4: 导出

**输入**：`index.html`（+ AI 图片 + SVG 文件）

**四条导出路径**：

| 路径 | 命令 | 产出 | 适用场景 |
|------|------|------|---------|
| A. PNG 截图 | `bun scripts/render-precise.ts` | @2x PNG 序列 | 预览、社交媒体 |
| B. PPTX（拼合） | `bun scripts/merge-to-pptx.ts` | .pptx（图片拼合） | 保真分发 |
| C. PDF（拼合） | `bun scripts/merge-to-pdf.ts` | .pdf（图片拼合） | 打印、邮件 |
| D. PPTX（原生） | pptxgenjs 直接生成 | .pptx（文本可编辑） | 需要编辑文字 |

**路径 A — PNG 截图**（默认导出方式）：
```bash
cd .claude/skills/slides-on
bun scripts/render-precise.ts <index.html> \
  --canvas 16:9 \      # 或 3:4, 4:3, 9:16, 1:1, 2.35:1, a4-landscape, WxH
  --dsf 2 \            # 设备像素比（默认 @2x Retina）
  --slides auto \      # 自动检测页数，或指定 N
  --format png \       # png 或 jpeg
  --output ./png-out/  # 输出目录
```

**路径 B — PPTX 拼合**（调用 baoyu-slide-deck 脚本）：
```bash
bun {baoyu-slide}/scripts/merge-to-pptx.ts <png-dir> --output deck.pptx
```

**路径 C — PDF 拼合**（调用 baoyu-slide-deck 脚本）：
```bash
bun {baoyu-slide}/scripts/merge-to-pdf.ts <png-dir> --output deck.pdf
```

**路径 D — 原生 PPTX**：根据 outline.md 直接用 pptxgenjs 生成，AI 图片作为插图嵌入。

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

## EXTEND.md 扩展

用户可在 `EXTEND.md` 中自定义：
- **defaults**：默认 preset、theme、字体、动画、导出偏好、AI 图片 provider
- **brand**：Logo、品牌色、页脚
- **deck-structure**：自定义 deck 页面序列模式
- **custom-themes/layouts/components**：扩展视觉和布局
- **ai-image**：默认图片生成 provider 和参数

详见 `EXTEND.md`。
