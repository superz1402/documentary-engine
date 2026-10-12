# VIDEO_ENGINE_AUDIT.md

Audit of five video-engine repositories against this repo's existing
documentary pipeline. **Every claim below was verified against the actual
source code, license file, release metadata, or a working test in our
sandbox (2026-10-12)** unless explicitly marked *unverified*. Repos were
cloned shallow at these refs:

| Repo | Cloned commit date | Stars | License | Archived |
|---|---|---|---|---|
| geneva-render/geneva | active, pushed 2026-10-10 | 7 | MIT | no |
| openfilm/openfilm | active, pushed 2026-10-12 | 165 | MIT | no |
| heygen-com/hyperframes | active, pushed 2026-10-12 | 61,128 | Apache-2.0 | no |
| redotvideo/revideo | active | n/a (API rate limit) | MIT | no |
| motion-canvas/motion-canvas | active | n/a (API rate limit) | MIT | no |

---

## 1. Geneva — geneva-render/geneva

**What it is (verified):** A command-line video editor and composition
engine written in Rust. Edits are JSON timeline documents; titles and
graphics are HTML/CSS **drawn by its own layout engine, with no browser**.
Ships as one static binary (Linux x64/arm64, macOS, Windows). Codec work
comes from FFmpeg libraries (bundles OpenH264; uses system x264 if present).

**Verified architecture** (from `docs/architecture.md` + source):
- Pipeline: `JSON → Timeline → resolve → Composition → plan → encoder`.
  Strict schemas (`deny_unknown_fields`), every diagnostic has a stable
  code (E103, E302, E442…) and a JSON pointer to the offending field.
- CPU renderer (reference, deterministic, thread-pool independent) and GPU
  renderer (wgpu); both held to golden-image tests.
- HTML/CSS subset: parser, cascade, flex layout (taffy), text shaping via
  cosmic-text (Harfbuzz), painted like an image clip.
- Audio: BS.1770-4 loudness targeting, true-peak limiting, hygiene filters.
- Captions: SRT/JSON expanded into per-cue text clips at resolve time.
- Transitions: `crossfade` (constant-power) and `fade` (dip through colour).
- Agent contract (verified, `docs/agents.md` + `geneva guide`): one binary,
  no network, `--format json` everywhere, machine-readable progress on
  stderr, built-in versioned manual (`geneva guide`, `geneva explain E302`).
  Exit codes: 0 ok / 1 invalid timeline / 2 usage / 3 render failure.

**Verified in our sandbox:** downloaded official v1.4.0 Linux x64 binary
(16.3 MB), rendered a full representative documentary scene (see
VIDEO_ENGINE_BENCHMARK.md) on a 2-core, 3 GB, software-only container.
Output: 1920×1080, 30 fps, H.264 + AAC, 16.0 s, correct subtitle timing.

**Limits (verified):** markup animations on the *outermost* HTML element may
only animate transform/opacity (E442); padding shorthand is single-value
(E103) — its HTML/CSS subset is deliberately smaller than a browser's.
No SVG filter primitives (no feTurbulence). No plug-in API.

**License:** MIT. **Adoption mode:** standalone subprocess (single binary),
zero Node/Rust dependencies, trivially reversible.

## 2. OpenFilm — openfilm/openfilm

**What it is (verified):** "The open source AI video agent." A pnpm
monorepo (`apps/desktop`, `packages/openfilm`, `packages/shared`). Films are
**one `film.html`** where each shot is a web page drawing `frame(t)` — the
same page-contract philosophy as our engine — plus "Studio", a local
browser-based editor (move/scale/rotate elements, trim clips). Explicitly
positions itself as "no framework (like Remotion or HyperFrames): one
function is enough". Agent-first: `npx skills add openfilm/openfilm`.

**Render mechanism (verified from `packages/openfilm/src/render.mjs`,
`seekable.mjs`):** headless-Chromium rendering of `film.html` pages with
seekable animation control, ffmpeg for encode. Requires Node ≥ 22.18
(our box: 24.21 ✓). First run downloads a headless Chromium (~100 MB).

**Fit for us:** conceptually closest to our existing `render(t)` contract —
a film is pages with a time function. Adds a *human-editable Studio* and a
track/cut model over pages. Overlaps heavily with what we already have;
would duplicate our timeline/render/mix stack rather than extend it.

**License:** MIT. **Adoption mode:** npm package / subprocess; heavier
footprint (Chromium download, Studio services).

## 3. HyperFrames — heygen-com/hyperframes

**What it is (verified):** HeyGen's open-source framework: "Write HTML.
Render video. Built for agents." Large workspaces monorepo: `engine`,
`core`, `producer`, `player`, `cli`, `sdk`, `parsers`, `studio`,
`studio-server`, `shader-transitions`, `aws-lambda`, `gcp-cloud-run`.
Deterministic MP4 from HTML/CSS + media + *seekable* animations. Ships 21
agent skills and plugin marketplaces; large docs catalog (blocks, charts).

