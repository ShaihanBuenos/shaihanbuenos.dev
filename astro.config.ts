import { writeFile } from "node:fs/promises";
import { satteri } from "@astrojs/markdown-satteri";
import type { AstroIntegration } from "astro";
import { defineConfig } from "astro/config";
import { INDEXABLE } from "./src/lib/config.ts";
import { DEFAULT_LANGUAGE, LANGUAGES } from "./src/lib/languages.ts";
import { projectStoryPlugin } from "./src/lib/project-story.ts";

// Feeds and other files that are not HTML carry no <meta name="robots">.
// Cloudflare reads the _headers file of the output and sends the header on
// everything.
const noindex: AstroIntegration = {
  name: "noindex",
  hooks: {
    "astro:build:done": async ({ dir }) => {
      if (INDEXABLE) return;
      await writeFile(new URL("_headers", dir), "/*\n  X-Robots-Tag: noindex\n");
    },
  },
};

// A draft is shown only in the dev server (`astro dev`). The command decides,
// not NODE_ENV: a build never shows a draft.
const drafts: AstroIntegration = {
  name: "drafts",
  hooks: {
    "astro:config:setup": ({ command, updateConfig }) => {
      updateConfig({
        vite: {
          define: { "import.meta.env.SHOW_DRAFTS": JSON.stringify(command === "dev") },
        },
      });
    },
  },
};

export default defineConfig({
  site: "https://shaihanbuenos.dev",
  output: "static",
  // The addresses of the spec have no trailing slash: /projects, /pt-br/projetos.
  trailingSlash: "never",
  build: { format: "file" },
  i18n: {
    locales: [...LANGUAGES],
    defaultLocale: DEFAULT_LANGUAGE,
    routing: { prefixDefaultLocale: false },
  },
  // The Markdown of a project story gets the structure of its page.
  markdown: { processor: satteri({ hastPlugins: [projectStoryPlugin] }) },
  integrations: [noindex, drafts],
});
