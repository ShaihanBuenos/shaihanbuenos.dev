// Tests of the Home page (section 7.1 of the spec). They look at the built
// page: the one in dist/, with the example content, and the one of a copy of
// the site with some content files changed.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, test } from "node:test";
import { build } from "./support/copy.ts";
import { element, elements, hrefsOf, textOf } from "./support/html.ts";
import { PAGES } from "./support/phrases.ts";
import { CLINICAL_CLAIM, PLACEHOLDER, patientsNotSimulated, sentencesOf } from "./support/rules.ts";

const root = new URL("..", import.meta.url).pathname;

// The file of the Home page of each language in a build.
const HOME = { en: "index.html", pt: "pt-br.html" };

// The Home page with the example content, as `npm test` has just built it.
function exampleHome(language: keyof typeof HOME): Promise<string> {
  return readFile(`${root}dist/${HOME[language]}`, "utf8");
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

// Section 7.1 of the spec: the paper callout shows the title, "HAXD 2026,
// IEEE" and one plain sentence, without numbers. Section 11: the patients
// are always "simulated", and no text says the system diagnoses or treats.
for (const language of ["en", "pt"] as const) {
  test(`Home (${language}) calls the paper with its title, where it came out and one plain sentence, without numbers`, async () => {
    const callout = elements(
      element(element(await exampleHome(language), "main"), "section", "research"),
      "p",
    ).map(textOf);
    assert.deepEqual(callout.slice(0, 2), [
      "Integrating Large Language Models into Hypertension Care: Architecture and Prompt Tuning Evaluation",
      "HAXD 2026, IEEE",
    ]);
    const sentence = callout[2] ?? "";
    assert.equal(sentencesOf(sentence).length, 1);
    assert.doesNotMatch(sentence, PLACEHOLDER);
    assert.doesNotMatch(sentence, /\d/);
    assert.doesNotMatch(sentence, CLINICAL_CLAIM);
    assert.deepEqual(patientsNotSimulated(sentence), []);
  });
}

describe("the content of Home", { concurrency: true }, () => {
  // A copy of the site with test phrases in English, another paper, the
  // order of the projects swapped, and two more texts: the newest one, in
  // Portuguese only, and the oldest one.
  const changed = build({
    write: {
      "pages/en.yaml": PAGES,
      "research/haxd-paper.yaml": PAPER,
      "projects/out-of-the-rabbit-hole/project.yaml":
        "name: Out of the Rabbit Hole\norder: 4\nstate: works-locally\nupdatedOn: 2026-05-20\n",
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

  // The link that closes the callout leads to the paper on the Research page.
  test("the paper callout leads to the paper on the Research page", async () => {
    const callout = element(await changedHome("en"), "section", "research");
    assert.deepEqual(hrefsOf(callout), ["/research#haxd-paper"]);
    const inPortuguese = element(await changedHome("pt"), "section", "research");
    assert.deepEqual(hrefsOf(inPortuguese), ["/pt-br/pesquisa#haxd-paper"]);
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
    assert.deepEqual(projectCards(home), ["Out of the Rabbit Hole", "Betô", "Ensaio"]);
    assert.deepEqual(projectBlocks(home), [
      "/projects/out-of-the-rabbit-hole",
      "/projects/beto",
      "/projects/ensaio",
    ]);
  });

  test("changing the order of the projects in the content changes the order on the page", async () => {
    const home = await changedHome("en");
    assert.deepEqual(projectCards(home), ["Betô", "Ensaio", "Out of the Rabbit Hole"]);
    assert.deepEqual(projectBlocks(home), [
      "/projects/beto",
      "/projects/ensaio",
      "/projects/out-of-the-rabbit-hole",
    ]);
  });

  // What the card says the project is, is what the Projects page says.
  test("a project card shows the state, what the project is and leads to its story", async () => {
    const [card] = elements(element(await exampleHome("pt"), "section", "projects"), "li");
    assert.ok(card, "the section has no project card");
    assert.deepEqual(hrefsOf(card), ["/pt-br/projetos/out-of-the-rabbit-hole"]);
    assert.match(card, /<svg\b/);
    assert.match(textOf(card), /funciona localmente/);
    const list = element(await readFile(`${root}dist/pt-br/projetos.html`, "utf8"), "main");
    const whatItIs = textOf(element(element(list, "li"), "p"));
    assert.ok(whatItIs.length > 0);
    assert.ok(textOf(card).includes(whatItIs), `the card does not say: ${whatItIs}`);
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
