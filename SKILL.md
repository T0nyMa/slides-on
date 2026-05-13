---
name: slides-on
description: >
  Build presentation slides, PPT, slide decks, 演示文稿, keynotes, 小红书图文, or
  image cards from any document. Use this whenever the user asks to create slides,
  做PPT, 做演示文稿, 做slides, 帮我做个汇报, 整理成图文, 做成小红书, 生成图文,
  make a deck, generate a PPT, weekly report, pitch deck, 周报, 提案, 分享,
  or any document-to-slides task — even if they don't say "slides" explicitly
  (e.g. "帮我整理一下这个文档", "把这篇做成卡片"). One pipeline: content analysis
  → style decision → review → HTML rendering → QA gate → export (PNG/PPTX/PDF).
  Built-in 3-layer QA: BLOCKER (must fix) / WARN (should review) / INFO (suggestion).
---

# slides-on — 统一演示文稿制作

五步流水线：**内容分析 → 风格决策 → Review 验证 → HTML 渲染 → 导出**。

## 核心约束

1. Pipeline 严格按序执行，不可跳步。每步产出写入工作目录
2. AI 图片生成使用 prompt 文件机制，保证可复现
3. 所有视觉样式收归 Design CSS，页面 HTML 只负责结构和内容
4. **QA 门禁**：Step 4 产出后自动运行，BLOCKER > 0 则阻塞，不得进入 Step 5

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
6. **Engagement 分析**（社交场景）：当目标场景为小红书/社交媒体/图文卡片时，加载 `references/engagement-analysis.md`，补充 engagement 指标到分析输出中（Hook 类型与评分、受众画像、滑动流设计、保存/分享/评论触发点）
7. **Ghost Deck Test**：只读标题序列能否讲述完整论点？不能则重排

**产出**：`outline.md`（slides 结构大纲），格式：
```markdown
# Slides: <标题>

## Cover
- 标题: ...
- 副标题: ...
- 作者: ...

## Section 1: <章节名>
### Slide 1.1: <页面标题>
- 原型: 痛点页 | 核心概念页 | 流程页 | 对比页 | 金句页 | 数据页 | 分类页 | 速查页 | 行动页 | Thanks页
- 锚点: c-card-warn | c-kpi | c-steps | c-glass | c-formula | ...
- 组件: c-stack(c-card-warn × 2 + c-card-accent × 1) + c-formula
- 字数: ~120 字
- 内容: ...
```

> **页面原型和组件配方**：详见 `references/component-recipes.md`，覆盖 10 种页面原型 + 组件组合 + 密度预算。Step 1 使用此文档决定每页的页面原型和组件组合。

**参考文档**：
- `references/analysis-framework.md` — 详细分析框架
- `references/engagement-analysis.md` — Engagement 驱动分析框架（小红书/社交媒体场景）
- `references/component-recipes.md` — 内容语义 → 页面原型 → 组件配方（含密度预算、溢出处理）
- `references/content-rules.md` — 内容规范
- `references/style-decision-matrix.md` — 信号→design 映射表

### Step 2: 风格决策

**输入**：`outline.md`

**两级决策**：

**Slides 级 — 选择视觉风格**：

**`config.design` 必须是对象，不能用字符串。** 通过 4 个维度自由组合：

- **typography**：`geometric` | `editorial` | `humanist` | `handwritten` | `technical`
- **texture**：`clean` | `paper` | `grid` | `organic` | `pixel`
- **density**：`minimal` | `balanced` | `dense`
- **theme**：36 个颜色主题（`assets/themes/`），如 `minimal-white`、`academic-paper`、`dracula`

```json
"design": { "typography": "editorial", "texture": "clean", "density": "dense", "theme": "minimal-white" }
```

骨架自动加载 layer CSS + `base-design-chrome.css`。

**选择指引**：
| 内容调性 | typography | texture | density | theme |
|---------|-----------|---------|---------|-------|
| 数据报告/白皮书 | editorial | clean | dense | minimal-white |
| 学术论文 | editorial | clean | balanced | academic-paper |
| 商业路演 | geometric | clean | balanced | corporate-clean |
| 技术分享/代码 | technical | grid | balanced | sharp-mono |
| 小红书/社交媒体 | humanist | organic | minimal | soft-pastel |
| 创意/插画风 | handwritten | paper | minimal | warm-cream |

