'use strict';
/* =====================================================================
   Bruno Banane – Point-&-Click-Engine
   ===================================================================== */

const W = 1280, H = 720;
const SAVE_KEY = 'bruno-banane-save-v1';
const $ = q => document.querySelector(q);
const wait = ms => new Promise(r => setTimeout(r, ms));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const val = x => typeof x === 'function' ? x() : x;

let S = null; // Spielstand (wird gespeichert)
const G = { busy: false, dialog: false, sel: null, skip: null, hx: 300, hy: 620, dir: 1, walkId: 0, hero: null, verbObj: null, finished: false };

function newState() {
  return { scene: 'hafen', inv: [], flags: {}, hx: 300, hy: 610, dir: 1, clicks: 0, start: Date.now() };
}
const scene = () => SCENES[S.scene];
const has = id => S.inv.includes(id);
const findObj = id => scene().objects.find(o => o.id === id);

// ---------- Inventar ----------
function addItem(id) {
  if (!has(id)) S.inv.push(id);
  sfx('pick');
  renderInv();
  const el = document.querySelector(`.slot[data-item="${id}"]`);
  if (el) { el.classList.remove('new'); void el.getBoundingClientRect(); el.classList.add('new'); el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
}
function removeItem(id) {
  S.inv = S.inv.filter(i => i !== id);
  if (G.sel === id) G.sel = null;
  renderInv();
}
function renderInv() {
  const slots = S.inv.map(id => `<button class="slot${G.sel === id ? ' sel' : ''}" data-item="${id}" aria-label="${ITEMS[id].name}"><svg viewBox="0 0 100 100">${ITEMS[id].icon}</svg></button>`);
  for (let i = S.inv.length; i < 7; i++) slots.push('<div class="slot empty"></div>');
  $('#inv').innerHTML = slots.join('');
  updateCursor();
}
function updateCursor() {
  const st = $('#stage');
  if (!G.sel) { st.style.cursor = ''; return; }
  const icon = ITEMS[G.sel].icon.replace(/class="o2?"/g, 'stroke="#2a1748" stroke-width="4" stroke-linejoin="round"');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 100 100">${icon}</svg>`;
  st.style.cursor = `url("data:image/svg+xml,${encodeURIComponent(svg)}") 28 28, pointer`;
}

// ---------- Szene ----------
function renderScene() {
  $('#bg').innerHTML = scene().bg();
  renderObjects();
}
function renderObjects() {
  const sc = scene();
  const L = { back: '', obj: '', front: '' };
  for (const o of sc.objects) {
    if (o.show && !o.show()) continue;
    L[o.layer || 'obj'] += `<g class="hot${o.exit ? ' exit' : ''}" data-id="${o.id}"${o.actor ? ` data-actor="${o.actor}"` : ''}>${o.svg()}</g>`;
  }
  $('#back').innerHTML = L.back + (sc.mid ? `<g class="deco">${sc.mid()}</g>` : '') + L.obj;
  $('#front').innerHTML = L.front + (sc.fg ? `<g class="deco">${sc.fg()}</g>` : '');
}
function heroScale(y) {
  const sc = scene(), { y1, y2 } = sc.walk, [a, b] = sc.scale;
  return a + (b - a) * clamp((y - y1) / (y2 - y1), 0, 1);
}
function placeHero() {
  const s = heroScale(G.hy);
  G.hero.setAttribute('transform', `translate(${G.hx.toFixed(1)} ${G.hy.toFixed(1)}) scale(${(s * G.dir).toFixed(3)} ${s.toFixed(3)})`);
}
function clampWalk(x, y) {
  const sc = scene();
  if (sc.clamp) return sc.clamp(x, y);
  const w = sc.walk;
  return [clamp(x, w.x1, w.x2), clamp(y, w.y1, w.y2), null];
}
async function walkTo(x, y) {
  const id = ++G.walkId;
  const [tx, ty] = clampWalk(x, y);
  const pts = scene().route ? scene().route(G.hx, G.hy, tx, ty) : [[tx, ty]];
  for (const p of pts) {
    if (G.walkId !== id) return false;
    await walkSeg(p[0], p[1], id);
  }
  if (G.walkId === id) G.hero.classList.remove('walking');
  return G.walkId === id;
}
function walkSeg(tx, ty, id) {
  return new Promise(res => {
    if (Math.hypot(tx - G.hx, ty - G.hy) < 2) return res();
    if (Math.abs(tx - G.hx) > 3) G.dir = tx > G.hx ? 1 : -1;
    G.hero.classList.add('walking');
    let last = performance.now();
    const step = now => {
      if (G.walkId !== id) return res();
      const dt = Math.min(50, now - last) / 1000; last = now;
      const dx = tx - G.hx, dy = ty - G.hy, d = Math.hypot(dx, dy);
      const mv = 340 * heroScale(G.hy) * dt;
      if (d <= mv) { G.hx = tx; G.hy = ty; placeHero(); return res(); }
      G.hx += dx / d * mv; G.hy += dy / d * mv;
      placeHero();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}
function face(x) {
  if (Math.abs(x - G.hx) > 10) { G.dir = x > G.hx ? 1 : -1; placeHero(); }
}
function faceObj(o) {
  const el = document.querySelector(`.hot[data-id="${o.id}"]`);
  if (!el) return;
  try { const b = el.getBBox(); face(b.x + b.width / 2); } catch (e) { /* unsichtbar */ }
}

async function goScene(to, from) {
  from = from || S.scene;
  hideMenus();
  $('#fade').classList.add('on');
  await wait(380);
  S.scene = to;
  const sc = scene();
  const p = (sc.entry && sc.entry[from]) || sc.start;
  G.hx = p[0]; G.hy = p[1]; G.dir = p[2] || 1;
  G.walkId++;
  G.hero.classList.remove('walking');
  renderScene(); placeHero();
  playSong(val(sc.music));
  $('#fade').classList.remove('on');
  toast(sc.name);
  save();
  await wait(350);
  if (sc.enter) await sc.enter();
}

// ---------- Sprechen ----------
function actorPos(who) {
  if (who === 'hero') return [G.hx, G.hy - 305 * heroScale(G.hy)];
  if (who === 'narr') return [640, 70];
  const o = scene().objects.find(o => o.actor === who && (!o.show || o.show()));
  if (o && o.head) return val(o.head);
  return (ACTORS[who] && ACTORS[who].pos) || [640, 160];
}
function say(text, who = 'hero') {
  return new Promise(res => {
    const el = $('#speech');
    const [x, y] = actorPos(who);
    el.textContent = text;
    el.style.color = (ACTORS[who] || ACTORS.hero).color;
    el.className = 'show' + (who === 'narr' ? ' narr' : '');
    placeSpeech(el, x, who === 'narr' ? null : y);
    const talker = who === 'hero' ? G.hero : document.querySelector(`[data-actor="${who}"]`);
    if (talker) talker.classList.add('talking');
    let done = false, t = null, voice = null;
    const fin = () => {
      if (done) return; done = true;
      clearTimeout(t); G.skip = null;
      if (voice) voice.stop();
      el.className = '';
      if (talker) talker.classList.remove('talking');
      setTimeout(res, 90);
    };
    G.skip = fin;
    const fallback = () => { blip(who); t = setTimeout(fin, Math.max(1500, 800 + text.length * 52)); };
    const key = voiceKey(who, text);
    if (Snd.voiceOn && VOICE.has(key)) {
      loadVoice(key).then(buf => {
        if (done) return;
        voice = playVoice(buf);
        t = setTimeout(fin, buf.duration * 1000 + 350);
      }).catch(() => { if (!done) fallback(); });
    } else fallback();
  });
}
// Sprechblase über dem Sprecher platzieren, aber immer komplett im Bild
function placeSpeech(el, x, y) {
  const st = $('#stage'), sw = st.clientWidth, sh = st.clientHeight, pad = sw * .012;
  const w = el.offsetWidth, h = el.offsetHeight;
  const cx = clamp(x / W * sw, w / 2 + pad, sw - w / 2 - pad);
  el.style.left = cx + 'px';
  if (y == null) { el.style.top = pad + 'px'; return; }
  // Unterkante der Blase knapp über dem Kopf, notfalls tiefer rutschen
  el.style.top = clamp(y / H * sh, h + pad, sh - pad) + 'px';
}
async function run(h, ...args) {
  if (h == null) return;
  if (typeof h === 'function') {
    const r = await h(...args);
    if (typeof r === 'string' || Array.isArray(r)) return run(r);
    return;
  }
  if (typeof h === 'string') return say(h);
  if (Array.isArray(h)) for (const l of h) typeof l === 'string' ? await say(l) : await say(l[1], l[0]);
}

// Ein Skript blockiert die Eingabe, bis es fertig ist
async function script(fn) {
  if (G.busy) return;
  G.busy = true; hideMenus(); setLabel('');
  try { await fn(); }
  catch (e) { console.error(e); }
  finally {
    G.busy = false; G.sel = null;
    if (!G.finished) { renderInv(); renderObjects(); save(); }
  }
}

function interact(o, verb, item) {
  return script(async () => {
    const at = val(o.at);
    if (at) await walkTo(at[0], at[1]);
    faceObj(o);
    if (item) {
      const h = o.items && o.items[item];
      if (h) await run(h);
      else if (o.anyItem) await run(o.anyItem, item);
      else await say(pick(FAIL));
    } else if (verb === 'look') await run(o.look ?? `Das ist ${o.name}.`);
    else if (verb === 'use') await run(o.use ?? (() => say(pick(NOUSE))));
    else if (verb === 'talk') await run(o.talk ?? (() => say(pick(NOTALK).replace('%', o.name))));
  });
}
function doExit(o) {
  return script(async () => {
    const at = val(o.at);
    if (at) { const ok = await walkTo(at[0], at[1]); if (!ok) return; }
    await goScene(val(o.exit), S.scene);
  });
}
function combine(a, b) {
  return script(async () => {
    const h = COMBOS[[a, b].sort().join('+')];
    if (h) await run(h); else { sfx('fail'); await say(pick(FAIL)); }
  });
}

// ---------- Dialoge ----------
function choose(opts) {
  return new Promise(res => {
    const d = $('#dialog');
    d.innerHTML = opts.map((o, i) => `<button data-i="${i}">${o}</button>`).join('');
    d.hidden = false;
    d.onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      sfx('click');
      d.hidden = true; d.onclick = null;
      res(+b.dataset.i);
    };
  });
}
async function talkTo(id) {
  const D = DIALOGS[id];
  G.dialog = true;
  try {
    if (D.intro) await run(D.intro);
    let node = 'main';
    while (node && !G.finished) {
      const opts = D[node].filter(o => (!o.if || o.if()) && !(o.once && S.flags[`dlg:${id}:${o.t}`]));
      const o = opts[await choose(opts.map(o => o.t))];
      if (o.once) S.flags[`dlg:${id}:${o.t}`] = true;
      await say(o.t);
      await run(o.r);
      node = o.end ? null : (o.go || node);
    }
  } finally {
    G.dialog = false;
    $('#dialog').hidden = true;
  }
}

// ---------- UI ----------
function setLabel(t) { $('#label').textContent = t; $('#label').classList.toggle('show', !!t); }
function updateLabel() { setLabel(G.sel ? `Benutze ${ITEMS[G.sel].name} mit …` : ''); }
let toastTimer;
function toast(t) {
  const el = $('#toast'); el.textContent = t; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}
function hideMenus() { $('#verbs').hidden = true; $('#itemMenu').hidden = true; }
function showVerbs(o, e) {
  G.verbObj = o;
  const r = $('#stage').getBoundingClientRect();
  const v = $('#verbs');
  v.querySelector('.vname').textContent = o.name;
  v.querySelector('[data-v=use] small').textContent = o.useLabel || 'Benutzen';
  v.style.left = clamp((e.clientX - r.left) / r.width * 100, 15, 85) + '%';
  v.style.top = clamp((e.clientY - r.top) / r.height * 100, 22, 78) + '%';
  v.hidden = false;
  sfx('click');
}
function showItemMenu(id, btn) {
  const m = $('#itemMenu'), it = ITEMS[id];
  m.innerHTML = `<div class="iname">${it.name}</div><button data-a="look">👁️ Ansehen</button><button data-a="sel">🎯 Benutzen mit …</button>${it.act ? `<button data-a="act">${it.act.label}</button>` : ''}`;
  const gr = $('#game').getBoundingClientRect(), br = btn.getBoundingClientRect();
  m.style.left = clamp((br.left + br.width / 2 - gr.left) / gr.width * 100, 12, 88) + '%';
  m.style.bottom = ((gr.bottom - br.top) / gr.height * 100 + 1) + '%';
  m.dataset.item = id;
  m.hidden = false;
  sfx('click');
}
function toSvg(e) {
  const svg = $('#scene'), pt = svg.createSVGPoint();
  pt.x = e.clientX; pt.y = e.clientY;
  const p = pt.matrixTransform(svg.getScreenCTM().inverse());
  return [p.x, p.y];
}
function freeWalk(x, y) {
  const [, , msg] = clampWalk(x, y);
  walkTo(x, y).then(async ok => {
    if (ok && msg && !G.busy) { G.busy = true; await say(msg); G.busy = false; }
  });
}
function lookSelf() {
  return script(async () => { await say(pick(SELF_LOOK)); });
}

function bindUI() {
  const stage = $('#stage');
  stage.addEventListener('click', e => {
    if (G.skip) { G.skip(); return; }
    if (G.busy || G.dialog || !S) return;
    S.clicks++;
    const vb = e.target.closest('#verbs button');
    if (vb) { interact(G.verbObj, vb.dataset.v); return; }
    if (!$('#verbs').hidden || !$('#itemMenu').hidden) { hideMenus(); if (!e.target.closest('.hot')) return; }
    if (e.target.closest('#hero')) {
      if (G.sel) { const it = ITEMS[G.sel]; script(() => it.act ? run(it.act.run) : say(`Mich selbst mit ${it.name} benutzen? Lieber nicht.`)); }
      else lookSelf();
      return;
    }
    const hot = e.target.closest('.hot');
    if (hot) {
      const o = findObj(hot.dataset.id);
      if (!o) return;
      if (G.sel) { interact(o, null, G.sel); return; }
      if (o.exit && val(o.exit)) { doExit(o); return; }
      showVerbs(o, e);
      return;
    }
    if (G.sel) { G.sel = null; renderInv(); updateLabel(); }
    const [x, y] = toSvg(e);
    freeWalk(x, y);
  });
  stage.addEventListener('contextmenu', e => {
    e.preventDefault();
    if (G.busy || G.dialog || !S) return;
    const hot = e.target.closest('.hot');
    if (hot) { const o = findObj(hot.dataset.id); if (o && !o.exit) interact(o, 'look'); }
    else if (G.sel) { G.sel = null; renderInv(); updateLabel(); }
  });
  stage.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || G.busy || !S) return;
    const hot = e.target.closest('.hot');
    const name = hot ? (findObj(hot.dataset.id) || {}).name : (e.target.closest('#hero') ? 'Bruno Banane' : '');
    if (G.sel) setLabel(`Benutze ${ITEMS[G.sel].name} mit ${name || '…'}`);
    else setLabel(name || '');
  });

  $('#inv').addEventListener('click', e => {
    if (G.skip) { G.skip(); return; }
    if (G.busy || G.dialog) return;
    const b = e.target.closest('.slot[data-item]');
    if (!b) return;
    const id = b.dataset.item;
    if (G.sel && G.sel !== id) { const a = G.sel; G.sel = null; combine(a, id); return; }
    if (G.sel === id) { G.sel = null; renderInv(); updateLabel(); return; }
    if (!$('#itemMenu').hidden && $('#itemMenu').dataset.item === id) { hideMenus(); return; }
    hideMenus();
    showItemMenu(id, b);
  });
  $('#inv').addEventListener('contextmenu', e => {
    e.preventDefault();
    const b = e.target.closest('.slot[data-item]');
    if (b && !G.busy && !G.dialog) script(() => run(ITEMS[b.dataset.item].look));
  });
  $('#itemMenu').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const id = $('#itemMenu').dataset.item, it = ITEMS[id];
    hideMenus();
    if (b.dataset.a === 'look') script(() => run(it.look));
    else if (b.dataset.a === 'act') script(() => run(it.act.run));
    else { G.sel = id; sfx('click'); renderInv(); updateLabel(); }
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('#itemMenu, #inv, #stage')) $('#itemMenu').hidden = true;
  });

  $('#btnHint').onclick = () => { if (G.skip) return G.skip(); if (!G.busy && !G.dialog) script(() => say('Psst! ' + hint(), 'narr')); };
  $('#btnSound').onclick = () => { setSound(!Snd.on); };
  $('#btnVoice').onclick = () => { ensureAudio(); setVoice(!Snd.voiceOn); };
  $('#btnMenu').onclick = openMenu;
  $('#mResume').onclick = closeMenu;
  $('#mHelp').onclick = () => { $('#help').hidden = !$('#help').hidden; };
  $('#mFull').onclick = toggleFullscreen;
  $('#mNew').onclick = () => { if (confirm('Wirklich ein neues Spiel starten? Der aktuelle Spielstand geht verloren.')) { closeMenu(); startGame(true); } };
  $('#mTitle').onclick = () => { save(); closeMenu(); showTitle(); };
  $('#tNew').onclick = () => startGame(true);
  $('#tLoad').onclick = () => startGame(false);
  $('#tFull').onclick = toggleFullscreen;
  $('#eAgain').onclick = () => { $('#end').hidden = true; startGame(true); };

  document.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') { if (G.skip) { e.preventDefault(); G.skip(); } }
    else if (e.key === 'Escape') {
      if (!$('#menu').hidden) closeMenu();
      else if (G.sel) { G.sel = null; renderInv(); updateLabel(); }
      else if (S && $('#title').hidden && $('#end').hidden) openMenu();
      hideMenus();
    } else if (e.key === 'h' && S && !G.busy && $('#title').hidden) $('#btnHint').click();
  });
}

