// Tests of the Writing page and of the page of a text (sections 5 and 7.3 of
// the spec). They look at the built pages: the ones in dist/, with the
// example content, and the ones of a copy of the site with some content
// files changed.
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { describe, test } from "node:test";
import { build } from "./support/copy.ts";
import { element, elements, hrefsOf, textOf } from "./support/html.ts";
import { PAGES } from "./support/phrases.ts";

const root = new URL("..", import.meta.url).pathname;

// The files of the Writing page in a build.
const LIST = { en: "writing.html", pt: "pt-br/textos.html" };

// The file of the page of a text in a build, by the slug of the version.
const TEXT = {
  en: (slug: string) => `writing/${slug}.html`,
  pt: (slug: string) => `pt-br/textos/${slug}.html`,
};

// The <main> of a page with the example content, as `npm test` has just built it.
async function examplePage(file: string): Promise<string> {
  return element(await readFile(`${root}dist/${file}`, "utf8"), "main");
}

// The language mark of a list item: the `lang` and the letters, when the
// item has one.
function languageMarkOf(item: string): string[] | null {
  return item.match(/<span[^>]*\blang="([^"]*)"[^>]*>\s*([^<]*?)\s*</)?.slice(1) ?? null;
}

// The items of a list of texts: what each one shows and where it leads.
// `captions` is the line of captions, as a visitor reads it.
function itemsOf(list: string) {
  return elements(list, "li").map((item) => {
    const [summary = "", captions = ""] = elements(item, "p");
    return {
      title: textOf(element(item, "h2")),
      href: hrefsOf(item).join(" "),
      summary: textOf(summary),
      captions: textOf(captions),
      publishedOn: captions.match(/<time datetime="([^"]*)"/)?.[1],
      mark: languageMarkOf(item),
      // The language the title, its link and the summary are marked with,
      // when it is not the language of the page.
      lang: {
        title: item.match(/<a\b[^>]*\blang="([^"]*)"/)?.[1] ?? null,
        link: item.match(/<a\b[^>]*\bhreflang="([^"]*)"/)?.[1] ?? null,
        summary: summary.match(/^<p\b[^>]*\blang="([^"]*)"/)?.[1] ?? null,
      },
    };
  });
}

// Section 5 of the spec: the list of each language shows every text, in the
// version of that language when there is one and in the original, with the
// language mark, when there is not.
test("a text without a translation is on both lists, once on each, and opens at the original", async () => {
  const href = "/writing/example-study-note-without-translation";
  const title = "[Example] An example study note without a translation";
  const inItsLanguage = { title: null, link: null, summary: null };
  const inEnglish = { title: "en", link: "en", summary: "en" };
  for (const [language, mark, lang] of [
    ["en", null, inItsLanguage],
    ["pt", ["en", "EN"], inEnglish],
  ] as const) {
    const items = itemsOf(await examplePage(LIST[language]));
    assert.deepEqual(
      items.filter((item) => item.title === title).map((item) => [item.href, item.mark, item.lang]),
      [[href, mark, lang]],
      language,
    );
  }
});

// Section 7.3 of the spec: from the most recent to the oldest, and each item
// shows the text type, the date, the title, the one-line summary, the topics
// and, when the text is in the other language, the language mark. The
// example content is in src/content/texts; the draft, the most recent of
// them, is not on the list.
const EXAMPLE_LIST = {
  en: [
    {
      title: "[Example] An example study note without a translation",
      href: "/writing/example-study-note-without-translation",
      summary: "[Example] This one-line summary stands in for the summary of a real study note.",
      captions: "study note Mar 10, 2026 AI",
      publishedOn: "2026-03-10",
      mark: null,
      lang: { title: null, link: null, summary: null },
    },
    {
      title: "[Example] An example article with a translation",
      href: "/writing/example-article-with-translation",
      summary: "[Example] This one-line summary stands in for the summary of a real article.",
      captions: "article Jan 15, 2026 backend architecture",
      publishedOn: "2026-01-15",
      mark: null,
      lang: { title: null, link: null, summary: null },
    },
  ],
  pt: [
    {
      title: "[Example] An example study note without a translation",
      href: "/writing/example-study-note-without-translation",
      summary: "[Example] This one-line summary stands in for the summary of a real study note.",
      captions: "nota de estudo 10 de mar. de 2026 IA EN",
      publishedOn: "2026-03-10",
      mark: ["en", "EN"],
      lang: { title: "en", link: "en", summary: "en" },
    },
    {
      title: "[Exemplo] Um artigo de exemplo com tradução",
      href: "/pt-br/textos/exemplo-de-artigo-com-traducao",
      summary:
        "[Exemplo] Este resumo de uma linha ocupa o lugar do resumo de um artigo de verdade.",
      captions: "artigo 15 de jan. de 2026 backend arquitetura",
      publishedOn: "2026-01-15",
      mark: null,
      lang: { title: null, link: null, summary: null },
    },
  ],
};

