# PPT/演示工具研究与整合方案

## 一、四个项目详细介绍

---

### 1. html-ppt-skill

**定位**：纯 HTML/CSS/JS 的演示文稿系统，生成可交互的网页演示。

**核心技术栈**：
- **渲染引擎**：纯静态 HTML + CSS Variables + 原生 JS，零框架依赖
- **主题系统**：36 个内置主题，基于 CSS Variables 实现（`--bg`, `--text-1`, `--accent`, `--font-sans` 等），切换主题只需替换 `:root` 变量
- **布局系统**：31 种布局类型（openers、text-centric、numbers/data、code/terminal、diagrams、comparisons、visuals、closers），每种布局对应 `templates/single-page/*.html` 模板
- **动画系统**：27 种 CSS 动画 + 20 种 Canvas 特效，通过 `data-anim` 属性声明
- **导航机制**：`runtime.js`（~960行）管理幻灯片状态，`.is-active` 类切换，URL `#/N` 深链接，键盘事件
- **Presenter 模式**：`window.open()` 弹窗 + iframe 预览（`?preview=N`），`BroadcastChannel` 双向同步
- **PNG 导出**：`render.sh` 使用 `Google Chrome --headless=new --screenshot`，通过 `--virtual-time-budget=4000` 控制等待（不精确）
- **模板生成**：15 个完整 deck 模板，标准骨架为 `cover → toc → section-divider → [body] → ... → cta → thanks`

**优势**：
- 完全可交互的演示体验（键盘导航、overview 网格、presenter 模式）
- 主题切换即时生效，CSS Variables 架构优雅
- 布局种类丰富，覆盖学术/商业/技术各种场景
- 无需网络连接，纯本地运行

**不足**：
- PNG 导出使用粗糙的 headless Chrome 截图，字体加载和动画等待不精确
- 不能直接生成 .pptx 文件
- 没有 AI 图片生成能力，图表/插图需要手动提供

---

### 2. baoyu-skills（幻灯片 + 信息图 + 架构图 + 图片生成）

**定位**：AI 驱动的视觉内容生成工具集，包含四个核心 skill。

#### 2.1 baoyu-slide-deck（AI 幻灯片）

**核心机制**：将内容转化为 AI 生成的幻灯片图片（每张幻灯片是一张 AI 生成的图片）。

- **风格系统**：17 个预设风格（blueprint、chalkboard、corporate、minimal、sketch-notes 等）
- **4 维自定义**：Texture（clean/grid/organic/pixel/paper）× Mood（professional/warm/cool/vibrant/dark/neutral）× Typography（geometric/humanist/handwritten/editorial/technical）× Density（minimal/balanced/dense）
- **工作流**：9 步流程（Setup → Confirmation → Outline → Review → Prompts → Review → Images → Merge → Summary）
- **导出**：`merge-to-pptx.ts` 和 `merge-to-pdf.ts` 将 AI 图片合并为 PPTX/PDF
- **幻灯片计数**：基于源文档长度自动推算（<1000字 → 5-10张，1000-3000 → 10-18张，等等）

#### 2.2 baoyu-infographic（AI 信息图）

**核心机制**：21 种布局类型 × 22 种视觉风格，自由组合生成信息图。

- **布局类型**：linear-progression、binary-comparison、bento-grid、iceberg、funnel、dashboard、periodic-table、dense-modules 等
- **视觉风格**：craft-handmade、claymation、kawaii、cyberpunk-neon、pixel-art、origami、ikea-manual、morandi-journal 等
- **工作流**：7 步（Setup → Structured Content → Recommend → Confirm → Prompt → Generate → Summary）
- **关键词快捷**：如"高密度信息大图"自动匹配 `dense-modules` 布局

#### 2.3 baoyu-diagram（SVG 架构图）

**核心机制**：直接生成 SVG 代码，纯代码绘图（非 AI 图片生成）。

