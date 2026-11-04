const $=id=>document.getElementById(id);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ss=(k,v)=>{try{if(v===undefined)return sessionStorage.getItem(k)||"";v===null?sessionStorage.removeItem(k):sessionStorage.setItem(k,v)}catch(e){return ""}};
const ls=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k)||"";localStorage.setItem(k,v)}catch(e){return ""}};
let pid=ss("bf_pid");if(!pid){pid=Math.random().toString(36).slice(2,10);ss("bf_pid",pid)}

// ====== SISTEMA DE ÁUDIO (Web Audio API) ======
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, duration, type='square', baseVol=0.05, channel='sfx') {
  const globalVol = channel === 'music' ? U.musicVol : U.sfxVol;
  if (globalVol <= 0) return; 
  if(audioCtx.state === 'suspended') audioCtx.resume();
  
  const vol = baseVol * globalVol;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

let musicInterval = null;
let currentMusicType = null;

function startMusic(type) {
  if(currentMusicType === type) return;
  if(musicInterval) clearInterval(musicInterval);
  currentMusicType = type;
  
  if (type === 'menu') {
    const notes = [261.63, 329.63, 392.00, 329.63]; // C4, E4, G4, E4
    let i = 0;
    musicInterval = setInterval(() => { playTone(notes[i % notes.length], 0.4, 'sine', 0.04, 'music'); i++; }, 600);
  } else if (type === 'lobby') {
    const notes = [220, 261.63, 329.63, 261.63];
    let i = 0;
    musicInterval = setInterval(() => { playTone(notes[i % notes.length], 0.3, 'triangle', 0.05, 'music'); i++; }, 500);
  } else if (type === 'game') {
    const notes = [110, 110, 130.81, 110];
    let i = 0;
    musicInterval = setInterval(() => {
      playTone(notes[i % notes.length], 0.15, 'sawtooth', 0.04, 'music');
      if(i % 2 === 0) playTone(220, 0.1, 'square', 0.04, 'music');
      i++;
    }, 300);
  } else if (type === 'victory') {
    const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50]; 
    let i = 0;
    musicInterval = setInterval(() => {
      playTone(notes[i % notes.length], 0.2, 'square', 0.04, 'music');
      if(i % 3 === 0) playTone(notes[i % notes.length] / 2, 0.4, 'triangle', 0.05, 'music');
      i++;
    }, 250);
  } else if (type === 'defeat') {
    const notes = [220.00, 261.63, 196.00, 174.61]; 
    let i = 0;
    musicInterval = setInterval(() => { playTone(notes[i % notes.length], 0.5, 'sawtooth', 0.05, 'music'); i++; }, 600);
  }
}

function stopMusic() {
  if(musicInterval) clearInterval(musicInterval);
  musicInterval = null;
  currentMusicType = null;
}

function sfxClick() { playTone(600, 0.05, 'square', 0.05, 'sfx'); }
function sfxReveal() { playTone(440, 0.1, 'sine', 0.1, 'sfx'); setTimeout(()=>playTone(880, 0.3, 'sine', 0.1, 'sfx'), 100); }
function sfxWin() { playTone(440, 0.1, 'square', 0.05, 'sfx'); setTimeout(()=>playTone(554, 0.1, 'square', 0.05, 'sfx'), 100); setTimeout(()=>playTone(659, 0.4, 'square', 0.05, 'sfx'), 200); }
function sfxLose() { playTone(300, 0.2, 'sawtooth', 0.05, 'sfx'); setTimeout(()=>playTone(250, 0.2, 'sawtooth', 0.05, 'sfx'), 150); setTimeout(()=>playTone(200, 0.4, 'sawtooth', 0.05, 'sfx'), 300); }

const CAT=[["des","🎨","Desenhos e animações"],["jog","🎮","Jogos e videogames"],["fil","🎬","Filmes e séries"],["per","🦸","Personagens"],["fut","⚽","Futebol"],["cel","⭐","Celebridades"],["ani","🐧","Animais"],["com","🍕","Comidas"],["lug","📍","Lugares"],["obj","🔑","Objetos"]];
const getVol = (key, def) => { let v = parseFloat(ls(key)); return isNaN(v) ? def : v; };

const U={
  scr:"title",
  name:ls("bf_name"),code:"",err:"",rv:false,ri:-1,gs:"",busy:false,modal:null,copied:false,copiedInvite:false,pro:ls("bf_pro")==="1",cw:null,avc:ls("bf_avc")||"#FF6A00",avem:ls("bf_avem")||"",lang:ls("bf_lang")||"pt-BR",country:ls("bf_country")||"BR",
  chat:[],chatInput:"",toast:"",toastT:null,suspects:{},
  askInput:"",ansInput:"",lastQaSub:"",lastQaTurnIdx:-1,finalSfxPlayed:false,
  musicVol: getVol("bf_mvol", 0.5), sfxVol: getVol("bf_svol", 0.8), settingsOpen: false, customizeOpen: false
};
const AV_CLR=["#FF6A00","#FF3D7F","#7C5CFF","#00C2A8","#2EA8FF","#FFD400","#5CD65C","#FF5C5C"];
const AV_EM = ["", "hat_cap", "hat_crown", "hat_party", "hat_top", "hat_halo", "hat_chef", "hat_mushroom", "hat_monkey", "bow_yellow", "shirt_tie", "shirt_cape", "shirt_armor", "shirt_scarf"];

function profilePicker(){
 const sw=AV_CLR.map(c=>'<button class="swatch'+(U.avc===c?" on":"")+'" data-a="avc" data-v="'+c+'" style="background:'+c+'" aria-label="Cor"></button>').join("");
 const em=AV_EM.map(e=>'<button class="chip emoji'+(U.avem===e?" on":"")+'" data-a="avem" data-v="'+esc(e)+'">'+pxCrew(U.avc, {}, e)+'</button>').join("");
 return '<div class="set"><div class="swgrid" style="justify-content:center;margin-bottom:12px">'+sw+'</div><div class="grid" style="grid-template-columns:repeat(5,1fr);">'+em+'</div></div>';
}
// ====== Google AdSense ======
const ADSENSE_CLIENT = "ca-pub-4306159658150251";
const ADSENSE_SLOTS = {
  "entry":  "8847325784", "lobby":  "6864547310", "final":  "4601134021", "rail-l": "6864547310", "rail-r": "7510368394"
};
function adSlot(id){return '<div class="adslot" data-ad-marker="'+esc(id||"")+'">📣 Espaço reservado para anúncio</div>'}
const AD_SLOTS={};
function buildAdEl(id){
 const el=document.createElement("div");
 const slotId = ADSENSE_SLOTS[id];
 const hasRealSlot = slotId && !/^SLOT_/.test(slotId);
 if(ADSENSE_CLIENT && hasRealSlot){
  el.className="adslot-live";
  const ins=document.createElement("ins");
  ins.className="adsbygoogle";ins.style.display="block";
  ins.setAttribute("data-ad-client",ADSENSE_CLIENT);
  ins.setAttribute("data-ad-slot",slotId);
  ins.setAttribute("data-ad-format","auto");
  ins.setAttribute("data-full-width-responsive","true");
  el.appendChild(ins);
  try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){}
 }else{ el.className="adslot"; el.textContent="📣 Espaço reservado para anúncio"; }
 return el;
}
function mountAd(id){
 const marker=document.querySelector('[data-ad-marker="'+id+'"]');
 if(!marker)return;
 if(!AD_SLOTS[id])AD_SLOTS[id]=buildAdEl(id);
 marker.replaceWith(AD_SLOTS[id]);
}

