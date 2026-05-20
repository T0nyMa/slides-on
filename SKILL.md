---
name: slides-on
description: >
  Use when the user asks you to create, design, or produce visual content —
  anything meant to be seen rather than read or run. This covers: presentation
  slides and pitch decks (PPT, Keynote, 演示文稿, 汇报, slides, 周报, 提案);
  social media cards, posters, and portrait graphics (小红书, 海报, 卡片,
  posters, 3:4, portrait); AI-generated images, cover art, infographics, and
  illustrations (封面图, 配图, 信息图, 生图, cover images, hero images,
  infographic); technical and architecture diagrams (架构图, 流程图, SVG,
  flowcharts, sequence diagrams); and educational comics or manga strips
  (知识漫画, manga, comic strips). Auto-routes to 5 specialized sub-skills
  based on the user's scene.
---

# slides-on

根据用户意图自动路由到对应子技能：

| 用户说 | 路由到 | 做什么 |
|--------|--------|--------|
| 小红书、图文、卡片、3:4、portrait、social card、海报、poster | `slides-card/SKILL.md` | 3:4 竖版图文卡片（14 种 slide type） |
| PPT、slides、演示、16:9、汇报、周报、提案、路演、技术分享、keynote、pitch、简报 | `slides-ppt/SKILL.md` | 16:9 横版演示文稿（31 种布局） |
| 生图、AI 图片、配图、插画、封面图、信息图、infographic、illustration | `slides-imagine/SKILL.md` | AI 图片生成（10 个 Provider） |
| 架构图、流程图、时序图、SVG、diagram、architecture、flowchart | `slides-diagram/SKILL.md` | SVG 架构图（4 种图示） |
| 漫画、comic、manga、教育漫画、知识漫画 | `slides-comic/SKILL.md` | 知识漫画创作（6种画风 × 7种色调 × 7种版式） |

先判断用户任务属于哪个场景 → 立即 Read 对应子技能的 SKILL.md → 严格按照子技能的 pipeline 执行。不要跳过子技能文档直接操作。
