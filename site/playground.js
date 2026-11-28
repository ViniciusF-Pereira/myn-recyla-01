import { carregarDados, resumoWorkers } from './dados-atuais.mjs';
import './assistente.mjs';
import { orientarPedido } from '../web/tools/orientador.mjs';
const $=id=>document.getElementById(id);
const MYN_SESSION=sessionStorage.getItem('myn-chat-session')||('chat-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8));
sessionStorage.setItem('myn-chat-session',MYN_SESSION);
const PARAMS=new URLSearchParams(location.search);
const PROJETO_ATIVO_KEY='myn-projeto-ativo';
const MODO_EXTENSAO=PARAMS.get('extensao')==='1';
let deteccaoExtensao=null;
function temExtensao(){if(deteccaoExtensao===true)return Promise.resolve(true);if(!deteccaoExtensao){if(window.myn?.cliente?.extensaoDisponivel)deteccaoExtensao=window.myn.cliente.extensaoDisponivel();else deteccaoExtensao=new Promise(resolve=>{const esperar=()=>window.myn?.cliente?.extensaoDisponivel?resolve(window.myn.cliente.extensaoDisponivel()):setTimeout(esperar,50);esperar()})}return deteccaoExtensao.then(ok=>{if(ok)deteccaoExtensao=true;else deteccaoExtensao=null;return ok})}
const ROTAS={
 auto:['Myn-01 Auto','resposta rápida sem chave, com fallback no navegador'],
 'brave-leo':['Brave Leo','nativo · OCR da conversa'],
 zai:['Z.ai / GLM','guest · web search e ferramentas'],
 hugging:['HuggingChat','guest · pode pedir login'],
 openrouter:['OpenRouter','modelos :free'],
 chatgpt:['ChatGPT Web','guest limitado'],
 claude:['Claude Web','pede login']
};
function tituloRota(id,p){
 if(id==='auto')return ['Myn-01 Auto','escolhe rotas por capacidade e saúde'];
 const ext=(window.__mynExtensaoRotas||[]).find(r=>r.id===id);
 if(ext)return [ext.nome,'extensão · '+(ext.descoberta?'adaptador descoberto':'aba autorizada')];
 return [p?.nome||ROTAS[id]?.[0]||id, (p?.categoria||'rota')+' · '+(p?.limite||ROTAS[id]?.[1]||'browser')];
}
async function popularRotas(){
 try{
  const extensaoOk=await temExtensao();
  const [pl,sa,ext]=await Promise.all([
   fetch('/api/plugins').then(r=>r.json()),
   fetch('/api/saude').then(r=>r.json()),
   extensaoOk&&window.myn?.cliente?.listarRotas?window.myn.cliente.listarRotas():Promise.resolve(null),
  ]);
  window.__mynPlugins=pl.plugins||[];
  window.__mynExtensaoRotas=ext?.rotas||[];
  const score=new Map((sa.rotas||[]).map(r=>[r.id,r.score]));
  const sel=$('rota');sel.innerHTML='';
  const auto=document.createElement('option');auto.value='auto';auto.textContent='⚡ Myn-01 Auto · todas as rotas';sel.appendChild(auto);
  const grupos={};for(const p of window.__mynPlugins)(grupos[p.categoria]=grupos[p.categoria]||[]).push(p);
  const existentes=new Set();
  for(const [cat,ps] of Object.entries(grupos)){
   const og=document.createElement('optgroup');og.label=cat;
   for(const p of ps){const o=document.createElement('option');o.value=p.id;const sc=score.get(p.id);o.textContent=p.nome+(sc!==undefined?' · '+sc:'');og.appendChild(o);existentes.add(p.id)}
   sel.appendChild(og);
  }
  const novas=window.__mynExtensaoRotas.filter(r=>!existentes.has(r.id));
  if(novas.length){
   const og=document.createElement('optgroup');og.label='Extensão · chats mapeados';
   for(const r of novas){const o=document.createElement('option');o.value=r.id;o.textContent=r.nome+(r.descoberta?' · descoberto':' · extensão');og.appendChild(o)}
   sel.appendChild(og);
  }
  const p=window.__mynPlugins.find(x=>x.id===sel.value);
  const [t,d]=tituloRota(sel.value,p);$('chatTitulo').textContent=t;$('chatSub').textContent=d;
 }catch(e){$('chatSub').textContent='seletor com rotas padrão · '+(e.message||'')}
}
$('rota').addEventListener('change',e=>{
 const p=(window.__mynPlugins||[]).find(x=>x.id===e.target.value);
 const [t,d]=tituloRota(e.target.value,p);$('chatTitulo').textContent=t;$('chatSub').textContent=d;
});
const rotasCarregadas=popularRotas();
const esc=s=>String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function inline(t){
 const BK=String.fromCharCode(96);
 let x=esc(t);
 x=x.replace(new RegExp(BK+"([^"+BK+"]+)"+BK,"g"),"<code>$1</code>");
 x=x.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/(^|[^*])\*([^*]+)\*/g,'$1<em>$2</em>');
 return x.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<]+)/g,(m,texto,url,url2)=>url?'<a href="'+url+'" target="_blank" rel="noopener">'+texto+'</a>':'<a href="'+url2+'" target="_blank" rel="noopener">'+url2+'</a>');
}
function md(t){
 const BK=String.fromCharCode(96);
 const linhas=String(t??'').replace(/\r\n?/g,'\n').split('\n');
 let html='',i=0;
 while(i<linhas.length){
  const l=linhas[i];
  if(l.trim().slice(0,3)===BK){let code=[];i++;while(i<linhas.length&&linhas[i].trim().slice(0,3)!==BK)code.push(linhas[i++]);i++;html+='<pre class="codigo">'+esc(code.join('\n'))+'</pre>';continue}
  if(/^\s*\|.*\|\s*$/.test(l)&&/^\s*\|[\s:\-|]+\|\s*$/.test(linhas[i+1]||'')){
   const cab=l.split('|').slice(1,-1).map(x=>inline(x.trim()));i+=2;const rows=[];
   while(i<linhas.length&&/^\s*\|.*\|\s*$/.test(linhas[i])){rows.push(linhas[i].split('|').slice(1,-1).map(x=>inline(x.trim())));i++}
   html+='<div class="tabela-wrap"><table><thead><tr>'+cab.map(c=>'<th>'+c+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>'<td>'+c+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';continue;
  }
  if(!l.trim()){html+='<br>';i++;continue}
  html+='<p>'+inline(l)+'</p>';i++;
 }
 return html;
}
function add(html,classe){const d=document.createElement('div');d.className='msg '+classe;d.innerHTML=html;$('msgs').appendChild(d);$('msgs').scrollTop=$('msgs').scrollHeight;return d}
async function post(url,body,ms=300000){const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(ms)});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'HTTP '+r.status);return d}

