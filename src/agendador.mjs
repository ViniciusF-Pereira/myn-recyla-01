/** Agendador de agentes autônomos: /plan → /loop → /goal, executando a própria API do Myn. */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { planejar } from './planejador.mjs';
import { respostaRapida } from './stream.mjs';
import { orquestrar } from './orquestrar-modelos.mjs';
import { appendFile } from 'node:fs/promises';

const ARQ = process.env.MYN_AGENDAS || path.join(process.env.MYN_DADOS || path.join(process.cwd(), 'dados'), 'agendamentos.json');
const BASE = process.env.MYN_API_BASE || 'http://127.0.0.1:5188';
let goals = [];
try { goals = JSON.parse(await readFile(ARQ, 'utf8')); } catch { goals = []; }
const timers = new Map();

async function salvar() { await writeFile(ARQ, JSON.stringify(goals, null, 2)).catch(() => {}); }
function avaliar(texto) {
  const s = String(texto || '');
  return !/não consegui|nao consegui|não responderam|sem resposta|tente de novo|falha|erro|sorry|can't help/i.test(s);
}

const uid = () => 'goal-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

async function api(caminho, corpo) {
  const r = await fetch(BASE + caminho, {
    method: corpo === undefined ? 'GET' : 'POST',
    headers: corpo === undefined ? {} : { 'content-type': 'application/json' },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
    signal: AbortSignal.timeout(180000),
  });
  const texto = await r.text();
  try { return { status: r.status, dados: JSON.parse(texto) }; } catch { return { status: r.status, dados: { texto: texto.slice(0, 500) } }; }
}

async function executarPasso(passo, objetivo) {
  const inicio = Date.now();
  try {
    switch (passo.acao) {
      case 'saude': {
        const r = await api('/api/saude');
        return { ok: r.status === 200, detalhe: 'scoreboard: ' + (r.dados.rotas?.length || 0) + ' rotas', ms: Date.now() - inicio };
      }
      case 'plugin': {
        const id = passo.alvo || 'pollinations-text-api';
        const rapido = ['pollinations-text-api', 'pollinations-image-api', 'image-local', 'voice-local', 'video-local'].includes(id);
        let texto = '';
        if (rapido) {
          const r = await respostaRapida(passo.entrada || objetivo, 9000);
          texto = r.ok ? r.texto : '';
          if (!texto) return { ok: false, detalhe: 'API rápida indisponível', ms: Date.now() - inicio };
          return { ok: true, detalhe: texto.replace(/\s+/g, ' ').slice(0, 200), ms: Date.now() - inicio };
        }
        return { ok: false, status: 'skipped', detalhe: 'pulado: rota browser não usada em goal autônomo (use /loop)', ms: Date.now() - inicio };
      }
      case 'rota': {
        const r = await api('/api/orquestrar', { tarefa: passo.entrada || objetivo, max: 2, rapido: true });
        return { ok: r.status === 200 && avaliar(r.dados.vencedor?.resposta || ''), detalhe: 'vencedor: ' + (r.dados.vencedor?.rota || 'nenhum'), ms: Date.now() - inicio };
      }
      case 'midia': {
        const r = await api('/api/midia', { tipo: passo.alvo || 'imagem', prompt: passo.entrada || objetivo, segundos: 5 });
        return { ok: r.status === 200, detalhe: r.dados.url || r.dados.error, ms: Date.now() - inicio };
      }
      case 'teste': {
        const r = await api('/api/plugins');
        return { ok: r.status === 200 && r.dados.total > 0, detalhe: 'plugins: ' + r.dados.total, ms: Date.now() - inicio };
      }
      case 'documento':
      case 'docs': {
        const linha = '- ' + new Date().toISOString() + ' · ' + String(passo.entrada || objetivo).slice(0, 140) + '\n';
        await appendFile(path.join(process.cwd(), 'docs', 'EVOLUCAO.md'), linha).catch(() => {});
        return { ok: true, detalhe: 'registrado em docs/EVOLUCAO.md', ms: Date.now() - inicio };
      }
      default:
        return { ok: false, detalhe: 'ação desconhecida: ' + passo.acao, ms: Date.now() - inicio };
    }
  } catch (e) { return { ok: false, detalhe: String(e.message).slice(0, 160), ms: Date.now() - inicio }; }
}

