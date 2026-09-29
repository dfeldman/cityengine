#!/bin/sh
# Every extruded sign GLB the city needs, regenerated from the recipes in tools/signgen/signs.json.
#
# The GLBs live under public/models/, which is gitignored: the assets are generated, the recipe is what is
# kept. FLAT signs are not here and need nothing built — they are a `sign({ type: 'flat' })` call in the
# builder, drawn in the browser (src/render/sign-plates.ts).
set -e
cd "$(dirname "$0")/../.."
node --experimental-strip-types tools/signs.ts "${1:-san-francisco}" --force
