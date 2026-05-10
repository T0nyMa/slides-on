# Text Fidelity — 三级文字兜底策略

当 AI 图片模型生成中文文字时出现乱码、错字、模糊或完全失败时的三级递进式兜底方案。

## 问题背景

AI 图片生成模型（Stable Diffusion、Flux、Midjourney 等）在渲染非英文字符（尤其是中文 CJK 字符）时容易出现以下问题：
- **乱码**：字符变形为无意义的符号或笔画堆叠
- **错字**：相似字混淆（如 "已" → "己"、"未" → "末"）
- **模糊**：笔画粘连、分辨率不足导致的文字不可读
- **遗漏**：prompt 中指定的文字完全未出现在生成图片中

影响范围：封面标题、卡片标签、信息图标注、数据图表说明文字等所有需要 AI 渲染中文的场景。

---

## Level 1: Reduce Text Budget（减少文字预算）

### 策略

当 AI 图片渲染的中文文字出现错误时，第一优先级不是修复 prompt，而是**减少需要渲染的文字量**，将 Required Text Only 从完整句子缩减到 3-5 个核心标签。

### 操作

1. **识别核心标签**：从原始文字中提取最关键的 3-5 个关键词/短标签
2. **删除修饰性文字**：去掉副词、连接词、完整句子结构，保留名词/动词核心
3. **标签化重组**：将完整句子改为标签形式（如 "推荐系统的三大核心挑战" → "3大挑战"）
4. **重新生成**：使用精简后的标签列表重新生成图片

### 示例

**Before（完整句子，容易失败）**：
```
封面文字：
- 主标题：电商推荐系统端云协同推理计算优化研究
- 副标题：博士阶段性汇报
- 标签：异构设备算力定义 × 端云协同架构 × 模型通用优化
```

**After Level 1（精简标签）**：
```
封面文字：
- 主标题：端云协同 推理优化
- 标签：算力定义 · 协同架构 · 模型优化
```

### 判断标准

Level 1 适用当：
- 图片中仅部分文字出错（非全部失败）
- 出错文字集中在长句或复杂词组
- 图片其他视觉元素（构图、色彩、纹理）质量良好

Level 1 不适用（直接进入 Level 2）当：
- 所有中文文字全部失败/乱码
- 连续 3 次生成均出现文字错误
- 模型对 CJK 字符支持已知有限

---

## Level 2: `--text-safe` Flag（无文字模式）

### 策略

在 AI 图片生成 prompt 中添加 `--text-safe` flag 的对应语义指令，明确告诉图片模型**不要尝试渲染任何文字**，而是留下干净的空白标签区域，供后续后处理叠加真实文字。

### Prompt 添加内容

在 structured prompt 的 Layer 2（Style Definition）或 Layer 3（Content Layout）中追加以下语义：

```
CRITICAL: Do NOT render any text, characters, letters, or glyphs in the image.
Leave clean blank label spaces, empty pastel marker boxes, or hollow callout areas
where text would naturally appear. These blank areas should:
- Have clear boundaries (subtle border or color block)
- Be placed logically in the composition flow
- Show faint placeholder indicators (light dotted outlines, subtle color patches)
- NOT contain any pseudo-text, placeholder Latin (Lorem ipsum), or scribble marks
```

### 操作

1. **关闭文字渲染**：在 prompt 中明确指示模型不生成文字
2. **保留布局空间**：确保空白区域的位置、大小与最终文字的预期一致
3. **视觉指示**：空白区域可通过浅色块、虚线框、色块分割等方式标记
4. **生成 base image**：产出无文字的高质量基础图

### 示例

**Before Level 2（模型尝试渲染中文但失败）**：
```
图片中有 4 个彩色标签，分别显示 "效率提升" "成本降低" "体验优化" "规模扩展"
→ 生成结果：标签上是乱码符号
```

**After Level 2（无文字模式）**：
```
图片中有 4 个彩色标签区域，每个为浅色圆角矩形，带虚线边框，
内部空白，供后续叠加真实文字
→ 生成结果：4 个干净的空白标签框
```

### 判断标准

Level 2 适用当：
- Level 1 仍然出现文字错误
- 需要保留 AI 图片的整体构图和视觉风格
- 最终产品对中文文字精度要求高（如学术汇报、商业演示）

---

## Level 3: Deterministic Post-Processing（确定性后处理叠加）

### 策略

这是"核选项"——当图片模型持续无法正确渲染中文时，使用 sharp（Node.js 图片处理库）将精确的中文文字以编程方式叠加到 AI 生成的基础图片上。

### 技术方案

使用 sharp 的 `composite` API 或 SVG overlay 方式，将文字 SVG 图层叠加到 PNG 基础图上。

#### 方案 A：SVG Overlay（推荐，文字清晰度最高）

```bash
# 1. 生成无文字的基础图（Level 2 模式）
# base-image.png: AI 生成的底图，空白标签区域就绪

# 2. 创建 SVG 文字叠加层
# text-overlay.svg: 包含精确位置的中文文字 SVG

# 3. 使用 scripts/svg-to-png.ts 将 SVG 转为 PNG
bun scripts/svg-to-png.ts text-overlay.svg --output text-overlay.png

# 4. 使用 sharp composite 合并两张图
# 伪代码表示逻辑：
# sharp(base-image.png)
#   .composite([{ input: text-overlay.png, top: 0, left: 0 }])
#   .toFile('final-image.png')
```

