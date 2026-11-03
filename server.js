"use strict";
const http = require("http"), fs = require("fs"), path = require("path"), crypto = require("crypto");
const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 3000;
const ICE = [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }];
if (process.env.TURN_URL) ICE.push({ urls: process.env.TURN_URL.split(","), username: process.env.TURN_USER || "", credential: process.env.TURN_PASS || "" });

const AV_CLR = ["#FF6A00", "#FF3D7F", "#7C5CFF", "#00C2A8", "#2EA8FF", "#FFD400", "#5CD65C", "#FF5C5C"];
const AV_EM = ["", "😀", "😎", "🤖", "🐱", "🐶", "🦊", "🐸", "🐼", "🦄", "👑", "🎲", "🔥", "🧠", "🕵️", "🎭"];
const rnd = n => crypto.randomInt(n);
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const norm = s => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

const CATS = {
  des: ["Desenhos e animações", ["Shrek", "Bob Esponja", "Mickey Mouse", "Pikachu", "Tom e Jerry", "Os Simpsons", "Turma da Mônica", "Scooby-Doo", "Rei Leão", "Frozen", "Toy Story", "Naruto"]],
  jog: ["Jogos e videogames", ["Minecraft", "Fortnite", "Super Mario", "Free Fire", "Among Us", "FIFA", "Zelda", "Pac-Man", "Tetris", "GTA", "Roblox", "Pokémon"]],
  fil: ["Filmes e séries", ["Titanic", "Harry Potter", "Vingadores", "Stranger Things", "Round 6", "Star Wars", "Batman", "Avatar", "Jurassic Park", "Tropa de Elite", "Friends", "Matrix"]],
  per: ["Personagens", ["Darth Vader", "Super-Homem", "Sherlock Holmes", "Mulher-Maravilha", "Chapeuzinho Vermelho", "Coringa", "Homer Simpson", "Saci Pererê", "Peter Pan", "Gandalf", "Hulk", "Homem-Aranha"]],
  fut: ["Futebol", ["Neymar", "Pelé", "Messi", "Cristiano Ronaldo", "Maracanã", "Flamengo", "Grêmio", "Internacional", "Copa do Mundo", "Pênalti", "Árbitro", "Ronaldinho Gaúcho"]],
  cel: ["Celebridades", ["Anitta", "Xuxa", "Silvio Santos", "Ivete Sangalo", "Gusttavo Lima", "Taylor Swift", "Beyoncé", "Rihanna", "Elon Musk", "Michael Jackson", "Gisele Bündchen", "Luciano Huck"]],
  ani: ["Animais", ["Girafa", "Pinguim", "Tubarão", "Camaleão", "Polvo", "Elefante", "Canguru", "Coruja", "Tartaruga", "Panda", "Jacaré", "Morcego"]],
  com: ["Comidas", ["Pizza", "Churrasco", "Brigadeiro", "Sushi", "Feijoada", "Hambúrguer", "Pão de queijo", "Lasanha", "Coxinha", "Açaí", "Chimarrão", "Pastel"]],
  lug: ["Lugares", ["Praia", "Aeroporto", "Hospital", "Shopping", "Cinema", "Escola", "Biblioteca", "Circo", "Zoológico", "Estádio", "Padaria", "Cachoeira"]],
  obj: ["Objetos", ["Guarda-chuva", "Escova de dentes", "Controle remoto", "Geladeira", "Óculos", "Cadeado", "Violão", "Tesoura", "Espelho", "Relógio", "Mochila", "Ventilador"]]
};
const CFG_RULES = {
  theme: v => v === "all" || v === "random" || v === "custom" || !!CATS[v],
  imps: v => v === 1 || v === 2,
  hr: v => Number.isInteger(v) && v >= 1 && v <= 5,
  timer: v => [0, 1, 2, 3, 5].includes(v),
  last: v => typeof v === "boolean",
  tie: v => v === "revote" || v === "imp",
  voice: v => v === "off" || v === "turns" || v === "open"
};

