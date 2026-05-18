---
name: slides-on
description: >
  Build presentation slides, PPT, slide decks, 演示文稿, keynotes, 小红书图文, or
  image cards from any document. Use this whenever the user asks to create slides,
  做PPT, 做演示文稿, 做slides, 帮我做个汇报, 整理成图文, 做成小红书, 生成图文,
  make a deck, generate a PPT, weekly report, pitch deck, 周报, 提案, 分享,
  or any document-to-slides task — even if they don't say "slides" explicitly
  (e.g. "帮我整理一下这个文档", "把这篇做成卡片"). One pipeline: content analysis
  → style decision → review → L0 validation → HTML rendering → L1 QA gate (18 groups) → repair loop → export.
  QA at every gate: BLOCKER (must fix) / WARN (should review) / INFO (suggestion).
---

# slides-on — 统一演示文稿制作

流水线：**内容分析 → 风格决策 → L0 验证 → HTML 渲染 → L1 QA 门禁 → 修复循环 → 可视化微调 → 导出**。QA 嵌入每一步，不只在最后一关。

可视化编辑器是核心功能——生成的 HTML 自带编辑器，**直接浏览器打开**，按 **E** 所见即所得地调字号、颜色、间距、位置。保存通过 File System Access API 直接写文件，无需 server。

## 核心约束

1. Pipeline 严格按序执行，不可跳步。每步产出写入工作目录
2. AI 图片生成使用 prompt 文件机制，保证可复现
3. 所有视觉样式收归 Design CSS，页面 HTML 只负责结构和内容
4. **QA 门禁**：L0 在渲染前（validate-slides），L1 在渲染后（visual-qa 18项检测），BLOCKER > 0 阻塞，进入修复循环直到 0

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

**产出**：`outline.md`（slides 结构大纲）。每页必须包含**组件规划表**，先分析内容语义，再按 `references/content-planning.md` 查表选组件，最后填内容：

```markdown
# Slides: <标题>

## Cover
- 标题: ...
- 副标题: ...
- 作者: ...

## Section 1: <章节名>

### Slide 1.1: <页面标题>

**核心信息**：一句话描述本页要传达的核心观点

**内容语义**：痛点/数据/流程/对比/代码/金句/封面/章节/行动/结尾（10选1，查 `references/content-planning.md`）

**组件规划**：
| 位置 | 组件 | 作用 | 内容描述 | 字数 |
|------|------|------|---------|------|
| top | c-card-warn | 痛点1 | ... | ≤25字 |
| mid | c-card-warn | 痛点2 | ... | ≤25字 |
| mid | c-card-accent | 方案预告 | ... | ≤20字 |
| bottom | c-badge-row | 关键词 | 3-5标签 | — |

**排列模式**：堆叠（查 `content-planning.md` 对应 ASCII 图）
**预检**：组件 N 个（3-6 ✓），总字数 ~XX（< 上限），预估填充率 OK
```

> **页面原型和组件配方**：详见 `references/component-recipes.md`，覆盖 10 种页面原型 + 组件组合 + 密度预算。Step 1 使用此文档决定每页的页面原型和组件组合。

**参考文档**：
- `references/analysis-framework.md` — 详细分析框架
- `references/engagement-analysis.md` — Engagement 驱动分析框架（小红书/社交媒体场景）
- `references/component-recipes.md` — 内容语义 → 页面原型 → 组件配方（含密度预算、溢出处理）
- `references/content-planning.md` — **内容语义 → 组件组合 → 排列模式** 决策表（10种 × ASCII示意图 + 预检清单）
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

### Step 3: L0 验证（渲染前）

**输入**：`slides.json`

**处理**：在 HTML 渲染前，自动验证结构、预算和内容约束。**BLOCKER > 0 则阻塞，回 Step 1/2 调整，直到 0 才进入 Step 4。**