for (const language of ["en", "pt"] as const) {
  test(`Writing (${language}) lists the texts from the most recent to the oldest, with what each item shows`, async () => {
    const list = await examplePage(LIST[language]);
    assert.equal(textOf(element(list, "h1")), { en: "Writing", pt: "Textos" }[language]);
    assert.deepEqual(itemsOf(list), EXAMPLE_LIST[language]);
  });
}

// The pages of texts a build wrote under the prefix of each language.
async function textPagesIn(dist: string): Promise<{ en: string[]; pt: string[] }> {
  return {
    en: (await readdir(`${dist}/writing`)).sort(),
    pt: (await readdir(`${dist}/pt-br/textos`)).sort(),
  };
}

// Section 5 of the spec: each version of a text has a single address, under
// the prefix of its language and with words of its language. The example
// article has the two versions; the example study note, only the English one.
test("a translated text has one address per language, and no text is copied under the other prefix", async () => {
  assert.deepEqual(await textPagesIn(`${root}dist`), {
    en: ["example-article-with-translation.html", "example-study-note-without-translation.html"],
    pt: ["exemplo-de-artigo-com-traducao.html"],
  });
});

// The top of the page of a text: the title, the one-line summary and the
// line of captions, as a visitor reads them, with the days the captions mark.
function topOf(page: string) {
  const top = element(page, "header");
  const [summary = "", captions = ""] = elements(top, "p");
  return {
    title: textOf(element(top, "h1")),
    summary: textOf(summary),
    captions: textOf(captions),
    days: [...captions.matchAll(/<time datetime="([^"]*)"/g)].map(([, day]) => day),
  };
}

// Section 7.3 of the spec: the title, the text type, the date, the date of
// the content revision when there is one, and the topics.
test("the page of a text shows the title, the type, the date, the revision date and the topics", async () => {
  assert.deepEqual(topOf(await examplePage(TEXT.en("example-article-with-translation"))), {
    title: "[Example] An example article with a translation",
    summary: "[Example] This one-line summary stands in for the summary of a real article.",
    captions: "article Jan 15, 2026 updated on Feb 3, 2026 backend architecture",
    days: ["2026-01-15", "2026-02-03"],
  });
  assert.deepEqual(topOf(await examplePage(TEXT.pt("exemplo-de-artigo-com-traducao"))), {
    title: "[Exemplo] Um artigo de exemplo com tradução",
    summary: "[Exemplo] Este resumo de uma linha ocupa o lugar do resumo de um artigo de verdade.",
    captions: "artigo 15 de jan. de 2026 atualizado em 3 de fev. de 2026 backend arquitetura",
    days: ["2026-01-15", "2026-02-03"],
  });
});

test("a text that had no content revision shows only the publication date", async () => {
  const top = topOf(await examplePage(TEXT.en("example-study-note-without-translation")));
  assert.equal(top.captions, "study note Mar 10, 2026 AI");
  assert.deepEqual(top.days, ["2026-03-10"]);
});

// The Studies page is the list of studies of the language (issue #9).
test("a text that came from a study names it, with a link to the studies", async () => {
  const page = await examplePage(TEXT.en("example-study-note-without-translation"));
  const study = element(page.slice(page.indexOf('<div class="prose">')), "dl");
  assert.equal(textOf(element(study, "dt")), "source study");
  assert.equal(textOf(element(study, "dd")), "[Example] A study in progress");
  assert.deepEqual(hrefsOf(study), ["/studies"]);
});

test("a text that came from no study names none", async () => {
  const page = await examplePage(TEXT.pt("exemplo-de-artigo-com-traducao"));
  assert.equal(elements(page, "dl").length, 0);
  assert.doesNotMatch(textOf(page), /estudo de origem/);
});

