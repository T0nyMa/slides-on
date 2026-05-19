/**
 * prompt-assembler.ts — 3-layer structured prompt assembly engine
 *
 * Implements the prompt-construction.md assembly logic in code:
 *   Layer 1: Image Specs & Universal Constraints (role-dependent)
 *   Layer 2: Style Lock (from style-definitions/{design}.md)
 *   Layer 3: Archetype Composition + Content (from archetypes.md + user input)
 *
 * Usage:
 *   const result = assemblePrompt({
 *     design: "sketch-notes",
 *     archetype: "horizontal-process",
 *     role: "illustration",
 *     aspect: "3:4",
 *     content: "推荐系统三阶段",
 *   });
 */

import * as fs from "fs";
import * as path from "path";

// ─── Types ─────────────────────────────────────────────────────────────

export interface AssemblyParams {
  design: string;
  archetype?: string;
  role: "illustration" | "content-page";
  aspect: string;
  content?: string;
  title?: string;
  subtitle?: string;
  labels?: string[];
  textSafe?: boolean;
  quality?: "normal" | "2k";
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

// ─── Path Resolution ───────────────────────────────────────────────────

const REPO_ROOT = path.resolve(import.meta.dir, "../..");
const STYLE_DEFS_DIR = path.join(REPO_ROOT, "slides-imagine/style-definitions");
const ARCHETYPES_FILE = path.join(REPO_ROOT, "slides-imagine/archetypes.md");

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

// ─── Archetype Loading ─────────────────────────────────────────────────

function loadArchetype(name: string): ArchetypeTemplate | null {
  if (!fs.existsSync(ARCHETYPES_FILE)) return null;

  const content = fs.readFileSync(ARCHETYPES_FILE, "utf-8");

  // Normalize archetype name for matching: "horizontal process" → "Horizontal Process"
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

// ─── Assembly ──────────────────────────────────────────────────────────

/**
 * Normalize archetype name from CLI to the format used in archetypes.md.
 * Accepts: "horizontal process", "horizontal-process", "Horizontal Process"
 */
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

export function assemblePrompt(params: AssemblyParams): AssembledPrompt {
  const quality = params.quality === "2k" ? "high quality, 2k" : "high quality";
  const archetypeName = params.archetype ? normalizeArchetypeName(params.archetype) : undefined;

  // Load style data
  const styleDef = loadStyleDefinition(params.design);
  if (!styleDef) {
    throw new Error(
      `Style definition not found for "${params.design}". ` +
      `Available: ${fs.readdirSync(STYLE_DEFS_DIR).map(f => f.replace(".md", "")).join(", ")}`
    );
  }

  // Load archetype
  let archetype: ArchetypeTemplate | null = null;
  if (archetypeName) {
    archetype = loadArchetype(archetypeName);
  }

  // ─── Assemble Layer 1 ───
  const layer1 = params.role === "content-page"
    ? layer1ContentPage(params.aspect, quality, params)
    : layer1Illustration(params.aspect, quality);

  // ─── Assemble Layer 2 ───
  const layer2 = [
    `Apply this exact visual style:`,
    ``,
    styleDef.styleLock,
    ``,
    `Role-specific instruction:`,
    params.role === "illustration"
      ? `This is an illustration/background image. NO text. Focus on visual atmosphere and composition.`
      : `This is a content page. Text rendering rules: ${styleDef.typography}`,
  ].join("\n");

  // ─── Assemble Layer 3 ───
  let layer3 = "";

  if (archetype) {
    layer3 += `## Composition Archetype: ${archetype.name}\n\n`;
    layer3 += archetype.structure + "\n\n";

    if (params.role === "illustration" && archetype.illustrationAdaptation) {
      layer3 += `## Illustration Adaptation\n${archetype.illustrationAdaptation}\n\n`;
    }
  }

  if (params.content) {
    layer3 += `## Scene Description\n${params.content}\n\n`;
  }

  if (params.role === "content-page") {
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

  layer3 += `## Composition Check\n`;
  layer3 += `- Subject clarity: clear, centered or slightly offset\n`;
  layer3 += `- Slide fit: suitable for presentation, not too busy\n`;
  layer3 += `- Same visual style as other images in this deck (style lock applied)\n`;

  // ─── Merge ───
  const fullPrompt = [layer1, layer2, layer3].join("\n\n");

  return {
    fullPrompt,
    negativePrompt: styleDef.negativeConstraints || "",
    metadata: {
      design: params.design,
      archetype: archetype?.name || "none",
      role: params.role,
      aspect: params.aspect,
    },
  };
}