function openMenu() { hideMenus(); $('#help').hidden = true; $('#menu').hidden = false; }
function closeMenu() { $('#menu').hidden = true; }
function toggleFullscreen() {
  const d = document;
  if (!d.fullscreenElement) (d.documentElement.requestFullscreen || d.documentElement.webkitRequestFullscreen || (() => {})).call(d.documentElement)?.catch?.(() => {});
  else d.exitFullscreen?.();
}

// ---------- Speichern ----------
function save() {
  if (!S || G.finished) return;
  S.hx = G.hx; S.hy = G.hy; S.dir = G.dir;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* privat */ }
}
function loadSave() {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); return s && SCENES[s.scene] ? s : null; } catch (e) { return null; }
}

// ---------- Start / Ende ----------
function showTitle() {
  playSong(null);
  $('#tLoad').hidden = !loadSave();
  $('#title').hidden = false;
}
async function startGame(fresh) {
  ensureAudio();
  S = (!fresh && loadSave()) || newState();
  if (fresh) S.start = Date.now();
  G.finished = false; G.sel = null; G.busy = false; G.dialog = false;
  G.hx = S.hx; G.hy = S.hy; G.dir = S.dir;
  $('#title').hidden = true; $('#end').hidden = true;
  hideMenus();
  renderScene(); placeHero(); renderInv(); updateLabel();
  playSong(val(scene().music));
  toast(scene().name);
  if (fresh) await script(intro);
}
function showEnd() {
  G.finished = true;
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* egal */ }
  const min = Math.max(1, Math.round((Date.now() - S.start) / 60000));
  $('#eStats').textContent = `${S.clicks} Klicks · ${min} Minute${min === 1 ? '' : 'n'} · 1 glückliche Oma`;
  $('#end').hidden = false;
  playSong('disco');
}

