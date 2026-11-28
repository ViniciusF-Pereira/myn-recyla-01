import test from 'node:test';
import assert from 'node:assert/strict';
import { criarProjetos } from '../web/core/projetos.mjs';

function repoFake() {
  const tabelas = { sessoes: new Map(), arquivos: new Map(), eventos: new Map() };
  return {
    tabelas,
    async inserir(tabela, valor) { assert.ok(tabelas[tabela]); tabelas[tabela].set(valor.id, { ...valor }); return valor.id; },
    async obter(tabela, id) { assert.ok(tabelas[tabela]); return tabelas[tabela].get(id) || null; },
    async listar(tabela, limite = 100) { assert.ok(tabelas[tabela]); return [...tabelas[tabela].values()].sort((a, b) => a.t - b.t).slice(-limite); },
    async remover(tabela, id) { assert.ok(tabelas[tabela]); return tabelas[tabela].delete(id); },
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

test('arquivos de texto ficam anexados e isolados por projeto', async () => {
  const projetos = criarProjetos(repoFake());
  const alpha = await projetos.criar({ nome: 'Alpha' });
  const beta = await projetos.criar({ nome: 'Beta' });
  const arquivo = await projetos.anexarArquivo(alpha.id, { nome: 'regras.md', texto: '# Regras\nCitar fontes.' });
  assert.match(arquivo.id, /^arq:/);
  assert.equal((await projetos.listarArquivos(alpha.id)).length, 1);
  assert.equal((await projetos.listarArquivos(beta.id)).length, 0);
  await assert.rejects(() => projetos.anexarArquivo(alpha.id, { nome: 'grande.txt', texto: 'x'.repeat(250001) }), /250 mil/);
  assert.equal(await projetos.removerArquivo(alpha.id, arquivo.id), true);
  assert.equal((await projetos.listarArquivos(alpha.id)).length, 0);
});

test('exportação e importação preservam projetos e arquivos', async () => {
  const origem = criarProjetos(repoFake());
  const alpha = await origem.criar({ nome: 'Alpha', instrucoes: 'Regras do Alpha.' });
  await origem.criar({ nome: 'Beta', instrucoes: 'Regras do Beta.' });
  await origem.anexarArquivo(alpha.id, { nome: 'regras.md', texto: 'Citar fontes.' });
  const json = await origem.exportar();
  const destino = criarProjetos(repoFake());
  const resultado = await destino.importar(json);
  assert.deepEqual(resultado, { projetos: 2, arquivos: 1 });
  const lista = await destino.listar();
  assert.deepEqual(lista.map((p) => p.nome).sort(), ['Alpha', 'Beta']);
  assert.equal((await destino.listarArquivos(lista.find((p) => p.nome === 'Alpha').id))[0].nome, 'regras.md');
});

test('importação substitui id inseguro por id local válido', async () => {
  const projetos = criarProjetos(repoFake());
  const resultado = await projetos.importar({ _myn: 'myn-projetos', projetos: [{ id: 'proj:<script>', nome: 'Seguro', instrucoes: 'ok' }] });
  assert.equal(resultado.projetos, 1);
  assert.match((await projetos.listar())[0].id, /^proj:[a-zA-Z0-9_-]+$/);
});

test('histórico local é importado uma vez e isolado no projeto', async () => {
  const repo = repoFake();
  repo.tabelas.eventos.set('mem:1', { id: 'mem:1', tipo: 'memoria', sessao: 's1', texto: 'Decisão importante do usuário.' });
  const projetos = criarProjetos(repo);
  const projeto = await projetos.criar({ nome: 'Com histórico' });
  assert.deepEqual(await projetos.importarHistorico(projeto.id), { importados: 1, ignorados: 0, total: 1 });
  assert.deepEqual(await projetos.importarHistorico(projeto.id), { importados: 0, ignorados: 1, total: 1 });
  assert.deepEqual(await projetos.importarHistorico(projeto.id, 500, [{ id: 'server:1', texto: 'Histórico do servidor.' }]), { importados: 1, ignorados: 1, total: 2 });
  const memoria = await import('../web/core/memoria-cliente.mjs').then((m) => m.criarMemoria(repo));
  const contexto = await memoria.contexto({ projeto: projeto.id, escopo: 'projeto' });
  assert.equal(contexto.length, 2);
  assert.ok(contexto.some((item) => /Decisão importante/.test(item.texto)));
  assert.ok(contexto.some((item) => /Histórico do servidor/.test(item.texto)));
});

test('remoção de projeto apaga seus arquivos mas preserva memória', async () => {
  const repo = repoFake();
  repo.tabelas.eventos.set('mem:1', { id: 'mem:1', tipo: 'memoria', texto: 'não apagar' });
  const projetos = criarProjetos(repo);
  const projeto = await projetos.criar({ nome: 'Temporário' });
  await projetos.anexarArquivo(projeto.id, { nome: 'nota.txt', texto: 'anexo' });
  assert.equal(await projetos.remover(projeto.id), true);
  assert.equal(await projetos.obter(projeto.id), null);
  assert.equal(repo.tabelas.arquivos.size, 0);
  assert.equal(repo.tabelas.eventos.get('mem:1').texto, 'não apagar');
});
