---
name: slides-on
description: >
  Presentation and visual content creation toolkit — 4 scene-specific
  workflows. Use when asked to create slides (3:4 mobile / 16:9 landscape),
  produce AI-generated images, or build SVG architecture diagrams. Includes
  小红书图文, 演示文稿, 生图, 架构图, 卡片制作, PPT, 信息图.
---

# slides-on — 统一演示与视觉内容工具

安装一次，获得 4 个场景化工作流。根据用户意图自动路由到对应子技能：

| 用户说 | 路由到 | 做什么 |
|--------|--------|--------|
| 小红书、图文、卡片、3:4 | `slides-card/SKILL.md` | 3:4 竖版图文卡片（14 种 slide type） |
| PPT、slides、演示、16:9、汇报 | `slides-ppt/SKILL.md` | 16:9 横版演示文稿（31 种布局） |
| 生图、AI 图片、配图、插画 | `slides-imagine/SKILL.md` | AI 图片生成（10 个 Provider） |
| 架构图、流程图、时序图、SVG | `slides-diagram/SKILL.md` | SVG 架构图（4 种图示） |

**路由规则**：先判断用户任务属于哪个场景 → 立即 `Read` 对应子技能的 `SKILL.md` → 严格按照子技能的 pipeline 执行。不要跳过子技能文档直接操作。
