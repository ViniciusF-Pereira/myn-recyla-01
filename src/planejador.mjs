/** Planejador: objetivo → plano de passos executáveis. Usa a própria API rápida; fallback determinístico. */
import { respostaRapida } from './stream.mjs';
import { carregarMapaModelos } from './orquestrar-modelos.mjs';

const ACOES = ['rota', 'plugin', 'midia', 'documento', 'saude', 'docs', 'teste'];

function planoBase(objetivo) {
  return [
    { n: 1, acao: 'saude', alvo: 'todas', entrada: 'medir latência e sucesso das rotas', criterio: 'scoreboard atualizado' },
    { n: 2, acao: 'plugin', alvo: 'pollinations-text-api', entrada: objetivo, criterio: 'resposta válida' },
    { n: 3, acao: 'docs', alvo: 'docs/AGENTES_E_MODELOS.md', entrada: 'registrar modelos e limites observados', criterio: 'documento atualizado' },
    { n: 4, acao: 'teste', alvo: 'smoke', entrada: 'verificar endpoints', criterio: '200 nas rotas' },
  ];
}

export async function planejar(objetivo, { maxPassos = 6, historico = '' } = {}) {
  const mapa = await carregarMapaModelos();
  const nomes = mapa.slice(0, 12).map((r) => r.id).join(', ');
  const prompt = 'Você é o planejador do Myn Recicla/01. Objetivo: ' + String(objetivo).slice(0, 1200)
    + '\nRotas disponíveis: ' + nomes
    + '\nAções permitidas: ' + ACOES.join(', ')
    + (historico ? '\nHISTÓRICO E CHECKPOINT (não repita concluídos; priorize pendentes e falhas):\n' + String(historico).slice(0, 1800) : '')
    + '\nResponda SOMENTE JSON: {"passos":[{"acao":"...","alvo":"...","entrada":"...","criterio":"..."}]} máximo ' + maxPassos + '. Sem texto fora do JSON.';
  const r = await respostaRapida(prompt, 9000);
  let passos = planoBase(objetivo);
  if (r.ok) {
    try {
      const json = JSON.parse(String(r.texto).replace(/```json|```/g, '').trim());
      const candidatos = (json.passos || []).filter((p) => ACOES.includes(p.acao)).slice(0, maxPassos);
      if (candidatos.length) passos = candidatos;
    } catch { /* usa o plano base */ }
  }
  return { objetivo: String(objetivo).slice(0, 1200), via: r.ok ? r.via : 'deterministico', passos: passos.map((p, i) => ({ n: i + 1, ...p })) };
}
