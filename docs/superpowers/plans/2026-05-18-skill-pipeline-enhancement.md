# SKILL.md Pipeline 强化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strengthen the slides-on skill pipeline: content-first planning with component layout tables, QA at every gate, structured repair loop.

**Architecture:** Three deliverables — (1) new `references/content-planning.md` decision table, (2) rewritten SKILL.md pipeline with embedded QA gates and repair loop, (3) verification via `bun scripts/qa.ts --check` on a sample deck.

**Tech Stack:** Markdown (SKILL.md + reference docs), Bun (qa.ts verification)

---

### Task 1: Create references/content-planning.md

**Files:**
- Create: `references/content-planning.md`

- [ ] **Step 1: Write the content planning reference document**

Create `/Users/majiang/Work/tools/slides-on/references/content-planning.md`:

```markdown
# Content Planning — 内容驱动的组件规划

> **核心原则：内容决定组件，组件决定排版。** 先分析每页要传达什么，再选择组件组合和排列方式，最后填内容。

## 决策流程

```
内容分析 → 确定内容语义 → 查表选组件 → 确定排列模式 → 填内容 + 预算检查
```

## 10 种内容语义 × 组件组合

对每页 slide，先确定内容语义（这页要表达什么），再按下表选择组件组合。

### 1. 痛点/问题

**何时用**：描述现状问题、挑战、用户痛点

| 组件 | 数量 | 作用 | 字数预算 |
|------|------|------|---------|
| c-card-warn | 2-3 | 各描述一个痛点 | 每卡 ≤25字 |
| c-card-accent | 0-1 | 预告解决方案 | ≤20字 |
| c-badge-row | 1 | 关键词标签（3-5个） | — |

**排列模式**：纵向堆叠（stack），gap 2cqi
**Portrait 密度**：3-5 组件
**视觉重心**：c-card-accent（如有）或第一个 c-card-warn

```
┌──────────────────────┐
│   c-card-warn (痛点1) │
│   c-card-warn (痛点2) │
│  c-card-accent (方案)  │  ← 可选
│    c-badge-row        │
└──────────────────────┘
```

### 2. 数据展示

**何时用**：展示关键指标、数据、统计结果

| 组件 | 数量 | 作用 | 字数预算 |
|------|------|------|---------|
| c-hero-num | 1 | 核心数字 | 数字 + ≤15字标签 |
| c-kpi | 2-4 | 支撑指标 | 每 KPI：数字 + ≤10字标签 |
| c-badge-row | 0-1 | 数据来源/说明 | — |

**排列模式**：hero 居上 + kpi 网格 2×2
**Portrait 密度**：4-6 组件
**视觉重心**：c-hero-num

```
┌──────────────────────┐
│     c-hero-num       │  ← 最大数字
│  ┌──────┐ ┌──────┐   │
│  │ KPI 1│ │ KPI 2│   │  ← 网格 2×2
│  └──────┘ └──────┘   │
│  ┌──────┐ ┌──────┐   │
│  │ KPI 3│ │ KPI 4│   │
│  └──────┘ └──────┘   │
└──────────────────────┘
```

### 3. 流程/步骤

**何时用**：描述操作流程、实施步骤、时间线

| 组件 | 数量 | 作用 | 字数预算 |
|------|------|------|---------|
| c-steps | 3-4 | 步骤序列 | 每步标题 ≤8字，正文 ≤25字 |
| c-note | 1 | 步骤注释/关键提示 | ≤40字 |

**排列模式**：纵向堆叠（steps 自动编号 + note 在底部）
**Portrait 密度**：4-5 组件
**视觉重心**：step 3 或最后一步（通常用 accent 高亮）

```
┌──────────────────────┐
│  ● Step 1 — 采集     │
│  ● Step 2 — 去噪     │
│  ● Step 3 — Wiki 化  │  ← 核心步，accent 高亮
│  ● Step 4 — 反馈     │
│  ┌──────────────────┐ │
│  │ c-note           │ │
│  └──────────────────┘ │
└──────────────────────┘
```

### 4. 对比分析

**何时用**：A vs B 对比、优缺点、升级前后

| 组件 | 数量 | 作用 | 字数预算 |
|------|------|------|---------|
| c-card | 1 | A 方案/原版 | 标题 ≤10字，正文 ≤30字 |
| c-card-accent | 1 | B 方案/升级版 | 标题 ≤10字，正文 ≤30字 |
| c-badge-row | 1 | 图例/标签（2-3个） | — |

**排列模式**：网格 2 列（c-grid-2），badge row 在底部
**Portrait 密度**：3-4 组件
**视觉重心**：c-card-accent

```
┌──────────────────────┐
│ ┌────────┐ ┌────────┐│
│ │c-card  │ │c-card  ││  ← 2 列网格
│ │(原版)  │ │accent  ││
│ │        │ │(升级)  ││
│ └────────┘ └────────┘│
│    c-badge-row        │
└──────────────────────┘
```

### 5. 代码/技术

**何时用**：展示代码片段、配置、技术方案

| 组件 | 数量 | 作用 | 字数预算 |
|------|------|------|---------|
| c-codebox | 1 | 代码块 | 10-20 行 |
| c-card-soft | 1-2 | 代码说明/效果 | 每卡 ≤30字 |
| c-badge-row | 1 | 技术标签 | — |

**排列模式**：代码在上，卡片在下
**Portrait 密度**：4-5 组件
**视觉重心**：c-codebox

```
┌──────────────────────┐
│  ┌──────────────────┐│
│  │  c-codebox       ││  ← 代码占上半部
│  │  ...code...      ││
│  └──────────────────┘│
│ ┌────────┐ ┌────────┐│
│ │card-   │ │card-   ││  ← 说明卡片
│ │soft    │ │soft    ││
│ └────────┘ └────────┘│
│    c-badge-row        │
└──────────────────────┘
```

### 6. 引用/金句

**何时用**：核心观点强调、名人引用、一句话总结

| 组件 | 数量 | 作用 | 字数预算 |
|------|------|------|---------|
| c-quote | 1 | 引用/金句 | ≤35字 |
| c-note | 1 | 补充说明/出处 | ≤30字 |
| c-badge-row | 1 | 主题标签 | — |

**排列模式**：居中堆叠，v-distribute 或 v-center
**Portrait 密度**：3 组件
**视觉重心**：c-quote

### 7. 封面

**何时用**：deck 第一页

| 组件 | 数量 | 作用 | 字数预算 |
|------|------|------|---------|
| chr-title | 1 | 主标题 | ≤15字 |
| chr-sub | 1 | 副标题/摘要 | ≤40字 |
| c-card-accent | 1 | 核心洞察 | ≤25字 |
| c-badge-row | 1 | 流程/关键词预览 | 5-9 标签 |

**排列模式**：居中（v-fill + justify-content: center）
**Portrait 密度**：4-5 组件
**视觉重心**：chr-title

```
┌──────────────────────┐
│                      │
│    chr-title         │
│    chr-sub           │
│  ┌──────────────────┐│
│  │ c-card-accent    ││
│  └──────────────────┘│
│ → 采集 → 去噪 → Wiki │  ← badge row 流程预览
└──────────────────────┘
```

### 8. 章节分隔

**何时用**：章节过渡、话题转换

| 组件 | 数量 | 作用 | 字数预算 |
|------|------|------|---------|
| chr-title | 1 | 章节标题 | ≤12字 |
| c-divider-accent | 1 | 分隔线 | — |
| c-note | 1 | 章节预告 | ≤40字 |
| c-card-soft | 1-2 | 章节背景/统计 | 每卡 ≤25字 |

**排列模式**：居中堆叠（v-center）
**Portrait 密度**：3-4 组件
**视觉重心**：chr-title

### 9. 行动/CTA

**何时用**：操作指引、下一步行动、Call to Action

| 组件 | 数量 | 作用 | 字数预算 |
|------|------|------|---------|
| c-card-accent | 1 | 核心行动 | ≤25字 |
| c-steps | 3 | 步骤指引 | 每步 ≤20字 |
| c-badge-row | 1 | 行动标签 | — |

**排列模式**：accent card 在上 → steps 在下
**Portrait 密度**：4-5 组件
**视觉重心**：c-card-accent

### 10. 结尾/Thanks

**何时用**：deck 最后一页

| 组件 | 数量 | 作用 | 字数预算 |
|------|------|------|---------|
| chr-title | 1 | 致谢 | ≤10字 |
| c-note | 1 | CTA/资源链接 | ≤50字 |
| c-grid-2(c-card-soft) | 2 | 资源/社区 | 每卡 ≤25字 |
| c-badge-row | 1 | 话题标签 | 4-6 标签 |

**排列模式**：居中分布（v-distribute），内容从上到下展开
**Portrait 密度**：5-6 组件
**视觉重心**：chr-title

```
┌──────────────────────┐
│                      │
│    chr-title         │
│  ┌──────────────────┐│
│  │ c-note (CTA)     ││
│  └──────────────────┘│
│ ┌────────┐ ┌────────┐│
│ │ 资源   │ │ 社区   ││
│ └────────┘ └────────┘│
│ #tag1 #tag2 #tag3    │
└──────────────────────┘
```

## 画布差异

| 维度 | 16:9 Landscape | 3:4 Portrait |
|------|---------------|-------------|
| 组件数 | 2-6 | 3-6 |
| 卡片正文字数 | ≤40字 | ≤25字 |
| 排列偏好 | 横向网格（2-4列） | 纵向堆叠（1-2列） |
| 填充率阈值 | > 20% | > 45% |
| 字体基准 | px (72px h1) | cqi (body 4cqi) |

## 预检清单

每页 slide 规划完成后，人工检查：

- [ ] 组件数 ∈ [3, 6]（portrait）或 [2, 6]（landscape）
- [ ] 有视觉重心（c-card-accent / c-hero / c-kpi / c-quote 至少一个）
- [ ] 单卡片正文 ≤ 25字（portrait）/ ≤ 40字（landscape）
- [ ] 总字数在预算内（portrait ≤ 120字/页）
- [ ] 底部有内容填充（c-badge-row / c-note / c-card-soft 兜底）
- [ ] 排列模式与内容语义匹配（查上表）
```

