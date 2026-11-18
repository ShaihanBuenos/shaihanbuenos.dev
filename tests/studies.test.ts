// Tests of the Studies page, the study list (section 7.4 of the spec). They
// look at the built page: the one in dist/, with the example content, and the
// one of a copy of the site with some content files changed.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, test } from "node:test";
import { build } from "./support/copy.ts";
import { element, elements, hrefsOf, textOf } from "./support/html.ts";
import { PAGES } from "./support/phrases.ts";

const root = new URL("..", import.meta.url).pathname;

// The file of the Studies page of each language in a build.
const STUDIES = { en: "studies.html", pt: "pt-br/estudos.html" };

// The <main> of the Studies page with the example content, as `npm test` has
// just built it.
async function examplePage(language: keyof typeof STUDIES): Promise<string> {
  return element(await readFile(`${root}dist/${STUDIES[language]}`, "utf8"), "main");
}

// The top of the page: the title and the month of the last check.
function topOf(page: string) {
  const top = element(page, "header");
  return {
    title: textOf(element(top, "h1")),
    check: textOf(element(top, "p")),
    checkedOn: top.match(/<time datetime="([^"]*)"/)?.[1],
  };
}

// The example study list was last checked in 2026-11 (lists/studies.yaml).
test("Studies opens, in both languages, with the month of the last check", async () => {
  assert.deepEqual(topOf(await examplePage("en")), {
    title: "Studies",
    check: "checked in Nov 2026",
    checkedOn: "2026-11",
  });
  assert.deepEqual(topOf(await examplePage("pt")), {
    title: "Estudos",
    check: "conferida em nov. de 2026",
    checkedOn: "2026-11",
  });
});

// The groups of the page, in the order they appear: the title of each one
// and its studies, with what a visitor reads in each. `captions` is the line
// with the study status and the months, and `months` are the months it marks.
function groupsOf(page: string) {
  return elements(page, "section").map((group) => ({
    title: textOf(element(group, "h2")),
    studies: elements(group, "article").map((study) => {
      const [goal = "", captions = ""] = elements(study, "p");
      return {
        name: textOf(element(study, "h3")),
        goal: textOf(goal),
        captions: textOf(captions),
        months: [...captions.matchAll(/<time datetime="([^"]*)"/g)].map(([, month]) => month),
      };
    }),
  }));
}

// Section 7.4 of the spec: the studies in progress first, then the completed
// ones, grouped by the year they were completed. Each study shows the name,
// the one-line goal and the study status. The example content is in
// src/content/studies.
const EXAMPLE_GROUPS = {
  en: [
    {
      title: "In progress",
      studies: [
        {
          name: "[Example] A study in progress",
          goal: "[Example] A one-line goal for a study that is still going.",
          captions: "in progress since Feb 2026",
          months: ["2026-02"],
        },
      ],
    },
    {
      title: "Completed in 2025",
      studies: [
        {
          name: "[Example] A completed study",
          goal: "[Example] A one-line goal for a study that is done.",
          captions: "completed Mar 2025 – Nov 2025",
          months: ["2025-03", "2025-11"],
        },
      ],
    },
  ],
  pt: [
    {
      title: "Em andamento",
      studies: [
        {
          name: "[Exemplo] Um estudo em andamento",
          goal: "[Exemplo] O objetivo, numa linha, de um estudo que ainda está em curso.",
          captions: "em andamento desde fev. de 2026",
          months: ["2026-02"],
        },
      ],
    },
    {
      title: "Concluídos em 2025",
      studies: [
        {
          name: "[Exemplo] Um estudo concluído",
          goal: "[Exemplo] O objetivo, numa linha, de um estudo que já terminou.",
          captions: "concluído mar. de 2025 – nov. de 2025",
          months: ["2025-03", "2025-11"],
        },
      ],
    },
  ],
};

for (const language of ["en", "pt"] as const) {
  test(`Studies (${language}) shows the studies in progress, then the completed ones, each with its name, goal and status`, async () => {
    assert.deepEqual(groupsOf(await examplePage(language)), EXAMPLE_GROUPS[language]);
  });
}

