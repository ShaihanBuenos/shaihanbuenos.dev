// Testes do conteúdo em arquivos (seção 6 da spec). Cada teste constrói uma
// cópia do site com um arquivo de conteúdo trocado e olha o resultado.
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { setTimeout } from "node:timers/promises";
import { dev } from "astro";
import type { Conteudo } from "../src/lib/conteudo.ts";
import { construir, type Construcao, copiar } from "./apoio/copia.ts";

// O que `conteudo()` entrega às páginas numa construção, lido da sonda.
async function conteudoDe(construcao: Construcao): Promise<Conteudo> {
  return JSON.parse(await construcao.ler("sonda.json")) as Conteudo;
}

// Confere que a construção parou e que o erro aponta o arquivo e o problema.
function assertBarrou({ falhou, saida }: Construcao, ...pistas: RegExp[]): void {
  assert.ok(falhou, "a construção passou");
  for (const pista of pistas) assert.match(saida, pista);
}

const PAGINAS_PT = `comum:
  menu: Principal
  idioma: Idioma
  pular: Pular para o conteúdo
  feed: Feed
inicio:
  nome: Início
  descricao: Descrição de teste.
  rotulo: Rótulo de teste
  apresentacao: Frase de apresentação de teste.
projetos:
  nome: Trabalhos
  descricao: Descrição de teste.
textos:
  nome: Textos
  descricao: Descrição de teste.
estudos:
  nome: Estudos
  descricao: Descrição de teste.
pesquisa:
  nome: Pesquisa
  descricao: Descrição de teste.
sobre:
  nome: Sobre
  descricao: Descrição de teste.
  bio: Bio de teste.
  formacao: Formação de teste.
naoEncontrado:
  nome: Página sumida
`;

const PROJETO = `nome: Projeto de Exemplo
ordem: 1
estado: funciona-localmente
atualizadaEm: 2026-05-20
`;

const ESTUDO = `nome:
  en: An example study
  pt-br: Um estudo de exemplo
objetivo:
  en: An example goal.
  pt-br: Um objetivo de exemplo.
status: em-andamento
inicio: 2026-02
`;

