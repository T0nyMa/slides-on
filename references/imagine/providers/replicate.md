# Replicate (Open-Source Model Hosting)

**API**: `replicate.com` (HTTP, requires Replicate API token)
**Models**: `black-forest-labs/flux-dev`, `black-forest-labs/flux-schnell`, `stability-ai/sdxl`, `stability-ai/stable-diffusion-3`, plus community fine-tunes (LoRA variants, style-specific models)
**Strengths**: Largest variety of open-source image models, community fine-tuned models for niche styles (anime, pixel art, watercolor, etc.), full control over generation parameters (steps, CFG, seed)
**Limitations**: Cold starts on infrequently used models (5-30s boot time), quality varies significantly across community models, requires knowing which model suits your style

## Capabilities
- Text-to-image: yes
- Reference image: yes (Img2Img, ControlNet, IP-Adapter — model-dependent)
- Aspect ratios: model-dependent, most support 1:1, 16:9, 4:3, 3:4, custom
- Resolution: model-dependent (Flux up to 1440x1440, SDXL 1024x1024)

## Best For
- Decks needing a specific artistic style (watercolor, pixel art, sketch, cyberpunk)
- When you need ControlNet or Img2Img for precise composition control
- Open-source SLAs — no vendor lock-in, models are self-hostable

## Prompt Tips
- For Flux models: use natural language descriptions, it handles long prompts well
- For SDXL: use comma-separated tag style, include quality tags like "masterpiece, best quality"
- Always set a fixed seed for reproducible results across iterations
- Check model's "README" page on Replicate for recommended parameter ranges

## Cost/Performance
- Speed: slow to medium (cold start 10-30s, warm 2-10s)
- Cost: low to medium (pay-per-second of GPU usage, typically ~$0.001-0.01/image)
