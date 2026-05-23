# CLAUDE.md

slides-on — Claude Code skill，从原始文档生成交互 HTML 演示 + 导出 PNG/PPTX/PDF。

## Skill 分工

项目采用 **root dispatcher + 5 子技能** 架构。Root SKILL.md 是纯路由层，不含业务逻辑。分工边界：

| 子技能 | 画布 | 核心职责 | 不做什么 |
|--------|------|---------|---------|
| **slides-card** | 3:4 portrait | 独立知识卡片、小红书图文，c-* 组件拼装，Claude 直接写 HTML | 不直接用 single-page layout（那是 16:9 的） |
| **slides-ppt** | 16:9 landscape | 演讲辅助、技术分享、周报、路演，single-page layout + c-* 混合，Claude 直接写 HTML | 不处理 3:4 竖版内容 |
| **slides-imagine** | 任意 | AI 生图（插图/封面/信息图），10 个 Provider，AI-driven prompt 写作 | 不生成 HTML 页面 |
| **slides-diagram** | 任意 | SVG 架构图/流程图/时序图/结构图，8 层 z-order | 不生成像素图 |
| **slides-comic** | 任意 | 知识漫画创作，6 种画风 × 7 种色调 × 7 种版式 | — |

**跨技能协作**：slides-card 和 slides-ppt 通过 HTML `<img>` 标签引用 slides-imagine 生成的 PNG。slides-diagram 生成的 SVG 可内联到 slides-ppt 的 HTML。

## 设计理念

### 核心公式：Slides = Content × Design (× Export)

Claude 直接编写完整单文件 HTML（Content），Design CSS / Theme CSS 提供视觉皮肤（Design），render-precise.ts 等脚本导出最终产物（Export）。

### Design CSS 可移植性

Design 是纯 CSS 变量覆盖层（`.d-{name}` 命名空间），不碰 HTML 结构。同一个 Design CSS 可以套到不同内容上。

### Chrome 与 Content 正交

`chr-*`（页面壳层：topbar、footer、blob、sticker）由 Design CSS 定义视觉。`c-*`（内容组件：card、steps、kpi、quote）由 components.css 定义。两者不互相依赖。

### 双画布策略

- **16:9 landscape**：默认，用 `templates/single-page/` 的 31 种 layout 作为写作参考
- **3:4 portrait**：body class `.portrait` 触发，用 Container Query + cqi 单位等比缩放。严格禁止 px 字号

### 渐进式加载

SKILL.md < 500 行，核心指令内联，详细参考按需 Read。子技能自己的文档放在自己目录里，跨技能共享的放在 `references/`。

### 自检

生成 HTML 后对照 `references/self-check-checklist.md` 逐项自检。不通过则修改 HTML 重新生成。

### 产物自包含

生成的 index.html 所有 CSS/JS 内联，无外部依赖，浏览器直接打开就能用。

## 开发规范

### 路径约定

- 子技能引用脚本：`../../scripts/xxx.ts`
- 子技能引用共享文档：`../../references/xxx.md`
- 子技能引用同级文档：`./xxx.md`
- 跨子技能引用：`../slides-card/xxx.md`
- 共享文档内部引用：去掉 `references/` 前缀，直接写 `designs/xxx.md`

### 脚本

```bash
bun scripts/render-precise.ts index.html --canvas 3:4 --selector .slide
bun scripts/html-to-pptx.ts index.html --output deck.pptx
bun scripts/merge-to-pdf.ts png-out/ --output deck.pdf
bash scripts/package.sh                      # 打包 → slides-on.zip
```

### 常见错误

- 3:4 下用了 px 字号 → 自检查清单会拦
- HTML 中引用外部 CSS/JS 文件 → 必须内联，产物自包含
