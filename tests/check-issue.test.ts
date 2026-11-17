// Tests of the check issue (section 10 of the spec): the script that opens
// it, run with a fake `gh` so that nothing reaches the network, and the
// workflow that runs the script every three months.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { test } from "node:test";

const root = new URL("..", import.meta.url).pathname;

// An issue of the fake tracker.
interface Issue {
  number: number;
  title: string;
  state: "open" | "closed";
  labels: string[];
}

// The fake `gh`: it writes down each call and answers `issue list` from the
// issues of the fake tracker, filtered by state and by label as GitHub does.
// The script asks for the numbers only, so that is what it prints.
const FAKE_GH = `#!/usr/bin/env node
const { appendFileSync, readFileSync } = require("node:fs");
const args = process.argv.slice(2);
appendFileSync(process.env.FAKE_GH_CALLS, JSON.stringify(args) + "\\n");
const valueOf = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
const command = args.slice(0, 2).join(" ");
if (command === "issue list") {
  const state = valueOf("--state") ?? "open";
  const label = valueOf("--label");
  for (const issue of JSON.parse(readFileSync(process.env.FAKE_GH_ISSUES, "utf8"))) {
    if (issue.state !== state) continue;
    if (label !== undefined && !issue.labels.includes(label)) continue;
    console.log(issue.number);
  }
} else if (command === "issue create") {
  console.log("https://github.com/ShaihanBuenos/shaihanbuenos.dev/issues/99");
} else if (command !== "label create") {
  console.error("fake gh: unexpected call: " + args.join(" "));
  process.exit(1);
}
`;

interface Run {
  status: number | null;
  output: string;
  // The arguments of each call the script made to `gh`, in order.
  calls: string[][];
}