- **图类型**：9 种——Architecture、Flowchart、Sequence、Structural、Mind Map、Timeline、Illustrative、State Machine、Data Flow
- **设计系统**：Dark 主题，8 种语义色彩（Primary/Secondary/Tertiary/Accent/Alert/Connector/Neutral/Highlight）
- **SVG 分层**：严格的 z-order 规则——背景 → 区域边界 → 连接箭头 → 遮罩矩形 → 组件框 → 文本 → 图例 → 标题
- **组件模式**：标准盒子、菱形决策、数据库圆柱、区域边界、安全组等
- **输出**：`.svg` + `@2x PNG`（通过 `scripts/main.ts`）

#### 2.4 baoyu-imagine（AI 图片生成引擎）

**核心机制**：统一的多 Provider 图片生成后端。

- **支持的 Provider**：OpenAI GPT Image 2、Azure OpenAI、Google、OpenRouter、DashScope（通义万象）、Z.AI（智谱）、MiniMax、Jimeng（即梦）、Seedream（豆包）、Replicate
- **功能**：text-to-image、参考图（reference image）、宽高比、批量生成
- **质量预设**：normal（1K）和 2k（默认）
- **批量模式**：`--batchfile` + `--jobs` 并行生成
- **Provider 选择策略**：有 `--ref` 时优先 Google → OpenAI → Azure；无 ref 时 Google → OpenAI → Azure → OpenRouter → DashScope → Z.AI → MiniMax → Replicate → Jimeng → Seedream

**baoyu-chrome-cdp 包**：共享的 Chrome DevTools Protocol 工具库，用于需要浏览器的 skill。

**整体优势**：
- AI 图片生成质量高，风格多样
- 多 Provider 支持，灵活切换
- prompt 文件机制保证可复现性
- SVG 架构图质量专业

**整体不足**：
- AI 生成的幻灯片是图片，不可编辑文本/图表
- 无交互式演示能力
- 生成速度慢（每张 10-30s）
- 无法精确控制文字排版和数据图表

---

### 3. academic-pptx-skill

**定位**：学术演示文稿的内容策略和结构规范，与 Anthropic 内置 PPTX skill 配合使用。

**核心机制**：纯指导性规范（无代码渲染引擎），指导 Claude 生成学术风格的 .pptx 文件。

- **技术实现**：依赖 `pptxgenjs`（Node.js PPTX 生成库），通过 JavaScript API 直接构建 .pptx
- **设计哲学**：Communication-first（沟通优先），非 Design-forward（设计优先）
- **核心原则**：
  - **Action Titles**：每页标题必须是完整句子，陈述 takeaway，而非主题标签
  - **Ghost Deck Test**：只读标题序列就能讲述完整论点
  - **一页一观点**：每个 Results 页只放一个图表/数据展示
  - **40 词上限**：每页正文不超过约 40 个词
  - **引用规范**：每个借用的图表/数据必须在页面内引用
  - **以结论结束**：最后一页是 Conclusions（不是"Thank You"），Q&A 期间保持显示

- **Deck 架构**：Title → Motivation → Research Question → Methods → Results → Discussion → Conclusions → References → Appendix
- **设计标准**：
  - 白色背景，单一无衬线字体（Arial/Calibri/Helvetica）
  - 最多 3 种颜色：primary(`1F4E79`)、accent(`2E75B6`)、白色背景
  - 字号规范：标题 24-28pt、正文 20pt、图表标注 16-18pt、引用 12-14pt
  - 16:9 宽屏默认

- **Slide Patterns**：11 种标准页面模式（Title、Motivation、Research Question、Methods、Results、Discussion、Conclusions、Section Divider、Breadcrumb Bar、References、Appendix），每种都有完整的 pptxgenjs 代码示例

- **QA 检查清单**：10 项学术特定检查（action title、ghost deck test、单图表、引用、References 页等）

**优势**：
- 学术演示的最佳实践规范，方法论严谨
- 直接生成原生 .pptx 文件（通过 pptxgenjs），文本和图表可编辑
- 内置 QA 流程保证质量
- 有完整的 pptxgenjs 代码模式，可直接复用

