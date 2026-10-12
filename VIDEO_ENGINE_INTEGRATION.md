# VIDEO_ENGINE_INTEGRATION.md

What was actually implemented on 2026-10-12, how to use it, and how to
roll it back. **The production film path is unchanged** — see
"What was NOT changed".

## Implemented

1. **Benchmark harness, committed and reproducible** — `bench/`:
   - `bench/spec.md` — the representative documentary scene spec (7
     required elements: image bg, animated title+subtitle, evidence card,
     lower third, crossfade, narration audio, accurate subtitles; H.264
     1920×1080 30 fps).
   - `bench/engine-poc/` — the scene implemented on the existing engine
     (`render(t)` page; renders with the repo's own `core/render/range.mjs`
     `--fps 30`; muxed with the film's real narration WAV).
   - `bench/geneva-poc/` — the same scene as a Geneva v1.4.0 timeline
     (`timeline.json`, schema "1.1") + two HTML cards (`title.html`,
     `lower.html`) + `poc.srt` + the same narration WAV.
   - Both outputs were rendered in the production sandbox and verified
     with ffprobe + extracted frames (results: VIDEO_ENGINE_BENCHMARK.md).

2. **Provider contract + selection rules** — `VIDEO_ENGINE_ARCHITECTURE.md`
   (primary = `builtin`, optional = `geneva`, per-clip seam, acceptance
   gate, rollback).

3. **Docs** — `VIDEO_ENGINE_AUDIT.md`, `VIDEO_ENGINE_BENCHMARK.md`,
   `VIDEO_ENGINE_ARCHITECTURE.md`, this file.

4. **core/README.md** — render-provider section added (geneva as optional
   secondary provider; how to install the binary; pointer to bench/).

## How to use the geneva provider (optional, per clip)

```sh
# 1. install the binary (Linux x64 here; see geneva releases for other OS)
curl -fsSL https://raw.githubusercontent.com/geneva-render/geneva/main/scripts/install.sh | sh

# 2. author a clip: JSON timeline + HTML cards (copy bench/geneva-poc/ as template)
geneva validate my_clip/tl.json          # schema + overlap check, JSON pointers
geneva --format json render my_clip/tl.json -o my_clip/clip.mp4

# 3. acceptance gate (same as any segment)
ffprobe -v error my_clip/clip.mp4        # expect h264, 1920x1080, film fps

# 4. cut it in: add the clip to the film's concat list / mux in build.sh
```

## What was NOT changed (verified)

- `films/*/build.sh`, `mix.py`, `gen_timeline.py`, engine pages,
  `core/render/*` renderer behaviour — untouched (git diff shows only
  additive files + a README section).
- Narration/TTS/ASR, stills license gate, credits ledgers, Pages flow,
  release process — untouched.
- No new runtime dependencies: nothing in the film build path references
  geneva or any npm package; `package.json` dependencies unchanged.
- No paid APIs or external services introduced; geneva runs fully offline.

## Rollback

Delete `bench/` and the four `VIDEO_ENGINE_*.md` files. That is the entire
footprint; the primary renderer never referenced them.

## Verification performed (actually executed)

- `bench/geneva-poc`: `geneva validate` clean; `render` ok (report JSON
  `ok: true`, notes: 3 SRT cues); ffprobe: h264 1920×1080 30/1 + aac,
  16.0 s; frames at 2 s / 12 s visually verified (title, card, stamp,
  lower third, captions all present).
- `bench/engine-poc`: rendered 480/480 frames via `core/render/range.mjs
  --fps 30`; ffprobe: h264 1920×1080 30/1, 480 frames; muxed with
  `vo/s01a.wav` (aac); frame at 12 s visually verified.
- Baseline regression: the in-flight video-003 v2 full-film render (7–11 of
  9 segments at audit time) continued producing valid CRF14 1080p24
  segments on the untouched primary path during the entire audit.
- Known blockers / open items: memory metrics not captured (no
  `/usr/bin/time -v` in container) — recorded as unavailable, not
  fabricated; geneva binary is fetched from upstream releases at install
  time (pin to v1.4.0 for reproducibility).