const PUB = path.join(__dirname, "public");
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon",
  ".json": "application/json", ".webmanifest": "application/manifest+json", ".txt": "text/plain; charset=utf-8"
};
const server = http.createServer((req, res) => {
  let u = "/";
  try { u = decodeURIComponent((req.url || "/").split("?")[0]); } catch (e) { }
  if (u === "/health") return res.end("ok");
  if (u === "/") u = "/index.html";
  const f = path.normalize(path.join(PUB, u));
  if (!f.startsWith(PUB)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); return res.end("Não encontrado"); }
    const isHtml = path.extname(f) === ".html";
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(f)] || "application/octet-stream",
      "Cache-Control": isHtml ? "no-cache" : "public, max-age=3600"
    });
    res.end(d);
  });
});
const wss = new WebSocketServer({ server, maxPayload: 16 * 1024 });

const rooms = new Map();
function newRoom() {
  const al = "ABCDEFGHJKMNPQRSTUVWXYZ"; let code;
  do { code = ""; for (let i = 0; i < 4; i++) code += al[rnd(al.length)]; } while (rooms.has(code));
  const room = {
    code, hostId: null, players: new Map(), streak: {}, used: [], seen: Date.now(),
    chat: [],
    cfg: { theme: "all", custom: "", imps: 1, hr: 1, timer: 0, last: true, tie: "revote", voice: "off" },
    g: { ph: "lobby", ri: 0, sc: {}, pl: [], nm: {} }
  };
  rooms.set(code, room); return room;
}
const online = (room, id) => { const p = room.players.get(id); return !!(p && p.on); };
const send = (p, m) => { try { if (p.ws && p.ws.readyState === 1) p.ws.send(JSON.stringify(m)); } catch (e) { } };

