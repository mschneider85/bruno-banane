'use strict';
/* =====================================================================
   Bruno Banane und das Leuchtturm-Fiasko – Inhalte
   Grafik (SVG), Szenen, Items, Kombinationen, Dialoge, Musik
   ===================================================================== */

// ---------- Grafik-Helfer ----------
function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
function starPath(n, R, r) {
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const a = Math.PI * i / n - Math.PI / 2, rad = i % 2 ? r : R;
    d += (i ? 'L' : 'M') + (Math.cos(a) * rad).toFixed(1) + ' ' + (Math.sin(a) * rad).toFixed(1);
  }
  return d + 'Z';
}
const cloud = (x, y, s) => `<g class="cloud"><g transform="translate(${x} ${y}) scale(${s})" fill="#ffe3f6" opacity=".92"><circle cx="0" cy="10" r="30"/><circle cx="36" cy="-6" r="40"/><circle cx="78" cy="8" r="30"/><rect x="-10" y="8" width="100" height="32" rx="16"/></g></g>`;
const arrow = (x, y, dir) => `<path class="arrow" d="M${x} ${y - 22} l${dir * 22} 22 l${-dir * 22} 22" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 3px 0 #2a1748)"/>`;
const hit = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="transparent"/>`;
const leaf = (x, y, rot, s, c) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M0 0 Q40 -34 104 0 Q40 34 0 0Z" fill="${c}" class="o2"/><path d="M6 0 H94" stroke="#0b6b4f" stroke-width="2.5"/></g>`;
const splat = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-10 -8 Q-4 -20 8 -12 Q22 -10 14 2 Q20 14 4 12 Q-8 22 -12 8 Q-24 2 -10 -8Z" fill="#fffef2" stroke="#b9ad90" stroke-width="2.5"/><circle cx="2" cy="0" r="4" fill="#d8cfb4"/><path d="M8 12 q2 12 -2 16" stroke="#fffef2" stroke-width="5" stroke-linecap="round"/></g>`;
const jar = (inner) => `<rect x="28" y="20" width="44" height="12" rx="3" fill="#ff3d6e" class="o2"/><rect x="22" y="30" width="56" height="60" rx="11" fill="#c8f6ff" fill-opacity=".75" class="o"/>${inner}<path d="M30 40 V70" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>`;

// ---------- Held: Bruno Banane (Füße bei 0,0, schaut nach rechts) ----------
const HERO_SVG = `
<ellipse cx="0" cy="0" rx="46" ry="11" fill="#000" opacity=".22"/>
<g class="leg a"><rect x="-22" y="-102" width="20" height="90" rx="9" fill="#2f5bff" class="o"/><path d="M-30 -16 h26 q16 0 18 12 v6 h-44z" fill="#2fe07a" class="o"/></g>
<g class="leg b"><rect x="2" y="-102" width="20" height="90" rx="9" fill="#4573ff" class="o"/><path d="M-6 -16 h26 q16 0 18 12 v6 h-44z" fill="#2fe07a" class="o"/></g>
<g class="upper">
  <g class="arm a"><rect x="-34" y="-168" width="18" height="72" rx="9" fill="#ffd0a6" class="o"/><rect x="-37" y="-171" width="24" height="32" rx="10" fill="url(#stripes)" class="o"/></g>
  <path d="M-34 -98 Q-40 -150 -26 -178 L30 -178 Q42 -150 36 -98Z" fill="url(#stripes)" class="o"/>
  <rect x="-37" y="-110" width="76" height="14" rx="6" fill="#8a3df0" class="o"/>
  <rect x="25" y="-108" width="10" height="10" rx="2" fill="#ffd60a"/>
  <rect x="-2" y="-196" width="16" height="22" fill="#ffd0a6" class="o"/>
  <g class="head">
    <ellipse cx="-27" cy="-214" rx="9" ry="12" fill="#ffbf8c" class="o"/>
    <circle cx="6" cy="-218" r="36" fill="#ffd0a6" class="o"/>
    <path d="M-32 -232 C-34 -272 22 -298 66 -276 C88 -266 96 -250 90 -236 C78 -252 58 -256 42 -248 C30 -258 8 -256 -4 -246 C-14 -252 -26 -246 -32 -232Z" fill="#ffe14d" class="o"/>
    <path d="M-6 -262 C20 -280 50 -278 70 -266" fill="none" stroke="#fff6a8" stroke-width="5" stroke-linecap="round"/>
    <circle cx="90" cy="-238" r="5" fill="#7a4b1f"/>
    <g class="eye"><ellipse cx="22" cy="-222" rx="10" ry="13" fill="#fff" class="o2"/><circle cx="26" cy="-220" r="5" fill="#2a1748"/><circle cx="28" cy="-223" r="1.8" fill="#fff"/></g>
    <path d="M12 -241 Q22 -247 33 -241" fill="none" class="o"/>
    <circle cx="8" cy="-198" r="7" fill="#ff8fa3" opacity=".6"/>
    <ellipse cx="45" cy="-206" rx="16" ry="12" fill="#ff9c86" class="o"/>
    <ellipse class="mouth o2" cx="28" cy="-187" rx="9" ry="4" fill="#8a1c3f"/>
  </g>
  <g class="arm b"><rect x="8" y="-168" width="18" height="72" rx="9" fill="#ffd0a6" class="o"/><rect x="5" y="-171" width="24" height="32" rx="10" fill="url(#stripes)" class="o"/><circle cx="17" cy="-96" r="10" fill="#ffd0a6" class="o"/></g>
</g>`;

// ---------- Items ----------
const ITEMS = {
  angel: {
    name: 'Angel',
    icon: `<path d="M16 86 L84 14" stroke="#2a1748" stroke-width="10" stroke-linecap="round"/><path d="M16 86 L84 14" stroke="#d98a45" stroke-width="5" stroke-linecap="round"/><circle cx="31" cy="70" r="10" fill="#ff3d6e" class="o2"/><path d="M84 14 Q92 40 86 64" fill="none" stroke="#fff" stroke-width="2.5"/><path d="M86 64 q0 12 -9 9" fill="none" stroke="#c8d0e0" stroke-width="4" stroke-linecap="round"/>`,
    look: 'Eine Angel. Ohne Köder. Der Haken ist so stumpf, damit könnte man nicht mal Pudding angeln.',
  },
  kaugummi: {
    name: 'Kaugummi',
    icon: `<path d="M22 60 Q16 36 40 34 Q50 18 68 32 Q88 34 82 58 Q80 78 54 74 Q28 82 22 60Z" fill="#ff7ac8" class="o"/><ellipse cx="44" cy="46" rx="9" ry="5" fill="#ffc6ea"/><path d="M58 60 q6 4 12 0" fill="none" class="o2"/>`,
    look: 'Ein uralter Kaugummi. Geschmacksrichtung: „Erdbeere, ca. 1994“. Klebt noch wie verrückt.',
    act: { label: '👅 Kauen', run: 'Den kau ich nicht. Ich hab auch Grenzen. Wenige, aber ich hab welche.' },
  },
  klebeangel: {
    name: 'Klebe-Angel',
    icon: `<path d="M16 86 L84 14" stroke="#2a1748" stroke-width="10" stroke-linecap="round"/><path d="M16 86 L84 14" stroke="#d98a45" stroke-width="5" stroke-linecap="round"/><circle cx="31" cy="70" r="10" fill="#ff3d6e" class="o2"/><path d="M84 14 Q92 40 86 62" fill="none" stroke="#fff" stroke-width="2.5"/><path d="M76 66 Q78 54 88 58 Q100 62 94 74 Q84 82 76 66Z" fill="#ff7ac8" class="o2"/>`,
    look: 'Eine Angel mit Kaugummi am Haken. Patent angemeldet. Patent abgelehnt.',
  },
  muenze: {
    name: 'Taler',
    icon: `<circle cx="50" cy="50" r="34" fill="#ffc83d" class="o"/><circle cx="50" cy="50" r="24" fill="none" stroke="#e09a12" stroke-width="4"/><path d="M40 38 Q38 62 58 64 Q62 62 60 58 Q46 56 46 38Z" fill="#e09a12"/><path d="M28 30 l6 6" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`,
    look: 'Ein glänzender Taler. Auf der Rückseite ist ein Lama abgebildet. Es guckt enttäuscht.',
    act: { label: '🪙 Werfen', run: 'Kopf! ...Oder Zahl. Ich hab nicht hingeschaut.' },
  },
  pommes: {
    name: 'Pommes',
    icon: `<g fill="#ffd84d" class="o2"><rect x="30" y="14" width="10" height="44" rx="3" transform="rotate(-12 35 36)"/><rect x="42" y="8" width="10" height="48" rx="3"/><rect x="54" y="12" width="10" height="46" rx="3" transform="rotate(8 59 34)"/><rect x="64" y="18" width="10" height="40" rx="3" transform="rotate(18 69 38)"/></g><path d="M22 42 L78 42 L70 90 L30 90Z" fill="#ff3d3d" class="o"/><circle cx="42" cy="60" r="3" fill="#fff"/><circle cx="58" cy="60" r="3" fill="#fff"/><path d="M40 70 Q50 80 60 70" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`,
    look: 'Eine Tüte goldene Pommes. Sie duften nach Glück und Frittierfett.',
    act: { label: '😋 Essen', run: 'Nein! Bleib stark, Bruno! Die sind für einen höheren Zweck.' },
  },
  schluessel: {
    name: 'Leuchtturm-Schlüssel',
    icon: `<circle cx="32" cy="34" r="20" fill="#ffc83d" class="o"/><circle cx="32" cy="34" r="7" fill="#2a1748"/><path d="M45 47 L82 84 M66 68 l9 -9 M75 77 l9 -9" stroke="#2a1748" stroke-width="13" stroke-linecap="round"/><path d="M45 47 L82 84 M66 68 l9 -9 M75 77 l9 -9" stroke="#ffc83d" stroke-width="6" stroke-linecap="round"/>`,
    look: 'Ein großer Messingschlüssel. „Leuchtturm“ steht drauf. Leicht angesabbert. Danke, Günther.',
  },
  gummiente: {
    name: 'Quietsche-Ente',
    icon: `<path d="M12 58 Q14 90 50 90 Q88 90 90 58 Q88 48 74 54 L58 56 Q44 62 30 56 Q16 48 12 58Z" fill="#ffd60a" class="o"/><circle cx="40" cy="38" r="19" fill="#ffd60a" class="o"/><path d="M56 40 Q74 34 76 44 Q66 52 56 48Z" fill="#ff8c1a" class="o2"/><circle cx="45" cy="33" r="4" fill="#2a1748"/><path d="M46 70 Q62 62 74 70" fill="none" class="o2"/>`,
    look: 'Eine Gummiente. Sie sieht mich an, als wüsste sie etwas, das ich nicht weiß.',
    act: { label: '🦆 Quietschen', run: async () => { sfx('quack'); await say('*QUIETSCH!*'); await say('...Ich fühle mich sofort besser.'); } },
  },
  banane: {
    name: 'Banane',
    icon: `<path d="M20 26 Q20 80 76 82 Q90 82 86 72 Q42 70 32 24Z" fill="#ffe14d" class="o"/><path d="M30 34 Q36 64 70 74" fill="none" stroke="#f2b705" stroke-width="4" stroke-linecap="round"/><path d="M18 26 l2 -10 l12 4z" fill="#7a4b1f" class="o2"/>`,
    look: 'Eine Banane. Wir Bananen müssen zusammenhalten.',
    act: { label: '😋 Essen', run: 'Ich esse doch keine Verwandten!' },
  },
  gurkenglas: {
    name: 'Gurkenglas',
    icon: jar(`<rect x="26" y="50" width="48" height="36" rx="7" fill="#b7f06a" opacity=".6"/><path d="M46 38 Q36 62 46 84 Q58 88 58 70 Q60 48 52 38Z" fill="#3fae2a" class="o2"/><circle cx="49" cy="52" r="2" fill="#a8f07a"/><circle cx="52" cy="68" r="2" fill="#a8f07a"/>`),
    look: 'Ein Glas mit einer einsamen Gewürzgurke. Haltbar bis: „Ja“.',
    act: {
      label: '😋 Gurke essen',
      run: async () => {
        await say('Na gut, Gurke. Du oder ich.');
        sfx('crunch');
        await say('*KNIRSCH* ...Mmh. Schmeckt nach 1987.');
        removeItem('gurkenglas'); addItem('glas');
        await say('Übrig bleibt ein Glas mit Gurkenwasser. Das heb ich auf. Man weiß ja nie.');
      },
    },
  },
  glas: {
    name: 'Glas mit Gurkenwasser',
    icon: jar(`<rect x="26" y="54" width="48" height="32" rx="7" fill="#b7f06a" opacity=".7"/>`),
    look: 'Leer bis auf etwas Gurkenwasser. Riecht wie eine Gurke, die gerade Sport gemacht hat.',
    act: { label: '🥤 Trinken', run: 'Gurkenwasser trinken? Ich bin mutig, aber nicht SO mutig.' },
  },
  gwglas: {
    name: 'Glühwürmchen-Glas',
    icon: jar(`<rect x="26" y="54" width="48" height="32" rx="7" fill="#b7f06a" opacity=".5"/><circle cx="50" cy="60" r="26" fill="#f6ff9a" opacity=".45"/><circle cx="40" cy="52" r="5" fill="#fbffc9"/><circle cx="60" cy="62" r="5" fill="#fbffc9"/><circle cx="46" cy="74" r="5" fill="#fbffc9"/><circle cx="62" cy="44" r="4" fill="#fbffc9"/>`),
    look: 'Ein Glas voller fröhlich leuchtender Glühwürmchen. Sie winken mir zu. Glaube ich.',
    act: { label: '✨ Bewundern', run: [['gw', 'Bsss! Nicht schütteln! Wir sind Künstler!']] },
  },
  lappen: {
    name: 'Putzlappen',
    icon: `<path d="M18 30 Q40 18 60 28 Q82 20 86 40 Q78 60 84 78 Q60 88 40 78 Q20 86 16 64 Q24 48 18 30Z" fill="#4dabff" class="o"/><rect x="50" y="46" width="18" height="16" rx="3" fill="#ffd60a" class="o2" transform="rotate(10 59 54)"/><path d="M28 40 Q40 36 50 40 M26 60 Q36 56 44 62" fill="none" stroke="#bfe3ff" stroke-width="4" stroke-linecap="round"/>`,
    look: 'Olgas Lappen von Arm Nummer sechs. Leicht feucht. Ich frage lieber nicht, wovon.',
    act: { label: '🧽 Stirn abwischen', run: 'Ich wische mir die Stirn. Jetzt riecht meine Stirn nach Kneipe.' },
  },
};

