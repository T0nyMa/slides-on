# Design: 3:4 Portrait Slide System Overhaul — Token-Based Sizing

Date: 2026-05-16 | Status: Draft | Approach: 方案 3 (双轨重构)

## Problem

3:4 portrait slides 的系统性问题：

1. **留白不均**（最高优先级）—— 16:9 靠 `justify-content: center` 居中，3:4 改 `flex-start` 后无底部配重，上部拥挤下部空旷
2. **字号失调** — 固定 `px`（h1:72px, h2:54px）靠单一 `@container (max-width: 1000px)` 桥接 cqi，缩放粗糙
3. **封面比例失调** — 标题/副标题间距和比例只适配 16:9
4. **组件间距混乱** — steps/code/KPI 间距散落在多处，3:4 下不一致
5. **Chrome 偏位** — topbar/footer 用硬编码 `left: 6cqi`，与 `--slide-padding-x` 不同步
6. **底部不满** — 内容从顶部开始填充，下部常有大片空白

## Root Cause

3:4 适配逻辑散落在 5+ 个文件的 `@container`、`.portrait`、design CSS 覆盖中，无统一 sizing 体系。渲染器不感知 canvas。

## Solution: Three-Layer Token Architecture

```
Token 层 (base.css)       →  定义 20+ CSS 变量，.portrait / .landscape 各自覆盖
渲染器层 (slides.ts)       →  感知 canvas，做结构决策（列数、垂直分布模式），尺寸走 token
CSS 层 (components.css + design CSS) →  引用 token，不再写 @container 或 .portrait 分支
验证层 (validate-slides.ts) →  3:4 专用预算（组件数、字符数）
```

### Layer 1: Token System (base.css)

所有尺寸统一为 CSS 变量，`.portrait` 块一次性覆盖 3:4 值：

```css
:root {
  /* Typography */
  --h1-size: 72px;
  --h2-size: 54px;
  --h3-size: 32px;
  --h4-size: 22px;
  --lede-size: 22px;
  --kicker-size: 14px;
  --eyebrow-size: 13px;
  --body-size: 16px;

  /* Spacing */
  --slide-padding-x: 96px;
  --slide-padding-y: 72px;
  --slide-padding-bottom: 72px;
  --card-padding: 26px 28px;
  --card-gap: 24px;
  --section-gap: 24px;
  --stack-gap: 14px;

  /* Layout */
  --grid-cols-2: repeat(2, 1fr);
  --grid-cols-3: repeat(3, 1fr);
  --grid-cols-4: repeat(4, 1fr);
  --slide-justify: center;

  /* Component sizes (cqi-first, scaled by container query) */
  --c-title-size: 2.2cqi;
  --c-subtitle-size: 1.5cqi;
  --c-body-size: 1.2cqi;
  --c-card-padding: 1.5cqi 1.8cqi;
  --c-kpi-value-size: 4.5cqi;
  --c-step-num-size: 3cqi;
}

/* 3:4 portrait overrides */
.portrait {
  --h1-size: 7cqi;
  --h2-size: 5.2cqi;
  --h3-size: 3.7cqi;
  --h4-size: 2.5cqi;
  --lede-size: 2.5cqi;
  --kicker-size: 1.8cqi;
  --eyebrow-size: 1.6cqi;
  --body-size: 2cqi;

  --slide-padding-x: 4.5cqi;
  --slide-padding-y: 4.5cqi;
  --slide-padding-bottom: 3cqi;
  --card-padding: 2.5cqi 3cqi;
  --card-gap: 2cqi;
  --section-gap: 2.5cqi;
  --stack-gap: 1.8cqi;

  --grid-cols-2: 1fr;              /* 2-col → 1-col */
  --grid-cols-3: repeat(2, 1fr);   /* 3-col → 2-col */
  --grid-cols-4: repeat(2, 1fr);   /* 4-col → 2-col */

  --slide-justify: flex-start;

  /* Component size boosters for narrow canvas */
  --c-title-size: 3.5cqi;
  --c-subtitle-size: 2cqi;
  --c-body-size: 2cqi;
  --c-card-padding: 2.5cqi 3cqi;
  --c-kpi-value-size: 8cqi;
  --c-step-num-size: 5cqi;
}

/* 16:9 landscape — explicit defaults (already :root, kept for clarity) */
.landscape {
  /* All values same as :root, no overrides needed */
}
```

### Layer 2: Renderer Changes (slides.ts)

每个渲染器加 `canvas: "16:9" | "3:4"` 参数。只做**结构决策**，尺寸全部走 CSS token：

