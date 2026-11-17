// Tests of the Home page (section 7.1 of the spec). They look at the built
// page: the one in dist/, with the example content, and the one of a copy of
// the site with some content files changed.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, test } from "node:test";
import { build } from "./support/copy.ts";
import { PAGES } from "./support/phrases.ts";

const root = new URL("..", import.meta.url).pathname;

// The file of the Home page of each language in a build.
const HOME = { en: "index.html", pt: "pt-br.html" };

// The Home page with the example content, as `npm test` has just built it.
function exampleHome(language: keyof typeof HOME): Promise<string> {
  return readFile(`${root}dist/${HOME[language]}`, "utf8");
}

// The first element with this name (and this id, when given), with
// everything inside it.
function element(html: string, name: string, id?: string): string {
  const opening = id === undefined ? `<${name}\\b` : `<${name}\\b[^>]*\\bid="${id}"`;
  const found = html.match(new RegExp(`${opening}[\\s\\S]*?</${name}>`))?.[0];
  assert.ok(found, `the page has no <${name}>${id === undefined ? "" : ` with the id "${id}"`}`);
  return found;
}

// Every element with this name, in the order they appear.
function elements(html: string, name: string): string[] {
  return html.match(new RegExp(`<${name}\\b[\\s\\S]*?</${name}>`, "g")) ?? [];
}

// What a visitor reads in a piece of HTML.
function textOf(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function hrefsOf(html: string): string[] {
  return [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)].map(([, href = ""]) => href);
}

// PRODUCT.md: the label and the intro of each language.
const OPENING = {
  en: {
    label: "Software Engineer focused on backend and AI",
    intro:
      "I build backend services and systems that use LLMs, and I write code with AI agents guided by specs.",
  },
  pt: {
    label: "Engenheiro de software com foco em backend e IA",
    intro:
      "Construo serviços de backend e sistemas que usam LLMs, e programo com agentes de IA guiados por especificação.",
  },
};

for (const language of ["en", "pt"] as const) {
  test(`Home (${language}) opens with the name, the label and the intro`, async () => {
    const opening = element(element(await exampleHome(language), "main"), "header");
    assert.equal(textOf(element(opening, "h1")), "Shaihan Buenos");
    const phrases = elements(opening, "p").map(textOf);
    assert.deepEqual(phrases, [OPENING[language].label, OPENING[language].intro]);
  });
}

// A paper with numbers in every field that the Research page shows and the
// Home page does not.
const PAPER = `type: paper
order: 1
title: Test Paper Title
venue: Test Venue
authors:
  - name: Test Author
doi: 10.0000/test
summary:
  en: Test summary with 87.5% inside.
  pt-br: Resumo de teste com 87,5% dentro.
built:
  en: Test built with 12 parts.
  pt-br: Construção de teste com 12 partes.
result:
  en: Test result of 93.4%, with the caveat.
  pt-br: Resultado de teste de 93,4%, com a ressalva.
`;

