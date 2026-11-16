# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Decidida em [Stack, hospedagem, domínio e quem constrói](https://github.com/ShaihanBuenos/ShaihanBuenos/issues/11):

- Astro com TypeScript, saída estática, CSS puro. Sem Tailwind, sem React e sem biblioteca de movimento.
- O código mora num repo próprio e público, `ShaihanBuenos/shaihanbuenos.dev`. O README do perfil fica em outro repo, `ShaihanBuenos/ShaihanBuenos`.
- Cloudflare para hospedagem, DNS e registro. Domínio `shaihanbuenos.dev`; contato por `hi@shaihanbuenos.dev`, como encaminhamento.
- Agentes constroem; Shaihan dirige, revisa e aprova.
- A stack atende à regra de edição, em "Capabilities and Constraints".

## Users

- **Principal: quem avalia Shaihan profissionalmente.** Recrutadores, gestores e colegas que chegam para decidir se querem conversar com ele. Leem rápido, muitas vezes sem conta no GitHub, e querem ver o que ele faz, onde trabalhou e a prova do que o rótulo afirma.
- **Segundo: quem lê o que ele escreve e estuda.** Outros engenheiros que chegam por um texto ou por um estudo.

Quando os dois entram em conflito, manda quem avalia (confirmado por Shaihan em 2026-11-15).

## Product Purpose

O site pessoal de Shaihan Buenos, engenheiro de software com foco em backend e IA, e o README do perfil dele no GitHub. O site apresenta quem ele é, prova o que o rótulo afirma e publica o que ele escreve e estuda. Ele substitui o currículo público: não há currículo em PDF.

Sucesso é o visitante que avalia entender, sem sair da página inicial, o que Shaihan constrói e como, e ter como falar com ele.

## Positioning

A frase de apresentação afirma duas coisas, e o site prova cada uma com trabalho que pode ser conferido:

- **Sistemas que usam LLMs:** um paper publicado pelo IEEE, como primeiro autor.
- **Programar com agentes de IA guiados por especificação:** três projetos próprios, cada um com o crédito explícito aos agentes e, num deles, o método medido, com o resultado ruim incluído.

A prova da IA vem do paper e dos projetos, não dos empregos.

## Operating Context

- O visitante que avalia costuma chegar por um link no LinkedIn, no GitHub ou num currículo, e pode receber o link direto de uma página.
- O site tem dois idiomas: inglês na raiz e português em `/pt-br`. As páginas fixas existem nos dois; cada texto sai no idioma original, com tradução opcional. Não há redirecionamento automático por idioma.
- O README do perfil é só em inglês.
- Shaihan mantém o site sozinho.

## Capabilities and Constraints

