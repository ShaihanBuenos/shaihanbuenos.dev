// O conteúdo do site, lido dos arquivos de src/content e já conferido. As
// páginas leem o conteúdo por aqui, e não direto das coleções: é aqui que as
// versões de cada idioma são reunidas, que as ligações são conferidas e que
// os rascunhos saem da construção publicada.
import { type CollectionEntry, getCollection } from "astro:content";
import type { Frases } from "./esquemas.ts";
import { type Idioma, IDIOMAS } from "./idiomas.ts";

// Uma versão de um texto: o original ou a tradução.
export type VersaoDoTexto = CollectionEntry<"versoesDosTextos">["data"] & {
  // O arquivo da versão, para a página mostrar o corpo com `render()`.
  arquivo: CollectionEntry<"versoesDosTextos">;
};

export type Texto = CollectionEntry<"textos">["data"] & {
  id: string;
  // A versão de cada idioma. A do idioma original existe sempre.
  versoes: Partial<Record<Idioma, VersaoDoTexto>>;
};

// A história do projeto num idioma.
export type VersaoDoProjeto = CollectionEntry<"versoesDosProjetos">["data"] & {
  // O arquivo da versão, para a página mostrar o corpo com `render()`.
  arquivo: CollectionEntry<"versoesDosProjetos">;
};

export type Projeto = Omit<CollectionEntry<"projetos">["data"], "marca"> & {
  id: string;
  // A marca do projeto: o SVG, para entrar direto na página.
  marca: string;
  versoes: Record<Idioma, VersaoDoProjeto>;
};

export type Estudo = CollectionEntry<"estudos">["data"] & { id: string };
export type Cargo = CollectionEntry<"cargos">["data"] & { id: string };
export type ItemDePesquisa = CollectionEntry<"pesquisa">["data"] & { id: string };

export interface Conteudo {
  // As frases das páginas fixas, em cada idioma.
  paginas: Record<Idioma, Frases>;
  // Os textos, do mais recente ao mais antigo. Os rascunhos só entram com o
  // site rodando localmente.
  textos: Texto[];
  // Os projetos, na ordem do campo `ordem`.
  projetos: Projeto[];
  // Os estudos, do início mais recente ao mais antigo.
  estudos: Estudo[];
  listaDeEstudos: CollectionEntry<"listas">["data"];
  // Os cargos, do início mais recente ao mais antigo.
  cargos: Cargo[];
  // Os itens de pesquisa, na ordem do campo `ordem`.
  pesquisa: ItemDePesquisa[];
}

// As marcas dos projetos: o SVG de cada arquivo, pelo caminho.
const MARCAS = new Map(
  Object.entries(
    import.meta.glob<string>("../content/projetos/*/*.svg", {
      query: "?raw",
      import: "default",
      eager: true,
    }),
  ),
);

function comId<T>({ id, data }: { id: string; data: T }): T & { id: string } {
  return { ...data, id };
}

function porId<T extends { id: string }>(arquivos: T[]): Map<string, T> {
  return new Map(arquivos.map((arquivo) => [arquivo.id, arquivo]));
}

// As pastas que têm uma versão (<pasta>/<idioma>.md) e não têm o arquivo com
// o que vale para todas as versões.
function pastasSemOArquivoComum(versoes: Map<string, unknown>, comuns: string[]): string[] {
  const pastas = new Set([...versoes.keys()].map((id) => id.slice(0, id.lastIndexOf("/"))));
  for (const id of comuns) pastas.delete(id);
  return [...pastas];
}

