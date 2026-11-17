import type { APIRoute } from "astro";
import { content, lastChangeOf } from "../lib/content.ts";
import { isoDayOf } from "../lib/dates.ts";
import { LANGUAGES } from "../lib/languages.ts";
import { FIXED_PAGES, addressOf, pathOf, projectPathOf, textPathOf } from "../lib/pages.ts";

// The site map (section 9 of the spec): every page of both languages, at
// its canonical address. "Not found" is not on it, and a draft never
// reaches it, because `content()` leaves drafts out of a build. A text and a
// project story say when they last changed; a fixed page is updated in
// place, without a date.
export const GET: APIRoute = async ({ site }) => {
  const { texts, projects } = await content();

  const pages: { path: string; lastChange?: Date }[] = LANGUAGES.flatMap((language) => [
    ...FIXED_PAGES.map((page) => ({ path: pathOf(page, language) })),
    ...projects.map((project) => ({
      path: projectPathOf(project.id, language),
      lastChange: project.updatedOn,
    })),
    ...texts.flatMap((text) => {
      const version = text.versions[language];
      return version
        ? [
            {
              path: textPathOf(version.slug, language),
              lastChange: lastChangeOf(text),
            },
          ]
        : [];
    }),
  ]);

  const urls = pages.map(({ path, lastChange }) => {
    const address = addressOf(path, site);
    const lastmod = lastChange ? `\n    <lastmod>${isoDayOf(lastChange)}</lastmod>` : "";
    return `  <url>\n    <loc>${address}</loc>${lastmod}\n  </url>\n`;
  });

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("")}</urlset>\n`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
};