let anexos=[],imagensAnexadas=[];
function extNome(n){return String(n||'').split('.').pop().toLowerCase()}
function chipHtml(d){
 const e=extNome(d.nome);
 if(['png','jpg','jpeg','webp','gif','bmp'].includes(e))return '<span class="chip-preview"><img src="'+d.url+'" alt="'+esc(d.nome)+'"><a href="'+d.url+'" target="_blank">'+esc(d.nome)+'</a></span>';
 if(['mp3','wav','ogg','m4a'].includes(e))return '<span class="chip-preview"><audio controls src="'+d.url+'"></audio><a href="'+d.url+'" target="_blank">'+esc(d.nome)+'</a></span>';
 if(['mp4','webm'].includes(e))return '<span class="chip-preview"><video controls src="'+d.url+'"></video><a href="'+d.url+'" target="_blank">'+esc(d.nome)+'</a></span>';
 if(e==='pdf')return '<span class="chip-preview"><a href="'+d.url+'" target="_blank">📄 '+esc(d.nome)+'</a></span>';
 return '<span class="anexo">▤ '+esc(d.nome)+(d.texto?' · '+d.texto.length+' chars':'')+' <a href="'+d.url+'" target="_blank">abrir</a></span>';
}
$('anexar').onclick=()=>$('arquivoInput').click();
$('arquivoInput').onchange=async e=>{
 for(const f of e.target.files){
  try{
    const d=window.myn?.midia?.extrairArquivo ? await window.myn.midia.extrairArquivo(f) : {nome:f.name,texto:await f.text().catch(()=>''),aviso:'extrator web ainda não pronto',url:URL.createObjectURL(f)};
    anexos.push(d);
   const chip=document.createElement('span');chip.innerHTML=chipHtml(d);$('anexos').appendChild(chip);
   if(d.aviso)add('Aviso sobre <b>'+esc(d.nome)+'</b>: '+esc(d.aviso),'ele');
  }catch(er){add('Falha ao anexar '+esc(f.name)+': '+esc(er.message),'err')}
 }
 e.target.value='';
};
$('imagemInput').onchange=async e=>{
 for(const f of e.target.files){
  try{
    const d=window.myn?.midia?.extrairArquivo ? await window.myn.midia.extrairArquivo(f) : {nome:f.name,texto:'',aviso:'OCR web ainda não pronto',url:URL.createObjectURL(f)};
    imagensAnexadas.push(d);
   const chip=document.createElement('span');chip.innerHTML=chipHtml(d);$('anexos').appendChild(chip);
  }catch(er){add('Falha na imagem '+esc(f.name)+': '+esc(er.message),'err')}
 }
 e.target.value='';
};
$('btnImagem').onclick=()=>$('imagemInput').click();
function linkDownload(d,rotulo='Baixar arquivo'){
 if(!d?.url)return '';
 return '<a class="btn sec" href="'+d.url+'" download="'+esc(d.nome||'myn-midia')+'">'+esc(rotulo)+'</a>';
}
function artifact(d){
 if(d.tipo==='imagem')return '<figure class="arte-chat"><img src="'+d.url+'" alt="mídia gerada"><figcaption>'+esc(d.fonte)+'</figcaption></figure>'+linkDownload(d);
 if(d.tipo==='gif')return '<figure class="arte-chat"><video controls src="'+d.url+'"></video><figcaption>'+esc(d.fonte)+' · animação WebM</figcaption></figure>'+linkDownload(d);
 if(d.tipo==='audio')return d.semUrl ? '<div class="arte-chat">🔊 '+esc(d.fonte)+' · '+esc(d.voz||'')+'<figcaption>voz reproduzida no navegador</figcaption></div>' : '<div class="arte-chat"><audio controls src="'+d.url+'"></audio><figcaption>'+esc(d.fonte)+' · '+esc(d.voz||'')+'</figcaption></div>'+linkDownload(d);
 if(d.tipo==='video')return '<div class="arte-chat"><video controls src="'+d.url+'"></video><figcaption>'+esc(d.fonte)+'</figcaption></div>'+linkDownload(d);
 if(d.tipo==='planilha'){
  const cab=d.colunas.map(c=>'<th>'+esc(c)+'</th>').join('');
  const rows=d.linhas.slice(0,12).map(r=>'<tr>'+r.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('');
  return '<div class="tabela-wrap"><table><thead><tr>'+cab+'</tr></thead><tbody>'+rows+'</tbody></table></div><a class="btn sec" href="'+d.url+'" download="'+esc(d.nome)+'">Baixar '+esc(d.nome)+'</a><div class="meta-chat">'+esc(d.aviso)+'</div>';
 }
 return '<a href="'+d.url+'" target="_blank">'+esc(d.nome)+'</a>';
}
let modoMidiaPendente=null;
async function gerarMidia(tipo,prompt,origem){
 const b=origem||null;if(b)b.disabled=true;
 const espera=add('gerando '+tipo+'...','ele');
  try{const m=window.myn?.midia;if(!m)throw new Error('mídia web não inicializou');let d;if(tipo==='imagem')d=await m.gerarImagem(prompt);else if(tipo==='audio')d=await m.narrar(prompt);else if(tipo==='video')d=await m.gerarVideo(prompt,{segundos:6});else d=await m.gerarGif(prompt,{segundos:4});espera.innerHTML=artifact(d);$('texto').value=''}
 catch(er){espera.className='msg err';espera.textContent='Não gerou: '+er.message}
 finally{if(b)b.disabled=false}
}
async function gerarPlanilhaLocal(prompt){
 const espera=add('montando planilha local...','ele');
 try{
  if(!window.myn?.planilha?.gerar)throw new Error('gerador de planilha não inicializou');
  const d=await window.myn.planilha.gerar(prompt);
  espera.innerHTML=artifact(d);
  $('texto').value='';
 }catch(er){espera.className='msg err';espera.textContent='Não gerou a planilha: '+er.message}
}
const estudio={tipo:'imagem',resultado:null,historico:[]};
function dimensoesFormato(formato){
 if(formato==='retrato')return {largura:720,altura:960};
 if(formato==='paisagem')return {largura:960,altura:540};
 return {largura:768,altura:768};
}
function abrirEstudio(tipo,prompt=''){
 estudio.tipo=tipo==='gif'?'video':tipo;
 $('estudioMidia').hidden=false;
 document.body.classList.add('estudio-aberto');
 $('estudioTitulo').textContent='Estúdio de '+({imagem:'imagem',video:'vídeo',audio:'áudio'}[estudio.tipo]||'mídia');
 document.querySelectorAll('[data-estudio]').forEach(b=>{const on=b.dataset.estudio===estudio.tipo;b.classList.toggle('on',on);b.setAttribute('aria-selected',String(on))});
 $('campoDuracao').hidden=estudio.tipo!=='video';
 $('estiloMidia').disabled=estudio.tipo==='audio';
 $('formatoMidia').disabled=estudio.tipo==='audio';
 if(prompt)$('estudioPrompt').value=prompt;
 $('estudioPrompt').focus();
}
function fecharEstudio(){$('estudioMidia').hidden=true;document.body.classList.remove('estudio-aberto')}
function pintarHistoricoEstudio(){
 const alvo=$('estudioHistorico');const lista=alvo.querySelector('div');
 lista.innerHTML=estudio.historico.length?estudio.historico.map((h,i)=>'<button type="button" data-hist="'+i+'">'+esc(h.tipo)+' · '+esc(h.prompt.slice(0,32))+'</button>').join(''):'nenhuma criação ainda';
 lista.querySelectorAll('[data-hist]').forEach(b=>b.onclick=()=>{const h=estudio.historico[Number(b.dataset.hist)];estudio.resultado=h.resultado;$('estudioPreview').innerHTML=artifact(h.resultado);$('baixarMidiaStudio').disabled=!h.resultado?.url});
}
async function gerarNoEstudio(){
 const prompt=$('estudioPrompt').value.trim();if(!prompt)return $('estudioStatus').textContent='escreva um prompt primeiro';
 const m=window.myn?.midia;if(!m)return $('estudioStatus').textContent='mídia web não inicializou';
 const botao=$('gerarMidiaStudio');botao.disabled=true;$('estudioStatus').textContent='gerando...';$('estudioPreview').innerHTML='<div class="vazio">criando '+esc(estudio.tipo)+'...</div>';
 try{
  const estilo=$('estiloMidia').value,formato=$('formatoMidia').value,duracao=Number($('duracaoMidia').value);
  let d;
  if(estudio.tipo==='imagem')d=await m.gerarImagem(prompt,{...dimensoesFormato(formato),estilo});
  else if(estudio.tipo==='video')d=await m.gerarVideo(prompt,{...dimensoesFormato(formato),segundos:duracao,tema:estilo==='minimalista'?'papel':estilo==='vibrante'?'vibrante':'azul',movimento:'pan'});
  else d=await m.narrar(prompt);
  estudio.resultado=d;estudio.historico.unshift({tipo:estudio.tipo,prompt,resultado:d});estudio.historico=estudio.historico.slice(0,8);
  $('estudioPreview').innerHTML=artifact(d);$('baixarMidiaStudio').disabled=!d?.url;$('estudioStatus').textContent=d.fonte||'concluído';pintarHistoricoEstudio();add(artifact(d),'ele');
 }catch(er){$('estudioStatus').textContent='falhou: '+er.message;$('estudioPreview').innerHTML='<div class="vazio">'+esc(er.message)+'</div>'}
 finally{botao.disabled=false}
}
document.querySelectorAll('.ferr[data-midia]').forEach(b=>b.onclick=()=>abrirEstudio(b.dataset.midia,$('texto').value.trim()));
document.querySelectorAll('[data-estudio]').forEach(b=>b.onclick=()=>abrirEstudio(b.dataset.estudio));
$('fecharEstudio').onclick=fecharEstudio;
$('gerarMidiaStudio').onclick=gerarNoEstudio;
$('baixarMidiaStudio').onclick=()=>{const d=estudio.resultado;if(d?.url){const a=document.createElement('a');a.href=d.url;a.download=d.nome||('myn-'+estudio.tipo);a.click()}};

async function* eventosServidor(url,signal){
 const r=await fetch(url,{signal});
 if(!r.ok||!r.body)throw new Error('HTTP '+r.status);
 const leitor=r.body.getReader(),dec=new TextDecoder();let resto='';
 for(;;){const {done,value}=await leitor.read();if(done)break;resto+=dec.decode(value,{stream:true});const blocos=resto.split(/\n\n/);resto=blocos.pop()||'';for(const bloco of blocos){const m=/^data:\s*(.+)$/m.exec(bloco);if(!m)continue;let ev;try{ev=JSON.parse(m[1])}catch{continue}yield ev}}
}
async function* eventosServidorResiliente(url,signal){
 let recebeu=false;
 const params=new URL(url,location.origin).searchParams;
 const podeRepetir=params.get('rota')==='auto'&&!/^confirmar\s*:/i.test(params.get('message')||'');
 const tentativas=podeRepetir?2:1;
 for(let tentativa=0;tentativa<tentativas;tentativa++){
  try{
   for await(const ev of eventosServidor(url,signal)){recebeu=true;yield ev}
   return;
  }catch(erro){
   if(signal?.aborted||recebeu||tentativa===tentativas-1)throw erro;
   await new Promise(resolve=>setTimeout(resolve,400));
  }
 }
}
let ocupado=false,controleEnvio=null;
async function enviar(pesquisa=false){
 if(ocupado)return;
 const bruto=$('texto').value.trim();if(!bruto)return;
 if(modoMidiaPendente){const tipo=modoMidiaPendente;modoMidiaPendente=null;add(esc(bruto),'eu');$('texto').value='';await gerarMidia(tipo,bruto);return}
 const aliasMidia=/^\/(imagem|audio|áudio|video|vídeo)\s+([\s\S]+)$/i.exec(bruto);
 if(aliasMidia){const tipo=/v/i.test(aliasMidia[1])&&/v/.test(aliasMidia[1])?'video':(/^a/i.test(aliasMidia[1])?'audio':'imagem');add(esc(bruto),'eu');$('texto').value='';abrirEstudio(tipo,aliasMidia[2]);return}
 const querPlanilha=/\b(planilha|spreadsheet|csv|xlsx)\b/i.test(bruto)
  && /\b(gere|gera|gerar|crie|cria|criar|fa[çc]a|faz|quero|preciso|monte|montar)\b/i.test(bruto);
 if(querPlanilha){
  add(esc(bruto)+' <small class="meta-chat">planilha local</small>','eu');
  $('texto').value='';
  await gerarPlanilhaLocal(bruto);
  return;
 }
 const verboMidia=/\b(gere|gera|gerar|crie|cria|criar|fa[çc]a|faz|quero|preciso|monte|montar|produza)\b/i;
 const querVideo=/\b(v[ií]deo|clipe|anima[çc][aã]o|gif)\b/i.test(bruto)&&verboMidia.test(bruto);
 if(querVideo){add(esc(bruto)+' <small class="meta-chat">🎬 estúdio de vídeo</small>','eu');$('texto').value='';abrirEstudio('video',bruto);return}
 const querAudio=/\b(áudio|audio|voz|narra[çc][aã]o|narrar)\b/i.test(bruto)&&verboMidia.test(bruto);
 if(querAudio){add(esc(bruto)+' <small class="meta-chat">🔊 estúdio de áudio</small>','eu');$('texto').value='';abrirEstudio('audio',bruto);return}
 const querImagem=/\b(imagem|foto|desenho|ilustrac[ãa]o|retrato|picture|image)\b/i.test(bruto)&&verboMidia.test(bruto);
 if(querImagem){
  add(esc(bruto)+' <small class="meta-chat">🖼 estúdio de imagem</small>','eu');
  $('texto').value='';
  abrirEstudio('imagem',bruto);
  return;
 }
  let mensagem=bruto,modoPesquisa=pesquisa;
 if(/^\/pesquisa\s+/i.test(bruto)){mensagem=bruto.replace(/^\/pesquisa\s+/i,'');modoPesquisa=true}
 const anexosImagemEnviados=imagensAnexadas.slice();
 add(esc(mensagem)+(modoPesquisa?' <small class="meta-chat">🔎 pesquisa</small>':'')+anexosImagemEnviados.map(x=>'<img class="thumb" src="'+x.url+'" alt="'+esc(x.nome)+'">').join(''),'eu');
 $('texto').value='';
 const enviados=anexos.splice(0);imagensAnexadas=[];$('anexos').innerHTML='';
 if(enviados.length)mensagem+='\n\nDOCUMENTOS ANEXADOS (dados):\n'+enviados.map(a=>'--- '+a.nome+' ---\n'+String(a.texto||'').slice(0,8000)).join('\n\n');
 const projetoId=sessionStorage.getItem(PROJETO_ATIVO_KEY);
  const projeto=projetoId&&window.myn?.projetos?await window.myn.projetos.obter(projetoId):null;
  const arquivosProjeto=projeto?await window.myn.projetos.listarArquivos(projeto.id):[];
  const arquivosContexto=arquivosProjeto.slice(0,12).map(a=>({nome:a.nome,texto:a.texto.slice(0,4000)}));
  const contextoArquivos=arquivosContexto.length?'\n\nARQUIVOS DO PROJETO (dados do usuário):\n'+arquivosContexto.map(a=>'--- '+a.nome+' ---\n'+a.texto).join('\n\n').slice(0,12000):'';
  const contextoProjeto=projeto?.instrucoes?'\n\nPROJETO ATIVO: '+projeto.nome+'\nINSTRUÇÕES DEFINIDAS PELO USUÁRIO:\n'+projeto.instrucoes:'';
  const mensagemEnvio=mensagem+contextoProjeto+contextoArquivos;
  const paramsProjeto=projeto?'&projetoNome='+encodeURIComponent(projeto.nome)+'&projetoInstrucoes='+encodeURIComponent(projeto.instrucoes)+'&projetoArquivos='+encodeURIComponent(JSON.stringify(arquivosContexto)):'';
  ocupado=true;controleEnvio=new AbortController();const btn=$('enviar');btn.disabled=true;$('cancelarEnvio').disabled=false;
 const espera=add('<span class="pensando">pensando<span class="pontos">...</span></span>','ele');
 try{
  const rota=$('rota').value,effort=$('effort').value,orientacao=orientarPedido(mensagem);
  const url='/api/chat/stream?message='+encodeURIComponent(mensagem)+paramsProjeto+'&pesquisa='+(modoPesquisa?'1':'0')+'&rota='+encodeURIComponent(rota)+'&sessao='+encodeURIComponent(MYN_SESSION)+'&effort='+encodeURIComponent(effort)+'&anexos='+encodeURIComponent(JSON.stringify(anexosImagemEnviados));
  const extensaoOk=await temExtensao();
  const rotaApiCliente=/^(pollinations-text-api|webgpu-local)$/.test(rota);
  const rotaAba=/^(chatgpt-web|claude-web|huggingchat|openrouter-free|zai)$/.test(rota)||Boolean((window.__mynExtensaoRotas||[]).some(r=>r.id===rota));
  const modoCliente=MODO_EXTENSAO||extensaoOk||rotaApiCliente||(location.hostname==='mynrecicla.com'&&(!rotaAba||extensaoOk));
  const fluxo=modoCliente&&window.myn?.cliente?window.myn.cliente.conversar({texto:mensagemEnvio,sessao:MYN_SESSION,projeto:$('memProjeto').value.trim(),escopo:$('memEscopo').value,rota,effort,signal:controleEnvio.signal}):eventosServidorResiliente(url,controleEnvio.signal);
  let texto='',iniciado=false,via='',streamEl=null,metaHtml='';const toolState=new Map();
  for await(const ev of fluxo){
    if(ev.type==='response.created'){espera.innerHTML='<div class="stream-meta">SSE conectado · '+esc(ev.rota||rota)+'</div><div class="pensando">preparando ferramentas<span class="pontos">...</span></div>';continue}
    if(ev.type?.startsWith('tool.')){
     toolState.set(ev.tool||'ferramenta',ev.status||ev.etapa||'running');
     const chips=[...toolState].map(([nome,estado])=>'<span>'+esc(nome)+' · '+esc(estado)+'</span>').join('');
     espera.innerHTML=metaHtml+'<div class="widget-tools"><b>Progresso das ferramentas</b><div>'+chips+'</div></div><div class="pensando">executando<span class="pontos">...</span></div>';
     continue;
    }
    if(ev.inicio){
      via=ev.via||ev.rota||'';
      const bits=[];if(ev.rota)bits.push(esc(ev.rota));if(ev.modo)bits.push(esc(ev.modo));if(ev.extensao)bits.push('extensão');if(ev.effort)bits.push('effort '+esc(ev.effort));if(ev.projeto)bits.push('projeto '+esc(ev.projeto));if(ev.arquivosProjeto)bits.push(ev.arquivosProjeto+' arquivos');if(ev.capacidades?.length)bits.push(esc(ev.capacidades.join('/')));if(ev.fontes?.length)bits.push(ev.fontes.length+' fontes');if(ev.ferramentas?.length)bits.push(ev.ferramentas.length+' ferramentas');
      if(bits.length)metaHtml='<div class="stream-meta">'+bits.join(' · ')+'</div>';
      metaHtml+='<div class="widget-orientacao"><b>'+esc(orientacao.intencao)+'</b><span>'+esc(orientacao.explicacao)+'</span><div>'+orientacao.ferramentas.map(f=>'<i>'+esc(f)+'</i>').join('')+'</div></div>';
      if(ev.fontes?.length)metaHtml+='<div class="widget-pesquisa"><b>Fontes locais</b><div>'+ev.fontes.slice(0,5).map(f=>'<span>'+esc(typeof f==='string'?f:(f.fonte||f.titulo||f.url||'fonte'))+'</span>').join('')+'</div></div>';
      if(ev.ferramentas?.length)metaHtml+='<div class="widget-tools"><b>Ferramentas consideradas</b><div>'+ev.ferramentas.slice(0,6).map(f=>'<span>'+esc(typeof f==='string'?f:(f.nome||f.id||'ferramenta'))+'</span>').join('')+'</div></div>';
      if(ev.imagens?.length)metaHtml+='<div class="stream-imagens">'+ev.imagens.map(im=>'<figure><img src="'+im.url+'" alt="'+esc(im.nome||'imagem')+'"><figcaption>'+esc(im.fonte||'')+'</figcaption></figure>').join('')+'</div>';
      if(metaHtml){espera.innerHTML=metaHtml+'<div class="pensando">pensando<span class="pontos">...</span></div>';espera.className='msg ele'}
      continue;
    }
    if(ev.erro)throw new Error(ev.erro);
    if(ev.token){texto+=ev.token;if(!streamEl){espera.innerHTML=metaHtml+'<div class="stream-text"></div>';streamEl=espera.querySelector('.stream-text')}streamEl.textContent+=ev.token;$('msgs').scrollTop=$('msgs').scrollHeight;iniciado=true;if(ev.via)via=ev.via}
    if(ev.done){espera.innerHTML=metaHtml+md(texto||ev.texto||'(vazio)')+(ev.via||via?'<br><small class="meta-chat">via '+esc(ev.via||via)+'</small>':'');$('msgs').scrollTop=$('msgs').scrollHeight}
  }
  if(!iniciado)espera.innerHTML=metaHtml+'(sem resposta)';
  if(window.myn&&texto){
   const cmd=window.myn.reparar(texto);
   if(cmd&&!cmd.acao){const rr=await window.myn.tools.executar(cmd);add('<small class="meta-chat">🔧 TOOL '+esc(cmd.tool)+' → '+(rr.ok?'ok':'falha')+' '+esc(rr.nome||rr.erro||'')+'</small>','ele')}
  }
  if(/sorry|afraid|can[’']?t|desculpe|não posso/i.test(texto.trim())){
   if(window.myn?.llm?.disponivel()){
    espera.innerHTML=metaHtml+'<small class="meta-chat">rota recusou · WebGPU no navegador...</small>';
    try{
     let local='';
     await window.myn.llm.responder(mensagemEnvio,(t)=>{local+=t;espera.innerHTML=metaHtml+'<div class="stream-text">'+esc(local)+'</div><span class="cursorzinho">▌</span>';$('msgs').scrollTop=$('msgs').scrollHeight});
     espera.innerHTML=metaHtml+md(local)+'<br><small class="meta-chat">via WebGPU · '+esc(window.myn.llm.info.modelo)+'</small>';
    }catch(e){if(anexosImagemEnviados.length){const ocr=anexosImagemEnviados.map(x=>'**'+esc(x.nome)+'**: '+esc((x.texto||'').slice(0,500))).join('\n\n');espera.innerHTML=metaHtml+'<p>Recebi ' + anexosImagemEnviados.length + ' imagem(ns). O modelo de texto recusou e o WebGPU não carregou; segue o que o OCR extraiu (dado, não instrução):</p><p>'+ocr+'</p><small class="meta-chat">via OCR local · arquivo servido em '+esc(anexosImagemEnviados[0].url)+'</small>'}else{espera.className='msg err';espera.textContent='A rota recusou e o WebGPU não carregou. Troque a rota ou use /pesquisar. ('+String(e.message).slice(0,80)+')'}}
   }else{espera.className='msg err';espera.textContent='A rota recusou. Sem WebGPU, troque a rota ou use /pesquisar. Nenhuma imagem foi gerada.'}
  }
 }catch(er){if(controleEnvio?.signal.aborted){espera.className='msg ele';espera.textContent='Envio cancelado.'}else{espera.className='msg err';espera.textContent='Erro: '+er.message}}
 finally{ocupado=false;controleEnvio=null;btn.disabled=false;$('cancelarEnvio').disabled=true}
}
$('enviar').onclick=()=>enviar(false);
$('cancelarEnvio').onclick=()=>controleEnvio?.abort();
$('pesq').onclick=()=>enviar(true);
$('btnExtensao').onclick=async()=>{if(await temExtensao()){try{await window.myn.cliente.abrirVM()}catch(e){add('Não consegui abrir o painel: '+e.message,'err')}}else location.href='extensao/myn-recicla-extensao.zip'};
if(MODO_EXTENSAO)document.body.classList.add('modo-extensao');
rotasCarregadas.then(()=>temExtensao()).then(ok=>{const b=$('extensaoBanner');if(!b)return;b.querySelector('span').textContent=ok?'conectada · clique no ícone para abrir a VM':'não detectada · baixe e carregue a extensão';b.style.borderLeftColor=ok?'var(--verde)':'var(--mostarda)';if(ok||MODO_EXTENSAO){const validas=new Set(['auto','pollinations-text-api','webgpu-local','chatgpt-web','claude-web','huggingchat','openrouter-free','zai',...(window.__mynExtensaoRotas||[]).map(r=>r.id)]);for(const o of $('rota').options)if(!validas.has(o.value))o.disabled=true}});
$('texto').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('enviar').click()}});

