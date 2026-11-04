#!/bin/sh
# Photograph a point from a bearing: tools/shoot-landmark.sh <x> <z> <bearing> <dist> <lift> <out> [extra]
# or from above: HEIGHT=60 PITCH=35 tools/shoot-landmark.sh <x> <z> <bearing> 1 0 <out>
# CITY (default san-francisco) must be baked here, refused unless the bake-private files are the bake that shipped
# (tools/bake-files.ts). It starts at the point itself (`?at=`), not the nearest street in the 200 MB package: that cost 2-4 GB a shot.
cd "$(dirname "$0")/.."
CITY=${CITY:-san-francisco}
node -e "const fs=require('fs');const r=(f)=>{try{return JSON.parse(fs.readFileSync(f,'utf8')).bake}catch{return null}};const s=r('public/cities/$CITY/v3/index.json'),w=r('tools/cache/bake/$CITY/bake.json');if(!s||s!==w){console.error('$CITY: the bake-private files (bake '+w+') are not the bake that shipped ('+s+') — npm run bake -- $CITY');process.exit(1)}" || exit 1
SHOTS_NOTE=0 node --experimental-strip-types tools/look-at.ts --city=$CITY --at=$1,$2 --dist=$4 --bearing=$3 --lift=$5 --out=$6 ${7:+--extra=$7} ${HEIGHT:+--height=$HEIGHT} ${PITCH:+--pitch=$PITCH} 2>&1 | tail -1
# default 175x100 (tinyres) for finding the angle; SHOTS_LOWRES=1 350x200, SHOTS_MEDRES=1 700x400, SHOTS_HIRES=1 1400x800
echo "${SHOTS_HIRES:+hires}${SHOTS_MEDRES:+medres}${SHOTS_LOWRES:+lowres} shot (tinyres if blank). Once framed, re-shoot with SHOTS_LOWRES=1 (350x200) or SHOTS_MEDRES=1 (700x400); SHOTS_HIRES=1 only for fine detail."
