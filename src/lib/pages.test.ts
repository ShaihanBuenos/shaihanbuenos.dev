import assert from "node:assert/strict";
import { test } from "node:test";
import { equivalentOf } from "./pages.ts";

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
