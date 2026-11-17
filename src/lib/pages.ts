import { type Language, LANGUAGES, homeOf, otherLanguage } from "./languages.ts";

// The pages of the menu, in the order they appear (section 4 of the spec).
export const MENU_PAGES = ["projects", "writing", "studies", "research", "about"] as const;

export type FixedPage = "home" | (typeof MENU_PAGES)[number];

// The path of each fixed page in each language, written in that language.
const PATHS: Record<FixedPage, Record<Language, string>> = {
  home: { en: homeOf("en"), "pt-br": homeOf("pt-br") },
  projects: { en: "/projects", "pt-br": "/pt-br/projetos" },
  writing: { en: "/writing", "pt-br": "/pt-br/textos" },
  studies: { en: "/studies", "pt-br": "/pt-br/estudos" },
  research: { en: "/research", "pt-br": "/pt-br/pesquisa" },
  about: { en: "/about", "pt-br": "/pt-br/sobre" },
};

export function pathOf(page: FixedPage, language: Language): string {
  return PATHS[page][language];
}

// The path of a project story: the name of the project's folder closes it.
export function projectPathOf(id: string, language: Language): string {
  return `${pathOf("projects", language)}/${id}`;
}

// The path of one version of a text, under the prefix of its own language.
export function textPathOf(slug: string, language: Language): string {
  return `${pathOf("writing", language)}/${slug}`;
}

// The path of a study: it has no page of its own, so the path leads to the
// study on the study list, which carries the name of the study's file as id.
export function studyPathOf(id: string, language: Language): string {
  return `${pathOf("studies", language)}#${id}`;
}

// The path of a research item: it has no page of its own, so the path leads
// to the item on the Research page, which carries the name of the item's
// file as id.
export function researchPathOf(id: string, language: Language): string {
  return `${pathOf("research", language)}#${id}`;
}

// Where the language button leads on the page of a text. Each version has
// its own slug, so the path does not tell: the page gives the slug of the
// version in the other language, when the text has one. Without it, the
// button leads to the other language's list of texts.
export function textEquivalentOf(
  slugInOtherLanguage: string | undefined,
  language: Language,
): string {
  const other = otherLanguage(language);
  return slugInOtherLanguage === undefined
    ? pathOf("writing", other)
    : textPathOf(slugInOtherLanguage, other);
}

// A path as the visitor requests it. During the build, Astro gives the path
// of the generated file, with `.html`; in the dev server, it gives the path
// as requested.
function requestedPath(path: string): string {
  return path.replace(/\.html$/, "").replace(/\/(index)?$/, "") || "/";
}

// The fixed page that answers at a path, if there is one.
export function pageAt(path: string): FixedPage | undefined {
  const requested = requestedPath(path);
  const pages = Object.keys(PATHS) as FixedPage[];
  return pages.find((page) => LANGUAGES.some((language) => PATHS[page][language] === requested));
}

// The page of the menu a path belongs to: the page itself or the one above
// it, as Projects is for a project story.
export function sectionAt(path: string): FixedPage | undefined {
  const requested = requestedPath(path);
  return (
    pageAt(path) ??
    MENU_PAGES.find((page) =>
      LANGUAGES.some((language) => requested.startsWith(`${PATHS[page][language]}/`)),
    )
  );
}

// Where the language button leads: the same page in the other language. A
// project story leads to the same story. Outside these, as on "not found",
// it leads to the other language's Home. The page of a text does not use
// this: it gives its own equivalent, from `textEquivalentOf`.
export function equivalentOf(path: string, language: Language): string {
  const other = otherLanguage(language);
  const stories = `${pathOf("projects", language)}/`;
  const requested = requestedPath(path);
  if (requested.startsWith(stories)) return projectPathOf(requested.slice(stories.length), other);
  return pathOf(pageAt(path) ?? "home", other);
}
