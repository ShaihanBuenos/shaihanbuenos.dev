// Constrói uma cópia do site com arquivos de conteúdo trocados, para os testes
// verem o que a construção faz com um arquivo errado sem tocar no repo.
import { spawn } from "node:child_process";
import { cp, mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const raiz = new URL("../..", import.meta.url).pathname;

// Uma página a mais, só na cópia: devolve o que `conteudo()` entrega às páginas.
const SONDA = `import type { APIRoute } from "astro";
import { conteudo } from "../lib/conteudo.ts";

export const GET: APIRoute = async () => Response.json(await conteudo());
`;

// Os caminhos são relativos a src/content.
export interface Mudanca {
  escrever?: Record<string, string>;
  apagar?: string[];
}

export interface Copia {
  pasta: string;
  // Apaga a cópia inteira.
  descartar: () => Promise<void>;
}

export async function copiar({ escrever = {}, apagar = [] }: Mudanca = {}): Promise<Copia> {
  const pasta = await mkdtemp(join(tmpdir(), "site-"));
  for (const nome of ["src", "public", "astro.config.ts", "tsconfig.json", "package.json"]) {
    await cp(join(raiz, nome), join(pasta, nome), { recursive: true });
  }
  // Cada dependência é ligada por dentro de um node_modules próprio, porque o
  // Astro guarda ali (em .astro) o conteúdo lido: uma pasta só, ligada inteira,
  // misturaria o conteúdo das cópias.
  await mkdir(join(pasta, "node_modules"));
  for (const nome of await readdir(join(raiz, "node_modules"))) {
    if (nome === ".astro" || nome === ".vite") continue;
    await symlink(join(raiz, "node_modules", nome), join(pasta, "node_modules", nome));
  }
  await writeFile(join(pasta, "src/pages/sonda.json.ts"), SONDA);

  const conteudo = join(pasta, "src/content");
  for (const caminho of apagar) await rm(join(conteudo, caminho), { recursive: true });
  for (const [caminho, texto] of Object.entries(escrever)) {
    await mkdir(dirname(join(conteudo, caminho)), { recursive: true });
    await writeFile(join(conteudo, caminho), texto);
  }

  return { pasta, descartar: () => rm(pasta, { recursive: true, force: true }) };
}

export interface Construcao {
  falhou: boolean;
  // Tudo o que a construção escreveu no terminal.
  saida: string;
  // Um arquivo da pasta dist/ da cópia.
  ler: (arquivo: string) => Promise<string>;
}

// Roda `astro build` na cópia, como a publicação faz. `ambiente` são
// variáveis de ambiente a mais para a construção.
export async function construir(
  mudanca?: Mudanca,
  ambiente: Record<string, string> = {},
): Promise<Construcao> {
  const copia = await copiar(mudanca);
  try {
    const { codigo, saida } = await new Promise<{ codigo: number | null; saida: string }>(
      (resolver, rejeitar) => {
        const processo = spawn(join(raiz, "node_modules/.bin/astro"), ["build"], {
          cwd: copia.pasta,
          // Sem o NODE_ENV de quem chama: um servidor local no mesmo processo
          // de teste deixa "development" ali.
          env: { ...process.env, NODE_ENV: undefined, NO_COLOR: "1", ...ambiente },
        });
        let texto = "";
        processo.stdout.on("data", (parte: Buffer) => (texto += parte.toString()));
        processo.stderr.on("data", (parte: Buffer) => (texto += parte.toString()));
        processo.on("error", rejeitar);
        processo.on("close", (codigoDeSaida) => {
          resolver({ codigo: codigoDeSaida, saida: texto });
        });
      },
    );

    const arquivos = new Map<string, string>();
    if (codigo === 0) {
      const dist = join(copia.pasta, "dist");
      for (const arquivo of await readdir(dist, { recursive: true })) {
        if (!/\.(html|json|xml)$/.test(arquivo)) continue;
        arquivos.set(arquivo, await readFile(join(dist, arquivo), "utf8"));
      }
    }
    return {
      falhou: codigo !== 0,
      saida,
      ler: (arquivo) => {
        const lido = arquivos.get(arquivo);
        return lido === undefined
          ? Promise.reject(new Error(`a construção não deixou ${arquivo}:\n${saida}`))
          : Promise.resolve(lido);
      },
    };
  } finally {
    await copia.descartar();
  }
}
