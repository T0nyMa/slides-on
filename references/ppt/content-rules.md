# Content Rules

Rules governing slide content for clarity, readability, and argument flow. These apply to all pipeline output, with stricter enforcement for academic presentations.

## Action Title Rule

**Every slide title must be a complete sentence stating the takeaway of that slide.** Not a topic label.

| Wrong (Topic Label) | Right (Action Title) |
|--------------------|---------------------|
| "System Architecture" | "The system uses a three-tier architecture with KV-cache sharing" |
| "Experimental Results" | "Our method achieves 18% throughput improvement at equal AUC" |
| "Related Work" | "Existing methods trade off latency for accuracy in three ways" |
| "Future Work" | "Hierarchical cascade inference is the most promising next direction" |

Action titles serve the Ghost Deck Test: reading only the titles should tell the complete argument.

## Word Limits

| Content Element | Limit | Rationale |
|----------------|:-----:|----------|
| Body text per slide | ~40 words | Audiences can't read and listen simultaneously |
| Title | 1 sentence, < 15 words | Instant comprehension |
| Bullet points | 3-5 per slide | Working memory limit |
| Bullet text per point | 12 words max | Scannable at a glance |
| Code lines | 20 lines max | Readable on projection |
| Table rows | 6 rows max | Scannable |
| Footer / citation | 1 line | Non-essential detail |

## One Idea Per Slide

Each slide conveys exactly one idea. If a slide contains two distinct concepts, split it into two slides.

**Test**: Can you summarize this slide in one sentence? If the summary requires "and also," split.

**Exception**: Comparison slides (two-column, pros-cons) compare two sides of one idea -- this is acceptable because the "one idea" is the comparison itself.

## Bullet Points

### Count
- 3-5 bullets per slide
- 6+ bullets: split across two slides, or group into categories with sub-headers
- 1-2 bullets: likely too sparse; consider a `big-quote` or `stat-highlight` layout instead

### Structure
- **Lead with the conclusion**: Start each bullet with the insight, then add supporting detail
- **Parallel structure**: All bullets in a list should have the same grammatical form
- **No full paragraphs**: If a bullet exceeds two lines at `--body-size: 20px`, it's too long

### Formatting Convention

```html
<li><strong>Key Insight</strong> — brief supporting detail or metric</li>
```

The `<strong>` element highlights the takeaway phrase, separated from the detail by an em-dash.

## Code Snippets

- Maximum 20 lines
- Use syntax highlighting when available (theme-dependent)
- Show only the relevant section; use `// ...` for omitted code
- Prefer `code` layout for production code, `terminal` layout for commands + output
- Never show boilerplate (package.json, imports, config) unless it's the focus

## Charts and Data Slides

### One Main Insight Rule
A data slide should communicate one main insight. Multiple charts on one slide are acceptable only if they support the same conclusion.

**Test**: Cover the title. Does the chart alone make the point obvious? If not, simplify or add annotation.

### Metric Presentation
- Round numbers to significant digits (3.2x, not 3.2158x)
- Always show direction (+18%, not "change of 18%")
- Label axes and units
- Highlight the key data point (via color or callout)

## Slide Types: Content Guidelines

| Layout | Content Guideline |
|--------|------------------|
| `cover` | Title (action sentence), subtitle (context), author, date, event |
| `toc` | 3-7 sections, each as a short phrase (not full sentences -- this is the exception) |
| `section-divider` | Section number + short section name (< 10 chars) |
| `bullets` | Title + 3-5 bullets with `<strong>` lead-ins |
| `big-quote` | One impactful sentence (12-20 words), optional attribution |
| `two-column` | Two parallel ideas, each with a sub-header + 2-3 bullets |
| `three-column` | Three parallel items, each with icon/heading + 1-2 line description |
| `comparison` | Left/right with clear labels; 3-5 comparison points |
| `pros-cons` | Pros and cons columns; 3-5 items each side |
| `code` | Code block with syntax highlighting; optional line annotations |
| `terminal` | Simulated terminal with prompt, command, and output |
| `cta` | One clear call-to-action sentence; optional link or QR code |
| `thanks` | Thank-you message; author contact info; optional link |

## Stricter Rules for Academic Presentations

When academic-pptx conventions are active (detected academic context or user specifies):

1. **Title is mandatory**: Every slide has a title; no "titleless" slides.
2. **Conclusions, not Thank You**: End with a "Conclusions" slide (3-4 key findings), not "Thank You" alone. Optionally combine with a small "Thank You" + Q&A invitation.
3. **No decorative content**: Every element on screen must serve the argument. Remove purely decorative elements.
4. **Data provenance**: Cite data sources on the slide (small footer text).
5. **Ghost Deck Test**: Mandatory before proceeding to Step 2.

## Common Violations to Avoid

| Violation | Fix |
|----------|-----|
| Title is a topic, not a takeaway | Rewrite as a complete sentence with the conclusion |
| 8+ bullet points on one slide | Split into two slides or use a table |
| Bullet text is full paragraphs | Reduce to key phrase + 5-8 word detail |
| Two unrelated ideas on one slide | Split into separate slides |
| Code > 20 lines | Show only the relevant section; use `// ...` |
| Chart without clear conclusion in title | Add the conclusion: "X metric improved 18% after optimization" |
| Too many numbers on one slide | Focus on 1-2 key metrics; move detail to speaker notes |
