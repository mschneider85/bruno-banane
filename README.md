# Bruno Banane und das Leuchtturm-Fiasko

Quietschbuntes 2D-Point-&-Click-Adventure für den Browser, installierbar als PWA.
Läuft ohne Build-Schritt, Grafik komplett als SVG, Musik und Sounds per WebAudio.

## Starten

    python3 -m http.server 8000
    # → http://localhost:8000

Der Service Worker (Offline-Betrieb und Installierbarkeit) braucht `localhost` oder HTTPS.

## Dateien

- `index.html`, `style.css`: Oberfläche
- `engine.js`: Engine (Laufen, Verben, Inventar, Dialoge, Speichern, Audio, PWA)
- `content.js`: Spielinhalt (Szenen, Grafiken, Items, Kombinationen, Dialoge, Musik, Tipps)
- `sw.js`, `manifest.webmanifest`, `icons/`: PWA

Nach Änderungen an Spieldateien in `sw.js` die `VERSION` erhöhen.
