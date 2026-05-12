# Design 维度映射表

17 个 Design 概念作为视觉风格参考，每个对应一组 layer 组合。选择 design 概念后，用下表查对应的 layer 参数填入 `slides.json`。

## 映射表

| Design | Typography | Texture | Density | Theme | 说明 |
|--------|------------|---------|---------|-------|------|
| blueprint | technical | grid | balanced | `blueprint` | 蓝图网格、工程图纸风 |
| bold-editorial | editorial | clean | dense | `magazine-bold` | 大胆杂志编辑风 |
| chalkboard | handwritten | paper | balanced | `gruvbox-dark` | 黑板粉笔字 |
| corporate | geometric | clean | balanced | `corporate-clean` | 企业商务风 |
| dark-atmospheric | geometric | clean | minimal | `dracula` | 深黑渐变、高对比 |
| editorial-infographic | editorial | clean | dense | `minimal-white` | 白底杂志 + 信息图 |
| fantasy-animation | handwritten | organic | minimal | `aurora` | 梦幻插画暖色渐变 |
| hand-drawn-edu | handwritten | paper | balanced | `soft-pastel` | 纸纹理 + 手绘边框 |
| intuition-machine | technical | grid | dense | `sharp-mono` | 数据密集仪表盘 |
| minimal | geometric | clean | minimal | `minimal-white` | 极简白底 |
| notion | geometric | clean | balanced | `minimal-white` | Notion 风格模块卡片 |
| pixel-art | technical | pixel | balanced | `retro-tv` | 像素网格 8-bit |
| scientific | editorial | clean | balanced | `academic-paper` | 学术论文风 |
| sketch-notes | handwritten | paper | minimal | `soft-pastel` | 牛皮纸手绘 |
| vector-illustration | geometric | clean | balanced | `bauhaus` | 扁平矢量插画 |
| vintage | editorial | organic | balanced | `midcentury` | 泛黄衬线暖棕 |
| watercolor | handwritten | organic | minimal | `rose-pine` | 水彩纸纹理 |

## 使用方式

在 `slides.json` 的 `config.design` 中填入对应的 layer 组合：

```json
{
  "config": {
    "design": {
      "typography": "editorial",
      "texture": "clean",
      "density": "dense",
      "theme": "minimal-white"
    }
  }
}
```

例如："科学论文"场景 → 查表得 `scientific` = `editorial + clean + balanced + academic-paper`。

## 维度含义速查

| 维度 | 可选值 | 简要说明 |
|------|--------|---------|
| **Typography** | geometric, editorial, humanist, handwritten, technical | 字体风格，控制 `--font-display` / `--font-sans` / `--font-mono` |
| **Texture** | clean, paper, grid, organic, pixel | 画面质感，控制背景纹理/阴影/圆角 |
| **Density** | minimal, balanced, dense | 信息密度，控制字号/间距/每页元素数 |
| **Theme** | 36 个 CSS 文件（`assets/themes/`） | 颜色方案，控制 `--bg` / `--text-1` / `--accent` 等 |

## 自定义

上表为推荐映射，用户可按需覆盖任意维度。例如在 `scientific` 基础上换用 `dense` density 获得更紧凑的排版，或换用 `dracula` theme 获得深色版本。
