#!/usr/bin/env python3
"""isdal-003 audio mix: narration (Kokoro wavs) + cold Nordic score + dossier foley.
Reads timeline.json + events.json + vo/*.wav -> out/mix.wav (48k stereo).
Style: ice-dossier — low drones, wind bed, sparse piano motif, print foley. Restrained.
"""
import json, os, sys
import numpy as np
import soundfile as sf

BASE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB', os.path.abspath(os.path.join(BASE, '..', '..', '..')))
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
import sfx

SR = 48000
tl = json.load(open(f'{BASE}/timeline.json'))
lines = json.load(open(f'{BASE}/lines.json'))
dur_tl = tl['dur']
N = int(round(dur_tl * SR)) + SR
mix = np.zeros((N, 2), dtype=np.float32)
rng = np.random.default_rng(11)

def t_(d): return np.arange(int(round(d * SR))) / SR

# ---------------- 1. VOICE ----------------
vo_gain = 0.88
for sc in tl['scenes']:
    for row in sc['lines']:
        wav, sr = sf.read(f"{BASE}/vo/{row['id']}.wav", dtype='float64')
        if wav.ndim > 1: wav = wav.mean(axis=1)
        if sr != SR:
            g = np.interp(np.arange(0, len(wav), sr / SR), np.arange(len(wav)), wav)
        else:
            g = wav
        g = sfx.compress(g, thr=0.22, ratio=3.2)
        at = int(row['t0'] * SR)
        end = min(N, at + len(g))
        if end > at:
            mix[at:end, 0] += g[:end - at] * vo_gain
            mix[at:end, 1] += g[:end - at] * vo_gain

from scipy.ndimage import uniform_filter1d
k = int(0.05 * SR)
voice_env = uniform_filter1d(np.abs(mix[:, 0]), size=k)
voice_env = np.clip(voice_env / 0.05, 0, 1)
duck = (1 - 0.60 * voice_env).astype(np.float32)
del voice_env

# ---------------- 2. SCORE ----------------
def wind(d, v=1.0):
    n = int(round(d * SR))
    x = rng.standard_normal(n).astype(np.float32)
    if hasattr(sfx, 'bp'): x = sfx.bp(x, 180, 900)
    tt = t_(d)
    lfo1 = 0.55 + 0.45 * np.sin(2 * np.pi * 0.037 * tt + 1.3)
    lfo2 = 0.75 + 0.25 * np.sin(2 * np.pi * 0.011 * tt)
    x = x * lfo1 * lfo2 * 0.5 * v
    x[:int(2.0 * SR)] *= np.linspace(0, 1, int(2.0 * SR))
    x[-int(2.0 * SR):] *= np.linspace(1, 0, int(2.0 * SR))
    return x

def drone(d, f0=49, bright=0.35, v=1.0):
    tt = t_(d)
    lfo = 0.5 + 0.5 * np.sin(2 * np.pi * 0.043 * tt + 0.7)
    x = (np.sin(2 * np.pi * f0 * tt) * 0.5
         + np.sin(2 * np.pi * f0 * 1.5 * tt + 0.4) * 0.20
         + np.sin(2 * np.pi * f0 * 2 * tt + 1.1) * 0.13 * bright
         + np.sin(2 * np.pi * f0 * 2.997 * tt) * 0.06 * bright)
    x = x * (0.75 + 0.25 * lfo) * v
    x[:int(1.5 * SR)] *= np.linspace(0, 1, int(1.5 * SR))
    x[-int(1.5 * SR):] *= np.linspace(1, 0, int(1.5 * SR))
    return x

def pulse(d, bpm=54, v=1.0):
    n = int(round(d * SR)); x = np.zeros(n)
    beat = 60 / bpm
    tt = 0.0; i = 0
    while tt < d - 0.1:
        if i % 2 == 0:
            th = sfx.thump(v=1.0, f=52)
            a = int(tt * SR); e = min(n, a + len(th))
            if e > a: x[a:e] += th[:e - a]
        i += 1; tt += beat
    return x * v

def tick(d, v=1.0, step=0.8):
    n = int(round(d * SR)); x = np.zeros(n)
    tt = 0.0
    while tt < d - 0.05:
        c = sfx.click(pitch=0.42, v=0.32)
        a = int(tt * SR); e = min(n, a + len(c))
        if e > a: x[a:e] += c[:e - a] * v
        tt += step
    return x

def bell(d, f=740, v=1.0):
    tt = t_(d)
    x = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 2.0) * 0.55
    x += np.sin(2 * np.pi * f * 2.01 * tt) * np.exp(-tt * 2.8) * 0.22
    x += np.sin(2 * np.pi * f * 2.99 * tt) * np.exp(-tt * 3.6) * 0.10
    return x * v

