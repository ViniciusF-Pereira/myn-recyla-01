import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('camada web expõe projetos locais', async () => {
  const app = await readFile('site/app.mjs', 'utf8');
  assert.match(app, /import \{ projetos \} from '\.\.\/web\/core\/projetos\.mjs'/);
  assert.match(app, /\n  projetos,/);
});

test('Playground oferece painel de projetos e seleção persistente', async () => {
  const html = await readFile('site/playground.html', 'utf8');
  const js = await readFile('site/playground.js', 'utf8');
  assert.match(html, /id="btnProjetos"/);
  assert.match(html, /id="painelProjetos"/);
  assert.match(html, /id="projetoNome"/);
  assert.match(html, /id="projetoInstrucoes"/);
  assert.match(html, /id="chipProjeto"/);
  assert.match(js, /myn-projeto-ativo/);
  assert.match(js, /window\.myn\.projetos\.obter/);
  assert.match(js, /PROJETO ATIVO:/);
  assert.match(js, /INSTRUÇÕES DEFINIDAS PELO USUÁRIO/);
});

test('projetos usam o repositório local existente sem serviço externo', async () => {
  const codigo = await readFile('web/core/projetos.mjs', 'utf8');
  assert.match(codigo, /import \* as db from '\.\.\/db\/leve\.mjs'/);
  assert.match(codigo, /repo\.inserir\('sessoes'/);
  assert.doesNotMatch(codigo, /fetch\(|https?:\/\//);
});
