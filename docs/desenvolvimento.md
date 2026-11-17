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

Os testes do Início, em `tests/home.test.ts`, olham a página construída com o conteúdo de exemplo e a de uma cópia com o conteúdo trocado.

Os testes de Projetos, em `tests/projects.test.ts`, olham a lista e as histórias do projeto do mesmo jeito: com o conteúdo de exemplo e em cópias com uma pasta de projeto criada, apagada ou trocada.

Os testes do conteúdo, em `tests/content.test.ts`, constroem cópias do site numa pasta temporária, cada uma com um arquivo de conteúdo trocado, e conferem que a construção para no arquivo errado. Quem faz a cópia é `tests/support/copy.ts`.

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
| `src/pages/` | Um arquivo por endereço. As páginas em inglês ficam na raiz. `projects/[project].astro` gera uma página por pasta de projeto. |
| `src/pages/pt-br/` | As páginas em português. |
| `src/layouts/Base.astro` | O layout comum a todas as páginas: a moldura, o menu, o botão de idioma e o rodapé. |
| `src/layouts/Reading.astro` | A coluna de leitura simples, para as páginas de texto. Por enquanto, todas as páginas ainda vazias usam esta. |
| `src/views/` | O corpo de cada página, usado pelos arquivos dos dois idiomas: `Home.astro` (o Início), `Projects.astro` (a lista de projetos) e `ProjectStory.astro` (a história do projeto). |
| `src/components/` | As peças comuns: menu, botão de idioma, rodapé e as linhas de projeto (`ProjectRows.astro`), usadas no Início e em Projetos. |
| `src/styles/` | O CSS do sistema visual, portado do protótipo: `fonts`, `base`, `frame` (a moldura), `reading` (a leitura), `plan` (a planta do Início), `sections` (as seções, as linhas de projeto e as listas) e `story` (a história do projeto). Parte do celular e cresce com `min-width`. |
| `public/fonts/` | As três fontes, servidas pelo próprio site. |
| `src/lib/config.ts` | A chave do lançamento (ver abaixo). |
| `src/lib/languages.ts` | Os dois idiomas e o `lang` de cada um. |
| `src/lib/pages.ts` | Os endereços das páginas fixas nos dois idiomas, o equivalente de cada página, para o botão de idioma, e os endereços de uma história do projeto e de um texto. |
| `src/lib/project-story.ts` | A estrutura do corpo de uma história do projeto: transforma o Markdown nas seções da página e barra o corpo fora do formato. |
| `src/lib/dates.ts` | Como as datas do conteúdo são escritas em cada idioma. |
| `src/content/` | Os arquivos de conteúdo (ver "Conteúdo", abaixo). |
| `src/content.config.ts` | As coleções: em que pasta ficam os arquivos de cada uma. |
| `src/lib/schemas.ts` | Os campos de cada coleção e as listas fixas: temas, tipos de texto, estados e status. |
| `src/lib/content.ts` | O conteúdo já reunido e conferido. As páginas leem o conteúdo por aqui. |
| `src/lib/contact.ts` | Os canais do contato. |
| `src/lib/feed.ts` | O feed de cada idioma, ainda sem textos. |
| `tests/` | Os testes do site construído. |
| `scripts/check` | A conferência completa. |

As próximas partes do site entram nestas pastas, quando existirem:

| Caminho | O que vai guardar |
|---|---|
| `src/scripts/` | O JavaScript que roda no navegador. |

## O código é em inglês

Todo o código é escrito em inglês: nomes de arquivos, de funções e de variáveis, comentários, nomes dos testes, mensagens de erro, classes do CSS, e também os nomes dos campos e das pastas do conteúdo. Ficam em português os documentos (este, `GLOSSARY.md`, `DESIGN.md`, `PRODUCT.md`), as issues, os PRs, o conteúdo em português do site e os endereços em português (`/pt-br/projetos`).

Cada termo do `GLOSSARY.md` tem um nome só no código, anotado ali em "No código". Use esse nome, e não outra tradução.

## Idiomas e endereços

