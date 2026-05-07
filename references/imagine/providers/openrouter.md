# OpenRouter (Multi-Model Gateway)

**API**: `openrouter.ai/api/v1` (OpenAI-compatible HTTP, requires OpenRouter API key)
**Models**: Varies by provider availability — includes OpenAI DALL-E 3, Google Imagen, Stable Diffusion via various backends
**Strengths**: Single API surface to access multiple image providers, easy switching between models without code changes, transparent pricing
**Limitations**: Adds an additional hop (latency overhead), image quality depends on the underlying provider, not all image models are available at all times

## Capabilities
- Text-to-image: yes (depends on selected model)
- Reference image: varies by model
- Aspect ratios: varies by selected model
- Resolution: varies by selected model

## Best For
- Decks that need to try multiple image styles across providers without managing multiple API keys
- Cost comparison and A/B testing across different image models
- When you need flexibility to switch to the best available model at generation time

## Prompt Tips
- Check current model availability and pricing at `openrouter.ai/models` before generating
- Use the model's native prompt language (e.g., English for DALL-E, Chinese for CogView)
- Route through OpenRouter when provider diversity matters more than absolute lowest latency

## Cost/Performance
- Speed: medium (adds ~1-3s routing overhead on top of underlying model speed)
- Cost: medium (pay-per-call + OpenRouter markup)