**不足**：
- 仅限学术场景，风格单一（白底、无装饰）
- 无 AI 图片/插图生成能力
- 无交互演示能力
- 依赖 Anthropic 内置 PPTX skill 的代码执行环境

---

### 4. 对比总结

| 维度 | html-ppt-skill | baoyu-skills | academic-pptx-skill |
|------|---------------|-------------|-------------------|
| **输出格式** | HTML 网页 | AI 图片 + SVG + PPTX/PDF | 原生 .pptx |
| **渲染方式** | 浏览器渲染 | AI API 生成 + SVG 代码 | pptxgenjs 代码生成 |
| **可编辑性** | 源码可编辑 | 图片不可编辑/SVG 可编辑 | .pptx 完全可编辑 |
| **交互性** | 完整交互（键盘、presenter） | 无 | 无（PowerPoint 内播放） |
| **视觉质量** | 依赖 CSS/截图质量 | AI 图片质量高 | 标准 PPTX 质量 |
| **风格多样性** | 36 主题 + 31 布局 | 17 风格 + 21 信息图布局 + 22 视觉风格 | 单一学术风格 |
| **架构图** | 无（需手动） | SVG 架构图 9 种类型 | 无 |
| **插图/信息图** | 无 | AI 生成 | 无 |
| **文字排版控制** | CSS 精确控制 | AI 不可控 | pptxgenjs 精确控制 |
| **数据图表** | 需手动写 HTML | AI 近似绘制 | pptxgenjs chart API |
| **导出 PNG** | headless Chrome 截图（粗糙） | AI 原生输出 | LibreOffice + pdftoppm |
| **导出 PPTX** | 无（需额外工具） | merge-to-pptx（图片拼合） | 原生 pptxgenjs |
| **生成速度** | 即时 | 慢（AI API 10-30s/张） | 快（代码生成） |
| **适用场景** | 技术分享、在线演示 | 视觉型内容、社交媒体、宣传 | 学术会议、论文答辩 |

---

## 二、整合方案

### 2.1 目标

构建一个统一的演示制作系统，能够：
1. **制作完整 PPT**：可交互网页版 + 可编辑 .pptx 文件
2. **AI 插图**：为幻灯片自动生成高质量插图、信息图
3. **架构图**：专业的 SVG 架构图/流程图/序列图
4. **高质量渲染**：用 CDP/Playwright 替代粗糙的 headless Chrome 截图

### 2.2 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    unified-presentation-skill                │
│                                                             │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  内容分析层    │  │  结构规划层   │  │  风格决策层       │  │
│  │               │  │              │  │                  │  │
│  │ - 文档解析     │→ │ - Deck 架构  │→ │ - 主题选择       │  │
│  │ - 语言检测     │  │ - 页面分配   │  │ - 布局匹配       │  │
│  │ - 信号提取     │  │ - 内容分割   │  │ - 视觉风格       │  │
│  │ - 受众判断     │  │ - Ghost Test │  │ - 颜色方案       │  │
│  └───────────────┘  └──────────────┘  └──────────────────┘  │
│           │                │                   │            │
│           ▼                ▼                   ▼            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    渲染引擎层                           ││
│  │                                                         ││
│  │  ┌─────────────┐ ┌──────────────┐ ┌──────────────────┐ ││
│  │  │ HTML 渲染    │ │ SVG 架构图   │ │ AI 图片生成      │ ││
│  │  │ (html-ppt)  │ │ (baoyu-     │ │ (baoyu-imagine) │ ││
│  │  │             │ │  diagram)   │ │                  │ ││
│  │  │ - 36 主题   │ │ - 9 种图类型 │ │ - 10 个 Provider │ ││
│  │  │ - 31 布局   │ │ - 设计系统   │ │ - 参考图支持     │ ││
│  │  │ - CSS Vars  │ │ - SVG 分层   │ │ - 批量生成       │ ││
│  │  └─────────────┘ └──────────────┘ └──────────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
│           │                │                   │            │
│           ▼                ▼                   ▼            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    导出引擎层                           ││
│  │                                                         ││
│  │  ┌──────────────────┐ ┌──────────────┐ ┌────────────┐  ││
│  │  │ CDP/Playwright   │ │ pptxgenjs    │ │ PDF 引擎   │  ││
│  │  │ 高精度渲染       │ │ 原生 PPTX    │ │            │  ││
│  │  │                  │ │              │ │            │  ││
│  │  │ - 字体等待       │ │ - 可编辑文本  │ │ - Puppeteer│  ││
│  │  │ - 动画完成检测   │ │ - 原生图表   │ │ - merge-pdf│  ││
│  │  │ - @2x Retina    │ │ - Action Title│ │            │  ││
│  │  │ - 逐页精确截图   │ │ - Slide Pattern│ │          │  ││
│  │  └──────────────────┘ └──────────────┘ └────────────┘  ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 2.3 整合模块详细设计

