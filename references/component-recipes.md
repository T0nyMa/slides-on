# Component Recipes — 内容语义 → 组件组合

从 Step 1 内容分析的结果，到 Step 3 编写 HTML 的桥梁。Claude 依据此文档决定每页用什么组件、怎么组合。

## 决策流程

```
内容信号检测 → 匹配页面原型 → 选择锚点组件 → 填充配套组件 → 检查密度预算
```

1. **内容信号**：Step 1 解析出的内容类型、语义特征、字数
2. **页面原型**：10 种 3:4 页面骨架（见下方映射表）
3. **锚点组件**：每页一个视觉重心
4. **配套组件**：围绕锚点的支撑组件（3-5 个总组件）
5. **密度预算**：字数、组件数量上限，超限触发拆页
6. **像素预算**：加总组件 px 高度 + 间隙(20px/个)，对比可用高度（无 chrome 1000px / 有 chrome 920px），填充率 70-95% 合格

## 内容信号 → 页面原型映射

| 内容信号 | 页面原型 | 锚点组件 | 适用场景 |
|---------|---------|---------|---------|
| 标题 + 作者 + 摘要 + 目录预告 | Cover | `h1` | 任何 deck 首页 |
| 章节名 + 编号 | Section | `h1` | 章节分隔 |
| 问题描述 + 多个痛点/反面案例 | 痛点页 | `c-card-warn` | 问题分析、现状反思 |
| 单一新概念 + 3-5 个属性/维度 | 核心概念页 | `c-card`（居中大符号）| 术语解释、概念展开 |
| 4-6 个并列分类/场景 | 分类页 | `c-grid-2` | 场景分类、方案对比 |
| 流程/步骤 3-7 步 | 流程页 | `c-steps` | 操作指南、实施路径 |
| 对比/A vs B / 优劣 | 对比页 | `c-grid-2`（warn vs accent）| 方案比较、迁移前后 |
| 金句/引用/核心洞察 | 金句页 | `c-glass` + `c-quote` | 名人名言、核心观点 |
| 大数字 + 指标说明 | 数据页 | `c-kpi` | 效果展示、关键指标 |
| 5-10 项列表/清单 | 速查页 | `c-icon-row` × N | 要点清单、语法速查 |
| 行动号召/步骤/示例 | 行动页 | `c-formula` | CTA、操作指南 |
| 干货文字 + 多维度解释 + 标签 | 干货分享页 | `c-article`（异构混合）| 小红书知识帖、深度解读 |
| 致谢 + 要点回顾 | Thanks 页 | `c-glass` | 任何 deck 尾页 |

## 组件配方

### Cover

```
kicker → h1 → lede → c-divider-accent → c-card-soft（摘要）→ c-section（目录预告）→ c-badge-row
```

- **锚点**：`h1` 标题（≤15 字）
- **字数预算**：kicker ≤10 字, lede ≤30 字, 摘要 ≤60 字
- **最少组件**：kicker + h1 + lede（3 个，留白风险高）
- **留白对策**：加 c-section 嵌套 c-icon-row × 3 做目录预告
- **Design 适配**：pastel-card 用 chr-blob，white-editorial 用 chr-topline，xhs-post 用 chr-sticker
- **像素预算**（无 chrome）：kicker(32) + h1(46) + lede(50) + divider(2) + card-soft(93) + section-2cards(400) + badge-row(35) + 6×gap(120) = **778px / 78%** ✅

### Section（章节分隔页）

```
chr-kicker → h1（章节名）→ chr-divider
```

- **锚点**：`h1`（≤8 字）
- **字数预算**：kicker ≤10 字, 标题 ≤8 字
- **最少组件**：kicker + h1（2 个，留白风险高）
- **留白对策**：加 c-card-soft 放章节简介（≤40 字）
- **像素预算**：Section 页用 center 布局，留白撑气场，允许低于 70%。加 c-card-soft(93) 后：kicker(32) + h1(46) + divider(2) + card-soft(93) + 3×gap(60) = **233px / 23%** → 仍然偏低，但章节分隔页的功能是节奏控制，不需要填满

### 痛点页

```
h2 → lede → c-stack（c-card-warn × 2 + c-card-accent × 1）→ c-formula
```

- **锚点**：`c-card-warn` 和 `c-card-accent` 的对比
- **字数预算**：h2 ≤10 字, lede ≤30 字, 每卡片 ≤50 字, c-formula ≤20 字
- **组件数**：5-6 个
- **关键约束**：最后必须有一个 accent 色卡片（反转，给出答案/解法）
- **溢出处理**：卡片 > 4 个 → 拆为两页（问题页 + 解法页）
- **留白对策**：加 c-badge-row（3-4 个标签）
- **像素预算**（无 chrome）：h2(46) + lede(50) + 2×card-warn-60字(488) + card-accent-60字(244) + formula(82) + badge-row(35) + 6×gap(120) = **1065px / 107%** 🔴 → 缩减卡片到30字或去formula
- **像素预算**（精简版）：h2(46) + lede(50) + 2×card-warn-30字(282) + card-accent-60字(244) + 4×gap(80) = **702px / 70%** ✅