// Kombinationen im Inventar (Schlüssel alphabetisch sortiert)
const COMBOS = {
  'angel+kaugummi': async () => {
    removeItem('angel'); removeItem('kaugummi');
    await say('Ich klebe den Kaugummi an den Haken...');
    addItem('klebeangel');
    await say('Ekelhaft. Und genial. Hauptsächlich ekelhaft.');
  },
  'gummiente+pommes': 'Ente mit Pommes. Klingt nach einem Restaurant, in das ich nie gehen würde.',
  'banane+pommes': 'Bananen-Pommes? Ich bin Abenteurer, kein Sternekoch.',
  'gurkenglas+pommes': 'Pommes mit Gurke. In manchen Ländern ein Verbrechen. In anderen ein Frühstück.',
  'banane+gummiente': 'Die Ente will keine Banane. Sie ist ja auch aus Gummi.',
  'gummiente+kaugummi': 'Gummi auf Gummi? Das wäre zu viel Gummi für ein einziges Spiel.',
  'gurkenglas+lappen': 'Ich poliere das Gurkenglas. Die Gurke sieht jetzt noch trauriger aus. Glänzend traurig.',
  'angel+gummiente': 'Ich könnte die Ente angeln. Aber ich hab sie ja schon. Das wäre Betrug.',
  'banane+gurkenglas': 'Banane und Gurke im selben Glas? Da würden sich beide beschweren.',
  'kaugummi+muenze': 'Ich klebe den Taler nicht fest. Den brauch ich noch!',
};

const FAIL = [
  'Das passt nicht zusammen. Wie Socken und Sandalen.',
  'Ich hab es in meinem Kopf durchgespielt. Es war furchtbar.',
  'Nö. Einfach nö.',
  'Selbst in einem Videospiel ergibt das keinen Sinn.',
  'Wenn das klappt, ess ich einen Besen. ...Glück gehabt, Besen.',
  'Das funktioniert so nicht. Glaube ich. Ganz sicher.',
];
const NOUSE = [
  'Das lass ich lieber, wo es ist.',
  'Ich fasse das nicht an. Wer weiß, wo das schon war.',
  'Das ist festgemacht. Oder ich bin zu schwach. Wir sagen: festgemacht.',
];
const NOTALK = [
  'Hallo, %! ...Keine Antwort. Unhöflich.',
  'Ich rede nicht mit Dingen. Zumindest nicht, wenn jemand zuguckt.',
];
const SELF_LOOK = [
  'Das bin ich: Bruno Banane. Abenteurer, Enkel, Besitzer einer prächtigen Bananentolle.',
  'Gutaussehend wie immer. Die Tolle sitzt.',
  'Ich sehe aus wie jemand, der gleich einen Leuchtturm repariert. Glaube ich.',
];

// Wer spricht in welcher Farbe?
const ACTORS = {
  hero: { color: '#fff36b' },
  narr: { color: '#ffffff' },
  olga: { color: '#ff8ae6' },
  guenther: { color: '#bfe9ff' },
  lama: { color: '#ffb347' },
  krabbe: { color: '#ff7b6e' },
  gw: { color: '#c6ff4d', pos: [640, 230] },
  tukan: { color: '#7dffb0' },
};

// ---------- Figuren ----------
function guentherSvg() {
  const key = !S.flags.keyGiven;
  return `<g class="gull">
    <path d="M384 402 L344 384 L352 414Z" fill="#cfd8ea" class="o"/>
    <ellipse cx="424" cy="412" rx="50" ry="34" fill="#fff" class="o"/>
    <path d="M388 400 Q420 378 454 404 Q430 432 392 420Z" fill="#b9c6dc" class="o"/>
    <path d="M412 444 l-8 8 h16z M438 444 l-8 8 h16z" fill="#ff9f1c" class="o2"/>
    ${key ? `<path d="M444 392 Q462 418 482 388" fill="none" stroke="#7a4b1f" stroke-width="3"/>` : ''}
    <g class="ghead">
      <circle cx="460" cy="372" r="27" fill="#fff" class="o"/>
      <path d="M480 364 L524 372 Q520 388 502 388 L480 382Z" fill="#ffb627" class="o"/>
      <circle cx="514" cy="380" r="3.5" fill="#ff3d3d"/>
      <ellipse class="mouth" cx="500" cy="384" rx="10" ry="2" fill="#b56b00"/>
      <ellipse cx="466" cy="364" rx="8" ry="9" fill="#fff" class="o2"/><circle cx="469" cy="366" r="4" fill="#2a1748"/>
      <path d="M454 350 L480 358" fill="none" class="o"/>
    </g>
    ${key ? `<g><circle cx="463" cy="414" r="9" fill="#ffc83d" class="o2"/><circle cx="463" cy="414" r="3" fill="#2a1748"/><path d="M463 423 V444 M463 436 h7 M463 442 h7" stroke="#2a1748" stroke-width="7" stroke-linecap="round"/><path d="M463 423 V444 M463 436 h7 M463 442 h7" stroke="#ffc83d" stroke-width="3" stroke-linecap="round"/><path class="twinkle" d="M476 404 l2 -7 2 7 7 2 -7 2 -2 7 -2 -7 -7 -2z" fill="#fffbd1"/></g>` : `<g class="zzz"><text x="490" y="330" class="sign" style="font-size:22px;fill:#fff">mampf!</text></g>`}
  </g>`;
}

function olgaSvg() {
  const glass = (x, y) => `<path d="M${x - 12} ${y - 20} h24 l-4 30 h-16z" fill="#c8f6ff" fill-opacity=".85" class="o2"/><rect x="${x - 9}" y="${y - 2}" width="17" height="10" fill="#ff9f1c" opacity=".85"/>`;
  const tent = (d, dl, g) => `<g class="tent" style="animation-delay:${dl}s"><path d="${d}" fill="none" stroke="#2a1748" stroke-width="27" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#ff5fd2" stroke-width="19" stroke-linecap="round"/>${g || ''}</g>`;
  const rag = !S.flags.lappenGot ? `<path d="M448 380 Q462 370 478 380 Q482 396 470 404 Q452 406 446 394Z" fill="#4dabff" class="o2"/>` : '';
  return `<g class="${S.flags.jukeboxFixed ? 'dancing' : ''}">
    ${tent('M626 326 Q566 330 552 266', -0.2, glass(552, 252))}
    ${tent('M620 342 Q560 372 514 334', -0.9, glass(514, 320))}
    ${tent('M714 326 Q774 330 788 266', -0.5, glass(788, 252))}
    ${tent('M720 342 Q780 372 826 334', -1.3, glass(826, 320))}
    ${tent('M640 348 Q600 384 470 392', -0.7, rag)}
    ${tent('M700 348 Q740 384 872 394', -1.1)}
    <path d="M596 338 Q584 196 670 186 Q756 196 744 338 Q670 360 596 338Z" fill="#ff5fd2" class="o"/>
    <circle cx="628" cy="230" r="9" fill="#ff9be6"/><circle cx="712" cy="222" r="12" fill="#ff9be6"/><circle cx="702" cy="250" r="6" fill="#ff9be6"/><circle cx="616" cy="300" r="7" fill="#ff9be6"/>
    <g transform="translate(722 198)"><g fill="#ff3d6e" class="o2"><circle cx="0" cy="-14" r="9"/><circle cx="13" cy="-4" r="9"/><circle cx="8" cy="12" r="9"/><circle cx="-8" cy="12" r="9"/><circle cx="-13" cy="-4" r="9"/></g><circle r="8" fill="#ffd60a" class="o2"/></g>
    <g class="blinker"><ellipse cx="646" cy="270" rx="17" ry="21" fill="#fff" class="o2"/><ellipse cx="694" cy="270" rx="17" ry="21" fill="#fff" class="o2"/><circle cx="650" cy="275" r="8" fill="#2a1748"/><circle cx="690" cy="275" r="8" fill="#2a1748"/><circle cx="653" cy="271" r="3" fill="#fff"/><circle cx="693" cy="271" r="3" fill="#fff"/></g>
    <path d="M632 254 l-9 -8 M640 250 l-4 -11 M708 254 l9 -8 M700 250 l4 -11" fill="none" class="o2"/>
    <circle cx="624" cy="300" r="9" fill="#ff2a8a" opacity=".45"/><circle cx="716" cy="300" r="9" fill="#ff2a8a" opacity=".45"/>
    <ellipse class="mouth o2" cx="670" cy="314" rx="15" ry="7" fill="#e0004d"/>
  </g>`;
}

function lamaSvg() {
  const happy = S.flags.lamaHappy;
  const legs = [402, 424, 472, 494].map(x => `<rect x="${x}" y="540" width="16" height="62" rx="6" fill="#fff1d6" class="o2"/><rect x="${x - 1}" y="592" width="18" height="12" rx="4" fill="#5a3a2a"/>`).join('');
  const eye = happy
    ? `<path d="M520 380 Q530 368 541 380" fill="none" class="o"/>`
    : `<ellipse cx="530" cy="378" rx="8" ry="10" fill="#fff" class="o2"/><circle cx="533" cy="382" r="4" fill="#2a1748"/><path d="M520 371 Q530 365 542 371 L542 379 Q530 374 520 379Z" fill="#fff1d6" class="o2"/><path class="tear" d="M534 392 q-5 9 0 11 q5 -2 0 -11z" fill="#7fd8ff"/>`;
  return `<g transform="${happy ? 'translate(400 36) scale(.8)' : ''}"><g class="lama${happy ? ' happy' : ''}">
    ${legs}
    <circle cx="378" cy="508" r="13" fill="#fff1d6" class="o2"/>
    <ellipse cx="450" cy="520" rx="74" ry="44" fill="#fff1d6" class="o"/>
    <path d="M396 500 Q450 466 512 498 L506 548 Q452 566 398 548Z" fill="url(#poncho)" class="o"/>
    <path d="M404 552 v10 M420 556 v10 M436 558 v10 M452 559 v10 M468 558 v10 M484 556 v10 M500 552 v10" stroke="#ff3d6e" stroke-width="4" stroke-linecap="round"/>
    <path d="M494 512 Q500 450 506 396 L540 396 Q540 460 528 518Z" fill="#fff1d6" class="o"/>
    <g class="lhead">
      <path d="M506 364 Q496 320 512 316 Q522 336 520 366Z" fill="#fff1d6" class="o2"/>
      <path d="M528 362 Q530 316 546 318 Q548 342 540 366Z" fill="#fff1d6" class="o2"/>
      <ellipse cx="526" cy="384" rx="34" ry="28" fill="#fff1d6" class="o"/>
      <circle cx="514" cy="358" r="10" fill="#ff5fb8" class="o2"/><circle cx="531" cy="353" r="10" fill="#ffd60a" class="o2"/><circle cx="546" cy="360" r="8" fill="#2bb5ff" class="o2"/>
      <ellipse cx="555" cy="397" rx="20" ry="15" fill="#ffd9e8" class="o2"/><circle cx="566" cy="391" r="2.5" fill="#2a1748"/>
      ${eye}
      <ellipse class="mouth" cx="557" cy="408" rx="7" ry="2.5" fill="#8a1c3f"/>
      ${happy ? `<circle cx="514" cy="396" r="7" fill="#ff8fa3" opacity=".7"/>` : ''}
    </g>
  </g></g>`;
}

function krabbeSvg() {
  return `<g class="crab"><g transform="translate(430 655)">
    <path d="M-28 4 l-20 14 M-22 10 l-16 18 M28 4 l20 14 M22 10 l16 18" stroke="#2a1748" stroke-width="9" stroke-linecap="round"/>
    <path d="M-28 4 l-20 14 M-22 10 l-16 18 M28 4 l20 14 M22 10 l16 18" stroke="#ff4d3d" stroke-width="4" stroke-linecap="round"/>
    <path d="M-34 -10 Q-58 -18 -60 -44 Q-48 -48 -46 -36 Q-40 -46 -30 -42 Q-40 -30 -26 -18Z" fill="#ff4d3d" class="o2"/>
    <path d="M34 -10 Q58 -18 60 -44 Q48 -48 46 -36 Q40 -46 30 -42 Q40 -30 26 -18Z" fill="#ff4d3d" class="o2"/>
    <ellipse cx="0" cy="-4" rx="40" ry="24" fill="#ff4d3d" class="o"/>
    <path d="M-10 -26 V-44 M10 -26 V-44" fill="none" class="o"/>
    <rect x="-24" y="-54" width="48" height="14" rx="6" fill="#111"/><path d="M-18 -50 l6 0" stroke="#fff" stroke-width="2"/>
    <ellipse class="mouth" cx="0" cy="2" rx="8" ry="3" fill="#7a0f1f"/>
    <circle cx="-22" cy="-4" r="4" fill="#ff8f86"/><circle cx="22" cy="-4" r="4" fill="#ff8f86"/>
  </g></g>`;
}

// ---------- Szenen ----------
const SCENES = {};

