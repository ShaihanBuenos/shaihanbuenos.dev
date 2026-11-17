// The body of a project story (section 7.2 of the spec). The Markdown of a
// story has two parts, each under a `##` title: the engineering decisions,
// one per `###` title, and how it was built. This plugin of the Markdown
// processor gives that body the structure the page shows: one section per
// part and one article per decision, with the problem, the choice and what
// was ruled out in a definition list. A body that does not have these parts
// stops the build.
import type { SatteriProcessorOptions } from "@astrojs/markdown-satteri";
import type { Element, ElementContent, Root, RootContent } from "hast";

type HastPlugin = NonNullable<SatteriProcessorOptions["hastPlugins"]>[number];

// A project story has from two to four engineering decisions.
const MIN_DECISIONS = 2;
const MAX_DECISIONS = 4;

// The story file inside src/content, such as "projects/example/en.md", or
// nothing when the Markdown file is not a project story.
function storyFileOf(fileURL: URL | undefined): string | undefined {
  return fileURL?.pathname.match(/\/src\/content\/(projects\/[^/]+\/[^/]+\.md)$/)?.[1];
}

function isElement(node: RootContent, tagName?: string): node is Element {
  return node.type === "element" && (tagName === undefined || node.tagName === tagName);
}

function isBlank(node: RootContent): boolean {
  return node.type === "text" && node.value.trim() === "";
}

function element(tagName: string, classes: string[], children: ElementContent[]): Element {
  const properties = classes.length > 0 ? { className: classes } : {};
  return { type: "element", tagName, properties, children };
}

function textOf(node: ElementContent): string {
  if (node.type === "text") return node.value;
  return node.type === "element" ? node.children.map(textOf).join("") : "";
}

// Splits the nodes at each title of this level: what comes before the first
// title, and then each title with what follows it.
function splitAt(
  nodes: ElementContent[],
  title: string,
): { before: ElementContent[]; parts: { title: Element; body: ElementContent[] }[] } {
  const before: ElementContent[] = [];
  const parts: { title: Element; body: ElementContent[] }[] = [];
  for (const node of nodes) {
    if (isElement(node, title)) parts.push({ title: node, body: [] });
    else (parts.at(-1)?.body ?? before).push(node);
  }
  return { before, parts };
}

// A paragraph that opens with a phrase in bold, such as "**The problem.**
// The text.", is one item of a decision: the phrase and what follows it.
function itemOf(node: ElementContent): { term: string; description: ElementContent[] } | undefined {
  if (!isElement(node, "p")) return undefined;
  const first = node.children.at(0);
  if (!first || !isElement(first, "strong")) return undefined;

  const rest = node.children.slice(1);
  const next = rest.at(0);
  const description =
    next?.type === "text" ? [{ ...next, value: next.value.trimStart() }, ...rest.slice(1)] : rest;
  return { term: textOf(first).replace(/[.:]\s*$/, ""), description };
}

// A paragraph that holds only an image becomes a figure. The title of the
// image, when there is one, is the caption.
function figureOf(node: ElementContent): Element | undefined {
  if (!isElement(node, "p")) return undefined;
  const children = node.children.filter((child) => !isBlank(child));
  const image = children.at(0);
  if (children.length !== 1 || !image || !isElement(image, "img")) return undefined;

  const { title, ...properties } = image.properties;
  const figure = element("figure", [], [{ ...image, properties }]);
  if (typeof title === "string" && title !== "") {
    figure.children.push(element("figcaption", [], [{ type: "text", value: title }]));
  }
  return figure;
}

// The body of a part or of a decision: the items go together into
// definition lists and the images become figures.
function bodyOf(nodes: ElementContent[]): ElementContent[] {
  const body: ElementContent[] = [];
  let list: Element | undefined;
  for (const node of nodes) {
    const item = itemOf(node);
    if (item) {
      if (!list) body.push((list = element("dl", [], [])));
      list.children.push(
        element("dt", ["caption"], [{ type: "text", value: item.term }]),
        element("dd", [], item.description),
      );
      continue;
    }
    list = undefined;
    body.push(figureOf(node) ?? node);
  }
  return body;
}

// The links of the nodes that lead out of the site.
function linksOutOf(nodes: ElementContent[]): string[] {
  return nodes.flatMap((node) => {
    if (!isElement(node)) return [];
    const { href } = node.properties;
    const leaves = node.tagName === "a" && typeof href === "string" && !/^[/#]/.test(href);
    return [...(leaves ? [href] : []), ...linksOutOf(node.children)];
  });
}

function section(classes: string[], title: Element, body: ElementContent[]): Element {
  return element("section", ["section", ...classes], [title, element("div", ["body"], body)]);
}

// The body of a project story, with its structure. `file` names the story
// in the errors.
export function structureOf(root: Root, file: string): Root {
  const refuse = (problem: string): never => {
    throw new Error(`${file}: ${problem}`);
  };

  const nodes = root.children.filter(
    (node): node is ElementContent => node.type !== "doctype" && !isBlank(node),
  );

  const link = linksOutOf(nodes).at(0);
  if (link !== undefined) {
    refuse(`a project story has no link to a repo or a demo, and "${link}" leaves the site`);
  }

  const { before, parts } = splitAt(nodes, "h2");
  if (before.length > 0) {
    refuse("there is text before the first part, and a project story starts with a ## title");
  }
  const decisionsPart = parts.at(0);
  const builtPart = parts.at(1);
  if (!decisionsPart || !builtPart || parts.length !== 2) {
    return refuse(
      `a project story has two parts, the engineering decisions and how it was built, each under a ## title; found ${parts.length}`,
    );
  }

  const decisions = splitAt(decisionsPart.body, "h3");
  const count = decisions.parts.length;
  if (count < MIN_DECISIONS || count > MAX_DECISIONS) {
    refuse(
      `a project story has from two to four engineering decisions, each under a ### title; found ${count}`,
    );
  }

  return {
    type: "root",
    children: [
      section(["story-decisions"], decisionsPart.title, [
        ...bodyOf(decisions.before),
        ...decisions.parts.map(({ title, body }) =>
          element("article", ["decision"], [title, ...bodyOf(body)]),
        ),
      ]),
      section(["sapphire", "story-built"], builtPart.title, bodyOf(builtPart.body)),
    ],
  };
}

// Runs on every Markdown file of the site, and only changes the project stories.
export const projectStoryPlugin: HastPlugin = {
  name: "project-story",
  after(root, ctx) {
    const file = storyFileOf(ctx.fileURL);
    if (file !== undefined) ctx.replaceNode(root, structureOf(root, file));
  },
};
