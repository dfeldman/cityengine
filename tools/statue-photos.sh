#!/bin/sh
# Photo folders for the statue list (tools/paris-statues.ts --photos=N), copied to ml1 as they come, where assetkit's
# tools/img2glb/ml1/keep-going makes them into models around the clock (owner, 2026-11-21: the Mac shuts down, ml1
# doesn't). Safe to stop at any time (shutdown, Ctrl-C) and to run again: a folder with an about.md is kept, so a rerun
# carries on where it stopped; only finished folders (with an about.md) are copied, never one half downloaded.
#   tools/statue-photos.sh            # the whole list (1440: Paris A–C, the hand-written sections, Versailles)
#   tools/statue-photos.sh 600        # the first 600
# Keeps the Mac awake while it runs (a closed lid still sleeps). Log: /tmp/statue-photos.log
N=${1:-1440}
ML1=${ML1:-dfeldman@192.168.10.145}
EVERY=${EVERY:-1500}
cd "$(dirname "$0")/.." || exit 1
SRC=../assetkit/statues_to_model/paris
LOG=${LOG:-/tmp/statue-photos.log}

sync_done() {
  (cd "$SRC" && find . -mindepth 2 -maxdepth 2 -name about.md | sed 's|/about.md$||' \
    | rsync -a -r --files-from=- . "$ML1:assetkit/statues_to_model/paris/") \
    && echo "$(date '+%F %T') copied $(find "$SRC" -mindepth 2 -maxdepth 2 -name about.md | wc -l | tr -d ' ') finished folders to ml1"
}

node --experimental-strip-types tools/paris-statues.ts --photos="$N" >> "$LOG" 2>&1 &
P=$!
trap 'kill $P 2>/dev/null; sync_done; exit 0' INT TERM
caffeinate -i -w "$P" &
echo "$(date '+%F %T') fetching photos for the first $N works (pid $P, log $LOG)"
while kill -0 "$P" 2>/dev/null; do
  sleep "$EVERY" & wait $!
  sync_done
done
sync_done
echo "$(date '+%F %T') done: $(ls "$SRC" | wc -l | tr -d ' ') folders"
