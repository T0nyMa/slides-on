/**
 * prompt-assembler.ts — 6-role, 3-layer structured prompt assembly engine
 *
 * Implements the prompt-construction.md assembly logic in code:
 *   Layer 1: Image Specs & Universal Constraints (role-dependent)
 *   Layer 2: Style Lock (from style-definitions/{design}.md) + Palette override
 *   Layer 3: Composition + Content (archetype / layout-guideline / type-composition)
 *
 * Usage:
 *   const result = assemblePrompt({
 *     design: "sketch-notes",
 *     role: "illustration",
 *     aspect: "3:4",
 *     content: "推荐系统三阶段",
 *   });
 */

import * as fs from "fs";
import * as path from "path";

// ─── Types ─────────────────────────────────────────────────────────────

export type PromptRole =
  | "illustration"
  | "content-page"
  | "infographic"
  | "cover"
  | "image-card"
  | "comic-page";

export interface AssemblyParams {
  // Shared
  design: string;
  role: PromptRole;
  aspect: string;
  content?: string;
  quality?: "normal" | "2k";
  palette?: string;
  preset?: string;
  ref?: string;

  // illustration / content-page
  archetype?: string;
  title?: string;
  subtitle?: string;
  labels?: string[];
  textSafe?: boolean;

  // infographic
  layout?: string;
  infographicStyle?: string;
  language?: string;
  textLabels?: string[];

  // cover
  coverType?: string;
  mood?: string;
  font?: string;
  textLevel?: string;
  rendering?: string;

  // image-card
  cardStyle?: string;
  cardLayout?: string;
  position?: string;

  // comic-page
  artStyle?: string;
  tone?: string;
  comicLayout?: string;
  characters?: string;
  panelBreakdown?: string;
}

export interface AssembledPrompt {
  fullPrompt: string;
  negativePrompt: string;
  metadata: {
    design: string;
    archetype: string;
    role: string;
    aspect: string;
  };
}

interface StyleDefinition {
  styleLock: string;
  colorPalette: string;
  typography: string;
  visualElements: string;
  composition: string;
  negativeConstraints: string;
  roleFragment: string;
}

interface ArchetypeTemplate {
  name: string;
  whenToUse: string;
  structure: string;
  illustrationAdaptation: string;
}

interface PaletteDefinition {
  background: string;
  colors: Record<string, string>;
  semanticConstraint: string;
}

// ─── Path Resolution ───────────────────────────────────────────────────

const REPO_ROOT = path.resolve(import.meta.dir, "../..");
const STYLE_DEFS_DIR = path.join(REPO_ROOT, "slides-imagine/style-definitions");
const ARCHETYPES_FILE = path.join(REPO_ROOT, "slides-imagine/archetypes.md");
const PALETTES_DIR = path.join(REPO_ROOT, "slides-imagine/palettes");
const PRESETS_FILE = path.join(REPO_ROOT, "slides-imagine/presets.json");
const COMIC_ART_DIR = path.join(REPO_ROOT, "slides-comic/art-styles");
const COMIC_TONE_DIR = path.join(REPO_ROOT, "slides-comic/tones");

// ─── Layer 1: Role Templates ───────────────────────────────────────────

function layer1Illustration(aspect: string, quality: string): string {
  return [
    `${quality}, detailed, professional, clean composition.`,
    ``,
    `Visual role: illustration / background image for a presentation slide.`,
    `NO text, NO labels, NO numbers, NO words, NO letters, NO watermarks in the image.`,
    `Text will be overlaid by the slide rendering engine — leave clean empty zones for text.`,
    `Main subject positioned slightly off-center, leave 35–45% of one side as text-safe empty space.`,
    `Suitable for presentation slide background — visually engaging but not too busy.`,
    `Aspect ratio: ${aspect}.`,
  ].join("\n");
}

