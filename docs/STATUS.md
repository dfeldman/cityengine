# Where things stand — 2026-09-25, while the batched bake runs

`BUGS.md` holds the full write-ups (#1–#214) and `CHANGELOG.md` the costed history. This is the map.
**The distinction that matters most is still FIXED versus VERIFIED** — several things have been marked fixed
on reasoning and turned out not to be.

## The goal, in the owner's order

> *"when our main demo routes are looking GREAT — GGP, Presidio, Market Street, California Street, downtown
> waterfront, fine-grained terrain in the big parks — then get started on making a rideable golden gate
> bridge and battery park."*

The word **then** is the instruction. `docs/SCOPE-GOLDEN-GATE.md` holds the whole deferred scope.

| gate item | state |
|---|---|
| Golden Gate Park | squares G2A–G2K in progress, none at 100%; the forest itself is the open item |
| The Presidio | ahead of GGP — but only because mown grass is what we already do well (#213) |
| Market Street | junctions fixed (#183, #194); largely built |
| California Street | the descent junction fixed and LIVE; frame time measured, not verified warm |
| Downtown waterfront | ocean (#159/#161) and all 16 piers (#181) fixed |
| Fine terrain in the parks | shipped; in the bake now |

## Running right now

- **Bake pid 46837** — carries per-tile terrain, the park bake-side work, the detail-box extension
  (Treasure Island, Yerba Buena, Alcatraz, the Marin headlands, which also unparks #175's 18 builders), and
  the junction fixes. Slow on Overpass 429s, which it handles by rolling servers.
- **Three agents**, all render-time and none bake-gated: the forest (scatter merge, canopy, species,
  understorey), the sports-pitch kit (#214), the Lyon Street Steps (#213a).

## Fixed and verified since the last snapshot

- **#179 the load** — 86–148 s → **5.0 s**. Two causes: `distantGround` walking the whole terrain grid
  unclipped because `CityMeta` never carried `box`, and `groundOccluder` doing ~10¹⁰ edge tests (288 s → 5.5 s,
  81×, all 4,005,327 probes identical to the linear scan). First-frame heap 2,929 MB → ~800 MB against a
  3 GB ceiling.
- **#169 the vertex-buffer flood** — the `clouds` mesh, drawn non-instanced against zero-length instanced
  buffers. 40 of 40 frames; now silent over 120 frames with the crowd.
- **#184/#190 the missing avatar and trees** — a stale Vite dep cache, not a shader bug. **A hard reload does
  not clear it; incognito does.** Root-fixed with a per-server `cacheDir`.
- **#163 the map's "old box"** — `cityFor()` accepted a coordinate only within `radius × 1.5`; SF's radius is
  3,340 m against a 17,600 × 8,200 m box. Plus a 5,000 m zoom cap that could never fit it.
- **#207 the camera on bridges** — aimed at terrain, which under a bridge is the sea bed. Golden Gate mean
  pitch −73.2° → −6.1°; the Bay Bridge's 42° swing → −3.2°. A general raised-edge fault.
- **#194 doubling-back edges** — 43 → 6 (bike), 168 → 38 (run). Live.
- **#208 the headlands** — park rules reached **4%** of their tiles; now 96%.

## Open, worst first

| # | what | state |
|---|---|---|
| #199 | too little vegetation, wrong species, no groundcover, planted where it should be bare | **in progress** — the forest agent |
| #200 | the beach is grass — and must be BANDS, not one sand tone (rip-rap → dry → wet → water) | in the bake; banding still to build |
| #211 | the Golden Gate drawn TWICE, and the OSM copy is a wall | deferred by the owner, `SCOPE-GOLDEN-GATE.md` |
| #213 | Presidio: steps at 50%, batteries, The Landmark, the WEF centre | steps in progress |
| #214 | 1,421 sports pitches drawn as flat polygons | in progress |
| #191 | `pathmap` builds a mesh from an empty position array | open |
| #189 | phantom overpasses over creeks we do not have — **two independent sightings** | open, now a general rule |
| #195 | every park way should be rideable; JFK Drive's 40° exit reads as "straight on" | open |
| #197 | Sunset Dunes is a dead end at the box edge; wants invented connectors | open |
| #198b | the Polo Field grandstand and the park's other one-off structures | open |
| #212 | Fort Point reads as an office block; its OSM outline appears to be missing | deferred with the bridge |
| #206b | `bareEarth`'s opening eats a third of the terrain gain; conditional on buildings would give parks 1.95× | open, best remaining terrain lever |
| — | the 22.3 ms frame floor is unattributed and is 80% of the frame at low plant counts | open |

## The things that keep going wrong

1. **A render is a weak instrument and lies in specific ways.** It cannot show a double-draw, a sunken
   building, a depth-precision fault or a frame-time problem. Measure the baked numbers.
2. **Fixing one thing invalidates an assumption under another.** The sea level exposed the piers; the park
   rule removed the lampposts; suppressing furniture missed signs, and suppressing signs missed signals —
   **three subsystems, three placement paths, found one at a time.**
3. **The test harness has twice proved the wrong thing.** `views.ts` passes `without=life`, so three passes
   "confirmed" strangers were missing when no crowd had been spawned at all. `ride-shot` photographs from
   under the water on any bridge.
4. **Measure before spending.** The far-plane saving was an eighth of what was claimed; the worker premise
   rested on a number that was off by 1000×; the straightening algorithm would have moved 1,405 junctions by
   0.15 m. All three were dropped on evidence, and that is the process working.
