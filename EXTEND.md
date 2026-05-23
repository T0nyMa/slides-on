# EXTEND.md — slides-on 用户扩展配置

在此文件中自定义演示文稿的默认行为，无需修改核心代码。
优先级：EXTEND.md > Skill 默认值。

## defaults

所有 deck 的默认设置，可被单次请求覆盖。

```yaml
defaults:
  preset: technical           # 默认 preset（17 个可选）
  theme: blueprint            # 默认 theme（36 个可选，优先级低于 preset）
  font-sans: "Inter"          # 默认无衬线字体
  font-mono: "JetBrains Mono" # 默认等宽字体
  animation: fade-up          # 默认动画（data-anim 值）
  density: balanced           # 信息密度：minimal | balanced | dense
  export_format: png          # 默认导出格式：png | pptx | pdf | all
  export_dsf: 2               # 默认设备像素比（@2x Retina）
  export_canvas: "16:9"       # 默认画布尺寸
```

## brand

跨 deck 复用的品牌视觉元素。

```yaml
brand:
  logo: ""                    # Logo 图片路径（如 assets/logo.svg）
  primary_color: ""           # 品牌主色（如 "#1a73e8"）
  secondary_color: ""         # 品牌辅色
  footer_text: ""             # 页脚文字（如 "© 2026 My Company"）
  favicon: ""                 # 网站图标路径
```

设置后，品牌元素自动注入 deck 的 cover 页和页脚区域。

## deck_structure

自定义 deck 页面序列骨架，覆盖默认的 `cover → toc → [sections] → cta → thanks`。

```yaml
deck_structure:
  sequence:
    - cover
    - toc
    - sections
    - summary
    - qna
    - thanks
```

可用页面类型：`cover`、`toc`、`sections`、`section-divider`、`summary`、`cta`、`qna`、`thanks`、`references`、`appendix`。

## slide_count

覆盖默认的文档长度 → 页数映射。

```yaml
slide_count:
  min: 5                      # 最小页数
  max: 30                     # 最大页数
  per_1000_chars: 6           # 每千字建议页数（默认 6）
  ratios:
    under_500: 0.01           # < 500 字：字数的 1%（即 5 页/500字）
    under_1000: 0.01
    under_3000: 0.008
    over_3000: 0.006
```

## custom_themes

自定义 theme（CSS Variables），放入 `assets/themes/` 目录后在此声明。

```yaml
custom_themes:
  my-dark-theme: "assets/themes/my-dark-theme.css"
  brand-theme: "assets/themes/brand-theme.css"
```

Theme CSS 格式：
```css
:root {
  --bg: #0d1117;
  --surface: #161b22;
  --text-1: #e6edf3;
  --text-2: #8b949e;
  --text-3: #6e7681;
  --accent: #58a6ff;
  --accent-2: #bc8cff;
  --grad: linear-gradient(135deg, #0d1117, #161b22);
  --font-sans: "Inter", "Noto Sans SC", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  --radius: 6px;
  --shadow: 0 4px 24px rgba(0,0,0,0.3);
}
```

## custom_designs

自定义 Design CSS（完整视觉皮肤），放入 `assets/designs/` 目录后在此声明。

```yaml
custom_designs:
  my-brand: "assets/designs/my-brand.css"
  dark-editorial: "assets/designs/dark-editorial.css"
```

Design CSS 与 Theme CSS 的区别：Theme 只覆盖 CSS 变量（颜色/字体），Design CSS 还包含 Chrome 元素样式（`chr-*`：topbar, footer, blobs 等）和 c-* 组件扩展（颜色变体、间距覆盖）。Design CSS 用 body class（`.d-{name}`）作用域，不污染 `:root`。

Design CSS 结构：
```css
.d-my-brand {
  --bg: #fff; --surface: #fff; --text-1: #111; --accent: #333;
  --mb-peach: #ffd8c2; --mb-code-bg: #222;
  background: var(--bg); color: var(--text-1);
}

/* Chrome elements */
.d-my-brand .chr-topbar { ... }
.d-my-brand .chr-chip { ... }
.d-my-brand .chr-footer { ... }

/* Typography */
.d-my-brand .chr-title { font-size: 10cqi; }
.d-my-brand .chr-heading { font-size: 7cqi; }

/* c-* extensions */
.d-my-brand .c-card { padding: 3cqi; border: none; }
.d-my-brand .c-card.peach { background: var(--mb-peach); }
.d-my-brand .c-grid-2 { gap: 2.5cqi; }

@container (max-width: 1000px) {
  .d-my-brand .c-grid-2 { grid-template-columns: repeat(2, 1fr); }
}
```

详见 `assets/designs/` 中的实现（pastel-card.css, white-editorial.css, xhs-post.css, hermes-cyber-terminal.css）。

## custom_layouts

自定义单页 layout（覆盖或新增 31 种内置 layout）。

```yaml
custom_layouts:
  my-two-column: "templates/single-page/my-two-column.html"
  feature-showcase: "templates/single-page/feature-showcase.html"
```

