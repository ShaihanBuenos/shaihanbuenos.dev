// Tests of the Projects page and of the project story (section 7.2 of the
// spec). They look at the built pages: the ones in dist/, with the example
// content, and the ones of copies of the site with some content files changed.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, test } from "node:test";
import { build } from "./support/copy.ts";
import { element, elements, hrefsOf, textOf } from "./support/html.ts";
import { PAGES } from "./support/phrases.ts";

const root = new URL("..", import.meta.url).pathname;

// The files of the Projects page and of a project story in a build.
const LIST = { en: "projects.html", pt: "pt-br/projetos.html" };
const STORY = {
  en: (project: string) => `projects/${project}.html`,
  pt: (project: string) => `pt-br/projetos/${project}.html`,
};

// The <main> of a page with the example content, as `npm test` has just built it.
async function examplePage(file: string): Promise<string> {
  return element(await readFile(`${root}dist/${file}`, "utf8"), "main");
}

// The example content, as it is in src/content/projects.
const EXAMPLE = {
  en: {
    list: "Projects",
    cards: [
      {
        href: "/projects/example-project",
        name: "Example Project",
        whatItIs: "[Example] A made-up project that stands in for a real project story.",
        state: "works locally",
      },
      {
        href: "/projects/another-example-project",
        name: "Another Example Project",
        whatItIs: "[Example] Another made-up project, still being planned.",
        state: "in planning",
      },
    ],
  },
  pt: {
    list: "Projetos",
    cards: [
      {
        href: "/pt-br/projetos/example-project",
        name: "Example Project",
        whatItIs:
          "[Exemplo] Um projeto inventado, que ocupa o lugar de uma história do projeto de verdade.",
        state: "funciona localmente",
      },
      {
        href: "/pt-br/projetos/another-example-project",
        name: "Another Example Project",
        whatItIs: "[Exemplo] Outro projeto inventado, ainda em planejamento.",
        state: "em planejamento",
      },
    ],
  },
};

// The cards of a Projects page: what each one shows and where it leads.
function cardsOf(list: string) {
  return elements(list, "li").map((card) => ({
    href: hrefsOf(card).join(" "),
    name: textOf(element(card, "h2")),
    whatItIs: textOf(element(card, "p")),
    state: textOf(elements(card, "span").at(-1) ?? ""),
    hasMark: /<svg\b/.test(card),
  }));
}

for (const language of ["en", "pt"] as const) {
  test(`Projects (${language}) has one card per project: the mark, the name, the state and what it is`, async () => {
    const list = await examplePage(LIST[language]);
    assert.equal(textOf(element(list, "h1")), EXAMPLE[language].list);
    assert.deepEqual(
      cardsOf(list),
      EXAMPLE[language].cards.map((card) => ({ ...card, hasMark: true })),
    );
  });
}

// Section 7.2 of the spec: the fixed parts of a project story, in this
// order, and "updated on". The body is as the page shows it, with the
// typographic apostrophe the Markdown processor writes.
const STORY_PARTS = {
  en: {
    state: "works locally",
    updatedOn: "updated on May 20, 2026",
    whatItIs: "[Example] A made-up project that stands in for a real project story.",
    decisions: "Engineering decisions",
    built: "How it was built",
    credit:
      "[Example] The agent credit goes here: the code was written by AI agents, under Shaihan’s specification and review.",
  },
  pt: {
    state: "funciona localmente",
    updatedOn: "atualizada em 20 de mai. de 2026",
    whatItIs:
      "[Exemplo] Um projeto inventado, que ocupa o lugar de uma história do projeto de verdade.",
    decisions: "Decisões de engenharia",
    built: "Como foi construído",
    credit:
      "[Exemplo] Aqui entra o crédito dos agentes: o código foi escrito por agentes de IA, sob a especificação e a revisão de Shaihan.",
  },
};

// Where each piece is on the page, to compare the order. A piece that is
// missing fails the test.
function positionsOf(page: string, pieces: Record<string, string>): number[] {
  return Object.entries(pieces).map(([name, piece]) => {
    const position = page.indexOf(piece);
    assert.notEqual(position, -1, `the page has no ${name}: ${piece}`);
    return position;
  });
}

for (const language of ["en", "pt"] as const) {
  test(`a project story (${language}) has the five fixed parts, in order, and "updated on"`, async () => {
    const story = await examplePage(STORY[language]("example-project"));
    const parts = STORY_PARTS[language];

    const top = element(story, "header");
    assert.equal(textOf(element(top, "h1")), "Example Project");
    assert.match(top, /<time datetime="2026-05-20">/);

    // What a visitor reads, with the project mark standing in as a word.
    const read = textOf(story.replace(/<svg\b[\s\S]*?<\/svg>/g, " (mark) "));
    const positions = positionsOf(read, {
      "project mark": "(mark)",
      name: "Example Project",
      state: parts.state,
      "updated on": parts.updatedOn,
      "what it is": parts.whatItIs,
      "engineering decisions": parts.decisions,
      "how it was built": parts.built,
      "agent credit": parts.credit,
    });
    assert.deepEqual(
      positions,
      positions.toSorted((a, b) => a - b),
    );
    assert.equal(top.match(/<svg\b/g)?.length, 1, "the top has one project mark");
  });
}

