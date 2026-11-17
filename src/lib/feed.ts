import type { APIContext } from "astro";
import { type Idioma, inicioDe, LANG_HTML } from "./idiomas.ts";

// Provisório: as frases do feed passam para os arquivos de conteúdo junto
// com os itens.
const SOBRE_O_FEED: Record<Idioma, string> = {
  en: "Writing by Shaihan Buenos",
  "pt-br": "Textos de Shaihan Buenos",
};

// O feed de um idioma, ainda sem textos: só guarda o endereço. Os itens
// entram com a descoberta (issue #29).
export function feedVazio(idioma: Idioma, { site }: APIContext): Response {
  if (!site) throw new Error("Falta `site` em astro.config.ts.");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Shaihan Buenos</title>
    <link>${new URL(inicioDe(idioma), site).href}</link>
    <description>${SOBRE_O_FEED[idioma]}</description>
    <language>${LANG_HTML[idioma]}</language>
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