function layer1ContentPage(aspect: string, quality: string, params: AssemblyParams): string {
  const lines = [
    `Use case: productivity-visual.`,
    `Asset type: one complete styled content page image, final raster page.`,
    `Aspect ratio: ${aspect}.`,
    `${quality}, detailed, professional, clean composition.`,
    ``,
    `Visual role: complete content page — standalone deliverable image.`,
    `ALL visible Chinese text MUST be styled according to the visual style rules below.`,
  ];
  if (params.textSafe) {
    lines.push(
      ``,
      `TEXT SAFE MODE: Leave clean blank label spaces for all Chinese text items.`,
      `Use empty pastel marker boxes or clean paper areas where text will be placed.`,
      `Do NOT render any Chinese characters — only blank reserved spaces.`
    );
  }
  return lines.join("\n");
}

function layer1Infographic(aspect: string, quality: string, params: AssemblyParams): string {
  return [
    `Create a professional infographic.`,
    `Type: infographic — structured information visualization with clear hierarchy.`,
    `Aspect ratio: ${aspect}.`,
    `${quality}, detailed, professional.`,
    `Language: ${params.language || "Chinese"}.`,
    ``,
    `Requirements:`,
    `- Clear visual hierarchy with distinct sections`,
    `- Data points must be EXACT and VERBATIM — no rounding or paraphrasing`,
    `- Labels and callouts must be readable`,
    `- Professional, publication-ready quality`,
  ].join("\n");
}

function layer1Cover(aspect: string, quality: string, params: AssemblyParams): string {
  const coverType = params.coverType || "hero";
  const mood = params.mood || "balanced";
  return [
    `Create a cover image for an article or presentation deck.`,
    `Cover type: ${coverType}.`,
    `Mood: ${mood}.`,
    `Aspect ratio: ${aspect}.`,
    `${quality}, detailed, professional.`,
    `Font style: ${params.font || "clean"}.`,
    `Text level: ${params.textLevel || "title-only"}.`,
    ``,
    `The cover should be visually striking — it's the first thing the viewer sees.`,
    `Composition should leave room for a title overlay if text-level is not "none".`,
  ].join("\n");
}

function layer1ImageCard(aspect: string, quality: string, params: AssemblyParams): string {
  return [
    `Create a social media card image.`,
    `Type: image-card — pure image, suitable for social sharing.`,
    `Aspect ratio: ${aspect}.`,
    `${quality}, detailed, visually appealing.`,
    `Card style: ${params.cardStyle || "minimal"}.`,
    `Layout: ${params.cardLayout || "balanced"}.`,
    ``,
    `Image should be self-contained — the visual tells the story without external context.`,
    `Designed for mobile-first viewing.`,
  ].join("\n");
}

function layer1ComicPage(aspect: string, quality: string, params: AssemblyParams): string {
  return [
    `Create a comic book page.`,
    `Art style: ${params.artStyle || "manga"}.`,
    `Tone: ${params.tone || "neutral"}.`,
    `Panel layout: ${params.comicLayout || "standard"}.`,
    `Aspect ratio: ${aspect}.`,
    `${quality}, detailed.`,
    ``,
    `Requirements:`,
    `- Panel borders must be clearly defined`,
    `- Speech bubbles must have clean tails pointing to the speaking character`,
    `- Visual storytelling: each panel advances the narrative`,
    `- Consistent character design across all panels`,
    `- Scientific/educational accuracy for all visual elements`,
  ].join("\n");
}

// ─── Style Definition Parsing ──────────────────────────────────────────

function loadStyleDefinition(design: string): StyleDefinition | null {
  const filePath = path.join(STYLE_DEFS_DIR, `${design}.md`);
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, "utf-8");

  const extract = (header: string): string => {
    const regex = new RegExp(`## ${header}\\n\\n([\\s\\S]*?)(?=\\n## |$)`, "i");
    const match = content.match(regex);
    return match?.[1]?.trim() || "";
  };

  // Style Lock may be in a code block — extract the code block content
  const styleLockSection = content.match(/## Style Lock[\s\S]*?```text\n([\s\S]*?)```/i);
  const styleLock = styleLockSection?.[1]?.trim() || extract("Style Lock");

  // Role fragment: find the role-specific sub-section
  const roleSection = content.match(
    /### illustration\n\n```text\n([\s\S]*?)```/i
  );
  const roleFragment = roleSection?.[1]?.trim() || "";

  return {
    styleLock,
    colorPalette: "",
    typography: extract("Typography"),
    visualElements: extract("Visual Elements"),
    composition: extract("Composition"),
    negativeConstraints: extract("Negative Constraints"),
    roleFragment,
  };
}

