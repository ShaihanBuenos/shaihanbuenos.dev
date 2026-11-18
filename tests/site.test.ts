// Tests of the built site: they serve the result of `astro build` (the dist/
// folder) and request each address over HTTP, as a visitor would.
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { preview } from "astro";

const root = new URL("..", import.meta.url).pathname;

let origin: string;
let stop: () => Promise<void>;

before(async () => {
  const server = await preview({
    root,
    logLevel: "silent",
    server: { port: 4391 },
  });
  origin = `http://localhost:${server.port}`;
  stop = () => server.stop();
});

after(() => stop());

function langOf(html: string): string | undefined {
  return html.match(/<html[^>]*\blang="([^"]*)"/)?.[1];
}

// Requests the exact address, without following redirects: the address in
// the spec has to answer by itself.
function request(path: string): Promise<Response> {
  return fetch(`${origin}${path}`, { redirect: "manual" });
}

// Section 4 of the spec: the addresses of the fixed pages, in both languages.
const PAGES = [
  { page: "Home", en: "/", pt: "/pt-br" },
  { page: "Projects", en: "/projects", pt: "/pt-br/projetos" },
  { page: "Writing", en: "/writing", pt: "/pt-br/textos" },
  { page: "Studies", en: "/studies", pt: "/pt-br/estudos" },
  { page: "Research", en: "/research", pt: "/pt-br/pesquisa" },
  { page: "About", en: "/about", pt: "/pt-br/sobre" },
];

// Section 4 of the spec: a project story lives under the Projects page of
// its language, and the name of the project's folder closes the address.
const STORIES = ["out-of-the-rabbit-hole", "beto", "another-example-project"].map((project) => ({
  page: `The story of ${project}`,
  en: `/projects/${project}`,
  pt: `/pt-br/projetos/${project}`,
}));

// Section 5 of the spec: each version of a text lives under the Writing page
// of its language, at its own slug. The example article has both versions.
const TRANSLATED_TEXT = {
  page: "The example article",
  en: "/writing/example-article-with-translation",
  pt: "/pt-br/textos/exemplo-de-artigo-com-traducao",
};

// The example study note was written in English and has no translation.
const UNTRANSLATED_TEXT = "/writing/example-study-note-without-translation";

test(`The example study note answers in English at ${UNTRANSLATED_TEXT}`, async () => {
  const response = await request(UNTRANSLATED_TEXT);
  assert.equal(response.status, 200);
  assert.equal(langOf(await response.text()), "en");
});

for (const { page, en, pt } of [...PAGES, ...STORIES, TRANSLATED_TEXT]) {
  test(`${page} answers in English at ${en}`, async () => {
    const response = await request(en);
    assert.equal(response.status, 200);
    assert.equal(langOf(await response.text()), "en");
  });

  test(`${page} answers in Portuguese at ${pt}`, async () => {
    const response = await request(pt);
    assert.equal(response.status, 200);
    assert.equal(langOf(await response.text()), "pt-BR");
  });
}

// The links of a piece of HTML, in the order they appear: the attributes and
// the text of each one.
interface Link {
  attributes: Record<string, string>;
  text: string;
}

function linksOf(html: string): Link[] {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(([, opening = "", inner = ""]) => ({
    attributes: Object.fromEntries(
      [...opening.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, name, value]) => [name, value]),
    ),
    text: inner.replace(/<[^>]*>/g, "").trim(),
  }));
}

// The first element with this name, with everything inside it.
function element(html: string, name: string): string {
  const found = html.match(new RegExp(`<${name}\\b[\\s\\S]*?</${name}>`))?.[0];
  assert.ok(found, `the page has no <${name}>`);
  return found;
}

// Section 4 of the spec: the menu, in order, with the name of each page in
// the language.
const MENU = {
  en: [
    { href: "/projects", text: "Projects" },
    { href: "/writing", text: "Writing" },
    { href: "/studies", text: "Studies" },
    { href: "/research", text: "Research" },
    { href: "/about", text: "About" },
  ],
  pt: [
    { href: "/pt-br/projetos", text: "Projetos" },
    { href: "/pt-br/textos", text: "Textos" },
    { href: "/pt-br/estudos", text: "Estudos" },
    { href: "/pt-br/pesquisa", text: "Pesquisa" },
    { href: "/pt-br/sobre", text: "Sobre" },
  ],
};