function pickWord(room) {
  const c = room.cfg; let words, cat;
  if (c.theme === "custom") { words = c.custom.split(/[\n,;]+/).map(x => x.trim()).filter(Boolean); cat = "Palavras do grupo"; }
  else if (c.theme === "all") { words = Object.values(CATS).flatMap(x => x[1]); cat = "Todos os temas"; }
  else { const k = c.theme === "random" ? Object.keys(CATS)[rnd(Object.keys(CATS).length)] : c.theme; words = CATS[k][1]; cat = CATS[k][0]; }
  if (words.length < 2) { words = Object.values(CATS).flatMap(x => x[1]); cat = "Todos os temas"; }
  let w = words.filter(x => !room.used.includes(x));
  if (!w.length) { room.used = room.used.filter(x => !words.includes(x)); w = words; }
  const word = w[rnd(w.length)]; room.used.push(word); return { word, cat };
}
function pickImps(room, pl, n) {
  const st = room.streak, out = [], pool = pl.filter(i => (st[i] || 0) < 2);
  while (out.length < n && pool.length) out.push(pool.splice(rnd(pool.length), 1)[0]);
  if (out.length < n) out.push(...pl.filter(i => !out.includes(i)).sort((a, b) => (st[a] || 0) - (st[b] || 0)).slice(0, n - out.length));
  pl.forEach(i => st[i] = out.includes(i) ? (st[i] || 0) + 1 : 0);
  return out;
}
function startQA(room) {
  const g = room.g;
  g.ph = "qa";
  g.qa = { round: 0, turnIdx: 0, sub: "ask", question: "", answers: {}, answerOrder: [], answerIdx: 0, history: [] };
  g.msg = "";
}
function startRound(room) {
  const ps = [...room.players.values()].filter(p => p.on);
  if (ps.length < 3) return;
  const pl = ps.map(p => p.id), n = Math.min(room.cfg.imps, Math.floor((pl.length - 1) / 2) || 1);
  const imps = pickImps(room, pl, n), { word, cat } = pickWord(room), rl = {}, nm = {};
  ps.forEach(p => { rl[p.id] = imps.includes(p.id) ? "#" : word; nm[p.id] = p.name; });
  room.g = {
    ph: "role", ri: room.g.ri + 1, sc: room.g.sc, pl, nm, ord: shuffle(pl), hr: room.cfg.hr, ni: n,
    rl, word, cat, te: 0, vr: 0, cd: pl, fx: [], nd: 0, acc: [], cn: {}, im: null, won: null, gt: "", tg: 0,
    poll: null, msg: "", rd: {}, vt: {}, gx: {}, last: room.cfg.last, qa: null
  };
}
const impsOf = g => g.pl.filter(i => g.rl[i] === "#");
function toDisc(room) { const g = room.g; g.ph = "disc"; g.te = room.cfg.timer ? Date.now() + room.cfg.timer * 60000 : 0; g.poll = null; g.msg = ""; }
function closePoll(room) {
  const g = room.g, live = g.pl.filter(i => online(room, i)), yes = live.filter(i => g.poll.y[i] === true).length;
  g.poll = null;
  if (yes * 2 > live.length && g.hr < 10) {
    g.hr++;
    const prevHistory = (g.qa && g.qa.history) ? g.qa.history : [];
    g.ph = "qa";
    g.qa = { round: g.hr - 1, turnIdx: 0, sub: "ask", question: "", answers: {}, answerOrder: [], answerIdx: 0, history: prevHistory };
    g.msg = "Mais uma rodada de perguntas aprovada pela maioria.";
  } else g.msg = "A maioria preferiu seguir para a votação.";
}
function resolveVotes(room) {
  const g = room.g, cnt = {}; g.cd.forEach(c => cnt[c] = 0);
  g.pl.forEach(i => { const t = g.vt[i]; if (t && g.cd.includes(t)) cnt[t]++; });
  g.cn = cnt;
  const need = g.vr ? g.nd : g.ni, s = g.cd.slice().sort((a, b) => cnt[b] - cnt[a]);
  let acc = null, tie = null;
  if (s.length <= need) acc = s;
  else {
    const cut = cnt[s[need - 1]], above = s.filter(c => cnt[c] > cut), tied = s.filter(c => cnt[c] === cut);
    if (above.length + tied.length === need) acc = s.slice(0, need); else tie = { above, tied, need: need - above.length };
  }
  if (tie && !g.vr && room.cfg.tie === "revote") { g.ph = "tie"; g.cd = tie.tied; g.nd = tie.need; g.fx = tie.above; }
  else { g.acc = tie ? g.fx : g.fx.concat(acc); g.tg = tie ? 1 : 0; g.ph = "tally"; }
}
function finish(room, ok, gt) {
  const g = room.g, im = impsOf(g), caught = im.length > 0 && im.every(i => g.acc.includes(i));
  g.won = (caught && !ok) ? "g" : "i"; g.im = im; g.gt = gt || ""; g.ph = "final";
  g.pl.forEach(i => {
    const isI = im.includes(i);
    if (g.won === "i") { if (isI) g.sc[i] = (g.sc[i] || 0) + 2; } else if (!isI) g.sc[i] = (g.sc[i] || 0) + 1;
  });
}
function tickQA(room) {
  const g = room.g, on = i => online(room, i), qa = g.qa;
  if (!qa || !g.ord.length) return;
  const maxIter = g.ord.length * 3 + 3;
  for (let i = 0; i < maxIter; i++) {
    const curId = g.ord[qa.turnIdx % g.ord.length];
    if (!on(curId)) {
      qa.turnIdx++;
      if (qa.turnIdx >= g.ord.length) {
        qa.round++; qa.turnIdx = 0;
        if (qa.round >= g.hr) { toDisc(room); return; }
      }
      qa.sub = "ask"; qa.question = ""; qa.answers = {}; qa.answerOrder = []; qa.answerIdx = 0;
      continue;
    }
    if (qa.sub === "answer") {
      if (!Array.isArray(qa.answerOrder)) qa.answerOrder = g.ord.filter(x => x !== curId);
      if (!Number.isInteger(qa.answerIdx)) qa.answerIdx = 0;
      while (qa.answerIdx < qa.answerOrder.length) {
        const answerer = qa.answerOrder[qa.answerIdx];
        if (!on(answerer) || qa.answers[answerer] !== undefined) qa.answerIdx++;
        else break;
      }
      if (qa.answerIdx >= qa.answerOrder.length) {
        qa.history.push({ author: curId, question: qa.question, answers: { ...qa.answers } });
        qa.turnIdx++; qa.answers = {}; qa.answerOrder = []; qa.answerIdx = 0; qa.question = "";
        if (qa.turnIdx >= g.ord.length) {
          qa.round++; qa.turnIdx = 0;
          if (qa.round >= g.hr) { toDisc(room); return; }
        }
        qa.sub = "ask";
        continue;
      }
    }
    break;
  }
}
function tick(room) {
  const g = room.g, on = i => online(room, i), live = (g.pl || []).filter(on);
  if (g.ph === "role" && live.length && live.every(i => g.rd[i])) startQA(room);
  if (g.ph === "qa") tickQA(room);
  if (g.ph === "disc" && g.poll && live.length && live.every(i => g.poll.y[i] !== undefined)) closePoll(room);
  if (g.ph === "vote" && live.length && live.every(i => g.vt[i])) resolveVotes(room);
  if (g.ph === "guess") {
    const im = g.im.filter(on);
    if (!im.length) finish(room, false, "");
    else if (im.every(i => g.gx[i] !== undefined)) {
      const w = norm(g.word), gs = im.map(i => g.gx[i]), hit = gs.find(x => norm(x) === w);
      finish(room, !!hit, hit || gs[0]);
    }
  }
}

