// How the dates of the content are written on a page, in each language.
import { type Language, HTML_LANG } from "./languages.ts";

// A day of the content, such as a publication date: "Mar 10, 2026".
export function dayIn(day: Date, language: Language): string {
  return day.toLocaleDateString(HTML_LANG[language], {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

// The value of a day for the `datetime` attribute: "2026-03-10".
export function isoDayOf(day: Date): string {
  return day.toISOString().slice(0, 10);
}

// A month of the content, written as "2026-02" in the files: "Feb 2026".
export function monthIn(month: string, language: Language): string {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString(HTML_LANG[language], {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
