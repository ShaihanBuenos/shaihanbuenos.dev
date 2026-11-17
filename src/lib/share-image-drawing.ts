// Draws a share image (section 9 of the spec), in the build and without an
// outside service. The image is a small page of the site, as DESIGN.md
// describes it: the sheet, the one-line frame, the teeth, the palette and the
// three fonts. It is written as an SVG, with the letters as outlines taken
// from the font files of the site, and turned into a PNG.
//
// The measures are the ones of the CSS, in CSS pixels, on a page of 600 by
// 315; the PNG has two pixels for each one.
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { type Font, create } from "fontkit";
import sharp from "sharp";
import { type ShareImage, DOMAIN, SHARE_IMAGE_SIZE } from "./share-image.ts";

const WIDTH = 600;
const HEIGHT = 315;

// The palette "Cobre e safira", as in src/styles/base.css.
const COLORS = {
  ground: "#f3f2ef",
  sheet: "#fbfaf8",
  ink: "#14161b",
  grid: "rgba(20, 22, 27, 0.06)",
  copper: "#d65c24",
  sapphire: "#183ec9",
  "l-copper": "rgba(214, 92, 36, 0.34)",
  "l-copper-2": "rgba(214, 92, 36, 0.22)",
  "l-sapphire": "rgba(24, 62, 201, 0.26)",
  "l-grey": "rgba(20, 22, 27, 0.1)",
  "f-sapphire": "#c0c9ec",
} as const;

// The wire of the frame, of the core and of the panel of the mark.
const WIRE = 1.5;
// The margin around the frame: the gutter of a page this wide.
const GUTTER = 19;
// The module: 1/26 of the frame, as on the site.
const FRAME_WIDTH = WIDTH - 2 * GUTTER;
const U = FRAME_WIDTH / 26;
// The frame is twelve modules tall, with the teeth below it.
const FRAME = { x: GUTTER, y: 22, width: FRAME_WIDTH, height: 12 * U };
const TEETH = { gap: 2, height: 10, tooth: 0.34 };
const REM = 16;

// The three fonts of the site, each one in two files: the basic Latin
// letters and the extended ones. The files are the ones the site serves.
const FONT_FILES = {
  display: ["bricolage-grotesque-latin.woff2", "bricolage-grotesque-latin-ext.woff2"],
  text: ["hanken-grotesk-latin.woff2", "hanken-grotesk-latin-ext.woff2"],
  mono: ["martian-mono-latin.woff2", "martian-mono-latin-ext.woff2"],
} as const;

type Family = keyof typeof FONT_FILES;

let fonts: Promise<Record<Family, Font[]>> | undefined;

// The build runs at the root of the project, where public/ is.
function loadFonts(): Promise<Record<Family, Font[]>> {
  return (fonts ??= (async () => {
    const entries = await Promise.all(
      (Object.keys(FONT_FILES) as Family[]).map(async (family) => {
        const files = await Promise.all(
          FONT_FILES[family].map((file) => readFile(resolve("public/fonts", file))),
        );
        return [family, files.map((file) => create(file))] as const;
      }),
    );
    return Object.fromEntries(entries) as Record<Family, Font[]>;
  })());
}

// How a piece of text is set: the values of the CSS.
interface Style {
  family: Family;
  // In CSS pixels.
  size: number;
  weight: number;
  // In em.
  letterSpacing?: number;
  color?: string;
}

// The font at the weight of the style. Bricolage Grotesque also changes
// with the size, as the browser does by itself (`font-optical-sizing`).
function at(font: Font, { size, weight }: Style): Font {
  const settings: Record<string, number> = {};
  const { wght, opsz } = font.variationAxes;
  if (wght) settings.wght = Math.min(wght.max, Math.max(wght.min, weight));
  if (opsz) settings.opsz = Math.min(opsz.max, Math.max(opsz.min, size));
  return font.getVariation(settings);
}