export function contextoHistoricoGoal(goal = {}) {
  const execucoes = (goal.execucoes || []).slice(-3);
  const linhas = execucoes.map((e) => {
    const concluidos = (e.passos || []).filter((p) => p.ok).map((p) => p.acao + ':' + (p.alvo || '')).join(', ') || 'nenhum';
    const pendentes = (e.passos || []).filter((p) => !p.ok).map((p) => p.acao + ':' + (p.alvo || '') + ' (' + (p.detalhe || 'falhou') + ')').join(', ') || 'nenhum';
    return '- ' + e.em + ': concluídos=' + concluidos + '; pendentes=' + pendentes;
  });
  if (goal.checkpoint?.pendentes?.length) linhas.push('- checkpoint: pendentes=' + goal.checkpoint.pendentes.join(', '));
  return linhas.join('\n');
}

/** Executa um ciclo completo planejado. */
export async function executarCiclo(goal) {
  const inicio = Date.now();
  const plano = await planejar(goal.objetivo, { maxPassos: goal.maxPassos || 4, historico: contextoHistoricoGoal(goal) });
  const passos = [];
  for (const passo of plano.passos) passos.push({ ...passo, ...(await executarPasso(passo, goal.objetivo)) });
  const sucessos = passos.filter((p) => p.ok).length;
  const registro = { em: new Date().toISOString(), objetivo: goal.objetivo, via: plano.via, sucessos, total: passos.length, ms: Date.now() - inicio, passos };
  goal.execucoes = (goal.execucoes || []).concat(registro).slice(-20);
  goal.ultimaExecucao = registro.em;
  goal.checkpoint = {
    atualizadoEm: registro.em,
    concluidos: passos.filter((p) => p.ok).map((p) => p.acao + ':' + (p.alvo || '')),
    pendentes: passos.filter((p) => !p.ok).map((p) => p.acao + ':' + (p.alvo || '') + ' — ' + (p.detalhe || 'falhou')),
  };
  await salvar();
  return registro;
}

export function listar() { return goals.map((g) => ({ ...g, executos: (g.execucoes || []).length })); }
export function buscar(id) { return goals.find((g) => g.id === id); }

export async function atualizarCheckpoint(id, checkpoint = {}) {
  const goal = buscar(id);
  if (!goal) return false;
  const limpar = (lista) => Array.isArray(lista) ? lista.map((x) => String(x || '').slice(0, 300)).filter(Boolean).slice(0, 50) : [];
  goal.checkpoint = {
    atualizadoEm: new Date().toISOString(),
    concluidos: limpar(checkpoint.concluidos),
    pendentes: limpar(checkpoint.pendentes),
  };
  await salvar();
  return true;
}

export async function criar({ objetivo, intervaloMs = 300000, maxExecucoes = 10, maxPassos = 4, executarAgora = true }) {
  if (!objetivo || String(objetivo).length > 2000) throw new Error('objetivo inválido');
  const g = { id: uid(), objetivo: String(objetivo), intervaloMs: Math.max(60000, Number(intervaloMs) || 300000), maxExecucoes: Math.min(100, Number(maxExecucoes) || 10), maxPassos: Math.min(6, Number(maxPassos) || 4), criadoEm: new Date().toISOString(), ativo: true, execucoes: [] };
  goals.push(g); await salvar();
  if (executarAgora) await executarCiclo(g);
  agendar(g);
  return g;
}

export async function remover(id) {
  const i = goals.findIndex((g) => g.id === id);
  if (i < 0) return false;
  const t = timers.get(id); if (t) { clearInterval(t); timers.delete(id); }
  goals[i].ativo = false; await salvar();
  return true;
}

function agendar(g) {
  if (!g.ativo || timers.has(g.id)) return;
  const t = setInterval(async () => {
    const atual = buscar(g.id);
    if (!atual || !atual.ativo) { clearInterval(t); timers.delete(g.id); return; }
    if ((atual.execucoes || []).length >= atual.maxExecucoes) { atual.ativo = false; await salvar(); clearInterval(t); timers.delete(g.id); return; }
    await executarCiclo(atual);
  }, g.intervaloMs);
  timers.set(g.id, t);
}
export function retomar() { goals.filter((g) => g.ativo).forEach(agendar); }
retomar();