// Runs the script against a tracker that holds these issues.
async function run(issues: Issue[], args: string[] = []): Promise<Run> {
  const folder = await mkdtemp(join(tmpdir(), "check-issue-"));
  try {
    const calls = join(folder, "calls");
    const tracker = join(folder, "issues.json");
    await writeFile(join(folder, "gh"), FAKE_GH);
    await chmod(join(folder, "gh"), 0o755);
    await writeFile(calls, "");
    await writeFile(tracker, JSON.stringify(issues));
    const result = spawnSync(`${root}scripts/open-check-issue`, args, {
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${folder}${delimiter}${process.env.PATH ?? ""}`,
        FAKE_GH_CALLS: calls,
        FAKE_GH_ISSUES: tracker,
      },
    });
    return {
      status: result.status,
      output: result.stdout + result.stderr,
      calls: (await readFile(calls, "utf8"))
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as string[]),
    };
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
}

// The issues the script opened: the value of each flag of `gh issue create`.
function opened(calls: string[][]) {
  return calls
    .filter(([group, action]) => group === "issue" && action === "create")
    .map((call) => {
      const valueOf = (flag: string) => call[call.indexOf(flag) + 1];
      return {
        title: valueOf("--title"),
        assignee: valueOf("--assignee"),
        label: valueOf("--label"),
        body: valueOf("--body"),
      };
    });
}

test("with no check issue open, the script opens one, assigned to Shaihan, with the check list", async () => {
  const { status, calls } = await run([], ["--month", "2027-02"]);

  assert.equal(status, 0);
  const issues = opened(calls);
  assert.equal(issues.length, 1);
  const [issue] = issues;
  assert.equal(issue.title, "Conferência do site: fevereiro de 2027");
  assert.equal(issue.assignee, "ShaihanBuenos");
  assert.equal(issue.label, "conferência");

  // Each item of the check list of section 10 is a box to tick, in order.
  const boxes = issue.body.split("\n").filter((line) => line.startsWith("- [ ] "));
  const expected = [
    /^- \[ \] \*\*Status dos estudos:\*\*.*O estudo que parou sai da lista/,
    /^- \[ \] \*\*Cargo atual:\*\*/,
    /^- \[ \] \*\*Estado dos projetos:\*\*/,
    /^- \[ \] \*\*Bio:\*\*/,
    /^- \[ \] \*\*Páginas fixas:\*\*.*as duas versões.*dizem a mesma coisa/,
    /^- \[ \] Mudar a data "conferida em": `checkedOn`, em `src\/content\/lists\/studies\.yaml`/,
    /^- \[ \] Fechar esta issue/,
  ];
  assert.equal(boxes.length, expected.length);
  for (const [index, pattern] of expected.entries()) assert.match(boxes[index], pattern);
});

// An issue of the fake tracker: only what is given differs from an open
// check issue.
function issueWith(change: Partial<Issue>): Issue {
  return {
    number: 41,
    title: "Conferência do site: novembro de 2026",
    state: "open",
    labels: ["conferência"],
    ...change,
  };
}

test("while the last check issue is open, the script opens no other", async () => {
  const { status, output, calls } = await run([issueWith({})], ["--month", "2027-02"]);

  assert.equal(status, 0);
  assert.deepEqual(opened(calls), []);
  assert.match(output, /check issue #41 is still open/);
});

test("once the last check issue is closed, the script opens the next one", async () => {
  const { calls } = await run([issueWith({ state: "closed" })], ["--month", "2027-02"]);

  assert.equal(opened(calls).length, 1);
});

// The label is the mark of a check issue, and the title is not.
test("it is the label, and not the title, that holds the second issue back", async () => {
  const renamed = await run([issueWith({ title: "Another title" })], ["--month", "2027-02"]);
  assert.deepEqual(opened(renamed.calls), []);

  const sameTitle = await run(
    [issueWith({ title: "Conferência do site: fevereiro de 2027", labels: ["ready-for-human"] })],
    ["--month", "2027-02"],
  );
  assert.equal(opened(sameTitle.calls).length, 1);
});

test("the script makes sure the label exists before it opens the issue", async () => {
  const { calls } = await run([], ["--month", "2027-02"]);

  const commands = calls.map((call) => call.slice(0, 2).join(" "));
  assert.deepEqual(commands, ["issue list", "label create", "issue create"]);
  const [, label] = calls;
  assert.equal(label[2], "conferência");
  // Without --force, `gh` fails when the label already exists.
  assert.ok(label.includes("--force"));
});

test("a dry run shows the issue it would open and changes nothing", async () => {
  const { status, output, calls } = await run([], ["--dry-run", "--month", "2027-02"]);

  assert.equal(status, 0);
  assert.deepEqual(
    calls.map((call) => call.slice(0, 2).join(" ")),
    ["issue list"],
  );
  assert.match(output, /Conferência do site: fevereiro de 2027/);
  assert.match(output, /ShaihanBuenos/);
  assert.match(output, /- \[ \] \*\*Cargo atual:\*\*/);
});

test("a dry run says when an open check issue would hold the next one back", async () => {
  const { status, output, calls } = await run([issueWith({})], ["--dry-run"]);

  assert.equal(status, 0);
  assert.deepEqual(opened(calls), []);
  assert.match(output, /check issue #41 is still open/);
});

test("the script refuses a month that is not one", async () => {
  const { status, output, calls } = await run([], ["--month", "2027-13"]);

  assert.equal(status, 2);
  assert.match(output, /not a month/);
  assert.deepEqual(calls, []);
});

// The workflow, without its comments. The repo has no YAML reader of its
// own, so the tests look at the lines.
async function workflow(): Promise<string[]> {
  const text = await readFile(`${root}.github/workflows/check-issue.yml`, "utf8");
  return text
    .split("\n")
    .filter((line) => line.trim() !== "" && !line.trim().startsWith("#"))
    .map((line) => line.trimEnd());
}

// The lines inside a top-level key, without the indentation.
function blockOf(lines: string[], key: string): string[] {
  const start = lines.indexOf(`${key}:`);
  assert.notEqual(start, -1, `the workflow has no top-level "${key}"`);
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => !line.startsWith(" "));
  return rest.slice(0, end === -1 ? undefined : end).map((line) => line.trim());
}

// At 12:17 UTC on the first day of February, May, August and November.
test("the workflow runs every three months and can be started by hand", async () => {
  assert.deepEqual(blockOf(await workflow(), "on"), [
    "schedule:",
    '- cron: "17 12 1 2,5,8,11 *"',
    "workflow_dispatch:",
  ]);
});

test("the workflow may write issues and nothing else", async () => {
  const lines = await workflow();

  assert.deepEqual(blockOf(lines, "permissions"), ["issues: write"]);
  // No job asks for more than the workflow has.
  assert.equal(lines.filter((line) => line.trim().startsWith("permissions:")).length, 1);
});

test("the workflow only calls the script, with the token `gh` needs", async () => {
  const steps = blockOf(await workflow(), "jobs");

  assert.deepEqual(
    steps.filter((line) => /^(- )?run:/.test(line)),
    ["run: scripts/open-check-issue"],
  );
  assert.ok(steps.includes("GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}"));
});