- [ ] **Step 2: Verify file is well-formed**

Run: `wc -l /Users/majiang/Work/tools/slides-on/references/content-planning.md`
Expected: ~250 lines

- [ ] **Step 3: Commit**

```bash
cd /Users/majiang/Work/tools/slides-on
git add references/content-planning.md
git commit -m "docs: add content-planning.md — 10 semantics × component combos × layout patterns"
```

---

### Task 2: Rewrite SKILL.md pipeline sections

**Files:**
- Modify: `SKILL.md`

This task rewrites the key pipeline sections of SKILL.md. The existing SKILL.md is 536 lines; we modify ~200 lines across Step 1, Step 3, Step 4 (QA), and add Step 6 (repair loop).

- [ ] **Step 1: Update frontmatter description to mention 18-group QA**

In `SKILL.md` line 10-11, change:
```
→ QA gate → export (PNG/PPTX/PDF).
  Built-in 3-layer QA: BLOCKER (must fix) / WARN (should review) / INFO (suggestion).
```
To:
```
→ L0 validation → HTML rendering → L1 QA gate (18 groups) → repair loop → export.
  QA at every gate: BLOCKER (must fix) / WARN (should review) / INFO (suggestion).
```

- [ ] **Step 2: Update core constraints (line 24)**

Change:
```
4. **QA 门禁**：Step 4 产出后自动运行，BLOCKER > 0 则阻塞，不得进入 Step 5
```
To:
```
4. **QA 门禁**：L0 在渲染前（validate-slides），L1 在渲染后（visual-qa 18项检测），BLOCKER > 0 阻塞，进入修复循环
```

