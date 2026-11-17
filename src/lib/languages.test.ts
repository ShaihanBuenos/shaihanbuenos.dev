import assert from "node:assert/strict";
import { test } from "node:test";
import { foreignLangOf } from "./languages.ts";

test("what a page shows in the other language is marked with that language", () => {
  assert.equal(foreignLangOf("en", "pt-br"), "en");
  assert.equal(foreignLangOf("pt-br", "en"), "pt-BR");
});

test("what a page shows in its own language carries no mark", () => {
  assert.equal(foreignLangOf("en", "en"), undefined);
  assert.equal(foreignLangOf("pt-br", "pt-br"), undefined);
});
