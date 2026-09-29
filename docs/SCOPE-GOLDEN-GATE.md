# Deferred scope: the Golden Gate, Fort Point, and realistic rock

The owner, 2026-09-25: *"we will do Fort Point, realistic rocks, and fix the GG bridge as part of another
scope of work"* — and, setting the order: *"We WILL do Golden Gate as a realistic rideable route. This is a
huge project though and let's get the parks good enough first."*

**Nothing in this file is to be started now.** It exists so the work is not re-derived when it is, and so
nobody picks one item off it in isolation — the three belong together because they occupy the same few
hundred metres of ground and each one is hard to judge while the others are wrong.

## The three items

**1. The Golden Gate Bridge (BUGS.md #211).** Drawn TWICE up close: the OSM version as a solid extruded wall
that the path runs over — *"it looks like you're biking on a giant wall in the ocean"* — plus the low-poly
skyline model standing in the sky. Two faults: the double draw, for which the mechanism already exists
(`coversRaised`, #136 — but check whether `spec.skyline` entries participate, since they are a separate path
from landmark entries and that is the likely reason they were missed), and the fact that the OSM version is
a slab rather than a deck with a gap under it, railings, towers and cables standing clear.

Already half-diagnosed a day earlier in #182, which found 63 bridge segments rendering as buildings and noted
the double-draw explicitly — then shipped a reporting tool and no fix.

One thing that came out well: the accidental tower shape from the OSM `building:part` stacks *"isn't awful"*.
The tower geometry in OSM is roughly right; the deck and the duplication are what is wrong.

**2. Fort Point (BUGS.md #212).** A three-tier brick and granite casemated fort of 1861 directly under the
bridge's south approach — arched gun casemates in tiers, a parade court, a granite spiral stair, a lighthouse
on the roof. It currently reads as an office block because nothing in the kit produces that by accident. No
builder exists, and **its OSM outline appears to be missing**: batch b12 already hit a 404 on way/11009073,
and our cut holds nothing named Fort Point except Fort Point Light. So it must be a STANDALONE entry
(`size` + `lat` + `lon`, no OSM id), and the OSM lighthouse must be suppressed if the custom fort draws its
own.

**3. Realistic rock.** The owner: *"TrailTrainer does have a realistic rocks system, not only realistic
plants. It can do boulders and such. Useful in natural areas. I was thinking about it for the Battery area as
it is a rocky hill."*

Confirmed present: **`~/trailtrainer/public/rocks` holds 218 generated rock models**, made by
`tools/rockgen`, and rock is threaded through the same renderer modules as the planting — `ecology.ts`,
`scatter.ts`, `impostor.ts`, `layers.ts`, `ground.ts`, `palette.ts`, and the ground materials
(`materials/groundTextures.ts`, `materials/splat.ts`).

## Why rock is nearly free later — and why that argues for doing it later, not now

**Rock rides the SAME path as the plants.** It is placed by `scatter.ts`, banded by `ecology.ts`, and
far-LODded by `impostor.ts`. The park work already in flight is porting exactly those modules — the
merge-by-material shape of `scatter.ts` first (#205), then the ecology bands.

So once the vegetation port lands, rock is largely a matter of adding a library and a band rule rather than
new machinery. Starting it now would mean porting the same code twice, in two places, by two agents.

Where it will earn its keep when it comes: the Battery area's rocky hill (named by the owner), the Lands End
and Baker Beach cliffs, Mount Sutro's outcrops, and the serpentine ground in the Presidio. Note also that the
**offshore rocks (#206i) are a DIFFERENT job** — Seal Rocks, Lobos Rock and the rest are named OSM polygons
and want drawing as geometry, not scattering.

## What is worth doing before then, and it is very little

Only killing the bridge's double draw (#211's first fault), and only if it turns out to be cheap — a
supersession fix rather than a modelling one. Everything else waits. Meanwhile `docs/DEMO.md` has been
amended so corridor 4 shows the bridges as silhouettes from the waterfront, which is how it was originally
written, rather than inviting anyone to ride a deck.

---

## The owner's full statement of this scope, 2026-09-25 — and the GATE on it

> *"when our main demo routes are looking GREAT — GGP, Presidio, Market Street, California Street, downtown
> waterfront, fine-grained terrain in the big parks — then get started on making a rideable golden gate
> bridge and battery park. This needs major fixes to the bridge itself, removing the OSM version of the
> bridge, fixes to the on and off bridge paths, many custom buildings near the bridge, and a lot of work to
> render the rocky Battery park natural area with its fine grained terrain"*

**The word "then" is the whole instruction.** Nothing in this file starts until the six demo items are GREAT:

| gate item | where it stands |
|---|---|
| Golden Gate Park | squares G2A-G2K in progress, none at 100%; species/density/understorey still open |
| The Presidio | ahead of GGP, but only because mown grass is what we already do well (#213) |
| Market Street | largely built; junction work done (#183, #194) |
| California Street | the descent junction fixed (#183); frame time measured, not yet verified warm |
| Downtown waterfront | piers fixed (#181), ocean fixed (#159/#161) |
| Fine-grained terrain in the big parks | per-tile terrain in flight (#206c-#206j) |

### The six pieces of work when the gate opens

1. **Major fixes to the bridge itself** — it is currently a solid extruded slab. A deck with a gap under it,
   railings, towers and cables standing clear (#211).
2. **Removing the OSM version** — the double draw. `coversRaised` (#136) is the mechanism; check whether
   `spec.skyline` entries participate, since they are a separate path and that is the likely reason they were
   missed. #182 found 63 bridge segments rendering as buildings and shipped a reporting tool with no fix.
3. **The on- and off-bridge paths.** Named separately by the owner, and rightly: getting onto and off a
   bridge is where the ride graph, the approach ramps and the raised-edge logic all meet. Note #207 has just
   fixed the camera on raised decks, which removes one confound from testing this.
4. **Many custom buildings near the bridge** — Fort Point (#212, and its OSM outline appears to be missing so
   it wants a standalone entry), the batteries, the toll plaza and roundhouse, the Presidio's north end.
5. **Battery park as a rocky natural area** — Trail Trainer's rock system, 218 generated models in
   `~/trailtrainer/public/rocks`, riding the same `scatter.ts`/`ecology.ts`/`impostor.ts` path as the
   planting. Which is why it must come AFTER the vegetation port, not alongside it.
6. **Fine-grained terrain there** — the slope criterion (#206g) promotes this ground automatically; the
   headlands and the bluffs are the steepest in the box.

### Why the ordering is right, not just the owner's preference

Items 5 and 6 are the same code as the park work in the gate. Doing them now would mean porting
`scatter.ts` twice and building the per-tile terrain selection twice. Item 3 is far easier to judge with the
camera fixed. Item 2 is the cheapest of all and the only one worth doing early, if it turns out to be a
flag rather than a rewrite.

---

## Added 2026-09-25, and one of them is nearly free

The owner: *"Fort Point and Sutro Baths are probably custom models. The bridges themselves are a big mess.
Need retopology and to sort out the paths."*

**"Retopology" sharpens item 1 usefully.** The problem is not only that the bridge is drawn twice — the
geometry itself is wrong. The OSM version is an extruded slab and the skyline model is low-poly, so neither
is a mesh worth keeping. The deck, towers and cables want rebuilding as real topology rather than patching
what is there. #154's graded subdivision raised the triangle counts (Golden Gate 26,168 → 34,280) but
subdivided the WRONG SHAPE more finely. Budget for a rebuild, not an edit.

**"Sort out the paths"** is item 3 — the on- and off-bridge approaches — now named twice by the owner, which
is a fair signal that it is the part that will actually annoy a rider. Note #207 has since fixed the camera on
raised decks, so testing the approaches is no longer confounded by a camera pointing at the sea bed.

**Sutro Baths: the builder ALREADY EXISTS.** `s1_sutro_baths_32776564` in
`src/render/landmarks/sf/batches/s1.ts` — *"RUINS: roofless concrete walls on the actual footprint, flooded
pools, curved sea wall, scattered boulders"*, built from a photograph. And `way/32776564` is present in the
cached OSM cut.

**But it does not render, and the reason is instructive:** the way appears nowhere in
`docs/san-francisco-archetypes.csv`, i.e. the bake never classified it — because ruins are not tagged
`building=`, so the building pipeline never sees them. This is the same class as Pier 39, which needed a
standalone entry for exactly this reason. **So Sutro Baths needs an entry, not a model.** That is minutes of
work, not hours, and it is worth doing whenever someone is next in that file — it does not need to wait for
this scope.

**Fort Point still needs building** (#212), and its own outline appears to be missing from OSM entirely, so
it wants a standalone entry with a position rather than a hunt for a deleted way id.

Lands End, where Sutro Baths sits, is also where the offshore rocks are (#206i: Seal Rocks, Lobos Rock and
five more, already named polygons in OSM) and where the slope criterion will promote the terrain. The whole
western headland is one coherent later pass.

## The bridges are the one object that genuinely needs LOD — and we already have two levels by accident

The owner: *"the bridges may be a good spot for LOD since they're visible nearly anywhere from afar."*

This reframes #211, and for the better. **The bridge is the only class of object in the city that is both
visible from almost everywhere AND ridden on.** A tower is seen from across a street or not at all; a park is
only ever near. A bridge has to work at 8 km and at 2 m, and no single mesh does both — a deck detailed
enough to ride over is wasted geometry from the Embarcadero, and a silhouette good enough for the horizon is
a wall when you are on it.

**So the double draw is not simply a bug to delete. It is the right architecture, implemented as two
unrelated objects that are both drawn at once and neither of which is good:**

- the `spec.skyline` model — always drawn, boosted with distance (`skylineBoost`, 1× inside 1.5 km rising to
  1.8× by 5 km), low-poly. That is a FAR LOD, and its job is right.
- the OSM version — an extruded slab the ride path runs over. That is a NEAR LOD, and its job is right too.

The fault is that nothing switches between them, so up close the rider sees both: a wall underfoot and a
low-poly model hanging in the sky. **Deleting either one loses something real.** Delete the skyline copy and
the bridge vanishes from every view in the city; delete the OSM copy and there is nothing to ride on.

**So the work is to make them ONE object with two levels**, switched by distance, sharing a position and a
scale:
- **Far**: the silhouette — towers, cables, the deck line. Cheap, and the `skylineBoost` correction still
  applies, because at true size a distant landmark is a sliver on a screen in a way it is not to the eye.
- **Near**: the retopologised deck with a gap under it, railings, towers and cables standing clear, and the
  path running along it.
- **The switch must be hidden.** A bridge crossed at speed passes through the transition, so it cannot pop.
  Cross-fade, or place the switch where the near mesh is already occluded by the tower.

This also explains why `coversRaised` alone was never going to be the whole answer: suppressing the OSM copy
under the landmark is the right move only once the landmark HAS a near level worth standing on.

**And it generalises to exactly one other thing we have**: Sutro Tower, the third `spec.skyline` entry, which
the owner has already said you can now get close to (#154). Everything else in the city is either near or far,
never both.
