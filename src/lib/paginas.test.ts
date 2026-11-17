import assert from "node:assert/strict";
import { test } from "node:test";
import { equivalenteDe } from "./paginas.ts";

test("o equivalente de uma página fixa é a mesma página no outro idioma", () => {
  assert.equal(equivalenteDe("/projects", "en"), "/pt-br/projetos");
  assert.equal(equivalenteDe("/pt-br/sobre", "pt-br"), "/about");
});

test("o equivalente do Início é o Início do outro idioma", () => {
  assert.equal(equivalenteDe("/", "en"), "/pt-br");
  assert.equal(equivalenteDe("/pt-br", "pt-br"), "/");
});

// Na construção, o Astro entrega o caminho como o do arquivo gerado, com
// `.html`; rodando localmente, entrega o endereço como o visitante pede.
test("o caminho vale com ou sem o nome do arquivo gerado", () => {
  assert.equal(equivalenteDe("/writing.html", "en"), "/pt-br/textos");
  assert.equal(equivalenteDe("/index.html", "en"), "/pt-br");
  assert.equal(equivalenteDe("/pt-br.html", "pt-br"), "/");
  assert.equal(equivalenteDe("/pt-br/", "pt-br"), "/");
});

test("fora das páginas fixas, o equivalente é o Início do outro idioma", () => {
  assert.equal(equivalenteDe("/404.html", "en"), "/pt-br");
  assert.equal(equivalenteDe("/pt-br/nao-existe", "pt-br"), "/");
});