#### 方案 B：Sharp 直接渲染文字（适合简单场景）

由于 sharp 本身不直接支持文字渲染，通过 SVG 包装实现：

```typescript
// 构建 SVG 文字图层
const svgText = `
<svg width="1080" height="1440" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: "PingFang SC", "Noto Sans SC", sans-serif; }
  </style>
  <text x="540" y="200" text-anchor="middle" font-size="48" font-weight="bold" fill="#333">
    端云协同推理优化
  </text>
  <text x="540" y="280" text-anchor="middle" font-size="28" fill="#666">
    博士阶段性汇报
  </text>
</svg>`;

// sharp 将 SVG 转为 PNG 并叠加
await sharp(Buffer.from(svgText))
  .png()
  .toFile('text-layer.png');

await sharp('base-image.png')
  .composite([{ input: 'text-layer.png', blend: 'over' }])
  .toFile('final-image.png');
```

### 实际 CLI 用法（建议封装为 `scripts/overlay-text.ts`）

```bash
# 完整流程
# Step 1: 生成无文字底图
bun scripts/imagine/main.ts \
  --prompt-file prompts/slide-1-prompt.md \
  --text-safe \
  --output images/slide-1-base.png

# Step 2: 生成文字叠加层 SVG
# （手动或程序化创建 text-overlay.svg）

# Step 3: SVG → PNG
bun scripts/svg-to-png.ts images/slide-1-text.svg --output images/slide-1-text.png

# Step 4: 合并（需要实现 composite 逻辑）
# bun scripts/overlay-text.ts images/slide-1-base.png images/slide-1-text.png --output images/slide-1-final.png
```

### 文字定位参考

在 Level 2 无文字模式下，base image 应包含清晰的视觉锚点用于后续文字定位：

| 锚点类型 | 视觉标记 | 文字定位方式 |
|---------|---------|------------|
| 标题区域 | 顶部居中 20-30% 区域的虚线边框 | SVG text 居中对齐到该区域 |
| 标签卡片 | 色块卡片，尺寸明确 | SVG text 居中到卡片中心坐标 |
| 标注箭头 | 箭头指向目标，旁有空白矩形 | SVG text 左对齐到矩形起始位置 |
| 图例说明 | 底部横排色块标记 | SVG text 对齐到各色块上方 |
| 数据标签 | 柱状图/饼图旁空白位置 | 按坐标绝对值定位 |

### 判断标准

Level 3 适用当：
- Level 1 和 Level 2 均无法满足中文文字精度要求
- 文字内容多且精确度要求高（如学术图表、数据报告）
- 有确定性文字排版需求（特定字体、字号、颜色、对齐方式）
- 需要批量处理多个 slide 的图片文字叠加

---

## 三级兜底决策树

```
AI 图片中的中文文字出现问题
    │
    ├── 部分文字出错？
    │   ├── YES → Level 1: Reduce Text Budget
    │   │         └── 精简到 3-5 核心标签，重新生成
    │   │              ├── 成功 → DONE
    │   │              └── 仍失败 →
    │   │
    │   └── NO（全部失败 / 连续 3 次失败）→
    │
    ├── Level 2: --text-safe
    │   └── 关闭文字渲染，生成空白标签区的 clean base image
    │        ├── 仅需少量文字且可接受无文字底图 → DONE（文字由 HTML/CSS 层渲染）
    │        └── 需要精确中文文字在图片中 →
    │
    └── Level 3: Deterministic Post-Processing
        └── SVG 文字叠加到 base image
             └── 100% 精确的中文文字，任何字体/字号/颜色
```

---

## 与 HTML 渲染层的协同

slides-on 的混合渲染架构中，文字可以放在两个层级：

| 层级 | 方式 | 中文精度 | 适用场景 |
|------|------|:-------:|---------|
| **HTML 文字层** | CSS text（浏览器原生渲染） | 100% 精确 | 所有文字排版内容 |
| **AI 图片层** | 图片中嵌入的文字 | 不可靠 | 装饰性标题、风格化标签 |

**最佳实践**：能放 HTML 层的文字优先放 HTML 层。仅在需要"文字与视觉元素深度融合"（如文字是插图的一部分、文字带特殊纹理效果）时才将文字放入 AI 图片层。

对于 3:4 社交媒体卡片场景，推荐：
- **封面标题** → AI 图片层（Level 1/2/3 兜底），因为封面图标题是视觉设计的一部分
- **卡片标注/标签** → HTML 层（components.css），确定性渲染
- **数据标注** → HTML 层或 SVG 层
- **手写风格文字** → AI 图片层（风格化需求，Level 3 难以还原手写质感）

---

## EXTEND.md 配置

用户可在 EXTEND.md 中设置默认文字策略：

```yaml
text_fidelity:
  default_level: 2          # 默认使用 Level 2 --text-safe
  cjk_fallback: level-3     # 中文兜底策略
  font_stack:                # Level 3 使用的字体栈
    - "PingFang SC"
    - "Noto Sans SC" 
    - "Microsoft YaHei"
  text_safe_prompt_append: | # Level 2 自定义 prompt 追加内容
    Leave blank rounded rectangle areas for text labels.
    No characters or glyphs in the image.
```
