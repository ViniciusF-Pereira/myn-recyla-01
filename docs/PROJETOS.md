# Projetos locais

Entrega incremental do marco **F2** da meta 1.4 (`goal-mx0nfsla-1rym`).

## O que funciona

- Criar, renomear e excluir projetos locais.
- Instruções persistentes por projeto.
- Seleção do projeto ativo no Playground.
- Memória do navegador isolada pelo id do projeto.
- Exportação e importação de todos os projetos em JSON.
- Instruções do projeto anexadas ao pedido enviado ao chat.
- Restauração do projeto ativo após recarregar a página.

## Como usar

1. Abra `http://127.0.0.1:5188/playground.html`.
2. Clique em **PROJETOS**.
3. Preencha nome e instruções e clique em **SALVAR**.
4. Selecione um projeto da lista para torná-lo ativo.
5. O chip no topo do chat mostra `projeto · <nome>`.
6. Use **EXPORTAR** para baixar `myn-projetos.json` e **IMPORTAR** para restaurar.

Ao enviar uma mensagem, o Myn acrescenta ao pedido:

```text
PROJETO ATIVO: <nome>
INSTRUÇÕES DEFINIDAS PELO USUÁRIO:
<instruções>
```

O texto original continua visível na conversa.

## Armazenamento

- Projetos ficam em IndexedDB, na tabela `sessoes`, com `tipo: projeto`.
- O id ativo fica em `sessionStorage` (`myn-projeto-ativo`).
- Nenhum projeto é enviado a serviço externo para armazenamento.
- Excluir um projeto não apaga a memória da sessão.

## Limites desta entrega

- Arquivos ainda não estão vinculados a projetos; esse é o próximo incremento do F2.
- A memória por projeto é isolada no cliente web. No servidor, a memória continua por sessão, mas as instruções do projeto são incluídas no pedido.
- Importação pode substituir projeto com o mesmo id.

## Validação

- Testes específicos de projetos: **8/8**.
- Suíte Node completa: **97/97**.
- QA no navegador: criação de dois projetos, seleção, persistência, contexto no SSE e layout sem overflow.

## Provas visuais

- Desktop: `docs/prints/playground-projetos-desktop.png`
- Mobile: `docs/prints/playground-projetos-mobile.png`
- QA executado: `outputs/qa-projetos.mjs` — dois projetos criados, seleção, persistência após recarregar, contexto no SSE e ausência de overflow.