/* ===================== HAFEN ===================== */
SCENES.hafen = {
  name: 'Hafen von Quietschhausen',
  music: 'island',
  walk: { x1: 40, x2: 1240, y1: 545, y2: 705 },
  scale: [0.66, 0.9],
  start: [300, 610, 1],
  entry: { kneipe: [1045, 560, -1], dschungel: [80, 630, 1], leuchtturm: [1200, 640, -1] },
  bg() {
    const r = rng(7);
    const waves = Array.from({ length: 16 }, () => { const x = r() * 1240 | 0, y = 360 + r() * 110 | 0; return `<path d="M${x} ${y} q12 -8 24 0 t24 0"/>`; }).join('');
    const dots = Array.from({ length: 70 }, () => `<circle cx="${r() * 1280 | 0}" cy="${500 + r() * 215 | 0}" r="${(1 + r() * 2.5).toFixed(1)}" fill="#e8902c" opacity=".5"/>`).join('');
    const bulbs = Array.from({ length: 11 }, (_, i) => { const t = i / 10; return `<circle class="twinkle" style="animation-delay:${-i * .3}s" cx="${872 + t * 378}" cy="${252 + t * 14 + Math.sin(t * Math.PI * 5) * 6}" r="7" fill="${['#ffd60a', '#ff3d6e', '#2fe07a', '#2bb5ff'][i % 4]}" class="o2"/>`; }).join('');
    return `
    <defs>
      <linearGradient id="hSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4b2bd6"/><stop offset=".5" stop-color="#ff5fb8"/><stop offset="1" stop-color="#ffc05c"/></linearGradient>
      <linearGradient id="hSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#19d3c5"/><stop offset="1" stop-color="#1867ff"/></linearGradient>
      <linearGradient id="hSand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#ffab3d"/></linearGradient>
      <linearGradient id="hSun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff9a8"/><stop offset="1" stop-color="#ff7a59"/></linearGradient>
      <linearGradient id="hHouse" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a66bff"/><stop offset="1" stop-color="#5a2fd0"/></linearGradient>
    </defs>
    <rect width="1280" height="350" fill="url(#hSky)"/>
    <circle cx="640" cy="300" r="120" fill="url(#hSun)"/>
    <g fill="#ffa47c"><rect x="510" y="292" width="260" height="6"/><rect x="510" y="310" width="260" height="9"/><rect x="510" y="330" width="260" height="12"/></g>
    ${cloud(150, 110, 1)}${cloud(1000, 70, 1.25)}${cloud(430, 60, .7)}
    <path d="M300 170 q10 -10 20 0 q10 -10 20 0 M350 140 q8 -8 16 0 q8 -8 16 0" fill="none" stroke="#2a1748" stroke-width="3" stroke-linecap="round"/>
    <rect y="340" width="1280" height="160" fill="url(#hSea)"/>
    <g fill="#fff6a8" opacity=".75"><rect x="580" y="352" width="120" height="5" rx="2"/><rect x="605" y="368" width="70" height="5" rx="2"/><rect x="625" y="384" width="30" height="4" rx="2"/></g>
    <g class="waves" stroke="#d6fffb" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7">${waves}</g>
    <path d="M0 482 Q200 462 420 480 T860 472 T1280 478 V720 H0Z" fill="url(#hSand)"/>
    <path d="M0 482 Q200 462 420 480 T860 472 T1280 478" fill="none" stroke="#fff" stroke-width="7" opacity=".7"/>
    ${dots}
    <path transform="translate(880 672) rotate(15)" d="${starPath(5, 24, 10)}" fill="#ff5fb8" class="o2"/>
    <path transform="translate(330 690) rotate(-20)" d="${starPath(5, 16, 7)}" fill="#ff9f1c" class="o2"/>
    <path d="M200 652 q20 -32 40 0z M212 652 l8 -20 M228 652 l-8 -20" fill="#ffd1e8" class="o2"/>
    <!-- Steg -->
    <g>
      <rect x="146" y="350" width="10" height="70" fill="#6b3b1f" class="o2"/><rect x="206" y="350" width="10" height="70" fill="#6b3b1f" class="o2"/>
      <path d="M150 352 L212 352 L268 505 L84 505Z" fill="#c9773a" class="o"/>
      <path d="M138 380 H222 M125 410 H233 M112 440 H244 M99 470 H255" stroke="#8a4a22" stroke-width="3"/>
      <rect x="76" y="470" width="16" height="50" rx="4" fill="#8a4a22" class="o2"/><rect x="260" y="470" width="16" height="50" rx="4" fill="#8a4a22" class="o2"/>
    </g>
    <!-- Poller -->
    <rect x="408" y="442" width="44" height="92" rx="8" fill="#8b5a2b" class="o"/>
    <path d="M408 470 H452 M408 490 H452" stroke="#e8c27a" stroke-width="5"/>
    <ellipse cx="430" cy="444" rx="25" ry="8" fill="#a8703a" class="o"/>
    <!-- Kneipe -->
    <g>
      <path d="M880 545 L896 236 L1232 252 L1244 545Z" fill="url(#hHouse)" class="o"/>
      ${[290, 330, 370, 410, 450, 490, 525].map(y => `<path d="M892 ${y} L1238 ${y + 10}" stroke="#ffffff26" stroke-width="3"/>`).join('')}
      <path d="M864 248 L1052 112 L1258 266Z" fill="#ff3d6e" class="o"/>
      <path d="M930 204 L1176 214 M980 166 L1120 172" stroke="#c9184a" stroke-width="5"/>
      <path d="M1150 150 L1186 156 L1182 214 L1146 196Z" fill="#ff9f1c" class="o"/>
      <g fill="#fff" opacity=".7"><circle class="smoke" cx="1170" cy="130" r="12"/><circle class="smoke s2" cx="1182" cy="100" r="16"/></g>
      ${bulbs}
      <circle cx="948" cy="340" r="34" fill="#ffe66b" class="o"/><path d="M914 340 H982 M948 306 V374" stroke="#2a1748" stroke-width="5"/>
      <circle cx="1180" cy="352" r="34" fill="#ffe66b" class="o"/><path d="M1146 352 H1214 M1180 318 V386" stroke="#2a1748" stroke-width="5"/>
      <g transform="rotate(-5 1060 204)"><rect x="962" y="176" width="196" height="58" rx="10" fill="#ffd60a" class="o"/><text x="1060" y="201" text-anchor="middle" class="sign" font-size="19">ZUM SCHIEFEN</text><text x="1060" y="226" text-anchor="middle" class="sign" font-size="21">KRAKEN</text></g>
      <path d="M902 470 q-24 10 -16 34 q10 6 14 -6 q-6 -12 8 -18" fill="#ff5fd2" class="o2"/>
    </g>`;
  },
  objects: [
    {
      id: 'faehre', name: 'Fähre am Horizont',
      svg: () => `<g class="ferry"><g transform="translate(330 352)"><path d="M-52 -2 L52 -2 L42 16 L-42 16Z" fill="#fff" class="o2"/><rect x="-32" y="-18" width="52" height="16" fill="#ff3d6e" class="o2"/><rect x="0" y="-34" width="12" height="16" fill="#ffd60a" class="o2"/><circle cx="-22" cy="-10" r="3" fill="#fff36b"/><circle cx="-10" cy="-10" r="3" fill="#fff36b"/><circle cx="8" cy="-10" r="3" fill="#fff36b"/><circle class="smoke" cx="10" cy="-44" r="7" fill="#fff" opacity=".7"/></g>${hit(270, 300, 120, 70)}</g>`,
      look: ['Da draußen dreht die Fähre „MS Wackelpudding“ ihre Runden.', 'Ohne Leuchtturm traut sich der Kapitän nicht in den Hafen. Feigling. Verständlicher Feigling.'],
      use: 'Die ist zu weit weg. Und ich hab sehr kurze Arme. Proportional gesehen.',
      talk: async () => { await say('HALLO, FÄHRE!!! ICH WILL NACH HAUSE!!!'); await wait(400); await say('...Sie hat zurückgewunken. Glaube ich. Oder das war eine Welle.'); },
    },
    {
      id: 'ente', name: 'Quietsche-Ente', useLabel: 'Nehmen',
      show: () => !S.flags.enteTaken, at: [560, 548],
      svg: () => `<g class="bobbing"><g transform="translate(560 432)"><ellipse cx="0" cy="16" rx="34" ry="5" fill="#d6fffb" opacity=".6"/><path d="M-26 0 Q-24 18 0 18 Q26 18 28 0 Q20 -4 12 0 L4 -2 Q-10 4 -18 -2Z" fill="#ffd60a" class="o2"/><circle cx="-6" cy="-14" r="11" fill="#ffd60a" class="o2"/><path d="M3 -13 Q14 -16 15 -10 Q10 -6 3 -8Z" fill="#ff8c1a" class="o2"/><circle cx="-3" cy="-17" r="2.2" fill="#2a1748"/></g>${hit(520, 400, 80, 60)}</g>`,
      look: 'Eine Gummiente treibt im Hafenbecken. Sie wirkt verloren. Wie ich.',
      use: async () => { await say('Komm her, kleine Ente!'); sfx('quack'); S.flags.enteTaken = true; addItem('gummiente'); await say('*QUIETSCH* – Sie mag mich!'); },
      talk: async () => { await say('Hallo, Ente. Wie ist das Wasser?'); sfx('quack'); await say('Sie sagt: „Quietsch.“ Ich deute das als „nass“.'); },
      items: { angel: 'Die Ente kann ich auch mit der Hand holen. Ich bin ja kein Monster.', klebeangel: 'Die Ente kann ich auch mit der Hand holen. Ich bin ja kein Monster.' },
    },
    {
      id: 'angel', name: 'Angel', useLabel: 'Nehmen',
      show: () => !S.flags.angelTaken, at: [180, 548],
      svg: () => `<g><path d="M116 490 L238 452" stroke="#2a1748" stroke-width="11" stroke-linecap="round"/><path d="M116 490 L238 452" stroke="#d98a45" stroke-width="5" stroke-linecap="round"/><circle cx="140" cy="482" r="10" fill="#ff3d6e" class="o2"/><path d="M238 452 Q248 470 242 490" fill="none" stroke="#fff" stroke-width="2.5"/><path d="M242 490 q0 8 -6 6" fill="none" stroke="#c8d0e0" stroke-width="3"/>${hit(100, 436, 160, 70)}</g>`,
      look: 'Eine herrenlose Angel. Der Besitzer ist vermutlich beim Angeln. Ohne Angel. Tragisch.',
      use: async () => { S.flags.angelTaken = true; addItem('angel'); await say('Die nehm ich mal mit. Für die Wissenschaft.'); },
    },
    {
      id: 'palme', name: 'Palme', at: [610, 560],
      svg: () => `<g><path d="M546 528 Q566 400 600 262 L618 266 Q590 400 578 528Z" fill="#b8692e" class="o"/>
        <path d="M556 480 l28 4 M562 430 l28 4 M570 380 l30 4 M580 330 l30 4" stroke="#7a3e12" stroke-width="4"/>
        <g class="o"><path d="M608 262 Q530 210 466 284 Q540 248 606 274Z" fill="#2fe07a"/><path d="M608 262 Q560 176 494 186 Q570 204 604 270Z" fill="#18c964"/><path d="M608 262 Q652 168 724 190 Q652 200 614 270Z" fill="#2fe07a"/><path d="M608 262 Q692 218 744 292 Q680 250 612 274Z" fill="#18c964"/><path d="M608 262 Q612 200 650 160 Q630 214 616 268Z" fill="#7dffb0"/></g></g>`,
      look: 'Eine Palme. Keine Kokosnüsse. Vermutlich hat Günther sie geklaut.',
      use: 'Ich bin kein guter Kletterer. Ich bin eher ein guter Runterfaller.',
      talk: 'Hallo, Palme. ...Sie wiegt sich nur im Wind. Typisch Palme. Total entspannt.',
    },
    {
      id: 'guenther', name: 'Möwe Günther', actor: 'guenther', head: [470, 320], at: [575, 600], useLabel: 'Anfassen',
      svg: guentherSvg,
      look: () => S.flags.keyGiven
        ? 'Günther, im Pommes-Koma. So glücklich war noch nie eine Möwe.'
        : ['Eine fette Möwe mit einem goldenen Schlüssel um den Hals.', 'Sie guckt, als hätte sie gerade ein Verbrechen begangen. Oder plant eins. Oder beides.'],
      use: [['guenther', 'Finger weg, Freundchen! Ich beiße. Und ich kreische. GLEICHZEITIG!']],
      talk: () => talkTo('guenther'),
      items: {
        pommes: async () => {
          await say('Herr Günther, ich hätte da etwas für Sie...');
          await say('Ist das...? Sind das...?', 'guenther');
          sfx('squawk');
          await say('POOOOMMEEEES!!!', 'guenther');
          removeItem('pommes'); S.flags.keyGiven = true; renderObjects();
          await say('Mmpf... mampf... nimm den Schlüssel... mampf... is mir egal...', 'guenther');
          addItem('schluessel');
          await say('Der Leuchtturm-Schlüssel! Ein Hoch auf die Bestechung!');
        },
        banane: [['guenther', 'Ich bin eine Möwe, kein Affe! POMMES oder gar nichts!']],
        muenze: [['guenther', 'Glänzend... aber kann man nicht essen. Nächster!']],
        gummiente: [['guenther', 'Eine ENTE?! Nimm die weg! Enten sind die Tauben des Wassers!']],
        gurkenglas: [['guenther', 'Gurken? Was bin ich, ein Hamburger?']],
        glas: [['guenther', 'Gurkenwasser? Igitt. Sogar ich hab Standards. Einen.']],
      },
      anyItem: () => [['guenther', 'Kann man das essen? Nein? Dann interessiert mich das nicht.']],
    },
    {
      id: 'gully', name: 'Gully', at: [590, 640],
      svg: () => `<g><ellipse cx="660" cy="628" rx="58" ry="18" fill="#3a2a5e" class="o"/>${!S.flags.coinTaken ? `<ellipse cx="672" cy="630" rx="10" ry="4" fill="#ffc83d"/>` : ''}<path d="M618 628 H702 M632 616 V640 M646 612 V644 M660 611 V645 M674 612 V644 M688 616 V640" stroke="#8d7bc4" stroke-width="4"/>${!S.flags.coinTaken ? `<path class="twinkle" d="M686 612 l3 -10 3 10 10 3 -10 3 -3 10 -3 -10 -10 -3z" fill="#fffbd1"/>` : ''}${hit(600, 600, 120, 50)}</g>`,
      look: () => !S.flags.coinTaken
        ? ['Ein Gully. Da unten glänzt ein Taler!', 'Mein Arm passt nicht durchs Gitter. Und ehrlich gesagt will er das auch gar nicht.']
        : 'Nur noch Gullywasser da unten. Und vermutlich ein Krokodil. Ein kleines.',
      use: () => !S.flags.coinTaken ? 'Ich stecke meine Hand da nicht rein. Da unten wohnen bestimmt Kanal-Krabben.' : 'Da unten ist nichts mehr, was ich haben will.',
      items: {
        angel: () => !S.flags.coinTaken ? ['Ich versuche es... Hab ihn! ...Und weg.', 'Der Taler rutscht immer wieder vom Haken. Ich bräuchte was Klebriges.'] : 'Da unten gibt es nichts mehr zu angeln.',
        klebeangel: async () => {
          if (S.flags.coinTaken) return say('Da unten gibt es nichts mehr zu angeln.');
          await say('Ganz vorsichtig... Kaugummi trifft Taler... und...');
          await wait(500); sfx('coin');
          S.flags.coinTaken = true; removeItem('klebeangel'); addItem('muenze'); renderObjects();
          await say('JA! Wer braucht schon eine Ausbildung, wenn er Kaugummi hat?');
          await say('Die Angel ist dabei leider in den Gully geplumpst. Ruhe in Frieden, Angel.');
        },
        banane: 'Ich werfe doch keine Verwandten in den Gully!',
        muenze: 'Ich hab den Taler gerade erst gerettet. Der bleibt hier oben.',
      },
    },
    {
      id: 'wegweiser', name: 'Wegweiser', at: [770, 565],
      svg: () => `<g><rect x="762" y="380" width="14" height="172" fill="#8b5a2b" class="o"/>
        <path d="M702 392 L792 392 L792 426 L702 426 L684 409Z" fill="#2fe07a" class="o"/><text x="742" y="416" text-anchor="middle" class="sign" font-size="15">DSCHUNGEL</text>
        <path d="M748 436 L848 436 L866 453 L848 470 L748 470Z" fill="#ff5fb8" class="o"/><text x="802" y="460" text-anchor="middle" class="sign" font-size="15">LEUCHTTURM</text></g>`,
      look: ['Links: Dschungel. Rechts: Leuchtturm.', 'Ganz unten, klein gekritzelt: „Günther war hier“.'],
      use: 'Den lass ich stehen. Sonst verlaufen sich die Touristen. Alle drei.',
      talk: 'Wegweiser, wo geht\'s zu Oma? ...Er zeigt nur stur nach links und rechts. Sehr hilfreich.',
    },
    {
      id: 'kneipe', name: 'Kneipe „Zum Schiefen Kraken“', exit: 'kneipe', at: [1045, 555],
      svg: () => `<g><path d="M998 545 V440 Q998 398 1045 398 Q1092 398 1092 440 V545Z" fill="#ffb627" class="o"/><path d="M1022 410 V545 M1045 398 V545 M1068 410 V545" stroke="#d4870f" stroke-width="3"/><circle cx="1045" cy="440" r="15" fill="#7ff0ff" class="o2"/><circle cx="1076" cy="496" r="6" fill="#ff3d6e" class="o2"/></g>`,
    },
    {
      id: 'exitL', layer: 'front', name: 'Zum Dschungel', exit: 'dschungel', at: [45, 630],
      svg: () => `<g>${hit(0, 480, 70, 240)}${arrow(48, 620, -1)}</g>`,
    },
    {
      id: 'exitR', layer: 'front', name: 'Zum Leuchtturm', exit: 'leuchtturm', at: [1235, 650],
      svg: () => `<g>${hit(1210, 550, 70, 170)}${arrow(1232, 640, 1)}</g>`,
    },
  ],
};

