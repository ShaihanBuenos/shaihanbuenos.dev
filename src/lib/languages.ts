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

// How each language is shown on the language button.
export const SHORT_NAME: Record<Language, string> = {
  en: "EN",
  "pt-br": "PT",
};

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
