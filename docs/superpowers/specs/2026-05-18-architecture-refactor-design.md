# Design × Component 架构重构设计

> **Goal:** Design 声明化，Component 自由组合，QA 自动适配，Layout 全部打通
> **Date:** 2026-05-18

## 1. 架构总览

```
重构前                                    重构后
────────                                  ──────
designs.ts (5 个 TS class, 每个 9 函数)     design-manifests/ (5 个 JSON)
       ↓                                         ↓
  DesignTemplate 接口                        manifest-loader.ts (加载+校验)
       ↓                                         ↓
  slides.ts 消费 d.cardHTML() 等              design-renderer.ts (variant 分支渲染)
                                             slides.ts 消费 renderCard(m, c) 等
```

### 文件变化

| 操作 | 文件 | 说明 |
|------|------|------|
| **新建** | `scripts/assemble/design-manifests/*.json` | 5 个 Design 声明 |
| **新建** | `scripts/assemble/manifest-loader.ts` | 加载 + 校验 Manifest |
| **新建** | `scripts/assemble/design-renderer.ts` | 通用 variant 渲染器 |
| **新建** | `scripts/qa/selectors.ts` | QA 选择器注册表 |
| **修改** | `scripts/assemble/types.ts` | 删 DesignTemplate，加 DesignManifest + "layout" SlideType |
| **修改** | `scripts/assemble/slides.ts` | 签名从 (d: DesignTemplate) → (m: DesignManifest) |
| **修改** | `scripts/assemble/assemble-deck.ts` | getDesignTemplate → loadManifest |
| **修改** | `scripts/visual-qa.ts` | 硬编码选择器 → buildSelectorRegistry() |
| **修改** | `scripts/validate-slides.ts` | 硬编码 Design/颜色表 → 从 Manifest 读取 |
| **修改** | `scripts/qa/analyze-changes.ts` | 补 design-manifests 变更规则 |
| **修改** | `assets/designs/xhs-post.css` | 收入 6 处 inline style |
| **删除** | `scripts/assemble/designs.ts` | 被 manifest + renderer 取代 |

skeleton.ts 不动（不消费 DesignTemplate）。

## 2. DesignManifest 类型

```typescript
interface DesignManifest {
  name: string;
  css: string | null;
  classes: {
    title: string;
    subtitle: string;
    kicker: string;
    body: string;
    titleTag: string;
  };
  chrome: {
    topbar: "standard" | "dot-badge" | "terminal" | null;
    footer: boolean;
    footerTag: "span" | "div";
    divider: boolean;
    decorations: string[];
    pageFormat: "dot" | "slash";
  };
  variants: {
    card: "standard" | "editorial" | "terminal" | "handdrawn";
    step: "standard" | "editorial" | "card-as-step" | "terminal";
    code: "standard" | "card-wrapped";
  };
  qa: {
    decorativeClasses: string[];
    chromeSelectors: string[];
    cardColors: string[];
  };
}
```

5 个 Design 的完整 JSON：base, pastel-card, white-editorial, xhs-post, hermes-cyber-terminal。字段映射自 designs.ts 的 9 个函数 + 5 个 class 属性。

## 3. design-renderer.ts 通用渲染器

4 组 variant 分支，穷举有限集：

```
renderCard(manifest, data)
  ├─ standard   → c-card > h4 + p                  (base, pastel-card)
  ├─ editorial  → c-card > chr-card-label/main/desc (white-editorial)
  ├─ terminal   → c-card > chr-hc-lbl/val/desc      (hermes)
  └─ handdrawn  → c-card > b + p.dim               (xhs-post, 无 inline style)

renderStep(manifest, data)
  ├─ standard      → c-step > c-step-num + c-step-content (base, pastel-card)
  ├─ editorial     → c-step > c-step-num + title only     (white-editorial)
  ├─ card-as-step  → 复用 renderCard("handdrawn")         (xhs-post)
  └─ terminal      → c-step > chr-hc-val + c-step-content (hermes)

renderCode(manifest, code)
  ├─ standard     → pre.chr-codebox               (base/pastel/editorial/hermes)
  └─ card-wrapped → c-card > pre                  (xhs-post)

renderQuote(manifest, quote, attr?)  →  统一，无 variant
renderTopbar(manifest, ...)  →  switch chrome.topbar
renderFooter(manifest, ...)  →  footerTag 控制 span/div
renderDecorations(manifest, ...)  →  遍历 chrome.decorations
renderDivider(manifest)  →  chrome.divider ? chr-divider : ""
```

