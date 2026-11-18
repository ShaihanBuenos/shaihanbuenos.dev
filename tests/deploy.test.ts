// Tests of the deploy configuration (section 3 of the spec): what Cloudflare
// is told to publish. They read wrangler.jsonc as Wrangler does, and reach
// neither the network nor an account.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

const root = new URL("..", import.meta.url).pathname;

// The settings the tests look at. Any other key is read as unknown.
interface DeployConfig extends Record<string, unknown> {
  assets: Record<string, unknown>;
}

// wrangler.jsonc has comments, which JSON.parse refuses. TypeScript reads the
// same format for tsconfig.json.
async function deployConfig(): Promise<DeployConfig> {
  const file = `${root}wrangler.jsonc`;
  const parsed = ts.parseConfigFileTextToJson(file, await readFile(file, "utf8"));
  assert.equal(parsed.error, undefined, "wrangler.jsonc is not valid JSONC");
  return parsed.config as DeployConfig;
}

test("the deploy serves the dist/ folder, with no Worker code", async () => {
  const config = await deployConfig();
  const { assets } = config;
  assert.equal(assets.directory, "./dist");
  // With no `main`, there is no Worker script: only the static files.
  assert.equal(config.main, undefined);
  assert.equal(assets.binding, undefined);
  assert.equal(assets.run_worker_first, undefined);
});

// "Not found" has one page per language, 404.html and pt-br/404.html. The
// host shows the one nearest to the address that was asked for.
test('"not found" is answered with the nearest 404 page', async () => {
  const { assets } = await deployConfig();
  assert.equal(assets.not_found_handling, "404-page");
});

// Until launch the site lives only at *.workers.dev. Connecting the domain
// belongs to launch day.
test("the deploy connects no route and no domain", async () => {
  const config = await deployConfig();
  assert.equal(config.route, undefined);
  assert.equal(config.routes, undefined);
  assert.equal(config.workers_dev, true);
  assert.doesNotMatch(JSON.stringify(config), /shaihanbuenos\.dev/);
});

test("the deploy fixes a compatibility date", async () => {
  const { compatibility_date: date } = await deployConfig();
  assert.match(String(date), /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(!Number.isNaN(Date.parse(String(date))), `${String(date)} is not a date`);
});

// Each branch other than the production one is published as a preview of its
// own (`wrangler preview`), which asks for a `previews` block, even an empty one.
test("the other branches can be published as previews", async () => {
  const config = await deployConfig();
  assert.deepEqual(config.previews, {});
});

// The repo is public: the account is chosen where the deploy runs, never here.
test("the deploy names no account", async () => {
  const config = await deployConfig();
  assert.equal(config.account_id, undefined);
});
