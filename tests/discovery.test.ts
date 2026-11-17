// Tests of discovery (section 9 of the spec): the feeds, what each page says
// about itself in the <head>, the share images, the site map and robots.txt.
// They look at what `npm test` has just built, in dist/, and at copies of the
// site with some content files changed.
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { describe, test } from "node:test";
import { build } from "./support/copy.ts";
import { elements, textOf } from "./support/html.ts";

const root = new URL("..", import.meta.url).pathname;

const SITE = "https://shaihanbuenos.dev";

function built(file: string): Promise<string> {
  return readFile(`${root}dist/${file}`, "utf8");
}

// ---------- the feeds ----------

const FEED = { en: "rss.xml", pt: "pt-br/rss.xml" };

// What is inside the first element with this name, as a feed reader gets it.
function inside(xml: string, name: string): string | undefined {
  const found = xml.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`))?.[1];
  if (found === undefined) return undefined;
  const cdata = found.match(/^<!\[CDATA\[([\s\S]*)\]\]>$/)?.[1];
  if (cdata !== undefined) return cdata;
  return found
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");
}

// The items of a feed, in the order they appear.
function itemsOf(xml: string) {
  return elements(xml, "item").map((item) => ({
    title: inside(item, "title"),
    link: inside(item, "link"),
    id: inside(item, "guid"),
    type: inside(item, "category"),
    summary: inside(item, "description"),
    publishedOn: inside(item, "pubDate"),
    updatedOn: inside(item, "atom:updated"),
    body: inside(item, "content:encoded") ?? "",
  }));
}

// The example texts are in src/content/texts: a study note written in
// English, without a translation, an article written in English with a
// translation, and a draft, the most recent of the three.
const NOTE = `${SITE}/writing/example-study-note-without-translation`;
const ARTICLE = `${SITE}/writing/example-article-with-translation`;
const ARTICLE_IN_PORTUGUESE = `${SITE}/pt-br/textos/exemplo-de-artigo-com-traducao`;

// Section 9 of the spec: every text once, articles and study notes together,
// each one in the version of the feed's language when there is one and in the
// original when there is not.
test("the English feed has every text once, with the text type, from the most recent to the oldest", async () => {
  const items = itemsOf(await built(FEED.en));
  assert.deepEqual(
    items.map(({ body, ...item }) => ({ ...item, body: body.length > 0 })),
    [
      {
        title: "[Example] An example study note without a translation",
        link: NOTE,
        id: NOTE,
        type: "study note",
        summary: "[Example] This one-line summary stands in for the summary of a real study note.",
        publishedOn: "Tue, 10 Mar 2026 00:00:00 GMT",
        updatedOn: undefined,
        body: true,
      },
      {
        title: "[Example] An example article with a translation",
        link: ARTICLE,
        id: ARTICLE,
        type: "article",
        summary: "[Example] This one-line summary stands in for the summary of a real article.",
        publishedOn: "Thu, 15 Jan 2026 00:00:00 GMT",
        updatedOn: "2026-02-03T00:00:00Z",
        body: true,
      },
    ],
  );
});

test("the Portuguese feed has the same texts: the translation when there is one, the original when there is not", async () => {
  const items = itemsOf(await built(FEED.pt));
  assert.deepEqual(
    items.map(({ title, link, id, type }) => ({ title, link, id, type })),
    [
      {
        title: "[Example] An example study note without a translation",
        link: NOTE,
        id: NOTE,
        type: "nota de estudo",
      },
      {
        title: "[Exemplo] Um artigo de exemplo com tradução",
        link: ARTICLE_IN_PORTUGUESE,
        // The same text has the same identifier in both feeds.
        id: ARTICLE,
        type: "artigo",
      },
    ],
  );
});

test("a feed item has the whole text, with the addresses written in full", async () => {
  const article = itemsOf(await built(FEED.en)).at(1);
  assert.ok(article);
  assert.match(textOf(article.body), /^This article is a made-up example\./);
  assert.deepEqual(elements(article.body, "h2").map(textOf), ["An example heading"]);
  assert.equal(
    textOf(elements(article.body, "pre").at(0) ?? ""),
    'const example = "this is only an example";',
  );
  // Nothing in the body depends on the page it came from.
  assert.deepEqual(
    [...article.body.matchAll(/\b(?:href|src)="([^"]*)"/g)]
      .map(([, address = ""]) => address)
      .filter((address) => !/^(https?:|mailto:)/.test(address)),
    [],
  );
});

// Section 5 of the spec: every translation carries the translation note.
test("a translation in a feed carries the translation note, with the link to the original", async () => {
  const translation = itemsOf(await built(FEED.pt)).at(1);
  assert.ok(translation);
  const note = elements(translation.body, "p").at(0) ?? "";
  assert.equal(textOf(note), "Traduzido do inglês. Esta tradução foi feita com IA. Ler o original");
  assert.match(note, new RegExp(`<a href="${ARTICLE}" hreflang="en">`));
  assert.match(textOf(translation.body), /Este artigo é um exemplo inventado\./);

  const original = itemsOf(await built(FEED.en)).at(1);
  assert.doesNotMatch(original?.body ?? "", /Translated from/);
});

test("a draft is in no feed", async () => {
  for (const feed of Object.values(FEED)) {
    const xml = await built(feed);
    assert.equal(itemsOf(xml).length, 2, feed);
    assert.doesNotMatch(xml, /draft/i, feed);
  }
});

// What a feed reader needs from the feed itself. A real feed validator is
// the one that says whether the format is followed; this keeps the structure
// from breaking between two validations.
for (const [language, feed, address, list, lang] of [
  ["en", FEED.en, `${SITE}/rss.xml`, `${SITE}/writing`, "en"],
  ["pt", FEED.pt, `${SITE}/pt-br/rss.xml`, `${SITE}/pt-br/textos`, "pt-BR"],
] as const) {
  test(`the feed (${language}) names itself, its language and the list of texts`, async () => {
    const xml = await built(feed);
    assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>\n<rss version="2\.0"[^>]*>/);
    const channel = xml.slice(0, xml.indexOf("<item>"));
    assert.equal(
      inside(channel, "title"),
      { en: "Shaihan Buenos · Writing", pt: "Shaihan Buenos · Textos" }[language],
    );
    assert.equal(inside(channel, "link"), list);
    assert.equal(inside(channel, "language"), lang);
    assert.ok(inside(channel, "description"));
    assert.match(
      channel,
      new RegExp(`<atom:link href="${address}" rel="self" type="application/rss\\+xml"\\s*/>`),
    );
    // The date of the feed is the one of the last thing that changed in the
    // texts, and not the day of the build: the same content gives the same feed.
    assert.equal(inside(channel, "lastBuildDate"), "Tue, 10 Mar 2026 00:00:00 GMT");
    // Every element is closed, and nothing is left outside the item it belongs to.
    assert.equal(elements(xml, "item").length, (xml.match(/<item>/g) ?? []).length);
    assert.match(xml, /<\/channel>\n<\/rss>\n$/);
  });
}

describe("the feed follows the content", { concurrency: true }, () => {
  const NEW_NOTE = {
    "texts/new-note/text.yaml":
      "publishedOn: 2026-05-01\ntype: study-note\ntopics: [career]\noriginalLanguage: pt-br\n",
    "texts/new-note/pt-br.md":
      "---\ntitle: Nota nova\nsummary: Resumo de teste.\nslug: nota-nova\n---\n\nCorpo de teste, com um [link do site](/pt-br/sobre) e um [link do texto](#parte).\n\n## Parte\n\n![Figura de teste](./figure.svg)\n",
    "texts/new-note/figure.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" width="10" height="10"><title>Test figure</title></svg>\n`,
  };
  const ORIGINAL = `${SITE}/pt-br/textos/nota-nova`;

  // A copy of the site with one more text, written in Portuguese only.
  const before = build({ write: NEW_NOTE });

  // The same copy, later: the text got a translation and a content revision.
  const after = build({
    write: {
      ...NEW_NOTE,
      "texts/new-note/text.yaml": `${NEW_NOTE["texts/new-note/text.yaml"]}updatedOn: 2026-06-02\n`,
      "texts/new-note/pt-br.md": NEW_NOTE["texts/new-note/pt-br.md"].replace(
        "Corpo de teste",
        "Corpo revisado",
      ),
      "texts/new-note/en.md":
        "---\ntitle: New note\nsummary: Test summary.\nslug: new-note\ntranslatedWithAI: false\n---\n\nTranslated body.\n",
    },
  });

  async function itemsIn(copy: typeof before, feed: string) {
    return itemsOf(await (await copy).read(feed));
  }

  test("a new text enters both feeds, in the original where it has no translation", async () => {
    for (const feed of Object.values(FEED)) {
      const items = await itemsIn(before, feed);
      assert.equal(items.length, 3, feed);
      const newest = items.at(0);
      assert.deepEqual(
        [newest?.title, newest?.link, newest?.id, newest?.updatedOn],
        ["Nota nova", ORIGINAL, ORIGINAL, undefined],
        feed,
      );
    }
  });

  test("a link of the body that stays on the site is written in full", async () => {
    const newest = (await itemsIn(before, FEED.en)).at(0);
    assert.match(newest?.body ?? "", new RegExp(`<a href="${SITE}/pt-br/sobre">`));
    // A link to a part of the text leads to that part on the page of the text.
    assert.match(newest?.body ?? "", new RegExp(`<a href="${ORIGINAL}#parte">`));
  });

  test("an image of the text's folder is in the feed, at the address the site serves it from", async () => {
    const newest = (await itemsIn(before, FEED.en)).at(0);
    const src = newest?.body.match(/<img\b[^>]*\bsrc="([^"]*)"/)?.[1] ?? "";
    assert.match(src, new RegExp(`^${SITE}/_astro/figure\\.[\\w.-]+\\.svg$`));
    assert.match(newest?.body ?? "", /<img\b[^>]*\balt="Figura de teste"/);
    assert.match(
      await (await before).read(src.slice(SITE.length + 1)),
      /<title>Test figure<\/title>/,
    );
  });

  // Section 9 of the spec: a translation published later creates no new item.
  test("a translation created after the original creates no new item", async () => {
    const was = (await itemsIn(before, FEED.en)).at(0);
    const items = await itemsIn(after, FEED.en);
    assert.equal(items.length, 3);
    const is = items.at(0);
    assert.equal(is?.id, was?.id);
    assert.equal(is?.publishedOn, was?.publishedOn);
    // The item is the same one, now in the language of the feed.
    assert.deepEqual([is?.title, is?.link], ["New note", `${SITE}/writing/new-note`]);
    assert.equal(items.filter(({ id }) => id === ORIGINAL).length, 1);
  });

  // Section 9 of the spec: a content revision updates the item.
  test("a content revision updates the item instead of creating another", async () => {
    const was = (await itemsIn(before, FEED.pt)).at(0);
    const items = await itemsIn(after, FEED.pt);
    assert.equal(items.length, 3);
    const is = items.at(0);
    assert.deepEqual([is?.id, is?.link, is?.publishedOn], [was?.id, was?.link, was?.publishedOn]);
    assert.equal(is?.updatedOn, "2026-06-02T00:00:00Z");
    assert.match(is.body, /Corpo revisado/);
    // The feed says it changed on the day of the revision.
    const xml = await (await after).read(FEED.pt);
    assert.equal(inside(xml, "lastBuildDate"), "Tue, 02 Jun 2026 00:00:00 GMT");
  });
});

