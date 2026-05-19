---
name: slides-card
description: >
  Build 3:4 portrait social-media image cards, 小红书图文, mobile-friendly
  slides from any document. Use whenever the user asks to create 小红书, 图文,
  卡片, social posts, image cards, 做图文, 做成卡片, or any portrait-format
  mobile-friendly presentation. Pipeline: content analysis → style decision →
  L0 validation → HTML assembly → L1 QA gate (18 groups) → repair → export.
  QA at every gate: BLOCKER (must fix) / WARN (should review).
---

# slides-card — 3:4 图文卡片（小红书/手机端）

流水线：**内容分析 → 风格决策 → L0 验证 → HTML 渲染 → L1 QA 门禁 → 修复循环 → 可视化微调 → 导出**

可视化编辑器：生成的 HTML 自带编辑器，**浏览器直接打开**，按 **E** 所见即所得地编辑。

## 核心约束

1. canvas 固定 `3:4`（portrait），body class `portrait`
2. 使用 assemble-deck 的 14 种 slide type（`cover`/`section`/`cards-2x2`/`cards-3`/`quote`/`steps`/`code`/`thanks`/`bullets`/`kpi`/`table`/`html`/`layout`/`article`），`code`/`steps`/`table` 等在 3:4 下均可正常渲染。`article` 是异构垂直堆叠（badge-para + icon-card + quote-bar + numbered-list + pill-tags 自由混合）。**禁止直接复制 `templates/single-page/` 下的 HTML 文件**（two-column、chart-bar、gantt、timeline 等是 16:9 宽屏布局，放到 3:4 会变形）
3. 所有视觉样式收归 Design CSS，页面 HTML 只负责结构和内容
4. QA 门禁：L0 渲染前（validate-slides），L1 渲染后（visual-qa 18 项），BLOCKER > 0 阻塞

## Pipeline

### Step 1: 内容分析

解析文档 → 章节划分 → 页数推算 → 信号检测（匹配 design）。

**页数**：< 500 字 3-5 页，500-1500 字 5-8 页，> 1500 字 8-12 页。

**产出**：`outline.md`，每页含组件规划表（先分析语义，再查 `../../references/component-recipes.md` 选组件）。

### Step 2: 风格决策

**Slides 级**：`config.design` 必须是对象。两种路线：

**轻装路线**（Theme only）— 4 维自由组合，只换颜色不加 Chrome 壳层：
- **typography**：`geometric` | `editorial` | `humanist` | `handwritten` | `technical`
- **texture**：`clean` | `paper` | `grid` | `organic` | `pixel`
- **density**：`minimal` | `balanced` | `dense`
- **theme**：36 个颜色主题（`../../assets/themes/`）

**品牌路线**（Design CSS）— 完整视觉皮肤（Chrome + 卡片背景 + 阴影 + 装饰 + 组件覆盖）：
- **3:4 原生**：`pastel-card` | `white-editorial` | `xhs-post`
- **通用**：`news-broadcast` | `testing-safety-alert` | `blueprint` | `course-module` | `weekly-report` | `obsidian-gradient` | `hermes-cyber-terminal` | `tech-sharing` | `pitch-deck` | `product-launch` | `graphify` | `minimal`
- JSON 中必须有 `"design": "xxx"` 键才能加载 Design CSS。只写 `"theme"` 会 fallback 到基础样式

```json
// ✅ 品牌路线 — 激活 Design CSS
{ "design": "pastel-card", "typography": "geometric", "density": "balanced" }

// ❌ 错误 — 只有 theme，不会加载 Design CSS
{ "theme": "pastel-card", "typography": "geometric" }
```

**Slide 级**：使用 `c-*` 组件拼装（c-card、c-steps、c-kpi、c-icon-row、c-badge-row、c-warn 等）。`article` 类型使用 5 种异构块（badge-para、icon-card、quote-bar、numbered-list、pill-tags）。