### 核心概念页

```
h2 → lede → c-row（c-card × 3）→ c-example → c-badge-row
```

- **锚点**：三卡片中的大符号/图标
- **字数预算**：h2 ≤10 字, lede ≤30 字, 每卡片标题 ≤15 字 + 正文 ≤50 字, c-example ≤40 字
- **组件数**：5-6 个
- **关键约束**：卡片内必须有居中大元素（emoji/数字/符号），否则视觉偏平
- **卡片数偏差**：只有 2 个概念 → 降为 c-row(c-card × 2)；5+ 个概念 → 换分类页
- **像素预算**（无 chrome）：h2(46) + lede(50) + 3×card-30字(423) + example(76) + badge-row(35) + 6×gap(120) = **750px / 75%** ✅

### 分类页

```
h2 → lede → c-grid-2（c-card × 4）
```

- **锚点**：四宫格卡片
- **字数预算**：h2 ≤10 字, lede ≤30 字, 每卡片标题 ≤12 字 + 正文 ≤40 字
- **组件数**：3 个（c-grid-2 算 1 个）
- **关键约束**：4 个卡片正好填满 3:4 画布，3 个会失衡 → 用 c-row 代替
- **卡片颜色**：accent 色优先（分类页是"展示选项"，偏正面）
- **像素预算**（无 chrome）：h2(46) + lede(50) + grid2-4cards-60字(~560) + 2×gap(40) = **696px / 70%** ✅（卡片正文需≥60字才填满）

### 流程页

```
h2 → lede → c-steps（c-step + c-connector 交替）→ c-note
```

- **锚点**：`c-steps` 编号流程
- **字数预算**：h2 ≤10 字, lede ≤30 字, 每步标题 ≤15 字 + 正文 ≤30 字, c-note ≤50 字
- **组件数**：4-5 个
- **步数约束**：3-7 步，3-4 步留白偏多 → 加 c-example；7+ 步 → 拆页
- **c-connector 规则**：步与步之间插 c-connector，最后一步后可省略
- **像素预算**（无 chrome）：h2(46) + lede(50) + 3×step-长(369) + 2×connector(38) + note(108) + 6×gap(120) = **731px / 73%** ✅（step body 需2行以上）

### 对比页

```
h2 → lede → c-grid-2（c-card-warn（反面/之前）+ c-card-accent（正面/之后））
```

- **锚点**：`c-grid-2` 双卡对比
- **字数预算**：h2 ≤10 字, 每卡片 ≤100 字
- **组件数**：3-4 个
- **关键约束**：必须 warn vs accent，颜色即立场，不需要文字说明
- **扩展**：对比点较多时，每个卡片内用 c-icon-row × 2-3 代替纯文本
- **像素预算**（无 chrome）：h2(46) + lede(50) + grid2(2×card-100字+gap = 704) + 2×gap(40) = **840px / 84%** ✅

### 金句页

```
c-glass（c-quote）→ c-divider-accent → c-card-soft（解释）→ c-grid-2（对比卡片）→ c-badge-row
```

- **锚点**：`c-glass` + `c-quote`
- **字数预算**：quote ≤40 字, 解释 ≤50 字, 每对比卡片 ≤30 字
- **组件数**：5-6 个
- **关键约束**：金句必须有 c-card-soft 解释和 c-grid-2 对比，否则只是孤立的引用，缺乏信息量
- **不适合**：quote < 10 字且无扩展解释 → 降为 c-card-accent 卡片
- **像素预算**（无 chrome）：glass-quote(127) + divider(2) + card-soft-60字(244) + grid2(2×card-30字+gap = 302) + badge-row(35) + 4×gap(80) = **790px / 79%** ✅

### 数据页

```
h2 → lede → c-kpi → c-card-accent（代码/命令）→ c-icon-row（支持的类型）→ c-badge-row
```

- **锚点**：`c-kpi` 大数字
- **字数预算**：kpi value ≤6 字, label ≤10 字, c-card-accent ≤60 字
- **组件数**：5-6 个
- **多 KPI**：2-3 个 KPI 用 c-row 并排；4+ 个 → 换 kpi-grid 或拆页
- **c-card-accent 放什么**：可操作的代码命令、关键结论、下一步行动
- **像素预算**（无 chrome）：h2(46) + lede(50) + kpi(137) + card-accent-60字(244) + note(108) + badge-row(35) + 5×gap(100) = **720px / 72%** ✅

### 行动页

```
h2 → c-formula → c-steps（3 步）→ c-example（完整示例）→ c-card-soft（结语）
```