function view(room, pid) {
  const g = room.g, isH = pid === room.hostId, inG = g.pl.includes(pid);
  const cfg = { ...room.cfg }; if (!isH) delete cfg.custom;
  const live = g.pl.filter(i => online(room, i));
  const v = {
    t: "s", me: pid, now: Date.now(), code: room.code, host: room.hostId, cfg,
    players: [...room.players.values()].map(p => ({ id: p.id, n: p.name, on: p.on, v: p.v, clr: p.clr, em: p.em })),
    ph: g.ph, ri: g.ri, pl: g.pl, nm: g.nm, ord: g.ord, hr: g.hr, ni: g.ni, ct: g.cat || "", te: g.te, vr: g.vr,
    cd: g.cd, sc: g.sc, msg: g.msg || "", role: inG && g.rl ? g.rl[pid] : null,
    ready: !!(g.rd && g.rd[pid]), nready: g.rd ? g.pl.filter(i => g.rd[i]).length : 0,
    nvote: g.vt ? g.pl.filter(i => g.vt[i]).length : 0, myvote: g.vt ? g.vt[pid] || null : null,
    guessed: g.gx ? g.gx[pid] !== undefined : false,
    chat: room.chat.slice(-50)
  };
  if (g.qa) v.qa = {
    round: g.qa.round, turnIdx: g.qa.turnIdx, sub: g.qa.sub,
    question: g.qa.question, answers: g.qa.answers, history: g.qa.history,
    answerOrder: g.qa.answerOrder || [], answerIdx: g.qa.answerIdx || 0,
    currentAnswerer: g.qa.sub === "answer" ? (g.qa.answerOrder || []).filter(i => online(room, i) && g.qa.answers[i] === undefined)[0] || null : null,
    currentPlayer: g.ord[g.qa.turnIdx % g.ord.length]
  };
  if (["tie", "tally", "final"].includes(g.ph)) { v.cn = g.cn; v.acc = g.acc; v.tg = g.tg; }
  if (g.ph === "guess" || g.ph === "final") v.im = g.im;
  if (g.ph === "final") { v.won = g.won; v.wd = g.word; v.gt = g.gt; v.last = g.last; }
  if (g.poll) { const ys = Object.values(g.poll.y); v.poll = { yes: ys.filter(Boolean).length, no: ys.filter(x => !x).length, mine: g.poll.y[pid], n: live.length }; }
  return v;
}
function broadcast(room) { room.players.forEach(p => { if (p.on) send(p, view(room, p.id)); }); }