// Each decision has a title and, in a definition list, the problem, the
// choice and what was ruled out. They come from the Markdown of the language.
test("the engineering decisions of a story come from the Markdown of its language", async () => {
  const story = await examplePage(STORY.en("example-project"));
  const decisions = elements(story, "article");
  assert.deepEqual(
    decisions.map((decision) => textOf(element(decision, "h3"))),
    ["[Example] An example decision", "[Example] Another example decision"],
  );
  const [first] = decisions;
  assert.ok(first);
  assert.deepEqual(elements(first, "dt").map(textOf), [
    "The problem",
    "The choice",
    "What was ruled out",
  ]);
  assert.deepEqual(elements(first, "dd").map(textOf), [
    "A made-up problem, only to show the format.",
    "The choice that would have been made.",
    "The alternative that would have been left out, and why.",
  ]);

  const inPortuguese = await examplePage(STORY.pt("example-project"));
  assert.deepEqual(elements(element(inPortuguese, "article"), "dt").map(textOf), [
    "O problema",
    "A escolha",
    "O que foi descartado",
  ]);
});

// The engineering decisions and "How it was built" are the two sections of
// the body, each one with its title.
test("the body of a story is two sections: the decisions and how it was built", async () => {
  const story = await examplePage(STORY.en("example-project"));
  const [decisions, built] = elements(story, "section");
  assert.ok(decisions && built);
  assert.equal(textOf(element(decisions, "h2")), "Engineering decisions");
  assert.equal(elements(decisions, "article").length, 2);
  assert.equal(textOf(element(built, "h2")), "How it was built");
  // The agent credit opens the section, as its lead.
  assert.match(element(built, "p"), /^<p class="lead">\[Example\] The agent credit goes here/);
  assert.equal(elements(built, "article").length, 0);
});

test("a story leads to the other projects, each with its state", async () => {
  const story = await examplePage(STORY.pt("example-project"));
  const others = elements(story, "section").at(-1);
  assert.ok(others);
  assert.equal(textOf(element(others, "h2")), "Outros projetos");
  assert.deepEqual(hrefsOf(others), ["/pt-br/projetos/another-example-project"]);
  assert.equal(textOf(element(others, "li")), "Another Example Project em planejamento");
});

const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><title>New mark</title><circle cx="60" cy="60" r="40" /></svg>\n`;

function storyFile(whatItIs: string): string {
  return `---
whatItIs: ${whatItIs}
description: Test description.
---

## Test decisions

### First test decision

**Problem.** Test problem.

**Choice.** Test choice.

**Ruled out.** Test alternative.

### Second test decision

**Problem.** Another test problem.

**Choice.** Another test choice.

**Ruled out.** Another test alternative.

## Test built

