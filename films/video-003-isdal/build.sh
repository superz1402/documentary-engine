#!/bin/sh
# Build isdal-003: timeline -> render -> mix -> mux
# Prereq: vo/ exists (core/tts/tts.py lines.json vo + asr_check.py for words.json)
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"

# 1. timeline (only if missing: narration + durations must exist)
if [ ! -f "$HERE/timeline.js" ]; then "$LIB/.venv/bin/python" "$HERE/gen_timeline.py"; fi

# 2. picture — full render (use render_range.mjs chunks on constrained hosts, then concat)
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers 2 --out "$HERE/out/video.mp4"

# 3. audio mix (score + foley + voice)
"$LIB/.venv/bin/python" "$HERE/mix.py"

# 4. mux — voice-forward chain matching the v1.0.0 release master (-14.3 LUFS integrated):
#    volume=10.5dB + limiter at -0.1 dBFS (mix.wav sits at -24.8 LUFS; +6 dB alone lands at -18.8)
ffmpeg -y -loglevel error -i "$HERE/out/video.mp4" -i "$HERE/out/mix.wav" \
  -filter:a "volume=10.5dB,alimiter=limit=0.9882:level=false" -map 0:v -map 1:a \
  -c:v copy -c:a aac -b:a 256k -movflags +faststart -shortest "$HERE/out/isdal-003.mp4"
echo "BUILD DONE: $HERE/out/isdal-003.mp4"