- **锚点**：`c-formula` 核心行动
- **字数预算**：formula ≤20 字, 每步 ≤15 字（不设 body）, c-example ≤80 字
- **组件数**：5-6 个
- **关键约束**：c-example 必须放可直接复制的完整示例，不是抽象描述
- **c-steps 降级**：只 2 步 → 用 c-row(c-card × 2) 代替
- **像素预算**（无 chrome）：h2(46) + formula(82) + 3×step-短(258) + 2×connector(38) + example(76) + card-soft(93) + 7×gap(140) = **733px / 73%** ✅

### 干货分享页（article）

```
type: "article"
h2 → blocks: [ badge-para, icon-card, quote-bar, numbered-list, pill-tags 自由混合 ]
```

- **锚点**：`c-article` 异构块堆叠（同一页混合不同块类型）
- **适用**：小红书知识帖、深度解读、干货总结——一个页面需要 badge 段落 + 图标卡片 + 引述条 + 编号列表等不同形式的混合内容
- **block 选择**：
  - `badge-para`：标签 + 段落（适合"核心观点""注意事项"等带标签的要点）
  - `icon-card`：图标 + 标题 + 描述（适合功能列举、方法卡片）
  - `quote-bar`：左边框引述条（适合引用、金句、关键洞察）
  - `numbered-list`：编号 + 关键词 + 正文（适合步骤、要点排列）
  - `pill-tags`：胶囊标签组（适合总结标签、关键词列表）

**填充哲学**：页面留白时多组合 block（badge-para + icon-card + quote-bar），禁止放大字号/拉伸间距/居中来撑满。

**密度控制**：按块高度预估总高（badge-para ~10cqi, icon-card ~12cqi, numbered-list items×6cqi），≥65cqi 合格。不用硬性最少块数——有些大块单个就能撑满。

- **字数预算**：badge-para label ≤6 字, body ≤120 字; icon-card title ≤12 字, body ≤80 字; quote-bar text ≤60 字; numbered-list items ≤5
- **block 数量**：3-5 个（< 3 WARN, > 5 需拆页）
- **Design CSS 要求**：article 组件在 Design CSS 下才有完整视觉效果。Theme only 模式下显示 base 样式（白底细线框）
- **像素预算**（无 chrome，典型5 block）：h2(46) + badge-para-2行(214) + icon-card-中(134) + badge-para-1行(162) + quote-bar-1行(78) + pill-tags(45) + 5×gap(100) = **779px / 78%** ✅
- **像素预算**（无 chrome，上限）：h2(46) + badge-para-3行(267) + icon-card-长(222) + quote-bar-2行(123) + numbered-3项(177) + 4×gap(80) = **915px / 92%** ✅

### Thanks 页

```
c-glass（h1 + c-quote + c-quote-attr）→ c-section（回顾要点 → c-icon-row × 3）→ c-badge-row
```

- **锚点**：`c-glass` 大标题
- **字数预算**：h1 ≤12 字, quote ≤30 字, 每 icon-row 标题 ≤12 字 + 正文 ≤30 字
- **组件数**：4-5 个
- **关键约束**：c-section 回顾要点让 Thanks 页有信息量，值得截图保存
- **首尾呼应**：c-badge-row 使用与 Cover 相同的标签
- **像素预算**：Thanks 页用 center 布局，留白撑气场，允许低于 70%

## 密度预算

组件数量由像素预算决定：加总组件 px 高度 + 间隙(20px/个)，对比可用高度（无 chrome 1000px / 有 chrome 920px），填充率 70-95% 合格。

| 填充率 | 判定 | 处理 |
|--------|------|------|
| < 70% | 留白过大 | 加组件、增加正文字数、或换更大组件 |
| 70-95% | 合格 | — |
| > 95% | 溢出风险 | 减字数、精简组件、或拆页 |

### 字数预算速查

| 组件 | 字数上限 | 超限处理 |
|------|---------|---------|
| h1 | 15 字 | 缩到 15 字以内 |
| h2 | 10 字 | 缩到 10 字以内 |
| lede | 30 字 | 精简或拆为两句 |
| c-card 标题 | 15 字 | 精简 |
| c-card 正文 | 100 字 | 精简或拆成 2 卡片 |
| c-quote | 40 字 | 只保留核心句 |
| c-kpi value | 6 字 | 用缩写 |
| c-example | 80 字 | 精简到核心示例 |
| c-icon-row 标题 | 12 字 | 精简 |
| c-icon-row 正文 | 60 字 | 精简 |
| 整页正文 | ≤ 200 字 | 知识卡片阅读感，3-4 个组件分摊 |

## 页面原型选择优先级

当内容信号模糊时（如一段文字同时包含"问题描述"和"流程"），按以下优先级：

1. **流程 > 痛点**：内容有"先...再...然后..."时序词 → 流程页
2. **对比 > 分类**：内容有"vs/对比/之前之后" → 对比页
3. **数据 > 速查**：内容有数字 + 单位 → 数据页
4. **金句 > 核心概念**：内容是单句引用且无扩展属性 → 金句页
5. **概念 > 分类**：内容围绕一个核心 + 多个属性 → 概念页（3 卡片），多个独立项 → 分类页（4 宫格）
