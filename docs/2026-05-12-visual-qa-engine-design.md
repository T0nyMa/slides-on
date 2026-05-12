# Visual QA Engine Design

## Overview

将现有 3 层 QA 中的 L1（polish.ts，静态 CSS 分析）和 L2（visual-diff.ts，浏览器检测）合并为统一的 Playwright 引擎 `visual-qa.ts`。所有检测在浏览器内通过 `getComputedStyle` 和 DOM API 执行，消除静态分析与实际渲染结果不一致的问题。

## Motivation

用户生成的 slides 视觉质量不可控，现有 QA 系统的核心矛盾：

- L1 polish.ts 用正则解析 CSS 文本，遇到 CSS 变量嵌套、`cqi` 单位、复杂 cascade 时不准确
- L2 visual-diff.ts 有 Playwright 基础设施但检测维度太粗（仅 slide 边界溢出 + bounding box 留白）
- 文字在容器内截断、元素互相遮挡、实际渲染对比度等问题完全无法检测

## Architecture

```
L0: validate-slides.ts（不动，JSON 校验）
L1: visual-qa.ts（新，替代 polish.ts + visual-diff.ts）

废弃：polish.ts、visual-diff.ts
qa.sh 简化为：L0 validate → L1 visual-qa
```

### 运行流程

```
启动 Playwright
  → 加载 HTML（file:// 协议）
  → waitForSelector('.slide')
  → 获取 slide 总数
  → 逐页 activateSlide(i)
    → 在 page.evaluate 内执行 10 组检测
    → 收集 issues[]
  → 汇总报告（BLOCKER / WARN / INFO）
  → 如果非 --check-only：生成 polish.css
  → 退出码：有 BLOCKER → 1，否则 → 0
```

### CLI 接口

```bash
bun scripts/visual-qa.ts --input index.html                    # 检测 + 生成 polish.css
bun scripts/visual-qa.ts --input index.html --check-only       # 仅检测
bun scripts/visual-qa.ts --input index.html --report report.json  # 输出 JSON 报告
```

### 输出

- 终端报告：按 BLOCKER → WARN → INFO 排序，每条标注 slide 编号 + 元素 + 问题描述 + 修复建议
- polish.css：可自动修复的 CSS patch（与现有行为兼容）
- report.json（可选）：结构化报告供程序消费
- 退出码：有 BLOCKER → 1，否则 → 0（pipeline 拦截）

## Detection Groups

### Group 1: 文字截断/溢出（BLOCKER）

**原理**：比较文本容器的 `scrollHeight` vs `clientHeight`，`scrollWidth` vs `clientWidth`。

**目标元素**：

```
h1, h2, h3, h4, p, li, span,
.c-card, .c-card-soft, .c-step, .c-kpi,
.c-note, .c-quote, .c-badge,
.chr-title, .chr-heading, .chr-sub
```

**逻辑**：

```js
for (const el of targetElements) {
  const overflow_y = el.scrollHeight - el.clientHeight > 2;
  const overflow_x = el.scrollWidth - el.clientWidth > 2;
  
  const style = getComputedStyle(el);
  // 排除 overflow: visible（装饰性溢出）
  if (style.overflow === 'visible' && style.overflowX === 'visible') continue;
  
  // line-clamp 有意截断 → INFO
  if (style.webkitLineClamp && style.webkitLineClamp !== 'none') {
    → INFO "文字被 line-clamp 截断"
  } else {
    → BLOCKER "文字溢出容器"
  }
}
```

**自动修复**：

- 纵向溢出 < 20%：缩小 font-size
- 纵向溢出 ≥ 20%：建议缩减内容或拆页
- 横向溢出：添加 `word-break: break-word` 或 `min-width: 0`

### Group 2: 元素遮挡（BLOCKER/WARN）

**原理**：收集非装饰内容元素的 `getBoundingClientRect()`，两两计算交叉面积占较小元素面积的比例。

**排除列表**：

- chr-blob, bg-glow, bg-grid 等装饰类名
- position: absolute + pointer-events: none
- opacity < 0.1
- 父子关系（el.contains()）

**逻辑**：

```js
for (i, j in contentElements) {
  if (isAncestor(elements[i], elements[j])) continue;
  
  const intersection = getIntersectionArea(rects[i], rects[j]);
  const smallerArea = Math.min(rects[i].area, rects[j].area);
  const ratio = intersection / smallerArea;
  
  if (ratio > 0.3) → BLOCKER "严重遮挡"
  if (ratio > 0.1) → WARN "部分遮挡"
}
```

**自动修复**：

- absolute 定位遮挡：CSS 调整偏移
- flex/grid 子元素重叠：建议减少组件或缩小尺寸
- 无法确定原因：仅报告

### Group 3: 留白检测（BLOCKER/WARN）

**原理**：累加所有可见内容元素的实际 rect 面积（扫描线去重叠），除以 slide 面积。替代旧的 bounding box 包围盒方案。

**阈值（3:4 画布）**：

