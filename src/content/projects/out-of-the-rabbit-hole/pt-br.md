---
whatItIs: "Um app pessoal de finanças, que roda só na minha máquina: lê faturas, extratos e contracheques com IA e mostra para onde o dinheiro vai."
description: "A história do Out of the Rabbit Hole: um app pessoal de finanças que lê documentos com IA, e as decisões de engenharia por trás dele."
---

## Decisões de engenharia

### O banco é a fonte da verdade, mesmo editado por fora

**O problema.** Os dados podem mudar por fora do app: uma correção feita à mão no banco, por exemplo. Se o app confiar na cópia que tem em memória, a próxima gravação passa por cima dessa mudança.

**A escolha.** O Postgres é a fonte da verdade. Um gatilho aumenta um número de revisão a cada escrita, venha de onde vier. Cada mudança do app roda numa transação só: trava a revisão, recarrega os dados se a cópia estiver velha, grava só as linhas que mudaram e tenta de novo em caso de deadlock. Os testes cobrem a edição feita por fora do app.

**O que foi descartado.** O primeiro desenho previa MongoDB e foi substituído por este. Com o Postgres, a revisão, as transações e as restrições ficam no próprio banco, e não no código do app.

### As restrições do banco saem dos tipos do código

**O problema.** Os valores que um campo aceita ficam escritos em dois lugares: nos tipos do TypeScript e nas restrições do banco. Quando um valor novo entra só num deles, o erro aparece tarde, numa gravação recusada.

**A escolha.** As restrições `CHECK` do banco são geradas a partir dos tipos de união do TypeScript. Uma função auxiliar, conferida na compilação, faz a construção falhar se faltar algum membro de uma união.

**O que foi descartado.** Escrever as restrições à mão no SQL e contar com a revisão para manter as duas listas iguais.

### A IA propõe, e eu aceito

**O problema.** Um modelo que lê uma fatura pode errar um valor, e um erro gravado direto muda todos os números que dependem dele.

**A escolha.** A leitura sai do modelo como saída estruturada, num esquema fixo, e nenhuma mudança proposta pela IA é aplicada sem eu aceitar. Depois de aceita, o app mostra quais números mudaram. Todos os números são recalculados a partir dos documentos e de um registro de correções, em ordem de tempo. O modelo fica atrás de uma interface, e os testes usam um modelo simulado e um Postgres em memória. Foi com esse modelo simulado que a leitura por IA foi verificada: a leitura de um documento real, com uma chave de API, ainda não foi testada.

**O que foi descartado.** Deixar o modelo gravar direto o que leu.

![[Exemplo] Aqui entra uma captura da demonstração, com dados fictícios: uma mudança proposta pela IA, à espera de ser aceita.](./image-to-come.svg "[Exemplo] Captura a fazer: uma mudança proposta pela IA, à espera de ser aceita. Dados fictícios.")

## Como foi construído

O código foi escrito por agentes de IA, sob a especificação e a revisão que eu defini.

O meu papel foi decidir o que construir, aprovar o documento de desenho, definir como cada parte seria verificada e decidir a arquitetura. Os agentes escolheram os padrões que eu deixei em aberto e registraram cada decisão.

O app é escrito em TypeScript, com React, Express e Postgres, e usa o SDK da Anthropic para falar com o modelo. Os testes cobrem as rotas da API, as restrições do banco, as edições feitas por fora do app e cada tela, no computador e no celular. Uma demonstração roda com dados fictícios e sem chave de API.

![[Exemplo] Aqui entra uma captura da demonstração, com dados fictícios: a tela que mostra para onde o dinheiro vai.](./image-to-come.svg "[Exemplo] Captura a fazer: a tela de gastos da demonstração. Dados fictícios.")
