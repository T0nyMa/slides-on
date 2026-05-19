# Engagement 驱动分析框架

小红书/社交媒体图文卡片场景的 engagement 驱动内容分析框架。在 Step 1 内容分析中，当检测到社交场景信号时加载此框架，补充 engagement 维度到 `outline.md` 中。

## 适用条件

当原始文档或 EXTEND.md 中满足以下任一条件时触发：
- 目标平台含 `小红书`、`XHS`、`图文卡片`、`社交媒体`、`朋友圈`、`Instagram` 关键词
- 画布为 3:4 portrait（手机端）
- EXTEND.md 中 `engagement_analysis: true`

---

## 1. Hook Analysis（爆款标题潜力）

评估封面/标题的 hook 强度，分 5 种 hook 类型。

### Hook 类型

| 类型 | 机制 | 示例句式 | 适用内容 |
|------|------|---------|---------|
| **数字钩子** (Number Hook) | 具体数字制造确定感 | "3 步搞定...""5 个方法...""90% 的人不知道..." | 教程、清单、数据报告 |
| **痛点钩子** (Pain Point Hook) | 制造焦虑再给方案 | "还在为...烦恼？""别再...了""...的坑我替你踩过了" | 避坑指南、效率提升、问题解决 |
| **好奇钩子** (Curiosity Hook) | 信息缺口引发点击 | "原来...是这样""终于搞懂了...""...的秘密" | 知识科普、幕后揭秘、原理讲解 |
| **利益钩子** (Benefit Hook) | 直接承诺收益 | "学会这个...立刻提升...""收藏这篇就够了""新手也能..." | 技能教程、资源合集、模板分享 |
| **身份钩子** (Identity Hook) | 圈层认同引发共鸣 | "程序员的...""做设计的都懂...""考研人必备..." | 圈层内容、经验分享、行业洞察 |

### Hook 评分维度（1-5 星）

| 维度 | 评估标准 |
|------|---------|
| **冲击力** | 是否在 0.5 秒内抓住注意力？是否违反预期或制造 surprise？ |
| **相关性** | 是否精准命中目标受众的当前需求或焦虑？ |
| **可验证性** | 承诺是否具体可兑现？（避免夸大空泛） |
| **传播性** | 用户是否愿意转发/截图分享这个标题？ |
| **独特性** | 是否区别于同类内容的标题套路？有辨识度？ |

### Hook 优化建议

对封面标题提供具体优化方案：
1. **加数字**：模糊表述改为具体数字（"提升效率" → "效率提升 3 倍"）
2. **加对比**：引入前后对比制造冲突（"从 0 到 1""从入门到放弃到精通"）
3. **加限定**：缩小受众范围增加相关性（"给..." "适合..." "特别是..."）
4. **加场景**：用具体场景替代抽象概念（"通勤路上""睡前 5 分钟"）
5. **减废话**：删除可有可无的修饰词，保持标题 < 20 字

---

## 2. Target Audience → Style Mapping（受众画像）

### 受众类型 → 视觉风格 × 内容焦点

