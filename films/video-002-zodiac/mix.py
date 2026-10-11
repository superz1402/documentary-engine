#!/usr/bin/env python3
"""zodiac-002 audio mix: narration (Kokoro wavs) + restrained documentary score + print foley.
Reads timeline.json + events.json (from core/render/events.mjs) + vo/*.wav -> out/mix.wav (48k stereo).
Style: halftone-dossier palette — dry, deadpan, print-shop foley, drones and sparse pulses.
"""
import json, os, sys
import numpy as np
import soundfile as sf

BASE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB', os.path.abspath(os.path.join(BASE, '..', '..')))
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
import sfx  # core helpers: noise, bp, lp, hp, thump, click, whoosh, add, compress, limit, env_exp, norm

SR = 48000
tl = json.load(open(f'{BASE}/timeline.json'))
lines = json.load(open(f'{BASE}/lines.json'))
dur_tl = tl['dur']
N = int(round(dur_tl * SR)) + SR  # 1 s tail pad
mix = np.zeros((N, 2), dtype=np.float32)

rng = np.random.default_rng(7)

def t_(d): return np.arange(int(round(d * SR))) / SR

# ---------------- 1. VOICE ----------------
vo_gain = 0.88
line_by_id = {L['id']: L for L in lines}
for sc in tl['scenes']:
    for row in sc['lines']:
        wav, sr = sf.read(f"{BASE}/vo/{row['id']}.wav", dtype='float64')
        if wav.ndim > 1: wav = wav.mean(axis=1)
        if sr != SR:
            g = np.interp(np.arange(0, len(wav), sr / SR), np.arange(len(wav)), wav)
        else:
            g = wav
        # gentle voice compression + presence
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
duck = (1 - 0.62 * voice_env).astype(np.float32)  # music ducks up to -8.4 dB under narration
del voice_env

# ---------------- 2. SCORE ----------------
def drone(d, f0=55, bright=0.5, v=1.0):
    tt = t_(d)
    lfo = 0.5 + 0.5 * np.sin(2 * np.pi * 0.05 * tt + 1.0)
    x = (np.sin(2 * np.pi * f0 * tt) * 0.5
         + np.sin(2 * np.pi * f0 * 1.5 * tt + 0.5) * 0.22
         + np.sin(2 * np.pi * f0 * 2 * tt + 1.1) * 0.16 * bright
         + np.sin(2 * np.pi * f0 * 3.001 * tt) * 0.07 * bright)
    swell = 0.75 + 0.25 * lfo
    x = x * swell * v
    x[:int(1.2 * SR)] *= np.linspace(0, 1, int(1.2 * SR))
    x[-int(1.2 * SR):] *= np.linspace(1, 0, int(1.2 * SR))
    return x

def pulse(d, bpm=60, v=1.0):
    """sparse sub kick every 2 beats + airy tick"""
    n = int(round(d * SR)); x = np.zeros(n)
    beat = 60 / bpm
    tt = 0.0
    i = 0
    while tt < d - 0.1:
        if i % 2 == 0:
            th = sfx.thump(v=1.0, f=58)
            a = int(tt * SR)
            e = min(n, a + len(th))
            if e > a: x[a:e] += th[:e - a]
        i += 1; tt += beat
    return x * v

def tension_tick(d, v=1.0):
    """quiet typewriter-ish pulse for suspense sections"""
    n = int(round(d * SR)); x = np.zeros(n)
    step = 0.75
    tt = 0.0
    while tt < d - 0.05:
        c = sfx.click(pitch=0.5, v=0.4)
        a = int(tt * SR); e = min(n, a + len(c))
        if e > a: x[a:e] += c[:e - a] * v
        tt += step
    return x

def bell(d, f=880, v=1.0):
    tt = t_(d)
    x = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 2.2) * 0.6
    x += np.sin(2 * np.pi * f * 2.01 * tt) * np.exp(-tt * 3.0) * 0.25
    x += np.sin(2 * np.pi * f * 2.99 * tt) * np.exp(-tt * 4.0) * 0.12
    return x * v

