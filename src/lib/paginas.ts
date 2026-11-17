import { type Idioma, IDIOMAS, inicioDe, outroIdioma } from "./idiomas.ts";

// As páginas do menu, na ordem em que aparecem (seção 4 da spec).
export const PAGINAS_DO_MENU = ["projetos", "textos", "estudos", "pesquisa", "sobre"] as const;

export type PaginaFixa = "inicio" | (typeof PAGINAS_DO_MENU)[number];

// O endereço de cada página fixa em cada idioma, escrito no seu idioma.
const ENDERECOS: Record<PaginaFixa, Record<Idioma, string>> = {
  inicio: { en: inicioDe("en"), "pt-br": inicioDe("pt-br") },
  projetos: { en: "/projects", "pt-br": "/pt-br/projetos" },
  textos: { en: "/writing", "pt-br": "/pt-br/textos" },
  estudos: { en: "/studies", "pt-br": "/pt-br/estudos" },
  pesquisa: { en: "/research", "pt-br": "/pt-br/pesquisa" },
  sobre: { en: "/about", "pt-br": "/pt-br/sobre" },
};

export function enderecoDe(pagina: PaginaFixa, idioma: Idioma): string {
  return ENDERECOS[pagina][idioma];
}

// A página fixa que responde num caminho, se houver. Na construção, o Astro
// entrega o caminho do arquivo gerado, com `.html`; rodando localmente,
// entrega o endereço como o visitante pede.
export function paginaDe(caminho: string): PaginaFixa | undefined {
  const endereco = caminho.replace(/\.html$/, "").replace(/\/(index)?$/, "") || "/";
  const paginas = Object.keys(ENDERECOS) as PaginaFixa[];
  return paginas.find((pagina) => IDIOMAS.some((i) => ENDERECOS[pagina][i] === endereco));
}

// Para onde o botão de idioma leva: a mesma página no outro idioma. Fora das
// páginas fixas, como no "não encontrado", leva ao Início do outro idioma.
export function equivalenteDe(caminho: string, idioma: Idioma): string {
  return enderecoDe(paginaDe(caminho) ?? "inicio", outroIdioma(idioma));
}
