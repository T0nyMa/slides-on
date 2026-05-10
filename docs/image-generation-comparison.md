# slides-on 与 ian-handdrawn-ppt 生图体系对比

## 总体定位

| | **slides-on** | **ian-handdrawn-ppt** |
|---|---|---|
| 生图方式 | CLI 脚本调用 10 个 Provider API | Prompt 工程驱动内置图像模型 |
| 产物形态 | PNG 插图/封面/信息图（配合 HTML 文字使用） | 完整栅格页面图（文字 baked-in，不可编辑） |
| 图在 deck 中的角色 | 辅助：插图、封面图、信息图嵌入 HTML | 主体：每页就是一张图 |
| 运行时 | Bun + TypeScript | 无代码，纯 prompt |
| 文字处理 | HTML 层渲染（精确、可编辑） | 图像模型 baking（有错字风险，兜底用后处理叠字） |

## slides-on 生图体系

### 架构

```
CLI (main.ts / build-batch.ts)
  → selectProvider (auto-detect API keys)
    → dynamic import provider module
      → provider.generate(prompt, options) → PNG file
```

### Provider 矩阵（10 个）

| Provider | 模型 | 异步 | 参考图 | 负面提示词 | 宽高比传法 |
|---|---|---|---|---|---|
| OpenAI | dall-e-3 / hd | 同步 | × | × | size: "1792x1024" |
| Azure | dall-e-3 | 异步+轮询 | × | × | size: "1280x720" |
| Google | imagen-3.0 | 同步 | AI Studio 支持 | √ | aspectRatio 参数 |
| DashScope | wanx-v1 | 异步+轮询 | × | √ | size: "1280x720" |
| MiniMax | image-01 | 同步 | × | √ | aspect_ratio: "16:9" |
| Replicate | flux-schnell | 异步+轮询 | √ | √ | width/height 参数 |
| OpenRouter | dall-e-3 | 同步 | × | × | size: "1792x1024" |
| Jimeng | seedream-2.0 | 同步 | × | √ | size: "1280x720" |
| Seedream | seedream-2.1 | 同步 | √ | √ | size: "1280x720" |
| Z.AI | cogview-3 / plus | 同步 | × | × | size: "1280x720" |

### 自动选择策略

- 无参考图：dashscope → openai → minimax → replicate → zai → openrouter → azure → google → jimeng → seedream
- 有参考图：google → openai → azure

### Prompt 工程

`base-prompt.md` 定义了一套设计系统 → prompt 的映射：
- `[Quality Tokens] + [Style Tokens] + [Composition] + [Negative Prompt]`
- 17 种 style token 映射（blueprint → "clean schematic, blueprint style..."）
- 通用 negative prompt: `no text, no letters, no words, no watermark...`
- 每张图生成伴随 `.prompt.txt` 记录完整 prompt 便于复现

### 与 Deck 集成方式

Step 3 渲染 HTML 时，用 `<img>` 引用预生成的 PNG。文字仍在 HTML 层，图只负责视觉氛围。

## ian-handdrawn-ppt 生图体系

### 架构

```
内容材料
  → Step 1-4: 叙事规划、内容分析、语义 archetype 选择
  → Step 5: 锁定 Visual DNA（theme-tokens.json）
  → Step 6: 每页组装 Complete Page Image Prompt
    = Deck Style Lock（跨页不变）
    + Page Role Lock（封面 21:9 / 正文 16:9）
    + Archetype Composition（语义布局描述）
    + Required Text Only（精确中文文字列表）
    + Reference Match Clause（风格锚定）
  → 内置图像模型生成 → PNG
```

### 核心机制

**1. Visual DNA 锁定**（`theme-tokens.json`）

一整套不可变的视觉常量，确保跨页一致：
- 纸色 `#FBFAF5`（近白暖纸，非黄色）
- 墨色 `#111111`，柔和墨 `#5F5A50`
- 四色粉彩：淡蓝 `#D9E8F6`、鼠尾草绿 `#DCEAD6`、浅桃 `#F5DEB8`、淡紫 `#E4DCF4`
- 细手绘线条 + 铅笔排线 + 微弱角标
- 无整页边框，大量留白