O inglês fica na raiz e o português em `/pt-br`. Cada página fixa existe nos dois idiomas, com o endereço escrito no seu idioma: `/projects` e `/pt-br/projetos`. Os endereços não têm barra no fim.

Uma página nova precisa de um arquivo em `src/pages/` e outro em `src/pages/pt-br/`. O `lang` sai sozinho, pelo lugar do arquivo. Uma página fixa nova também entra em `src/lib/pages.ts`, com o endereço de cada idioma: é dali que o botão de idioma tira o equivalente. Numa história do projeto, o botão leva à mesma história no outro idioma, e o menu marca Projetos. Fora das páginas fixas e das histórias, o botão leva ao Início do outro idioma.

O "não encontrado" tem uma página por idioma: `404.html` na raiz e `pt-br/404.html`. Quem escolhe qual mostrar é a hospedagem. Na Cloudflare, isso pede a opção que procura o `404.html` mais próximo do endereço pedido (`not_found_handling = "404-page"`), que entra com a configuração da prévia. Rodando com `npm run dev`, a página em português já aparece para endereços sob `/pt-br`.

## Não indexar até o lançamento

Até o lançamento, nada do site pode ser indexado. A construção faz duas coisas:

- toda página sai com `<meta name="robots" content="noindex">`;
- a pasta `dist/` ganha um arquivo `_headers`, que a Cloudflare lê para mandar o cabeçalho `X-Robots-Tag: noindex` em todos os arquivos, inclusive nos feeds.

Quem manda nas duas é uma chave só, em `src/lib/config.ts`:

```ts
export const INDEXABLE: boolean = false;
```

No dia do lançamento, troque para `true`. Os dois testes de não indexar passam a falhar e saem junto.

## Conteúdo

Tudo o que o site diz fica em `src/content/`. Trocar uma frase, um estado ou uma conquista é mudar um arquivo dali; acrescentar ou tirar um item é criar ou apagar um arquivo. O que não é frase (datas, status, ordem, ligações, temas) é escrito uma vez só e vale para os dois idiomas.

| Pasta | O que guarda | Formato |
|---|---|---|
| `pages/` | As frases das páginas fixas: nomes do menu, descrições das páginas, rótulo, frase de apresentação, as frases do Início (blocos da planta, chamada do paper, links das seções), os nomes dos estados do projeto e dos tipos de texto, bio, formação e as frases do layout comum. | `en.yaml` e `pt-br.yaml`, com as mesmas chaves. |
| `texts/` | Os textos. | Uma pasta por texto: `text.yaml` e um `.md` por idioma. |
| `projects/` | Os projetos e as histórias do projeto. | Uma pasta por projeto: `project.yaml`, `mark.svg` e a história do projeto em `en.md` e `pt-br.md`. |
| `studies/` | Os estudos. | Um `.yaml` por estudo, com os dois idiomas dentro. |
| `lists/studies.yaml` | A data "conferida em" da lista de estudos. | Um arquivo só. |
| `roles/` | Os cargos da experiência. | Um `.yaml` por cargo, com os dois idiomas dentro. |
| `research/` | Os itens de pesquisa: o paper e o TCC. | Um `.yaml` por item, com os dois idiomas dentro. |

O nome do arquivo (ou da pasta) é o identificador do item: é ele que as ligações usam. Os campos de cada coleção estão em `src/lib/schemas.ts`. Os nomes dos campos e das pastas são em inglês; o que se escreve dentro deles segue o idioma do site.

**O conteúdo que está lá hoje é de exemplo.** Ele é inventado, está marcado com `[Exemplo]` ou `[Example]`, e serve para as páginas poderem ser construídas. Cada arquivo de exemplo sai do repo antes do lançamento, quando o conteúdo de verdade entrar. O repo é público: nada dos dossiês locais entra aqui sem passar pelas regras da seção 11 da spec.

### Criar um texto