**产出**：`style-decision.md`。

### Step 3: L0 验证

```bash
bun ../../scripts/validate-slides.ts --input slides.json
```

检查 Schema、密度预算（3-6 组件）、字数上限（卡片 ≤ 25 字）、Design 兼容。BLOCKER > 0 阻塞。

### Step 4: HTML 渲染

整理 `slides.json`（见格式示例），然后：

```bash
bun ../../scripts/assemble-deck.ts --input slides.json --output index.html
```

脚本自动完成 CSS 内联、Chrome 片段、c-* 组件拼装。Slide 类型：`cover` | `section` | `cards-2x2` | `cards-3` | `quote` | `steps` | `code` | `thanks` | `bullets` | `kpi` | `table` | `html` | `layout` | `article`

**图片支持**：SlideData 原生 `image` 字段，支持 hero/background/inline 三种模式。

渲染后必须运行 L1 QA：

```bash
bun ../../scripts/qa.ts --check --deck <name>
```

BLOCKER > 0 → Step 5 修复循环。

**`slides.json` 格式**：
```json
{
  "config": { "title": "标题", "canvas": "3:4", "design": { "typography": "editorial", "texture": "clean", "density": "balanced", "theme": "minimal-white" } },
  "slides": [
    { "type": "cover", "title": "标题", "subtitle": "副标题", "image": { "src": "imgs/hero.png" }, "imageMode": "hero" },
    { "type": "cards-2x2", "title": "核心观点", "cards": [{ "num": "01", "title": "卡片", "body": "内容", "color": "peach", "image": "imgs/card.png" }] },
    { "type": "steps", "title": "步骤", "steps": [{ "num": "1", "title": "第一步", "body": "描述", "image": "imgs/step.png" }] },
    { "type": "article", "title": "干货分享", "blocks": [
      { "type": "badge-para", "label": "核心观点", "body": "一段详细的解释文字..." },
      { "type": "icon-card", "icon": "🔍", "title": "调研方法", "body": "描述文字" },
      { "type": "quote-bar", "text": "引述一段重要观点" },
      { "type": "numbered-list", "items": [{ "keyword": "第一", "body": "要点" }] },
      { "type": "pill-tags", "tags": ["标签1", "标签2", "标签3"] }
    ] }
  ]
}
```

### Step 5: 修复循环

分类 → 修 slides.json 或 style.css → reassemble → re-QA → 确认 BLOCKER = 0。

常见修复：occlusion（加 --slide-pad-bottom）、contrast（调 text-3 色值）、whitespace（加 c-badge-row 兜底）、canvas-fill（v-distribute 或底部组件）。

### Step 6: 可视化微调

浏览器打开 `index.html`，按 **E** 编辑。⌘S 保存。

### Step 7: 导出

```bash
bun ../../scripts/render-precise.ts index.html --canvas 3:4 --slides auto --output ./png-out/
```

@2x Retina 输出 1620×2160 PNG。

## 3:4 画布关键差异

`.portrait` 自动完成：deck 约束 3:4 比例、Container Query 缩放、slide 默认 `padding:4.5cqi;justify-content:flex-start`。

内容策略：`c-stack` 纵排 + `c-grid-2` 两列 + `c-row` 横行（自动纵排）。`v-half` 限制横向组件最大 55% 高度。`v-fill` 撑满剩余空间。`v-distribute` 均匀分布。

## 核心参考

- `../../references/content-rules-portrait.md` — 3:4 内容规范（组件大小、字数、密度）
- `../../references/portrait-user-guide.md` — 竖版制作指南
- `../../references/component-recipes.md` — 10 种页面原型 + 组件配方 + 内容语义 → 组件查表
- `../../references/components.md` — 组件库参考
- `../../references/ai-visuals.md` — AI 图片生成 → 用 slides-imagine
- `../../references/design-guidelines.md` — 设计指南
- `../../references/glossary.md` — 术语表
