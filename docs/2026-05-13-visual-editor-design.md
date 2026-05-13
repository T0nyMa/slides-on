# Visual Slide Editor Design

## Overview

slides-on 的 HTML 质量由三条腿保障：

1. **Skill 描述**（预防）：SKILL.md 中的 pipeline 指令控制生成质量
2. **QA 门禁**（检测）：visual-qa.ts 自动检测 10 组视觉问题
3. **可视化 编辑器**（修复）：用户在浏览器中所见即所得地微调 slides

本设计实现第三条腿——一个轻量级的浏览器内编辑器，让用户直接在 slide 画布上调整视觉和内容，编辑结果写回文件系统，操作日志供 skill 持续改进。

## Motivation

当前的编辑方式是"盲改"：

- 视觉调整：手写 polish.css，需要猜 CSS selector 和数值，反复刷新验证
- 内容修改：改 slides.json 后重新 assemble，不能直接看到效果
- QA 自动修复生成的 polish.css 有时不够精确，需要人工微调

用户需要一个直觉化的方式：点击元素 → 调参数 → 立刻看到效果 → 保存。

## Architecture

### 启动流程

```
bun scripts/editor-server.ts path/to/index.html
  → 备份 polish.css.bak + slides.json.bak（首次启动）
  → 启动 Bun HTTP 服务器 (localhost:3456)
  → serve deck 目录静态文件
  → 对 index.html 请求动态注入 <script src="/editor.js"> + <link href="/editor.css">
  → 自动打开浏览器
```

### 运行时架构

```
┌─────────────────────────────────────────────┐
│  浏览器                                      │
│                                             │
│  runtime.js（演示引擎，不修改）                 │
│       ↕ 共存                                 │
│  editor.js（编辑模式，注入）                    │
│    ├── 元素选择 + 高亮（overlay）              │
│    ├── 浮动工具栏（inline toolbar）            │
│    ├── contenteditable 文字编辑               │
│    ├── 拖拽偏移（mousedown/move/up）           │
│    └── fetch POST 保存                       │
│                                             │
└──────────────┬──────────────────────────────┘
               │ HTTP POST
┌──────────────▼──────────────────────────────┐
│  editor-server.ts (Bun)                     │
│    POST /api/save-css   → 写 polish.css     │
│    POST /api/save-json  → 写 slides.json    │
│    POST /api/log        → 追加 edit-log.jsonl│
│    GET  /*              → 静态文件服务        │
└─────────────────────────────────────────────┘
```

### 与现有系统的关系

- **runtime.js**：不修改。editor.js 通过全局 `window` 访问 runtime 暴露的 `go()` 函数（如有），否则自行实现 slide 切换
- **base.css / components.css**：不修改。编辑器操作生成的 CSS 追加到 polish.css
- **visual-qa.ts**：不修改。编辑器可在保存后建议用户重跑 QA 验证
- **assemble-deck.ts**：编辑器的内容修改回写 slides.json 后，服务端调用 assemble 重新生成 HTML

## Editor Mode Interaction

### 进入/退出

- 按 `E` 键切换编辑模式（和 `S` Presenter、`O` Overview 同级）
- 编辑模式下顶部显示工具条：`[编辑中] [保存 ⌘S] [撤销 ⌘Z] [退出 ESC]`
- 键盘导航（← →）在编辑模式下保持工作

### 元素选择

- 鼠标悬停：元素边缘出现淡蓝色虚线（hover overlay）
- 点击：选中元素，显示蓝色实线 + 角标尺寸信息
- 点击空白区域：取消选中
- 编辑模式下阻止链接跳转和按钮行为

### 浮动工具栏

选中元素后，在元素上方/下方弹出工具栏（自动避让边界）。根据元素类型显示不同操作：

| 元素类型 | 可用操作 |
|----------|----------|
| 文本（h1-h4, p, li, span） | 字号 ±、加粗、颜色选择 |
| 容器组件（c-card, c-step, c-kpi） | 内边距 ±、背景色、边框色 |
| 布局容器（c-row, c-grid） | 间距 ± |
| 通用 | 上移、下移、删除 |

### 文字编辑

- 双击文本元素 → 进入 `contenteditable` 模式
- 元素获得编辑光标，可直接键入
- 点击外部或按 `ESC` → 退出编辑，触发保存

### 拖拽偏移

- 选中元素后拖拽 → 生成 CSS `margin-top` / `margin-left` 偏移
- 输出为 polish.css 规则，作用域 `.slide:nth-child(N) selector`

## Save Mechanism

### 双轨保存