// A study of the page, by the name of its file.
function studyOf(page: string, id: string): string {
  return element(page, "article", id);
}

// The links of a study, in the order they appear: what comes before each
// kind, what a visitor reads in it and where it leads. Null when the study
// shows no links.
function linksOf(study: string) {
  const links = study.match(/<dl\b[\s\S]*<\/dl>/)?.[0];
  if (links === undefined) return null;
  const values = elements(links, "dd");
  return elements(links, "dt").map((label, index) => ({
    label: textOf(label),
    text: textOf(values[index] ?? ""),
    hrefs: hrefsOf(values[index] ?? ""),
  }));
}

// The texts linked to a study: what each item shows and where it leads, as
// on the list of texts. `mark` is the language mark, when the item has one.
function textsOf(study: string) {
  return elements(study, "li").map((item) => {
    const [summary = "", captions = ""] = elements(item, "p");
    return {
      title: textOf(element(item, "h4")),
      href: hrefsOf(item).join(" "),
      summary: textOf(summary),
      captions: textOf(captions),
      hreflang: item.match(/<a\b[^>]*\bhreflang="([^"]*)"/)?.[1] ?? null,
      mark: item.match(/<span[^>]*\blang="([^"]*)"[^>]*>\s*([^<]*?)\s*</)?.slice(1) ?? null,
    };
  });
}

// The project leads to its project story, the certificate to the address in
// the study's file, the education to itself on About and each research item to itself
// on the Research page. The example completed study has every link but the project.
test("a study shows the links it has, and each one leads to its page", async () => {
  const inEnglish = await examplePage("en");
  assert.deepEqual(linksOf(studyOf(inEnglish, "example-in-progress"))?.slice(1), [
    {
      label: "Project",
      text: "Out of the Rabbit Hole",
      hrefs: ["/projects/out-of-the-rabbit-hole"],
    },
  ]);
  assert.deepEqual(linksOf(studyOf(inEnglish, "example-completed"))?.slice(1), [
    {
      label: "Certificate",
      text: "example.com",
      hrefs: ["https://example.com/example-certificate"],
    },
    {
      label: "Education",
      text: "Bachelor's degree in Information Systems, UNISINOS, completed in 2025",
      hrefs: ["/about#education"],
    },
    {
      label: "Research",
      text: "Integrating Large Language Models into Hypertension Care: Architecture and Prompt Tuning Evaluation Inteligência Artificial Aplicada ao Desenvolvimento e Treinamento de Chatbots para Monitoramento de Saúde (Artificial Intelligence Applied to the Development and Training of Chatbots for Health Monitoring)",
      hrefs: ["/research#haxd-paper", "/research#unisinos-thesis"],
    },
  ]);

  const inPortuguese = await examplePage("pt");
  assert.deepEqual(linksOf(studyOf(inPortuguese, "example-in-progress"))?.slice(1), [
    {
      label: "Projeto",
      text: "Out of the Rabbit Hole",
      hrefs: ["/pt-br/projetos/out-of-the-rabbit-hole"],
    },
  ]);
  assert.deepEqual(linksOf(studyOf(inPortuguese, "example-completed"))?.slice(1), [
    {
      label: "Certificado",
      text: "example.com",
      hrefs: ["https://example.com/example-certificate"],
    },
    {
      label: "Formação",
      text: "Bacharelado em Sistemas de Informação, UNISINOS, concluído em 2025",
      hrefs: ["/pt-br/sobre#education"],
    },
    {
      label: "Pesquisa",
      text: "Integrating Large Language Models into Hypertension Care: Architecture and Prompt Tuning Evaluation Inteligência Artificial Aplicada ao Desenvolvimento e Treinamento de Chatbots para Monitoramento de Saúde",
      hrefs: ["/pt-br/pesquisa#haxd-paper", "/pt-br/pesquisa#unisinos-thesis"],
    },
  ]);
});

// Section 11 of the spec: nothing on the site leads to a repo or to a demo.
// The certificate is the only link of the page that leaves the site.
test("the certificate is the only link that leaves the site", async () => {
  for (const language of ["en", "pt"] as const) {
    assert.deepEqual(
      hrefsOf(await examplePage(language)).filter((href) => !href.startsWith("/")),
      ["https://example.com/example-certificate"],
      language,
    );
  }
});

