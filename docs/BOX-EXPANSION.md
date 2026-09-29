# Expanding the San Francisco box — measured, 2026-09-23

The owner asked whether Dogpatch / the eastern waterfront *"is supposed to be in the box, and it's just not
working for some reason"*, and whether Mount Sutro could be added for the climb and the views.

**Measured against `tools/cities.ts`. The answer is not what either of us assumed.**

    box:    { west: 9800, east: 7800, north: 4600, south: 3600 }
    detail: { west: 9800, east: 2400, north: 2400, south: 3600 }

| place | world x, z | excluded because |
|---|---|---|
| **Pier 70** | 2320, −3614 | **south by 14 m** |
| **Dogpatch** | 2021, −3936 | south by 336 m |
| **Mount Sutro summit** | −4016, −4192 | south by 592 m |
| Port cranes / Pier 80 | 2636, −5004 | south by 1404 m, east by 236 m |
| Bayview / Hunters Point | 2812, −7005 | south by 3405 m, east by 412 m |
| **UCSF Parnassus** | −4042, −3369 | **NOT EXCLUDED — already inside both boxes** |

**It is the SOUTH limit, not east.** Both boxes stop at 3600 m, and everything wanted is just beyond it.
Pier 70 misses by **fourteen metres**.

## What a modest southward extension would buy

`south: 3600 → 4300` (plus `east: 2400 → 2700` on the detail box for the port) brings in **Dogpatch,
Pier 70 and the Mount Sutro summit** — the two things the owner named — without reaching Bayview or Hunters
Point, which are a further 3 km south and would add a great deal of ordinary fabric.

## Mount Sutro: the UCSF worry is already real

The owner: *"the downside is it would include the UCSF campus over there, which has at least 50 buildings
that would need careful modeling."*

**UCSF Parnassus is already in the detail box** — it was never gated by the boundary. Measured within 420 m
of the campus centre: **653 buildings, of which ZERO have a builder or a reface.** About 20 are named
institutional buildings (Medical Sciences, Health Sciences East/West, Clinical Science, Kalmanovitz Library,
Koret Vision Research Laboratory, the Main Parking Garage…); the rest is Inner Sunset housing, which the
generic path handles acceptably.

So extending south for Mount Sutro **does not add the UCSF problem — we already have it.** That reframes it
from a cost of expansion to an existing gap, and ~20 named buildings is a normal batch, not a campaign.

## The port: worth it, but not for biking

*"it would be cool to render stacks of shipping containers and huge port cranes… There are also more
freeways, and we're quite bad at rendering freeways and they're useless for biking anyway."*

Both halves are right, and they point opposite ways:
- **Container stacks and gantry cranes are cheap and spectacular** — boxes and lattice frames, highly
  repetitive, visible from a long way off. They are the "not a kit, but simple geometry" class.
- **The port is walled off and freeway-bound**, so a rider cannot go there, and by the rule established for
  Portsmouth Square — *rank by what a rider can DO there* — that caps its value.

**Suggestion**: bring the port in as **scenery seen from the Dogpatch waterfront**, not as ridable ground.
That is the same treatment Alcatraz gets (a `skyline` entry, BUGS.md notes) and it costs almost nothing.

## Cost of extending the box at all

Re-baking is required, and the bake is not cheap in wall time — but it is free in tokens, and **four
bake-level fixes are already staged** (#150/#151 pylons, #152 billboards, #155 shack heights, plus the
Oracle Park claims). If the box changes, it should change **before** that re-bake so one run covers
everything.
