# html-ppt 集成详解

html-ppt-skill 是 slides-on 的核心 HTML 渲染引擎，提供交互式演示能力。

## 来源路径

```
{html-ppt} = .agents/skills/html-ppt/
```

## 资产清单

### 设计系统

| 文件 | 路径 | 说明 |
|------|------|------|
| base.css | `{html-ppt}/assets/base.css` | 150 行，30+ CSS Variables，响应式 grid，窄画布适配 |
| fonts.css | `{html-ppt}/assets/fonts.css` | Google Fonts 引入（Inter, JetBrains Mono, Noto Sans SC） |
| runtime.js | `{html-ppt}/assets/runtime.js` | 960 行交互引擎 |

### 主题（36 个）

全部位于 `{html-ppt}/assets/themes/`：

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

全部位于 `{html-ppt}/templates/single-page/`：

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

### Deck 模板（15 个）

全部位于 `{html-ppt}/templates/full-decks/`：

```
course-module/              dir-key-nav-minimal/
graphify-dark-graph/        hermes-cyber-terminal/
knowledge-arch-blueprint/   obsidian-claude-gradient/
pitch-deck/                 presenter-mode-reveal/
product-launch/             tech-sharing/
testing-safety-alert/       weekly-report/
xhs-pastel-card/            xhs-post/
xhs-white-editorial/
```

每个 deck 模板包含 `index.html` + `style.css` + `README.md`。

### Deck 骨架

`{html-ppt}/templates/deck.html` — 新建 deck 的起始 HTML 骨架。

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

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="assets/base.css">
  <link rel="stylesheet" href="assets/fonts.css">
  <link rel="stylesheet" href="assets/themes/blueprint.css">
  <link rel="stylesheet" href="assets/animations/animations.css">
</head>
<body>
  <!-- Slide 1: Cover -->
  <div class="slide is-active" data-anim="fade-in">
    <!-- 使用 single-page/cover.html 的内容结构 -->
  </div>

  <!-- Slide 2: TOC -->
  <div class="slide">
    <!-- 使用 single-page/toc.html 的内容结构 -->
  </div>

  <!-- Slide 3: Content -->
  <div class="slide">
    <!-- 使用 single-page/bullets.html 的内容结构 -->
  </div>

  <!-- ... more slides ... -->

  <script src="assets/runtime.js"></script>
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
| `.narrow` | 窄画布模式（≤900px 自动激活） |
| `.tpl-xhs-post` | XHS 帖子模板专用 |
| `.title` | 页面标题区 |
| `.body` | 页面内容区 |
| `.footer` | 页面底部（XHS 底部栏） |

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
bash {html-ppt}/scripts/new-deck.sh <deck-name>
```

产出目录结构：
```
<deck-name>/
├── index.html       # deck 骨架 + 内容
├── style.css        # deck 级样式覆盖
└── README.md        # deck 说明
```

## 窄画布适配规则

当 slide 在 ≤ 900px 宽画布中时（如 XHS 3:4 模式），`base.css` 自动应用窄画布规则：
- **列数降级**：`.g4` → 2 列，`.g3` → 2 列
- **字号缩小**：`h1` 56px、`h2` 40px、`h3` 26px
- **间距收紧**：`--col-gap` 和 `--row-gap` 减小
- **特定 layout 适配**：arch-diagram、comparison、gantt、flow、steps 等有专门窄画布规则

## 开发调试

1. 在浏览器中打开 `index.html`，按 `O` 进入 overview 网格模式
2. 按 `P` 进入 presenter 模式（独立窗口 + 笔记区域）
3. URL 参数：`?preview=N` 在 presenter 窗口中预览指定页
4. 键盘 `← →` 切换页面，`Home` 回到首页，`End` 到末页
