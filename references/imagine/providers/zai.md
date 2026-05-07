# Z.AI / Zhipu (智谱)

**API**: `open.bigmodel.cn/api/paas/v4` (HTTP, requires Zhipu API key)
**Models**: `cogview-3` (text-to-image), `cogview-3-plus` (enhanced quality variant)
**Strengths**: Strong Chinese language support, good Chinese text rendering within images, competitive semantic alignment between prompt and output
**Limitations**: Limited artistic style range (best at realistic and semi-realistic), slower than commercial APIs like DashScope and MiniMax, reference image support is limited

## Capabilities
- Text-to-image: yes
- Reference image: limited (cogview-3-plus supports basic image-guided generation)
- Aspect ratios: 1:1, 16:9, 9:16
- Resolution: up to 1024x1024

## Best For
- Decks with Chinese text that needs to appear rendered inside the image (labels, signs, UI mockups)
- Chinese educational/technical illustrations where text legibility matters
- When DashScope is unavailable or a second Chinese-focused option is needed

## Prompt Tips
- Write prompts in Chinese for best interpretation
- Explicitly describe any text that should appear in the image (e.g., "a UI button labeled '立即购买'")
- Keep prompts focused on a single main subject — CogView handles complex multi-object scenes less reliably

## Cost/Performance
- Speed: medium (typically 5-15s per generation)
- Cost: low (pay-per-call, ~0.1 RMB/image)
