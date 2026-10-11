#!/bin/sh
# Build zodiac-002: timeline -> render -> mix -> mux
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"

# 1. timeline (only if missing: narration + durations must exist)
[ -f "$HERE/timeline.js" ] || "$HERE/../.."//.venv/bin/python "$HERE/gen_timeline.py" || true

# 2. picture
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers 2 --out "$HERE/out/video.mp4"

# 3. audio mix (score + foley + voice)
"$LIB/.venv/bin/python" "$HERE/mix.py"

# 4. mux
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/out/zodiac-002.mp4" 24 6
echo "BUILD DONE: $HERE/out/zodiac-002.mp4"
