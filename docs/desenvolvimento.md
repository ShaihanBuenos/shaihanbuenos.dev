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
npm test            # constrói o site do zero e roda os testes
```

Os testes em `tests/` olham o site construído: sobem a pasta `dist/` num servidor local e pedem cada endereço, como um visitante faria. Eles conferem que cada endereço responde no idioma certo e que nada pode ser indexado. Testes de uma função ficam ao lado dela, em `src/lib/<nome>.test.ts`.

Os testes do Início, em `tests/home.test.ts`, olham a página construída com o conteúdo de exemplo e a de uma cópia com o conteúdo trocado.

Os testes de Projetos, em `tests/projects.test.ts`, olham a lista e as histórias do projeto do mesmo jeito: com o conteúdo de exemplo e em cópias com uma pasta de projeto criada, apagada ou trocada.

Os testes de Textos, em `tests/writing.test.ts`, olham a lista de textos e a página de um texto: com o conteúdo de exemplo e numa cópia com textos criados, um deles com tradução.

Os testes de Estudos, em `tests/studies.test.ts`, olham a lista de estudos: com o conteúdo de exemplo e numa cópia com estudos criados, um apagado e outro mês de conferência.

Os testes de Pesquisa, em `tests/research.test.ts`, olham a página Pesquisa: com o conteúdo de exemplo e em cópias com um paper e um TCC de teste, com o TCC apagado e com a ordem trocada.

Os testes de Sobre, em `tests/about.test.ts`, olham a página Sobre: com o conteúdo de exemplo e numa cópia com cargos criados, um trocado e um apagado.

Os testes do movimento, em `tests/motion.test.ts`, olham as páginas, o CSS e o JavaScript construídos: o que é animado, o que sobra com o movimento reduzido e com o JavaScript desligado, onde cada parte do movimento existe e quanto JavaScript vai para o navegador. Quem lê o CSS construído é `tests/support/css.ts`. Ver "Movimento", abaixo.

Os testes da descoberta, em `tests/discovery.test.ts`, olham os dois feeds, o `<head>` de cada página, as imagens de compartilhamento, o mapa do site e o `robots.txt`: com o conteúdo de exemplo e em cópias com um texto criado, traduzido e revisado, e com a chave do lançamento ligada. Ver "Descoberta", abaixo.

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
| `src/pages/` | Um arquivo por endereço. As páginas em inglês ficam na raiz. `projects/[project].astro` gera uma página por pasta de projeto, e `writing/[text].astro`, uma página por texto que tem versão em inglês. Também ficam aqui os arquivos que não são páginas: os feeds (`rss.xml.ts`), o mapa do site (`sitemap.xml.ts`), o `robots.txt.ts` e as imagens de compartilhamento (`share/[...image].png.ts`). |
| `src/pages/pt-br/` | As páginas em português. `textos/[text].astro` gera uma página por texto que tem versão em português. |
| `src/layouts/Base.astro` | O layout comum a todas as páginas: a moldura, o menu, o botão de idioma, o rodapé e a troca de página. Ele monta o `<head>` de toda página: o título da aba, a descrição, o endereço canônico, o hreflang, o feed do idioma e a imagem de compartilhamento (ver "Descoberta", abaixo). O slot `head` recebe o que uma página acrescenta ao `<head>`: o movimento, nas páginas que têm, e os dados estruturados. |
| `src/layouts/Reading.astro` | A coluna de leitura simples: o título e, abaixo dele, o que a página puser. É a da lista de textos, da página de um texto, da lista de estudos, da página Pesquisa, da página Sobre e do "não encontrado". |
| `src/views/` | O corpo de cada página, usado pelos arquivos dos dois idiomas: `Home.astro` (o Início), `Projects.astro` (a lista de projetos), `ProjectStory.astro` (a história do projeto), `Writing.astro` (a lista de textos), `Text.astro` (a página de um texto), `Studies.astro` (a lista de estudos), `Research.astro` (a página Pesquisa) e `About.astro` (a página Sobre). |
| `src/components/` | As peças comuns: menu, botão de idioma, rodapé, os links do contato (`ContactLinks.astro`), usados no rodapé e na página Sobre, e as linhas de projeto (`ProjectRows.astro`), usadas no Início e em Projetos, a marca de idioma (`LanguageMark.astro`), usada no Início e nos itens de texto, o item de texto (`TextItem.astro`), usado na lista de textos e nos textos ligados a um estudo, o título de um item de pesquisa (`ResearchTitle.astro`), usado na página Pesquisa e na lista de estudos, o período de uma empresa ou de um cargo (`Period.astro`), usado na página Sobre, o movimento (`Motion.astro`), usado no Início, em Projetos e na história do projeto, e os dados estruturados (`StructuredData.astro`), usados no Início e na página de um texto. |
| `src/styles/` | O CSS do sistema visual, portado do protótipo: `fonts`, `base`, `frame` (a moldura), `reading` (a leitura: a coluna, o corpo de um texto, a lista de textos, a lista de estudos, os itens de pesquisa e a página Sobre), `plan` (a planta do Início), `sections` (as seções, as linhas de projeto e as listas) e `story` (a história do projeto). Parte do celular e cresce com `min-width`. O movimento "Traçado" fica em três arquivos: `page-change` (a troca de página, em todas as páginas), `motion-opening` (a abertura e os pulsos, só no Início) e `motion-scroll` (a barra de progresso e a revelação das seções). |
| `src/scripts/` | O JavaScript que roda no navegador: `motion.ts`, o do movimento (ver "Movimento", abaixo). |
| `public/fonts/` | As três fontes, servidas pelo próprio site. |
| `src/assets/` | As imagens que as páginas importam: hoje, o avatar (ver "O avatar", abaixo). |
| `tools/avatar.py` | O script que desenha o avatar. |
| `src/lib/config.ts` | A chave do lançamento (ver abaixo). |
| `src/lib/languages.ts` | Os dois idiomas e o `lang` de cada um. |
| `src/lib/pages.ts` | Os endereços das páginas fixas nos dois idiomas, o equivalente de cada página, para o botão de idioma e para o hreflang, os endereços de uma história do projeto, de um texto, de um estudo, de um item de pesquisa e de uma seção da página Sobre, o equivalente de um texto e o endereço absoluto de um caminho (`addressOf`). |
| `src/lib/project-story.ts` | A estrutura do corpo de uma história do projeto: transforma o Markdown nas seções da página e barra o corpo fora do formato. |
| `src/lib/dates.ts` | Como as datas do conteúdo são escritas em cada idioma. |
| `src/lib/experience.ts` | A linha do tempo da experiência: os cargos reunidos por empresa, e o período de um conjunto de cargos, usado na página Sobre e no Início. |
| `src/content/` | Os arquivos de conteúdo (ver "Conteúdo", abaixo). |
| `src/content.config.ts` | As coleções: em que pasta ficam os arquivos de cada uma. |
| `src/lib/schemas.ts` | Os campos de cada coleção e as listas fixas: temas, tipos de texto, estados e status. |
| `src/lib/content.ts` | O conteúdo já reunido e conferido. As páginas leem o conteúdo por aqui. |
| `src/lib/contact.ts` | Os canais do contato, mostrados no rodapé e na página Sobre. |
| `src/lib/feed.ts` | O feed de cada idioma. |
| `src/lib/site.ts` | O nome do site e o domínio, para onde o site diz o próprio nome: o título da aba, os feeds, as imagens de compartilhamento e os dados estruturados. |
| `src/fontkit.d.ts` | Os tipos da parte do `fontkit` que o desenho das imagens usa; o pacote não traz os seus. |
| `src/lib/share-image.ts` | As imagens de compartilhamento: quais existem, onde fica cada uma e o que cada uma diz. |
| `src/lib/share-image-drawing.ts` | O desenho de uma imagem de compartilhamento, e o PNG. |
| `src/lib/structured-data.ts` | Os dados estruturados: a pessoa do Início e o artigo de um texto. |
| `tests/` | Os testes do site construído. |
| `scripts/check` | A conferência completa. |

## O código é em inglês

Todo o código é escrito em inglês: nomes de arquivos, de funções e de variáveis, comentários, nomes dos testes, mensagens de erro, classes do CSS, e também os nomes dos campos e das pastas do conteúdo. Ficam em português os documentos (este, `GLOSSARY.md`, `DESIGN.md`, `PRODUCT.md`), as issues, os PRs, o conteúdo em português do site e os endereços em português (`/pt-br/projetos`).

Cada termo do `GLOSSARY.md` tem um nome só no código, anotado ali em "No código". Use esse nome, e não outra tradução.

## Idiomas e endereços

O inglês fica na raiz e o português em `/pt-br`. Cada página fixa existe nos dois idiomas, com o endereço escrito no seu idioma: `/projects` e `/pt-br/projetos`. Os endereços não têm barra no fim.

Uma página nova precisa de um arquivo em `src/pages/` e outro em `src/pages/pt-br/`. O `lang` sai sozinho, pelo lugar do arquivo. Uma página fixa nova também entra em `src/lib/pages.ts`, com o endereço de cada idioma: é dali que o botão de idioma tira o equivalente. Numa história do projeto, o botão leva à mesma história no outro idioma, e o menu marca Projetos. Fora das páginas fixas, das histórias e dos textos, o botão leva ao Início do outro idioma.

Cada versão de um texto tem um endereço só, sob o prefixo do seu idioma e com o `slug` do seu arquivo: `/writing/<slug>` ou `/pt-br/textos/<slug>`. Um texto sem tradução não ganha página no outro idioma: a lista de lá mostra o original, com a marca de idioma, e leva ao endereço dele. Na página de um texto, o menu marca Textos e o botão de idioma leva à outra versão; sem tradução, leva à lista de textos do outro idioma. Como o `slug` muda de um idioma para o outro, o endereço não diz qual é o equivalente: a página do texto (`src/views/Text.astro`) é que o entrega ao layout, com `textEquivalentOf`, de `src/lib/pages.ts`.

O "não encontrado" tem uma página por idioma: `404.html` na raiz e `pt-br/404.html`. Quem escolhe qual mostrar é a hospedagem. Na Cloudflare, isso pede a opção que procura o `404.html` mais próximo do endereço pedido (`not_found_handling = "404-page"`), que entra com a configuração da prévia. Rodando com `npm run dev`, a página em português já aparece para endereços sob `/pt-br`.

## Não indexar até o lançamento

Até o lançamento, nada do site pode ser indexado. A construção faz duas coisas:

- toda página sai com `<meta name="robots" content="noindex">`;
- a pasta `dist/` ganha um arquivo `_headers`, que a Cloudflare lê para mandar o cabeçalho `X-Robots-Tag: noindex` em todos os arquivos, inclusive nos feeds.

Quem manda nas duas é uma chave só, em `src/lib/config.ts`:

```ts
export const INDEXABLE: boolean = false;
```

No dia do lançamento, troque para `true`. Os dois testes de não indexar, em `tests/site.test.ts`, passam a falhar e saem junto. O "não encontrado" continua marcado para não ser indexado depois do lançamento. O que mais muda nesse dia está em "Descoberta", abaixo.

## Descoberta

É o que o site diz de si para os leitores de feed, os buscadores e as redes sociais (seção 9 da spec). Nada disso manda JavaScript ao navegador.

### Os feeds

Há um feed por idioma: `/rss.xml` e `/pt-br/rss.xml`, no formato RSS 2.0. Quem monta os dois é `src/lib/feed.ts`, com os textos de `content()`:

- Cada feed traz todos os textos uma única vez, artigos e notas de estudo juntos, do mais recente ao mais antigo. O texto entra na versão do idioma do feed quando ela existe, e no original quando não existe. Rascunho não entra.
- Cada item tem o título, o endereço da versão mostrada, a data de publicação, o tipo de texto (`<category>`, com o nome do tipo no idioma do feed), o resumo de uma linha (`<description>`) e o texto inteiro (`<content:encoded>`), com os endereços escritos por extenso e as imagens da pasta do texto. Uma tradução leva a nota de tradução no começo do texto.
- O identificador do item (`<guid>`) é o endereço do original, nos dois feeds. Por isso uma tradução criada depois não cria item novo: o item continua o mesmo e passa a mostrar a tradução no feed do idioma dela. Pelo mesmo motivo, não mude o `slug` do original de um texto já publicado: o endereço antigo deixa de responder, e os leitores de feed veem um item novo.
- Uma revisão de conteúdo (`updatedOn`) não muda o identificador nem a data de publicação: o item ganha `<atom:updated>` com a data da revisão, e o texto novo. O leitor de feed atualiza o item que já tem; nem todo leitor avisa de novo.
- A data do feed (`<lastBuildDate>`) é a da última publicação ou revisão, e não a do dia da construção: o mesmo conteúdo gera o mesmo feed.
- O nome do feed é "Shaihan Buenos · " mais o nome da página de textos (`writing.name`), e a descrição é a da página de textos (`writing.description`), dos arquivos de `src/content/pages/`.

O corpo de cada texto é mostrado pela API de contêiner do Astro (`experimental_AstroContainer`), que entrega o mesmo HTML da página do texto. Ela ainda é experimental no Astro 7: ao atualizar o Astro, confira se o nome mudou.

O layout anuncia o feed do idioma da página no `<head>` de toda página, e só esse.

Para validar um feed, construa o site e mande o arquivo ao [validador de feeds do W3C](https://validator.w3.org/feed/):

```sh
npm run build
curl -s https://validator.w3.org/feed/check.cgi --data-urlencode "rawdata@dist/rss.xml" --data-urlencode "manual=1" --data-urlencode "output=soap12"
```

A resposta traz `<m:validity>true</m:validity>` quando o feed segue o formato. O aviso "Self reference doesn't match document location" é esperado enquanto o feed é colado, e não buscado no endereço dele; depois do lançamento, valide pelo endereço. Os testes conferem a estrutura a cada `npm test`, mas não substituem o validador.

### O título, a descrição e os endereços de cada página

Tudo sai do layout (`src/layouts/Base.astro`), com o que cada página entrega a ele:

| O que | De onde sai |
|---|---|
| Título da aba | "Página · Shaihan Buenos", com o `title` que a página dá ao layout: o nome da página fixa, o título do texto ou o nome do projeto. O Início usa o nome e o rótulo (`home.label`). |
| Descrição | A `description` que a página dá ao layout. Numa página fixa, a descrição da página (`<página>.description`, em `src/content/pages/`). Numa história do projeto, o campo `description` do arquivo da história. Num texto, o resumo de uma linha (`summary`). No "não encontrado", `notFound.description`. O layout não constrói uma página sem descrição. |
| Endereço canônico | O endereço da página em `https://shaihanbuenos.dev` (o `site` de `astro.config.ts`), absoluto e sem barra no fim. O "não encontrado" não tem. |
| hreflang | Só entre páginas que têm equivalente: as páginas fixas, as histórias do projeto e os textos com tradução. Cada uma aponta para si, para a outra e para o `x-default`, que é a versão em inglês. Um texto sem tradução e o "não encontrado" não têm. |