- [ ] **Step 3: Update pipeline overview (line 16)**

Change:
```
流水线：**内容分析 → 风格决策 → Review 验证 → HTML 渲染 → QA 门禁 → 可视化微调 → 导出**。
```
To:
```
流水线：**内容分析 → 风格决策 → L0 验证 → HTML 渲染 → L1 QA 门禁 → 修复循环 → 可视化微调 → 导出**。QA 嵌入每一步，不只在最后一关。
```

- [ ] **Step 4: Rewrite Step 1 outline.md format (lines 45-63)**

Replace the old format:
```markdown
**产出**：`outline.md`（slides 结构大纲），格式：
```markdown
# Slides: <标题>

## Cover
- 标题: ...
- 副标题: ...
- 作者: ...

## Section 1: <章节名>
### Slide 1.1: <页面标题>
- 原型: 痛点页 | 核心概念页 | 流程页 | 对比页 | 金句页 | 数据页 | 分类页 | 速查页 | 行动页 | Thanks页
- 锚点: c-card-warn | c-kpi | c-steps | c-glass | c-formula | ...
- 组件: c-stack(c-card-warn × 2 + c-card-accent × 1) + c-formula
- 字数: ~120 字
- 内容: ...
```
```

With:
```markdown
**产出**：`outline.md`（slides 结构大纲），每页必须包含**组件规划表**：

```markdown
# Slides: <标题>

