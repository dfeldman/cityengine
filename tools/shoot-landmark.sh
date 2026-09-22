#!/bin/sh
# Photograph a point from a bearing: tools/shoot-landmark.sh <x> <z> <bearing> <dist> <lift> <out> [extra]
# or from above: HEIGHT=60 PITCH=35 tools/shoot-landmark.sh <x> <z> <bearing> 1 0 <out>
cd "$(dirname "$0")/.."
E=$(node -e "const c=require('./public/cities/paris-marais.json');let b=[];c.edges.forEach(e=>{if(e.foot)return;const p=e.points;for(let k=0;k<p.length;k+=2)b.push([Math.hypot(p[k]-($1),p[k+1]-($2)),e.id])});b.sort((a,b)=>a[0]-b[0]);console.log(b[0][1])")
node --experimental-strip-types tools/look-at.ts --city=paris-marais --start=$E --at=$1,$2 --dist=$4 --bearing=$3 --lift=$5 --out=$6 ${7:+--extra=$7} ${HEIGHT:+--height=$HEIGHT} ${PITCH:+--pitch=$PITCH} 2>&1 | tail -1
