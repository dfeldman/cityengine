# The ten buildings — a two-block stretch of the Financial District core

Montgomery, Pine, Sansome and Bush, between Sutter and California. Of the 52 buildings on that stretch, 22
have no procedural entry at all; these are the ten largest of them. **None has ever been modelled.** Some
carry a reface/restyle entry, which does not count — in the downtown core the floor is a model
(`docs/LADDER.md` §3a).

Photographs are already downloaded. For each building:

    /tmp/exp1-refs/<id>/        Mapillary frames, BEST FIRST (way-<id>-01.jpg …), plus photos.csv
    /tmp/exp1-commons/<id>/     Wikimedia Commons images, where any were found

**Roughly a third of the Mapillary frames are junk** — a wall from three metres, a lamp post, the building
next door. That is expected and by design: the set is chosen for recall, so look at the first three or four
and use what works. Frame 01 is not reliably the best.

| # | OSM way | name | address | height | levels | footprint | corners |
|---|---|---|---|---|---|---|---|
| 1 | `way/944039725` | — | 300 Montgomery Street | 58 m | 12 | 38 × 84 m | 11 |
| 2 | `way/243794014` | — | 550 California Street | 55 m | — | 38 × 53 m | 10 |
| 3 | `way/256067734` | — | *(no address tags)* | 48 m | — | 33 × 42 m | 17 |
| 4 | `way/288511103` | Institute of Contemporary Art San Francisco | 345 Montgomery Street | 30 m | — | 34 × 35 m | 7 |
| 5 | `way/690663633` | Alvinza Hayward Building | 400 Montgomery Street | 36 m | 9 | 27 × 36 m | 12 |
| 6 | `way/1309156123` | Exchange Block Building | 369 Pine Street | 31 m | 8 | 24 × 35 m | 9 |
| 7 | `way/260283286` | Leidesdorff Place | 340 Pine Street | 31 m | — | 18 × 42 m | 12 |
| 8 | `way/256066230` | San Francisco Pacific Exchange Building | 301 Pine Street | 16 m | — | 26 × 40 m | 5 |
| 9 | `way/256067726` | — | 348 Pine Street | 28 m | — | 10 × 29 m | 6 |
| 10 | `way/151185875` | San Francisco Curb Exchange Building | 350 Bush Street | 16 m | — | 13 × 23 m | 8 |

## You do NOT set the footprint — but you do need to know its shape

**The footprint arrives at runtime in the `fit`.** `tower(out, fit, spec)` raises the building's OWN outline
from OSM, and `towerRing(fit)` gives you that outline in the fit's local frame. `fit.hx` and `fit.hz` are its
half-extents. **Never hardcode a size or a rectangle** — if you do, the building will not match its plot and
will overlap its neighbours.

The dimensions above are there so you can make good CHOICES, not so you can type them in. They tell you
whether a building is a deep block or a thin sliver, and the proportions decide things a photograph alone
will not: how many bays fit along the front, whether the entrance belongs on the long side or the short one,
whether a corner treatment is even visible. `way/256067726` at 10 × 29 m is a sliver wedged between
neighbours — most of it is party wall and only one end is ever seen. `way/944039725` at 38 × 84 m is a whole
block face.

## OSM is a HINT, not an authority

**In many cases OSM is simply wrong**, and the table above inherits whatever it says. Heights are missing,
guessed, or in the wrong unit; storey counts are often stale or absent; a footprint can be a rough box drawn
from an aerial, or the outline of the whole block rather than this building, or split into parts that do not
match what stands there.

**So when the PHOTOGRAPH disagrees with the table, believe the photograph.** Count the storeys in the
picture. If you count eight and the table says twelve, the table is wrong, and you should say so in your
report and use what you saw — your manifest entry's `height` field overrides OSM, which is exactly what it
is for.

Where they agree, the table saves you counting. Where they do not, the photograph is the evidence and OSM is
somebody's guess from years ago.

The footprint is the one thing you cannot override — `tower()` raises the OSM outline whatever its faults —
so if the outline is plainly wrong for the building in the photograph (a courtyard filled in, two buildings
merged, a shape that does not match), **that is a reason to bail out** and say which way is wrong. A good
model on a wrong footprint is still a wrong building.

## Two known things about this stretch

The **ICA (#4)** is a hard case and is currently rendered as Chinatown brick, because a geographic classifier
rule read its coordinates and nothing else (BUGS.md #91). It is a dark stone building with a recessed
glazed wall; if its photographs do not show you that clearly, bail out rather than guess.

Several of these are **neoclassical exchange/bank buildings** — the Pacific Exchange, the Curb Exchange, the
Exchange Block. There is no `neoclassical` recipe yet (see PLAN.md item AA), so expect to build the base,
order, entablature and cornice yourself. **If you find yourself writing the same shape twice, say so in your
report** — naming the next recipe is worth more than one more building.
