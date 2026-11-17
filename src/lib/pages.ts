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
// it leads to the other language's Home.
export function equivalentOf(path: string, language: Language): string {
  const other = otherLanguage(language);
  const stories = `${pathOf("projects", language)}/`;
  const requested = requestedPath(path);
  if (requested.startsWith(stories)) return projectPathOf(requested.slice(stories.length), other);
  return pathOf(pageAt(path) ?? "home", other);
}
