#!/usr/bin/env python3
"""Prüft vertonte Sätze per Lauterkennung (wav2vec2, gibt Lautschrift aus).

Wird von tools/voices.js --check aufgerufen:
    python check_voices.py jobs.json
jobs.json: Liste von {"key", "file", "expected"} (erwartete eSpeak-Lautschrift).
Gibt pro Satz eine JSON-Zeile aus: {"key", "heard", "dist"}; dist = normierte
Editierdistanz der Laute (0 = identisch, ab ca. 0.5 meist falsch/genuschelt).
"""
import itertools
import json
import re
import sys
import warnings

warnings.filterwarnings("ignore")

import librosa  # noqa: E402
import torch  # noqa: E402
from huggingface_hub import hf_hub_download  # noqa: E402
from transformers import Wav2Vec2FeatureExtractor, Wav2Vec2ForCTC  # noqa: E402
from transformers.utils import logging  # noqa: E402

logging.disable_progress_bar()
logging.set_verbosity_error()
NAME = "facebook/wav2vec2-lv-60-espeak-cv-ft"

# Ähnliche Laute zusammenfassen, damit nur echte Fehler zählen
FOLD = [("ɔɨ", "Y"), ("ɔø", "Y"), ("ɔʏ", "Y"), ("aɪ", "I"), ("aʊ", "U"), ("tʃ", "C"), ("ts", "Z"),
        ("ɜ", "ə"), ("ɐ", "ə"), ("ɚ", "ə"), ("ʌ", "a"), ("ɑ", "a"), ("ɾ", "r"), ("ʁ", "r"), ("ɹ", "r"),
        ("ɪ", "i"), ("ʊ", "u"), ("ʏ", "y"), ("ɛ", "e"), ("ɔ", "o"), ("œ", "ø"), ("ɡ", "g"), ("ç", "x"), ("ɕ", "x"),
        ("d", "t"), ("b", "p"), ("g", "k"), ("z", "s"), ("v", "f"), ("ʒ", "ʃ"), ("ʉ", "u")]


def norm(s):
    s = re.sub(r"[ˈˌːˑ.,!?;:\-\s'’]", "", s)
    for a, b in FOLD:
        s = s.replace(a, b)
    return s


def dist(a, b):
    a, b = norm(a), norm(b)
    if not a:
        return 0.0
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1] / max(len(a), 1)


def ratio(expected, heard):
    """Verhältnis gehörter zu erwarteten Lauten; deutlich > 1 = angehängtes Gebrabbel."""
    return len(norm(heard)) / max(len(norm(expected)), 1)


class Recognizer:
    def __init__(self, device):
        self.device = device
        self.fe = Wav2Vec2FeatureExtractor.from_pretrained(NAME)
        self.asr = Wav2Vec2ForCTC.from_pretrained(NAME).eval().to(device)
        self.inv = {v: k for k, v in json.load(open(hf_hub_download(NAME, "vocab.json"), encoding="utf-8")).items()}

    def heard(self, y, sr):
        if sr != 16000:
            y = librosa.resample(y, orig_sr=sr, target_sr=16000)
        with torch.inference_mode():
            x = self.fe(y, sampling_rate=16000, return_tensors="pt").input_values.to(self.device)
            ids = self.asr(x).logits.argmax(-1)[0].tolist()
        return "".join(t for t in (self.inv[i] for i, _ in itertools.groupby(ids)) if not t.startswith("<"))


def main():
    jobs = json.load(open(sys.argv[1], encoding="utf-8"))
    rec = Recognizer("cuda" if torch.cuda.is_available() else "cpu")
    for job in jobs:
        y, _ = librosa.load(job["file"], sr=16000)
        heard = rec.heard(y, 16000)
        print(json.dumps({"key": job["key"], "heard": heard, "dist": round(dist(job["expected"], heard), 3),
                          "ratio": round(ratio(job["expected"], heard), 2)}, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
