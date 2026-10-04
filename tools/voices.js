#!/usr/bin/env node
/* Erzeugt die Sprachausgabe für alle Spieltexte – lokal und kostenlos mit
 * Chatterbox Multilingual (natürlich, Stimmklonen) oder Piper TTS (schnell).
 *
 *   node tools/voices.js            geänderte/fehlende Sätze erzeugen
 *   node tools/voices.js --force    alle Sätze neu erzeugen
 *   node tools/voices.js --samples  Hörproben nach voice-samples/ schreiben
 *   node tools/voices.js --review   Prüfseite voice-samples/review.html mit allen Sätzen
 *   node tools/voices.js --check    alle Sätze per Lauterkennung prüfen (markiert Genuschel/Fehler)
 *   node tools/voices.js --redo     auffällige Sätze neu vertonen, bester von bis zu 5 Versuchen per Lauterkennung
 *   node tools/voices.js --trim     angehängte Wortschnipsel am Satzende finden und abschneiden (--dry: nur anzeigen)
 *   node tools/voices.js --list     nur die gefundenen Sätze ausgeben
 *   node tools/voices.js --ipa "Text"  eSpeak-Lautschrift prüfen (nur Piper), siehe tools/aussprache.js
 *
 * Voraussetzungen: ffmpeg mit libmp3lame und rubberband;
 * Chatterbox: Python-Umgebung unter $CHATTERBOX_PY (Standard ~/.local/chatterbox/bin/python)
 * Piper: unter $PIPER_DIR (Standard ~/.local/piper) mit ./piper/piper und den Stimmen in ./voices/
 */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { execFile, spawn } = require('child_process');
const acorn = require('acorn');
const walk = require('acorn-walk');
const crypto = require('crypto');
const { aussprache } = require('./aussprache');

const ROOT = path.join(__dirname, '..');
const PIPER_DIR = process.env.PIPER_DIR || path.join(os.homedir(), '.local/piper');
const PIPER = path.join(PIPER_DIR, 'piper/piper');
const VOICES = path.join(PIPER_DIR, 'voices');
const CHATTERBOX_PY = process.env.CHATTERBOX_PY || path.join(os.homedir(), '.local/chatterbox/bin/python');
const REFS = path.join(__dirname, 'voice-refs');
const OUT = path.join(ROOT, 'voice');
const SAMPLES = path.join(ROOT, 'voice-samples');
const REPORT = path.join(__dirname, 'voice-report.json');
module.exports = { collectLines: () => collectLines(), speakable: (t, e) => speakable(t, e), render: (j, o) => render(j, o), castFor: (w, t) => castFor(w, t), PIPER_DIR };

// ---------- Besetzung ----------
// Chatterbox: ref = Referenzstimme in tools/voice-refs/, exaggeration = Ausdrucksstärke (0.25–2),
//             cfg = Treue zur Referenz/Sprechtempo (niedriger = lockerer)
// Piper:      model, speaker, length (Sprechtempo, >1 = langsamer)
// Beide:      semis = Tonhöhe in Halbtönen (formant-erhaltend), tempo (>1 = schneller),
//             chorus = Halbtöne einer leisen zweiten Stimme
const MLS = 'de_DE-mls-medium', THO = 'de_DE-thorsten-high', EMO = 'de_DE-thorsten_emotional-medium', KER = 'de_DE-kerstin-low';
const EMO_ID = { amused: 0, angry: 1, disgusted: 2, drunk: 3, neutral: 4, sleepy: 5, surprised: 6, whisper: 7 };
const CB = (ref, o = {}) => ({ engine: 'chatterbox', ref, exaggeration: 0.5, cfg: 0.5, semis: 0, tempo: 1, ...o });
const PP = (model, o = {}) => ({ engine: 'piper', model, length: 1, semis: 0, tempo: 1, ...o });

// Bisherige Piper-Besetzung (zum Vergleich in den Hörproben)
const PIPER_CAST = {
  hero:     PP(THO, { length: 0.9, semis: 1.5 }),
  narr:     PP(KER, { length: 1.05 }),
  olga:     PP(KER, { semis: -3 }),
  guenther: PP(EMO, { speaker: EMO_ID.angry, length: 0.82, semis: 6 }),
  lama:     PP(EMO, { speaker: EMO_ID.sleepy, length: 1.2, semis: -3 }),
  lamaHappy:PP(EMO, { speaker: EMO_ID.amused, semis: -2 }),
  krabbe:   PP(EMO, { speaker: EMO_ID.whisper, length: 1.1 }),
  gw:       PP(KER, { length: 0.85, semis: 7, chorus: 10 }),
  tukan:    PP(MLS, { speaker: 104, length: 0.8, semis: 5 }),
};