/* ===================== KNEIPE ===================== */
SCENES.kneipe = {
  name: 'Zum Schiefen Kraken',
  music: () => S.flags.jukeboxFixed ? 'disco' : 'walzer',
  walk: { x1: 60, x2: 1230, y1: 580, y2: 705 },
  scale: [0.78, 0.92],
  start: [330, 610, 1],
  entry: { hafen: [330, 600, 1] },
  enter: async () => {
    if (!S.flags.kneipeSeen) { S.flags.kneipeSeen = true; await say('Hereinspaziert, Schätzchen! Füße abtreten, Tentakel einziehen!', 'olga'); }
  },
  bg() {
    const r = rng(3);
    const bottles = Array.from({ length: 18 }, (_, i) => {
      const row = i < 9 ? 0 : 1, x = 456 + (i % 9) * 52 + (r() * 10 | 0), base = row ? 280 : 196, h = 34 + r() * 26 | 0;
      const c = ['#ff3d6e', '#2fe07a', '#2bb5ff', '#ffd60a', '#9b5cff', '#ff9f1c'][i % 6];
      return `<rect x="${x}" y="${base - h}" width="22" height="${h}" rx="6" fill="${c}" class="o2"/><rect x="${x + 6}" y="${base - h - 12}" width="10" height="14" fill="${c}" class="o2"/><rect x="${x + 4}" y="${base - h + 10}" width="14" height="12" fill="#fff" opacity=".8"/>`;
    }).join('');
    const planks = Array.from({ length: 13 }, (_, i) => { const xb = -160 + i * 133; return `<path d="M${640 + (xb - 640) * .55} 540 L${xb} 720" stroke="#b8441f" stroke-width="3"/>`; }).join('');
    return `
    <defs>
      <linearGradient id="kWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2fd6c8"/><stop offset="1" stop-color="#168a9c"/></linearGradient>
      <linearGradient id="kFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a3d"/><stop offset="1" stop-color="#e2562f"/></linearGradient>
      <linearGradient id="kJuke" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff3d6e"/><stop offset=".2" stop-color="#ff9f1c"/><stop offset=".4" stop-color="#ffd60a"/><stop offset=".6" stop-color="#2fe07a"/><stop offset=".8" stop-color="#2bb5ff"/><stop offset="1" stop-color="#9b5cff"/></linearGradient>
      <linearGradient id="kWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c26a2c"/><stop offset="1" stop-color="#7a3517"/></linearGradient>
      <linearGradient id="kWin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8fd0"/><stop offset=".5" stop-color="#ffc05c"/><stop offset=".52" stop-color="#19d3c5"/><stop offset="1" stop-color="#1867ff"/></linearGradient>
    </defs>
    <rect width="1280" height="545" fill="url(#kWall)"/>
    ${Array.from({ length: 16 }, (_, i) => `<path d="M${i * 82} 0 V430" stroke="#0e6f7c" stroke-width="3" opacity=".5"/>`).join('')}
    <rect y="430" width="1280" height="115" fill="#8a3df0"/>
    <rect y="424" width="1280" height="14" fill="#ffd60a" class="o2"/>
    ${[90, 210, 1000, 1180].map(x => `<circle cx="${x}" cy="490" r="18" fill="#a66bff" class="o2"/>`).join('')}
    <rect y="535" width="1280" height="185" fill="url(#kFloor)"/>
    <path d="M0 540 H1280" stroke="#2a1748" stroke-width="5"/>
    ${planks}
    <path d="M0 600 H1280 M0 670 H1280" stroke="#b8441f" stroke-width="2" opacity=".6"/>
    <!-- Bullaugen -->
    ${[130, 1150].map(x => `<circle cx="${x}" cy="170" r="56" fill="#ffc23d" class="o"/><circle cx="${x}" cy="170" r="42" fill="url(#kWin)" class="o2"/><path d="M${x - 28} 150 q14 -12 28 0" stroke="#fff" stroke-width="5" fill="none" opacity=".7"/>`).join('')}
    <g class="fish"><path d="M1140 200 q14 -12 28 0 q-14 12 -28 0z M1168 200 l10 -8 v16z" fill="#ff9f1c"/></g>
    <!-- Lampen -->
    ${[470, 870].map(x => `<path d="M${x} 0 V70" stroke="#2a1748" stroke-width="4"/><path d="M${x - 34} 100 Q${x} 50 ${x + 34} 100Z" fill="#ff3d6e" class="o"/><ellipse cx="${x}" cy="104" rx="14" ry="8" fill="#fff6a8"/><path d="M${x - 60} 260 L${x} 104 L${x + 60} 260Z" fill="#fff6a8" opacity=".12"/>`).join('')}
    <!-- Regal -->
    <rect x="430" y="196" width="500" height="14" rx="4" fill="#7a3517" class="o2"/>
    <rect x="430" y="280" width="500" height="14" rx="4" fill="#7a3517" class="o2"/>
    ${bottles}
    <!-- Anker & Netz -->
    <path d="M60 300 q30 40 0 80 M60 300 q-30 40 0 80" stroke="#7a3517" stroke-width="3" fill="none" opacity=".6"/>
    <g transform="translate(1212 320)" fill="none" stroke="#2a1748" stroke-width="7" stroke-linecap="round"><path d="M0 -40 V40 M-26 20 Q0 54 26 20 M-14 -20 H14"/><circle cx="0" cy="-48" r="8"/></g>
    <g transform="translate(1212 320)" fill="none" stroke="#c0c8d8" stroke-width="3" stroke-linecap="round"><path d="M0 -40 V40 M-26 20 Q0 54 26 20 M-14 -20 H14"/></g>`;
  },
  mid() {
    return `
    <rect x="420" y="418" width="520" height="146" fill="url(#kWood)" class="o"/>
    ${[480, 600, 720, 840].map(x => `<circle cx="${x + 30}" cy="492" r="26" fill="#ffd60a" class="o2"/><circle cx="${x + 30}" cy="492" r="16" fill="#2fd6c8" class="o2"/>`).join('')}
    <rect x="404" y="398" width="552" height="26" rx="9" fill="#ffd166" class="o"/>
    ${[520, 840].map(x => `<rect x="${x - 6}" y="586" width="12" height="70" fill="#7a3517" class="o2"/><ellipse cx="${x}" cy="580" rx="36" ry="12" fill="#ff3d6e" class="o"/>`).join('')}`;
  },
  objects: [
    {
      id: 'regal', name: 'Flaschenregal', layer: 'back', at: null,
      svg: () => hit(430, 130, 500, 170),
      look: ['Tintenfisch-Limo, Seetang-Schorle, Quallen-Gelee-Likör...', 'Ich bleib bei Wasser. Und selbst da bin ich hier skeptisch.'],
      use: [['olga', 'Finger weg vom Regal, Schätzchen! Da steht meine Rentenversicherung.']],
    },
    {
      id: 'olga', name: 'Olga', actor: 'olga', head: [670, 175], at: [670, 600], layer: 'back', useLabel: 'Anfassen',
      svg: olgaSvg,
      look: ['Olga, die Wirtin. Ein Oktopus mit acht Armen und sehr viel Lippenstift.', 'Sie poliert sechs Gläser gleichzeitig. Mit den anderen zwei Armen hält sie ihr Leben zusammen.'],
      use: [['olga', 'Hände weg, Schätzchen. Alle acht sind vergeben.']],
      talk: () => talkTo('olga'),
      items: {
        muenze: [['olga', 'Behalt deinen Taler, Schätzchen. Wirf ihn lieber in die Jukebox. BITTE.']],
        banane: [['olga', 'Bananen? Das hier ist eine seriöse Kneipe.']],
        gummiente: [['olga', 'Ach, wie süß! Nein danke, ich hab schon zwölf. In der Badewanne. Frag nicht.']],
        lappen: [['olga', 'Behalt ihn, Schätzchen. Ich hab noch sieben.']],
        gurkenglas: [['olga', 'Die Gurke will ich nicht zurück. Wir hatten eine schwierige Beziehung.']],
        pommes: [['olga', 'Die gehören dir. Aufs Haus. Ich bin heute großzügig. Das passiert nie wieder.']],
      },
      anyItem: () => [['olga', 'Und was soll ich damit, Schätzchen? Ich hab schon alle Arme voll.']],
    },
    {
      id: 'jukebox', name: 'Jukebox', at: [200, 610],
      svg: () => {
        const fx = S.flags.jukeboxFixed;
        const bulbs = Array.from({ length: 9 }, (_, i) => { const a = Math.PI + i * Math.PI / 8; return `<circle class="bulb" style="animation-delay:${-i * .1}s" cx="${180 + Math.cos(a) * 74}" cy="${414 + Math.sin(a) * 74}" r="7" fill="${['#fff36b', '#ff3d6e', '#7ff0ff'][i % 3]}" class="o2"/>`; }).join('');
        const notes = [0, 1, 2].map(i => `<text class="note${fx ? '' : ' sad'}" style="animation-delay:${-i * 1.1}s" x="${140 + i * 40}" y="${fx ? 320 : 330}" font-size="38" fill="${fx ? ['#ff3d6e', '#ffd60a', '#2fe07a'][i] : '#8fb8ff'}">${fx ? '♫' : '♪'}</text>`).join('');
        return `<g class="juke${fx ? ' party' : ''}">
          <path d="M96 590 V420 Q96 320 180 320 Q264 320 264 420 V590Z" fill="url(#kJuke)" class="o"/>
          ${bulbs}
          <path d="M122 470 V424 Q122 356 180 356 Q238 356 238 424 V470Z" fill="#2a1748" class="o2"/>
          <g class="spin"><circle cx="180" cy="428" r="36" fill="#151515"/><circle cx="180" cy="428" r="26" fill="none" stroke="#333" stroke-width="2"/><circle cx="180" cy="428" r="11" fill="#ff3d6e"/></g>
          ${[130, 158, 186, 214].map((x, i) => `<rect x="${x}" y="482" width="20" height="14" rx="3" fill="${['#ff3d6e', '#ffd60a', '#2fe07a', '#2bb5ff'][i]}" class="o2"/>`).join('')}
          <rect x="124" y="506" width="112" height="70" rx="12" fill="#ffd60a" class="o2"/>
          <path d="M142 514 V568 M162 514 V568 M182 514 V568 M202 514 V568 M222 514 V568" stroke="#c98a12" stroke-width="5"/>
          <rect x="228" y="452" width="8" height="12" rx="2" fill="#111"/>
          ${notes}</g>`;
      },
      look: () => S.flags.jukeboxFixed
        ? 'Die Jukebox spielt jetzt „Disco-Krake 3000“. Ein Meisterwerk der Tentakel-Musik.'
        : ['Eine Jukebox. Sie spielt den „Gurkenwalzer in Moll“. Seit 31 Jahren. Ununterbrochen.', 'Der Wählknopf klemmt. Vielleicht hilft ein frischer Taler.'],
      use: async () => {
        if (S.flags.jukeboxFixed) return say('Die Disco bleibt an. Sonst erwürgt mich Olga mit allen acht Armen.');
        await say('Ich drücke auf alle Knöpfe gleichzeitig...');
        sfx('fail');
        await say('Nichts. Der Gurkenwalzer bleibt. Er ist unbesiegbar.');
      },
      talk: 'Liebe Jukebox, bitte spiel was anderes. ...Sie walzt einfach weiter. Herzlos.',
      items: {
        muenze: async () => {
          await say('Ein Taler für die Musik!');
          removeItem('muenze'); sfx('coin');
          await wait(700);
          S.flags.jukeboxFixed = true; renderObjects(); playSong('disco');
          await wait(900);
          await say('Was... was ist das? Das ist ja... DISCO!', 'olga');
          await say('Endlich! Nach 31 Jahren Gurkenwalzer!', 'olga');
          await say('Schätzchen, du bist mein Held! Hier, Pommes aufs Haus!', 'olga');
          addItem('pommes');
          await say('Pommes! Ich wusste, dass sich Hartnäckigkeit lohnt. Und Kaugummi.');
        },
        klebeangel: 'Ich angle nicht in Jukeboxen. Das ist unter meiner Würde. Knapp drunter.',
        banane: 'Die Jukebox nimmt nur Taler. Sie ist sehr materialistisch.',
      },
      anyItem: () => 'Die Jukebox nimmt nur Taler. Sie ist sehr materialistisch.',
    },
    {
      id: 'tuer', name: 'Ausgang', exit: 'hafen', at: [330, 590],
      svg: () => `<g><path d="M280 548 V360 Q280 300 330 300 Q380 300 380 360 V548Z" fill="#9b5cff" class="o"/><circle cx="330" cy="372" r="22" fill="#7ff0ff" class="o2"/><circle cx="364" cy="460" r="7" fill="#ffd60a" class="o2"/><rect x="288" y="268" width="84" height="24" rx="7" fill="#2fe07a" class="o2"/><text x="330" y="286" text-anchor="middle" class="sign" font-size="14">AUSGANG</text></g>`,
    },
    {
      id: 'gerald', name: 'Ausgestopfter Schwertfisch', at: null,
      svg: () => `<g><path d="M996 322 L1080 322 Q1120 298 1160 316 L1192 298 L1184 330 L1192 362 L1160 344 Q1120 362 1080 338 L996 326Z" fill="#2bb5ff" class="o"/><path d="M1110 316 l10 -18 l14 16" fill="#2bb5ff" class="o2"/><circle cx="1096" cy="326" r="4" fill="#2a1748"/><path d="M1086 334 q6 4 12 0" fill="none" class="o2"/><rect x="1058" y="366" width="86" height="22" rx="5" fill="#ffd60a" class="o2"/><text x="1101" y="382" text-anchor="middle" class="sign" font-size="13">GERALD</text></g>`,
      look: ['Ein ausgestopfter Schwertfisch.', 'Auf dem Schild steht: „Gerald. Hat einen Streit mit Olga angefangen.“'],
      use: 'Gerald bleibt, wo er ist. Er hat genug durchgemacht.',
      talk: 'Hallo, Gerald. ...Gerald schweigt. Gerald hat seine Lektion gelernt.',
    },
    {
      id: 'tisch', name: 'Tisch', at: [1060, 612],
      svg: () => `<g><rect x="1072" y="508" width="16" height="92" fill="#7a3517" class="o2"/><ellipse cx="1080" cy="604" rx="42" ry="9" fill="#7a3517" class="o2"/>
        <ellipse cx="1080" cy="500" rx="110" ry="24" fill="#c97b3a" class="o"/><path d="M990 494 Q1080 512 1170 494" fill="none" stroke="#e8a46a" stroke-width="4"/>
        <rect x="1030" y="452" width="18" height="44" rx="5" fill="#2fe07a" class="o2"/><rect x="1035" y="440" width="8" height="14" fill="#2fe07a" class="o2"/>
        <path d="M1100 470 h26 l-3 26 h-20z" fill="#c8f6ff" fill-opacity=".85" class="o2"/>
        ${!S.flags.gumTaken ? `<path d="M1126 520 q8 -6 18 0 q4 12 -7 13 q-13 2 -11 -13z" fill="#ff7ac8" class="o2"/>` : ''}</g>`,
      look: () => !S.flags.gumTaken
        ? ['Ein wackeliger Tisch.', 'Unter der Platte klebt ein uralter Kaugummi. Ein Fossil. Ein Kunstwerk. Ein ekliges Kunstwerk.']
        : 'Ein wackeliger Tisch. Ohne Kaugummi wackelt er jetzt noch mehr. Der hat ihn zusammengehalten.',
      use: async () => {
        if (S.flags.gumTaken) return say('Den Tisch lass ich hier. Er hat schon genug verloren.');
        await say('Bäh... Na gut. Für Oma.');
        S.flags.gumTaken = true; addItem('kaugummi');
        await say('Ich hab einen Kaugummi von unter einem Kneipentisch genommen. Ich bin jetzt offiziell ein Abenteurer.');
      },
    },
    {
      id: 'gurkenglas', name: 'Gurkenglas', useLabel: 'Nehmen', at: [850, 600],
      show: () => !S.flags.glasTaken,
      svg: () => `<g><rect x="852" y="352" width="40" height="11" rx="3" fill="#ff3d6e" class="o2"/><rect x="846" y="360" width="52" height="42" rx="9" fill="#c8f6ff" fill-opacity=".75" class="o2"/><rect x="850" y="378" width="44" height="22" rx="6" fill="#b7f06a" opacity=".6"/><path d="M866 366 Q858 384 868 398 Q880 400 878 384 Q880 370 872 364Z" fill="#3fae2a" class="o2"/><path d="M853 368 V390" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/></g>`,
      look: 'Ein Glas mit einer einzelnen Gewürzgurke. Sie steht hier, seit die Kneipe eröffnet hat. Sie hat Dinge gesehen.',
      use: async () => {
        await say('Die Gurke? Nimm sie mit! Die starrt mich seit 1987 an.', 'olga');
        S.flags.glasTaken = true; addItem('gurkenglas');
        await say('Danke! Eine Gurke mit Geschichte.');
      },
      talk: 'Hallo, Gurke. ...Sie schweigt. Wie alle Gurken. Gurken sind sehr verschlossen.',
    },
  ],
};

