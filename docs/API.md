# API — Myn Recicla/01

## Chat e dados

- `POST /api/agente` — núcleo único com memória, classificação, RAG, plano e `effort` (`low`, `medium`, `high`).
- `GET/POST /api/memoria` — contexto, busca e preferências por sessão.
- `POST /api/chat`
- `GET /api/chat/stream?message=&effort=medium` — SSE token a token; `effort` aceita `low`, `medium` e `high`.
- `POST /api/rag`
- `GET /api/plugins`
- `GET /api/modelos`
- `GET /api/modelos/descobertos`
- `GET /api/saude`
- `GET /api/desempenho`
- `GET /api/confiabilidade`
- `GET /api/gateway/status`
- `POST /api/gateway/recuperar`
- `GET/POST /api/avaliacao`
- `GET /api/arquitetura`

### SSE de chat

`GET /api/chat/stream` envia objetos JSON em eventos `data:`:

- `response.created` — conexão e rota criadas;
- `tool.start`, `tool.progress` e `tool.end` — execução de ferramentas, quando houver;
- `response.in_progress` — `inicio: true`, fontes, ferramentas, imagens e capacidades;
- `response.output_text.delta` — fragmento de texto em `token`;
- `response.completed` — `done: true`, texto final e sucesso;
- `error` — falha em `erro`.

Os campos legados `inicio`, `token` e `done` continuam presentes. Contexto de projeto é enviado separadamente em `projetoNome`, `projetoInstrucoes` e `projetoArquivos`; os eventos `response.created` e `response.in_progress` informam `projeto` e `arquivosProjeto`. O cliente cancela por `AbortController`. A reconexão antes do primeiro evento é permitida somente na rota `auto`; rotas explícitas e comandos `confirmar:` não são repetidos automaticamente.

## Mídia e arquivos

- `POST /api/midia` — legado de integração; a interface usa `web/midia/navegador.mjs`.
- `POST /api/documento` — legado de integração; a interface usa pdf.js/Tesseract.js no navegador.
- `GET /api/arquivos`
- `GET /api/arquivos/:nome`
- `GET /api/filmes`
- `GET /api/historico`
- `GET /api/cache`

## Agentes e workers

- `POST /mcp`
- `POST /api/goal/checkpoint` — atualiza concluídos e pendências de uma meta ativa.
- `POST /v1/messages` — compatibilidade Anthropic Messages, streaming, thinking e tool_use.
- `GET /api/token` — token local (loopback).
- `POST /api/token/renovar` — renovação local.
- `GET /api/workers/stream` — SSE combinado.
- `/api/worker-analise/{status,start,stop,stream,eventos}`
- `/api/worker-melhoria/{status,start,stop,stream,eventos}`

## API comercial

- `POST /v1/agent` — agente autenticado por chave `myn_sk_...`, com plano, cota e uso.
- `GET /v1/usage` — consumo da própria chave.
- `GET/POST /api/admin/chaves` — gestão local de chaves.
- `DELETE /api/admin/chaves/:id` — revogação.
- `GET /api/admin/metricas` — métricas locais.
- `/api.html` — painel local.
- `sdk/myn.mjs` — SDK sem dependências.
- `docs/openapi.yaml` — contrato OpenAPI.
- `docs/API_COMERCIAL.md` — guia de integração e cobrança.

## Extensão e modo cliente

- `GET /extensao/myn-recicla-extensao.zip` — download da extensão Chromium.
- `GET /playground.html?extensao=1&vm=1` — Playground embeddable no painel da extensão.
- `web/core/rotas-cliente.mjs` — execução no navegador via API direta, extensão e WebGPU.
- Guia: [`EXTENSAO.md`](EXTENSAO.md).

## Páginas

- `/`
- `/playground.html`
- `/mapeamento.html`
- `/docs/*`

Google/Gemini não fazem parte da API atual.