// ====== MENUS E MODAIS ======
function proModal(){
 if(!U.modal)return "";
 return '<div class="modal-ov"><div class="modal"><div class="row" style="justify-content:space-between;align-items:center"><h2 style="margin:0">✨ Bluffin PRO</h2><button class="btn g" data-a="closeModal" style="width:auto;min-height:auto;padding:4px 10px;border-radius:10px">✕</button></div><p class="mut">Em breve: sem anúncios, temas exclusivos e mais opções pra sua sala.</p><ul><li>Sem anúncios</li><li>Temas e palavras exclusivas</li><li>Salas maiores</li><li>Cores e emblemas no perfil</li></ul><button class="btn p" data-a="closeModal">Entendi, já volto</button></div></div>'
}
function settingsModal(){
 if(!U.settingsOpen) return "";
 return `<div class="modal-ov"><div class="modal">
   <div class="row" style="justify-content:space-between;align-items:center">
     <h2 style="margin:0">⚙️ Ajustes</h2>
     <button class="btn g" data-a="closeSettings" style="width:auto;min-height:auto;padding:4px 10px;border-radius:10px">✕</button>
   </div>
   <div class="set">
     <b>Música: <span id="mvol-label">${Math.round(U.musicVol*100)}%</span></b>
     <input type="range" id="mvol" min="0" max="1" step="0.05" value="${U.musicVol}">
   </div>
   <div class="set">
     <b>Efeitos Sonoros: <span id="svol-label">${Math.round(U.sfxVol*100)}%</span></b>
     <input type="range" id="svol" min="0" max="1" step="0.05" value="${U.sfxVol}">
   </div>
   <button class="btn p" data-a="closeSettings">Pronto</button>
 </div></div>`;
}
function customizeModal(){
 if(!U.customizeOpen) return "";
 return `<div class="modal-ov"><div class="modal">
   <div class="row" style="justify-content:space-between;align-items:center">
     <h2 style="margin:0">👾 Personalizar</h2>
     <button class="btn g" data-a="closeCustomize" style="width:auto;min-height:auto;padding:4px 10px;border-radius:10px">✕</button>
   </div>
   <p class="mut" style="margin-bottom:0">Mude seu alien para os amigos te reconhecerem.</p>
   ${profilePicker()}
   <button class="btn p" data-a="closeCustomize" style="margin-top:10px">Salvar</button>
 </div></div>`;
}
function howToPlayModal(){
 if(U.modal !== "howto") return "";
 return `<div class="modal-ov"><div class="modal">
   <div class="row" style="justify-content:space-between;align-items:center">
     <h2 style="margin:0">Como Jogar</h2>
     <button class="btn g" data-a="closeModal" style="width:auto;min-height:auto;padding:4px 10px;border-radius:10px">✕</button>
   </div>
   <ul class="mut" style="font-size:15px">
     <li><b>O Grupo:</b> Todos recebem a mesma palavra secreta, menos o impostor.</li>
     <li><b>Perguntas:</b> Cada jogador faz uma pergunta por rodada. As respostas devem ser vagas o suficiente para não entregar a palavra, mas claras para provar que você sabe.</li>
     <li><b>Votação:</b> Após as rodadas, todos votam em quem acham que é o impostor.</li>
     <li><b>O Impostor:</b> Se for descoberto, tem uma última chance de adivinhar a palavra secreta para virar o jogo!</li>
   </ul>
   <button class="btn p" data-a="closeModal">Entendi</button>
 </div></div>`;
}

function shade(h,f){const n=parseInt(h.slice(1),16);return "#"+[16,8,0].map(k=>Math.round(((n>>k)&255)*f).toString(16).padStart(2,"0")).join("")}
const CREW=["............","...oooooo...","..oooooooo..","..oohhhhoo..",".oovv..vvoo.",".oohhhhhhoo.",".obbbbbbbbo.",".obbbbbbbbo.",".obbssssbbo.",".obbbbbbbbo.",".obb....bbo.","..oo....oo..","............"];
const SUS={ol:"#2a1f3d",vz:"#ff2d4a",hl:"#ffb3b3"};
const WM="ALGUÉM AQUI ESTÁ MENTINDO…";
const SEEN={};

function pxCrew(c,o,em){
 o=o||{};c=/^#[0-9a-f]{6}$/i.test(c||"")?c:"#FF6A00";
 const P={o:o.ol||"#120b22",b:c,s:shade(c,.68),v:o.vz||"#bff3ff",h:o.hl||"#ffffff"};let r="";
 CREW.forEach((row,y)=>{let x=0;while(x<12){const k=row[x];if(k==="."){x++;continue}let e=x;while(e<12&&row[e]===k)e++;r+='<rect x="'+x+'" y="'+y+'" width="'+(e-x)+'" height="1" fill="'+P[k]+'"/>';x=e}});
 
 // ===== CHAPÉUS (em cima da cabeça) =====
 if (em === "hat_cap") { r += '<rect x="2" y="-1" width="8" height="2" fill="#FF3D7F"/><rect x="1" y="1" width="10" height="1" fill="#D7191F"/>'; }
 else if (em === "hat_crown") { r += '<rect x="2" y="-2" width="1" height="3" fill="#FFD400"/><rect x="5" y="-2" width="2" height="3" fill="#FFD400"/><rect x="9" y="-2" width="1" height="3" fill="#FFD400"/><rect x="2" y="0" width="8" height="1" fill="#FFD400"/>'; }
 else if (em === "hat_party") { r += '<rect x="6" y="-3" width="1" height="1" fill="#FF6A00"/><rect x="5" y="-2" width="3" height="1" fill="#2EA8FF"/><rect x="4" y="-1" width="5" height="1" fill="#5CD65C"/><rect x="3" y="0" width="7" height="1" fill="#FFD400"/>'; }
 else if (em === "hat_top") { r += '<rect x="2" y="1" width="8" height="1" fill="#171717"/><rect x="3" y="-2" width="6" height="3" fill="#171717"/>'; }
 else if (em === "hat_halo") { r += '<rect x="3" y="-2" width="6" height="1" fill="#FFD400"/>'; }
 else if (em === "hat_chef") { r += '<rect x="2" y="-2" width="8" height="3" fill="#FFFFFF"/>'; }
 
 // ===== NOVOS CHAPÉUS =====
 // 🍄 Chapéu de cogumelo (vermelho com bolinhas brancas)
 else if (em === "hat_mushroom") {
   // Corpo do cogumelo (mais colado na cabeça)
   r += '<rect x="3" y="-1" width="6" height="1" fill="#E82C2C"/>';   // Topo arredondado
   r += '<rect x="1" y="0" width="10" height="1" fill="#E82C2C"/>';   // Meio largo
   r += '<rect x="1" y="1" width="10" height="1" fill="#D7191F"/>';   // Base (sombra)
   
   // Bolinhas brancas
   r += '<rect x="3" y="0" width="1" height="1" fill="#FFFFFF"/>';    // Bolinha esquerda
   r += '<rect x="8" y="0" width="1" height="1" fill="#FFFFFF"/>';    // Bolinha direita
   r += '<rect x="5" y="-1" width="2" height="1" fill="#FFFFFF"/>';   // Bolinha topo
   r += '<rect x="4" y="1" width="1" height="1" fill="#FFFFFF"/>';    // Bolinha base esq
   r += '<rect x="7" y="1" width="1" height="1" fill="#FFFFFF"/>';    // Bolinha base dir
 }
 // 🐒 Chapéu do Macaco Louco (roxo com detalhes brancos)
 else if (em === "hat_monkey") {
   // Corpo principal do gorro (descendo até encostar na cabeça)
   r += '<rect x="2" y="-1" width="8" height="2" fill="#8B3FE8"/>';   // Topo arredondado
   r += '<rect x="1" y="1" width="10" height="1" fill="#7C5CFF"/>';   // Base do gorro (mais larga)
   
   // Detalhes (Orelhas/bolinhas do macaco)
   r += '<rect x="2" y="-1" width="1" height="2" fill="#FFFFFF"/>';   // Orelha esquerda
   r += '<rect x="9" y="-1" width="1" height="2" fill="#FFFFFF"/>';   // Orelha direita
   
   // Detalhe da testa
   r += '<rect x="4" y="0" width="4" height="1" fill="#FFFFFF"/>';    // Faixa branca central
 }
 
 // ===== ACESSÓRIO DE CABEÇA (lado) =====
 // 🎀 Laço amarelo (no lado direito da cabeça)
 else if (em === "bow_yellow") {
   r += '<rect x="10" y="1" width="2" height="1" fill="#FFD400"/>';   // parte de cima do laço
   r += '<rect x="9" y="2" width="1" height="1" fill="#FFD400"/>';    // aba esquerda
   r += '<rect x="11" y="2" width="1" height="1" fill="#FFD400"/>';   // aba direita
   r += '<rect x="10" y="2" width="1" height="1" fill="#FFB300"/>';   // nó central
   r += '<rect x="10" y="3" width="2" height="1" fill="#FFD400"/>';   // parte de baixo
 }
 
 // ===== CAMISAS =====
 else if (em === "shirt_tie") { r += '<rect x="6" y="5" width="1" height="3" fill="#D7191F"/>'; }
 else if (em === "shirt_cape") { r += '<rect x="0" y="6" width="1" height="5" fill="#7C5CFF"/><rect x="11" y="6" width="1" height="5" fill="#7C5CFF"/>'; }
 else if (em === "shirt_armor") { r += '<rect x="4" y="6" width="4" height="3" fill="#A6A6A6"/>'; }
 else if (em === "shirt_scarf") { r += '<rect x="2" y="5" width="8" height="1" fill="#5CD65C"/>'; }

 return '<svg viewBox="-2 -3 16 18" shape-rendering="crispEdges" aria-hidden="true">'+r+'</svg>';
}

