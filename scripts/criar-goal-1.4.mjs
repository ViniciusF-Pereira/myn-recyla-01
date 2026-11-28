/** Registra a meta expandida 1.4 sem executar um ciclo artificial. */
const base = process.env.MYN_API_BASE || 'http://127.0.0.1:5188';
const objetivo = [
  'OBJETIVO-MESTRA 1.4: transformar o Myn em agente de trabalho profundo, não apenas catálogo de rotas.',
  'F1 Pesquisa web real: buscar fontes externas, citar trechos, mostrar data, qualidade, carregamento, erro e ausência de resultado; aceite: 20 perguntas sem referência inventada.',
  'F2 Projetos locais: arquivos, instruções e memória isolados, persistentes após reinício, exportáveis e importáveis; aceite: dois projetos não misturam contexto.',
  'F3 Tool-use auditável: schema, prévia de argumentos, confirmação externa, idempotência, timeout, cancelamento e registro sanitizado; aceite: zero envio duplicado em falha ou reconexão.',
  'F4 Extensão confiável: detectar deriva de seletor antes do envio, explicar permissões, permitir revogação e manter modo manual; aceite: layout quebrado é avisado antes da ação.',
  'F5 Benchmark cego: mesmas 20 tarefas para Myn e chats de referência, medindo acerto, fontes, artefatos, primeiro token, conclusão, cancelamento e custo; publicar resultados brutos e limitações.',
  'F6 Varredura: testar somente a fila existente, priorizar valor e registrar evidência; nunca retomar coleta nem afirmar 9 milhões sem conclusão real.',
  'Entregar por incrementos com testes automatizados, QA no navegador e prints em docs/prints. Não afirmar superioridade sem medição; não contornar login, CAPTCHA ou paywall; não usar Google/Gemini nem chaves pagas.',
].join(' ');
const r = await fetch(base + '/api/goal', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ objetivo, intervaloMs: 86400000, maxExecucoes: 30, maxPassos: 6, executarAgora: false }),
  signal: AbortSignal.timeout(30000),
});
const d = await r.json();
console.log(JSON.stringify({ status: r.status, ...d }, null, 2));
if (!r.ok) process.exit(1);