def piano_motif(v=1.0):
    """sparse two-note motif (tritone-adjacent, unresolved)"""
    seq = [(0.0, 220.0, 1.6), (0.9, 311.0, 1.4), (2.1, 220.0, 1.2), (2.7, 185.0, 2.2)]
    d = 6.0; n = int(round(d * SR)); x = np.zeros(n)
    for (st, f, dd) in seq:
        tt = t_(dd)
        tone = (np.sin(2 * np.pi * f * tt) * np.exp(-tt * 1.8) * 0.5
                + np.sin(2 * np.pi * f * 2 * tt) * np.exp(-tt * 2.6) * 0.2)
        a = int(st * SR); e = min(n, a + len(tone))
        x[a:e] += tone[:e - a]
    return x * v

def add(x, at, gain=1.0, pan=0.0):
    sfx.add(mix, x, at, gain=gain, pan=pan)

SC = {s['id']: s for s in tl['scenes']}
T = lambda i: SC[i]['t0']; U = lambda i: SC[i]['t1']

music_level = 0.23
# build music stem separately then duck
music = np.zeros((N, 2), dtype=np.float32)
def madd(x, at, gain=1.0, pan=0.0):
    sfx.add(music, x, at, gain=gain, pan=pan)

# S1 cold open — drone + heartbeat of tension
madd(drone(U('S1') - T('S1') + 1.0, 55, 0.4), T('S1'), music_level)
madd(pulse(U('S1') - T('S1'), 48, 0.5), T('S1'), 0.5)
# S2 file header — drone + motif
madd(drone(U('S2') - T('S2'), 62, 0.5), T('S2'), music_level)
madd(piano_motif(0.8), T('S2') + 2.0, 0.8)
# S3 attacks — darker drone + slow pulse
madd(drone(U('S3') - T('S3'), 49, 0.3), T('S3'), music_level * 1.1)
madd(pulse(U('S3') - T('S3'), 42, 0.55), T('S3') + 1, 0.5)
# S4 toll — still, bell motif
madd(drone(U('S4') - T('S4'), 55, 0.3), T('S4'), music_level)
for i, f in enumerate([330, 392, 440]):
    madd(bell(3.0, f, 0.5), T('S4') + 1.2 + i * 1.9, 0.7, pan=(-0.4 + 0.4 * i))
# S5-S6 letters — process ticks
madd(drone(U('S5') - T('S5'), 58, 0.45), T('S5'), music_level)
madd(tension_tick(U('S5') - T('S5'), 0.6), T('S5') + 2, 0.5)
madd(drone(U('S6') - T('S6'), 52, 0.35), T('S6'), music_level)
# S7-S8 408 — process
madd(drone(U('S7') - T('S7'), 58, 0.5), T('S7'), music_level)
madd(tension_tick(U('S7') - T('S7'), 0.7), T('S7') + 3, 0.55)
madd(drone(U('S8') - T('S8'), 55, 0.4), T('S8'), music_level)
# S9-S13 340 arc — rising then still
madd(drone(U('S9') - T('S9'), 62, 0.6), T('S9'), music_level)
madd(pulse(U('S9') - T('S9'), 50, 0.4), T('S9') + 2, 0.45)
madd(drone(U('S10') - T('S10'), 58, 0.5), T('S10'), music_level)
madd(drone(U('S11') - T('S11'), 60, 0.55), T('S11'), music_level)
madd(tension_tick(U('S11') - T('S11'), 0.5), T('S11') + 4, 0.45)
madd(drone(U('S12') - T('S12'), 49, 0.35), T('S12'), music_level * 1.15)
madd(drone(U('S13') - T('S13'), 55, 0.4), T('S13'), music_level)
# S14-S15 short ciphers — sparse
madd(drone(U('S14') - T('S14'), 58, 0.4), T('S14'), music_level)
madd(drone(U('S15') - T('S15'), 52, 0.35), T('S15'), music_level)
# S16-S17 suspects — low tension
madd(drone(U('S16') - T('S16'), 47, 0.3), T('S16'), music_level * 1.1)
madd(tension_tick(U('S16') - T('S16'), 0.45), T('S16') + 5, 0.4)
madd(drone(U('S17') - T('S17'), 52, 0.4), T('S17'), music_level)
# S18-S19 challenges — still
madd(drone(U('S18') - T('S18'), 55, 0.35), T('S18'), music_level)
madd(drone(U('S19') - T('S19'), 50, 0.35), T('S19'), music_level)
# S21-S23 verdict — return of motif, then silence before final stamp
madd(drone(U('S21') - T('S21'), 58, 0.5), T('S21'), music_level)
madd(piano_motif(0.7), T('S21') + 3.0, 0.75)
madd(drone(U('S22') - T('S22'), 55, 0.45), T('S22'), music_level)
madd(drone(T('S23') + 12.0, 49, 0.3), T('S23'), music_level)  # stops 12s in — silence before the stamp
# S24 end — bell arpeggio
for i, f in enumerate([330, 415, 494, 660]):
    madd(bell(4.0, f, 0.5), T('S24') + 1.2 + i * 1.5, 0.65, pan=(-0.5 + 0.33 * i))

