# Preset 维度映射表

每个 Preset 在 Texture、Mood、Typography、Density 四个维度上的默认取值，以及绑定的默认主题。

## 映射表

| Preset | Texture | Mood | Typography | Density | Default Theme |
|--------|---------|------|------------|---------|---------------|
| blueprint | grid | dark | technical | balanced | `blueprint.css` |
| bold-editorial | clean | vibrant | editorial | dense | `magazine-bold.css` |
| chalkboard | paper | dark | handwritten | balanced | — (custom: 黑板绿底白粉笔字) |
| corporate | clean | professional | geometric | balanced | `corporate-clean.css` |
| dark-atmospheric | clean | dark | geometric | minimal | — (custom: 深黑渐变, 高对比, 霓虹点缀) |
| editorial-infographic | clean | neutral | editorial | dense | — (custom: 杂志编辑风, 信息图混合, 衬线标题) |
| fantasy-animation | organic | vibrant | handwritten | minimal | — (custom: 梦幻插画, 暖色渐变, 手写字体) |
| hand-drawn-edu | paper | warm | handwritten | balanced | — (custom: 纸纹理背景+手绘边框+马克笔色) |
| intuition-machine | grid | dark | technical | dense | `blueprint.css` |
| minimal | clean | neutral | geometric | minimal | `minimal-white.css` |
| notion | clean | neutral | geometric | balanced | — (custom: Notion 白底黑字, 无衬线, 模块卡片) |
| pixel-art | pixel | cool | technical | balanced | — (custom: 像素网格, 8-bit 字体, 高饱和) |
| scientific | clean | neutral | editorial | balanced | `academic-paper.css` |
| sketch-notes | paper | warm | handwritten | minimal | — (custom: 牛皮纸底, 手绘线条, 马克笔色) |
| vector-illustration | clean | vibrant | geometric | balanced | — (custom: 扁平矢量插画, 高饱和色块, 圆角) |
| vintage | organic | warm | editorial | balanced | — (custom: 泛黄纸张, 衬线, 暖棕墨) |
| watercolor | organic | warm | handwritten | minimal | — (custom: 水彩纸张纹理, 湿笔触, 柔色) |

## 维度含义速查

| 维度 | 可选值 | 简要说明 |
|------|--------|---------|
| **Texture** | clean, grid, organic, pixel, paper | 画面质感，决定背景纹理和视觉深度 |
| **Mood** | professional, warm, cool, vibrant, dark, neutral | 情感基调，决定配色方案和氛围 |
| **Typography** | geometric, humanist, handwritten, editorial, technical | 字体风格，决定 `--font-sans` / `--font-mono` CSS 变量 |
| **Density** | minimal, balanced, dense | 信息密度，决定字号、间距、每页元素数量 |

## Custom Theme 说明

标记为 `— (custom)` 的 Preset 不绑定已有 CSS 文件，而是在运行时通过组合 CSS 变量实现其视觉风格。具体规则见各 Preset 文档的 Visual Identity 章节。
