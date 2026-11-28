import test from 'node:test';
import assert from 'node:assert/strict';
import { criarProjetos } from '../web/core/projetos.mjs';

function repoFake() {
  const dados = new Map();
  return {
    dados,
    async inserir(tabela, valor) { assert.equal(tabela, 'sessoes'); dados.set(valor.id, { ...valor }); return valor.id; },
    async obter(tabela, id) { assert.equal(tabela, 'sessoes'); return dados.get(id) || null; },
    async listar(tabela, limite = 100) { assert.equal(tabela, 'sessoes'); return [...dados.values()].sort((a, b) => a.t - b.t).slice(-limite); },
    async remover(tabela, id) { assert.equal(tabela, 'sessoes'); return dados.delete(id); },
  };
}

test('projetos são criados, atualizados e isolados por id', async () => {
  const projetos = criarProjetos(repoFake());
  const primeiro = await projetos.criar({ nome: 'Myn 1.4', instrucoes: 'Responder em português.' });
  const segundo = await projetos.criar({ nome: 'Outro projeto', instrucoes: 'Focar em evidências.' });
  assert.notEqual(primeiro.id, segundo.id);
  assert.match(primeiro.id, /^proj:/);
  const atualizado = await projetos.atualizar(primeiro.id, { instrucoes: 'Sempre citar fontes.' });
  assert.equal(atualizado.nome, 'Myn 1.4');
  assert.equal(atualizado.instrucoes, 'Sempre citar fontes.');
  assert.equal((await projetos.obter(segundo.id)).instrucoes, 'Focar em evidências.');
  assert.equal((await projetos.listar()).length, 2);
});

test('projetos rejeitam nome vazio e limite de instruções', async () => {
  const projetos = criarProjetos(repoFake());
  await assert.rejects(() => projetos.criar({ nome: '   ' }), /nome do projeto/);
  const projeto = await projetos.criar({ nome: 'Válido', instrucoes: 'x'.repeat(7000) });
  assert.equal(projeto.instrucoes.length, 6000);
});

test('exportação e importação preservam projetos sem misturar registros', async () => {
  const origem = criarProjetos(repoFake());
  await origem.criar({ nome: 'Alpha', instrucoes: 'Regras do Alpha.' });
  await origem.criar({ nome: 'Beta', instrucoes: 'Regras do Beta.' });
  const json = await origem.exportar();
  const destino = criarProjetos(repoFake());
  assert.equal(await destino.importar(json), 2);
  const lista = await destino.listar();
  assert.deepEqual(lista.map((p) => p.nome).sort(), ['Alpha', 'Beta']);
  assert.equal((await destino.obter(lista[0].id)).tipo, 'projeto');
});

test('importação substitui id inseguro por id local válido', async () => {
  const projetos = criarProjetos(repoFake());
  const n = await projetos.importar({ _myn: 'myn-projetos', projetos: [{ id: 'proj:<script>', nome: 'Seguro', instrucoes: 'ok' }] });
  assert.equal(n, 1);
  const lista = await projetos.listar();
  assert.match(lista[0].id, /^proj:[a-zA-Z0-9_-]+$/);
});

test('remoção de projeto não apaga memória de sessão', async () => {
  const repo = repoFake();
  repo.dados.set('mem:1', { id: 'mem:1', tipo: 'memoria', texto: 'não apagar' });
  const projetos = criarProjetos(repo);
  const projeto = await projetos.criar({ nome: 'Temporário' });
  assert.equal(await projetos.remover(projeto.id), true);
  assert.equal(await projetos.obter(projeto.id), null);
  assert.equal(repo.dados.get('mem:1').texto, 'não apagar');
});