## Cover
- 标题: ...
- 副标题: ...
- 作者: ...

## Section 1: <章节名>

### Slide 1.1: <页面标题>

**核心信息**：一句话描述本页要传达的核心观点

**内容语义**：痛点/数据/流程/对比/代码/金句/封面/章节/行动/结尾（10选1，查 `content-planning.md`）

**组件规划**：
| 位置 | 组件 | 作用 | 内容描述 | 字数 |
|------|------|------|---------|------|
| top | c-card-warn | 痛点1 | ... | ≤25字 |
| mid | c-card-warn | 痛点2 | ... | ≤25字 |
| mid | c-card-accent | 方案预告 | ... | ≤20字 |
| bottom | c-badge-row | 关键词 | 3-5标签 | — |

**排列模式**：堆叠/网格/hero+辅助（查 `content-planning.md`）
**预检**：组件 N 个（3-6 ✓），总字数 ~XX（< 上限），预估填充率 ~XX%（> 45% ✓）
```
```

- [ ] **Step 5: Add content-planning.md to Step 1 references (line 65-70)**

Add to the reference docs list:
```markdown
- `references/content-planning.md` — **内容语义 → 组件组合 → 排列模式** 决策表（10种 × ASCII示意图）
```

- [ ] **Step 6: Rewrite Step 3 (Review) to be L0 validation (lines 135-185)**

Replace the entire Step 3 section:

