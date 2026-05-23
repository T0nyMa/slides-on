---
name: slides-diagram
description: >
  Generate SVG architecture diagrams, flowcharts, sequence diagrams, and
  structural diagrams for presentations. Use whenever the user asks to create
  architecture diagrams, 架构图, 流程图, 时序图, 结构图, SVG diagrams,
  draw system architecture, make a flowchart, or any technical diagram for
  slides. Strict 8-layer z-order, 8 semantic colors, 4 diagram types.
---

# slides-diagram — SVG 架构图/流程图

4 种图类型，严格 8 层 z-order，8 种语义色。产出 SVG + @2x PNG。

## 图类型选择

| 类型 | 适用场景 |
|------|---------|
| **architecture** | 系统架构、组件关系、层次结构 |
| **flowchart** | 业务流程、数据流、决策流 |
| **sequence** | 调用时序、消息交互、请求响应 |
| **structural** | 组织架构、模块分解、概念层级 |

## 8 层 Z-Order（必须严格遵守）

```
Layer 1: 背景 (Background)
Layer 2: 区域边界 (Region boundaries)
Layer 3: 连接箭头 (Connection arrows)
Layer 4: 遮罩矩形 (Mask rectangles)
Layer 5: 组件框 (Component boxes)
Layer 6: 文本 (Text)
Layer 7: 图例 (Legend)
Layer 8: 标题 (Title)
```

## 8 种语义色

```
Primary:    #60a5fa (蓝)    — 核心组件
Secondary:  #a78bfa (紫)    — 次要组件
Tertiary:   #34d399 (绿)    — 辅助组件
Accent:     #f472b6 (粉)    — 强调
Alert:      #fb923c (橙)    — 警告/异常
Connector:  #94a3b8 (灰)    — 连接线
Neutral:    #334155 (深灰)  — 背景填充
Highlight:  #fbbf24 (黄)    — 高亮标注
```

## 嵌入 Slides

生成的 SVG 通过两种方式嵌入：

```html
<!-- 方式 1：内联 SVG（推荐，保持矢量质量）-->
<div class="slide"><svg viewBox="0 0 800 600">...</svg></div>

<!-- 方式 2：img 引用 -->
<img src="diagram.svg" alt="架构图">
```

## SVG → PNG 转换

```bash
bun ../../scripts/svg-to-png.ts diagram.svg
```

## 核心参考

- `architecture.md` — 架构图规范
- `flowchart.md` — 流程图规范
- `sequence.md` — 时序图规范
- `structural.md` — 结构图规范
- `../../references/ai-visuals.md` — SVG 图集成到 slides 的方式