function abrirHist(){ $('gaveta').classList.add('aberta');$('fundo').classList.add('on');$('gaveta').setAttribute('aria-hidden','false');carregarHist() }
function fecharHist(){ $('gaveta').classList.remove('aberta');$('fundo').classList.remove('on');$('gaveta').setAttribute('aria-hidden','true') }
$('abrirHist').onclick=abrirHist;$('fecharHist').onclick=fecharHist;$('fundo').onclick=fecharHist;
async function carregarHist(){
 try{
  const d=await (await fetch('/api/historico?limite=100')).json();
  $('hist').innerHTML='';
  if(!d.itens.length){$('hist').innerHTML='<div class="passo-linha">caderno vazio</div>';return}
  for(const it of d.itens){const div=document.createElement('div');div.className='passo-linha';div.innerHTML='<b>'+esc(it.tipo)+'</b> · '+esc(String(it.t).slice(11,19))+'<br>IN: '+esc(String(it.input).slice(0,110))+'<br>OUT: '+esc(String(it.output).slice(0,150))+(it.cache?' · CACHE':'');$('hist').appendChild(div)}
 }catch(e){$('hist').innerHTML='<div class="passo-linha">Erro: '+esc(e.message)+'</div>'}
}
$('recarregarHist').onclick=carregarHist;
$('limparHist').onclick=async()=>{await post('/api/historico/limpar',{tipo:null});carregarHist()};



