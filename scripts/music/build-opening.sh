#!/bin/sh
# Builds src/assets/music/opening.mp4 from Charlie Huang's Pingsha Luoyan
# (https://commons.wikimedia.org/wiki/File:Pingsha_Luoyan.ogg, CC BY 2.5).
#   sh scripts/music/build-opening.sh path/to/Pingsha_Luoyan.ogg
set -e
SRC="$1"
TMP="${TMPDIR:-/tmp}/tea-picker-music"
mkdir -p "$TMP"
DIR="$(cd "$(dirname "$0")" && pwd)"

# Clean the home recording: remove DC offset and rumble, soften hiss, tame harshness.
ffmpeg -loglevel error -y -i "$SRC" -ac 1 -ar 44100 \
  -af "highpass=f=70,highpass=f=70,afftdn=nr=10:nf=-42,lowpass=f=11000,equalizer=f=3000:t=q:w=1:g=-2" \
  -f f32le "$TMP/guqin.f32"

python3 -I "$DIR/render_opening.py" "$TMP/guqin.f32" "$TMP/mix.f32"

# Even loudness (≈ −18 LUFS: quiet, it sits under the scene), AAC in .mp4
# (the Minis build only allows importing mp4, not audio formats).
ffmpeg -loglevel error -y -f f32le -ar 44100 -ac 1 -i "$TMP/mix.f32" \
  -af "loudnorm=I=-18:TP=-1.5:LRA=11" -ar 44100 -c:a aac -b:a 72k -movflags +faststart \
  src/assets/music/opening.mp4
ls -la src/assets/music/opening.mp4