#### 模块 1：内容分析与结构规划（来源：academic-pptx + baoyu-slide-deck）

**整合要点**：
- 采用 academic-pptx 的结构化论证框架（SCR/Funnel），但扩展到非学术场景
- 采用 baoyu-slide-deck 的幻灯片计数启发式（基于文档长度）
- 保留 baoyu-slide-deck 的信号自动检测（根据内容关键词匹配风格）
- 引入 academic-pptx 的 Ghost Deck Test 作为大纲质量检查

```
输入文档 → 内容分析 → 场景判断 → 结构规划 → 大纲生成
                          │
                    ┌─────┴─────┐
                    │           │
              学术场景      商业/技术场景
              │           │
              academic     html-ppt / baoyu
              架构规范      自动信号匹配
```

#### 模块 2：渲染引擎选择器

根据每页幻灯片的内容类型，自动选择最优渲染方式：

| 页面内容 | 推荐引擎 | 理由 |
|---------|---------|------|
| 文字 + 排版 | HTML（html-ppt） | CSS 精确控制文字排版 |
| 数据图表 | HTML（html-ppt）或 pptxgenjs | 可交互/可编辑图表 |
| 架构图/流程图 | SVG（baoyu-diagram） | 专业矢量图，可缩放 |
| 插图/概念图 | AI（baoyu-imagine） | 高质量视觉效果 |
| 信息图/数据可视化 | AI（baoyu-infographic） | 复杂信息的艺术化呈现 |
| 代码展示 | HTML（html-ppt） | 语法高亮，精确字体 |
| 封面/分隔页 | HTML 或 AI | 视情况选择 |

**混合渲染策略**：单个 deck 内可混合使用多种引擎。例如：
- 封面页：AI 生成背景 + HTML 文字覆盖
- 内容页：HTML 排版
- 架构图页：嵌入 SVG
- 总结页：HTML 排版

#### 模块 3：高精度渲染（替换 render.sh）

用 Playwright/Puppeteer 替代当前的 `render.sh`：