// ─── Palette System ────────────────────────────────────────────────────

function loadPalette(name: string): PaletteDefinition | null {
  const filePath = path.join(PALETTES_DIR, `${name}.md`);
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, "utf-8");

  // Extract background (supports ## Background or embedded in color section)
  const bgMatch = content.match(/## Background\n[\s\S]*?#([A-Fa-f0-9]{6})/);
  const background = bgMatch?.[1] ? `#${bgMatch[1]}` : "";

  // Extract colors table (supports both ## Colors and ## Color Palette)
  const colorSectionMatch = content.match(/## Colors\n/) ? "## Colors" :
    content.match(/## Color Palette\n/) ? "## Color Palette" : null;
  const colors: Record<string, string> = {};
  if (colorSectionMatch) {
    const sectionStart = content.indexOf(colorSectionMatch);
    const remaining = content.slice(sectionStart + colorSectionMatch.length);
    const nextHeader = remaining.match(/\n## /);
    const tableSection = nextHeader
      ? remaining.slice(0, nextHeader.index)
      : remaining;
    const rows = tableSection.split("\n").filter(l => l.startsWith("|") && !l.includes("---") && !l.includes("Role"));
    for (const row of rows) {
      const cells = row.split("|").map(c => c.trim()).filter(Boolean);
      if (cells.length >= 3) {
        const role = cells[0]!;
        const hexMatch = cells[2]?.match(/#([A-Fa-f0-9]{6})/);
        if (hexMatch) colors[role] = `#${hexMatch[1]}`;
      }
    }
  }

  // Extract semantic constraint
  const consMatch = content.match(/## Semantic Constraint\n\n([\s\S]*?)(?=\n##|\n---|$)/);
  const semanticConstraint = consMatch?.[1]?.trim() || "";

  return { background, colors, semanticConstraint };
}

function applyPaletteToStyleLock(styleLock: string, palette: PaletteDefinition): string {
  let result = styleLock;

  // Append palette color overrides as explicit instructions
  const colorLines: string[] = [];
  for (const [role, hex] of Object.entries(palette.colors)) {
    colorLines.push(`  - ${role}: ${hex}`);
  }
  if (palette.background) {
    colorLines.push(`  - Background: ${palette.background}`);
  }
  if (palette.semanticConstraint) {
    colorLines.push(`  - Constraint: ${palette.semanticConstraint}`);
  }
  if (colorLines.length > 0) {
    result += `\n\nPalette override:\n${colorLines.join("\n")}`;
  }
  return result;
}

// ─── Preset System ─────────────────────────────────────────────────────

interface PresetEntry {
  design?: string;
  palette?: string;
  archetype?: string;
  layout?: string;
  coverType?: string;
  cardStyle?: string;
  cardLayout?: string;
  artStyle?: string;
  tone?: string;
  comicLayout?: string;
}

function loadPresets(): Record<string, PresetEntry> {
  if (!fs.existsSync(PRESETS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(PRESETS_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function expandPreset(presetName: string): Partial<AssemblyParams> {
  const presets = loadPresets();
  const entry = presets[presetName];
  if (!entry) return {};

  const params: Partial<AssemblyParams> = {};
  if (entry.design) params.design = entry.design;
  if (entry.palette) params.palette = entry.palette;
  if (entry.archetype) params.archetype = entry.archetype;
  if (entry.layout) params.layout = entry.layout;
  if (entry.coverType) params.coverType = entry.coverType;
  if (entry.cardStyle) params.cardStyle = entry.cardStyle;
  if (entry.cardLayout) params.cardLayout = entry.cardLayout;
  if (entry.artStyle) params.artStyle = entry.artStyle;
  if (entry.tone) params.tone = entry.tone;
  if (entry.comicLayout) params.comicLayout = entry.comicLayout;
  return params;
}

// ─── Comic Dual Style Loading ──────────────────────────────────────────

function loadComicStyleBlock(artStyle: string, tone: string): { styleLock: string; negativeConstraints: string } {
  const artFile = path.join(COMIC_ART_DIR, `${artStyle}.md`);
  const toneFile = path.join(COMIC_TONE_DIR, `${tone}.md`);

  const parts: string[] = [];

  if (fs.existsSync(artFile)) {
    const content = fs.readFileSync(artFile, "utf-8");
    const lock = content.match(/```text\n([\s\S]*?)```/);
    parts.push(lock?.[1]?.trim() || content);
  }

  if (fs.existsSync(toneFile)) {
    const content = fs.readFileSync(toneFile, "utf-8");
    const lock = content.match(/```text\n([\s\S]*?)```/);
    parts.push(lock?.[1]?.trim() || content);
  }

  return {
    styleLock: parts.join("\n\n"),
    negativeConstraints: "",
  };
}

// ─── Archetype Loading ─────────────────────────────────────────────────

function loadArchetype(name: string): ArchetypeTemplate | null {
  if (!fs.existsSync(ARCHETYPES_FILE)) return null;

  const content = fs.readFileSync(ARCHETYPES_FILE, "utf-8");

  const lookupName = name.toLowerCase().replace(/[\s-]+/g, " ");
  const sections = content.split(/^## \d+\. /m);

  for (const section of sections) {
    const titleMatch = section.match(/^([^\n]+)/);
    if (!titleMatch) continue;
    const sectionTitle = titleMatch[1].trim().toLowerCase().replace(/\s*[（(][^)）]*[)）]\s*/g, "").replace(/[\s-]+/g, " ");

    if (sectionTitle.includes(lookupName) || lookupName.includes(sectionTitle)) {
      const structureMatch = section.match(/\*\*通用结构\*\*：\n([\s\S]*?)(?=\*\*节点|$)/);
      const illustrationMatch = section.match(/### Illustration Role 适配\n\n([\s\S]*?)(?=\n---|\n## |$)/);

      return {
        name: titleMatch[1].trim(),
        whenToUse: "",
        structure: structureMatch?.[1]?.trim() || section.slice(0, 500).trim(),
        illustrationAdaptation: illustrationMatch?.[1]?.trim() || "",
      };
    }
  }
  return null;
}

// ─── Layout & Style Guideline Loading (infographic) ────────────────────

function loadLayoutGuideline(name: string): string {
  const filePath = path.join(REPO_ROOT, "slides-imagine/infographic/layouts", `${name}.md`);
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf-8");
}

function loadStyleGuideline(name: string): string {
  const filePath = path.join(REPO_ROOT, "slides-imagine/infographic/styles", `${name}.md`);
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf-8");
}

// ─── Cover Type & Rendering Loading ────────────────────────────────────

function loadCoverTypeGuideline(name: string): string {
  const filePath = path.join(REPO_ROOT, "slides-imagine/cover/types.md");
  if (!fs.existsSync(filePath)) return "";
  const content = fs.readFileSync(filePath, "utf-8");
  const regex = new RegExp(`### \\d+\\. ${name}[\\s\\S]*?(?=### \\d+\\.|$)`, "i");
  return content.match(regex)?.[0]?.trim() || "";
}

function loadCoverRenderingGuideline(name: string): string {
  const filePath = path.join(REPO_ROOT, "slides-imagine/cover/renderings", `${name}.md`);
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf-8");
}

// ─── Assembly ──────────────────────────────────────────────────────────

function normalizeArchetypeName(input: string): string {
  const map: Record<string, string> = {
    "cover": "Cover Metaphor",
    "cover-metaphor": "Cover Metaphor",
    "cover metaphor": "Cover Metaphor",
    "single-concept": "Single Concept",
    "single concept": "Single Concept",
    "left-right-contrast": "Left-Right Contrast",
    "left-right contrast": "Left-Right Contrast",
    "horizontal-process": "Horizontal Process",
    "horizontal process": "Horizontal Process",
    "circular-mechanism": "Circular Mechanism",
    "circular mechanism": "Circular Mechanism",
    "branching-map": "Branching Map",
    "branching map": "Branching Map",
    "classification-map": "Classification Map",
    "classification map": "Classification Map",
    "matrix-table": "Matrix Table",
    "matrix table": "Matrix Table",
    "main-metaphor": "Main Metaphor Diagram",
    "main metaphor": "Main Metaphor Diagram",
    "main metaphor diagram": "Main Metaphor Diagram",
    "takeaway": "Takeaway",
  };
  return map[input.toLowerCase()] || input;
}

export function assemblePrompt(rawParams: AssemblyParams): AssembledPrompt {
  // ─── Preset Expansion ───
  let params = { ...rawParams };
  if (rawParams.preset) {
    const presetValues = expandPreset(rawParams.preset);
    // Preset provides defaults; explicit params override
    params = { ...presetValues, ...rawParams };
  }

  const quality = params.quality === "2k" ? "high quality, 2k" : "high quality";
  const archetypeName = params.archetype ? normalizeArchetypeName(params.archetype) : undefined;
  const role = params.role;

  // ─── Load Style Data ───
  let styleLock: string;
  let negativeConstraints: string;
  let typography: string;

  if (role === "comic-page" && params.artStyle && params.tone) {
    // Comic: dual load from art-styles + tones
    const comicStyle = loadComicStyleBlock(params.artStyle, params.tone);
    styleLock = comicStyle.styleLock || `Comic art style: ${params.artStyle}, tone: ${params.tone}`;
    negativeConstraints = comicStyle.negativeConstraints;
    typography = "Comic lettering — clean, consistent, readable";
  } else {
    // Standard: single style-definition
    const styleDef = loadStyleDefinition(params.design);
    if (!styleDef) {
      throw new Error(
        `Style definition not found for "${params.design}". ` +
        `Available: ${fs.readdirSync(STYLE_DEFS_DIR).map(f => f.replace(".md", "")).join(", ")}`
      );
    }
    styleLock = styleDef.styleLock;
    negativeConstraints = styleDef.negativeConstraints;
    typography = styleDef.typography;
  }

  // ─── Palette Override ───
  if (params.palette) {
    const palette = loadPalette(params.palette);
    if (palette) {
      styleLock = applyPaletteToStyleLock(styleLock, palette);
    }
  }

  // ─── Load Archetype (illustration/content-page only) ───
  let archetype: ArchetypeTemplate | null = null;
  if (archetypeName && (role === "illustration" || role === "content-page")) {
    archetype = loadArchetype(archetypeName);
  }

  // ─── Assemble Layer 1 ───
  let layer1: string;
  switch (role) {
    case "content-page":
      layer1 = layer1ContentPage(params.aspect, quality, params);
      break;
    case "infographic":
      layer1 = layer1Infographic(params.aspect, quality, params);
      break;
    case "cover":
      layer1 = layer1Cover(params.aspect, quality, params);
      break;
    case "image-card":
      layer1 = layer1ImageCard(params.aspect, quality, params);
      break;
    case "comic-page":
      layer1 = layer1ComicPage(params.aspect, quality, params);
      break;
    default:
      layer1 = layer1Illustration(params.aspect, quality);
  }

  // ─── Assemble Layer 2 ───
  const layer2 = [
    `Apply this exact visual style:`,
    ``,
    styleLock,
    ``,
    `Role-specific instruction:`,
    role === "illustration"
      ? `This is an illustration/background image. NO text. Focus on visual atmosphere and composition.`
      : role === "comic-page"
      ? `This is a comic page. Maintain character consistency. Follow panel breakdown exactly.`
      : `This is a ${role} page. Text rendering rules: ${typography}`,
  ].join("\n");

  // ─── Assemble Layer 3 ───
  let layer3 = "";

  if (role === "illustration" || role === "content-page") {
    if (archetype) {
      layer3 += `## Composition Archetype: ${archetype.name}\n\n`;
      layer3 += archetype.structure + "\n\n";
      if (role === "illustration" && archetype.illustrationAdaptation) {
        layer3 += `## Illustration Adaptation\n${archetype.illustrationAdaptation}\n\n`;
      }
    }
    if (params.content) {
      layer3 += `## Scene Description\n${params.content}\n\n`;
    }
    if (role === "content-page") {
      const textItems: string[] = [];
      if (params.title) textItems.push(`Title: ${params.title}`);
      if (params.subtitle) textItems.push(`Subtitle: ${params.subtitle}`);
      if (params.labels?.length) {
        params.labels.forEach((l, i) => textItems.push(`Label ${i + 1}: ${l}`));
      }
      if (textItems.length > 0) {
        layer3 += `## Required Text Only\n- ${textItems.join("\n- ")}\n\n`;
      }
    } else {
      layer3 += `## Text Safety\nNo text, no labels, no numbers anywhere in the image.\n`;
      layer3 += `Clean empty zones for HTML text overlay.\n\n`;
    }
  }

  if (role === "infographic") {
    if (params.layout) {
      const layoutGuide = loadLayoutGuideline(params.layout);
      if (layoutGuide) {
        layer3 += `## Layout Guidelines (${params.layout})\n${layoutGuide.slice(0, 1500)}\n\n`;
      }
    }
    if (params.infographicStyle) {
      const styleGuide = loadStyleGuideline(params.infographicStyle);
      if (styleGuide) {
        layer3 += `## Style Guidelines (${params.infographicStyle})\n${styleGuide.slice(0, 1500)}\n\n`;
      }
    }
    if (params.content) {
      layer3 += `## Content\n${params.content}\n\n`;
    }
    if (params.textLabels?.length) {
      layer3 += `## Text Labels\n${params.textLabels.map((l, i) => `${i + 1}. ${l}`).join("\n")}\n\n`;
    }
  }

  if (role === "cover") {
    if (params.coverType) {
      const typeGuide = loadCoverTypeGuideline(params.coverType);
      if (typeGuide) {
        layer3 += `## Cover Type: ${params.coverType}\n${typeGuide.slice(0, 1000)}\n\n`;
      }
    }
    if (params.rendering) {
      const renderGuide = loadCoverRenderingGuideline(params.rendering);
      if (renderGuide) {
        layer3 += `## Rendering: ${params.rendering}\n${renderGuide.slice(0, 1000)}\n\n`;
      }
    }
    if (params.content) {
      layer3 += `## Content\n${params.content}\n\n`;
    }
    layer3 += `## Dimensions\nMood: ${params.mood || "balanced"}. Font: ${params.font || "clean"}. Text level: ${params.textLevel || "title-only"}.\n\n`;
  }

  if (role === "image-card") {
    if (params.content) {
      layer3 += `## Content\n${params.content}\n\n`;
    }
    layer3 += `## Card Configuration\nStyle: ${params.cardStyle || "minimal"}. Layout: ${params.cardLayout || "balanced"}.\n`;
    if (params.position) layer3 += `Position: ${params.position}.\n`;
    layer3 += `\n`;
  }

  if (role === "comic-page") {
    if (params.characters) {
      layer3 += `## Characters\n${params.characters}\n\n`;
    }
    if (params.panelBreakdown) {
      layer3 += `## Panel Breakdown\n${params.panelBreakdown}\n\n`;
    }
    if (params.content) {
      layer3 += `## Story\n${params.content}\n\n`;
    }
    if (params.ref) {
      layer3 += `## Character Consistency\nReference the character sheet: ${params.ref}. Maintain exact character designs.\n\n`;
    }
  }

  layer3 += `## Composition Check\n`;
  layer3 += `- Subject clarity: clear, centered or slightly offset\n`;
  layer3 += `- Slide fit: suitable for presentation, not too busy\n`;
  layer3 += `- Same visual style as other images in this deck (style lock applied)\n`;

  // ─── Merge ───
  const fullPrompt = [layer1, layer2, layer3].join("\n\n");

  return {
    fullPrompt,
    negativePrompt: negativeConstraints || "",
    metadata: {
      design: params.design,
      archetype: archetype?.name || "none",
      role: params.role,
      aspect: params.aspect,
    },
  };
}