// Every page that exists today, with the "not found" of each language.
// `equivalent` is where the language button leads.
const ALL_PAGES = [
  ...[...PAGES, ...STORIES, TRANSLATED_TEXT].flatMap(({ page, en, pt }) => [
    { name: `${page} in English`, path: en, language: "en" as const, equivalent: pt },
    { name: `${page} in Portuguese`, path: pt, language: "pt" as const, equivalent: en },
  ]),
  // Section 4 of the spec: on a text without a translation, the language
  // button leads to the list of texts of the other language.
  {
    name: "The example study note, without a translation",
    path: UNTRANSLATED_TEXT,
    language: "en" as const,
    equivalent: "/pt-br/textos",
  },
  {
    name: '"Not found" in English',
    path: "/does-not-exist",
    language: "en" as const,
    equivalent: "/pt-br",
  },
  {
    name: '"Not found" in Portuguese',
    path: "/pt-br/404",
    language: "pt" as const,
    equivalent: "/",
  },
];

const HOME = { en: "/", pt: "/pt-br" };

for (const { name, path, language } of ALL_PAGES) {
  test(`${name} has the home button and the menu of its language`, async () => {
    const menu = linksOf(element(await (await request(path)).text(), "nav"));
    assert.equal(menu[0]?.attributes.href, HOME[language]);
    assert.deepEqual(
      menu.slice(1, 6).map(({ attributes, text }) => ({ href: attributes.href, text })),
      MENU[language],
    );
  });
}

// The menu marks the page the visitor is on; on "not found", none.
for (const { name, path } of ALL_PAGES) {
  const isFixedPage = PAGES.some(({ en, pt }) => path === en || path === pt);
  const expected = isFixedPage ? [path] : [];

  test(`${name}: the menu marks ${expected[0] ?? "no page"} as the current one`, async () => {
    const menu = linksOf(element(await (await request(path)).text(), "nav"));
    assert.deepEqual(
      menu
        .filter(({ attributes }) => attributes["aria-current"] === "page")
        .map(({ attributes }) => attributes.href),
      expected,
    );
  });
}

// A project story and a text are not on the menu: the menu marks the page
// above them, Projects or Writing.
for (const [path, above] of [
  ...STORIES.flatMap(({ en, pt }) => [
    [en, "/projects"],
    [pt, "/pt-br/projetos"],
  ]),
  [TRANSLATED_TEXT.en, "/writing"],
  [TRANSLATED_TEXT.pt, "/pt-br/textos"],
  [UNTRANSLATED_TEXT, "/writing"],
] as const) {
  test(`${path}: the menu marks ${above} as the page above it`, async () => {
    const menu = linksOf(element(await (await request(path)).text(), "nav"));
    assert.deepEqual(
      menu
        .filter(({ attributes }) => "aria-current" in attributes)
        .map(({ attributes }) => [attributes.href, attributes["aria-current"]]),
      [[above, "true"]],
    );
  });
}

// The language button: "EN" and "PT", with the current language marked and
// the other one as a link to the equivalent of the page.
const SHORT_NAME = { en: "EN", pt: "PT" };
const OTHER_LANGUAGE = { en: "pt", pt: "en" } as const;

for (const { name, path, language, equivalent } of ALL_PAGES) {
  test(`${name}: the language button leads to ${equivalent}`, async () => {
    const menu = element(await (await request(path)).text(), "nav");
    const other = OTHER_LANGUAGE[language];

    const toTheOther = linksOf(menu).filter(({ text }) => text === SHORT_NAME[other]);
    assert.deepEqual(
      toTheOther.map(({ attributes }) => attributes.href),
      [equivalent],
    );
    assert.equal(toTheOther[0]?.attributes.hreflang, { en: "en", pt: "pt-BR" }[other]);

    // Inside the button: on a project story the menu also marks Projects.
    const button = element(menu, "div");
    const marked = button.match(/<(\w+)\b[^>]*\baria-current="true"[^>]*>([^<]*)</);
    assert.equal(marked?.[1], "span", "the current language is a link");
    assert.equal(marked[2].trim(), SHORT_NAME[language]);
  });
}