function lobbyHead(){
 const ps=S.players,onl=ps.filter(p=>p.on).length;
 return '<div class="px-scene"><i class="px-stars"></i><i class="px-stars b"></i><i class="px-lamp"></i><div class="px-crew">'+ps.slice(0,10).map((p,i)=>'<div class="px-c'+(p.on?"":" off")+'" style="animation-delay:'+(i*.18)+'s">'+pxCrew(p.clr,{},p.em)+'</div>').join("")+'<div class="px-sus">'+pxCrew("#1a1326",SUS)+'</div></div><div class="px-floor"></div></div><h2 class="px-t">Sala de espera</h2><div class="wm" aria-hidden="true">'+esc(WM)+'</div><p class="px-st"><span class="px-dot">●</span> '+onl+' A BORDO · SHHH</p>';
}
function lobbyList(ps){
 return '<div class="pls">'+ps.map(p=>{const nw=!SEEN[p.id];SEEN[p.id]=1;
  return '<div class="pl'+(p.on?"":" off")+(nw?" new":"")+'">'+pxCrew(p.clr,{},p.em)+'<span class="pn">'+esc(p.n)+'</span>'+(p.id===S.host?'<b class="tg">HOST</b>':'')+(p.id===S.me?'<b class="tg me">VOCÊ</b>':'')+(p.v?'<span>🎙</span>':'')+(p.on?'':'<span class="mut" style="font-size:12px">offline</span>')+'</div>'}).join("")+'</div>';
}
function modeSets(){
 return '<div class="set"><b>Modo de jogo</b>'+seg("mode",[["classic","Clássico"],["blind","Nem o impostor sabe"]])+'<p class="mut" style="margin:6px 0 0;font-size:14px">'+(S.cfg.mode==="blind"?"O impostor recebe uma palavra parecida e não sabe que é o impostor. Ele só descobre na revelação.":"O impostor sabe que é o impostor e tenta descobrir a palavra pelas respostas.")+'</p></div>'+(S.cfg.mode==="blind"?"":'<div class="set"><b>Dica para o impostor que abrir as perguntas</b>'+seg("hint",[[true,"Ligada"],[false,"Desligada"]])+'</div>');
}
function codeRow(){
 const canShare=!!navigator.share;
 const right=canShare
   ?'<button class="btn g" data-a="share" style="width:auto;flex:1">Compartilhar</button>'
   :'<button class="btn g" data-a="copyInvite" style="width:auto;flex:1">'+(U.copiedInvite?"Copiado!":"Copiar convite")+'</button>';
 return '<div class="row"><button class="btn g" data-a="copyCode" style="width:auto;flex:1">'+(U.copied?"Copiado!":"Copiar código")+'</button>'+right+'</div>';
}
let S=null,ws=null,off=0,ICE=[{urls:"stun:stun.l.google.com:19302"}],tt=null,lastSig="",retry=0,wantCreate=false;
const V={on:false,muted:false,stream:null,pcs:{},auds:{}};

function send(o){if(ws&&ws.readyState===1)ws.send(JSON.stringify(o))}
function connect(create,code){
 U.busy=true;U.err="";wantCreate=create;rr();
 ws=new WebSocket((location.protocol==="https:"?"wss://":"ws://")+location.host);
 ws.onopen=()=>{retry=0;send({t:"join",name:U.name,pid,create,code,clr:U.avc,em:U.avem,country:U.country})};
 ws.onmessage=e=>{
  let m;try{m=JSON.parse(e.data)}catch(_){return}
  if(m.t==="s"){
   off=m.now-Date.now();delete m.now;S=m;U.scr="game";U.busy=false;U.err="";U.code=m.code;ss("bf_room",m.code);
   if(Array.isArray(m.chat)){
     const ids=new Set(U.chat.map(x=>x.id));
     for(const c of m.chat) if(!ids.has(c.id)) U.chat.push(c);
     U.chat.sort((a,b)=>a.ts-b.ts);
     if(U.chat.length>100) U.chat=U.chat.slice(-100);
   }
   if(U.ri!==m.ri){U.ri=m.ri;U.rv=false;U.gs="";U.discOpen=null;U.suspects={}}
   if(m.qa){
     if(U.lastQaSub!==m.qa.sub || U.lastQaTurnIdx!==m.qa.turnIdx){
       if(m.qa.sub==="ask") U.askInput=""; else U.ansInput="";
       U.lastQaSub=m.qa.sub; U.lastQaTurnIdx=m.qa.turnIdx;
     }
   } else {
     U.lastQaSub=""; U.lastQaTurnIdx=-1;
   }
   voiceSync();rr();
  }
  else if(m.t==="chat"){ U.chat.push(m.msg); if(U.chat.length>100) U.chat.shift(); rr(); }
  else if(m.t==="sys"){U.toast=m.m;rr();clearTimeout(U.toastT);U.toastT=setTimeout(()=>{U.toast="";rr()},3500)}
  else if(m.t==="ice")ICE=m.ice;
  else if(m.t==="sig")onSig(m.from,m.d);
  else if(m.t==="err"){U.err=m.m;U.busy=false;U.scr="entry";S=null;ss("bf_room",null);try{ws.onclose=null;ws.close()}catch(_){};rr()}
 };
 ws.onclose=()=>{if(U.scr==="game"&&ss("bf_room")){const code=ss("bf_room");setTimeout(()=>connect(false,code),Math.min(5000,1000*(++retry)))}else{U.busy=false;rr()}};
}
const me=()=>S&&S.players.find(p=>p.id===S.me);
const nm=id=>(S.nm&&S.nm[id])||((S.players.find(p=>p.id===id)||{}).n)||"?";
const isH=()=>S&&S.me===S.host;

/* ---------- áudio ---------- */
function canTalk(id){
 if(!S||S.cfg.voice==="off")return false;
 if(S.ph==="role")return false;
 if(S.cfg.voice==="open")return true;
 if(S.ph==="qa" && S.qa && S.qa.sub==="ask") return S.qa.currentPlayer === id;
 return true;
}
async function voiceJoin(){
 try{V.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}})}
 catch(e){U.err="Não consegui acessar o microfone. Libere a permissão no navegador.";rr();return}
 V.on=true;V.muted=false;U.err="";send({t:"voice",on:true});voiceSync();rr();
}
function voiceLeave(){
 Object.keys(V.pcs).forEach(hang);if(V.stream)V.stream.getTracks().forEach(t=>t.stop());
 V.stream=null;V.on=false;send({t:"voice",on:false});rr();
}
function hang(id){const pc=V.pcs[id];if(pc){pc.onicecandidate=null;pc.close();delete V.pcs[id]}const a=V.auds[id];if(a){a.srcObject=null;delete V.auds[id]}}
function voiceSync(){
 if(!S)return;
 if(V.on&&S.cfg.voice==="off"){voiceLeave();return}
 const self=S.players.find(p=>p.id===S.me);
 if(V.on&&self&&!self.v)send({t:"voice",on:true});
 if(V.stream)V.stream.getAudioTracks().forEach(t=>t.enabled=!V.muted&&canTalk(S.me));
 S.players.forEach(p=>{if(p.id===S.me)return;
  if(V.on&&p.v&&!V.pcs[p.id]&&S.me<p.id)call(p.id);
  if((!V.on||!p.v)&&V.pcs[p.id])hang(p.id);
  const a=V.auds[p.id];if(a)a.muted=!canTalk(p.id)});
}
function mkpc(id){
 const pc=new RTCPeerConnection({iceServers:ICE});V.pcs[id]=pc;
 V.stream.getTracks().forEach(t=>pc.addTrack(t,V.stream));
 pc.onicecandidate=e=>{if(e.candidate)send({t:"sig",to:id,d:{c:e.candidate}})};
 pc.ontrack=e=>{let a=V.auds[id];if(!a){a=new Audio();a.autoplay=true;V.auds[id]=a}a.srcObject=e.streams[0];a.muted=!canTalk(id);a.play().catch(()=>{})};
 pc.onconnectionstatechange=()=>{if(pc.connectionState==="failed"&&V.pcs[id]===pc){hang(id);setTimeout(voiceSync,1500)}};
 return pc;
}
async function flush(pc){const q=pc.q||[];pc.q=[];for(const c of q){try{await pc.addIceCandidate(c)}catch(e){}}}
async function call(id){
 try{ const pc=mkpc(id); await pc.setLocalDescription(await pc.createOffer()); send({t:"sig",to:id,d:{s:pc.localDescription}}); }
 catch(e){console.warn("offer falhou",id,e);hang(id)}
}
async function onSig(from,d){
 if(!V.on||!V.stream)return;let pc=V.pcs[from];
 try{
  if(d.s){
   if(d.s.type==="offer"){if(pc)hang(from);pc=mkpc(from);await pc.setRemoteDescription(d.s);await pc.setLocalDescription(await pc.createAnswer());send({t:"sig",to:from,d:{s:pc.localDescription}});await flush(pc)}
   else if(pc){await pc.setRemoteDescription(d.s);await flush(pc)}
  }else if(d.c&&pc){if(pc.remoteDescription)await pc.addIceCandidate(d.c);else(pc.q=pc.q||[]).push(d.c)}
 }catch(e){}
}

