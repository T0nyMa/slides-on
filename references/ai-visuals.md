# AI 视觉内容生成

slides-on 内建 AI 视觉内容生成能力，涵盖设计系统、架构图、插图和信息图。

## 设计系统（Design）

### 提供内容

- **18 个 Design**（视觉皮肤）：blueprint, bold-editorial, chalkboard, corporate, dark-atmospheric, editorial-infographic, fantasy-animation, hand-drawn-edu, intuition-machine, minimal, notion, pixel-art, scientific, sketch-notes, vector-illustration, vintage, watercolor, xhs-tech-tutorial
- **4 维自定义**：Texture × Mood × Typography × Density
- **分析框架**：信号检测 → design 推荐

### 使用方式

**Design 选择**：
1. 读取 `references/designs/<design>.md` 了解各 design 特征
2. 根据内容信号匹配（参考 `references/style-decision-matrix.md`）
3. 将 design 推荐写入 `style-decision.md`

**4 维调整**：
参考 `references/dimensions/` 中的 texture.md、mood.md、typography.md、density.md

## SVG 架构图

### 提供内容

- **4 种图类型**：architecture、flowchart、sequence、structural
- **设计系统**：Dark 主题，8 种语义色彩，严格 SVG z-order 分层
- **输出**：SVG + @2x PNG（通过 `scripts/svg-to-png.ts`）

### 使用方式

当 deck 中需要架构图/流程图时：

1. 描述架构/流程的结构（节点、连接、层级）
2. 参考 `references/diagram/<type>.md` 选择合适的图类型
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
bun scripts/svg-to-png.ts <input.svg>
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

## AI 图片生成（Imagine）

### 提供内容

- **10 个 Provider**：OpenAI GPT Image 2、Azure OpenAI、Google、OpenRouter、DashScope（通义万象）、Z.AI（智谱）、MiniMax、Jimeng（即梦）、Seedream（豆包）、Replicate
- **功能**：text-to-image、参考图、宽高比、批量生成
- **质量预设**：normal（1K）、2k（默认）

### 使用方式

当 deck 中需要 AI 插图/概念图时：

1. 编写图片 prompt（描述画面内容、风格、色调、构图）
2. 选择 provider（默认优先级见下方）
3. 生成图片
4. 将生成的 PNG 引用到 HTML 中

**Provider 选择策略**（在 `config.ts` 中定义，`IMAGINE_PROVIDER` 环境变量可覆盖）：
- 无参考图时：DashScope → OpenAI → MiniMax → Replicate → Z.AI → OpenRouter → Azure → Google → Jimeng → Seedream
- 有参考图时：Google → OpenAI → Azure（仅这三家支持原生参考图）

**Prompt 文件机制**（保证可复现）：
```
deck-name/
├── prompts/
│   ├── slide-03-architecture.md   # "一个分布式系统的三层架构图..."
│   ├── slide-07-illustration.md   # "一位程序员在深夜对着屏幕思考..."
│   └── ...
```

### 单张生成

```bash
# 结构化 prompt 模式（推荐）
bun scripts/imagine/main.ts --design sketch-notes --archetype "horizontal process" --aspect 3:4 --content "推荐系统三阶段"

# 直接 prompt 模式
bun scripts/imagine/main.ts --prompt "a futuristic city skyline" --aspect 16:9
```

### 批量生成

```bash
bun scripts/imagine/build-batch.ts --dir prompts/ --design sketch-notes --jobs 3
bun scripts/imagine/build-batch.ts --batchfile prompts.txt --anchor --jobs 1
```

### 默认配置

Provider、Model、Quality、Aspect 等默认值通过环境变量设置，CLI 参数覆盖：

```bash
export IMAGINE_PROVIDER="dashscope"
export IMAGINE_MODEL="qwen-image-2.0-pro-2026-04-22"
export IMAGINE_QUALITY="2k"
export IMAGINE_ASPECT="3:4"
export IMAGINE_DESIGN="sketch-notes"
```

设置后，CLI 调用可省略对应 flag。详见 `scripts/imagine/config.ts` 和 `EXTEND.md` 的 `ai_image` 节。

## 信息图（Infographic）

### 提供内容

- **21 种布局**：linear-progression、binary-comparison、bento-grid、iceberg、funnel、dashboard、periodic-table、dense-modules 等
- **22 种视觉风格**：craft-handmade、claymation、kawaii、cyberpunk-neon、pixel-art、origami、ikea-manual、morandi-journal 等

### 使用方式

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

## 封面图（Cover Image）

AI 生成的演示文稿封面图，支持标题文字叠加。

当 deck 封面需要更吸引人的视觉效果时使用：

1. 提取 deck 标题和副标题
2. 选择合适的视觉风格
3. 生成封面图
4. 在 HTML cover slide 中使用封面图作为背景

## 典型 Deck 各页面索引

```
Slide 1: Cover          → AI 封面图
Slide 2: TOC            → toc layout
Slide 3: 架构图          → SVG architecture
Slide 4: 核心流程        → SVG flowchart
Slide 5: 代码示例        → code layout
Slide 6: 性能对比        → chart-bar layout
Slide 7: 概念插图        → AI 插图
Slide 8: 信息图总结      → infographic (dense-modules)
Slide 9: CTA            → cta layout
```

混合渲染的关键点：
- AI 生成的内容（封面、插图、信息图）先在 Step 3 之前生成好
- 生成的文件路径写入 `style-decision.md`
- HTML 渲染时用 `<img>` 或 CSS `background-image` 引用
- 最终 HTML 包含所有内容的引用，render-precise.ts 正常截图即可
