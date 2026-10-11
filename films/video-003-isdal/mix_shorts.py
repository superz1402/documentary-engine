#!/usr/bin/env python3
"""Mix audio for the 4 vertical shorts: voice + cold bed + soft duck -> out/shorts_<X>.wav"""
import json, os, sys
import numpy as np
import soundfile as sf

BASE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB', os.path.abspath(os.path.join(BASE, '..', '..', '..')))
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
import sfx

SR = 48000
data = json.loads(open(f'{BASE}/shorts_data.js').read().split('=', 1)[1].rstrip(';').strip())
rng = np.random.default_rng(5)

def wind(d, v=1.0):
    n = int(round(d * SR))
    x = rng.standard_normal(n).astype(np.float32)
    if hasattr(sfx, 'bp'): x = sfx.bp(x, 160, 800)
    tt = np.arange(n) / SR
    lfo = 0.6 + 0.4 * np.sin(2 * np.pi * 0.05 * tt + 1.1)
    x = x * lfo * 0.5 * v
    x[:int(1.0*SR)] *= np.linspace(0, 1, int(1.0*SR)); x[-int(1.0*SR):] *= np.linspace(1, 0, int(1.0*SR))
    return x

def drone(d, f0=49, v=1.0):
    tt = np.arange(int(round(d*SR))) / SR
    x = (np.sin(2*np.pi*f0*tt)*0.5 + np.sin(2*np.pi*f0*1.5*tt+0.4)*0.2 + np.sin(2*np.pi*f0*2*tt)*0.12)
    x = x * 0.8 * v
    x[:int(1.0*SR)] *= np.linspace(0,1,int(1.0*SR)); x[-int(1.0*SR):] *= np.linspace(1,0,int(1.0*SR))
    return x

for which in ['A', 'B', 'C', 'D']:
    D = data[which]
    N = int(round(D['dur'] * SR)) + SR
    mix = np.zeros((N, 2), dtype=np.float32)
    for row in D['lines']:
        wav, sr = sf.read(f"{BASE}/vo_shorts/{row['id']}.wav", dtype='float64')
        if wav.ndim > 1: wav = wav.mean(axis=1)
        if sr != SR:
            g = np.interp(np.arange(0, len(wav), sr/SR), np.arange(len(wav)), wav)
        else: g = wav
        g = sfx.compress(g, thr=0.22, ratio=3.2) * 0.9
        a = int(row['t0']*SR); e = min(N, a+len(g))
        mix[a:e, 0] += g[:e-a]; mix[a:e, 1] += g[:e-a]
    from scipy.ndimage import uniform_filter1d
    env = uniform_filter1d(np.abs(mix[:,0]), size=int(.05*SR))
    duck = (1 - 0.55*np.clip(env/.05, 0, 1)).astype(np.float32)
    d = N / SR
    bed = drone(d, 49, .14)[:, None] * np.array([0.9, 1.1], dtype=np.float32) + wind(d, .10)[:, None] * np.array([0.85, 1.1], dtype=np.float32)
    mix += bed[:N] * duck[:, None]
    peak = np.abs(mix).max()
    if peak > 0: mix = mix / peak * 0.72
    fi = int(.3*SR); fo = int(.8*SR)
    mix[:fi] *= np.linspace(0,1,fi)[:,None]; mix[-fo:] *= np.linspace(1,0,fo)[:,None]
    sf.write(f'{BASE}/out/shorts_{which}.wav', mix, SR)
    print(f'shorts_{which}.wav {len(mix)/SR:.1f}s')
