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


VOWELS = set("aeiouyøəIUY")
FRAME = 0.02  # wav2vec2: 320 Samples bei 16 kHz


def tail_cut(expected, tokens, total):
    """Findet angehängte Wortschnipsel: gleicht die erwarteten mit den gehörten Lauten ab.
    Liegt nach dem letzten zum Text passenden Laut noch eine Silbe, wird die Schnittzeit
    (Sekunden) und der Schnipsel zurückgegeben, sonst (None, "")."""
    exp = norm(expected)
    rec = [(ch, e) for tok, _s, e in tokens for ch in norm(tok)]
    n, m = len(exp), len(rec)
    if n < 4 or m <= n * 0.6:
        return None, ""
    d = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        d[i][0] = i
    for j in range(m + 1):
        d[0][j] = j
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (exp[i - 1] != rec[j - 1][0]))
    row = d[n]
    # 1) Letzter gehörter Laut, der in der besten Gesamtzuordnung einem erwarteten Laut entspricht
    i, j, last = n, m, None
    while i > 0 and j > 0:
        if d[i][j] == d[i - 1][j - 1] + (exp[i - 1] != rec[j - 1][0]):
            last = j - 1 if last is None else last
            i, j = i - 1, j - 1
        elif d[i][j] == d[i][j - 1] + 1:
            j -= 1
        else:
            i -= 1
    # 2) Echo des letzten Wortes („fettig … effig“): Ein früheres Ende deckt den Text genauso gut ab,
    #    und der Rest danach wäre fast nur Zusatzlaut. Nur dann gilt das frühere Ende.
    best = min(row[1:])
    early = next(j for j in range(1, m + 1) if row[j] <= best)
    if (last is None or early - 1 < last) and row[m] - best >= 0.6 * (m - early) and m - early >= 3:
        last = early - 1
    if last is None:
        return None, ""
    tail = "".join(ch for ch, _ in rec[last + 1:])
    cut = (rec[last][1] + 1) * FRAME + 0.12
    if len(tail) >= 2 and any(ch in VOWELS for ch in tail) and total - cut >= 0.15 and cut > total * 0.5:
        return round(cut, 2), tail
    return None, ""


class Recognizer:
    def __init__(self, device):
        self.device = device
        self.fe = Wav2Vec2FeatureExtractor.from_pretrained(NAME)
        self.asr = Wav2Vec2ForCTC.from_pretrained(NAME).eval().to(device)
        self.inv = {v: k for k, v in json.load(open(hf_hub_download(NAME, "vocab.json"), encoding="utf-8")).items()}

    def tokens(self, y, sr):
        """Gehörte Laute mit Start-/End-Frame."""
        if sr != 16000:
            y = librosa.resample(y, orig_sr=sr, target_sr=16000)
        with torch.inference_mode():
            x = self.fe(y, sampling_rate=16000, return_tensors="pt").input_values.to(self.device)
            ids = self.asr(x).logits.argmax(-1)[0].tolist()
        out, pos = [], 0
        for i, grp in itertools.groupby(ids):
            k = len(list(grp))
            t = self.inv[i]
            if not t.startswith("<"):
                out.append((t, pos, pos + k - 1))
            pos += k
        return out

    def heard(self, y, sr):
        return "".join(t for t, _, _ in self.tokens(y, sr))


def main():
    jobs = json.load(open(sys.argv[1], encoding="utf-8"))
    rec = Recognizer("cuda" if torch.cuda.is_available() else "cpu")
    for job in jobs:
        y, _ = librosa.load(job["file"], sr=16000)
        toks = rec.tokens(y, 16000)
        heard = "".join(t for t, _, _ in toks)
        cut, tail = tail_cut(job["expected"], toks, len(y) / 16000) if job.get("tail") else (None, "")
        print(json.dumps({"key": job["key"], "heard": heard, "dist": round(dist(job["expected"], heard), 3),
                          "ratio": round(ratio(job["expected"], heard), 2), "cut": cut, "tail": tail},
                         ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
