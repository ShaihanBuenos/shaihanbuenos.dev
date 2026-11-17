---
name: Planta de Silício
description: Site em forma de planta de chip, em folha clara, com a paleta "Cobre e safira".
colors:
  ground: "#f3f2ef"
  sheet: "#fbfaf8"
  ink: "#14161b"
  mut: "#4b4f58"
  line: "rgba(20, 22, 27, .16)"
  grid: "rgba(20, 22, 27, .06)"
  copper: "#d65c24"
  copper-text: "#9c3d12"
  sapphire: "#183ec9"
  l-copper: "rgba(214, 92, 36, .34)"
  l-copper-2: "rgba(214, 92, 36, .22)"
  l-sapphire: "rgba(24, 62, 201, .26)"
  l-grey: "rgba(20, 22, 27, .10)"
  f-copper: "#eec4b0"
  f-sapphire: "#c0c9ec"
  f-grey: "#e4e3e1"
  h-copper: "rgba(214, 92, 36, .62)"
  h-sapphire: "rgba(24, 62, 201, .48)"
  h-grey: "rgba(20, 22, 27, .26)"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "clamp(3.4rem, min(10.4cqw, 14.2svh), 8.75rem)"
    fontWeight: 200
    lineHeight: 0.86
    letterSpacing: "-.04em"
  headline:
    fontFamily: "Bricolage Grotesque, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "clamp(2rem, 4.4cqw, 3.6rem)"
    fontWeight: 300
    lineHeight: 1.02
    letterSpacing: "-.03em"
  title:
    fontFamily: "Bricolage Grotesque, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "clamp(1.5rem, 2.9cqw, 2.3rem)"
    fontWeight: 300
    lineHeight: 1.1
    letterSpacing: "-.03em"
  lead:
    fontFamily: "Bricolage Grotesque, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "clamp(1.3rem, 2.3cqw, 1.9rem)"
    fontWeight: 300
    lineHeight: 1.3
    letterSpacing: "-.02em"
  block-title:
    fontFamily: "Bricolage Grotesque, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "clamp(1.3rem, 2.7cqw, 2.3rem)"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-.02em"
  body:
    fontFamily: "Hanken Grotesk, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
  prose:
    fontFamily: "Hanken Grotesk, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.68
  label:
    fontFamily: "Martian Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: ".72rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: ".02em"
rounded:
  none: "0px"
spacing:
  gutter: "clamp(16px, 3.2vw, 46px)"
  u: "calc(100cqw / 26)"
  sec-inline: "3.846cqw"
  sec-block: "clamp(40px, 7cqw, 104px)"
  sec-gap: "clamp(20px, 4cqw, 64px)"
  mobile-inline: "16px"
components:
  contato:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "6px 12px"
  contato-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet}"
  nucleo:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
  bloco-cobre:
    backgroundColor: "{colors.l-copper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "clamp(10px, 1.15cqw, 18px)"
  bloco-cobre-foco:
    backgroundColor: "{colors.h-copper}"
  bloco-safira:
    backgroundColor: "{colors.l-sapphire}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "clamp(10px, 1.15cqw, 18px)"
  bloco-safira-foco:
    backgroundColor: "{colors.h-sapphire}"
  bloco-cinza:
    backgroundColor: "{colors.l-grey}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "clamp(10px, 1.15cqw, 18px)"
  bloco-cinza-foco:
    backgroundColor: "{colors.h-grey}"
  bloco-projeto:
    backgroundColor: "{colors.l-copper-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
  secao-cobre:
    backgroundColor: "{colors.f-copper}"
    textColor: "{colors.ink}"
  secao-safira:
    backgroundColor: "{colors.f-sapphire}"
    textColor: "{colors.ink}"
  secao-cinza:
    backgroundColor: "{colors.f-grey}"
    textColor: "{colors.ink}"
  linha-projeto:
    textColor: "{colors.ink}"
    padding: "clamp(14px, 2cqw, 26px) clamp(10px, 1.4cqw, 18px)"
  linha-projeto-hover:
    backgroundColor: "{colors.f-copper}"
---

# Design System: Planta de Silício

## Overview

**Creative North Star: "Planta de Silício"**