| Renderer | 16:9 结构 | 3:4 结构变化 |
|----------|----------|-------------|
| `renderCover` | title 居中，单块 | 标题组加 `v-fill` 撑满，可加底部配重元素 |
| `renderSection` | 居中文本块 | 标题加 `v-center` 垂直居中 |
| `renderCards` | `c-grid-2` / `c-grid-3` | 同 grid class，列数由 `--grid-cols-N` token 自动切换 |
| `renderSteps` | 垂直 `c-steps` 列表 | 加 `v-distribute` 做等距分布；≤4 步用 `flex:1` |
| `renderCode` | 代码块固定高度 | 代码块加 `flex:1` 撑满剩余空间 |
| `renderKpi` | 横排 `c-row` | 竖排 `c-row`（stack），每个 KPI 加高度 |
| `renderQuote` | 居中引用 | 加 `v-center` |
| `renderThanks` | 居中致谢 | 同 cover |
| `renderBullets` | 横排图标行 | 竖排堆叠 |

不新增 slide type，不改变 `slides.json` 格式。

### Layer 3: Vertical Distribution Utilities (base.css)

新增 3:4 专用的垂直分布工具类：

```css
.v-fill       { flex: 1; }                    /* 撑满剩余空间 */
.v-center     { margin: auto 0; }             /* 垂直居中（在 flex 容器内） */
.v-bottom     { margin-top: auto; }           /* 底部锚定 */
.v-distribute { justify-content: space-between; width: 100%; } /* 等距分布 */
```

渲染器在 3:4 时给对应元素加这些 class。

### Layer 4: CSS Cleanup

- `components.css`: 删除 `@container (max-width: 1000px)` 块，所有引用改为 `var(--c-*-size)`
- `base.css`: 删除 `@container` 和 `@media` 中的硬编码尺寸覆盖，保留容器查询做纯布局（grid 降级等极端情况）
- Design CSS (`pastel-card.css`, `white-editorial.css`, `xhs-post.css`): 
  - 删除所有 `.portrait` 分支（token 已覆盖）
  - 删除 `@container` grid 覆盖（`--grid-cols-N` token 已处理）
  - chrome 位置改引用 `var(--slide-padding-x)` 替代硬编码 `left: 6cqi`
  - 如需 design-specific 的 3:4 特殊值，在自己的 `.d-xxx` 块覆盖对应 token

### Layer 5: Validation (validate-slides.ts)

新增 3:4 专用预算：

```
3:4 限制:
  - 组件 ≤ 6 个/slide
  - h1 标题 ≤ 15 字符
  - h2 标题 ≤ 10 字符
  - 正文 ≤ 60 字符/组件
  - 步数 ≤ 5
  - KPI 数 ≤ 4
```

### CSS Variable Inheritance Chain

```
:root (16:9 defaults)
  → .portrait (3:4 overrides)
    → .d-xhs-post (design-specific)
      → style.css (deck-level)
        → #editor-overrides (user edits)
```

任何层都可以覆盖任意 token，下游自动继承。

## Files Changed

| File | Change |
|------|--------|
| `assets/base.css` | 新增 20+ token 定义 + `.portrait` 覆盖块 + `.v-*` 工具类；删除 `@container` 尺寸覆盖 |
| `assets/components.css` | 所有硬编码 cqi 值改为 `var(--c-*)`；删除 `@container` 块 |
| `assets/designs/*.css` (4 文件) | 删除 `.portrait`/`@container` 分支；chrome 位置改用 token |
| `scripts/assemble/slides.ts` | 每个渲染器加 `canvas` 参数；3:4 时加 `v-*` class 和结构微调 |
| `scripts/assemble/skeleton.ts` | 无需大改（body class 已正确） |
| `scripts/validate-slides.ts` | 新增 3:4 专用预算规则 |
| `scripts/visual-qa.ts` | 更新 3:4 阈值（已有画像，微调） |
| `templates/full-decks/*/index.html` (5 个 portrait deck) | 重新 assemble 验证 |

## Verification

1. **Token 一致性**: 脚本检查所有 CSS 中不再出现硬编码 `72px`/`54px` 等值（除 `:root` 定义外）
2. **5 个 portrait deck 重新 assemble** — visual-qa 扫描，BLOCKER 数不增加
3. **截图像素对比** — xhs-post 新旧版 diff < 5%（预期有改善性差异）
4. **手写 HTML 兼容** — xhs-tech-tutorial（全 `type: html`）不因 CSS 改动而布局崩溃
5. **16:9 不受影响** — 2 个 landscape deck QA 扫描无新 BLOCKER

## Non-Goals

- 不新增 slide type
- 不改 `slides.json` 格式
- 不对 16:9 做调整（范围外）
- 不创建 3:4 专用的 single-page 模板（token + 渲染器已足够）
