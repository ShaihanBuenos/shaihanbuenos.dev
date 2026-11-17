import assert from "node:assert/strict";
import { test } from "node:test";
import { markdownToHtml } from "satteri";
import { projectStoryPlugin } from "./project-story.ts";

const STORY = new URL("file:///site/src/content/projects/example-project/en.md");

function htmlOf(markdown: string, fileURL = STORY): string {
  const result = markdownToHtml(markdown, { hastPlugins: [projectStoryPlugin], fileURL });
  // The plugin has no asynchronous step, so the result comes at once.
  assert.ok(!(result instanceof Promise));
  return result.html.trim();
}

const BODY = `## Engineering decisions

### First decision

**The problem.** A *made-up* problem.

**The choice.** A choice.

**Ruled out:** An alternative.

### Second decision

**The problem.** Another problem.

**The choice.** Another choice.

**Ruled out:** Another alternative.

## How it was built

The agent credit.
`;

test("the body of a project story becomes two sections, with one article per decision", () => {
  assert.equal(
    htmlOf(BODY),
    '<section class="section story-decisions"><h2>Engineering decisions</h2><div class="body">' +
      '<article class="decision"><h3>First decision</h3><dl>' +
      '<dt class="caption">The problem</dt><dd>A <em>made-up</em> problem.</dd>' +
      '<dt class="caption">The choice</dt><dd>A choice.</dd>' +
      '<dt class="caption">Ruled out</dt><dd>An alternative.</dd></dl></article>' +
      '<article class="decision"><h3>Second decision</h3><dl>' +
      '<dt class="caption">The problem</dt><dd>Another problem.</dd>' +
      '<dt class="caption">The choice</dt><dd>Another choice.</dd>' +
      '<dt class="caption">Ruled out</dt><dd>Another alternative.</dd></dl></article>' +
      "</div></section>" +
      '<section class="section sapphire story-built"><h2>How it was built</h2><div class="body">' +
      '<p class="lead">The agent credit.</p></div></section>',
  );
});

test("a Markdown file outside the projects is left as it is", () => {
  const text = new URL("file:///site/src/content/texts/example-article/en.md");
  assert.equal(
    htmlOf("## A title\n\n**Bold.** Text.\n", text),
    "<h2>A title</h2>\n<p><strong>Bold.</strong> Text.</p>",
  );
});

test("an image alone in a paragraph becomes a figure, with its title as the caption", () => {
  const html = htmlOf(
    BODY.replace(
      "**Ruled out:** An alternative.",
      '**Ruled out:** An alternative.\n\n![The alt text](./diagram.svg "The caption")',
    ),
  );
  assert.match(
    html,
    /<\/dl><figure><img src="\.\/diagram\.svg" alt="The alt text"><figcaption>The caption<\/figcaption><\/figure><\/article>/,
  );
});

test("an image without a title becomes a figure without a caption", () => {
  const html = htmlOf(
    BODY.replace("The agent credit.", "Credit.\n\n![The alt text](./capture.png)"),
  );
  assert.match(html, /<figure><img src="\.\/capture\.png" alt="The alt text"><\/figure>/);
});

function assertRefused(markdown: string, ...clues: RegExp[]): void {
  assert.throws(
    () => htmlOf(markdown),
    (error: Error) => {
      for (const clue of [/projects\/example-project\/en\.md/, ...clues]) {
        assert.match(error.message, clue);
      }
      return true;
    },
  );
}

test("a story without one of its two parts is refused", () => {
  assertRefused(BODY.slice(0, BODY.indexOf("## How it was built")), /two parts/, /found 1/);
});

test("a story with text before the first part is refused", () => {
  assertRefused(`Loose text.\n\n${BODY}`, /before the first part/);
});

test("a story with fewer than two or more than four decisions is refused", () => {
  const one =
    BODY.slice(0, BODY.indexOf("### Second decision")) + "## How it was built\n\nCredit.\n";
  assertRefused(one, /from 2 to 4 engineering decisions/, /found 1/);
  const five = BODY.replace(
    "## How it was built",
    "### Third\n\n**P.** Text.\n\n**C.** Text.\n\n**R.** Text.\n\n### Fourth\n\n**P.** Text.\n\n**C.** Text.\n\n**R.** Text.\n\n### Fifth\n\n**P.** Text.\n\n**C.** Text.\n\n**R.** Text.\n\n## How it was built",
  );
  assertRefused(five, /from 2 to 4 engineering decisions/, /found 5/);
});

// Section 7.2 of the spec: no link to a repo and no live demo.
test("a story with a link that leaves the site is refused", () => {
  assertRefused(
    BODY.replace("The agent credit.", "See [the code](https://github.com/example/example)."),
    /https:\/\/github\.com\/example\/example/,
    /repo or (a )?demo/,
  );
});

test("a story may link to a page of the site", () => {
  const html = htmlOf(BODY.replace("The agent credit.", "See [the research](/research)."));
  assert.match(html, /<a href="\/research">the research<\/a>/);
});

// Section 7.2 of the spec: each decision has the problem, the choice and
// what was ruled out.
test("a decision without its three items is refused", () => {
  assertRefused(
    BODY.replace("**Ruled out:** An alternative.\n\n", ""),
    /First decision/,
    /the problem, the choice and what was ruled out/,
  );
});

test('a story with an empty "How it was built" is refused', () => {
  assertRefused(BODY.replace("The agent credit.\n", ""), /agent credit/);
});

test("a link that leaves the site is refused however it is written", () => {
  const repo = "github.com/example/example";
  for (const link of [
    `[the code](//${repo})`,
    `<a href="https://${repo}">the code</a>`,
    `\n\n<p><a href="https://${repo}">the code</a></p>`,
  ]) {
    assertRefused(BODY.replace("The agent credit.", `The agent credit. ${link}`), /repo or a demo/);
  }
});

// The captures and the diagram live in the folder of the project.
test("a story with an image from outside the folder of the project is refused", () => {
  assertRefused(
    BODY.replace("The agent credit.", "Credit.\n\n![Alt](https://example.com/capture.png)"),
    /https:\/\/example\.com\/capture\.png/,
    /folder of the project/,
  );
});
