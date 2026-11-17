// Builds a copy of the site with some content files changed, so the tests
// can see what the build does with a wrong file without touching the repo.
import { spawn } from "node:child_process";
import { cp, mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const root = new URL("../..", import.meta.url).pathname;

// One extra page, only in the copy: it returns what `content()` gives the pages.
const PROBE = `import type { APIRoute } from "astro";
import { content } from "../lib/content.ts";

export const GET: APIRoute = async () => Response.json(await content());
`;

// The paths are relative to src/content.
export interface Change {
  write?: Record<string, string>;
  remove?: string[];
}

export interface Copy {
  folder: string;
  // Deletes the whole copy.
  discard: () => Promise<void>;
}

export async function copySite({ write = {}, remove = [] }: Change = {}): Promise<Copy> {
  const folder = await mkdtemp(join(tmpdir(), "site-"));
  for (const name of ["src", "public", "astro.config.ts", "tsconfig.json", "package.json"]) {
    await cp(join(root, name), join(folder, name), { recursive: true });
  }
  // Each dependency is linked inside a node_modules of its own, because Astro
  // keeps the content it read there (in .astro): a single folder, linked
  // whole, would mix the content of the copies.
  await mkdir(join(folder, "node_modules"));
  for (const name of await readdir(join(root, "node_modules"))) {
    if (name === ".astro" || name === ".vite") continue;
    await symlink(join(root, "node_modules", name), join(folder, "node_modules", name));
  }
  await writeFile(join(folder, "src/pages/probe.json.ts"), PROBE);

  const contentFolder = join(folder, "src/content");
  for (const path of remove) await rm(join(contentFolder, path), { recursive: true });
  for (const [path, text] of Object.entries(write)) {
    await mkdir(dirname(join(contentFolder, path)), { recursive: true });
    await writeFile(join(contentFolder, path), text);
  }

  return { folder, discard: () => rm(folder, { recursive: true, force: true }) };
}

export interface Build {
  failed: boolean;
  // Everything the build wrote to the terminal.
  output: string;
  // A file from the copy's dist/ folder.
  read: (file: string) => Promise<string>;
}

// Runs `astro build` on the copy, as publishing does. `env` holds extra
// environment variables for the build.
export async function build(change?: Change, env: Record<string, string> = {}): Promise<Build> {
  const copy = await copySite(change);
  try {
    const { code, output } = await new Promise<{ code: number | null; output: string }>(
      (resolve, reject) => {
        const child = spawn(join(root, "node_modules/.bin/astro"), ["build"], {
          cwd: copy.folder,
          // Without the caller's NODE_ENV: a dev server in the same test
          // process leaves "development" there.
          env: { ...process.env, NODE_ENV: undefined, NO_COLOR: "1", ...env },
        });
        let text = "";
        child.stdout.on("data", (chunk: Buffer) => (text += chunk.toString()));
        child.stderr.on("data", (chunk: Buffer) => (text += chunk.toString()));
        child.on("error", reject);
        child.on("close", (exitCode) => {
          resolve({ code: exitCode, output: text });
        });
      },
    );

    const files = new Map<string, string>();
    if (code === 0) {
      const dist = join(copy.folder, "dist");
      for (const file of await readdir(dist, { recursive: true })) {
        if (!/\.(html|json|xml)$/.test(file)) continue;
        files.set(file, await readFile(join(dist, file), "utf8"));
      }
    }
    return {
      failed: code !== 0,
      output,
      read: (file) => {
        const text = files.get(file);
        return text === undefined
          ? Promise.reject(new Error(`the build left no ${file}:\n${output}`))
          : Promise.resolve(text);
      },
    };
  } finally {
    await copy.discard();
  }
}
