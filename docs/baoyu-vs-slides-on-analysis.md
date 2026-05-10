# baoyu-skills vs slides-on 生图质量差异根因分析

## 一句话结论

slides-on 从 baoyu-skills 继承了 references 目录结构（designs、dimensions、infographic、diagram），但**缺失了 Prompt 工程的核心部分**：结构化 prompt 组装体系、逐风格的具象元素定义、图间一致性锚定机制、以及"图 = 完整内容页"的生成范式。保留的是目录骨架，丢失的是生图方法。

## 差异 1：Prompt 结构 — 一句话 vs 多层结构化

### baoyu 的 prompt 结构（image-cards/xhs-images）

```
Image Specifications（画布/比例/类型）
→ Core Principles（手绘禁用真实感、信息密度、视觉层级）
→ Text Style CRITICAL（文字必须是手写体、高亮笔效果、禁止印刷字体）
→ Language match rules
→ Style Section（具体颜色 hex + 视觉元素 + 排版规则）
→ Layout Section（信息密度 + 留白比例 + 结构描述）
→ Content Section（位置 + 确切中文文字列表 + 视觉概念）
→ Watermark（可选）
```

每层都有**精确的、机器可理解的指令**。例如 sketch-notes style：
- 颜色：背景 `#F5F0E8`、蓝 `#A8D8EA`、薰衣草紫 `#D5C6E0`、薄荷绿 `#B5E5CF`、桃 `#F8D5C4`、强调珊瑚红 `#E8655A`
- 视觉元素：手绘抖动线条、简笔画人物、纸纹理背景、曲线箭头、圆形标记下划线
- 排版：手写体标题、装饰性标签、圆角徽章

### slides-on 的 prompt 结构（base-prompt.md）

```
[Quality Tokens] + [Style Token] + [Composition Description] + [Negative Prompt]
```

其中 style token 只是一个短句：
- `sketch-notes` → `"sketch notes style, hand-drawn, doodle, notebook aesthetic, quick strokes"`（**14 个词**）
- `hand-drawn-edu` → `"hand-drawn educational illustration, sketch style, warm, inviting"`（**10 个词**）
- `notion` → `"notion style, clean, organized, modular, soft neutral tones"`（**11 个词**）

**差距**：baoyu 给图像模型的是详细的风格规范（包含具体 hex 色值、具体视觉元素枚举、排版禁令）；slides-on 给的是模糊的关键词。

## 差异 2：逐风格定义 — 具象 vs 抽象

### baoyu 的 12 style preset 文件

每个 `presets/{style}.md` 包含完整的 YAML 元素组合 + 精确色板 + 视觉元素枚举 + Typeface 规则：

```yaml
# sketch-notes 风格
canvas: { ratio: portrait-3-4, grid: single|dual }
image_effects: { cutout: stylized, stroke: none, filter: none }
typography: { decorated: handwritten, tags: rounded-badge, direction: horizontal }
decorations:
  emphasis: underline|circle-mark|arrows-curvy|star-burst
  background: paper-texture
  doodles: hand-drawn-lines|stars-sparkles|arrows-curvy|squiggles
  frames: rounded-rect
```
```markdown
**Color Palette**: 背景 #F5F0E8, 蓝 #A8D8EA, 薰衣草 #D5C6E0, 薄荷 #B5E5CF, 桃 #F8D5C4, 强调 #E8655A
**Visual Elements**: hand-drawn wobble on all lines; simple stick-figure characters at desks, working, thinking
```

### slides-on 的 17 design 文件

每个 `designs/{design}.md` 是叙事性描述，无结构化的视觉元素枚举：

```markdown
# Hand-drawn Edu
- 手绘教育风格
- 适合教学、培训、入门指南
- 特征：手绘线条、柔和色彩、友好的氛围
```

**差距**：baoyu 告诉图像模型"用什么颜色 hex、画什么元素（wobble lines, stick figures, paper texture）"；slides-on 告诉模型"手绘风格"。后者留给模型的自由度太大，导致质量不可控。

## 差异 3：图间一致性 — Image-1 Anchor Chain

