// Service Worker: macht das Spiel offline spielbar.
// Nach Änderungen an Spieldateien VERSION erhöhen.
const VERSION = 'bruno-v7';
const FONTS = 'bruno-fonts';
const ASSETS = [
  './', 'index.html', 'style.css', 'content.js', 'engine.js', 'manifest.webmanifest',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'voice/index.json',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== FONTS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(cacheVoices)
  );
});

// Sprachdateien nach der Installation im Hintergrund laden (für offline)
async function cacheVoices() {
  try {
    const cache = await caches.open(VERSION);
    const keys = await (await fetch('voice/index.json')).json();
    for (const k of keys) {
      const url = `voice/${k}.mp3`;
      if (!(await cache.match(url))) { const res = await fetch(url); if (res.ok) await cache.put(url, res); }
    }
  } catch (e) { /* beim nächsten Start erneut */ }
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Eigene Dateien: sofort aus dem Cache, im Hintergrund aktualisieren
  if (url.origin === location.origin) {
    e.respondWith(caches.open(VERSION).then(async cache => {
      const hit = await cache.match(req, { ignoreSearch: true });
      const net = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }

  // Google Fonts: einmal laden, dann aus dem Cache
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(FONTS).then(async cache => {
      const hit = await cache.match(req);
      if (hit) return hit;
      try { const res = await fetch(req); cache.put(req, res.clone()); return res; }
      catch (err) { return Response.error(); }
    }));
  }
});