**Páginas** (decididas em [Estrutura do site: páginas, seções e navegação](https://github.com/ShaihanBuenos/ShaihanBuenos/issues/10)):

- Início, Projetos, Textos, Estudos, Pesquisa e Sobre, mais uma página por projeto e uma por texto.
- A página inicial é um resumo: abertura, chamada do paper, projetos, textos recentes, estudos em andamento e bio.
- Sobre reúne a bio, a experiência, a formação e o contato.
- Menu: Projetos · Textos · Estudos · Pesquisa · Sobre, mais o botão de idioma ("EN" e "PT"), no canto superior direito.

**Regra de edição:** editar o site tem de ser fácil. Trocar um texto, um estado, uma conquista ou um status é mudar um arquivo de conteúdo, não código de página. A ordem de qualquer lista é conteúdo. Acrescentar ou tirar um projeto, um texto ou um estudo é criar ou apagar um arquivo.

**O que o site não tem:** comentários, busca no lançamento, currículo em PDF, tabela de skills, página "agora", seção pessoal no lançamento, link para código ou demo no ar de qualquer projeto, PDF do paper ou do TCC.

**Regra de lançamento:** o site só vai ao ar com tudo pronto, nos dois idiomas.

**Regras de conteúdo que o design não pode quebrar:**

- Nenhum projeto é marcado como principal, e a ordem deles não é fixa.
- A experiência conta o que Shaihan fez como engenheiro, não o negócio da empresa.
- Sobre a pesquisa: os pacientes são sempre "simulados", e um número de resultado só aparece junto dessa ressalva.
- O Betô aparece pelo nome e pela engenharia, como "um produto que estou construindo, ainda não lançado". O produto em si não é descrito nem mostrado.

**Terminologia:** os termos do site estão em `GLOSSARY.md`. Usar aqueles e evitar os que o glossário marca.

**Sem foto:** em Sobre entra um avatar em pixel art, nas cores do site.

**Descoberta** (decidida em [Descoberta: feed, buscadores e redes sociais](https://github.com/ShaihanBuenos/ShaihanBuenos/issues/15)): um feed por idioma, descrição de uma linha por página, imagem de compartilhamento gerada, sem newsletter no lançamento.

## Brand Commitments

- **Nome:** Shaihan Buenos.
- **Rótulo:** "Engenheiro de software com foco em backend e IA"; em inglês, "Software Engineer focused on backend and AI". "Full stack" não aparece.
- **Frase de apresentação:** "Construo serviços de backend e sistemas que usam LLMs, e programo com agentes de IA guiados por especificação."; em inglês, "I build backend services and systems that use LLMs, and I write code with AI agents guided by specs."
- **Voz:** primeira pessoa, frases diretas, sem anos de experiência e sem promessa de ritmo de publicação.
- **Marcas dos projetos:** cada projeto tem uma marca desenhada, tipo logo, no mesmo estilo. As três direções aceitas: duas orelhas saindo de uma toca (Out of the Rabbit Hole), o "ô" com duas linhas que viram um ponto (Betô) e uma palheta com o sinal de repetição (Ensaio). O desenho final fica para a construção.
- **Referências que Shaihan indicou:** [joaoac.com](https://www.joaoac.com/pt-BR) e [yudiganeko.com](https://www.yudiganeko.com/). São referências de conteúdo e de estrutura; nenhuma direção visual foi fixada.

## Evidence on Hand

- **Paper:** "Integrating Large Language Models into Hypertension Care: Architecture and Prompt Tuning Evaluation", HAXD 2026, IEEE, DOI [10.1109/HAXD70072.2026.11621018](https://doi.org/10.1109/HAXD70072.2026.11621018).
- **Experiência:** duas empresas e três cargos, com as conquistas já escolhidas e um único número, um percentual de qualidade.
- **Projetos:** três histórias do projeto, com as partes fixas definidas.
- **Esboços:** as três marcas e uma primeira versão navegável do site, guardados fora do git.

**O que não existe e não pode ser inventado:**

- Nenhum texto publicado ainda; o lançamento pede pelo menos um artigo e uma nota de estudo.
- A lista de estudos ainda não foi escrita.
- Nenhuma captura de tela dos projetos; só o Out of the Rabbit Hole terá, de uma demonstração com dados fictícios.
- Nenhuma foto de Shaihan foi fornecida.
- Sem depoimentos, sem números de uso, sem logotipos de empresas.

## Product Principles

1. **Prova antes de adjetivo.** Tudo o que o site afirma sobre Shaihan aponta para algo que o visitante pode conferir.
2. **Dizer o estado verdadeiro.** Um projeto em planejamento aparece como em planejamento; um resultado ruim aparece junto do bom.
3. **Cada coisa num lugar só.** Empregos na experiência, cursos na formação, projetos em Projetos, trabalho acadêmico em Pesquisa.
4. **Nada que envelhece sozinho.** Sem anos de experiência, sem contagens e sem promessas de frequência.
5. **Fácil de manter por uma pessoa.** Conteúdo em arquivos, sem serviços de terceiros para moderar ou atualizar.

## Accessibility & Inclusion

- O visitante que avalia pode não ter conta no GitHub nem ler português: as páginas fixas existem em inglês, e nada essencial depende de login.
- O site é feito primeiro para o celular, por onde chega quem abre um link do LinkedIn. A versão de celular é desenhada e conferida antes da de computador, com o mesmo cuidado, e nenhum conteúdo existe só na tela grande.
