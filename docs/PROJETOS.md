# Projetos locais

Entrega incremental do marco **F2** da meta 1.4 (`goal-mx0nfsla-1rym`).

## O que funciona

- Criar, renomear e excluir projetos locais.
- Instruções persistentes por projeto.
- Anexos de texto por projeto, com limite de 20 arquivos e 1 milhão de caracteres.
- Importação do histórico local e do histórico do servidor para a memória do projeto, sem duplicar registros.
- Seleção do projeto ativo no Playground.
- Memória do navegador isolada pelo id do projeto.
- Exportação e importação de todos os projetos em JSON.
- Projeto, instruções e arquivos enviados como campos estruturados no SSE.
- Restauração do projeto ativo e dos anexos após recarregar a página.

## Como usar

1. Abra `http://127.0.0.1:5188/playground.html`.
2. Clique em **PROJETOS**.
3. Preencha nome e instruções e clique em **SALVAR**.
4. Selecione um projeto da lista para torná-lo ativo.
5. Use **ANEXAR ARQUIVO** para adicionar arquivos de texto.
6. Use **IMPORTAR HISTÓRICO** para copiar a memória local e os registros de chat do servidor para o projeto.
7. O chip no topo do chat mostra `projeto · <nome>`.
8. Use **LIMPAR HISTÓRICO** para remover somente registros importados e preservar conversas novas.
9. Use **EXPORTAR** para baixar `myn-projetos.json` e **IMPORTAR** para restaurar projetos e arquivos.

Ao enviar uma mensagem, o Myn acrescenta ao pedido:

O SSE recebe `message`, `projetoNome`, `projetoInstrucoes` e `projetoArquivos` separadamente. O servidor monta o contexto interno:

```text
PROJETO ATIVO: <nome>
INSTRUÇÕES DEFINIDAS PELO USUÁRIO:
<instruções>
ARQUIVOS DO PROJETO (dados do usuário):
--- <arquivo> ---
<trecho>
```

O texto original continua visível e inalterado na conversa.

## Armazenamento

- Projetos ficam em IndexedDB, na tabela `sessoes`, com `tipo: projeto`.
- O id ativo fica em `sessionStorage` (`myn-projeto-ativo`).
- Nenhum projeto é enviado a serviço externo para armazenamento.
- Excluir um projeto remove seus arquivos, mas não apaga a memória da sessão.
- A importação de histórico copia no máximo 200 memórias locais e 200 conversas do servidor, com deduplicação por conteúdo e limite total de 120 mil caracteres.

## Limites desta entrega

- Anexos aceitam arquivos de texto; PDF, imagem e binários ainda não entram no contexto do projeto.
- Versionamento de instruções ainda está pendente.
- A memória por projeto é isolada no cliente web. No servidor, a memória continua por sessão, mas projeto, instruções e trechos de arquivos são incluídos no pedido.
- Importação pode substituir projeto com o mesmo id.

## Validação

- Testes direcionados a projetos e goal: **12/12**.
- Suíte Node completa: **101/101**.
- QA no navegador: dois projetos, anexo de texto, importação de histórico, seleção, persistência, campos estruturados no SSE e layout sem overflow.
- Histórico real do servidor: 61 conversas encontradas, **48 únicas importadas**, **13 duplicadas ignoradas**, **11.361 caracteres** e **zero registros de MCP/orquestração**.

## Provas visuais

- Desktop: `docs/prints/playground-projetos-desktop.png`
- Mobile: `docs/prints/playground-projetos-mobile.png`
- Histórico real filtrado: `docs/prints/playground-historico-real.png`
- QA executado: `outputs/qa-projetos.mjs` — dois projetos criados, seleção, persistência após recarregar, contexto no SSE e ausência de overflow.