def piano_note(f, d=3.0, v=1.0):
    tt = t_(d)
    x = (np.sin(2 * np.pi * f * tt) * np.exp(-tt * 1.6)
         + 0.4 * np.sin(2 * np.pi * f * 2 * tt) * np.exp(-tt * 2.2)
         + 0.18 * np.sin(2 * np.pi * f * 3.01 * tt) * np.exp(-tt * 2.8))
    return (x * v * 0.5).astype(np.float32)

SECTION = {
    'S1': (49, .9, 0, 0), 'S2': (55, .6, .5, 0),
    'S3': (49, .8, 0, 0), 'S4': (55, .55, .45, .3), 'S5': (46, .5, .4, .5),
    'S6': (55, .5, .45, .35), 'S7': (58, .5, .4, .3), 'S8': (52, .45, .4, .4), 'S9': (49, .5, .4, .5),
    'S10': (55, .5, .45, .3), 'S11': (46, .6, 0, 0),
    'S12': (49, .5, .45, .3), 'S13': (46, .5, .5, .4), 'S14': (44, .55, .45, .5),
    'S15': (55, .5, .4, .25), 'S16': (58, .45, .4, .25),
    'S17': (49, .55, .35, .3), 'S18': (44, .85, 0, 0),
}
sc_of = {sc['id']: sc for sc in tl['scenes']}
for sid, sc in sc_of.items():
    d = sc['t1'] - sc['t0']
    a = int(sc['t0'] * SR); b = min(N, int(sc['t1'] * SR))
    if b <= a: continue
    f0, wv, pv, tv = SECTION.get(sid, (49, .5, .4, .3))
    seg_len = (b - a) / SR
    dd = np.zeros((b - a, 2), dtype=np.float32)
    dr = drone(seg_len, f0=f0, bright=0.35, v=0.16)
    dd[:, 0] += dr * 0.9; dd[:, 1] += dr * 1.1
    wn = wind(seg_len, v=wv * 0.11)
    dd[:, 0] += wn * 0.85; dd[:, 1] += wn * 1.1
    if pv > 0:
        p = pulse(seg_len, bpm=54, v=pv * 0.30)
        dd[:, 0] += p * 0.9; dd[:, 1] += p * 0.9
    if tv > 0:
        tk = tick(seg_len, v=tv * 0.5)
        dd[:, 0] += tk * 0.5; dd[:, 1] += tk * 0.62
    mix[a:b] += dd[:b - a]

BEATS = [(3.2, 293.66), (30.0, 220.0), (98.0, 246.94), (236.0, 293.66),
         (465.0, 220.0), (508.0, 246.94), (600.0, 207.65), (690.0, 293.66), (748.0, 261.63), (820.0, 220.0)]
for (bt, f) in BEATS:
    a = int(bt * SR)
    xa = piano_note(f, 3.2, v=0.30); xb = piano_note(f * 1.5, 2.6, v=0.12)
    x = xa.copy(); x[:len(xb)] += xb
    e = min(N, a + len(x))
    if e > a:
        mix[a:e, 0] += x[:e - a] * 0.9
        mix[a:e, 1] += x[:e - a] * 1.05
for bt, f in [(460.6, 392.0), (802.3, 311.13)]:
    a = int(bt * SR); x = bell(4.0, f=f, v=0.16)
    e = min(N, a + len(x))
    if e > a: mix[a:e, 0] += x[:e - a] * 0.8; mix[a:e, 1] += x[:e - a]

# ---------------- 3. FOLEY (events.json) ----------------
try:
    ev = json.load(open(f'{BASE}/events.json'))['ev']
except Exception:
    ev = []
for e in ev:
    a = int(e['t'] * SR)
    if e['type'] == 'stamp':
        th = sfx.thump(v=0.9, f=120); cl = sfx.click(pitch=0.7, v=0.5)
        n = max(len(th), len(cl))
        s = np.zeros(n, dtype=np.float32)
        s[:len(th)] += th * 0.5; s[:len(cl)] += cl * 0.4
    elif e['type'] == 'thud':
        s = sfx.thump(v=1.0, f=70) * 0.55
    else:
        n = int(0.5 * SR)
        tt = np.arange(n) / SR
        s = sfx.whoosh(v=0.6) if hasattr(sfx, 'whoosh') else (rng.standard_normal(n) * np.exp(-((tt - .2) ** 2) / .02) * .3).astype(np.float32)
        s = s * 0.4
    ed = min(N, a + len(s))
    if ed > a:
        mix[a:ed, 0] += s[:ed - a] * 0.8
        mix[a:ed, 1] += s[:ed - a] * 0.8

# ---------------- 4. DUCK + MASTER ----------------
mix *= duck[:, None]
peak = np.abs(mix).max()
if peak > 0: mix = mix / peak * 0.72
fi = int(0.4 * SR); fo = int(1.2 * SR)
mix[:fi] *= np.linspace(0, 1, fi)[:, None]
mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
os.makedirs(f'{BASE}/out', exist_ok=True)
sf.write(f'{BASE}/out/mix.wav', mix, SR)
print(f'mix.wav written: {len(mix)/SR:.1f}s')