O equivalente de uma página fixa e de uma história do projeto sai do endereço (`samePageIn`, em `src/lib/pages.ts`). O de um texto não sai, porque o `slug` muda de um idioma para o outro: a página do texto entrega ao layout o endereço da outra versão (`translation`), ou diz que não há.

As descrições seguem a seção 11 da spec: sem número, sem contagem e sem promessa de ritmo.

### As imagens de compartilhamento

A construção gera as imagens, em PNG de 1200 por 630, sem serviço externo:

| Página | Imagem | O que mostra |
|---|---|---|
| Texto | Uma por versão: `/share/writing/<slug>.png` e `/share/pt-br/textos/<slug>.png`. | O título, o tipo de texto e `shaihanbuenos.dev`. |
| História do projeto | Uma por idioma: `/share/projects/<projeto>.png` e `/share/pt-br/projetos/<projeto>.png`. | O nome, a marca do projeto e `shaihanbuenos.dev`. |
| Páginas fixas e "não encontrado" | Uma por idioma: `/share/default.png` e `/share/pt-br/default.png`. | O nome, o rótulo e `shaihanbuenos.dev`. |

`src/lib/share-image.ts` diz quais imagens existem, o endereço e o texto alternativo de cada uma; o texto alternativo é o que está escrito na imagem. `src/lib/share-image-drawing.ts` desenha: monta um SVG com as medidas e as cores do `DESIGN.md` e o transforma em PNG. As letras entram no SVG como contornos tirados dos arquivos de `public/fonts/`, os mesmos que o site serve, então a imagem sai igual em qualquer máquina, sem depender das fontes instaladas. Um título comprido diminui até o menor tamanho do título de um texto e, se ainda não couber, é cortado com reticências. Um caractere que nenhum dos arquivos de fonte tem, como um emoji, fica de fora da imagem.

