// Tests of the Research page (section 7.5 of the spec). They look at the
// built page: the one in dist/, with the content of the repo, and the one of a
// copy of the site with some content files changed.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, test } from "node:test";
import { build } from "./support/copy.ts";
import { element, elements, hrefsOf, textOf } from "./support/html.ts";
import { PAGES } from "./support/phrases.ts";
import {
  CLINICAL_CLAIM,
  PLACEHOLDER,
  forbiddenWordsIn,
  numbersWithoutTheCaveat,
  patientsNotSimulated,
  sentencesOf,
} from "./support/rules.ts";

const root = new URL("..", import.meta.url).pathname;

// The file of the Research page of each language in a build.
const RESEARCH = { en: "research.html", pt: "pt-br/pesquisa.html" };

// The <main> of the Research page with the content of the repo, as `npm test`
// has just built it.
async function examplePage(language: keyof typeof RESEARCH): Promise<string> {
  return element(await readFile(`${root}dist/${RESEARCH[language]}`, "utf8"), "main");
}

// The research items of the page, in the order they appear.
function itemsOf(page: string): string[] {
  return elements(page, "article");
}

// The title of a research item: what a visitor reads, and the part of it
// marked as written in another language than the page's.
function titleOf(item: string) {
  const title = element(item, "h2");
  const foreign = title.match(/<span[^>]*\blang="([^"]*)"[^>]*>([^<]*)</);
  return {
    text: textOf(title),
    foreign: foreign ? { lang: foreign[1], text: foreign[2] } : null,
  };
}

// The titles of the two works, as each one was published or delivered.
const PAPER_TITLE =
  "Integrating Large Language Models into Hypertension Care: Architecture and Prompt Tuning Evaluation";
const THESIS_TITLE =
  "Inteligência Artificial Aplicada ao Desenvolvimento e Treinamento de Chatbots para Monitoramento de Saúde";

// The names of the files in src/content/research: the id of each item.
const PAPER_ID = "haxd-paper";
const THESIS_ID = "unisinos-thesis";

// Section 7.5 of the spec: the paper first, in the original English, and the
// thesis below it, in Portuguese, with the translation in parentheses on the
// English page.
test("Research shows, in both languages, the paper and then the thesis, each title in its own language", async () => {
  const inEnglish = await examplePage("en");
  assert.equal(textOf(element(inEnglish, "h1")), "Research");
  const [paper, thesis] = itemsOf(inEnglish).map(titleOf);
  assert.equal(itemsOf(inEnglish).length, 2);
  assert.deepEqual(paper, { text: PAPER_TITLE, foreign: null });
  assert.deepEqual(thesis.foreign, { lang: "pt-BR", text: THESIS_TITLE });
  // The translation of the title, in parentheses, after the original.
  const translated = thesis.text.slice(THESIS_TITLE.length);
  assert.match(translated, /^ \([^()]+\)$/);
  assert.doesNotMatch(translated, PLACEHOLDER);
  assert.ok(thesis.text.startsWith(THESIS_TITLE));

  const inPortuguese = await examplePage("pt");
  assert.equal(textOf(element(inPortuguese, "h1")), "Pesquisa");
  assert.deepEqual(itemsOf(inPortuguese).map(titleOf), [
    { text: PAPER_TITLE, foreign: { lang: "en", text: PAPER_TITLE } },
    { text: THESIS_TITLE, foreign: null },
  ]);
});

// The fields of a research item, in the order they appear: what comes before
// each one and what a visitor reads in it.
function fieldsOf(item: string) {
  const values = elements(item, "dd");
  return elements(item, "dt").map((label, index) => ({
    label: textOf(label),
    text: textOf(values[index] ?? ""),
  }));
}

// The links of a research item: what a visitor reads in each one and where
// it leads.
function linksOf(item: string) {
  return elements(item, "a").map((link) => ({ text: textOf(link), href: hrefsOf(link).join(" ") }));
}

// What the paper shows above its fields: where it came out and the authors,
// in the order of the page, with the highlighted ones.
function bylineOf(paper: string) {
  const [venue = "", authors = ""] = elements(paper, "p");
  return {
    venue: textOf(venue),
    authors: textOf(authors)
      .split(",")
      .map((name) => name.trim()),
    highlighted: elements(authors, "strong").map(textOf),
  };
}

// The contact is a section of the About page (section 7.6 of the spec).
const CONTACT = { en: "/about#contact", pt: "/pt-br/sobre#contact" };