// The text cut where the font file changes: each letter is drawn with the
// first file of the family that has it.
function runsOf(text: string, files: Font[]): { font: Font; text: string }[] {
  const runs: { font: Font; text: string }[] = [];
  for (const character of text) {
    const codePoint = character.codePointAt(0) ?? 0;
    const font = files.find((file) => file.hasGlyphForCodePoint(codePoint)) ?? files.at(0);
    if (!font) throw new Error("A font family has no files.");
    const last = runs.at(-1);
    if (last?.font === font) last.text += character;
    else runs.push({ font, text: character });
  }
  return runs;
}

interface Line {
  // The outlines of the letters, with the left end of the baseline at 0, 0.
  paths: string;
  width: number;
}

// One line of text, as outlines.
function lineOf(text: string, style: Style, files: Font[]): Line {
  const spacing = (style.letterSpacing ?? 0) * style.size;
  let x = 0;
  let paths = "";
  for (const run of runsOf(text, files)) {
    const font = at(run.font, style);
    const scale = style.size / font.unitsPerEm;
    const { glyphs, positions } = font.layout(run.text);
    glyphs.forEach((glyph, index) => {
      const position = positions.at(index);
      if (!position) return;
      const outline = glyph.path.toSVG();
      if (outline !== "") {
        const left = x + position.xOffset * scale;
        const up = position.yOffset * scale;
        paths += `<path transform="translate(${left.toFixed(2)} ${(-up).toFixed(2)}) scale(${scale} ${-scale})" d="${outline}"/>`;
      }
      x += position.xAdvance * scale + spacing;
    });
  }
  return { paths, width: Math.max(0, x - spacing) };
}

// The text broken at the spaces into lines no wider than `width`: the words
// of each line.
function wrap(text: string, style: Style, files: Font[], width: number): string[][] {
  const lines: string[][] = [];
  let words: string[] = [];
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (words.length === 0 || lineOf([...words, word].join(" "), style, files).width <= width) {
      words.push(word);
    } else {
      lines.push(words);
      words = [word];
    }
  }
  if (words.length > 0) lines.push(words);
  return lines;
}

function linesOf(text: string, style: Style, files: Font[], width: number): Line[] {
  return wrap(text, style, files, width).map((words) => lineOf(words.join(" "), style, files));
}

// The lines of a title that has to fit: the first of the sizes, from the
// largest, at which it takes no more lines than the size leaves room for.
// At the smallest size, what does not fit is cut, and the last line ends in
// an ellipsis.
function fit(
  text: string,
  style: Omit<Style, "size">,
  files: Font[],
  width: number,
  sizes: { size: number; maxLines: number }[],
): { size: number; lines: Line[] } {
  for (const { size, maxLines } of sizes) {
    const lines = linesOf(text, { ...style, size }, files, width);
    if (lines.length <= maxLines && lines.every((line) => line.width <= width)) {
      return { size, lines };
    }
  }
  const smallest = sizes.at(-1);
  if (!smallest) throw new Error("A title needs at least one size.");
  const sized = { ...style, size: smallest.size };
  const kept = wrap(text, sized, files, width).slice(0, smallest.maxLines);
  const lines = kept.slice(0, -1).map((words) => lineOf(words.join(" "), sized, files));
  const last = kept.at(-1) ?? [];
  for (;;) {
    const line = lineOf(`${last.join(" ")}…`, sized, files);
    if (line.width <= width || last.length <= 1)
      return { size: smallest.size, lines: [...lines, line] };
    last.pop();
  }
}

// Lines placed on the image: `x` is the left end and `y` the baseline of the
// first line.
function place(lines: Line[], x: number, y: number, lineHeight: number, color: string): string {
  return lines
    .map(
      (line, index) =>
        `<g fill="${color}" transform="translate(${x.toFixed(2)} ${(y + index * lineHeight).toFixed(2)})">${line.paths}</g>`,
    )
    .join("");
}

function rectangle(
  { x, y, width, height }: { x: number; y: number; width: number; height: number },
  fill: string,
  extra = "",
): string {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}"${extra}/>`;
}

// A rectangle with the wire inside its edge, as a CSS border.
function wired(box: { x: number; y: number; width: number; height: number }, fill: string): string {
  const inset = WIRE / 2;
  return rectangle(
    {
      x: box.x + inset,
      y: box.y + inset,
      width: box.width - WIRE,
      height: box.height - WIRE,
    },
    fill,
    ` stroke="${COLORS.ink}" stroke-width="${WIRE}"`,
  );
}

