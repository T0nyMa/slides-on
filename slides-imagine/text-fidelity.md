# Text Fidelity Policy

## Rule

NEVER paint over, cover, erase, or programmatically overlay bitmap text in a generated image.

## If text in the generated image is wrong or garbled

1. Regenerate from a CORRECTED prompt that addresses the specific text issue.
2. If the model consistently renders wrong text on a particular page, redraw that page with LESS on-image text or NO text.
3. Present imperfect candidates to the user and ask which to keep.

## Why

Programmatic post-processing (ImageMagick, Pillow, Canvas, SVG overlay, OCR repair) introduces visual artifacts, breaks style consistency, and corrupts the hand-drawn/artistic quality that the prompt assembly guarantees. The prompt assembler is the single source of truth — fix the prompt, not the pixels.