/* ---------- telas ---------- */
const seg=(k,opts)=>'<div class="seg">'+opts.map(([v,l])=>'<button class="chip '+(String(S.cfg[k])===String(v)?"on":"")+'" data-a="cfg" data-k="'+k+'" data-v="'+v+'">'+l+'</button>').join("")+'</div>';
const hb=(a,t,dis)=>isH()?'<button class="btn p" data-a="'+a+'" '+(dis?"disabled":"")+'>'+t+'</button>':'';

function roleBlock(){
 const w=S.role;if(w===null||w===undefined)return "";
 if(!U.rv)return '<button class="btn g" data-a="rv">Mostrar meu papel</button>';
 const isImp = w==="#";
 const myPlayer = S.players.find(p => p.id === S.me) || {clr: U.avc, em: U.avem};
 
 if (isImp) {
   return '<div class="secret imp"><div class="avatar-large">'+pxCrew(myPlayer.clr, SUS, myPlayer.em)+'</div>Você é o IMPOSTOR<small>Descubra a palavra pelas respostas dos outros.</small>'+(S.hint?'<small class="hint">Dica: '+esc(S.hint)+'</small>':'')+'</div><button class="btn g" data-a="rv">Ocultar meu papel</button>';
 } else {
   return '<div class="secret word"><div class="avatar-large">'+pxCrew(myPlayer.clr, {ol:"#000",vz:"#2EA8FF"}, myPlayer.em)+'</div><small>A palavra é</small>'+esc(w)+'<small>Tema: '+esc(S.ct||"")+'</small></div><button class="btn g" data-a="rv">Ocultar meu papel</button>';
 }
}

function voiceBox(){
 const m=S.cfg.voice;if(m==="off")return "";
 const how=m==="turns"?"Só quem está perguntando fala. Nas respostas e na discussão, todos falam.":"Todos podem falar o tempo todo.";
 if(!V.on)return '<div class="vbox"><b>Áudio do jogo</b><p class="mut">'+how+'</p><button class="btn p" data-a="vjoin">🎙 Entrar no áudio</button></div>';
 const can=canTalk(S.me)&&!V.muted;
 return '<div class="vbox"><b>Áudio do jogo · <span class="'+(can?"live":"mut")+'">'+(V.muted?"microfone mudo":can?"você está no ar":"microfone fechado agora")+'</span></b><div class="row"><button class="btn g" data-a="vmute">'+(V.muted?"Ligar microfone":"Silenciar")+'</button><button class="btn g" data-a="vleave">Sair do áudio</button></div></div>';
}
function topBar(){
 const onl=S.players.filter(p=>p.on).length;
 const theme=S.ct?' · Tema: <b>'+esc(S.ct)+'</b>':'';
 return '<div class="topbar"><p class="mut" style="margin:0">Sala <b>'+esc(S.code)+'</b>'+theme+'</p><div class="row">'+(isH()&&S.ph!=="lobby"?'<button class="btn g tiny" data-a="restart" title="Reiniciar partida">↻ Reiniciar</button>':'')+'<button class="btn g tiny" data-a="settings" title="Ajustes">⚙️</button><button class="btn g tiny" data-a="leave" title="Sair da sala">Sair</button></div></div>'+(U.err?'<p class="err">'+esc(U.err)+'</p>':'');
}
function renderQaHistory(history){
 if(!history||!history.length)return "";
 return '<details class="card" style="padding:10px 14px"><summary class="mut" style="cursor:pointer;font-size:14px">Ver perguntas anteriores ('+history.length+')</summary><div style="margin-top:10px;display:flex;flex-direction:column;gap:10px">'+history.slice(-5).map(h=>'<div><b class="mut">'+esc(nm(h.author))+' perguntou:</b><div>'+esc(h.question)+'</div></div>').join("")+'</div></details>';
}
function playerAnswers(pid){
 if(!S||!S.qa||!Array.isArray(S.qa.history))return [];
 return S.qa.history.filter(h=>h.answers&&h.answers[pid]!==undefined).map(h=>({q:h.question,by:h.author,a:h.answers[pid]}));
}
function discAnswersBlock(){
 if(!S.qa||!Array.isArray(S.qa.history)||!S.qa.history.length)return "";
 const rows=S.pl.map(id=>{
  const open=U.discOpen===id,ans=playerAnswers(id);
  const head='<button class="chip'+(open?" on":"")+'" data-a="discToggle" data-i="'+id+'" style="width:100%;text-align:left;display:flex;justify-content:space-between;align-items:center"><span>'+esc(nm(id))+'</span><span class="mut" style="font-weight:600">'+ans.length+(ans.length===1?" resposta":" respostas")+' '+(open?"▲":"▼")+'</span></button>';
  const body=open?('<div class="card" style="margin:6px 0 10px">'+(ans.length?ans.map(x=>'<div style="margin-bottom:10px"><b class="mut" style="font-size:13px">'+esc(nm(x.by))+' perguntou</b><div style="margin:2px 0">'+esc(x.q)+'</div><div><b>Resposta:</b> '+esc(x.a)+'</div></div>').join(""):'<p class="mut">Essa pessoa não respondeu nenhuma pergunta nesta rodada.</p>')+'</div>'):'';
  return head+body;
 }).join("");
 return '<div class="set"><b>Respostas da rodada</b><p class="mut" style="font-size:14px;margin:0 0 4px">Toque num nome pra rever o que essa pessoa respondeu.</p>'+rows+'</div>';
}
function qaSuspectBoard(){
 // Usa a lista oficial da rodada como base; não depende do status online do lobby.
 const roster=Array.isArray(S.pl)?S.pl:[];
 const players=roster.filter(id=>id!==S.me).map(id=>S.players.find(p=>p.id===id)||{id,n:nm(id),clr:"#8b5cf6",em:""});
 return '<section class="qa-suspects"><div class="qa-suspects-head"><b>🕵️ Minhas teorias</b><span class="mut">Toque nos aliens para marcar</span></div>'+(players.length?'<div class="qa-suspects-grid">'+players.map(p=>{
  const marked=!!U.suspects[p.id];
  return '<button type="button" class="qa-suspect '+(marked?'marked':'')+'" data-a="toggleSuspect" data-i="'+esc(p.id)+'" aria-pressed="'+marked+'"><span class="qa-suspect-alien">'+pxCrew(p.clr||"#8b5cf6",{},p.em||"")+'</span><span class="qa-suspect-name">'+esc(nm(p.id))+'</span>'+(marked?'<span class="qa-suspect-tag">SUSPEITO</span>':'<span class="qa-suspect-hint">Marcar</span>')+'</button>';
 }).join('')+'</div>':'<p class="mut">Não encontrei outros jogadores nesta rodada.</p>')+'<p class="mut qa-suspects-note">Só você vê essas marcações. Elas não afetam a votação.</p></section>';
}

