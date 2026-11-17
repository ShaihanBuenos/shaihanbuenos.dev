// Tests of the motion "Traçado" (section 8 of the spec and the Motion section
// of DESIGN.md). They look at what `npm test` has just built: the pages, the
// CSS and the JavaScript in dist/.
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { type Rule, cssOf, valueOf } from "./support/css.ts";

const root = new URL("..", import.meta.url).pathname;

function page(file: string): Promise<string> {
  return readFile(`${root}dist/${file}`, "utf8");
}

const HOME = { en: "index.html", pt: "pt-br.html" };
const STORY = {
  en: (project: string) => `projects/${project}.html`,
  pt: (project: string) => `pt-br/projetos/${project}.html`,
};
const STORY_PATH = {
  en: (project: string) => `/projects/${project}`,
  pt: (project: string) => `/pt-br/projetos/${project}`,
};
const PROJECTS = ["example-project", "another-example-project"];

// The pages with the reading column, in both languages.
const READING_PAGES = [
  "writing.html",
  "writing/example-article-with-translation.html",
  "studies.html",
  "research.html",
  "about.html",
  "404.html",
  "pt-br/textos.html",
  "pt-br/textos/exemplo-de-artigo-com-traducao.html",
  "pt-br/estudos.html",
  "pt-br/pesquisa.html",
  "pt-br/sobre.html",
  "pt-br/404.html",
];

const EVERY_PAGE = [
  ...Object.values(HOME),
  "projects.html",
  "pt-br/projetos.html",
  ...PROJECTS.flatMap((project) => [STORY.en(project), STORY.pt(project)]),
  ...READING_PAGES,
];

// The opening tags of a page that carry this class.
function tagsWith(html: string, name: string): string[] {
  return (html.match(/<[a-z][^>]*>/g) ?? []).filter((tag) =>
    (tag.match(/\bclass="([^"]*)"/)?.[1] ?? "").split(/\s+/).includes(name),
  );
}

// The name an element takes in the page change: two elements with the same
// name, one on each page, become one that moves from a place to the other.
function changeNameOf(tag: string): string | undefined {
  return tag.match(/\bstyle="[^"]*\bview-transition-name:\s*([\w-]+)/)?.[1];
}

// ---------- the page change ----------

for (const path of EVERY_PAGE) {
  test(`${path} takes part in the page change`, async () => {
    const changes = (await cssOf(path)).filter(({ prelude }) => prelude === "@view-transition");
    assert.deepEqual(
      changes.map((rule) => valueOf(rule, "navigation")),
      ["auto"],
    );
  });
}

for (const language of ["en", "pt"] as const) {
  test(`Home (${language}): each project block becomes the panel of the mark on its project story`, async () => {
    const blocks = tagsWith(await page(HOME[language]), "project");
    const names = [];
    for (const project of PROJECTS) {
      const block = blocks.find((tag) => tag.includes(`href="${STORY_PATH[language](project)}"`));
      assert.ok(block, `Home has no block for ${project}`);
      const name = changeNameOf(block);
      assert.ok(name, `the block of ${project} has no name for the page change`);

      const [panel, ...others] = tagsWith(await page(STORY[language](project)), "story-mark");
      assert.ok(panel, `the story of ${project} has no panel of the mark`);
      assert.deepEqual(others, []);
      assert.equal(changeNameOf(panel), name);
      names.push(name);
    }
    // A name that showed twice on a page would cancel the whole page change.
    assert.equal(new Set(names).size, names.length);
    assert.equal(blocks.filter((tag) => changeNameOf(tag) !== undefined).length, names.length);
  });
}

// ---------- the touch ----------

