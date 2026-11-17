# Portfólio de Shaihan Buenos

O site pessoal de Shaihan Buenos e o README do perfil no GitHub: o que mostram, para quem e em que idioma.

## Linguagem

O código é escrito em inglês. A linha "No código" de cada termo dá o nome dele em inglês: é a única tradução usada em nomes de arquivos, de campos e de funções.

### Conteúdo do site

**Página fixa**:
Página que apresenta Shaihan e é atualizada no lugar, sem data de publicação, como abertura, experiência, projetos, lista de estudos, paper e TCC, e contato. Existe nos dois idiomas.
_Evitar_: página estática, página institucional
_No código_: fixed page (`FixedPage`, `pages/`)

**Texto**:
Algo que Shaihan publica ao longo do tempo, com data: um artigo ou uma nota de estudo. Sai no seu idioma original e pode ganhar uma tradução.
_Evitar_: post; artigo, quando se quer dizer qualquer texto
_No código_: text (`Text`, `texts/`)

**Lançamento**:
A primeira vez que o site vai ao ar, o que só acontece com todas as seções prontas. Depois dele, cada texto novo é uma publicação, não um lançamento.
_Evitar_: go-live; deploy (é o envio de cada nova versão)
_No código_: launch

**Contato**:
Os canais pelos quais um visitante fala com Shaihan. O site não tem comentários: quem quer conversar usa o contato.
_Evitar_: fale comigo, redes sociais
_No código_: contact

**Sobre**:
A página fixa que reúne a bio, a experiência, a formação e o contato.
_Evitar_: sobre mim; usar "sobre" como nome da bio
_No código_: about

### Apresentação

**Abertura**:
O que o visitante lê primeiro no site: o nome, o rótulo e a frase de apresentação.
_Evitar_: hero, capa, cabeçalho
_No código_: opening

**Rótulo**:
A expressão curta que diz o que Shaihan é profissionalmente, mostrada junto do nome no site e no README.
_Evitar_: título (é o de um texto), cargo (é o de cada emprego), headline, label (são as das issues)
_No código_: label

**Frase de apresentação**:
A frase, em primeira pessoa, que vem logo depois do rótulo e diz o que Shaihan constrói e como. Não cita empregador nem anos de experiência.
_Evitar_: tagline, slogan, resumo; bio (é o parágrafo)
_No código_: intro

**Bio**:
O parágrafo curto, em primeira pessoa, que conta onde Shaihan trabalha hoje, de onde vem o lado de IA e o que está estudando. Completa a frase de apresentação, não a substitui.
_Evitar_: sobre mim, perfil, resumo
_No código_: bio

**README do perfil**:
O texto, só em inglês, que aparece na página do perfil de Shaihan no GitHub. Diz quem ele é e aponta para o site; o que está em andamento fica no site, não nele.
_Evitar_: README do site, documentação do repo (as instruções de desenvolvimento ficam em outro arquivo)
_No código_: profile README

### Experiência

**Experiência**:
Os empregos de Shaihan, do estágio ao atual. Formação, projetos e o paper não são experiência.
_Evitar_: carreira, trajetória, histórico profissional
_No código_: experience

**Linha do tempo**:
A forma como a experiência é mostrada: as empresas, da mais recente à mais antiga, cada uma com os cargos que Shaihan teve nela.
_Evitar_: timeline, cronologia
_No código_: timeline

**Cargo**:
O título que Shaihan teve numa empresa durante um período, como Software Engineer II. Uma empresa pode ter mais de um cargo.
_Evitar_: posição, função; rótulo (é o da apresentação)
_No código_: role (`Role`, `roles/`)

**Conquista**:
Uma frase sobre um resultado que Shaihan entregou num cargo: o que mudou, como foi feito e com quais tecnologias. Leva número só quando ele existe e pode ser publicado.
_Evitar_: realização, responsabilidade, atividade
_No código_: achievement

### Projetos

**Projeto**:
Algo que Shaihan constrói por conta própria, fora do emprego e da formação. Trabalho de disciplina não é projeto.
_Evitar_: side project, projeto pessoal, case
_No código_: project (`Project`, `projects/`)

**História do projeto**:
O que o site conta sobre um projeto, sempre com as mesmas partes: marca e nome, estado, o que é, decisões de engenharia, como foi construído. Não leva link para código.
_Evitar_: estudo de caso, case study, ficha
_No código_: project story (`ProjectStory`)

**Marca do projeto**:
O desenho, tipo logo, que representa um projeto no site e conversa com a ideia dele.
_Evitar_: logo, ícone; "marca" sozinho (confunde com marca de idioma)
_No código_: project mark (`mark.svg`)

**Estado do projeto**:
Em que pé um projeto está no dia: funciona localmente, em desenvolvimento ou em planejamento.
_Evitar_: status (é o do estudo), fase
_No código_: project state (`state`): `works-locally`, `in-development`, `in-planning`

**Decisão de engenharia**:
Uma escolha técnica contada numa história do projeto, com o problema, a escolha e o que foi descartado.
_Evitar_: destaque, feature
_No código_: engineering decision

