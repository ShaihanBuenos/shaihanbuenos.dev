// Testes do site construído: sobem o resultado de `astro build` (pasta dist/)
// e pedem cada endereço por HTTP, como um visitante faria.
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { preview } from "astro";

const raiz = new URL("..", import.meta.url).pathname;

let origem: string;
let parar: () => Promise<void>;

before(async () => {
  const servidor = await preview({
    root: raiz,
    logLevel: "silent",
    server: { port: 4391 },
  });
  origem = `http://localhost:${servidor.port}`;
  parar = () => servidor.stop();
});

after(() => parar());

function langDe(html: string): string | undefined {
  return html.match(/<html[^>]*\blang="([^"]*)"/)?.[1];
}

// Pede o endereço exato, sem seguir redirecionamento: o endereço da spec
// tem de responder ele mesmo.
function pedir(endereco: string): Promise<Response> {
  return fetch(`${origem}${endereco}`, { redirect: "manual" });
}

// Seção 4 da spec: os endereços das páginas fixas, nos dois idiomas.
const PAGINAS = [
  { pagina: "Início", en: "/", pt: "/pt-br" },
  { pagina: "Projetos", en: "/projects", pt: "/pt-br/projetos" },
  { pagina: "Textos", en: "/writing", pt: "/pt-br/textos" },
  { pagina: "Estudos", en: "/studies", pt: "/pt-br/estudos" },
  { pagina: "Pesquisa", en: "/research", pt: "/pt-br/pesquisa" },
  { pagina: "Sobre", en: "/about", pt: "/pt-br/sobre" },
];

for (const { pagina, en, pt } of PAGINAS) {
  test(`${pagina} responde em inglês em ${en}`, async () => {
    const resposta = await pedir(en);
    assert.equal(resposta.status, 200);
    assert.equal(langDe(await resposta.text()), "en");
  });

  test(`${pagina} responde em português em ${pt}`, async () => {
    const resposta = await pedir(pt);
    assert.equal(resposta.status, 200);
    assert.equal(langDe(await resposta.text()), "pt-BR");
  });
}

function tituloDe(html: string): string | undefined {
  return html.match(/<h1[^>]*>([^<]*)<\/h1>/)?.[1];
}

test('endereço que não existe mostra o "não encontrado" em inglês', async () => {
  const resposta = await pedir("/does-not-exist");
  const html = await resposta.text();
  assert.equal(resposta.status, 404);
  assert.equal(langDe(html), "en");
  assert.equal(tituloDe(html), "Page not found");
});

// Mostrar esta página para um endereço que não existe sob /pt-br é trabalho
// da hospedagem, que procura o 404.html mais próximo. Aqui se confere que a
// página existe no lugar onde a hospedagem procura.
test('o "não encontrado" em português fica em /pt-br/404', async () => {
  const resposta = await pedir("/pt-br/404");
  const html = await resposta.text();
  assert.equal(langDe(html), "pt-BR");
  assert.equal(tituloDe(html), "Página não encontrada");
});

// Até o lançamento, nada do que é construído pode ser indexado. O teste olha
// todo HTML da pasta dist/, para valer também para as páginas que vierem.
test("nenhuma página construída pode ser indexada", async () => {
  const dist = `${raiz}dist`;
  const arquivos = (await readdir(dist, { recursive: true })).filter((a) => a.endsWith(".html"));
  assert.ok(arquivos.length >= 14, `esperava as páginas da seção 4, achei ${arquivos.length}`);

  const indexaveis = [];
  for (const arquivo of arquivos) {
    const html = await readFile(`${dist}/${arquivo}`, "utf8");
    const robots = html.match(/<meta[^>]*\bname="robots"[^>]*\bcontent="([^"]*)"/)?.[1] ?? "";
    if (!robots.split(/\s*,\s*/).includes("noindex")) indexaveis.push(arquivo);
  }
  assert.deepEqual(indexaveis, []);
});

// Os feeds ainda não têm textos; por enquanto só respondem, cada um no seu idioma.
for (const { endereco, idioma } of [
  { endereco: "/rss.xml", idioma: "en" },
  { endereco: "/pt-br/rss.xml", idioma: "pt-br" },
]) {
  test(`Feed responde em ${endereco} com o idioma ${idioma}`, async () => {
    const resposta = await pedir(endereco);
    const xml = await resposta.text();
    assert.equal(resposta.status, 200);
    assert.match(xml, /^<\?xml[^>]*\?>\s*<rss\b/);
    assert.equal(xml.match(/<language>([^<]*)<\/language>/)?.[1]?.toLowerCase(), idioma);
  });
}

// Feeds e outros arquivos que não são HTML não levam <meta>. Para eles a
// hospedagem (Cloudflare) lê o arquivo _headers e manda o cabeçalho em tudo.
test("o que não é página também sai marcado para não ser indexado", async () => {
  const headers = await readFile(`${raiz}dist/_headers`, "utf8");
  assert.match(headers, /^\/\*\n[ \t]+X-Robots-Tag: noindex$/m);
});
