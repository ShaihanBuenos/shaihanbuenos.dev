// What the tests read in the CSS of a built page.
import { readFile } from "node:fs/promises";

const dist = new URL("../../dist/", import.meta.url).pathname;

// A rule of a style sheet: a style rule (`.plan a:hover`), an at-rule with
// rules inside (`@media ...`, `@keyframes ...`) or a step of a keyframes rule
// (`55%`).
export interface Rule {
  // What comes before the braces, with single spaces.
  prelude: string;
  declarations: { property: string; value: string }[];
  rules: Rule[];
  // The preludes of the rules around this one, from the outside in.
  around: string[];
}

// Reads the rules of a block, from `start` to the brace that closes it.
function block(
  css: string,
  start: number,
  around: string[],
): Pick<Rule, "declarations" | "rules"> & { end: number } {
  const declarations: Rule["declarations"] = [];
  const rules: Rule[] = [];
  let text = "";
  let index = start;

  const declare = () => {
    const colon = text.indexOf(":");
    if (colon > 0) {
      declarations.push({
        property: text.slice(0, colon).trim().toLowerCase(),
        value: text.slice(colon + 1).trim(),
      });
    }
    text = "";
  };

  while (index < css.length) {
    const character = css.charAt(index);
    if (character === '"' || character === "'") {
      // A string goes whole into the text: a brace inside it is not a block.
      const close = css.indexOf(character, index + 1);
      if (close < 0) break;
      text += css.slice(index, close + 1);
      index = close + 1;
    } else if (character === "{") {
      const prelude = text.replace(/\s+/g, " ").trim();
      text = "";
      const inner = block(css, index + 1, [...around, prelude]);
      rules.push({ prelude, around, declarations: inner.declarations, rules: inner.rules });
      index = inner.end + 1;
    } else if (character === ";") {
      declare();
      index += 1;
    } else if (character === "}") {
      break;
    } else {
      text += character;
      index += 1;
    }
  }
  declare();
  return { declarations, rules, end: index };
}

export function rulesOf(css: string): Rule[] {
  return block(css.replace(/\/\*[\s\S]*?\*\//g, ""), 0, []).rules;
}

// Every rule of a style sheet, with the ones inside the at-rules, in order.
export function everyRule(rules: Rule[]): Rule[] {
  return rules.flatMap((rule) => [rule, ...everyRule(rule.rules)]);
}

// All the CSS a built page loads: its style sheets and its <style> elements.
export async function cssOf(page: string): Promise<Rule[]> {
  const html = await readFile(`${dist}${page}`, "utf8");
  let css = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(([, c]) => c).join("\n");
  for (const [, attributes = ""] of html.matchAll(/<link\b([^>]*)>/g)) {
    const href = attributes.match(/\bhref="\/([^"]*)"/)?.[1];
    if (href !== undefined && /\brel="stylesheet"/.test(attributes)) {
      css += await readFile(`${dist}${href}`, "utf8");
    }
  }
  return everyRule(rulesOf(css));
}

// The value of a property in a rule: the last one declared.
export function valueOf(rule: Rule, property: string): string | undefined {
  return rule.declarations.findLast((declaration) => declaration.property === property)?.value;
}