// The footer: the contact (section 7.6 of the spec) and the link to the feed
// of the language.
const CONTACT = [
  "https://www.linkedin.com/in/shaihanbuenos/",
  "https://github.com/ShaihanBuenos",
  "mailto:hi@shaihanbuenos.dev",
];
const FEED = { en: "/rss.xml", pt: "/pt-br/rss.xml" };

for (const { name, path, language } of ALL_PAGES) {
  test(`${name} has the footer with the contact and the feed of its language`, async () => {
    const footer = linksOf(element(await (await request(path)).text(), "footer"));
    assert.deepEqual(
      footer.map(({ attributes }) => attributes.href),
      [...CONTACT, FEED[language]],
    );
  });
}

// DESIGN.md: the three fonts are served by the site itself, each one in two
// files. The test follows the CSS of a page down to the font files.
test("the fonts of the visual system are served by the site itself", async () => {
  const html = await (await request("/")).text();
  let css = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(([, c]) => c).join("\n");
  for (const [, attributes = ""] of html.matchAll(/<link\b([^>]*)>/g)) {
    const href = attributes.match(/\bhref="([^"]*)"/)?.[1];
    if (href && /\brel="stylesheet"/.test(attributes)) css += await (await request(href)).text();
  }

  const fonts = [...new Set([...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(([, u]) => u))];
  assert.equal(fonts.length, 6, `expected six font files, found ${fonts.length}`);
  for (const font of fonts) {
    assert.match(font, /^\/fonts\/[\w-]+\.woff2$/);
    assert.equal((await request(font)).status, 200, `${font} does not answer`);
  }
});

function titleOf(html: string): string | undefined {
  return html.match(/<h1[^>]*>([^<]*)<\/h1>/)?.[1];
}

test('an address that does not exist shows "not found" in English', async () => {
  const response = await request("/does-not-exist");
  const html = await response.text();
  assert.equal(response.status, 404);
  assert.equal(langOf(html), "en");
  assert.equal(titleOf(html), "Page not found");
});

// Showing this page for an address that does not exist under /pt-br is the
// host's job, which looks for the nearest 404.html. Here we check that the
// page exists where the host looks.
test('"not found" in Portuguese lives at /pt-br/404', async () => {
  const response = await request("/pt-br/404");
  const html = await response.text();
  assert.equal(langOf(html), "pt-BR");
  assert.equal(titleOf(html), "Página não encontrada");
});

// Until launch, nothing that is built may be indexed. The test looks at every
// HTML file in dist/, so it also holds for the pages still to come.
test("no built page can be indexed", async () => {
  const dist = `${root}dist`;
  const files = (await readdir(dist, { recursive: true })).filter((f) => f.endsWith(".html"));
  assert.ok(files.length >= 14, `expected the pages of section 4, found ${files.length}`);

  const indexable = [];
  for (const file of files) {
    const html = await readFile(`${dist}/${file}`, "utf8");
    const robots = html.match(/<meta[^>]*\bname="robots"[^>]*\bcontent="([^"]*)"/)?.[1] ?? "";
    if (!robots.split(/\s*,\s*/).includes("noindex")) indexable.push(file);
  }
  assert.deepEqual(indexable, []);
});

// Each feed answers in its language. What a feed has inside is checked in
// tests/discovery.test.ts.
for (const { path, language } of [
  { path: "/rss.xml", language: "en" },
  { path: "/pt-br/rss.xml", language: "pt-br" },
]) {
  test(`The feed answers at ${path} in the language ${language}`, async () => {
    const response = await request(path);
    const xml = await response.text();
    assert.equal(response.status, 200);
    assert.match(xml, /^<\?xml[^>]*\?>\s*<rss\b/);
    assert.equal(xml.match(/<language>([^<]*)<\/language>/)?.[1]?.toLowerCase(), language);
  });
}

// Feeds and other files that are not HTML carry no <meta>. For them the host
// (Cloudflare) reads the _headers file and sends the header on everything.
test("what is not a page is also marked not to be indexed", async () => {
  const headers = await readFile(`${root}dist/_headers`, "utf8");
  assert.match(headers, /^\/\*\n[ \t]+X-Robots-Tag: noindex$/m);
});
