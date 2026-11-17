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

// How many engineering decisions a project story has.
const MIN_DECISIONS = 2;
const MAX_DECISIONS = 4;
// A decision has the problem, the choice and what was ruled out.
const DECISION_ITEMS = 3;

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
  tagName: string,
): { before: ElementContent[]; parts: { title: Element; body: ElementContent[] }[] } {
  const before: ElementContent[] = [];
  const parts: { title: Element; body: ElementContent[] }[] = [];
  for (const node of nodes) {
    if (isElement(node, tagName)) parts.push({ title: node, body: [] });
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

// Every element among the nodes, at any depth.
function elementsIn(nodes: ElementContent[]): Element[] {
  return nodes.flatMap((node) => (isElement(node) ? [node, ...elementsIn(node.children)] : []));
}

// Whether there is HTML written by hand among the nodes, at any depth. The
// processor keeps it as it is, so nothing here can check what it holds.
function hasRawHtml(nodes: ElementContent[]): boolean {
  return nodes.some(
    (node) => (node.type as string) === "raw" || (isElement(node) && hasRawHtml(node.children)),
  );
}

// An address inside the site: a page ("/research") or a place on the page.
function staysInTheSite(address: string): boolean {
  return /^(\/(?!\/)|#)/.test(address);
}

// An address that names a site, as "https://…" and "//…" do.
function isRemote(address: string): boolean {
  return /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(address);
}

// What a project story may not hold, if there is any: the problem, for the error.
function forbiddenIn(nodes: ElementContent[]): string | undefined {
  if (hasRawHtml(nodes)) {
    return "a project story is written in Markdown only, without HTML tags, so its links can be checked: a project story has no link to a repo or a demo";
  }
  for (const { tagName, properties } of elementsIn(nodes)) {
    const { href, src } = properties;
    if (tagName === "a" && typeof href === "string" && !staysInTheSite(href)) {
      return `a project story has no link to a repo or a demo, and "${href}" leaves the site`;
    }
    if (tagName === "img" && typeof src === "string" && isRemote(src)) {
      return `the images of a story live in the folder of the project, and "${src}" comes from outside`;
    }
  }
  return undefined;
}

// The first paragraph of "How it was built" is the phrase that opens the
// section: the agent credit.
function withLead(body: ElementContent[]): ElementContent[] {
  const first = body.at(0);
  if (!first || !isElement(first, "p")) return body;
  return [{ ...first, properties: { ...first.properties, className: ["lead"] } }, ...body.slice(1)];
}

function section(classes: string[], title: Element, body: ElementContent[]): Element {
  return element("section", ["section", ...classes], [title, element("div", ["body"], body)]);
}

// The body of a project story, with its structure. `file` names the story
// in the errors.
function structureOf(root: Root, file: string): Root {
  const refuse = (problem: string): never => {
    throw new Error(`${file}: ${problem}`);
  };

  const nodes = root.children.filter(
    (node): node is ElementContent => node.type !== "doctype" && !isBlank(node),
  );

  const forbidden = forbiddenIn(nodes);
  if (forbidden !== undefined) refuse(forbidden);

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
      `a project story has from ${MIN_DECISIONS} to ${MAX_DECISIONS} engineering decisions, each under a ### title; found ${count}`,
    );
  }

  for (const { title, body } of decisions.parts) {
    if (body.filter((node) => itemOf(node)).length < DECISION_ITEMS) {
      refuse(
        `the decision "${textOf(title)}" has the problem, the choice and what was ruled out, each in a paragraph that opens in bold`,
      );
    }
  }
  if (builtPart.body.length === 0) {
    refuse('"How it was built", the second part, is empty, and it holds the agent credit');
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
      section(["sapphire", "story-built"], builtPart.title, withLead(bodyOf(builtPart.body))),
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
