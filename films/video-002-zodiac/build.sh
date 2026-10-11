#!/bin/sh
# Build zodiac-002: timeline -> render -> mix -> mux
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"

# 1. timeline (only if missing: narration + durations must exist)
if [ ! -f "$HERE/timeline.js" ]; then "$LIB/.venv/bin/python" "$HERE/gen_timeline.py"; fi

# 2. picture
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers 2 --out "$HERE/out/video.mp4"

# 3. audio mix (score + foley + voice)
"$LIB/.venv/bin/python" "$HERE/mix.py"

# 4. mux (two-pass loudness trim; video is already CRF 14 -> stream copy)
ffmpeg -y -loglevel error -i "$HERE/out/mix.wav" -filter:a ebur128=peak=true -f null - 2>&1 | grep -A4 "Summary:" | awk '/I:/{print "loudness", $2, "LUFS"}'
ffmpeg -y -loglevel error -i "$HERE/out/video.mp4" -i "$HERE/out/mix.wav" \
  -filter:a "volume=1.2dB,alimiter=limit=0.8709:level=false" -map 0:v -map 1:a \
  -c:v copy -c:a aac -b:a 256k -movflags +faststart -shortest "$HERE/out/zodiac-002.mp4"
echo "BUILD DONE: $HERE/out/zodiac-002.mp4"