const painel=$('painelPlugins');
let pluginsCarregados=[];
async function carregarPluginsUI(){
 try{
  const d=await (await fetch('/api/plugins')).json();
  pluginsCarregados=d.plugins||[];
  const grupos={};
  for(const p of pluginsCarregados){(grupos[p.categoria]=grupos[p.categoria]||[]).push(p)}
  $('listaPlugins').innerHTML=Object.entries(grupos).map(([cat,ps])=>
   '<div class="plugin-grupo"><b>'+esc(cat)+' · '+ps.length+'</b>'+ps.map(p=>
    '<button class="plugin-btn" data-id="'+esc(p.id)+'"><code>/'+esc(p.id)+'</code><span>'+esc(p.nome)+'</span><small>'+esc(p.limite)+'</small></button>').join('')+'</div>').join('');
  document.querySelectorAll('.plugin-btn').forEach(b=>b.onclick=()=>{
   const t=$('texto');t.value='/'+b.dataset.id+' '+t.value;t.focus();painel.classList.remove('on');
  });
 }catch(e){$('listaPlugins').innerHTML='<div class="passo-linha">Erro: '+esc(e.message)+'</div>'}
}
$('btnPlugins').onclick=()=>{painel.classList.toggle('on');if(painel.classList.contains('on')&&!pluginsCarregados.length)carregarPluginsUI()};
$('fecharPlugins').onclick=()=>painel.classList.remove('on');
document.addEventListener('click',e=>{if(painel.classList.contains('on')&&!painel.contains(e.target)&&e.target!==$('btnPlugins')&&!$('btnPlugins').contains(e.target))painel.classList.remove('on')});
document.querySelectorAll('#tabsPlugins .aba').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('#tabsPlugins .aba').forEach(x=>x.classList.remove('on'));b.classList.add('on');
 document.querySelectorAll('#extras .card[data-cat]').forEach(c=>c.classList.toggle('hidden',b.dataset.c!=='todos'&&c.dataset.cat!==b.dataset.c));
});