| 受众类型 | 信号词 | 推荐风格 (Design) | 推荐信息图 Style | 内容阈值 | 内容焦点 |
|---------|--------|-----------------|----------------|---------|---------|
| **学生/考研** | 学习、考试、考研、期末、笔记、复习 | `hand-drawn-edu` / `notion` | `hand-drawn-edu` / `aged-academia` | 单页 3-5 要点 | 知识结构化、记忆点突出、可收藏 |
| **职场人士** | 效率、工具、职场、汇报、PPT、管理 | `minimal` / `corporate` | `ikea-manual` / `ui-wireframe` | 单页 ≤4 结论 | 可操作性强、模板化、即刻可用 |
| **宝妈/家长** | 育儿、辅食、早教、亲子、绘本 | `soft-pastel` / `xiaohongshu-white` | `kawaii` / `storybook-watercolor` | 单页 3-4 要点 | 情感共鸣、安全感、易懂 |
| **时尚/穿搭** | 穿搭、护肤、美妆、OOTD、发型 | `magazine-bold` / `xiaohongshu-white` | `kawaii` / `corporate-memphis` | 单页 1-2 要点 | 视觉冲击、风格标签、可模仿 |
| **数码/科技** | 数码、App、工具、技巧、测评 | `blueprint` / `minimal` | `technical-schematic` / `cyberpunk-neon` | 单页 ≤4 要点 | 参数对比、真实截图、理性决策 |
| **美食/探店** | 美食、探店、食谱、食材、打卡 | `soft-pastel` / `xiaohongshu-white` | `pop-laboratory` / `kawaii` | 单页 2-3 要点 | 食欲激发、步骤清晰、可复刻 |
| **旅行/探店** | 旅行、攻略、拍照、酒店、路线 | `vector-illustration` / `xiaohongshu-white` | `storybook-watercolor` / `retro-popup-pop` | 单页 2-3 要点 | 美感、实用信息、路线图 |
| **创作者/博主** | 自媒体、涨粉、运营、拍摄、剪辑 | `sketch-notes` / `minimal` | `bold-graphic` / `craft-handmade` | 单页 ≤4 要点 | 方法论、数据支撑、工具箱 |

### 受众匹配检查清单

- [ ] 语言是否符合受众圈层用语？（不用圈外行话）
- [ ] 信息密度是否匹配受众消费习惯？（学生高密度 vs 时尚低密度）
- [ ] 视觉风格是否符合受众审美偏好？（科技感 vs 温暖感）
- [ ] Call to action 是否匹配受众行为模式？（收藏 vs 评论 vs 转发）

---

## 3. Swipe Flow Design（滑动流设计）

小红书类内容的消费模式是连续滑动浏览，而非翻页演示。需要设计信息释放的节奏。

### 五幕式滑动流

```
[封面]           ← 0.3 秒决定是否停留
   │
   ▼
[开场/预设]       ← 制造信息缺口，承诺价值
   │
   ▼
[核心内容页] ×2-3  ← 干货/价值释放（核心留存页）
   │
   ▼
[价值收束]        ← 总结 + 可操作建议
   │
   ▼
[结尾/CTA]        ← 引导互动 + 关注暗示
```

### 每页的滑动动机设计

| 页面位置 | 滑动动机机制 | 具体手法 |
|---------|------------|---------|
| 封面 → P2 | 信息缺口 | 标题制造好奇但不完全解答；承诺"第 3 页有模板""看到最后有惊喜" |
| P2 → P3 | 价值递进 | 内容层层深入，每一页比前一页释放更多信息量 |
| 核心页之间 | 视觉钩子 | 前一页底部设置视觉连接元素（箭头、未完待续暗示、下一图预告小缩略图） |
| 核心页 → 收束 | 获得感预期 | 暗示总结部分会给出"一张图记住全部"或"可直接截图保存" |
| 收束 → CTA | 社交驱动 | 最后释放互动引导，让用户觉得"看了就该转/收藏" |

### 信息缺口创建技术

1. **前置悬念**：封面给出问题但不给答案 → "答案在第 4 页"
2. **部分揭示**：每页只揭示答案的一部分，需要连续滑动拼接完整信息
3. **对比期待**：前页展示"错误做法"，后页揭示"正确做法"
4. **渐进清单**：第 1 页"3 个核心要素之 1..."，用户自然期待第 2、3
5. **视觉蒙版**：当前页展示模糊/暗化版本，下一页展示完整清晰版

---

## 4. Save / Share / Comment Triggers（互动三要素）

### 保存价值评估 (Save Value)

用户保存内容的三个核心动机：

