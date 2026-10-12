# ENGINE NOTES — what we studied, what we adopted

*Studied 2026-10-12 from 11 repos (3 external, 8 our own) to level up the visual system:
"same topics, richer screens." Nothing that works was removed — this is an additive layer.*

## The trigger

Our films are deterministic vector engines (SVG/canvas `render(t)` → Playwright frames →
ffmpeg). They look clean but *flat*: every screen is drawn, nothing is *real*. The upgrade:
embed **real archival images** (license-safe, credited) into the scenes as taped/polaroid
"plates", plus richer clipboard/collage chrome. First applied to the Isdal shorts (v2).

## What each repo taught us

| Repo | Pattern worth stealing | Status here |
|---|---|---|
| **harry0703/MoneyPrinterTurbo** | Stage pipeline (script → search-terms → materials → assemble); **per-asset source ledger** — every downloaded asset persists `provider`, `search_term`, `creator`, local path (`_persist_material_sources`); material cache keyed by query | ✅ adopted: `core/stills/` + `stills.json` + `stills/credits.json` ledger per film |
| **edenfunf/reelmimic** | Skills-as-files (`.claude/skills/*/SKILL.md`); style-mimicry: analyze reference video rhythm/shot-lengths/transitions before generating | ◻ noted: our "house style" lives in `MOTION-CRAFT.md`; mimicry optional later |
| **ChatCut-Inc/agent-plugin** | One `SKILL.md` per capability + a **`known-errors` skill** (institutional memory of past bugs) + a `verification` skill (prove the edit is visible) | ✅ spirit adopted: this file + `VERIFICATION.md` per film + frame-QC discipline |
| **superz1402/imgagent** (ours) | search → normalize → rank → dedupe → download → validate → manifest → verified paths; "honest negatives" (fail loudly, never fabricate) | ✅ contract adopted by `fetch_stills.py` (validate bytes, exit non-zero on failure) |
| **superz1402/documentary-agent-kit** (ours) | `commons_search.py` — Wikimedia Commons API with license + artist metadata | ✅ copied verbatim into `core/stills/` (same author, MIT) |
| **superz1402/vfactory** (ours) | Pre-built footage library (`sources.json` → `library.json`) instead of per-film fetching | ◻ future: shared plate library across films |
| **superz1402/ahyeon-documentary** (ours) | `media_manifest.json` / `subject_sources.json` per project | ✅ same idea, now `stills/credits.json` |
| **superz1402/somerton-man-documentary** (ours) | `FACTS.md` next to the film — claim discipline in-repo | ✅ already our standard (`SOURCES.md` + `VERIFICATION.md`) |
| **superz1402/films**, **superz1402/promos** (ours) | Library landing page; per-product brag docs | ◻ unchanged |
| **Bilal1402/ttagent·ytagent·igagent** | One-command publish envelopes with JSON schema per platform | ◻ future: auto-publish shorts (Phase: distribution) |

## The new stills pipeline (`core/stills/`)

```
films/<film>/stills.json        # declarative: which plates, captions, crop aspect, use
   ↓ fetch_stills.py           # Commons API → 1600px thumb → validate → stills/raw/
   ↓ prep_plates.py            # cover-crop → duotone → grain → vignette → stills/
   ↓ credits.json              # auto-written ledger: source URL, license, artist, prep params
   ↓ film engine               # <image> plates + tape/pin/stamp collage, Ken Burns, caption strips
```

Rules baked in:

1. **License policy** — embed only PD / CC0 / CC BY / CC BY-SA images with metadata; fair-use
   files are excluded even when they are "the famous one" (e.g. the Isdal composite sketch on
   en.wiki is *Fair use* → skipped, documented here). On-screen credit tag + ledger + video
   description carry the attribution.
2. **Honest captions** — a plate caption may only claim what the source supports. Modern photos
   are labeled as such ("BERGEN RAILWAY STATION — MODERN VIEW"); period images carry their year.
3. **Determinism** — plates are pre-treated static JPGs; motion (Ken Burns, tape, stamps) is
   computed from `t` in `render(t)`, so renders stay reproducible frame-for-frame.
4. **No AI-fake archival** — real photos are real; drawn evidence stays drawn (vector), never
   dressed up to look like a photograph of evidence.
