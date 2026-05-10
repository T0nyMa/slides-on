/**
 * types.ts — Shared types for the slide assembly system
 */

// ─── Deck Config ──────────────────────────────────────────────────────

export interface DeckConfig {
  title: string;
  design: string;           // "pastel-card" | "white-editorial" | "xhs-post"
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
  | "html";

export interface CardItem {
  num?: string;
  title: string;
  body: string;
  color?: string;
}

export interface StepItem {
  num: string;
  title: string;
  body?: string;
}

export interface BulletItem {
  icon: string;
  title: string;
  body: string;
}

export interface KpiItem {
  value: string;
  label: string;
  delta?: string;
  deltaDir?: "up" | "down" | "flat";
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
  html?: string;
  // Design-specific overrides
  designOverrides?: Record<string, unknown>;
}

// ─── Design Template ──────────────────────────────────────────────────

/** Per-design rendering functions for slide sub-elements */
export interface DesignTemplate {
  // CSS class mapping
  titleTag: string;        // "h1" or "h2", which HTML tag for the main title
  titleClass: string;      // "chr-title" or "chr-heading"
  subtitleClass: string;   // "chr-sub" or base class
  kickerClass: string;     // "chr-kicker"
  bodyClass: string;       // for general body text

  // Chrome generators — return HTML string
  topbarHTML(chip: string, chipColor: string, page: number, total: number): string;
  footerHTML(left: string, right: string): string;
  blobHTML(blobs: string[]): string;
  dividerHTML(): string;

  // Content generators
  cardHTML(card: CardItem): string;
  cardNumHTML(num: string): string;
  stepHTML(step: StepItem): string;
  codeHTML(code: string): string;
  quoteHTML(quote: string, attr?: string): string;
}
