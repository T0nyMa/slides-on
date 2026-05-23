# slides-on vs baoyu — Prompt Comparison Report

Generated: 2026-05-21T13:15:16.617Z

## Summary

| # | Test Case | slides-on Role | baoyu Skill | slides-on (chars) | baoyu (chars) | Ratio |
|---|-----------|---------------|-------------|-------------------|---------------|-------|
| 01-infographic | Infographic — 推荐系统三阶段流程 | infographic | baoyu-infographic | 4925 | 2896 | 170% |
| 02-cover | Cover Image — 分布式系统技术博客封面 | cover | baoyu-cover-image | 2171 | 2626 | 83% |
| 03-illustration | Illustration — 未来城市天际线（无文字背景图） | illustration | baoyu-article-illustrator | 2270 | 1672 | 136% |
| 04-image-card | Image Card — 小红书推荐系统科普卡片 | image-card | baoyu-image-cards | 3532 | 2401 | 147% |
| 05-comic | Comic Page — 神经网络工作原理（日式漫画风） | comic-page | baoyu-comic | 2874 | 4647 | 62% |
| 06-content-page | Content Page — 技术架构图（含烘焙文字） | content-page | baoyu-article-illustrator + baoyu-infographic | 2474 | 3115 | 79% |
| **Total** | | | | **18246** | **17357** | **105%** |

## Key Differences

### slides-on (deterministic TypeScript)
- **3-layer assembly**: Layer 1 (Role template) → Layer 2 (Style Lock + Palette) → Layer 3 (Content composition)
- **Same input → same output**: No LLM variance
- **Structured**: Role-specific templates with typed parameters
- **Style definitions**: Loaded from markdown files, applied programmatically
- **Palette override**: Hex value replacement while preserving rendering rules

### baoyu (LLM-generated via skill instructions)
- **AI agent interprets instructions**: No deterministic code for prompt assembly
- **Content analysis first**: Creates analysis.md → structured-content.md → prompt
- **YAML frontmatter**: Rich metadata in prompts (type, palette, references)
- **Confirmation workflow**: Multi-step user interaction before generation
- **Reference-driven design**: Detailed visual element extraction from reference images

## Structural Comparison by Role

### 01-infographic: Infographic — 推荐系统三阶段流程

- **slides-on role**: `infographic`, design: `sketch-notes`
- **baoyu skill**: `baoyu-infographic`
- **slides-on**: 102 lines
- **baoyu**: 94 lines

See: `compare-results/01-infographic/side-by-side.md`

### 02-cover: Cover Image — 分布式系统技术博客封面

- **slides-on role**: `cover`, design: `dark-atmospheric`
- **baoyu skill**: `baoyu-cover-image`
- **slides-on**: 38 lines
- **baoyu**: 59 lines

See: `compare-results/02-cover/side-by-side.md`

### 03-illustration: Illustration — 未来城市天际线（无文字背景图）

- **slides-on role**: `illustration`, design: `sketch-notes`
- **baoyu skill**: `baoyu-article-illustrator`
- **slides-on**: 44 lines
- **baoyu**: 42 lines

See: `compare-results/03-illustration/side-by-side.md`

### 04-image-card: Image Card — 小红书推荐系统科普卡片

- **slides-on role**: `image-card`, design: `xiaohongshu-white`
- **baoyu skill**: `baoyu-image-cards`
- **slides-on**: 60 lines
- **baoyu**: 82 lines

See: `compare-results/04-image-card/side-by-side.md`

### 05-comic: Comic Page — 神经网络工作原理（日式漫画风）

- **slides-on role**: `comic-page`, design: `sketch-notes`
- **baoyu skill**: `baoyu-comic`
- **slides-on**: 129 lines
- **baoyu**: 93 lines

See: `compare-results/05-comic/side-by-side.md`

### 06-content-page: Content Page — 技术架构图（含烘焙文字）

- **slides-on role**: `content-page`, design: `blueprint`
- **baoyu skill**: `baoyu-article-illustrator + baoyu-infographic`
- **slides-on**: 51 lines
- **baoyu**: 96 lines

See: `compare-results/06-content-page/side-by-side.md`
