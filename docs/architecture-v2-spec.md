# slides-on v2 Architecture Spec

## 1. 概述

slides-on v2 对齐 OpenDesign 的"Agent 直接输出 HTML"模式，去掉 v1 中的 assemble 中间层（slides.json → assemble-deck → HTML）。Claude 根据内容分析和风格决策，直接编写完整的单文件 HTML，然后通过简化后的 render-precise.ts 导出 PNG/PPTX/PDF。

### 1.1 核心公式

```
Slides = Content × Design (× Export)

Content  = Claude 分析源文档 → outline.md → 直接写 HTML
Design   = Design CSS / Theme CSS（不变）
Export   = render-precise.ts → PNG | html-to-pptx.ts → PPTX | merge-to-pdf.ts → PDF
```

### 1.2 与 v1 的关键差异

| 维度 | v1 | v2 |
|------|-----|-----|
| 中间格式 | slides.json | 无 |
| HTML 生成 | assemble-deck.ts 机械拼装 | Claude 直接编写 |
| 验证 | L0(validate-slides) + L1(visual-qa) 门禁 | 自检清单 |
| 编辑器 | 内嵌 editor.js | 无 |
| 控制力 | JSON Schema 约束 → 损失细节 | 直接 HTML → 完全控制 |

## 2. Pipeline

```
Step 1: 内容分析   →  outline.md
Step 2: 风格决策   →  style-decision.md
Step 3: 编写 HTML  →  index.html（单文件，CSS/JS 全部内联）
Step 4: 自检       →  对照 checklist 逐项确认
Step 5: 导出       →  PNG / PPTX / PDF
```

### 2.1 Step 1: 内容分析

同 v1。解析文档 → 章节划分 → 页数推算 → 信号检测。

产出 `outline.md`：
- slides-card: 每页含内容要点 + 推荐组件组合（查 component-recipes.md）
- slides-ppt: 每页含 Action Title + 推荐 layout + 内容要点

### 2.2 Step 2: 风格决策

同 v1。产出 `style-decision.md`：

slides-card:
- 品牌路线：选定 Design CSS（pastel-card / white-editorial / xhs-post 等）
- 轻装路线：typography + texture + density + theme 四维组合

slides-ppt:
- typography + texture + density + theme 四维组合
- 或 preset 字符串

### 2.3 Step 3: 编写 HTML

Claude 直接编写完整单文件 HTML。**这是 v2 的核心变化。**

**必须遵守的规则：**

1. **单文件自包含**：所有 CSS/JS 内联到 HTML 中，无外部依赖
2. **引用资产文件时，将其内容内联**：读取 `assets/fonts.css`、`assets/base.css`、`assets/components.css`、`assets/designs/{name}.css`、`assets/themes/{name}.css`、`assets/runtime.js` 的内容，直接写入 `<style>` / `<script>` 标签
3. **HTML 结构约定**：
   - slides-card: `<body class="d-{name} portrait">` + `.deck` 容器 + 每页一个 `<section class="slide">`
   - slides-ppt: `<body class="landscape">` + `.deck` 容器 + 每页一个 `<section class="slide">`
4. **使用 c-* 组件 class**（c-card、c-steps、c-kpi、c-grid-2 等），语义同 components.css 定义
5. **3:4 下严禁 px 字号**，必须使用 cqi 单位
6. **16:9 下标题不换行**，字号使用 px（base.css 默认体系）

**slides-card HTML 模板骨架：**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{标题}</title>
<style>
  /* fonts.css 内联 */
  /* base.css 内联 */
  /* components.css 内联 */
  /* designs/{name}.css 内联 */
</style>
</head>
<body class="d-{name} portrait">
<div class="deck">
  <section class="slide is-active">
    <!-- c-* 组件直接写在这里 -->
  </section>
  <!-- more slides -->
</div>
<script>
  /* runtime.js 内联（仅翻页导航等基础功能） */
</script>
</body>
</html>
```

**slides-ppt HTML 模板骨架：**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{标题}</title>
<style>
  /* fonts.css 内联 */
  /* base.css 内联 */
  /* components.css 内联（如需 c-* 组件） */
  /* themes/{name}.css 内联 */
  /* animations/animations.css 内联（如需） */
</style>
</head>
<body class="landscape">
<div class="deck">
  <section class="slide is-active">
    <!-- single-page layout 结构或 c-* 组件 -->
  </section>
  <!-- more slides -->
</div>
<script>
  /* runtime.js 内联 */
</script>
</body>
</html>
```

### 2.4 Step 4: 自检

Claude 生成 HTML 后，对照 `references/self-check-checklist.md` 逐项自检。不通过则回到 Step 3 修改 HTML。

自检分为通用项和场景专属项：