const CAST = {
  hero:     CB('thorsten-neutral', { exaggeration: 0.55 }),
  narr:     CB('kerstin', { exaggeration: 0.4 }),
  olga:     CB('mls-4533', { exaggeration: 0.7, cfg: 0.4 }),
  guenther: CB('thorsten-angry', { exaggeration: 0.9, cfg: 0.4, semis: 3 }),
  lama:     CB('thorsten-sleepy', { exaggeration: 0.35, semis: -2, tempo: 0.92 }),
  lamaHappy:CB('thorsten-amused', { exaggeration: 0.9, cfg: 0.4, semis: -2 }),
  krabbe:   CB('thorsten-whisper', { exaggeration: 0.3 }),
  gw:       CB('mls-1091', { exaggeration: 0.7, cfg: 0.4, semis: 3, chorus: 5 }),
  tukan:    CB('mls-8294', { exaggeration: 0.9, cfg: 0.4, semis: 2 }),
};
// Regie für einzelne Sätze (Originaltext → Abweichungen von der Figur):
// exaggeration/cfg/semis/tempo wie oben, say = gesprochener Wortlaut (Untertitel bleibt), ⟦…⟧ = Geräusch
const REGIE = {
  'GURKENWASSER?! PARTYYYY!': { exaggeration: 1.4, cfg: 0.3, say: 'Oh! Gurkenwasser?! Party! ⟦laugh⟧' },
};
// Sätze, die Lamar schon glücklich sagt
const LAMA_HAPPY = ['Freund', 'HAHA', 'LACHST', 'elf Jahren', 'schönste Tag', 'ICH WEISS', 'LAHM', 'Dalai', 'Daumen', 'Testphase', 'Show'];

// Gleicher Hash wie in engine.js (FNV-1a über UTF-16-Einheiten)
function voiceKey(who, text) {
  let h = 0x811c9dc5;
  const s = who + '|' + text;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).padStart(8, '0');
}