**Crédito dos agentes**:
A regra de dizer, em cada história do projeto, que o código foi escrito por agentes de IA sob a especificação e a revisão de Shaihan.
_Evitar_: feito com IA, assistido por IA
_No código_: agent credit

### Pesquisa

**Pesquisa**:
O trabalho acadêmico de Shaihan mostrado no site: o paper e o TCC, nessa ordem. Não é projeto nem experiência.
_Evitar_: publicações (só o paper foi publicado), produção acadêmica, artigos (artigo é um tipo de texto)
_No código_: research; cada trabalho é um research item (`ResearchItem`, `research/`), `paper` ou `thesis`

### Textos

**Artigo**:
Texto longo e revisado, que explica ou defende uma ideia.
_Evitar_: post; ensaio (é o nome de um projeto)
_No código_: article (`article`)

**Nota de estudo**:
Texto curto que registra o que Shaihan aprendeu estudando, sem polimento.
_Evitar_: TIL; "nota" sozinho (confunde com nota de tradução)
_No código_: study note (`study-note`)

**Tipo de texto**:
Se um texto é artigo ou nota de estudo. Todo texto tem um só tipo, mostrado em cada item da lista de textos.
_Evitar_: label (são as das issues), categoria
_No código_: text type (`type`)

**Tema**:
A área de um texto, escolhida numa lista curta e fixa, como backend ou IA. Todo texto tem de um a três temas; um tema é mais amplo que um estudo.
_Evitar_: tag, categoria
_No código_: topic (`topics`)

### Estudos

**Estudo**:
Um assunto de carreira, acadêmico ou não, que Shaihan está estudando ou já estudou, com um status. Um curso formal não é estudo: é formação.
_Evitar_: trilha, tópico
_No código_: study (`Study`, `studies/`)

**Formação**:
Os cursos formais de Shaihan, como graduação, pós e mestrado, cada um com a instituição e o ano de conclusão. Um curso em andamento também é formação.
_Evitar_: estudos, quando se quer dizer os cursos formais
_No código_: education

**Status do estudo**:
Em que pé está um estudo: em andamento ou concluído.
_Evitar_: situação; WIP ou estudando, para dizer em andamento
_No código_: study status (`status`): `in-progress`, `completed`

**Lista de estudos**:
A página fixa com os estudos de Shaihan e o status de cada um.
_Evitar_: roadmap, roteiro de estudos
_No código_: study list (`lists/studies.yaml`)

### Idiomas

**Idioma original**:
O idioma em que um texto foi escrito: português ou inglês.
_Evitar_: idioma fonte, idioma do texto
_No código_: original language (`originalLanguage`)

**Tradução**:
A versão de um texto no outro idioma. É opcional: só ganha tradução o texto que merecer.
_Evitar_: versão traduzida
_No código_: translation

**Nota de tradução**:
Aviso que acompanha uma tradução: diz o idioma original, leva ao original e informa quando a tradução foi feita com IA.
_Evitar_: aviso de tradução, disclaimer
_No código_: translation note; o campo é `translatedWithAI`

**Marca de idioma**:
Indicação, na lista de textos, de que um texto está no outro idioma do site.
_Evitar_: etiqueta, selo
_No código_: language mark

**Botão de idioma**:
O par "EN" e "PT" no canto superior direito de todas as páginas, com o idioma atual marcado e o outro como link para o equivalente da página.
_Evitar_: seletor de idioma, toggle
_No código_: language button

### Descoberta

**Feed**:
A lista dos textos que um leitor de feeds acompanha para saber de textos novos. Há um por idioma, e cada um traz todos os textos uma única vez.
_Evitar_: RSS (é o formato), newsletter (é aviso por e-mail, que o site não tem)
_No código_: feed

**Resumo de uma linha**:
A frase que acompanha o título de um texto na lista de textos, no feed, nos buscadores e nas redes sociais.
_Evitar_: descrição, subtítulo, chamada
_No código_: one-line summary (`summary`)

**Descrição da página**:
A frase que buscadores e redes sociais mostram de uma página fixa ou de uma história do projeto. Existe nos dois idiomas.
_Evitar_: meta description, resumo (é dos textos)
_No código_: page description (`description`)

**Imagem de compartilhamento**:
A imagem que aparece no cartão quando alguém cola um endereço do site numa rede social ou numa conversa.
_Evitar_: OG image, capa, thumbnail
_No código_: share image

### Publicação e manutenção

**Rascunho**:
Um texto ainda não publicado. Shaihan o vê enquanto escreve, e ele não aparece no site.
_Evitar_: draft, texto oculto
_No código_: draft (`draft`)

**Conferência**:
A revisão que Shaihan faz a cada três meses para confirmar que as páginas fixas continuam certas e iguais nos dois idiomas. A lista de estudos mostra a data da última.
_Evitar_: revisão trimestral, auditoria
_No código_: check (`checkedOn`)

**Revisão de conteúdo**:
Mudança num texto publicado que altera o que ele diz. Preenche a data de atualização e sai no original e na tradução juntos. Corrigir erro de digitação não é revisão de conteúdo.
_Evitar_: edição, update
_No código_: content revision (`updatedOn`)