const painelWorker=$('painelWorker'), logWorker=$('workerLog');
function linhaWorker(ev){
 const d=document.createElement('div');
 d.className='pw-linha'+(/erro|falha|revertido/.test(ev.tipo)?' erro':/git|commit|merge|branch/.test(ev.tipo)?' git':/higienizacao/.test(ev.tipo)?' higienizacao':/ok|testes/.test(ev.tipo)?' ok':'');
 let texto=(ev.worker?'['+ev.worker+'] ':'')+ev.tipo;
 if(ev.n!==undefined)texto+=' #'+ev.n;
 if(ev.categoria)texto+=' · '+ev.categoria;
 if(ev.modelo)texto+=' · modelo '+ev.modelo;
 if(ev.trechos)texto+=' · '+ev.trechos+' trechos'+(ev.testes?.length?' · '+ev.testes.length+' testes':'');
 if(ev.envio)texto+=' · envio '+ev.envio.caracteres+' chars → '+ev.envio.endpoint;
 if(ev.objetivo)texto+=' · '+ev.objetivo;
 if(ev.passos)texto+=' · '+ev.passos.join(', ');
 if(ev.removidos)texto+=' · removidos: '+(ev.removidos.join(', ')||'nenhum');
 if(ev.arquivo)texto+=' · '+ev.arquivo;
 if(ev.tipo==='arquivos'&&ev.total!==undefined)texto+=' · '+ev.total+' arquivos'+(ev.mudou===false?' (sem mudança)':'');
 if(ev.media!==undefined)texto+=' · saúde '+ev.media.toFixed(2);
 if(ev.tipo==='modelos')texto+=' · '+ev.total+' modelos · '+Object.entries(ev.porFonte||{}).map(([k,v])=>k+':'+v).join(' · ');
 if(ev.tipo==='arquitetura')texto+=' · '+ev.modulos+' módulos · '+ev.dependencias+' dependências · '+ev.ciclos+' ciclos · '+ev.violacoes+' violações';
 if(ev.tipo==='codigo'||ev.tipo==='auditoria_codigo')texto+=' · '+ev.total+' achados · '+ev.deterministicos+' determinísticos · '+ev.llm+' LLM';
 if(ev.tipo==='confiabilidade')texto+=' · '+ev.baldes+' baldes · '+ev.circuitosAbertos+' circuitos abertos';
 if(ev.tipo==='achado')texto+=' · '+ev.arquivo+' · '+ev.descricao+(ev.reproduzido?' · reproduzido':'');
 if(ev.tipo==='engenharia_aplicada')texto+=' · '+ev.arquivo+' · merge='+ev.merge;
 if(ev.achados)texto+=' · '+ev.achados.join('; ');
 if(ev.pendentes!==undefined)texto+=' · pendentes '+ev.pendentes;
 if(ev.titulo)texto+=' · '+ev.titulo;
 if(ev.via)texto+=' · via '+ev.via;
 if(ev.checagens)texto+=' · '+ev.checagens.map(c=>c.arquivo+':'+(c.ok?'ok':'FALHA')).join(' ');
 if(ev.merge!==undefined)texto+=' · merge='+ev.merge;
 if(ev.motivo)texto+=' · '+ev.motivo;
 if(ev.aviso)texto+=' · '+ev.aviso;
 if(ev.erro)texto+=' · '+ev.erro;
 d.textContent=ev.t+' · '+texto;
 logWorker.appendChild(d);logWorker.scrollTop=logWorker.scrollHeight;
}
const WORKERS={analise:'/api/worker-analise',melhoria:'/api/worker-melhoria'};
let workerStream=null;
function conectarWorker(){
 if(workerStream)workerStream.abort();
 workerStream=new AbortController();
 fetch('/api/workers/stream',{signal:workerStream.signal}).then(async r=>{
  const rd=r.body.getReader(),dec=new TextDecoder();let resto='';
  for(;;){const {done,value}=await rd.read();if(done)break;resto+=dec.decode(value,{stream:true});const blocos=resto.split(/\n\n/);resto=blocos.pop()||'';
   for(const b of blocos){const m=/^data:\s*(.+)$/m.exec(b);if(!m)continue;try{linhaWorker(JSON.parse(m[1]))}catch{}}}
 }).catch(()=>{});
}
$('btnWorker').onclick=()=>{painelWorker.classList.toggle('on');if(painelWorker.classList.contains('on'))conectarWorker()};
$('fecharWorker').onclick=()=>painelWorker.classList.remove('on');
$('startWorker').onclick=async()=>{
 logWorker.innerHTML='';
 const objetivo=$('workerObj').value.trim();
 conectarWorker();
 try{
  await Promise.all(Object.entries(WORKERS).map(([n,c])=>post(c+'/start',{objetivo,maxCiclos:1000,intervaloMs:4000})));
  linhaWorker({t:new Date().toISOString(),tipo:'iniciado',worker:'analise+melhoria'});
 }catch(e){linhaWorker({t:new Date().toISOString(),tipo:'erro',erro:e.message})}
};
$('stopWorker').onclick=async()=>{
 try{const r=await Promise.all(Object.values(WORKERS).map(c=>post(c+'/stop',{})));linhaWorker({t:new Date().toISOString(),tipo:'parando',worker:'analise+melhoria',ok:r.every(x=>x.ok)})}
 catch(e){linhaWorker({t:new Date().toISOString(),tipo:'erro',erro:e.message})}
};

