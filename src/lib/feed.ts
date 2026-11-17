import type { APIContext } from "astro";
import { type Language, DEFAULT_LANGUAGE, homeOf, HTML_LANG } from "./languages.ts";

// Temporary: the feed's phrases move to the content files together with the
// items.
const ABOUT_THE_FEED: Record<Language, string> = {
  en: "Writing by Shaihan Buenos",
  "pt-br": "Textos de Shaihan Buenos",
};

// The path of each language's feed.
export function feedPathOf(language: Language): string {
  return language === DEFAULT_LANGUAGE ? "/rss.xml" : `/${language}/rss.xml`;
}

// The feed of a language, still without texts: it only holds the address.
// The items arrive with discovery (issue #13).
export function emptyFeed(language: Language, { site }: APIContext): Response {
  if (!site) throw new Error("Missing `site` in astro.config.ts.");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Shaihan Buenos</title>
    <link>${new URL(homeOf(language), site).href}</link>
    <description>${ABOUT_THE_FEED[language]}</description>
    <language>${HTML_LANG[language]}</language>
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