**通用项（卡片 + PPT 都检查）：**
- [ ] 每页有明确的标题/视觉重心
- [ ] 组件数 3-6（无留白过大或过密）
- [ ] 文本无溢出（不超出 slide 边界）
- [ ] 颜色对比度 ≥ 4.5:1（正文 vs 背景）
- [ ] CSS 变量全部有定义（--bg、--text-1、--accent 等）
- [ ] HTML 能直接在浏览器打开且正确渲染

**slides-card 专属：**
- [ ] 3:4 比例正确
- [ ] 所有字号使用 cqi，无 px
- [ ] 卡片正文 ≤ 60 字
- [ ] 底部无大面积空白（填充率 > 45%）
- [ ] 原文信息完整保留（无遗漏关键内容）

**slides-ppt 专属：**
- [ ] 标题 ≤ 10 字，单行不换行
- [ ] Ghost Deck Test 通过（仅读标题能串成完整论点）
- [ ] 代码 ≤ 20 行
- [ ] 正文 ≥ 18px（投影仪可读）

### 2.5 Step 5: 导出

```bash
# PNG（slides-card 和 slides-ppt 通用）
bun scripts/render-precise.ts index.html --canvas 3:4 --selector .slide

# PPTX（仅 slides-ppt）
bun scripts/html-to-pptx.ts index.html --output deck.pptx

# PDF（拼合 PNG）
bun scripts/merge-to-pdf.ts png-out/ --output deck.pdf
```

## 3. render-precise.ts 简化

### 3.1 简化前（v1）

```
解析 CLI → 加载 HTML → probePage 探测 slideCount / navMode
→ 新建 context → 逐页 goto + hash/query 导航 + 等字体 + 等动画
→ 截图 .slide.is-active → 输出
```

### 3.2 简化后（v2）

```
解析 CLI → 加载 HTML → page.$$(selector) 获取所有目标元素
→ 逐元素截图（直接对 elementHandle，无需页面导航）
→ 输出
```

### 3.3 CLI 参数

```
bun scripts/render-precise.ts <input.html> [options]

Options:
  --canvas PRESET|WxH    画布尺寸（默认 16:9）
  --dsf N                deviceScaleFactor（默认 2）
  --selector SEL         目标元素选择器（默认 .slide）
  --format png|jpeg      输出格式（默认 png）
  --output DIR           输出目录（默认 {input}-png/）
  --verbose              详细日志
```

### 3.4 去掉的功能

- `--slides auto|N`（始终遍历 selector 匹配的所有元素）
- `--slide N`（不再支持单页渲染；如需单页，用 --selector 限制范围）
- `--wait-animations`（截图前统一等待动画完成）
- `--extra-delay`（同 wait-animations 合并为内置等待）
- `--check-overflow`（移到自检清单）
- navMode 检测（hash vs query，不再需要）
- editor UI 隐藏（不再内嵌 editor）

## 4. 自检清单

新建 `references/self-check-checklist.md`，结构化定义所有检查项。详见该文件。

## 5. Legacy 代码（已删除）

v1 中以下文件已被删除（git 历史中可恢复）：

| 文件 | v1 角色 | 处理方式 |
|------|---------|---------|
| `scripts/assemble-deck.ts` | HTML 组装入口 | 已删除 |
| `scripts/assemble/` | 组装引擎 | 已删除 |
| `scripts/validate-slides.ts` | L0 验证 | 已删除 |
| `scripts/qa.ts` | L0+L1 门禁编排 | 已删除 |
| `scripts/visual-qa.ts` | L1 Playwright 18 项检查 | 已删除 |
| `scripts/editor-server.ts` | 编辑器 HTTP 服务 | 已删除 |
| `assets/editor.js` | 浏览器内编辑器 | 已删除 |
| `assets/editor.css` | 编辑器 UI 样式 | 已删除 |

## 6. 不受影响的模块

- slides-imagine：AI 生图，不受影响
- slides-diagram：SVG 架构图，不受影响
- slides-comic：知识漫画，不受影响
- assets/ 所有 CSS/JS 资产文件：内容不变，只是引用方式从骨架内联改为 Claude 手动内联
- scripts/html-to-pptx.ts、merge-to-pdf.ts、svg-to-png.ts：导出工具，不受影响
- EXTEND.md 配置体系：不变

## 7. 迁移注意事项

1. `templates/full-decks/` 下的 deck 模板仍然可用作 HTML 写作参考，但不再通过 assemble-deck 生成
2. `templates/single-page/` 的 31 种 layout HTML 保留，Claude 写 HTML 时参照其结构
3. `templates/deck.html` 骨架保留作为参考
4. 已有 v1 生成的 slides.json 和 index.html 不受影响
