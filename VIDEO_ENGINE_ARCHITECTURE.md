# VIDEO_ENGINE_ARCHITECTURE.md

How render providers fit into the Documentary Engine after the 2026-10-12
audit. Design goal: **the smallest change that adds a verified capability
without touching the working production path.**

## Provider model

```
                       ┌───────────────────────────────────────────┐
film sources ─────────▶ │ PRIMARY (default): core/render engine     │
  timeline.json         │   render(t) pages → Chromium → ffmpeg     │──┐
  lines.json + vo/      │   core/render/video.mjs | range.mjs       │  │
  index.html/scenes.js  └───────────────────────────────────────────┘  ├──▶ out/<film>.mp4
                        ┌───────────────────────────────────────────┐  │   (concat + mux,
  overlay scene spec ─▶ │ OPTIONAL: geneva provider                 │──┘     build.sh)
  (JSON + HTML cards)   │   geneva render timeline.json -o clip.mp4 │
                        └───────────────────────────────────────────┘
```

- **Provider = the thing that turns a scene description into a picture
  track.** The orchestrator (film folder: `timeline.json`, `lines.json`,
  `mix.py`, `build.sh`) is unchanged and engine-agnostic by construction:
  it consumes *files* (segments, mixes), never a specific renderer API.
- **`builtin` provider (default, unchanged):** the deterministic
  `render(t)` page contract documented in `core/README.md`. Frame-exact,
  film-brand SVG aesthetic, already proven on three released films.
- **`geneva` provider (optional):** browserless Rust compositor. Selected
  per *scene class*, not per film: full-film exhibits stay `builtin`;
  overlay/imagery scenes (titles, lower thirds, evidence cards, photo
  montages, burned-caption inserts) may be rendered as standalone clips by
  geneva and cut in at the concat/mux stage like any other segment.

## Selection & fallback rules (enforced by convention + docs)

1. Default is always `builtin`. Nothing in `build.sh`, CI, or the Pages
   flow reads the geneva provider unless an author explicitly renders a
   clip with it.
2. If the `geneva` binary is absent, the optional path is unavailable —
   the film build never notices (no compile-time or run-time dependency).
3. Every geneva-produced clip is validated with the same acceptance gate as
   any other segment before it can be concatenated:
   `ffprobe` → H.264, 1920×1080 (or film resolution), expected fps,
   non-empty duration, decodes end-to-end.
4. Rollback = delete the optional clip and the one-line mention of it in
   the film's concat list. The primary path has no knowledge of it.

## Data flow for a geneva-rendered clip (optional path)

```
scene spec (title / card / lower-third / captions + assets)
  → geneva timeline JSON (schema: `geneva schema`, version "1.1")
  → `geneva validate` (schema + overlap diagnostics, JSON pointers)
  → `geneva --format json render tl.json -o clip.mp4`
  → ffprobe acceptance gate
  → concat/mux alongside builtin segments in the film's build.sh
```

The JSON timeline + HTML cards are committed next to the film (provenance),
as `bench/geneva-poc/` demonstrates end-to-end.

## Why not a deeper integration (deliberate)

- A `RENDER_PROVIDER` env var wired into `build.sh` was considered and
  **rejected for now**: film 003's aesthetic depends on SVG filters that
  geneva cannot render, so a global switch would be a downgrade trap. The
  safe seam is *per-clip*, not per-film.
- HyperFrames / OpenFilm / Revideo / Motion Canvas: no integration (see
  VIDEO_ENGINE_AUDIT.md). Re-audit triggers documented there.
- ffmpeg remains the final muxer/mixer in all cases (loudness path,
  faststart, AAC) — unchanged.

## Reference implementation

`bench/` is the working reference of both providers on one identical scene
spec: `bench/spec.md`, `bench/engine-poc/` (builtin), `bench/geneva-poc/`
(geneva). Acceptance results: VIDEO_ENGINE_BENCHMARK.md.