// Section 7.4 of the spec: the linked texts are shown as on the list of
// texts. The example article has both versions, and the completed study
// links it in links.texts.
test("a linked text is shown in the version of the page's language, at the address of that version", async () => {
  const links = linksOf(studyOf(await examplePage("en"), "example-completed"));
  assert.equal(links?.at(0)?.label, "Texts");
  assert.deepEqual(textsOf(studyOf(await examplePage("en"), "example-completed")), [
    {
      title: "[Example] An example article with a translation",
      href: "/writing/example-article-with-translation",
      summary: "[Example] This one-line summary stands in for the summary of a real article.",
      captions: "article Jan 15, 2026 backend architecture",
      hreflang: null,
      mark: null,
    },
  ]);
  assert.deepEqual(textsOf(studyOf(await examplePage("pt"), "example-completed")), [
    {
      title: "[Exemplo] Um artigo de exemplo com tradução",
      href: "/pt-br/textos/exemplo-de-artigo-com-traducao",
      summary:
        "[Exemplo] Este resumo de uma linha ocupa o lugar do resumo de um artigo de verdade.",
      captions: "artigo 15 de jan. de 2026 backend arquitetura",
      hreflang: null,
      mark: null,
    },
  ]);
});

// The example study note names the study in progress as the study it came
// from, and the file of the study does not list it. It has no translation.
test("a text that came from a study is linked to it, in the original with the language mark when it has no translation", async () => {
  const href = "/writing/example-study-note-without-translation";
  const title = "[Example] An example study note without a translation";
  const summary = "[Example] This one-line summary stands in for the summary of a real study note.";
  assert.deepEqual(textsOf(studyOf(await examplePage("en"), "example-in-progress")), [
    { title, href, summary, captions: "study note Mar 10, 2026 AI", hreflang: null, mark: null },
  ]);
  assert.deepEqual(textsOf(studyOf(await examplePage("pt"), "example-in-progress")), [
    {
      title,
      href,
      summary,
      captions: "nota de estudo 10 de mar. de 2026 IA EN",
      hreflang: "en",
      mark: ["en", "EN"],
    },
  ]);
});

// A study file without links: `status` and the months are given by each test.
function studyFile(name: string, months: string): string {
  return `name:\n  en: ${name}\n  pt-br: ${name} em português\ngoal:\n  en: Goal of ${name}.\n  pt-br: Objetivo de ${name}.\n${months}`;
}

