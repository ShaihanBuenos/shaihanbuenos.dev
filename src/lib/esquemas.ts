// Os campos de cada coleção de conteúdo (seção 6 da spec). A construção para
// quando um arquivo não segue o esquema da sua coleção.
import { z } from "astro/zod";
import { IDIOMAS } from "./idiomas.ts";

const frase = z.string().trim().min(1);

// O que toda página fixa tem: o nome no menu e a descrição da página.
const pagina = z.strictObject({ nome: frase, descricao: frase });

// As frases das páginas fixas num idioma. Cada idioma tem um arquivo com este
// formato, então uma página que falta num deles barra a construção.
export const esquemaDasPaginas = z.strictObject({
  comum: z.strictObject({ menu: frase, idioma: frase, pular: frase, feed: frase }),
  inicio: pagina.extend({ rotulo: frase, apresentacao: frase }),
  projetos: pagina,
  textos: pagina,
  estudos: pagina,
  pesquisa: pagina,
  sobre: pagina.extend({ bio: frase, formacao: frase }),
});

export type Frases = z.infer<typeof esquemaDasPaginas>;

const idioma = z.enum(IDIOMAS);

// Um dia, como 2026-01-15.
const dia = z.coerce.date();

// A última parte do endereço de uma página, em palavras do idioma dela.
const endereco = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
  error: "use só letras minúsculas sem acento, números e hífens",
});

// Os temas de um texto. A lista é fixa e pode crescer: um tema novo entra aqui.
export const TEMAS = ["backend", "frontend", "arquitetura", "ia", "carreira", "academico"] as const;

export const TIPOS_DE_TEXTO = ["artigo", "nota-de-estudo"] as const;

// O que vale para todas as versões de um texto: textos/<texto>/texto.yaml.
export const esquemaDoTexto = z.strictObject({
  publicadoEm: dia,
  atualizadoEm: dia.optional(),
  tipo: z.enum(TIPOS_DE_TEXTO),
  temas: z.array(z.enum(TEMAS)).min(1).max(3),
  idiomaOriginal: idioma,
  // O estudo de origem: o nome do arquivo dele em estudos/, sem a extensão.
  estudo: z.string().optional(),
  rascunho: z.boolean().default(false),
});

// Uma versão de um texto, o original ou a tradução: textos/<texto>/<idioma>.md.
export const esquemaDaVersaoDoTexto = z.strictObject({
  titulo: frase,
  resumo: frase,
  endereco,
  // Só na tradução: se ela foi feita com IA.
  traducaoComIA: z.boolean().optional(),
});

// Uma frase escrita nos dois idiomas, num arquivo só.
const nosDoisIdiomas = z.strictObject({ en: frase, "pt-br": frase });

// Um mês, como 2026-02.
const mes = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, { error: "use ano e mês, como 2026-02" });

export const ESTADOS_DO_PROJETO = [
  "funciona-localmente",
  "em-desenvolvimento",
  "em-planejamento",
] as const;

// O que vale para as duas versões de um projeto: projetos/<projeto>/projeto.yaml.
export const esquemaDoProjeto = z.strictObject({
  nome: frase,
  // A posição na lista de projetos: o menor número vem primeiro.
  ordem: z.number(),
  estado: z.enum(ESTADOS_DO_PROJETO),
  atualizadaEm: dia,
  // A marca do projeto: o nome de um arquivo SVG na pasta do projeto.
  marca: z.string().regex(/^[\w-]+\.svg$/, { error: "use o nome de um arquivo .svg da pasta" }),
});

// A história do projeto num idioma: projetos/<projeto>/<idioma>.md. O corpo
// leva as decisões de engenharia e "Como foi construído".
export const esquemaDaVersaoDoProjeto = z.strictObject({
  oQueE: frase,
  descricao: frase,
});

export const STATUS_DO_ESTUDO = ["em-andamento", "concluido"] as const;

// Um estudo: estudos/<estudo>.yaml, com os dois idiomas dentro.
export const esquemaDoEstudo = z
  .strictObject({
    nome: nosDoisIdiomas,
    objetivo: nosDoisIdiomas,
    status: z.enum(STATUS_DO_ESTUDO),
    inicio: mes,
    conclusao: mes.optional(),
    ligacoes: z
      .strictObject({
        // Nomes das pastas em textos/.
        textos: z.array(z.string()).default([]),
        // Nome da pasta em projetos/.
        projeto: z.string().optional(),
        // O endereço do certificado.
        certificado: z.url().optional(),
        // Se o estudo fez parte da formação.
        formacao: z.boolean().default(false),
        // O paper e o TCC: nomes dos arquivos em pesquisa/, sem a extensão.
        pesquisa: z.array(z.string()).default([]),
      })
      .prefault({}),
  })
  .refine(({ status, conclusao }) => (status === "concluido") === (conclusao !== undefined), {
    path: ["conclusao"],
    error: "um estudo concluído tem o mês de conclusão, e um em andamento não tem",
  });

// A lista de estudos: listas/estudos.yaml.
export const esquemaDaListaDeEstudos = z.strictObject({ conferidaEm: mes });

// Um cargo: cargos/<cargo>.yaml. Cargos com a mesma empresa ficam juntos na
// linha do tempo.
export const esquemaDoCargo = z.strictObject({
  empresa: frase,
  // Em inglês nos dois idiomas.
  titulo: frase,
  inicio: mes,
  // Sem o fim, o cargo é o atual.
  fim: mes.optional(),
  contexto: nosDoisIdiomas,
  // Na ordem em que aparecem na página.
  conquistas: z.array(nosDoisIdiomas).min(1),
});

// O que o paper e o TCC têm em comum (seção 7.5 da spec).
const itemDePesquisa = z.strictObject({
  // A posição na página Pesquisa: o menor número vem primeiro.
  ordem: z.number(),
  resumo: nosDoisIdiomas,
  // O que Shaihan construiu.
  construido: nosDoisIdiomas,
  // O resultado, com a ressalva colada ao número.
  resultado: nosDoisIdiomas,
});

// Um item de pesquisa: pesquisa/<item>.yaml.
export const esquemaDoItemDePesquisa = z.discriminatedUnion("tipo", [
  itemDePesquisa.extend({
    tipo: z.literal("paper"),
    // No inglês original.
    titulo: frase,
    // Onde saiu, como "HAXD 2026, IEEE".
    publicacao: frase,
    // Como constam na publicação. `destaque` marca o nome de Shaihan.
    autores: z.array(z.strictObject({ nome: frase, destaque: z.boolean().default(false) })).min(1),
    doi: z.string().regex(/^10\.\d{4,}\/\S+$/, { error: "use só o DOI, como 10.1109/..." }),
  }),
  itemDePesquisa.extend({
    tipo: z.literal("tcc"),
    // Em português, e a tradução que aparece entre parênteses no inglês.
    titulo: frase,
    tituloTraduzido: frase,
    // O que é, com o orientador citado.
    oQueE: nosDoisIdiomas,
  }),
]);
