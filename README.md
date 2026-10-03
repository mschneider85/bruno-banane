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

## Sprachausgabe

Alle Texte sind vorab mit [Piper TTS](https://github.com/rhasspy/piper) vertont (`voice/`, ein MP3 pro Satz,
Dateiname = Hash aus Sprecher und Text). Nach Textänderungen in `content.js`:

    cd tools && npm install && cd ..
    node tools/voices.js            # fehlende Sätze erzeugen, veraltete löschen
    node tools/voices.js --samples  # Hörproben in voice-samples/

Die Besetzung (Stimme, Tempo, Tonhöhe pro Figur) steht oben in `tools/voices.js`.
Piper und die Stimmen werden unter `~/.local/piper` erwartet (`PIPER_DIR` überschreibt das).

Stimmen-Lizenzen: Thorsten und Thorsten Emotional (CC0, Thorsten Müller), Kerstin (CC0),
MLS German (CC BY 4.0, V. Pratap et al., „MLS: A Large-Scale Multilingual Dataset for Speech Research“).

Nach Änderungen an Spieldateien in `sw.js` die `VERSION` erhöhen.
