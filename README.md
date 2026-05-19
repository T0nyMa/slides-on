# slides-on

从任意文档一键生成演示文稿——交互 HTML、PNG、PPTX、PDF，四种场景覆盖。

## 四个工作流

| 你说 | 得到 |
|------|------|
| "帮我做一张小红书图文" | 3:4 竖版卡片，马卡龙/杂志/手绘风格，浏览器直接编辑 |
| "把这篇文档做成 PPT" | 16:9 演示文稿，31 种布局，键盘翻页，导出 PPTX/PDF |
| "给这页配张插图" | AI 生图，10 个 Provider，风格统一，锚定跨页一致性 |
| "画个架构图" | SVG 架构图/流程图/时序图，8 层渲染，矢量导出 |

每张 slide 自带可视化编辑器——浏览器打开，按 E 所见即所得修改。

## 快速开始

安装 `slides-on.skill` 到 Claude Code 后，直接说：

- "帮我把这个文档做成小红书图文"
- "写一份技术分享的 PPT，主题是推荐系统架构"
- "给第三页生成一张封面图"
- "画一个微服务的架构图"

Claude 自动路由到对应工作流，按 pipeline 逐步执行。

## 导出格式

| 格式 | 命令 |
|------|------|
| PNG @2x | `bun scripts/render-precise.ts index.html --slides auto` |
| PPTX | `bun scripts/html-to-pptx.ts index.html` |
| PDF | `bun scripts/merge-to-pdf.ts png-out/` |

## 设计系统

- 15 个 Design CSS（portable 视觉皮肤，换肤不改结构）
- 36 个 Theme（CSS 变量配色）
- 31 种单页布局 + 14 种 slide type
- 27 种 CSS 动画 + 20 种 Canvas 特效
- 18 组视觉 QA 自动检测（溢出/遮挡/对比度/字号/密度）

## License

MIT
