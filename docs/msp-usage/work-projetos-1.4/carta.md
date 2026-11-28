# Carta crítica — WORK Projetos locais 1.4

## Pedido e escopo

O operador pediu para entrar em `/goal`, expandir as prioridades do agente e entregar um incremento com provas visuais.

A meta expandida foi registrada como `goal-mx0nfsla-1rym`, ativa, com seis marcos e aceites verificáveis. Esta entrega implementa a primeira parte do marco F2: projetos locais persistentes.

## Fatos verificados

- Projetos são criados, atualizados, selecionados e removidos no navegador.
- Instruções por projeto são persistentes em IndexedDB.
- A seleção ativa sobrevive ao recarregamento da página.
- A memória do cliente é isolada pelo id do projeto.
- As instruções do projeto são incluídas no pedido SSE sem alterar o texto visível do usuário.
- Exportação e importação usam JSON validado; ids inseguros são substituídos.
- Excluir um projeto preserva a memória da sessão.
- Playground expõe painel, lista, formulário, chip de projeto ativo e ações de exportar/importar.
- Testes específicos: 8/8; suíte Node completa: 97/97.
- QA no navegador: dois projetos, seleção, persistência, contexto SSE e sem overflow desktop/mobile.
- Prints salvos em `docs/prints/playground-projetos-desktop.png` e `docs/prints/playground-projetos-mobile.png`.

## Hipóteses e limites

- O marco F2 ainda está parcialmente entregue: arquivos vinculados a projetos e versionamento de instruções ficam para o próximo incremento.
- A memória por projeto é isolada no cliente; no servidor a memória continua por sessão, embora as instruções do projeto sejam enviadas no contexto.
- A importação pode substituir um projeto com o mesmo id.
- Nenhuma comparação direta com ChatGPT foi realizada nesta tarefa.
- Nenhuma coleta nova de URLs foi iniciada.

## Útil e aceito

- O projeto ativo fica visível no chip do chat.
- O usuário pode criar e selecionar projetos sem sair do Playground.
- O contexto do projeto chega ao modelo antes do pedido.
- Os prints demonstram o fluxo real, não uma maquete.

## Descartado

- Afirmar que o F2 está completo sem anexos de arquivo.
- Tratar seleção visual como prova de persistência sem recarregar a página.
- Apagar memória ao excluir um projeto.
- Usar serviços externos para armazenar projetos.

## Crítica construtiva

O próximo incremento deve anexar arquivos ao projeto e mostrar quais memórias pertencem a ele. Também é importante substituir a concatenação de contexto por um campo estruturado no SSE para preservar limites claros de tamanho.

## Crítica destrutiva

“Projetos prontos” seria uma afirmação exagerada nesta rodada. A entrega cobre instruções, seleção, memória do cliente e portabilidade JSON, mas ainda não cobre arquivos nem memória do servidor por projeto.

## Prioridades

1. Anexar arquivos e versões ao projeto.
2. Estruturar contexto de projeto no SSE.
3. Implementar pesquisa web com fontes externas.
4. Tool-use auditável com idempotência.
5. Benchmark cego em 20 tarefas.

## Aceites

- `node --test`: 97/97.
- Testes de projetos: 8/8.
- QA desktop/mobile sem overflow.
- Contexto do projeto confirmado no pedido SSE.
- Persistência confirmada após recarregar.
- Meta `/goal` ativa e documentada.

Recibo sanitizado: `receipts/validacao-local.md`.
