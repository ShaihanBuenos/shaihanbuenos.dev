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

// Os links de um trecho de HTML, na ordem em que aparecem: os atributos e o
// texto de cada um.
interface Link {
  atributos: Record<string, string>;
  texto: string;
}

function linksDe(html: string): Link[] {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(
    ([, abertura = "", miolo = ""]) => ({
      atributos: Object.fromEntries(
        [...abertura.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, nome, valor]) => [nome, valor]),
      ),
      texto: miolo.replace(/<[^>]*>/g, "").trim(),
    }),
  );
}

// O primeiro elemento com esse nome, com tudo o que tem dentro.
function elemento(html: string, nome: string): string {
  const achado = html.match(new RegExp(`<${nome}\\b[\\s\\S]*?</${nome}>`))?.[0];
  assert.ok(achado, `a página não tem <${nome}>`);
  return achado;
}

// Seção 4 da spec: o menu, na ordem, com o nome de cada página no idioma.
const MENU = {
  en: [
    { href: "/projects", texto: "Projects" },
    { href: "/writing", texto: "Writing" },
    { href: "/studies", texto: "Studies" },
    { href: "/research", texto: "Research" },
    { href: "/about", texto: "About" },
  ],
  pt: [
    { href: "/pt-br/projetos", texto: "Projetos" },
    { href: "/pt-br/textos", texto: "Textos" },
    { href: "/pt-br/estudos", texto: "Estudos" },
    { href: "/pt-br/pesquisa", texto: "Pesquisa" },
    { href: "/pt-br/sobre", texto: "Sobre" },
  ],
};

// Todas as páginas que existem hoje, com o "não encontrado" de cada idioma.
// `equivalente` é para onde o botão de idioma leva.
const TODAS_AS_PAGINAS = [
  ...PAGINAS.flatMap(({ pagina, en, pt }) => [
    { nome: `${pagina} em inglês`, endereco: en, idioma: "en" as const, equivalente: pt },
    { nome: `${pagina} em português`, endereco: pt, idioma: "pt" as const, equivalente: en },
  ]),
  {
    nome: '"Não encontrado" em inglês',
    endereco: "/does-not-exist",
    idioma: "en" as const,
    equivalente: "/pt-br",
  },
  {
    nome: '"Não encontrado" em português',
    endereco: "/pt-br/404",
    idioma: "pt" as const,
    equivalente: "/",
  },
];

const INICIO = { en: "/", pt: "/pt-br" };

for (const { nome, endereco, idioma } of TODAS_AS_PAGINAS) {
  test(`${nome} tem o botão de início e o menu do seu idioma`, async () => {
    const menu = linksDe(elemento(await (await pedir(endereco)).text(), "nav"));
    assert.equal(menu[0]?.atributos.href, INICIO[idioma]);
    assert.deepEqual(
      menu.slice(1, 6).map(({ atributos, texto }) => ({ href: atributos.href, texto })),
      MENU[idioma],
    );
  });
}

// O menu marca a página em que o visitante está; no "não encontrado", nenhuma.
for (const { nome, endereco } of TODAS_AS_PAGINAS) {
  const ehPaginaFixa = PAGINAS.some(({ en, pt }) => endereco === en || endereco === pt);
  const esperado = ehPaginaFixa ? [endereco] : [];

  test(`${nome}: o menu marca ${esperado[0] ?? "nenhuma página"} como a atual`, async () => {
    const menu = linksDe(elemento(await (await pedir(endereco)).text(), "nav"));
    assert.deepEqual(
      menu
        .filter(({ atributos }) => atributos["aria-current"] === "page")
        .map(({ atributos }) => atributos.href),
      esperado,
    );
  });
}

// O botão de idioma: "EN" e "PT", com o idioma atual marcado e o outro como
// link para o equivalente da página.
const SIGLA = { en: "EN", pt: "PT" };
const OUTRO_IDIOMA = { en: "pt", pt: "en" } as const;

for (const { nome, endereco, idioma, equivalente } of TODAS_AS_PAGINAS) {
  test(`${nome}: o botão de idioma leva a ${equivalente}`, async () => {
    const menu = elemento(await (await pedir(endereco)).text(), "nav");
    const outro = OUTRO_IDIOMA[idioma];

    const paraOOutro = linksDe(menu).filter(({ texto }) => texto === SIGLA[outro]);
    assert.deepEqual(
      paraOOutro.map(({ atributos }) => atributos.href),
      [equivalente],
    );
    assert.equal(paraOOutro[0]?.atributos.hreflang, { en: "en", pt: "pt-BR" }[outro]);

    const marcado = menu.match(/<(\w+)\b[^>]*\baria-current="true"[^>]*>([^<]*)</);
    assert.equal(marcado?.[1], "span", "o idioma atual não é link");
    assert.equal(marcado[2].trim(), SIGLA[idioma]);
  });
}

// O rodapé: o contato (seção 7.6 da spec) e o link do feed do idioma.
const CONTATO = [
  "https://www.linkedin.com/in/shaihanbuenos/",
  "https://github.com/ShaihanBuenos",
  "mailto:hi@shaihanbuenos.dev",
];
const FEED = { en: "/rss.xml", pt: "/pt-br/rss.xml" };

for (const { nome, endereco, idioma } of TODAS_AS_PAGINAS) {
  test(`${nome} tem o rodapé com o contato e o feed do seu idioma`, async () => {
    const rodape = linksDe(elemento(await (await pedir(endereco)).text(), "footer"));
    assert.deepEqual(
      rodape.map(({ atributos }) => atributos.href),
      [...CONTATO, FEED[idioma]],
    );
  });
}

// DESIGN.md: as três fontes são servidas pelo próprio site, cada uma em dois
// arquivos. O teste segue o CSS de uma página até os arquivos de fonte.
test("as fontes do sistema visual são servidas pelo próprio site", async () => {
  const html = await (await pedir("/")).text();
  let css = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(([, c]) => c).join("\n");
  for (const [, atributos = ""] of html.matchAll(/<link\b([^>]*)>/g)) {
    const href = atributos.match(/\bhref="([^"]*)"/)?.[1];
    if (href && /\brel="stylesheet"/.test(atributos)) css += await (await pedir(href)).text();
  }

  const fontes = [...new Set([...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(([, u]) => u))];
  assert.equal(fontes.length, 6, `esperava seis arquivos de fonte, achei ${fontes.length}`);
  for (const fonte of fontes) {
    assert.match(fonte, /^\/fonts\/[\w-]+\.woff2$/);
    assert.equal((await pedir(fonte)).status, 200, `${fonte} não responde`);
  }
});

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
