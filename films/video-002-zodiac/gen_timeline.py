#!/usr/bin/env python3
"""Generate timeline.json / timeline.js / cues.json / chapters.txt for zodiac-002."""
import json, os

BASE = os.path.dirname(os.path.abspath(__file__))
lines = json.load(open(f'{BASE}/lines.json', encoding='utf-8'))
dur = json.load(open(f'{BASE}/vo/dur.json'))

LEAD = {'S1': 2.6}          # scene lead-in before first voice
DEFLT_LEAD = 1.3
GAP = 0.42                   # gap between lines within a scene
TAIL = 1.1                   # tail after last line of scene
TAILS = {'S24': 6.0}

SCENE_ORDER = ['S1','S2','S3','S4','S5','S6','S7','S8','S9','S10','S11','S12','S13','S14','S15','S16','S17','S18','S19','S21','S22','S23','S24']
SCENE_TITLE = {
 'S1':('COLD OPEN','THE LETTERS ARRIVE'), 'S2':('FILE 002','THE QUESTION'),
 'S3':('EXHIBIT A','THE ATTACKS'), 'S4':('EXHIBIT A','TOLL & CLAIMS'),
 'S5':('EXHIBIT B','THE LETTERS'), 'S6':('EXHIBIT B','PROOF & THREATS'),
 'S7':('EXHIBIT C','INSIDE THE 408'), 'S8':('EXHIBIT C','DECODED 1969'),
 'S9':('EXHIBIT D','THE 340'), 'S10':('EXHIBIT D','THE SOLVERS'),
 'S11':('EXHIBIT D','HOW IT BROKE'), 'S12':('EXHIBIT D','WHAT IT SAID'),
 'S13':('EXHIBIT D','WHY NO NAME'), 'S14':('EXHIBIT E','Z-13'),
 'S15':('EXHIBIT E','Z-32'), 'S16':('EXHIBIT F','THE SUSPECTS'),
 'S17':('EXHIBIT F','2021 REJECTED'), 'S18':('EXHIBIT G','ERA LIMITS'),
 'S19':('EXHIBIT G','EVIDENCE & BIAS'), 'S21':('VERDICT','EVIDENCE AUDIT'),
 'S22':('VERDICT','THE ANSWER'), 'S23':('CLOSE','CASE STATUS'),
 'S24':('END','SOURCES'),
}

# --- pass 1: place lines sequentially ---
t = 0.0
scenes = []      # {id, t0, t1, lines:[{id,t0,t1}]}
by_scene = {}
for L in lines:
    by_scene.setdefault(L['scene'], []).append(L)
for sid in SCENE_ORDER:
    sl = by_scene.get(sid)
    if not sl: continue
    lead = LEAD.get(sid, DEFLT_LEAD)
    s0 = t + (0.6 if sid == 'S1' else 0)  # small breath at very start
    t = s0 + lead
    rows = []
    for i, L in enumerate(sl):
        lt0 = t
        lt1 = lt0 + dur[L['id']]
        rows.append({'id': L['id'], 't0': round(lt0, 3), 't1': round(lt1, 3)})
        t = lt1 + (GAP if i < len(sl) - 1 else TAILS.get(sid, TAIL))
    scenes.append({'id': sid, 't0': round(s0, 3), 't1': round(t - (TAILS.get(sid, TAIL) - TAILS.get(sid, TAIL)), 3),
                   'lines': rows, 'chip': SCENE_TITLE[sid][0], 'title': SCENE_TITLE[sid][1]})
# fix t1 to include tail
for sc in scenes:
    sc['t1'] = round(sc['lines'][-1]['t1'] + TAILS.get(sc['id'], TAIL), 3)
DUR = round(scenes[-1]['t1'], 3)