1. Crie a pasta `src/content/texts/<nome-do-texto>/`. O nome da pasta não aparece no site.
2. Crie `text.yaml`, com o que vale para todas as versões:

   ```yaml
   publishedOn: 2026-01-15 # a data de publicação, sem aspas
   type: article # o tipo de texto: article (artigo) ou study-note (nota de estudo)
   topics: [backend, architecture] # de um a três temas, da lista em src/lib/schemas.ts
   originalLanguage: pt-br # o idioma original: pt-br ou en
   study: nome-do-estudo # opcional: o estudo de origem
   updatedOn: 2026-02-03 # opcional: a data de atualização, só depois de uma revisão de conteúdo
   draft: true # opcional: rascunho
   ```

3. Crie o arquivo do idioma original, `pt-br.md` ou `en.md`, com o cabeçalho e o corpo:

   ```md
   ---
   title: O título do texto
   summary: O resumo de uma linha.
   slug: o-titulo-do-texto
   ---

   O corpo, em Markdown.
   ```

   `slug` é a última parte do endereço da página, em palavras do idioma do arquivo: este texto fica em `/pt-br/textos/o-titulo-do-texto`. As imagens do texto ficam na mesma pasta. O arquivo é sempre `.md`: o MDX ainda não está ligado, e um `.mdx` seria ignorado.

**Tradução.** Crie o arquivo do outro idioma na mesma pasta, com `title`, `summary` e `slug` no idioma dele, e mais o campo `translatedWithAI: true` (ou `false`), que toda tradução tem. Nada muda em `text.yaml`. Um texto sem tradução é só um texto sem esse segundo arquivo.

**Rascunho.** Com `draft: true`, o texto aparece só no site rodando localmente (`npm run dev`) e fica fora de toda construção (`npm run build`). Para publicar, apague a linha. O repo é público: o rascunho não aparece no site, mas o arquivo aparece no GitHub.

**Tema novo.** A lista de temas é fixa: um tema novo entra em `TOPICS`, em `src/lib/schemas.ts`.

### Criar um projeto

1. Crie a pasta `src/content/projects/<nome-do-projeto>/`. O nome da pasta é a última parte do endereço: `/projects/<nome-do-projeto>` e `/pt-br/projetos/<nome-do-projeto>`.
2. Crie `project.yaml`:

   ```yaml
   name: Nome do Projeto
   order: 3
   state: in-development # o estado do projeto: works-locally, in-development ou in-planning
   updatedOn: 2026-05-20 # a data "atualizada em", sem aspas
   ```

3. Ponha a marca do projeto na pasta, num arquivo SVG chamado `mark.svg`.
4. Crie `en.md` e `pt-br.md`, os dois, com a história do projeto em cada idioma:

   ```md
   ---
   whatItIs: O que é o projeto, em uma ou duas frases.
   description: A descrição da página.
   ---

   ## Decisões de engenharia

   ### O título da primeira decisão

   **O problema.** O que precisava ser resolvido.

   **A escolha.** O que foi escolhido.

   **O que foi descartado.** A alternativa que ficou de fora, e por quê.

   ### O título da segunda decisão

   ...

   ## Como foi construído

   O crédito dos agentes, no primeiro parágrafo.
   ```

A página da história mostra, nesta ordem: a marca do projeto e o nome, o estado do projeto e "atualizada em", "o que é", as decisões de engenharia e "Como foi construído". As três primeiras partes saem dos campos; as duas últimas, do corpo do arquivo. O corpo segue um formato fixo:

- Duas partes, cada uma sob um título `##`: primeiro as decisões de engenharia, depois "Como foi construído". Os títulos são escritos no idioma do arquivo.
- De duas a quatro decisões, cada uma sob um título `###`.
- Um parágrafo que começa com uma frase em negrito (`**O problema.** ...`) vira um item da decisão: a frase em negrito é a legenda e o resto é a resposta.
- O primeiro parágrafo de "Como foi construído" aparece em destaque.
- Nenhum link sai do site: uma história do projeto não tem link para repo nem para demo. Links para páginas do site (`/research`) podem.

**Imagens.** As capturas e o diagrama de um projeto ficam na pasta dele, ao lado dos arquivos da história, e entram no corpo pelo Markdown:

```md
![O que a imagem mostra, para quem não a vê](./diagrama.svg "A legenda, que aparece abaixo da imagem.")
```

