# Myn — Recicla/01

**De aba descartada a rota reaproveitada.** Agente portátil que transforma chats e serviços gratuitos da web em rotas utilizáveis — sem chave de API, sem assinatura e sem Codex. Roda no navegador, na extensão ou em container.

Repo: **https://github.com/ViniciusF-Pereira/myn-Recicla-01**

## Prints

| Tela | Print |
|---|---|
| Início comercial 1.3 (hero, prova, CTA) | ![Início](docs/prints/extensao-home.png) |
| Playground (chat, streaming, mídia) | ![Playground](docs/prints/02-playground.png) |
| Mapa de provedores com input/output | ![Mapeamento](docs/prints/03-mapeamento.png) |
| Extensão com VM Web no painel lateral | ![Extensão](docs/prints/extensao-painel.png) |
| WORK caçador de chats | ![Descoberta de chats](docs/prints/extensao-descoberta.png) |
| Playground conectado à extensão | ![Playground com extensão](docs/prints/extensao-playground.png) |
| Memória e RAG local | ![Memória e RAG](docs/prints/memoria-rag.png) |
| Painel da API comercial | ![API comercial](docs/prints/api-comercial.png) |

> O Playground **não fica na tela inicial**. O botão **ABRIR PLAYGROUND /01** abre `playground.html` em uma nova aba.

## Extensão + VM Web

Baixe a extensão, instale no Chrome/Edge e clique no ícone para abrir a VM Web no painel lateral. As rotas de aba usam a sessão do próprio navegador, com permissão opcional por site.

