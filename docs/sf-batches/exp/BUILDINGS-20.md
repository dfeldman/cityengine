# Twenty buildings — the batch-size test

The same two-block stretch of the Financial District core, extended to twenty unmodelled buildings. The
first ten are the set used by experiments E1–E8; the second ten are the next largest unmodelled buildings on
the same streets.

Photographs: `/tmp/exp1-refs/<id>/way-<id>-01.jpg` upward, **best first**, plus `photos.csv`. Also
`/tmp/exp1-commons/<id>/` for four of them. **Read frames 01 to 03 only** — the tail of the ranking rarely
repays the tokens. About a third of frames are junk (a wall from three metres, a lamp post, the wrong
building); use what works, and **bail out on a building whose frames never show it**.

| # | way | name | address | height | footprint |
|---|---|---|---|---|---|
| 1 | `944039725` | — | 300 Montgomery | 58 m | 38 × 84 m |
| 2 | `243794014` | — | 550 California | 55 m | 38 × 53 m |
| 3 | `256067734` | — | *(none)* | 48 m | 33 × 42 m |
| 4 | `288511103` | Institute of Contemporary Art | 345 Montgomery | 30 m | 34 × 35 m |
| 5 | `690663633` | Alvinza Hayward Building | 400 Montgomery | 36 m | 27 × 36 m |
| 6 | `1309156123` | Exchange Block Building | 369 Pine | 31 m | 24 × 35 m |
| 7 | `260283286` | Leidesdorff Place | 340 Pine | 31 m | 18 × 42 m |
| 8 | `256066230` | Pacific Exchange | 301 Pine | 16 m | 26 × 40 m |
| 9 | `256067726` | — | 348 Pine | 28 m | 10 × 29 m |
| 10 | `151185875` | Curb Exchange | 350 Bush | 16 m | 13 × 23 m |
| 11 | `132125164` | Crocker Galleria | — | 15 m | 46 × 82 m |
| 12 | `32947380` | Wells Fargo | — | 48 m | 32 × 85 m |
| 13 | `256076599` | AT&T | 430 Bush | 32 m | 43 × 59 m |
| 14 | `260280326` | W&J Sloane Building | 222 Sutter | 42 m | 35 × 42 m |
| 15 | `260283290` | — | *(none)* | 33 m | 37 × 37 m |
| 16 | `104627922` | St. Mary's Square | 500 Pine | 20 m | 33 × 42 m |
| 17 | `132125160` | Galleria Park Hotel | 191 Sutter | 32 m | 31 × 37 m |
| 18 | `1432655283` | — | 141 Kearny | 27 m | 33 × 44 m |
| 19 | `260286446` | — | 400 California | 22 m | 28 × 39 m |
| 20 | `32947542` | 350 Sansome | 350 Sansome | 41 m | 29 × 38 m |

**The footprint is not yours to set.** `tower()` raises the building's real OSM outline at runtime;
`fit.hx`/`fit.hz` are its half-extents and `towerRing(fit)` gives the outline. The dimensions above are for
judging proportions only — never type a size.

**OSM is a hint, not an authority.** If you count different storeys in the photograph, believe the
photograph and put your figure in the entry's `height`. But the photograph only knows what it can see: the
**footprint** is the authority on depth and plan, the **photograph** on storeys, material, colour, bay
rhythm, base and crown. Where only the front is visible, model the front well and let the outline carry the
rest — a plain flank on a real plan is correct, because it is a party wall nobody sees.

Note #16, "St. Mary's Square", is a park with a garage beneath it; if the photographs show no building,
**bail out** — that is the right answer.