| 保存动机 | 触发条件 | 设计策略 | 评分 (1-5) |
|---------|---------|---------|:----------:|
| **实用价值** | 包含清单/模板/公式/步骤，日后需要参照 | 每页设计为独立"知识卡片"，截图即可保存使用；提供 checklist 格式 | |
| **审美价值** | 视觉精美，想收藏作为审美参照 | 保持高质量配图，统一色调和排版风格，每页都是独立视觉作品 | |
| **工具价值** | 包含工具列表/资源链接/对比表，需要备忘 | 设计对比表格或流程图，信息密度适中便于截屏查阅 | |

**保存触发检查**：内容中是否包含至少一项"离开后还会需要"的信息？

### 分享触发识别 (Share Trigger)

| 分享动机 | 触发条件 | 设计策略 |
|---------|---------|---------|
| **身份表达** | 内容能代表分享者的品味/能力/价值观 | 内容调性 > 信息量；设计风格需有辨识度 |
| **社交货币** | 分享后能让分享者在圈层中显得"懂行""有用" | 行业独家洞察、反常识观点、前沿趋势 |
| **利他动机** | 内容对朋友/同事/同行有直接帮助 | 教程类、资源合集类，强调"转发给需要的朋友" |
| **情绪共鸣** | 说出用户想说但不会说的话 | 扎心金句、行业吐槽、群体痛点 |

### 评论诱导策略 (Comment Inducement)

| 策略 | 机制 | 示例 |
|------|------|------|
| **开放式提问** | 最后一张图直接提问，降低评论门槛 | "你用过最好用的效率工具是什么？" |
| **选项投票** | 提供 2-3 个选项让用户选择 | "A or B，你选哪个？" |
| **争议/修正** | 故意留一个可讨论的点 | "如果你有不同的方法，欢迎评论" |
| **经验征集** | 反向向用户征求经验 | "大家还有什么好方法？评论区补充" |
| **晒图邀请** | 邀请用户晒自己的版本 | "做了同款的朋友评论晒图！" |

---

## 5. Visual Opportunity Map（视觉机会映射）

将抽象内容元素映射到具体视觉处理方案。

### 内容元素 → 视觉处理

| 内容元素 | 视觉处理方案 | 推荐 Archetype | 适用画布 |
|---------|-------------|---------------|---------|
| **数据/统计** | 大数字 + 简短标注（stat-highlight 风格） | Single concept | 3:4 |
| **对比关系** | 左右分屏 / 上下分屏 / 表格 | Left-right contrast | 3:4 / 16:9 |
| **步骤/流程** | 编号节点 + 箭头链（竖排优先适配 3:4） | Horizontal process（旋转为竖直） | 3:4 |
| **分类/体系** | 层级树 / 分组卡片 / 标签云 | Classification map | 3:4 |
| **时间线/演进** | 纵向时间轴（3:4）或横向时间轴（16:9） | Horizontal process | 任意 |
| **循环/机制** | 环形流程图 + 中心标签 | Circular mechanism | 3:4 |
| **决策/选择** | 分支树 / 决策流程 / 路线图 | Branching map | 任意 |
| **清单/合集** | 网格排列卡片（bento-grid） | Matrix table | 3:4 |
| **金句/观点** | 大字居中 + 留白 + 装饰线 | Takeaway | 任意 |
| **抽象概念** | 隐喻场景插图 + 标注线 | Main metaphor diagram | 3:4 |

### 视觉密度规划

| 内容量 | 排版密度 | 字号 | 组件间距 | 适用场景 |
|--------|:-------:|------|---------|---------|
| 1-2 要点 | 低 (sparse) | L-XXL | 3-5cqi | 封面、金句、核心结论 |
| 3-4 要点 | 中 (comfortable) | M-L | 2-3cqi | 正常内容页、大多数卡片 |
| 5-6 要点 | 高 (dense) | S-M | 1-2cqi | 清单、合集、对比表 |

---

## 6. Content Type → Style × Archetype Matrix（自动选择矩阵）

基于信号自动匹配推荐组合。

### 信号 → Design × Infographic Style × Archetype 映射

