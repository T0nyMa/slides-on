# QA Pipeline & Regression System Design

> **Goal:** 从纯手动肉眼验证 → 可持续的自动化回归体系，嵌入 superpowers 开发流程。

## 问题诊断

当前 slides-on 项目迭代问题：

| 症状 | 根因 |
|------|------|
| 改 CSS 不知道影响多少 deck | 无变更感知，无影响范围分析 |
| 修正不知道对不对 | 无截图基线回归对比 |
| 反复返工（fix A → break B → fix B） | 无自动化回归门禁 |
| 3:4 布局/字体问题靠人肉发现 | QA 检测不覆盖 portrait 特有问题 |
| 验证依赖手动打开浏览器 | 纯手动流程，无 CI 风格的自动化 |
| 有 QA 工具但不系统使用 | 工具未嵌入开发流程 |

## 架构

### 两层架构

```
┌─────────────────────────────────────────────────────┐
│ 流程层（superpowers skills 驱动）                      │
│                                                     │
│  brainstorming → writing-plans                      │
│    └── plan 内嵌 Test Plan（qa.ts --plan）           │
│                                                     │
│  subagent-driven-development                        │
│    └── 每个 Task 完成 → QA subagent 自动 --check     │
│    └── spec reviewer → 看 QA 报告                   │
│    └── code reviewer → 看 QA 报告                   │
│                                                     │
│  requesting-code-review                             │
│    └── 最终 review 前，--regress 必须通过            │
│    └── 附截图回归对比报告                            │
│                                                     │
│  finishing-a-development-branch                     │
│    └── L0+L1 0 BLOCKER 才能合入                     │
└─────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────┐
│ 工具层（scripts/qa/）                                 │
│                                                     │
│  qa.ts (统一入口)                                    │
│  ├── analyze-changes.ts  变更感知                   │
│  ├── generate-plan.ts    Test Plan 生成             │
│  ├── baseline.ts         截图基线管理               │
│  ├── profiles.ts         Portrait/Landscape 阈值    │
│  └── visual-qa.ts (增强)  17 组检测                 │
└─────────────────────────────────────────────────────┘
```

## 工具层详细设计

### 1. 统一 CLI 入口

```bash
bun scripts/qa.ts --plan              # 变更感知 → 生成 Test Plan
bun scripts/qa.ts --check             # L0 + L1（秒~分钟级）
bun scripts/qa.ts --check --deck xxx  # 单个 deck
bun scripts/qa.ts --regress           # L0 + L1 + L2（完整回归）
bun scripts/qa.ts --baseline init     # 建立截图基线
bun scripts/qa.ts --baseline update   # 更新基线
```

### 2. 变更感知（analyze-changes.ts）

输入：`git diff HEAD~1` 或指定 base commit
输出：受影响 deck 列表 + 风险等级

变更规则矩阵：

| 变更文件 | 影响范围 | 风险 |
|---------|---------|------|
| `assets/base.css` | ALL decks | high |
| `assets/components.css` | ALL decks | high |
| `assets/fonts.css` | ALL decks | medium |
| `assets/base-design-chrome.css` | ALL decks | high |
| `assets/designs/*.css` | 使用该 design 的 decks | medium |
| `assets/layers/density/*.css` | ALL decks | low |
| `assets/layers/*/*.css` | ALL decks | low |
| `scripts/assemble/skeleton.ts` | ALL decks | high |
| `scripts/assemble/slides.ts` | ALL decks | high |
| `scripts/assemble/types.ts` | ALL decks | medium |
| `templates/full-decks/<name>/slides.json` | deck `<name>` | low |
| `templates/full-decks/<name>/style.css` | deck `<name>` | low |

### 3. Test Plan 生成（generate-plan.ts）

```json
{
  "change": "assets/base.css: --slide-pad-y portrait adjustment",
  "affectedDecks": ["ALL", 17],
  "riskLevel": "high",
  "canvasProfiles": ["3:4"],
  "steps": [
    {"layer": "L0", "tool": "validate-slides.ts", "decks": 17, "estTime": "2s"},
    {"layer": "L1", "tool": "visual-qa.ts --profile portrait", "decks": 17, "estTime": "30s"},
    {"layer": "L2", "tool": "baseline compare", "decks": "sample(3)", "estTime": "60s"}
  ],
  "focusDecks": ["xhs-post", "knowledge-arch-blueprint-3x4", "xhs-pastel-card"],
  "focusChecklist": [
    "chr-topbar 是否与内容重叠",
    "底部 25% 是否有内容填充",
    "字体/容器比例是否在舒适区间",
    "g3/g4 是否 collapse 到 2 列"
  ]
}
```

### 4. 截图基线（baseline.ts）

```
.qa/
├── baselines/
│   ├── manifest.json           # { "commit": "abc123", "timestamp": "..." }
│   ├── hermes-cyber-terminal/
│   │   ├── slide-01.png
│   │   ├── slide-02.png
│   │   └── ...
│   └── xhs-post/
│       └── ...
├── reports/
│   └── 2026-05-17-143000/
│       ├── report.json
│       └── diffs/
│           └── xhs-post-slide-03-diff.png
```

基线 PNG 不入 git（.gitignore），只记录 manifest.json。

### 5. 检测组（17 组）

在现有 10 组基础上新增 7 组，全部支持 portrait/landscape 双 profile：