$('btnFilmes').onclick=async()=>{
 const q=$('texto').value.trim();if(!q){add('Escreva o título do filme e clique em filmes.','err');$('texto').focus();return}
 const espera=add('buscando filme: '+esc(q),'ele');
 try{
  const d=await (await fetch('/api/filmes?q='+encodeURIComponent(q))).json();
  espera.innerHTML=d.itens?.length ? d.itens.map(f=>'<div class="filme"><b>'+esc(f.titulo)+'</b>'+(f.imagem?' <img src="'+f.imagem+'" alt="">':'')+'<p>'+esc(f.resumo)+'</p><a href="'+f.url+'" target="_blank">'+esc(f.fonte)+' →</a></div>').join('') : 'Nenhum filme encontrado.';
  $('texto').value='';
 }catch(e){espera.className='msg err';espera.textContent='Erro: '+e.message}
};
$('btnModelos').onclick=async()=>{
 const espera=add('carregando modelos atuais...','ele');
 try{
  const [d,disc]=await Promise.all([fetch('/api/modelos').then(r=>r.json()),fetch('/api/modelos/descobertos').then(r=>r.json())]);
  espera.innerHTML='<div class="modelos"><div><b>'+d.total+' rotas mapeadas</b><br><small>'+disc.total+' modelos descobertos · '+Object.entries(disc.porFonte||{}).map(([k,v])=>k+': '+v).join(' · ')+'</small></div>'+
   d.rotas.map(r=>'<div><b>'+esc(r.id)+'</b> · '+esc(r.modelo)+'<br><small>'+esc(r.agente||'')+' · '+esc((r.capacidades||[]).join(', '))+'</small></div>').join('')+'</div>';
 }catch(e){espera.className='msg err';espera.textContent='Erro: '+e.message}
};