/* ===================== LEUCHTTURM (außen) ===================== */
SCENES.leuchtturm = {
  name: 'Der Leuchtturm',
  music: 'island',
  walk: { x1: 40, x2: 1200, y1: 562, y2: 705 },
  scale: [0.6, 0.86],
  start: [200, 640, 1],
  entry: { hafen: [80, 640, 1], turm: [850, 568, 1] },
  enter: async () => {
    if (!S.flags.turmSeen) { S.flags.turmSeen = true; await say('Da ist er, der Leuchtturm. Groß, gestreift und völlig nutzlos.'); }
  },
  bg() {
    const r = rng(11);
    const stars = Array.from({ length: 55 }, (_, i) => `<circle ${i % 4 ? '' : 'class="twinkle" '}style="animation-delay:${(-r() * 2).toFixed(2)}s" cx="${r() * 1280 | 0}" cy="${r() * 300 | 0}" r="${(1 + r() * 2.2).toFixed(1)}" fill="#fff"/>`).join('');
    const flowers = Array.from({ length: 30 }, () => `<circle cx="${r() * 1280 | 0}" cy="${540 + r() * 170 | 0}" r="${(3 + r() * 3).toFixed(1)}" fill="${['#ffd60a', '#ff5fb8', '#fff', '#7ff0ff'][r() * 4 | 0]}"/>`).join('');
    return `
    <defs>
      <linearGradient id="lSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c0f5c"/><stop offset=".55" stop-color="#9b3fe0"/><stop offset="1" stop-color="#ff8a5c"/></linearGradient>
      <linearGradient id="lSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b4bff"/><stop offset="1" stop-color="#1a1a8f"/></linearGradient>
      <linearGradient id="lGrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3ddc84"/><stop offset="1" stop-color="#0f8f6b"/></linearGradient>
      <clipPath id="towerClip"><path d="M740 552 L960 552 L900 150 L800 150Z"/></clipPath>
    </defs>
    <rect width="1280" height="470" fill="url(#lSky)"/>
    ${stars}
    <path d="M190 62 A48 48 0 1 0 190 158 A62 62 0 0 1 190 62Z" fill="#fff6c9"/>
    <rect y="410" width="1280" height="140" fill="url(#lSea)"/>
    <g class="waves" stroke="#a9a4ff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7">${Array.from({ length: 10 }, () => `<path d="M${r() * 1240 | 0} ${425 + r() * 90 | 0} q12 -8 24 0 t24 0"/>`).join('')}</g>
    <path d="M0 524 Q320 488 640 512 T1280 500 V720 H0Z" fill="url(#lGrass)"/>
    <path d="M0 524 Q320 488 640 512 T1280 500" fill="none" class="o"/>
    ${flowers}
    <ellipse cx="850" cy="552" rx="150" ry="18" fill="#0b6b4f" opacity=".5"/>
    <!-- Turm -->
    <path d="M740 552 L960 552 L900 150 L800 150Z" fill="#fff"/>
    <g clip-path="url(#towerClip)" fill="#ff3d6e"><rect x="700" y="150" width="300" height="62"/><rect x="700" y="272" width="300" height="62"/><rect x="700" y="394" width="300" height="62"/><rect x="700" y="516" width="300" height="40"/></g>
    <path d="M740 552 L960 552 L900 150 L800 150Z" fill="none" class="o"/>
    <ellipse cx="850" cy="244" rx="12" ry="18" fill="#2a1748"/><ellipse cx="850" cy="364" rx="13" ry="19" fill="#2a1748"/>
    <path d="M786 128 V102 M914 128 V102 M786 102 H914 M808 128 V102 M830 128 V102 M870 128 V102 M892 128 V102" stroke="#2a1748" stroke-width="4"/>
    <rect x="808" y="66" width="84" height="62" fill="#3a2e7a" class="o"/>
    <path d="M836 66 V128 M864 66 V128" stroke="#2a1748" stroke-width="4"/>
    <rect x="780" y="126" width="140" height="24" rx="4" fill="#2a1748"/>
    <path d="M800 70 Q850 6 900 70Z" fill="#ff3d6e" class="o"/><circle cx="850" cy="22" r="8" fill="#ffd60a" class="o2"/>
    ${[[820, 590, 30], [840, 630, 34], [818, 672, 38]].map(([x, y, rx]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="10" fill="#b7a8d8" class="o2"/>`).join('')}
    <!-- Felsen -->
    <path d="M-10 640 Q60 596 140 626 Q186 664 130 730 H-10Z" fill="#7b5cd6" class="o"/>
    <path d="M1140 560 Q1210 520 1290 556 V720 H1180 Q1120 640 1140 560Z" fill="#7b5cd6" class="o"/>
    <path d="M30 640 q30 -14 60 0 M1170 590 q40 -20 80 0" stroke="#a48cf0" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  },
  objects: [
    {
      id: 'turm', name: 'Leuchtturm', at: null,
      svg: () => `<path d="M806 150 L896 150 L926 420 L776 420Z M800 20 h100 v130 h-100z" fill="transparent"/>`,
      look: ['Ein rot-weiß gestreifter Leuchtturm.', 'Er leuchtet nicht. Dabei ist das sein einziger Job. Sein EINZIGER.'],
      use: 'Ich umarme den Leuchtturm. ...Er leuchtet trotzdem nicht. Einen Versuch war\'s wert.',
      talk: 'LEUCHTE! ...Nichts. Er hört nicht auf mich. Er hört auf niemanden.',
    },
    {
      id: 'tuer', name: 'Leuchtturmtür', at: [850, 568], useLabel: 'Öffnen',
      exit: () => S.flags.doorOpen ? 'turm' : null,
      svg: () => S.flags.doorOpen
        ? `<g><path d="M806 552 V462 Q806 418 850 418 Q894 418 894 462 V552Z" fill="#1a0f33" class="o"/><path d="M816 552 V466 Q816 430 850 430 Q884 430 884 466 V552Z" fill="#ffb627" opacity=".35"/><path d="M820 540 H880 M826 520 H874 M832 500 H868" stroke="#ffd166" stroke-width="5" opacity=".7"/><path d="M806 552 V462 Q806 418 850 418" fill="none" stroke="#6b3b1f" stroke-width="8"/></g>`
        : `<g><path d="M806 552 V462 Q806 418 850 418 Q894 418 894 462 V552Z" fill="#7a4520" class="o"/><path d="M828 425 V552 M850 418 V552 M872 425 V552" stroke="#5a3010" stroke-width="3"/><path d="M806 470 H894 M806 520 H894" stroke="#2a1748" stroke-width="6"/><circle cx="880" cy="496" r="7" fill="#ffd60a" class="o2"/><rect x="874" y="502" width="12" height="12" rx="2" fill="#2a1748"/></g>`,
      look: () => S.flags.doorOpen ? 'Die Tür steht offen. Eine Wendeltreppe führt nach oben. Sehr weit nach oben.' : 'Eine schwere Holztür mit Eisenbeschlägen. Abgeschlossen. Natürlich.',
      use: () => S.flags.doorOpen ? goScene('turm', 'leuchtturm') : (sfx('fail'), say('Abgeschlossen. Ohne Schlüssel komm ich hier nicht rein.')),
      talk: 'Sesam, öffne dich! ...Hm. Falsches Märchen.',
      items: {
        schluessel: async () => {
          sfx('door');
          await say('Klick! Klack! Abrakadabra!');
          S.flags.doorOpen = true; removeItem('schluessel'); renderObjects();
          await say('Die Tür ist offen. Auf zur Spitze!');
        },
        klebeangel: 'Ein Schloss mit Kaugummi knacken? Das klappt nur in Filmen. In schlechten Filmen.',
      },
    },
    {
      id: 'schild', name: 'Schild', at: [1010, 575],
      svg: () => `<g><rect x="1036" y="470" width="12" height="92" fill="#8b5a2b" class="o2"/><rect x="972" y="440" width="140" height="70" rx="8" fill="#fff3b0" class="o"/><text x="1042" y="466" text-anchor="middle" class="sign" font-size="15">GESCHLOSSEN!</text><text x="1042" y="488" text-anchor="middle" class="sign" font-size="11">WÄRTER IM URLAUB</text><text x="1042" y="502" text-anchor="middle" class="sign" font-size="11">(MALLORCA)</text></g>`,
      look: ['Da steht: „Leuchtturm geschlossen. Wärter im Urlaub (Mallorca).“', 'Und darunter: „Schlüssel hat die Möwe. Lange Geschichte. – Lothar“'],
      use: 'Das Schild bleibt. Es ist das einzige hier, das seinen Job macht.',
    },
    {
      id: 'krabbe', name: 'Krabbe mit Sonnenbrille', actor: 'krabbe', head: [440, 570], at: [540, 665], useLabel: 'Anfassen',
      svg: krabbeSvg,
      look: 'Eine Krabbe mit Sonnenbrille. Nachts. Sie ist eindeutig cooler als ich. Das tut weh.',
      use: async () => { sfx('fail'); await say('SCHNAPP!', 'krabbe'); await say('AU! Okay, okay, ich hab verstanden!'); },
      talk: () => talkTo('krabbe'),
      anyItem: () => [['krabbe', 'Schnipp.'], ['krabbe', 'Das heißt „Nein danke“ auf Krabbisch.']],
    },
    {
      id: 'exitL', layer: 'front', name: 'Zum Hafen', exit: 'hafen', at: [45, 640],
      svg: () => `<g>${hit(0, 480, 70, 240)}${arrow(48, 610, -1)}</g>`,
    },
  ],
};