```typescript
// render-precise.ts - 核心逻辑
import { chromium } from 'playwright';

async function renderSlides(htmlPath: string, outputDir: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2  // @2x Retina
  });

  await page.goto(`file://${htmlPath}`);

  // 等待字体加载完成
  await page.evaluate(() => document.fonts.ready);

  // 获取幻灯片总数
  const slideCount = await page.evaluate(
    () => document.querySelectorAll('.slide').length
  );

  for (let i = 0; i < slideCount; i++) {
    // 通过 hash 导航
    await page.evaluate((n) => {
      window.location.hash = `#/${n}`;
    }, i);

    // 等待过渡动画完成
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      return new Promise(resolve => {
        const active = document.querySelector('.slide.is-active');
        if (!active) return resolve(undefined);
        const anims = active.getAnimations();
        if (anims.length === 0) return resolve(undefined);
        Promise.all(anims.map(a => a.finished)).then(() => resolve(undefined));
      });
    });

    // 精确截图（仅活动幻灯片区域）
    const slideEl = await page.$('.slide.is-active');
    if (slideEl) {
      await slideEl.screenshot({
        path: `${outputDir}/${String(i + 1).padStart(2, '0')}-slide.png`,
        type: 'png'
      });
    }
  }

  await browser.close();
}
```

**对比原方案的改进**：
| 维度 | render.sh（原方案） | Playwright（新方案） |
|------|-------------------|---------------------|
| 字体加载 | `--virtual-time-budget`（猜测时间） | `document.fonts.ready`（精确等待） |
| 动画等待 | 固定等待时间 | `getAnimations().finished`（精确完成） |
| 分辨率 | 1x | @2x Retina（deviceScaleFactor: 2） |
| 截图范围 | 整个视口 | 仅活动幻灯片元素 |
| 错误处理 | 无 | 完整的错误捕获和重试 |

#### 模块 4：PPTX 导出管线

两条路径并行，用户选择：

**路径 A：图片拼合式（来源 baoyu-slide-deck）**
```
HTML 页面 → Playwright 截图 → 高质量 PNG → merge-to-pptx.ts → .pptx
                                    ↑
                              AI 生成的插图/架构图嵌入
```
- 优点：视觉保真度高，所见即所得
- 缺点：文本不可编辑

**路径 B：原生 PPTX 生成（来源 academic-pptx-skill）**
```
内容大纲 → pptxgenjs 代码生成 → 原生 .pptx
                ↑                    ↑
          Slide Patterns        AI 插图作为图片嵌入
          (academic-pptx)       SVG 架构图转 PNG 嵌入
```
- 优点：文本/图表完全可编辑，文件体积小
- 缺点：视觉效果受 pptxgenjs 能力限制

**路径 C：混合式（推荐）**
```
├── 文字内容页 → pptxgenjs 原生生成（可编辑）
├── 架构图页 → baoyu-diagram SVG → PNG → 嵌入 pptx
├── 插图页 → baoyu-imagine AI 生成 → 嵌入 pptx
└── 复杂排版页 → HTML 渲染 → Playwright 截图 → 嵌入 pptx
```

#### 模块 5：统一风格系统

整合三套风格体系：

```
统一风格配置
├── 场景预设
│   ├── academic（来源 academic-pptx）
│   │   └── 白底、单字体、3色、无装饰
│   ├── technical（来源 html-ppt blueprint + baoyu-diagram dark）
│   │   └── 暗色系、等宽字体、网格背景
│   ├── business（来源 html-ppt corporate/minimal）
│   │   └── 简洁专业、品牌色
│   └── creative（来源 baoyu-slide-deck sketch-notes/watercolor）
│       └── 手绘风、水彩、暖色
│
├── 维度自定义（来源 baoyu-slide-deck）
│   ├── Texture: clean | grid | organic | pixel | paper
│   ├── Mood: professional | warm | cool | vibrant | dark
│   ├── Typography: geometric | humanist | handwritten | editorial
│   └── Density: minimal | balanced | dense
│
└── CSS Variables 映射（来源 html-ppt）
    ├── --bg, --surface, --text-1/2/3
    ├── --accent, --grad
    └── --font-sans, --font-mono