describe("Home with changed content", { concurrency: true }, () => {
  // A copy of the site with test phrases in English, another paper, the
  // order of the projects swapped, and two more texts: the newest one, in
  // Portuguese only, and the oldest one.
  const changed = build({
    write: {
      "pages/en.yaml": PAGES,
      "research/example-paper.yaml": PAPER,
      "projects/example-project/project.yaml":
        "name: Example Project\norder: 3\nstate: works-locally\nupdatedOn: 2026-05-20\n",
      "texts/newest-text/text.yaml":
        "publishedOn: 2026-05-01\ntype: article\ntopics: [backend]\noriginalLanguage: pt-br\n",
      "texts/newest-text/pt-br.md":
        "---\ntitle: Texto mais novo\nsummary: Resumo.\nslug: texto-mais-novo\n---\n\nCorpo.\n",
      "texts/oldest-text/text.yaml":
        "publishedOn: 2025-01-01\ntype: article\ntopics: [backend]\noriginalLanguage: en\n",
      "texts/oldest-text/en.md":
        "---\ntitle: Oldest text\nsummary: Summary.\nslug: oldest-text\n---\n\nBody.\n",
    },
  });

  async function changedHome(language: keyof typeof HOME): Promise<string> {
    return element(await (await changed).read(HOME[language]), "main");
  }

  test("the opening comes from the phrases file", async () => {
    const opening = element(await changedHome("en"), "header");
    assert.deepEqual(elements(opening, "p").map(textOf), ["Test label", "Test intro."]);
  });

  // Section 7.1 of the spec: the title, where it came out and one plain
  // sentence.
  test("the paper callout shows the title, the venue and the sentence from the files", async () => {
    const callout = elements(element(await changedHome("en"), "section", "research"), "p");
    assert.deepEqual(callout.slice(0, 3).map(textOf), [
      "Test Paper Title",
      "Test Venue",
      "Test paper sentence.",
    ]);
  });

  // The names on the project cards, in the order of the page.
  function projectCards(home: string): string[] {
    return elements(element(home, "section", "projects"), "h3").map(textOf);
  }

  // The project blocks of the floor plan lead to each project story.
  function projectBlocks(home: string): string[] {
    return hrefsOf(home.slice(0, home.indexOf("<section"))).filter((href) =>
      href.startsWith("/projects/"),
    );
  }

  test("the projects come in the order of the content", async () => {
    const home = element(await exampleHome("en"), "main");
    assert.deepEqual(projectCards(home), ["Example Project", "Another Example Project"]);
    assert.deepEqual(projectBlocks(home), [
      "/projects/example-project",
      "/projects/another-example-project",
    ]);
  });

  test("changing the order of the projects in the content changes the order on the page", async () => {
    const home = await changedHome("en");
    assert.deepEqual(projectCards(home), ["Another Example Project", "Example Project"]);
    assert.deepEqual(projectBlocks(home), [
      "/projects/another-example-project",
      "/projects/example-project",
    ]);
  });

  test("a project card shows the state, what the project is and leads to its story", async () => {
    const [card] = elements(element(await exampleHome("pt"), "section", "projects"), "li");
    assert.ok(card, "the section has no project card");
    assert.deepEqual(hrefsOf(card), ["/pt-br/projetos/example-project"]);
    assert.match(card, /<svg\b/);
    assert.match(textOf(card), /funciona localmente/);
    assert.match(
      textOf(card),
      /\[Exemplo\] Um projeto inventado, que ocupa o lugar de uma história do projeto de verdade\./,
    );
  });

  // The texts of the Home page: the title and the address of each one.
  function recentTexts(home: string): { title: string; href: string | undefined }[] {
    return elements(element(home, "section", "writing"), "li").map((item) => ({
      title: textOf(element(item, "strong")),
      href: hrefsOf(item)[0],
    }));
  }

  // Section 5 of the spec: a text shows in the version of the page's
  // language when there is one, and in the original when there is not.
  test("the three most recent texts are shown, each one leading to its own address", async () => {
    assert.deepEqual(recentTexts(await changedHome("en")), [
      { title: "Texto mais novo", href: "/pt-br/textos/texto-mais-novo" },
      {
        title: "[Example] An example study note without a translation",
        href: "/writing/example-study-note-without-translation",
      },
      {
        title: "[Example] An example article with a translation",
        href: "/writing/example-article-with-translation",
      },
    ]);
  });

  test("a text in the other language carries the language mark", async () => {
    const home = await changedHome("en");
    const marks = elements(element(home, "section", "writing"), "li").map(
      (item) => item.match(/<span[^>]*\blang="([^"]*)"[^>]*>\s*([^<]*?)\s*</)?.slice(1) ?? null,
    );
    assert.deepEqual(marks, [["pt-BR", "PT"], null, null]);
  });

  test("the texts show the translation where there is one, and never a draft", async () => {
    assert.deepEqual(recentTexts(element(await exampleHome("pt"), "main")), [
      {
        title: "[Example] An example study note without a translation",
        href: "/writing/example-study-note-without-translation",
      },
      {
        title: "[Exemplo] Um artigo de exemplo com tradução",
        href: "/pt-br/textos/exemplo-de-artigo-com-traducao",
      },
    ]);
  });

  test("a text shows its type and its date, and the section leads to the list", async () => {
    const section = element(element(await exampleHome("pt"), "main"), "section", "writing");
    const [note] = elements(section, "li");
    assert.ok(note);
    assert.match(textOf(note), /nota de estudo/);
    assert.match(note, /<time datetime="2026-03-10">/);
    assert.equal(hrefsOf(section).at(-1), "/pt-br/textos");
  });

  test("only the studies in progress are shown, and the section leads to the list", async () => {
    const section = element(element(await exampleHome("pt"), "main"), "section", "studies");
    assert.deepEqual(
      elements(section, "li").map((item) => textOf(element(item, "strong"))),
      ["[Exemplo] Um estudo em andamento"],
    );
    assert.match(section, /<time datetime="2026-02">/);
    assert.deepEqual(hrefsOf(section), ["/pt-br/estudos"]);
  });

  test("the bio comes from the phrases file, with a link to About", async () => {
    const section = element(await changedHome("en"), "section", "about");
    assert.equal(textOf(element(section, "p")), "Test bio.");
    assert.deepEqual(hrefsOf(section), ["/about"]);
  });

  // Section 7.1 of the spec: no counts and no numbers from the paper. The
  // changed content has no digits outside the dates and the paper's numbers,
  // so any other number on the page was put there by the page.
  for (const language of ["en", "pt"] as const) {
    test(`Home (${language}) has no numbers besides the dates`, async () => {
      const home = await changedHome(language);
      assert.match(home, /<time\b/);
      const withoutDates = home.replace(/<time\b[\s\S]*?<\/time>/g, " ");
      assert.deepEqual(textOf(withoutDates).match(/\S*\d\S*/g) ?? [], []);
    });
  }
});
