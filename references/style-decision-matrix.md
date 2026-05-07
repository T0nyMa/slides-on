# 风格决策矩阵

内容信号 → 主题/风格/布局的映射表。用于 Step 2 自动推荐。

## 场景 → Preset 映射

| 场景 | 信号词 | 推荐 Preset | 特征 |
|------|--------|------------|------|
| **技术分享** | 代码、架构、API、系统设计、开源、框架 | blueprint (蓝图纸) | 蓝图网格、等宽字体、蓝色系 |
| | | dark-atmospheric (暗色氛围) | 深色背景、高对比、科技感 |
| | | minimal (极简) | 白底黑字、无干扰 |
| **学术报告** | 研究、实验、方法、数据、结论、论文 | scientific (科学) | 白底、无衬线、数据图表优化 |
| | | minimal | 极简、学术白 |
| **商业演示** | 产品、市场、增长、收入、战略、KPI | corporate (企业) | 专业蓝、清晰层级 |
| | | bold-editorial (大胆编辑) | 大字、强对比、杂志感 |
| **教学课件** | 学习、基础、入门、练习、教程、指南 | hand-drawn-edu (手绘教学) | 手绘风格、亲切友好 |
| | | chalkboard (黑板) | 黑板风格、粉笔字 |
| | | notion | Notion 风格、模块化 |
| **社交媒体 (XHS)** | 小红书、分享、干货、推荐、技巧 | xiaohongshu-white | 白色清新、卡片式 |
| | | soft-pastel (柔和粉彩) | 柔和色调、温暖感 |
| | | minimal-white | 简洁白 |
| **创意提案** | 概念、愿景、未来、设计、品牌、创意 | sketch-notes (草图笔记) | 手绘草图、自由感 |
| | | watercolor (水彩) | 水彩效果、艺术感 |
| | | vector-illustration (矢量插画) | 扁平矢量、现代感 |
| **数据报告** | 数据、分析、趋势、统计、指标 | editorial-infographic | 编辑信息图、数据密集 |
| | | corporate | 专业、清晰 |
| **内部周报** | 周报、进展、OKR、复盘、todo | notion | 模块化清单 |
| | | minimal | 简单直接 |

## 内容类型 → Layout 映射

### 文字内容

| 内容特征 | 推荐 Layout | 备选 |
|---------|------------|------|
| 3-5 个要点 | `bullets` | `big-quote`（金句强调） |
| 6+ 个要点分组 | `three-column` | `two-column` |
| 单句金句/引用 | `big-quote` | — |
| 多段落文字 | `bullets`（拆分要点） | `two-column` |
| 清单/待办 | `todo-checklist` | `bullets` |

### 数据展示

| 内容特征 | 推荐 Layout | 备选 |
|---------|------------|------|
| 趋势/时间序列 | `chart-line` | — |
| 对比/排名 | `chart-bar` | `table` |
| 占比/构成 | `chart-pie` | `chart-radar`（多维） |
| 多维度评估 | `chart-radar` | `kpi-grid` |
| 关键指标（3-4 个） | `kpi-grid` | `stat-highlight` |
| 单个关键数字 | `stat-highlight` | — |

### 技术内容

| 内容特征 | 推荐 Layout | 备选 |
|---------|------------|------|
| 代码片段 | `code` | `terminal`（命令执行） |
| 命令行操作 | `terminal` | `code` |
| Diff/变更 | `diff` | — |
| 架构说明 | `arch-diagram` | → baoyu-diagram |
| 流程图 | `flow-diagram` | → baoyu-diagram (flowchart) |
| 时间线 | `timeline` | `roadmap` |
| 步骤流程 | `process-steps` | `flow-diagram` |
| 甘特图/排期 | `gantt` | `roadmap` |

### 对比分析

| 内容特征 | 推荐 Layout | 备选 |
|---------|------------|------|
| A vs B 对比 | `comparison` | `two-column` |
| 优劣分析 | `pros-cons` | `comparison` |
| 数据表格 | `table` | — |
| 思维导图 | `mindmap` | → baoyu-diagram (structural) |

### 视觉内容

| 内容特征 | 推荐方式 | 备选 |
|---------|---------|------|
| 概念插图 | → baoyu-imagine | — |
| 信息图 | → baoyu-infographic | — |
| 架构图 | → baoyu-diagram | `arch-diagram` (html-ppt) |
| 封面图 | → baoyu-cover-image | `cover` (html-ppt) |
| 图片展示（多图） | `image-grid` | — |
| 图片展示（单图） | `image-hero` | — |

### 导航页

| 用途 | 推荐 Layout |
|------|------------|
| 封面 | `cover` 或 → baoyu-cover-image |
| 目录 | `toc` |
| 章节分隔 | `section-divider` |
| 行动号召 | `cta` |
| 致谢 | `thanks` |

## Theme → CSS 文件映射

html-ppt 36 个 theme，位于 `{html-ppt}/assets/themes/`：