function act(room, me, m) {
  const g = room.g, isH = me.id === room.hostId, inG = g.pl.includes(me.id);
  switch (m.t) {
    case "cfg":
      if (!isH || g.ph !== "lobby") return;
      if (m.k === "custom") { if (typeof m.v === "string") room.cfg.custom = m.v.slice(0, 2000); }
      else if (CFG_RULES[m.k] && CFG_RULES[m.k](m.v)) room.cfg[m.k] = m.v;
      break;
    case "start": if (isH && (g.ph === "lobby" || g.ph === "final")) startRound(room); break;
    case "lobby": if (isH && g.ph === "final") g.ph = "lobby"; break;
    case "ready": if (g.ph === "role" && inG) g.rd[me.id] = true; break;
    case "skipRole": if (isH && g.ph === "role") startQA(room); break;
    case "ask": {
      if (g.ph !== "qa" || !inG) return;
      const qa = g.qa;
      if (qa.sub !== "ask") return;
      if (me.id !== g.ord[qa.turnIdx % g.ord.length]) return;
      const text = String(m.text || "").replace(/[\x00-\x1f\x7f]/g, "").trim().slice(0, 200);
      if (!text) return;
      qa.question = text; qa.sub = "answer"; qa.answers = {};
      qa.answerOrder = g.ord.filter(i => i !== me.id); qa.answerIdx = 0;
      break;
    }
    case "answer": {
      if (g.ph !== "qa" || !inG) return;
      const qa = g.qa;
      if (qa.sub !== "answer") return;
      if (!Array.isArray(qa.answerOrder)) qa.answerOrder = g.ord.filter(i => i !== g.ord[qa.turnIdx % g.ord.length]);
      if (me.id !== qa.answerOrder[qa.answerIdx] || qa.answers[me.id] !== undefined) return;
      const text = String(m.text || "").replace(/[\x00-\x1f\x7f]/g, "").trim().slice(0, 200);
      if (!text) return;
      qa.answers[me.id] = text;
      break;
    }
    case "skipQA": if (isH && g.ph === "qa") toDisc(room); break;
    case "moreAsk": if (g.ph === "disc" && inG && !g.poll && g.hr < 10) { g.poll = { y: {} }; g.poll.y[me.id] = true; g.msg = ""; } break;
    case "moreVote": if (g.ph === "disc" && g.poll && inG) g.poll.y[me.id] = !!m.y; break;
    case "moreClose": if (isH && g.ph === "disc" && g.poll) closePoll(room); break;
    case "toVote": if (isH && g.ph === "disc") { g.ph = "vote"; g.vr = 0; g.cd = g.pl; g.fx = []; g.vt = {}; g.poll = null; g.msg = ""; } break;
    case "vote": if (g.ph === "vote" && inG && g.cd.includes(m.to) && m.to !== me.id) g.vt[me.id] = m.to; break;
    case "forceVote": if (isH && g.ph === "vote") resolveVotes(room); break;
    case "revote": if (isH && g.ph === "tie") { g.vr = 1; g.vt = {}; g.ph = "vote"; } break;
    case "reveal":
      if (isH && g.ph === "tally") {
        const im = impsOf(g);
        if (im.every(i => g.acc.includes(i)) && g.last) { g.im = im; g.gx = {}; g.ph = "guess"; } else finish(room, false, "");
      }
      break;
    case "guess":
      if (g.ph === "guess" && g.im.includes(me.id) && g.gx[me.id] === undefined && typeof m.text === "string" && m.text.trim()) g.gx[me.id] = m.text.trim().slice(0, 40);
      break;
    case "voice": me.v = !!m.on; break;
    case "restart": {
      if (!isH) return;
      g.ph = "lobby"; g.ri = 0; g.sc = {}; g.pl = []; g.nm = {}; g.qa = null; g.msg = "";
      break;
    }
    case "chat": {
      if (g.ph === "role" || g.ph === "guess") return;
      const now = Date.now();
      if (me.chatLast && now - me.chatLast < 800) { send(me, { t: "sys", m: "Espera um instante antes de mandar outra." }); return; }
      const text = String(m.text || "").replace(/[\x00-\x1f\x7f]/g, "").trim().slice(0, 200);
      if (!text) return;
      if (g.word && ["qa", "disc", "vote", "tie"].includes(g.ph)) {
        const nw = norm(g.word), nt = norm(text);
        if (nw && nt && (nt.includes(nw) || (nt.length >= 3 && nw.includes(nt)))) {
          send(me, { t: "sys", m: "Não pode falar a palavra secreta 😉" });
          return;
        }
      }
      me.chatLast = now;
      const msg = { id: crypto.randomBytes(6).toString("hex"), from: me.id, name: me.name, text, ts: now };
      room.chat.push(msg);
      if (room.chat.length > 100) room.chat.shift();
      room.players.forEach(p => { if (p.on) send(p, { t: "chat", msg }); });
      return;
    }
    case "sig": {
      const p = room.players.get(m.to);
      if (p && p.on && p.id !== me.id) send(p, { t: "sig", from: me.id, d: m.d });
      return;
    }
    default: return;
  }
  tick(room); broadcast(room);
}