import re as _re
import time as _time; _T0 = _time.time()
def _mem(tag):
    s = open('/proc/self/status').read()
    m = _re.search(r'VmRSS:\s+(\d+) kB', s)
    print(f'[{_time.time()-_T0:.0f}s mem {int(m.group(1))/1024:.0f}MB] {tag}', flush=True)
_mem('start')
print('stage: duck music', flush=True)
music *= duck[:, None]
_mem('after duck'); print('stage: music ducked', flush=True)
mix += music  # in-place, both float32
del music
import gc; gc.collect()

# ---------------- 3. FOLEY from events.json ----------------
ev = json.load(open(f'{BASE}/events.json'))['ev'] if os.path.exists(f'{BASE}/events.json') else []
print('events:', len(ev))
for e in ev:
    t, ty = e['t'], e['type']
    if ty == 'whoosh':
        add(sfx.whoosh(0.5, 1.0), t - 0.2, 0.35)
    elif ty == 'paper':
        d = 0.7; n = int(d * SR)
        x = sfx.bp(sfx.noise(d), 900, 6000) * np.hanning(n) * 0.8
        add(x, t, 0.22)
    elif ty == 'stamp':
        big = e.get('big', 0)
        boom = sfx.thump(v=1.0, f=90 if not big else 70)
        add(boom, t, 0.9 if big else 0.6)
        add(sfx.click(pitch=1.4, v=1.0), t + 0.02, 0.5)
        if big:
            d = 0.25; x = sfx.bp(sfx.noise(d), 1500, 9000) * sfx.env_exp(d, 0.05)
            add(x, t + 0.01, 0.3)
    elif ty == 'pin':
        add(sfx.click(pitch=2.0, v=1.0), t, 0.3)
    elif ty == 'shutter':
        d = 0.12; x = sfx.bp(sfx.noise(d), 2000, 10000) * sfx.env_exp(d, 0.02)
        add(x, t, 0.4)
        add(sfx.click(pitch=1.8, v=1.0), t + 0.05, 0.3)
    elif ty == 'thud':
        add(sfx.thump(v=1.0, f=64), t, 0.8)
    elif ty == 'tick':
        add(sfx.click(pitch=1.1, v=1.0), t, 0.16, pan=rng.uniform(-0.3, 0.3))
    elif ty == 'strike':
        d = 0.3; x = sfx.bp(sfx.noise(d), 1200, 7000) * sfx.env_exp(d, 0.08)
        add(x, t, 0.3)
    elif ty == 'drawer':
        d = 0.8
        x = sfx.bp(sfx.noise(d), 200, 2400) * np.hanning(int(d * SR)) * 0.7
        add(x, t, 0.35)
        add(sfx.thump(v=1.0, f=76), t + 0.65, 0.5)

# typewriter ticks under typewrite scenes (from EV 'type' if any, else synth by lines)
if not any(e['type'] == 'type' for e in ev):
    pass  # kept subtle; process tension_tick covers it

_mem('after foley'); print('stage: foley done', flush=True)
# ---------------- 4. MASTER ----------------
for ch in range(2):
    _mem(f'tanh ch{ch} begin')
    x = mix[:, ch]; n = len(x); B = 8_000_000
    for i in range(0, n, B):
        j = min(n, i + B)
        x[i:j] = np.tanh(x[i:j] * 2.2) / np.tanh(2.2)
    _mem(f'tanh ch{ch} done')
peak = float(np.abs(mix).max())
if peak > 0: mix *= np.float32(0.91 / peak)
# fade out last 1.5 s
fo = int(1.5 * SR)
mix[-fo:] *= np.linspace(1, 0, fo)[:, None].astype(np.float32)
print('stage: write', flush=True)
os.makedirs(f'{BASE}/out', exist_ok=True)
sf.write(f'{BASE}/out/mix.wav', mix, SR)
dur = len(mix) / SR
print(f'mix.wav written: {dur:.1f}s, peak {np.abs(mix).max():.3f}')
