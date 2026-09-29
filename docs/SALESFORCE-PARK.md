# Salesforce Park — a block that needs its own pass

The owner, 2026-09-25: *"Salesforce Park needs a ton of additional work. There are multiple buildings that
are completely wrong that intersect the park, the park itself is too small, there are a number of notable
buildings that are missing, and there's no path up to the park level (the gondola is not functional)."*

**Why this is one job and not five bugs.** Everything on this block fails together: the deck is the wrong
size, so it sits wrong against its neighbours; the neighbours are generic massing, so they grow into the
deck; and there is no way up, so a rider cannot check any of it from the one viewpoint that matters. Fixing
them separately means re-judging the same block four times. `docs/DEMO.md`'s Market/FiDi corridor runs past
it, and the park is the most distinctive thing on that corridor after the Ferry Building.

## 1. The footprint is wrong — measured, and the numbers are here

From `relation/8524888` (the park; `leisure=park, level=3`), 13 member ways, 2,880 points, by rotating
calipers — **not** from `way/542375290`, which is the transit centre building:

| | real | our entry (`landmarks/san-francisco/transbay.json`) |
|---|---|---|
| long axis | **435 m at 51°** | 438 at `front: 45` |
| width | **92 m** | 56 |
| centre | 37.789078, −122.396916 | 37.7891166, −122.3968718 |

Length and centre are right. **The width is 39% short and the bearing is 6° off**, and 6° over 435 m swings
each end ~23 m off line — which against the street grid reads as "it stops a block short of 2nd". Fix by
taking `size` and `front` from the relation's own calipers: `size: [435, 92]`, `front: 51`.

**Check first whether the builder scales its contents to the footprint.** A 39% widening that stretches the
amphitheatre, the playground and the planting beds is not an improvement.

## 2. The neighbours are wrong, and they intersect the deck

The owner counted them from the street: *"Going in a line from 2nd st to Beale st: There are FOUR tall
buildings before hitting Salesforce along Mission St, then Salesforce, then TWO on the other side of Fremont
(one is tall, one is mid). We only have 2 buildings before hitting Salesforce (1 tall, 1 mid), and 2 after."*
And on the other side: *"On the howard street side, there are 2 low rises, and then a high rise at Fremont
and Howard."*

So: **two tall buildings missing on Mission, and a high rise missing at Fremont and Howard.** Establish first
whether OSM has them — a missing building is a data problem and a wrong-looking one is a modelling problem,
and they want different work.

**The owner's reason for custom-modelling the survivors is the important part:** *"First because they're all
architecturally interesting. Second, because we need to model them so that they don't intersect and occlude
the park."* Generic massing grows into the deck. So modelling the neighbours is part of fixing the park's own
silhouette, not a separate wish.

Known wrong on this block already:
- **400 Howard (Foundry Square I, `way/136104348`)** is classified `skyscraper` and is not one. OSM says
  `height=32`; a bare `building:part` (`way/1410037751`, `height=50`, no other tags) overrides it and we
  silently believe the taller half. See #222 and the tall-audit note (#182) — the audit reports this class
  and nothing acts on it.
- **Two records float in mid-air** near 37.789765, −122.395819: `building:part`s carrying `minHeight` 4, 8
  and 12 m whose parent outline was superseded away, including one degenerate `height 12, minHeight 12`.

## 3. There is no way up to the park

*"there's no path up to the park level (the gondola is not functional)."* The deck is at level 3, about 21 m
up, and a rider cannot reach it. The park is only worth its modelling if it can be stood on.

OSM has the pieces: the amphitheatre (`node/5827822527`, `level=3`), the children's reading room
(`node/6582592284`, `level=3`), the playground (`way/1216690681`, `level=3`). What is missing is a route.
Options, cheapest first: the stairs and escalators from Mission Street; a ramp; or making the gondola work.
**The stair kit built for the Lyon Street Steps (#213a) is the obvious tool** — flights, landings and
rake-following balustrades already exist.

## 4. Walls under the deck block the way through

*"You cannot actually go under salesforce park smoothly, there are walls in the way (that of course you can
go right through)."* Drawn but not ridden, so something is being drawn that the ride graph does not know
about: the deck's supports, or a piece of OSM structure the landmark's `coversRaised` footprint does not
claim. Note the footprint is 36 m too narrow (§1), which would leave a strip of OSM structure uncovered down
each side — **fixing §1 may fix this for free**, and is worth doing first for that reason.

## The order that makes sense

1. **The footprint** (§1). Everything else is judged against it, and it is one line of data.
2. **The way up** (§3). Until a rider can stand on the deck, nothing here can be verified from the place it
   matters.
3. **The walls** (§4) — likely free after §1.
4. **The neighbours** (§2), last and largest: establish what OSM has, then model.
