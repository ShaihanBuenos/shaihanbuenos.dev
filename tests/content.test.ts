// Tests of the content in files (section 6 of the spec). Each test builds a
// copy of the site with one content file changed and looks at the result.
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { setTimeout } from "node:timers/promises";
import { dev } from "astro";
import type { Content } from "../src/lib/content.ts";
import { build, type Build, copySite } from "./support/copy.ts";
import { PAGES } from "./support/phrases.ts";

// What `content()` gives the pages in a build, read from the probe.
async function contentOf(built: Build): Promise<Content> {
  return JSON.parse(await built.read("probe.json")) as Content;
}

// Checks that the build stopped and that the error points at the file and
// the problem.
function assertStopped({ failed, output }: Build, ...clues: RegExp[]): void {
  assert.ok(failed, "the build passed");
  for (const clue of clues) assert.match(output, clue);
}

const PROJECT = `name: Test Project
order: 1
state: works-locally
updatedOn: 2026-05-20
`;

const STUDY = `name:
  en: A test study
  pt-br: Um estudo de teste
goal:
  en: A test goal.
  pt-br: Um objetivo de teste.
status: in-progress
start: 2026-02
`;

describe("content in files", { concurrency: true }, () => {
  // The site as it is in the repo, with the example content, built once.
  const example = build();

  test("changing a page name in the phrases file changes the name on the menu", async () => {
    const built = await build({ write: { "pages/en.yaml": PAGES } });
    assert.match(await built.read("projects.html"), /<a href="\/projects"[^>]*>\s*Works\s*<\/a>/);
  });

  test('the title of "not found" comes from the phrases file', async () => {
    const built = await build({ write: { "pages/en.yaml": PAGES } });
    assert.match(await built.read("404.html"), /<h1[^>]*>Gone missing<\/h1>/);
  });

  // Validation: a fixed page that exists in one language and is missing in the other.
  test("a fixed page missing in one language stops the build", async () => {
    const withoutAbout = PAGES.slice(0, PAGES.indexOf("about:"));
    const built = await build({ write: { "pages/pt-br.yaml": withoutAbout } });
    assertStopped(built, /pages\/pt-br\.yaml/, /about/);
  });

  test("the phrases of the fixed pages missing in a whole language stop the build", async () => {
    const built = await build({ remove: ["pages/pt-br.yaml"] });
    assertStopped(built, /pages\/pt-br\.yaml/);
  });

  test("the example content has a text with a translation and one without", async () => {
    const { texts } = await contentOf(await example);
    const languages = texts.map(({ versions }) => Object.keys(versions).sort().join(" "));
    assert.ok(languages.includes("en pt-br"), "no example text has a translation");
    assert.ok(
      languages.some((l) => l === "en" || l === "pt-br"),
      "every example text has a translation",
    );
  });

  test("each version of a text has its own slug, and the translation says if it was made with AI", async () => {
    const { texts } = await contentOf(await example);
    const article = texts.find(({ id }) => id === "example-article");
    assert.equal(article?.originalLanguage, "en");
    assert.equal(article.versions.en?.slug, "example-article-with-translation");
    assert.equal(article.versions.en.translatedWithAI, undefined);
    assert.equal(article.versions["pt-br"]?.slug, "exemplo-de-artigo-com-traducao");
    assert.equal(article.versions["pt-br"].translatedWithAI, true);
  });

  test("the texts come from the most recent to the oldest", async () => {
    const { texts } = await contentOf(await example);
    const dates = texts.map(({ publishedOn }) => String(publishedOn));
    assert.ok(dates.length >= 2);
    assert.deepEqual(dates, dates.toSorted().reverse());
  });

  // The command decides (build or dev server), not the caller's environment.
  test("a draft is left out of the build even with NODE_ENV=development", async () => {
    const built = await build({}, { NODE_ENV: "development" });
    const { texts } = await contentOf(built);
    assert.ok(texts.length > 0);
    assert.deepEqual(
      texts.filter(({ draft }) => draft),
      [],
    );
  });

  test("a study shows the texts that came from it, without repeating the link", async () => {
    const { studies } = await contentOf(await example);
    const study = studies.find(({ id }) => id === "spec-driven-development-with-ai-agents");
    assert.deepEqual(study?.links.texts, ["example-study-note"]);
  });

  test("a draft is left out of the published build", async () => {
    const { texts } = await contentOf(await example);
    assert.ok(texts.length > 0);
    assert.deepEqual(
      texts.filter(({ id, draft }) => draft || id === "example-draft"),
      [],
    );
  });

  // Validation: a required field is missing.
  test("a text without the publication date stops the build", async () => {
    const built = await build({
      write: {
        "texts/example-article/text.yaml":
          "type: article\ntopics: [backend]\noriginalLanguage: en\n",
      },
    });
    assertStopped(built, /texts\/example-article\/text\.yaml/, /publishedOn/);
  });

  test("a text with an empty publication date stops the build", async () => {
    const built = await build({
      write: {
        "texts/example-article/text.yaml":
          "publishedOn:\ntype: article\ntopics: [backend]\noriginalLanguage: en\n",
      },
    });
    assertStopped(built, /texts\/example-article\/text\.yaml/, /publishedOn/);
  });

  test("a text version without the one-line summary stops the build", async () => {
    const built = await build({
      write: {
        "texts/example-study-note/en.md":
          "---\ntitle: No summary\nslug: no-summary\n---\n\nBody.\n",
      },
    });
    assertStopped(built, /texts\/example-study-note\/en\.md/, /summary/);
  });

  test("a translation that does not say if it was made with AI stops the build", async () => {
    const built = await build({
      write: {
        "texts/example-study-note/pt-br.md":
          "---\ntitle: Tradução\nsummary: Resumo.\nslug: traducao\n---\n\nCorpo.\n",
      },
    });
    assertStopped(built, /texts\/example-study-note\/pt-br\.md/, /translatedWithAI/);
  });

  test("a text without the version in the original language stops the build", async () => {
    const built = await build({ remove: ["texts/example-study-note/en.md"] });
    assertStopped(built, /texts\/example-study-note/, /en\.md/);
  });

  // Validation: a topic outside the list.
  test("a text with a topic outside the list stops the build", async () => {
    const built = await build({
      write: {
        "texts/example-article/text.yaml":
          "publishedOn: 2026-01-15\ntype: article\ntopics: [backend, cooking]\noriginalLanguage: en\n",
      },
    });
    assertStopped(built, /texts\/example-article\/text\.yaml/, /topics/);
  });

  test("a text with more than three topics stops the build", async () => {
    const built = await build({
      write: {
        "texts/example-article/text.yaml":
          "publishedOn: 2026-01-15\ntype: article\ntopics: [backend, frontend, ai, career]\noriginalLanguage: en\n",
      },
    });
    assertStopped(built, /texts\/example-article\/text\.yaml/, /topics/);
  });

  test("a text version in a folder without text.yaml stops the build", async () => {
    const built = await build({ remove: ["texts/example-study-note/text.yaml"] });
    assertStopped(built, /texts\/example-study-note/, /text\.yaml/);
  });

  test("two texts with the same slug in the same language stop the build", async () => {
    const built = await build({
      write: {
        "texts/example-study-note/en.md":
          "---\ntitle: Repeated\nsummary: Summary.\nslug: example-article-with-translation\n---\n\nBody.\n",
      },
    });
    assertStopped(built, /texts\/example-(study-note|article)\/en\.md/, /slug/);
  });

  test("every collection has example content", async () => {
    const { projects, studies, roles, research, studyList } = await contentOf(await example);
    assert.ok(projects.length >= 2);
    assert.ok(studies.some(({ status }) => status === "in-progress"));
    assert.ok(studies.some(({ status }) => status === "completed"));
    assert.equal(roles.length, 3);
    assert.deepEqual(research.map(({ type }) => type).sort(), ["paper", "thesis"]);
    assert.match(studyList.checkedOn, /^\d{4}-\d{2}$/);
  });

  test("a project has its story in both languages, and what is not a phrase holds for both", async () => {
    const { projects } = await contentOf(await example);
    const project = projects.find(({ id }) => id === "out-of-the-rabbit-hole");
    assert.equal(project?.state, "works-locally");
    assert.match(project.mark, /^<svg\b/);
    assert.notEqual(project.stories.en.whatItIs, project.stories["pt-br"].whatItIs);
  });

  test("changing the order field of a project changes the order of the list", async () => {
    const { projects } = await contentOf(await example);
    assert.deepEqual(
      projects.map(({ id }) => id),
      ["out-of-the-rabbit-hole", "beto", "ensaio"],
    );

    const swapped = await build({
      write: {
        "projects/out-of-the-rabbit-hole/project.yaml": PROJECT.replace("order: 1", "order: 4"),
      },
    });
    assert.deepEqual(
      (await contentOf(swapped)).projects.map(({ id }) => id),
      ["beto", "ensaio", "out-of-the-rabbit-hole"],
    );
  });

  test("the roles come from the most recent to the oldest", async () => {
    const { roles } = await contentOf(await example);
    const starts = roles.map(({ start }) => start);
    assert.deepEqual(starts, starts.toSorted().reverse());
  });

  // Validation: a required field is missing, in the other collections.
  test("a project without the project state stops the build", async () => {
    const built = await build({
      write: {
        "projects/out-of-the-rabbit-hole/project.yaml": PROJECT.replace(
          "state: works-locally\n",
          "",
        ),
      },
    });
    assertStopped(built, /projects\/out-of-the-rabbit-hole\/project\.yaml/, /state/);
  });

  test("a project without the project mark stops the build", async () => {
    const built = await build({ remove: ["projects/out-of-the-rabbit-hole/mark.svg"] });
    assertStopped(built, /projects\/out-of-the-rabbit-hole/, /mark\.svg/);
  });

  test("a completed study without the end month stops the build", async () => {
    const built = await build({
      write: {
        "studies/spec-driven-development-with-ai-agents.yaml": STUDY.replace(
          "in-progress",
          "completed",
        ),
      },
    });
    assertStopped(built, /studies\/spec-driven-development-with-ai-agents\.yaml/, /end/);
  });

  test("a role without achievements stops the build", async () => {
    const built = await build({
      write: {
        "roles/adp-labs-software-engineer-ii.yaml":
          "company: Test Company\ntitle: Software Engineer\nstart: 2024-03\ncontext:\n  en: Context.\n  pt-br: Contexto.\n",
      },
    });
    assertStopped(built, /roles\/adp-labs-software-engineer-ii\.yaml/, /achievements/);
  });

  test("a research item without the result stops the build", async () => {
    const built = await build({
      write: {
        "research/unisinos-thesis.yaml":
          "type: thesis\norder: 2\ntitle: Title\ntranslatedTitle: Title\nwhatItIs: { en: a, pt-br: a }\nsummary: { en: a, pt-br: a }\nbuilt: { en: a, pt-br: a }\n",
      },
    });
    assertStopped(built, /research\/unisinos-thesis\.yaml/, /result/);
  });

  // Validation: a link to a study, text or project that does not exist.
  test("a text linked to a study that does not exist stops the build", async () => {
    const built = await build({
      write: {
        "texts/example-study-note/text.yaml":
          "publishedOn: 2026-03-10\ntype: study-note\ntopics: [ai]\noriginalLanguage: en\nstudy: no-such-study\n",
      },
    });
    assertStopped(built, /texts\/example-study-note\/text\.yaml/, /no-such-study/);
  });

  test("a study linked to a text that does not exist stops the build", async () => {
    const built = await build({
      write: {
        "studies/spec-driven-development-with-ai-agents.yaml": `${STUDY}links:\n  texts: [no-such-text]\n`,
      },
    });
    assertStopped(built, /studies\/spec-driven-development-with-ai-agents\.yaml/, /no-such-text/);
  });

  test("a study linked to a project that does not exist stops the build", async () => {
    const built = await build({
      write: {
        "studies/spec-driven-development-with-ai-agents.yaml": `${STUDY}links:\n  project: no-such-project\n`,
      },
    });
    assertStopped(
      built,
      /studies\/spec-driven-development-with-ai-agents\.yaml/,
      /no-such-project/,
    );
  });

  test("a study linked to a research item that does not exist stops the build", async () => {
    const built = await build({
      write: {
        "studies/spec-driven-development-with-ai-agents.yaml": `${STUDY}links:\n  research: [no-such-item]\n`,
      },
    });
    assertStopped(built, /studies\/spec-driven-development-with-ai-agents\.yaml/, /no-such-item/);
  });

  // Validation: a project or a study that exists in one language and is
  // missing in the other.
  test("a project missing in one language stops the build", async () => {
    const built = await build({ remove: ["projects/out-of-the-rabbit-hole/en.md"] });
    assertStopped(built, /projects\/out-of-the-rabbit-hole/, /en\.md/);
  });

  test("a project story in a folder without project.yaml stops the build", async () => {
    const built = await build({ remove: ["projects/out-of-the-rabbit-hole/project.yaml"] });
    assertStopped(built, /projects\/out-of-the-rabbit-hole/, /project\.yaml/);
  });

  test("a study missing in one language stops the build", async () => {
    const built = await build({
      write: {
        "studies/spec-driven-development-with-ai-agents.yaml": STUDY.replace(
          "  en: A test goal.\n",
          "",
        ),
      },
    });
    assertStopped(built, /studies\/spec-driven-development-with-ai-agents\.yaml/, /goal/, /en/);
  });

  test("the link of a study to a draft is left out of the published build", async () => {
    const built = await build({
      write: {
        "studies/spec-driven-development-with-ai-agents.yaml": `${STUDY}links:\n  texts: [example-draft, example-study-note]\n`,
      },
    });
    const { studies } = await contentOf(built);
    const study = studies.find(({ id }) => id === "spec-driven-development-with-ai-agents");
    assert.deepEqual(study?.links.texts, ["example-study-note"]);
  });
});

// Kept outside the block above: the dev server runs in this process, and
// does not compete for the machine with the builds running in parallel.
test("a draft is shown in the dev server", async () => {
  const copy = await copySite();
  const server = await dev({ root: copy.folder, logLevel: "silent", server: { port: 4392 } });
  try {
    // The server accepts requests before it finishes reading the content: the
    // test repeats the request until the reading is done.
    let response: Response;
    let body: string;
    let attempts = 0;
    do {
      if (attempts > 0) await setTimeout(250);
      response = await fetch(`http://localhost:${server.address.port}/probe.json`);
      body = await response.text();
    } while (response.status !== 200 && ++attempts < 40);
    assert.equal(response.status, 200, body);
    const { texts } = JSON.parse(body) as Content;
    const draft = texts.find(({ id }) => id === "example-draft");
    assert.equal(draft?.draft, true);
  } finally {
    await server.stop();
    await copy.discard();
  }
});
