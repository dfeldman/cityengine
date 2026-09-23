#!/bin/sh
# Every sign GLB the city needs, regenerated from nothing. The GLBs live under public/models/, which is
# gitignored: the assets are generated, the code that generates them is what is kept.
set -e
cd "$(dirname "$0")/../.."
FONT_SERIF="/System/Library/Fonts/Supplemental/Georgia.ttf"

# Ghirardelli Square: mixed case, 5 m capitals, bulbs along the letters, on its own steel lattice
blender -b -P tools/signgen/gen.py -- --text=Ghirardelli --height=5 --depth=0.35 --bulbs=0.5 \
  --font="$FONT_SERIF" --out=public/models/signs/ghirardelli.glb