// The DOI of the paper, from issue #10.
const DOI = "https://doi.org/10.1109/HAXD70072.2026.11621018";

// What comes before each field of an item, in each language.
const LABELS = {
  en: { whatItIs: "What it is", summary: "Summary", built: "What I built", result: "Result" },
  pt: { whatItIs: "O que é", summary: "Resumo", built: "O que construí", result: "Resultado" },
};

// Checks that a field of an item is written: it says something, and nothing
// in it is still an example.
function assertWritten(fields: ReturnType<typeof fieldsOf>, clue: string): void {
  for (const { label, text } of fields) {
    assert.ok(text.length > 0, `${clue}: "${label}" is empty`);
    assert.doesNotMatch(text, PLACEHOLDER, `${clue}: ${label}`);
  }
}

// Section 7.5 of the spec: "HAXD 2026, IEEE", the four authors as they
// appear in the publication, with Shaihan's name highlighted and no e-mails,
// the summary of two or three sentences, what Shaihan built, the result and
// the link by the DOI.
test("the paper shows the venue, the authors, the summary, what was built, the result and the link by the DOI", async () => {
  const byline = {
    venue: "HAXD 2026, IEEE",
    authors: ["Shaihan Buenos", "Janaina Avancini Pinheiro", "Daniel Formolo", "Sandro José Rigo"],
    highlighted: ["Shaihan Buenos"],
  };
  const links = { en: "Read on IEEE Xplore", pt: "Ler no IEEE Xplore" };
  const summaries = [];
  for (const language of ["en", "pt"] as const) {
    const [paper = ""] = itemsOf(await examplePage(language));
    assert.deepEqual(bylineOf(paper), byline, language);
    const fields = fieldsOf(paper);
    const { summary, built, result } = LABELS[language];
    assert.deepEqual(
      fields.map(({ label }) => label),
      [summary, built, result],
      language,
    );
    assertWritten(fields, `paper (${language})`);
    const sentences = sentencesOf(fields[0]?.text ?? "").length;
    assert.ok(sentences === 2 || sentences === 3, `${language}: the summary has ${sentences}`);
    assert.deepEqual(linksOf(paper), [{ text: links[language], href: DOI }], language);
    summaries.push(fields[0]?.text);
  }
  assert.notEqual(summaries[0], summaries[1]);
});

test("the paper shows no e-mail", async () => {
  for (const language of ["en", "pt"] as const) {
    const [paper = ""] = itemsOf(await examplePage(language));
    assert.doesNotMatch(paper, /@|mailto:/, language);
  }
});

// Section 7.5 of the spec: what it is, with the advisor named, the summary
// of two sentences, what Shaihan built, the result and "available on
// request", which leads to the contact, on the About page of the same
// language.
test("the thesis shows what it is, the summary, what was built, the result and “available on request”, leading to the contact", async () => {
  const links = { en: "Available on request", pt: "Disponível a pedido" };
  const summaries = [];
  for (const language of ["en", "pt"] as const) {
    const [, thesis = ""] = itemsOf(await examplePage(language));
    const fields = fieldsOf(thesis);
    const { whatItIs, summary, built, result } = LABELS[language];
    assert.deepEqual(
      fields.map(({ label }) => label),
      [whatItIs, summary, built, result],
      language,
    );
    assertWritten(fields, `thesis (${language})`);
    assert.match(fields[0]?.text ?? "", /UNISINOS.*Sandro José Rigo/, language);
    assert.equal(sentencesOf(fields[1]?.text ?? "").length, 2, language);
    assert.deepEqual(
      linksOf(thesis),
      [{ text: links[language], href: CONTACT[language] }],
      language,
    );
    summaries.push(fields[1]?.text);
  }
  assert.notEqual(summaries[0], summaries[1]);
});

// Section 11 of the spec, the rule of health: the patients are always
// "simulated", no text says the system diagnoses or treats, and a result
// number only shows next to the caveat.
test("the research items follow the rule of health, in both languages", async () => {
  for (const language of ["en", "pt"] as const) {
    for (const item of itemsOf(await examplePage(language))) {
      const fields = fieldsOf(item);
      const read = fields.map(({ text }) => text).join(" ");
      assert.deepEqual(patientsNotSimulated(read), [], language);
      assert.doesNotMatch(read, CLINICAL_CLAIM, language);
      assert.deepEqual(numbersWithoutTheCaveat(fields.at(-1)?.text ?? ""), [], language);
      assert.match(fields.at(-1)?.text ?? "", /simulated|simulad/i, language);
      assert.deepEqual(forbiddenWordsIn(read), [], language);
    }
  }
});

