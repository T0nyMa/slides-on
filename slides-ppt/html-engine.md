# HTML 渲染引擎

slides-on 的 HTML 渲染引擎提供交互式演示能力。

## 资产清单

### 设计系统

| 文件 | 路径 | 说明 |
|------|------|------|
| base.css | `assets/base.css` | 150 行，30+ CSS Variables，响应式 grid，窄画布适配 |
| fonts.css | `assets/fonts.css` | 系统字体栈（Inter, JetBrains Mono, Noto Sans SC） |
| components.css | `assets/components.css` | 共享组件库（cqi + CSS vars，c-* 组件） |
| runtime.js | `assets/runtime.js` | 960 行交互引擎 |
| designs/ | `assets/designs/` | Design CSS 文件（可移植视觉皮肤：pastel-card, white-editorial, xhs-post） |

### 主题（36 个）

全部位于 `assets/themes/`：

```
academic-paper.css      arctic-cool.css         aurora.css
bauhaus.css             blueprint.css           catppuccin-latte.css
catppuccin-mocha.css    corporate-clean.css     cyberpunk-neon.css
dracula.css             editorial-serif.css     engineering-whiteprint.css
glassmorphism.css       gruvbox-dark.css        japanese-minimal.css
magazine-bold.css       memphis-pop.css         midcentury.css
minimal-white.css       neo-brutalism.css       news-broadcast.css
nord.css                pitch-deck-vc.css       rainbow-gradient.css
retro-tv.css            rose-pine.css           sharp-mono.css
soft-pastel.css         solarized-light.css     sunset-warm.css
swiss-grid.css          terminal-green.css      tokyo-night.css
vaporwave.css           xiaohongshu-white.css   y2k-chrome.css
```

### Layout（31 个单页模板）

全部位于 `templates/single-page/`：

```
arch-diagram.html    big-quote.html       bullets.html
chart-bar.html       chart-line.html      chart-pie.html
chart-radar.html     code.html            comparison.html
cover.html           cta.html             diff.html
flow-diagram.html    gantt.html           image-grid.html
image-hero.html      kpi-grid.html        mindmap.html
process-steps.html   pros-cons.html       roadmap.html
section-divider.html stat-highlight.html  table.html
terminal.html        thanks.html          three-column.html
timeline.html        toc.html             todo-checklist.html
two-column.html
```

### Deck 骨架

`templates/deck.html` — 新建 deck 的参考 HTML 骨架。

## 使用方式

### 1. 新建 deck

从骨架开始：
```html
<!-- 复制 deck.html 骨架 -->
<!-- 引入 base.css + theme CSS + fonts.css -->
<!-- 按需引入 animation CSS + fx-runtime.js -->
<!-- 在 <body> 中添加 .slide 元素 -->
<!-- 引入 runtime.js -->
```

### 2. HTML 结构

**16:9 landscape**（使用 theme）：
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deck Title</title>
  <style>
    /* assets/fonts.css 内容内联在此 */
    /* assets/base.css 内容内联在此 */
    /* assets/themes/blueprint.css 内容内联在此 */
    /* assets/animations/animations.css 内容内联在此（如需） */
  </style>
</head>
<body class="landscape">
  <div class="deck">
    <section class="slide is-active" data-anim="fade-in">
      <!-- 参考 single-page/cover.html 的结构 -->
    </section>
    <!-- ... more slides ... -->
  </div>
  <script>
    /* assets/runtime.js 内容内联在此 */
  </script>
</body>
</html>
```

**3:4 portrait**（使用 Design CSS）：
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>Card Title</title>
  <style>
    /* assets/fonts.css 内容内联在此 */
    /* assets/base.css 内容内联在此 */
    /* assets/components.css 内容内联在此 */
    /* assets/designs/pastel-card.css 内容内联在此 */
  </style>
</head>
<body class="d-pastel-card portrait">
  <div class="deck">
    <section class="slide is-active">
      <div class="chr-blob b1"></div>
      <div class="chr-topbar">...</div>
      <!-- c-* 组件填充内容 -->
      <div class="chr-footer">...</div>
    </section>
  </div>
  <script>
    /* assets/runtime.js 内容内联在此 */
  </script>
</body>
</html>
```

