# The Gateway complex and Hinckley Walk

Established 2026-09-23 from the owner's aerials, before any modelling. References:
`docs/shots/refs/aerials/gate-*.webp` (9).

**The best ride in the skypark category.** Five blocks of connected elevated plazas, entered and left from
the same park:

> *"You can get in to these 4 blocks from two staircases in Walton Park — one goes to the townhomes, the
> other to the apartments. So you can take a long walk starting at Walton Park, through 5 blocks of elevated
> plazas, and end up back at Walton Park."*

**It is a LOOP**, not an out-and-back. Contrast Portsmouth Square, whose bridge is a dead end into a hotel.
By the rule in `docs/SKYPARKS.md` — *rank by what a rider can DO there* — this is the prize.

## THE STRUCTURAL FACT

**Every townhome — white AND brick — stands IN THE AIR, above parking.**

That is the whole complex in one sentence. These are not houses on the ground with a plaza beside them; the
plaza level *is* the ground for them, and below it is a parking podium. The `gate-9` oblique shows it plainly:
brick townhomes sitting on an arcaded podium with cars underneath.

So the modelling order is the same as everywhere else in this category: **build the podium and its deck
first**, then stand the townhomes on it. Do not model a townhome at street level and raise it later.

## The pieces

### 3 boring towers, on 2 blocks
Plain slabs. Kit work, cheap, probably already present as ordinary buildings — **audit before building**.
The white elevated townhomes sit *inside* these blocks, between the towers.

### 3 identical blocks of RED BRICK townhomes
**All three blocks are the same.** Build the block once, place it three times. Every townhome is a **boxy
design** — flat-fronted, with **red barrel-tile roofs** (the aerials are unambiguous) over dark brick walls,
and planted courts between them.

**The owner's block pattern** — buildings in three sizes, small / medium / large:

| side | what stands on it |
|---|---|
| **Side 1** | two even MEDIUM buildings |
| **Side 2** | the edge of a medium, and a LARGE building |
| **Side 3** | the edge of that large building, and two SMALL buildings |
| **Side 4** | three SMALL buildings, connected round to one of the mediums from Side 1 |
| **middle** | two more MEDIUM buildings |

So the ring is continuous — sides share buildings at the corners, which is why the pattern reads as wrapping
rather than as four separate rows. Two more mediums stand free in the centre.

**The number of townhouses inside each building does not matter** (owner). Model the massing, not the
dwellings. That is a significant saving: these are big blocks and the unit count is invisible from outside.

### White townhomes — Hinckley Walk
Steep grey pitched roofs with dormers and bay windows, white walls, tightly packed along a brick-paved walk.
Also **above parking** — `gate-5` and `gate-6` show the arcaded podium beneath. Small planted courts and a
long red-brick terrace with clipped trees run alongside.

### One Maritime Plaza Park
`gate-1`: a low building whose **roof IS the park** — lawn, clipped hedges, a sunken planted court cut into
the roof, and circular paved features at two corners. `oneMaritimePlaza` already exists as a builder
(`market-east.ts:1055`) — **check whether it includes this deck, or only the tower.**

### Sydney G. Walton Square
The ground-level park the loop starts and ends in. Lawn, curving paths, the **Fountain of Four Seasons**,
mature trees. **Two staircases lead up from it** — one to the townhomes, one to the apartments. Those two
stairs are what make the loop possible, so they are not decoration.

**The two stairs are IDENTICAL** (owner). So it is one piece of geometry placed twice — another saving, and
it means getting one right is worth the effort. They are the loop's two doors, and a rider meets one of them
at the start and the other at the end.

## Repetition WITH IRREGULAR SPACING — the trap to avoid

Owner: *"Lots of repetition in this structure, although the spacing of the repetitive parts is irregular."*

This is the important qualifier on everything above. The **parts repeat** — three identical brick blocks,
two identical stairs, small/medium/large townhome buildings reused round each block — but they are **not
evenly spaced**. Gaps between buildings vary, courts are different widths, and the blocks do not sit on a
grid.

**So: repeat the PARTS, derive the POSITIONS.**

- A builder that lays out `n` buildings at a constant pitch along an edge will be wrong everywhere, and
  wrong in a way that looks plausible in a render — evenly spaced townhomes read as fine until compared with
  an aerial.
- Take each building's position and footprint **from the OSM ring / the aerials**, and use the repeated
  generator only for what stands there.
- This is the same discipline the Moscone South run used: the footprint's pinch stations **located** the
  joints while the photograph **sized** the masses. Location from data, form from the repeated part.

Concretely: `small`, `medium` and `large` should be three parameterised functions; the block layout should be
a table of (position, size) read off the aerial, not a loop over a pitch.

## Why it is cheaper than it looks

- **Three identical brick blocks** — one generator, placed three times.
- **The two Walton Square stairs are identical** — one piece of geometry, placed twice.
- **The towers are plain.**
- **Unit counts do not matter**, so the townhomes are massing only.
- **ONE elevated level throughout** — no stacking, unlike Yerba Buena's five.

What it needs that we do not yet have: **paths in the ride graph at height**. The geometry parts all exist
(`deckCut`, `stair`, `arcStair`, `ramp`, `railing`, and deck planting). The loop is worthless to a rider
until a hand-modelled landmark can contribute ride-graph edges — the gap named in BUGS.md #144's correction,
and the single highest-value piece of infrastructure work left in this category.