| 内容类型 | 信号词 | 推荐 Design | 推荐 Infographic Style | 推荐 Archetype |
|---------|--------|------------|----------------------|---------------|
| **教程/How-to** | 步骤、方法、教程、指南、怎么做 | `hand-drawn-edu` | `ikea-manual` | Horizontal process |
| **清单/合集** | 推荐、清单、合集、必备、Top N | `xiaohongshu-white` | `knolling` | Matrix table |
| **对比测评** | vs、对比、测评、哪个好、区别 | `minimal` | `bold-graphic` | Left-right contrast |
| **知识科普** | 什么是、为什么、原理、揭秘、冷知识 | `sketch-notes` | `chalkboard` | Single concept |
| **经验分享** | 经验、心得、复盘、踩坑、教训 | `notion` | `aged-academia` | Takeaway |
| **数据报告** | 数据、趋势、报告、统计、增长 | `blueprint` | `technical-schematic` | Classification map |
| **观点/态度** | 我认为、说实话、真正的、别再 | `bold-editorial` | `corporate-memphis` | Takeaway |
| **故事/叙事** | 故事、经历、从...到...、那年 | `watercolor` | `storybook-watercolor` | Story mountain |
| **产品介绍** | 新品、功能、上线、首发、必入 | `corporate` | `retro-pop-grid` | Cover metaphor |
| **日常 vlog** | 日常、记录、今天、碎片、PLOG | `soft-pastel` | `morandi-journal` | Bento-grid layout |
| **互动/提问** | 投票、选择、帮选、A or B | `xiaohongshu-white` | `pop-laboratory` | Left-right contrast |
| **灵感/审美** | 灵感、配色、排版、设计、美学 | `vector-illustration` | `craft-handmade` | Bento-grid layout |

### 自动选择流程

```
Step 1 内容分析 → 检测内容类型信号
    │
    ├── 教程/步骤类 → hand-drawn-edu × ikea-manual × Horizontal process
    ├── 清单/合集类 → xiaohongshu-white × knolling × Matrix table
    ├── 对比测评类 → minimal × bold-graphic × Left-right contrast
    ├── 知识科普类 → sketch-notes × chalkboard × Single concept
    ├── 经验分享类 → notion × aged-academia × Takeaway
    ├── 数据报告类 → blueprint × technical-schematic × Classification map
    ├── 观点态度类 → bold-editorial × corporate-memphis × Takeaway
    ├── 故事叙事类 → watercolor × storybook-watercolor × Story mountain
    ├── 产品介绍类 → corporate × retro-pop-grid × Cover metaphor
    ├── 日常记录类 → soft-pastel × morandi-journal × Bento-grid
    ├── 互动提问类 → xiaohongshu-white × pop-laboratory × Left-right contrast
    └── 灵感审美类 → vector-illustration × craft-handmade × Bento-grid
    │
    ▼
输出到 style-decision.md 的每个 slide 推荐中
```

### Engagement 维度输出格式

在 `outline.md` 的 Cover 和每页 slide 注释中补充：

```markdown
## Cover
- Title: <封面标题>
- Hook type: <数字钩子 | 痛点钩子 | 好奇钩子 | 利益钩子 | 身份钩子>
- Hook score: ★★★★☆ (冲击力4 相关性5 可验证性4 传播性3 独特性3)
- Target audience: <受众标签>
- Swipe motivation: <滑动动机描述>
- Save trigger: <保存动机>
```

---

## 与主分析框架的关系

此框架是 `analysis-framework.md` 的补充模块。当检测到社交场景时，在原有内容分析基础上叠加：

1. **原有流程不变**：parse → chapter → type detection → slide count → signal detection → ghost deck test
2. **叠加 engagement 层**：在 signal detection 后、ghost deck test 前，加载此文档
3. **产出合并**：engagement 指标写入 `outline.md` 的每个 slide 注释字段中
4. **影响风格决策**：engagement 分析结果会影响 Step 2 中每页的 Design × Infographic Style × Archetype 选择
