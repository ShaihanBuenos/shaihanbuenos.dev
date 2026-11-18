---
whatItIs: "Um produto que estou construindo, ainda não lançado: um PWA de registros diários, desenhado para funcionar sem conexão."
description: "A história do Betô, um produto ainda não lançado: escritas que nunca se repetem, login próprio sem senha e o método de programar com agentes de IA, medido."
---

## Decisões de engenharia

### Um registro que chega duas vezes é gravado uma vez só

**O problema.** Um app que funciona sem conexão reenvia o que não sabe se chegou. O mesmo registro pode chegar duas vezes ao servidor, até no mesmo instante.

**A escolha.** Cada registro leva um identificador gerado no aparelho, e o banco tem uma chave única formada pelo autor e por esse identificador. A gravação é um `INSERT … ON CONFLICT DO NOTHING RETURNING`, seguido de um `SELECT` quando o registro já existia. Um teste manda dois lotes ao mesmo tempo e confere que um registro só foi gravado.

**O que foi descartado.** Fazer tudo numa instrução só, com uma CTE: sob concorrência, ela pode voltar vazia.

![[Exemplo] Aqui entra um diagrama: o mesmo registro chega duas vezes ao servidor e é gravado uma vez só.](./image-to-come.svg "[Exemplo] Diagrama a fazer: dois envios do mesmo registro, uma gravação.")

### Nada é apagado: desfazer é gravar uma anulação

**O problema.** Desfazer um registro é mais uma operação que vai poder ser feita sem conexão e reenviada. Ela precisa passar pelo mesmo caminho dos registros.

**A escolha.** O servidor nunca apaga um registro. Desfazer grava uma anulação, e o desenho da fila de envio, que ainda não foi construída, ganhou a operação de anular. O lote responde com um status para cada item.

**O que foi descartado.** Apagar a linha com um `DELETE`.

### Login próprio, sem senha, no lugar de um serviço de autenticação

**O problema.** O app precisa de login sem senha, e a primeira decisão foi usar um serviço gerenciado de autenticação.

**A escolha.** Login próprio com a conta do Google, por OIDC com PKCE, e sessão guardada no servidor, no Postgres, na mesma origem do app, com proteção contra CSRF. Nenhum JWT chega ao navegador. O login é testado de ponta a ponta contra um substituto do Google, escrito para os testes. O login por link no e-mail está planejado, ainda não construído.

**O que foi descartado.** O Amazon Cognito, escolhido numa decisão anterior. A decisão nova substitui a antiga e registra o porquê.

### A construção barra o que quebra a arquitetura

**O problema.** Quem escreve o código são agentes. Um limite entre módulos que existe só num documento acaba atravessado sem ninguém ver.

**A escolha.** Os limites são conferidos pela construção, dos dois lados: no backend, com Spring Modulith; no frontend, com uma regra de ESLint que tem os próprios testes. O contrato OpenAPI só aceita mudanças que acrescentam, e uma verificação barra a divergência entre o contrato e o código.

**O que foi descartado.** Deixar os limites só na documentação e na revisão.

## Como foi construído

O código foi escrito por agentes de IA, com o Claude Code, sob a especificação e a revisão que eu defini.

O método tem quatro regras. A especificação vem primeiro. Os testes saem da especificação. Quem verifica não é quem implementou. E cada mudança passa por dois revisores de IA independentes, que não veem os achados um do outro.

O backend é Java com Spring Boot e PostgreSQL; o frontend, React com TypeScript. Os testes do backend rodam contra um Postgres de verdade, com Testcontainers, e falhas injetadas de propósito mostram que eles pegam regressões.

Eu medi o método. A primeira medição mostrou que, de 19 PRs, 7 eram trabalho de processo e só 3 entregavam produto. Uma comparação entre dois jeitos de revisar achou dois defeitos que o fluxo antigo tinha deixado passar. Depois disso, comecei a tirar duas ferramentas do processo. O resultado ruim também fica aqui: pela minha própria medida, as linhas de processo por linha de código não caíram, 1,81 contra 1,20.

Hoje o Betô roda só na minha máquina: o login, um cadastro e o primeiro tipo de registro, com desfazer. A fila sem conexão e a instalação como PWA estão planejadas.