| 类别 | Theme | CSS 文件 | 色调 |
|------|-------|---------|------|
| 浅色 | Minimal White | `minimal-white.css` | 白底黑字 |
| | Academic Paper | `academic-paper.css` | 白底学术 |
| | Swiss Grid | `swiss-grid.css` | 网格系统 |
| | Editorial Serif | `editorial-serif.css` | 衬线编辑 |
| | Solarized Light | `solarized-light.css` | 暖黄底 |
| | Catppuccin Latte | `catppuccin-latte.css` | 奶白柔和 |
| | Soft Pastel | `soft-pastel.css` | 粉彩柔和 |
| | Japanese Minimal | `japanese-minimal.css` | 日式极简 |
| | Xiaohongshu White | `xiaohongshu-white.css` | 小红书白 |
| | Rose Pine | `rose-pine.css` | 玫瑰粉 |
| 深色 | Blueprint | `blueprint.css` | 蓝图蓝 |
| | Dark Atmospheric | — (preset) | 暗色氛围 |
| | Dracula | `dracula.css` | 紫黑 |
| | Tokyo Night | `tokyo-night.css` | 蓝黑 |
| | Nord | `nord.css` | 蓝灰 |
| | Gruvbox Dark | `gruvbox-dark.css` | 暖黑 |
| | Catppuccin Mocha | `catppuccin-mocha.css` | 深棕 |
| | Terminal Green | `terminal-green.css` | 终端绿 |
| 强风格 | Cyberpunk Neon | `cyberpunk-neon.css` | 霓虹 |
| | Neo Brutalism | `neo-brutalism.css` | 粗野主义 |
| | Memphis Pop | `memphis-pop.css` | 孟菲斯波普 |
| | Bauhaus | `bauhaus.css` | 包豪斯 |
| | Vaporwave | `vaporwave.css` | 蒸汽波 |
| | Y2K Chrome | `y2k-chrome.css` | Y2K 铬 |
| | Retro TV | `retro-tv.css` | 复古电视 |
| | Magazine Bold | `magazine-bold.css` | 杂志大胆 |
| 专业 | Corporate Clean | `corporate-clean.css` | 企业蓝 |
| | Pitch Deck VC | `pitch-deck-vc.css` | VC 路演 |
| | News Broadcast | `news-broadcast.css` | 新闻播报 |
| | Engineering Whiteprint | `engineering-whiteprint.css` | 工程白图 |
| | Sharp Mono | `sharp-mono.css` | 锐利等宽 |
| 创意 | Arctic Cool | `arctic-cool.css` | 极地冷色 |
| | Aurora | `aurora.css` | 极光 |
| | Glassmorphism | `glassmorphism.css` | 玻璃态 |
| | Midcentury | `midcentury.css` | 中世纪现代 |
| | Rainbow Gradient | `rainbow-gradient.css` | 彩虹渐变 |
| | Sunset Warm | `sunset-warm.css` | 日落暖色 |

## 信息图：Layout × Style 组合

baoyu-infographic 提供 21 种布局 × 22 种视觉风格的组合矩阵。常用推荐：

| 信息类型 | 推荐 Layout | 推荐 Style |
|---------|------------|-----------|
| 时间线/发展史 | `linear-progression` | `technical-schematic` / `hand-drawn-edu` |
| A vs B 对比 | `binary-comparison` | `corporate-memphis` / `bold-graphic` |
| 层级结构 | `hierarchical-layers` | `craft-handmade` / `ikea-manual` |
| 流程/漏斗 | `funnel` | `bold-graphic` / `corporate-memphis` |
| 多模块展示 | `bento-grid` | `kawaii` / `retro-pop-grid` |
| 数据仪表盘 | `dashboard` | `technical-schematic` |
| 冰山模型 | `iceberg` | `storybook-watercolor` / `ui-wireframe` |
| 高密度信息 | `dense-modules` | `technical-schematic` / `bold-graphic` |
| 维恩图 | `venn-diagram` | `aged-academia` / `ui-wireframe` |
| 故事叙述 | `story-mountain` | `storybook-watercolor` / `hand-drawn-edu` |

## 决策流程图

```
内容分析完成
    │
    ▼
检测到学术信号？（研究/实验/数据/论文）
    │
    ├── YES → scientific / minimal + academic-pptx 规范
    │         ├── Action Titles（每页标题是完整句子）
    │         ├── 一页一观点
    │         ├── 40 词上限
    │         └── Conclusions 结尾（非 Thank You）
    │
    ├── NO → 检测场景信号
    │         │
    │         ├── 代码/架构 → 技术分享 → blueprint / dark-atmospheric
    │         ├── 产品/增长 → 商业演示 → corporate / bold-editorial
    │         ├── 入门/教程 → 教学课件 → hand-drawn-edu / chalkboard
    │         ├── 小红书 → 社交媒体 → xiaohongshu-white
    │         └── 概念/创意 → 创意提案 → sketch-notes / watercolor
    │
    ▼
选择 theme（36 个）或 preset（17 个）
    │
    ▼
每页匹配 layout（31 种）或 AI 引擎（diagram / imagine / infographic）
    │
    ▼
输出 style-decision.md
```
