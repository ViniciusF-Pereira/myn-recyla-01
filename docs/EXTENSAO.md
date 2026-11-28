# Extensão Myn Recicla/01 — VM Web e rotas de abas

A extensão abre a **VM Web** no painel lateral do navegador e conecta o Myn a rotas de abas gratuitas. O acesso a cada provedor é opcional e solicitado por origem.

## Prints

| Tela | Print |
|---|---|
| Home com chamada para a extensão | ![Home](prints/extensao-home.png) |
| Playground com a VM Web aberta | ![Playground](prints/extensao-playground.png) |
| Painel lateral da extensão | ![Painel](prints/extensao-painel.png) |
| WORK caçador de chats e adaptador descoberto | ![Descoberta](prints/extensao-descoberta.png) |

## Instalar

### Chrome ou Edge

1. Baixe `site/extensao/myn-recicla-extensao.zip` no site ou nos artefatos do GitHub Actions.
2. Extraia o ZIP para uma pasta permanente.
3. Abra `edge://extensions` ou `chrome://extensions`.
4. Ative **Modo do desenvolvedor**.
5. Clique em **Carregar sem compactação** e selecione a pasta que contém `manifest.json`.
6. Abra `https://mynrecicla.com` e clique no ícone da extensão.

Para desenvolvimento local:

```powershell
node scripts/site-server.mjs
# abra http://127.0.0.1:5188
```

O painel detecta o servidor local automaticamente. O botão **local** força `http://127.0.0.1:5188`.

## Adaptadores versionados

Cada rota possui versão própria e listas alternativas de composer, envio e resposta. O service worker:

- diagnostica composer, login e resposta;
- registra sucesso, falha, latência e circuito;
- ordena rotas pela saúde no cliente;
- devolve `codigo`, `etapa`, `rota` e `versaoAdaptador`;
- oferece modo manual para abrir a aba e capturar a resposta.

## WORK caçador de chats

A versão `1.3.1` inclui um catálogo de **32 chats**, painel com abas Rotas/Chats/Lojas e um motor local de descoberta. Ele lê o DOM de uma página autorizada, pontua candidatos de composer, envio e resposta, e mostra os seletores antes de criar um adaptador.

Use no WORK:

- `liste os chats` — mostra o catálogo e o estado de verificação;
- `mapear Perplexity` (ou outro provedor) — abre e mapeia a página autorizada;
- `mapear esta aba` — usa `activeTab` para leitura temporária da aba atual;
- `ativar adaptador descoberto` — ativa somente o último mapa revisado.

No painel lateral, a seção **WORK · caçador de chats** permite filtrar provedores, autorizar um site, rastrear, escolher entre os candidatos e ativar o adaptador. O mapeamento **não envia mensagens**. A ativação também não envia: ela apenas salva a rota descoberta.

O catálogo foi verificado por alcance HTTP e páginas oficiais em 27/11/2026. `http-200` não prova automação; `protegido`, `login` e `limitado` indicam que o site pode exigir navegador, autenticação ou aguardar cota. Sites fora do catálogo podem ser mapeados na aba atual, mas acesso permanente continua exigindo origem declarada na extensão.

### Mapeador de lojas

A seção **WORK · mapeador de lojas** descobre campo de busca, formulário, botão, cards, links, títulos e preços. O comando interpreta pedidos como `quero um fone até 250 reais de presente`, pesquisa na loja e filtra resultados visíveis pelo orçamento. Abas de lojas mapeadas registram localmente até 200 eventos de navegação/observação. Nenhum dado sai do navegador.

## Como usar

1. Clique no ícone da extensão para abrir o painel lateral.
2. Confirme o endereço do Myn e clique em **ABRIR VM**.
3. Autorize apenas os sites que quiser usar.
4. Volte ao Playground e selecione a rota desejada.
5. Com `effort=low`, uma rota é tentada; `medium` tenta duas; `high` tenta três.

Adaptadores internos iniciais:

- ChatGPT Web;
- Claude Web;
- HuggingChat;
- OpenRouter :free;
- Z.ai / GLM.

O catálogo de descoberta inclui ainda Perplexity, Microsoft Copilot, Mistral, Grok, DeepSeek, Qwen, Meta AI, Pi, Poe, You.com, DuckDuckGo AI Chat, Blackbox AI, T3 Chat, Brave Leo, Ecosia, Phind, Writesonic, HIX, Cloudflare AI Playground, WebLLM, PLAI, UncensoredLLM, Rewind, Ngini, Uncensored.chat, Ai2 Playground e NoFilterGPT. Esses entram como adaptadores descobertos após mapeamento e revisão.