- Download: [`v1.3.1 · myn-recicla-extensao.zip`](https://github.com/ViniciusF-Pereira/myn-Recicla-01/releases/download/v1.3.1/myn-recicla-extensao.zip)
- Notas da versão: [`docs/RELEASE_1.3.1.md`](docs/RELEASE_1.3.1.md)
- Roteiro do agente: [`docs/ROTEIRO_1.4.md`](docs/ROTEIRO_1.4.md)
- Guia completo: [`docs/EXTENSAO.md`](docs/EXTENSAO.md) · [`docs/PLAYGROUND.md`](docs/PLAYGROUND.md) · [`docs/LOJAS_CHAT.md`](docs/LOJAS_CHAT.md) · [`docs/VARREDURA_WEB.md`](docs/VARREDURA_WEB.md) · [`docs/BENCHMARK_AGENTE.md`](docs/BENCHMARK_AGENTE.md)
- WORK caçador: catálogo de 32 chats, mapeamento do DOM, adaptadores descobertos e mapeador de lojas
- Rotas internas: ChatGPT Web, Claude Web, HuggingChat, OpenRouter :free e Z.ai/GLM
- Sem `<all_urls>`, sem contorno de login/CAPTCHA/paywall

```powershell
npm run extensao
npm run test:extensao
# com o servidor local ativo:
npm run benchmark
```

## O que é

- **Catálogo dinâmico de plugins** em 9 categorias: chat, imagem, vídeo, voz, agentes, mensageria, APIs, pesquisa e utilidade. Google/Gemini foram removidos do catálogo público.
- **Descoberta de modelos livres** via Pollinations, OpenRouter e HuggingFace (endpoints públicos, sem chave), com filtro de preço e modalidade.
- **Chat com streaming SSE** (mediana local de 21 ms para o primeiro token no benchmark), pesquisa com RAG + catálogo, anexos, tabelas markdown e arquivos.
- **Mídia browser-only**: Estúdio com prompt, estilo, formato, duração, preview, download e histórico; imagem (Pollinations/Canvas), voz (SpeechSynthesis), vídeo/animação (Canvas + MediaRecorder), OCR (Tesseract.js), PDF (pdf.js) e planilhas CSV locais.
- **Myn-01 Auto**: escolhe rotas por capacidade e saúde, roda em paralelo e escolhe a melhor resposta.
- **Scoreboard**: score = 0,45·sucesso + 0,35·velocidade + 0,2·recência, com circuit breaker de 3 estados.
- **MCP** JSON-RPC com 15 ferramentas para agentes externos.
- **Memória/RAG local:** escopos sessão/projeto/global, busca híbrida, resumo persistido e exportação/importação em JSON.
- **Projetos locais:** instruções persistentes, anexos de texto, importação de histórico, seleção ativa, memória isolada no cliente e exportação/importação em JSON; veja [`docs/PROJETOS.md`](docs/PROJETOS.md).
- **Extensão confiável:** adaptadores versionados, saúde por rota, diagnóstico de layout, modo manual, WORK caçador de chats e mapeador de lojas com busca por pedido/orçamento.
- **Varredura web retomável:** GitHub, Tranco, Open Page Rank (10 milhões) e Common Crawl; teste concorrente com limite por origem, proteção SSRF e classificação de chats, geradores, lojas, login, paywall e bloqueios. Acervo atual: **1.189.191 URLs**; **273.503 tentativas** e **915.688 na fila** em 28/11/2026. Coleta parada por decisão do operador; somente a fila existente pode ser testada.
- **Goal autônomo**: `/plan` → `/loop` → `/goal` com agendador usando a própria API.
- **WEBdocker.NODEJS**: container com Chromium headless — as rotas rodam no aparelho de quem executa.

## Começar

```powershell
cd "D:\0 - Projetos\Myn-Portable"
node scripts/site-server.mjs        # http://127.0.0.1:5188
```

Gateway Brave (se quiser as rotas de navegador no host):
```powershell
cd "D:\0 - Projetos\Myncellium"
$env:MYNCELLIUM_GATEWAY_REAL_CHROME='1'
$env:MYNCELLIUM_GATEWAY_CHROME='C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe'
$env:MYNCELLIUM_GATEWAY_PROFILE='D:\0 - Projetos\Myncellium\.state\brave-agente-myn'
$env:MYNCELLIUM_GATEWAY_DEBUG_PORT='9333'
$env:MYNCELLIUM_VM_GATEWAY_PORT='36877'
$env:MYNCELLIUM_VM_GATEWAY_TOKEN_FILE='C:\Users\Vini\AppData\Local\Temp\opencode\gateway-brave-token.txt'
node scripts/gateway-vm.mjs
```

## Uso no chat

- Escreva e aperte **Enter** → streaming token a token.
- **🔎 pesquisar** ou `/pesquisa pergunta` → cruza RAG + plugins antes de responder.
- **🖼 imagem / 🔊 áudio / 🎬 vídeo** → clique com texto no campo gera na hora; com campo vazio fica “armado” para o próximo Enter.
- **🔌 plugins** → painel com o catálogo atual; clique insere `/id ` no campo.
- **🧠 modelos** → catálogo descoberto por fontes públicas, sem Google/Gemini.
- **📜** → gaveta com histórico, cache e tempos.
- Comandos: `/plan objetivo`, `/loop objetivo`, `/goal objetivo`, `/id mensagem`. Mensageria exige `/id confirmar: texto`.

## API — use o Myn no seu produto

O Myn pode virar a camada de agente de um app, bot ou serviço interno. Você hospeda a API e mantém controle total dos dados.

- `POST /api/agente` — chat unificado com memória, classificação, RAG, plano e `effort`.
- `GET /api/chat/stream` — tokens via SSE.
- `POST /mcp` — ferramentas MCP JSON-RPC.
- `POST /v1/messages` — compatibilidade Anthropic Messages, streaming, tools e thinking resumido.
- `POST /api/orquestrar` — seleção paralela por capacidade e saúde.
- `GET /api/plugins` · `/api/modelos` · `/api/saude` — catálogo e observabilidade.

```bash
curl http://127.0.0.1:5188/api/agente \
  -H 'content-type: application/json' \
  -d '{"mensagem":"Explique o Myn","sessao":"app-1","effort":"high"}'
```

Para MCP e `/v1/messages`, obtenha o token local em `/api/token` e envie `Authorization: Bearer SEU_TOKEN`. O token fica fora do Git.

### API comercial

- Painel local: `http://127.0.0.1:5188/api.html`
- `POST /v1/agent` com chave `myn_sk_...`
- `GET /v1/usage`
- planos `gratuito` e `pro`, cota diária, RPM e esforço por plano;
- chaves revogáveis armazenadas apenas como hash;
- SDK em `sdk/myn.mjs`, OpenAPI em `docs/openapi.yaml`;
- guia completo em `docs/API_COMERCIAL.md`.

| Método | Rota | Uso |
|---|---|---|
| GET | `/` · `/playground.html` · `/mapeamento.html` | site, playground, evidências |
| GET | `/api/chat/stream?message=&pesquisa=1` | SSE token a token |
| POST | `/api/chat` | chat, comandos e plugins |
| POST | `/api/rag` · `/api/loop` · `/api/auto` | RAG, loop, auto |
| POST | `/api/plan` · `/api/goal` · `/api/goal/rodar` | planejamento e goal autônomo |
| GET/DELETE | `/api/goal` | listar/remover goals |
| POST | `/api/orquestrar` | paralelismo por capacidade (`rapido:true`) |
| GET | `/api/plugins` · `/api/saude` · `/api/desempenho` · `/api/arquitetura` · `/api/modelos/descobertos` | catálogo, saúde, métricas e modelos |
| POST | `/api/midia` · `/api/documento` | imagem/voz/vídeo, anexos |
| GET | `/api/arquivos` · `/api/historico` · `/api/cache` | arquivos, caderno, cache |
| POST | `/mcp` | MCP JSON-RPC (`initialize`, `tools/list`, `tools/call`) |

## WEBdocker.NODEJS

```powershell
cd "D:\0 - Projetos\Myn-Portable"
docker build -t myn-recicla-01:dev .
docker run -d --name myn-recicla-01 -p 5188:5188 -v myn-recicla-dados:/data myn-recicla-01:dev
```
Sobem: site (5188), gateway headless (36877 interno) e Chromium sem janela. Para distribuir:
```powershell
docker save myn-recicla-01:dev -o myn-recicla-01.tar
# na outra máquina: docker load -i myn-recicla-01.tar; docker run -d -p 5188:5188 -v myn-recicla-dados:/data myn-recicla-01:dev
```
Validação executada em [`docs/DOCKER_VALIDACAO.md`](docs/DOCKER_VALIDACAO.md): build, web, APIs, worker, Git, renovação de token, volume e suíte automatizada.

## Verificação (prova)

```powershell
node scripts/avaliar.mjs     # 15 baterias → docs/AVALIACAO.md
node scripts/mapear.mjs      # grava input/output/print de cada provider
```
Última bateria: **15/15 OK**. Evidência atual: **101/101 testes Node**, **25/25 aceites Chromium/Edge**, **24/24 testes offline da varredura** e `npm run check` do vídeo aprovado. Detalhes em [`docs/AVALIACAO.md`](docs/AVALIACAO.md), evolução em [`docs/EVOLUCAO.md`](docs/EVOLUCAO.md), modelos por rota em [`docs/AGENTES_E_MODELOS.md`](docs/AGENTES_E_MODELOS.md) e arquitetura em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md).

