#!/usr/bin/env python3
"""Vertont einen Stapel Sätze mit Chatterbox Multilingual (lokal, MIT-Lizenz).

Wird von tools/voices.js aufgerufen:
    python chatterbox_tts.py jobs.json [mtl|turbo]

mtl   = deutsches Mehrsprachen-Modell für gesprochenen Text
turbo = Chatterbox Turbo nur für Geräusche ([sigh], [laugh], [chuckle], [gasp], [groan], [shush])

jobs.json: Liste von {"out", "text", "ref", "exaggeration", "cfg", "seed", "expected"?}.
Mit "expected" (erwartete Lautschrift) wird jeder Versuch per Lauterkennung bewertet und der
beste behalten (bis zu VERIFY_TRIES Versuche) – das fängt angehängtes Gebrabbel ab.
Schreibt pro Job eine WAV-Datei und eine JSON-Zeile mit dem Ergebnis auf stdout:
    {"out", "dur", "cps", "tries", "flag"}
"""
import json
import sys
import warnings

warnings.filterwarnings("ignore")

import torch  # noqa: E402
import torchaudio  # noqa: E402
from chatterbox.mtl_tts import ChatterboxMultilingualTTS  # noqa: E402

# Zeichen pro Sekunde: außerhalb davon ist meist etwas schiefgelaufen
# (abgeschnitten, Gebrabbel am Ende, endlose Pausen)
MIN_CPS, MAX_CPS, TRIES = 7.0, 24.0, 3
VERIFY_TRIES, GOOD_DIST, MAX_RATIO = 5, 0.35, 1.2


def turbo(jobs, device):
    """Nur Geräusche: kein Text-Längencheck, aber hörbar lang genug muss es sein."""
    from chatterbox.tts_turbo import ChatterboxTurboTTS
    import librosa
    model = ChatterboxTurboTTS.from_pretrained(device=device)
    print(json.dumps({"ready": device}), flush=True)
    jobs.sort(key=lambda j: j["ref"])
    current = None
    for job in jobs:
        if job["ref"] != current:
            model.prepare_conditionals(job["ref"])
            current = job["ref"]
        best = None
        for attempt in range(TRIES):
            torch.manual_seed(job["seed"] + attempt * 1000)
            with torch.inference_mode():
                wav = model.generate(job["text"])
            core, _ = librosa.effects.trim(wav.squeeze().cpu().numpy(), top_db=35)
            dur = len(core) / model.sr
            ok = 0.25 <= dur <= 2.5
            if best is None or ok:
                best = (wav, dur, ok)
            if ok:
                break
        wav, dur, ok = best
        torchaudio.save(job["out"], wav.cpu(), model.sr)
        print(json.dumps({"out": job["out"], "dur": round(dur, 2), "tries": attempt + 1, "flag": not ok}), flush=True)


def main():
    jobs = json.load(open(sys.argv[1], encoding="utf-8"))
    device = "cuda" if torch.cuda.is_available() else "cpu"
    if len(sys.argv) > 2 and sys.argv[2] == "turbo":
        return turbo(jobs, device)
    model = ChatterboxMultilingualTTS.from_pretrained(device=device)
    rec = None
    if any(j.get("expected") for j in jobs):
        sys.path.insert(0, __import__("os").path.dirname(__file__))
        from check_voices import Recognizer, dist as ipa_dist, ratio as ipa_ratio, tail_cut
        rec = Recognizer("cpu")  # GPU-Speicher reicht nicht für beide Modelle
    print(json.dumps({"ready": device}), flush=True)

    # Nach Referenz gruppieren, damit die Stimme nur einmal eingelesen wird
    jobs.sort(key=lambda j: (j["ref"], j["exaggeration"]))
    current = None
    for job in jobs:
        cond = (job["ref"], job["exaggeration"])
        if cond != current:
            model.prepare_conditionals(job["ref"], exaggeration=job["exaggeration"])
            current = cond

        text = job["text"]
        expected = job.get("expected") if rec else None
        best = None
        tries = VERIFY_TRIES if expected else TRIES
        for attempt in range(tries):
            torch.manual_seed(job["seed"] + attempt * 1000)
            with torch.inference_mode():
                wav = model.generate(text, language_id="de", exaggeration=job["exaggeration"],
                                     cfg_weight=job["cfg"], temperature=job.get("temperature", 0.8))
            dur = wav.shape[-1] / model.sr
            cps = len(text) / max(dur, 0.1)
            ok = MIN_CPS <= cps <= MAX_CPS or len(text) < 20
            if expected:
                toks = rec.tokens(wav.squeeze().cpu().numpy(), model.sr)
                heard = "".join(t for t, _, _ in toks)
                d, r = ipa_dist(expected, heard), ipa_ratio(expected, heard)
                score = d + max(0.0, r - 1.0) + (0 if ok else 0.5)
                ok = ok and d <= GOOD_DIST and r <= MAX_RATIO
            else:
                # bei mehreren Fehlversuchen den mit der plausibelsten Geschwindigkeit nehmen
                score = abs(cps - 14)
            if best is None or score < best[3]:
                best = (wav, dur, cps, score, ok, toks if expected else None)
            if ok:
                break
        wav, dur, cps, _, ok, toks = best
        if toks:
            # angehängten Wortschnipsel abschneiden (mit kurzem Ausblenden)
            import librosa
            y16 = librosa.resample(wav.squeeze().cpu().numpy(), orig_sr=model.sr, target_sr=16000)
            cut, _tail = tail_cut(expected, toks, dur, y16)
            if cut:
                n = int(cut * model.sr)
                fade = torch.linspace(1, 0, int(0.04 * model.sr))
                cand = wav[..., :n].clone()
                cand[..., -fade.shape[0]:] *= fade
                # Gegenprobe: nach dem Schnitt darf nicht weniger vom Text zu hören sein
                before = ipa_dist(expected, "".join(t for t, _, _ in toks))
                after = ipa_dist(expected, rec.heard(cand.squeeze().cpu().numpy(), model.sr))
                if after <= before + 0.01:
                    wav, dur = cand, n / model.sr
        torchaudio.save(job["out"], wav.cpu(), model.sr)
        print(json.dumps({"out": job["out"], "dur": round(dur, 2), "cps": round(cps, 1),
                          "tries": attempt + 1, "flag": not ok}), flush=True)


if __name__ == "__main__":
    main()
