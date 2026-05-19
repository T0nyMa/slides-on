# CLAUDE.md

slides-on — Claude Code skill，从原始文档生成交互 HTML 演示 + 导出 PNG/PPTX/PDF。

## Skill 分工

项目采用 **root dispatcher + 4 子技能** 架构。Root SKILL.md 是纯路由层，不含业务逻辑。分工边界：

| 子技能 | 画布 | 核心职责 | 不做什么 |
|--------|------|---------|---------|
| **slides-card** | 3:4 portrait | 小红书图文、社交卡片，c-* 组件拼装 | 不直接用 single-page layout（那是 16:9 的） |
| **slides-ppt** | 16:9 landscape | 演示文稿、技术分享、周报、路演，single-page layout + c-* 混合 | 不处理 3:4 竖版内容 |
| **slides-imagine** | 任意 | AI 生图（插图/封面/信息图），10 个 Provider，三层 prompt 组装 | 不生成 HTML 页面 |
| **slides-diagram** | 任意 | SVG 架构图/流程图/时序图/结构图，8 层 z-order | 不生成像素图 |

**跨技能协作**：slides-card 和 slides-ppt 通过 SlideData 的 `image` 字段引用 slides-imagine 生成的 PNG。slides-diagram 生成的 SVG 可嵌入 slides-ppt 的 HTML。

## 设计理念

### 核心公式：Slides = Template × Design × Content

三者正交——换 Design 不改结构，换 Content 不改皮肤。

### Design CSS 可移植性

Design 是纯 CSS 变量覆盖层（`.d-{name}` 命名空间），不碰 HTML 结构。同一个 Design CSS 可以套到不同 Template 上。每个 Design CSS 必须成对维护一个 DesignManifest JSON（定义类名、chrome 配置、QA 选择器）。改一个就要改另一个。

### Chrome 与 Content 正交

`chr-*`（页面壳层：topbar、footer、blob、sticker）由 Design CSS 定义视觉。`c-*`（内容组件：card、steps、kpi、quote）由 components.css 定义。两者不互相依赖。

### 双画布策略

- **16:9 landscape**：默认，用 `templates/single-page/` 的 31 种 layout
- **3:4 portrait**：body class `.portrait` 触发，用 Container Query + cqi 单位等比缩放。严格禁止 px 字号

### 渐进式加载

SKILL.md < 500 行，核心指令内联，详细参考按需 Read。子技能自己的文档放在自己目录里，跨技能共享的放在 `references/`。

### QA 门禁

每一步都有 L0 validate → L1 visual-qa → repair loop。0 BLOCKER 才能提交。

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
bun scripts/assemble-deck.ts --input slides.json --output index.html
bun scripts/qa.ts --check                    # L0+L1，0 BLOCKER 才能提交
bun scripts/qa.ts --check --deck xxx         # 单 deck
bun scripts/render-precise.ts index.html --slides auto --canvas 16:9
bash scripts/package.sh                      # 打包（不用 package_skill.py）
```

### 常见错误

- DesignManifest 写了不存在的 variant 名（合法的只有 standard/editorial/terminal/handdrawn/card-as-step/card-wrapped）
- 文件移动后 `references/` 前缀在 doc 内部过期
- 3:4 下用了 px 字号 → visual-qa Group 13 会拦
- 渲染截图中出现 editor UI 元素 → render-precise.ts / visual-qa.ts 已注入隐藏 CSS，新增 UI 需要追加
