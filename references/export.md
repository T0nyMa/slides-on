# 导出格式矩阵

## 导出路径对比

| 维度 | PNG 截图 | PPTX（可编辑） | PDF |
|------|---------|--------------|-----|
| **文件体积** | 2-10 MB | 0.5-5 MB | 3-15 MB |
| **文本可编辑** | 否 | 是（原生形状/文本） | 否 |
| **视觉保真** | 100% | 80-95% | 100% |
| **生成速度** | 快（~2s/页） | 快（单次加载批量导出） | 快（拼合） |
| **适用场景** | 预览、社媒 | 分发、协作编辑 | 打印、邮件 |
| **依赖** | Playwright | Playwright + dom-to-pptx | pdf-lib |

## 路径 A: PNG 截图（render-precise.ts）

### 命令

```bash
cd .claude/skills/slides-on
bun scripts/render-precise.ts <index.html> [options]
```

### 参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `<input>` | (必需) | HTML 文件路径 |
| `--canvas PRESET\|WxH` | `16:9` | 画布尺寸预设或自定义 |
| `--dsf N` | `2` | Device scale factor（@2x = 双倍像素） |
| `--slides N\|auto` | `auto` | 页数或自动检测 |
| `--format png\|jpeg` | `png` | 输出格式 |
| `--quality N` | `90` | JPEG 质量 (1-100) |
| `--output DIR` | `<input>-png/` | 输出目录 |
| `--wait-animations` | `false` | 等待 CSS 动画完成 |
| `--extra-delay MS` | `500` | 额外等待时间 |
| `--verbose` | `false` | 详细日志 |

### 画布预设

| 预设 | 尺寸 | @2x 输出 | 用途 |
|------|------|---------|------|
| `16:9` | 1920×1080 | 3840×2160 | 标准宽屏演示 |
| `4:3` | 1024×768 | 2048×1536 | 经典投影仪 |
| `3:4` | 810×1080 | 1620×2160 | 小红书竖版 |
| `9:16` | 1080×1920 | 2160×3840 | 全屏竖版/Stories |
| `1:1` | 1080×1080 | 2160×2160 | 方形/Instagram |
| `2.35:1` | 1920×817 | 3840×1634 | 电影宽画幅 |
| `a4-landscape` | 1123×794 | 2246×1588 | A4 横向打印 |

自定义：`--canvas 810x1080`

### 渲染特性

- **字体等待**：`document.fonts.ready` 确保 web fonts 加载完成再截图
- **动画检测**：`getAnimations()` API 检测 CSS 动画完成（5s 安全上限）
- **导航模式自动检测**：hash (`#/N`) vs query (`?slide=N`)
- **页数自动检测**：遍历 `.slide`、`.deck`、`[data-slide]` 选择器
- **错误恢复**：单页失败不影响其他页，最终输出汇总报告

### 示例

```bash
# 标准 16:9 技术分享
bun scripts/render-precise.ts deck.html --canvas 16:9 --dsf 2

# 小红书 3:4 竖版
bun scripts/render-precise.ts xhs-deck.html --canvas 3:4 --dsf 2

# JPEG 快速预览
bun scripts/render-precise.ts deck.html --format jpeg --quality 85 --dsf 1

# 手动指定页数 + 动画等待
bun scripts/render-precise.ts deck.html --slides 12 --wait-animations --verbose
```

## 路径 B: PPTX 可编辑（html-to-pptx.ts）

通过 dom-to-pptx 将 HTML 元素映射为 PowerPoint 原生形状和文本，生成可编辑的 .pptx 文件。

### 命令

```bash
bun scripts/html-to-pptx.ts <index.html> [--output filename.pptx]
```

### 优势

- 文本完全可编辑（字体、大小、颜色）
- 形状可移动和修改
- 文件体积小
- 单次加载批量导出，速度快

### 限制

- 视觉保真度受限于 dom-to-pptx 映射能力（80-95%）
- 复杂 CSS 布局（Grid/Flexbox）可能错位
- Canvas/SVG 元素不支持
- 依赖字体嵌入（Google Fonts 需 crossorigin）

### 适用场景

- 需要发给他人继续编辑
- 内部技术分享、讨论
- 文字为主的内容

## 路径 C: PDF 拼合

将 PNG 截图拼合为 PDF 文件。

### 命令

```bash
bun scripts/merge-to-pdf.ts <png-dir> [--output filename.pdf]
```

### 适用场景

- 打印分发
- 邮件附件
- 存档

## 导出格式选择流程图

```
需要编辑文字？
  ├── YES → 路径 B: PPTX（html-to-pptx.ts）
  └── NO → 需要打印？
              ├── YES → 路径 C: PDF
              └── NO → 需要演示？
                        ├── YES → 路径 B: PPTX
                        └── NO → 路径 A: PNG（预览/社媒）
```

## 批量导出脚本

```bash
#!/bin/bash
# export-all.sh — 一键导出所有格式
DECK=$1
NAME=$(basename "$DECK" .html)

# PNG
bun scripts/render-precise.ts "$DECK" --output "./out/$NAME-png"

# PPTX
bun scripts/html-to-pptx.ts "$DECK" --output "./out/$NAME.pptx"

# PDF
bun scripts/merge-to-pdf.ts "./out/$NAME-png" --output "./out/$NAME.pdf"

echo "Exports: out/$NAME.{png,pptx,pdf}"
```

## 质量检查清单

导出后验证：
- [ ] PNG：所有页面生成、无截断、字体正常渲染
- [ ] PNG：@2x 分辨率正确（尺寸 = 画布 × DSF）
- [ ] PPTX：页数正确、文本可编辑、顺序正确
- [ ] PDF：页面尺寸正确、可正常打印
- [ ] 文件大小合理（PNG 每张 100-500KB，PPTX < 5MB，PDF < 15MB）