// ---------- Audio (WebAudio-Synth) ----------
const Snd = { ctx: null, on: true, voiceOn: true, cur: null, timer: null };
try { Snd.on = localStorage.getItem('bruno-sound') !== 'off'; Snd.voiceOn = localStorage.getItem('bruno-voice') !== 'off'; } catch (e) { /* egal */ }
function ensureAudio() {
  try {
    if (!Snd.ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      Snd.ctx = new C();
      Snd.master = Snd.ctx.createGain(); Snd.master.gain.value = .8; Snd.master.connect(Snd.ctx.destination);
      Snd.mus = Snd.ctx.createGain(); Snd.mus.gain.value = .5; Snd.mus.connect(Snd.master);
      Snd.vox = Snd.ctx.createGain(); Snd.vox.gain.value = 1; Snd.vox.connect(Snd.ctx.destination);
    }
    if (Snd.ctx.state === 'suspended') Snd.ctx.resume();
    return Snd.ctx;
  } catch (e) { return null; }
}
function tone(f, t, d, type = 'square', v = .1, dest = Snd.master, slide) {
  const c = Snd.ctx, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
  g.gain.setValueAtTime(.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + .012);
  g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g); g.connect(dest);
  o.start(t); o.stop(t + d + .05);
}
function noise(t, d, v = .1, dest = Snd.master, hp = 6000) {
  const c = Snd.ctx;
  if (!Snd.nbuf) {
    Snd.nbuf = c.createBuffer(1, c.sampleRate * .5, c.sampleRate);
    const a = Snd.nbuf.getChannelData(0);
    for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1;
  }
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = Snd.nbuf; f.type = 'highpass'; f.frequency.value = hp;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  s.connect(f); f.connect(g); g.connect(dest);
  s.start(t); s.stop(t + d + .02);
}
function sfx(n) {
  const c = ensureAudio();
  if (!c || !Snd.on) return;
  const t = c.currentTime, M = Snd.master;
  switch (n) {
    case 'pick': [660, 880, 1320].forEach((f, i) => tone(f, t + i * .07, .16, 'triangle', .2)); break;
    case 'fail': tone(220, t, .28, 'square', .07, M, 110); break;
    case 'coin': tone(988, t, .08, 'square', .09); tone(1319, t + .08, .35, 'square', .09); break;
    case 'quack': tone(720, t, .12, 'sawtooth', .1, M, 380); tone(660, t + .15, .15, 'sawtooth', .1, M, 330); break;
    case 'squawk': for (let i = 0; i < 5; i++) tone(900 + Math.random() * 400, t + i * .09, .08, 'sawtooth', .08, M, 500); break;
    case 'door': tone(140, t, .25, 'square', .1, M, 70); noise(t, .15, .12, M, 900); tone(600, t + .25, .05, 'square', .06); break;
    case 'scrub': for (let i = 0; i < 7; i++) noise(t + i * .1, .07, .18, M, 2500); break;
    case 'crunch': for (let i = 0; i < 4; i++) noise(t + i * .07, .05, .2, M, 1200); break;
    case 'click': tone(1400, t, .03, 'square', .03); break;
    case 'horn': tone(110, t, 1.4, 'sawtooth', .1); tone(138.6, t, 1.4, 'sawtooth', .07); break;
    case 'magic': for (let i = 0; i < 12; i++) tone(700 + i * 110, t + i * .04, .12, 'sine', .08); break;
    case 'win': [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone(f, t + i * .12, .32, 'triangle', .18)); break;
  }
}
// Kleine "Stimmen" für jede Figur
function blip(who) {
  const c = Snd.ctx;
  if (!c || !Snd.on || who === 'narr') return;
  const base = { hero: 330, olga: 420, guenther: 700, lama: 200, krabbe: 900, gw: 1200, tukan: 800 }[who] || 400;
  const t = c.currentTime;
  for (let i = 0; i < 3; i++) tone(base * (1 + Math.random() * .4), t + i * .07, .05, 'square', .025);
}
// Vorproduzierte Sprachausgabe (voice/<hash>.mp3, erzeugt mit tools/voices.js)
const VOICE = new Set();
const voiceCache = new Map();
function voiceKey(who, text) {
  let h = 0x811c9dc5;
  const s = who + '|' + text;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).padStart(8, '0');
}
async function loadVoice(key) {
  if (voiceCache.has(key)) return voiceCache.get(key);
  const c = ensureAudio();
  if (!c) throw new Error('kein Audio');
  const res = await fetch(`voice/${key}.mp3`);
  if (!res.ok) throw new Error(res.status);
  const data = await res.arrayBuffer();
  const buf = await new Promise((ok, bad) => c.decodeAudioData(data, ok, bad));
  voiceCache.set(key, buf);
  if (voiceCache.size > 24) voiceCache.delete(voiceCache.keys().next().value);
  return buf;
}
function playVoice(buf) {
  const c = Snd.ctx, src = c.createBufferSource();
  src.buffer = buf; src.connect(Snd.vox);
  Snd.mus.gain.setTargetAtTime(.15, c.currentTime, .08);
  let stopped = false;
  const stop = () => {
    if (stopped) return; stopped = true;
    try { src.stop(); } catch (e) { /* schon zu Ende */ }
    Snd.mus.gain.setTargetAtTime(.5, Snd.ctx.currentTime, .3);
  };
  src.onended = stop;
  src.start();
  return { stop };
}
function setVoice(on) {
  Snd.voiceOn = on;
  try { localStorage.setItem('bruno-voice', on ? 'on' : 'off'); } catch (e) { /* egal */ }
  $('#btnVoice').classList.toggle('off', !on);
  $('#btnVoice').title = on ? 'Sprachausgabe aus' : 'Sprachausgabe an';
}