/* ===================== TURMSPITZE ===================== */
SCENES.turm = {
  name: 'Die Turmspitze',
  music: 'island',
  walk: { x1: 100, x2: 1190, y1: 605, y2: 705 },
  scale: [0.82, 0.95],
  start: [300, 650, 1],
  entry: { leuchtturm: [300, 650, 1] },
  enter: async () => {
    if (!S.flags.inTower) { S.flags.inTower = true; await say('*keuch* 432 Stufen... *keuch* Wer baut denn so was?'); await say('Aber die Aussicht! Da draußen kreist die Fähre.'); }
  },
  bg() {
    const r = rng(5);
    const stars = Array.from({ length: 70 }, (_, i) => `<circle ${i % 3 ? '' : 'class="twinkle" '}style="animation-delay:${(-r() * 2).toFixed(2)}s" cx="${40 + r() * 1200 | 0}" cy="${60 + r() * 300 | 0}" r="${(1 + r() * 2).toFixed(1)}" fill="#fff"/>`).join('');
    const rivets = Array.from({ length: 24 }, (_, i) => `<circle cx="${30 + i * 54}" cy="512" r="4" fill="#8f7cff"/>`).join('');
    return `
    <defs>
      <linearGradient id="tSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0738"/><stop offset="1" stop-color="#4a23b0"/></linearGradient>
      <linearGradient id="tSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b3dd6"/><stop offset="1" stop-color="#120a5a"/></linearGradient>
      <linearGradient id="tFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d6bf0"/><stop offset="1" stop-color="#3a2c99"/></linearGradient>
      <linearGradient id="brass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c98a12"/><stop offset=".5" stop-color="#ffe08a"/><stop offset="1" stop-color="#c98a12"/></linearGradient>
    </defs>
    <rect width="1280" height="720" fill="#24145e"/>
    <rect x="40" y="50" width="1200" height="440" fill="url(#tSky)"/>
    ${stars}
    <circle cx="1080" cy="140" r="42" fill="#fff6c9"/><circle cx="1066" cy="130" r="8" fill="#efe2a8"/><circle cx="1094" cy="156" r="6" fill="#efe2a8"/>
    <rect x="40" y="390" width="1200" height="100" fill="url(#tSea)"/>
    <g fill="#fff6c9" opacity=".6"><rect x="1040" y="400" width="80" height="4" rx="2"/><rect x="1055" y="416" width="50" height="4" rx="2"/><rect x="1068" y="432" width="24" height="4" rx="2"/></g>
    ${[40, 250, 450, 830, 1030, 1240].map(x => `<rect x="${x - 11}" y="40" width="22" height="460" fill="#3b2c99" class="o"/>`).join('')}
    <rect x="30" y="262" width="1220" height="14" fill="#3b2c99" class="o"/>
    <path d="M0 0 H1280 V58 Q640 30 0 58Z" fill="#4a35b8" class="o"/>
    <rect y="490" width="1280" height="44" fill="#5b45d6" class="o"/>
    ${rivets}
    <rect y="534" width="1280" height="186" fill="url(#tFloor)"/>
    <path d="M0 600 H1280 M0 670 H1280 M320 534 L260 720 M640 534 V720 M960 534 L1020 720" stroke="#2a1748" stroke-width="3" opacity=".35"/>
    <rect x="940" y="520" width="210" height="20" rx="4" fill="#c97b3a" class="o"/>
    <rect x="955" y="540" width="14" height="66" fill="#8a4a22" class="o2"/><rect x="1120" y="540" width="14" height="66" fill="#8a4a22" class="o2"/>
    <path d="M1100 486 h24 v34 h-24z" fill="#ff5fb8" class="o2"/><path d="M1124 494 q12 4 0 16" fill="none" class="o2"/>
    <path class="smoke" d="M1108 478 q-6 -10 2 -18 M1116 476 q6 -10 -2 -18" stroke="#fff" stroke-width="3" fill="none" opacity=".6"/>
    <path d="M590 600 L604 436 H676 L690 600Z" fill="url(#brass)" class="o"/>
    <rect x="556" y="590" width="168" height="26" rx="8" fill="url(#brass)" class="o"/>`;
  },
  objects: [
    {
      id: 'faehre', name: 'Fähre', at: null,
      svg: () => `<g class="ferry"><g transform="translate(260 410)"><path d="M-40 -2 L40 -2 L32 12 L-32 12Z" fill="#fff" class="o2"/><rect x="-24" y="-14" width="40" height="12" fill="#ff3d6e" class="o2"/><rect x="0" y="-26" width="10" height="12" fill="#ffd60a" class="o2"/><circle cx="-16" cy="-8" r="2.5" fill="#fff36b"/><circle cx="-6" cy="-8" r="2.5" fill="#fff36b"/><circle cx="6" cy="-8" r="2.5" fill="#fff36b"/></g>${hit(210, 370, 120, 60)}</g>`,
      look: ['Die Fähre „MS Wackelpudding“. Der Kapitän winkt mit einer Taschenlampe.', 'Er morst: „H-I-L-F-E. M-I-R. I-S-T. S-C-H-L-E-C-H-T.“'],
      use: 'Die ist ziemlich weit weg. Ich bin gut, aber nicht SO gut.',
      talk: 'HALTET DURCH! ICH MACH DAS LICHT AN! ...glaube ich.',
    },
    {
      id: 'lampe', name: 'Leuchtfeuer', at: [770, 650],
      svg: () => {
        const f = S.flags;
        const R = 70, hw = 90;
        const ring = y => { const d = Math.min(y - 220, 440 - y); return d < R ? hw - (R - Math.sqrt(R * R - (R - d) ** 2)) : hw; };
        const rings = [240, 262, 290, 370, 398, 420].map(y => { const w = ring(y) - 6; return `<path d="M${640 - w} ${y} Q640 ${y + 12} ${640 + w} ${y}" fill="none" stroke="#e8feff" stroke-width="4" opacity=".75"/>`; }).join('');
        const beams = f.lit ? `<g class="beams"><polygon points="640,330 -80,120 -80,560" fill="url(#rainbowV)" opacity=".55"/><polygon points="640,330 1360,120 1360,560" fill="url(#rainbowV)" opacity=".55"/></g><circle class="pulse" cx="640" cy="330" r="170" fill="url(#gwGlow)"/>` : '';
        const core = f.lit
          ? `<g class="gwswarm">${Array.from({ length: 9 }, (_, i) => `<g class="gw" style="animation-delay:${-i * .4}s"><circle cx="${612 + (i * 23) % 60}" cy="${300 + (i * 31) % 64}" r="5" fill="#fbffc9"/></g>`).join('')}</g>`
          : `<circle cx="640" cy="322" r="26" fill="#d9d9e8" class="o2"/><path d="M628 310 l9 9 -7 7 11 9" stroke="#2a1748" fill="none" stroke-width="3"/><rect x="628" y="346" width="24" height="16" rx="3" fill="#9a9ab0" class="o2"/>`;
        const dirt = !f.lensClean ? [[592, 262, 1.1], [690, 300, 1.4], [612, 392, 1], [676, 404, .9], [650, 248, .8], [700, 360, .9], [584, 330, .7]].map(a => splat(...a)).join('') : '';
        return `<g>${beams}<rect x="550" y="220" width="180" height="220" rx="70" fill="#8ff3ff" fill-opacity="${f.lit ? .35 : .55}" class="o"/>${core}${rings}${dirt}<rect x="600" y="426" width="80" height="14" rx="4" fill="url(#brass)" class="o2"/><rect x="600" y="208" width="80" height="14" rx="4" fill="url(#brass)" class="o2"/>${f.lit ? '' : '<path d="M566 260 Q560 300 568 360" stroke="#fff" stroke-width="8" stroke-linecap="round" fill="none" opacity=".6"/>'}</g>`;
      },
      look: async () => {
        const f = S.flags; f.lensSeen = true;
        if (!f.lensClean) {
          await say('Das Leuchtfeuer. Die Glühbirne ist durchgebrannt. Komplett. Mausetot.');
          await say('Und die Linse ist voller Möwen-Kacke. GÜNTHER! Du Schuft!');
        } else await say('Die Linse glänzt wie neu. Jetzt fehlt nur noch etwas, das leuchtet. Etwas Helles. Etwas Fröhliches.');
      },
      use: async () => {
        S.flags.lensSeen = true;
        if (!S.flags.lensClean) await say('Ich wische mit dem Ärmel über die Linse... Igitt. Das verschmiert nur. Ich brauche einen Lappen.');
        else await say('Ich hab keine Ersatzbirne. Ich bräuchte irgendwas anderes, das leuchtet.');
      },
      talk: 'Liebes Leuchtfeuer, bitte leuchte. ...Es ist beleidigt. Wegen Günther, vermutlich.',
      items: {
        lappen: async () => {
          if (S.flags.lensClean) return say('Die ist schon sauber. Sauberer wird\'s nicht.');
          await say('Schrubb, schrubb, schrubb...');
          sfx('scrub'); await wait(700);
          S.flags.lensClean = true; S.flags.lensSeen = true; removeItem('lappen'); renderObjects();
          await say('Blitzblank! Ich sollte ein Putzunternehmen gründen. „Brunos Blitz-Banane“.');
          await say('Den Lappen lass ich hier. Den will keiner mehr zurück.');
        },
        gwglas: async () => {
          if (!S.flags.lensClean) return say('Erst putzen! Die Glühwürmchen wollen ja auch was sehen.');
          await win();
        },
        gurkenglas: 'Eine Gurke leuchtet leider nicht. Auch wenn sie sich wirklich Mühe gibt.',
        glas: 'Gurkenwasser leuchtet nicht. Aber ich kenne jemanden, der darauf abfährt...',
        banane: 'Eine Banane als Glühbirne? Sie hat zwar die Form... aber nein.',
        muenze: 'Glänzt schön, leuchtet aber nicht.',
        gummiente: 'Eine Leucht-Ente wäre super. Das ist leider nur eine Quietsch-Ente.',
      },
    },
    {
      id: 'logbuch', name: 'Logbuch', at: [1000, 640], useLabel: 'Lesen',
      svg: () => `<g><g transform="rotate(-6 1020 508)"><rect x="984" y="496" width="76" height="24" rx="4" fill="#ff3d6e" class="o2"/><rect x="990" y="500" width="64" height="6" fill="#fff"/></g><path d="M1070 470 L1052 518" stroke="#fff" stroke-width="4"/><path d="M1068 474 q14 -14 10 -30 q-14 10 -14 30z" fill="#7ff0ff" class="o2"/></g>`,
      look: 'Das Logbuch von Leuchtturmwärter Lothar. Mit Kaffeeflecken. Und Möwen-Fußspuren.',
      use: [
        '„Montag: Lampe an. Dienstag: Lampe an. Mittwoch: Lampe an.“',
        '„Donnerstag: Möwe hat meinen Schlüssel geklaut. Und auf die Linse gemacht. Lampe kaputt.“',
        '„Freitag: Ich fahre nach Mallorca. Sollen die das doch selber machen.“',
        'Wow. Lothar hat seinen Job wirklich geliebt.',
      ],
    },
    {
      id: 'luke', name: 'Treppe nach unten', exit: 'leuchtturm', at: [260, 640],
      svg: () => `<g><ellipse cx="180" cy="590" rx="86" ry="22" fill="#120a2a" class="o"/><path d="M150 590 V612 M210 590 V612 M150 600 H210" stroke="#c98a12" stroke-width="5"/>${hit(90, 560, 180, 60)}</g>`,
    },
  ],
};

