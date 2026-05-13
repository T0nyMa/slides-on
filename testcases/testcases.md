# QA 测试用例

基于 `golden/` (正确的 AgentView deck)，每个变体引入一个特定问题。

| # | 用例 | 引入问题 | 预期检测 |
|---|------|---------|---------|
| 1 | golden | 无 | 0 BLOCKER |
| 2 | font-too-small | chr-heading 3cqi, body 1.2cqi | font-hierarchy BLOCKER (正文过小) |
| 3 | content-top-stacked | 移除 justify-content:center | whitespace WARN (底部留白) |
| 4 | chrome-clipped | chr-topbar min-width:200cqi | occlusion BLOCKER (chrome 溢出) |
| 5 | density-too-high | slide 3 增加 4 个额外组件 | density WARN (>6 组件) |
| 6 | low-contrast | 正文色改为 #e0e0e0 接近白底 | contrast BLOCKER (< 4.5:1) |
| 7 | uneven-spacing | 第一个 gap 设为 120px | whitespace INFO (间距不一致) |
| 8 | chrome-overlap | chr-topbar top 改为 20% | occlusion BLOCKER (chrome 遮挡标题) |
