---
whatItIs: "Um app local para o meu estudo de guitarra: um player de tablaturas que troca o timbre do amplificador a cada trecho, com um conselheiro de timbre feito com LLM. Está em planejamento, sem código do app ainda."
description: "A história do Ensaio, um app em planejamento para o meu estudo de guitarra: a pesquisa em fontes primárias, o plano de teste com hardware e o desenho da parte de IA."
---

## Decisões de engenharia

### O conselheiro de timbre só propõe o que o aparelho tem

**O problema.** Um LLM que sugere um timbre pode inventar um bloco de efeito que o aparelho não tem, ou um valor fora da faixa.

**A escolha.** Pela especificação, a proposta do modelo é um JSON em que cada nome de bloco tem de vir do catálogo do aparelho. As faixas dos números vão ser conferidas em código, e o modelo tenta de novo quando um valor sai da faixa. A IA só vai escrever propostas, nunca a versão final. Nada disso está construído ainda.

**O que foi descartado.** LangChain e um banco vetorial. Pelo desenho, os dados de referência cabem no prompt, com cache, e o histórico de estudo vai ser consultado por chamadas de ferramenta.

### Medir com o aparelho antes de escolher a stack

**O problema.** O app depende de trocar o timbre no aparelho, por USB, no meio da música. Antes de escolher a stack, eu preciso saber quanto tempo essa troca leva e se ela corta o som.

**A escolha.** Um protótipo descartável de teste: um roteiro de passos para rodar com o aparelho de verdade, um registrador que percebe quando o USB é ligado e desligado, e scripts que medem a latência e o intervalo de silêncio na troca de timbre. Um aparelho simulado permite trabalhar sem o hardware, e o código de análise foi conferido contra sinais sintéticos. O teste com o aparelho de verdade ainda não foi feito.

**O que foi descartado.** Escolher a stack antes de medir. A decisão entre Electron, Tauri e um app web local continua aberta.

### Erros de desenho pegos no código-fonte do navegador

**O problema.** O desenho contava com um buffer de áudio menor do que 128 amostras, e uma tela mostrava uma barra de latência do "motor" de áudio do app.

**A escolha.** Ler o código-fonte do Chromium. Ele mostrou que o Chrome no Mac não usa um buffer menor do que 128 amostras, e que a barra do "motor" era, na verdade, o buffer do próprio Chrome. As duas correções entraram na especificação. A pesquisa marca cada fato como documentado, relato de usuário ou a testar.

**O que foi descartado.** Confiar nos números do desenho sem ir à fonte.

## Como foi construído

Ainda não há código do app: a especificação, a pesquisa e o protótipo de teste foram escritos por agentes de IA, com o Claude Code, sob a minha direção e a minha revisão.

O meu papel é decidir o que construir, aprovar a especificação e definir o que cada teste tem de provar. O planejamento começa pela pesquisa em fontes primárias, e o que a pesquisa acha volta para a especificação antes de qualquer código.

A primeira etapa não tem IA: o conselheiro de timbre entra na segunda. A hipótese de stack usa alphaTab para tocar as tablaturas, Web MIDI para falar com o aparelho e SQLite para o histórico de estudo.