wss.on("error", () => {});

wss.on("connection", ws => {
  let room = null, me = null, bucket = 30, lastRefill = Date.now();
  ws.isAlive = true;
  ws.on("pong", () => { ws.isAlive = true; });
  ws.on("error", () => {});
  ws.on("message", raw => {
    const now = Date.now();
    bucket = Math.min(30, bucket + (now - lastRefill) / 1000 * 30); lastRefill = now;
    if (bucket < 1) return;
    bucket -= 1;
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (!m || typeof m.t !== "string") return;
    if (m.t === "join") {
      if (room) return;
      const name = String(m.name || "").trim().slice(0, 14), pid = String(m.pid || "").replace(/[^a-z0-9]/gi, "").slice(0, 12);
      if (!name || !pid) return ws.send(JSON.stringify({ t: "err", m: "Digite seu nome." }));
      const clr = AV_CLR.includes(m.clr) ? m.clr : AV_CLR[0], em = AV_EM.includes(m.em) ? m.em : "";
      let r;
      if (m.create) r = newRoom();
      else { r = rooms.get(String(m.code || "").toUpperCase().slice(0, 4)); if (!r) return ws.send(JSON.stringify({ t: "err", m: "Sala não encontrada. Confira o código." })); }
      let p = r.players.get(pid);
      if (!p) {
        const onlineCount = [...r.players.values()].filter(q => q.on).length;
        if (onlineCount >= 12) return ws.send(JSON.stringify({ t: "err", m: "Sala cheia (máximo de 12)." }));
        p = { id: pid, name, ws: null, on: false, v: false, clr, em, offAt: null }; r.players.set(pid, p);
      } else if (p.ws && p.ws !== ws) { try { p.ws.close(); } catch (e) { } }
      p.name = name; p.ws = ws; p.on = true; p.v = false; p.clr = clr; p.em = em; p.offAt = null;
      if (!r.hostId || (!online(r, r.hostId) && ![...r.players.values()].some(q => q.on && q.id !== pid))) r.hostId = pid;
      room = r; me = p; r.seen = Date.now();
      send(p, { t: "ice", ice: ICE });
      return broadcast(r);
    }
    if (room && me) { room.seen = Date.now(); act(room, me, m); }
  });
  ws.on("close", () => {
    if (!room || !me || me.ws !== ws) return;
    me.on = false; me.v = false; me.offAt = Date.now(); room.seen = Date.now();
    if (room.hostId === me.id) {
      setTimeout(() => {
        if (room.hostId === me.id && !me.on) {
          const n = [...room.players.values()].find(p => p.on);
          if (n) { room.hostId = n.id; broadcast(room); }
        }
      }, 15000);
    }
    tick(room); broadcast(room);
  });
});

setInterval(() => {
  wss.clients.forEach(ws => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    try { ws.ping(); } catch (e) { }
  });
}, 30000);

setInterval(() => {
  const now = Date.now();
  rooms.forEach((r, c) => {
    if (r.g.ph === "lobby" || r.g.ph === "final") {
      [...r.players.entries()].forEach(([pid, p]) => {
        if (!p.on && p.offAt && now - p.offAt > 10 * 60 * 1000) r.players.delete(pid);
      });
    }
    if (![...r.players.values()].some(p => p.on) && now - r.seen > 30 * 60 * 1000) rooms.delete(c);
  });
}, 60000);

server.on("error", e => {
  if (e.code === "EADDRINUSE") console.error("Porta " + PORT + " já está em uso. Feche o outro processo ou defina a variável PORT.");
  else console.error("Erro no servidor:", e.message);
  process.exit(1);
});
server.listen(PORT, "0.0.0.0", () => console.log("Bluffin rodando em http://localhost:" + PORT));