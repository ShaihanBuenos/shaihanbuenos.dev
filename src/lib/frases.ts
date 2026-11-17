import type { Idioma } from "./idiomas.ts";
import type { PaginaFixa } from "./paginas.ts";

// Provisório: as frases do layout comum passam para os arquivos de conteúdo
// junto com as outras frases das páginas fixas (seção 6 da spec).
interface Frases {
  // O nome de cada página fixa, como aparece no menu.
  paginas: Record<PaginaFixa, string>;
  // O nome do menu para leitores de tela.
  menu: string;
  // O nome do botão de idioma para leitores de tela.
  idioma: string;
  // O link que pula o menu, para quem navega pelo teclado.
  pular: string;
}

export const FRASES: Record<Idioma, Frases> = {
  en: {
    paginas: {
      inicio: "Home",
      projetos: "Projects",
      textos: "Writing",
      estudos: "Studies",
      pesquisa: "Research",
      sobre: "About",
    },
    menu: "Main",
    idioma: "Language",
    pular: "Skip to content",
  },
  "pt-br": {
    paginas: {
      inicio: "Início",
      projetos: "Projetos",
      textos: "Textos",
      estudos: "Estudos",
      pesquisa: "Pesquisa",
      sobre: "Sobre",
    },
    menu: "Principal",
    idioma: "Idioma",
    pular: "Pular para o conteúdo",
  },
};
