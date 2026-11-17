import assert from "node:assert/strict";
import { test } from "node:test";
import {
  aboutSectionPathOf,
  equivalentOf,
  projectPathOf,
  researchItemPathOf,
  sectionAt,
  studyPathOf,
  textEquivalentOf,
  textPathOf,
} from "./pages.ts";

test("the equivalent of a fixed page is the same page in the other language", () => {
  assert.equal(equivalentOf("/projects", "en"), "/pt-br/projetos");
  assert.equal(equivalentOf("/pt-br/sobre", "pt-br"), "/about");
});

test("the equivalent of Home is the other language's Home", () => {
  assert.equal(equivalentOf("/", "en"), "/pt-br");
  assert.equal(equivalentOf("/pt-br", "pt-br"), "/");
});

// During the build, Astro gives the path of the generated file, with
// `.html`; in the dev server, it gives the path as the visitor requests it.
test("the path works with or without the generated file name", () => {
  assert.equal(equivalentOf("/writing.html", "en"), "/pt-br/textos");
  assert.equal(equivalentOf("/index.html", "en"), "/pt-br");
  assert.equal(equivalentOf("/pt-br.html", "pt-br"), "/");
  assert.equal(equivalentOf("/pt-br/", "pt-br"), "/");
});

test("outside the fixed pages, the equivalent is the other language's Home", () => {
  assert.equal(equivalentOf("/404.html", "en"), "/pt-br");
  assert.equal(equivalentOf("/pt-br/nao-existe", "pt-br"), "/");
});

test("a project story lives under the Projects page of its language", () => {
  assert.equal(projectPathOf("example-project", "en"), "/projects/example-project");
  assert.equal(projectPathOf("example-project", "pt-br"), "/pt-br/projetos/example-project");
});

test("a study lives on the Studies page of its language, under the name of its file", () => {
  assert.equal(studyPathOf("example-study", "en"), "/studies#example-study");
  assert.equal(studyPathOf("example-study", "pt-br"), "/pt-br/estudos#example-study");
});

test("a research item lives on the Research page of its language, under the name of its file", () => {
  assert.equal(researchItemPathOf("example-paper", "en"), "/research#example-paper");
  assert.equal(researchItemPathOf("example-paper", "pt-br"), "/pt-br/pesquisa#example-paper");
});

test("a section of About lives on the About page of its language, under its name", () => {
  assert.equal(aboutSectionPathOf("education", "en"), "/about#education");
  assert.equal(aboutSectionPathOf("contact", "pt-br"), "/pt-br/sobre#contact");
});

test("a version of a text lives under the Writing page of its language", () => {
  assert.equal(textPathOf("an-example", "en"), "/writing/an-example");
  assert.equal(textPathOf("um-exemplo", "pt-br"), "/pt-br/textos/um-exemplo");
});

test("the equivalent of a project story is the same story in the other language", () => {
  assert.equal(equivalentOf("/projects/example-project", "en"), "/pt-br/projetos/example-project");
  assert.equal(
    equivalentOf("/pt-br/projetos/example-project", "pt-br"),
    "/projects/example-project",
  );
  assert.equal(
    equivalentOf("/projects/example-project.html", "en"),
    "/pt-br/projetos/example-project",
  );
});

test("a project story belongs to the Projects page, and a fixed page to itself", () => {
  assert.equal(sectionAt("/projects/example-project"), "projects");
  assert.equal(sectionAt("/pt-br/projetos/example-project.html"), "projects");
  assert.equal(sectionAt("/pt-br/sobre"), "about");
  assert.equal(sectionAt("/pt-br/nao-existe"), undefined);
  assert.equal(sectionAt("/does-not-exist"), undefined);
});

test("a text belongs to the Writing page", () => {
  assert.equal(sectionAt("/writing/an-example"), "writing");
  assert.equal(sectionAt("/pt-br/textos/um-exemplo.html"), "writing");
});

// Section 5 of the spec: each version has its own slug, so the equivalent
// of a text comes from the content, not from the path.
test("the equivalent of a translated text is its version in the other language", () => {
  assert.equal(textEquivalentOf("um-exemplo", "en"), "/pt-br/textos/um-exemplo");
  assert.equal(textEquivalentOf("an-example", "pt-br"), "/writing/an-example");
});

test("the equivalent of a text without a translation is the other language's list of texts", () => {
  assert.equal(textEquivalentOf(undefined, "en"), "/pt-br/textos");
  assert.equal(textEquivalentOf(undefined, "pt-br"), "/writing");
});
