# slides-on 多技能拆分设计

> **目标**：将一个 579 行的 SKILL.md 拆分为 4 个聚焦的技能，每个 ~150 行，
> 触发精准、职责清晰。共享代码（scripts/assets/templates）不重复。

## 目录结构

```
slides-on/                        # 安装一次，4 个 SKILL.md = 4 个 skill
├── slides-card/SKILL.md           # 3:4 小红书图文卡片
├── slides-ppt/SKILL.md            # 16:9 演示文稿
├── slides-imagine/SKILL.md        # AI 插图/封面/信息图生成
├── slides-diagram/SKILL.md        # SVG 架构图/流程图
├── scripts/                       # 共享代码（不变）
├── assets/                        # 共享 CSS/JS（不变）
├── templates/                     # 共享模板（不变）
├── references/                    # 共享知识库（不变）
├── EXTEND.md                      # 共享扩展配置（不变）
└── package.json
```

## 4 个技能定义

### 1. slides-card — 图文卡片（3:4 竖版）

**触发词**：小红书、图文、卡片、帖子、social、image card、做图文、做成卡片

**Pipeline**：
```
内容分析 → 风格决策 → L0 验证 → HTML 渲染 → L1 QA → 导出
```

**关键规则**：
- canvas 固定 `3:4`，body class `portrait`
- 使用 Component Palette（c-* 自由拼装），不用 single-page layout
- design 推荐 pastel-card / xhs-post / 自由组合
- 密度：3-6 组件，卡片正文 ≤ 25 字
- 导出：810×1080 @2x PNG

**核心 references**：
- content-rules-portrait.md — 3:4 内容规范
- portrait-user-guide.md — 竖版制作指南
- component-recipes.md — 组件配方
- content-planning.md — 内容→组件查表
- components.md — 组件库参考

### 2. slides-ppt — 演示文稿（16:9 横版）

**触发词**：PPT、slides、演示、周报、汇报、路演、技术分享、deck、proposal

**Pipeline**：
```
内容分析 → 风格决策 → L0 验证 → HTML 渲染 → L1 QA → 导出
```

**关键规则**：
- canvas 固定 `16:9`，body class `landscape`
- 使用 single-page layout + c-* 组件混合
- design 推荐 white-editorial / hermes-cyber-terminal / 自由组合
- 密度：2-6 组件，卡片正文 ≤ 40 字
- 导出：1920×1080 @2x PNG / PPTX / PDF

**核心 references**：
- content-rules.md — 16:9 内容规范
- layouts.md — 31 种布局参考
- themes.md — 36 主题
- designs/ — 18 个 design 概念
- analysis-framework.md — 内容分析框架

### 3. slides-imagine — AI 生图

**触发词**：AI 生图、生成图片、插图、封面图、信息图、配图、generate image、illustration

**Pipeline**：
```
提示组装（三层结构）→ Provider 选择 → 图片生成 → 图片引用
```

**关键规则**：
- 使用 scripts/imagine/ 工具链
- 三层 prompt 组装：Role → Style Lock → Archetype + Content
- 10 个 Provider，环境变量 + CLI 覆盖
- Anchor chain 模式保持跨页视觉一致
- 产出 PNG 后通过 SlideData.image 字段引用到 slides-card/slides-ppt 中

**核心 references**：
- prompt-construction.md — Prompt 组装
- archetypes.md — 10 种构图模板
- style-definitions/ — 17 个 style lock
- ai-visuals.md — AI 视觉总览
- imagine/providers/ — 5 个 provider 文档

### 4. slides-diagram — SVG 制图

**触发词**：架构图、流程图、时序图、结构图、SVG、diagram、draw

**Pipeline**：
```
图类型选择 → SVG 生成（严格 z-order）→ SVG/PNG 嵌入
```

**关键规则**：
- 4 种图类型：architecture / flowchart / sequence / structural
- 严格 8 层 z-order：背景 → 区域 → 箭头 → 遮罩 → 组件 → 文本 → 图例 → 标题
- 8 种语义色：Primary #60a5fa / Secondary #a78bfa / Tertiary #34d399 / Accent #f472b6 / Alert #fb923c / Connector #94a3b8 / Neutral #334155 / Highlight #fbbf24
- 可以内联到 slides.json 的 html 字段，或 `<img>` 引用

**核心 references**：
- diagram/architecture.md
- diagram/flowchart.md
- diagram/sequence.md
- diagram/structural.md

## 共享依赖

所有 4 个技能依赖同一套 `../scripts/` 和 `../assets/`：

| 被依赖 | slides-card | slides-ppt | slides-imagine | slides-diagram |
|--------|-----------|-----------|---------------|--------------|
| scripts/assemble/ | ✅ | ✅ | — | — |
| scripts/visual-qa.ts | ✅ | ✅ | — | — |
| scripts/qa.ts | ✅ | ✅ | — | — |
| scripts/render-precise.ts | ✅ | ✅ | — | — |
| scripts/html-to-pptx.ts | — | ✅ | — | — |
| scripts/imagine/ | — | — | ✅ | — |
| assets/ | ✅ | ✅ | — | — |

## 迁移步骤

1. 创建 4 个技能目录，各含 SKILL.md
2. 从原 SKILL.md 提取内容到各 SKILL.md，裁剪冗余
3. 删除原根目录 SKILL.md（或重命名为 SKILL.md.bak）
4. 更新 package.json 中的 build/package 脚本
5. 重新打包 slides-on.skill 验证
6. 运行 QA 验证 3 个测试用例通过

## 原 SKILL.md 内容分配

| 章节 | slides-card | slides-ppt | slides-imagine | slides-diagram | 删除 |
|------|-----------|-----------|---------------|--------------|------|
| Pipeline 核心流程 | ✅ | ✅ | ✅（简化版）| ✅（简化版）| — |
| Step 1 内容分析 | ✅ | ✅ | — | — | — |
| Step 2 风格决策 | ✅（3:4）| ✅（16:9）| ✅（style lock）| ✅（图类型）| — |
| Step 3 L0 验证 | ✅ | ✅ | — | — | — |
| Step 4 HTML 渲染 | ✅ | ✅ | — | — | — |
| Step 4+ 图片生成 | — | — | ✅ | — | — |
| Step 4+ SVG 生成 | — | — | — | ✅ | — |
| Step 5 导出 | ✅ | ✅ | — | — | — |
| Step 6 修复循环 | ✅ | ✅ | — | — | — |
| 可视化编辑器 | ✅ | ✅ | — | — | — |
| 画布适配 | 仅 3:4 | 仅 16:9 | — | — | — |
| Layout 速查表 | — | ✅ | — | — | — |
| AI 图片生成 | 引用 slides-imagine | 引用 slides-imagine | ✅ | — | — |
| SVG 架构图 | — | — | — | ✅ | — |