## 4. slides.ts 适配

渲染函数签名全部改为 `(m: DesignManifest, ...)` ：

- `d.kickerClass` → `m.classes.kicker`
- `d.titleClass` → `m.classes.title`
- `d.titleTag` → `m.classes.titleTag`
- `d.cardHTML(c)` → `renderCard(m, c)`
- `d.stepHTML(s)` → `renderStep(m, s)`
- `d.codeHTML(code)` → `renderCode(m, code)`
- `d.quoteHTML(q, a)` → `renderQuote(m, q, a)`
- `d.dividerHTML()` → `renderDivider(m)`
- chrome 三件套 → `renderTopbar(m, ...)` / `renderFooter(m, ...)` / `renderDecorations(m, ...)`

renderSlide router 增加 `"layout"` case，读取 templates/single-page/ 注入 slots。

## 5. QA 适配

### visual-qa.ts
- 删除 4 个硬编码常量数组
- 新增 `buildSelectorRegistry()` 从 manifests 聚合 decorative/chrome selectors
- `c-*` 组件选择器不变（统一组件体系）

### validate-slides.ts
- KNOWN_DESIGNS → 读 design-manifests/ 目录
- DESIGN_COLORS → 从 manifest.qa.cardColors
- VALID_SLIDE_TYPES → 补 "table" + "layout"

### analyze-changes.ts
- 新增规则: `design-manifests/` 文件变更 → medium risk
- 新增规则: `designs.ts` 删除前的迁移期 → high risk

### portrait 检测统一
qa.ts / analyze-changes.ts / verify-refactor.ts 都用 HTML 内容检测（已修 verify-refactor.ts）。

## 6. xhs-post inline style 迁移

6 处 inline style 从 designs.ts 移到 xhs-post.css：

```css
.d-xhs-post .c-card b,
.d-xhs-post .c-card h4   { font-size: 2.72cqi; font-weight: 800; }
.d-xhs-post .c-card p.dim { font-size: 1.98cqi; margin-top: 0.49cqi; }
.d-xhs-post .c-card .chr-card-num { font-size: 2.72cqi; font-weight: 800; }
.d-xhs-post .chr-codebox { font-size: 1.85cqi; line-height: 1.75; overflow: auto; }
```

## 7. Layout 扩展

- types.ts SlideType 增加 `"layout"`
- slides.ts 新增 `renderLayout()`：读 `templates/single-page/<layout>.html`，注入 slots
- `"html"` 作为 `"layout"` 的别名向后兼容

## 8. hermes px → cqi（Phase 4）

hermes-cyber-terminal.css 全部使用 px，迁移为 cqi 以支持容器自适应。逐一替换字号/间距/边距的 px → cqi 映射（19.2px/cqi for 1920 基准）。

## 9. 实施分层

### Phase 0: 修剩余 Bug（前置）
- VALID_SLIDE_TYPES 补 "table"
- designs.ts 未纳入 analyze-changes RULES（迁移期规则）
- 验收: qa.sh --all 通过

### Phase 1: Design 声明化（核心）
1. types.ts 新增 DesignManifest，保留 DesignTemplate（迁移期）
2. 写 5 个 JSON manifest
3. manifest-loader.ts
4. design-renderer.ts
5. xhs-post.css 收入 inline style
6. slides.ts 切到 Manifest
7. assemble-deck.ts 切到 loadManifest
8. 删除 designs.ts + types.ts 中的 DesignTemplate
9. 截图回归验证: 5 deck pixel diff < 1%

### Phase 2: QA 选择器注册制
1. selectors.ts
2. visual-qa.ts 切动态选择器
3. validate-slides.ts 切 Manifest 驱动
4. analyze-changes.ts 补规则
5. portrait 检测统一

### Phase 3: Layout 扩展
1. types.ts SlideType 加 "layout"
2. slides.ts renderLayout
3. validate-slides.ts layout 校验
4. 验证: "layout": "two-column" 生成 slide，QA 通过

### Phase 4: hermes px 修复
1. 逐项 px → cqi 替换
2. QA font-unit 检测通过

## 10. 不做的
- 新增 Design assist tool（后续）
- manifest 可视化编辑器（后续）
- 自动从 slides.json 推断 design（后续）
