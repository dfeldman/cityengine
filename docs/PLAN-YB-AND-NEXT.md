# Work plan — updated 2026-09-23 (evening)

In order. Finish each before starting the next.

---

## 1. Yerba Buena / Moscone — FINISH TO SPEC  ← current

### North of Howard — nearly done
`docs/YERBA-BUENA.md`. Good by the owner's review: gardens, oval lawn, MLK memorial, terrace garden,
esplanade, both bridges, YBCA galleries and theatre, Metreon, St Patrick's. Lobby rebuilt with three-level
circulation, both street entrances, the level-2 plaza, escalators, signage, crescent.

- [x] **#136** duplicate bridges + the large dark pier — fixed by `coversRaised`. Also found the skybridge
      model standing 40 m off its own OSM way.
- [x] **#145** level disagreement — **not a bug**; the ground slopes across Howard. Bridge at 8 is right.
- [ ] **#134c the passage** — owner: *"cut a notch."* `way/24563077` (YBCA theatre) has a solid footprint
      across the cut; `notch` it at ground tier. **First use of the ground-tier notch idea (#144)**, and the
      same operation serves Moscone's undercroft and the 1177 Market gaps.
- [ ] stale `PATIO_H = 6` comment at `yerba-buena.ts:224` (code says 8).

### South of Howard — in progress
`docs/MOSCONE-SOUTH.md`. Five walkable heights; the level-3 network (museum → child care → ice rink).

- [x] **Ice rink** and **Moscone hall 1 (Howard)** — the two cheap masses that fix the datums. Undercroft
      verified open at rider's eye. Frontage lines published in world metres.
- [x] **West cluster** — Children's Creativity Museum (inverted cone, serpentine, sunken plaza, fan stair),
      carousel (glazed radial dome), child care building. Replaced the `spec()` preset properly.
- [ ] **Park level** — amphitheatre, Children's Garden and ponds, curved dividing wall, two curved
      esplanades, ramp, the wall-top descent choice. *(agent running)*
- [ ] **3rd Street curved entrance esplanade** — the block's set piece. Arc, stepped terraces, braced
      glazed canopy.
- [ ] **Monumental Folsom stair** — broad flight + parallel walk, full block depth, pier-and-terrace wall.
- [ ] **The Veranda** (pink) — basic cube, cheap.
- [ ] **`mosconeHall`** — a 20 m glass-box preset on `way/109141776`, lowered to 8. Still stands where the
      real halls go.
- [ ] Render the whole block together and review.

---

## 2. Marriott Marquis
`docs/MARRIOTT-MARQUIS.md`, refs `marquis-*.webp`. Re-staged `done` → `scratch` (#140 — a `setbacks` preset
cannot produce the crown). Ziggurat of boxes, connected L-shaped second tower, glass box on top,
slit-with-half-round-head windows at every setback, **offset core opening a full-height corner slit**.
Hand modelling but not exotic tools.

## 3. The two priority-600 churches
The only two survivors of the 216-preset triage (`docs/PRESET-TRIAGE.md`), and they qualify on **form**, not
on being institutions. Use the `church()` kit — they predate it.
`way/260991572` Church For the Fellowship of All People · `way/261608748` St Mary the Virgin Episcopal.

## 4. A Sonnet custom batch of 10
Follow `MODEL-A-BATCH-E13.md` + `RENDERING.md`. Carry today's lessons: references FIRST; evidenced vs
inferred per face; a render is a deliverable; escalation is not a treatment (#140); heading conventions
(#135) — always call `edgeAt()`.

---

## 5. THE SKYPARK BACKLOG — a category, not special cases

`docs/SKYPARKS.md` has the full inventory (**ten in SF**). What they share is **infrastructure, not form**:
deck planting (done), **ride-graph paths at height (NOT done)**, stairs in (done). All are hard to photograph
because Mapillary cannot see a deck. All need custom modelling. **All have ONE elevated level** — none of
Yerba Buena's stacking. Large but shallow.

### 5a. **RIDE-GRAPH EDGES AT HEIGHT** — the blocker, do this first
Every shape part now exists. What does not: a hand-modelled landmark cannot contribute an edge to the ride
graph. `Region.stairways` proves hand-authored polylines CAN become ridable edges (BUGS.md #144 correction),
but they live in the region in lat/lon, divorced from the geometry. **One piece of work unlocks the whole
category** — and also #144's passages and the stairs kit's flights.

### 5b. Embarcadero Center — `docs/EMBARCADERO-CENTER.md`
**Two-thirds already built**: the 5 towers are a correct generic preset, the Hyatt is properly custom, the
Vaillancourt Fountain exists. The job is **the elevated plaza level only** — four units, each a deck with a
`deckCut` hole to four levels of shops, stairs down to Embarcadero Plaza, bridges on to One Maritime Plaza
and Hinckley Walk. First verify whether `oneMaritimePlaza` includes its own deck or only the tower.

### 5c. Gateway / Hinckley Walk — `docs/GATEWAY-HINCKLEY.md`
**The best ride in the category — a LOOP**, in and out of Walton Square. Every townhome stands **above
parking**, so podium first. Three identical brick blocks, two identical stairs, plain towers, unit counts
irrelevant. **Trap: the parts repeat but the spacing is irregular** — repeat the parts, derive the positions
from data.

### 5d. Portsmouth Square — **explicit cost ceiling, get the gist**
The bridge is a dead end into the Hilton. Do: the deck, the **level access from Walter U Lum Place** (the
hillside case — no stair needed), the two pagoda pavilions, the Empress of China's circular openings, the
bridge as silhouette. Don't: Culture Center detail, playground equipment, anything Hilton-side.

### 5e. The rest
St Mary's Square · 101 California · **Levi's Plaza and Hallidie Plaza (SUNKEN** — the same problem, sign
flipped; OSM tags Hallidie `level=-0.9`).

---

## 6. Infrastructure and debts worth scheduling

- **#141 — read OSM's `level` tag.** Present **17,000+ times** in SF, negative and fractional, and we read
  none of it. `layer` is already carried end-to-end and the ride graph already refuses to junction across
  layers — **the machinery exists, wired to the wrong tag.** Hallidie Plaza is a free test case with a known
  answer. Generalises to cities nobody here has walked.
- **#143 — courtyard buildings render solid.** The bake carries multipolygon inner rings, `fit.ts` documents
  a `court` entry kind, `courtFacade` exists — and **no SF manifest entry uses any of it.** City Hall has two
  light courts; 50 UN Plaza is hollow. **Paris is made of courtyard blocks**, so this pays off later.
- **#137 guard is in** — `sf-queue.ts` now refuses to wipe the 977 hand-maintained rows.
- **#138 — the priority formula cannot rank a destination.** Yerba Buena scores 68–83 because it is 400–520 m
  from any ride corridor, and `sf-targets.ts`'s `kind` regex has no `conference_centre`/`parking`/`childcare`.
  Any park, campus or pedestrian quarter in any city has the same blind spot.
- **Murals / images on signs** — `SignSource {kind:'image', url}` is declared but dead code. Blocks the child
  care murals, the YBCA hexagon logo and billboards.
- **Kit gaps named by the Moscone South run**: a **lifted mass / open undercroft** slot (no way to say "starts
  at 8 m on piers"), **standing-seam roofing as a surface** (it drew ~45 boxes per roof), a **perforated
  screen** face kind, **solar arrays** as a roof treatment, a roof-level **louvre band** distinct from a
  cornice.
- **#142 — SF Federal Building** lacks its hole and wavy wing. Generally: **several `scratch` rows were
  attempted before today's kit parts existed.** A builder comment saying "the kit cannot say this" now marks
  work the new parts can finish.

---

## Reference library
`docs/shots/refs/aerials/` — **74 images**, the owner's own Google Earth captures, indexed in its README.
They exist nowhere else. Aerials show **massing**; vector views show **boundaries and paths**; **neither
states the levels** — that still needs someone who has been there (#132). And an aerial is evidence of what
IS there, never proof of what is NOT (#139: Google Earth omits one of the two Howard skybridges).