| 操作类型 | 输出目标 | 触发方式 |
|----------|----------|----------|
| 视觉调整（字号/颜色/间距/位置） | polish.css | 每次操作即时写入 |
| 内容编辑（改文字/删组件） | slides.json → 重新 assemble | ⌘S 手动保存 |

### CSS 保存格式

视觉调整追加到 polish.css，使用 `slide:nth-child(N)` 作用域隔离：

```css
/* [editor] slide 3: .c-card font-size adjustment */
.slide:nth-child(3) .c-card:nth-child(2) { font-size: 1.0cqi; }

/* [editor] slide 5: h2 color adjustment */
.slide:nth-child(5) h2 { color: #2c3e50; }
```

与 visual-qa.ts 生成的 polish.css 规则共存，编辑器生成的规则以 `/* [editor] */` 标注。

### JSON 回写

内容编辑（文字修改、组件删除）回写到 slides.json：

1. editor.js 收集当前 slide 的 DOM 变更，提取文本内容
2. POST `/api/save-json` 发送 `{slide: N, field: "body", value: "新文字"}`
3. 服务端更新 slides.json 对应字段
4. 服务端调用 `assemble-deck.ts` 重新生成 index.html
5. 客户端 `location.reload()` 刷新

## Edit Log

### 操作日志（edit-log.jsonl）

每次编辑操作记录为一行 JSON，保存在 deck 目录下：

```jsonl
{"ts":"2026-05-13T10:30:00Z","slide":3,"target":".c-card:nth-child(2)","action":"resize-font","from":"1.2cqi","to":"1.0cqi","output":"polish.css"}
{"ts":"2026-05-13T10:30:15Z","slide":3,"target":"h2","action":"edit-text","from":"架构设计","to":"系统架构","output":"slides.json"}
{"ts":"2026-05-13T10:31:00Z","slide":5,"target":".c-step:nth-child(4)","action":"delete","from":"<html-snippet>","to":null,"output":"slides.json"}
```

字段说明：

| 字段 | 类型 | 说明 |
|------|------|------|
| ts | ISO 8601 | 操作时间戳 |
| slide | number | slide 序号（1-based） |
| target | string | CSS selector（相对于 slide） |
| action | string | 操作类型：`resize-font`、`change-color`、`adjust-padding`、`adjust-gap`、`move`、`edit-text`、`delete`、`toggle-bold` |
| from | string/null | 修改前的值 |
| to | string/null | 修改后的值 |
| output | string | 写入目标：`polish.css` 或 `slides.json` |

### 文件快照

首次启动编辑服务器时自动备份：

- `{deck}/polish.css.bak` — 编辑前的 polish.css
- `{deck}/slides.json.bak` — 编辑前的 slides.json

用于回滚和 diff 分析。

### 改进信号

edit-log.jsonl 是 slides-on skill 改进的数据源：

- **高频操作统计**：如果 80% 的编辑是"缩小字号"，说明 skill 的内容规范对字数控制不够严格
- **高频 slide 类型**：如果 cover 页总是被调色，说明 design 的配色方案需要优化
- **action 分布**：visual 调整 vs content 编辑的比例，反映 skill 生成质量的薄弱环节
- **QA 漏检**：编辑器修复了 QA 没检出的问题，说明检测组需要增强

## Files Changed

| 操作 | 文件 | 说明 |
|------|------|------|
| 新建 | `scripts/editor-server.ts` | Bun HTTP 服务器，~80 行 |
| 新建 | `assets/editor.js` | 编辑模式客户端逻辑 |
| 新建 | `assets/editor.css` | 编辑模式 UI 样式（工具栏、高亮、光标） |
| 修改 | `CLAUDE.md` | Scripts 说明增加 editor 命令 |
| 运行时生成 | `{deck}/edit-log.jsonl` | 操作日志 |
| 运行时生成 | `{deck}/polish.css.bak` | 首次启动快照 |
| 运行时生成 | `{deck}/slides.json.bak` | 首次启动快照 |

## Out of Scope

- 实时协作（多用户同时编辑）
- undo 历史持久化（内存级 undo，关闭即丢失）
- 组件拖拽新增（先支持删除和编辑现有组件，新增走 slides.json + assemble）
- WebSocket / HMR（保存后 reload 刷新）
- 跨 slide 拖拽排序
- 移动端适配

## CLI Interface

```bash
bun scripts/editor-server.ts <html-file> [--port 3456]
```

启动后输出：

```
Editor server running at http://localhost:3456
Press E in browser to enter edit mode
Backups: polish.css.bak, slides.json.bak
```
