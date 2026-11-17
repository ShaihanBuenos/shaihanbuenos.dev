import assert from "node:assert/strict";
import { test } from "node:test";
import { shareImagePng, shareImageSvg } from "./share-image-drawing.ts";

const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none" stroke="currentColor"><circle cx="60" cy="60" r="30" stroke="var(--copper)" /></svg>`;

function sizeOf(png: Buffer): { width: number; height: number } {
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

// The outlines the image draws: one <path> per letter.
function lettersIn(svg: string): number {
  return (svg.match(/<path\b/g) ?? []).length;
}

test("a share image is a PNG of 1200 by 630, whatever it says", async () => {
  for (const image of [
    { kind: "default", name: "Shaihan Buenos", label: "A label" },
    { kind: "text", title: "A title", type: "article", typeName: "article" },
    { kind: "project", name: "A Project", mark: MARK },
  ] as const) {
    const png = await shareImagePng({ ...image, path: "/share/test.png", alt: "Test" });
    assert.equal(png.subarray(1, 4).toString("latin1"), "PNG", image.kind);
    assert.deepEqual(sizeOf(png), { width: 1200, height: 630 }, image.kind);
  }
});

test("a title too long for the image is cut, with an ellipsis, and the image keeps its size", async () => {
  const word = "comprido ";
  const image = {
    kind: "text",
    path: "/share/test.png",
    alt: "Test",
    type: "study-note",
    typeName: "nota de estudo",
  } as const;
  const long = await shareImageSvg({ ...image, title: word.repeat(40).trim() });
  const longer = await shareImageSvg({ ...image, title: word.repeat(80).trim() });
  // Past what fits, more words draw no more letters.
  assert.equal(lettersIn(longer), lettersIn(long));
  assert.ok(lettersIn(long) < word.trim().length * 40);
  assert.deepEqual(sizeOf(await shareImagePng({ ...image, title: word.repeat(80).trim() })), {
    width: 1200,
    height: 630,
  });
});

// The fonts of the site come in two files each: the second one has the
// letters the first one lacks.
test("a letter outside the basic Latin file is drawn from the extended one", async () => {
  const image = { kind: "project", path: "/share/test.png", alt: "Test", mark: MARK } as const;
  const basic = await shareImageSvg({ ...image, name: "Lodz" });
  const extended = await shareImageSvg({ ...image, name: "Łódź" });
  assert.equal(lettersIn(extended), lettersIn(basic));
  assert.notEqual(extended, basic);
});

test("the project mark goes into the image with the colors of the site", async () => {
  const svg = await shareImageSvg({
    kind: "project",
    path: "/share/test.png",
    alt: "Test",
    name: "A Project",
    mark: MARK,
  });
  assert.match(svg, /<circle cx="60" cy="60" r="30" stroke="#d65c24" \/>/);
  assert.doesNotMatch(svg, /var\(/);
});