function nf(n) {
  const m = /^([A-G])(#?)(\d)$/.exec(n);
  const semi = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] ? 1 : 0);
  return 440 * Math.pow(2, (12 * (+m[3] + 1) + semi - 69) / 12);
}
function playSong(name) {
  if (Snd.cur === name && Snd.timer) return;
  clearInterval(Snd.timer); Snd.timer = null;
  Snd.cur = name;
  const c = ensureAudio();
  if (!name || !c || !Snd.on) return;
  const song = SONGS[name], stepDur = 60 / song.bpm / 2;
  const tracks = song.tracks.map(tr => ({ ...tr, seq: tr.seq.trim().split(/\s+/) }));
  let step = 0, next = c.currentTime + .1;
  Snd.timer = setInterval(() => {
    while (next < c.currentTime + .25) {
      for (const tr of tracks) {
        const tok = tr.seq[step % tr.seq.length];
        if (tok === '.' || tok === '-') continue;
        if (tr.drum) {
          if (tok === 'k') tone(150, next, .16, 'sine', tr.vol * 4, Snd.mus, 45);
          else if (tok === 's') noise(next, .12, tr.vol * 1.6, Snd.mus, 1500);
          else if (tok === 'h') noise(next, .035, tr.vol, Snd.mus, 7000);
        } else {
          let len = 1;
          while (tr.seq[(step + len) % tr.seq.length] === '-' && len < 16) len++;
          tone(nf(tok), next, stepDur * len * .92, tr.wave, tr.vol, Snd.mus);
        }
      }
      step++; next += stepDur;
    }
  }, 60);
}
function setSound(on) {
  Snd.on = on;
  try { localStorage.setItem('bruno-sound', on ? 'on' : 'off'); } catch (e) { /* egal */ }
  $('#btnSound').textContent = on ? '🔊' : '🔇';
  if (on) { const cur = Snd.cur; Snd.cur = null; playSong(cur || (S && $('#title').hidden ? val(scene().music) : null)); }
  else { clearInterval(Snd.timer); Snd.timer = null; }
}

// ---------- PWA ----------
let installPrompt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; $('#tInstall').hidden = false; });
window.addEventListener('appinstalled', () => { $('#tInstall').hidden = true; });

// ---------- Init ----------
function init() {
  G.hero = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  G.hero.id = 'hero';
  G.hero.innerHTML = HERO_SVG;
  $('#heroLayer').appendChild(G.hero);
  $('#titleHero').innerHTML = HERO_SVG;
  $('#btnSound').textContent = Snd.on ? '🔊' : '🔇';
  setVoice(Snd.voiceOn);
  fetch('voice/index.json').then(r => r.ok ? r.json() : []).then(keys => keys.forEach(k => VOICE.add(k))).catch(() => {});
  $('#tInstall').onclick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null; $('#tInstall').hidden = true;
  };
  bindUI();
  showTitle();
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
init();
