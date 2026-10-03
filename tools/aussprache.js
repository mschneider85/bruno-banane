/* Aussprache-Korrekturen für Piper/eSpeak.
 * Ändert nur den gesprochenen Text, nicht die Untertitel.
 * Prüfen, wie eSpeak ein Wort liest:  node tools/voices.js --ipa "Wort"
 */
'use strict';

// [Suchmuster, Ersatz] – in dieser Reihenfolge angewendet
const LEXIKON = [
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
  [/\bPsst!/g, 'Kleiner Tipp:'],
  [/\bBsss\b/g, 'Summ'],
  [/\bMhm\b/g, 'Aha'],
  [/\bMm+pf\b/g, 'Mampf'],
  [/\bMm+h\b/g, 'Mampf'],
  [/\bPOO+MMEE+S\b/g, 'Pooommes'],
  [/\bPARTYY+\b/g, 'Paaarty'],
  [/\bBWAHA(HA)+\b/g, 'Buahahaha'],
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

function aussprache(text) {
  let t = text.replace(/\b(1[1-9]\d\d)\b/g, (m, y) => jahr(+y));
  for (const [re, rep] of LEXIKON) t = t.replace(re, rep);
  // GROSSGESCHRIEBENES normal schreiben, sonst liest eSpeak es teils als Abkürzung
  t = t.replace(/(?<!\p{L})\p{Lu}{2,}(?!\p{L})/gu, w => w[0] + w.slice(1).toLowerCase());
  return t;
}

module.exports = { aussprache, LEXIKON };