function game(){
 const vb=voiceBox(),top=topBar();
 const inG=(S.pl||[]).includes(S.me);
 switch(S.ph){
 case "lobby":{
  const ps=S.players,onl=ps.filter(p=>p.on).length;
  const names=lobbyList(ps);
  if(!isH()){const c=S.cfg;return top+lobbyHead()+'<div class="code">'+esc(S.code)+'</div>'+codeRow()+names+'<div class="row"><button class="btn g" data-a="openCustomize" style="flex:1">👾 Personalizar Alien</button></div><div class="card mut">O anfitrião ajusta a partida.<br>Modo: '+(c.mode==="blind"?"Nem o impostor sabe":"Clássico")+' · Impostores: '+c.imps+' · Ciclos de perguntas: '+c.hr+' · Discussão: '+(c.timer?c.timer+" min":"livre")+' · Última chance: '+(c.last?"sim":"não")+' · Áudio: '+({off:"desligado",turns:"por turnos",open:"aberto"})[c.voice]+' · Palavras: '+(c.wordMode==="international"?"Internacional":"Nacional · "+(({BR:"Brasil",US:"EUA",GB:"Reino Unido",PT:"Portugal",ES:"Espanha",DE:"Alemanha",FR:"França",IT:"Itália"})[c.country]||"País do anfitrião"))+'</div>'+vb+adSlot("lobby")}
  const bad=onl<3||(S.cfg.imps===2&&onl<5);
  return top+lobbyHead()+'<p class="mut">Mande o link <b>'+esc(location.origin)+'</b> e o código:</p><div class="code">'+esc(S.code)+'</div>'+codeRow()+names+
  '<div class="row"><button class="btn g" data-a="openCustomize" style="flex:1">👾 Personalizar Alien</button></div>'+
  '<div class="set"><b>Tema</b><div class="grid">'+CAT.map(([k,e,n])=>'<button class="chip '+(S.cfg.theme===k?"on":"")+'" data-a="cfg" data-k="theme" data-v="'+k+'">'+e+" "+n+'</button>').join("")+'<button class="chip '+(S.cfg.theme==="all"?"on":"")+'" data-a="cfg" data-k="theme" data-v="all">🌍 Todos</button><button class="chip '+(S.cfg.theme==="random"?"on":"")+'" data-a="cfg" data-k="theme" data-v="random">🎲 Aleatório</button><button class="chip '+(S.cfg.theme==="custom"?"on":"")+'" data-a="cfg" data-k="theme" data-v="custom" style="grid-column:1/-1">✏️ Palavras do grupo</button></div></div>'+(S.cfg.theme==="custom"?'<textarea id="cw" placeholder="Uma palavra por linha ou separadas por vírgula (mínimo 2)">'+esc(U.cw!==null?U.cw:S.cfg.custom)+'</textarea>':'')+
  '<div class="set"><b>Origem das palavras</b><div class="seg"><button class="chip '+((S.cfg.wordMode||"national")==="national"?"on":"")+'" data-a="cfg" data-k="wordMode" data-v="national">🏠 Nacional · '+esc(({BR:"Brasil",US:"EUA",GB:"Reino Unido",PT:"Portugal",ES:"Espanha",DE:"Alemanha",FR:"França",IT:"Itália"})[S.cfg.country]||"País do anfitrião")+'</button><button class="chip '+(S.cfg.wordMode==="international"?"on":"")+'" data-a="cfg" data-k="wordMode" data-v="international">🌎 Internacional</button></div><p class="mut" style="font-size:12px;margin:6px 0 0">Nacional usa o país configurado no perfil do anfitrião. Internacional usa referências de vários países.</p></div>'+
  modeSets()+'<div class="set"><b>Impostores (2 só com 5 ou mais jogadores)</b>'+seg("imps",[[1,"1"],[2,"2"]])+'</div><div class="set"><b>Ciclos de perguntas antes da votação</b>'+seg("hr",[[1,"1"],[2,"2"],[3,"3"],[4,"4"],[5,"5"]])+'</div><div class="set"><b>Tempo de discussão</b>'+seg("timer",[[0,"Livre"],[1,"1 min"],[2,"2 min"],[3,"3 min"],[5,"5 min"]])+'</div><div class="set"><b>Última chance do impostor</b>'+seg("last",[[true,"Ligada"],[false,"Desligada"]])+'</div><div class="set"><b>Empate na votação</b>'+seg("tie",[["revote","Votar de novo"],["imp","Impostor vence"]])+'</div><div class="set"><b>Áudio dentro do jogo</b>'+seg("voice",[["off","Desligado"],["turns","Por turnos"],["open","Aberto"]])+'</div>'+vb+adSlot("lobby")+
  (bad?'<p class="mut">Precisa de 3 jogadores online ou mais'+(S.cfg.imps===2?' (5 para 2 impostores)':'')+'.</p>':'')+hb("start","Começar rodada",bad)}
 case "role":{
  if(!inG)return top+'<h2>Rodada em andamento</h2><p class="mut">Você entra na próxima.</p>'+vb;
  return top+(S.md==="blind"?'<h2>Sua palavra</h2><p class="mut">Só você vê esta tela. Alguém pode ter recebido uma palavra parecida com a sua.</p>':'<h2>Seu papel</h2><p class="mut">Só você vê esta tela.</p>')+(U.rv?roleBlock():'<div class="secret hid"><span>Toque para revelar</span></div><button class="btn p" data-a="rv">Revelar meu papel</button>')+(S.ready?'<p class="mut">Pronto. Aguardando os outros ('+S.nready+' de '+S.pl.length+').</p>':'<button class="btn p" data-a="ready">Entendi, estou pronto</button>')+vb+hb("skipRole","Começar perguntas agora")}
 case "qa":{
  const qa=S.qa;if(!qa)return top+qaSuspectBoard();
  const n=S.ord.length;
  const curIdx=qa.turnIdx%n;
  const curId=S.ord[curIdx];
  const isCurrent=curId===S.me;
  const qInCycle=(qa.turnIdx%n)+1;
  let main=qaSuspectBoard();
  if(qa.sub==="ask"){
   main+='<p class="mut">Ciclo <b>'+(qa.round+1)+'/'+S.hr+'</b> · Pergunta <b>'+qInCycle+'/'+n+'</b></p>';
   if(isCurrent){
    main+='<div class="card"><b>É sua vez de perguntar</b><p class="mut" style="margin:4px 0 8px">Faça uma pergunta sobre a palavra (sem dizer a palavra).</p><textarea id="qa-ask" placeholder="Ex: Onde você costuma ver isso?" maxlength="200">'+esc(U.askInput||'')+'</textarea><button class="btn p" data-a="ask" style="margin-top:8px">Enviar pergunta</button></div>';
   }else{
    main+='<div class="card mut">Aguardando <b>'+esc(nm(curId))+'</b> fazer uma pergunta...</div>';
   }
   const asked=S.ord.slice(0,qa.turnIdx%n);
   if(asked.length)main+='<p class="mut" style="font-size:14px">Já perguntaram neste ciclo: '+asked.map(i=>esc(nm(i))).join(", ")+'</p>';
  }else{
   main+='<p class="mut">Ciclo <b>'+(qa.round+1)+'/'+S.hr+'</b> · <b>'+esc(nm(curId))+'</b> perguntou:</p>';
   main+='<div class="qa-q">'+esc(qa.question)+'</div>';
   const others=S.pl.filter(i=>i!==curId);
   const answerOrder=Array.isArray(qa.answerOrder)&&qa.answerOrder.length?qa.answerOrder: S.ord.filter(i=>i!==curId);
   const currentAnswerer=qa.currentAnswerer || answerOrder.find(i=>qa.answers[i]===undefined) || null;
   main+='<p class="mut">Respostas por fila: '+(qa.sub==="done"?'todas as respostas chegaram.':currentAnswerer?'agora é a vez de <b>'+esc(nm(currentAnswerer))+'</b>.':'todas as respostas foram enviadas.')+'</p>';
   main+='<div class="qa-answers">'+others.map(i=>{
    const ans=qa.answers[i];
    const waitingTurn=ans===undefined && i===currentAnswerer;
    return '<div class="qa-ans '+(ans!==undefined?"done":"")+' '+(waitingTurn?"active":"")+'"><b>'+esc(nm(i))+(waitingTurn?' · sua vez':'')+'</b><span>'+(ans!==undefined?esc(ans):(waitingTurn?'<i>respondendo agora...</i>':'<i>aguardando na fila...</i>'))+'</span></div>';
   }).join("")+'</div>';
   if(qa.sub==="done"){
    main+='<div class="card" style="text-align:center;margin-top:10px"><b>Todo mundo respondeu! 🎉</b><p class="mut" style="margin:4px 0 0">Preparando a próxima pergunta…</p></div>';
   }else if(!isCurrent){
    if(qa.answers[S.me]===undefined && S.me===currentAnswerer){
     main+='<div class="card"><b>Sua vez de responder</b><textarea id="qa-ans" placeholder="Sua resposta..." maxlength="200">'+esc(U.ansInput||'')+'</textarea><button class="btn p" data-a="answer" style="margin-top:8px">Enviar resposta</button></div>';
    }else if(qa.answers[S.me]!==undefined){
     main+='<p class="mut">Resposta enviada. Aguardando o próximo jogador da fila...</p>';
    }else{
     main+='<p class="mut">Aguarde sua vez de responder. Não é possível responder fora da ordem.</p>';
    }
   }else{
    main+='<p class="mut">Aguardando as respostas do grupo, uma por vez...</p>';
   }
   main+=renderQaHistory(qa.history);
  }
  return top+'<h2>Perguntas e respostas</h2>'+main+vb+(inG?roleBlock():'')+hb("skipQA","Pular para discussão");
 }
 case "disc":{
  let poll="";
  if(S.poll)poll='<div class="card"><b>Mais uma rodada de perguntas?</b><p class="mut">Sim '+S.poll.yes+' · Não '+S.poll.no+' · '+S.poll.n+' online. A maioria decide.</p>'+(inG?'<div class="row"><button class="chip '+(S.poll.mine===true?"on":"")+'" data-a="moreVote" data-y="1" style="flex:1;text-align:center">Sim</button><button class="chip '+(S.poll.mine===false?"on":"")+'" data-a="moreVote" data-y="0" style="flex:1;text-align:center">Não</button></div>':'')+(isH()?'<button class="btn g" data-a="moreClose" style="margin-top:8px">Encerrar votação agora</button>':'')+'</div>';
  else if(inG&&S.hr<10)poll='<button class="btn g" data-a="moreAsk">Pedir mais uma rodada de perguntas</button>';

  return top+'<h2>Discussão</h2><p class="mut">'+(S.msg?esc(S.msg)+' ':'')+'Quem respondeu de forma vaga? Quem fugiu da pergunta?</p>'+(S.te?'<div class="timer" id="tm"></div>':'<div class="card mut">Tempo livre. O anfitrião inicia a votação.</div>')+discAnswersBlock()+poll+vb+(inG?roleBlock():'')+hb("toVote","Iniciar a votação")}
 case "vote":{
  if(!inG)return top+'<h2>Votação</h2><p class="mut">Aguarde a próxima rodada.</p>'+vb;
  return top+'<h2>Quem é o impostor?</h2><p class="mut">'+(S.vr?"Desempate. ":"")+(S.ni>1?'Há '+S.ni+' impostores. Vote em quem você mais suspeita. ':'')+'Voto secreto, dá para mudar até todos votarem.</p><div class="grid">'+S.cd.filter(i=>i!==S.me).map(i=>{
    const p = S.players.find(x => x.id === i);
    return '<button class="chip vote-chip '+(S.myvote===i?"on":"")+'" data-a="vote" data-i="'+i+'">'+pxCrew(p?p.clr:"#FFF",{},p?p.em:"")+' <span>'+esc(nm(i))+'</span></button>';
  }).join("")+'</div><p class="mut">Votos registrados: '+S.nvote+' de '+S.pl.length+'</p>'+vb+hb("forceVote","Apurar agora com os votos que chegaram")}
 case "tie":{
  const tieScene='<div class="px-tally">'+S.cd.map((i,idx)=>{const p=S.players.find(x=>x.id===i);return '<div class="px-c" style="animation-delay:'+(idx*.1)+'s">'+pxCrew(p?p.clr:"#FFF",{},p?p.em:"")+'</div>'}).join("")+'</div>';
  return top+tieScene+'<h2>Empate!</h2><p>Empataram: <b>'+S.cd.map(i=>esc(nm(i))).join(", ")+'</b>.</p><p class="mut">Conversem mais um pouco e votem de novo, só entre os empatados.</p>'+vb+hb("revote","Votar de novo");
 }
 case "tally":{const mx=Math.max(1,...Object.values(S.cn));
  const accCrew=(S.acc.length?S.acc:Object.keys(S.cn)).map((i,idx)=>{const p=S.players.find(x=>x.id===i);return '<div class="px-c" style="animation-delay:'+(idx*.1)+'s">'+pxCrew(p?p.clr:"#FFF",S.acc.length?SUS:{},p?p.em:"")+'</div>'}).join("");
  return top+'<div class="px-tally">'+accCrew+'</div><h2>Resultado da votação</h2>'+Object.keys(S.cn).map(i=>'<div class="bar '+(S.acc.includes(i)?"top":"")+'"><span>'+esc(nm(i))+'</span><i style="width:'+(Math.round(S.cn[i]/mx*50)||1)+'%"></i><b>'+S.cn[i]+'</b></div>').join("")+'<div class="card">'+(S.acc.length?'O grupo apontou <b>'+S.acc.map(i=>esc(nm(i))).join(" e ")+'</b>.':'<b>Empate.</b> O grupo não chegou a um nome.')+'</div>'+vb+hb("reveal","Revelar o impostor")}
 case "guess":{const isI=S.im.includes(S.me);
  const guessCrew='<div class="px-guess">'+S.im.map((i,idx)=>{const p=S.players.find(x=>x.id===i);return '<div class="px-c" style="animation-delay:'+(idx*.12)+'s">'+pxCrew(p?p.clr:"#1a1326",SUS,p?p.em:"")+'</div>'}).join("")+'</div>';
  return top+guessCrew+'<h2>Impostor descoberto!</h2><p>'+S.im.map(i=>esc(nm(i))).join(" e ")+(S.im.length>1?" eram os impostores":" era o impostor")+'.</p>'+(isI?(S.guessed?'<p class="mut">Chute enviado. Aguardando o resultado.</p>':'<p class="mut">Última chance: escreva a palavra secreta. Só uma tentativa.</p><input id="gs" placeholder="Qual era a palavra?" autocomplete="off" value="'+esc(U.gs)+'"><button class="btn p" data-a="guess">Chutar</button>'):'<p class="mut">Aguardando o chute final. Sem soprar a resposta!</p>')+vb}
 case "final":{const gr=S.won==="g";
  const why=!S.im.every(i=>S.acc.includes(i))?(S.tg?"A votação empatou e o impostor escapou.":"Pelo menos um impostor escapou."):(S.last?(gr?"Descobertos, e erraram a palavra"+(S.gt?" (chute: “"+esc(S.gt)+"”)":"")+".":"Descobertos, mas acertaram a palavra!"):"Todos os impostores foram descobertos.");
  const crewScene='<div class="px-result '+(gr?"win":"lose")+'">'+S.pl.map((i,idx)=>{
   const p=S.players.find(pp=>pp.id===i)||{clr:"#FF6A00",em:""};
   const isImp=S.im.includes(i);
   return '<div class="px-c" style="animation-delay:'+(idx*.12)+'s">'+(gr&&isImp?pxCrew(p.clr,SUS,p.em):pxCrew(p.clr,{},p.em))+'</div>';
  }).join("")+'</div>';
  return crewScene +
  '<div class="win '+(gr?"g":"i")+'">'+(gr?"O grupo venceu":"Impostor venceu")+'</div><p style="text-align:center">'+why+'</p><div class="card"><div class="mut">'+(S.im.length>1?"Impostores":"Impostor")+'</div><b style="font-size:24px">'+S.im.map(i=>esc(nm(i))).join(" e ")+'</b><div class="mut" style="margin-top:8px">Palavra · '+esc(S.ct||"")+'</div><b style="font-size:24px">'+esc(S.wd)+'</b>'+(S.dc?'<div class="mut" style="margin-top:8px">Palavra do impostor</div><b style="font-size:24px">'+esc(S.dc)+'</b>':'')+'</div><div class="card"><b>Placar</b>'+S.pl.map(i=>'<div class="bar"><span>'+esc(nm(i))+'</span><b>'+(S.sc[i]||0)+'</b></div>').join("")+'</div>'+adSlot("final")+vb+hb("start","Próxima rodada",S.players.filter(p=>p.on).length<3)+hb("restart","Reiniciar partida (zera placar)")+(isH()?'<button class="btn g" data-a="lobby">Trocar tema ou ajustes</button>':'<p class="mut">O anfitrião escolhe a próxima rodada.</p>')}
 }
 return top;
}

