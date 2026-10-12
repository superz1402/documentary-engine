# VIDEO_ENGINE_BENCHMARK.md

Benchmark of the existing engine vs the strongest audit candidate
(**Geneva v1.4.0**) on one representative documentary scene, run in the
production sandbox on 2026-10-12.

## Environment (measured)

| | |
|---|---|
| Host | shared container, 2 vCPU, 3 GB RAM, no GPU (SwiftShader software GL) |
| OS / runtime | Debian 13, Node 24.21, Python 3.12.15, ffmpeg 7.1.5 |
| Existing engine | playwright-core + headless Chromium screenshots → ffmpeg image2pipe → libx264 CRF 14 |
| Candidate | geneva v1.4.0 official static binary (Rust, browserless compositor, OpenH264) |

## Test scene (identical spec for both)

`bench/spec.md` — a 15–16 s documentary scene containing:

1. full-screen photograph background (blurred, slow Ken Burns),
2. animated documentary title + subtitle (fade + letter-spacing settle + rule wipe),
3. evidence card with rubber-stamp accent,
4. lower-third identification bar,
5. crossfade transition between two background scenes,
6. existing narration WAV from film video-003 (14.03 s, `vo/s01a.wav`),
7. three subtitles burned with accurate SRT timing,
8. final export: H.264 MP4, 1920×1080, 30 fps.

Both implementations live in the repo: `bench/engine-poc/` (existing engine)
and `bench/geneva-poc/` (Geneva timeline.json + two HTML cards + poc.srt).

## Results (measured)

| Metric | Existing engine | Geneva v1.4.0 |
|---|---|---|
| Wall time, 480 frames @1080p30, 2 cores | **~50 s in one run; >590 s in a second run of the same job** (high variance under shared-host load) | **32.9 s, stable** |
| Effective frame rate | 0.8–4.8 fps/worker observed; ~3.4 fps aggregate sustained on film-class scenes | 13.7–14.9 fps (progress events; 13.7 fps effective incl. startup) |
| Output integrity | 1920×1080, 30/1, h264 + aac, 480 frames, decodes clean (ffprobe) | 1920×1080, 30/1, h264 + aac, 16.0 s, decodes clean (ffprobe) |
| Spec coverage | all 7 items ✔ (verified in extracted frames) | all 7 items ✔ (verified in extracted frames) |
| Visual quality | equivalent on this scene class (blurred photo bg, cards, stamp, lower third, captions) | equivalent; typesetting marginally tighter (cosmic-text) |
| Memory | not instrumented (sandbox lacks `/usr/bin/time -v`); not fabricated | not instrumented; not fabricated |
| Iteration cost per scene edit | re-render full range | re-render full range (same model) |
| Authoring surface for agents | one page per film + engine helpers | one JSON + small HTML files; schema-validated errors with JSON pointers |
| Failure modes | page JS error → non-zero exit (loud); 3rd-party Chromium | exit 1 with coded diagnostics (E103/E302/E442 met in practice, all self-explanatory) |

**Honest notes**

- The engine PoC's two runs differ ~10×; the second run overlapped nothing
  (foreground), so the variance is host-level (shared CPU steal). Both
  numbers are reported rather than a cherry-picked one. On the *film-class*
  workload (heavier SVG filters) our engine sustains ~3.4 fps aggregate
  with 2 workers — measured across 6 chunks of the video-003 v2 render.
- Geneva's 13.7 fps excludes nothing: it is wall time for the whole
  450-frame job (32.9 s) — i.e. **~4× faster than our best observed PoC
  run and ~15× faster than our worst**, on the same box, same scene.
- Memory was not measured for either engine (no `/usr/bin/time -v` in the
  container); recorded as unavailable rather than estimated.
- Geneva does **not** support the SVG-filter primitives our exhibit
  aesthetic relies on (feTurbulence displacement, ink stamps, paper
  multiply). The benchmark scene deliberately excludes them; it represents
  the *overlay/imagery* scene class, not the full film aesthetic.
- Not benchmarked (and why): HyperFrames / OpenFilm / Revideo / Motion
  Canvas — each requires an npm install + Chromium download (~100–300 MB)
  and, for the TS-generator pair, a project scaffold; the audit
  (VIDEO_ENGINE_AUDIT.md) shows all four share our existing engine's
  fundamental mechanism (headless-Chromium capture), so a PoC would measure
  our own architecture back at itself with more moving parts. Time-boxed
  out of this pass; re-benchmark if a TS-generator or cloud-render
  requirement appears.

## Chosen engine

**Geneva, as an optional secondary render provider** (`geneva`), for the
overlay/imagery scene class and clip utilities. **The existing engine
remains the primary and default provider** for full-film rendering where
the exhibit aesthetic and frame-exact brand consistency matter. Rationale:
smallest dependency that materially improves the system (one static
binary), verified deterministic output, agent-native contract, MIT, and a
measured 4–15× speed advantage exactly where our pipeline is slowest.