// Section 7.5 of the spec: the paper has a diagram and the thesis has no
// image. The diagram itself belongs to issue #15: the page holds its place,
// with a caption.
test("the paper has the place of its diagram, with a caption, and the thesis has no image", async () => {
  const captions = {
    en: "[Example] The architecture diagram, redrawn in the style of the site, goes here.",
    pt: "[Exemplo] O diagrama da arquitetura, redesenhado no estilo do site, entra aqui.",
  };
  for (const language of ["en", "pt"] as const) {
    const [paper = "", thesis = ""] = itemsOf(await examplePage(language));
    assert.deepEqual(
      elements(paper, "figure").map((figure) => textOf(element(figure, "figcaption"))),
      [captions[language]],
    );
    assert.doesNotMatch(thesis, /<(figure|img|svg|picture|object)\b/, language);
  }
});

// Section 7.5 of the spec: no PDF on the site, and no figure copied from the
// works. The link by the DOI is the only one that leaves the site.
test("Research has no link to a PDF, no image from outside the site, and only the DOI leaves the site", async () => {
  for (const language of ["en", "pt"] as const) {
    const page = await examplePage(language);
    assert.deepEqual(
      hrefsOf(page).filter((href) => !href.startsWith("/")),
      [DOI],
      language,
    );
    assert.doesNotMatch(page, /pdf/i, language);
    assert.doesNotMatch(page, /\b(src|srcset|data|poster)="(?!\/(?!\/))/, language);
    assert.doesNotMatch(page, /url\(|<(iframe|embed|object)\b/, language);
  }
});

// Each item carries the name of its file as id, so the study list and the
// Home page can lead to it.
test("each research item can be reached by the name of its file", async () => {
  for (const language of ["en", "pt"] as const) {
    const page = await examplePage(language);
    assert.equal(titleOf(element(page, "article", PAPER_ID)).text, PAPER_TITLE, language);
    assert.ok(titleOf(element(page, "article", THESIS_ID)).text.startsWith(THESIS_TITLE), language);
  }
});

// A test paper and a test thesis, each with numbers of its own in every
// field: no number of one is a number of the other.
const PAPER = `type: paper
order: 1
title: Test Paper Title
venue: Test Venue
authors:
  - name: First Test Author
  - name: Second Test Author
    highlight: true
  - name: Third Test Author
doi: 10.5555/test.paper
summary:
  en: Paper summary with 87.5% inside.
  pt-br: Resumo do paper com 87,5% dentro.
built:
  en: Paper built with 12 parts.
  pt-br: Paper construído com 12 partes.
result:
  en: Paper result of 93.4%, with the caveat.
  pt-br: Resultado do paper de 93,4%, com a ressalva.
`;
const PAPER_NUMBERS = { en: ["87.5%", "12", "93.4%"], pt: ["87,5%", "12", "93,4%"] };

const THESIS = `type: thesis
order: 2
title: Título de teste do TCC
translatedTitle: Test thesis title
whatItIs:
  en: Thesis of test, with the advisor named.
  pt-br: TCC de teste, com o orientador citado.
summary:
  en: Thesis summary with 41.2% inside.
  pt-br: Resumo do TCC com 41,2% dentro.
built:
  en: Thesis built with 36 parts.
  pt-br: TCC construído com 36 partes.
result:
  en: Thesis result of 68.9%, with the caveat.
  pt-br: Resultado do TCC de 68,9%, com a ressalva.
`;
const THESIS_NUMBERS = { en: ["41.2%", "36", "68.9%"], pt: ["41,2%", "36", "68,9%"] };

// The numbers a visitor reads in a piece of the page.
function numbersOf(html: string): string[] {
  return textOf(html).match(/\d[\d.,]*%?/g) ?? [];
}

describe("the research items come from the content", { concurrency: true }, () => {
  // A copy of the site with test phrases in English and with the test paper
  // and the test thesis in the place of the ones of the repo.
  const changed = build({
    write: {
      "pages/en.yaml": PAGES,
      [`research/${PAPER_ID}.yaml`]: PAPER,
      [`research/${THESIS_ID}.yaml`]: THESIS,
    },
  });

  async function changedPage(language: keyof typeof RESEARCH): Promise<string> {
    return element(await (await changed).read(RESEARCH[language]), "main");
  }

  test("changing the fields of a research file changes its item on the page", async () => {
    const [paper = "", thesis = ""] = itemsOf(await changedPage("pt"));
    assert.deepEqual(titleOf(paper), {
      text: "Test Paper Title",
      foreign: { lang: "en", text: "Test Paper Title" },
    });
    assert.deepEqual(
      fieldsOf(paper).map(({ text }) => text),
      [
        "Resumo do paper com 87,5% dentro.",
        "Paper construído com 12 partes.",
        "Resultado do paper de 93,4%, com a ressalva.",
      ],
    );
    assert.deepEqual(
      linksOf(paper).map(({ href }) => href),
      ["https://doi.org/10.5555/test.paper"],
    );
    assert.equal(titleOf(thesis).text, "Título de teste do TCC");
    assert.deepEqual(
      fieldsOf(thesis).map(({ text }) => text),
      [
        "TCC de teste, com o orientador citado.",
        "Resumo do TCC com 41,2% dentro.",
        "TCC construído com 36 partes.",
        "Resultado do TCC de 68,9%, com a ressalva.",
      ],
    );
  });

  test("the authors come in the order of the file, with the highlighted one of the file", async () => {
    const [paper = ""] = itemsOf(await changedPage("en"));
    assert.deepEqual(bylineOf(paper), {
      venue: "Test Venue",
      authors: ["First Test Author", "Second Test Author", "Third Test Author"],
      highlighted: ["Second Test Author"],
    });
  });

  // Section 7.5 of the spec: the numbers of the two works never mix. The
  // test phrases have no digits, so every number of an item came from its file.
  for (const language of ["en", "pt"] as const) {
    test(`Research (${language}) shows the numbers of each work only in its own item`, async () => {
      const [paper = "", thesis = ""] = itemsOf(await changedPage(language));
      const withoutLinks = (item: string) => item.replace(/<a\b[^>]*>/g, "<a>");
      assert.deepEqual(numbersOf(withoutLinks(paper)), PAPER_NUMBERS[language]);
      assert.deepEqual(numbersOf(withoutLinks(thesis)), THESIS_NUMBERS[language]);
    });
  }

  test("the names of the fields, the links and the caption of the diagram come from the phrases file", async () => {
    const [paper = "", thesis = ""] = itemsOf(await changedPage("en"));
    assert.deepEqual(
      fieldsOf(paper).map(({ label }) => label),
      ["Test summary", "Test built", "Test result"],
    );
    assert.deepEqual(
      linksOf(paper).map(({ text }) => text),
      ["Test read the paper"],
    );
    assert.equal(textOf(element(paper, "figcaption")), "Test diagram caption.");
    assert.deepEqual(
      fieldsOf(thesis).map(({ label }) => label),
      ["Test what it is", "Test summary", "Test built", "Test result"],
    );
    assert.deepEqual(
      linksOf(thesis).map(({ text }) => text),
      ["Test on request"],
    );
    assert.equal(textOf(element(await changedPage("en"), "h1")), "Research");
  });

  // A copy without the thesis. No study of the repo links to it.
  const withoutThesis = build({ remove: [`research/${THESIS_ID}.yaml`] });

  test("deleting the thesis file takes its item away, and the page stands with the paper alone", async () => {
    const built = await withoutThesis;
    assert.equal(built.failed, false, built.output);
    for (const language of ["en", "pt"] as const) {
      const items = itemsOf(element(await built.read(RESEARCH[language]), "main"));
      assert.deepEqual(
        items.map((item) => titleOf(item).text),
        [PAPER_TITLE],
        language,
      );
    }
  });

  // The order of the page is the `order` field, not the type of the item.
  const reordered = build({
    write: {
      [`research/${PAPER_ID}.yaml`]: PAPER.replace("order: 1", "order: 3"),
    },
  });

  test("changing the order field changes the order of the items", async () => {
    const items = itemsOf(element(await (await reordered).read(RESEARCH.en), "main"));
    const titles = items.map((item) => titleOf(item).text);
    assert.equal(titles.length, 2);
    assert.ok(titles[0]?.startsWith(THESIS_TITLE));
    assert.equal(titles[1], "Test Paper Title");
  });
});

// Section 7.5 of the spec lists the link by the DOI before the diagram.
test("the paper shows the link by the DOI before the place of the diagram", async () => {
  const [paper = ""] = itemsOf(await examplePage("en"));
  assert.ok(paper.indexOf(DOI) < paper.indexOf("<figure"));
});