describe("the studies come from the content", { concurrency: true }, () => {
  // A copy of the site with test phrases in English, another month of the
  // last check, the example completed study deleted and four more studies:
  // one in progress, started after the example one, two completed in the
  // same year and one completed two years before them. No study was
  // completed in the year between. Two drafts are linked to studies: one
  // names its study, the other is listed by one.
  const changed = build({
    remove: ["studies/example-completed.yaml"],
    write: {
      "pages/en.yaml": PAGES,
      "lists/studies.yaml": "checkedOn: 2025-04\n",
      "studies/newest-in-progress.yaml": studyFile(
        "Newest study",
        "status: in-progress\nstart: 2026-06\n",
      ),
      "studies/completed-early.yaml": studyFile(
        "Early study",
        "status: completed\nstart: 2024-02\nend: 2024-09\nlinks:\n  texts: [example-draft, example-article]\n",
      ),
      "studies/completed-late.yaml": studyFile(
        "Late study",
        "status: completed\nstart: 2024-05\nend: 2024-12\n",
      ),
      "studies/completed-long-ago.yaml": studyFile(
        "Old study",
        "status: completed\nstart: 2021-10\nend: 2022-03\n",
      ),
      "texts/draft-from-study/text.yaml":
        "publishedOn: 2026-07-01\ntype: study-note\ntopics: [ai]\noriginalLanguage: en\nstudy: example-in-progress\ndraft: true\n",
      "texts/draft-from-study/en.md":
        "---\ntitle: Draft from a study\nsummary: Summary.\nslug: draft-from-a-study\n---\n\nBody.\n",
    },
  });

  async function changedPage(language: keyof typeof STUDIES): Promise<string> {
    return element(await (await changed).read(STUDIES[language]), "main");
  }

  test("changing checkedOn changes the month at the top", async () => {
    assert.deepEqual(topOf(await changedPage("en")), {
      title: "Studies",
      check: "test checked in Apr 2025",
      checkedOn: "2025-04",
    });
    assert.equal(topOf(await changedPage("pt")).check, "conferida em abr. de 2025");
  });

  test("creating or deleting a study file adds the study to the page or takes it away, in its group", async () => {
    const groups = groupsOf(await changedPage("en"));
    assert.deepEqual(
      groups.map(({ title, studies }) => [title, studies.map(({ name }) => name)]),
      [
        ["Test in progress", ["Newest study", "[Example] A study in progress"]],
        ["Test completed in 2024", ["Late study", "Early study"]],
        ["Test completed in 2022", ["Old study"]],
      ],
    );
    assert.deepEqual(
      groupsOf(await changedPage("pt")).map(({ title, studies }) => [
        title,
        studies.map(({ name }) => name),
      ]),
      [
        ["Em andamento", ["Newest study em português", "[Exemplo] Um estudo em andamento"]],
        ["Concluídos em 2024", ["Late study em português", "Early study em português"]],
        ["Concluídos em 2022", ["Old study em português"]],
      ],
    );
  });

  // The year of a group is the year the study was completed, not the year
  // it started: the old study started the year before.
  test("a completed study sits under the year it was completed, and a year without studies is not shown", async () => {
    const page = await changedPage("en");
    assert.deepEqual(
      elements(page, "section").map((group) => group.match(/<time datetime="(\d{4})"/)?.[1]),
      [undefined, "2024", "2022"],
    );
    assert.deepEqual(groupsOf(page).at(-1)?.studies.at(0)?.months, ["2021-10", "2022-03"]);
  });

  test("the names of the study statuses and of the links come from the phrases file", async () => {
    const page = await changedPage("en");
    const captions = groupsOf(page).flatMap(({ studies }) =>
      studies.map(({ captions }) => captions),
    );
    assert.deepEqual(captions, [
      "test in progress test since Jun 2026",
      "test in progress test since Feb 2026",
      "test completed May 2024 – Dec 2024",
      "test completed Feb 2024 – Sep 2024",
      "test completed Oct 2021 – Mar 2022",
    ]);
    assert.deepEqual(
      linksOf(studyOf(page, "example-in-progress"))?.map(({ label }) => label),
      ["Test texts", "Test project"],
    );
  });

  test("a study without links does not show the part of the links", async () => {
    const page = await changedPage("en");
    assert.equal(linksOf(studyOf(page, "completed-late")), null);
    assert.equal(linksOf(studyOf(page, "newest-in-progress")), null);
    assert.equal(hrefsOf(studyOf(page, "completed-late")).length, 0);
  });

  // Section 6 of the spec: a draft is shown only in the dev server.
  test("a draft is not shown among the texts of a study", async () => {
    const page = await changedPage("en");
    assert.deepEqual(
      textsOf(studyOf(page, "example-in-progress")).map(({ href }) => href),
      ["/writing/example-study-note-without-translation"],
    );
    assert.deepEqual(
      textsOf(studyOf(page, "completed-early")).map(({ href }) => href),
      ["/writing/example-article-with-translation"],
    );
    assert.doesNotMatch(textOf(page), /draft/i);
  });

  // Section 7.4 of the spec: no percentage, and no counts. The changed
  // content has no digits outside the dates, so any other number on the page
  // was put there by the page.
  for (const language of ["en", "pt"] as const) {
    test(`Studies (${language}) has no percentage and no numbers besides the dates`, async () => {
      const page = await changedPage(language);
      assert.match(page, /<time\b/);
      const withoutDates = page.replace(/<time\b[\s\S]*?<\/time>/g, " ");
      assert.deepEqual(textOf(withoutDates).match(/\S*[\d%]\S*/g) ?? [], []);
      assert.equal(elements(page, "progress").length + elements(page, "meter").length, 0);
    });
  }
});
