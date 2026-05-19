---
name: slides-on
description: >
  Presentation and visual content creation toolkit. Use whenever the user asks
  to create slides, a presentation, a deck, a keynote, a pitch, or any visual
  content — PPT, 演示文稿, 做PPT, 做slides, 汇报, 周报, 提案, 路演, 技术分享,
  简报, weekly report, pitch deck, poster, make a deck. Also use for 小红书图文,
  3:4 portrait social cards, 卡片制作, mobile-friendly image cards, social media
  posts. Also use for AI image generation: 生图, AI 图片, 插图, 封面图, 配图,
  信息图, infographic, illustration, cover image. Also use for technical diagrams:
  架构图, 流程图, 时序图, SVG diagram, architecture diagram, flowchart.
  Routes to 4 scene-specific sub-skills based on user intent.
---

# slides-on

根据用户意图自动路由到对应子技能：

| 用户说 | 路由到 | 做什么 |
|--------|--------|--------|
| 小红书、图文、卡片、3:4、portrait、social card、海报、poster | `slides-card/SKILL.md` | 3:4 竖版图文卡片（14 种 slide type） |
| PPT、slides、演示、16:9、汇报、周报、提案、路演、技术分享、keynote、pitch、简报 | `slides-ppt/SKILL.md` | 16:9 横版演示文稿（31 种布局） |
| 生图、AI 图片、配图、插画、封面图、信息图、infographic、illustration | `slides-imagine/SKILL.md` | AI 图片生成（10 个 Provider） |
| 架构图、流程图、时序图、SVG、diagram、architecture、flowchart | `slides-diagram/SKILL.md` | SVG 架构图（4 种图示） |

先判断用户任务属于哪个场景 → 立即 Read 对应子技能的 SKILL.md → 严格按照子技能的 pipeline 执行。不要跳过子技能文档直接操作。
