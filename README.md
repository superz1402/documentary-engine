# Opuscar Studio — Video Library

A public production studio: every documentary produced with the [Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar) pipeline lives here. **🎬 Landing page (GitHub Pages): https://superz1402.github.io/opuscar-studio/ — film library with embedded trailers.**

Each new video is published as a GitHub Release — no per-video repositories to manage. Release assets (MP4, subtitles, poster, metadata) are freely downloadable..

## Library

| Video | Title | Runtime | Release |
|---|---|---|---|
| 002 | The Zodiac Killer: The Ciphers, the Letters, and the Killer Nobody Could Identify | 17:23 | [video-002-zodiac v1.0.0](../../releases/tag/video-002-zodiac-v1.0.0) |
| 003 | The Isdal Woman: The Woman Who Erased Her Own Identity | 13:53 | [video-003-isdal v1.0.0](../../releases/tag/video-003-isdal-v1.0.0) |

## Layout

```
films/
  video-002-zodiac/       # one folder per video: source + delivery package
    index.html            # the film (render(t) page, halftone-dossier engine)
    timeline.js           # narration-locked scene timeline (generated)
    lines.json            # narration script (TTS + subtitle text)
    mix.py                # score + foley + voice mix
    build.sh              # one-command rebuild
    render_range.mjs      # resumable range renderer for constrained hosts
    zodiac-002.srt        # subtitles
    trailer: zodiac-002-trailer.mp4  # 1:09 web trailer (also on the Release + Pages site)

```
films/video-003-isdal/   # same layout + shorts.html (vertical engine) + lines_shorts.json + VERIFICATION.md
```
    chapters.txt          # YouTube chapter timestamps
    youtube.md            # title / description / tags package
    SOURCES.md            # fact-check sources
    CREDITS               # third-party assets & licences
    TREATMENT.md          # direction document
    poster.jpg / thumbnail_1280x720.jpg
.github/workflows/build.yml  # manual CI build -> renders the film, uploads artifact
```

## Rebuild

```sh
sh plugin/skills/lemo-opuscar/scripts/setup.sh deps voice   # once (Lemo-Opuscar library)
LIB=<opuscar-library-path> sh films/video-002-zodiac/build.sh
```

Or run the **Build video** workflow (Actions → Build video → Run) and collect the artifact.

## Release convention

Tag `video-NNN-<slug>-vMAJOR.MINOR` per video; assets attached: the film `.mp4`, `.srt`, poster, thumbnail, chapters, `youtube.md`, `SOURCES.md`.
