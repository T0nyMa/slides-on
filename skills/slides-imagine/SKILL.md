---
name: slides-imagine
description: >
  Generate AI images for presentations — illustrations, cover images,
  infographics, concept art. Use whenever the user asks to generate images
  for slides, AI 生图, 插图, 封面图, 信息图, 配图, make an illustration,
  create a cover image, generate visual content for a presentation. Features
  10 providers, 3-layer structured prompt assembly, 10 archetype composition
  templates, and 17 style definitions. Outputs PNG files that can be embedded
  into slides-card or slides-ppt via the SlideData image field.
---

# slides-imagine — AI 图片生成

10 个 Provider，三层结构化 prompt 组装，17 个 style definition，10 种构图原型。

## 生成方式

### 结构化 Prompt 模式（推荐）

```bash
bun ../../scripts/imagine/main.ts --design sketch-notes --archetype "horizontal process" --aspect 3:4 --content "推荐系统三阶段流程"
```

三层自动组装：Image Role → Style Lock（从 `../../references/style-definitions/{design}.md` 加载）→ Archetype 构图 + 用户内容。

### 直接 Prompt 模式

```bash
bun ../../scripts/imagine/main.ts --prompt "a futuristic city skyline at night" --aspect 16:9
```

### 批量生成

```bash
bun ../../scripts/imagine/build-batch.ts --dir prompts/ --design sketch-notes --jobs 3
bun ../../scripts/imagine/build-batch.ts --batchfile prompts.txt --anchor --jobs 1
```

`--anchor` 模式：第一张建立视觉锚点，后续图片参考第一张保持跨页一致性。

## 10 个 Provider

**无参考图优先级**：DashScope → OpenAI → MiniMax → Replicate → Z.AI → OpenRouter → Azure → Google → Jimeng → Seedream

**有参考图**（仅 3 家支持）：Google → OpenAI → Azure

默认 Provider 通过环境变量设置：

```bash
export IMAGINE_PROVIDER="dashscope"
export IMAGINE_MODEL="qwen-image-2.0-pro-2026-04-22"
export IMAGINE_QUALITY="2k"
export IMAGINE_ASPECT="3:4"
export IMAGINE_DESIGN="sketch-notes"
```

## 嵌入 slides

生成的 PNG 通过 SlideData 的 `image` 字段引用到 slides-card 或 slides-ppt：

```json
// Hero 图（封面大图）
{ "type": "cover", "title": "...", "image": { "src": "imgs/hero.png" }, "imageMode": "hero" }

// 背景图
{ "type": "quote", "quote": "...", "image": { "src": "imgs/bg.png" }, "imageMode": "background" }

// 卡片内联图
{ "type": "cards-2x2", "cards": [{ "title": "...", "body": "...", "image": "imgs/card.png" }] }
```

## 10 种构图原型（Archetype）

| 内容语义 | Archetype |
|---------|-----------|
| 开篇/章节起始 | Cover metaphor |
| 定义/概念解释 | Single concept |
| 对比/前后/A vs B | Left-right contrast |
| 步骤/流水线/阶段 | Horizontal process |
| 循环/反馈/迭代 | Circular mechanism |
| 决策/条件分支 | Branching map |
| 分类/框架/体系 | Classification map |
| 多维对比/评估 | Matrix table |
| 抽象系统隐喻 | Main metaphor diagram |
| 总结/结论/行动号召 | Takeaway |

详见 `../../references/archetypes.md`。

## 17 个 Style Definition

blueprint, bold-editorial, chalkboard, corporate, dark-atmospheric, editorial-infographic, fantasy-animation, hand-drawn-edu, intuition-machine, minimal, notion, pixel-art, scientific, sketch-notes, vector-illustration, vintage, watercolor

每个定义包含精确 hex 色值、视觉元素、排版指令。详见 `../../references/style-definitions/`。

## 配置

`../EXTEND.md` 中 `ai_image` 节可配置默认 Provider、Model、Quality、Aspect 等。环境变量可覆盖。详见 `../../scripts/imagine/config.ts`。

## 核心参考

- `../../references/prompt-construction.md` — 三层 Prompt 组装规范
- `../../references/archetypes.md` — 10 种构图模板
- `../../references/style-definitions/` — 17 个 Style Lock 定义
- `../../references/ai-visuals.md` — AI 视觉总览
- `../../references/imagine/providers/` — 5 个 Provider 详情