O site é a planta de um chip desenhada numa folha clara. Uma moldura de um fio cerca a página inteira. O menu são os contatos presos na borda de cima da moldura. Dentro dela, uma grade de módulo fixo organiza blocos retangulares chapados e translúcidos, em cobre, safira e cinza, que escurecem onde se cruzam. O nome fica no núcleo, em grotesca leve e muito grande. As legendas são miúdas, em monoespaçado e caixa alta, como os designadores de uma folha de dados.

O sistema é plano e seco. Não há cantos arredondados, sombra nem degradê. A profundidade vem só da sobreposição das cores. O movimento segue o sistema "Traçado", descrito em **Motion**: a planta é roteada na abertura e fica viva depois, sem deixar de ser plana. As páginas de leitura mantêm a moldura e a paleta, mas largam a planta e a grade: ali o texto manda, com estilo contido.

O tema é só claro. Uma variante escura, "Noturno", foi mostrada e não foi decidida; não a implemente sem decisão. A página inicial e a página de história de projeto passaram pela revisão final. As páginas de leitura ainda não foram revisadas, então as regras delas são provisórias.

**Key Characteristics:**
- Uma moldura de um fio (1.5px) por página, com os contatos do menu sobre a borda de cima e uma fileira de dentes embaixo.
- Grade de 26 módulos que manda em todo o alinhamento.
- Blocos chapados e translúcidos em cobre, safira e cinza, com mistura por multiplicação.
- Nome e títulos em grotesca leve; legendas em monoespaçado miúdo.
- Zero raio, zero sombra, zero degradê.
- Movimento "Traçado": trilhas de um fio, blocos que acendem e pulsos nas trilhas.
- Páginas de leitura em coluna única, sem planta.

## Colors

A paleta "Cobre e safira": uma folha de branco levemente quente, tinta quase preta e dois acentos, um laranja de cobre e um azul de safira. Cada acento existe em três estados: camada translúcida, cor cheia de foco e fundo de seção.

### Primary
- **Cobre** (`copper`): o acento quente. Aparece em área, nunca em letra: na seleção de texto, nos quadradinhos de estado e de tipo de texto, e como base das camadas e dos fundos de cobre.
- **Cobre de texto** (`copper-text`): a versão escura do cobre para marcas pequenas sobre a folha, como os marcadores de lista nas páginas de leitura.
- **Camada de cobre** (`l-copper`, `l-copper-2`): os blocos da planta ligados à pesquisa (mais forte) e aos projetos (mais fraca).
- **Cobre cheio** (`h-copper`): o bloco de cobre em foco ou sob o ponteiro.
- **Fundo de cobre** (`f-copper`): seção inteira em cobre claro, e o fundo de uma linha de projeto sob o ponteiro.

### Secondary
- **Safira** (`sapphire`): o acento frio. É a cor dos links no texto e do contorno de foco do teclado. Também marca o tipo "nota de estudo".
- **Camada de safira** (`l-sapphire`): o bloco da planta ligado ao método.
- **Safira cheia** (`h-sapphire`): o bloco de safira em foco ou sob o ponteiro.
- **Fundo de safira** (`f-sapphire`): seção inteira em azul claro, o painel da marca na história de projeto e a frase em destaque nas páginas de leitura.

### Neutral
- **Chão** (`ground`): o fundo da página, por fora da moldura. Também preenche o núcleo e os contatos do menu.
- **Folha** (`sheet`): o fundo de dentro da moldura.
- **Tinta** (`ink`): texto, fios da moldura, divisórias fortes e dentes.
- **Tinta suave** (`mut`): texto de apoio, como a frase do núcleo, as descrições e as legendas de figura.
- **Fio fino** (`line`): divisórias de 1px entre itens de lista.
- **Grade** (`grid`): as linhas de 1px da grade da planta.
- **Camada cinza** (`l-grey`), **cinza cheio** (`h-grey`), **fundo cinza** (`f-grey`): a experiência. O cinza também é o fundo do código nas páginas de leitura.

### Named Rules
**A Regra do Cobre Mudo.** O cobre não escreve. Texto é tinta, tinta suave ou, em link, safira. O cobre entra como área, quadradinho ou marcador.

