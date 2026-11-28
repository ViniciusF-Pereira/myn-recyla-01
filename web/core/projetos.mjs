/** Projetos locais persistentes no navegador, usando o repositório IndexedDB existente. */
import * as db from '../db/leve.mjs';

function limparTexto(valor, maximo) {
  return String(valor || '').replace(/\r/g, '').trim().slice(0, maximo);
}

function validar({ nome, instrucoes = '' }) {
  const nomeLimpo = limparTexto(nome, 80);
  if (!nomeLimpo) throw new Error('nome do projeto obrigatório');
  return { nome: nomeLimpo, instrucoes: limparTexto(instrucoes, 6000) };
}

function novoId() {
  return 'proj:' + (globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10));
}

export function criarProjetos(repo) {
  async function listar() {
    return (await repo.listar('sessoes', 10000))
      .filter((item) => item.tipo === 'projeto')
      .sort((a, b) => String(b.atualizadoEm || '').localeCompare(String(a.atualizadoEm || '')));
  }

  async function obter(id) {
    const projeto = await repo.obter('sessoes', id);
    return projeto?.tipo === 'projeto' ? projeto : null;
  }

  async function criar(entrada) {
    const dados = validar(entrada || {});
    const agora = new Date().toISOString();
    const projeto = { id: novoId(), tipo: 'projeto', ...dados, criadoEm: agora, atualizadoEm: agora, t: Date.now() };
    await repo.inserir('sessoes', projeto);
    return projeto;
  }

  async function atualizar(id, entrada) {
    const atual = await obter(id);
    if (!atual) throw new Error('projeto não encontrado');
    const dados = validar({ nome: entrada?.nome ?? atual.nome, instrucoes: entrada?.instrucoes ?? atual.instrucoes });
    const projeto = { ...atual, ...dados, atualizadoEm: new Date().toISOString(), t: Date.now() };
    await repo.inserir('sessoes', projeto);
    return projeto;
  }

  async function remover(id) {
    if (!String(id || '').startsWith('proj:')) throw new Error('id de projeto inválido');
    return repo.remover('sessoes', id);
  }

  async function exportar() {
    return { _myn: 'myn-projetos', _versao: 1, em: new Date().toISOString(), projetos: await listar() };
  }

  async function importar(json) {
    if (json?._myn !== 'myn-projetos' || !Array.isArray(json.projetos)) throw new Error('arquivo de projetos inválido');
    if (json.projetos.length > 100) throw new Error('limite de 100 projetos por importação');
    let importados = 0;
    for (const item of json.projetos) {
      const dados = validar(item || {});
      const id = /^proj:[a-zA-Z0-9_-]{1,100}$/.test(String(item.id || '')) ? item.id : novoId();
      const atual = await obter(id);
      const agora = new Date().toISOString();
      await repo.inserir('sessoes', {
        ...(atual || {}), id, tipo: 'projeto', ...dados,
        criadoEm: atual?.criadoEm || item.criadoEm || agora,
        atualizadoEm: agora, t: Date.now(),
      });
      importados++;
    }
    return importados;
  }

  return { listar, obter, criar, atualizar, remover, exportar, importar };
}

export const projetos = criarProjetos(db);
