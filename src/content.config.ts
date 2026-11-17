// As coleções de conteúdo (seção 6 da spec): onde ficam os arquivos de cada
// uma e que campos eles têm. Os campos estão em src/lib/esquemas.ts.
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import {
  esquemaDaListaDeEstudos,
  esquemaDasPaginas,
  esquemaDaHistoriaDoProjeto,
  esquemaDaVersaoDoTexto,
  esquemaDoCargo,
  esquemaDoEstudo,
  esquemaDoItemDePesquisa,
  esquemaDoProjeto,
  esquemaDoTexto,
} from "./lib/esquemas.ts";

// O identificador de um item curto é o nome do arquivo, sem a extensão.
function arquivosDe(pasta: string) {
  return glob({ base: `./src/content/${pasta}`, pattern: "*.yaml" });
}

const paginas = defineCollection({
  loader: arquivosDe("paginas"),
  schema: esquemaDasPaginas,
});

// Um texto é uma pasta. O identificador do texto é o nome da pasta, e o de
// cada versão é "<pasta>/<idioma>".
const textos = defineCollection({
  loader: glob({
    base: "./src/content/textos",
    pattern: "*/texto.yaml",
    generateId: ({ entry }) => entry.replace(/\/texto\.yaml$/, ""),
  }),
  schema: esquemaDoTexto,
});

const versoesDosTextos = defineCollection({
  loader: glob({
    base: "./src/content/textos",
    pattern: "*/{en,pt-br}.md",
    generateId: ({ entry }) => entry.replace(/\.md$/, ""),
  }),
  schema: esquemaDaVersaoDoTexto,
});

// Um projeto também é uma pasta, com a história do projeto em cada idioma.
const projetos = defineCollection({
  loader: glob({
    base: "./src/content/projetos",
    pattern: "*/projeto.yaml",
    generateId: ({ entry }) => entry.replace(/\/projeto\.yaml$/, ""),
  }),
  schema: esquemaDoProjeto,
});

const historiasDosProjetos = defineCollection({
  loader: glob({
    base: "./src/content/projetos",
    pattern: "*/{en,pt-br}.md",
    generateId: ({ entry }) => entry.replace(/\.md$/, ""),
  }),
  schema: esquemaDaHistoriaDoProjeto,
});

const estudos = defineCollection({ loader: arquivosDe("estudos"), schema: esquemaDoEstudo });
const listas = defineCollection({
  loader: glob({ base: "./src/content/listas", pattern: "estudos.yaml" }),
  schema: esquemaDaListaDeEstudos,
});
const cargos = defineCollection({ loader: arquivosDe("cargos"), schema: esquemaDoCargo });
const pesquisa = defineCollection({
  loader: arquivosDe("pesquisa"),
  schema: esquemaDoItemDePesquisa,
});

export const collections = {
  paginas,
  textos,
  versoesDosTextos,
  projetos,
  historiasDosProjetos,
  estudos,
  listas,
  cargos,
  pesquisa,
};
