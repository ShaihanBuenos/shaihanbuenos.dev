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

// The fixed page that answers at a path, if there is one. During the build,
// Astro gives the path of the generated file, with `.html`; in the dev
// server, it gives the path as the visitor requests it.
export function pageAt(path: string): FixedPage | undefined {
  const cleanPath = path.replace(/\.html$/, "").replace(/\/(index)?$/, "") || "/";
  const pages = Object.keys(PATHS) as FixedPage[];
  return pages.find((page) => LANGUAGES.some((language) => PATHS[page][language] === cleanPath));
}

// Where the language button leads: the same page in the other language.
// Outside the fixed pages, as on "not found", it leads to the other
// language's Home.
export function equivalentOf(path: string, language: Language): string {
  return pathOf(pageAt(path) ?? "home", otherLanguage(language));
}