// Text für die Aussprache aufbereiten (der Hash nutzt den Originaltext)
function speakable(text, engine = 'piper') {
  return aussprache(text, engine)
    .replace(/💡/g, 'Glühbirnen-Knopf')
    .replace(/[\u{1F000}-\u{1FFFF}☀-➿]/gu, '')
    .replace(/\*/g, '')
    .replace(/[„“"()]/g, '')
    .replace(/–/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------- Texte aus content.js sammeln ----------
function collectLines() {
  const src = fs.readFileSync(path.join(ROOT, 'content.js'), 'utf8');
  const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script' });
  const actors = new Set(['hero', 'narr', 'olga', 'guenther', 'lama', 'krabbe', 'gw', 'tukan']);
  const SKIP_KEYS = new Set(['name', 'label', 'useLabel', 'id', 'exit', 'actor', 'music', 'wave', 'seq', 'layer', 'color', 'model']);
  const lines = new Map();
  const add = (who, text) => {
    if (!/[A-Za-zÄÖÜäöüß]/.test(text) || !speakable(text)) return;
    const k = voiceKey(who, text);
    if (!lines.has(k)) lines.set(k, { who, text });
  };
  const within = (node, outer) => outer && node.start >= outer.start && node.end <= outer.end;

  walk.fullAncestor(ast, (node, _state, anc) => {
    let text;
    if (node.type === 'Literal' && typeof node.value === 'string') text = node.value;
    else if (node.type === 'TemplateLiteral' && node.expressions.length === 0) text = node.quasis[0].value.cooked;
    else return;
    if (/[<>{}#=]/.test(text) || /^[a-z_+:]+$/.test(text) || actors.has(text)) return;
    if (text.length < 2 || text === 'use strict' || /^\s/.test(text) || /\d \d/.test(text) || /^(translate|rotate|scale)\(/.test(text)) return;
    const parent = anc[anc.length - 2];
    if (parent.type === 'Property' && (parent.key === node || SKIP_KEYS.has(parent.key.name || parent.key.value))) return;
    if (parent.type === 'MemberExpression') return;

    let who = 'hero', prefix = '';
    for (let i = anc.length - 2; i >= 0; i--) {
      const a = anc[i];
      if (a.type === 'ArrayExpression' && a.elements.length === 2 && a.elements[0] && a.elements[0].type === 'Literal' && actors.has(a.elements[0].value) && within(node, a.elements[1])) { who = a.elements[0].value; break; }
      if (a.type === 'CallExpression' && a.callee.name === 'say' && within(node, a.arguments[0])) { who = a.arguments[1] ? a.arguments[1].value : 'hero'; break; }
      if (a.type === 'FunctionDeclaration' && a.id.name === 'hint') { who = 'narr'; prefix = 'Psst! '; break; }
      if (a.type === 'CallExpression' && ['addItem', 'removeItem', 'sfx', 'talkTo', 'playSong', 'goScene', 'has', 'rng', 'wait'].includes(a.callee.name)) return;
    }
    add(who, prefix + text);
  });

  // Sätze, die die Engine aus Textbausteinen zusammensetzt
  const vm = require('vm');
  const ctx = { console, Math, S: { flags: {} } };
  vm.createContext(ctx);
  vm.runInContext(src + '\n;this.SCENES=SCENES;this.ITEMS=ITEMS;this.NOTALK=NOTALK;', ctx);
  for (const sc of Object.values(ctx.SCENES)) for (const o of sc.objects) {
    if (o.exit) continue;
    if (o.look == null) add('hero', `Das ist ${o.name}.`);
    if (o.talk == null) for (const t of ctx.NOTALK) add('hero', t.replace('%', o.name));
  }
  for (const it of Object.values(ctx.ITEMS)) if (!it.act) add('hero', `Mich selbst mit ${it.name} benutzen? Lieber nicht.`);
  return lines;
}

function castFor(who, text) {
  const base = who === 'lama' && LAMA_HAPPY.some(w => text.includes(w)) ? CAST.lamaHappy : (CAST[who] || CAST.hero);
  return REGIE[text] ? { ...base, ...REGIE[text] } : base;
}
const spoken = (text, c) => speakable(c.say || text, c.engine);

// ---------- Audio erzeugen ----------
function run(cmd, args, input, env) {
  return new Promise((res, rej) => {
    const p = execFile(cmd, args, { maxBuffer: 1 << 26, env: env ? { ...process.env, ...env } : undefined }, (err, stdout, stderr) => err ? rej(new Error(stderr || err.message)) : res(stdout));
    if (input != null) { p.stdin.write(input); p.stdin.end(); }
  });
}
async function pool(items, n, fn, label = '') {
  let i = 0, done = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) {
      const it = items[i++];
      await fn(it);
      if (++done % 10 === 0 || done === items.length) process.stdout.write(`\r  ${label}${done}/${items.length}`);
    }
  }));
  if (items.length) process.stdout.write('\n');
}

// Rohaufnahmen mit Piper
async function piperRaw(job) {
  const c = job.c;
  const args = ['-m', path.join(VOICES, c.model + '.onnx'), '-f', job.out, '-q', '--length_scale', String(c.length), '--sentence_silence', '0.15'];
  if (c.speaker != null) args.push('-s', String(c.speaker));
  await run(PIPER, args, job.text + '\n');
}

// Rohaufnahmen mit Chatterbox: ein Python-Prozess pro Modell (wird nur einmal geladen)
async function chatterboxRaw(list, model, tmp) {
  if (!list.length) return {};
  const file = path.join(tmp, `jobs-${model}.json`);
  fs.writeFileSync(file, JSON.stringify(list));
  const byOut = Object.fromEntries(list.map(j => [j.out, j.key]));
  const results = {};
  const t0 = Date.now();
  const name = model === 'turbo' ? 'Geräusche (Turbo)' : 'Chatterbox';
  await new Promise((res, rej) => {
    const p = spawn(CHATTERBOX_PY, [path.join(__dirname, 'chatterbox_tts.py'), file, model], { stdio: ['ignore', 'pipe', 'pipe'] });
    let err = '', done = 0;
    p.stderr.on('data', d => { err = (err + d).slice(-4000); });
    readline.createInterface({ input: p.stdout }).on('line', l => {
      let r; try { r = JSON.parse(l); } catch (e) { return; }
      if (r.ready) { process.stdout.write(`  ${name} bereit (${r.ready})\n`); return; }
      results[byOut[r.out]] = r;
      done++;
      const eta = Math.round((Date.now() - t0) / done * (list.length - done) / 60000);
      process.stdout.write(`\r  ${name} ${done}/${list.length}, noch ca. ${eta} min   `);
    });
    p.on('close', code => { process.stdout.write('\n'); code === 0 ? res() : rej(new Error(name + ' fehlgeschlagen:\n' + err)); });
  });
  return results;
}

// Kauen und Summen gibt es nicht als Tag – das sind kleine Klangeffekte
async function synthSound(job) {
  const src = job.tag === 'chew'
    ? [0, 1, 2].map(i => `anoisesrc=d=0.09:c=pink:a=0.6:r=24000:seed=${job.seed + i},highpass=f=700,lowpass=f=3500,afade=t=in:d=0.01,afade=t=out:st=0.03:d=0.06,apad=pad_dur=${0.08 + i * 0.02}[c${i}]`).join(';') + ';[c0][c1][c2]concat=n=3:v=0:a=1'
    : `aevalsrc='0.35*(2*mod(210*t\\,1)-1)*(0.55+0.45*sin(2*PI*28*t))':d=0.5:s=24000,lowpass=f=2600,afade=t=in:d=0.05,afade=t=out:st=0.35:d=0.15`;
  await run('ffmpeg', ['-v', 'error', '-y', '-filter_complex', src, '-ac', '1', job.out]);
}

// Teile (Sprache/Geräusch) mit kurzen Pausen zu einer Rohaufnahme zusammenfügen
async function assemble(job) {
  const trim = 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse';
  const parts = job.files.map((f, i) => `[${i}]aresample=24000,aformat=channel_layouts=mono,${trim},apad=pad_dur=0.12[s${i}]`).join(';');
  const filter = `${parts};${job.files.map((f, i) => `[s${i}]`).join('')}concat=n=${job.files.length}:v=0:a=1`;
  await run('ffmpeg', ['-v', 'error', '-y', ...job.files.flatMap(f => ['-i', f]), '-filter_complex', filter, job.out]);
}

// Text in Sprach- und Geräusch-Teile zerlegen
function segments(spoken) {
  return spoken.split(/(⟦[a-z]+⟧)/).map(p => {
    const m = /^⟦([a-z]+)⟧$/.exec(p);
    if (m) return { tag: m[1] };
    const text = p.replace(/^[\s.,!?…:;-]+/, '').replace(/\s+/g, ' ').trim();
    return /[A-Za-zÄÖÜäöüß]/.test(text) ? { text } : null;
  }).filter(Boolean);
}
const soundRef = c => path.join(REFS, (c.soundRef || (c.engine === 'chatterbox' ? c.ref : 'thorsten-amused')) + '.flac');
const stripTags = t => t.replace(/⟦[a-z]+⟧/g, ' ').replace(/\s+/g, ' ').trim();

// Nachbearbeitung: Tonhöhe/Tempo formant-erhaltend, Chor mischen, Stille kappen, Lautheit angleichen
async function finish(job) {
  const c = job.c;
  const rb = (semis, tempo) => `rubberband=pitch=${Math.pow(2, semis / 12).toFixed(5)}:tempo=${tempo}:formant=preserved`;
  const trim = 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse';
  const tail = `${trim},loudnorm=I=-16:TP=-1.5`;
  const filter = job.raw[1]
    ? `[0]aresample=24000,${rb(c.semis, c.tempo)}[a];[1]aresample=24000,${rb(c.chorus, c.tempo)},adelay=15,volume=0.35[b];[a][b]amix=inputs=2:duration=longest,volume=2,${tail}`
    : `[0]aresample=24000,${rb(c.semis, c.tempo)},${tail}`;
  const inputs = job.raw.flatMap(f => ['-i', f]);
  await run('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', filter, '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '40k', job.out]);
}

// Vertont eine Liste {key, text, c, out}; liefert die Prüfergebnisse (Schlüssel = key bzw. key:take:teil)
async function render(jobs, { verify = false } = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bruno-voices-'));
  const mtl = [], turbo = [], piper = [], synth = [], asm = [];
  jobs.forEach((j, i) => {
    const segs = segments(spoken(j.text, j.c));
    const takes = j.c.chorus != null ? 2 : 1;
    j.raw = [];
    for (let t = 0; t < takes; t++) {
      const files = [];
      segs.forEach((sg, n) => {
        const out = path.join(tmp, `${i}_${t}_${n}.wav`);
        const seed = (parseInt(j.key.slice(0, 6), 16) + n * 13 + t * 7) % 100000;
        const key = t === 0 && n === 0 ? j.key : `${j.key}:${t}:${n}`;
        files.push(out);
        if (sg.tag === 'chew' || sg.tag === 'buzz') synth.push({ tag: sg.tag, out, seed });
        else if (sg.tag) turbo.push({ text: `[${sg.tag}]`, ref: soundRef(j.c), out, seed, key });
        else if (j.c.engine === 'chatterbox') mtl.push({ text: sg.text, ref: path.join(REFS, j.c.ref + '.flac'), exaggeration: j.c.exaggeration, cfg: j.c.cfg, out, seed, key });
        else piper.push({ text: sg.text, c: j.c, out });
      });
      const raw = path.join(tmp, `${i}_${t}.wav`);
      j.raw.push(raw);
      asm.push({ files, out: raw });
    }
  });
  if (verify && mtl.length) {
    const ipa = await phonemize(mtl.map(m => m.text));
    mtl.forEach((m, i) => { m.expected = ipa[i]; });
  }
  const n = Math.max(2, os.cpus().length - 2);
  await pool(piper, n, piperRaw, 'Piper ');
  await pool(synth, n, synthSound, 'Klangeffekte ');
  const results = { ...await chatterboxRaw(mtl, 'mtl', tmp), ...await chatterboxRaw(turbo, 'turbo', tmp) };
  await pool(asm, n, assemble, 'Zusammenfügen ');
  await pool(jobs, n, finish, 'Nachbearbeitung ');
  fs.rmSync(tmp, { recursive: true, force: true });
  return results;
}

const describe = c => c.engine === 'piper'
  ? `Piper ${c.model.replace('de_DE-', '')}${c.speaker != null ? ' #' + c.speaker : ''}`
  : `Chatterbox ${c.ref}, Ausdruck ${c.exaggeration}, cfg ${c.cfg}`
  + `${c.semis ? `, ${c.semis > 0 ? '+' : ''}${c.semis} HT` : ''}${c.tempo !== 1 ? `, Tempo ${c.tempo}` : ''}${c.chorus != null ? `, Chor +${c.chorus}` : ''}`;
const STYLE = `<style>body{font-family:system-ui,sans-serif;background:#2a1748;color:#fff;max-width:860px;margin:24px auto;padding:0 16px}h1{color:#ffd60a}section{background:#ffffff14;border-radius:14px;padding:12px 16px;margin:12px 0}h2{margin:0 0 4px;color:#ff8ae6}p{margin:0 0 8px;color:#cfc3ff;font-style:italic}.v{display:flex;align-items:center;gap:12px;margin:6px 0;flex-wrap:wrap}.v b{color:#7ff0ff;min-width:2em}.v small{color:#bbb}.flag{background:#ff3d6e33;border-radius:8px;padding:2px 6px}audio{height:34px}</style>`;

// ---------- Hörproben ----------
async function samples() {
  fs.mkdirSync(SAMPLES, { recursive: true });
  const S = [
    ['Bruno', [PIPER_CAST.hero, CAST.hero, CB('thorsten-amused', { exaggeration: 0.6 }), CB('mls-2034', { exaggeration: 0.55 })],
      'Na toll. Die Fähre nach Hause kann nicht anlegen, weil der Leuchtturm nicht leuchtet. Und morgen hat Oma Gerda Geburtstag!'],
    ['Erzähler', [PIPER_CAST.narr, CAST.narr, CB('mls-3797', { exaggeration: 0.4 }), CB('mls-1474', { exaggeration: 0.4 })],
      'Quietschhausen. Eine kleine, bunte Insel irgendwo zwischen Nirgendwo und Gar-nicht-so-weit-weg.'],
    ['Olga', [PIPER_CAST.olga, CAST.olga, CB('mls-2314', { exaggeration: 0.7, cfg: 0.4, semis: -1 }), CB('kerstin', { exaggeration: 0.8, cfg: 0.4, semis: -2 })],
      'Willkommen im Schiefen Kraken, Schätzchen! Ich bin Olga. Acht Arme, null Geduld.'],
    ['Günther', [PIPER_CAST.guenther, CAST.guenther, CB('mls-143', { exaggeration: 0.9, cfg: 0.4, semis: 4, tempo: 1.1 })],
      'Was glotzt du so? Noch nie ne Möwe gesehen? Ich will Pommes! Goldgelb. Knusprig. Mit Salz.'],
    ['Lamar (traurig)', [PIPER_CAST.lama, CAST.lama, CB('thorsten-drunk', { exaggeration: 0.5, semis: -2 })],
      'Seufz. Ich bin Lamar. Das Lama. Das traurigste Lama der Welt.'],
    ['Lamar (glücklich)', [PIPER_CAST.lamaHappy, CB('thorsten-amused', { exaggeration: 0.9, cfg: 0.4, semis: -2 })],
      'Du... du lachst? Jemand lacht über meinen Witz! Nach elf Jahren!'],
    ['Klaus (Krabbe)', [PIPER_CAST.krabbe, CAST.krabbe, CB('mls-13626', { exaggeration: 0.3, tempo: 0.95 })],
      'Schnipp schnapp, Wärter weg. Schnipp schnapp, Lampe Dreck. Ich reime nicht freiwillig.'],
    ['Glühwürmchen', [PIPER_CAST.gw, CAST.gw, CB('mls-11870', { exaggeration: 0.7, cfg: 0.4, semis: 3, chorus: 5 }), CB('kerstin', { exaggeration: 0.7, cfg: 0.4, semis: 3, chorus: 5 })],
      'Bsss! Wir sind die Glühwürmchen-Gang! Wir leuchten nur für Leute mit Stil. Oder mit Gurkenwasser.'],
    ['Tukan', [PIPER_CAST.tukan, CB('mls-8294', { exaggeration: 0.9, cfg: 0.4, semis: 3, tempo: 1.08 }), CB('thorsten-surprised', { exaggeration: 1.0, cfg: 0.4, semis: 4 })],
      'Kraah! Mein Schnabel ist größer als dein Selbstbewusstsein!'],
  ];
  const jobs = [];
  S.forEach(([, casts, text], i) => casts.forEach((c, j) => jobs.push({ key: voiceKey(String(i), text), text, c, out: path.join(SAMPLES, `s${i}_${j}.mp3`) })));
  await render(jobs);
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Stimmproben</title>${STYLE}
<h1>Bruno Banane – Stimmproben</h1><p>A = bisherige Piper-Stimme, B = Chatterbox-Vorschlag, C/D = Alternativen.</p>
${S.map(([name, casts, text], i) => `<section><h2>${name}</h2><p>„${text}“</p>${casts.map((c, j) => `<div class="v"><b>${'ABCD'[j]}</b><audio controls preload="none" src="s${i}_${j}.mp3"></audio><small>${describe(c)}</small></div>`).join('')}</section>`).join('')}`;
  fs.writeFileSync(path.join(SAMPLES, 'index.html'), html);
  console.log('Hörproben:', path.join(SAMPLES, 'index.html'));
}

// ---------- Lauterkennung ----------
// Vergleicht die erwartete Lautschrift (eSpeak) mit dem, was wav2vec2 tatsächlich hört
const IPA_LIMIT = 0.45, RATIO_LIMIT = 1.3;
async function phonemize(texts) {
  const out = await run(path.join(PIPER_DIR, 'piper/piper_phonemize'), ['-l', 'de', '--espeak-data', path.join(PIPER_DIR, 'piper/espeak-ng-data')],
    texts.map(t => t.replace(/\n/g, ' ')).join('\n') + '\n', { LD_LIBRARY_PATH: path.join(PIPER_DIR, 'piper') });
  const rows = out.trim().split('\n').map(l => JSON.parse(l).phonemes.join(''));
  if (rows.length !== texts.length) throw new Error('Lautschrift: Zeilenzahl passt nicht');
  return rows;
}
async function check(lines, only, { tail = false, quiet = false } = {}) {
  const items = [...lines].filter(([k]) => !only || only.includes(k)).map(([k, l]) => ({ k, l, c: castFor(l.who, l.text) }));
  const expected = await phonemize(items.map(i => stripTags(spoken(i.l.text, i.c)) || '-'));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bruno-check-'));
  const file = path.join(tmp, 'jobs.json');
  fs.writeFileSync(file, JSON.stringify(items.map((i, n) => ({ key: i.k, file: path.join(OUT, i.k + '.mp3'), expected: expected[n], tail }))));
  const rep = fs.existsSync(REPORT) ? JSON.parse(fs.readFileSync(REPORT, 'utf8')) : {};
  const cuts = [];
  let done = 0;
  await new Promise((res, rej) => {
    const p = spawn(CHATTERBOX_PY, [path.join(__dirname, 'check_voices.py'), file], { stdio: ['ignore', 'pipe', 'pipe'] });
    let err = '';
    p.stderr.on('data', d => { err = (err + d).slice(-4000); });
    readline.createInterface({ input: p.stdout }).on('line', l => {
      let r; try { r = JSON.parse(l); } catch (e) { return; }
      const ln = lines.get(r.key), sound = /⟦/.test(spoken(ln.text, castFor(ln.who, ln.text)));
      // Geräusche und Chor erhöhen die gehörte Lautzahl – dort zählt nur die Abweichung
      if (r.cut) cuts.push({ key: r.key, cut: r.cut, tail: r.tail });
      rep[r.key] = { ...(rep[r.key] || {}), heard: r.heard, ipa: r.dist, ratio: r.ratio,
        ipaFlag: r.dist > IPA_LIMIT || (!sound && ln.who !== 'gw' && r.ratio > RATIO_LIMIT) };
      if (++done % 20 === 0) process.stdout.write(`\r  Lauterkennung ${done}/${items.length}`);
    });
    p.on('close', code => { process.stdout.write('\n'); code === 0 ? res() : rej(new Error('Prüfung fehlgeschlagen:\n' + err)); });
  });
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.writeFileSync(REPORT, JSON.stringify(rep, null, 1));
  if (quiet) return cuts;
  const bad = items.filter(i => rep[i.k] && rep[i.k].ipaFlag).sort((a, b) => rep[b.k].ipa - rep[a.k].ipa);
  console.log(`${bad.length} von ${items.length} Sätzen auffällig (Abweichung > ${IPA_LIMIT} oder Länge > ${RATIO_LIMIT}):`);
  for (const i of bad) console.log(`  ${rep[i.k].ipa.toFixed(2)} ×${rep[i.k].ratio} ${i.k} ${i.l.who.padEnd(8)} ${i.l.text}`);
  review(lines);
  return cuts;
}

// Angehängte Wortschnipsel in fertigen Dateien abschneiden
async function trim(lines) {
  const keys = [...lines].filter(([, l]) => {
    const c = castFor(l.who, l.text), segs = segments(spoken(l.text, c));
    return c.engine === 'chatterbox' && l.who !== 'gw' && segs.length && !segs[segs.length - 1].tag;
  }).map(([k]) => k);
  console.log(`${keys.length} Sätze werden auf Schnipsel am Ende geprüft`);
  const cuts = await check(lines, keys, { tail: true, quiet: true });
  if (process.argv.includes('--dry')) { for (const c of cuts) { const l = lines.get(c.key); console.log(`  (✂) ${c.key} ${l.who.padEnd(8)} „${l.text}“ ab ${c.cut}s: ${c.tail}`); } console.log(`${cuts.length} Schnitte (Trockenlauf)`); return cuts; }
  for (const c of cuts) {
    const f = path.join(OUT, c.key + '.mp3'), tmp = f + '.tmp.mp3';
    await run('ffmpeg', ['-v', 'error', '-y', '-i', f, '-af', `atrim=end=${c.cut},afade=t=out:st=${Math.max(0, c.cut - 0.04).toFixed(2)}:d=0.04`, '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '40k', tmp]);
    fs.renameSync(tmp, f);
    const l = lines.get(c.key);
    console.log(`  ✂ ${c.key} ${l.who.padEnd(8)} „${l.text}“  – abgeschnitten ab ${c.cut}s, Schnipsel: ${c.tail}`);
  }
  console.log(`${cuts.length} Schnipsel abgeschnitten`);
  if (cuts.length) await check(lines, cuts.map(c => c.key));
}

// ---------- Prüfseite ----------
function review(lines) {
  fs.mkdirSync(SAMPLES, { recursive: true });
  const rep = fs.existsSync(REPORT) ? JSON.parse(fs.readFileSync(REPORT, 'utf8')) : {};
  const rows = [...lines].map(([k, l]) => ({ k, ...l, r: rep[k] || {}, sound: /⟦/.test(spoken(l.text, castFor(l.who, l.text))) }))
    .sort((a, b) => (b.r.ipa || 0) - (a.r.ipa || 0) || (b.r.flag ? 1 : 0) - (a.r.flag ? 1 : 0) || a.who.localeCompare(b.who));
  const bad = r => r.r.flag || r.r.ipaFlag;
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Alle Sätze</title>${STYLE}
<h1>Alle ${rows.length} Sätze</h1><p>Sortiert nach Abweichung der Lauterkennung (oben = verdächtig). Rot = auffällige Länge oder Aussprache.</p>
<h2>Sätze mit Geräuschen (Seufzen, Lachen, Kauen …)</h2>
${rows.filter(r => r.sound).map(r => `<div class="v${bad(r) ? ' flag' : ''}"><audio controls preload="none" src="../voice/${r.k}.mp3"></audio><small>${r.who}</small><span>${r.text.replace(/</g, '&lt;')}</span></div>`).join('\n')}
<h2>Alle Sätze</h2>
${rows.map(r => `<div class="v${bad(r) ? ' flag' : ''}"><audio controls preload="none" src="../voice/${r.k}.mp3"></audio><small>${r.who}${r.r.ipa != null ? ` · Abw. ${r.r.ipa}` : ''}${r.r.cps ? ` · ${r.r.cps} Z/s` : ''}</small><span>${r.text.replace(/</g, '&lt;')}${bad(r) && r.r.heard ? `<br><small>gehört: ${r.r.heard}</small>` : ''}</span></div>`).join('\n')}`;
  fs.writeFileSync(path.join(SAMPLES, 'review.html'), html);
  console.log('Prüfseite:', path.join(SAMPLES, 'review.html'), `(${rows.filter(bad).length} markiert)`);
}

// ---------- Hauptprogramm ----------
if (require.main === module) (async () => {
  const argv = process.argv.slice(2);
  if (argv.includes('--samples')) return samples();
  if (argv.includes('--ipa')) {
    const words = argv.filter(a => !a.startsWith('--'));
    const out = await run(path.join(PIPER_DIR, 'piper/piper_phonemize'), ['-l', 'de', '--espeak-data', path.join(PIPER_DIR, 'piper/espeak-ng-data')],
      words.map(w => speakable(w)).join('\n') + '\n', { LD_LIBRARY_PATH: path.join(PIPER_DIR, 'piper') });
    out.trim().split('\n').forEach((l, i) => console.log(words[i].padEnd(24), speakable(words[i]).padEnd(28), JSON.parse(l).phonemes.join('')));
    return;
  }
  const lines = collectLines();
  if (argv.includes('--list')) { for (const [k, l] of lines) console.log(k, l.who.padEnd(8), l.text); console.log(lines.size, 'Sätze'); return; }
  if (argv.includes('--review')) return review(lines);
  if (argv.includes('--check')) return check(lines);
  if (argv.includes('--trim')) return trim(lines);
  if (argv.includes('--redo')) {
    const rep = fs.existsSync(REPORT) ? JSON.parse(fs.readFileSync(REPORT, 'utf8')) : {};
    const keys = [...lines.keys()].filter(k => rep[k] && rep[k].ipaFlag && castFor(lines.get(k).who, lines.get(k).text).engine === 'chatterbox');
    console.log(`${keys.length} auffällige Sätze werden neu vertont (bester von bis zu 5 Versuchen)`);
    await render(keys.map(k => ({ key: k, text: lines.get(k).text, c: castFor(lines.get(k).who, lines.get(k).text), out: path.join(OUT, k + '.mp3') })), { verify: true });
    return check(lines, keys);
  }
  fs.mkdirSync(OUT, { recursive: true });
  // Merkt sich pro Datei gesprochenen Text + Stimme; Änderungen werden neu vertont
  const MANIFEST = path.join(__dirname, 'voice-manifest.json');
  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
  const sig = l => { const c = castFor(l.who, l.text); return crypto.createHash('sha1').update(spoken(l.text, c) + JSON.stringify(c)).digest('hex').slice(0, 12); };
  const force = argv.includes('--force');
  const todo = [...lines].filter(([k, l]) => force || manifest[k] !== sig(l) || !fs.existsSync(path.join(OUT, k + '.mp3')))
    .map(([k, l]) => ({ key: k, text: l.text, c: castFor(l.who, l.text), out: path.join(OUT, k + '.mp3'), l }));
  console.log(`${lines.size} Sätze, ${todo.length} zu erzeugen`);
  const results = await render(todo, { verify: true });
  for (const j of todo) manifest[j.key] = sig(j.l);
  for (const k of Object.keys(manifest)) if (!lines.has(k)) delete manifest[k];
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest));
  const rep = fs.existsSync(REPORT) ? JSON.parse(fs.readFileSync(REPORT, 'utf8')) : {};
  for (const j of todo) {
    const rs = Object.entries(results).filter(([k]) => k === j.key || k.startsWith(j.key + ':')).map(([, r]) => r);
    const speech = rs.filter(r => r.cps != null);
    if (rs.length) rep[j.key] = { dur: +rs.reduce((a, r) => a + r.dur, 0).toFixed(2), cps: speech.length ? speech[0].cps : null, tries: Math.max(...rs.map(r => r.tries)), flag: rs.some(r => r.flag) };
    else delete rep[j.key];
  }
  for (const k of Object.keys(rep)) if (!lines.has(k)) delete rep[k];
  fs.writeFileSync(REPORT, JSON.stringify(rep, null, 1));
  // Veraltete Dateien entfernen, Index schreiben
  for (const f of fs.readdirSync(OUT)) if (f.endsWith('.mp3') && !lines.has(f.slice(0, -4))) fs.unlinkSync(path.join(OUT, f));
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify([...lines.keys()].sort()));
  const bytes = fs.readdirSync(OUT).reduce((s, f) => s + fs.statSync(path.join(OUT, f)).size, 0);
  const flagged = Object.entries(rep).filter(([, r]) => r.flag);
  console.log(`Fertig: ${lines.size} Dateien, ${(bytes / 1048576).toFixed(1)} MB, ${flagged.length} auffällig`);
  for (const [k] of flagged) console.log('  ⚠', k, lines.get(k).who, lines.get(k).text);
  if (todo.length) await check(lines, todo.map(j => j.key)); else review(lines);
})().catch(e => { console.error(e); process.exit(1); });