// The teeth below the frame: one per module.
function teeth(): string {
  const y = FRAME.y + FRAME.height + TEETH.gap;
  let drawn = "";
  for (let module = 0; module < 26; module += 1) {
    drawn += rectangle(
      { x: FRAME.x + module * U, y, width: U * TEETH.tooth, height: TEETH.height },
      COLORS.ink,
    );
  }
  return drawn;
}

// A caption: Martian Mono, small, in capitals.
const CAPTION: Style = { family: "mono", size: 0.72 * REM, weight: 400, letterSpacing: 0.02 };

function caption(text: string, files: Font[]): Line {
  return lineOf(text.toUpperCase(), CAPTION, files);
}

// A position on the grid of the frame, in modules.
function onGrid(column: number, row: number, columns: number, rows: number) {
  return { x: FRAME.x + column * U, y: FRAME.y + row * U, width: columns * U, height: rows * U };
}

// The image of the fixed pages: a small floor plan, with the name and the
// label in the core.
function drawDefault(
  image: Extract<ShareImage, { kind: "default" }>,
  families: Record<Family, Font[]>,
): string {
  let grid = "";
  for (let column = 1; column < 26; column += 1) {
    grid += rectangle(
      { x: FRAME.x + column * U, y: FRAME.y, width: 1, height: FRAME.height },
      COLORS.grid,
    );
  }
  for (let row = 1; row < 12; row += 1) {
    grid += rectangle(
      { x: FRAME.x, y: FRAME.y + row * U, width: FRAME.width, height: 1 },
      COLORS.grid,
    );
  }

  const core = onGrid(1, 2, 14, 8);
  // The layers cross each other and the core, and darken where they cross.
  const layers = [
    rectangle(onGrid(14, 1, 11, 3), COLORS["l-copper"]),
    rectangle(onGrid(13, 3, 6, 8), COLORS["l-sapphire"]),
    rectangle(onGrid(1, 9, 10, 2), COLORS["l-grey"]),
    rectangle(onGrid(20, 5, 5, 6), COLORS["l-copper-2"]),
  ].join("");

  const padding = 14;
  const name: Style = {
    family: "display",
    size: 0.092 * FRAME.width,
    weight: 200,
    letterSpacing: -0.04,
  };
  const nameLines = image.name.split(" ").map((word) => lineOf(word, name, families.display));
  const nameHeight = name.size * 0.86;
  const firstBaseline = core.y + padding + name.size * 0.78;

  const label: Style = { family: "text", size: 1.06 * REM, weight: 500 };
  const labelLines = linesOf(image.label, label, families.text, core.width - 2 * padding);
  const labelBaseline = core.y + core.height - padding - (labelLines.length - 1) * label.size * 1.2;

  return [
    grid,
    wired(core, COLORS.ground),
    `<g style="mix-blend-mode: multiply">${layers}</g>`,
    place(nameLines, core.x + padding, firstBaseline, nameHeight, COLORS.ink),
    place(labelLines, core.x + padding, labelBaseline, label.size * 1.2, COLORS.ink),
    place([caption(DOMAIN, families.mono)], FRAME.x + U, FRAME.y + 11 * U + 13, 0, COLORS.ink),
  ].join("");
}

