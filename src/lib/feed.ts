// The feed of each language (section 9 of the spec): every text once, in the
// version of the feed's language when there is one and in the original when
// there is not, with the text type and the whole text.
import type { APIContext } from "astro";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { render } from "astro:content";
import { content, lastChangeOf, versionIn } from "./content.ts";
import { type Language, DEFAULT_LANGUAGE, HTML_LANG } from "./languages.ts";
import { addressOf, pathOf, textPathOf } from "./pages.ts";
import { NAME } from "./site.ts";

// The path of each language's feed.
export function feedPathOf(language: Language): string {
  return language === DEFAULT_LANGUAGE ? "/rss.xml" : `/${language}/rss.xml`;
}

// The name of each language's feed, for the feed readers and for the <head>.
export function feedNameOf(writing: string): string {
  return `${NAME} · ${writing}`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// HTML inside the XML of the feed. A CDATA section ends at "]]>", so the
// one inside the HTML is split in two.
function cdata(html: string): string {
  return `<![CDATA[${html.replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;
}

// The day of the content as the feed format writes it.
function feedDayOf(day: Date): string {
  return day.toUTCString();
}

export async function feed(language: Language, { site }: APIContext): Promise<Response> {
  const address = (path: string) => addressOf(path, site);

  const { pages, texts } = await content();
  const phrases = pages[language];

  // The body of a text is shown as on its page, images included: the
  // container is what Astro gives to show a piece of a page outside a page.
  const container = await AstroContainer.create();

  const items: string[] = [];
  for (const text of texts) {
    const shown = versionIn(text, language);
    const original = text.versions[text.originalLanguage];
    if (!original) throw new Error(`texts/${text.id}: the original is missing`);
    // The identifier of a text is the address of its original, in both
    // feeds: it does not change when a translation arrives.
    const id = address(textPathOf(original.slug, text.originalLanguage));

    const { Content } = await render(shown.version.file);
    const html = await container.renderToString(Content);
    // The translation note, as on the page of the text. A version in a
    // language other than the original one is a translation.
    const note = phrases.writing.translationNote;
    const translationNote =
      shown.language === text.originalLanguage
        ? ""
        : `<p>${escapeXml(note.from)} ${
            shown.version.translatedWithAI ? `${escapeXml(note.withAI)} ` : ""
          }<a href="${id}" hreflang="${HTML_LANG[text.originalLanguage]}">${escapeXml(
            note.original,
          )}</a></p>\n`;
    // Outside the site, an address that starts at the root leads nowhere,
    // and a link to a part of the text has no page to look for the part in.
    const page = address(textPathOf(shown.version.slug, shown.language));
    const body = html.replace(
      /\b(href|src)="([/#][^"]*)"/g,
      (_, attribute: string, path: string) =>
        `${attribute}="${path.startsWith("#") ? page + path : address(path)}"`,
    );

    items.push(`    <item>
      <title>${escapeXml(shown.version.title)}</title>
      <link>${page}</link>
      <guid isPermaLink="true">${id}</guid>
      <pubDate>${feedDayOf(text.publishedOn)}</pubDate>${
        text.updatedOn
          ? `\n      <atom:updated>${text.updatedOn.toISOString().replace(".000", "")}</atom:updated>`
          : ""
      }
      <category>${escapeXml(phrases.writing.types[text.type])}</category>
      <description>${escapeXml(shown.version.summary)}</description>
      <content:encoded>${cdata(translationNote + body)}</content:encoded>
    </item>
`);
  }

  // The day of the feed is the one of the last change in the texts, and not
  // the day of the build: the same content gives the same feed.
  const lastChange = texts
    .map(lastChangeOf)
    .sort((a, b) => b.getTime() - a.getTime())
    .at(0);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(feedNameOf(phrases.writing.name))}</title>
    <link>${address(pathOf("writing", language))}</link>
    <description>${escapeXml(phrases.writing.description)}</description>
    <language>${HTML_LANG[language]}</language>${
      lastChange ? `\n    <lastBuildDate>${feedDayOf(lastChange)}</lastBuildDate>` : ""
    }
    <atom:link href="${address(feedPathOf(language))}" rel="self" type="application/rss+xml" />
${items.join("")}  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