**A Regra dos Três Estados.** Cada acento tem uma camada translúcida (`l-`), uma cor cheia (`h-`) e um fundo de seção (`f-`). A camada é para blocos da planta, a cheia é só para foco e ponteiro, o fundo é só para seções e painéis. Não crie um quarto estado.

**A Regra da Tinta sobre Cor.** Dentro de uma seção com fundo colorido, links e notas ficam em tinta, com sublinhado. O azul de link só aparece sobre a folha.

## Typography

**Display Font:** Bricolage Grotesque (com Helvetica Neue, Helvetica, Arial, sans-serif)
**Body Font:** Hanken Grotesk (com Helvetica Neue, Helvetica, Arial, sans-serif)
**Label/Mono Font:** Martian Mono (com ui-monospace, SF Mono, Menlo, monospace)

As três fontes são servidas pelo próprio site, em arquivos variáveis woff2, com `font-display: swap`.

**Character:** Uma grotesca leve e apertada faz o nome e os títulos parecerem gravados na folha. O texto corrido é uma grotesca neutra, fácil de ler. O monoespaçado miúdo é a voz da folha de dados: estados, datas e designadores.

### Hierarchy
- **Display** (200, `clamp(3.4rem, min(10.4cqw, 14.2svh), 8.75rem)`, 0.86, -.04em): o nome no núcleo e o título da história de projeto. Uma vez por página.
- **Headline** (300, `clamp(2rem, 4.4cqw, 3.6rem)`, 1.02, -.03em): o título de cada seção, na coluna da esquerda.
- **Title** (300, `clamp(1.5rem, 2.9cqw, 2.3rem)`, 1.1): nomes de projeto nas linhas e títulos de decisão.
- **Lead** (300, `clamp(1.3rem, 2.3cqw, 1.9rem)`, 1.3, -.02em): a frase de abertura de uma seção, em fonte de display.
- **Block title** (400, de `clamp(1rem, 1.55cqw, 1.3rem)` a `clamp(1.3rem, 2.7cqw, 2.3rem)`, 1.04, -.02em): o texto dentro dos blocos da planta. É o único peso 400 da fonte de display fora das páginas de leitura.
- **Body** (400, 1.0625rem, 1.55): texto corrido. Parágrafos de seção vão até 62ch.
- **Prose** (400, 1.125rem, 1.68): texto corrido das páginas de leitura, em coluna de até 41rem.
- **Label** (400, .72rem, .02em, caixa alta, algarismos tabulares): legendas de estado, data, tipo e designador.

Nas páginas de leitura, o título do texto usa peso 300 em `clamp(2.2rem, 5cqw, 3.4rem)`, os títulos de seção usam peso 400 em 1.7rem, e os subtítulos são a fonte de texto em peso 600 e 1.15rem.

### Named Rules
**A Regra do Peso Leve.** Títulos em fonte de display usam peso 200 ou 300. O tamanho faz a hierarquia, não o negrito. Negrito (500 ou 600) só existe na fonte de texto, para rótulo, item de lista e link de ação.

**A Regra da Legenda Depois.** A legenda em monoespaçado é um dado: estado, data, tipo. Em linhas, listas e cabeçalhos ela vem depois do título que acompanha. Nos blocos da planta ela fica no canto oposto ao título. Não use a legenda como chamada decorativa acima de um título.

**A Regra do Monoespaçado Miúdo.** Martian Mono só aparece pequeno: legendas, rótulos de diagrama e código. Nunca em título nem em texto corrido.

## Layout

A página tem uma margem lateral (`gutter`) e uma única moldura, que é um contêiner de consulta: quase todas as medidas internas usam `cqw`, a largura da moldura. O módulo `u` é 1/26 dessa largura. O recuo lateral das seções é um módulo (3.846cqw), então tudo se alinha com a grade.

**A planta (primeira tela da página inicial).** Uma grade de 26 colunas de um módulo por 16 linhas. A altura da linha é o menor valor entre o módulo e 1/16 da altura da tela menos 62px, com piso de 42px, para a planta caber na primeira tela. As linhas da grade aparecem ao fundo, em 1px. Cada bloco ocupa um retângulo de células inteiras. Os blocos se sobrepõem de propósito: o núcleo, a safira e o cobre se cruzam. Uma fileira de dentes fecha a planta.

