# DashScope / Tongyi Wanxiang (通义万象)

**API**: `dashscope.aliyuncs.com` (HTTP, requires Alibaba Cloud API key)
**Models**: `wanx-v1` (text-to-image), `wanx-background-generation` (background gen)
**Strengths**: Good Chinese text and cultural context understanding, fast generation, stable API with low error rate
**Limitations**: Limited style variety compared to OpenAI/Midjourney, no reference image input, weaker photorealism

## Capabilities
- Text-to-image: yes
- Reference image: no (wanx-v1); yes (wanx-background-generation, for background replacement only)
- Aspect ratios: 1:1, 16:9, 9:16
- Resolution: up to 1024x1024 (1:1), 1280x720 (16:9), 720x1280 (9:16)

## Best For
- Decks with Chinese-language slide content where image semantics must align with Chinese concepts
- Illustration of Chinese-specific scenarios (e.g., Chinese e-commerce interfaces, cultural references)
- Background generation for slides (via wanx-background-generation)

## Prompt Tips
- Write prompts in Chinese for best keyword interpretation
- Include 2-3 descriptive sentences covering subject, style, and atmosphere
- Avoid abstract or metaphor-heavy prompts — be concrete about what should appear in the image

## Cost/Performance
- Speed: fast (typically 3-8s per generation)
- Cost: low (Alibaba Cloud pay-per-call, ~0.1 RMB/image)