**17 个 Design 概念速查**：`references/dimensions/designs.md` 提供完整映射表（如 `scientific` = editorial + clean + balanced + academic-paper），可直接查表组合。用户可按需覆盖任意维度。

**Slide 级 — 选择渲染引擎**：

| 内容类型 | 推荐引擎 | 产出 |
|---------|---------|------|
| 文字排版 | HTML layout | HTML 片段 |
| 数据图表 | HTML layout（chart-*）| HTML 片段 |
| 代码展示 | HTML layout（code, terminal）| HTML 片段 |
| 架构图/流程图 | SVG diagram | SVG 文件 |
| AI 插图/概念图 | AI image（结构化 prompt 组装） | PNG 图片 |
| 信息图 | AI infographic（结构化 prompt 组装） | PNG 图片 |
| 封面图 | AI cover image（结构化 prompt 组装） | PNG 图片 |
| 分隔页 | HTML layout | HTML 片段 |
| 3:4 手机画布 | Component palette | 组件自由组合（`c-*` classes） |

> **3:4 画布特殊处理**：当目标画布为 3:4（手机端），不推荐使用单一 layout，而是使用 **Component Palette**（`assets/components.css`）自由拼装组件（卡片、步骤、KPI、图标行、警告框等），纵向堆叠填满屏幕。组件大小、字数上限、页面密度等规范见 `references/content-rules-portrait.md`。组合示例见 `references/components.md`。

**产出**：`style-decision.md`，记录每个 slide 的 theme、layout、渲染引擎选择。

**参考文档**：
- `references/dimensions/designs.md` — 17 个 Design 概念 → layer 组合映射表（快速查表）
- `references/themes.md` — 36 个 theme 详情
- `references/layouts.md` — 31 个 layout 详情
- `references/content-rules-portrait.md` — 3:4 画布内容规范（组件大小、字数、密度、layer 用法）
- `references/portrait-user-guide.md` — 3:4 竖版制作指南（组件搭配模式）
- `references/components.md` — 共享组件库（card、step、KPI、quote、table 等）
- `references/style-definitions/` — Design 的结构化生图数据（hex 色值、视觉元素、排版指令）
- `references/prompt-construction.md` — AI 图片结构化 prompt 组装指南
- `references/diagram/` — 4 种架构图类型
- `references/infographic/` — 信息图 layout + style

### Step 3: Review 验证

**输入**：`outline.md` + `style-decision.md`

**处理**：在进入 HTML 渲染前，逐页检查三项，不通过则回 Step 1/2 调整：

1. **自动验证**（`bun scripts/validate-slides.ts --input slides.json`）：
   - Schema 检查：design 名、canvas、slide type 合法性 → **BLOCKER（必须修）**
   - 密度预算：组件数 3-5、字数上限、卡片/步骤数量 → WARN（应该看）
   - 锚点检查：每页是否有视觉重心 → WARN
   - 色彩语义：warn 色卡片是否有对应 accent 色 → WARN
   - Design 兼容：blob/color/chipColor 是否被目标 Design 支持 → INFO（仅供参考）
   > 所有 BLOCKER 项必须 0 才能进入 Step 4。JSON 阶段无法检测 CSS 级联冲突，由 Step 4 的 `polish.ts` 补检。
2. **内容溢出检查** — 组件容量 < 内容量？
   - c-card 正文 > 60 字 → 精简或拆为 2 卡片
   - c-steps > 7 步 → 拆为两页
   - c-icon-row > 10 项 → 拆页或分组
   - c-quote > 40 字 → 只保留核心句
   - 组件总数 > 6 → 拆页
3. **留白过大检查** — 组件 < 3 个？
   - 加 c-badge-row（3-4 标签）、c-note（关键提示）、c-card-soft（补充说明）
   - 或合并到相邻页
4. **风格匹配检查** — Design 的 mood/texture 与内容调性是否冲突？
   - 严肃/学术内容 + 马卡龙/手绘风 → 换 Design 或降 mood
   - 年轻/社交内容 + corporate → 换 Design
   - 数据密集内容 + 极简 Design → 检查组件颜色变体是否够区分信息层级