// ====== TELA INICIAL (DENTRO DA MOLDURA) ======
function titleScreen(){
 return `
  <div class="crime-board">
    <div class="string-line" style="width: calc(var(--bu) * 15); top: 20%; left: 10%; transform: rotate(25deg);"></div>
    <div class="string-line" style="width: calc(var(--bu) * 20); top: 30%; right: 5%; transform: rotate(-15deg);"></div>
    <div class="string-line" style="width: calc(var(--bu) * 18); bottom: 25%; left: 20%; transform: rotate(-45deg);"></div>
    <div class="polaroid" style="top: 15%; left: 15%; transform: rotate(-5deg);"></div>
    <div class="polaroid" style="top: 35%; right: 15%; transform: rotate(10deg);"></div>
    <div class="polaroid" style="bottom: 20%; left: 30%; transform: rotate(15deg);"></div>
  </div>

  <div class="title-lamp"></div>
  
  <div class="title-bg-aliens">
    <div class="px-c">${pxCrew("#2EA8FF", {}, "hat_cap")}</div>
    <div class="px-c">${pxCrew("#FF3D7F", {}, "shirt_cape")}</div>
    <div class="px-c">${pxCrew("#FFD400", {}, "hat_party")}</div>
    <div class="px-c">${pxCrew("#5CD65C", {}, "shirt_tie")}</div>
  </div>

  <div class="title-content">
    <div class="title-logo-wrap">
      <div class="title-logo">
        Bluffin
        <svg viewBox="0 0 24 24" fill="none" stroke="#FF6A00" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="10" cy="10" r="7"></circle>
          <line x1="21" y1="21" x2="15" y2="15"></line>
        </svg>
      </div>
    </div>
    
    <div class="title-sub">
      Descubra o impostor.<br>
      Resolva o <b>mistério</b>.
    </div>
    
    <div class="set" style="width:min(260px,90%);margin:0 auto 14px;text-align:left">
      <label for="language-select" class="mut" style="display:block;margin-bottom:6px">🌐 Idioma / Language</label>
      <select id="language-select" class="chip" style="width:100%;padding:10px;background:#17131f;color:#fff;border:1px solid #51445f;border-radius:10px">
        <option value="pt-BR" ${U.lang==="pt-BR"?"selected":""}>🇧🇷 Português</option>
        <option value="en" ${U.lang==="en"?"selected":""}>🇺🇸 English</option>
        <option value="es" ${U.lang==="es"?"selected":""}>🇪🇸 Español</option>
      </select>
    </div>
    <div class="title-menu">
      <button class="btn p" data-a="startGame">
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8 5v14l11-7z"/></svg>
        Começar
      </button>
      <button class="btn g" data-a="openCustomize">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
        Editar
      </button>
      <button class="btn g" data-a="howto">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
        Como Jogar
      </button>
    </div>
  </div>
  
  <button class="title-edit-btn" data-a="settings">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
    Configurações
  </button>
 `;
}