// DESIGN.md, "Blocos da planta": the active block goes to its full color and
// the others keep a one-pixel outline. On a touch screen, the same state shows
// while the finger is on the block.
for (const state of ["focus-visible", "active"]) {
  test(`a block of the plan under :${state} is in full color, and the others in outline`, async () => {
    const rules = (await cssOf(HOME.en)).filter(
      // A phone has no pointer to hover with: the state cannot depend on one.
      ({ around }) => !around.some((prelude) => prelude.includes("hover")),
    );

    const block = rules.find(({ prelude }) =>
      prelude.split(",").some((selector) => selector.trim().endsWith(`a.block:${state}`)),
    );
    assert.ok(block, `no rule for the block under :${state}`);
    assert.equal(valueOf(block, "background-color"), "var(--full)");

    const others = rules.find(({ prelude }) =>
      prelude.includes(`:has(a.block:${state}) a.block:not(`),
    );
    assert.ok(others, `no rule for the other blocks while one is under :${state}`);
    // The build writes "transparent" in its short form.
    assert.match(valueOf(others, "background-color") ?? "", /^(transparent|#0000)$/);
    assert.equal(valueOf(others, "box-shadow"), "inset 0 0 0 1px var(--ink)");
  });
}

// ---------- what the motion may animate ----------

// DESIGN.md, "A Regra do Movimento Leve": only these are animated.
const ANIMATED = ["transform", "clip-path", "opacity", "stroke-dashoffset"];

// The parts of a value that commas separate, outside parentheses.
function partsOf(value: string): string[] {
  return value.split(/,(?![^(]*\))/).map((part) => part.trim());
}

// The properties a `transition` value names: what is left of each part after
// the times and the curves. A part with no name animates every property.
function transitionedBy(value: string): string[] {
  return partsOf(value).map((part) => {
    const names = part
      .split(/\s+(?![^(]*\))/)
      .filter(
        (word) => !/^([\d.]+m?s|ease(-in)?(-out)?|linear|step-(start|end)|.*\(.*)$/.test(word),
      );
    return names.length === 1 ? names.join("") : "all";
  });
}

function animates({ declarations }: Rule): boolean {
  return declarations.some(({ property }) => /^(animation|transition)/.test(property));
}

for (const path of EVERY_PAGE) {
  test(`${path} only animates transform, clip-path, opacity and the stroke of the traces`, async () => {
    const rules = await cssOf(path);

    const inKeyframes = rules
      .filter(({ around }) => around.at(-1)?.startsWith("@keyframes"))
      .flatMap(({ declarations }) => declarations.map(({ property }) => property));
    assert.deepEqual(
      inKeyframes.filter((property) => !ANIMATED.includes(property)),
      [],
    );

    const transitioned = rules.flatMap(({ declarations }) =>
      declarations
        .filter(({ property }) => property === "transition" || property === "transition-property")
        .flatMap(({ value }) => transitionedBy(value)),
    );
    assert.deepEqual(
      transitioned.filter((property) => !ANIMATED.includes(property)),
      [],
    );
  });
}

// ---------- reduced motion ----------

// DESIGN.md, "A Regra do Movimento Reduzido": with reduced motion asked of
// the system there is no opening, pulse, reveal or animated page change. So
// every animation lives inside the query for a system that did not ask.
for (const path of EVERY_PAGE) {
  test(`${path} has no animation left with reduced motion`, async () => {
    const moving = (await cssOf(path)).filter(
      (rule) =>
        animates(rule) ||
        rule.prelude.startsWith("@keyframes") ||
        rule.prelude === "@view-transition",
    );
    assert.ok(moving.length > 0, "the page has no animation at all");
    const left = moving.filter(
      ({ around }) =>
        !around.some((prelude) =>
          /^@media\b.*\(prefers-reduced-motion:\s*no-preference\)/.test(prelude),
        ),
    );
    assert.deepEqual(
      left.map(({ prelude }) => prelude),
      [],
    );
  });
}

// ---------- the JavaScript of the motion ----------

// The scripts a page sends to the browser, in order: the ones written in the
// page and the files it points to.
async function scriptsOf(html: string): Promise<string[]> {
  const scripts = [];
  for (const [, attributes = "", inline = ""] of html.matchAll(
    /<script\b([^>]*)>([\s\S]*?)<\/script>/g,
  )) {
    const src = attributes.match(/\bsrc="\/([^"]*)"/)?.[1];
    scripts.push(src === undefined ? inline : await page(src));
  }
  return scripts;
}

// The pages with the motion "Traçado": the plan and the pages with sections.
const MOVING_PAGES = EVERY_PAGE.filter((path) => !READING_PAGES.includes(path));

test("the JavaScript of the motion is a file of the site, in src/scripts", async () => {
  assert.deepEqual(await readdir(`${root}src/scripts`), ["motion.ts"]);
});

// DESIGN.md, "A Regra do Movimento Leve": about 6 kB of JavaScript is the
// ceiling. The count is of everything the page sends, without compression.
const CEILING = 6 * 1024;

for (const path of MOVING_PAGES) {
  test(`${path} sends the motion, in no more than 6 kB of JavaScript`, async () => {
    const scripts = await scriptsOf(await page(path));
    assert.ok(
      scripts.some((script) => script.includes("IntersectionObserver")),
      "the page does not reveal its sections",
    );
    const size = scripts.reduce((sum, script) => sum + Buffer.byteLength(script), 0);
    assert.ok(size <= CEILING, `${size} bytes of JavaScript, over the ceiling of ${CEILING}`);
  });
}

test("no motion or 3D library is a dependency", async () => {
  const { dependencies = {}, devDependencies = {} } = JSON.parse(
    await readFile(`${root}package.json`, "utf8"),
  ) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  const libraries = Object.keys({ ...dependencies, ...devDependencies }).filter((name) =>
    /(^|[/@-])(gsap|motion|framer|anime|animejs|velocity|popmotion|lottie|aos|scrollreveal|lenis|locomotive|three|babylon|babylonjs|pixi|ogl|regl|spline|rive)([/.-]|$)/i.test(
      name,
    ),
  );
  assert.deepEqual(libraries, []);
});

// Runs the scripts of a page as a browser would, in a page with no elements,
// and tells what they started.
function run(scripts: string[], system: { reducedMotion: boolean }) {
  const started: string[] = [];
  const classes = new Set<string>();
  const start = (what: string) => () => {
    started.push(what);
  };
  class Observer {
    constructor() {
      started.push(this.constructor.name);
    }
    observe() {
      return undefined;
    }
  }
  const browser = {
    matchMedia: (query: string) => ({
      matches: /prefers-reduced-motion:\s*reduce/.test(query) === system.reducedMotion,
    }),
    document: {
      documentElement: {
        classList: {
          add: (name: string) => classes.add(name),
          contains: (name: string) => classes.has(name),
        },
        style: { setProperty: start("style") },
        scrollHeight: 0,
      },
      querySelector: () => null,
      querySelectorAll: () => [],
    },
    addEventListener: (type: string) => {
      started.push(`listener: ${type}`);
    },
    requestAnimationFrame: start("frame"),
    setTimeout: start("timer"),
    IntersectionObserver: class IntersectionObserver extends Observer {},
    ResizeObserver: class ResizeObserver extends Observer {},
    innerHeight: 0,
    scrollY: 0,
  };
  for (const script of scripts) runInNewContext(script, browser);
  return { started, classes: [...classes] };
}

test("with reduced motion, the JavaScript starts nothing", async () => {
  const scripts = await scriptsOf(await page(HOME.en));

  const still = run(scripts, { reducedMotion: true });
  assert.deepEqual(still.classes, []);
  // Listening to touches is not motion: it is what lets iOS show the state
  // of a touched block.
  assert.deepEqual(still.started, ["listener: touchstart"]);

  // The same scripts, on a system that did not ask for reduced motion.
  const moving = run(scripts, { reducedMotion: false });
  assert.deepEqual(moving.classes, ["motion"]);
  assert.ok(moving.started.includes("IntersectionObserver"));
  assert.ok(moving.started.includes("listener: scroll"));
});

// ---------- with JavaScript off ----------

// The selectors of a style rule.
function selectorsOf({ prelude }: Rule): string[] {
  return partsOf(prelude);
}

// Whether a rule leaves its element out of sight: transparent, or clipped
// away to nothing.
function hides({ declarations }: Rule): boolean {
  return declarations.some(
    ({ property, value }) =>
      (property === "opacity" && Number(value) === 0) ||
      (property === "clip-path" && /\b100%/.test(value)),
  );
}

// The class "motion" is put on the page by JavaScript. Everything that hides
// an element until an animation shows it, and every animation that waits for
// JavaScript, hangs on that class: with JavaScript off, nothing is hidden.
for (const path of EVERY_PAGE) {
  test(`${path} hides nothing with JavaScript off`, async () => {
    const html = await page(path);
    assert.doesNotMatch(html.match(/<html\b[^>]*>/)?.[0] ?? "", /\bclass=/);
    assert.deepEqual(tagsWith(html, "motion"), []);

    const waiting = (await cssOf(path))
      .filter((rule) => !rule.around.some((prelude) => prelude.startsWith("@keyframes")))
      .filter((rule) => hides(rule) || animates(rule))
      .flatMap(selectorsOf)
      // The page change is the browser's own, and it hides nothing.
      .filter((selector) => !selector.startsWith("::view-transition-"))
      .filter((selector) => !selector.startsWith(".motion "));
    assert.deepEqual(waiting, []);
  });
}

// ---------- where each part of the motion exists ----------

// The rules of the opening: the traces and their pulses, and the name
// letter by letter.
function openingRulesOf(rules: Rule[]): Rule[] {
  return rules.filter(
    (rule) =>
      rule.declarations.some(({ property }) => property.startsWith("stroke-dash")) ||
      /\.(traces|letter)\b/.test(rule.prelude),
  );
}

test("the opening exists on the Home page", async () => {
  for (const path of Object.values(HOME)) {
    assert.ok(openingRulesOf(await cssOf(path)).length > 0, `${path} has no opening`);
  }
});

for (const path of EVERY_PAGE.filter((path) => !Object.values(HOME).includes(path))) {
  test(`${path} does not load the opening`, async () => {
    assert.deepEqual(
      openingRulesOf(await cssOf(path)).map(({ prelude }) => prelude),
      [],
    );
  });
}

// Section 8 of the spec: the reading pages get the page change only. Not the
// opening, the pulses, the progress bar or the reveal of the sections.
for (const path of READING_PAGES) {
  test(`${path} gets the page change and no other motion`, async () => {
    const html = await page(path);
    const scripts = await scriptsOf(html);
    assert.deepEqual(
      scripts.filter((script) => /motion|IntersectionObserver|--progress/.test(script)),
      [],
    );

    const rules = await cssOf(path);
    const moving = rules
      .filter((rule) => animates(rule) || /\.motion\b|--progress/.test(rule.prelude))
      .flatMap(selectorsOf)
      .filter((selector) => !selector.startsWith("::view-transition-"));
    assert.deepEqual(moving, []);
  });
}

// The name letter by letter is made by the JavaScript, in the browser: the
// built page keeps the name whole, which is what a screen reader reads when
// the motion is off.
for (const language of ["en", "pt"] as const) {
  test(`Home (${language}): the name is written whole in the page`, async () => {
    const name = (await page(HOME[language])).match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? "";
    assert.equal(
      name
        .replace(/<br\s*\/?>/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
      "Shaihan Buenos",
    );
  });
}