// ---------- what each page says about itself ----------

// What the <head> of a page tells search engines, feed readers and the
// sites where an address is shared.
interface Head {
  title: string | undefined;
  // The <meta> elements, by `name` or `property`.
  meta: Partial<Record<string, string>>;
  canonical: string | undefined;
  // The addresses of the same page in each language: [hreflang, address].
  alternates: [string, string][];
  // The feeds the page announces: [name, address].
  feeds: [string, string][];
  robots: string | undefined;
}

function attributesOf(tag: string): Partial<Record<string, string>> {
  return Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, name = "", value = ""]) => [
      name,
      value
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&"),
    ]),
  );
}

function headOf(html: string): Head {
  const head = html.slice(0, html.indexOf("</head>"));
  // A ">" inside a quoted value does not close the tag.
  const meta = (head.match(/<meta\b(?:[^>"]|"[^"]*")*>/g) ?? []).map(attributesOf);
  const links = (head.match(/<link\b(?:[^>"]|"[^"]*")*>/g) ?? []).map(attributesOf);
  return {
    title: head.match(/<title>([^<]*)<\/title>/)?.[1]?.replace(/&amp;/g, "&"),
    meta: Object.fromEntries(
      meta.flatMap((tag) => {
        const name = tag.name ?? tag.property;
        return name === undefined ? [] : [[name, tag.content ?? ""]];
      }),
    ),
    canonical: links.find(({ rel }) => rel === "canonical")?.href,
    alternates: links
      .filter(({ rel, hreflang }) => rel === "alternate" && hreflang !== undefined)
      .map(({ hreflang = "", href = "" }) => [hreflang, href]),
    feeds: links
      .filter(({ rel, type }) => rel === "alternate" && type === "application/rss+xml")
      .map(({ title = "", href = "" }) => [title, href]),
    robots: meta.find(({ name }) => name === "robots")?.content,
  };
}

// Every page the build wrote, as a file of dist/.
async function everyPage(): Promise<string[]> {
  const files = await readdir(`${root}dist`, { recursive: true });
  return files.filter((file) => file.endsWith(".html")).sort();
}

const NOT_FOUND = ["404.html", "pt-br/404.html"];

function languageOf(file: string): "en" | "pt" {
  return file === "pt-br.html" || file.startsWith("pt-br/") ? "pt" : "en";
}

// The address of a page, from its file: absolute, on the domain of the site
// and without a slash at the end.
function addressOf(file: string): string {
  const path = file.replace(/\.html$/, "");
  return path === "index" ? SITE : `${SITE}/${path}`;
}

// The file of a page, from its address.
function fileOf(address: string): string {
  return address === SITE ? "index.html" : `${address.slice(SITE.length + 1)}.html`;
}

const LABEL = {
  en: "Software Engineer focused on backend and AI",
  pt: "Engenheiro de software com foco em backend e IA",
};

// Section 9 of the spec: the tab title is "Page · Shaihan Buenos", and Home
// uses the name and the label. The description is the one-line summary on a
// text, and the page description on a fixed page and on a project story.
const HEADS = [
  {
    file: "index.html",
    title: `Shaihan Buenos · ${LABEL.en}`,
    description: "[Example] Description of the Home page.",
  },
  {
    file: "pt-br.html",
    title: `Shaihan Buenos · ${LABEL.pt}`,
    description: "[Exemplo] Descrição da página Início.",
  },
  {
    file: "about.html",
    title: "About · Shaihan Buenos",
    description: "[Example] Description of the About page.",
  },
  {
    file: "pt-br/sobre.html",
    title: "Sobre · Shaihan Buenos",
    description: "[Exemplo] Descrição da página Sobre.",
  },
  {
    file: "projects/example-project.html",
    title: "Example Project · Shaihan Buenos",
    description: "[Example] Description of the Example Project page.",
  },
  {
    file: "pt-br/projetos/example-project.html",
    title: "Example Project · Shaihan Buenos",
    description: "[Exemplo] Descrição da página do Example Project.",
  },
  {
    file: "writing/example-article-with-translation.html",
    title: "[Example] An example article with a translation · Shaihan Buenos",
    description: "[Example] This one-line summary stands in for the summary of a real article.",
  },
  {
    file: "pt-br/textos/exemplo-de-artigo-com-traducao.html",
    title: "[Exemplo] Um artigo de exemplo com tradução · Shaihan Buenos",
    description:
      "[Exemplo] Este resumo de uma linha ocupa o lugar do resumo de um artigo de verdade.",
  },
  {
    file: "writing/example-study-note-without-translation.html",
    title: "[Example] An example study note without a translation · Shaihan Buenos",
    description: "[Example] This one-line summary stands in for the summary of a real study note.",
  },
  {
    file: "404.html",
    title: "Page not found · Shaihan Buenos",
    description: "This address does not exist on shaihanbuenos.dev.",
  },
  {
    file: "pt-br/404.html",
    title: "Página não encontrada · Shaihan Buenos",
    description: "Este endereço não existe em shaihanbuenos.dev.",
  },
];

for (const { file, title, description } of HEADS) {
  test(`${file} has its tab title and its description`, async () => {
    const head = headOf(await built(file));
    assert.equal(head.title, title);
    assert.equal(head.meta.description, description);
    // The sites where the address is shared get the same title and description.
    assert.equal(head.meta["og:title"], title);
    assert.equal(head.meta["og:description"], description);
  });
}

test("no page leaves the build without a tab title and a description", async () => {
  const pages = await everyPage();
  assert.ok(
    pages.length >= 21,
    `expected every page of the example content, found ${pages.length}`,
  );
  for (const file of pages) {
    const head = headOf(await built(file));
    assert.match(head.title ?? "", /^(Shaihan Buenos · .+|.+ · Shaihan Buenos)$/, file);
    assert.ok((head.meta.description ?? "").trim().length > 0, `${file} has no description`);
  }
});

// Section 11 of the spec: nothing that ages. No count and no promise of
// rhythm in a description. The example descriptions have no digit at all.
test("no description has a number", async () => {
  for (const file of await everyPage()) {
    const { description = "" } = headOf(await built(file)).meta;
    assert.doesNotMatch(description, /\d/, file);
  }
});

test("each page names its canonical address: absolute, on the domain, without a slash at the end", async () => {
  for (const file of await everyPage()) {
    const head = headOf(await built(file));
    if (NOT_FOUND.includes(file)) continue;
    assert.equal(head.canonical, addressOf(file), file);
    assert.equal(head.meta["og:url"], addressOf(file), file);
  }
  assert.equal(headOf(await built("index.html")).canonical, "https://shaihanbuenos.dev");
  assert.equal(headOf(await built("pt-br.html")).canonical, "https://shaihanbuenos.dev/pt-br");
});

// "Not found" answers at every address that does not exist: it has no
// address of its own to name.
test('"not found" names no canonical address', async () => {
  for (const file of NOT_FOUND) {
    const head = headOf(await built(file));
    assert.equal(head.canonical, undefined, file);
    assert.equal(head.meta["og:url"], undefined, file);
  }
});

// Section 9 of the spec: each feed is announced in the <head> of the pages
// of its language, and only there.
test("each page announces the feed of its language, and only that one", async () => {
  const feeds = {
    en: [["Shaihan Buenos · Writing", "/rss.xml"]],
    pt: [["Shaihan Buenos · Textos", "/pt-br/rss.xml"]],
  };
  for (const file of await everyPage()) {
    assert.deepEqual(headOf(await built(file)).feeds, feeds[languageOf(file)], file);
  }
});

// ---------- hreflang ----------

// Section 5 of the spec: hreflang only between pages that have an
// equivalent, both ways, with x-default on the English one.
test("a page with an equivalent names both languages, and x-default is the English one", async () => {
  for (const [en, pt] of [
    ["index.html", "pt-br.html"],
    ["studies.html", "pt-br/estudos.html"],
    ["projects/another-example-project.html", "pt-br/projetos/another-example-project.html"],
    [
      "writing/example-article-with-translation.html",
      "pt-br/textos/exemplo-de-artigo-com-traducao.html",
    ],
  ] as const) {
    const expected = [
      ["en", addressOf(en)],
      ["pt-BR", addressOf(pt)],
      ["x-default", addressOf(en)],
    ];
    assert.deepEqual(headOf(await built(en)).alternates, expected, en);
    assert.deepEqual(headOf(await built(pt)).alternates, expected, pt);
  }
});

test("hreflang is reciprocal: if a page points to another, the other points back", async () => {
  let pairs = 0;
  for (const file of await everyPage()) {
    const { alternates, canonical } = headOf(await built(file));
    const own = { en: "en", pt: "pt-BR" }[languageOf(file)];
    if (alternates.length === 0) continue;
    // A page that names another language also names itself.
    assert.deepEqual(
      alternates.filter(([lang]) => lang === own),
      [[own, canonical]],
      file,
    );
    for (const [lang, address] of alternates) {
      if (lang === "x-default" || lang === own) continue;
      const back = headOf(await built(fileOf(address))).alternates;
      assert.ok(
        back.some(([backLang, backAddress]) => backLang === own && backAddress === canonical),
        `${file} points to ${address}, which does not point back`,
      );
      pairs += 1;
    }
  }
  // The fixed pages, the project stories and the translated article, both ways.
  assert.equal(pairs, 18);
});

test("a text without a translation has no hreflang", async () => {
  const head = headOf(await built("writing/example-study-note-without-translation.html"));
  assert.deepEqual(head.alternates, []);
  assert.equal(head.canonical, NOTE);
});

test('"not found" has no hreflang', async () => {
  for (const file of NOT_FOUND) {
    assert.deepEqual(headOf(await built(file)).alternates, [], file);
  }
});

describe("the <head> of a text follows its versions", { concurrency: true }, () => {
  const TEXT = {
    "texts/new-note/text.yaml":
      "publishedOn: 2026-05-01\ntype: study-note\ntopics: [career]\noriginalLanguage: pt-br\n",
    "texts/new-note/pt-br.md":
      "---\ntitle: Nota nova\nsummary: Resumo de teste.\nslug: nota-nova\n---\n\nCorpo.\n",
  };
  const untranslated = build({ write: TEXT });
  const translated = build({
    write: {
      ...TEXT,
      "texts/new-note/en.md":
        "---\ntitle: New note\nsummary: Test summary.\nslug: new-note\ntranslatedWithAI: false\n---\n\nBody.\n",
    },
  });

  test("a text only in Portuguese has no hreflang, and gets one when the translation arrives", async () => {
    const before = headOf(await (await untranslated).read("pt-br/textos/nota-nova.html"));
    assert.deepEqual(before.alternates, []);
    assert.equal(before.meta.description, "Resumo de teste.");

    const expected = [
      ["en", `${SITE}/writing/new-note`],
      ["pt-BR", `${SITE}/pt-br/textos/nota-nova`],
      ["x-default", `${SITE}/writing/new-note`],
    ];
    const original = headOf(await (await translated).read("pt-br/textos/nota-nova.html"));
    const translation = headOf(await (await translated).read("writing/new-note.html"));
    assert.deepEqual(original.alternates, expected);
    assert.deepEqual(translation.alternates, expected);
    assert.equal(translation.title, "New note · Shaihan Buenos");
    assert.equal(translation.meta.description, "Test summary.");
  });
});

// ---------- the share images ----------

// The width and the height of a PNG file, read from its header.
async function pngSizeOf(file: string): Promise<{ width: number; height: number }> {
  const bytes = await readFile(`${root}dist/${file}`);
  assert.equal(bytes.subarray(1, 4).toString("latin1"), "PNG", `${file} is not a PNG`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

// Section 9 of the spec: one image per text and per language it has a
// version in, one per project and per language, and a default one per
// language for the fixed pages.
test("the build writes one share image per text version, per project story and per language", async () => {
  const files = await readdir(`${root}dist/share`, { recursive: true });
  assert.deepEqual(files.filter((file) => file.endsWith(".png")).sort(), [
    "default.png",
    "projects/another-example-project.png",
    "projects/example-project.png",
    "pt-br/default.png",
    "pt-br/projetos/another-example-project.png",
    "pt-br/projetos/example-project.png",
    "pt-br/textos/exemplo-de-artigo-com-traducao.png",
    "writing/example-article-with-translation.png",
    "writing/example-study-note-without-translation.png",
  ]);
});

const SHARE_IMAGES = [
  ["index.html", "share/default.png", `Shaihan Buenos · ${LABEL.en} · shaihanbuenos.dev`],
  ["research.html", "share/default.png", `Shaihan Buenos · ${LABEL.en} · shaihanbuenos.dev`],
  ["404.html", "share/default.png", `Shaihan Buenos · ${LABEL.en} · shaihanbuenos.dev`],
  ["pt-br.html", "share/pt-br/default.png", `Shaihan Buenos · ${LABEL.pt} · shaihanbuenos.dev`],
  [
    "pt-br/textos.html",
    "share/pt-br/default.png",
    `Shaihan Buenos · ${LABEL.pt} · shaihanbuenos.dev`,
  ],
  [
    "projects/example-project.html",
    "share/projects/example-project.png",
    "Example Project · shaihanbuenos.dev",
  ],
  [
    "pt-br/projetos/another-example-project.html",
    "share/pt-br/projetos/another-example-project.png",
    "Another Example Project · shaihanbuenos.dev",
  ],
  [
    "writing/example-article-with-translation.html",
    "share/writing/example-article-with-translation.png",
    "[Example] An example article with a translation · article · shaihanbuenos.dev",
  ],
  [
    "pt-br/textos/exemplo-de-artigo-com-traducao.html",
    "share/pt-br/textos/exemplo-de-artigo-com-traducao.png",
    "[Exemplo] Um artigo de exemplo com tradução · artigo · shaihanbuenos.dev",
  ],
  [
    "writing/example-study-note-without-translation.html",
    "share/writing/example-study-note-without-translation.png",
    "[Example] An example study note without a translation · study note · shaihanbuenos.dev",
  ],
] as const;

for (const [file, image, alt] of SHARE_IMAGES) {
  test(`${file} points to its share image, ${image}`, async () => {
    const { meta } = headOf(await built(file));
    assert.equal(meta["og:image"], `${SITE}/${image}`);
    assert.equal(meta["og:image:alt"], alt);
    // The card: the large image, the same one.
    assert.equal(meta["twitter:card"], "summary_large_image");
    assert.equal(meta["twitter:image"], `${SITE}/${image}`);
    assert.equal(meta["twitter:image:alt"], alt);
  });
}

test("every page points to a share image the build wrote, of 1200 by 630, and says its size", async () => {
  for (const file of await everyPage()) {
    const { meta } = headOf(await built(file));
    const image = meta["og:image"] ?? "";
    assert.ok(image.startsWith(`${SITE}/share/`), `${file} points to ${image}`);
    assert.deepEqual(
      await pngSizeOf(image.slice(SITE.length + 1)),
      { width: 1200, height: 630 },
      image,
    );
    assert.deepEqual(
      [meta["og:image:width"], meta["og:image:height"], meta["og:image:type"]],
      ["1200", "630", "image/png"],
      file,
    );
    assert.ok((meta["og:image:alt"] ?? "").length > 0, `${file} has no alternative text`);
  }
});

// Generated in the build, without an outside service: nothing a page shows
// to the sites where it is shared comes from another domain.
test("no page points to an image outside the site", async () => {
  for (const file of await everyPage()) {
    const { meta } = headOf(await built(file));
    for (const name of ["og:image", "twitter:image"]) {
      assert.ok(meta[name]?.startsWith(`${SITE}/`), `${file}: ${name} is ${meta[name]}`);
    }
  }
});

// ---------- the site map and robots.txt ----------

function locationsOf(siteMap: string): string[] {
  return elements(siteMap, "loc").map(textOf);
}

// Section 9 of the spec: the site map has every page of both languages.
// "Not found" is not a page to be found.
test('the site map lists every page of both languages, except "not found"', async () => {
  const siteMap = await built("sitemap.xml");
  assert.match(
    siteMap,
    /^<\?xml version="1\.0" encoding="UTF-8"\?>\n<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/,
  );
  const pages = (await everyPage()).filter((file) => !NOT_FOUND.includes(file));
  assert.deepEqual(locationsOf(siteMap).sort(), pages.map(addressOf).sort());
  // The address in the site map is the one the page names as canonical.
  for (const file of pages) {
    assert.ok(locationsOf(siteMap).includes(headOf(await built(file)).canonical ?? ""), file);
  }
});

test("no draft is in the site map", async () => {
  assert.doesNotMatch(await built("sitemap.xml"), /draft/);
});

test("the site map says when a text and a project story last changed", async () => {
  const siteMap = await built("sitemap.xml");
  const changes = new Map(
    elements(siteMap, "url").map((url) => [inside(url, "loc"), inside(url, "lastmod")]),
  );
  // The content revision of the article, and the publication of the note.
  assert.equal(changes.get(ARTICLE), "2026-02-03");
  assert.equal(changes.get(ARTICLE_IN_PORTUGUESE), "2026-02-03");
  assert.equal(changes.get(NOTE), "2026-03-10");
  assert.equal(changes.get(`${SITE}/projects/example-project`), "2026-05-20");
  // A fixed page is updated in place, without a date.
  assert.equal(changes.get(`${SITE}/about`), undefined);
});

// Section 9 of the spec: AI robots are allowed, and there is no llms.txt.
test("robots.txt allows every robot, AI ones included, and points to the site map", async () => {
  const robots = await built("robots.txt");
  assert.equal(robots, `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
  assert.doesNotMatch(robots, /Disallow/i);
});

test("there is no llms.txt", async () => {
  const files = await readdir(`${root}dist`, { recursive: true });
  assert.deepEqual(
    files.filter((file) => /llms/i.test(file)),
    [],
  );
});

// ---------- the structured data ----------

// The structured data of a page: every JSON-LD block of the <head>, read as
// a search engine reads it.
function structuredDataOf(html: string): Record<string, unknown>[] {
  const head = html.slice(0, html.indexOf("</head>"));
  return [...head.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(
    ([, json = ""]) => {
      const data = JSON.parse(json) as Record<string, unknown> | Record<string, unknown>[];
      return Array.isArray(data) ? data : [data];
    },
  );
}

const PERSON = {
  "@type": "Person",
  "@id": `${SITE}/#person`,
  name: "Shaihan Buenos",
  url: SITE,
};

// Section 9 of the spec: structured data of a person on Home, with what the
// content says: the label, the intro and the contact.
for (const [language, file, address, intro, lang] of [
  [
    "en",
    "index.html",
    SITE,
    "I build backend services and systems that use LLMs, and I write code with AI agents guided by specs.",
    "en",
  ],
  [
    "pt",
    "pt-br.html",
    `${SITE}/pt-br`,
    "Construo serviços de backend e sistemas que usam LLMs, e programo com agentes de IA guiados por especificação.",
    "pt-BR",
  ],
] as const) {
  test(`Home (${language}) has the structured data of a person, from the content`, async () => {
    assert.deepEqual(structuredDataOf(await built(file)), [
      {
        "@context": "https://schema.org",
        ...PERSON,
        jobTitle: LABEL[language],
        description: intro,
        email: "mailto:hi@shaihanbuenos.dev",
        sameAs: ["https://www.linkedin.com/in/shaihanbuenos/", "https://github.com/ShaihanBuenos"],
        mainEntityOfPage: { "@type": "ProfilePage", "@id": address, inLanguage: lang },
      },
    ]);
  });
}

// Structured data of an article on a text, with the dates, the topics and
// the text type of the content.
test("a text has the structured data of an article, from the content", async () => {
  assert.deepEqual(
    structuredDataOf(await built("pt-br/textos/exemplo-de-artigo-com-traducao.html")),
    [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "[Exemplo] Um artigo de exemplo com tradução",
        description:
          "[Exemplo] Este resumo de uma linha ocupa o lugar do resumo de um artigo de verdade.",
        url: ARTICLE_IN_PORTUGUESE,
        mainEntityOfPage: ARTICLE_IN_PORTUGUESE,
        inLanguage: "pt-BR",
        datePublished: "2026-01-15",
        dateModified: "2026-02-03",
        articleSection: "artigo",
        keywords: ["backend", "arquitetura"],
        image: `${SITE}/share/pt-br/textos/exemplo-de-artigo-com-traducao.png`,
        author: PERSON,
      },
    ],
  );
});

test("a text that had no content revision was last changed on the day it was published", async () => {
  const article = structuredDataOf(
    await built("writing/example-study-note-without-translation.html"),
  ).at(0);
  assert.deepEqual(
    [article?.["@type"], article?.datePublished, article?.dateModified, article?.articleSection],
    ["Article", "2026-03-10", "2026-03-10", "study note"],
  );
});

test("only Home and the texts have structured data", async () => {
  const withData = [];
  for (const file of await everyPage()) {
    if (structuredDataOf(await built(file)).length > 0) withData.push(file);
  }
  assert.deepEqual(withData, [
    "index.html",
    "pt-br.html",
    "pt-br/textos/exemplo-de-artigo-com-traducao.html",
    "writing/example-article-with-translation.html",
    "writing/example-study-note-without-translation.html",
  ]);
});

// A title of the content may have anything in it: the structured data stays
// valid JSON and does not close the element it is in.
describe("the structured data holds any title", () => {
  const TITLE = `Um </script> "título" & <b>tanto</b>`;
  const tricky = build({
    write: {
      "texts/tricky/text.yaml":
        "publishedOn: 2026-05-01\ntype: article\ntopics: [ai]\noriginalLanguage: pt-br\n",
      "texts/tricky/pt-br.md": `---\ntitle: '${TITLE}'\nsummary: Resumo.\nslug: titulo-dificil\n---\n\nCorpo.\n`,
    },
  });

  test("a title with quotes and tags is the headline, as written", async () => {
    const html = await (await tricky).read("pt-br/textos/titulo-dificil.html");
    const article = structuredDataOf(html).at(0);
    assert.equal(article?.headline, TITLE);
    assert.equal(headOf(html).meta["og:title"], `${TITLE} · Shaihan Buenos`);
    // The feed carries the same title.
    const newest = itemsOf(await (await tricky).read(FEED.pt)).at(0);
    assert.equal(newest?.title, TITLE);
  });
});

// ---------- launch day ----------

// On launch day the only change is the switch in src/lib/config.ts. A copy
// of the site with the switch on shows what the day leaves behind.
describe("on launch day", () => {
  const launched = build({
    write: { "../lib/config.ts": "export const INDEXABLE: boolean = true;\n" },
  });

  test('every page can be indexed, except "not found"', async () => {
    const site = await launched;
    const marked = [];
    for (const file of await everyPage()) {
      if (headOf(await site.read(file)).robots?.includes("noindex")) marked.push(file);
    }
    assert.deepEqual(marked, NOT_FOUND);
  });
});