> 验证标准详见 `references/quality-spec.md`。BLOCKER 项必须 0 才能进入 Step 4。

**产出**：`review.md`，记录每页判定（pass / adjust）和调整决策。

```
# Review

## Slide 1.1: 封面
- 溢出: pass
- 留白: adjust — 加 c-section(c-icon-row × 3) 做目录预告
- 风格: pass

## Slide 1.2: 核心痛点
- 溢出: pass
- 留白: pass
- 风格: pass

## Slide 2.3: 实施路径
- 溢出: adjust — 7 步拆为两页（步骤 1-4 / 5-7）
- 留白: pass
- 风格: pass
```

> Review 不通过则回到对应步骤调整，直到全部 pass 才进入 Step 4。

### Step 4: HTML 渲染

**输入**：`outline.md` + `style-decision.md` + `review.md`

**处理**：
1. 根据 outline.md 和 style-decision.md，整理为结构化 JSON（`slides.json`），包含每页的 type、title、cards、steps 等数据
2. **AI 图片生成**（如有）：使用 `scripts/imagine/prompt-assembler.ts` 自动组装三层结构化 prompt（Layer 1: Image Role → Layer 2: Style Lock → Layer 3: Archetype + Content），或参考 `references/prompt-construction.md` 手动组装。通过 `bun scripts/imagine/main.ts --design <name> --archetype <name> --content "..."` 调用（单张）或 `build-batch.ts`（批量）。Provider、Model 等默认配置通过 `IMAGINE_*` 环境变量或 EXTEND.md 的 `ai_image` 节设置，CLI 参数可覆盖
3. **HTML 组装**：`bun scripts/assemble-deck.ts --input slides.json --output index.html`。脚本自动完成 CSS 加载、Chrome 片段、c-* 组件拼装。`--asset-depth 2` 用于 `examples/` 输出路径
4. **SVG 图**（如有）：直接内联到 slides.json 的 `html` 字段，或 `<img>` 引用
5. 添加 `data-anim` 属性声明动画
6. **QA 质量门禁**（自动）：`assemble-deck.ts` 自动调用 `scripts/visual-qa.ts`（Playwright 10 项检测：溢出、遮挡、留白、间距、对比度、字体层级、Chrome 位置/存在、CSS 变量健康、组件密度）。所有 BLOCKER 项必须为 0 才能进入 Step 5。用户也可随时手动运行：

   ```bash
   bash scripts/qa.sh <deck-name>           # L0 (JSON) + L1 (浏览器)
   bash scripts/qa.sh --all                 # 全量，所有 deck
   ```

   **三级严重度** — 统一标识，看图标就知道要不要停：

   | 图标 | 级别 | 含义 | 行动 |
   |------|------|------|------|
   | ❌ | **BLOCKER** | 客观错误，渲染结果不对 | **必须修**，修到 0 才能往下走 |
   | ⚠️ | **WARN** | 有客观标准，但可以接受 | 看一下，大部分应该修，少量可豁免 |
   | ℹ️ | **INFO** | 主观审美建议 | 参考，觉得有道理就调 |

   **S/A/V 分类标签** — 看前缀知道问题性质：

   | 分类 | 标签 | 说明 |
   |------|------|------|
   | **Structural（结构）** | S1-S5 | 写错了、漏了、冲突了——修 |
   | **Aesthetic（美观）** | A1-A6 | 不好看、不统一、太挤——调整 |
   | **Visual（建议）** | V1-V4 | 可以更好——酌情 |

   完整规则映射表：

   | Tag | 检查 | 级别 | 工具 |
   |-----|------|------|------|
   | S1 | JSON schema | BLOCKER | validate-slides |
   | S2 | CSS cascade 冲突 | BLOCKER | visual-qa |
   | S3 | 元素溢出 | BLOCKER | visual-qa |
   | S4 | 内容完整性 | BLOCKER | visual-qa |
   | S5 | 对比度 / CSS 变量缺失 | BLOCKER | visual-qa |
   | A2 | 字体层级 | WARN | visual-qa |
   | A3 | 组件密度 | WARN | visual-qa |
   | A4 | 字号可读性 | WARN | visual-qa |
   | A5 | Chrome 位置一致 | WARN | visual-qa |
   | A6 | Chrome 存在一致 | WARN | visual-qa |
   | V1 | 留白比例 | INFO | visual-qa |
   | V2 | 视觉重心 | INFO | visual-qa |
   | V3 | 间距均匀 | INFO | visual-qa |
   | V4 | Design 匹配度 | INFO | validate-slides |

   **QA 不通过时的排查流程**：
   1. 看 tag 前缀：S → 代码写错了（修 CSS/JSON），A → 设计参数不对（调密度/字号），V → 主观审美（可酌情跳过）
   2. S2（cascade 冲突）最常见：某个 `position: absolute` 被 `.slide > * { position: relative }` 覆盖 → 改选择器加 `.d-xxx .slide .` 前缀
   3. A3（密度超标）：拆页（>6 组件 → 分两页）或使用 dense density 层（`"density": "dense"`）
   4. 修复后 `bun scripts/assemble-deck.ts --input slides.json --output index.html` 重新生成 → 再跑 QA
   5. 直到 BLOCKER = 0，进入 Step 5