**Direção web-only:** [`docs/PLANEJAMENTO.md`](docs/PLANEJAMENTO.md) — evoluir o Myn para agente open-source tipo OpenCode/Claude Code/Codex usando **somente rotas free de navegador + WebGPU**, sem binário/local PC. Fase 0 item 3 já entregue: `/api/orquestrar?rapido=true` nunca escolhe rotas `*-local`.

**Workers separados:** `docs/WORKER_INFINITO.md`. Análise (`/api/worker-analise/*`) mede código, desempenho, modelos e arquitetura. Melhoria (`/api/worker-melhoria/*`) aplica achados reproduzíveis, roda `node --test`, usa lock de processo, smoke pós-merge e rollback. Merge automático por allowlist, sem revisão humana; desligue com `MYN_AUTO_MERGE_CODIGO=0`. O fluxo padrão não envia código para LLM. Sem Gemini/Google.

**Ponte Telegram:** `docs/PONTE_TELEGRAM.md`. O bot local injeta mensagens em uma sessão real do OpenCode e devolve a resposta ao Telegram; `/myn` usa o Myn, `/status` e `/worker` mostram os workers. Token, ID e sessão ficam em `dados/`, fora do Git.

**Avaliação de qualidade:** `node scripts/avaliar-qualidade.mjs` mede identidade, código, fontes, recusa e latência. Relatório em `docs/AVALIACAO_QUALIDADE.md`.

