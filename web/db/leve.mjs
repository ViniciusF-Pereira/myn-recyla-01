/** DB leve no navegador: esquema em IndexedDB compatível com SQLite (tabelas + índices lógicos). */
const DB = 'myn-db';
const VERSAO = 1;
let dbPromise;

export const TABELAS = ['eventos', 'metricas', 'agentes', 'cache', 'arquivos', 'sessoes'];

function abrir() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, VERSAO);
    r.onupgradeneeded = () => {
      const db = r.result;
      for (const t of TABELAS) {
        if (!db.objectStoreNames.contains(t)) {
          const s = db.createObjectStore(t, { keyPath: 'id', autoIncrement: t !== 'sessoes' });
          s.createIndex('porTempo', 't');
          if (t === 'metricas') s.createIndex('porChave', 'chave');
        }
      }
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  return dbPromise;
}
async function tx(tabela, modo, fn) {
  const db = await abrir();
  return new Promise((resolve, reject) => {
    const t = db.transaction(tabela, modo);
    const req = fn(t.objectStore(tabela));
    let resultado;
    req.onsuccess = () => { resultado = req.result; };
    t.oncomplete = () => resolve(resultado);
    t.onerror = () => reject(t.error || req.error);
    t.onabort = () => reject(t.error || req.error || new Error('transação abortada'));
  });
}
export async function inserir(tabela, valor) {
  const registro = { ...valor, t: valor.t || Date.now() };
  return tx(tabela, 'readwrite', (s) => s.put(registro));
}
export async function listar(tabela, limite = 100) {
  const itens = await tx(tabela, 'readonly', (s) => s.getAll());
  return itens.sort((a, b) => (a.t || 0) - (b.t || 0)).slice(-limite);
}
export async function obter(tabela, id) { return tx(tabela, 'readonly', (s) => s.get(id)); }
export async function remover(tabela, id) { return tx(tabela, 'readwrite', (s) => s.delete(id)); }
export async function contar(tabela) { return tx(tabela, 'readonly', (s) => s.count()); }
export async function limpar(tabela) { return tx(tabela, 'readwrite', (s) => s.clear()); }
export async function exportar() {
  const dados = {};
  for (const t of TABELAS) dados[t] = await listar(t, 100000);
  return { _myn: 'myn-recicla-db', _versao: VERSAO, em: Date.now(), dados };
}
export async function importar(json) {
  for (const t of TABELAS) {
    for (const r of (json?.dados?.[t] || [])) await inserir(t, r);
  }
  return exportar();
}