// The body comes from the Markdown file of the version. The plugin of the
// project stories leaves it alone: no sections, and a link may leave the site.
test("the body of a text is its Markdown, as written", async () => {
  const page = await examplePage(TEXT.en("example-article-with-translation"));
  const body = page.slice(page.indexOf("</header>"));
  assert.match(body, /^<\/header>\s*<div class="prose">/);
  assert.match(textOf(body), /^This article is a made-up example\./);
  assert.deepEqual(elements(body, "h2").map(textOf), ["An example heading"]);
  assert.ok(hrefsOf(body).includes("https://example.com"));
  assert.equal(elements(body, "section").length, 0);
  // DESIGN.md: code sits on the grey of the site, with no colors of its own.
  const code = element(body, "pre");
  assert.equal(textOf(code), 'const example = "this is only an example";');
  assert.doesNotMatch(code, /\bstyle="/);
});

// The translation note of the page of a text, when it has one: what a
// visitor reads and where its link leads, with the language the link names.
function translationNoteOf(page: string) {
  const note = elements(element(page, "header"), "p").at(2);
  if (note === undefined) return null;
  return {
    text: textOf(note),
    original: hrefsOf(note),
    hreflang: note.match(/\bhreflang="([^"]*)"/)?.[1],
  };
}

// Section 5 of the spec: every translation carries the translation note,
// with the original language, a link to the original and the notice when
// the translation was made with AI.
test("a translation shows the translation note, and the original shows none", async () => {
  const translation = await examplePage(TEXT.pt("exemplo-de-artigo-com-traducao"));
  assert.deepEqual(translationNoteOf(translation), {
    text: "Traduzido do inglês. Esta tradução foi feita com IA. Ler o original",
    original: ["/writing/example-article-with-translation"],
    hreflang: "en",
  });

  const original = await examplePage(TEXT.en("example-article-with-translation"));
  assert.equal(translationNoteOf(original), null);
});

// Section 6 of the spec: a draft is shown only in the dev server. The
// example draft is the most recent of the example texts.
test("a draft is on no list and gets no page in a build", async () => {
  for (const language of ["en", "pt"] as const) {
    const titles = itemsOf(await examplePage(LIST[language])).map(({ title }) => title);
    assert.equal(titles.length, 2, language);
    assert.ok(!titles.includes("[Example] An example draft"), language);
  }
  const pages = await textPagesIn(`${root}dist`);
  assert.ok(!pages.en.includes("example-draft.html"));
  assert.ok(!pages.pt.includes("example-draft.html"));
});

// Section 7.3 of the spec: no filters, no search and no comments. Inside the
// frame, the pages have nothing to type in, to press or to load from outside.
for (const [name, file] of [
  ["Writing (en)", LIST.en],
  ["Writing (pt)", LIST.pt],
  ["the page of a text (en)", TEXT.en("example-article-with-translation")],
  ["the page of a text (pt)", TEXT.pt("exemplo-de-artigo-com-traducao")],
] as const) {
  test(`${name} has no filters, no search and no comments`, async () => {
    const page = await examplePage(file);
    for (const name of ["form", "input", "select", "textarea", "button", "iframe", "script"]) {
      assert.doesNotMatch(page, new RegExp(`<${name}\\b`), `the page has a <${name}>`);
    }
    // No link filters or searches the list.
    assert.deepEqual(
      hrefsOf(page).filter((href) => href.includes("?")),
      [],
    );
  });
}