**产出**：一个完整的 `index.html`（可浏览器打开交互演示）+ `polish.css`（`visual-qa.ts` 自动生成的视觉修正）+ QA 报告

**`slides.json` 格式示例**（完整类型定义见 `scripts/assemble/types.ts`）：
```json
{
  "config": {
    "title": "My Deck",
    "canvas": "3:4",
    "author": "Author Name",
    "design": { "typography": "editorial", "texture": "clean", "density": "balanced", "theme": "minimal-white" }
  },
  "slides": [
    {
      "type": "cover",
      "title": "演示文稿标题",
      "subtitle": "副标题或一句话摘要",
      "kicker": "标签文字",
      "chip": "01",
      "chipColor": "mint",
      "blobs": ["b1", "b2"]
    },
    {
      "type": "cards-2x2",
      "title": "核心观点",
      "cards": [
        { "num": "01", "title": "卡片标题", "body": "卡片内容说明", "color": "peach" },
        { "num": "02", "title": "卡片标题", "body": "卡片内容说明", "color": "mint" }
      ]
    },
    {
      "type": "steps",
      "title": "实施路径",
      "steps": [
        { "num": "1", "title": "第一步", "body": "具体描述" },
        { "num": "2", "title": "第二步", "body": "具体描述" }
      ]
    },
    {
      "type": "table",
      "title": "核心指标对比",
      "tableColumns": [
        { "header": "指标", "width": "50%" },
        { "header": "Q4 2025", "align": "right" },
        { "header": "Q1 2026", "align": "right" }
      ],
      "tableRows": [
        ["日活用户", "2.4M", "3.1M"],
        ["转化率", "4.2%", "5.8%"]
      ]
    },
    { "type": "html", "html": "<section class=\"slide is-active\"><!-- 自定义 HTML --></section>" }
  ]
}
```
**`c-table` 自适应**：当 `tableRows` ≥ 10 行时，自动添加 `data-rows` 属性触发字号缩小（10行→82%, 12行→72%, 15行→64%）。`align: "right"` 的列右对齐 + 等宽数字（tabular-nums）。超出 5 列或 15 行建议拆表。

**自由组合 Design 配置示例**：
```json
{
  "config": {
    "title": "数据报告",
    "design": {
      "typography": "editorial",
      "texture": "clean",
      "density": "dense",
      "theme": "minimal-white"
    },
    "canvas": "3:4"
  }
}
```
Slide 类型：`cover` | `section` | `cards-2x2` | `cards-3` | `quote` | `steps` | `code` | `thanks` | `bullets` | `kpi` | `table` | `html`