A imagem fica sozinha no parágrafo e aparece com a moldura de um fio; a legenda, entre aspas, é opcional. Um arquivo de imagem serve aos dois idiomas, com o texto alternativo e a legenda escritos em cada um. Use SVG para diagramas e PNG para capturas, com no máximo a largura da coluna em dobro (cerca de 1600 px). Hoje nenhum projeto de exemplo tem imagem.

### Criar um estudo

Crie `src/content/studies/<nome-do-estudo>.yaml`:

```yaml
name:
  en: Study name
  pt-br: Nome do estudo
goal:
  en: The goal, in one line.
  pt-br: O objetivo, numa linha.
status: in-progress # o status do estudo: in-progress ou completed
start: 2026-02
end: 2026-08 # só quando o status é completed
links: # tudo opcional
  texts: [nome-do-texto]
  project: nome-do-projeto
  certificate: https://exemplo.com/certificado
  education: true # o estudo fez parte da formação
  research: [nome-do-item-de-pesquisa]
```

Um texto que tem o estudo no campo `study` (o estudo de origem) já aparece ligado a ele: `links.texts` é só para os outros textos que o estudo quiser mostrar.

Um estudo que parou sai da lista: apague o arquivo. Ao terminar uma conferência, mude `checkedOn` em `src/content/lists/studies.yaml`.

### Criar um cargo

Crie `src/content/roles/<nome-do-cargo>.yaml`:

```yaml
company: Nome da Empresa
title: Software Engineer II # em inglês nos dois idiomas
start: 2024-03
end: 2025-06 # sem esta linha, o cargo é o atual
context:
  en: One line of context.
  pt-br: Uma linha de contexto.
achievements: # as conquistas
  - en: The first achievement.
    pt-br: A primeira conquista.
```

Cargos com o mesmo valor em `company` ficam juntos na linha do tempo.

### Mudar a ordem de uma lista

A ordem de toda lista sai dos arquivos de conteúdo:

| Lista | O que manda na ordem |
|---|---|
| Projetos | O campo `order` de cada `project.yaml`: o menor número vem primeiro. |
| Itens de pesquisa | O campo `order` de cada arquivo: o menor número vem primeiro. |
| Conquistas de um cargo | A ordem das linhas em `achievements`. |
| Autores do paper | A ordem das linhas em `authors`. |
| Temas de um texto | A ordem em `topics`. |
| Textos | A data `publishedOn`: o mais recente vem primeiro. |
| Cargos | O mês `start`: o mais recente vem primeiro. |
| Estudos | O mês `start`: o mais recente vem primeiro. A página separa os estudos em andamento dos concluídos. |

### O que barra a construção

A conferência do conteúdo roda em toda construção (`npm run build`, e portanto `scripts/check`). Se ela falhar, nada é publicado e o site fica como estava. O erro diz o arquivo e o problema, em inglês. Ela para quando:

- falta um campo obrigatório, ou um campo tem um valor fora do formato;
- um texto tem um tema fora da lista, nenhum tema ou mais de três;
- uma ligação aponta para um estudo, texto, projeto ou item de pesquisa que não existe;
- uma página fixa, um projeto ou um estudo existe num idioma e falta no outro. Para os textos essa regra não vale: a tradução é opcional;
- um texto não tem a versão no idioma original, ou uma tradução não diz se foi feita com IA;
- dois textos têm o mesmo `slug` no mesmo idioma;
- um projeto não tem a marca do projeto, `mark.svg`, na pasta;
- o corpo de uma história do projeto não tem as duas partes, tem menos de duas ou mais de quatro decisões, tem texto antes da primeira parte ou tem um link que sai do site.

### Ler o conteúdo numa página

As páginas não leem as coleções direto. Elas pedem o conteúdo a `src/lib/content.ts`:

```ts
import { content } from "../lib/content.ts";

const { texts, projects, studies, roles, research } = await content();
```

É ali que as versões de cada idioma são reunidas, que as listas são ordenadas, que as ligações são conferidas e que os rascunhos saem da construção publicada. Uma página que lesse a coleção direto mostraria os rascunhos.
