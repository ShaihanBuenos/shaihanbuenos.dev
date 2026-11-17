// What the tests read in the HTML of a built page.
import assert from "node:assert/strict";

// The first element with this name (and this id, when given), with
// everything inside it.
export function element(html: string, name: string, id?: string): string {
  const opening = id === undefined ? `<${name}\\b` : `<${name}\\b[^>]*\\bid="${id}"`;
  const found = html.match(new RegExp(`${opening}[\\s\\S]*?</${name}>`))?.[0];
  assert.ok(found, `the page has no <${name}>${id === undefined ? "" : ` with the id "${id}"`}`);
  return found;
}

// Every element with this name, in the order they appear.
export function elements(html: string, name: string): string[] {
  return html.match(new RegExp(`<${name}\\b[\\s\\S]*?</${name}>`, "g")) ?? [];
}

// What a visitor reads in a piece of HTML.
export function textOf(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function hrefsOf(html: string): string[] {
  return [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)].map(([, href = ""]) => href);
}