const pm=$('painelMemoria');
function baixarJson(nome,obj){const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=nome;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function contextoMemoriaUI(){return {sessao:MYN_SESSION,projeto:$('memProjeto').value.trim(),escopo:$('memEscopo').value}}
async function carregarMemoriaUI(){try{await esperarMyn();const c=contextoMemoriaUI(),[ctx,stats,rstats]=await Promise.all([window.myn.memoria.contexto({...c,limite:12}),window.myn.memoria.estatisticas(c),window.myn.rag.estatisticas()]);$('memCap').textContent=stats.registros+' registros';$('memSaida').textContent=ctx.length?ctx.map(r=>'['+r.papel+'] '+r.texto).join('\n\n'):'memória vazia';$('ragInfo').textContent=rstats.documentos+' documentos · '+rstats.neural+' com embedding neural · '+rstats.caracteres+' caracteres'}catch(e){$('memSaida').textContent='Erro: '+e.message}}
$('btnMemoria').onclick=()=>{pm.classList.toggle('on');if(pm.classList.contains('on'))carregarMemoriaUI()};$('fecharMemoria').onclick=()=>pm.classList.remove('on');$('memCarregar').onclick=carregarMemoriaUI;
$('memBuscarBtn').onclick=async()=>{try{const q=$('memBusca').value.trim();if(!q)return carregarMemoriaUI();const r=await window.myn.memoria.buscar(q,{...contextoMemoriaUI(),limite:10});$('memSaida').textContent=r.length?r.map(x=>'['+x.score.toFixed(2)+'] '+x.texto).join('\n\n'):'nenhum resultado'}catch(e){$('memSaida').textContent='Erro: '+e.message}};
$('memExportar').onclick=async()=>{try{baixarJson('myn-memoria.json',await window.myn.memoria.exportar(contextoMemoriaUI()))}catch(e){$('memSaida').textContent='Erro: '+e.message}};
$('ragExportar').onclick=async()=>{try{baixarJson('myn-rag.json',await window.myn.rag.exportar())}catch(e){$('memSaida').textContent='Erro: '+e.message}};
$('ragEmbeddings').onclick=async()=>{if(!confirm('Gerar embeddings locais via WebGPU? O download do modelo pode ser grande.'))return;try{const n=await window.myn.rag.gerarEmbeddings();$('ragInfo').textContent=n+' documentos com embedding neural';await carregarMemoriaUI()}catch(e){$('memSaida').textContent='Erro: '+e.message}};
$('memImportar').onclick=()=>$('memArquivo').click();$('memArquivo').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const j=JSON.parse(await f.text());if(j._myn==='myn-rag')await window.myn.rag.importar(j);else await window.myn.memoria.importar(j,contextoMemoriaUI());await carregarMemoriaUI()}catch(er){$('memSaida').textContent='Erro: '+er.message}finally{e.target.value=''}};
$('memLimpar').onclick=async()=>{if(!confirm('Limpar a memória deste escopo?'))return;try{await window.myn.memoria.limpar(contextoMemoriaUI());await carregarMemoriaUI()}catch(e){$('memSaida').textContent='Erro: '+e.message}};
const pp=$('painelProjetos');let projetoSelecionado=null;
function atualizarChipProjeto(nome){$('chipProjeto').textContent=nome?'projeto · '+nome:'sem projeto'}
function limparProjetoUI(){projetoSelecionado=null;sessionStorage.removeItem(PROJETO_ATIVO_KEY);$('projetoNome').value='';$('projetoInstrucoes').value='';$('memProjeto').value='';atualizarChipProjeto('');$('projetoArquivosLista').textContent='selecione um projeto';$('projetoStatus').textContent='novo projeto · preencha e salve'}
async function carregarProjetosUI(){try{await esperarMyn();const lista=await window.myn.projetos.listar();$('projetoCap').textContent=lista.length+' projetos';const alvo=$('projetoLista');alvo.innerHTML='';if(!lista.length){alvo.textContent='nenhum projeto salvo';return}for(const p of lista){const b=document.createElement('button');b.type='button';b.className='projeto-item'+(projetoSelecionado?.id===p.id?' on':'');b.dataset.id=p.id;const nome=document.createElement('b');nome.textContent=p.nome;const detalhe=document.createElement('small');detalhe.textContent=(p.instrucoes||'sem instruções').slice(0,100)+' · '+new Date(p.atualizadoEm).toLocaleString('pt-BR');b.append(nome,detalhe);b.onclick=()=>selecionarProjeto(p.id);alvo.appendChild(b)}}catch(e){$('projetoLista').textContent='Erro: '+e.message}}
async function carregarProjetosArquivosUI(){try{const alvo=$('projetoArquivosLista');alvo.innerHTML='';if(!projetoSelecionado){alvo.textContent='selecione um projeto';return}const arquivos=await window.myn.projetos.listarArquivos(projetoSelecionado.id);if(!arquivos.length){alvo.textContent='nenhum arquivo anexado';return}for(const a of arquivos){const linha=document.createElement('div');linha.className='projeto-arquivo';const nome=document.createElement('b');nome.textContent=a.nome;const tamanho=document.createElement('small');tamanho.textContent=a.tamanho.toLocaleString('pt-BR')+' caracteres';const remover=document.createElement('button');remover.type='button';remover.textContent='REMOVER';remover.onclick=async()=>{try{await window.myn.projetos.removerArquivo(projetoSelecionado.id,a.id);await carregarProjetosArquivosUI();$('projetoStatus').textContent='arquivo removido'}catch(e){$('projetoStatus').textContent='Erro: '+e.message}};linha.append(nome,tamanho,remover);alvo.appendChild(linha)}}catch(e){$('projetoArquivosLista').textContent='Erro: '+e.message}}
async function selecionarProjeto(id){try{await esperarMyn();const p=await window.myn.projetos.obter(id);if(!p)throw new Error('projeto não encontrado');projetoSelecionado=p;sessionStorage.setItem(PROJETO_ATIVO_KEY,p.id);$('projetoNome').value=p.nome;$('projetoInstrucoes').value=p.instrucoes;$('memProjeto').value=p.id;$('memEscopo').value='projeto';atualizarChipProjeto(p.nome);$('projetoStatus').textContent='projeto ativo · memória isolada por id';await carregarProjetosArquivosUI();await carregarProjetosUI()}catch(e){$('projetoStatus').textContent='Erro: '+e.message}}
async function inicializarProjetosUI(){await carregarProjetosUI();const id=sessionStorage.getItem(PROJETO_ATIVO_KEY);if(id)await selecionarProjeto(id)}
$('btnProjetos').onclick=()=>{pp.classList.toggle('on');document.body.classList.toggle('projetos-aberto',pp.classList.contains('on'));if(pp.classList.contains('on'))carregarProjetosUI()};$('fecharProjetos').onclick=()=>{pp.classList.remove('on');document.body.classList.remove('projetos-aberto')};
$('projetoNovo').onclick=()=>{limparProjetoUI();carregarProjetosUI();$('projetoNome').focus()};
$('projetoSalvar').onclick=async()=>{try{await esperarMyn();const dados={nome:$('projetoNome').value,instrucoes:$('projetoInstrucoes').value};const p=projetoSelecionado?await window.myn.projetos.atualizar(projetoSelecionado.id,dados):await window.myn.projetos.criar(dados);await selecionarProjeto(p.id);$('projetoStatus').textContent='projeto salvo neste navegador'}catch(e){$('projetoStatus').textContent='Erro: '+e.message}};
$('projetoExcluir').onclick=async()=>{if(!projetoSelecionado)return $('projetoStatus').textContent='selecione um projeto para excluir';if(!confirm('Excluir o projeto "'+projetoSelecionado.nome+'"? Os arquivos serão removidos e a memória da sessão será preservada.'))return;try{await window.myn.projetos.remover(projetoSelecionado.id);limparProjetoUI();await carregarProjetosUI();$('projetoStatus').textContent='projeto e arquivos excluídos · memória preservada'}catch(e){$('projetoStatus').textContent='Erro: '+e.message}};
$('projetoExportar').onclick=async()=>{try{baixarJson('myn-projetos.json',await window.myn.projetos.exportar());$('projetoStatus').textContent='projetos exportados'}catch(e){$('projetoStatus').textContent='Erro: '+e.message}};
$('projetoImportar').onclick=()=>$('projetoArquivo').click();$('projetoArquivo').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const r=await window.myn.projetos.importar(JSON.parse(await f.text()));await carregarProjetosUI();$('projetoStatus').textContent=r.projetos+' projetos e '+r.arquivos+' arquivos importados'}catch(er){$('projetoStatus').textContent='Erro: '+er.message}finally{e.target.value=''}};
$('projetoAnexar').onclick=()=>{if(!projetoSelecionado)return $('projetoStatus').textContent='salve e selecione um projeto antes de anexar';$('projetoArquivoAnexo').click()};
$('projetoArquivoAnexo').onchange=async e=>{const arquivos=[...e.target.files];if(!arquivos.length)return;if(!projetoSelecionado){e.target.value='';return $('projetoStatus').textContent='selecione um projeto'}try{let anexados=0;for(const f of arquivos){if(f.size>250000)throw new Error(f.name+' excede 250 mil bytes');const texto=await f.text();await window.myn.projetos.anexarArquivo(projetoSelecionado.id,{nome:f.name,tipoTexto:f.type||'text/plain',texto});anexados++}await carregarProjetosArquivosUI();$('projetoStatus').textContent=anexados+' arquivo(s) anexado(s)'}catch(er){$('projetoStatus').textContent='Erro: '+er.message}finally{e.target.value=''}};
$('projetoHistorico').onclick=async()=>{if(!projetoSelecionado)return $('projetoStatus').textContent='selecione um projeto para importar o histórico';try{const d=await fetch('/api/historico?limite=500').then(r=>r.json());const externos=(d.itens||[]).filter(x=>x.input).map((x,i)=>({id:'server:'+x.t+':'+i,texto:'['+x.tipo+'] '+x.input+(x.output?'\nRESPOSTA: '+(typeof x.output==='string'?x.output:JSON.stringify(x.output)):''),meta:{origem:'servidor',tipo:x.tipo}}));const r=await window.myn.projetos.importarHistorico(projetoSelecionado.id,500,externos);$('projetoStatus').textContent=r.importados+' registros importados · '+r.ignorados+' já existentes'}catch(e){$('projetoStatus').textContent='Erro: '+e.message}};
esperarMyn().then(inicializarProjetosUI).catch(()=>{});
const pv=$('painelVM'), pag=$('painelAgentes');
$('btnVM').onclick=()=>{pv.classList.toggle('on');if(pv.classList.contains('on'))carregarVM()};
if(PARAMS.get('vm')==='1'){pv.classList.add('on');carregarVM()}
$('fecharVM').onclick=()=>pv.classList.remove('on');
$('btnAgentes').onclick=()=>{pag.classList.toggle('on');if(pag.classList.contains('on'))$('agCap').textContent=window.myn?.capacidade?.modo||'—'};
$('fecharAgentes').onclick=()=>pag.classList.remove('on');
async function esperarMyn(){
 for(let i=0;i<200&&!window.myn;i++)await new Promise(r=>setTimeout(r,50));
 if(!window.myn)throw new Error('camada web não carregou');
 await window.myn.pronto;
}
async function carregarVM(){
 try{
  $('vmSaida').textContent='carregando VM Web...';
  await esperarMyn();
  $('pvCap').textContent=window.myn.capacidade.modo;
  const hd=await window.myn.vm.padrao.HD();
  $('vmHD').textContent=hd.length?hd.slice(-5).map(x=>x.nome).join(', '):'vazio — grave algo para começar';
  const cache=await window.myn.db.listar('cache',5);
  $('vmCache').textContent=cache.length?cache.map(x=>x.id).join(', '):'vazio';
  $('vmSaida').textContent='vm pronta...';
 }catch(e){$('vmSaida').textContent='Erro: '+e.message}
}
$('vmExec').onclick=async()=>{
 try{
  await esperarMyn();
  const args=JSON.parse($('vmArgs').value||'{}');
  const r=await window.myn.vm.padrao.executar($('vmOp').value.trim(),args);
  $('vmSaida').textContent=JSON.stringify(r,null,2);
  await window.myn.vm.padrao.gravarCache('vm:'+$('vmOp').value,{r,t:Date.now()});
  carregarVM();
 }catch(e){$('vmSaida').textContent='Erro: '+e.message}
};
$('agExec').onclick=async()=>{
 const saida=$('agSaida');saida.innerHTML='<div class="pv-linha">avaliando...</div>';
 try{
  const r=await window.myn.agentes.avaliarTodos($('agCodigo').value);
  saida.innerHTML=r.resultados.map(x=>'<div class="pv-linha"><b>'+esc(x.agente)+'</b> · '+esc(x.foco)+' · '+x.ms+'ms · '+esc(x.via)+'<br>'+esc(x.texto).replace(/\n/g,'<br>')+'</div>').join('');
 }catch(e){saida.innerHTML='<div class="pv-linha">Erro: '+esc(e.message)+'</div>'}
};