/* ===================== DSCHUNGEL ===================== */
SCENES.dschungel = {
  name: 'Der Kunterbunt-Dschungel',
  music: 'island',
  walk: { x1: 40, x2: 1240, y1: 562, y2: 705 },
  scale: [0.66, 0.9],
  start: [1100, 640, -1],
  entry: { hafen: [1200, 640, -1] },
  enter: async () => {
    if (!S.flags.jungleSeen) { S.flags.jungleSeen = true; await say('Wow, ist das bunt hier! Und feucht. Und warum guckt mich das Lama so traurig an?'); }
  },
  clamp(x, y) {
    let msg = null;
    if (!S.flags.lamaHappy && x < 640) { x = 640; msg = 'Das Lama steht schmollend vor der Brücke. Da komm ich nicht vorbei.'; }
    const c = (v, a, b) => Math.max(a, Math.min(b, v));
    if (x >= 450) { x = Math.min(x, 1240); y = c(y, 565, 705); }
    else if (x >= 250) y = c(y, 590, 606);
    else { x = Math.max(x, 40); y = c(y, 562, 690); }
    return [x, y, msg];
  },
  route(sx, sy, tx, ty) {
    const L = tx < 450, SL = sx < 450;
    if (L === SL) return [[tx, ty]];
    const pts = [];
    if (L) { pts.push([470, 598]); if (tx < 250) pts.push([240, 598]); }
    else { if (sx < 250) pts.push([240, 598]); pts.push([470, 598]); }
    pts.push([tx, ty]);
    return pts;
  },
  bg() {
    const r = rng(17);
    const leaves = Array.from({ length: 26 }, () => leaf(r() * 1280 | 0, 120 + r() * 380 | 0, (r() * 360) | 0, (0.7 + r() * 0.9).toFixed(2), ['#2ee86b', '#19c37d', '#7dff6b', '#0fb8a0'][r() * 4 | 0])).join('');
    const vines = Array.from({ length: 9 }, (_, i) => { const x = 60 + i * 140 + (r() * 40 | 0), l = 120 + r() * 200 | 0; return `<path d="M${x} -10 Q${x + 20} ${l / 2} ${x} ${l}" stroke="#0f9b5a" stroke-width="7" fill="none"/><circle cx="${x}" cy="${l}" r="9" fill="${['#ff3d9a', '#ffd60a', '#ff9f1c'][i % 3]}" class="o2"/>`; }).join('');
    const tufts = Array.from({ length: 22 }, () => { const x = 460 + r() * 800 | 0, y = 540 + r() * 170 | 0; return `<path d="M${x} ${y} l-6 -16 M${x} ${y} l0 -20 M${x} ${y} l6 -16" stroke="#2fe07a" stroke-width="4" stroke-linecap="round"/>`; }).join('');
    const planks = Array.from({ length: 13 }, (_, i) => { const t = i / 12, x = 252 + t * 196, y = 592 + Math.sin(t * Math.PI) * 14; return `<rect x="${(x - 7).toFixed(1)}" y="${(y - 6).toFixed(1)}" width="15" height="13" rx="2" fill="#d98a45" class="o2"/>`; }).join('');
    const flower = (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})">${[0, 60, 120, 180, 240, 300].map(a => `<ellipse cx="0" cy="-22" rx="14" ry="24" fill="${c}" class="o2" transform="rotate(${a})"/>`).join('')}<circle r="12" fill="#ffd60a" class="o2"/></g>`;
    return `
    <defs>
      <linearGradient id="jSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#21e6c1"/><stop offset="1" stop-color="#d4ff6b"/></linearGradient>
      <linearGradient id="jGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a3d"/><stop offset="1" stop-color="#b24a1c"/></linearGradient>
      <linearGradient id="jRav" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a1f7a"/><stop offset="1" stop-color="#0d0624"/></linearGradient>
      <pattern id="poncho" width="40" height="24" patternUnits="userSpaceOnUse"><rect width="40" height="8" fill="#ff3d6e"/><rect y="8" width="40" height="8" fill="#ffd60a"/><rect y="16" width="40" height="8" fill="#2bb5ff"/><path d="M0 8 L10 3 L20 8 L30 3 L40 8" fill="none" stroke="#fff" stroke-width="2"/></pattern>
    </defs>
    <rect width="1280" height="720" fill="url(#jSky)"/>
    <g fill="#fff" opacity=".18"><polygon points="1180,0 1280,0 760,560 640,560"/><polygon points="980,0 1060,0 420,560 340,560"/></g>
    <path d="M0 420 Q80 300 160 380 Q240 260 340 360 Q420 280 520 370 Q600 290 700 360 Q800 250 900 350 Q1000 270 1100 360 Q1200 290 1280 340 V560 H0Z" fill="#11a37f"/>
    <path d="M0 470 Q100 400 200 450 Q300 380 420 450 Q540 400 640 460 Q760 390 880 450 Q1000 400 1120 460 Q1200 420 1280 440 V560 H0Z" fill="#1fd18a"/>
    ${leaves}
    ${vines}
    <rect x="240" y="545" width="220" height="180" fill="url(#jRav)"/>
    <ellipse cx="350" cy="700" rx="110" ry="26" fill="#fff" opacity=".15"/>
    <path d="M-10 554 Q120 538 254 554 L262 600 L248 650 L264 720 H-10Z" fill="url(#jGround)" class="o"/>
    <path d="M448 550 Q800 520 1290 536 V730 H440 L456 664 L438 612Z" fill="url(#jGround)" class="o"/>
    ${tufts}
    ${flower(110, 470, 1.6, '#ff3d9a')}
    <path d="M110 500 V556" stroke="#0f9b5a" stroke-width="8"/>
    ${flower(700, 548, .6, '#ff9f1c')}${flower(1220, 560, .7, '#9b5cff')}
    <g><rect x="905" y="534" width="12" height="26" fill="#fff" class="o2"/><path d="M886 538 Q911 498 936 538Z" fill="#ff3d6e" class="o2"/><circle cx="902" cy="526" r="4" fill="#fff"/><circle cx="918" cy="520" r="5" fill="#fff"/></g>
    <!-- Brücke -->
    <rect x="232" y="528" width="14" height="78" rx="3" fill="#8b5a2b" class="o2"/><rect x="452" y="528" width="14" height="78" rx="3" fill="#8b5a2b" class="o2"/>
    <path d="M239 534 Q350 574 459 534" stroke="#e8c27a" stroke-width="5" fill="none"/>
    ${planks}
    <path d="M239 594 Q350 622 459 594" stroke="#e8c27a" stroke-width="4" fill="none"/>
    ${[280, 320, 360, 400, 430].map(x => { const t = (x - 239) / 220, yt = 534 + Math.sin(t * Math.PI) * 26, yb = 594 + Math.sin(t * Math.PI) * 14; return `<path d="M${x} ${yt.toFixed(1)} V${yb.toFixed(1)}" stroke="#e8c27a" stroke-width="3"/>`; }).join('')}
    <!-- Bananenstaude -->
    <path d="M1080 562 Q1066 420 1094 282 L1116 284 Q1094 420 1110 562Z" fill="#9c6b3a" class="o"/>
    <path d="M1076 500 l30 4 M1074 440 l30 4 M1082 380 l28 4 M1090 330 l24 4" stroke="#6b4420" stroke-width="4"/>
    <g class="o"><path d="M1104 282 Q1010 220 940 300 Q1020 260 1100 292Z" fill="#2ee86b"/><path d="M1104 282 Q1060 180 990 170 Q1070 200 1100 286Z" fill="#19c37d"/><path d="M1104 282 Q1160 180 1240 190 Q1160 210 1110 288Z" fill="#2ee86b"/><path d="M1104 282 Q1200 230 1270 310 Q1190 268 1110 292Z" fill="#19c37d"/></g>`;
  },
  fg() {
    return `${leaf(-40, 735, -18, 2.0, '#19c37d')}${leaf(-20, 690, -10, 1.8, '#2ee86b')}${leaf(1300, 735, 195, 1.7, '#0fb8a0')}`;
  },
  objects: [
    {
      id: 'gw', name: 'Glühwürmchen', actor: 'gw', head: [130, 390], at: [170, 620], useLabel: 'Fangen',
      show: () => !S.flags.gwCaught,
      svg: () => `<g class="gwswarm">${Array.from({ length: 12 }, (_, i) => { const x = 60 + (i * 37) % 130, y = 400 + (i * 53) % 110; return `<g class="gw" style="animation-delay:${-i * .37}s;animation-duration:${(2 + (i % 4) * .6).toFixed(1)}s"><circle cx="${x}" cy="${y}" r="17" fill="url(#gwGlow)"/><circle cx="${x}" cy="${y}" r="4" fill="#fbffc9"/></g>`; }).join('')}${hit(40, 380, 180, 150)}</g>`,
      look: 'Ein Schwarm Glühwürmchen tanzt um die Riesenblume. Heller als jede Disco-Kugel!',
      use: async () => { await say('Ich greife zu... daneben. Nochmal... daneben!'); await say('Die sind viel zu schnell für meine Bananenfinger. Ich brauch ein Glas. Und einen Köder.'); },
      talk: [['gw', 'Bsss! Wir sind die Glühwürmchen-Gang!'], ['gw', 'Wir leuchten nur für Leute mit Stil. Oder mit Gurkenwasser.'], 'Gurkenwasser? Ernsthaft?', ['gw', 'Bsss! Frag nicht. Ist ein Insekten-Ding.']],
      items: {
        glas: async () => {
          await say('Hier, Glühwürmchen! Lecker Gurkenwasser!');
          await say('GURKENWASSER?! PARTYYYY!', 'gw');
          sfx('magic');
          S.flags.gwCaught = true; removeItem('glas'); addItem('gwglas'); renderObjects();
          await say('Hab euch! Keine Sorge, ihr bekommt einen Job mit Aussicht.');
        },
        gurkenglas: async () => { await say('Bsss... da ist ja noch eine Gurke drin. Mit Gurken reden wir nicht.', 'gw'); await say('Ich muss die Gurke erst loswerden.'); },
        banane: [['gw', 'Bsss? Eine Banane? Wir sind doch keine Fruchtfliegen!']],
        lappen: 'Mit einem Lappen fange ich keine Glühwürmchen. Ich verjage sie höchstens. Mit dem Geruch.',
      },
      anyItem: () => [['gw', 'Bsss? Nö.']],
    },
    {
      id: 'lama', name: 'Lamar das Lama', actor: 'lama', layer: 'back', useLabel: 'Streicheln',
      head: () => S.flags.lamaHappy ? [820, 290] : [530, 320],
      at: () => S.flags.lamaHappy ? [700, 640] : [660, 625],
      svg: lamaSvg,
      look: () => S.flags.lamaHappy
        ? 'Lamar, das glücklichste Lama der Welt. Er probt neue Witze. Leise. Zum Glück.'
        : ['Ein Lama im Poncho, mit dem traurigsten Blick der Welt.', 'Es steht genau vor der Hängebrücke. Ich glaube, absichtlich.'],
      use: [['lama', 'Nicht anfassen! Ich spucke. Und ich treffe. Immer.']],
      talk: () => talkTo('lama'),
      items: {
        banane: [['lama', 'Danke, aber ich esse nur Gras. Und Applaus.']],
        gummiente: [['lama', 'Eine Quietsche-Ente? Lustig! ...Nee. Eigentlich nicht.']],
        gurkenglas: [['lama', 'Gurken? Die Glühwürmchen da drüben stehen auf Gurkenwasser. Ich nicht. Ich stehe auf Lacher.']],
        pommes: [['lama', 'Pommes? Für ein Lama? Das ist ja fast so lustig wie meine Witze. Also gar nicht.']],
      },
      anyItem: () => [['lama', 'Was soll ich damit? Ich bin ein Lama, kein Flohmarkt.']],
    },
    {
      id: 'bananen', name: 'Bananenstaude', at: [1040, 610], useLabel: 'Pflücken',
      svg: () => `<g>${[0, 1, 2, 3, 4].map(i => `<path d="M${1072 + i * 9} ${300 + (i % 2) * 6} q-6 34 14 46 q5 -2 2 -7 q-12 -14 -8 -40z" fill="#ffe14d" class="o2"/>`).join('')}<rect x="1086" y="288" width="12" height="18" fill="#3fae2a" class="o2"/>${hit(1060, 280, 70, 80)}</g>`,
      look: 'Eine Bananenstaude. Entfernte Verwandtschaft. Väterlicherseits.',
      use: async () => {
        if (S.flags.bananaTaken) return say('Eine reicht. Ich will die Familie nicht ausrotten.');
        await say('*hüpf* *hüpf* ...*HÜPF!*');
        S.flags.bananaTaken = true; addItem('banane');
        await say('Sorry, Cousine. Ist für einen guten Zweck. Vermutlich.');
      },
      talk: 'Hallo, Familie! ...Sie hängen nur so rum. Typisch Bananen.',
    },
    {
      id: 'tukan', name: 'Tukan', actor: 'tukan', head: [1180, 200], at: [1150, 610],
      svg: () => `<g class="tukan"><g transform="translate(1185 262)"><path d="M-8 26 l-6 12 M8 26 l6 12" stroke="#ff9f1c" stroke-width="5" stroke-linecap="round"/><ellipse cx="0" cy="0" rx="20" ry="28" fill="#2a1748" class="o2"/><ellipse cx="0" cy="-8" rx="13" ry="15" fill="#fff6c9"/><circle cx="2" cy="-14" r="4" fill="#2a1748"/><path d="M-8 -22 Q-50 -28 -54 -8 Q-32 -6 -8 -10Z" fill="#ff9f1c" class="o2"/><path d="M-54 -8 Q-48 -20 -38 -24" stroke="#ff3d6e" stroke-width="7" fill="none" stroke-linecap="round"/></g></g>`,
      look: 'Ein Tukan. Er sieht aus wie ich nach drei Seetang-Schorlen.',
      use: [['tukan', 'KRAAH! Nicht anfassen! Ich bin Deko!']],
      talk: async () => {
        await say(pick(['KRAAH! Ich bin nur Deko! Beachte mich nicht!', 'KRAAH! Tipp vom Tukan: Lamas lachen gern. Über sich selbst. Wenn sonst keiner lacht.', 'KRAAH! Mein Schnabel ist größer als dein Selbstbewusstsein!']), 'tukan');
      },
      anyItem: () => [['tukan', 'KRAAH! Will ich nicht! Ich will Ruhe! Und Beeren!']],
    },
    {
      id: 'exitR', layer: 'front', name: 'Zum Hafen', exit: 'hafen', at: [1235, 640],
      svg: () => `<g>${hit(1210, 520, 70, 200)}${arrow(1232, 620, 1)}</g>`,
    },
  ],
};

