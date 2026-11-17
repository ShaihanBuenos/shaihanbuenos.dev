import { writeFile } from "node:fs/promises";
import type { AstroIntegration } from "astro";
import { defineConfig } from "astro/config";
import { PODE_SER_INDEXADO } from "./src/lib/configuracao.ts";
import { IDIOMA_PADRAO, IDIOMAS } from "./src/lib/idiomas.ts";

// Feeds e outros arquivos que não são HTML não levam <meta name="robots">.
// A Cloudflare lê o arquivo _headers da saída e manda o cabeçalho em tudo.
const naoIndexar: AstroIntegration = {
  name: "nao-indexar",
  hooks: {
    "astro:build:done": async ({ dir }) => {
      if (PODE_SER_INDEXADO) return;
      await writeFile(new URL("_headers", dir), "/*\n  X-Robots-Tag: noindex\n");
    },
  },
};

// Um rascunho aparece só no site rodando localmente (`astro dev`). Quem
// decide é o comando, e não o NODE_ENV: uma construção nunca mostra rascunho.
const rascunhos: AstroIntegration = {
  name: "rascunhos",
  hooks: {
    "astro:config:setup": ({ command, updateConfig }) => {
      updateConfig({
        vite: {
          define: { "import.meta.env.MOSTRAR_RASCUNHOS": JSON.stringify(command === "dev") },
        },
      });
    },
  },
};

export default defineConfig({
  site: "https://shaihanbuenos.dev",
  output: "static",
  // Os endereços da spec não têm barra no fim: /projects, /pt-br/projetos.
  trailingSlash: "never",
  build: { format: "file" },
  i18n: {
    locales: [...IDIOMAS],
    defaultLocale: IDIOMA_PADRAO,
    routing: { prefixDefaultLocale: false },
  },
  integrations: [naoIndexar, rascunhos],
});