async function carregar(): Promise<Conteudo> {
  // Cada erro diz o arquivo e o problema. A construção para com todos juntos.
  const erros: string[] = [];

  const paginas = porId(await getCollection("paginas"));
  for (const idioma of IDIOMAS) {
    if (!paginas.has(idioma)) {
      erros.push(`paginas/${idioma}.yaml: as frases das páginas fixas faltam neste idioma`);
    }
  }

  const versoesDosTextos = porId(await getCollection("versoesDosTextos"));
  const textos = (await getCollection("textos")).map(({ id, data }): Texto => {
    const versoes: Texto["versoes"] = {};
    for (const idioma of IDIOMAS) {
      const arquivo = versoesDosTextos.get(`${id}/${idioma}`);
      if (!arquivo) continue;
      versoes[idioma] = { ...arquivo.data, arquivo };

      const ehTraducao = idioma !== data.idiomaOriginal;
      if (ehTraducao && arquivo.data.traducaoComIA === undefined) {
        erros.push(`textos/${id}/${idioma}.md: falta traducaoComIA, que toda tradução tem`);
      }
      if (!ehTraducao && arquivo.data.traducaoComIA !== undefined) {
        erros.push(`textos/${id}/${idioma}.md: traducaoComIA só vale na tradução`);
      }
    }
    if (!versoes[data.idiomaOriginal]) {
      erros.push(`textos/${id}: falta ${data.idiomaOriginal}.md, a versão no idioma original`);
    }
    return { id, ...data, versoes };
  });

  for (const pasta of pastasSemOArquivoComum(
    versoesDosTextos,
    textos.map(({ id }) => id),
  )) {
    erros.push(`textos/${pasta}: falta texto.yaml`);
  }

  for (const idioma of IDIOMAS) {
    const donos = new Map<string, string>();
    for (const { id, versoes } of textos) {
      const endereco = versoes[idioma]?.endereco;
      if (endereco === undefined) continue;
      const dono = donos.get(endereco);
      if (dono !== undefined) {
        erros.push(`textos/${id}/${idioma}.md: o endereço "${endereco}" já é de textos/${dono}`);
      }
      donos.set(endereco, id);
    }
  }

  const versoesDosProjetos = porId(await getCollection("versoesDosProjetos"));
  const projetos: Projeto[] = [];
  const idsDosProjetos: string[] = [];
  for (const { id, data } of await getCollection("projetos")) {
    idsDosProjetos.push(id);
    const marca = MARCAS.get(`../content/projetos/${id}/${data.marca}`);
    if (marca === undefined) {
      erros.push(`projetos/${id}/projeto.yaml: a marca ${data.marca} não existe na pasta`);
    }
    const [en, ptBr] = IDIOMAS.map((idioma) => {
      const arquivo = versoesDosProjetos.get(`${id}/${idioma}`);
      if (!arquivo)
        erros.push(`projetos/${id}: o projeto falta num idioma, não existe ${idioma}.md`);
      return arquivo && { ...arquivo.data, arquivo };
    });
    if (marca !== undefined && en && ptBr) {
      projetos.push({ ...data, id, marca, versoes: { en, "pt-br": ptBr } });
    }
  }

  for (const pasta of pastasSemOArquivoComum(versoesDosProjetos, idsDosProjetos)) {
    erros.push(`projetos/${pasta}: falta projeto.yaml`);
  }

  const estudos = (await getCollection("estudos")).map(comId);
  const pesquisa = (await getCollection("pesquisa")).map(comId);
  const listaDeEstudos = (await getCollection("listas")).at(0)?.data;
  if (!listaDeEstudos) erros.push("listas/estudos.yaml: o arquivo não existe");

  // As ligações: cada uma aponta para um arquivo que tem de existir.
  const existe = {
    texto: new Set(textos.map(({ id }) => id)),
    projeto: new Set(idsDosProjetos),
    estudo: new Set(estudos.map(({ id }) => id)),
    pesquisa: new Set(pesquisa.map(({ id }) => id)),
  };
  for (const { id, estudo } of textos) {
    if (estudo !== undefined && !existe.estudo.has(estudo)) {
      erros.push(`textos/${id}/texto.yaml: o estudo "${estudo}" não existe`);
    }
  }
  for (const { id, ligacoes } of estudos) {
    const arquivo = `estudos/${id}.yaml`;
    for (const texto of ligacoes.textos) {
      if (!existe.texto.has(texto)) erros.push(`${arquivo}: o texto "${texto}" não existe`);
    }
    if (ligacoes.projeto !== undefined && !existe.projeto.has(ligacoes.projeto)) {
      erros.push(`${arquivo}: o projeto "${ligacoes.projeto}" não existe`);
    }
    for (const item of ligacoes.pesquisa) {
      if (!existe.pesquisa.has(item)) {
        erros.push(`${arquivo}: o item de pesquisa "${item}" não existe`);
      }
    }
  }

  if (erros.length > 0 || !listaDeEstudos) {
    throw new Error(`O conteúdo tem erros:\n${erros.map((erro) => `- ${erro}`).join("\n")}`);
  }

  // Um rascunho aparece só no site rodando localmente, e leva junto as
  // ligações que apontam para ele.
  const publicados = textos.filter(({ rascunho }) => !rascunho || import.meta.env.DEV);
  const publicado = new Set(publicados.map(({ id }) => id));

  return {
    paginas: Object.fromEntries(
      IDIOMAS.map((idioma) => [idioma, paginas.get(idioma)?.data]),
    ) as Conteudo["paginas"],
    textos: publicados.sort((a, b) => b.publicadoEm.getTime() - a.publicadoEm.getTime()),
    projetos: projetos.sort((a, b) => a.ordem - b.ordem),
    estudos: estudos
      .map((estudo) => ({
        ...estudo,
        ligacoes: {
          ...estudo.ligacoes,
          textos: estudo.ligacoes.textos.filter((texto) => publicado.has(texto)),
        },
      }))
      .sort((a, b) => b.inicio.localeCompare(a.inicio)),
    listaDeEstudos,
    cargos: (await getCollection("cargos"))
      .map(comId)
      .sort((a, b) => b.inicio.localeCompare(a.inicio)),
    pesquisa: pesquisa.sort((a, b) => a.ordem - b.ordem),
  };
}

let carregado: Promise<Conteudo> | undefined;

// Na construção, o conteúdo é lido e conferido uma vez só. Rodando
// localmente, é lido a cada pedido, para mostrar o arquivo recém-salvo.
export function conteudo(): Promise<Conteudo> {
  if (import.meta.env.DEV) return carregar();
  return (carregado ??= carregar());
}

export async function frasesDe(idioma: Idioma): Promise<Frases> {
  return (await conteudo()).paginas[idioma];
}