// ====== TELA DE PREPARAÇÃO (ENTRY) ======
function entry(){
 return `
 <div class="brand">
   <button class="btn g tiny" data-a="backToTitle" style="margin-top:30px">← Voltar</button>
   <h1>Bluffin<i></i></h1>
   <button class="pro-pill" data-a="pro" style="margin-top:30px">✨ PRO</button>
 </div>
 
 <div class="menu-layout">
   <div class="alien-side">
     <b>Seu Alien</b>
     <div style="width:80px;height:80px;margin:10px 0">
       ${pxCrew(U.avc, {}, U.avem)}
     </div>
     <button class="btn g tiny" data-a="openCustomize">👾 Customizar</button>
   </div>
   
   <div class="form-side">
     <div class="set"><b>Seu nome</b><input id="nm" maxlength="14" placeholder="Como os amigos vão te ver" value="${esc(U.name)}"></div>
     <div class="set"><b>🌎 País do seu perfil</b>
       <select id="country-select" class="chip" style="width:100%;padding:10px;background:#17131f;color:#fff;border:1px solid #51445f;border-radius:10px">
         <option value="BR" ${U.country==="BR"?"selected":""}>🇧🇷 Brasil</option>
         <option value="US" ${U.country==="US"?"selected":""}>🇺🇸 Estados Unidos</option>
         <option value="GB" ${U.country==="GB"?"selected":""}>🇬🇧 Reino Unido</option>
         <option value="PT" ${U.country==="PT"?"selected":""}>🇵🇹 Portugal</option>
         <option value="ES" ${U.country==="ES"?"selected":""}>🇪🇸 Espanha</option>
         <option value="DE" ${U.country==="DE"?"selected":""}>🇩🇪 Alemanha</option>
         <option value="FR" ${U.country==="FR"?"selected":""}>🇫🇷 França</option>
         <option value="IT" ${U.country==="IT"?"selected":""}>🇮🇹 Itália</option>
       </select>
       <p class="mut" style="font-size:12px;margin:5px 0 0">No modo Nacional, este país define as referências da sala que você criar.</p>
     </div>
     ${U.err?'<p class="err">'+esc(U.err)+'</p>':''}
     <button class="btn p" data-a="create" ${U.busy?"disabled":""}>Criar sala</button>
     <div class="row">
       <input id="cd" maxlength="4" placeholder="CÓDIGO" style="text-transform:uppercase;letter-spacing:4px;text-align:center" value="${esc(U.code)}">
       <button class="btn" data-a="join" style="width:auto" ${U.busy?"disabled":""}>Entrar</button>
     </div>
   </div>
 </div>
 
 <p class="mut" style="text-align:center;margin:16px 0 4px">Todo mundo sabe a palavra. Menos um.<br>Faça perguntas, responda com cuidado e descubra quem está blefando.</p>
 
 ${adSlot("entry")}
 <p class="foot">Bluffin · feito pra jogar com os amigos</p>`;
}

// ====== NOVO CHAT COM AVATAR ======
function chatPanel(){
 if(!S||U.scr!=="game")return "";
 const msgs=U.chat.length===0
   ?'<p class="mut" style="text-align:center;padding:20px 12px;font-size:14px">Nenhuma mensagem ainda. Diga um oi 👋</p>'
   :U.chat.map(c=>{
     const cls=c.from===S.me?"chat-msg mine":"chat-msg";
     const p = S.players.find(x => x.id === c.from);
     const clr = p ? p.clr : "#A6A6A6";
     const em = p ? p.em : "";
     const avatar = '<div class="chat-avatar">'+pxCrew(clr, {}, em)+'</div>';
     return '<div class="'+cls+'">'+avatar+'<div class="chat-msg-content"><span class="chat-msg-name">'+esc(c.name||"?")+'</span><span class="chat-msg-text">'+esc(c.text)+'</span></div></div>';
   }).join("");
 return '<div class="chat-header">💬 Chat</div><div class="chat-msgs" id="chat-msgs">'+msgs+'</div><div class="chat-input-row"><input id="chat-in" maxlength="200" placeholder="Mensagem..." autocomplete="off" value="'+esc(U.chatInput)+'"><button class="btn p" data-a="chatSend">➤</button></div>';
}

function render(){
 const sg=S?{...S,cfg:{...S.cfg,custom:0},chat:0,qa:0}:null;
 const lastChat=U.chat.length>0?U.chat[U.chat.length-1].id:"";
 const sig=JSON.stringify([U.scr,U.err,U.busy,U.rv,U.gs,sg,V.on,V.muted,U.modal,U.copied,U.copiedInvite,U.pro,U.toast,U.chat.length,lastChat,U.askInput.length>0,U.ansInput.length>0,U.discOpen,U.musicVol,U.sfxVol,U.settingsOpen,U.customizeOpen,U.avc,U.avem,U.lang,U.country]);
 if(sig===lastSig)return;lastSig=sig;
 const ae=document.activeElement,keep=ae&&ae.id,keepSel=(keep&&typeof ae.selectionStart==="number")?[ae.selectionStart,ae.selectionEnd]:null;
 const oldChatEl=$("chat-msgs");
 const oldChatScroll=oldChatEl?oldChatEl.scrollTop:0;
 const oldChatAtBottom=oldChatEl?(oldChatEl.scrollHeight-oldChatEl.scrollTop-oldChatEl.clientHeight<60):true;

 // CONTROLE DE MÚSICA
 if (U.scr === "title" || U.scr === "entry") {
   startMusic('menu'); // Música do menu
 } else if (S && S.ph === "lobby") {
   startMusic('lobby');
 } else if (S && S.ph === "final") {
   startMusic(S.won === "g" ? 'victory' : 'defeat'); 
   if (!U.finalSfxPlayed) {
     U.finalSfxPlayed = true;
     setTimeout(() => { S.won === "g" ? sfxWin() : sfxLose(); }, 300); 
   }
 } else if (S) {
   startMusic('game');
   U.finalSfxPlayed = false; 
 }

 // Classes do #app
 $("app").classList.toggle("title-screen", U.scr === "title");
 document.body.classList.toggle("on-title", U.scr === "title");
 $("app").classList.toggle("lobby", U.scr === "game" && S && S.ph === "lobby");
 $("app").classList.toggle("game-active", U.scr === "game" || U.scr === "entry");
 
 $("app").innerHTML=(U.scr==="title"?titleScreen():(U.scr==="game"&&S?game():entry()))+proModal()+settingsModal()+customizeModal()+howToPlayModal()+(U.toast?'<div class="toast">'+esc(U.toast)+'</div>':'');
 const cp=$("chat-panel");if(cp)cp.innerHTML=chatPanel();
 if(window.BluffinI18n){window.BluffinI18n.apply($("app"));if(cp)window.BluffinI18n.apply(cp);}
 ["entry","lobby","final"].forEach(mountAd);

 const newChatEl=$("chat-msgs");
 if(newChatEl) newChatEl.scrollTop=oldChatAtBottom?newChatEl.scrollHeight:oldChatScroll;

 if(keep){const el=$(keep);if(el){el.focus();if(keepSel&&typeof el.setSelectionRange==="function"){try{el.setSelectionRange(keepSel[0],keepSel[1])}catch(e){}}}}}
 clearInterval(tt);
 if(S&&S.ph==="disc"&&S.te){const tick=()=>{const el=$("tm");if(!el)return;const l=Math.max(0,Math.ceil((S.te-(Date.now()+off))/1000));el.textContent=l?Math.floor(l/60)+":"+String(l%60).padStart(2,"0"):"Acabou o tempo";el.classList.toggle("end",!l)};tick();tt=setInterval(tick,500)}
 if(S&&S.ph==="guess"&&$("gs"))$("gs").focus();

