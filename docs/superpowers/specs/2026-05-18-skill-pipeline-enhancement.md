# SKILL.md Pipeline 强化设计

> **Goal:** 强化 plan → 制作 → 质检 → 修改 全流程，让 skill 使用者产生的 slides 质量可控。

## 问题诊断

| 痛点 | 根因 |
|------|------|
| Plan 阶段不可靠 | outline.md 格式太笼统，"原型: 痛点页" 缺乏组件级规划 |
| 制作阶段无约束 | slides.json 组装时无实时反馈，组件用错/字数超限 |
| 质检发现不知怎么修 | QA 报告缺少结构化的修复指引 |
| 修改引入新问题 | 修复后无回归检测，恶性循环 |

## 架构：QA 嵌入每一步

```
Step 1: Plan（增强）
  │ 产出 outline.md（新格式：组件规划表）
  │ ├─ content-planning.md 查表决策（内容语义→组件组合→排列模式）
  │ └─ Pre-flight 预检（组件数/字数/填充率估算）
  │
  ▼
Step 2: Style Decision
  │ 产出 style-decision.md + slides.json 骨架
  │
  ▼
Step 3: L0 验证  ← 提前到渲染前
  │ bun scripts/validate-slides.ts --input slides.json
  │ └─ BLOCKER > 0 → 回 Step 1
  │
  ▼
Step 4: HTML 渲染
  │ bun scripts/assemble-deck.ts
  │
  ▼
Step 5: L1 质检 ← 自动运行
  │ bun scripts/qa.ts --check --deck <name>
  │ └─ BLOCKER > 0 → Step 6 修复循环
  │
  ▼
Step 6: 修复循环 ← 结构化
  │ S 类 BLOCKER → 改 HTML/CSS → reassemble → re-QA
  │ A 类 WARN → 调密度/字号 → re-QA
  │ V 类 INFO → 酌情处理
  │ 修复后必须确认 BLOCKER 不增加
  │
  ▼
Step 7: 可视化微调 → re-QA
  │
  ▼
Step 8: 导出
```

## 详细设计

### 1. 增强 outline.md 格式

每页 slide 必须包含**组件规划表**：

```markdown
## Slide N.M: <页面标题>

**核心信息**：一句话描述本页要传达的核心观点

**组件规划**：
| 位置 | 组件 | 作用 | 内容描述 | 字数预算 |
|------|------|------|---------|---------|
| top | c-card-warn | 痛点 1 | ... | ≤25字 |
| mid | c-card-warn | 痛点 2 | ... | ≤25字 |
| mid | c-card-accent | 解决方案 | ... | ≤20字 |
| bottom | c-badge-row | 关键词 | 3-5 标签 | — |

**排列模式**：堆叠(stack) / 网格(grid-2) / hero+辅助(hero+cards)
**预检**：组件 N 个（profile 范围 3-6），总字数 ~XX（< 上限），预估填充率 ~XX%（> fillMin）
```

约束：
- 组件数必须在 profile.componentMin-Max 范围内
- 单卡片正文 ≤ 40 字（landscape）/ ≤ 25 字（portrait）
- 必须有视觉重心（c-card-accent / c-hero / c-kpi / c-quote 至少一个）

### 2. 新增 content-planning.md

`references/content-planning.md`：内容语义 → 组件组合 → 排列模式 决策表。

| 内容语义 | 推荐组件 | 排列模式 | Portrait 密度 |
|---------|---------|---------|-------------|
| 痛点/问题 | c-card-warn × 2-3 + c-badge-row | 堆叠 | 3-5 |
| 数据展示 | c-kpi × 2-4 + c-hero-num | 网格 2×2 | 4-6 |
| 流程/步骤 | c-steps × 3-4 + c-note | 堆叠 | 4-5 |
| 对比分析 | c-grid-2(c-card + c-card-accent) + c-badge-row | 网格 | 3-4 |
| 代码/技术 | c-codebox + c-card-soft × 2 + c-badge-row | 代码上/卡片下 | 4-5 |
| 引用/金句 | c-quote + c-note + c-badge-row | 居中堆叠 | 3 |
| 封面 | chr-title + chr-sub + c-card-accent + c-badge-row | 居中 | 4-5 |
| 章节分隔 | chr-title + c-divider + c-note + c-card-soft × 2 | 居中堆叠 | 3-4 |
| 行动/CTA | c-card-accent + c-steps × 3 + c-badge-row | 堆叠 | 4-5 |
| 结尾 | chr-title + c-note + c-grid-2(c-card-soft × 2) + c-badge-row | 居中分布 | 5-6 |

每种排列模式配有 ASCII 示意图，标注组件位置和间距。

### 3. 修复循环指引

QA 报告出来后，按严重度分类修复：

| Tag | 类别 | 典型问题 | 修复方法 |
|-----|------|---------|---------|
| S 类 BLOCKER | 结构 | footer 重叠、内容溢出 | 增 --slide-pad-bottom、精简文字 |
| S 类 BLOCKER | 结构 | 对比度不足 | 改 --text-3 色值、调 badge 配色 |
| A 类 WARN | 美观 | 字体偏小 | 移除内联 px、改用 --c-* token |
| A 类 WARN | 美观 | 密度超标 | 拆页（>6 组件 → 两页） |
| A 类 WARN | 美观 | 填充不足 | 加 c-badge-row / c-note / c-card-soft |
| V 类 INFO | 建议 | 间距不均 | 统一 gap 值 |

修复后必须：`bun scripts/qa.ts --check --deck <name>` 确认 BLOCKER 不增加。

### 4. SKILL.md 关键改动点

- Step 1：引用 content-planning.md，强制使用组件规划表格式
- Step 3（原 Step 3 前移）：L0 validate-slides 提到渲染前
- Step 5（原 Step 4 QA 部分）：替换为 `bun scripts/qa.ts --check`，描述 18 组检测
- Step 6：新增结构化修复循环
- 全局：`qa.sh` 替换为 `qa.ts`

## 关键文件

| 文件 | 职责 | 状态 |
|------|------|------|
| `SKILL.md` | 重写 pipeline，嵌入 QA 门禁 + 修复循环 | 修改 |
| `references/content-planning.md` | 内容语义 → 组件组合 决策表 + 排列模式 | 新建 |
| `scripts/qa.ts` | 已有，可能需要 --plan-check 子命令 | 可选新增 |

## 不做的

- pre-flight 自动化脚本（--plan-check）→ 后续迭代，先手动预检
- 可视化组件规划工具 → 后续
- 自动修复引擎 → 后续