| # | 检测组 | Severity | Portrait 阈值 | Landscape 阈值 |
|---|--------|----------|-------------|----------------|
| 1 | text-overflow | BLOCKER | 共用 | 共用 |
| 2 | occlusion | BLOCKER/WARN | 共用 | 共用 |
| 3 | whitespace | BLOCKER/WARN | fill 50-85% | fill 20-85% |
| 4 | spacing | WARN/INFO | 共用 | 共用 |
| 5 | contrast | BLOCKER/WARN | 共用 WCAG AA | 共用 |
| 6 | font-hierarchy | BLOCKER/WARN | h1 5-9cqi, body 1.5-2.5cqi | h1 72px, body 16px |
| 7 | chrome-position | WARN | 共用 | 共用 |
| 8 | chrome-presence | WARN | 共用 | 共用 |
| 9 | css-var-health | BLOCKER | 共用 | 共用 |
| 10 | density | WARN | 4-8 组件，< 3 WARN, > 10 WARN | 2-6 组件 |
| **11** | **chrome-content-boundary** | **BLOCKER** | chr-topbar 距内容 > 1cqi | 共用 |
| **12** | **canvas-fill** | **WARN/BLOCKER** | 底部 25% 必须有内容，象限均衡检查 | 不检查 |
| **13** | **font-unit** | **WARN** | 禁止 px 字号，必须 cqi 或 var | 不检查 |
| **14** | **css-loading-integrity** | **BLOCKER** | body class 与加载 CSS 匹配 | 共用 |
| **15** | **grid-collapse** | **WARN** | g3/g4 必须 ≤ 2 列 | 不检查 |
| **16** | **chrome-z-index** | **BLOCKER** | chr-* absolute z-index > 内容 | 共用 |
| **17** | **font-container-ratio** | **WARN** | 按组件类型的比例感知 | 按组件类型的比例感知 |

### 6. 字体比例感知（第 17 组）

不检测绝对值，检测**字体与容器的比例关系**：

| 组件类型 | 标题/容器宽 | 正文/容器宽 | 原理 |
|---------|-----------|-----------|------|
| `c-card` | 6-10% | 4-7% | 阅读容器，正文需足够大 |
| `c-hero` | 8-14% | — | 英雄数字要震撼 |
| `c-step` | 5-8% | 3-5% | 步骤较紧凑 |
| `c-codebox` | — | 2-3% | 代码天然小字号 |
| `c-quote` | — | 5-8% | 引用需有冲击力 |
| `c-kpi` | 8-12% (数值) | 3-5% (标签) | KPI 数值要大 |

检测逻辑：
```
对每个组件:
  containerWidth = getBoundingClientRect().width
  fontSize = getComputedStyle().fontSize
  ratio = fontSize / containerWidth
  查表 → ratio < 下限 → WARN "正文占容器 2.3%，建议 ≥ 4%"
```

### 7. Profile 系统

```typescript
// scripts/qa/profiles.ts
const PROFILES = {
  "portrait": {
    fillMin: 0.50,
    fillMax: 0.85,
    componentMin: 4,
    componentMax: 8,
    bottomEmptyMaxRatio: 0.25,   // 底部 25% 不能全空
    gridMaxCols: 2,
    bodyMinCqi: 1.4,
    fontNoPx: true,
  },
  "landscape": {
    fillMin: 0.20,
    fillMax: 0.85,
    componentMin: 2,
    componentMax: 6,
    // 底部留白不检查，px 字号不检查，grid 不检查
  }
};
```

## 流程层：Superpowers 集成

### 改造 writing-plans

`writing-plans` skill 在生成 plan 后，追加一步：
```
- [ ] 运行 bun scripts/qa.ts --plan，将 Test Plan 嵌入本 plan
```

### 改造 subagent-driven-development

每个 Task 的 implementer subagent prompt 中追加：
```
完成后运行: bun scripts/qa.ts --check --deck <affected-deck>
QA 报告附在 self-review 中
```

spec reviewer subagent prompt 中追加：
```
验证 QA 报告：BLOCKER 数量是否 ≤ 基线？无新引入问题？
```

### 改造 requesting-code-review

最终 review 前，必须运行 `bun scripts/qa.ts --regress`，报告附在 review request 中。

### 改造 finishing-a-development-branch

合入前门禁：
```
bun scripts/qa.ts --check   # L0+L1 必须 0 BLOCKER
```

## 关键文件

| 文件 | 职责 | 状态 |
|------|------|------|
| `scripts/qa.ts` | 统一 CLI 入口 | 新建 |
| `scripts/qa/analyze-changes.ts` | git diff → 影响范围 | 新建 |
| `scripts/qa/generate-plan.ts` | 影响范围 → Test Plan JSON | 新建 |
| `scripts/qa/baseline.ts` | 截图基线管理 + 回归对比 | 新建 |
| `scripts/qa/profiles.ts` | Portrait/Landscape 双 profile 阈值 | 新建 |
| `scripts/visual-qa.ts` | 增强：10→17 组检测 + profile 感知 | 修改 |
| `scripts/qa.sh` | 保留兼容，内部调用 qa.ts | 修改 |

## 不做的

- CI 集成（GitHub Actions）— 后续迭代
- 测试报告仪表盘 — 后续迭代
- 16:9 landscape profile 完整阈值 — 先做 3:4
- AI 视觉评估 — 成本太高，先用比例规则