const rr=()=>{lastSig="";render()};

document.addEventListener("click",e=>{
 const b=e.target.closest("[data-a]");if(!b||b.disabled)return;
 sfxClick();
 const a=b.dataset.a;
 switch(a){
  case "startGame": U.scr="entry"; rr(); break;
  case "backToTitle": U.scr="title"; rr(); break;
  case "howto": U.modal="howto"; rr(); break;
  case "create":case "join":{const n=($("nm").value||"").trim();if(!n){U.err="Digite seu nome.";rr();break}U.name=n.slice(0,14);ls("bf_name",U.name);
   if(a==="create")connect(true,"");else{const c=($("cd").value||"").trim().toUpperCase();if(!/^[A-Z]{4}$/.test(c)){U.err="Digite o código de 4 letras.";rr();break}connect(false,c)}break}
  case "cfg":{let v=b.dataset.v;if(v==="true")v=true;else if(v==="false")v=false;else if(/^\d+$/.test(v))v=+v;send({t:"cfg",k:b.dataset.k,v});break}
  case "start":case "lobby":case "ready":case "skipRole":case "skipQA":case "moreAsk":case "moreClose":case "toVote":case "forceVote":case "revote":case "reveal":send({t:a});break;
  case "moreVote":send({t:"moreVote",y:b.dataset.y==="1"});break;
  case "toggleSuspect":{const id=b.dataset.i;if(id&&S&&id!==S.me&&Array.isArray(S.pl)&&S.pl.includes(id)){if(U.suspects[id])delete U.suspects[id];else U.suspects[id]=true;rr()}break;}
  case "vote":send({t:"vote",to:b.dataset.i});break;
  case "guess":{const t=($("gs").value||"").trim();if(!t){$("gs").focus();break}send({t:"guess",text:t});break}
  case "ask":{const t=(U.askInput||"").trim();if(!t){const el=$("qa-ask");if(el)el.focus();break}send({t:"ask",text:t});U.askInput="";rr();break}
  case "answer":{const t=(U.ansInput||"").trim();if(!t){const el=$("qa-ans");if(el)el.focus();break}send({t:"answer",text:t});U.ansInput="";rr();break}
  case "rv":U.rv=!U.rv;if(U.rv) sfxReveal(); rr();break;
  case "avc":U.avc=b.dataset.v;ls("bf_avc",U.avc);if(S)send({t:"profile",clr:U.avc,em:U.avem});rr();break;
  case "avem":U.avem=b.dataset.v;ls("bf_avem",U.avem);if(S)send({t:"profile",clr:U.avc,em:U.avem});rr();break;
  case "pro":U.modal="pro";rr();break;
  case "closeModal":U.modal=null;rr();break;
  case "settings":U.settingsOpen=true;rr();break;
  case "closeSettings":U.settingsOpen=false;rr();break;
  case "openCustomize":U.customizeOpen=true;rr();break;
  case "closeCustomize":U.customizeOpen=false;rr();break;
  case "discToggle":U.discOpen=U.discOpen===b.dataset.i?null:b.dataset.i;rr();break;
  case "copyCode":{if(!S)break;const ok=()=>{U.copied=true;rr();setTimeout(()=>{U.copied=false;rr()},1500)};
   if(navigator.clipboard)navigator.clipboard.writeText(S.code).then(ok).catch(()=>{});else ok();break}
  case "copyInvite":{if(!S)break;
   const text="Entra na minha sala de Bluffin! Link: "+location.origin+location.pathname+"?sala="+S.code;
   const ok=()=>{U.copiedInvite=true;rr();setTimeout(()=>{U.copiedInvite=false;rr()},1500)};
   if(navigator.clipboard)navigator.clipboard.writeText(text).then(ok).catch(()=>{});else ok();break}
  case "share":{if(!S)break;
   const text="Entra na minha sala de Bluffin! Código: " + S.code;
   const url=location.origin+location.pathname+"?sala="+S.code;
   if(navigator.share)navigator.share({title:"Bluffin",text,url}).catch(()=>{});
   else if(navigator.clipboard){navigator.clipboard.writeText(text+" — "+url).then(()=>{U.copiedInvite=true;rr();setTimeout(()=>{U.copiedInvite=false;rr()},1500)}).catch(()=>{})}break}
  case "vjoin":voiceJoin();break;
  case "vleave":voiceLeave();break;
  case "vmute":V.muted=!V.muted;voiceSync();rr();break;
  case "chatSend":{const text=(U.chatInput||"").trim();if(!text)break;send({t:"chat",text});U.chatInput="";rr();setTimeout(()=>{const inp=$("chat-in");if(inp)inp.focus()},0);break}
  case "restart":{if(!isH())break;if(!confirm("Reiniciar partida? O placar será zerado."))break;send({t:"restart"});break}
  case "leave":voiceLeave();ss("bf_room",null);if(ws){ws.onclose=null;ws.close()}S=null;U.scr="title";
   U.chat=[];U.chatInput="";U.askInput="";U.ansInput="";U.lastQaSub="";U.lastQaTurnIdx=-1;U.discOpen=null;
   rr();break;
 }
});
let cwT=null;
document.addEventListener("input",e=>{
 if(e.target.id==="nm"){U.name=e.target.value.slice(0,14);ls("bf_name",U.name)}
 if(e.target.id==="cw"){U.cw=e.target.value;clearTimeout(cwT);const v=e.target.value;cwT=setTimeout(()=>send({t:"cfg",k:"custom",v}),300)}
 if(e.target.id==="gs")U.gs=e.target.value;
 if(e.target.id==="chat-in")U.chatInput=e.target.value;
 if(e.target.id==="qa-ask")U.askInput=e.target.value;
 if(e.target.id==="qa-ans")U.ansInput=e.target.value;
 
 if(e.target.id === "mvol") {
    U.musicVol = parseFloat(e.target.value); 
    ls("bf_mvol", U.musicVol); 
    const lbl = $("mvol-label"); if(lbl) lbl.textContent = Math.round(U.musicVol*100)+"%"; 
 }
 if(e.target.id === "svol") {
    U.sfxVol = parseFloat(e.target.value); 
    ls("bf_svol", U.sfxVol); 
    const lbl = $("svol-label"); if(lbl) lbl.textContent = Math.round(U.sfxVol*100)+"%"; 
 }
});
document.addEventListener("change",e=>{
 if(e.target.id==="language-select"){
   U.lang=["pt-BR","en","es"].includes(e.target.value)?e.target.value:"pt-BR";
   ls("bf_lang",U.lang);
   if(window.BluffinI18n)window.BluffinI18n.setLanguage(U.lang).then(()=>rr());else rr();
 }
 if(e.target.id==="country-select"){
   U.country=e.target.value;ls("bf_country",U.country);
   if(S)send({t:"profile",country:U.country});
   rr();
 }
});
window.addEventListener("bluffin:locale-ready",()=>rr());

document.addEventListener("keydown",e=>{
 if(e.key!=="Enter")return;
 const t=e.target.id;
 if(t==="chat-in"){if(e.shiftKey)return;e.preventDefault();document.querySelector('[data-a="chatSend"]').click();return}
 if(t==="qa-ask"){if(e.shiftKey)return;e.preventDefault();document.querySelector('[data-a="ask"]').click();return}
 if(t==="qa-ans"){if(e.shiftKey)return;e.preventDefault();document.querySelector('[data-a="answer"]').click();return}
 if(t==="nm"||t==="cd"){const b=document.querySelector('[data-a="'+(t==="cd"&&$("cd").value?"join":"create")+'"]');if(b)b.click();return}
 if(t==="gs")document.querySelector('[data-a="guess"]').click();
});
mountAd("rail-l");mountAd("rail-r");

const urlParams = new URLSearchParams(window.location.search);
const roomParam = urlParams.get('sala');
if (roomParam) U.code = roomParam.toUpperCase();

const saved=ss("bf_room");
if(saved && U.name) connect(false, saved);
else if(roomParam && U.name) connect(false, U.code);
else render();