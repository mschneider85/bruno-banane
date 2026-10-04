/* Aussprache-Korrekturen für die Sprachausgabe.
 * Ändert nur den gesprochenen Text, nicht die Untertitel.
 * LEXIKON gilt für alle Engines, NUR_PIPER nur für Piper (eSpeak-Umschreibungen),
 * NUR_CHATTERBOX nur für Chatterbox (per Lauterkennung ermittelt: je Wort mehrere
 * Schreibweisen vertont und die mit der richtigen Aussprache gewählt).
 * Prüfen, wie eSpeak ein Wort liest:  node tools/voices.js --ipa "Wort"
 */
'use strict';

// [Suchmuster, Ersatz] – in dieser Reihenfolge angewendet
const NUR_PIPER = [
  // „ng“ in Angel wird sonst als „An-gel“ gelesen
  [/\b([Kk]lebe-)?([Aa])ngel(n?)\b/g, (m, k, a, n) => (k || '') + a + 'ngl' + n],
  // Falsch betonte Zusammensetzungen
  [/\bKneipentisch/g, 'Kneipen-Tisch'],
  [/\bTintenfisch/g, 'Tinten-Fisch'],
  [/\bKaugummi/g, 'Kau-Gummi'],
  [/\bGummiente/g, 'Gummi-Ente'],
  [/\bFußspuren/g, 'Fuß-Spuren'],
  [/\bFlaschenregal/g, 'Flaschen-Regal'],
  [/\bRentenversicherung/g, 'Renten-Versicherung'],
  [/\bFrittierfett/g, 'Frittier-Fett'],
  [/\b([Nn])irgendwo\b/g, '$1irgend-wo'],
  [/\b([Ii])rgendwo\b/g, '$1rgend-wo'],
  [/\bumgebracht\b/g, 'ummgebracht'],
  [/\bAbenteurer/g, 'Abentoyrer'],
  [/\bBANANENTOLLE\b|\bBananentolle\b/g, 'Bananen-Tolle'],
  // Fremdwörter (englisch/französisch ausgesprochen)
  [/\bCharme\b/g, 'Scharm'],
  [/\bJukebox/g, 'Dschukbox'],
  [/\b([Cc])ool(e|er|es|en)?\b/g, (m, c, e) => (c === 'C' ? 'Kuhl' : 'kuhl') + (e || '')],
  [/\bMallorca\b/g, 'Majorka'],
  [/\b([Oo])kay\b/g, '$1-keh'],
  [/\bWow\b/g, 'Wau'],
  [/\bGullywasser/g, 'Gulli-Wasser'],
  [/\bGelee\b/g, 'Sche-leh'],
  [/\bVideospiel/g, 'Video-Spiel'],
  [/\bSternekoch/g, 'Sterne-Koch'],
  [/\bSarkasmus\b/g, 'Sar-kasmus'],
  // Lautmalerei, die eSpeak sonst buchstabiert
  [/\bMhm\b/g, 'Aha'],
];

const NUR_CHATTERBOX = [
  [/\bCharme\b/g, 'Scharmm'],
  [/\bJukebox/g, 'Dschuhkbox'],
  [/\bMallorca\b/g, 'Majorka'],
  [/\bGelee\b/g, 'Schelee'],
  [/\bShow\b/g, 'Schoh'],
  [/\bJob\b/g, 'Dschopp'],
  [/\bDeal\b/g, 'Diel'],
  [/\bDisco/g, 'Disko'],
  [/\bParty\b/g, 'Paarti'],
  [/\bRestaurant/g, 'Resto-rang'],
  [/\bCousine\b/g, 'Kusine'],
  [/\bCiao\b/g, 'Tschau'],
  [/\bTouristen\b/g, 'Turisten'],
  [/\bLimo\b/g, 'Limmo'],
];

const LEXIKON = [
  // englisch/spitz ausgesprochen (mit wav2vec2-Lauterkennung geprüft)
  [/Glühwürmchen-Gang\b/g, 'Glühwürmchen-Gäng'],
  [/\bStil\b/g, 'S-Til'],
  [/\bPOO+MMEE+S\b/g, 'Pooommes'],
  [/\bPARTYY+\b/g, 'Paaarty'],
  [/\b[Kk]nusprig\b/g, 'Knus-Prig'],
  // Abkürzungen
  [/\bca\.\s*/g, 'zirka '],
  [/\bMS\b/g, 'Em Es'],
];