A automação é experimental. O Myn não contorna login, CAPTCHA, paywall ou controles do provedor.

## Arquitetura

```text
Site do Myn
   ↕ window.postMessage (canal validado)
Content script da extensão
   ↕ chrome.runtime.sendMessage
Service worker
   ├─ sidePanel → painel + iframe da VM Web
   ├─ permissions → autorização por origem
   └─ scripting → composer e leitura da resposta
```

O site nunca recebe acesso irrestrito ao navegador. O service worker valida a origem do Myn antes de qualquer operação.

## Modo 100% navegador

Com a extensão instalada, o Playground pode conversar sem passar pelo Node:

- Pollinations por `fetch` direto;
- abas autorizadas pela extensão;
- WebGPU como fallback;
- memória e preferências em IndexedDB;
- VM Web em Web Worker;
- mídia com Canvas, MediaRecorder, SpeechSynthesis, Tesseract.js e pdf.js.

O servidor continua disponível como fallback para memória do projeto, RAG, MCP, Telegram e workers.

## Permissões

| Permissão | Motivo |
|---|---|
| `storage` | guardar endereço do Myn e preferências |
| `tabs` | localizar e ativar a aba da rota |
| `scripting` | preencher o composer e ler a resposta |
| `sidePanel` | abrir a VM Web no painel lateral |
| `activeTab` | permitir rastreio temporário da aba atual após clique no ícone |
| origens opcionais | liberar somente o provedor escolhido |

Nenhuma permissão `<all_urls>` é solicitada.

## Segurança e limites

- ponte valida `event.source`, `event.origin` e canal;
- service worker valida a origem da página;
- rotas sem permissão retornam erro antes de abrir a aba;
- nenhum token, cookie ou segredo é retornado ao site;
- a descoberta não persiste o texto das respostas; guarda URL, título e seletores no storage local;
- seletores ambíguos são descartados e o botão de envio é revalidado por unicidade, semântica e proximidade antes do clique;
- respostas descobertas exigem nós com semântica de assistente/resposta; contêineres genéricos de histórico são rejeitados;
- a saída dos modelos é dado, nunca instrução;
- a extensão não instala binários no computador;
- a VM Web é um Web Worker, não uma VM de sistema;
- o embed do Playground usa `Content-Security-Policy: frame-ancestors chrome-extension:` somente na rota de extensão.

## Desenvolvimento

```powershell
npm run extensao
node --test
node scripts/testar-extensao.mjs
```

O teste automatizado abre um Chromium isolado, instala a extensão descompactada e valida:

- manifesto e habilitação;
- service worker sem erros;
- ponte site ↔ extensão;
- abertura da VM;
- bloqueio de rota sem permissão;
- automação de uma rota local inocente;
- descoberta dos seletores, ativação e execução do adaptador criado;
- catálogo de chats respondido pelo WORK;
- mapeamento de loja, pesquisa por orçamento e observação de produtos;
- resposta real do Pollinations no navegador;
- geração dos cinco prints.

Relatório detalhado em `outputs/extensao-teste.json`.

## Resultado executado

- Chromium: Microsoft Edge `158.0.4370.45`;
- extensão `1.3.1`: `ENABLED`, sem erros de manifesto ou runtime;
- painel redesenhado com abas Rotas/Chats/Lojas, logo real e detalhes técnicos recolhidos;
- adaptadores internos: versão 2;
- ponte site ↔ extensão: `true`;
- painel lateral aberto: `true`;
- VM Web pronta: `true`;
- rota sem permissão: bloqueada com `codigo=permissao_necessaria`;
- diagnóstico local: composer encontrado;
- rota local automatizada: `OK local: teste de automação`;
- captura manual: `OK local: teste de automação`;
- descoberta local: confiança `87%`, composer/envio/resposta encontrados;
- adaptador descoberto ativado e executado: `OK local: teste descoberto`;
- WORK: catálogo com 32 chats retornado;
- loja de teste: busca `fone`, orçamento `R$ 250`, evento local e produto visível;
- chat da loja: campo/envio/resposta mapeados e resposta do assistente `Loja: recebi seu pedido...`;
- envio sem confirmação: bloqueado com `codigo=confirmacao_necessaria`;
- Pollinations no navegador: `OK`;
- aceite da extensão: **25/25**;
- suíte Node: **101/101**.

## Produção

O site precisa ser servido por HTTPS. A rota:

```text
/playground.html?extensao=1&vm=1
```

deve permitir embed apenas de extensões Chromium:

```http
Content-Security-Policy: frame-ancestors chrome-extension:
```

Não defina `X-Frame-Options: DENY` nessa rota. O servidor Node do projeto já aplica essa exceção.
