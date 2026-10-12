# bench/spec.md — representative documentary scene (benchmark contract)

One scene, identical requirements for every render provider under test.
Duration 15–16 s, export H.264 MP4 1920×1080 30 fps, stereo audio.

Required elements:

1. **Full-screen image background** — a real, license-cleared archival
   plate (`films/video-003-isdal/stills/`), cover-fit, blurred ≥ 12 px,
   slow Ken Burns drift.
2. **Animated documentary title + subtitle** — "THE ISDAL WOMAN" /
   "THE WOMAN WHO ERASED HER OWN IDENTITY"; fade + tracking settle +
   accent rule wipe in the first ~2 s; must clear before the scene change.
3. **Evidence card** — "THE SUITCASES" card with three bullet facts and a
   rotated "CASE 134/70" stamp accent, animated in after the crossfade.
4. **Lower-third identification** — "Isdalen, Norway / NOVEMBER 1970 ·
   CASE FILE 134/70", slides in, exits before the end.
5. **Transition** — 1 s crossfade between two background scenes at ~7 s.
6. **Narration audio** — the film's real VO (`vo/s01a.wav`, 14.03 s),
   starting ~0.5 s in, AAC in the export.
7. **Accurate subtitles** — three cues burned to picture, times taken from
   a plain SRT (1.2–4.6, 5.0–9.0, 9.5–13.5); must be legible and timed to
   the narration.

Acceptance: ffprobe shows h264 1920×1080 30/1 + aac; file decodes
end-to-end; extracted frames at 2 s and 12 s show items 1–4 and 7.

Implementations: `engine-poc/` (builtin provider, render(t) page) and
`geneva-poc/` (geneva provider, JSON timeline + HTML cards).
Results: ../VIDEO_ENGINE_BENCHMARK.md.
