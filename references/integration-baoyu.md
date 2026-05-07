# baoyu Skills 集成详解

slides-on 集成四个 baoyu skill 提供 AI 视觉内容生成能力。

## 来源路径

```
{baoyu-slide}     = .claude/skills/baoyu-slide-deck/
{baoyu-diagram}   = .claude/skills/baoyu-diagram/
{baoyu-imagine}   = .claude/skills/baoyu-imagine/
{baoyu-infographic}=.claude/skills/baoyu-infographic/
{baoyu-cover}     = .claude/skills/baoyu-cover-image/
```

## baoyu-slide-deck — AI 幻灯片风格系统

### 提供内容

- **17 个 Preset**（场景化捆绑包）：blueprint, bold-editorial, chalkboard, corporate, dark-atmospheric, editorial-infographic, fantasy-animation, hand-drawn-edu, intuition-machine, minimal, notion, pixel-art, scientific, sketch-notes, vector-illustration, vintage, watercolor
- **4 维自定义**：Texture × Mood × Typography × Density
- **分析框架**：信号检测 → preset 推荐
- **Merge 脚本**：`merge-to-pptx.ts` 和 `merge-to-pdf.ts`

### 调用方式

**Preset 选择**：
1. 读取 `{baoyu-slide}/references/styles/<preset>.md` 了解各 preset 特征
2. 根据内容信号匹配（参考 `references/style-decision-matrix.md`）
3. 将 preset 推荐写入 `style-decision.md`

**4 维调整**：
参考 `{baoyu-slide}/references/dimensions/` 中的 texture.md、mood.md、typography.md、density.md

**Merge 脚本**：
```bash
# PPTX
bun {baoyu-slide}/scripts/merge-to-pptx.ts <png-dir> --output output.pptx

# PDF
bun {baoyu-slide}/scripts/merge-to-pdf.ts <png-dir> --output output.pdf
```

## baoyu-diagram — SVG 架构图

### 提供内容

- **4 种图类型**：architecture、flowchart、sequence、structural
- **设计系统**：Dark 主题，8 种语义色彩，严格 SVG z-order 分层
- **输出**：SVG + @2x PNG（通过 `main.ts`）

### 调用方式

当 deck 中需要架构图/流程图时：

1. 描述架构/流程的结构（节点、连接、层级）
2. 参考 `{baoyu-diagram}/references/<type>.md` 选择合适的图类型
3. 生成 SVG 代码（遵循 z-order 规则）

**SVG z-order 规则**（必须严格遵守）：
```
Layer 1: 背景 (Background)
Layer 2: 区域边界 (Region boundaries)
Layer 3: 连接箭头 (Connection arrows)
Layer 4: 遮罩矩形 (Mask rectangles)
Layer 5: 组件框 (Component boxes)
Layer 6: 文本 (Text)
Layer 7: 图例 (Legend)
Layer 8: 标题 (Title)
```

**语义色彩**：
```
Primary:      #60a5fa (蓝)    — 核心组件
Secondary:    #a78bfa (紫)    — 次要组件
Tertiary:     #34d399 (绿)    — 辅助组件
Accent:       #f472b6 (粉)    — 强调
Alert:        #fb923c (橙)    — 警告
Connector:    #94a3b8 (灰)    — 连接线
Neutral:      #334155 (深灰)  — 背景
Highlight:    #fbbf24 (黄)    — 高亮
```

**SVG → PNG 转换**：
```bash
bun {baoyu-diagram}/scripts/main.ts <input.svg> --output <output.png>
```

### 嵌入 HTML

生成的 SVG 可以通过两种方式嵌入 deck：

```html
<!-- 方式 1：内联 SVG（推荐，保持矢量质量） -->
<div class="slide">
  <svg viewBox="0 0 800 600">...</svg>
</div>

<!-- 方式 2：img 引用 PNG（简单但不缩放） -->
<div class="slide" style="background-image: url('diagram.png')">
</div>
```