**Seções.** Depois da planta, cada seção é uma faixa de largura total com um fio de 1.5px em cima e duas colunas, 5fr para o título e 8fr para o corpo. Seções com fundo colorido se alternam com seções sobre a folha. O respiro vertical é `clamp(40px, 7cqw, 104px)`.

**Leitura.** As páginas de leitura têm uma coluna só, centrada, com até 41rem. Não têm planta, grade ao fundo nem blocos coloridos de área. A lista de textos usa uma coluna estreita de 6.5rem para a data e o resto para o título.

**Responsivo.**
- Até 1000px, a planta do celular: uma grade própria de 10 colunas por 22 linhas que cabe na primeira tela. O núcleo ocupa o topo; pesquisa, método e experiência se cruzam abaixo dele; os três projetos fecham a planta numa fileira. As células de saída somem, porque o menu já leva a Textos e Estudos. Os contatos do menu viram uma faixa que rola na horizontal.
- Até 800px, as seções e o topo da história de projeto passam para uma coluna, com recuo lateral de 16px.
- Até 700px, o diagrama largo dá lugar a uma versão em pé do mesmo diagrama.
- Até 560px, listas de definição, linha do tempo e lista de textos passam para uma coluna.

### Named Rules
**A Regra do Módulo.** Posição e tamanho dentro da moldura saem do módulo de 1/26 ou de `cqw`. Um bloco da planta ocupa células inteiras da grade.

**A Regra do Celular Primeiro.** Cada página e cada peça é desenhada primeiro na largura do celular (390px) e depois ampliada para telas maiores. O CSS parte do celular e acrescenta as telas maiores com `min-width`. Nada depende de passar o mouse, e todo alvo de toque tem pelo menos 44px. A lista em **Responsivo** descreve o protótipo atual, feito do computador para baixo; a construção inverte essa ordem.

**A Regra da Moldura Única.** Cada página tem uma moldura só, com os contatos em cima e os dentes embaixo. Nada de moldura dentro de moldura para agrupar conteúdo; quem separa são os fios e os fundos de seção.

## Elevation & Depth

Não há sombra em nenhum lugar. A profundidade vem da sobreposição: os blocos translúcidos usam `mix-blend-mode: multiply`, então duas camadas cruzadas produzem uma terceira cor mais escura, e a grade aparece através delas. O núcleo é a exceção: é opaco, tem contorno e fica por baixo das camadas que o cruzam.

O único `box-shadow` do sistema é um contorno interno de 1px (`inset 0 0 0 1px`), usado para desenhar o bloco que recuou. Ele é um fio, não uma sombra.

### Named Rules
**A Regra da Folha Plana.** Nada flutua. Sem sombra projetada, sem desfoque, sem degradê de cor. Se algo precisa se destacar, muda de cor ou ganha um fio.

## Motion

O sistema de movimento se chama "Traçado": o chip é roteado diante de quem chega e continua vivo depois. Ele substitui o "pouca animação" da primeira versão deste documento. Os tempos abaixo vêm do protótipo e são ponto de partida; o ajuste fino é feito com o site rodando num celular.

- **Abertura (cerca de 1,8 s, só na página inicial):** trilhas de 1.5px em tinta são desenhadas da moldura até os blocos, em cerca de 0,7 s cada, com um nó quadrado de 7px na chegada. Cada bloco se revela de cima para baixo em cor cheia (`h-`) e assenta na camada (`l-`), em 0,6 s, na ordem pesquisa, método, experiência, projetos. O núcleo entra primeiro, da esquerda para a direita, e o nome surge letra a letra, com 55 ms entre as letras.
- **Pulsos:** depois da abertura, um traço curto de 14px, em cobre ou safira, percorre cada trilha a cada 2,6 s. É o único movimento contínuo do site.
- **Rolagem:** uma barra de cobre de 5px na borda esquerda da moldura cresce com o progresso da página. Cada seção se revela uma vez ao entrar na tela; as seções com fundo colorido preenchem da esquerda para a direita em 0,7 s, e as marcas de projeto se revelam de cima para baixo.
- **Troca de página:** o bloco do projeto tocado vira o painel da marca na história do projeto, em 0,45 s; o resto da página esmaece. As páginas de leitura recebem só o esmaecer.
- **Curva:** `cubic-bezier(.3, .6, .2, 1)` para trilhas e blocos, `cubic-bezier(.2, .7, .1, 1)` para o que entra na tela.

