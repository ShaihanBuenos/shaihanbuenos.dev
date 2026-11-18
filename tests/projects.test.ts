// Tests of the Projects page and of the project story (section 7.2 of the
// spec). They look at the built pages: the ones in dist/, with the content of
// the repo, and the ones of copies of the site with some content files changed.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, test } from "node:test";
import { build } from "./support/copy.ts";
import { element, elements, hrefsOf, textOf } from "./support/html.ts";
import { PAGES } from "./support/phrases.ts";
import { AGEING, PLACEHOLDER, forbiddenWordsIn, sentencesOf } from "./support/rules.ts";

const root = new URL("..", import.meta.url).pathname;

// The files of the Projects page and of a project story in a build.
const LIST = { en: "projects.html", pt: "pt-br/projetos.html" };
const STORY = {
  en: (project: string) => `projects/${project}.html`,
  pt: (project: string) => `pt-br/projetos/${project}.html`,
};

// The <main> of a page with the content of the repo, as `npm test` has just
// built it.
async function examplePage(file: string): Promise<string> {
  return element(await readFile(`${root}dist/${file}`, "utf8"), "main");
}

// Section 7.2 of the spec: the projects, in the initial order, each with its
// state. `words` names the list of words its story leaves out, `figures` is
// how many images the story has, at least and at most, and `says` is what
// the story has to say, by the content rules. A project marked as `example`
// is still made up: only its place on the pages is checked.
interface Listed {
  id: string;
  name: string;
  state: { en: string; pt: string };
  example?: true;
  words?: "rabbit-hole" | "beto" | "ensaio";
  figures?: [number, number];
  says?: { en: RegExp; pt: RegExp };
}

const PROJECTS: Listed[] = [
  {
    id: "out-of-the-rabbit-hole",
    name: "Out of the Rabbit Hole",
    state: { en: "works locally", pt: "funciona localmente" },
    words: "rabbit-hole",
    // From one to three captures of the demo, with made-up data.
    figures: [1, 3],
    // While no real document was read with a key, the story says the
    // reading by AI was checked with a simulated model.
    says: { en: /simulated model/i, pt: /modelo simulado/i },
  },
  {
    id: "beto",
    name: "Betô",
    state: { en: "in development", pt: "em desenvolvimento" },
    words: "beto",
    // One engineering diagram, without the words of the product.
    figures: [1, 1],
    // PRODUCT.md: Betô shows as a product that is not launched yet.
    says: { en: /not (yet )?(launched|released)/i, pt: /ainda não (foi )?lançado/i },
  },
  {
    id: "another-example-project",
    name: "Another Example Project",
    state: { en: "in planning", pt: "em planejamento" },
    example: true,
  },
];

const WRITTEN = PROJECTS.filter(({ example }) => !example);

const LIST_TITLE = { en: "Projects", pt: "Projetos" };
const STORY_PATH = {
  en: (project: string) => `/projects/${project}`,
  pt: (project: string) => `/pt-br/projetos/${project}`,
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
  test(`Projects (${language}) has one card per project, in the order of the spec: the mark, the name, the state and what it is`, async () => {
    const list = await examplePage(LIST[language]);
    assert.equal(textOf(element(list, "h1")), LIST_TITLE[language]);
    const cards = cardsOf(list);
    assert.deepEqual(
      cards.map(({ href, name, state, hasMark }) => ({ href, name, state, hasMark })),
      PROJECTS.map(({ id, name, state }) => ({
        href: STORY_PATH[language](id),
        name,
        state: state[language],
        hasMark: true,
      })),
    );
    // What the card says the project is, is what its story says.
    for (const [index, { id }] of PROJECTS.entries()) {
      const whatItIs = cards[index]?.whatItIs ?? "";
      assert.ok(whatItIs.length > 0, `${id} has no "what it is"`);
      assert.ok(textOf(await examplePage(STORY[language](id))).includes(whatItIs), id);
    }
  });
}