## baoyu-imagine — AI 图片生成

### 提供内容

- **10 个 Provider**：OpenAI GPT Image 2、Azure OpenAI、Google、OpenRouter、DashScope（通义万象）、Z.AI（智谱）、MiniMax、Jimeng（即梦）、Seedream（豆包）、Replicate
- **功能**：text-to-image、参考图、宽高比、批量生成
- **质量预设**：normal（1K）、2k（默认）

### 调用方式

当 deck 中需要 AI 插图/概念图时：

1. 编写图片 prompt（描述画面内容、风格、色调、构图）
2. 选择 provider（默认优先级见下方）
3. 生成图片
4. 将生成的 PNG 引用到 HTML 中

**Provider 选择策略**：
- 有参考图时：Google → OpenAI → Azure
- 无参考图时：Google → OpenAI → Azure → OpenRouter → DashScope → Z.AI → MiniMax → Replicate → Jimeng → Seedream

**Prompt 文件机制**（保证可复现）：
```
deck-name/
├── prompts/
│   ├── slide-03-architecture.md   # "一个分布式系统的三层架构图..."
│   ├── slide-07-illustration.md   # "一位程序员在深夜对着屏幕思考..."
│   └── ...
```

### 批量生成

```bash
bun {baoyu-imagine}/scripts/main.ts --batchfile prompts.txt --jobs 3
```

## baoyu-infographic — AI 信息图

### 提供内容

- **21 种布局**：linear-progression、binary-comparison、bento-grid、iceberg、funnel、dashboard、periodic-table、dense-modules 等
- **22 种视觉风格**：craft-handmade、claymation、kawaii、cyberpunk-neon、pixel-art、origami、ikea-manual、morandi-journal 等

### 调用方式

当 deck 中需要信息图时：

1. 确定信息类型（对比、流程、层级、数据等）
2. 选择 layout + style 组合（参考 `references/style-decision-matrix.md` 中的推荐）
3. 编写信息图 prompt
4. 生成图片并嵌入 HTML

**常用组合推荐**：
| 场景 | Layout | Style |
|------|--------|-------|
| 时间线/发展史 | linear-progression | technical-schematic |
| A vs B 对比 | binary-comparison | bold-graphic |
| 层级结构 | hierarchical-layers | ikea-manual |
| 流程漏斗 | funnel | corporate-memphis |
| 数据仪表盘 | dashboard | technical-schematic |

## baoyu-cover-image — 封面图

### 提供内容

- AI 生成的演示文稿封面图
- 支持标题文字叠加

### 调用方式

当 deck 封面需要更吸引人的视觉效果时，替代 html-ppt 的纯文字 cover layout：

1. 提取 deck 标题和副标题
2. 选择合适的视觉风格
3. 生成封面图
4. 在 HTML cover slide 中使用封面图作为背景

## 集成流程示例

一个典型的技术分享 deck 各页面的引擎选择：

```
Slide 1: Cover          → baoyu-cover-image（AI 封面图）
Slide 2: TOC            → html-ppt toc layout
Slide 3: 架构图          → baoyu-diagram（SVG architecture）
Slide 4: 核心流程        → baoyu-diagram（SVG flowchart）
Slide 5: 代码示例        → html-ppt code layout
Slide 6: 性能对比        → html-ppt chart-bar layout
Slide 7: 概念插图        → baoyu-imagine（AI 插图）
Slide 8: 信息图总结      → baoyu-infographic（dense-modules）
Slide 9: CTA            → html-ppt cta layout
```

混合渲染的关键点：
- AI 生成的内容（封面、插图、信息图）先在 Step 3 之前生成好
- 生成的文件路径写入 `style-decision.md`
- HTML 渲染时用 `<img>` 或 CSS `background-image` 引用
- 最终 HTML 包含所有内容的引用，render-precise.ts 正常截图即可