describe("conteúdo em arquivos", { concurrency: true }, () => {
  // O site como está no repo, com o conteúdo de exemplo, construído uma vez.
  const exemplo = construir();

  test("trocar o nome de uma página no arquivo de frases troca o nome no menu", async () => {
    const construcao = await construir({ escrever: { "paginas/pt-br.yaml": PAGINAS_PT } });
    assert.match(
      await construcao.ler("pt-br/projetos.html"),
      /<a href="\/pt-br\/projetos"[^>]*>\s*Trabalhos\s*<\/a>/,
    );
  });

  test('o título do "não encontrado" vem do arquivo de frases', async () => {
    const construcao = await construir({ escrever: { "paginas/pt-br.yaml": PAGINAS_PT } });
    assert.match(await construcao.ler("pt-br/404.html"), /<h1[^>]*>Página sumida<\/h1>/);
  });

  // Validação: página fixa que existe num idioma e falta no outro.
  test("uma página fixa que falta num idioma barra a construção", async () => {
    const semSobre = PAGINAS_PT.slice(0, PAGINAS_PT.indexOf("sobre:"));
    const construcao = await construir({ escrever: { "paginas/pt-br.yaml": semSobre } });
    assertBarrou(construcao, /paginas\/pt-br\.yaml/, /sobre/);
  });

  test("as frases das páginas fixas faltando num idioma inteiro barram a construção", async () => {
    const construcao = await construir({ apagar: ["paginas/pt-br.yaml"] });
    assertBarrou(construcao, /paginas\/pt-br\.yaml/);
  });

  test("o conteúdo de exemplo tem um texto com tradução e um sem tradução", async () => {
    const { textos } = await conteudoDe(await exemplo);
    const idiomas = textos.map(({ versoes }) => Object.keys(versoes).sort().join(" "));
    assert.ok(idiomas.includes("en pt-br"), "nenhum texto de exemplo tem tradução");
    assert.ok(
      idiomas.some((i) => i === "en" || i === "pt-br"),
      "todo texto de exemplo tem tradução",
    );
  });

  test("cada versão de um texto tem o seu endereço, e a tradução diz se foi feita com IA", async () => {
    const { textos } = await conteudoDe(await exemplo);
    const artigo = textos.find(({ id }) => id === "exemplo-de-artigo");
    assert.equal(artigo?.idiomaOriginal, "pt-br");
    assert.equal(artigo.versoes["pt-br"]?.endereco, "exemplo-de-artigo-com-traducao");
    assert.equal(artigo.versoes["pt-br"].traducaoComIA, undefined);
    assert.equal(artigo.versoes.en?.endereco, "example-article-with-translation");
    assert.equal(artigo.versoes.en.traducaoComIA, true);
  });

  test("os textos vêm do mais recente ao mais antigo", async () => {
    const { textos } = await conteudoDe(await exemplo);
    const datas = textos.map(({ publicadoEm }) => String(publicadoEm));
    assert.ok(datas.length >= 2);
    assert.deepEqual(datas, datas.toSorted().reverse());
  });

  // O que decide é o comando (construir ou rodar localmente), e não o
  // ambiente de quem chama.
  test("um rascunho não aparece na construção nem com NODE_ENV=development", async () => {
    const construcao = await construir({}, { NODE_ENV: "development" });
    const { textos } = await conteudoDe(construcao);
    assert.ok(textos.length > 0);
    assert.deepEqual(
      textos.filter(({ rascunho }) => rascunho),
      [],
    );
  });

  test("um estudo mostra os textos que nasceram dele, sem repetir a ligação", async () => {
    const { estudos } = await conteudoDe(await exemplo);
    const estudo = estudos.find(({ id }) => id === "exemplo-em-andamento");
    assert.deepEqual(estudo?.ligacoes.textos, ["exemplo-de-nota-de-estudo"]);
  });

  test("um rascunho não aparece na construção publicada", async () => {
    const { textos } = await conteudoDe(await exemplo);
    assert.ok(textos.length > 0);
    assert.deepEqual(
      textos.filter(({ id, rascunho }) => rascunho || id === "exemplo-de-rascunho"),
      [],
    );
  });

  // Validação: campo obrigatório faltando.
  test("um texto sem a data de publicação barra a construção", async () => {
    const construcao = await construir({
      escrever: {
        "textos/exemplo-de-artigo/texto.yaml":
          "tipo: artigo\ntemas: [backend]\nidiomaOriginal: pt-br\n",
      },
    });
    assertBarrou(construcao, /textos\/exemplo-de-artigo\/texto\.yaml/, /publicadoEm/);
  });

  test("um texto com a data de publicação vazia barra a construção", async () => {
    const construcao = await construir({
      escrever: {
        "textos/exemplo-de-artigo/texto.yaml":
          "publicadoEm:\ntipo: artigo\ntemas: [backend]\nidiomaOriginal: pt-br\n",
      },
    });
    assertBarrou(construcao, /textos\/exemplo-de-artigo\/texto\.yaml/, /publicadoEm/);
  });

  test("uma versão de texto sem o resumo de uma linha barra a construção", async () => {
    const construcao = await construir({
      escrever: {
        "textos/exemplo-de-nota-de-estudo/en.md":
          "---\ntitulo: Sem resumo\nendereco: sem-resumo\n---\n\nCorpo.\n",
      },
    });
    assertBarrou(construcao, /textos\/exemplo-de-nota-de-estudo\/en\.md/, /resumo/);
  });

  test("uma tradução que não diz se foi feita com IA barra a construção", async () => {
    const construcao = await construir({
      escrever: {
        "textos/exemplo-de-nota-de-estudo/pt-br.md":
          "---\ntitulo: Tradução\nresumo: Resumo.\nendereco: traducao\n---\n\nCorpo.\n",
      },
    });
    assertBarrou(construcao, /textos\/exemplo-de-nota-de-estudo\/pt-br\.md/, /traducaoComIA/);
  });

  test("um texto sem a versão no idioma original barra a construção", async () => {
    const construcao = await construir({ apagar: ["textos/exemplo-de-nota-de-estudo/en.md"] });
    assertBarrou(construcao, /textos\/exemplo-de-nota-de-estudo/, /en\.md/);
  });

  // Validação: tema fora da lista.
  test("um texto com um tema fora da lista barra a construção", async () => {
    const construcao = await construir({
      escrever: {
        "textos/exemplo-de-artigo/texto.yaml":
          "publicadoEm: 2026-01-15\ntipo: artigo\ntemas: [backend, culinaria]\nidiomaOriginal: pt-br\n",
      },
    });
    assertBarrou(construcao, /textos\/exemplo-de-artigo\/texto\.yaml/, /temas/);
  });

  test("um texto com mais de três temas barra a construção", async () => {
    const construcao = await construir({
      escrever: {
        "textos/exemplo-de-artigo/texto.yaml":
          "publicadoEm: 2026-01-15\ntipo: artigo\ntemas: [backend, frontend, ia, carreira]\nidiomaOriginal: pt-br\n",
      },
    });
    assertBarrou(construcao, /textos\/exemplo-de-artigo\/texto\.yaml/, /temas/);
  });

  test("uma versão de texto numa pasta sem texto.yaml barra a construção", async () => {
    const construcao = await construir({ apagar: ["textos/exemplo-de-nota-de-estudo/texto.yaml"] });
    assertBarrou(construcao, /textos\/exemplo-de-nota-de-estudo/, /texto\.yaml/);
  });

  test("dois textos com o mesmo endereço no mesmo idioma barram a construção", async () => {
    const construcao = await construir({
      escrever: {
        "textos/exemplo-de-nota-de-estudo/en.md":
          "---\ntitulo: Repetido\nresumo: Resumo.\nendereco: example-article-with-translation\n---\n\nCorpo.\n",
      },
    });
    assertBarrou(construcao, /textos\/exemplo-de-(nota-de-estudo|artigo)\/en\.md/, /endereço/);
  });

  test("cada coleção tem conteúdo de exemplo", async () => {
    const { projetos, estudos, cargos, pesquisa, listaDeEstudos } = await conteudoDe(await exemplo);
    assert.ok(projetos.length >= 2);
    assert.ok(estudos.some(({ status }) => status === "em-andamento"));
    assert.ok(estudos.some(({ status }) => status === "concluido"));
    assert.ok(cargos.length >= 2);
    assert.deepEqual(pesquisa.map(({ tipo }) => tipo).sort(), ["paper", "tcc"]);
    assert.match(listaDeEstudos.conferidaEm, /^\d{4}-\d{2}$/);
  });

  test("uma história do projeto tem as duas versões, e o que não é frase vale para as duas", async () => {
    const { projetos } = await conteudoDe(await exemplo);
    const projeto = projetos.find(({ id }) => id === "projeto-de-exemplo");
    assert.equal(projeto?.estado, "funciona-localmente");
    assert.match(projeto.marca, /^<svg\b/);
    assert.notEqual(projeto.historias.en.oQueE, projeto.historias["pt-br"].oQueE);
  });

  test("mudar o campo ordem de um projeto muda a ordem da lista", async () => {
    const { projetos } = await conteudoDe(await exemplo);
    assert.deepEqual(
      projetos.map(({ id }) => id),
      ["projeto-de-exemplo", "outro-projeto-de-exemplo"],
    );

    const trocado = await construir({
      escrever: {
        "projetos/projeto-de-exemplo/projeto.yaml": PROJETO.replace("ordem: 1", "ordem: 3"),
      },
    });
    assert.deepEqual(
      (await conteudoDe(trocado)).projetos.map(({ id }) => id),
      ["outro-projeto-de-exemplo", "projeto-de-exemplo"],
    );
  });

  test("os cargos vêm do mais recente ao mais antigo", async () => {
    const { cargos } = await conteudoDe(await exemplo);
    const inicios = cargos.map(({ inicio }) => inicio);
    assert.deepEqual(inicios, inicios.toSorted().reverse());
  });

  // Validação: campo obrigatório faltando, nas outras coleções.
  test("um projeto sem o estado do projeto barra a construção", async () => {
    const construcao = await construir({
      escrever: {
        "projetos/projeto-de-exemplo/projeto.yaml": PROJETO.replace(
          "estado: funciona-localmente\n",
          "",
        ),
      },
    });
    assertBarrou(construcao, /projetos\/projeto-de-exemplo\/projeto\.yaml/, /estado/);
  });

  test("um projeto sem a marca do projeto barra a construção", async () => {
    const construcao = await construir({ apagar: ["projetos/projeto-de-exemplo/marca.svg"] });
    assertBarrou(construcao, /projetos\/projeto-de-exemplo/, /marca\.svg/);
  });

  test("um estudo concluído sem o mês de conclusão barra a construção", async () => {
    const construcao = await construir({
      escrever: {
        "estudos/exemplo-em-andamento.yaml": ESTUDO.replace("em-andamento", "concluido"),
      },
    });
    assertBarrou(construcao, /estudos\/exemplo-em-andamento\.yaml/, /conclusao/);
  });

  test("um cargo sem conquistas barra a construção", async () => {
    const construcao = await construir({
      escrever: {
        "cargos/exemplo-de-cargo-atual.yaml":
          "empresa: Empresa de Exemplo\ntitulo: Software Engineer\ninicio: 2024-03\ncontexto:\n  en: Context.\n  pt-br: Contexto.\n",
      },
    });
    assertBarrou(construcao, /cargos\/exemplo-de-cargo-atual\.yaml/, /conquistas/);
  });

  test("um item de pesquisa sem o resultado barra a construção", async () => {
    const construcao = await construir({
      escrever: {
        "pesquisa/exemplo-de-tcc.yaml":
          "tipo: tcc\nordem: 2\ntitulo: Título\ntituloTraduzido: Title\noQueE: { en: a, pt-br: a }\nresumo: { en: a, pt-br: a }\nconstruido: { en: a, pt-br: a }\n",
      },
    });
    assertBarrou(construcao, /pesquisa\/exemplo-de-tcc\.yaml/, /resultado/);
  });

  // Validação: ligação para um estudo, texto ou projeto que não existe.
  test("um texto ligado a um estudo que não existe barra a construção", async () => {
    const construcao = await construir({
      escrever: {
        "textos/exemplo-de-nota-de-estudo/texto.yaml":
          "publicadoEm: 2026-03-10\ntipo: nota-de-estudo\ntemas: [ia]\nidiomaOriginal: en\nestudo: estudo-que-nao-existe\n",
      },
    });
    assertBarrou(
      construcao,
      /textos\/exemplo-de-nota-de-estudo\/texto\.yaml/,
      /estudo-que-nao-existe/,
    );
  });

  test("um estudo ligado a um texto que não existe barra a construção", async () => {
    const construcao = await construir({
      escrever: {
        "estudos/exemplo-em-andamento.yaml": `${ESTUDO}ligacoes:\n  textos: [texto-que-nao-existe]\n`,
      },
    });
    assertBarrou(construcao, /estudos\/exemplo-em-andamento\.yaml/, /texto-que-nao-existe/);
  });

  test("um estudo ligado a um projeto que não existe barra a construção", async () => {
    const construcao = await construir({
      escrever: {
        "estudos/exemplo-em-andamento.yaml": `${ESTUDO}ligacoes:\n  projeto: projeto-que-nao-existe\n`,
      },
    });
    assertBarrou(construcao, /estudos\/exemplo-em-andamento\.yaml/, /projeto-que-nao-existe/);
  });

  test("um estudo ligado a um item de pesquisa que não existe barra a construção", async () => {
    const construcao = await construir({
      escrever: {
        "estudos/exemplo-em-andamento.yaml": `${ESTUDO}ligacoes:\n  pesquisa: [item-que-nao-existe]\n`,
      },
    });
    assertBarrou(construcao, /estudos\/exemplo-em-andamento\.yaml/, /item-que-nao-existe/);
  });

  // Validação: projeto ou estudo que existe num idioma e falta no outro.
  test("um projeto que falta num idioma barra a construção", async () => {
    const construcao = await construir({ apagar: ["projetos/projeto-de-exemplo/en.md"] });
    assertBarrou(construcao, /projetos\/projeto-de-exemplo/, /en\.md/);
  });

  test("uma história do projeto numa pasta sem projeto.yaml barra a construção", async () => {
    const construcao = await construir({ apagar: ["projetos/projeto-de-exemplo/projeto.yaml"] });
    assertBarrou(construcao, /projetos\/projeto-de-exemplo/, /projeto\.yaml/);
  });

  test("um estudo que falta num idioma barra a construção", async () => {
    const construcao = await construir({
      escrever: {
        "estudos/exemplo-em-andamento.yaml": ESTUDO.replace("  en: An example goal.\n", ""),
      },
    });
    assertBarrou(construcao, /estudos\/exemplo-em-andamento\.yaml/, /objetivo/, /en/);
  });

  test("a ligação de um estudo com um rascunho não aparece na construção publicada", async () => {
    const construcao = await construir({
      escrever: {
        "estudos/exemplo-em-andamento.yaml": `${ESTUDO}ligacoes:\n  textos: [exemplo-de-rascunho, exemplo-de-nota-de-estudo]\n`,
      },
    });
    const { estudos } = await conteudoDe(construcao);
    const estudo = estudos.find(({ id }) => id === "exemplo-em-andamento");
    assert.deepEqual(estudo?.ligacoes.textos, ["exemplo-de-nota-de-estudo"]);
  });
});

// Fica fora do bloco acima: o servidor local roda neste processo, e não
// disputa a máquina com as construções em paralelo.
test("um rascunho aparece no site rodando localmente", async () => {
  const copia = await copiar();
  const servidor = await dev({ root: copia.pasta, logLevel: "silent", server: { port: 4392 } });
  try {
    // O servidor aceita pedidos antes de terminar de ler o conteúdo: o teste
    // repete o pedido até a leitura acabar.
    let resposta: Response;
    let corpo: string;
    let tentativas = 0;
    do {
      if (tentativas > 0) await setTimeout(250);
      resposta = await fetch(`http://localhost:${servidor.address.port}/sonda.json`);
      corpo = await resposta.text();
    } while (resposta.status !== 200 && ++tentativas < 40);
    assert.equal(resposta.status, 200, corpo);
    const { textos } = JSON.parse(corpo) as Conteudo;
    const rascunho = textos.find(({ id }) => id === "exemplo-de-rascunho");
    assert.equal(rascunho?.rascunho, true);
  } finally {
    await servidor.stop();
    await copia.descartar();
  }
});