**关键文件**：
- `scripts/validate-slides.ts` — slides.json 质量验证（Step 3 自动检查）
- `scripts/assemble-deck.ts` — HTML 组装入口（JSON → index.html）
- `scripts/assemble/types.ts` — SlideData、DeckConfig 类型定义
- `scripts/assemble/designs.ts` — Design 模板注册表（per-design 渲染函数）
- `scripts/assemble/slides.ts` — 10 个渲染函数（覆盖 11 种 slide 类型）
- `scripts/assemble/skeleton.ts` — Deck HTML 骨架生成（CSS 加载顺序：fonts → base → components → design → style → polish）
- `scripts/visual-qa.ts` — 统一视觉质量引擎（Playwright 10 项检测：溢出/遮挡/留白/间距/对比度/字体层级/Chrome 一致性/CSS 变量健康/组件密度）
- `scripts/imagine/prompt-assembler.ts` — 三层结构化 prompt 组装引擎
- `scripts/imagine/main.ts` — AI 图片生成入口
- `scripts/imagine/config.ts` — Provider 注册表 + 环境变量默认值
- `assets/base.css` — 设计系统（150行，30+ CSS Variables + layer 变量默认值）
- `assets/components.css` — 共享组件库（cqi + CSS vars，含 c-table 表格组件 + data-rows 自适应）
- `assets/designs/` — Design CSS 预设文件（4 个：pastel-card, white-editorial, xhs-post, hermes-cyber-terminal）
- `assets/layers/` — Layer CSS 系统（typography 5 + texture 5 + density 3），自由组合
- `assets/base-design-chrome.css` — 自由组合模式的最简 chrome 默认样式
- `assets/runtime.js` — 交互引擎（960行，slide 切换、键盘导航、presenter 模式）
- `scripts/editor-server.ts` — 可视化编辑服务器（Bun HTTP + 注入 editor.js/editor.css）
- `assets/editor.js` — 编辑器客户端（选中、编辑、浮动工具栏、CSS 积累、保存）
- `assets/editor.css` — 编辑器 UI 样式（工具栏、选中框、画布外框）

**参考文档**：
- `references/authoring-guide.md` — HTML 编写指南
- `references/presenter-mode.md` — Presenter 模式
- `references/animations.md` — 动画系统
- `references/html-engine.md` — HTML 渲染引擎详解
- `references/ai-visuals.md` — AI 视觉内容生成
- `references/prompt-construction.md` — AI 图片结构化 prompt 组装（三层结构 + Image-1 Anchor Chain）
- `references/components.md` — 组件调色板（3:4 自由拼装）

### Step 4b: AI 视觉抛光（可选）

当自动生成的 deck 需要精细化视觉调整时，在 Step 4 后执行。AI 抛光与自动 QA 互补：
- **自动 QA**（`visual-qa.ts`）：处理可量化的客观问题（溢出、对比度、密度、层级）
- **AI 抛光**：处理主观审美问题（视觉平衡、强调权重、节奏感）

**执行方式**：

1. **逐页审视**：打开生成的 `index.html`，逐页检查以下维度：

   | 维度 | 检查项 |
   |------|--------|
   | 视觉重心 | 页面焦点是否明确？最重要的信息是否视觉最突出？ |
   | 留白节奏 | 上下半页重量是否平衡？边缘是否太挤或太空？ |
   | 强调层级 | 标题 → 副标题 → 正文的视觉权重递减是否清晰？ |
   | 颜色协调 | accent 色使用是否克制（≤3 处/页）？彩色卡片是否区分度足够？ |
   | 排版微调 | 中英文混排间距、标点悬挂、列表缩进是否舒适？ |

2. **追加 polish.css**：所有调整以 CSS 追加到 `polish.css`，不修改 HTML 结构。例如：
   ```css
   /* slide 3: 右侧卡片过重，增加左边距平衡 */
   .slide:nth-child(3) .c-card:first-child { margin-right: 1cqi; }
   /* slide 5: 标题字号过大，微调 */
   .slide:nth-child(5) .chr-heading { font-size: 5.5cqi !important; }
   ```

3. **约束**：
   - 只追加 CSS，不修改 HTML 结构（保护内容完整性）
   - 每页不超过 5 条 CSS 规则（避免过度润色）
   - 使用 `.slide:nth-child(N)` 限定作用域（避免跨页泄漏）
   - 颜色值优先使用 CSS 变量而非硬编码（保持 Design 可移植性）

### Step 4c: 可视化编辑器（可选）

当用户需要在浏览器中直接可视化微调时，启动编辑服务器：

```bash
bun scripts/editor-server.ts <html-file> [--port 3456]
```