Test credit.
`;
}

// The files of a whole project, in a folder of its own.
function projectFolder(folder: string, name: string): Record<string, string> {
  return {
    [`projects/${folder}/project.yaml`]: `name: ${name}\norder: 5\nstate: in-development\nupdatedOn: 2026-07-04\n`,
    [`projects/${folder}/mark.svg`]: MARK,
    [`projects/${folder}/en.md`]: storyFile(`What ${name} is.`),
    [`projects/${folder}/pt-br.md`]: storyFile(`O que é ${name}.`),
  };
}

describe("the projects come from the content", { concurrency: true }, () => {
  // A copy of the site with a new project folder, one of the example
  // folders deleted, and test phrases in English.
  const changed = build({
    write: { "pages/en.yaml": PAGES, ...projectFolder("new-project", "New Project") },
    remove: ["projects/another-example-project"],
  });

  async function changedPage(file: string): Promise<string> {
    return element(await (await changed).read(file), "main");
  }

  for (const language of ["en", "pt"] as const) {
    test(`creating a project folder adds the card and the page (${language})`, async () => {
      const cards = cardsOf(await changedPage(LIST[language]));
      const card = cards.find(({ name }) => name === "New Project");
      const href = { en: "/projects/new-project", pt: "/pt-br/projetos/new-project" }[language];
      const whatItIs = { en: "What New Project is.", pt: "O que é New Project." }[language];
      assert.equal(card?.href, href);
      assert.equal(card.whatItIs, whatItIs);
      assert.ok(card.hasMark);

      const story = await changedPage(STORY[language]("new-project"));
      assert.equal(textOf(element(story, "h1")), "New Project");
      assert.match(story, /<title>New mark<\/title>/);
      assert.match(textOf(story), new RegExp(whatItIs.replaceAll(".", "\\.")));
      assert.match(story, /<time datetime="2026-07-04">/);
    });

    test(`deleting a project folder takes away the card and the page (${language})`, async () => {
      const cards = cardsOf(await changedPage(LIST[language]));
      assert.deepEqual(
        cards.map(({ name }) => name),
        ["Example Project", "New Project"],
      );
      await assert.rejects((await changed).read(STORY[language]("another-example-project")));
      // The story that stays no longer leads to the one that left.
      const story = await changedPage(STORY[language]("example-project"));
      assert.doesNotMatch(story, /another-example-project/);
    });
  }

  test('the state, "updated on" and the title of the other projects come from the phrases file', async () => {
    const story = await changedPage(STORY.en("new-project"));
    const top = textOf(element(story, "header"));
    assert.match(top, /test in development/);
    assert.match(top, /test updated on Jul 4, 2026/);
    const others = elements(story, "section").at(-1);
    assert.ok(others);
    assert.equal(textOf(element(others, "h2")), "Test other projects");
    assert.equal(textOf(element(others, "li")), "Example Project test works locally");
  });

  test("the body of a story follows its Markdown file", async () => {
    const story = await changedPage(STORY.en("new-project"));
    assert.deepEqual(elements(story, "h2").map(textOf).slice(0, 2), [
      "Test decisions",
      "Test built",
    ]);
    assert.deepEqual(elements(story, "h3").map(textOf).slice(0, 2), [
      "First test decision",
      "Second test decision",
    ]);
    assert.deepEqual(elements(story, "dt").map(textOf).slice(0, 3), [
      "Problem",
      "Choice",
      "Ruled out",
    ]);
    assert.match(textOf(story), /Test credit\./);
  });
});

// Section 7.2 of the spec: no link to a repo and no live demo. Inside the
// frame, a project page only leads to other pages of the site.
for (const language of ["en", "pt"] as const) {
  test(`no project page (${language}) has a link that leaves the site`, async () => {
    const files = [
      LIST[language],
      STORY[language]("example-project"),
      STORY[language]("another-example-project"),
    ];
    for (const file of files) {
      const hrefs = hrefsOf(await examplePage(file));
      assert.ok(hrefs.length > 0, `${file} has no links`);
      assert.deepEqual(
        hrefs.filter((href) => !href.startsWith("/") || href.startsWith("//")),
        [],
        file,
      );
    }
  });
}

describe("the files of a project story", { concurrency: true }, () => {
  const EXAMPLE_STORY = readFile(`${root}src/content/projects/example-project/en.md`, "utf8");

  test("a story with a link to a repo stops the build", async () => {
    const story = (await EXAMPLE_STORY).replace(
      "[Example] The agent credit goes here",
      "[The code](https://github.com/example/example) is here",
    );
    const built = await build({ write: { "projects/example-project/en.md": story } });
    assert.ok(built.failed, "the build passed");
    assert.match(built.output, /projects\/example-project\/en\.md/);
    assert.match(built.output, /https:\/\/github\.com\/example\/example/);
  });

  test("a story with a single engineering decision stops the build", async () => {
    const story = await EXAMPLE_STORY;
    const second = story.indexOf("### [Example] Another example decision");
    const built = await build({
      write: {
        "projects/example-project/en.md":
          story.slice(0, second) + story.slice(story.indexOf("## How it was built")),
      },
    });
    assert.ok(built.failed, "the build passed");
    assert.match(built.output, /projects\/example-project\/en\.md/);
    assert.match(built.output, /from 2 to 4 engineering decisions/);
  });

  // The captures and the diagram of a project live in its folder, and the
  // story shows them from its Markdown.
  test("an image in the folder of a project is shown in its story", async () => {
    const diagram = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 200" width="720" height="200"><title>Test diagram</title><rect width="720" height="200" /></svg>\n`;
    const story = (await EXAMPLE_STORY).replace(
      "### [Example] Another example decision",
      '![The test diagram](./diagram.svg "Test caption.")\n\n### [Example] Another example decision',
    );
    const built = await build({
      write: {
        "projects/example-project/diagram.svg": diagram,
        "projects/example-project/en.md": story,
      },
    });
    const page = element(await built.read(STORY.en("example-project")), "main");
    const figure = element(elements(page, "article")[0] ?? "", "figure");
    assert.equal(textOf(element(figure, "figcaption")), "Test caption.");
    const image = figure.match(/<img\b[^>]*>/)?.[0] ?? "";
    assert.match(image, /\balt="The test diagram"/);
    const src = image.match(/\bsrc="\/([^"]*)"/)?.[1];
    assert.ok(src, `the image has no address in the site: ${image}`);
    assert.match(await built.read(src), /<title>Test diagram<\/title>/);
  });
});
