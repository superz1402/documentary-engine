#!/usr/bin/env python3
"""Generate timeline.json / timeline.js / SRT / chapters for video-003-isdal."""
import json, os

BASE = os.path.dirname(os.path.abspath(__file__))
lines = json.load(open(f'{BASE}/lines.json', encoding='utf-8'))
dur = json.load(open(f'{BASE}/vo/dur.json'))

LEAD = {'S1': 2.8, 'S2': 1.6, 'S11': 1.8, 'S12': 1.8, 'S13': 1.8, 'S14': 1.8, 'S18': 2.2}
DEFLT_LEAD = 1.3
GAP = 0.42
TAIL = 1.1
TAILS = {'S2': 2.2, 'S11': 2.4, 'S12': 1.6, 'S13': 1.6, 'S14': 2.0, 'S17': 2.0, 'S18': 6.5}

SCENE_ORDER = ['S1','S2','S3','S4','S5','S6','S7','S8','S9','S10','S11','S12','S13','S14','S15','S16','S17','S18']
SCENE_TITLE = {
 'S1':('COLD OPEN','THE WOMAN WITHOUT A NAME'), 'S2':('FILE 003','CASE 134/70'),
 'S3':'NOVEMBER 29', 'S4':'THE VALLEY FLOOR', 'S5':'WHAT THE BODY SAID',
 'S6':'THE SUITCASES', 'S7':'ROOM 407', 'S8':'THE ALIASES', 'S9':'THE NOTEBOOK',
 'S10':'THE TRAVEL TRAIL', 'S11':'THE VERDICT OF 1971', 'S12':'THEORY — SUICIDE',
 'S13':'THEORY — A SECOND PERSON', 'S14':'THEORY — ESPIONAGE', 'S15':'THE REOPENING',
 'S16':'THE SCIENCE', 'S17':'WHAT REMAINS UNKNOWN', 'S18':'CLOSE',
}
CHIPS = {'S1':'COLD OPEN','S2':'FILE 003','S3':'EXHIBIT A','S4':'EXHIBIT A','S5':'EXHIBIT A',
         'S6':'EXHIBIT B','S7':'EXHIBIT B','S8':'EXHIBIT B','S9':'EXHIBIT C','S10':'EXHIBIT C',
         'S11':'FILE 134/70','S12':'THEORIES','S13':'THEORIES','S14':'THEORIES',
         'S15':'REOPENED','S16':'REOPENED','S17':'VERDICT','S18':'CLOSE'}
SCENE_TITLE = {k: (CHIPS[k], v[1] if isinstance(v, tuple) else v) for k, v in SCENE_TITLE.items()}

t = 0.0
scenes = []
by_scene = {}
for L in lines:
    by_scene.setdefault(L['scene'], []).append(L)
for sid in SCENE_ORDER:
    sl = by_scene.get(sid)
    if not sl: continue
    lead = LEAD.get(sid, DEFLT_LEAD)
    s0 = t + (0.6 if sid == 'S1' else 0)
    t = s0 + lead
    rows = []
    for i, L in enumerate(sl):
        lt0 = t
        lt1 = lt0 + dur[L['id']]
        rows.append({'id': L['id'], 't0': round(lt0, 3), 't1': round(lt1, 3)})
        t = lt1 + (GAP if i < len(sl) - 1 else TAILS.get(sid, TAIL))
    scenes.append({'id': sid, 't0': round(s0, 3), 't1': 0.0, 'lines': rows,
                   'chip': SCENE_TITLE[sid][0], 'title': SCENE_TITLE[sid][1]})
for sc in scenes:
    sc['t1'] = round(sc['lines'][-1]['t1'] + TAILS.get(sc['id'], TAIL), 3)
DUR = round(scenes[-1]['t1'], 3)

words = json.load(open(f'{BASE}/vo/words.json'))
cues = []
for L in lines:
    text = L['text']; ws = words[L['id']]
    toks = text.split()
    if len(toks) != len(ws):
        ws = [[w[0], i * (dur[L['id']] / len(toks)), (i + 1) * (dur[L['id']] / len(toks))] for i, w in enumerate(ws)]
        if len(toks) != len(ws):
            ws = [[t_, i * (dur[L['id']] / len(toks)), (i + 1) * (dur[L['id']] / len(toks))] for i, t_ in enumerate(toks)]
    chunks, cur = [], []
    for i, w in enumerate(toks):
        cur.append(i)
        joined = ' '.join(toks[j] for j in cur)
        endp = w.rstrip('"”').endswith(('.', '!', '?', '—', ':'))
        if endp and len(joined) > 46 or len(joined) > 88:
            chunks.append(cur); cur = []
    if cur: chunks.append(cur)
    merged = []
    for c in chunks:
        if merged and len(' '.join(toks[j] for j in c)) < 18:
            merged[-1] += c
        else:
            merged.append(c)
    lt0 = next(r for sc in scenes for r in sc['lines'] if r['id'] == L['id'])['t0']
    for c in merged:
        w0 = ws[c[0]][1]; w1 = ws[c[-1]][2]
        cues.append({'t0': round(max(0, lt0 + w0 - 0.10), 2), 't1': 0.0,
                     'text': ' '.join(toks[j] for j in c), 'line': L['id']})
for i, c in enumerate(cues):
    c['t1'] = round(max(c['t1'], c['t0'] + 1.25), 2)
    if i + 1 < len(cues):
        c['t1'] = round(min(c['t1'], max(cues[i + 1]['t0'] - 0.02, c['t0'] + 1.25)), 2)
page_cues = [{'t0': c['t0'], 't1': c['t1'], 'text': c['text'].upper()} for c in cues]

tl = {'dur': DUR, 'scenes': scenes, 'cues': page_cues}
json.dump(tl, open(f'{BASE}/timeline.json', 'w'), ensure_ascii=False, indent=1)
with open(f'{BASE}/timeline.js', 'w') as f:
    f.write('const TL=' + json.dumps(tl, ensure_ascii=False, separators=(',', ':')) + ';')

def ts(x):
    h = int(x // 3600); m = int(x % 3600 // 60); s = int(x % 60); ms = int(round((x - int(x)) * 1000))
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'
srt = []
for i, c in enumerate(cues, 1):
    srt.append(f"{i}\n{ts(c['t0'])} --> {ts(c['t1'])}\n{c['text']}\n")
open(f'{BASE}/isdal-003.srt', 'w').write('\n'.join(srt))

CH = [('The Woman Without a Name', ['S1']), ('Case 134/70', ['S2']),
      ('Discovery: November 29', ['S3', 'S4']), ('What the Body Said', ['S5']),
      ('The Suitcases', ['S6']), ('Room 407', ['S7']),
      ('Eight False Names', ['S8']), ('The Notebook', ['S9', 'S10']),
      ('The Verdict of 1971', ['S11']), ('The Theories', ['S12', 'S13', 'S14']),
      ('Reopened: The Science', ['S15', 'S16']), ('What Remains Unknown', ['S17', 'S18'])]
scene_t0 = {sc['id']: sc['t0'] for sc in scenes}
ch_lines = []
for title, sids in CH:
    t0 = scene_t0[sids[0]]
    m, s = int(t0 // 60), int(t0 % 60)
    ch_lines.append(f'{m}:{s:02d} {title}')
open(f'{BASE}/chapters.txt', 'w').write('\n'.join(ch_lines) + '\n')

speech = sum(dur.values())
print(f'DUR={DUR}s = {DUR/60:.2f} min | speech {speech:.0f}s | cues {len(cues)} | scenes {len(scenes)}')