浏览器自动打开，按 **E** 进入编辑模式：

| 操作 | 方式 |
|------|------|
| 选中元素 | 点击（支持全部 c-*/chr-* 组件 + HTML 文本 + img/svg） |
| 编辑文字 | 双击进入 contenteditable，Escape 退出 |
| 字号/加粗/颜色 | 选中文本元素后使用浮动工具栏 |
| 内距/背景色 | 选中容器元素后使用浮动工具栏 |
| 间距 | 选中布局元素（c-row/c-grid）后使用浮动工具栏 |
| 移动 | 浮动工具栏 ←→↑↓（每次 8px，transform: translate） |
| 删除 | 浮动工具栏 ✕ 或 Delete 键 |
| 翻页 | 方向键 ←→ |
| 保存 | ⌘S（视觉调整 → polish.css，内容修改 → slides.json） |
| 撤销 | ⌘Z（内存中最近 50 步） |
| 退出编辑 | E 键 |

**双轨保存**：CSS 类修改（字号、颜色、间距、位置）写入 `polish.css`；内容类修改（文字、删除）写入 `slides.json` 并重新组装 HTML。首次启动自动备份 `polish.css.bak` + `slides.json.bak`。

**编辑日志**：所有操作记录到 `edit-log.jsonl`，供后续 skill 改进参考。

### Step 5: 导出

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

# 单页快速预览（调试用，只渲染第 5 页，<10秒）
bun scripts/render-precise.ts <index.html> --slide 5 --canvas 3:4

# 渲染后检测文字溢出
bun scripts/render-precise.ts <index.html> --check-overflow
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

> 上表为 16:9 画布的 31 个 single-page layout。3:4 画布使用 assemble-deck 的 12 种 slide 类型（cover, section, cards-2x2, cards-3, quote, steps, code, thanks, bullets, kpi, table, html），见 Step 4 的 slides.json 格式。

## 画布适配：16:9 与 3:4

Pipeline 一开始就确定画布比例，两种画布采用不同策略：

### 16:9 画布（默认）

使用 `templates/deck.html` 骨架 + `templates/single-page/` 中的 layout。
默认 `.slide{ padding:72px 96px; justify-content:center }`，适合横向宽屏。

### 3:4 画布（手机端）

**一步切换**：在 `<body>` 上加 `class="portrait"` 即可。assemble-deck.ts 在 `canvas: "3:4"` 时自动添加。

`.portrait` 自动完成：
- Deck 约束为 3:4 比例（`min(100vw, 100vh * 3/4)`）
- 启用 Container Query（`container-type: inline-size`），`cqi` 单位等比缩放
- Slide 默认 `padding: 4.5cqi; justify-content: flex-start`（内容从上排列）

**内容策略**：3:4 不推荐使用单一 layout 模板。改用 **Component Palette**（`assets/components.css`），通过 `c-stack`、`c-row`、`c-card`、`c-steps`、`c-table` 等组件自由拼装，纵向堆叠填满屏幕。搭配 `dense` density 层可获得更紧凑的排版。详见 `references/components.md`。

**导出**：`bun scripts/render-precise.ts --canvas 3:4` 渲染为 810×1080 @2x。

### 窄视口兜底

`base.css` 内置两层兜底，当 deck 在窄视口下自动触发（无需手动加 class）：
1. `@container (max-width: 1000px)` — 容器查询，cqi 字号/间距缩放（主要路径）
2. `@media (max-width: 900px)` — 视口查询，px 字号缩小 + grid 降级（旧浏览器兜底）

## 交互快捷键

生成的 HTML deck 支持键盘翻页、theme/animation 切换、全屏、概览网格、Presenter 模式。详见 `references/keyboard-shortcuts.md`。

## EXTEND.md 扩展

用户可在 `EXTEND.md` 中自定义：
- **defaults**：默认 design、theme、字体、动画、导出偏好、AI 图片 provider
- **brand**：Logo、品牌色、页脚
- **slides-structure**：自定义 slides 页面序列模式
- **custom-themes/layouts/components**：扩展视觉和布局
- **ai-image**：默认图片生成 provider 和参数

详见 `EXTEND.md`。
