# Church for the Fellowship of All Peoples — redo brief

`way/260991572`, 2041 Larkin Street. Owner, 2026-09-23: *"let's redo church for a fellowship of all peoples.
it's an interesting one."*

**REFERENCE ON DISK**: `docs/shots/refs/aerials/fellowship-church.jpg` — a black-and-white street
photograph of the front, supplied by the owner. **Look at it.** The reading below is written from it and
from three further images (two aerial) that could not be saved.

## What it actually is

**Art Deco / Moderne, cream-white stucco, 1920s–30s.** Not a traditional church form at all — which is why it
is interesting, and why the first pass (a generic `church()` call) undersold it.

### The tower — the whole point of the building
- Stands at the **FRONT-LEFT corner**, hard against the street.
- **Very tall and very SLENDER** — a thin square shaft rising well clear of the nave, far taller in
  proportion than a normal parish tower.
- The shaft is **plain flat stucco** with a couple of small square windows, no buttresses, no string courses.
- Near the top it becomes an **OCTAGONAL belfry stage**, slightly wider than the shaft, carrying
  **tall narrow louvred openings in PAIRS** — two slots per face, deeply recessed, with horizontal louvre
  bars visible.
- Capped by a **ROUNDED / shallow-domed head** with a banded rim — **not flat, not a spire, and not a
  cross-topped lantern.** The photograph shows the top edge curving.
- The shaft carries a **recessed vertical strip** down its street face — a shallow channel, the only
  articulation on an otherwise plain shaft.

### The front
- **THREE pointed-arch doorways side by side**, dark green doors. The arch heads are **angular Deco points**
  — chevron-like, not smooth Gothic curves.
- **Flat pilaster strips** between and beside the doors, running up from the pavement and stopping at a
  plain band — they read as buttress stubs without projecting much.
- A **stepped / battered parapet** above, rising slightly toward the centre.
- A small **chalice emblem** incised on the wall above the doors, and faint incised ornament near the top.

### The body
- A **plain boxy stucco mass**, almost windowless on the street elevation.
- **One tall narrow pointed window** high on the side elevation, with a small projecting balcony under it.
- Behind the parapet, a **large STEEP DARK HIPPED ROOF** covers the nave — clearly visible from above and a
  big part of the silhouette. The first pass gave it a flat roof, which is wrong.

## What the first pass got wrong

`churchForFellowshipOfAllPeople` in `sf/churches-2.ts` used `church()` with `tower: {plan:'octagon',
stages:3, top:'lantern'}`, `front: {kind:'plain', portal:'triple'}`, `walls: {material:'precast',
openings:'blank'}`, flat roof. 1,022 triangles.

Right instincts — octagon, triple portal, plain walls — but:

1. **The tower is not slender enough.** Its slenderness is the single most identifying thing.
2. **Only the TOP stage is octagonal**; the shaft below is square. A three-stage octagon is the wrong form.
3. **The roof should be a steep dark hipped roof**, not flat.
4. **`lantern` is wrong for the cap** — it wants a flat banded head, no cross.
5. **The paired louvred slots** in the belfry are absent, and they are what reads against the sky.
6. The **angular Deco arch heads** on the portals are not a plain arch.

## How to do it

`church()` may not reach this. **Mixing `church()` with raw primitives is supported and is probably right
here** — or drop the kit entirely for this one; the owner calls it interesting, and it is closer to a Deco
civic building than to a parish church.

The `church()` kit's `Material` union has **no wood/shingle and no smooth-stucco-Deco option** — noted by the
run that built it. Use the nearest and say so.