// ---------- Dialoge ----------
const DIALOGS = {
  olga: {
    intro: () => {
      if (!S.flags.olgaMet) { S.flags.olgaMet = true; return [['olga', 'Ich bin Olga. Acht Arme, null Geduld.'], ['olga', 'Was darf\'s sein, Schätzchen?']]; }
      return [['olga', pick(['Na, Schätzchen? Was darf\'s sein?', 'Wieder da? Du kannst wohl nicht ohne mich.', 'Bestellung oder Gejammer? Ich hab für beides Arme frei.'])]];
    },
    main: [
      { t: 'Was gibt\'s hier so?', r: [['olga', 'Tintenfisch-Limo, Seetang-Schorle und Pommes.'], ['olga', 'Die Pommes sind legendär. Legendär fettig.']] },
      {
        t: 'Was ist mit dem Leuchtturm los?', r: [
          ['olga', 'Ach, der Leuchtturmwärter Lothar ist auf Mallorca. Und die Lampe ist kaputt.'],
          ['olga', 'Den Schlüssel hat ihm Günther geklaut. Die fette Möwe draußen am Hafen.'],
          'Natürlich hat er das.',
          ['olga', 'Ohne Licht kann die Fähre nicht anlegen. Die schippert seit drei Tagen im Kreis.'],
          'Und ich muss morgen bei Omas Geburtstag sein!',
          ['olga', 'Dann solltest du dich ranhalten, Schätzchen.'],
        ],
      },
      {
        t: 'Kann ich Pommes haben?', if: () => !S.flags.jukeboxFixed, r: [
          ['olga', 'Pommes kosten einen Taler. Hast du einen Taler?'],
          'Ich habe Charme.',
          ['olga', 'Charme lässt sich schlecht frittieren.'],
          ['olga', 'Aber weißt du was? Wenn mir endlich jemand ein anderes Lied auf der Jukebox spielt, gibt\'s Pommes umsonst!'],
          ['olga', 'Seit 31 Jahren läuft nur der „Gurkenwalzer in Moll“. Ich träume schon in Moll!'],
        ],
      },
      { t: 'Kann ich noch mehr Pommes haben?', if: () => S.flags.jukeboxFixed, r: [['olga', 'Eine Portion pro Held. Das ist Gesetz. Hab ich gerade erlassen.']] },
      {
        t: 'Hast du einen Putzlappen für mich?', if: () => S.flags.lensSeen && !S.flags.lappenGot, r: async () => {
          await say('Schätzchen, ich hab acht Lappen. Einen für jeden Arm.', 'olga');
          await say('Nimm den von Arm Nummer sechs. Der war schon immer der Faulste.', 'olga');
          S.flags.lappenGot = true; renderObjects(); addItem('lappen');
          await say('Danke! ...Er ist feucht. Warum ist er feucht?');
          await say('Frag nicht, Schätzchen.', 'olga');
        },
      },
      { t: 'Kennst du das Lama im Dschungel?', once: true, r: [['olga', 'Lamar? Armer Kerl. Erzählt furchtbare Witze, und keiner lacht.'], ['olga', 'Seitdem steht er schmollend vor der Hängebrücke und lässt niemanden durch.'], ['olga', 'Wenn du mich fragst: Der braucht einfach mal ein gutes Publikum.']] },
      { t: 'Warum heißt die Kneipe „Zum Schiefen Kraken“?', once: true, r: [['olga', 'Weil ich nach dem dritten Seetang-Schorle immer so schief stehe.'], ['olga', 'Und weil das Haus schief ist. Hauptsächlich wegen dem Haus.']] },
      { t: 'Tschüss, Olga!', end: true, r: [['olga', 'Ciao, Schätzchen! Nächstes Mal mit Trinkgeld!']] },
    ],
  },
  guenther: {
    intro: () => S.flags.keyGiven
      ? [['guenther', 'Mmmh... Pommes... was willst du? Ich bin beschäftigt. Mit Verdauen.']]
      : (!S.flags.guentherMet ? (S.flags.guentherMet = true, [['guenther', 'Was glotzt du so? Noch nie \'ne Möwe gesehen?']]) : [['guenther', 'Du schon wieder.']]),
    main: [
      { t: 'Hallo, Möwe!', once: true, r: [['guenther', 'GÜNTHER. Für dich: HERR Günther.'], 'Hallo, Herr Günther.', ['guenther', 'Schon besser.']] },
      { t: 'Was hängt da um deinen Hals?', if: () => !S.flags.keyGiven, r: [['guenther', 'Das? Schmuck. Glänzend. Teuer. MEINS.'], 'Das ist der Leuchtturm-Schlüssel.', ['guenther', 'Beweis es.'], 'Da steht „Leuchtturm“ drauf.', ['guenther', '...Das ist Designer-Schmuck.']] },
      { t: 'Gibst du mir den Schlüssel?', if: () => !S.flags.keyGiven, r: [['guenther', 'Nur gegen Bezahlung.'], 'Ich hab kein Geld.', ['guenther', 'Geld? Pah! Was soll eine Möwe mit Geld?'], ['guenther', 'Ich will POMMES. Goldgelb. Knusprig. Mit Salz.'], ['guenther', 'Für Pommes würde ich meine eigene Oma verkaufen. Hab ich auch schon. Zweimal.']] },
      { t: 'Warum klaut ihr Möwen eigentlich alles?', once: true, r: [['guenther', 'Klauen ist so ein hässliches Wort.'], ['guenther', 'Ich nenne es „spontane Eigentumsumverteilung“.']] },
      { t: 'Wie ist das Leben als Möwe so?', once: true, r: [['guenther', 'Fliegen. Kreischen. Auf Sachen kacken.'], ['guenther', 'Gestern hab ich die Linse vom Leuchtturm vollgekackt. Ein Kunstwerk. Ich nenne es „Weiß auf Glas“.']] },
      { t: 'Danke für den Schlüssel, Herr Günther!', if: () => S.flags.keyGiven, once: true, r: [['guenther', 'Mmpf. Wenn du mehr Pommes hast, weißt du, wo ich wohne.'], ['guenther', 'Hier. Auf dem Pfosten. Seit 14 Jahren.']] },
      { t: 'Tschüss, Herr Günther.', end: true, r: () => S.flags.keyGiven ? [['guenther', 'Mmh... Pommes...']] : [['guenther', 'Komm wieder, wenn du Pommes hast. Oder geh weg. Hauptsache Pommes.']] },
    ],
  },
  lama: {
    intro: () => {
      if (S.flags.lamaHappy) return [['lama', 'Bruno! Mein Freund! Mein Publikum!']];
      if (!S.flags.lamaMet) { S.flags.lamaMet = true; return [['lama', '*Seufz*'], 'Ähm... Hallo?', ['lama', 'Ich bin Lamar. Das Lama. Das traurigste Lama der Welt.']]; }
      return [['lama', '*Seufz* Du schon wieder.']];
    },
    main: [
      { t: 'Warum bist du so traurig?', if: () => !S.flags.lamaHappy, r: [['lama', 'Ich bin Komiker. Aber niemand lacht über meine Witze.'], ['lama', 'Und solange keiner lacht, lass ich auch keinen über meine Brücke.'], 'Das ist... sehr spezifisch.', ['lama', 'Ich bin ein sehr spezifisches Lama.']] },
      { t: 'Lass mich bitte über die Brücke!', if: () => !S.flags.lamaHappy, r: [['lama', 'Nein.'], 'Bitte?', ['lama', 'Nein, bitte.']] },
      { t: 'Erzähl mir einen Witz!', if: () => !S.flags.lamaHappy, go: 'witz', r: [['lama', 'Oh! Wirklich? Okay! Okay. Ähem...'], ['lama', 'Was sagt ein Lama, wenn es ins Kino geht?']] },
      { t: 'Was sind das für Lichter hinter der Brücke?', r: [['lama', 'Die Glühwürmchen-Gang. Die stehen total auf Gurkenwasser. Frag nicht, warum.'], ['lama', 'Ich frag ja auch nicht, warum du so eine komische Frisur hast.'], 'Das ist eine BANANENTOLLE.', ['lama', 'Mhm.']] },
      { t: 'Erzähl noch einen Witz!', if: () => S.flags.lamaHappy, r: () => pick([
        [['lama', 'Warum können Lamas nicht Fahrrad fahren?'], ['lama', 'Weil sie keine Daumen für die Klingel haben! HAHA!'], ['lama', '...Der ist noch in der Testphase.']],
        [['lama', 'Was ist ein Lama ohne Beine?'], ['lama', 'LAHM-a! HAHAHA!'], 'Hehe. Der war gut, Lamar.'],
        [['lama', 'Wie nennt man ein Lama mit Sonnenbrille?'], ['lama', 'Dalai Lama! Weil... er so erleuchtet aussieht! HAHA!'], 'Ich glaube, die Krabbe am Leuchtturm will dich kennenlernen.'],
      ]) },
      { t: 'Tschüss, Lamar.', end: true, r: () => S.flags.lamaHappy ? [['lama', 'Tschüss, bester Freund! Komm zu meiner Show! Ich hab bald eine Show!']] : [['lama', '*Seufz* Tschüss. Niemand bleibt je.']] },
    ],
    witz: [
      { t: 'HAHAHAHA!', go: 'main', r: [['lama', 'Ich... bin noch gar nicht fertig.'], ['lama', 'VOR der Pointe lachen ist schlimmer als gar nicht lachen. *Schmoll*']] },
      { t: 'Lamas dürfen gar nicht ins Kino.', go: 'main', r: [['lama', 'Das ist nicht die Pointe. Das ist Diskriminierung.']] },
      { t: 'Keine Ahnung. Was sagt es denn?', go: 'pointe', r: [['lama', '„LAMA SEHEN!“'], ['lama', '...']] },
    ],
    pointe: [
      { t: 'Ich versteh\'s nicht.', go: 'main', r: [['lama', '„Lass mal sehen“... „LAMA sehen“... weil ich ein Lama bin...'], ['lama', 'Ein Witz, den man erklären muss, ist tot. Du hast ihn umgebracht.']] },
      { t: 'Ha. Ha. Sehr witzig.', go: 'main', r: [['lama', 'Ich höre Sarkasmus. Lamas haben sehr gute Ohren. Riesige Ohren.']] },
      {
        t: 'BWAHAHAHA! LAMA SEHEN! Ich kann nicht mehr!', end: true, r: async () => {
          await say('Du... du LACHST?', 'lama');
          await say('Jemand lacht über meinen Witz! Nach elf Jahren!', 'lama');
          sfx('magic');
          S.flags.lamaHappy = true; renderObjects();
          await say('Das ist der schönste Tag meines Lebens! Die Brücke gehört dir, mein Freund!', 'lama');
          await say('Danke, Lamar. Der war wirklich... ein Witz.');
          await say('Ich weiß! ICH WEISS!', 'lama');
        },
      },
      { t: 'Den kannte ich schon.', go: 'main', r: [['lama', 'Den kennt JEDER schon. Das ist ja das Problem.']] },
    ],
  },
  krabbe: {
    intro: () => [['krabbe', 'Schnipp.']],
    main: [
      { t: 'Hallo, Krabbe! Wie heißt du?', once: true, r: [['krabbe', 'Schnapp.'], 'Schnipp Schnapp?', ['krabbe', 'Klaus.']] },
      { t: 'Weißt du was über den Leuchtturm?', r: [['krabbe', 'Schnipp schnapp, Wärter weg. Schnipp schnapp, Lampe Dreck.'], ['krabbe', 'Ich reime nicht freiwillig. Das ist ein Krabben-Ding.']] },
      { t: 'Warum trägst du nachts eine Sonnenbrille?', once: true, r: [['krabbe', 'Weil meine Zukunft so hell ist.'], 'Es ist stockdunkel.', ['krabbe', '...Noch.']] },
      { t: 'Coole Sonnenbrille!', once: true, r: [['krabbe', 'Ich weiß.']] },
      { t: 'Tschüss, Klaus.', end: true, r: [['krabbe', 'Schnapp.']] },
    ],
  },
};

// ---------- Story ----------
async function intro() {
  await say('Quietschhausen. Eine kleine, bunte Insel irgendwo zwischen Nirgendwo und Gar-nicht-so-weit-weg.', 'narr');
  await say('Na toll. Die Fähre nach Hause kann nicht anlegen, weil der Leuchtturm nicht leuchtet.');
  await say('Und morgen hat Oma Gerda Geburtstag! Ich hab versprochen, dass ich komme!');
  await say('Ich, Bruno Banane, werde diesen Leuchtturm wieder zum Leuchten bringen!');
  await say('Wie schwer kann das schon sein?');
  await say('(Tippe auf Dinge, um sie anzusehen, zu nehmen oder mit ihnen zu reden. Der 💡 hilft, wenn du feststeckst.)', 'narr');
}

async function win() {
  await say('Liebe Glühwürmchen, ihr habt einen neuen Job: Leuchtturm-Beleuchtung!');
  await say('Kriegen wir dafür Gurkenwasser?', 'gw');
  await say('So viel ihr wollt.');
  await say('DEAL! Bsss!', 'gw');
  removeItem('gwglas'); S.flags.lit = true; renderObjects();
  sfx('win');
  await wait(800);
  await say('Es werde Licht! Beziehungsweise: Es werden Glühwürmchen!');
  await wait(400);
  sfx('horn');
  await say('In der Ferne tutet die Fähre „MS Wackelpudding“. Sie nimmt Kurs auf den Hafen!', 'narr');
  await say('Oma Gerda, ich komme!');
  await wait(600);
  showEnd();
}

function hint() {
  const f = S.flags;
  if (!f.keyGiven && !has('schluessel') && !f.doorOpen) {
    if (has('pommes')) return 'Möwen lieben Pommes. Günther ganz besonders. Gib sie ihm!';
    if (!f.jukeboxFixed) {
      if (has('muenze')) return 'Olga kann den Gurkenwalzer nicht mehr hören. Wirf den Taler in die Jukebox!';
      if (has('klebeangel')) return 'Benutze die Klebe-Angel mit dem Gully am Hafen.';
      if (!f.coinTaken) {
        if (!has('angel') && !f.angelTaken) return 'Im Gully am Hafen glänzt ein Taler. Auf dem Steg liegt eine Angel herum...';
        if (!has('kaugummi') && !f.gumTaken) return 'Mit der Angel allein rutscht der Taler ab. Etwas Klebriges wäre gut. Schau mal unter Olgas Tische.';
        return 'Kombiniere im Inventar die Angel mit dem Kaugummi. Eklig, aber genial.';
      }
    }
    return 'Günther will Pommes für den Schlüssel. Und Olga will ein neues Lied hören.';
  }
  if (has('schluessel')) return 'Ab zum Leuchtturm! Benutze den Schlüssel mit der Tür.';
  if (!f.inTower) return 'Die Leuchtturmtür ist offen. Steig hinauf!';
  if (!f.lensSeen) return 'Sieh dir das Leuchtfeuer oben im Turm genauer an.';
  if (!f.lensClean) {
    if (!has('lappen')) return 'Die Linse ist voller Möwen-Andenken. Olga hat acht Arme. Vielleicht auch einen Lappen übrig?';
    return 'Benutze den Putzlappen mit dem Leuchtfeuer.';
  }
  if (!has('gwglas')) {
    if (!f.glasTaken) return 'Etwas, das leuchtet? Die Glühwürmchen im Dschungel! Du brauchst ein Glas. Auf Olgas Theke steht eins.';
    if (has('gurkenglas')) return 'Da ist noch eine Gurke im Glas. Probier im Inventar mal „Gurke essen“.';
    if (!f.lamaHappy) return 'Lamar lässt nur fröhliche Leute über die Brücke. Lass dir einen Witz erzählen – und lach an der richtigen Stelle!';
    return 'Benutze das Glas mit Gurkenwasser mit den Glühwürmchen hinter der Brücke.';
  }
  return 'Ab in die Turmspitze! Benutze das Glühwürmchen-Glas mit dem Leuchtfeuer.';
}

// ---------- Musik (Noten pro Achtel; "." = Pause, "-" = halten) ----------
const SONGS = {
  island: {
    bpm: 112,
    tracks: [
      { wave: 'triangle', vol: .09, seq: 'E5 . G5 C6 - . B5 G5 A5 . C6 . E5 - . . F5 A5 C6 A5 G5 - E5 . D5 E5 F5 D5 G5 - - . E5 G5 C6 - . D6 C6 B5 A5 . E5 . A5 - G5 . F5 - A5 . C6 - A5 . G5 - E5 D5 C5 - - .' },
      { wave: 'square', vol: .035, seq: 'C3 . G3 . C3 . G3 . A2 . E3 . A2 . E3 . F2 . C3 . F2 . C3 . G2 . D3 . G2 . B2 .' },
      { drum: true, vol: .05, seq: 'k h h h s h h h k h k h s h h h' },
    ],
  },
  walzer: {
    bpm: 66,
    tracks: [
      { wave: 'sawtooth', vol: .05, seq: 'A4 - - - C5 B4 G#4 - - - B4 A4 A4 - C5 - E5 - F5 - - - D5 - E5 - D5 - B4 - A4 - - - - .' },
      { wave: 'triangle', vol: .08, seq: 'A2 . E3 . E3 . E2 . B2 . B2 . A2 . E3 . E3 . D2 . A2 . A2 . E2 . B2 . G#3 . A2 . E3 . E3 .' },
    ],
  },
  disco: {
    bpm: 124,
    tracks: [
      { wave: 'square', vol: .05, seq: 'A4 C5 E5 . D5 C5 A4 . . F4 A4 C5 . A4 F4 . G4 B4 D5 . G5 . D5 . E5 . D5 . B4 . G#4 .' },
      { wave: 'triangle', vol: .12, seq: 'A2 A3 A2 A3 A2 A3 A2 A3 F2 F3 F2 F3 F2 F3 F2 F3 G2 G3 G2 G3 G2 G3 G2 G3 E2 E3 E2 E3 E2 E3 G#2 G#3' },
      { drum: true, vol: .08, seq: 'k h s h k h s h' },
    ],
  },
};
