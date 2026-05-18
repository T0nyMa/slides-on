/**
 * types.ts — Shared types for the slide assembly system
 */

// ─── Deck Config ──────────────────────────────────────────────────────

export interface DeckConfig {
  title: string;
  design: string | DesignConfig;  // preset name or free-form composition
  canvas: "16:9" | "3:4";
  author?: string;
  source?: string;          // source note in footer
}

// ─── Slide Data ───────────────────────────────────────────────────────

export type SlideType =
  | "cover"
  | "section"
  | "cards-2x2"
  | "cards-3"
  | "quote"
  | "steps"
  | "code"
  | "thanks"
  | "bullets"
  | "kpi"
  | "table"
  | "html"
  | "layout";

export interface SlideImage {
  src: string;
  alt?: string;
  fit?: "cover" | "contain";
}

export interface CardItem {
  num?: string;
  title: string;
  body: string;
  color?: string;
  image?: string;
}

export interface StepItem {
  num: string;
  title: string;
  body?: string;
  image?: string;
}

export interface BulletItem {
  icon: string;
  title: string;
  body: string;
  image?: string;
}

export interface KpiItem {
  value: string;
  label: string;
  delta?: string;
  deltaDir?: "up" | "down" | "flat";
}

export interface TableColumn {
  header: string;
  align?: "left" | "center" | "right";
  width?: string;  // e.g. "40%", "120px"
}

export interface SlideData {
  type: SlideType;
  // Content
  title?: string;
  subtitle?: string;
  kicker?: string;
  chip?: string;
  chipColor?: string;
  body?: string;
  // Chrome
  blobs?: string[];
  hideChrome?: boolean;
  center?: boolean;
  style?: string;
  // Type-specific
  cards?: CardItem[];
  steps?: StepItem[];
  code?: string;
  quote?: string;
  quoteAttr?: string;
  bullets?: BulletItem[];
  kpis?: KpiItem[];
  badges?: string[];
  layout?: string;
  slots?: Record<string, string>;
  html?: string;
  // Table type
  tableColumns?: TableColumn[];
  tableRows?: string[][];
  // Image
  image?: SlideImage;
  imageMode?: "hero" | "background";
  // Design-specific overrides
  designOverrides?: Record<string, unknown>;
}

// ─── Design Config (free-form composition) ───────────────────────────

export interface DesignConfig {
  design?: string;       // optional design CSS file e.g. "xhs-post" (chrome styles: stickers, blobs, etc.)
  theme?: string;        // theme CSS name e.g. "minimal-white"
  typography?: string;   // "geometric" | "editorial" | "humanist" | "handwritten" | "technical"
  texture?: string;      // "clean" | "paper" | "grid" | "organic" | "pixel"
  density?: string;      // "minimal" | "balanced" | "dense"
}

// ─── Design Manifest ────────────────────────────────────────────────────

export interface DesignManifest {
  name: string;
  css: string | null;
  classes: {
    title: string;
    subtitle: string;
    kicker: string;
    body: string;
    titleTag: string;
  };
  chrome: {
    topbar: "standard" | "dot-badge" | "terminal" | null;
    footer: boolean;
    footerTag: "span" | "div";
    divider: boolean;
    decorations: string[];
    pageFormat: "dot" | "slash";
  };
  variants: {
    card: "standard" | "editorial" | "terminal" | "handdrawn";
    step: "standard" | "editorial" | "card-as-step" | "terminal";
    code: "standard" | "card-wrapped";
  };
  image?: {
    radius: string;
    shadow?: string;
    border?: string;
  };
  qa: {
    decorativeClasses: string[];
    chromeSelectors: string[];
    cardColors: string[];
  };
}
