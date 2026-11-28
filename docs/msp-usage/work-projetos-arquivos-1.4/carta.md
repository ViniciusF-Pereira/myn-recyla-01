# Carta crítica — WORK Projetos, arquivos e continuidade 1.4

## Pedido e escopo

O operador pediu para continuar, puxar seu histórico e evitar que o agente desistisse ou perdesse o fio.

Esta rodada amplia o F2 com anexos de texto, importação de histórico local e contexto estruturado no SSE. Também melhora o motor do `/goal` para carregar execuções anteriores e checkpoint.

## Fatos verificados

- Projetos aceitam até 20 arquivos de texto e 1 milhão de caracteres.
- Arquivos ficam isolados por projeto e sobrevivem ao recarregamento.
- Exportação/importação inclui projetos e arquivos.
- Excluir projeto remove seus arquivos e preserva memória.
- Histórico local e conversas do servidor são filtrados antes da importação: no máximo 200 por origem, deduplicação por conteúdo e limite de 120 mil caracteres.
- No histórico real, 61 conversas viraram 48 únicas importadas, 13 duplicadas ignoradas e zero registros de MCP/orquestração.
- O IndexedDB agora confirma a transação completa antes de responder, evitando leitura antes do commit.
- O SSE recebe `message`, `projetoNome`, `projetoInstrucoes` e `projetoArquivos` separadamente.
- O servidor devolve `projeto` e `arquivosProjeto` nos eventos de progresso.
- O planejador do goal recebe as três execuções anteriores e o checkpoint.
- Rotas de navegador puladas deixam de ser contadas como sucesso.
- `POST /api/goal/checkpoint` foi adicionado e a meta atual recebeu concluídos e pendências reais.
- Testes direcionados: 12/12; suíte Node completa: 101/101.
- QA no navegador confirmou anexo, histórico, persistência e campos estruturados.
- Prints desktop/mobile atualizados.

## Hipóteses e limites

- Anexos são de texto; PDF, imagem e binários ainda não entram no contexto.
- Versionamento de instruções continua pendente.
- Memória do servidor ainda é por sessão.
- A importação de histórico usa a memória local e os registros do servidor; histórico de serviços externos exige exportação do usuário, sem contorno de login.
- O goal agora preserva contexto, mas isso não o torna um programador autônomo completo.

## Útil e aceito

- O pedido do usuário permanece inalterado no campo `message`.
- Arquivos e instruções chegam ao modelo sem misturar o texto visível.
- O histórico local pode ser copiado explicitamente para um projeto.
- Falhas e pendências do goal ficam registradas para o próximo ciclo.

## Descartado

- Contar passo pulado como concluído.
- Repetir o objetivo inteiro sem olhar execuções anteriores.
- Apagar memória ao excluir um projeto.
- Prometer suporte a PDF/OCR nesta rodada.

## Crítica construtiva

O próximo passo é versionar instruções e mostrar a memória importada na interface. Depois, estruturar um endpoint de checkpoint editável para o operador ajustar prioridades sem recriar a meta.

## Crítica destrutiva

“O goal agora não desiste mais” seria exagerado. O que foi entregue é memória de continuidade, checkpoint e contagem honesta de falhas; a execução autônoma ainda depende das ferramentas disponíveis.

## Prioridades

1. Versionamento de instruções e visualização da memória do projeto.
2. Endpoint de checkpoint editável.
3. Pesquisa web com fontes externas.
4. Tool-use auditável com idempotência.
5. Benchmark cego.

## Aceites

- `node --test`: 101/101.
- Testes direcionados: 12/12.
- SSE real com projeto e um arquivo: HTTP 200 e metadados corretos.
- QA desktop/mobile sem overflow.
- Persistência de projeto e arquivo após recarregar.
- Histórico local importado sem duplicata.

Recibo sanitizado: `receipts/validacao-local.md`.