**2. Deck Style Lock**（跨页一致性）

一段固定的英文风格描述，原样粘贴到每页 prompt。约束纸底色、线型、笔触、粉彩标记、留白、角标、人物限制。

**3. Page Role Lock**

封面和正文严格分开约束：
- 封面：21:9（2520×1080），隐喻图占 50-55% 宽，无页码
- 正文：16:9（1920×1080），中央图仅占 50-60% 宽 × 35-45% 高，标题光学尺寸一致

**4. Reference Image Anchor**

`reference-handdrawn-article-illustration-style.png` 作为风格锚：
- 模型支持 attach → 直接作为参考图
- 不支持 → 用 "reference match clause" 文本描述替代

**5. Required Text Only**

每页 prompt 中列出精确的中文文字清单。字数预算严格控制：标题 5-12 字，标签 2-5 个，注释 0-6 条（每条 2-6 字）。

**6. Text Fidelity Fallback**

中文文字出错的兜底策略：先减少字数重生 → 仍失败则保留图像方向，用确定性后处理叠加上正确中文。

### 10 种 Slide Archetype

| Archetype | 适用语义 |
|---|---|
| Cover metaphor | 开篇/章节起始 |
| Single concept | 定义、概念解释 |
| Left-right contrast | 错误/正确、旧/新、前后对比 |
| Horizontal process | 步骤、流水线 |
| Circular mechanism | 循环、反馈、迭代 |
| Branching map | 决策条件、分支 |
| Classification map | 分类、框架 |
| Matrix table | 多维对比 |
| Main metaphor diagram | 抽象系统隐喻 |
| Takeaway | 总结、结论 |

## 关键差异

| 维度 | slides-on | ian-handdrawn-ppt |
|---|---|---|
| **技术路线** | 代码驱动：TS 脚本调 API | Prompt 驱动：自然语言描述视觉 |
| **Provider 管理** | 10 个 Provider 统一接口 + 自动选择 | 推荐 ChatGPT Image 2.0，无 Provider 抽象层 |
| **风格一致性** | 依赖 Provider 自身能力 + base-prompt style tokens | Style Lock + Reference Image Anchor + Visual DNA 常量 |
| **宽高比体系** | 5 种（1:1, 16:9, 9:16, 4:3, 3:4），各 Provider 映射方式不同 | 2 种固定角色（21:9 封面, 16:9 正文） |
| **文字处理** | HTML 层渲染，精确无误 | 图像 baking + 后处理兜底 |
| **批量生成** | `build-batch.ts`：工作池并发（默认 3），状态追踪 | 逐页串行生成 prompt |
| **可复现性** | `.prompt.txt` 记录完整参数 | Prompt 模板文本 |
| **输出** | 插图 PNG（配合 HTML 用） | 完整页面 PNG（独立使用） |
| **手绘风格实现** | 无专用机制（靠 Provider style 参数和 prompt 描述） | Visual DNA V6 全套常量 + 参考图锚定 |

## 可整合点

1. **Style Lock 机制**：ian-handdrawn-ppt 的固定风格描述文本可移植到 slides-on 的 prompt 中（通过 `--style` 参数或 prompt file），生成手绘风格插图
2. **Reference Image Anchor**：slides-on 的 Seedream、Replicate Provider 已支持参考图，可将手绘参考图传入实现风格迁移
3. **Archetype → Prompt 映射**：ian-handdrawn-ppt 的 10 种 archetype 的构图描述可转为 slides-on 的 prompt 模板
4. **文字兜底策略**：ian-handdrawn-ppt 的后处理叠字方案可复用到 slides-on 的信息图/封面图场景
5. **Visual DNA → base-prompt**：theme-tokens.json 中的颜色/线型/留白约束可映射为 base-prompt.md 的新 style token