```

### 2.4 整合实施路线图

#### Phase 1：基础整合（建议优先）

1. **Playwright 渲染器**：替换 html-ppt 的 `render.sh`
   - 新增 `render-precise.ts`
   - 精确字体等待 + 动画检测 + @2x
   - 估计工作量：1-2 天

2. **SVG 架构图嵌入**：html-ppt 页面中嵌入 baoyu-diagram 生成的 SVG
   - HTML 中直接 `<svg>` 内联或 `<img src="diagram.svg">`
   - 估计工作量：0.5 天

3. **AI 插图嵌入**：html-ppt 页面中使用 baoyu-imagine 生成的图片
   - 自动将 AI 图片放入幻灯片的指定区域
   - 估计工作量：0.5 天

#### Phase 2：PPTX 导出

4. **图片拼合导出**：Playwright 截图 → merge-to-pptx
   - 复用 baoyu-slide-deck 的 `merge-to-pptx.ts` 脚本
   - 估计工作量：1 天

5. **原生 PPTX 生成**：集成 pptxgenjs
   - 复用 academic-pptx 的 Slide Patterns 代码
   - 扩展到非学术风格
   - 估计工作量：3-5 天

#### Phase 3：智能化

6. **内容自动分析**：整合 academic-pptx 的结构规划 + baoyu-slide-deck 的信号检测
   - 自动判断场景、推荐风格、规划页数
   - 估计工作量：2-3 天

7. **渲染引擎自动选择**：根据每页内容类型自动选择最优引擎
   - 估计工作量：1-2 天

8. **统一 SKILL.md**：编写整合后的 skill 定义文件
   - 估计工作量：1 天

### 2.5 建议的目录结构

```
unified-presentation/
├── SKILL.md                          # 统一 skill 定义
├── EXTEND.md                         # 用户偏好配置
│
├── engines/                          # 渲染引擎
│   ├── html/                         # HTML 渲染（来源 html-ppt-skill）
│   │   ├── assets/
│   │   │   ├── base.css              # 设计系统
│   │   │   ├── runtime.js            # 交互引擎
│   │   │   └── themes/               # 36 个主题
│   │   └── templates/                # 31 种布局模板
│   │
│   ├── diagram/                      # SVG 架构图（来源 baoyu-diagram）
│   │   ├── references/               # 各图类型参考
│   │   └── scripts/main.ts           # SVG → PNG
│   │
│   ├── ai-image/                     # AI 图片生成（来源 baoyu-imagine）
│   │   ├── scripts/main.ts           # 图片生成主脚本
│   │   └── references/providers/     # 各 Provider 文档
│   │
│   └── pptxgen/                      # 原生 PPTX（来源 academic-pptx）
│       ├── slide-patterns.js         # 页面模式
│       └── content-guidelines.md     # 内容规范
│
├── export/                           # 导出工具
│   ├── render-precise.ts             # Playwright 高精度截图
│   ├── merge-to-pptx.ts             # 图片合并 PPTX
│   └── merge-to-pdf.ts              # 图片合并 PDF
│
├── analysis/                         # 内容分析
│   ├── analysis-framework.md         # 分析框架
│   ├── signal-detection.md           # 信号检测规则
│   └── slide-count-heuristic.md      # 页数推算
│
├── styles/                           # 统一风格系统
│   ├── designs/                       # 场景预设
│   │   ├── academic.md
│   │   ├── technical.md
│   │   ├── business.md
│   │   └── creative.md
│   └── dimensions/                   # 4 维自定义
│       ├── texture.md
│       ├── mood.md
│       ├── typography.md
│       └── density.md
│
└── references/                       # 参考文档
    ├── confirmation.md               # 确认流程模板
    ├── base-prompt.md                # AI 图片基础 prompt
    └── layouts.md                    # 布局索引
```

### 2.6 关键决策点

| 决策 | 选项 | 建议 |
|------|------|------|
| 截图引擎 | Puppeteer vs Playwright | **Playwright**（API 更现代、自动等待更好、多浏览器支持） |
| PPTX 生成 | 图片拼合 vs pptxgenjs | **混合式**（文字页用 pptxgenjs，复杂视觉页用截图） |
| AI 图片 Provider | 固定 vs 用户选择 | **用户选择**（复用 baoyu-imagine 的 EXTEND.md 机制） |
| 架构图方案 | SVG 代码 vs Mermaid vs AI | **SVG 代码**（精确可控、baoyu-diagram 已成熟） |
| 风格系统 | CSS Vars vs 配置文件 | **CSS Vars + 配置**（HTML 用 CSS Vars，AI/PPTX 用配置文件映射） |
| 运行时 | Node.js vs Bun | **Bun**（baoyu-skills 已选用，性能更好） |