const EINER = ['', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun'];
const ZEHNER = ['', 'zehn', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];
const TEENS = ['zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
function bis99(n) {
  if (n === 0) return '';
  if (n === 1) return 'eins';
  if (n < 10) return EINER[n];
  if (n < 20) return TEENS[n - 10];
  const e = n % 10, z = Math.floor(n / 10);
  return (e ? EINER[e] + 'und' : '') + ZEHNER[z];
}
// 1987 → neunzehnhundertsiebenundachtzig (Jahreszahlen 1100–1999)
function jahr(y) {
  return bis99(Math.floor(y / 100)) + 'hundert' + bis99(y % 100);
}
// 432 → vierhundertzweiunddreißig, 3000 → dreitausend (Chatterbox liest Ziffern unzuverlässig)
function zahl(n) {
  if (n === 0) return 'null';
  if (n >= 1000000) return String(n);
  const tsd = Math.floor(n / 1000), h = Math.floor(n % 1000 / 100), r = n % 100;
  return (tsd ? (tsd === 1 ? 'ein' : zahl(tsd)) + 'tausend' : '')
    + (h ? (h === 1 ? 'ein' : EINER[h]) + 'hundert' : '')
    + (r === 1 && (tsd || h) ? 'eins' : bis99(r));
}

// Geräusche statt vorgelesener Lautmalerei: werden zu Marken ⟦…⟧, die tools/voices.js
// als echte Laute erzeugt (Chatterbox Turbo: sigh, laugh, chuckle, gasp, groan, shush;
// Klangsynthese: chew = Kauen, buzz = Summen)
const GERAEUSCHE = [
  [/\*seufz\*/gi, 'sigh'],
  [/\*schmoll\*/gi, 'groan'],
  [/\*keuch\*/gi, 'gasp'],
  [/\*HÜPF!\*/g, 'groan'],
  [/\*hüpf\*/gi, 'gasp'],
  [/\*quietsch!?\*/gi, 'chuckle'],
  [/\*knirsch\*/gi, 'chew'],
  [/\bMm+(h|pf)\b/g, 'chew'],
  [/\b[Mm]ampf\b/g, 'chew'],
  [/\bBWAHA(HA)+\b/g, 'laugh laugh laugh'],
  [/\bHA(HA){2,}\b/g, 'laugh laugh'],
  [/\bHAHA\b/g, 'laugh'],
  [/\bHehe\b/g, 'chuckle'],
  [/\bPsst!?/g, 'shush'],
  [/\bBsss\b/g, 'buzz'],
];

// Buchstabiertes (H-I-L-F-E) mit deutschen Buchstabennamen vorlesen
const BUCHSTABEN = { A: 'Ah', B: 'Beh', C: 'Zeh', D: 'Deh', E: 'Eh', F: 'Eff', G: 'Geh', H: 'Hah', I: 'Ih', J: 'Jott', K: 'Kah', L: 'Ell', M: 'Emm',
  N: 'Enn', O: 'Oh', P: 'Peh', Q: 'Kuh', R: 'Err', S: 'Ess', T: 'Teh', U: 'Uh', V: 'Fau', W: 'Weh', X: 'Iks', Y: 'Üpsilon', Z: 'Zett',
  Ä: 'Äh', Ö: 'Öh', Ü: 'Üh' };
const buchstabiert = t => t.replace(/(?<!\p{L})(?:\p{Lu}-){2,}\p{Lu}(?!\p{L})/gu, m => m.split('-').map(b => BUCHSTABEN[b] || b).join(', '));

function aussprache(text, engine = 'piper') {
  text = buchstabiert(text);
  for (const [re, tags] of GERAEUSCHE) text = text.replace(re, ' ' + tags.split(' ').map(t => `⟦${t}⟧`).join(' ') + ' ');
  let t = text.replace(/\b(1[1-9]\d\d)\b/g, (m, y) => jahr(+y)).replace(/\b\d+\b/g, n => zahl(+n));
  if (engine === 'piper') for (const [re, rep] of NUR_PIPER) t = t.replace(re, rep);
  if (engine === 'chatterbox') for (const [re, rep] of NUR_CHATTERBOX) t = t.replace(re, rep);
  for (const [re, rep] of LEXIKON) t = t.replace(re, rep);
  // GROSSGESCHRIEBENES normal schreiben, sonst liest eSpeak es teils als Abkürzung
  t = t.replace(/(?<!\p{L})\p{Lu}{2,}(?!\p{L})/gu, w => w[0] + w.slice(1).toLowerCase());
  return t;
}

module.exports = { aussprache, LEXIKON, NUR_PIPER, NUR_CHATTERBOX, GERAEUSCHE };