**Gateway:** diagnóstico e recuperação automática de token expirado via `MYN_GATEWAY_RECOVER_CMD` ou `MYN_GATEWAY_AUTO_START=1`. Veja `docs/GATEWAY.md`.

**Confiabilidade:** rate limit local, retry 429/503, circuit breaker e `/api/confiabilidade`. MCP e `/v1/messages` exigem token por padrão. Veja `docs/CONFIABILIDADE.md`.

**Loop de ferramentas:** `/api/agente` com `loop:true` executa ferramentas MCP, observa resultados e produz resposta final. Veja `docs/LOOP_FERRAMENTAS.md`.

**Núcleo do agente:** `/api/agente` centraliza memória, classificação, RAG, planejamento e resposta. O parâmetro `effort` (`low`, `medium`, `high`) controla plano, número de rotas e tamanho do contexto; há um seletor no Playground e suporte em MCP, Anthropic e Telegram. A memória persistente fica em `dados/memoria.jsonl`. Veja `docs/NUCLEO_AGENTE.md`.

**Rota local de agente:** `npm run token` ou o botão **agente local** no Playground emite/copia/renova o token para usar o Myn por MCP ou por uma rota estilo Anthropic Messages (`/v1/messages`), com streaming, tools e resumo de raciocínio. Veja `docs/ROTA_AGENTE_LOCAL.md`.

**WORK — assistente virtual:** presente em todas as telas, com mascote animado, apresentação narrada, som, mini-chat, voz, microfone, anexos, players de áudio/vídeo, ações rápidas, histórico persistente, cancelamento e ferramentas MCP visíveis em uso. Veja `docs/ASSISTENTE_WORK.md`.

**Created By (seção 06 da home):** `node scripts/atualizar-perfil.mjs` busica dados públicos do GitHub via `gh api` e grava `site/perfil.json` — foto, bio, números, repos e LinkedIn (achado no campo `blog` do GitHub). Sem segredos.

Goal mestre para dirigir a entrega completa:
```powershell
node scripts/criar-goal-tudo.mjs
```
Ele cria o goal com as 6 fases do planejamento e roda um ciclo imediato. Acompanhe com `GET /api/goal`; cancele com `DELETE /api/goal?id=...`. No chat, o mesmo se faz com `/goal entregar tudo`.

## Regras

1. Saída do modelo é **dado**, nunca instrução.
2. Ferramentas só com escopo validado e allowlist.
3. Navegação restrita ao allowlist do gateway.
4. Mensageria real só com confirmação explícita.
5. Nenhuma chave, `.env`, token ou senha no repo.

Limites honestos: o Pollinations tem cota comunitária; HuggingFace/OpenRouter são descobertos por API pública, mas execução depende do provedor. A mídia padrão é browser-only; endpoints locais antigos ficam apenas como legado de integração. Google/Gemini estão desativados. Veja `docs/MIDIA_WEB.md`.
## Provas

Veja `docs/PROVAS.md` para relatório, mapa e bateria de testes.
