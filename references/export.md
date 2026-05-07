# 导出格式矩阵

## 导出路径对比

| 维度 | PNG 截图 | PPTX（拼合） | PPTX（原生） | PDF |
|------|---------|------------|------------|-----|
| **文件体积** | 2-10 MB | 5-20 MB | 0.5-5 MB | 3-15 MB |
| **文本可编辑** | 否 | 否 | 是 | 否 |
| **视觉保真** | 100% | 100% | 80-95% | 100% |
| **生成速度** | 快（~2s/页） | 快（拼合） | 快（代码生成） | 快（拼合） |
| **适用场景** | 预览、社媒 | 分发、演讲 | 协作编辑 | 打印、邮件 |
| **依赖** | Playwright | pptxgenjs | pptxgenjs | pdf-lib |

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

## 路径 B: PPTX 拼合

将 PNG 截图拼合为 PPTX 文件，每张图片作为一页幻灯片（全幅背景）。

### 命令

```bash
bun {baoyu-slide}/scripts/merge-to-pptx.ts <png-dir> [--output filename.pptx]
```

### 适用场景

- 需要发给他人演示，但不需要编辑内容
- 视觉保真度要求高（所见即所得）
- 快速交付（无需调整排版）

### 限制

- 文本不可编辑（图片形式）
- 文件体积较大
- 不支持 PowerPoint 母版/主题

## 路径 C: PDF 拼合

将 PNG 截图拼合为 PDF 文件。

### 命令

```bash
bun {baoyu-slide}/scripts/merge-to-pdf.ts <png-dir> [--output filename.pdf]
```

### 适用场景

- 打印分发
- 邮件附件
- 存档

## 路径 D: 原生 PPTX（pptxgenjs）

直接通过 pptxgenjs API 生成 .pptx 文件，文本和图表可编辑。

### 优势

- 文本完全可编辑（字体、大小、颜色）
- 图表使用 PowerPoint 原生图表对象
- 文件体积小
- 支持 PowerPoint 母版和主题

### 限制

- 视觉效果受限于 pptxgenjs 能力（无 CSS 级别控制）
- 复杂排版需要大量代码
- AI 图片仍需以图片形式嵌入

### 推荐策略

| 页面类型 | 生成方式 |
|---------|---------|
| 文字内容页 | pptxgenjs 原生（可编辑） |
| 数据图表的 | pptxgenjs chart API（可编辑） |
| AI 插图页 | 图片嵌入 |
| SVG 架构图 | 转 PNG 后嵌入 |
| 复杂排版页 | PNG 截图嵌入 |

## 导出格式选择流程图

```
需要编辑文字？
  ├── YES → 路径 D: 原生 PPTX（文字页用 pptxgenjs，视觉页嵌入图片）
  └── NO → 需要打印？
              ├── YES → 路径 C: PDF
              └── NO → 需要演示？
                        ├── YES → 路径 B: PPTX 拼合
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
bun .claude/skills/baoyu-slide-deck/scripts/merge-to-pptx.ts "./out/$NAME-png" --output "./out/$NAME.pptx"

# PDF
bun .claude/skills/baoyu-slide-deck/scripts/merge-to-pdf.ts "./out/$NAME-png" --output "./out/$NAME.pdf"

echo "Exports: out/$NAME.{png,pptx,pdf}"
```

## 质量检查清单

导出后验证：
- [ ] PNG：所有页面生成、无截断、字体正常渲染
- [ ] PNG：@2x 分辨率正确（尺寸 = 画布 × DSF）
- [ ] PPTX：页数正确、图片无拉伸、顺序正确
- [ ] PDF：页面尺寸正确、可正常打印
- [ ] 文件大小合理（PNG 每张 100-500KB，PPTX < 20MB，PDF < 15MB）