1. **自动验证**（`bun scripts/validate-slides.ts --input slides.json`）：
   - Schema 检查：design 名、canvas、slide type 合法性 → **BLOCKER（必须修）**
   - 密度预算：组件数 3-6（portrait）/ 2-6（landscape）→ WARN
   - 字数上限：单卡片正文 ≤ 25字（portrait）/ ≤ 40字（landscape）→ WARN
   - 锚点检查：每页是否有视觉重心 → INFO
   - Design 兼容：blob/color/chipColor 是否被目标 Design 支持 → INFO

2. **内容溢出检查**（参考 `references/content-planning.md` 预检清单）：
   - 组件总数 > profile.componentMax → 拆页或精简
   - 组件总数 < profile.componentMin → 加 c-badge-row/c-note/c-card-soft
   - c-steps > 4 步（portrait）/ > 7 步（landscape）→ 拆为两页
   - c-quote > 35字 → 只保留核心句
   - 底部无填充组件 → 加 c-badge-row 或 c-note 兜底

3. **风格匹配检查**：Design 的 mood/texture 与内容调性是否冲突？
   - 严肃/学术内容 + 马卡龙/手绘风 → 换 Design
   - 数据密集内容 + 极简 Design → 检查颜色变体够不够

**产出**：`review.md`，记录每页判定（pass / adjust）和调整决策。格式：

