#!/usr/bin/env node
/* Erzeugt die Sprachausgabe für alle Spieltexte mit Piper TTS (lokal, kostenlos).
 *
 *   node tools/voices.js            fehlende Sätze erzeugen
 *   node tools/voices.js --force    alle Sätze neu erzeugen
 *   node tools/voices.js --samples  Hörproben nach voice-samples/ schreiben
 *   node tools/voices.js --list     nur die gefundenen Sätze ausgeben
 *   node tools/voices.js --ipa "Text"  Aussprache (Lautschrift) prüfen, siehe tools/aussprache.js
 *
 * Voraussetzungen: Piper unter $PIPER_DIR (Standard ~/.local/piper) mit
 * ./piper/piper und den Stimmen in ./voices/, außerdem ffmpeg mit libmp3lame.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const acorn = require('acorn');
const walk = require('acorn-walk');
const crypto = require('crypto');
const { aussprache } = require('./aussprache');

const ROOT = path.join(__dirname, '..');
const PIPER_DIR = process.env.PIPER_DIR || path.join(os.homedir(), '.local/piper');
const PIPER = path.join(PIPER_DIR, 'piper/piper');
const VOICES = path.join(PIPER_DIR, 'voices');
const OUT = path.join(ROOT, 'voice');
module.exports = { collectLines: () => collectLines(), speakable: t => speakable(t), PIPER_DIR };

// ---------- Besetzung ----------
// model: Piper-Stimme, speaker: Sprecher-ID (Mehrsprecher-Modelle),
// length: Sprechtempo (>1 = langsamer), semis: Tonhöhe in Halbtönen, chorus: zweite Stimme (Halbtöne)
const MLS = 'de_DE-mls-medium', THO = 'de_DE-thorsten-high', EMO = 'de_DE-thorsten_emotional-medium', KER = 'de_DE-kerstin-low';
const EMO_ID = { amused: 0, angry: 1, disgusted: 2, drunk: 3, neutral: 4, sleepy: 5, surprised: 6, whisper: 7 };
const CAST = {
  hero:     { model: THO, length: 0.9, semis: 1.5 },
  narr:     { model: KER, length: 1.05, semis: 0 },
  olga:     { model: KER, length: 1.0, semis: -3 },
  guenther: { model: EMO, speaker: EMO_ID.angry, length: 0.82, semis: 6 },
  lama:     { model: EMO, speaker: EMO_ID.sleepy, length: 1.2, semis: -3 },
  lamaHappy:{ model: EMO, speaker: EMO_ID.amused, length: 1.0, semis: -2 },
  krabbe:   { model: EMO, speaker: EMO_ID.whisper, length: 1.1, semis: 0 },
  gw:       { model: KER, length: 0.85, semis: 7, chorus: 10 },
  tukan:    { model: MLS, speaker: 104, length: 0.8, semis: 5 },
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
function speakable(text) {
  return aussprache(text)
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
  if (who === 'lama' && LAMA_HAPPY.some(w => text.includes(w))) return CAST.lamaHappy;
  return CAST[who] || CAST.hero;
}

// ---------- Audio erzeugen ----------
function run(cmd, args, input) {
  return new Promise((res, rej) => {
    const p = execFile(cmd, args, { maxBuffer: 1 << 26 }, (err, stdout, stderr) => err ? rej(new Error(stderr || err.message)) : res(stdout));
    if (input != null) { p.stdin.write(input); p.stdin.end(); }
  });
}
const sampleRates = {};
function sampleRate(model) {
  if (!sampleRates[model]) sampleRates[model] = JSON.parse(fs.readFileSync(path.join(VOICES, model + '.onnx.json'), 'utf8')).audio.sample_rate;
  return sampleRates[model];
}
function shift(semis, sr) {
  const p = Math.pow(2, semis / 12);
  return `asetrate=${Math.round(sr * p)},aresample=24000,atempo=${(1 / p).toFixed(4)}`;
}
async function synth(text, c, outFile) {
  const tmp = outFile + '.wav';
  const args = ['-m', path.join(VOICES, c.model + '.onnx'), '-f', tmp, '-q', '--length_scale', String(c.length), '--sentence_silence', '0.15'];
  if (c.speaker != null) args.push('-s', String(c.speaker));
  await run(PIPER, args, speakable(text) + '\n');
  const sr = sampleRate(c.model);
  const tail = 'silenceremove=start_periods=1:start_threshold=-45dB,loudnorm=I=-16:TP=-1.5';
  const filter = c.chorus != null
    ? `[0]asplit[a][b];[a]${shift(c.semis, sr)}[a1];[b]${shift(c.chorus, sr)},adelay=35,volume=0.7[b1];[a1][b1]amix=inputs=2,volume=1.8,${tail}`
    : `[0]${shift(c.semis, sr)},${tail}`;
  await run('ffmpeg', ['-v', 'error', '-y', '-i', tmp, '-filter_complex', filter, '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '40k', outFile]);
  fs.unlinkSync(tmp);
}
async function pool(items, n, fn) {
  let i = 0, done = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) {
      const it = items[i++];
      await fn(it);
      if (++done % 20 === 0 || done === items.length) process.stdout.write(`\r  ${done}/${items.length}`);
    }
  }));
  process.stdout.write('\n');
}

// ---------- Hörproben ----------
async function samples() {
  const dir = path.join(ROOT, 'voice-samples');
  fs.mkdirSync(dir, { recursive: true });
  const S = [
    ['Bruno', 'hero', [CAST.hero, { model: MLS, speaker: 52, length: 0.9, semis: 1 }], 'Ich, Bruno Banane, werde diesen Leuchtturm wieder zum Leuchten bringen! Wie schwer kann das schon sein?'],
    ['Erzähler', 'narr', [CAST.narr, { model: KER, length: 1.05, semis: 0 }], 'Quietschhausen. Eine kleine, bunte Insel irgendwo zwischen Nirgendwo und Gar-nicht-so-weit-weg.'],
    ['Olga', 'olga', [CAST.olga, { model: MLS, speaker: 12, length: 1.0, semis: -2 }, { model: KER, length: 1.0, semis: -3 }], 'Willkommen im Schiefen Kraken, Schätzchen! Ich bin Olga. Acht Arme, null Geduld.'],
    ['Günther', 'guenther', [CAST.guenther, { model: EMO, speaker: EMO_ID.surprised, length: 0.85, semis: 7 }], 'Was glotzt du so? Noch nie ne Möwe gesehen? Ich will POMMES!'],
    ['Lamar (traurig)', 'lama', [CAST.lama, { model: EMO, speaker: EMO_ID.drunk, length: 1.15, semis: -3 }], 'Seufz. Ich bin Lamar. Das Lama. Das traurigste Lama der Welt.'],
    ['Lamar (glücklich)', 'lama', [CAST.lamaHappy], 'Du lachst? Jemand lacht über meinen Witz! Nach elf Jahren!'],
    ['Klaus (Krabbe)', 'krabbe', [CAST.krabbe, { model: EMO, speaker: EMO_ID.whisper, length: 1.1, semis: 0 }], 'Schnipp schnapp, Wärter weg. Schnipp schnapp, Lampe Dreck.'],
    ['Glühwürmchen', 'gw', [CAST.gw, { model: KER, length: 0.85, semis: 8 }], 'Bsss! Wir sind die Glühwürmchen-Gang! Gurkenwasser? Party!'],
    ['Tukan', 'tukan', [CAST.tukan], 'Kraah! Ich bin nur Deko! Beachte mich nicht!'],
  ];
  const jobs = [];
  S.forEach(([, , casts, text], i) => casts.forEach((c, j) => jobs.push({ text, c, file: `s${i}_${j}.mp3` })));
  await pool(jobs, 6, j => synth(j.text, j.c, path.join(dir, j.file)));
  const desc = c => `${c.model.replace('de_DE-', '')}${c.speaker != null ? ' #' + c.speaker : ''}, Tempo ${c.length}, ${c.semis > 0 ? '+' : ''}${c.semis} HT${c.chorus != null ? ', Chor' : ''}`;
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Stimmproben</title>
<style>body{font-family:system-ui,sans-serif;background:#2a1748;color:#fff;max-width:760px;margin:24px auto;padding:0 16px}h1{color:#ffd60a}section{background:#ffffff14;border-radius:14px;padding:12px 16px;margin:12px 0}h2{margin:0 0 4px;color:#ff8ae6}p{margin:0 0 8px;color:#cfc3ff;font-style:italic}.v{display:flex;align-items:center;gap:12px;margin:6px 0;flex-wrap:wrap}.v b{color:#7ff0ff;min-width:2em}.v small{color:#bbb}</style>
<h1>Bruno Banane – Stimmproben</h1><p>Variante A ist der aktuelle Vorschlag.</p>
${S.map(([name, , casts, text], i) => `<section><h2>${name}</h2><p>„${text}“</p>${casts.map((c, j) => `<div class="v"><b>${'ABC'[j]}</b><audio controls preload="none" src="s${i}_${j}.mp3"></audio><small>${desc(c)}</small></div>`).join('')}</section>`).join('')}`;
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log('Hörproben:', path.join(dir, 'index.html'));
}

// ---------- Hauptprogramm ----------
if (require.main === module) (async () => {
  const argv = process.argv.slice(2);
  if (argv.includes('--samples')) return samples();
  if (argv.includes('--ipa')) {
    const words = argv.filter(a => !a.startsWith('--'));
    const out = await new Promise((res, rej) => {
      const p = execFile(path.join(PIPER_DIR, 'piper/piper_phonemize'), ['-l', 'de', '--espeak-data', path.join(PIPER_DIR, 'piper/espeak-ng-data')], { env: { LD_LIBRARY_PATH: path.join(PIPER_DIR, 'piper') } }, (e, o) => e ? rej(e) : res(o));
      p.stdin.end(words.map(speakable).join('\n') + '\n');
    });
    out.trim().split('\n').forEach((l, i) => console.log(words[i].padEnd(24), speakable(words[i]).padEnd(28), JSON.parse(l).phonemes.join('')));
    return;
  }
  const lines = collectLines();
  if (argv.includes('--list')) { for (const [k, l] of lines) console.log(k, l.who.padEnd(8), l.text); console.log(lines.size, 'Sätze'); return; }
  fs.mkdirSync(OUT, { recursive: true });
  // Merkt sich pro Datei gesprochenen Text + Stimme; Änderungen werden neu vertont
  const MANIFEST = path.join(__dirname, 'voice-manifest.json');
  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
  const sig = l => crypto.createHash('sha1').update(speakable(l.text) + JSON.stringify(castFor(l.who, l.text))).digest('hex').slice(0, 12);
  const force = argv.includes('--force');
  const todo = [...lines].filter(([k, l]) => force || manifest[k] !== sig(l) || !fs.existsSync(path.join(OUT, k + '.mp3')));
  console.log(`${lines.size} Sätze, ${todo.length} zu erzeugen`);
  await pool(todo, Math.max(2, os.cpus().length - 2), async ([k, l]) => {
    await synth(l.text, castFor(l.who, l.text), path.join(OUT, k + '.mp3'));
    manifest[k] = sig(l);
  });
  for (const k of Object.keys(manifest)) if (!lines.has(k)) delete manifest[k];
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 0));
  // Veraltete Dateien entfernen, Index schreiben
  for (const f of fs.readdirSync(OUT)) if (f.endsWith('.mp3') && !lines.has(f.slice(0, -4))) fs.unlinkSync(path.join(OUT, f));
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify([...lines.keys()].sort()));
  const bytes = fs.readdirSync(OUT).reduce((s, f) => s + fs.statSync(path.join(OUT, f)).size, 0);
  console.log(`Fertig: ${lines.size} Dateien, ${(bytes / 1048576).toFixed(1)} MB`);
})().catch(e => { console.error(e); process.exit(1); });