// The titles of the two parts of the body, the legends of a decision and
// what comes before the date, in each language.
const STORY_WORDS = {
  en: {
    updatedOn: "updated on",
    decisions: "Engineering decisions",
    built: "How it was built",
    items: ["The problem", "The choice", "What was ruled out"],
    credit: /\bAI agents\b/,
  },
  pt: {
    updatedOn: "atualizada em",
    decisions: "Decisões de engenharia",
    built: "Como foi construído",
    items: ["O problema", "A escolha", "O que foi descartado"],
    credit: /\bagentes de IA\b/,
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

// The parts of a story page: the top, the two sections of the body and, at
// the end, the section that leads to the other projects.
function partsOf(story: string) {
  const [decisions = "", built = ""] = elements(story, "section");
  return { top: element(story, "header"), decisions, built };
}

// Section 7.2 of the spec: the fixed parts of a project story, in this
// order, and "updated on".
for (const { id, name, state } of WRITTEN) {
  for (const language of ["en", "pt"] as const) {
    test(`the story of ${id} (${language}) has the five fixed parts, in order, and "updated on"`, async () => {
      const story = await examplePage(STORY[language](id));
      const words = STORY_WORDS[language];
      const { top, built } = partsOf(story);

      assert.equal(textOf(element(top, "h1")), name);
      assert.match(top, /<time datetime="\d{4}-\d{2}-\d{2}">/);
      const card = cardsOf(await examplePage(LIST[language])).find(
        ({ href }) => href === STORY_PATH[language](id),
      );
      assert.ok(card);

      // What a visitor reads, with the project mark standing in as a word.
      const read = textOf(story.replace(/<svg\b[\s\S]*?<\/svg>/g, " (mark) "));
      const positions = positionsOf(read, {
        "project mark": "(mark)",
        name,
        state: state[language],
        "updated on": words.updatedOn,
        "what it is": card.whatItIs,
        "engineering decisions": words.decisions,
        "how it was built": words.built,
        "agent credit": textOf(element(built, "p")),
      });
      assert.deepEqual(
        positions,
        positions.toSorted((a, b) => a - b),
      );
      assert.equal(top.match(/<svg\b/g)?.length, 1, "the top has one project mark");
    });
  }
}

// Section 7.2 of the spec: what the project is, in one or two sentences.
for (const { id } of WRITTEN) {
  test(`the story of ${id} says what the project is in one or two sentences, in both languages`, async () => {
    for (const language of ["en", "pt"] as const) {
      const card = cardsOf(await examplePage(LIST[language])).find(
        ({ href }) => href === STORY_PATH[language](id),
      );
      const sentences = sentencesOf(card?.whatItIs ?? "");
      assert.ok(
        sentences.length === 1 || sentences.length === 2,
        `${language}: "what it is" has ${sentences.length} sentences`,
      );
    }
  });
}

// The decisions of a story page: the title of each one, the legends of its
// items and what each item says.
function decisionsOf(story: string) {
  return elements(partsOf(story).decisions, "article").map((decision) => ({
    title: textOf(element(decision, "h3")),
    legends: elements(decision, "dt").map(textOf),
    items: elements(decision, "dd").map(textOf),
  }));
}

// Section 7.2 of the spec: from two to four engineering decisions, each with
// the problem, the choice and what was ruled out. They come from the
// Markdown of the language, and both languages tell the same decisions.
for (const { id } of WRITTEN) {
  test(`the story of ${id} has from two to four decisions, each with the problem, the choice and what was ruled out`, async () => {
    const decisions = {
      en: decisionsOf(await examplePage(STORY.en(id))),
      pt: decisionsOf(await examplePage(STORY.pt(id))),
    };
    assert.ok(decisions.en.length >= 2 && decisions.en.length <= 4);
    assert.equal(decisions.pt.length, decisions.en.length);
    for (const language of ["en", "pt"] as const) {
      for (const { title, legends, items } of decisions[language]) {
        assert.ok(title.length > 0, language);
        assert.deepEqual(legends, STORY_WORDS[language].items, `${language}: ${title}`);
        assert.equal(items.length, 3, `${language}: ${title}`);
        for (const item of items) assert.ok(item.length > 0, `${language}: ${title}`);
      }
    }
  });
}

// The engineering decisions and "How it was built" are the two sections of
// the body, each one with its title. The agent credit opens the second one,
// as its lead (section 7.2 of the spec, and "agent credit" in GLOSSARY.md).
for (const { id } of WRITTEN) {
  test(`the body of the story of ${id} is two sections: the decisions and how it was built, opened by the agent credit`, async () => {
    for (const language of ["en", "pt"] as const) {
      const words = STORY_WORDS[language];
      const { decisions, built } = partsOf(await examplePage(STORY[language](id)));
      assert.equal(textOf(element(decisions, "h2")), words.decisions, language);
      assert.equal(textOf(element(built, "h2")), words.built, language);
      const lead = element(built, "p");
      assert.match(lead, /^<p class="lead">/, language);
      assert.match(textOf(lead), words.credit, language);
      assert.equal(elements(built, "article").length, 0, language);
    }
  });
}

// Section 7.2 of the spec: the images each story has. An image is a figure,
// with alternative text and a caption, served from the folder of the project.
for (const { id, figures = [0, 0] } of WRITTEN) {
  test(`the story of ${id} has from ${figures[0]} to ${figures[1]} images, the same in both languages, each with alternative text and a caption`, async () => {
    const counts = [];
    for (const language of ["en", "pt"] as const) {
      const story = await examplePage(STORY[language](id));
      const found = elements(story, "figure");
      counts.push(found.length);
      assert.ok(
        found.length >= figures[0] && found.length <= figures[1],
        `${language}: the story has ${found.length} images`,
      );
      for (const figure of found) {
        const image = figure.match(/<img\b[^>]*>/)?.[0] ?? "";
        assert.match(image, /\balt="[^"]+"/, language);
        assert.match(image, /\bsrc="\/(?!\/)/, language);
        assert.ok(textOf(element(figure, "figcaption")).length > 0, language);
      }
    }
    assert.equal(counts[0], counts[1]);
  });
}

// Section 11 of the spec: a story only tells what was checked, shows no
// count of lines or of commits, nothing that ages, and none of the words its
// project leaves out. Nothing in it is still an example, but the images: the
// captures and the diagram come later, and their places are marked.
for (const { id, words, says } of WRITTEN) {
  test(`the story of ${id} follows the content rules, in both languages`, async () => {
    for (const language of ["en", "pt"] as const) {
      const story = await examplePage(STORY[language](id));
      const { top, decisions, built } = partsOf(story);
      const read = textOf(
        [top, decisions, built]
          .join(" ")
          .replace(/<svg\b[\s\S]*?<\/svg>/g, " ")
          .replace(/<figure\b[\s\S]*?<\/figure>/g, " "),
      );
      assert.doesNotMatch(read, PLACEHOLDER, language);
      assert.doesNotMatch(read, AGEING, language);
      assert.doesNotMatch(read, /\bcommits?\b/i, language);
      assert.deepEqual(forbiddenWordsIn(read, words), [], language);
      if (says) assert.match(read, says[language], language);
    }
  });
}

test("a story leads to the other projects, each with its state", async () => {
  const [first, ...rest] = PROJECTS;
  assert.ok(first);
  const story = await examplePage(STORY.pt(first.id));
  const others = elements(story, "section").at(-1);
  assert.ok(others);
  assert.equal(textOf(element(others, "h2")), "Outros projetos");
  assert.deepEqual(
    hrefsOf(others),
    rest.map(({ id }) => STORY_PATH.pt(id)),
  );
  assert.deepEqual(
    elements(others, "li").map(textOf),
    rest.map(({ name, state }) => `${name} ${state.pt}`),
  );
});

const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><title>New mark</title><circle cx="60" cy="60" r="40" /></svg>\n`;

const SECOND_DECISION = `### Second test decision

**Problem.** Another test problem.

**Choice.** Another test choice.

**Ruled out.** Another test alternative.

`;

// A whole story file. `second` is its second decision and `credit` is what
// opens "how it was built": the tests of the files change them.
function storyFile(whatItIs: string, second = SECOND_DECISION, credit = "Test credit."): string {
  return `---
whatItIs: ${whatItIs}
description: Test description.
---

## Test decisions

### First test decision

**Problem.** Test problem.

**Choice.** Test choice.

**Ruled out.** Test alternative.

${second}## Test built

${credit}
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
  // A copy of the site with a new project folder, one of the folders of the
  // repo deleted, and test phrases in English.
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
        ["Out of the Rabbit Hole", "Betô", "New Project"],
      );
      await assert.rejects((await changed).read(STORY[language]("another-example-project")));
      // The story that stays no longer leads to the one that left.
      const story = await changedPage(STORY[language]("out-of-the-rabbit-hole"));
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
    assert.deepEqual(elements(others, "li").map(textOf), [
      "Out of the Rabbit Hole test works locally",
      "Betô test in development",
    ]);
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
    const files = [LIST[language], ...PROJECTS.map(({ id }) => STORY[language](id))];
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
  // The story of a project of the repo, written over with a test story.
  const FILE = "projects/out-of-the-rabbit-hole/en.md";

  test("a story with a link to a repo stops the build", async () => {
    const story = storyFile(
      "What it is.",
      SECOND_DECISION,
      "[The code](https://github.com/example/example) is here.",
    );
    const built = await build({ write: { [FILE]: story } });
    assert.ok(built.failed, "the build passed");
    assert.match(built.output, /projects\/out-of-the-rabbit-hole\/en\.md/);
    assert.match(built.output, /https:\/\/github\.com\/example\/example/);
  });

  test("a story with a single engineering decision stops the build", async () => {
    const built = await build({ write: { [FILE]: storyFile("What it is.", "") } });
    assert.ok(built.failed, "the build passed");
    assert.match(built.output, /projects\/out-of-the-rabbit-hole\/en\.md/);
    assert.match(built.output, /from 2 to 4 engineering decisions/);
  });

  // The captures and the diagram of a project live in its folder, and the
  // story shows them from its Markdown.
  test("an image in the folder of a project is shown in its story", async () => {
    const diagram = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 200" width="720" height="200"><title>Test diagram</title><rect width="720" height="200" /></svg>\n`;
    const story = storyFile(
      "What it is.",
      `![The test diagram](./diagram.svg "Test caption.")\n\n${SECOND_DECISION}`,
    );
    const built = await build({
      write: { "projects/out-of-the-rabbit-hole/diagram.svg": diagram, [FILE]: story },
    });
    const page = element(await built.read(STORY.en("out-of-the-rabbit-hole")), "main");
    const figure = element(elements(page, "article")[0] ?? "", "figure");
    assert.equal(textOf(element(figure, "figcaption")), "Test caption.");
    const image = figure.match(/<img\b[^>]*>/)?.[0] ?? "";
    assert.match(image, /\balt="The test diagram"/);
    const src = image.match(/\bsrc="\/([^"]*)"/)?.[1];
    assert.ok(src, `the image has no address in the site: ${image}`);
    assert.match(await built.read(src), /<title>Test diagram<\/title>/);
  });
});
