/** Projetos locais persistentes no navegador, usando o repositório IndexedDB existente. */
import * as db from '../db/leve.mjs';

const MAX_ARQUIVOS = 20;
const MAX_CARACTERES_ARQUIVO = 250000;
const MAX_CARACTERES_PROJETO = 1000000;
const MAX_HISTORICO = 200;
const MAX_CARACTERES_HISTORICO = 120000;

function limparTexto(valor, maximo) {
  return String(valor || '').replace(/\r/g, '').trim().slice(0, maximo);
}

function validar({ nome, instrucoes = '' }) {
  const nomeLimpo = limparTexto(nome, 80);
  if (!nomeLimpo) throw new Error('nome do projeto obrigatório');
  return { nome: nomeLimpo, instrucoes: limparTexto(instrucoes, 6000) };
}

function novoId(prefixo = 'proj:') {
  return prefixo + (globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10));
}

function hashTexto(texto) {
  let hash = 2166136261;
  for (const char of String(texto || '')) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0).toString(36);
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

  async function listarArquivos(projetoId) {
    if (!(await obter(projetoId))) throw new Error('projeto não encontrado');
    return (await repo.listar('arquivos', 10000))
      .filter((item) => item.tipo === 'projeto-arquivo' && item.projetoId === projetoId)
      .sort((a, b) => (a.t || 0) - (b.t || 0));
  }

  async function anexarArquivo(projetoId, entrada) {
    if (!(await obter(projetoId))) throw new Error('projeto não encontrado');
    const nome = limparTexto(entrada?.nome, 160);
    const texto = String(entrada?.texto || '').replace(/\r/g, '');
    if (!nome) throw new Error('nome do arquivo obrigatório');
    if (!texto.trim()) throw new Error('arquivo de texto vazio');
    if (texto.length > MAX_CARACTERES_ARQUIVO) throw new Error('arquivo excede 250 mil caracteres');
    const atuais = await listarArquivos(projetoId);
    if (atuais.length >= MAX_ARQUIVOS) throw new Error('limite de 20 arquivos por projeto');
    const total = atuais.reduce((n, item) => n + String(item.texto || '').length, 0);
    if (total + texto.length > MAX_CARACTERES_PROJETO) throw new Error('limite de 1 milhão de caracteres por projeto');
    const arquivo = {
      id: novoId('arq:'), tipo: 'projeto-arquivo', projetoId, nome,
      tipoTexto: limparTexto(entrada?.tipoTexto || 'text/plain', 80),
      texto, tamanho: texto.length, t: Date.now(),
    };
    await repo.inserir('arquivos', arquivo);
    return arquivo;
  }

  async function removerArquivo(projetoId, arquivoId) {
    const arquivo = await repo.obter('arquivos', arquivoId);
    if (!arquivo || arquivo.tipo !== 'projeto-arquivo' || arquivo.projetoId !== projetoId) throw new Error('arquivo não encontrado');
    return repo.remover('arquivos', arquivoId);
  }

  async function importarHistorico(projetoId, limite = MAX_HISTORICO, externos = []) {
    if (!(await obter(projetoId))) throw new Error('projeto não encontrado');
    const maximo = Math.max(1, Math.min(MAX_HISTORICO, Number(limite) || MAX_HISTORICO));
    const locais = (await repo.listar('eventos', 10000))
      .filter((item) => item.tipo === 'memoria' && item.texto && !item.meta?.importadoDe && !['resumo', 'preferencia'].includes(item.papel))
      .slice(-maximo);
    const externosValidos = Array.isArray(externos) ? externos.slice(0, maximo)
      .map((item) => ({ ...item, tipo: 'memoria', texto: String(item?.texto || '').slice(0, 4000) }))
      .filter((item) => item.id && item.texto) : [];
    const eventos = [...locais, ...externosValidos];
    let importados = 0, ignorados = 0, caracteres = 0;
    for (const evento of eventos) {
      const origem = String(evento.id || '').startsWith('server:') ? 'server:' + hashTexto(evento.texto) : String(evento.id || '');
      const id = 'memproj:' + projetoId + ':' + origem;
      if (await repo.obter('eventos', id)) { ignorados++; continue; }
      if (caracteres + evento.texto.length > MAX_CARACTERES_HISTORICO) { ignorados++; continue; }
      const data = Number(evento.t) || Date.parse(evento.t) || Date.now();
      await repo.inserir('eventos', {
        ...evento, id, tipo: 'memoria', projeto: projetoId, escopo: 'projeto', t: data,
        meta: { ...(evento.meta || {}), importadoDe: evento.id, importadoEm: new Date().toISOString() },
      });
      importados++; caracteres += evento.texto.length;
    }
    return { importados, ignorados, total: eventos.length, caracteres };
  }

  async function remover(id) {
    if (!String(id || '').startsWith('proj:')) throw new Error('id de projeto inválido');
    for (const arquivo of await listarArquivos(id)) await repo.remover('arquivos', arquivo.id);
    return repo.remover('sessoes', id);
  }

  async function exportar() {
    return {
      _myn: 'myn-projetos', _versao: 2, em: new Date().toISOString(),
      projetos: await listar(),
      arquivos: (await repo.listar('arquivos', 10000)).filter((item) => item.tipo === 'projeto-arquivo'),
    };
  }

  async function importar(json) {
    if (json?._myn !== 'myn-projetos' || !Array.isArray(json.projetos)) throw new Error('arquivo de projetos inválido');
    if (json.projetos.length > 100) throw new Error('limite de 100 projetos por importação');
    const arquivos = Array.isArray(json.arquivos) ? json.arquivos.slice(0, 2000) : [];
    if (arquivos.reduce((n, item) => n + String(item?.texto || '').length, 0) > 5000000) throw new Error('importação excede 5 milhões de caracteres');
    const mapaIds = new Map();
    let importados = 0;
    for (const item of json.projetos) {
      const dados = validar(item || {});
      const id = /^proj:[a-zA-Z0-9_-]{1,100}$/.test(String(item.id || '')) ? item.id : novoId();
      mapaIds.set(item.id, id);
      const atual = await obter(id);
      const agora = new Date().toISOString();
      await repo.inserir('sessoes', {
        ...(atual || {}), id, tipo: 'projeto', ...dados,
        criadoEm: atual?.criadoEm || item.criadoEm || agora,
        atualizadoEm: agora, t: Date.now(),
      });
      importados++;
    }
    let arquivosImportados = 0;
    for (const item of arquivos) {
      const projetoId = mapaIds.get(item?.projetoId);
      if (!projetoId || !(await obter(projetoId))) continue;
      const texto = String(item.texto || '').replace(/\r/g, '');
      if (!texto.trim() || texto.length > MAX_CARACTERES_ARQUIVO) continue;
      await repo.inserir('arquivos', {
        id: novoId('arq:'), tipo: 'projeto-arquivo', projetoId,
        nome: limparTexto(item.nome, 160) || 'arquivo.txt',
        tipoTexto: limparTexto(item.tipoTexto || 'text/plain', 80),
        texto, tamanho: texto.length, t: Date.now(),
      });
      arquivosImportados++;
    }
    return { projetos: importados, arquivos: arquivosImportados };
  }

  return { listar, obter, criar, atualizar, listarArquivos, anexarArquivo, removerArquivo, importarHistorico, remover, exportar, importar };
}

export const projetos = criarProjetos(db);
