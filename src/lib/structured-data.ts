// The structured data search engines read (section 9 of the spec): a person
// on Home and an article on a text, with what the content says.
import { CONTACT } from "./contact.ts";
import { type Text, type TextVersion, lastChangeOf } from "./content.ts";
import { isoDayOf } from "./dates.ts";
import { type Language, HTML_LANG } from "./languages.ts";
import type { Phrases } from "./schemas.ts";
import { NAME } from "./site.ts";

type Data = Record<string, unknown>;

// Shaihan, the same on every page that names him: the identifier ties the
// person of Home to the author of each text.
function person(home: string): Data {
  return { "@type": "Person", "@id": `${home}/#person`, name: NAME, url: home };
}

// The addresses the structured data names: the English Home, which stands
// for the site, and the page the data is on. `addressOf` gives them.
interface Where {
  site: string;
  page: string;
  language: Language;
}

// The person of Home: the label, the intro and the contact.
export function personData({ site, page, language }: Where, phrases: Phrases): Data {
  const links = CONTACT.map(({ href }) => href);
  return {
    ...person(site),
    jobTitle: phrases.home.label,
    description: phrases.home.intro,
    email: links.find((href) => href.startsWith("mailto:")),
    sameAs: links.filter((href) => href.startsWith("https://")),
    mainEntityOfPage: { "@type": "ProfilePage", "@id": page, inLanguage: HTML_LANG[language] },
  };
}

// The article of one version of a text: the dates, the text type and the
// topics of the content.
export function articleData(
  { site, page, language, shareImage }: Where & { shareImage: string },
  text: Text,
  version: TextVersion,
  phrases: Phrases,
): Data {
  return {
    "@type": "Article",
    headline: version.title,
    description: version.summary,
    url: page,
    mainEntityOfPage: page,
    inLanguage: HTML_LANG[language],
    datePublished: isoDayOf(text.publishedOn),
    // A text without a content revision last changed when it was published.
    dateModified: isoDayOf(lastChangeOf(text)),
    articleSection: phrases.writing.types[text.type],
    keywords: text.topics.map((topic) => phrases.writing.topics[topic]),
    image: shareImage,
    author: person(site),
  };
}