Layout HTML 必须遵循 html-ppt 约定：使用 `.g2`-`.g6` 等 grid class，CSS Variables 引用 `var(--xxx)`。

## custom_components

可复用的 HTML 片段，在 layout 中通过约定的注释标记引用。

```yaml
custom_components:
  callout: "assets/components/callout.html"
  metric-card: "assets/components/metric-card.html"
  timeline-item: "assets/components/timeline-item.html"
```

组件在 layout 中通过 `<!-- @component callout -->` 语法引用。

## custom_animations

自定义 CSS 动画。

```yaml
custom_animations:
  my-bounce: "assets/animations/my-bounce.css"
  slide-rotate: "assets/animations/slide-rotate.css"
```

动画通过 `data-anim="my-bounce"` 使用，`runtime.js` 自动触发。

## ai_image

AI 图片生成的默认配置。这些配置通过两种方式生效：

**持久化默认值（环境变量）**：在 shell 配置中设置，所有脚本自动读取，无需每次传参：
```bash
export IMAGINE_PROVIDER="dashscope"
export IMAGINE_MODEL="qwen-image-2.0-pro-2026-04-22"
export IMAGINE_QUALITY="2k"
export IMAGINE_ASPECT="3:4"
export IMAGINE_DESIGN="sketch-notes"
```

**EXTEND.md 声明（Claude 读取）**：Claude 在调用脚本时自动追加这些 CLI 参数：
```yaml
ai_image:
  default_provider: dashscope     # 默认 Provider（10 个可选）
  default_model: "qwen-image-2.0-pro-2026-04-22"  # 默认模型
  default_quality: "2k"           # 默认质量：normal | 2k
  default_aspect: "3:4"           # 默认宽高比
  default_design: sketch-notes    # 默认 Design（结构化 prompt 模式）
  provider_order:                 # Provider 优先级（覆盖默认）
    - google
    - openai
    - dashscope
  prompt_prefix: ""               # 全局 prompt 前缀
  prompt_suffix: ""               # 全局 prompt 后缀
```

可选 Provider：`openai`、`azure`、`google`、`openrouter`、`dashscope`、`zai`、`minimax`、`jimeng`、`seedream`、`replicate`

**优先级**：CLI 参数 > 环境变量 > 脚本内置默认值。详见 `scripts/imagine/config.ts`。

## render

HTML 编写和渲染默认配置。

```yaml
render:
  default_design: pastel-card       # 默认 Design CSS
  default_canvas: "3:4"             # 默认画布
  output_dir: ""                    # 默认输出目录
```

## export

导出偏好设置。

```yaml
export:
  default_format: png             # png | pptx | pdf | all
  png:
    dsf: 2                        # 默认 @2x
    format: png                   # png | jpeg
    jpeg_quality: 90
  pptx:
    mode: hybrid                  # hybrid | merge | native
    merge_script: ""              # 自定义 merge 脚本路径（空=使用内置）
  pdf:
    page_size: "16:9"             # A4 | 16:9 | letter
    merge_script: ""              # 自定义 merge 脚本路径
  output_dir: ""                  # 默认输出目录（空=deck 文件旁）
```

## content_types

自定义内容信号词和默认 layout 映射，合并到内置映射表。

```yaml
content_types:
  - signal: ["招聘", "团队", "HC"]
    layout: three-column
    preset: corporate
  - signal: ["开源", "GitHub", "社区"]
    layout: bullets
    preset: blueprint
```

## presets

自定义 preset（场景化捆绑包）。

```yaml
presets:
  my-team-preset:
    theme: corporate-clean
    font_sans: "Inter"
    font_mono: "JetBrains Mono"
    animation: rise-in
    density: balanced
    texture: clean
    mood: professional
    typography: geometric
```

自定义 preset 可在 defaults 中引用：`preset: my-team-preset`

## 完整示例

一个团队的 EXTEND.md 完整配置示例：

```markdown
# EXTEND.md

## defaults
- preset: technical
- theme: blueprint
- font-sans: "Inter"
- font-mono: "JetBrains Mono"
- animation: fade-up
- density: balanced
- export_format: all
- export_dsf: 2
- export_canvas: "16:9"

## brand
- logo: assets/logo.svg
- primary_color: "#1a73e8"
- footer_text: "© 2026 My Team"

## deck_structure
- sequence: cover, toc, [sections], summary, qna

## ai_image
- default_provider: dashscope
- default_model: "qwen-image-2.0-pro-2026-04-22"
- default_quality: 2k
- default_aspect: "3:4"
- default_design: sketch-notes

## export
- default_format: all
- png.dsf: 2
- pptx.mode: hybrid
```

## 注意事项

1. **不修改核心文件**：EXTEND.md 只添加/覆盖，不修改 Skill 自带文件
2. **路径相对于 skill 根目录**：`assets/themes/my-theme.css` 指向 `.claude/skills/slides-on/assets/themes/my-theme.css`
3. **优先级**：单次请求参数 > EXTEND.md > Skill 默认值
4. **增量合并**：自定义 content_types 合并到内置映射，不替换
5. **验证**：首次配置后运行一次完整 pipeline 验证所有自定义项生效