### Named Rules
**A Regra do Movimento Reduzido.** Com `prefers-reduced-motion: reduce`, não há abertura, pulso, revelação nem troca animada: a página aparece pronta. Nenhuma informação depende de animação.

**A Regra do Movimento Leve.** Só `transform`, `clip-path`, `opacity` e o traço das trilhas são animados. Sem biblioteca de movimento nem de 3D; o protótipo usa CSS e cerca de 6 kB de JavaScript, e esse é o teto.

**A Regra da Folha Viva, mas Plana.** O movimento não traz sombra, desfoque, perspectiva nem elasticidade. As trilhas são fios e os pulsos são traços chapados.

## Shapes

Tudo é retângulo de canto vivo (raio 0). A linguagem de forma é feita de fios:

- **Fio de 1.5px em tinta:** a moldura, o núcleo, os contatos, o topo de cada seção, as linhas de projeto e a moldura dos diagramas.
- **Fio de 1px:** divisórias de lista (`line`), a linha do tempo, a grade e o sublinhado dos links, que passa a 2px sob o ponteiro.
- **Fio tracejado:** marca o que ainda não está cheio. As células de saída da planta e os avisos usam 1.5px tracejado; a etiqueta de provisório usa 1px tracejado.
- **Dentes:** uma faixa de 10px de altura com um dente de tinta por módulo, ocupando 34% dele. Fecha a planta e a base da moldura.
- **Quadradinho:** um quadrado cheio de .8em a .9em, em cobre ou safira, antes de uma legenda de estado ou de tipo.

Os degradês lineares que existem no código só desenham a grade e os dentes, com paradas duras. Não há degradê de cor.

### Named Rules
**A Regra do Tracejado.** Linha tracejada significa provisório ou vazio: conteúdo de exemplo, algo a definir, uma célula sem cor. Não use tracejado como enfeite.

## Components

