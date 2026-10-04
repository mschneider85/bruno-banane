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

Alle Texte sind vorab vertont (`voice/`, ein MP3 pro Satz, Dateiname = Hash aus Sprecher und Text).
Die meisten Figuren sprechen mit [Chatterbox Multilingual](https://github.com/resemble-ai/chatterbox)
(MIT, Resemble AI; Stimmen geklont aus Referenzaufnahmen in `tools/voice-refs/`), einzelne mit
[Piper TTS](https://github.com/rhasspy/piper). Besetzung pro Figur: oben in `tools/voices.js`.

Einmalig einrichten:

    cd tools && npm install && cd ..
    uv venv --python 3.11 ~/.local/chatterbox
    VIRTUAL_ENV=~/.local/chatterbox uv pip install chatterbox-tts "setuptools<81"
    # Piper + Stimmen nach ~/.local/piper (nur für Figuren mit engine 'piper')

Nach Textänderungen in `content.js`:

    node tools/voices.js            # geänderte Sätze vertonen (GPU empfohlen)
    node tools/voices.js --check    # Lauterkennung: findet genuschelte/falsche Sätze
    node tools/voices.js --samples  # Hörproben zum Vergleich von Stimmen

Falsch ausgesprochene Wörter korrigiert man in `tools/aussprache.js`. Geänderte Aussprache oder
Besetzung erkennt der Generator selbst (`tools/voice-manifest.json`). Chatterbox bettet ein
unhörbares Wasserzeichen (Perth) in die Aufnahmen ein.

Stimmen-Lizenzen: siehe `tools/voice-refs/QUELLEN.md`; Piper-Stimmen Thorsten Emotional (CC0)
und MLS German (CC BY 4.0, V. Pratap et al.).

Nach Änderungen an Spieldateien in `sw.js` die `VERSION` erhöhen.
