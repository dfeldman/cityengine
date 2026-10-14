#!/bin/sh
# Photograph a point from a bearing: tools/shoot-landmark.sh <x> <z> <bearing> <dist> <lift> <out> [extra]
# or from above: HEIGHT=60 PITCH=35 tools/shoot-landmark.sh <x> <z> <bearing> 1 0 <out>
# CITY (default san-francisco) must be baked here: the nearest street is looked up in its bake-private package,
# tools/cache/bake/<city>/package.json (tools/bake-files.ts), refused unless it is the bake that shipped.
cd "$(dirname "$0")/.."
CITY=${CITY:-san-francisco}
node -e "const fs=require('fs');const r=(f)=>{try{return JSON.parse(fs.readFileSync(f,'utf8')).bake}catch{return null}};const s=r('public/cities/$CITY/v3/index.json'),w=r('tools/cache/bake/$CITY/bake.json');if(!s||s!==w){console.error('$CITY: the bake-private files (bake '+w+') are not the bake that shipped ('+s+') — npm run bake -- $CITY');process.exit(1)}" || exit 1
E=$(node -e "const c=require('./tools/cache/bake/$CITY/package.json');let b=[];c.edges.forEach(e=>{if(e.foot)return;const p=e.points;for(let k=0;k<p.length;k+=2)b.push([Math.hypot(p[k]-($1),p[k+1]-($2)),e.id])});b.sort((a,b)=>a[0]-b[0]);console.log(b[0][1])")
node --experimental-strip-types tools/look-at.ts --city=$CITY --start=$E --at=$1,$2 --dist=$4 --bearing=$3 --lift=$5 --out=$6 ${7:+--extra=$7} ${HEIGHT:+--height=$HEIGHT} ${PITCH:+--pitch=$PITCH} 2>&1 | tail -1