### Contatos (menu e rodapé)
Pequenos retângulos com fio de 1.5px, como os contatos na borda de um chip.
- **Forma:** canto vivo, `padding: 6px 12px`, texto em fonte de texto a .84rem (menu) ou .9rem (rodapé e lista de contato), sem sublinhado.
- **Menu:** os contatos ficam centrados sobre a borda de cima da moldura, com fundo de chão. Acima de 1000px, cada um se alinha a colunas da grade de 26 módulos, e o de idioma fica no fim, no canto superior direito. O contato de idioma mostra "EN" e "PT" lado a lado, com o idioma atual no estado de página atual e o outro como link. No celular ele fica sempre visível no canto superior direito, fora de qualquer menu recolhido, e os contatos do menu cabem numa linha em 390px: mantêm 44px de altura, com texto a .74rem e a largura que o texto pedir ([Descoberta: feed, buscadores e redes sociais](https://github.com/ShaihanBuenos/ShaihanBuenos/issues/15)).
- **Hover e página atual:** fundo de tinta e texto de folha, com troca instantânea.
- **Item sem link:** o mesmo retângulo, sem estado de hover.

### Blocos da planta
O componente de assinatura. Cada bloco é um link que ocupa células inteiras da grade.
- **Forma:** retângulo chapado, sem contorno, `padding: clamp(10px, 1.15cqw, 18px)`, conteúdo distribuído entre o topo e a base.
- **Cor:** camada de cobre para pesquisa, camada fraca de cobre para projetos, camada de safira para método, camada cinza para experiência. Texto sempre em tinta.
- **Conteúdo:** uma legenda em monoespaçado e um título em fonte de display, peso 400.
- **Projetos:** blocos empilhados numa coluna, separados por uma faixa da cor da folha.
- **Células de saída:** sem cor, com fio tracejado de 1.5px e só o título.
- **Foco e ponteiro:** o bloco ativo passa à cor cheia (`h-`); todos os outros perdem a cor e ficam só com um contorno interno de 1px. No toque, o mesmo estado aparece enquanto o dedo está sobre o bloco. O contorno de foco do teclado fica 4px para dentro do bloco.

### Núcleo
O retângulo opaco do nome: fundo de chão, fio de 1.5px, o nome em Display, o rótulo em peso 500 e a frase em tinta suave. Não é link e não recua quando outro bloco ganha foco.

### Seções
- **Estrutura:** fio de 1.5px em cima, título em Headline à esquerda, corpo à direita com espaço de 1.1rem entre os elementos.
- **Fundo:** folha, ou um dos três fundos (`f-copper`, `f-sapphire`, `f-grey`).
- **Abertura:** uma frase em Lead pode abrir o corpo.
- **Link de ação:** texto em peso 500 ou 600 com sublinhado de 1px, que engrossa para 2px sob o ponteiro.

### Linhas de projeto
- **Estrutura:** uma coluna estreita para a marca do projeto (`clamp(56px, 7cqw, 88px)`) e uma coluna com título, descrição e, por último, a legenda de estado. Fio de 1.5px entre as linhas.
- **Hover e foco:** quando a linha é link, o fundo passa a `f-copper` e a descrição passa de tinta suave para tinta.
- **Variante simples:** só título e legenda, lado a lado, sem marca.

### Listas e linha do tempo
- **Lista:** itens separados por fio fino de 1px, com o título em peso 600 e a legenda abaixo dele.
- **Linha do tempo:** nome em fonte de display peso 400 a 1.35rem, período em legenda à direita, descrição na linha de baixo, fio de 1px em tinta entre as entradas.
- **Decisão:** título, depois uma lista de definição com os termos em legenda numa coluna de 8.5rem e as respostas em até 60ch.

### Diagramas e marcas
- **Diagrama:** moldura de 1.5px sobre a folha, retângulos nas mesmas camadas translúcidas da planta, ligações em fio de 1.5px, rótulos em monoespaçado de 11.5px e caixa alta. A legenda da figura fica abaixo, em tinta suave a .9rem.
- **Marcas de projeto:** desenhos vetoriais em tinta, com um detalhe em cobre ou safira, num quadro de 120 por 120.
- **Número medido:** um número grande em fonte de display, peso 300, `clamp(2.2rem, 6cqw, 4.4rem)`, com a explicação ao lado em texto corrido de 1rem.

### Etiqueta de provisório e aviso
- **Etiqueta:** monoespaçado a .69rem, caixa alta, fio tracejado de 1px na cor do texto. Marca um trecho como exemplo, rascunho ou a definir.
- **Aviso:** um parágrafo com fio tracejado de 1.5px e `padding: .8rem 1rem`, para dizer que o conteúdo da página ainda é de exemplo.

### Página de leitura (provisório, ainda sem revisão)
- **Cabeçalho:** título, resumo em tinta suave a 1.2rem e uma linha de legendas com o tipo, a data, a data de atualização quando houver e os temas. Fecha com um fio de 1.5px.
- **Nota de tradução:** só numa tradução, uma frase em tinta a 1rem no fim do cabeçalho, com o link para o original em safira.
- **Tipo de texto:** um quadradinho antes da legenda, em cobre para artigo e em safira para nota de estudo.
- **Status do estudo:** o mesmo quadradinho antes da legenda, em cobre para em andamento e em safira para concluído.
- **Corpo:** coluna com espaço de 1.25rem entre blocos. Listas com marcador quadrado em cobre de texto. Frase em destaque sobre `f-sapphire`, em fonte de display peso 300 a 1.3rem. Código curto e blocos de código sobre `f-grey`, em monoespaçado, com rolagem lateral própria.
- **Fim do texto:** um fio de 1.5px, o estudo de origem (o rótulo em legenda e o nome como link) e o link de ação que volta à lista, em peso 500.
- **Lista de textos:** data em legenda à esquerda, título em fonte de texto peso 600 a 1.25rem, resumo em tinta suave e, por último, a linha de legendas com o tipo, os temas e a marca de idioma. O título sob o ponteiro ganha um sublinhado de 2px em cobre. No celular, a data fica na linha de legendas, depois do tipo; a coluna da data entra a partir de 561px.
- **Lista de estudos:** no cabeçalho, abaixo do título, a legenda "conferida em" com o mês. Depois vêm os grupos, cada um com um título de seção (peso 400 em 1.7rem): primeiro os estudos em andamento, depois cada ano de estudos concluídos. Cada estudo é uma entrada de linha do tempo, com um fio de 1px em tinta em cima: o nome em fonte de display peso 400 a 1.35rem, o objetivo em tinta suave e a linha de legendas com o status e os meses. No celular a linha de legendas vem depois do objetivo; a partir de 561px ela fica à direita do nome.
- **Ligações de um estudo:** uma lista de definição abaixo do estudo, com o termo em legenda (textos, projeto, certificado, formação, pesquisa) e os links em safira a 1rem, cada um com 44px de altura. No celular o termo fica sobre os links; a partir de 561px ele ocupa uma coluna de 8.5rem. Os textos ligados são itens da lista de textos, com o título a 1.06rem e a data sempre na linha de legendas. O certificado mostra o site para onde leva: é o único link que sai do site.

- **Página de pesquisa:** os itens de pesquisa em sequência, na coluna de leitura, com um fio de 1px em tinta entre eles. O paper tem o título como título de seção (peso 400 em 1.7rem), o lugar da publicação em legenda, depois dele, e os autores em tinta suave, com o nome de Shaihan em tinta e peso 600. Os campos são uma lista de definição como a da decisão: o termo em legenda e a resposta em texto corrido. No celular o termo fica sobre a resposta; a partir de 561px ele ocupa uma coluna de 8.5rem. O item fecha com um link de ação em peso 500, com 44px de altura. O TCC vem abaixo e um passo menor: título em peso 400 a 1.35rem, texto a 1rem e sem figura.
- **Lugar do diagrama:** enquanto um diagrama não foi desenhado, o lugar dele é a moldura dos diagramas vazia, na proporção 16:9, com o fio de 1.5px tracejado, e a legenda da figura abaixo, em tinta suave a .9rem. Quando o diagrama entra, o fio volta a ser contínuo.

### Foco e seleção
- **Foco do teclado:** contorno de 2px em safira, afastado 3px.
- **Seleção de texto:** fundo de cobre, texto de folha.
- **Pular para o conteúdo:** link escondido que aparece no topo quando recebe foco.

## Do's and Don'ts

### Do:
- **Faça** cada página dentro de uma única moldura de 1.5px, com os contatos do menu sobre a borda de cima e os dentes embaixo.
- **Faça** o alinhamento sair do módulo de 1/26 da moldura e use `cqw` para medidas internas.
- **Faça** texto em tinta ou tinta suave; links em safira sobre a folha e em tinta sobre fundo colorido.
- **Faça** o estado ativo com cor cheia no bloco ativo e contorno nos demais, também no toque.
- **Faça** todo movimento sumir quando o sistema pede movimento reduzido.
- **Faça** as páginas de leitura em coluna única de até 41rem, com a moldura e a paleta, sem planta e sem grade.
- **Faça** a legenda em monoespaçado carregar um dado (estado, data, tipo) e vir depois do título.
- **Faça** o foco do teclado sempre visível: 2px em safira.
- **Faça** uso das fontes servidas pelo próprio site.

### Don't:
- **Não** use cantos arredondados, sombra projetada nem degradê de cor.
- **Não** acrescente movimento fora do sistema "Traçado", nem biblioteca de movimento ou de 3D.
- **Não** anime o texto das páginas de leitura.
- **Não** escreva texto em cobre. O cobre é área, quadradinho ou marcador.
- **Não** use as cores cheias (`h-`) em repouso, nem as camadas translúcidas (`l-`) como fundo de seção.
- **Não** leve a planta, a grade ou blocos coloridos de área para as páginas de leitura.
- **Não** use linha tracejada como enfeite; ela significa provisório ou vazio.
- **Não** use Martian Mono em título ou em texto corrido.
- **Não** implemente o tema escuro "Noturno" enquanto ele não for decidido.