async function atualizarDadosPlayground(){
 try{
  const d=await carregarDados();
  $('msgRotas').textContent=d.totalPlugins;
  $('pluginsCount').textContent=d.totalPlugins+' plugins disponíveis';
  $('pwResumo').textContent=resumoWorkers(d);
 }catch(e){$('pwResumo').textContent='dados indisponíveis'}
}
atualizarDadosPlayground();
setInterval(atualizarDadosPlayground,30000);

const painelAgenteLocal=$('painelAgenteLocal');
async function carregarAgenteLocal(){
 try{
  const d=await (await fetch('/api/token')).json();
  $('alToken').value=d.token;$('alMcp').value=d.mcpUrl;$('alMessages').value=d.messagesUrl;
  $('alStatus').textContent='expira '+new Date(d.expiresAt).toLocaleDateString('pt-BR');
  $('alConfig').textContent=JSON.stringify({mcpServers:{'myn-recicla':{url:d.mcpUrl,headers:{Authorization:'Bearer '+d.token}}}},null,2);
 }catch(e){$('alStatus').textContent='erro: '+e.message}
}
async function copiarCampo(id){const v=$(id).value;try{await navigator.clipboard.writeText(v);$('alStatus').textContent='copiado'}catch{$('alStatus').textContent='copie manualmente'}}
$('btnAgenteLocal').onclick=()=>{painelAgenteLocal.classList.toggle('on');if(painelAgenteLocal.classList.contains('on'))carregarAgenteLocal()};
$('fecharAgenteLocal').onclick=()=>painelAgenteLocal.classList.remove('on');
$('copiarToken').onclick=()=>copiarCampo('alToken');
$('copiarMcp').onclick=()=>copiarCampo('alMcp');
$('copiarMessages').onclick=()=>copiarCampo('alMessages');
$('renovarToken').onclick=async()=>{try{await post('/api/token/renovar',{});await carregarAgenteLocal();$('alStatus').textContent='token renovado'}catch(e){$('alStatus').textContent='erro: '+e.message}};
