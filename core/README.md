# core/ — the engine library

Everything an agent needs to rebuild any film in this repo from sources, with
no memory of how it was made. All tools are deterministic: same sources in,
same pixels out.

```
core/
  render/    frame renderer + static server + QC stills + foley event export
  audio/     sfx.py — procedural sound design primitives (numpy/scipy)
  tts/       narration synthesis + ASR round-trip QC (scripts only; models not committed)
  stills/    archival image sourcing: Commons search -> license gate -> validated bytes -> ledger
```

## render/ — the picture pipeline

| tool | what it does |
|------|--------------|
| `serve.mjs` | Minimal static server on 127.0.0.1 (ES modules can't run from `file://`). Film dirs outside the repo mount at `/@film/`. |
| `browser.mjs` | Headless Chrome launch args (GPU/ANGLE, color profile). `PLAYWRIGHT_CHROME=/path` overrides the executable. |
| `page.mjs` | Opens a film page, waits for `window.READY`, fails loudly on page errors / missing scripts. `ROOT` = repo root (parent of `core/`). |
| `video.mjs` | Full-film render: N workers, each an independent browser, JPEG screenshots piped to ffmpeg (CRF 14), lossless concat, output lockfile. |
| `range.mjs` | **Chunked resumable renderer for constrained hosts**: render `[start,end)` frames in one process, re-run to resume, concat parts afterwards. Use when a single `video.mjs` run would exceed your shell time limit. |
| `events.mjs` | Exports `window.EV` (foley event table built by the film's `scenes.js`) to `events.json` for the audio mixer. |
| `still.mjs` | QC: renders single frames at given timestamps to JPEG. **Always QC stills before rendering.** |
| `slot.mjs` | Optional global render concurrency via `RENDER_SLOTS` env var. |
| `mux.sh` | Generic muxer: two-pass loudnorm to -14 LUFS / TP -1.2, optional film grain. (Films in this repo ship their own `build.sh` mux step tuned per release.) |

### The page contract (every film engine)

A film folder is a static page (`index.html`) that must define:

```js
window.DUR     // seconds (number > 0)
window.render(t) // paints frame at time t, deterministic, pure function of t
window.EV      // foley events [{t, type}] for mix.py
window.READY   // set true once fonts AND images are loaded (see preload pattern)
```

The renderer screenshots at `t = frame / fps`, so `render(t)` must be a pure
function of `t` — no `Date.now()`, no `Math.random()` without a seeded PRNG
(`R(seed)` helper), no accumulation across frames.

### Rendering a film (two ways)

```sh
# 1. one shot (needs a long-lived shell)
node core/render/video.mjs films/video-003-isdal --fps 24 --workers 2

# 2. resumable chunks (sandbox-safe; each chunk is its own process)
node core/render/range.mjs films/video-003-isdal 0 2500
node core/render/range.mjs films/video-003-isdal 2500 5000
# ... then concat + mux per the film's build.sh
```

### Setup

```sh
npm install            # playwright-core
npx playwright install chromium-headless-shell   # or set PLAYWRIGHT_CHROME
pip install -r requirements.txt
ffmpeg + ffprobe on PATH
```

## audio/sfx.py

Procedural sound primitives (drones, wind, stamps, thuds, paper) used by each
film's `mix.py`. Everything is seeded numpy — the mix is reproducible bit-for-bit.

## Render providers

The engine above is the **primary (`builtin`) provider** — deterministic
`render(t)` pages, film-brand SVG aesthetic. A **secondary, optional
provider** exists for overlay/imagery scene clips (titles, lower thirds,
evidence cards, burned-caption inserts): [Geneva](https://github.com/geneva-render/geneva)
— a single static Rust binary, browserless HTML/CSS compositor, schema-
validated JSON timelines, MIT. It is *not* referenced by any film build;
render a clip with it, ffprobe-validate it, and cut it in at concat if you
want it. Full contract, selection rules, measured 4–15× speed advantage on
that scene class, and rollback: see `VIDEO_ENGINE_ARCHITECTURE.md` and the
working example in `bench/`.


## tts/

- `tts.py` — narration: `lines.json` -> `vo/*.wav` + `dur.json` (Kokoro ONNX,
  model files ~500 MB, **not committed**; drop them next to this script).
- `asr_check.py` — QC round-trip: transcribe rendered VO and diff against the
  script text to catch mispronunciations before mixing. Document residuals.

## stills/ — archival image layer (the license gate)

`commons_search.py` (search Wikimedia Commons), `fetch_stills.py` (download ->
magic-byte + PIL validation -> `stills/raw/` + `credits.json` ledger), and
`prep_plates.py` (cover-crop, cold duotone, grain, vignette -> `stills/<id>.jpg`).

**License gate: PD / CC0 / CC BY / CC BY-SA only.** Fair-use material and AI
images impersonating real evidence are excluded by policy — see `BRAIN.md`
for the full compliance rules and the per-film `stills/credits.json` ledger
that carries source page, author, license, and validation status for every plate.
