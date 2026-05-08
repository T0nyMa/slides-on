# Typography 维度

Typography（字体风格）决定幻灯片中文字的视觉性格，通过 `--font-sans` 和 `--font-mono` CSS 变量控制。

## 可选值

### geometric（几何无衬线）

**视觉描述**: 干净、现代、理性。几何造型的无衬线字体，笔画粗细均匀，圆形笔画接近正圆。

**推荐 Google Fonts**:
- [Inter](https://fonts.google.com/specimen/Inter) — 最适合屏幕阅读的无衬线
- [DM Sans](https://fonts.google.com/specimen/DMSans) — 几何感强
- [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) — 略有性格
- [Outfit](https://fonts.google.com/specimen/Outfit) — 现代几何

**CSS 示例**:
```css
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

**使用 Preset**: corporate, dark-atmospheric, minimal, notion, vector-illustration

**匹配场景**: 商业演示、现代产品展示、极简设计

---

### humanist（人文无衬线）

**视觉描述**: 温暖、可读、友好。保留手写笔画特征的无衬线字体，笔画粗细有变化，更接近传统书写比例。

**推荐 Google Fonts**:
- [Noto Sans SC](https://fonts.google.com/specimen/Noto+Sans+SC) — 中英文混排首选
- [Source Sans 3](https://fonts.google.com/specimen/Source+Sans+3) — Adobe 出品
- [Atkinson Hyperlegible](https://fonts.google.com/specimen/Atkinson+Hyperlegible) — 高可读性
- [Lato](https://fonts.google.com/specimen/Lato) — 经典人文无衬线

**CSS 示例**:
```css
--font-sans: 'Noto Sans SC', 'Source Sans 3', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

**使用 Preset**: （目前无 Preset 默认使用 humanist，但可作为学术和教学的备选）

**匹配场景**: 教学课件、长文阅读、多语言内容

---

### handwritten（手写体）

**视觉描述**: 个性化、亲切、非正式。模拟手写或草图风格的字体，笔画不规则，传递手工感和创造力。

**推荐 Google Fonts**:
- [Caveat](https://fonts.google.com/specimen/Caveat) — 流畅手写
- [Indie Flower](https://fonts.google.com/specimen/Indie+Flower) — 可爱手写
- [Nanum Pen Script](https://fonts.google.com/specimen/Nanum+Pen+Script) — 韩式手写
- [Permanent Marker](https://fonts.google.com/specimen/Permanent+Marker) — 马克笔风格
- [Kalam](https://fonts.google.com/specimen/Kalam) — 自然手写

**CSS 示例**:
```css
--font-sans: 'Caveat', 'Kalam', cursive;
--font-mono: 'Courier Prime', monospace;
```

**使用 Design**: chalkboard, fantasy-animation, hand-drawn-edu, sketch-notes, watercolor

**匹配场景**: 教学课件、创意工作坊、儿童内容、个人博客

---

### editorial（编辑衬线）

**视觉描述**: 权威、经典、深度。衬线字体传递学术传统和编辑严谨性，适合长文阅读和正式出版物。

**推荐 Google Fonts**:
- [Noto Serif SC](https://fonts.google.com/specimen/Noto+Serif+SC) — 中文衬线首选
- [Source Serif 4](https://fonts.google.com/specimen/Source+Serif+4) — Adobe 出品
- [Merriweather](https://fonts.google.com/specimen/Merriweather) — 屏幕阅读优化
- [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) — 标题衬线
- [Lora](https://fonts.google.com/specimen/Lora) — 优雅正文衬线

**CSS 示例**:
```css
--font-sans: 'Noto Serif SC', 'Source Serif 4', Georgia, serif;
--font-mono: 'JetBrains Mono', monospace;
```

**使用 Preset**: bold-editorial, editorial-infographic, scientific, vintage

**匹配场景**: 学术论文、研究报告、编辑出版物、历史/文化主题

---

### technical（技术等宽）

**视觉描述**: 精确、结构化、代码感。等宽字体或极简无衬线传递技术精确性，每个字符占据相同宽度。

**推荐 Google Fonts**:
- [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) — 代码首选
- [Fira Code](https://fonts.google.com/specimen/Fira+Code) — 连字特性
- [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) — IBM 经典
- [Source Code Pro](https://fonts.google.com/specimen/Source+Code+Pro) — Adobe 出品
- [Cascadia Code](https://github.com/microsoft/cascadia-code) — 微软终端字体

**CSS 示例**:
```css
--font-sans: 'IBM Plex Mono', 'JetBrains Mono', monospace;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

**使用 Preset**: blueprint, intuition-machine, pixel-art

**匹配场景**: 代码演示、技术架构、终端风格、像素艺术

---

## Typography 快速选择

| 场景 | 推荐 Typography | 推荐字体 |
|------|----------------|---------|
| 商业演示 | geometric | Inter + JetBrains Mono |
| 学术报告 | editorial | Noto Serif SC + Source Serif 4 |
| 技术分享 | technical | JetBrains Mono |
| 教学课件 | humanist 或 handwritten | Noto Sans SC 或 Caveat |
| 产品发布 | geometric | DM Sans 或 Outfit |
| 创意提案 | handwritten 或 geometric | Caveat 或 Space Grotesk |
| 代码展示 | technical | Fira Code 或 JetBrains Mono |

## 中英文混排注意事项

当内容同时包含中文和英文时:
1. 优先选择中英文均支持的字体（如 Noto Sans SC, Noto Serif SC）
2. 在 `font-family` 中先声明中文字体，再声明英文字体
3. 使用 `system-ui` 作为无衬线兜底，`Georgia` 作为衬线兜底
4. 手写体仅适用于标题/装饰，不应用于大段中文正文