**Render mechanism (verified from `packages/engine/src/`):** headless Chrome
driven over CDP with damage-tracked screenshots
(`cdp-headless-experimental.d.ts`), forced-screenshot mode under software
GL, puppeteer + puppeteer-core, linkedom for parsing. i.e. the same
fundamental approach as our engine (headless-Chromium screenshots piped to
an encoder), industrialised: distributed producers, cloud workers
(Lambda/Cloud Run), GPU mode control.

**Fit for us:** the most complete *platform* of the five, and the best
documented for agent workflows. But adopting it means re-expressing our
films in its HTML/CSS/animation idiom or bridging our scene format to it —
a real migration for capability we already have. Its distinctive wins
(distributed/cloud rendering, 61k-star ecosystem, Studio) address needs we
do not have today (single-host deterministic renders suffice).

**License:** Apache-2.0 (includes express patent grant). **Adoption mode:**
npm/CLI; Node ≥ 22; Chromium download; heaviest footprint of the five.

## 4. Revideo — redotvideo/revideo

**What it is (verified):** MIT, lerna monorepo (`core`, `2d`, `cli`,
`player`, `ffmpeg`, `create`). Scenes are **TypeScript generator
functions** (`makeScene2D`), borrowed concepts from Remotion and Rive,
"zero dep" core. Ships a headless render API and a React player. It is the
engine behind Midrender. Node ≥ 22.12. Renderer uses puppeteer ^25.
Descends from the same codebase family as Motion Canvas (2d/core/ffmpeg
package layout is near-identical).

**Fit for us:** strong programmatic API (`createRenderer`) for
motion-graphics-heavy scenes, but authoring means TypeScript + a build
step (vite-style project scaffold via `npm init @revideo`), a bigger
conceptual jump from our declarative `render(t)` pages, and a
puppeteer/Chromium stack we would run *alongside* playwright.

**License:** MIT. **Adoption mode:** npm package; TS project scaffold.

## 5. Motion Canvas — motion-canvas/motion-canvas

**What it is (verified):** MIT, lerna + vite monorepo (`core`, `2d`,
`ffmpeg`, `create`, `player`, `docs`, `e2e`). "A TypeScript library that
uses generators to program animations" plus a real-time preview editor;
designed for informative vector animation synchronised to voice-over. The
upstream project Revideo forked from.

**Fit for us:** excellent for hand-authored vector explainer animation;
same TS-generator authoring model as Revideo. Same integration cost class.

**License:** MIT. **Adoption mode:** npm project scaffold.

---

## Verified comparison (architecture-level)

| | Existing engine | Geneva | OpenFilm | HyperFrames | Revideo | Motion Canvas |
|---|---|---|---|---|---|---|
| Determinism by construction | ✔ (pure `render(t)`) | ✔ (golden-tested) | ✔ (`frame(t)`) | ✔ (seekable) | ✔ (generator, clocked) | ✔ (generator, clocked) |
| Authoring model | SVG/DOM + JS per film | JSON timeline + HTML/CSS | one `film.html` `frame(t)` | HTML/CSS + skills | TS generators | TS generators |
| Renderer core | headless Chromium screenshots + ffmpeg | **own Rust compositor, no browser** | headless Chromium + ffmpeg | headless Chrome via CDP + encoder | puppeteer + ffmpeg | headless + ffmpeg pkg |
| New runtime deps for us | none (already installed) | **one 16 MB binary** | npm + Chromium ~100 MB | npm + Chromium | npm + Chromium (puppeteer 25) | npm + Chromium |
| Subtitles | built into engine draw | SRT/JSON captions primitive | page-level | page-level | page-level | page-level |
| Loudness | our mix.py (numpy) | built-in BS.1770-4 | external | external | external | external |
| Human editor | no (by design) | no | **Studio** | Studio | React player | preview editor |
| SVG filter effects (our aesthetic) | ✔ | ✗ | ✔ (real browser) | ✔ (real browser) | ✔ (2d canvas) | ✔ (2d canvas) |
| License | — | MIT | MIT | Apache-2.0 | MIT | MIT |

## Conclusions

1. **Our engine's core loop is not the bottleneck to replace.** Two of the
   five candidates (HyperFrames, OpenFilm, and effectively Revideo/Motion
   Canvas) validate the same architecture we already run: deterministic
   page + time function + headless capture + ffmpeg.
2. **Geneva fills a genuine gap** we do not cover: browserless, single-
   binary, schema-validated, agent-native compositing of overlay-class
   scenes and clip operations, with measured 4–15× speed advantage on that
   scene class in our sandbox (see VIDEO_ENGINE_BENCHMARK.md). It cannot
   reproduce our SVG-filter exhibit aesthetic — and does not need to; it
   covers imagery + HTML/CSS overlay scenes.
3. OpenFilm/HyperFrames/Revideo/Motion Canvas: **adopted as references, not
   integrated.** Re-audit triggers: multi-host rendering demand
   (HyperFrames), human co-editing demand (OpenFilm Studio), or a move to
   TS-generator authoring (Revideo/Motion Canvas).
