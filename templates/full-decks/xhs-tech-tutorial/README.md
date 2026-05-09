# xhs-tech-tutorial · 小红书技术教程

小红书 3:4 技术教程图文格式（810 × 1080），纯白底 + 粗黑标题 + 手绘插图配图 + 高信息密度。

每页自成一体，信息量大，接近信息图风格。插图区域使用 `.tt-illust` 占位框，`data-prompt` 属性存储 AI 生图提示词，后期批量替换为实际图片。

**适用场景：** 技术教程、AI/编程知识科普、工具指南、框架入门图解。
**使用方式：** 每张 `.slide` 截图导出，保持 810×1080 比例。
**Feel:** 干货满满的技术科普帖，配手绘插图让硬核内容更易消化。

## 可用布局

| 布局 | 组件 | 适用内容 |
|------|------|---------|
| Cover | `tt-cover` | 封面：副标题 + 大标题 + 大插图 + 底部信息 |
| Step-flow | `tt-step-flow` + `tt-step` + `tt-connector` | 步骤流程（左插图右文字 + 箭头连接） |
| Icon-list | `tt-icon-list` + `tt-icon-row` | 分类列表（左图标右描述） |
| Formula | `tt-formula` + `tt-badge` + `tt-example-box` | 公式/概念框 + 彩色标签 |
| Section-boxes | `tt-section` | 多个边框区块堆叠 |
| Color-cards | `tt-card-grid` + `tt-card` | 彩色卡片网格（2-3列） |
| Warn-box | `tt-warn-box` | 红色边框警告区块 |

## 插图占位

```html
<div class="tt-illust tt-illust-md" data-prompt="描述提示词">占位文字</div>
```

尺寸变体：`tt-illust-sm`（小图标）、`tt-illust-md`（中等）、`tt-illust-lg`（大幅）。
