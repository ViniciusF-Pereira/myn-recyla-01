# Playground — guia rápido

## Chat

- Escolha **Myn-01 Auto** ou fixe uma rota.
- `effort low` tenta uma rota; `medium`, duas; `high`, três com planejamento.
- O botão **■** ao lado de ENVIAR cancela a operação em andamento.
- Se a conexão SSE cair antes do primeiro evento em uma rota automática, o cliente tenta uma reconexão. Rotas explícitas e comandos confirmados não são repetidos automaticamente.
- O stream mostra intenção, ferramentas, fontes e progresso antes/durante a resposta.

## Estúdio de mídia

Abra pelos botões **Imagem**, **Áudio** ou **Vídeo**.

- **Prompt:** descreva o resultado.
- **Estilo:** editorial, minimalista, vibrante, retrô ou fotorrealista.
- **Formato:** quadrado, retrato ou paisagem.
- **Duração:** 3, 6 ou 10 segundos para vídeo.
- **Preview:** o resultado aparece sem sair do chat.
- **Baixar:** imagem PNG ou vídeo WebM.
- **Histórico:** as últimas 8 criações da sessão podem ser reabertas.

A imagem usa Pollinations quando disponível e cai para Canvas local. O vídeo é animação Canvas/MediaRecorder. Áudio usa SpeechSynthesis; gravar arquivo de voz pode exigir permissão de compartilhamento.

## Projetos locais

Clique em **PROJETOS** para criar ou selecionar um projeto. Cada projeto tem nome, instruções, anexos de texto e memória isolada no cliente. O projeto ativo aparece no chip do chat.

- **ANEXAR ARQUIVO** adiciona arquivos de texto ao projeto.
- **IMPORTAR HISTÓRICO** copia memórias locais e conversas do servidor, filtrando ruído e duplicatas.
- **LIMPAR HISTÓRICO** remove somente os registros importados e preserva conversas novas.
- **EXPORTAR** e **IMPORTAR** levam projetos e arquivos em JSON.

Projeto, instruções e arquivos são enviados separadamente no SSE. Guia completo: [`PROJETOS.md`](PROJETOS.md).

## Planilhas

Peça, por exemplo: `gere uma planilha de alertas de sinais de wifi públicos`.

O Myn gera um CSV local com preview e download. O navegador não varre redes Wi-Fi; a planilha é um modelo com exemplos identificados para substituir por medições reais.

## Pesquisa e tools

O orientador reconhece intenções de pesquisa, RAG, planilha, imagem, vídeo, áudio, arquivos e memória. O widget explica quais ferramentas serão usadas. Pesquisas sobre o próprio projeto usam RAG local e citam os arquivos encontrados.

## Mais ferramentas

O bloco **Mais ferramentas** reúne imagem+, filmes, modelos, VM, agentes, worker e agente local para manter o composer principal limpo.

## Limites

- Nenhuma rota contorna login, CAPTCHA ou paywall.
- Pollinations e serviços externos podem ter cota.
- Vídeo/animação saem em WebM.
- Resultados de pesquisa externa dependem da rota disponível.
