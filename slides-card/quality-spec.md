# Quality Specification — slides.json 验证标准

本文件定义"好的 slides.json"的标准。`scripts/validate-slides.ts` 依据此标准逐页检查。

> 所有检查分为三级：**FAIL**（阻塞渲染）> **WARN**（建议调整）> **INFO**（参考信息）

## 1. Schema 检查（FAIL）

最基本的格式正确性。不通过则无法渲染。

| 检查项 | 规则 | 级别 |
|--------|------|------|
| config.title | 非空字符串 | FAIL |
| config.design | 必须为 `pastel-card` \| `white-editorial` \| `xhs-post` | FAIL |
| config.canvas | 必须为 `3:4` 或 `16:9` | FAIL |
| slides 数组 | 至少 1 个元素 | FAIL |
| slide.type | 必须为 11 种合法类型之一 | FAIL |
| slide.title（非 html/cover 类型）| 非空字符串 | FAIL |

## 2. 密度预算检查（WARN）

组件数量、字数在合理范围内。超限触发 WARN，建议拆页或精简。

### 2.1 组件计数

| 检查项 | 规则 | 级别 |
|--------|------|------|
| 每页组件数 | 3-5 个（不含 chrome 壳层） | < 3: WARN(留白) / > 5: WARN(密度) / > 6: FAIL |
| cards 数量（cards-2x2） | 2-4 个 | > 4: WARN |
| cards 数量（cards-3） | 3-6 个 | > 6: WARN |
| steps 数量 | 3-7 步 | < 3: WARN / > 7: FAIL |
| bullets 数量 | 3-10 项 | < 3: WARN / > 10: WARN |
| kpis 数量 | 1-4 个 | > 4: WARN |
| badges 数量 | 0-4 个 | > 4: WARN |

### 2.2 字数上限

| 检查项 | 规则 | 级别 |
|--------|------|------|
| h1 title | ≤ 15 字 | > 15: WARN |
| h2 title | ≤ 10 字 | > 10: WARN |
| subtitle / lede | ≤ 30 字 | > 30: WARN |
| card.title | ≤ 15 字 | > 15: WARN |
| card.body | ≤ 60 字 | > 60: WARN |
| step.title | ≤ 15 字 | > 15: WARN |
| step.body | ≤ 50 字 | > 50: WARN |
| quote | ≤ 40 字 | > 40: WARN |
| kpi.value | ≤ 6 字 | > 6: WARN |
| bullet.title | ≤ 12 字 | > 12: WARN |
| bullet.body | ≤ 40 字 | > 40: WARN |

## 3. 锚点检查（WARN）

每页应有且仅有一个视觉重心（锚点组件）。按页面原型检查锚点是否存在。

| 页面原型 | 锚点组件 | 检测方式 |
|---------|---------|---------|
| cover | h1 标题 | title 字段非空 |
| section | h1 标题 | title 字段非空 + kicker 推荐 |
| 痛点页 | c-card-warn | 至少 1 个 card.color 为 warn 色 |
| 核心概念页 | c-card（带 num） | 至少 2 个 card 有 num 字段 |
| 分类页 | c-grid-2 | type 为 cards-2x2 且 cards ≥ 4 |
| 流程页 | c-steps | type 为 steps |
| 对比页 | c-grid-2（warn vs accent）| 存在 2 个 card，color 分别为 warn/accent |
| 金句页 | c-glass + c-quote | type 为 quote |
| 数据页 | c-kpi | type 为 kpi 且有 ≥ 1 个 kpi |
| 行动页 | c-formula | 无直接检测（formula 未结构化），检查 body 字段 |
| Thanks 页 | h1 大标题 | type 为 thanks + title 非空 |

> 锚点检查 FAIL 意味着页面没有视觉重心，阅读体验扁平。

## 4. Design 兼容性检查（WARN）

检查 slides.json 中使用的特性是否被目标 Design 支持。

| 检查项 | pastel-card | white-editorial | xhs-post |
|--------|-------------|-----------------|----------|
| 支持的颜色名 | peach, mint, sky, lilac, lemon, rose | purple, pink, blue, green, orange | 无颜色变体 |
| blobs | ✅（b1, b2, b3）| ❌（用 chr-topline 替代）| ❌（用 slide::before 替代）|
| chipColor | ✅（mint, sky, lilac, rose）| ❌（忽略，统一渐变 dot）| ❌（无 chip 概念）|
| chr-divider | ✅ | ❌（返回空）| ❌（返回空）|
| chr-pill | ✅ | ✅ | ✅ |
| chr-hero | ✅ | ✅ | ✅ |

> 使用不支持的 color 名 → WARN（会 fallback 到默认 card 样式）
> 在不支持的 design 上使用 blobs → WARN（不会渲染）
> 在不支持的 design 上设置 chipColor → INFO（被忽略，不影响渲染）

## 5. 色彩语义检查（WARN）

Card color 承载信息层级，检查用法是否符合语义。

| color 类别 | 语义 | 适用场景 | 误用示例 |
|-----------|------|---------|---------|
| warn（peach/rose/pink/orange）| 问题、痛点、反面 | 痛点页、对比页的"之前" | 用于正面结论 |
| accent（mint/green/blue/purple）| 答案、推荐、正面 | 方案页、对比页的"之后" | 用于问题描述 |
| soft（sky/lilac/lemon）| 补充说明、背景 | 辅助信息 | 作为主卡片颜色 |

检测规则：
- 同一页有 2+ warn 色卡片 → 检查是否有对应的 accent 卡片（"指出问题的同时应给出答案"）
- 全页只有 warn 色 → WARN（缺乏正面引导）

## 6. 内容-组件匹配度（INFO）

检查 slide type 是否与内容特征匹配。此检查为启发式，仅做 INFO 提示。

| 内容特征 | 推荐 type | 如用了别的 → |
|---------|----------|-------------|
| 有"步骤/流程/阶段"关键词 + 3-7 项 | steps | INFO: 建议用 steps |
| 有"对比/vs/之前/之后"关键词 + 2 项 | cards-2x2 | INFO: 建议用 cards-2x2 |
| 有"数据/指标/提升"关键词 + 数字 | kpi | INFO: 建议用 kpi |
| 有引用/名言/金句 | quote | INFO: 建议用 quote |
| 并列 4-6 个分类/场景 | cards-2x2 | INFO: 建议用 cards-2x2 |

> 内容-组件匹配检查不阻塞，仅作为建议。手动 override 时忽略。
