// The part of fontkit the share images use. The package has no types of its own.
declare module "fontkit" {
  export interface Glyph {
    path: { toSVG(): string };
  }

  export interface GlyphPosition {
    xAdvance: number;
    xOffset: number;
    yOffset: number;
  }

  export interface GlyphRun {
    glyphs: Glyph[];
    positions: GlyphPosition[];
  }

  export interface Font {
    unitsPerEm: number;
    // The axes of a variable font, by tag: "wght", "opsz".
    variationAxes: Partial<Record<string, { min: number; default: number; max: number }>>;
    hasGlyphForCodePoint(codePoint: number): boolean;
    // The font at a point of its axes.
    getVariation(settings: Record<string, number>): Font;
    // The glyphs of a string and where each one goes, with the kerning.
    layout(text: string): GlyphRun;
  }

  export function create(buffer: Uint8Array): Font;
}