### 3. CSS Variables 体系

每个 theme CSS 文件通过覆盖 `:root` 变量切换视觉：

```css
/* base.css 定义变量 */
:root {
  --bg: #fff;
  --surface: #f5f5f5;
  --text-1: #1a1a1a;
  --text-2: #666;
  --text-3: #999;
  --accent: #2563eb;
  --accent-2: #7c3aed;
  --grad: linear-gradient(135deg, var(--accent), var(--accent-2));
  --font-sans: "Inter", "Noto Sans SC", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  --radius: 8px;
  --shadow: 0 4px 24px rgba(0,0,0,0.08);
  --col-gap: 24px;
  --row-gap: 24px;
  /* ... more */
}
```

```css
/* blueprint.css 覆盖 */
:root {
  --bg: #1a2332;
  --surface: #243447;
  --text-1: #e8edf2;
  --text-2: #8fa4b8;
  --accent: #4a9eff;
  --accent-2: #ff6b6b;
  --grad: linear-gradient(135deg, #1a3a5c, #0d2137);
  --font-mono: "JetBrains Mono", monospace;
}
```

### 4. 布局系统

每个 single-page layout 使用 CSS grid 系统。关键 class：

| Class | 说明 |
|-------|------|
| `.g2` - `.g6` | Grid 2-6 列 |
| `.portrait` | 3:4 画布模式（body class，激活 Container Query + cqi 缩放） |
| `.narrow` | 手动窄画布模式（JS 触发，保留兼容） |
| `.title` | 页面标题区 |
| `.body` | 页面内容区 |
| `chr-*` | Chrome 页面壳元素（topbar, footer, blob, sticker 等），由 Design CSS 定义样式 |

### 5. 导航系统

`runtime.js` 提供：
- `.is-active` 类切换 slide 显示
- URL hash `#/N` 深链接
- 键盘导航（← → Home End Space）
- Overview 网格模式（按 `O` 键）
- Presenter 模式（按 `P` 键）

### 6. 动画系统

CSS 动画通过 `data-anim` 属性声明：
```html
<div class="slide" data-anim="slide-up">...</div>
<div class="slide" data-anim="fade-in">...</div>
<div class="slide" data-anim="scale-in">...</div>
```

Canvas 特效通过 `data-fx` 属性声明：
```html
<div class="slide" data-fx="chain-react">...</div>
<div class="slide" data-fx="particle-burst">...</div>
```

## 新建 Deck 脚手架

```bash
bash scripts/new-deck.sh <deck-name>
```

产出目录结构：
```
<deck-name>/
├── index.html       # deck 骨架 + 内容
├── style.css        # deck 级样式覆盖
└── README.md        # deck 说明
```

## 画布适配

### 3:4 Portrait

通过 `<body class="portrait">` 一键切换。采用 Design CSS 架构：加载 `assets/components.css` + `assets/designs/{name}.css`，页面用 Chrome 片段（`chr-*`）+ `c-*` 组件拼装。详见 `../slides-card/portrait-user-guide.md` 和 `../slides-card/content-rules-portrait.md`。

### 窄视口兜底

`base.css` 两层自动兜底（无需手动加 class）：

1. **`@container (max-width: 1000px)`** — 容器查询，`cqi` 缩放 + grid 降级（主要路径）
2. **`@media (max-width: 900px)`** — 视口查询，`px` 字号缩小 + grid 降级（旧浏览器兜底）

触发效果：列数降级（`.g4`/`.g3`→2列）、字号缩小、间距收紧。

## 开发调试

1. 在浏览器中打开 `index.html`，按 `O` 进入 overview 网格模式
2. 按 `P` 进入 presenter 模式（独立窗口 + 笔记区域）
3. URL 参数：`?preview=N` 在 presenter 窗口中预览指定页
4. 键盘 `← →` 切换页面，`Home` 回到首页，`End` 到末页
