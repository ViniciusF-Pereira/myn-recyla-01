# Roteiro 1.4 — agente de trabalho profundo

Meta registrada no `/goal`: `goal-mx0nfsla-1rym`.

Objetivo: transformar o Myn em um agente que conduz trabalho ao longo do tempo, com fontes, projetos, ferramentas auditáveis e comparação honesta — não apenas um catálogo de rotas.

## Marcos

### F1 — Pesquisa web com fontes externas

**Estado:** pendente.

Entregáveis: busca externa, trecho citado, data, qualidade da fonte, carregamento, erro e ausência de resultado.

Aceite: 20 perguntas externas sem referência inventada; toda afirmação relevante aponta para fonte verificável.

### F2 — Projetos locais persistentes

**Estado:** parcialmente entregue.

Entregue: projetos, instruções, seleção ativa, memória isolada no cliente, anexos de texto, importação de histórico local e do servidor, exportação/importação e contexto estruturado no SSE.

Próximo: versionar instruções, mostrar memória importada na interface e isolar também a memória do servidor por projeto.

Aceite: dois projetos não misturam contexto; dados sobrevivem ao recarregamento; exportação/importação preserva projetos.

Provas: `docs/PROJETOS.md`, `docs/prints/playground-projetos-desktop.png` e `docs/prints/playground-projetos-mobile.png`.

### F3 — Tool-use auditável

**Estado:** pendente.

Entregáveis: schema, prévia de argumentos, confirmação externa, idempotência, timeout, cancelamento e registro sanitizado.

Aceite: zero envio duplicado em falha ou reconexão; toda ação externa mostra entrada, saída e motivo.

### F4 — Extensão confiável

**Estado:** pendente.

Entregáveis: detecção de deriva de seletor antes do envio, permissões explicadas, revogação fácil e modo manual.

Aceite: layout quebrado é avisado antes da ação; nenhuma rota contorna login, CAPTCHA ou paywall.

### F5 — Benchmark cego

**Estado:** pendente.

Entregáveis: mesmas 20 tarefas para Myn e referências, com acerto, fontes, artefatos, primeiro token, conclusão, cancelamento e custo.

Aceite: método e resultados brutos publicados, incluindo derrotas e limitações.

### F6 — Varredura da fila existente

**Estado:** em andamento, sem coleta nova.

Snapshot em 28/11/2026: 273.503 tentativas, 915.688 URLs na fila, 3,04% da meta. A meta de 9 milhões não foi atingida.

Aceite: somente a fila existente é testada; progresso e evidência são registrados sem inflar resultados.

## Continuidade das metas

O planejador do `/goal` agora recebe as três execuções anteriores e o checkpoint do goal. Passos concluídos, falhas e pendências entram no prompt. Rotas de navegador puladas não são mais contadas como sucesso.

O checkpoint pode ser atualizado por `POST /api/goal/checkpoint`. A meta atual já registra projetos, anexos, histórico e SSE estruturado como concluídos, com versionamento, memória do servidor, pesquisa web, tool-use, extensão e benchmark como pendentes.

## Regras de entrega

- Testes automatizados e QA no navegador.
- Prints em `docs/prints/`.
- Nenhuma superioridade declarada sem medição.
- Nenhuma coleta nova de URLs.
- Nenhuma chave paga, Google/Gemini ou contorno de acesso.
