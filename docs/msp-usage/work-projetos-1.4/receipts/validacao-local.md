# Recibo sanitizado — WORK Projetos locais 1.4

Data: 2026-11-28 (UTC).

## Escopo

- Projeto: `myn-Recicla-01`.
- Tarefa: expandir a meta 1.4 e entregar projetos locais com provas visuais.
- Meta: `goal-mx0nfsla-1rym`, ativa, intervalo diário, até 30 execuções e 6 passos.
- Chamadas MSP: nenhuma. Implementação e validação locais.
- Segredos, tokens, cookies e conteúdo de conversas: não incluídos.

## Comandos e resultados

- `node --test`: 97 testes, 97 aprovados, 0 falhas.
- `node --test tests/projetos.test.mjs tests/projetos-web.test.mjs`: 8/8.
- `node --check` nos módulos alterados: aprovado.
- `git diff --check`: aprovado.
- QA `outputs/qa-projetos.mjs`: 2 projetos criados, seleção ativa, memória por id, contexto no SSE, persistência após recarregar e sem overflow.
- Desktop 1440×1000 e mobile 390×844 validados.

## Artefatos

- Print desktop: `docs/prints/playground-projetos-desktop.png`
- SHA256: `256760409DD7B96C45F91D9AF30FF54CE98322ED1BB9ECA89B3A6CC469CD244D`
- Print mobile: `docs/prints/playground-projetos-mobile.png`
- SHA256: `532A8BACA9C60152F0F684119DC6D56B2076015B443CCDEE2F1F1674DCEBC76F`
- Resultado QA: `outputs/qa-projetos-resultado.json`
- SHA256: `7EA20504A650321F0B2DB53757EF1358EC25796FFC87A5189189D107CD5DC291`
- Guia: `docs/PROJETOS.md`
- Roteiro: `docs/ROTEIRO_1.4.md`

## Limites

- F2 parcial: arquivos vinculados e versionamento ainda pendentes.
- Memória por projeto isolada no cliente; servidor permanece por sessão.
- Sem comparação direta paga com ChatGPT.
- Nenhuma coleta nova de URLs.
