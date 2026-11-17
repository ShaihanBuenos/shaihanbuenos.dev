# Desenvolvimento do site

Este repo guarda o código do site pessoal `shaihanbuenos.dev`, um projeto [Astro](https://astro.build) com TypeScript, de saída estática. O README do perfil do GitHub fica em outro repo, `ShaihanBuenos/ShaihanBuenos`.

## O que precisa

- Node.js 22.23.4 ou mais novo.
- npm, que vem com o Node.

Instale as dependências uma vez:

```sh
npm ci
```

## Rodar

```sh
npm run dev
```

O site abre em `http://localhost:4321` e recarrega a cada mudança.

## Conferir

Um comando só roda tudo, na ordem: formato, lint, tipos, construção e testes.

```sh
scripts/check
```

Cada parte também roda sozinha:

```sh
npm run format      # arruma o formato dos arquivos (Prettier)
npm run lint        # regras de TypeScript (ESLint)
npm run typecheck   # tipos e erros nos arquivos .astro e .ts
npm test            # constrói o site e roda os testes
```

Os testes em `tests/` olham o site construído: sobem a pasta `dist/` num servidor local e pedem cada endereço, como um visitante faria. Eles conferem que cada endereço responde no idioma certo e que nada pode ser indexado. Testes de uma função ficam ao lado dela, em `src/lib/<nome>.test.ts`.

Os testes do conteúdo, em `tests/conteudo.test.ts`, constroem cópias do site numa pasta temporária, cada uma com um arquivo de conteúdo trocado, e conferem que a construção para no arquivo errado. Quem faz a cópia é `tests/apoio/copia.ts`.

## Construir

```sh
npm run build     # escreve o site em dist/
npm run preview   # serve a pasta dist/ em http://localhost:4321
```

A saída é só de arquivos estáticos.

## Onde fica cada coisa

| Caminho | O que guarda |
|---|---|
| `astro.config.ts` | A configuração do Astro: endereço do site, idiomas, formato da saída e o arquivo `_headers`. |
| `src/pages/` | Um arquivo por endereço. As páginas em inglês ficam na raiz. |
| `src/pages/pt-br/` | As páginas em português. |
| `src/layouts/Base.astro` | O layout comum a todas as páginas: a moldura, o menu, o botão de idioma e o rodapé. |
| `src/layouts/Leitura.astro` | A coluna de leitura simples, para as páginas de texto. Por enquanto, todas as páginas vazias usam esta. |
| `src/components/` | As peças comuns: menu, botão de idioma, rodapé. |
| `src/styles/` | O CSS do sistema visual, portado do protótipo: fontes, base, moldura e leitura. Parte do celular e cresce com `min-width`. |
| `public/fonts/` | As três fontes, servidas pelo próprio site. |
| `src/lib/configuracao.ts` | A chave do lançamento (ver abaixo). |
| `src/lib/idiomas.ts` | Os dois idiomas e o `lang` de cada um. |
| `src/lib/paginas.ts` | Os endereços das páginas fixas nos dois idiomas e o equivalente de cada uma, para o botão de idioma. |
| `src/content/` | Os arquivos de conteúdo (ver "Conteúdo", abaixo). |
| `src/content.config.ts` | As coleções: em que pasta ficam os arquivos de cada uma. |
| `src/lib/esquemas.ts` | Os campos de cada coleção e as listas fixas: temas, tipos de texto, estados e status. |
| `src/lib/conteudo.ts` | O conteúdo já reunido e conferido. As páginas leem o conteúdo por aqui. |
| `src/lib/contato.ts` | Os canais do contato. |
| `src/lib/feed.ts` | O feed de cada idioma, ainda sem textos. |
| `tests/` | Os testes do site construído. |
| `scripts/check` | A conferência completa. |

As próximas partes do site entram nestas pastas, quando existirem:

| Caminho | O que vai guardar |
|---|---|
| `src/views/` | O corpo de cada página, usado pelos arquivos dos dois idiomas. |
| `src/scripts/` | O JavaScript que roda no navegador. |

## Idiomas e endereços

O inglês fica na raiz e o português em `/pt-br`. Cada página fixa existe nos dois idiomas, com o endereço escrito no seu idioma: `/projects` e `/pt-br/projetos`. Os endereços não têm barra no fim.

Uma página nova precisa de um arquivo em `src/pages/` e outro em `src/pages/pt-br/`. O `lang` sai sozinho, pelo lugar do arquivo. Uma página fixa nova também entra em `src/lib/paginas.ts`, com o endereço de cada idioma: é dali que o botão de idioma tira o equivalente. Fora das páginas fixas, o botão leva ao Início do outro idioma.

O "não encontrado" tem uma página por idioma: `404.html` na raiz e `pt-br/404.html`. Quem escolhe qual mostrar é a hospedagem. Na Cloudflare, isso pede a opção que procura o `404.html` mais próximo do endereço pedido (`not_found_handling = "404-page"`), que entra com a configuração da prévia. Rodando com `npm run dev`, a página em português já aparece para endereços sob `/pt-br`.

## Não indexar até o lançamento

Até o lançamento, nada do site pode ser indexado. A construção faz duas coisas:

- toda página sai com `<meta name="robots" content="noindex">`;
- a pasta `dist/` ganha um arquivo `_headers`, que a Cloudflare lê para mandar o cabeçalho `X-Robots-Tag: noindex` em todos os arquivos, inclusive nos feeds.

Quem manda nas duas é uma chave só, em `src/lib/configuracao.ts`:

```ts
export const PODE_SER_INDEXADO: boolean = false;
```

No dia do lançamento, troque para `true`. Os dois testes de não indexar passam a falhar e saem junto.

## Conteúdo

Tudo o que o site diz fica em `src/content/`. Trocar uma frase, um estado ou uma conquista é mudar um arquivo dali; acrescentar ou tirar um item é criar ou apagar um arquivo. O que não é frase (datas, status, ordem, ligações, temas) é escrito uma vez só e vale para os dois idiomas.

| Pasta | O que guarda | Formato |
|---|---|---|
| `paginas/` | As frases das páginas fixas: nomes do menu, descrições das páginas, rótulo, frase de apresentação, bio, formação e as frases do layout comum. | `en.yaml` e `pt-br.yaml`, com as mesmas chaves. |
| `textos/` | Os textos. | Uma pasta por texto: `texto.yaml` e um `.md` por idioma. |
| `projetos/` | Os projetos e as histórias do projeto. | Uma pasta por projeto: `projeto.yaml`, `marca.svg`, `en.md` e `pt-br.md`. |
| `estudos/` | Os estudos. | Um `.yaml` por estudo, com os dois idiomas dentro. |
| `listas/estudos.yaml` | A data "conferida em" da lista de estudos. | Um arquivo só. |
| `cargos/` | Os cargos da experiência. | Um `.yaml` por cargo, com os dois idiomas dentro. |
| `pesquisa/` | Os itens de pesquisa: o paper e o TCC. | Um `.yaml` por item, com os dois idiomas dentro. |

O nome do arquivo (ou da pasta) é o identificador do item: é ele que as ligações usam. Os campos de cada coleção estão em `src/lib/esquemas.ts`, com um comentário em cada um.

**O conteúdo que está lá hoje é de exemplo.** Ele é inventado, está marcado com `[Exemplo]` ou `[Example]`, e serve para as páginas poderem ser construídas. Cada arquivo de exemplo sai do repo antes do lançamento, quando o conteúdo de verdade entrar. O repo é público: nada dos dossiês locais entra aqui sem passar pelas regras da seção 11 da spec.

### Criar um texto

1. Crie a pasta `src/content/textos/<nome-do-texto>/`. O nome da pasta não aparece no site.
2. Crie `texto.yaml`, com o que vale para todas as versões:

   ```yaml
   publicadoEm: 2026-01-15
   tipo: artigo # ou nota-de-estudo
   temas: [backend, arquitetura] # de um a três, da lista em src/lib/esquemas.ts
   idiomaOriginal: pt-br # ou en
   estudo: nome-do-estudo # opcional: o estudo de origem
   atualizadoEm: 2026-02-03 # opcional: só depois de uma revisão de conteúdo
   rascunho: true # opcional
   ```

3. Crie o arquivo do idioma original, `pt-br.md` ou `en.md`, com o cabeçalho e o corpo:

   ```md
   ---
   titulo: O título do texto
   resumo: O resumo de uma linha.
   endereco: o-titulo-do-texto
   ---

   O corpo, em Markdown.
   ```

   `endereco` é a última parte do endereço da página, em palavras do idioma do arquivo: este texto fica em `/pt-br/textos/o-titulo-do-texto`. As imagens do texto ficam na mesma pasta.

**Tradução.** Crie o arquivo do outro idioma na mesma pasta, com `titulo`, `resumo` e `endereco` no idioma dele, e mais o campo `traducaoComIA: true` (ou `false`), que toda tradução tem. Nada muda em `texto.yaml`. Um texto sem tradução é só um texto sem esse segundo arquivo.

**Rascunho.** Com `rascunho: true`, o texto aparece só no site rodando localmente (`npm run dev`) e fica fora da construção publicada. Para publicar, apague a linha. O repo é público: o rascunho não aparece no site, mas o arquivo aparece no GitHub.

**Tema novo.** A lista de temas é fixa: um tema novo entra em `TEMAS`, em `src/lib/esquemas.ts`.

### Criar um projeto

1. Crie a pasta `src/content/projetos/<nome-do-projeto>/`. O nome da pasta é a última parte do endereço: `/projects/<nome-do-projeto>` e `/pt-br/projetos/<nome-do-projeto>`.
2. Crie `projeto.yaml`:

   ```yaml
   nome: Nome do Projeto
   ordem: 3
   estado: em-desenvolvimento # ou funciona-localmente, ou em-planejamento
   atualizadaEm: 2026-05-20
   marca: marca.svg
   ```

3. Ponha a marca do projeto na pasta, num arquivo SVG com o nome do campo `marca`.
4. Crie `en.md` e `pt-br.md`, os dois, com a história do projeto em cada idioma:

   ```md
   ---
   oQueE: O que é o projeto, em uma ou duas frases.
   descricao: A descrição da página.
   ---

   ## Decisões de engenharia

   ...

   ## Como foi construído

   ...
   ```

### Criar um estudo

Crie `src/content/estudos/<nome-do-estudo>.yaml`:

```yaml
nome:
  en: Study name
  pt-br: Nome do estudo
objetivo:
  en: The goal, in one line.
  pt-br: O objetivo, numa linha.
status: em-andamento # ou concluido
inicio: 2026-02
conclusao: 2026-08 # só quando o status é concluido
ligacoes: # tudo opcional
  textos: [nome-do-texto]
  projeto: nome-do-projeto
  certificado: https://exemplo.com/certificado
  formacao: true
  pesquisa: [nome-do-item-de-pesquisa]
```

Um estudo que parou sai da lista: apague o arquivo. Ao terminar uma conferência, mude `conferidaEm` em `src/content/listas/estudos.yaml`.

### Criar um cargo

Crie `src/content/cargos/<nome-do-cargo>.yaml`:

```yaml
empresa: Nome da Empresa
titulo: Software Engineer II # em inglês nos dois idiomas
inicio: 2024-03
fim: 2025-06 # sem esta linha, o cargo é o atual
contexto:
  en: One line of context.
  pt-br: Uma linha de contexto.
conquistas:
  - en: The first achievement.
    pt-br: A primeira conquista.
```

Cargos com o mesmo valor em `empresa` ficam juntos na linha do tempo.

### Mudar a ordem de uma lista

A ordem de toda lista sai dos arquivos de conteúdo:

| Lista | O que manda na ordem |
|---|---|
| Projetos | O campo `ordem` de cada `projeto.yaml`: o menor número vem primeiro. |
| Itens de pesquisa | O campo `ordem` de cada arquivo: o menor número vem primeiro. |
| Conquistas de um cargo | A ordem das linhas em `conquistas`. |
| Autores do paper | A ordem das linhas em `autores`. |
| Temas de um texto | A ordem em `temas`. |
| Textos | A data `publicadoEm`: o mais recente vem primeiro. |
| Cargos | O mês `inicio`: o mais recente vem primeiro. |
| Estudos | O `status` e os meses `inicio` e `conclusao`. |

### O que barra a construção

A conferência do conteúdo roda em toda construção (`npm run build`, e portanto `scripts/check`). Se ela falhar, nada é publicado e o site fica como estava. O erro diz o arquivo e o problema. Ela para quando:

- falta um campo obrigatório, ou um campo tem um valor fora do formato;
- um texto tem um tema fora da lista, nenhum tema ou mais de três;
- uma ligação aponta para um estudo, texto, projeto ou item de pesquisa que não existe;
- uma página fixa, um projeto ou um estudo existe num idioma e falta no outro. Para os textos essa regra não vale: a tradução é opcional;
- um texto não tem a versão no idioma original, ou uma tradução não diz se foi feita com IA;
- dois textos têm o mesmo `endereco` no mesmo idioma;
- um projeto aponta para uma marca que não está na pasta.

### Ler o conteúdo numa página

As páginas não leem as coleções direto. Elas pedem o conteúdo a `src/lib/conteudo.ts`:

```ts
import { conteudo } from "../lib/conteudo.ts";

const { textos, projetos, estudos, cargos, pesquisa } = await conteudo();
```

É ali que as versões de cada idioma são reunidas, que as listas são ordenadas, que as ligações são conferidas e que os rascunhos saem da construção publicada. Uma página que lesse a coleção direto mostraria os rascunhos.