### baoyu 的做法

**这是它最关键的 consistency trick**：

```
Image 1 (cover): 不带 --ref 生成 → 建立视觉锚点
Image 2+: 每张都带 --ref <image-1.png> → 模型参考前图保持角色/颜色/风格一致
```

加上 `--sessionId "cards-{topic}-{timestamp}"`，构成双保险。

### slides-on 的做法

`build-batch.ts` 批量并发生成，无 ref 链。每张图独立，无风格锚定机制。

**差距**：无锚定 → 同 deck 内图与图之间风格漂移。

## 差异 4：图的内容角色 — 完整页面 vs 插图

### baoyu

图 = 完整的内容页。所有文字 baked into image：
- 标题、副标题、要点列表、标注 → 都在图片里
- `Required text only` 列表在 prompt 中明确列出
- 文字风格约束："ALL text MUST be hand-drawn style, use highlighter effects"

### slides-on

图 = 插图/背景。文字走 HTML 层：
- Prompt 中写 `no text, no labels, no numbers, no words` — **禁止图里有文字**
- 图负责视觉氛围，文字靠 HTML 精确渲染

**差距**：这是根本性的路线选择差异。baoyu 的 prompt 把文字渲染作为核心约束（"手写体标题 + 高亮笔效果 + 关键词放大"），slides-on 的 prompt 禁止文字。所以即使 prompt 抄过来，slides-on 也生成不了 baoyu 风格的图——因为生成目标本身就不同。

## 差异 5：内容分析深度 — Engagement 驱动 vs 结构驱动

### baoyu 的分析框架

围绕"社交媒体传播"设计：
- Hook power 评分（数字钩子、痛点钩子、好奇钩子…）
- Swipe Flow 设计（封面→铺垫→核心→收获→结尾）
- Save / Share / Comment 三驱动分析
- 受众画像 → style 推荐映射表
- 互动设计（投票、挑战、@某人）

### slides-on 的分析框架

围绕"演示文稿结构"设计：
- 文档解析、章节拆分、内容类型标注
- Ghost Deck Test（只读标题检验论点完整性）
- 内容类型 → layout 推荐

**差距**：baoyu 的分析决定"这张图怎么让用户停下来、滑下去、点收藏"；slides-on 的分析决定"这页放什么类型的 layout"。前者最终影响 prompt 中视觉张力、颜色、装饰元素的选取。

## 差异 6：EXTEND.md 用户配置 — 有 vs 空

### baoyu

```yaml
preferred_image_backend: auto | codex-imagegen | baoyu-imagine | ask
preferred_style: notion
preferred_layout: dense
preferred_palette: macaron
language: zh
watermark:
  enabled: true
  content: "@myhandle"
```

Step 0 强制检查 EXTEND.md，首次运行走 first-time setup 引导用户配置偏好。

### slides-on

EXTEND.md 存在但 image generation 相关配置仅 `ai-image.provider` 和 `ai-image.quality`，无 style/layout/palette preference 概念。

**差距**：无用户偏好层 → 每次生成都从零开始 → 无跨次风格积累。

## 根因总结

| 维度 | baoyu-skills | slides-on | 质量影响 |
|---|---|---|---|
| Prompt 结构 | 多层结构化 prompt 组装 | 扁平 `style token + composition` | 指令精度差一个数量级 |
| 风格定义 | 逐风格 hex 色值 + YAML 元素枚举 | 叙事性 prose 描述 | 模型理解歧义大 |
| 图间一致性 | Image-1 anchor chain + sessionId | 无 | 跨页风格漂移 |
| 图内容角色 | 完整内容页（文字 baked-in） | 插图/背景（文字在 HTML） | 生成目标完全不同 |
| 内容分析 | Engagement 驱动（hook/swipe/save） | 结构驱动（layout mapping） | prompt 中的视觉决策依据不同 |
| 用户配置 | 风格/布局/调色板 preference | 无 | 无跨 session 风格积累 |
| 文字处理 | prompt 约束手写体+高亮+禁止印刷字体 | prompt 禁止文字（no text） | 生成图片的"信息量"不同 |