Duas dependências fazem o desenho, as duas só na construção:

- [`fontkit`](https://github.com/foliojs/fontkit) lê os arquivos `.woff2`, aplica o peso da fonte variável e o kerning, e entrega o contorno de cada letra.
- [`sharp`](https://sharp.pixelplumbing.com) transforma o SVG em PNG. O Astro já o instala.

Cada página aponta para a sua imagem em `og:image` e em `twitter:image`, com a largura, a altura e o texto alternativo.

Para ver uma imagem, construa o site e abra o arquivo, ou rode o site e abra o endereço:

```sh
npm run build
open dist/share/default.png   # ou dist/share/writing/<slug>.png

npm run dev                   # http://localhost:4321/share/pt-br/default.png
```

Para mudar o desenho, edite `share-image-drawing.ts`: as medidas estão em pixels de CSS, numa página de 600 por 315, e o PNG tem dois pixels para cada um. A marca de um projeto pode usar `currentColor` e as cores do site (`var(--copper)`, `var(--sapphire)`); uma cor que o site não tem para a construção.

### O mapa do site, os dados estruturados e os robôs

- **Mapa do site:** `/sitemap.xml`, montado em `src/pages/sitemap.xml.ts` com as páginas fixas de `src/lib/pages.ts` e os projetos e os textos de `content()`. Lista todas as páginas dos dois idiomas pelo endereço canônico, menos o "não encontrado". Um texto e uma história do projeto levam a data da última mudança. Um teste confere que a lista é igual à das páginas construídas: uma página nova que não entrar no mapa faz o teste falhar.
- **Dados estruturados:** em JSON-LD, montados em `src/lib/structured-data.ts` e postos no `<head>` por `StructuredData.astro`. O Início tem os de pessoa (`Person`): o nome, o rótulo, a frase de apresentação e os canais do contato. Cada texto tem os de artigo (`Article`): o título, o resumo de uma linha, as datas, o tipo de texto, os temas, o idioma e a imagem de compartilhamento.
- **Robôs:** `/robots.txt` libera todos os robôs, inclusive os de IA, e aponta para o mapa do site. O site não tem `llms.txt`. Até o lançamento, quem segura a indexação é a marca de não indexar, e não o `robots.txt`: o robô precisa poder ler a página para ver a marca.

O bloco de JSON-LD é uma lista de um item só (`[{...}]`). Os testes do movimento rodam todos os `<script>` do Início como JavaScript e somam o tamanho deles no teto de 6 kB; a lista é JSON-LD válido e também é lida sem erro nesses testes. Os dados de pessoa ocupam cerca de 0,6 kB desse teto, embora o navegador não os rode.

### O que muda no dia do lançamento

1. Troque `INDEXABLE` para `true` em `src/lib/config.ts` e tire os dois testes de não indexar de `tests/site.test.ts`. O teste "on launch day", em `tests/discovery.test.ts`, já confere uma cópia do site com a chave ligada.
2. Com o domínio apontando para o site, valide os dois feeds pelo endereço, no validador do W3C.
3. Cole o endereço de uma página de cada tipo num depurador de cartões (o do LinkedIn, por exemplo) e confira a imagem de compartilhamento. Até o lançamento, o `og:image` aponta para `https://shaihanbuenos.dev`, que ainda não responde: na prévia, a imagem só abre pelo endereço da própria prévia.
4. Envie `https://shaihanbuenos.dev/sitemap.xml` ao Google Search Console e ao Bing Webmaster Tools.

O Cloudflare Web Analytics também entra nesse dia, e é da issue do lançamento.

## Movimento

O movimento "Traçado" está descrito em `DESIGN.md`, na seção Motion. Ele é feito de CSS e de um arquivo de JavaScript, sem biblioteca.

| Parte | Onde existe | Onde fica |
|---|---|---|
| A troca de página: a página esmaece, e o bloco do projeto tocado no Início vira o painel da marca na história do projeto. | Em todas as páginas. | `src/styles/page-change.css`, importado pelo layout. Não usa JavaScript. |
| A abertura (as trilhas, os blocos e o nome letra a letra) e os pulsos. | Só no Início. | `src/styles/motion-opening.css`, importado por `Home.astro`, e `src/scripts/motion.ts`. |
| A barra de progresso e a revelação das seções. | No Início, em Projetos e na história do projeto. | `src/styles/motion-scroll.css` e `src/scripts/motion.ts`, os dois por `Motion.astro`. |

As páginas de leitura recebem só a troca de página.

**A troca de página** é a do próprio navegador (`@view-transition`, a API de View Transitions entre documentos), e não a do Astro (`<ClientRouter />`): a do navegador não pede JavaScript, e a do Astro mandaria 16,6 kB de JavaScript a todas as páginas, quase três vezes o teto do movimento. Num navegador sem essa API, a página troca sem animação. O bloco de projeto do Início e o painel da marca da história levam o mesmo `view-transition-name`, que sai de `pageChangeNameOf`, em `src/lib/pages.ts`: é o que faz um virar o outro.

**Ligar numa página.** Uma página com a planta ou com seções ganha o movimento com uma linha, dentro do layout:

```astro
<Base title={title}>
  <Motion slot="head" />
  ...
</Base>
```

`Motion.astro` põe no `<head>` a chave do movimento e o `motion.ts`. A chave é uma classe, `motion`, posta no `<html>` antes de a página aparecer. Toda regra do movimento em `motion-opening.css` e em `motion-scroll.css` começa por `.motion` e fica dentro de `@media screen and (prefers-reduced-motion: no-preference)`. O `motion.ts` só começa se a classe estiver lá.

**Desligado.** O movimento fica desligado, e a página aparece pronta, em três casos:

- com o movimento reduzido ligado no sistema: a chave não põe a classe, o `motion.ts` não começa nada, e nenhuma regra de animação vale, nem a da troca de página;
- com o JavaScript desligado: a classe nunca existe, então nada fica escondido à espera de uma animação. A troca de página continua, porque é só CSS;
- no papel: as regras valem só na tela.

Para ver o site parado, ligue "reduzir movimento" no sistema ou, no Chrome, em DevTools › Rendering › "Emulate CSS media feature prefers-reduced-motion".

**Regras para mexer.** Os testes barram o que quebra as regras do `DESIGN.md`:

- só `transform`, `clip-path`, `opacity` e `stroke-dashoffset` entram em `@keyframes` e em `transition`;
- toda animação fica dentro da consulta `prefers-reduced-motion: no-preference`;
- toda regra que esconde um elemento (`opacity: 0` ou um recorte de 100%) ou que anima começa por `.motion`;
- as regras da abertura (`.traces`, `.letter`, o traço das trilhas) só chegam ao Início, e as páginas de leitura não recebem nada além da troca de página;
- nenhuma biblioteca de movimento ou de 3D entra em `package.json`.

Um `@keyframes` cujo elemento fica transparente até a animação precisa do fim escrito (`to { opacity: 1; }`): sem ele, a animação termina no valor de espera e o elemento não aparece.

**Medir o JavaScript.** O teto é de 6 kB, sem compressão, somando todo o JavaScript que a página manda. O teste mede a cada `npm test`. Para ver o número, construa o site e some os scripts do Início:

```sh
npm run build
node -e 'const html = require("fs").readFileSync("dist/index.html", "utf8"); console.log([...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].reduce((sum, [, code]) => sum + Buffer.byteLength(code), 0), "bytes")'
```

Hoje são 3.510 bytes no Início em inglês: 2.735 do `motion.ts`, 124 da chave, 101 do menu e 550 dos dados estruturados, que entram na conta embora sejam dados, e não JavaScript (ver "Descoberta"). O Astro escreve um script com menos de 4 kB dentro da própria página, e não num arquivo à parte; se o `motion.ts` passar disso, ele vira um arquivo em `dist/_astro/`, e a conta acima deixa de vê-lo (o teste continua vendo).

Os tempos e as curvas estão no CSS, com os valores do `DESIGN.md`; o caminho e o atraso de cada trilha ficam em `motion.ts`. O ajuste fino é feito por Shaihan, com o site rodando num celular.

## Conteúdo

Tudo o que o site diz fica em `src/content/`. Trocar uma frase, um estado ou uma conquista é mudar um arquivo dali; acrescentar ou tirar um item é criar ou apagar um arquivo. O que não é frase (datas, status, ordem, ligações, temas) é escrito uma vez só e vale para os dois idiomas.

| Pasta | O que guarda | Formato |
|---|---|---|
| `pages/` | As frases das páginas fixas: nomes do menu, descrições das páginas, rótulo, frase de apresentação, as frases do Início (blocos da planta, chamada do paper, links das seções), os nomes dos estados do projeto, dos tipos de texto e dos temas, as frases da página de um texto (a nota de tradução, "atualizado em", "estudo de origem"), as frases da lista de estudos ("conferida em", os títulos dos grupos, os nomes dos status do estudo, "desde" e os rótulos das ligações), as frases da página Pesquisa (os rótulos dos campos, o link do DOI, "disponível a pedido" e a legenda do diagrama), as frases da página Sobre (bio, texto alternativo do avatar, "hoje", formação e o título do contato) a descrição do "não encontrado" e as frases do layout comum. | `en.yaml` e `pt-br.yaml`, com as mesmas chaves. |
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

O título e o resumo de uma linha também vão para o feed, para o `<head>` da página e para a imagem de compartilhamento do texto (ver "Descoberta").

A página do texto mostra o título, o resumo de uma linha, o tipo de texto, a data, a data de atualização quando houver, os temas, o corpo e, no fim, o estudo de origem, com link para ele na lista de estudos. O corpo é o Markdown do arquivo, sem mudança. Um bloco de código aparece sobre o cinza do site, sem cores por linguagem.

**Tradução.** Crie o arquivo do outro idioma na mesma pasta, com `title`, `summary` e `slug` no idioma dele, e mais o campo `translatedWithAI: true` (ou `false`), que toda tradução tem. Nada muda em `text.yaml`. Um texto sem tradução é só um texto sem esse segundo arquivo. A página da tradução mostra a nota de tradução: o idioma original, o link para o original e, com `translatedWithAI: true`, o aviso de que foi feita com IA.

**Rascunho.** Com `draft: true`, o texto aparece só no site rodando localmente (`npm run dev`) e fica fora de toda construção (`npm run build`). Para publicar, apague a linha. O repo é público: o rascunho não aparece no site, mas o arquivo aparece no GitHub.

**Tema novo.** A lista de temas é fixa: um tema novo entra em `TOPICS`, em `src/lib/schemas.ts`, e ganha o nome nos dois idiomas, em `writing.topics`, nos dois arquivos de `src/content/pages/`.

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
- Cada decisão tem o problema, a escolha e o que foi descartado. Um parágrafo que começa com uma frase em negrito (`**O problema.** ...`) vira um item da decisão: a frase em negrito é a legenda e o resto é a resposta. Uma decisão tem pelo menos esses três itens.
- O primeiro parágrafo de "Como foi construído" aparece em destaque.
- Nenhum link sai do site: uma história do projeto não tem link para repo nem para demo. Links para páginas do site (`/research`) podem.
- O corpo é só Markdown, sem tags de HTML: é o que deixa a construção conferir os links.

Quem dá essa estrutura ao corpo é `src/lib/project-story.ts`. O Astro guarda o Markdown já processado entre uma construção e outra: depois de mudar esse arquivo, rode `npx astro build --force` (ou `npm test`, que já faz isso), ou a página continua com a estrutura antiga. Mudar um arquivo de conteúdo não pede nada disso.

**Imagens.** As capturas e o diagrama de um projeto ficam na pasta dele, ao lado dos arquivos da história, e entram no corpo pelo Markdown:

```md
![O que a imagem mostra, para quem não a vê](./diagrama.svg "A legenda, que aparece abaixo da imagem.")
```

A imagem fica sozinha no parágrafo e aparece com a moldura de um fio; a legenda, entre aspas, é opcional. Cada imagem é um arquivo só, que encolhe até a largura da tela: um diagrama largo precisa continuar legível em 390 px. Um arquivo de imagem serve aos dois idiomas, com o texto alternativo e a legenda escritos em cada um. Use SVG para diagramas e PNG para capturas, com no máximo a largura da coluna em dobro (cerca de 1600 px). Hoje nenhum projeto de exemplo tem imagem.

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

A lista de estudos (`/studies` e `/pt-br/estudos`) mostra primeiro os estudos em andamento e depois os concluídos, agrupados pelo ano de `end`, do mais recente ao mais antigo. Um grupo sem estudos não aparece. Cada estudo mostra o nome, o objetivo, o status do estudo com os meses e as ligações que tiver:

| Ligação | O que aparece | Para onde leva |
|---|---|---|
| `texts` e os textos que têm o estudo em `study` | O item da lista de textos, na versão do idioma da página ou no original, com a marca de idioma. Rascunhos ficam de fora. | O endereço dessa versão. |
| `project` | O nome do projeto. | A história do projeto. |
| `certificate` | O site do endereço, como `exemplo.com`. | O endereço do campo. É o único link que sai do site. |
| `education` | A linha da formação, de `about.education`. | A formação, na página Sobre (`/about#education`). |
| `research` | O título de cada item de pesquisa. | O item, na página Pesquisa. |

Um estudo sem ligações mostra só o nome, o objetivo e o status. A página não tem porcentagem nem contagens. O nome do arquivo é o `id` do estudo na página: a página de um texto leva ao estudo de origem por `/studies#<nome-do-estudo>`.

Um estudo que parou sai da lista: apague o arquivo. Ao terminar uma conferência, mude `checkedOn` em `src/content/lists/studies.yaml`.

### Criar um item de pesquisa

Crie `src/content/research/<nome-do-item>.yaml`. O paper:

```yaml
type: paper
order: 1
title: The Title, in the Original English
venue: Onde saiu, como "HAXD 2026, IEEE"
authors: # como constam na publicação, sem e-mails
  - name: Nome do Autor
    highlight: true # só no nome de Shaihan
  - name: Outro Autor
doi: 10.1109/EXEMPLO.2026.0000000 # só o DOI, sem https://doi.org/
summary:
  en: Two or three sentences.
  pt-br: Duas ou três frases.
built:
  en: What Shaihan built.
  pt-br: O que Shaihan construiu.
result:
  en: The result, with the caveat right next to the number.
  pt-br: O resultado, com a ressalva colada ao número.
```

O TCC tem `type: thesis` e os mesmos `order`, `summary`, `built` e `result`. No lugar de `venue`, `authors` e `doi`, ele tem:

```yaml
title: O título, em português
translatedTitle: The title, translated
whatItIs:
  en: What it is, with the advisor named.
  pt-br: O que é, com o orientador citado.
```

A página Pesquisa (`/research` e `/pt-br/pesquisa`) mostra os itens na ordem de `order`. Cada item mostra o título e os campos; os rótulos dos campos vêm de `research`, nos arquivos de `src/content/pages/`.

- **Paper:** o título fica em inglês nos dois idiomas. Depois vêm o lugar da publicação, os autores, o resumo, o que foi construído, o resultado, o link "Ler no IEEE Xplore", que leva a `https://doi.org/<doi>`, e o lugar do diagrama. O link é o único link da página que sai do site.
- **TCC:** o título fica em português, com a tradução entre parênteses na página em inglês. Depois vêm o que é, o resumo, o que foi construído, o resultado e "disponível a pedido", que leva ao contato, na página Sobre (`/about#contact`). Não tem imagem.

O diagrama do paper ainda não foi desenhado: a página guarda o lugar dele, com a legenda de `research.diagramCaption`. A página não tem PDF nem figura copiada dos trabalhos. Os números de cada trabalho ficam só no arquivo dele, e a regra de saúde da seção 11 da spec vale para cada frase: pacientes sempre "simulados", e número só junto da ressalva.

O nome do arquivo é o `id` do item na página: a lista de estudos e o Início levam a ele por `/research#<nome-do-item>`.

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

A página Sobre (`/about` e `/pt-br/sobre`) mostra a experiência numa linha do tempo, por empresa:

- Cargos com o mesmo valor em `company` ficam juntos, sob um nome só. O nome tem de ser escrito igual nos arquivos.
- As empresas vão da mais recente à mais antiga, pelo cargo mais recente de cada uma, e os cargos de uma empresa também, pelo mês `start`.
- A empresa mostra o nome e o período total: do `start` do cargo mais antigo ao `end` do mais novo. Não tem logotipo.
- Cada cargo mostra o título, o período, a linha de contexto e as conquistas, na ordem do arquivo. O título fica em inglês nos dois idiomas.
- Um cargo sem `end` é o atual: o período dele, e o da empresa, terminam em "hoje" ("Present" em inglês), de `about.present`. No Início, o bloco de experiência termina em "hoje" (`home.today`) pelo mesmo motivo.
- Os meses saem no formato de cada idioma: "Mar 2024" e "mar. de 2024".

Para tirar um cargo, apague o arquivo. O conteúdo de verdade segue a regra de confidencialidade da seção 11 da spec: o que Shaihan fez como engenheiro, sem nome de produto, cliente ou sistema interno, e número só em percentual.

### A página Sobre

A página mostra, nesta ordem: a bio ao lado do avatar, a experiência, a formação e o contato. A bio e a linha da formação vêm de `about.bio` e `about.education`, nos dois arquivos de `src/content/pages/`. Os títulos das seções também vêm dali: o da experiência é `home.blocks.experienceCaption`, o mesmo do bloco do Início; o da formação é `studies.links.education`, o mesmo da ligação da lista de estudos; o do contato é `about.contact`.

O contato mostra os canais de `src/lib/contact.ts`, os mesmos do rodapé: são os únicos links da página que saem do site. A página não tem tabela de skills, telefone, e-mail pessoal nem PDF.

As seções da formação e do contato têm `id`: a lista de estudos leva a `/about#education`, e "disponível a pedido", na página Pesquisa, leva a `/about#contact`. Quem monta esses endereços é `aboutSectionPathOf`, em `src/lib/pages.ts`.

### O avatar

O avatar é pixel art de 48 por 48 pixels, guardado ampliado seis vezes em `src/assets/avatar.png` (288 por 288). O atual é provisório: o desenho final é da issue de conteúdo final. A página o importa (`import avatar from "../assets/avatar.png"`), e a construção copia o arquivo, sem mexer nele, para um endereço com o resumo do conteúdo no nome; a largura e a altura do HTML saem do próprio arquivo. O CSS o mostra em múltiplos inteiros de 48 (96 px no celular, 144 px a partir de 561 px), com `image-rendering: pixelated`.

Quem desenha o arquivo é `tools/avatar.py`, que precisa do [Pillow](https://python-pillow.org):

```sh
python tools/avatar.py src/assets/avatar.png
```

Para mudar o desenho, edite as formas do script e rode de novo. O texto alternativo é `about.avatarAlt`.

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
| Estudos | O mês `start`: o mais recente vem primeiro. A lista de estudos separa os em andamento dos concluídos e agrupa os concluídos pelo ano de `end`, do mais recente ao mais antigo. |

### O que barra a construção

A conferência do conteúdo roda em toda construção (`npm run build`, e portanto `scripts/check`). Se ela falhar, nada é publicado e o site fica como estava. O erro diz o arquivo e o problema, em inglês. Ela para quando:

- falta um campo obrigatório, ou um campo tem um valor fora do formato;
- um texto tem um tema fora da lista, nenhum tema ou mais de três;
- uma ligação aponta para um estudo, texto, projeto ou item de pesquisa que não existe;
- uma página fixa, um projeto ou um estudo existe num idioma e falta no outro. Para os textos essa regra não vale: a tradução é opcional;
- um texto não tem a versão no idioma original, ou uma tradução não diz se foi feita com IA;
- dois textos têm o mesmo `slug` no mesmo idioma;
- um projeto não tem a marca do projeto, `mark.svg`, na pasta;
- o corpo de uma história do projeto não tem as duas partes, tem menos de duas ou mais de quatro decisões, tem uma decisão sem os três itens, tem "Como foi construído" vazio, tem texto antes da primeira parte, tem um link que sai do site, uma imagem de fora da pasta do projeto ou uma tag de HTML.

### Ler o conteúdo numa página

As páginas não leem as coleções direto. Elas pedem o conteúdo a `src/lib/content.ts`:

```ts
import { content } from "../lib/content.ts";

const { texts, projects, studies, roles, research } = await content();
```

É ali que as versões de cada idioma são reunidas, que as listas são ordenadas, que as ligações são conferidas e que os rascunhos saem da construção publicada. Uma página que lesse a coleção direto mostraria os rascunhos.