```markdown
### Step 3: L0 验证（渲染前）

**输入**：`slides.json`

**处理**：在 HTML 渲染前，自动验证 slides.json 的结构和预算：

1. **自动验证**（`bun scripts/validate-slides.ts --input slides.json`）：
   - Schema 检查：design 名、canvas、slide type 合法性 → **BLOCKER（必须修）**
   - 密度预算：组件数 3-6（portrait）/ 2-6（landscape）→ WARN
   - 字数上限：单卡片正文 ≤ 25字（portrait）/ ≤ 40字（landscape）→ WARN
   - 锚点检查：每页是否有视觉重心 → INFO
   - Design 兼容：blob/color/chipColor 是否被目标 Design 支持 → INFO
   > **BLOCKER > 0 则阻塞，回 Step 1/2 调整，直到 0 才进入 Step 4。**

2. **内容溢出检查**（参考 `content-planning.md` 预检清单）：
   - c-card 正文 > 30字（portrait）/ > 50字（landscape）→ 精简或拆为 2 卡片
   - c-steps > 4 步（portrait）/ > 7 步（landscape）→ 拆为两页
   - 组件总数 > profile.componentMax → 拆页
   
3. **留白过大检查**：
   - 组件 < profile.componentMin → 加 c-badge-row、c-note、c-card-soft
   - 底部无填充组件 → 加 c-badge-row 或 c-note 兜底

4. **风格匹配检查**：Design 的 mood/texture 与内容调性是否冲突？
   - 严肃/学术内容 + 马卡龙/手绘风 → 换 Design
   - 数据密集内容 + 极简 Design → 检查颜色变体够不够

**产出**：`review.md`，记录每页判定和调整决策。BLOCKER = 0 才进入 Step 4。
```

- [ ] **Step 7: Rewrite Step 4 QA section (lines 197-245)**

Replace the QA block in Step 4:

```markdown
6. **L1 QA 质量门禁**（渲染后自动）：Step 4 产出 index.html 后，**必须**运行：

   ```bash
   bun scripts/qa.ts --check --deck <deck-name>
   ```

   18 组检测（`scripts/visual-qa.ts`），自动识别 portrait/landscape 画布并切换阈值：

   | # | 检测组 | BLOCKER条件 |
   |---|--------|-----------|
   | 1 | text-overflow | scrollHeight > clientHeight |
   | 2 | occlusion | 元素交叉 > 10% |
   | 3 | whitespace | 填充率 < fillMin（portrait 45%, landscape 20%）|
   | 4 | spacing | 间距方差 > 50% |
   | 5 | contrast | WCAG AA < 4.5:1（大文本 < 3:1）|
   | 6 | font-hierarchy | 字号层级倒挂 |
   | 7-8 | chrome-position/presence | 位置漂移 > 2px / 缺失 |
   | 9 | css-var-health | 关键 CSS 变量缺失 |
   | 10 | density | 组件 < min 或 > max |
   | 11 | chrome-content-boundary | chr-topbar/footer 重叠内容 |
   | 12 | canvas-fill | 底部空白 > 25%（仅 portrait）|
   | 13 | font-unit | px 字号 < 最小 cqi（仅 portrait）|
   | 14 | css-loading-integrity | body class 与 design CSS 不匹配 |
   | 15 | grid-collapse | g3/g4 未 collapse（仅 portrait）|
   | 16 | chrome-z-index | chr-* absolute 被覆盖 |
   | 17 | font-container-ratio | 字体/容器比例失调 |
   | 18 | inline-row-wrap | badge row 意外换行 |

   **BLOCKER > 0 → 进入 Step 6 修复循环，不得导出。**

   **三级严重度**：

   | 图标 | 级别 | 含义 | 行动 |
   |------|------|------|------|
   | ❌ | BLOCKER | 客观错误 | 必须修到 0 |
   | ⚠️ | WARN | 有标准但可接受 | 大部分应修 |
   | ℹ️ | INFO | 主观建议 | 酌情处理 |
```

- [ ] **Step 8: Add Step 6 — Structured Repair Loop (after Step 5)**

Insert before the current "Step 4 后续：可视化微调" section (line 358):