describe("the texts come from the content", { concurrency: true }, () => {
  // A copy of the site with test phrases in English and three more texts:
  // the newest one, written in Portuguese and translated to English without
  // AI, one in Portuguese only, and the oldest one, in English only.
  const changed = build({
    write: {
      "pages/en.yaml": PAGES,
      "texts/newest-text/text.yaml":
        "publishedOn: 2026-05-01\nupdatedOn: 2026-06-02\ntype: article\ntopics: [career]\noriginalLanguage: pt-br\nstudy: example-completed\n",
      "texts/newest-text/pt-br.md":
        "---\ntitle: Texto mais novo\nsummary: Resumo de teste.\nslug: texto-mais-novo\n---\n\nCorpo de teste.\n",
      "texts/newest-text/en.md":
        "---\ntitle: Newest text\nsummary: Test summary.\nslug: newest-text\ntranslatedWithAI: false\n---\n\nTest body.\n",
      "texts/portuguese-only/text.yaml":
        "publishedOn: 2025-06-01\ntype: article\ntopics: [academic]\noriginalLanguage: pt-br\n",
      "texts/portuguese-only/pt-br.md":
        "---\ntitle: Só em português\nsummary: Resumo.\nslug: so-em-portugues\n---\n\nCorpo.\n",
      "texts/oldest-text/text.yaml":
        "publishedOn: 2025-01-01\ntype: study-note\ntopics: [frontend]\noriginalLanguage: en\n",
      "texts/oldest-text/en.md":
        "---\ntitle: Oldest text\nsummary: Summary.\nslug: oldest-text\n---\n\nBody.\n",
    },
  });

  async function changedPage(file: string): Promise<string> {
    return element(await (await changed).read(file), "main");
  }

  test("creating a text folder adds the item to both lists, in the order of the dates", async () => {
    const inEnglish = itemsOf(await changedPage(LIST.en));
    assert.deepEqual(
      inEnglish.map(({ href, publishedOn }) => [href, publishedOn]),
      [
        ["/writing/newest-text", "2026-05-01"],
        ["/writing/example-study-note-without-translation", "2026-03-10"],
        ["/writing/example-article-with-translation", "2026-01-15"],
        ["/pt-br/textos/so-em-portugues", "2025-06-01"],
        ["/writing/oldest-text", "2025-01-01"],
      ],
    );
    // A text only in Portuguese carries the language mark on the English list.
    assert.deepEqual(
      inEnglish.map(({ mark }) => mark),
      [null, null, null, ["pt-BR", "PT"], null],
    );
    const inPortuguese = itemsOf(await changedPage(LIST.pt));
    assert.deepEqual(
      inPortuguese.map(({ href, mark }) => [href, mark?.[1] ?? null]),
      [
        ["/pt-br/textos/texto-mais-novo", null],
        ["/writing/example-study-note-without-translation", "EN"],
        ["/pt-br/textos/exemplo-de-artigo-com-traducao", null],
        ["/pt-br/textos/so-em-portugues", null],
        ["/writing/oldest-text", "EN"],
      ],
    );
  });

  test("each version of a new text gets its page, only under the prefix of its language", async () => {
    const built = await changed;
    assert.match(await built.read(TEXT.en("newest-text")), /<html lang="en">/);
    assert.match(await built.read(TEXT.pt("texto-mais-novo")), /<html lang="pt-BR">/);
    await assert.rejects(built.read(TEXT.pt("newest-text")));
    await assert.rejects(built.read(TEXT.en("texto-mais-novo")));
    await assert.rejects(built.read(TEXT.pt("oldest-text")));
    await assert.rejects(built.read(TEXT.en("so-em-portugues")));
  });

  test("the names of the type and of the topics, and the phrases of the page, come from the phrases file", async () => {
    const newest = itemsOf(await changedPage(LIST.en)).at(0);
    assert.equal(newest?.captions, "test article May 1, 2026 test career");

    const page = await changedPage(TEXT.en("newest-text"));
    assert.equal(
      topOf(page).captions,
      "test article May 1, 2026 test revised on Jun 2, 2026 test career",
    );
    const study = element(page, "dl");
    assert.equal(textOf(element(study, "dt")), "test source study");
    assert.equal(textOf(element(study, "dd")), "[Example] A completed study");
  });

  test("a translation made without AI carries the note without the notice", async () => {
    assert.deepEqual(translationNoteOf(await changedPage(TEXT.en("newest-text"))), {
      text: "Test translated from. Test read the original",
      original: ["/pt-br/textos/texto-mais-novo"],
      hreflang: "pt-BR",
    });
    assert.equal(translationNoteOf(await changedPage(TEXT.pt("texto-mais-novo"))), null);
  });

  // The two versions are linked to each other by the language button.
  test("the language button of each version of a text leads to the other version", async () => {
    const built = await changed;
    function languageButtonOf(html: string): string[] {
      return hrefsOf(element(element(html, "nav"), "div"));
    }
    assert.deepEqual(languageButtonOf(await built.read(TEXT.en("newest-text"))), [
      "/pt-br/textos/texto-mais-novo",
    ]);
    assert.deepEqual(languageButtonOf(await built.read(TEXT.pt("texto-mais-novo"))), [
      "/writing/newest-text",
    ]);
    assert.deepEqual(languageButtonOf(await built.read(TEXT.en("oldest-text"))), ["/pt-br/textos"]);
  });
});
