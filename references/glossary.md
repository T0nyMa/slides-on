# Glossary

Unified terminology for the slides-on project.

## Core Formula

```
Slides = Template × Design × Content
```

| Role | Term | Question it answers |
|------|------|-------------------|
| 结构容器 | **Template** | 页面上**有什么**、**放哪里** |
| 视觉皮肤 | **Design** | 页面**长什么样** |
| 最终产物 | **Slides** | 可以**看/导出/发布**的完整文件 |

一个 Template 自带默认的视觉（default Design），Design 是可选的可移植覆盖层——换 Design 不换结构。

## Term Hierarchy

```
Slides（最终产物 = index.html）
├── Section（章节 = 一组逻辑相关的 Slide）
│   └── Slide（单页 = 一个 <section class="slide">）
│       ├── Layout（单页内容排列方式）
│       ├── Component（可复用 HTML 内容块）
│       └── Animation（进入/过渡效果）
├── Template（结构容器 = HTML 骨架 + 组件体系 + 默认视觉 + 画布格式）
├── Design（视觉皮肤 = CSS 变量覆盖层：颜色/字体/纹理/密度/动画偏好）
└── Style（最终计算出的 CSS 属性值）
```

## Core Terms

### Slides
**最终产物**——一个完整的演示文稿。Template × Design × Content 三者的结合体。渲染为一个包含多个 `.slide` 元素的独立 HTML 文件。

**File**: `index.html`，链接 `runtime.js`、`base.css`、Design CSS。

**产物路径**: `examples/<name>/index.html`

### Template
**结构容器**——定义页面上有什么元素、元素如何排列、页面之间的序列关系。Template 自带默认的视觉（CSS 变量默认值），但这些默认值可以被 Design 覆盖。

Template 包含：
- **HTML 骨架**：每页有什么组件（blob、card、chip、grid、footer...）
- **组件体系**：专属的 class 命名空间和组件类型
- **默认视觉**：通过 CSS 变量定义默认配色、字体、圆角等
- **画布格式**：16:9（1920×1080）或 3:4（810×1080）或其他
- **页面序列模式**：典型页面顺序（cover → toc → sections → cta → thanks）

**文件位置**: `templates/full-decks/<name>/`，含 `index.html` + `style.css` + `README.md`

**Scope**: Slides 级。一个 Slides 使用一个 Template。

**Key distinction — Template vs Layout**:
- Template = Slides 级的结构容器（"一个什么格式的演示"）
- Layout = Slide 级的单页内容排列方式（"这一页怎么排版"）

一个 Template 内部可以引用多种 Layout，一个 Layout 可被不同 Template 使用。

### Design
**视觉皮肤**——一个可移植的 CSS 变量覆盖层。Design 不定义 HTML 结构，不关心页面序列，只定义视觉属性：颜色、字体、纹理、圆角、阴影、动画偏好。

Design 通过重映射 Template 暴露的 CSS 变量来实现视觉切换。加载在 Template 的 CSS 之后，靠 CSS 层叠自然覆盖。

Design 包含：
- **Theme 映射**：背景色、文字色、强调色等 CSS 变量取值
- **Typography**：字体风格（geometric / humanist / handwritten / editorial / technical）
- **Texture**：画面质感（clean / grid / organic / pixel / paper）
- **Mood**：情感基调（professional / warm / cool / vibrant / dark / neutral）
- **Density**：信息密度（minimal / balanced / dense）
- **Animation**：动画风格偏好（fade / slide / none）

**文件位置**: `references/designs/<name>.md`（定义文档）+ 对应的 CSS 覆盖文件

**Scope**: Slides 级。一个 Slides 应用一个 Design。Design 与 Template 正交——同一个 Design 可以套到不同 Template 上。

**Key distinction — Design vs Theme**:
- Theme = 单一的 CSS 变量文件（如 `blueprint.css`），只管颜色字体
- Design = Theme + 纹理 + 密度 + 动画偏好，是更完整的视觉决策包

Design 可以引用一个现成的 Theme CSS 作为基础，也可以是完全自定义的 CSS 变量集合。

### Slide
Slides 中的一页。渲染为 `<section class="slide">` 元素，位于 `.deck` 容器内。同一时刻只有一页可见（通过 `.is-active` 类切换）。

**Key attributes**:
- `data-anim="fade-up"` — 进入动画
- `data-fx="chain-react"` — Canvas 特效
- `data-title="..."` — 页面标题（overview / presenter 模式使用）

**导航**: 键盘（← → Home End Space）、URL hash（`#/N`）、触屏滑动

### Section
逻辑相关的一组 Slide，通常由 `section-divider` 页引入。对应源文档中的章节或主题转折。

**In outline.md**: `## Section: <name>`

### Layout
**单页内容排列方式**——一个 HTML 片段，定义一页 Slide 内内容如何组织（双栏、要点列表、图表、代码等）。31 种内置 Layout 位于 `templates/single-page/`。

**Scope**: Slide 级。一个 Layout 用于一个 `.slide` 内部。

### Component
Layout 内可复用的 HTML 内容块。例如：callout box、metric card、timeline item、tag、badge。Component 在 Layout 中引用，在 Step 3（HTML 渲染）时填入具体内容。

**In base.css**: `.tag`、`.badge`、`.card`、`.callout`

### Theme
**单一 CSS 变量文件**，通过覆盖 `:root` 变量控制视觉外观。36 个内置 Theme 位于 `assets/themes/`。

Theme 是 Design 的子集——Design 除了选 Theme，还决定纹理、密度、动画等非颜色维度。

### Animation
Slide 元素的视觉过渡效果。通过 HTML 属性声明，由 `runtime.js` 在 Slide 激活时触发。

- **CSS 动画**（27 种）：`data-anim="fade-up"`、`data-anim="slide-left"` 等
- **Canvas FX**（20 种）：`data-fx="chain-react"`、`data-fx="particle-burst"` 等

### Style
HTML 元素上最终计算出的 CSS 属性值。Style 是 Design（变量定义）+ Template（结构）共同作用后的**结果**，不是可单独配置的单元。

## Confusion-Prone Distinctions

| Pair | Key Difference |
|------|---------------|
| **Template vs Layout** | Template = Slides 级结构容器（整套格式）。Layout = Slide 级内容排列（单页排版） |
| **Design vs Theme** | Design = 完整视觉皮肤（颜色 + 纹理 + 密度 + 动画）。Theme = 单一 CSS 变量文件（仅颜色字体） |
| **Style vs Design** | Design = 变量定义（"accent 是什么颜色"）。Style = 计算结果（屏幕上的实际像素） |
| **Slides vs Template** | Template = 结构模具（可复用）。Slides = 模具 + 皮肤 + 内容的最终产物（一个具体实例） |

## Source Origins

| Term | Primary Source |
|------|---------------|
| Slides, Slide, Section, Template, Layout, Theme, Animation | html-ppt-skill |
| Design, Component | baoyu-skills（原称 Preset，slides-on 重命名为 Design） |
| Style | CSS/web standard |