```markdown
### Step 6: 修复循环

QA 报告有 BLOCKER 或需要处理的 WARN 时，进入结构化修复循环。

**修复分类**：

| 问题类型 | 典型检测组 | 修复方法 |
|---------|-----------|---------|
| **结构错误** | occlusion, chrome-content-boundary, chrome-z-index | 增 --slide-pad-bottom、调 footer position、改 chr-* z-index |
| **内容溢出** | text-overflow, whitespace(BLOCKER) | 精简文字、拆分 slide、减小组件数 |
| **对比度不足** | contrast | 改 --text-3 色值、调 badge 配色（good/warn/bad） |
| **字体问题** | font-unit, font-container-ratio, font-hierarchy | 移除内联 px、改用 --c-* token、提升 cqi 值 |
| **密度问题** | density | 组件太多→拆页，组件太少→加 c-badge-row/c-note/c-card-soft |
| **填充不足** | whitespace(BLOCKER), canvas-fill | 加底部组件、改用 v-distribute、增加内容 |
| **布局异常** | grid-collapse, inline-row-wrap | 减小 badge 字号、加 nowrap、减 g3/g4 列数 |

**修复循环流程**：

1. **分类**：读 QA 报告，按上表分类每个问题
2. **修复**：改 slides.json（内容/结构）或 style.css（样式）
3. **重新组装**：`bun scripts/assemble-deck.ts -i slides.json -o index.html`
4. **重新 QA**：`bun scripts/qa.ts --check --deck <name>`
5. **确认**：BLOCKER 不增加，目标 BLOCKER → 0
6. **重复**：直到 BLOCKER = 0，进入 Step 7 微调

**关键原则**：修一个问题 → reassemble → re-QA。不要批量修完再 QA，否则不知道哪个修改引入新问题。
```

- [ ] **Step 9: Update CLI references from qa.sh to qa.ts (lines 199-201)**

Replace:
```bash
bash scripts/qa.sh <deck-name>           # L0 (JSON) + L1 (浏览器)
bash scripts/qa.sh --all                 # 全量，所有 deck
```
With:
```bash
bun scripts/qa.ts --check --deck <name>  # L0 + L1（单个 deck）
bun scripts/qa.ts --check                # L0 + L1（所有 deck）
bun scripts/qa.ts --plan                 # 变更感知 + Test Plan
bun scripts/qa.ts --regress              # L0 + L1 + L2 完整回归
```

- [ ] **Step 10: Update key files section (line 329-336)**

Update the visual-qa.ts description:
Change `Playwright 10 项检测` to `Playwright 18 项检测`

Add to key files:
```markdown
- `scripts/qa.ts` — 统一 QA CLI（--plan / --check / --regress / --baseline）
- `scripts/qa/profiles.ts` — Portrait/Landscape 双 profile 阈值
- `scripts/qa/analyze-changes.ts` — 变更感知（git diff → 影响范围）
- `scripts/qa/baseline.ts` — 截图基线管理 + pixelmatch 回归对比
```

- [ ] **Step 11: Commit**

```bash
cd /Users/majiang/Work/tools/slides-on
git add SKILL.md
git commit -m "feat: rewrite SKILL.md pipeline — QA at every gate, content-first planning, repair loop"
```

---

### Task 3: Verify end-to-end

**Files:**
- None (verification only)

- [ ] **Step 1: Run full QA on blueprint-3x4**

```bash
cd /Users/majiang/Work/tools/slides-on
bun scripts/assemble-deck.ts -i templates/full-decks/knowledge-arch-blueprint-3x4/slides.json -o templates/full-decks/knowledge-arch-blueprint-3x4/index.html
bun scripts/qa.ts --check --deck knowledge-arch-blueprint-3x4
```

Expected: BLOCKER ≤ 3, no new issues.

- [ ] **Step 2: Verify SKILL.md references are valid**

Check all referenced files exist:
```bash
for f in references/content-planning.md references/component-recipes.md references/content-rules-portrait.md references/quality-spec.md; do
  test -f $f && echo "✅ $f" || echo "❌ MISSING: $f"
done
```

- [ ] **Step 3: Commit verification**

```bash
cd /Users/majiang/Work/tools/slides-on
git add -A && git diff --cached --stat
git commit -m "chore: verify SKILL.md pipeline enhancement end-to-end"
```