// The image of a text: the title, as on its page, and the text type after it.
function drawText(
  image: Extract<ShareImage, { kind: "text" }>,
  families: Record<Family, Font[]>,
): string {
  const left = FRAME.x + U;
  const width = FRAME.width - 2 * U;
  // The title of a text goes from 2.2rem to 3.4rem. The larger the
  // letters, the fewer lines fit above the text type.
  const title = fit(
    image.title,
    { family: "display", weight: 300, letterSpacing: -0.03 },
    families.display,
    width,
    [
      { size: 3.4 * REM, maxLines: 2 },
      { size: 3 * REM, maxLines: 3 },
      { size: 2.6 * REM, maxLines: 3 },
      { size: 2.2 * REM, maxLines: 4 },
    ],
  );
  const lineHeight = title.size * 1.08;
  const firstBaseline = FRAME.y + 1.5 * U + title.size * 0.8;
  const captionBaseline = firstBaseline + (title.lines.length - 1) * lineHeight + 2.2 * REM;

  // The little square of the text type: copper for an article, sapphire for
  // a study note.
  const square = 0.8 * CAPTION.size;
  const color = image.type === "article" ? COLORS.copper : COLORS.sapphire;

  return [
    place(title.lines, left, firstBaseline, lineHeight, COLORS.ink),
    rectangle({ x: left, y: captionBaseline - square, width: square, height: square }, color),
    place(
      [caption(image.typeName, families.mono)],
      left + square + 0.55 * CAPTION.size,
      captionBaseline,
      0,
      COLORS.ink,
    ),
    place([caption(DOMAIN, families.mono)], left, FRAME.y + 11 * U + 4, 0, COLORS.ink),
  ].join("");
}

// The project mark as it goes into the image: its own SVG, at a place and a
// size, with the colors of the site where the file names them.
function markAt(mark: string, x: number, y: number, size: number): string {
  const placed = mark
    .replace(/<\?xml[^>]*\?>/, "")
    .replace(/var\(--([\w-]+)\)/g, (whole, name: string) =>
      name in COLORS ? COLORS[name as keyof typeof COLORS] : whole,
    )
    .replace(/<svg\b([^>]*)>/, (_, attributes: string) => {
      const kept = attributes.replace(/\s(?:x|y|width|height)="[^"]*"/g, "");
      return `<svg${kept} x="${x}" y="${y}" width="${size}" height="${size}">`;
    });
  return `<g color="${COLORS.ink}">${placed}</g>`;
}

// The image of a project story: the name and, in its panel, the project mark.
function drawProject(
  image: Extract<ShareImage, { kind: "project" }>,
  families: Record<Family, Font[]>,
): string {
  const panel = onGrid(17, 0, 9, 12);
  const left = FRAME.x + U;
  // The name of a project story starts at 3.4rem.
  const name = fit(
    image.name,
    { family: "display", weight: 200, letterSpacing: -0.04 },
    families.display,
    panel.x - left - U,
    [{ size: 3.4 * REM, maxLines: 4 }],
  );
  const markSize = 5 * U;

  return [
    rectangle(panel, COLORS["f-sapphire"]),
    rectangle({ x: panel.x, y: panel.y, width: WIRE, height: panel.height }, COLORS.ink),
    markAt(
      image.mark,
      panel.x + (panel.width - markSize) / 2,
      panel.y + (panel.height - markSize) / 2,
      markSize,
    ),
    place(name.lines, left, FRAME.y + 1.5 * U + name.size * 0.78, name.size * 0.86, COLORS.ink),
    place([caption(DOMAIN, families.mono)], left, FRAME.y + 11 * U + 4, 0, COLORS.ink),
  ].join("");
}

// The share image as an SVG: the ground, the sheet inside the frame, what
// the image says and, over everything, the wire of the frame and the teeth.
export async function shareImageSvg(image: ShareImage): Promise<string> {
  const families = await loadFonts();
  const inside =
    image.kind === "default"
      ? drawDefault(image, families)
      : image.kind === "text"
        ? drawText(image, families)
        : drawProject(image, families);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SHARE_IMAGE_SIZE.width}" height="${SHARE_IMAGE_SIZE.height}" viewBox="0 0 ${WIDTH} ${HEIGHT}">`,
    rectangle({ x: 0, y: 0, width: WIDTH, height: HEIGHT }, COLORS.ground),
    rectangle(FRAME, COLORS.sheet),
    inside,
    wired(FRAME, "none"),
    teeth(),
    "</svg>",
  ].join("");
}

// The share image as the PNG file the build writes.
export async function shareImagePng(image: ShareImage): Promise<Buffer> {
  return sharp(Buffer.from(await shareImageSvg(image)))
    .png({ compressionLevel: 9 })
    .toBuffer();
}
