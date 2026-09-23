# Where the OSM data comes from

A bake needs everything OpenStreetMap knows about a box a few kilometres across. Until now it asked public
Overpass instances, one grid chunk at a time. San Francisco's box is 144 km²; the bake spent **hours** being
told `429 Too Many Requests` and `504 Gateway Timeout` by servers run on donated hardware, and Chicago and New
York are larger again. That does not scale, and it is not a polite use of a shared service.

So the bake now reads a **local Geofabrik extract** with [osmium](https://osmcode.org/osmium-tool/), and only
falls back to Overpass when it cannot.

## Setup, once

```sh
brew install osmium-tool
node --experimental-strip-types tools/osm-fetch.ts norcal    # ~0.65 GB, covers all of northern California
```

`tools/osm-fetch.ts` with no argument prints what you have, how old it is and what it covers. Known regions:
`norcal`, `california`, `illinois`, `new-york`, `ile-de-france` — or give any `download.geofabrik.de` URL.

Extracts live in `tools/cache/osm/` (gitignored, like the rest of `tools/cache/`) next to a `.source.json`
recording the URL and the day it was fetched. The extract's own vintage comes out of the PBF header
(`osmosis_replication_timestamp`) and is what `osm-fetch.ts` reports and what ends up in the baked package's
`timestamp`, so a package always says how old its data really is.

## What happens during a bake

`tools/overpass.ts` is still the only door. `overpass()` now tries three sources in order:

1. **the disk cache** — `tools/cache/overpass-<hash>.json`, unchanged, keyed by the query text as before;
2. **the local extract** (`tools/osm-local.ts`), whose answer is written into that very same cache file in
   the very same shape;
3. **the public Overpass servers**, exactly as before.

`overpassTiled()` cuts **once** for the whole (grid-aligned) box and answers every chunk from that one cut, so
a bake runs osmium a handful of times rather than once per chunk.

The local path is three osmium passes, cached as one `.osm.opl` file per box under `tools/cache/osm/cuts/`:

- `osmium extract -b … --strategy smart -S types=any` — ways complete, and a multipolygon's members brought in
  even where they leave the box, which is what Overpass's `out geom` gives and what the ring stitching needs;
- `osmium tags-filter nwr/highway nwr/building …` — down to the keys the queries ever ask about (`KEPT_KEYS`);
- `osmium add-locations-to-ways` — every way carries its own geometry, so the millions of untagged nodes go
  away and the cut parses in seconds.

## What still goes to Overpass, and why

The local path answers only a **strict subset of Overpass QL** — `[out:json][timeout:N];( statements );out
[geom] qt;` where each statement is `way`/`node`/`relation`, `["k"]`, `["k"="v"]`, `["k"~"re"]`, `["k"!="v"]`,
`["k"!~"re"]` clauses and one bbox. Everything else parses to `null` and goes to the network:

- **no osmium installed, or no extract covering the box** — someone who has not set this up bakes exactly as
  before, only slowly;
- **a query naming a tag key outside `KEPT_KEYS`** in a positive clause: the cut does not contain that data,
  and answering from it would silently return nothing. (Negative clauses like `["area"!~"yes"]` are fine —
  matched objects keep all their tags.) *If you add a key to a query in `overpass.ts`, add it to `KEPT_KEYS`
  too, or that query quietly goes back to being slow;*
- **anything cleverer** — `around:`, `area`, recursion (`>`, `<`), `out meta`, nested unions.

This is not theoretical: `squaresQuery` asks `["highway"="pedestrian"]["area"="yes"]`, `area` was missing from
`KEPT_KEYS`, and the query went quietly back to the network until `osm-compare.ts` printed "NOT answerable
locally". The compare tool catches a missing key as readily as it catches missing data — run it after touching
a query.

`SR_NO_LOCAL_OSM=1` forces the network path for a run, for comparing.

## Is it the same data?

`tools/osm-compare.ts` asks Overpass and the local cut the same question and diffs the answers — both sides
bypassing the cache, so it is a real comparison:

```sh
node --experimental-strip-types tools/osm-compare.ts                       # a few blocks of Russian Hill
node --experimental-strip-types tools/osm-compare.ts 37.768 -122.470 37.773 -122.463   # Golden Gate Park
```

Measured 2026-09-22 against the 2026-09-21 norcal extract, on three boxes (Russian Hill, Golden Gate Park,
the Embarcadero shoreline): **identical** — same element ids, same tags, same node counts, same geometry
lengths, same relation members *and the same geometry on every member*, which is what `outerRings()` stitches
the Bay and the parks out of. `cityQuery` 1277/1277, 653/653, 1395/1395; `wideQuery` 784/784 over the
shoreline; `furnitureQuery` 105/105, 46/46, 151/151; `stepsQuery` 15/15, 31/31, 59/59; `squaresQuery` 20/20;
`bridgesQuery` 0/0.

One relation (`relation/2642389`, Harry Bridges Plaza) came back from Overpass with a different tag set from
the extract's. It was the mirror, not us: the OSM API says the extract's copy is the current object (v5,
untouched since 2026-07-16), and a later re-query — answered by a mirror whose own base was 2026-07-28 —
returned exactly the extract's tags. The public instances are not all serving the same day's data, which is
one more reason to stop depending on them.

Two known differences in kind, neither seen in practice: elements come back in insertion order rather than
Overpass's `qt` quadtile order (identical data, possibly a different array order in a re-baked package), and
Overpass may return a way that *crosses* a small box without having a node inside it, which `osmium extract`
will not — irrelevant for a tiled grid over a whole city, conceivably visible on a tiny direct query.

Expect the rest to drift as the extract ages: an id on one side only is someone's edit since the snapshot. The
same id with *different content* would be a bug in the local pipeline, and that is the line the tool draws.

## Staleness, and mixed vintages

The extract is a snapshot. Nothing re-downloads it on its own; re-run `osm-fetch.ts` when the data matters —
a new building, a fixed street — and then **delete the cut for that box** (`tools/cache/osm/cuts/`, or just
the lot: it is rebuilt in seconds) and the `tools/cache/overpass-*.json` entries you want re-answered.

The old Overpass cache entries are still valid and are still used first, on purpose: throwing away a cache
that cost hours to fill would be silly. That does mean one city can be part 2026-09 Overpass data and part
2026-09 extract data. In practice OSM changes slowly enough that this shows up nowhere; if you ever want one
clean vintage, delete `tools/cache/overpass-*.json` and re-bake (which is now cheap, which is the point).

## How long it takes now

Measured on the MacBook Air, San Francisco's whole box (12.2 × 8.2 km, 144 km²):

| step | time |
| --- | --- |
| download norcal, once ever | ~2 min |
| `osmium extract` + `tags-filter` + `add-locations-to-ways` for the box | 5 s (95 MB OPL) |
| cut + parse together, into memory | ~6 s (141k ways, 87k nodes, 2.6k relations, ~0.7 GB RSS) |
| answering one grid chunk of `cityQuery` | ~0.18 s |
| the whole tiled `cityQuery` over 2.2 × 2.2 km, cut included, cold cache | 24 s |

A bake asks several boxes (whole, detail, steps, squares, furniture, bridges, fringe strips); a region already
in memory that *contains* the next box is reused rather than cut again, but the steps grid and the fringe
strips reach outside the whole box and do cut again — so San Francisco costs a few cuts at 5–7 s each.
The OSM phase of a San Francisco bake should now be **one to two minutes cold**, against hours of 429s — and
it is the same minute with an empty cache. The rest of the bake (facades, planting, packaging) is unchanged.
