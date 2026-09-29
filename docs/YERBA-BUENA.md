# The Yerba Buena block — what it actually is

Established 2026-09-23, entirely from the owner's own research and photographs. **Nothing in OSM, in the
bake, in Mapillary or in any audit could produce this description.** It is recorded because working it out
cost half an hour of a person's time who had *been there*, and it should not have to be done twice.

> *"It just took me half an hour, as a human, to understand that space. And I've BEEN THERE."*
> *"Yerba Buena is maybe the hardest block to model in SF."*

## THE LEVEL MODEL — authoritative

Owner, 2026-09-23, after reviewing aerial obliques and the vector map. **This supersedes every earlier
description in this file, including "two decks".** The block is a single three-level structure, and almost
every confusion recorded below came from trying to describe it with two.

### Level 1 — Moscone main hall
Runs **under the whole block**, excepting the shopping mall. Windowless exhibition volume. **Visible only
from Howard Street**, where the ground falls away enough to expose it; from everywhere else it is simply
what you are standing on. This is why it reads as "buried" on foot and why no street photograph explains
the site.

### Level 2 — garden level
The lawn, the gardens, the MLK memorial walkway. Also the **FIRST floor of every YBCA building** and of the
**Moscone lobby structure** — the YBCA galleries and theatre *start* here, not at street level. The esplanade
and the terrace garden climb from street to this level; the ground-level cut between the theatre and Moscone
passes *beneath* it.

The **MLK memorial is on the inner wall of the Moscone lobby's first floor** — it is a retaining face, which
is why it is diagonal, why it is a wall of water, and why earlier photographs looked *down* onto it.

### Level 3 — upper patio
The **Moscone lobby's second floor**, its **patio**, and the patio **extends out over part of the lobby's
first floor** — so the memorial wall below has occupied roof above it. Level 3:

- **connects to the Metreon's THIRD floor**;
- lines up roughly with the **second floor of the YBCA theatre** (which starts at level 2), joined by the
  **elevated walkway** — the open steel bridge with the curved mesh canopy, crossing above the ground cut;
- is where **BOTH Howard skybridges land**.

### What this explains that we had wrong

| we thought | actually |
|---|---|
| two decks either side of Howard | one three-level structure; the far deck is level 3's continuation |
| gardens sit on a roof | gardens are level 2; there is another level above them |
| the bridges are at "deck level" | both land on **level 3**, not the garden level |
| the MLK wall is a landscape feature | it is the **lobby's inner wall** — a building face |
| the theatre has a ground floor | its ground floor **is level 2**; street level passes under |
| Metreon meets the gardens | Metreon meets level 3 at its **third** floor, level 2 at the gardens |

### The modelling consequence

Three stacked walkable surfaces at one x/z, with the patio **overhanging** level 2 — so it is not even a
stepped heightfield, it is genuinely multi-valued (BUGS.md #130). Get the three heights right **first**;
every surface, path and building floor in this block is defined relative to them.

## The earlier description (kept for context)

**Superseded by the level model above where they disagree.**

### The shape of it

**Two raised public decks, one street between them, linked twice.**

### North of Howard — the Moscone NORTH side
Moscone North's halls are **buried**; its deck carries the main public space.

- **Yerba Buena Gardens** — a large, mostly flat lawn, gently mounded. `way/28842443`, `leisure=park`, a flat
  polygon with **no height of its own**.
- **The north esplanade** — the main access, wide shallow terraces of **alternating grass strips and paving**
  rising from the street.
- **The MLK Memorial waterfall** — a wall of rough stone piers with water sheeting between them into a pool
  with stepping stones, glazed inscription panels, patterned triangular paving, a curved balustrade above.
  Cut into the level change, so you look *down* onto it. **No OSM object at all.**
- **The gate** on the street frontage — pale precast retaining wall ~2.5–3 m, dark metal grille gates between
  stone piers, a **pergola of dark slats arching over** with planting through it, and
  `YERBA BUENA GARDENS` in orange serif lettering. **No OSM object.**
- **The Moscone North entrance** — a long two-storey glazed pavilion on Howard, `MOSCONE CENTER` in
  wall-sized letters, `MOSCONE NORTH` on a band over the doors. The buried halls' only visible face.
- **YBCA galleries** (`way/24563073`) — an L-shaped ribbed-metal box on a dark stone base, one very tall
  level, **no windows** along the frontage, and **three glazed barrel vaults clustered at one end**, breaking
  the roofline. A patio cut from one corner with a "boat pitched down" glass rooflight and a rectangular
  fountain.
- **YBCA theatre** (`way/24563077`) — separate at deck level, **connected underground**. Two rectangles: a
  mostly glass cube with light metal-panel blocks either side, and the theatre itself, a rectangle with one
  side **raked steeply down**.

### South of Howard — the Moscone SOUTH side
The whole public surface is **one continuous deck on top of Moscone South**, with things standing on it.

- **Yerba Buena Children's Garden** — brightly painted play surface, organic shape.
- **The carousel** — a small round building with a conical roof.
- **Children's Creativity Museum** (`way/288716388`) — already modelled (`childrensCreativityMuseum`).
- **The Creativity Theater**, **Yerba Buena Public Square**, curved terraced planting, paths.
- **Yerba Buena Ice Skating Center** (`way/27572497`, `leisure=ice_rink`, 15 m) — a skating rink and bowling
  centre **in a box on the roof**. Was unclaimed and **not even in the work queue** until today.

### Across Howard — two parallel bridges
- **An enclosed glazed tube** — fine vertical mullions, a **pale panelled soffit with a deep fascia**. Lands
  on the Moscone North pavilion.
- **An open deck bridge** — a flat slab with solid parapets on **tapered columns**, no glass. Metreon to the
  Moscone South deck.

A rider **passes underneath both**, so the soffits are the faces that matter.

### And across Fourth Street
- **The Metreon** (`way/24307421`) — **two different buildings back to back.** A blank pale metal box to the
  street carrying wall-sized signage (`METREON`, the red Target bullseye, `AMC`/`IMAX` on a perforated dot
  panel); a **long glazed wall to the garden**. Modelled 2026-09-23.
- **Moscone West** is on its own block and is a conventional glass building. Already modelled.
- **St Patrick's Church** faces the lawn from the next block — seen **whole and front-on across open
  ground**, which is rare and unforgiving.

## Why every automated stage failed here

| what | why it is invisible |
|---|---|
| the gate, the MLK memorial | **no OSM object of any kind** |
| the raised decks | `leisure=park` is a flat polygon; terrain samples the *ground* (#130) |
| both skybridges | OSM records them as **`highway=footway, bridge=yes`** — a centreline (#131) |
| the ice rink on the deck | a building on a roof is **a building with a wrong ground height** to every stage |
| YBCA's massing | one undifferentiated polygon, **no `building:part`s** |
| every photograph | plaza-fronted, so street imagery only sees the back (#128); the Metreon is in every frame |

## The scope decision

**Hand-model it and stop** (BUGS.md #129/#130). Do not build a superblock system, a complex loader or a
terrain redesign for this. The generalisable form is a **single-owner campus** (`INSTITUTIONS.md`), which SF
barely has and the next cities will.

**And model what is visible from the saddle**, not what is true about the structure: buried halls get no
geometry, roofs nobody sees the top of get nothing, and the decks' retaining edges and the bridge soffits get
the effort — because those are what a rider meets.
