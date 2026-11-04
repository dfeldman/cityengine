#!/bin/sh
# The inputs of the Versailles census scripts (docs/VERSAILLES.md), cut from the local extract into $DATA:
#   DATA=/some/dir sh tools/versailles/prep.sh
#   DATA=… node tools/versailles/connect.cjs docs/versailles/regions-draft.json   # per-region buildings, road km, the bike path
#   DATA=… node tools/versailles/fringe.cjs  docs/versailles/regions-draft.json   # fringe buildings by width
#   DATA=… node tools/versailles/plot.cjs out.png docs/versailles/regions-draft.json
set -e
: "${DATA:?set DATA to a scratch directory}"
PBF="$(dirname "$0")/../cache/osm/ile-de-france-latest.osm.pbf"
osmium extract -b 2.05,48.77,2.25,48.87 "$PBF" -o "$DATA/vers.pbf" --overwrite
osmium tags-filter "$DATA/vers.pbf" a/building w/highway -o "$DATA/bh.pbf" --overwrite
osmium export "$DATA/bh.pbf" -f geojsonseq -o "$DATA/bh.geojsonseq" --overwrite
osmium tags-filter "$DATA/vers.pbf" a/leisure a/landuse=forest a/natural=wood a/boundary a/tourism a/historic -o "$DATA/areas.pbf" --overwrite
osmium export "$DATA/areas.pbf" -f geojsonseq -o "$DATA/areas.geojsonseq" --overwrite