```
# Review

## Slide 1.1: 封面
- 组件数: pass (4)
- 溢出: pass
- 留白: pass
- 风格: pass

## Slide 1.2: 核心痛点
- 组件数: pass (4)
- 溢出: pass
- 留白: adjust — 底部加 c-badge-row 兜底
- 风格: pass

## Slide 2.3: 实施路径
- 组件数: adjust — 5 步拆为两页（步骤 1-3 / 4-5）
- 溢出: pass
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
6. **L1 QA 质量门禁**（渲染后自动运行）：HTML 产出后，**必须**运行：

   ```bash
   bun scripts/qa.ts --check --deck <deck-name>
   ```

   **18 组检测**（`scripts/visual-qa.ts`），自动适配 portrait/landscape 画布：

   | # | 检测组 | BLOCKER 触发条件 |
   |---|--------|-----------------|
   | 1 | text-overflow | scrollHeight > clientHeight |
   | 2 | occlusion | 元素交叉 > 10% |
   | 3 | whitespace | 填充率 < fillMin（portrait 45%, landscape 20%）|
   | 4 | spacing | 同类型间距方差 > 50% |
   | 5 | contrast | 文字色 vs 背景 < WCAG AA 阈值 |
   | 6 | font-hierarchy | 字号层级倒挂或跨页不一致 |
   | 7-8 | chrome-position/presence | 位置漂移 > 2px / 部分页缺失 |
   | 9 | css-var-health | 关键 CSS 变量未定义 |
   | 10 | density | 组件 < min 或 > max |
   | 11 | chrome-content-boundary | chr-topbar/footer 与内容重叠 |
   | 12 | canvas-fill | 底部空白 > 25%（仅 portrait）|
   | 13 | font-unit | px 字号 < 最小 cqi（仅 portrait）|
   | 14 | css-loading-integrity | body class 与 design CSS 不匹配 |
   | 15 | grid-collapse | g3/g4 未 collapse（仅 portrait）|
   | 16 | chrome-z-index | chr-* absolute 被全局规则覆盖 |
   | 17 | font-container-ratio | 字体/容器宽度比低于组件类型舒适区 |
   | 18 | inline-row-wrap | badge-row/icon-row 意外换行 |

   **三级严重度**：

   | 图标 | 级别 | 含义 | 行动 |
   |------|------|------|------|
   | ❌ | **BLOCKER** | 客观错误 | **必须修到 0**，否则阻塞导出 |
   | ⚠️ | **WARN** | 有标准但可接受 | 大部分应修 |
   | ℹ️ | **INFO** | 主观建议 | 酌情处理 |

   **BLOCKER > 0 → 进入 Step 6 修复循环。**

QA 通过后，**直接在浏览器打开 `index.html`** 即可微调。页面顶部会显示 "按 E 进入可视化编辑模式" 提示（10 秒后自动消失）。按 **E** 进入编辑模式。

**保存机制**（无需 server）：
- Chrome/Edge：首次 ⌘S 弹出对话框选择 deck 目录，之后自动写入 `index.html`
- Firefox/Safari：保存时自动下载 `index.html`，手动替换即可
- 如需编辑日志或 slides.json 回写，可启动 `bun scripts/editor-server.ts <index.html>`

微调完成后，进入 Step 5 导出。

**产出**：一个自包含的 `index.html`（所有 CSS/JS 内联，可直接浏览器打开交互演示和编辑）+ QA 报告

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
      "blobs": ["b1", "b2"],
      "image": { "src": "imgs/hero.png", "alt": "封面插图" },
      "imageMode": "hero"
    },
    {
      "type": "cards-2x2",
      "title": "核心观点",
      "cards": [
        { "num": "01", "title": "卡片标题", "body": "卡片内容说明", "color": "peach", "image": "imgs/card1.png" },
        { "num": "02", "title": "卡片标题", "body": "卡片内容说明", "color": "mint" }
      ]
    },
    {
      "type": "steps",
      "title": "实施路径",
      "steps": [
        { "num": "1", "title": "第一步", "body": "具体描述", "image": "imgs/step1.png" },
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
Slide 类型：`cover` | `section` | `cards-2x2` | `cards-3` | `quote` | `steps` | `code` | `thanks` | `bullets` | `kpi` | `table` | `html` | `layout`

**图片支持**：SlideData 原生支持图片，无需 `type: "html"` 手写 `<img>`：

| 层级 | 字段 | 说明 |
|------|------|------|
| Slide 级 | `image` + `imageMode: "hero"` | 封面/章节页大图，占 40-55% 内容区，在标题与副标题之间 |
| Slide 级 | `image` + `imageMode: "background"` | 全页背景图，绝对定位在内容后面 |
| Card 内 | `card.image` | 渲染在卡片标题上方，Design 感知样式（圆角/阴影/边框） |
| Step 内 | `step.image` | 渲染在步骤号和内容之间 |
| Bullet 内 | `bullet.image` | 替代文本 icon，渲染为图片 |

`SlideImage` 类型：`{ src: string; alt?: string; fit?: "cover" | "contain" }`。各 Design 的 `image` variant 控制图片圆角、阴影、边框（如 pastel-card 大圆角 + 阴影，hermes-cyber-terminal 无圆角 + 终端边框）。

**关键文件**：
- `scripts/validate-slides.ts` — slides.json 质量验证（Step 3 自动检查）
- `scripts/assemble-deck.ts` — HTML 组装入口（JSON → index.html）
- `scripts/assemble/types.ts` — SlideData、DeckConfig 类型定义
- `scripts/assemble/design-manifests/` — DesignManifest JSON 定义（5 个：base, pastel-card, white-editorial, xhs-post, hermes-cyber-terminal）
- `scripts/assemble/manifest-loader.ts` — DesignManifest 加载与校验
- `scripts/assemble/design-renderer.ts` — 泛型 variant 渲染器（card/step/code/quote/chrome/image）
- `scripts/assemble/slides.ts` — 12 个渲染函数（覆盖 13 种 slide 类型）
- `scripts/assemble/skeleton.ts` — Deck HTML 骨架生成（所有 CSS/JS 内联为自包含单文件）
- `scripts/visual-qa.ts` — 统一视觉质量引擎（Playwright 18 项检测，dual profile）
- `scripts/qa.ts` — 统一 QA CLI（--plan / --check / --regress / --baseline）
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
- `assets/editor.js` — 编辑器客户端（选中、编辑、浮动工具栏、CSS 积累、FSA 保存 / 下载兜底）
- `assets/editor.css` — 编辑器 UI 样式（工具栏、选中框、画布外框，演示模式下自动隐藏）

**参考文档**：
- `references/authoring-guide.md` — HTML 编写指南
- `references/presenter-mode.md` — Presenter 模式
- `references/animations.md` — 动画系统
- `references/html-engine.md` — HTML 渲染引擎详解
- `references/ai-visuals.md` — AI 视觉内容生成
- `references/prompt-construction.md` — AI 图片结构化 prompt 组装（三层结构 + Image-1 Anchor Chain）
- `references/components.md` — 组件调色板（3:4 自由拼装）

### Step 6: 修复循环

QA 报告有 BLOCKER 或需要处理的 WARN 时，进入结构化修复循环。

**修复分类**：

| 问题类型 | 典型检测组 | 修复方法 |
|---------|-----------|---------|
| **结构错误** | occlusion, chrome-content-boundary, chrome-z-index | 增 --slide-pad-bottom、调 footer bottom、改 chr-* z-index |
| **内容溢出** | text-overflow, whitespace(BLOCKER) | 精简文字、拆分 slide、减小组件数 |
| **对比度不足** | contrast | 改 --text-3 色值、调 badge 配色（good/warn/bad） |
| **字体问题** | font-unit, font-container-ratio, font-hierarchy | 移除内联 px、改用 --c-* token、提升 cqi 值 |
| **密度问题** | density | 组件太多→拆页（> profile.componentMax → 两页）；组件太少→加 c-badge-row/c-note/c-card-soft |
| **填充不足** | whitespace(BLOCKER), canvas-fill | 加底部组件、改用 v-distribute、增加内容 |
| **布局异常** | grid-collapse, inline-row-wrap | 减小 badge 字号、加 nowrap、减 g3/g4 列数 |

**修复循环流程**：

1. **分类**：读 QA 报告，按上表分类每个 ❌/⚠️
2. **修复**：改 slides.json（内容/结构）或 style.css（样式/覆盖）
3. **重新组装**：`bun scripts/assemble-deck.ts -i slides.json -o index.html`
4. **重新 QA**：`bun scripts/qa.ts --check --deck <name>`
5. **确认**：BLOCKER 数量 ≤ 修复前，目标 → 0
6. **重复**：直到 BLOCKER = 0，进入 Step 7 微调

> **关键原则**：修一个问题 → reassemble → re-QA。不要批量修完再 QA，否则不知道哪个修改引入新问题。

### Step 4 后续：可视化微调

QA 通过（BLOCKER = 0）后，slides 已生成并可用，但通常需要微调。有两种方式，**优先使用可视化编辑器**：

#### 方式 A：可视化编辑器（推荐，直接打开 HTML）

生成的 HTML 已内嵌编辑器，**直接在浏览器中打开 `index.html`**，按 **E** 进入编辑模式：

- 首次保存时弹出对话框，选择包含 index.html 的目录授权写入（Chrome/Edge）
- 之后 ⌘S 直接写入 `index.html`，无需再次授权
- 不支持 File System Access API 的浏览器（Firefox/Safari）自动下载文件

如需 server 额外功能（编辑日志、slides.json 回写），可启动：
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
| 保存 | ⌘S（视觉调整 → index.html，内容修改 → slides.json） |
| 撤销 | ⌘Z（内存中最近 50 步） |
| 退出编辑 | E 键 |

**双轨保存**：CSS 类修改（字号、颜色、间距、位置）写入 index.html 的 `<style id="editor-overrides">` 块；内容类修改（文字、删除）写入 `slides.json` 并重新组装 HTML。首次保存自动备份 `index.html.bak` + `slides.json.bak`。

**编辑日志**：所有操作记录到 `edit-log.jsonl`，供后续 skill 改进参考。

**重要**：编辑器生成的规则注入 `<style id="editor-overrides">`，标注 `/* [editor] */`，与 visual-qa.ts 自动生成的 `<style id="qa-fixes">` 规则共存。

#### 方式 B：AI 视觉抛光（备选）

当编辑器不方便使用时，由 AI 逐页审视并直接在 index.html 中内联修改。AI 抛光与自动 QA 互补：
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

2. **修改 HTML**：所有调整直接写入 `index.html` 的 `<style id="editor-overrides">` 块，或直接修改 DOM 元素的 style 属性。例如：
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
