import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

test('goal monta contexto com conclusões, falhas e checkpoint', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'myn-goal-'));
  process.env.MYN_AGENDAS = path.join(dir, 'agendamentos.json');
  process.env.MYN_DADOS = dir;
  try {
    const { contextoHistoricoGoal, criar, atualizarCheckpoint, remover, buscar } = await import('../src/agendador.mjs');
    const texto = contextoHistoricoGoal({
      execucoes: [{
        em: '2026-11-28T10:00:00Z',
        passos: [
          { acao: 'docs', alvo: 'projetos', ok: true },
          { acao: 'plugin', alvo: 'rota-externa', ok: false, detalhe: 'rota indisponível' },
        ],
      }],
      checkpoint: { pendentes: ['plugin:rota-externa — rota indisponível'] },
    });
    assert.match(texto, /concluídos=docs:projetos/);
    assert.match(texto, /pendentes=plugin:rota-externa/);
    assert.match(texto, /rota indisponível/);
    assert.match(texto, /checkpoint/);
    const goal = await criar({ objetivo: 'meta de teste', intervaloMs: 60000, executarAgora: false });
    assert.equal(await atualizarCheckpoint(goal.id, { concluidos: ['F2:projetos'], pendentes: ['F2:versionamento'] }), true);
    assert.deepEqual(buscar(goal.id).checkpoint.concluidos, ['F2:projetos']);
    assert.deepEqual(buscar(goal.id).checkpoint.pendentes, ['F2:versionamento']);
    await remover(goal.id);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