| 填充率 | 判定 |
|--------|------|
| < 15% | BLOCKER |
| 15-30% | WARN |
| 30-75% | PASS |
| > 85% | WARN |

**补充：四象限均衡度**

将 slide 切成 4 象限分别计算填充率，`minFill / maxFill < 0.1` → WARN "内容集中在某个象限"。

**自动修复**：

- < 15%：建议增加 c-badge-row / c-note / c-card-soft
- > 85%：建议拆页或减少组件
- 象限不均衡：建议调整布局

### Group 4: 间距一致性（WARN/INFO）

**原理**：同类元素分组，计算相邻元素 gap，检查方差。

**分组**：

```
cards:  .c-card, .c-card-soft
steps:  .c-step
kpis:   .c-kpi
badges: .c-badge
bullets: li
```

**逻辑**：

```js
// 需 ≥ 3 个同类元素
// 自动检测排列方向（X 方差 vs Y 方差）
// 计算相邻 gap
// 偏差 > 50% → WARN
// 偏差 > 25% → INFO
// 负间距跳过（交给 Group 2 遮挡检测）
```

**自动修复**：CSS 统一 gap / margin 值。

### Group 5: 实际对比度（BLOCKER/WARN）

**原理**：对每个文本元素，用 `getComputedStyle` 取文字色，向上遍历祖先链找第一个非透明背景色，计算 WCAG AA 对比度。

**逻辑**：

```js
for (const el of textElements) {
  const textColor = getComputedStyle(el).color;
  
  // 向上找背景色
  let bgColor = null, ancestor = el;
  while (ancestor) {
    const bg = getComputedStyle(ancestor).backgroundColor;
    if (bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') { bgColor = bg; break; }
    ancestor = ancestor.parentElement;
  }
  // 兜底：slide 背景色或 --bg 变量
  
  const ratio = contrastRatio(textColor, bgColor);
  const threshold = isLargeText(el) ? 3.0 : 4.5;
  
  if (ratio < threshold) → BLOCKER
  if (ratio < threshold * 1.2) → WARN
}
```

**渐变/图片背景处理**：

- linear-gradient：解析起止色取较浅的做最差估计
- background-image url(...)：标记 INFO "无法自动检测"

**自动修复**：调整文字色 / 添加 text-shadow / 半透明底色。

### Group 6: 字号层级（BLOCKER/WARN/INFO）

**原理**：浏览器内读每个文本元素的实际渲染 `fontSize`，按角色分类（title/heading/body/caption），检查层级关系和跨 slide 一致性。

**角色分类**：

```
title:   H1, .chr-title
heading: H2, H3, .chr-heading, .chr-sub
body:    p, li, span, div（含文本）
caption: .c-badge, .c-note, .chr-footer
```

**判定规则**：

| 规则 | 条件 | 级别 |
|------|------|------|
| 层级倒挂 | heading ≥ title × 0.95 | WARN |
| 层级模糊 | body ≥ heading × 0.9 | WARN |
| 字号过小 | < 10px（3:4 画布） | BLOCKER |
| 字号过大 | title > slide 宽度 × 25% | WARN |
| 同角色不一致 | 同 role 跨 slide 字号方差 > 30% | INFO |

**自动修复**：CSS font-size 调整。

### Group 7-10: 迁移检测

| # | 检测 | 迁移自 | 级别 |
|---|------|--------|------|
| 7 | Chrome 位置一致性（Y 坐标跨 slide 偏差 > 2px） | visual-diff.ts checkChromePositions | WARN |
| 8 | Chrome 元素缺失（topbar/footer 跨 slide 不一致） | polish.ts checkChromeConsistency | WARN |
| 9 | CSS 变量缺失（--accent, --bg, --text-1, --font-sans） | polish.ts checkVariableHealth | BLOCKER |
| 10 | 组件密度（3:4 > 6 个 / 16:9 > 8 个） | polish.ts checkDensity | WARN |

迁移时保持现有逻辑不变，仅将 CSS 文本正则版本替换为浏览器内 `getComputedStyle` 版本（Group 9 变量检测）。

## Target Canvas

首期覆盖 **3:4 portrait**，阈值针对竖版调优。16:9 通过参数化阈值后续扩展，代码结构预留 canvas 参数。

## Files Changed

| 操作 | 文件 |
|------|------|
| 新建 | `scripts/visual-qa.ts` |
| 删除 | `scripts/polish.ts` |
| 删除 | `scripts/visual-diff.ts` |
| 修改 | `scripts/qa.sh`（L0 + L1 两层） |
| 修改 | `CLAUDE.md`（更新 Scripts 说明） |

## Shared Utilities

从现有代码复用的工具函数：

- `hexToRgb`、`relativeLuminance`、`contrastRatio`、`adjustColor` → 从 polish.ts 迁移
- `loadPage`、`getSlideCount`、`activateSlide` → 从 visual-diff.ts 迁移
- 装饰元素过滤逻辑（DECORATIVE_CLASSES）→ 从 visual-diff.ts 迁移
