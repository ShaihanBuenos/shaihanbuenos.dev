// The two languages of the site. The value is the address prefix: English
// lives at the root and Portuguese under /pt-br.
export const LANGUAGES = ["en", "pt-br"] as const;

export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "en";

// The value of the HTML `lang` attribute for each language.
export const HTML_LANG: Record<Language, string> = {
  en: "en",
  "pt-br": "pt-BR",
};

// The language of a page as the sites where an address is shared name it.
export const SHARE_LOCALE: Record<Language, string> = {
  en: "en_US",
  "pt-br": "pt_BR",
};

// How each language is shown on the language button.
export const SHORT_NAME: Record<Language, string> = {
  en: "EN",
  "pt-br": "PT",
};

// The `lang` of something a page shows in a language that is not its own,
// as a title in the original. In the page's own language it needs none.
export function foreignLangOf(written: Language, page: Language): string | undefined {
  return written === page ? undefined : HTML_LANG[written];
}

export function otherLanguage(language: Language): Language {
  return language === "en" ? "pt-br" : "en";
}

// The path of the Home page in each language.
export function homeOf(language: Language): string {
  return language === DEFAULT_LANGUAGE ? "/" : `/${language}`;
}

export function languageOf(locale: string | undefined): Language {
  const language = LANGUAGES.find((l) => l === locale);
  if (!language) throw new Error(`Unknown language: ${locale ?? "none"}`);
  return language;
}