# --- subtitles: chunk lines by sentences, timed by word stamps ---
words = json.load(open(f'{BASE}/vo/words.json'))
cues = []
for L in lines:
    text = L['text']; ws = words[L['id']]
    toks = text.split()
    if len(toks) != len(ws):
        ws = [w for w in ws]  # trust word count; else fall back to proportional
        if len(toks) != len(ws):
            ws = [[t_, i * (dur[L['id']] / len(toks)), (i + 1) * (dur[L['id']] / len(toks))] for i, t_ in enumerate(toks)]
    # split points: after . ! ? — and keep chunks <= 88 chars
    chunks, cur = [], []
    for i, w in enumerate(toks):
        cur.append(i)
        joined = ' '.join(toks[j] for j in cur)
        endp = w.rstrip('"”').endswith(('.', '!', '?', '—', ':'))
        if endp and len(joined) > 46 or len(joined) > 88:
            chunks.append(cur); cur = []
    if cur: chunks.append(cur)
    # too-small chunk merge
    merged = []
    for c in chunks:
        if merged and len(' '.join(toks[j] for j in c)) < 18:
            merged[-1] += c
        else:
            merged.append(c)
    for c in merged:
        w0 = ws[c[0]][1]; w1 = ws[c[-1]][2]
        ct0 = L_t0 = next(r for sc in scenes for r in sc['lines'] if r['id'] == L['id'])['t0']
        t0 = ct0 + w0 - 0.10
        t1 = ct0 + w1 + 0.34
        cues.append({'t0': round(max(0, t0), 2), 't1': round(t1, 2), 'text': ' '.join(toks[j] for j in c), 'line': L['id']})
# enforce min duration + no overlap
for i, c in enumerate(cues):
    c['t1'] = max(c['t1'], c['t0'] + 1.25)
    if i + 1 < len(cues):
        c['t1'] = min(c['t1'], max(cues[i + 1]['t0'] - 0.02, c['t0'] + 1.25))
# page cues (caps for the caption bar look)
page_cues = [{'t0': c['t0'], 't1': c['t1'], 'text': c['text'].upper()} for c in cues]

tl = {'dur': DUR, 'scenes': scenes, 'cues': page_cues}
json.dump(tl, open(f'{BASE}/timeline.json', 'w'), ensure_ascii=False, indent=1)
with open(f'{BASE}/timeline.js', 'w') as f:
    f.write('const TL=' + json.dumps(tl, ensure_ascii=False, separators=(',', ':')) + ';')

# SRT
def ts(x):
    h = int(x // 3600); m = int(x % 3600 // 60); s = int(x % 60); ms = int(round((x - int(x)) * 1000))
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'
srt = []
for i, c in enumerate(cues, 1):
    srt.append(f"{i}\n{ts(c['t0'])} --> {ts(c['t1'])}\n{c['text']}\n")
open(f'{BASE}/zodiac-002.srt', 'w').write('\n'.join(srt))

# chapters (10)
CH = [('The Letters Arrive', ['S1']), ('The Attacks: 1968–1969', ['S3', 'S4']),
      ('"This Is the Zodiac Speaking"', ['S5', 'S6']), ('The 408 Cipher: Solved in 1969', ['S7', 'S8']),
      ('The 340 Cipher: 51 Years Unsolved', ['S9', 'S10']), ('How the 340 Was Broken', ['S11', 'S12', 'S13']),
      ('The Unsolved Short Ciphers', ['S14', 'S15']), ('The Suspects', ['S16', 'S17']),
      ('Why the Case Still Fails', ['S18', 'S19']), ('What the Evidence Proves', ['S21', 'S22', 'S23', 'S24'])]
scene_t0 = {sc['id']: sc['t0'] for sc in scenes}
ch_lines = []
for title, sids in CH:
    t0 = scene_t0[sids[0]]
    m, s = int(t0 // 60), int(t0 % 60)
    ch_lines.append(f'{m}:{s:02d} {title}')
open(f'{BASE}/chapters.txt', 'w').write('\n'.join(ch_lines) + '\n')

speech = sum(dur.values())
print(f'DUR={DUR}s = {DUR/60:.2f} min | speech {speech:.0f}s | cues {len(cues)} | scenes {len(scenes)}')
for sc in scenes: print(f"  {sc['id']}  {sc['t0']:7.2f} → {sc['t1']:7.2f}  {sc['chip']}/{sc['title']}")
