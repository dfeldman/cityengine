# The building kit, with pictures

The shared kit — `src/render/landmarks/parts.ts`, `kit.ts`, `tower.ts`, `column.ts` — exports 45 building
functions. Nine modelling runs used **five** of them, and `pediment` had never been used anywhere in the
project ([MODELING_IMPROVEMENT_1.md](../MODELING_IMPROVEMENT_1.md) §"The working vocabulary is five functions
out of forty-five"). The diagnosis there was that the kit is not short of parts, it is short of any way to
find out what the parts are: `quoins`, `spireOn`, `faceOn` and `stripRoof` mean nothing without a picture.

This is that picture. Every entry below has a **signature copied from the source**, a sentence on what it
draws, the building feature it corresponds to, and a rendering of it on its own.

Each picture is a builder in
[`src/render/landmarks/sf/experiments/kit-demo.ts`](../src/render/landmarks/sf/experiments/kit-demo.ts), so
you can open any of them live — `http://localhost:5200/?model=kit_colonnade` — and the source of the demo is
a worked example of how to call the part. `node --experimental-strip-types tools/kit-shots.ts` redraws them
all.

**Frame and facing.** Everything works in the fit's local frame, y up, on a ring from `towerRing(fit)`. The
demos put the front on local **−z**, which is where the camera stands. The `kit.ts` parts (`pane`,
`archedPane`, `pointedPane`, `pediment`, `courtFacade`) draw on −z already. The `parts.ts` parts take a
**`heading`**, where **0 faces +z** — so a front wall at −z wants `heading: Math.PI`, or, on any edge of any
ring, `edgeAt(ring, i).heading`. Getting this wrong is the single commonest bug in this code: signs come out
backwards and marquees collapse to an invisible sliver.

---

## The one distinction to get right: arcade vs colonnade

These two names are near-synonyms in ordinary English and they draw completely different things. A run that
had never seen either called `colonnade()` eleven times on buildings that wanted `arcade()`.

![](shots/kit/kit_arcade_vs_colonnade.png)

**Left: `arcade`** — a wall PIERCED BY round-headed OPENINGS. The wall is the thing; the openings are cut in
it. Leidesdorff Place, the Curb Exchange, the Ferry Building, most bank and hotel ground floors, a park
loggia.

**Right: `colonnade`** — a ROW OF FREE-STANDING POSTS in front of a wall, carrying a flat entablature. A
temple front. The Pacific Exchange (301 Pine), the Opera House, the Asian Art Museum, a bank's portico.

If you can walk *behind* the columns and the wall is well back — colonnade. If the columns are *in* the wall
plane with arches between them — arcade.

---

## `facade()` — the default path

![](shots/kit/sheet-facade-api.png)

```ts
export function facade(out: MeshBuilder, fit: Fit, spec: FacadeSpec): void
```

One call raises a whole building from its fitted footprint, said in the parts a person naming them from
across the street would use rather than in tiers and fractions of height. It is built **on top of `tower()`**
— it translates slots into tiers, faces, cornices and a crown, then places the things the tower grammar has
no word for: the arcade or colonnade at the ground, the frame, the entrance.

**Use `facade()` unless the building's form cannot be said in slots, in which case model it by hand.** The
rest of this catalogue stays available and mixes freely with it: call `tower()`, `colonnade()`, `beam()`,
`cupola()` or raw `box()` on the same building, before or after. A round or curved plan, a twisted tower, a
checkerboard in-and-out grid — those are bespoke work, and reaching for primitives there is the right answer,
not a failure. **Always using the kit is how a distinctive building becomes a generic box.**

### The one mechanism: required keys, nullable values

```ts
export interface FacadeSpec {
  ground:   Ground   | null   // what the street-level storeys do
  shaft:    Shaft    | null   // the repeating middle — NULLABLE: a temple has none
  top:      Top      | null   // storeys that differ from the shaft
  bands:    Bands    | null   // the horizontal lines between the sections, and the cornice
  crown:    Crown    | null   // tower()'s own closed set, pictured further down this page
  frame:    Frame    | null   // verticals and/or horizontals proud of a recessed wall
  entrance: Entrance | null   // the way in, at eye level
  material: Material          // the wall's substance; every section may override it
}
```

**There are no optional keys.** A model must write `frame: null` — a decision made while looking at a
photograph — where an optional parameter lets it write nothing and never look. TypeScript turns the omission
into a compile error. `null` is a first-class, unembarrassing answer: most streets outside a downtown core
have no decorative ground floor, no frame and no crown.

Passing `ground`, `shaft` and `top` all null **throws**: a building with no storeys anywhere is a slip, and a
silent slab is the failure this API exists to prevent.

### Sections are counted in STOREYS

Every section takes a `storeys` count — a thing you can count in a photograph — and the kit divides
`fit.height` between them. Never a fraction, never a metre height, never a `solid` value. `windows: 'wide'`
becomes `solid: 0.25` inside; `'balanced'` 0.45; `'small'` 0.62. The model reports what it sees, the kit
converts to craft.

### `Windows` — including the DRESSED ones

```ts
type Windows = 'wide' | 'balanced' | 'small' | 'continuous' | 'vertical' | 'horizontal' | 'arched' | 'bays'
             | 'dressed' | 'pedimented' | 'segmental'
```

The last three give every window of that section an **aedicule**: a moulded architrave up the jambs, a sill
under it, and a cornice over the head carried on two brackets — plus, for `'pedimented'` and `'segmental'`, a
little triangular or curved gable standing on that cornice. This is the most visible neoclassical detail
after the columns, and it was completely unsayable: a bank's or a courthouse's principal storeys are defined
by it, and so are the US Appraisers Building's (way/32965865), which is one of the `classical` refaces that
failed repeatedly.

The surround is laid out from the same arithmetic that cuts the opening, so it cannot drift off its window;
below about a metre of window, or a storey under 2.2 m, it is skipped as noise. A gable is drawn with its
**raking top surface** as well as its tympanum — a flat triangle in the wall plane has the wall's own normal,
shades identically to it and is invisible, which is exactly how the first version came out on screen.

![](shots/kit/kit_facade_aedicules.png)
![](shots/kit/kit_facade_quoins.png)

*Left: `shaft: { windows: 'pedimented' }` over a rusticated base, under a modillioned cornice and a
balustrade. Right: `windows: 'segmental'`, with `frame: { verticals: { kind: 'quoins', at: 'corners' } }` —
quoins as a slot, on every sharp corner of the ring, with no recess behind them.*

### Flat walls, and every slot works per EDGE

`fit.ring` is an arbitrary polygon — one building in the test set has a 17-corner plan — and every placed
slot takes an `on`:

| `on` | which edges |
|---|---|
| `'front'` (default) | the longest edge, `longestEdge(ring)` |
| `'street'` | the front plus every edge at least 75% as long — a corner building's two elevations |
| `'all'` | every edge of the ring |
| a number | one edge index into `towerRing(fit)` — the SIMPLIFIED ring, not raw `fit.ring` |

**A facade cannot be curved.** A polygon edge is flat by construction and everything here is drawn on one.
`roundRing()` turns corners into short straight segments and is the nearest thing to a curve there is; a
genuinely round building is hand work.

### `Ground` — the slot to fill first

E9 judged 11 of its 19 downtown buildings to have a decorative ground floor. It is also what a rider passes
closest to.

```ts
type Ground =
  | { kind: 'arcade';     arches: number; storeys: number; on?: On; order?: Order }
  | { kind: 'colonnade';  columns: number; storeys: number; order: Order; on?: On }
  | { kind: 'giant-order'; columns: number; storeys: number; order: Order; windows: Windows
      engaged: boolean; flanks: boolean; pediment: boolean; on?: On }
  | { kind: 'portico';    columns: number; storeys: number; order: Order; pediment: boolean
      steps: number; projecting: boolean; on?: On }
  | { kind: 'shopfronts'; bays: number; storeys: number }
  | { kind: 'rusticated'; storeys: number }
  | { kind: 'recessed';   storeys: number; depth: number }
  | { kind: 'plain';      storeys: number }
```

Each also takes `material: Material | null` — required like every other key, `null` to inherit the
building's. That is what says "a dark green podium under cream terracotta" (the Exchange Block, 369 Pine). **`storeys` may be nearly the
whole building**: a temple front is `ground` with a big count and `shaft: null`, which is the Pacific Exchange
(301 Pine), a 16 m building whose colonnade runs almost full height and the case a mandatory shaft forces a
model to fake.

![](shots/kit/kit_facade_arcaded.png)
![](shots/kit/kit_facade_temple.png)

*Left: `ground: { kind: 'arcade', arches: 5, storeys: 2 }` under a punched shaft — Leidesdorff Place's
pattern. Right: `{ kind: 'portico', columns: 6, storeys: 4, pediment: true, steps: 5, projecting: true }` with
`shaft: null` — a temple, where the ground floor IS the building.*

**`arcade`'s `on` now defaults to `'all'`, not `'front'` (BUGS.md #96, second half, 2026-09-24).** Left at
`'front'`, only the longest edge got arches; every other edge — the side of a corner building, the second
wing of an L-shaped one — kept the plain wall `groundFace` draws underneath, which reads exactly like the
already-fixed "no arches at all" bug in any view but a front elevation. `shopfronts`/`rusticated`/`plain`
never had this problem because their `Face` covers every edge regardless. An edge too short to hold even one
bay (under 1.6 m — common survey-noise jogs in a real OSM footprint) is skipped rather than crammed with
piers. Pass `on: 'front'` explicitly for a building that really should show its arcade on one face only.

### `giant-order` — columns several storeys tall over a WINDOWED wall

The defining move of a bank, a courthouse, an exchange or a university library, and the one thing
`colonnade` could not say. A colonnade stands its columns against a **blank** wall, which is right for a
temple and wrong for every classical building that has offices behind it — and they nearly all do.

```ts
{ kind: 'giant-order', columns: 6, storeys: 4, order: 'corinthian',
  windows: 'balanced',     // WHAT THE WALL BEHIND THE COLUMNS DOES — the point of the kind
  engaged: false,          // true: three-quarter columns flat on the wall; false: standing free in front
  flanks: false,           // true: solid end blocks, the order recessed between them (in antis)
  pediment: false,         // a gable over the whole run; most American examples have none
  material: 'limestone' }
```

`storeys` is how many floors the order spans, and a `shaft` and a `top` may sit above it: that is what makes
it a giant order rather than a portico. Everything — column radius, entablature depth, how far the columns
stand out, the width of the antae — is derived from those storeys' height and the edge's length.

![](shots/kit/kit_facade_giant_order.png)
![](shots/kit/kit_facade_in_antis.png)

*Left: six free-standing Corinthian columns four storeys tall, three storeys of small windows and an attic
above, a dentilled cornice and a balustrade. Right: the same order `engaged: true, flanks: true` — recessed
between two solid end piers, with Doric triglyphs over it. That is way/256066230, the Pacific Exchange, which
eight of nine measured runs turned into a box and which `portico` rendered as a free-standing temple.*

### `bankTemple()` — the neoclassical bank-and-civic-temple vocabulary, in one call

Five SF landmarks (Old Federal Reserve Bank way/32947510, Old San Francisco Mint way/32863779, San Francisco
Mint way/115944818, Savings Union Bank Building way/32946683, Mills Building relation/3492808) were reviewed
together and given the same verdict (docs/LADDER.md, treatment 4, 2026-09-24) because they all draw from one
vocabulary: a colonnade of GIANT columns on a base, an entablature, sometimes a pediment, a dome or a
set-back tower. `bankTemple()` in `src/render/landmarks/facade.ts` is that vocabulary as one call — a thin
wrapper over `facade()`'s existing `giant-order` (already `b5_bank_256066230`, the Pacific Exchange) plus a
`dome` crown:

```ts
bankTemple(out, fit, {
  columns: 6, order: 'doric', storeys: 2, windows: 'dressed',
  engaged: false, flanks: true, pediment: true, material: 'sandstone',
  top: { kind: 'attic', storeys: 1, material: 'sandstone' },
  bands: { aboveGround: null, belowTop: 'string', top: 'cornice' },
  esplanade: null,   // see the warning below — currently non-functional
  dome: null,        // or { height, radius?, colour, drum? }
  on: 'street',
})
```

**`on` matters more here than anywhere else in the kit, and defaulting to `'front'` is usually wrong on a
real baked footprint.** `giant-order`'s `on` (like every `Ground`) defaults to `longestEdge(ring)`, which
picks the longest edge of `towerRing(fit)` — fine for a synthetic box, but on a real multi-wing OSM plan
(the Old Mint's is 25 vertices, long wings around a light well) the longest edge is very often a WING'S
side, not the street-facing front the portico actually belongs on, and the columns end up on a face the
street cameras never see — rendered, but invisible. This is not a hypothetical: it silently broke the
existing `b5_bank_256066230` reference example too, until checked here (2026-09-24) — nobody had rendered it
before. **Always pass `on: 'street'` explicitly on a real baked footprint** (it takes the front plus every
edge at least 75% as long, which is what a corner building's two colonnaded elevations need — see the
Savings Union Bank picture below) and render to confirm the columns land where a rider actually sees them.

**`esplanade` is a known-bad path, currently disabled everywhere it was tried.** The idea: a broad flight
across the whole portico front, at podium scale, via `stair()`'s `'esplanade'` preset — which already
existed and looked like exactly the right tool. In practice the call added almost no visible geometry (a
handful of triangles, nothing renders) on every building tried, with both `anchor: 'bottom'` and `'top'`. The
root cause was not found before this batch ran out of budget (a task is queued to fix `stair()`'s preset);
until it lands, leave `esplanade: null` and treat any podium stair as unbuilt rather than trust the field.

A set-back tower BEHIND the temple front (the Old Federal Reserve's Moderne shaft, "tall black window
verticals" per the owner) is deliberately NOT part of `bankTemple()` — it is a second, separate call
(`insetRing(towerRing(fit), d)` then `tower()` on that inset ring, same `fit.height`), because how far back
and how tall is a judgement call from the evidence, not a parameter worth templating for five buildings.

![](shots/kit/kit_bank_temple.png)

*The Savings Union Bank Building (way/32946683): `bankTemple()` with `pediment: true`, `dome: { height: 8,
... }`, `on: 'street'` — a corner site, so both street-facing colonnades get their own pedimented portico,
matching the Mapillary reference (`way-32946683-02.jpg`) almost exactly.*

### `Frame` — a frame standing forward of a recessed wall

```ts
frame: {
  verticals:   { kind: 'pier' | 'column' | 'pilaster'; width: number
                 at: 'corners' | 'bays'; order?: Order; count?: number } | null,
  horizontals: { top: number; base: number } | null,   // depth the bands stand proud, metres
  recess:      number,                                  // how far the wall sits back
  material:    Material,
} | null
```

One slot covers four buildings that look nothing alike: verticals + horizontals + a deep recess is the ICA;
verticals only is an expressed 1960s structural frame; horizontals only is a midcentury pavilion with a deep
roof band; `kind: 'pilaster'` with an `order` is a neoclassical front of engaged columns.

A `Fit` carries no street bearings, so `'street'` is a guess from the plan alone: a deep building whose side
elevation is far shorter than its front — 300 Montgomery is 38 × 84 m — needs an explicit edge index.

`at: 'corners'` puts a vertical on every **sharp** corner — a turn of more than about 30°, so a 17-corner OSM
plan does not become a picket fence. `at: 'bays'` spreads `count` of them along the front and street edges.

![](shots/kit/kit_facade_framed.png)
![](shots/kit/kit_facade_pilastered.png)

*Left: the ICA pattern — granite corner piers, a deep top band, the curtain wall 1.2 m back in shadow, the
ground floor recessed under an overhang. Right: giant Ionic pilasters over a rusticated base.*

### `Bands`, `Top`, `Entrance`

```ts
interface Bands { aboveGround: 'string' | 'cornice' | null; belowTop: 'string' | 'cornice' | null
                  top: 'cornice' | 'bracketed' | 'dentil' | 'modillion' | null }

type Top = { kind: 'glazed' | 'attic' | 'arcaded'; storeys: number }
         | { kind: 'setback'; storeys: number; by: number }

type Entrance = { at: 'centre' | 'corner' | number; kind: 'door' | 'portal' | 'recessed'; steps: number }
```

`'dentil'` hangs a course of little square teeth under the cornice and `'modillion'` carries it on scrolled
brackets — which is what a rider tells a classical cornice from a shelf by, at the distance they actually see
one. `'bracketed'` is Alvinza Hayward's heavy cornice; `top: { kind: 'glazed' }` is 550 California's
floor-to-ceiling top storey, which every run flattened into the shaft. The entrance is small and cheap and
every building has one — a rider passes within metres of it.

### `Material` — names, not numbers

A closed set, because a free colour is a free parameter and the evidence is that models write the middle of
any range: `granite`, `limestone`, `marble`, `sandstone`, `terracotta`, `brick`, `dark-brick`, `dark-stone`,
`concrete`, `precast`, `stucco`, `bronze`, `glass`. Each carries a colour, a procedural surface and the glass
that goes with it. `materialColour(m)` and `materialSurface(m)` expose them for hand-placed parts that must
match a `facade()` wall.

### A plain block is an honest answer

![](shots/kit/kit_facade_plain.png)
![](shots/kit/kit_facade_corner.png)

*Left: every slot null but the shaft — an honest answer, and the common one outside a downtown core. Right: a
non-rectangular plan — a chamfered street corner and a light-well jog at the back — with the colonnade on
`on: 'street'`, which here resolves to the front elevation alone because no other edge is within 75% of it.*

---

## Ground floor

![](shots/kit/sheet-ground-floor.png)

### `arcade`

```ts
export function arcade(out: MeshBuilder, a: P2, b: P2, y0: number, height: number, n: number,
                       opts: { depth?: number; colour?: Rgb; material?: Surface; shade?: Rgb;
                               piers?: boolean; order?: ColumnOrder; tier?: ColumnTier; trim?: Rgb } = {}): void
```

A row of `n` openings along the edge from `a` to `b`, each springing off a column (or, with `piers: true`, off
a rectangular pier), with a shaded recess behind. **Reach for it** when the ground floor is a masonry wall
with round-headed openings cut in it — a bank, a civic building, a market hall, a loggia.

`a` and `b` are two ring points; the openings face the edge's outward normal, so pass them in ring order
(`const e = edgeAt(towerRing(fit), 0); arcade(out, e.a, e.b, …)`). **What matters:** `n` (one opening per
structural bay, so 3–6 on a normal frontage), `height` (to the top of the arches, not the storey), and
`depth` (0.4 default is thin; 0.8–1.2 gives a recess you can see).

![](shots/kit/kit_arcade.png)

**Fixed, 2026-09-23 (BUGS.md #96).** The arch head used to be five small chord boxes floating over a
rectangular hole, because the opening's top was a flat line exactly at the springing and the tympanum above
it was never filled — at every scale and with every argument it rendered as a picket fence over black slots,
which is why E9's three correctly-identified arcades all came out wrong. The head is now a filled fan of
quads in the shade colour with an archivolt of voussoirs round its rim, and it goes segmental rather than
poking through anything above it when the bay is wide and the storey low. The naive call — which is what a
model that has not seen this page will write —

```ts
arcade(out, e.a, e.b, 0, 7, 5, {})
```

now reads as an arcade:

![](shots/kit/kit_arcade_naive.png)

`piers: true` has the same arch and squarer supports:

![](shots/kit/kit_arcade_piers.png)

### `colonnade`

```ts
export function colonnade(out: MeshBuilder, a: P2, b: P2, y0: number, height: number, n: number,
                          opts: { radius?: number; out?: number; colour?: Rgb; material?: Surface; entablature?: number;
                                  order?: ColumnOrder; tier?: ColumnTier; flutes?: boolean; trim?: Rgb } = {}): void
```

`n` round classical columns standing `out` proud of the edge from `a` to `b`, under a flat entablature that
runs the whole length. **Reach for it** for a temple front: a giant order across a bank or a museum, a
portico, a civic colonnade. This is the part the Pacific Exchange needed and four of nine runs missed.

**What matters:** `out` (how far in front of the wall — 1.2 default is tight, 1.5–2.5 reads better) and `n`
(4–8). Since BUGS.md #97 was fixed, **asking for an order gets you that order**: a short column is promoted
from the `far` tier to `mid` rather than silently becoming a tuscan slab. Pass `tier: 'near'` when the columns
are the subject of the building, or `tier: 'far'` deliberately when a whole street of them must stay cheap.

![](shots/kit/kit_colonnade.png)

The naive call, `colonnade(out, e.a, e.b, 0, 7, 5, {})`, is sound — slenderer than you may
want, and doric capitals because a 7 m column falls in the `mid` tier, but unmistakably a colonnade.
Defaults survive here:

![](shots/kit/kit_colonnade_naive.png)

### `marquee`

```ts
export function marquee(out: MeshBuilder, cx: number, y: number, z: number, w: number, out_: number, name: string,
                        opts: { body?: Rgb; band?: Rgb; letters?: Rgb; bulbs?: Rgb; height?: number; heading?: number } = {}): void
```

A theatre's canopy out over the pavement: the box with its lit soffit, a readerboard with the name on the
front and both returns, and chaser bulbs round the edge. **Reach for it** for any cinema, theatre or old
hotel — the Warfield, the Orpheum, the Golden Gate. `w` is the HALF-width; `out_` is how far it projects.
Needs `heading` (π for a −z front).

![](shots/kit/kit_marquee.png)

### `panelOn`

```ts
export function panelOn(out: MeshBuilder, ring: P2[], edge: number, along: number, y: number, w: number, h: number,
                        c: Rgb, opts: { out?: number; tag?: number } = {}): void
```

One flat board laid on an edge of the ring, `along` being 0–1 of the way along it. **Reach for it** for a
shopfront band, a painted ghost sign, a mural, a spandrel panel, an awning face. 20 triangles.

![](shots/kit/kit_panelOn.png)

---

## Facade

![](shots/kit/sheet-facade.png)

### `Face` — the facade grammar every tower takes

```ts
export interface Face {
  /** `bays`: projecting bay windows, one per bay, all the way up — San Francisco's own facade */
  kind: 'punched' | 'bands' | 'fins' | 'curtain' | 'xbrace' | 'blank' | 'bays'
  wall: Rgb
  glass?: Rgb
  /** floor to floor, metres (default 3.6) */
  floor?: number
  /** bay width, fin spacing, mullion spacing, metres (default 3) */
  pitch?: number
  /** the wall's share of each bay (punched, fins) or floor (bands), 0..1 */
  solid?: number
  /** how far fins or piers stand proud, metres (default 0.3) */
  depth?: number
  /** xbrace: floors per brace (default 6) */
  brace?: number
  /** punched: arched window heads (the 1910s–20s) */
  arched?: boolean
  /** bays: how far a bay projects (default 0.8 m), and whether it is angled (default) or rounded */
  bay?: { depth?: number; round?: boolean }
  /**
   * What the wall is made of, from the landmark surface library (cartoon-material.ts SURFACES): drawn as a
   * procedural pattern — courses of brick, ashlar blocks, granite panels, glazed terracotta, precast concrete,
   * metal seams. Default by kind: punched ashlar, the rest concrete; the glass is always glass.
   */
  material?: Surface
}
```

This is the one part of the kit every run already used, because `MODEL-A-BATCH-FAST.md` gave it a table with
a column saying what each one looks like. Here is the table with the pictures.

| `kind` | what it looks like | the building |
|---|---|---|
| `punched` | windows cut in a solid wall, one per bay | most pre-war masonry — the default |
| `punched` + `arched: true` | the same with round-headed heads | the 1910s–20s, terracotta and brick |
| `punched` + `head: 'architrave' \| 'pediment' \| 'segmental'` | an AEDICULE round every window | any neoclassical principal storey |
| `curtain` | continuous glass on a mullion grid, flat | any post-1960 glass box |
| `fins` | vertical piers standing proud, glass between | 1960s–70s concrete, vertical emphasis |
| `bands` | horizontal glass ribbons between spandrels | 1950s–70s, horizontal emphasis |
| `blank` | solid wall, nothing on it | a garage, a service core, the back of a podium |
| `xbrace` | glass behind exterior X-bracing | One Maritime, Hancock-style braced frames |
| `bays` | projecting bay windows all the way up | San Francisco's own facade |

![](shots/kit/kit_face_punched.png)
![](shots/kit/kit_face_punched_arched.png)
![](shots/kit/kit_face_curtain.png)
![](shots/kit/kit_face_fins.png)
![](shots/kit/kit_face_bands.png)
![](shots/kit/kit_face_blank.png)
![](shots/kit/kit_face_xbrace.png)
![](shots/kit/kit_face_bays.png)

### `faceOn`

```ts
export function faceOn(out: MeshBuilder, ring: P2[], edge: number, y0: number, y1: number, f: Face, offset = 0): void
```

A DIFFERENT facade applied to ONE wall of the ring, at an offset so it stands proud of it. **Reach for it**
when a building has a front and the rest is a back: a brick party-wall block with a dressed street facade, a
corner building whose two street elevations differ from its flanks. Pair it with `edgeFacing(ring, bearing)`
to pick the street side.

![](shots/kit/kit_faceOn.png)

### `quoins`

```ts
export function quoins(out: MeshBuilder, at: P2, heading: number, y0: number, y1: number, colour: Rgb, material: Surface = 'ashlar'): void
```

Also available as a `facade()` slot — `frame: { verticals: { kind: 'quoins', width: 1, at: 'corners' }, horizontals: null, recess: 0, material: 'limestone' }` — which puts them on every sharp corner of the ring
without hand-placing, and is how they should normally be asked for.

Alternating long and short stone blocks up ONE corner, as a dressed stone building's corners are. **Reach for
it** for a Beaux-Arts or Italianate block whose corners are picked out in rusticated stone — call it once per
corner you can see. Used three times in the whole corpus; it is cheap (170 triangles a corner) and it is what
makes a stone building read as stone rather than as a painted box.

![](shots/kit/kit_quoins.png)

### `windows` / `pane`

```ts
export function windows(out: MeshBuilder, face: '-z' | '+z' | '-x' | '+x', plane: number, t0: number, t1: number,
                        y0: number, w: number, h: number, bay: number, colour: Rgb, frame?: Rgb): void

export function pane(out: MeshBuilder, face: '-z' | '+z' | '-x' | '+x', plane: number, t: number, y0: number,
                     w: number, h: number, colour: Rgb, proud = 0.05): void
```

`windows` is a row of dark rectangles, one per `bay`, along a span of an axis-aligned face, with an optional
sill; `pane` is one of them. **Reach for them** when you are drawing a box by hand rather than with `tower`,
or when you need a single specific opening — a shop window, a doorway, a lit clerestory — that the `Face`
grammar will not place for you.

![](shots/kit/kit_windows.png)
![](shots/kit/kit_pane.png)

### `archedPane` / `pointedPane`

```ts
export function archedPane(out: MeshBuilder, plane: number, t: number, y0: number, w: number, h: number, colour: Rgb): void

export function pointedPane(out: MeshBuilder, plane: number, t: number, y0: number, w: number, h: number, colour: Rgb): void
```

A round-headed and a pointed (Gothic) opening on a −z face. **Reach for them** for a church, a chapel, a
romanesque warehouse, a carriage arch, a big arched entrance in an otherwise plain wall. `h` includes the
head, and the head's radius is `w / 2`, so a tall narrow opening wants a generous `h`.

![](shots/kit/kit_archedPane.png)
![](shots/kit/kit_pointedPane.png)

### `courtFacade`

```ts
export function courtFacade(out: MeshBuilder, len: number, eaves: number, o: {
  stone: Rgb; trim: Rgb; dark: Rgb; reliefs?: boolean; lucarnes?: boolean; passage?: boolean; ground?: number
}): void
```

A whole ornate classical wall in one call, drawn at z = 0 facing −z: a stone plate, bays with pilasters
between, two storeys of tall windows with alternating triangular and segmental pediments, relief panels, a
cornice, and stone lucarnes standing on it. `passage: true` opens a carriage arch in the middle.

**Reach for it** for a Parisian hôtel particulier, a courtyard elevation, or any French-classical range —
and with `courtWalls(out, fit, facade)` for all four sides of a court at once. It is the single densest part
in the kit: 636 triangles for a complete 26 m facade.

![](shots/kit/kit_courtFacade.png)

---

## Roof and crown

![](shots/kit/sheet-crown.png)

### `Crown` — what a tower does at the top

```ts
export type Crown =
  | { kind: 'flat' }
  | { kind: 'parapet'; height: number; colour?: Rgb; material?: Surface }
  | { kind: 'hip' | 'mansard'; height: number; inset: number; colour: Rgb; material?: Surface; dormers?: number }
  | { kind: 'pyramid' | 'spire'; height: number; inset?: number; colour: Rgb; material?: Surface }
  | { kind: 'dome'; height: number; radius?: number; colour: Rgb; drum?: number; material?: Surface }
  | { kind: 'lantern'; height: number; inset: number; face: Face; cap?: Crown }
  | { kind: 'stepped'; steps: number; height: number; inset: number; face?: Face; material?: Surface }
  | { kind: 'mast'; height: number; colour?: Rgb; width?: number; material?: Surface }
  /** a jagged parapet of points or battlements round the roof (201 Mission, 199 Fremont) */
  | { kind: 'sawtooth'; height: number; pitch?: number; colour: Rgb; material?: Surface }
  /** tapered needles standing off the roof: `n` of them along the long axis (345 California's twins) */
  | { kind: 'spires'; height: number; n?: number; radius?: number; colour: Rgb; material?: Surface }
  /** the roof sliced on a diagonal, to a ridge or a point (505 Montgomery) */
  | { kind: 'sliced'; height: number; colour: Rgb; material?: Surface }
```

**`height` is required on every kind but `flat`.** `{ kind: 'parapet' }` alone does not typecheck, and two
runs wrote exactly that.

| `kind` | what it looks like | the building |
|---|---|---|
| `flat` | nothing; the roof slab | a plain modern block |
| `parapet` | a low wall standing round the roof edge, the roof slab recessed behind it | almost every pre-war masonry building |
| `balustrade` | a rail on little turned posts, on a plinth | the top of most classical buildings |
| `hip` | a shallow four-sided roof | a house, a small civic block |
| `mansard` | a steep roof with dormers in it | Second Empire, French-flavoured Victorians |
| `pyramid` | a steep four-sided point | a corner pavilion, a small tower |
| `spire` | a tall thin point over the whole footprint | a church, a Gothic tower |
| `dome` | a drum and a dome | a bank rotunda, a capitol |
| `lantern` | a glazed storey with its own cap on top | a clock tower, a market hall, a rotunda |
| `stepped` | `steps` setbacks, each smaller than the last | 1920s zoning-setback towers |
| `mast` | a slim mast off the roof centre | an aerial, a flagpole, a broadcast tower |
| `sawtooth` | a jagged rim of points or battlements | 201 Mission, 199 Fremont |
| `spires` | `n` tapered needles along the long axis | 345 California's twins |
| `sliced` | the roof cut on a diagonal | 505 Montgomery |

![](shots/kit/kit_crown_balustrade.png)

*`{ kind: 'balustrade', height: 2.2 }`. Each post is two stacked boxes with a waist between them, which is
exactly what a turned baluster looks like from a street and costs 24 triangles instead of a lathe's 200; the
pitch is derived per edge, so a short return gets fewer posts rather than squashed ones. `pier: false` drops
the solid block at each corner. This caps a very large fraction of the classical buildings downtown and there
was no way to say it — a `parapet` was the nearest, and reads as a blank wall.*

![](shots/kit/kit_crown_parapet.png)

*(the parapet demo is 1.6 m in a contrasting coping colour and shot from a lower camera, because a parapet in
the wall's own colour is invisible from above — which is exactly why it is worth drawing one.)*

![](shots/kit/kit_crown_hip.png)
![](shots/kit/kit_crown_mansard.png)
![](shots/kit/kit_crown_pyramid.png)
![](shots/kit/kit_crown_spire.png)
![](shots/kit/kit_crown_dome.png)
![](shots/kit/kit_crown_lantern.png)
![](shots/kit/kit_crown_stepped.png)
![](shots/kit/kit_crown_mast.png)
![](shots/kit/kit_crown_sawtooth.png)
![](shots/kit/kit_crown_spires.png)
![](shots/kit/kit_crown_sliced.png)

### `cupola`

```ts
export function cupola(out: MeshBuilder, at: P2, y0: number, r: number, opts: { drum?: number; dome?: number; colour?: Rgb;
  domeColour?: Rgb; material?: Surface; domeMaterial?: Surface; lantern?: boolean } = {}): void
```

An octagonal drum with its windows, a copper dome on it and a lantern on that — standing on ONE POINT, not
over the whole footprint, which is the difference from a `dome` crown. **Reach for it** for a corner rotunda
or a bank's dome: Hibernia Bank, the Golden Gate Theatre, the Humboldt. 148 triangles.

![](shots/kit/kit_cupola.png)

### `spireOn`

```ts
export function spireOn(out: MeshBuilder, at: P2, y0: number, r: number, shaft: number, spire: number,
                        opts: { colour?: Rgb; spireColour?: Rgb; material?: Surface; spireMaterial?: Surface; sides?: number; belfry?: boolean } = {}): void
```

A bell tower or campanile on ONE point of the building: a square or octagonal shaft with belfry openings, and
a tapering spire with a finial. **Reach for it** for a church's corner tower, a clock tower on a station or a
market, an asymmetric civic tower — anything a `spire` crown, which can only cover the whole footprint,
cannot do. 84 triangles.

![](shots/kit/kit_spireOn.png)

### `stripRoof`

```ts
export function stripRoof(out: MeshBuilder, ring: P2[], y: number, rise: number, colour: Rgb, material: Surface = 'tile'): void
```

A pitched or hipped roof over a long narrow strip, where the ordinary inset-ring roof would collapse to
nothing. **Reach for it** for a shed, a theatre's auditorium, a market hall, a long low wing. 20 triangles.

![](shots/kit/kit_stripRoof.png)

### `dome`

```ts
export function dome(out: MeshBuilder, cx: number, cz: number, y0: number, r: number, h: number, colour: Rgb,
                     sides = 16, ribs?: Rgb): void
```

A free-standing hemisphere of stacked rings, with ribs if you pass a colour for them. **Reach for it** when
you are drawing the building by hand and want a dome anywhere — over a rotunda, a pavilion, a greenhouse —
rather than as a tower's crown. `h` is independent of `r`, so a shallow saucer and a tall onion are both
available.

![](shots/kit/kit_dome.png)

### `pinnacle`

```ts
export function pinnacle(out: MeshBuilder, x: number, z: number, y0: number, h: number, w: number, colour: Rgb): void
```

A slim square shaft with a tall pointed cap. **Reach for it** in a row along a Gothic parapet, at the corners
of a tower, or flanking a gable — 26 triangles each, so a whole skyline of them is affordable.

![](shots/kit/kit_pinnacle.png)

### `turret`

```ts
export function turret(out: MeshBuilder, x: number, z: number, yCorbel: number, yEaves: number, r: number,
                       roofH: number, wall: Rgb, slate: Rgb): void
```

A round drum carried out from a wall on a corbel cone, with a conical roof. **Reach for it** for a Queen Anne
or Richardsonian corner turret, a château range, a Victorian bay that ends in a cone. `yCorbel` is where it
springs from the wall — put it a storey or two above the ground, not at ground level, or it reads as a
column.

![](shots/kit/kit_turret.png)

### `roundRing`

```ts
export function roundRing(ring: P2[], r: number, n = 4): P2[]
```

Returns the ring with its corners rounded — it draws nothing itself; feed the result to `faceBand` or
`tower`. **Reach for it** for a prow, a drum, a streamline-moderne corner, a 1960s tower with rounded ends. A
radius bigger than half the shorter edge simply rounds as far as it can.

![](shots/kit/kit_roundRing.png)

---

## Signs and shopfronts

![](shots/kit/sheet-signs.png)

**Reach for `sign()` first.** A building's name in a real typeface costs two triangles; `signText`'s block
font costs hundreds and looks like a block font, and spelling a name out of `box` calls — which is what
builders kept doing — looks worse than either. On a department store the sign IS the identity.

### `sign`

```ts
export function sign(out: MeshBuilder, spec: SignSpec, where: SignPlace): void
// where: { ring, edge, y, along? }   on an edge of the fit's ring, `along` across it (0.5 centred)
//        { x, y, z, heading? }       anywhere, facing `heading` (0 faces +z)
```

**Two kinds of sign, and a model must say which** — `type` has no default:

| type | what it is | cost |
|---|---|---|
| `flat` | one quad with a texture and an alpha channel, the letters rendered in a real typeface by the browser itself | **2 triangles**, whatever the word |
| `extruded` | the GLB from `tools/signgen`, for letters that genuinely stand off the wall and catch the light | 116,560 triangles for `Ghirardelli`; 41,600 for `Believe It or Not!` — about 2,300 per letter |

So: **`flat` unless the letters cast a shadow on their own wall.** Ghirardelli's bulbs and a deep
channel-letter sign are `extruded`; everything painted, applied, incised or illuminated is flat, because it
is flat from any distance a rider sees it from. A flat sign needs no Blender, no bake and no asset — it is
made in the browser at load — so it works on any machine and in any city.

`SignSpec` is: `type`, `text`, `h` (the CAP height in metres, measured off an `H`), `lit` (required, below),
and then whatever the real sign needs — `face`, `colour`, `panel`, `halo`, `tracking`, `vertical`, `weight`,
`italic`, `w` (a width the name must fit), `standoff`. Ten faces: `roman`, `engraved`, `didone`, `grotesque`,
`condensed`, `block`, `slab`, `script`, `brush`.

`lit` is `'none' | 'front' | 'back' | 'self'` and is **required**, because it is an observation from a night
photograph and cheap to record while you have one open: unlit, floodlit from outside, a glowing panel with
the letters dark against it, or the letters themselves emitting. **Rigged, not built** — the emissive picture
is generated but there is no night view to judge it in yet.

**Signs are LOD-gated**: a name too far to read is not drawn at all. The reach follows the cap height
(`220 × h` metres, never under 90 and never past the ring the city is drawing at, `MID * TILE` = 1200 m
today). Nothing to switch on; it is automatic.

| | |
|---|---|
| ![](shots/kit/kit_sign_flat.png) `flat`, a grotesque applied to the wall | ![](shots/kit/kit_sign_script.png) `face: 'script'` — the department-store signature |
| ![](shots/kit/kit_sign_engraved.png) `face: 'engraved'`, `tracking`, `w` | ![](shots/kit/kit_sign_roman.png) `face: 'roman'` — a classical capital |
| ![](shots/kit/kit_sign_panel.png) `panel` — a box sign | ![](shots/kit/kit_sign_halo.png) `halo` — an outline, so pale letters read on pale stone |
| ![](shots/kit/kit_sign_vertical.png) `vertical` — a blade | ![](shots/kit/kit_sign_slab.png) `face: 'slab'` — an industrial name |

### `signText`

```ts
export function signText(out: MeshBuilder, text: string, cx: number, cy: number, z: number, h: number, c: Rgb,
                         opts: { lit?: boolean; tag?: number; vertical?: boolean; heading?: number } = {}): void
```

**Mostly superseded by `sign()` above**, which draws a real typeface for a fifth of the cost. Block letters
in a 3 × 5 font, applied to a wall, each letter `h` tall. Still right where the blockiness is the point — a
ghost sign, a painted warehouse number, a readerboard inside a `marquee`, which uses it. `lit: true` makes them emit — a neon
sign after dark. `vertical: true` stacks them down a blade. **Reach for it** for a hotel name, a ghost sign, a
shopfront fascia, a warehouse's painted company name. **Needs `heading`** on any wall that is not facing +z.

![](shots/kit/kit_signText.png)
![](shots/kit/kit_signText_lit.png)

### `bulbText`

```ts
export function bulbText(out: MeshBuilder, text: string, cx: number, cy: number, cz: number, spacing: number,
                         opts: { heading?: number; bulb?: Rgb; frame?: Rgb; lit?: boolean; gap?: number } = {}): void
```

The same letters spelled out in LIGHT BULBS on a slim steel frame, each bulb on its own stalk. **Reach for
it** for a roof sign or a big rooftop name — Ghirardelli, the theatre signs on Market Street. Painted letters
never look right for these, because at a distance you read a constellation of points and after dark the
points are the whole sign. `spacing` is the bulb pitch, and the letters are five cells tall, so a 0.5 m pitch
gives 2.5 m letters. Expensive: 2,648 triangles for eleven letters.

![](shots/kit/kit_bulbText.png)

### `bladeSign`

```ts
export function bladeSign(out: MeshBuilder, cx: number, yTop: number, z: number, h: number, name: string,
                          opts: { body?: Rgb; letters?: Rgb; width?: number; out?: number; heading?: number } = {}): void
```

The tall vertical board standing out from a facade, the name down it in lit letters on both faces, bulbs down
both edges and a bracket back to the wall. **Reach for it** for a theatre or an old hotel — the Warfield, the
Orpheum. `yTop` is the top of the blade, and it hangs down `h` from there.

![](shots/kit/kit_bladeSign.png)

---

## Shape operations — `notch`, `vault`, `rake`, `deckCut`

![](shots/kit/sheet-shape.png)

Four operations on the FOOTPRINT and the ROOFLINE, added 2026-09-23 after the ICA and YBCA runs, where the
missing thing was never a texture or a piece of ornament but a **shape the grammar had no word for**, and the
builder hand-wrote the ring. The owner: *"we need the most powerful tools we can get."*

All four **derive every size from `towerRing(fit)` and the edge they are given** — fractions of an edge's
length, degrees from vertical, counts — so a rebake with a corrected footprint or a corrected height follows
by itself. Nothing here is a baked dimension. All four **draw facing +z** in the `edgeAt`/`boxAlong`
convention, so no caller needs the `+ Math.PI` correction that `pediment`, `pane`, `archedPane` and
`courtFacade` require. (`notch` draws nothing at all — it returns a ring — so it has no facing of its own.)

Two helpers came with them and are in the helper table at the foot of this page: **`offsetRing(ring, d)`**,
the true parallel offset, which is what a cornice or a setback on a notched ring needs, and
**`edgeDepth(ring, i)`**, how far the footprint reaches inward from an edge, which is where a vault's default
depth comes from.

### `notch`

```ts
export type NotchAt = { corner: number } | { edge: number; along?: number }
export function notch(ring: P2[], at: NotchAt, opts: { wide?: number; deep?: number } = {}):
  { ring: P2[]; cut: P2[] }
```

A **bite out of the footprint** — a rectangular piece removed at a corner or in the middle of an edge, so the
building is built round the void. A polygon operation, not a 3D boolean, and **the result is an ordinary
ring**: `faceBand`, `facade()`, `tower()`, `dentilCourse` and everything else consume it unchanged. That is
the whole point of it.

**Reach for it** for the YBCA galleries' patio cut out of one corner, the Metreon's and a hundred podium
blocks' set-back corners, a light court opening off the street.

`wide` and `deep` are **fractions of the edges the bite is taken out of**, never metres. At a corner, `deep`
is taken off the edge arriving and `wide` off the edge leaving; on an edge, `wide` is the opening along the
wall centred at `along` (0..1) and `deep` is how far in it goes.

It returns the notched ring **and the polygon it removed** (`cut`). The cut is what makes partial height work
— `faceBand(notched, 0, y)`, then `faceBand(full, y, H)`, and cap `cut` at `y` for the patio floor — and it is
exactly the hole `deckCut` wants for a court cut through a deck, so the same polygon that shapes the building
shapes the void in its deck.

Left, `kit_notch`: a corner bite, with the ordinary tower grammar raised on the result. Right,
`kit_notch_edge`: the same operation in the middle of the street front.

![](shots/kit/kit_notch.png)
![](shots/kit/kit_notch_edge.png)

### `vault`

```ts
export function vault(out: MeshBuilder, ring: P2[], edge: number, y: number, opts: {
  count?: number; run?: 'across' | 'along'; from?: number; to?: number; depth?: number; rise?: number;
  colour?: Rgb; material?: Surface; glass?: Rgb; ends?: 'glazed' | 'solid'; segments?: number
} = {}): void
```

**`count` barrel vaults on an edge**, sitting on or above the wall, glazed on the end faces by default. A
strip of quads swept along the axis and a fan at each end — **not a lathe** — so three of them cost about 200
triangles.

**Reach for it** for the YBCA galleries' three glazed barrel vaults clustered at one end of the frontage,
which are that building's whole silhouette, and for Crocker Galleria's barrel-vaulted glass arcade.

Everything is derived: the span is `from`..`to` as fractions of the edge's length, `depth` defaults to how far
the ring reaches inward from that edge (`edgeDepth`), each vault's width is the span divided by `count`, and
the radius is half that width. `rise` is a **fraction of the radius** — 1 is semicircular, less is segmental.

- **`run: 'across'`** (the default) — axes perpendicular to the edge, running inward, so the glazed ends face
  the street and the vaults stand side by side along the frontage. **This is YBCA.**
- **`run: 'along'`** — axes along the edge; `count` then divides the depth into parallel vaults one behind the
  other. **This is Crocker, with `count: 1`.**

Take a count, never call it three times: the rhythm is the part's, matching `facade()`'s contract.

![](shots/kit/kit_vault.png)
![](shots/kit/kit_vault_along.png)
![](shots/kit/kit_vault_solid.png)

### `rake`

```ts
export function rake(out: MeshBuilder, ring: P2[], edge: number | number[], y0: number, y1: number, opts: {
  angle?: number; lean?: number; colour?: Rgb; material?: Surface; roof?: Rgb
} = {}): P2[]
```

**A LEANING WALL WITH A FLAT TOP — not a sloping roof.** One or more edges are battered inward or outward from
base to parapet while the roof stays horizontal.

**Reach for it** for the YBCA theatre — *"a rectangle with one side sloped steeply down"* — and for the same
shape in a hundred modern auditoria and civic halls.

It is built as a **loft**, which is what makes the mitres right: the top ring is the base ring with the chosen
edges' supporting lines offset along their outward normals, and every top vertex is the intersection of its
two neighbouring lines. An upright wall next to a leaning one therefore comes out as the correct trapezoid,
two adjoining raked edges meet on a proper hip, and nothing is special-cased. `angle` is **degrees from
vertical** — positive leans out, negative batters in — so the lean derives from the wall's own height; `lean`
in metres is there for when a photograph gives you the top offset directly.

It **returns the top ring**: cap it, crown it, or `faceBand` a parapet on it. Pass `roof` and it caps it for
you.

Left, `kit_rake`: one edge leaning out 26°, parapet on the flat top, and the two upright neighbours mitred
into it. Right, `kit_rake_batter`: −20° on two adjoining edges, meeting on their own hip.

![](shots/kit/kit_rake.png)
![](shots/kit/kit_rake_batter.png)

### `deckCut`

```ts
export function deckCut(out: MeshBuilder, ring: P2[], y: number, hole: P2[], opts: {
  depth?: number; deck?: Rgb | null; wall?: Rgb; floor?: Rgb; material?: Surface; kerb?: number;
  rooflight?: 'vault' | 'pitched' | null; glass?: Rgb; rise?: number
} = {}): void
```

**A void through a raised surface** — a light well, a stair opening, a court cut down through a deck to the
level below. **Call it instead of `capPolygon` for that deck:** it draws the deck with the hole in it (earcut
with a hole, so a concave deck is fine), the well's walls with their normals facing into the well, and a floor
at the bottom.

**Reach for it** for the skyparks ([SKYPARKS.md](SKYPARKS.md)) — the Moscone decks, Salesforce Park — and for
YBCA's patio, whose *"large boat pitched down glass structure letting light in to the lower level"* is this
plus `rooflight: 'pitched'`.

The hole is any ring, and the two natural sources are both derived rather than typed: **`insetRing(ring, d)`**
for a well in the middle of a deck, and **`notch`'s returned `cut`** for a court in a corner. `kerb` puts a
low parapet round the lip, which is what stops a rider riding into it.

![](shots/kit/kit_deckCut.png)
![](shots/kit/kit_deckCut_rooflight.png)
![](shots/kit/kit_deckCut_vault.png)

### The four together

`kit_ybca_galleries` is a **study**, not the production entry (the YBCA buildings belong to another run): a
corner notched out for the patio, the patio's deck cut through to the level below under its pitched glass, and
the three glazed barrel vaults clustered at one end of the frontage. 298 triangles. `kit_ybca_theatre` is the
raked box beside it, 18.

![](shots/kit/kit_ybca_galleries.png)
![](shots/kit/kit_ybca_theatre.png)

### What these four could NOT be made general about

Said plainly, because the next builder will hit them:

- **`insetRing` is wrong on a notched ring.** It pulls every point toward the centroid, so at the notch's
  reflex corner it goes backwards: on the demo footprint, a 1 m cornice moves that corner 1 m **into the
  building** and a 1 m setback pushes it 1 m **out into the void**. `tower()`'s cornices, setbacks and the
  `parapet`/`balustrade` crowns all use it, so they are all approximate at a notch. **`offsetRing(ring, d)`
  is the correct parallel offset** (added with these four, opt-in; `insetRing` is untouched, ~400 builders
  call it). `stripRoof` and the `sliced` crown fan from index 0 and likewise do not survive a notch.
- **`notch` takes one bite per call** and does not clip it against the rest of the ring: a `deep` of 1 on a
  thin block cuts past the far wall. Call it twice for two bites, and remember corner and edge **indices
  shift** if OSM retraces the outline from a different start vertex — `edgeFacing(ring, bearing)` is the
  durable way to name the street side.
- **`rake`'s walls carry a colour and a surface, not a `Face`.** No windows are cut into a leaning wall; draw
  them with `faceOn` at a small proud offset if you need them, accepting that they stay vertical. A lean steep
  enough to turn an edge inside out past its neighbours' intersection is not detected.
- **`deckCut` draws one hole per call.** For a second hole pass `deck: null` so the deck slab is not drawn
  twice. The well's walls are flat colour rather than a `Face`, and the hole is not clipped to the deck.
- **A real 3D boolean would still reach three things these four cannot.** Openings cut through a
  NON-VERTICAL surface (a window in a raked wall, a dormer through a vault); two non-coplanar volumes meeting
  on a true mitre (two boxes at different angles); and the inside of a shell. Everything else that came up is
  a PLAN operation, and `polygon-clipping` is already a dependency — `notch` could be made arbitrary-shape and
  properly clipped in about thirty lines of TypeScript, without leaving the language.
- **`vault` ends are flat semicircular fans**, glazed or solid — no glazing bars, no gable wall above the
  arch, no clerestory.

---

## Stairs and railings

![](shots/kit/sheet-stairs.png)

The kit's first **between-levels** part, added 2026-09-23. Owner: *"probably MOST buildings older than 50
years have a stairway entrance of some kind"* — so this is a universal element, not a Yerba Buena special
case, and we had hand-built it badly three separate times before it existed: the YBCA theatre's frontage
steps (floating louvres), Yerba Buena's terrace planters, and its esplanade.

### `stair`

```ts
export type TreadKind = 'paving' | 'grass' | 'planted' | 'alternate'
export type StairRail = 'none' | 'left' | 'right' | 'both'

export function stair(out: MeshBuilder, a: P2, b: P2, y0: number, y1: number, opts: {
  riser?: number; run?: number; from?: number; to?: number; splay?: number; landing?: number
  tread?: TreadKind; rail?: StairRail; railKind?: 'posts' | 'solid' | 'glass'
  anchor?: 'bottom' | 'top'; preset?: 'esplanade' | 'terrace'
  colour?: Rgb; material?: Surface; treadColour?: Rgb; grass?: Rgb
} = {}): { bottom: P2[]; top: P2[] }
```

**Every other part in the kit takes one `y`. This one takes `y0 → y1`**, and that is the whole difference.

**The step count is DERIVED from a riser height, and a caller cannot type one.** `count = round((y1 − y0) /
riser)` with `riser` 0.15 m typical, the remainder shared out so the flight lands exactly on `y1`; the tread
depth is `run / count`, and `run` itself derives from the riser by the going rule `2R + T ≈ 0.63`, never
shallower than 2.5 R — which is what keeps a terrace TIER a tier. **That derivation is the part.** It is
exactly what the theatre agent skipped, and why its steps came out as plates. (On the Yerba Buena esplanade
the rule gives a 1.67 m tread from the measured 0.67 m rise, against the 1.7 m that builder measured off the
photograph: within 2%, and derived rather than typed.)

**It is one SOLID.** The stepped profile is extruded as a single strip — riser + tread, 4 triangles a step —
and then closed: one vertical quad per step at each end, a base underneath at `y0`, and a back face at the
head. **8 triangles a step plus 4 closures, and no boxes per step.** The reported failure was daylight
passing under and between the treads, which is what a run of separate boxes or an open strip looks like from
a rider's eye.

**Facing.** `a`→`b` is a baseline in plan and the flight occupies the **+normal** side of it (`(tz, −tx)`, the
`edgeAt` sense). With the default `anchor: 'bottom'` the baseline is the FOOT at `y0`; with `anchor: 'top'` it
is the HEAD at `y1` and the steps come down off it — **which is the form a building entrance wants**, because
what you know there is the wall edge, whose normal points at the street. Getting this wrong is not subtle and
it is not visible in code: the first render of `kit_stair` omitted `anchor` and the flight climbed away from
the building into the road, reading as a blank 1.2 m wall.

`from`/`to` are fractions along the baseline, the same convention as `vault`, because a flight's extent has to
be derivable from the edge it sits on — the theatre's hand-built steps spanned the whole frontage, fly tower
included, for want of it.

**Varying width.** `splay` is a fraction of the flight's width added at the FOOT, tapering to nothing at the
head: the standard civic/institutional entrance flight, wider where it meets the pavement. Owner: *"corner
stairways are weird, but stairways with varying widths are not too weird"* — so **a corner stair is
deliberately not here**, and what it would need is said below. A FAN is not a straight flight with a splay:
it is `arcStair`, further down this page.

It returns the flight's foot and head as two-point polylines, so it **chains** — `railing(out, s.top, y1)`, a
walkway off `s.top`, another flight off it — and so a later routing pass can find level connectors.

![](shots/kit/kit_stair.png)
![](shots/kit/kit_stair_splay.png)

*Left, `kit_stair`: an ordinary stoop, 1.2 m up, `anchor: 'top'` on the wall edge — 8 steps and a 0.375 m
tread derived from a 0.15 m riser (`max(0.26, 0.63 − 0.30, 2.5 × 0.15)`). Right, `kit_stair_splay`: 2.4 m of rise with `splay: 0.5`, the foot half
again as wide as the head.*

![](shots/kit/kit_stair_under.png)
![](shots/kit/kit_yb_theatre_steps.png)

*Left, `kit_stair_under` — **the only view that proves anything**: the flight raised on a terrace and shot
from BELOW. An unclosed underside is daylight between every tread from here and is invisible from every other
angle, which is how the theatre's first steps passed review. Right, a study at the YBCA theatre's real
dimensions (`sf/ybca.ts:1030`, that file's own run): 4 m of rise across 22 m of frontage — the shape that came
out as a fence lying on its back — in one call.*

### The presets: `esplanade` and `terrace`

Presets rather than new functions, because they are the same flight with different derivations:

- **`preset: 'esplanade'`** — low risers and very deep `'alternate'` treads (a grass strip, then a paved
  strip). **This IS the Yerba Buena esplanade.**
- **`preset: 'terrace'`** — very deep `'planted'` treads with concrete riser faces: a planter tier rather than
  a step. Planted treads deeper than 1.2 m are pushed to **`out.decks`** (`MeshBuilder.decks`,
  [SKYPARKS.md](SKYPARKS.md)) so the deck-planting path plants them; a shallower one is coloured and not
  planted, because a shrub on a 0.4 m tread reads wrong.

![](shots/kit/kit_esplanade.png)
![](shots/kit/kit_terrace.png)

*Left, the esplanade at Yerba Buena's measured dimensions (`sf/yerba-buena.ts:400`): the lawn is `DECK_H` = 4 m
up with about 10 m of pavement, so the riser is 0.667 m and the tread rule returns 1.67 m terraces against the 1.7 m measured there. Right,
the terrace garden — `DECK_H` = 4 to `PATIO_H` = 8 as five planted tiers, with a `railing` on the very edge
`stair()` returned at each end.*

### `railing`

```ts
export function railing(out: MeshBuilder, polyline: P2[], y: number, opts: {
  kind?: 'posts' | 'solid' | 'glass'; height?: number; spacing?: number; colour?: Rgb; glass?: Rgb
  material?: Surface; thickness?: number
} = {}): void
```

Standalone, because it appears on every raised edge the project has: the Moscone decks, both Yerba Buena
skybridges, the terrace walkway, the theatre ramp, and the head of every flight. Spacing is derived from the
run's length (about 1.5 m, divided evenly so a post lands on each end), the height defaults to 1.05 m, and
every piece is a closed box so it reads from both sides (BUGS.md #23).

**The posts are IN the rail plane and DARK.** BUGS.md **#134a** is precisely the other thing: `glazedFront()`
drew pale mullions **0.34 m proud** of the glass and a whole frontage read as a palisade of white poles. A
fine repeated vertical is the easiest thing in the kit to get wrong, because the error is invisible in code —
0.34 looks like a reasonable number — and unmistakable from where a rider stands. **So every demo on this page
is shot from a LOW OBLIQUE at rider's eye height, not in elevation**, and `tools/kit-shots.ts` has a camera
case for it, as `deckCut` needed one.

![](shots/kit/kit_railing.png)
![](shots/kit/kit_facade_stoop.png)

*Left: the three kinds on one deck edge at eye height. Right: `facade()` with a stoop on its `entrance` slot.*

### `facade()` learned the stoop

```ts
entrance: { at: 'centre', kind: 'portal', steps: 0,
            stoop: { height: 1.4, splay: 0.4, rail: 'both' } }
```

Because most pre-war buildings have a stepped entrance, `Entrance` can now say so: `stoop` raises the door by
its own height — the thing you read off a photograph — and draws the flight with the same `stair()`, with the
door's own position and width giving the `from`/`to`. **It is the one OPTIONAL key in the whole spec**, against
the doctrine at the top of this page and deliberately: ~400 builders already write an `entrance` literal and a
required key would break every one. Absent, `steps` draws exactly the boxes it always drew.

### `arcStair` — the CURVED flight

```ts
export function arcStair(out: MeshBuilder, centre: P2, radius: number, y0: number, y1: number, opts: {
  riser?: number; run?: number; from?: number; to?: number; landing?: number
  tread?: TreadKind; rail?: StairRail; railKind?: 'posts' | 'solid' | 'glass'
  anchor?: 'bottom' | 'top'; climb?: 'out' | 'in'; preset?: 'esplanade' | 'terrace'
  colour?: Rgb; material?: Surface; treadColour?: Rgb; grass?: Rgb; segments?: number
} = {}): StairResult
```

The same stepped solid swept round a **circular arc**: concentric annular treads radiating from `centre`, and
a **radial** climb. Added for the Moscone South block ([MOSCONE-SOUTH.md](MOSCONE-SOUTH.md)), where *"the
transitions between [the five walkable heights] are curved, not straight"* and where four separate set pieces
are this one shape — the two curved esplanades descending from the dividing wall to the lawn, the curved
walkway off the museum's level 3, the grand fan staircase out of the sunken circular plaza, and the Public
Square's *"semicircular amphitheatre of concentric stepped grass terraces"*.

**It is a SIBLING of `stair()`, not a mode of it.** Every coordinate differs — `u` along a baseline and `v`
outward become an angle and a radius — while **every derivation is shared and identical**: the step count
from the riser, the tread from the run, the presets, the tread kinds, `anchor`, `landing`, `rail`, the
`out.decks` push. A test asserts that a straight and an arc flight of the same rise return the same `steps`,
`tread` and `run`. Trying to make one function do both would have meant a union of two coordinate systems in
every line of the loop.

`radius` is the **baseline circle** — the plaza the fan stands round, the wall the esplanade comes off.
`from`/`to` are fractions of a **full turn**, the same fraction convention as everywhere else (a 180° sweep is
`from: 0.06, to: 0.56`), and the default is the whole circle. `climb: 'in'` makes it a bowl descending inward
instead — which is the amphitheatre read from its rim. The sweep is subdivided **by its own arc length**, so a
big fan does not go faceted and a small one does not cost what a big one does (capped at 72).

![](shots/kit/kit_arc_stair.png)
![](shots/kit/kit_arc_esplanade.png)

*Left, `kit_arc_stair`: the grand fan staircase sweeping 180° up out of the Children's Creativity Museum's
sunken circular plaza. Right, `kit_arc_esplanade`: one of the two curved esplanades — `anchor: 'top'` on the
curved dividing wall with the esplanade preset's alternating grass and paved terraces descending outward from
it, and a `railing` on the walk along its top, which is the polyline the call returned.*

### `ramp`, and the stair-and-walk PAIR

```ts
export function ramp(out: MeshBuilder, a: P2, b: P2, y0: number, y1: number, opts: {
  run?: number; gradient?: number; from?: number; to?: number; anchor?: 'bottom' | 'top'
  kerb?: number; rail?: StairRail; railKind?: 'posts' | 'solid' | 'glass'
  colour?: Rgb; material?: Surface
} = {}): StairResult
```

A plain inclined strip on the same baseline convention, solid and closed for the same reason. Its run
**derives from the rise by a gradient** — 1 in 12 by default, the gradient a ramp is allowed to be — so a
builder cannot silently produce a slope nobody could use. (1.8 m of rise is 21.6 m of ramp. That is the
lesson.)

Every flight returns the numbers it derived, which is what makes the **pair** easy:

```ts
const s = stair(out, a, b, 0, 6, { to: 0.7, run: 40, rail: 'right' })
ramp(out, a, b, 0, 6, { from: 0.72, to: 1, run: s.run, kerb: 0.25 })   // arrives exactly where the flight does
```

Folsom is *"a stair-and-walk pair, not a single object"*: a wide monumental flight the full depth of the block
with *"a broad plain paved strip running parallel to it"*, between the Ice Skating Center and the Moscone
hall, whose wall is *"big white concrete piers at regular bays with stepped planted terraces between them"*.

![](shots/kit/kit_folsom_stair.png)
![](shots/kit/kit_ramp.png)

*Left, `kit_folsom_stair`: 6 m of rise over 40 m of run, 14 m of flight beside a 6 m walk, the rail between
them and the pier wall alongside — **the same part that draws a 3-step stoop**. Right, `kit_ramp`: the
concrete ramp from the curved wall down to the mezzanine, with kerbs and rails. It is shot from ABOVE, because
a ramp lies on a deck and the deck's own edge hides it from a rider on the ground.*

### What stairs and railings could NOT be made general about

- **No CORNER stair, by decision**, and it is still the one thing missing. Owner: *"corner stairways are
  weird, but stairways with varying widths are not too weird"*, so `splay` is in and the corner is out. It
  needs a landing that TURNS — two baselines and a mitre between their end walls — which neither the straight
  nor the arc frame reaches. A fan IS now here: it is `arcStair`, which was written the day after this note
  first said it was out, because Moscone South needs four of them.
- **No SPIRAL.** `arcStair` climbs radially: its treads radiate and rise ACROSS the arc. A flight whose treads
  radiate and rise AROUND the arc — a real spiral or a curving staircase between two floors — is a different
  sweep, and the honest way to it is a helical variant of the same loop rather than an option on this one.
- **`arcStair` has no `splay`**: a fan's width is its arc, and widening it is what the arc already does.
- **A `ramp` is a single plane.** No landings, no cross-fall, and no switchback — a switchback ramp is two
  ramps and a deck, and the caller places them.
- **A landing does not turn, and the rail does not follow one.** `landing` is a flat extension at the head,
  and only with `anchor: 'bottom'` — with `anchor: 'top'` the head is a wall, and a landing there would be
  inside the building.
- **The stair's own rail is not `railing()`.** A stair rail slopes and a railing is level; `boxAlong` cannot
  make a sloped box, so the two are separate code and the stair's rail takes only `'posts'`, `'solid'` or
  `'glass'` as an infill, with no independent spacing or height.
- **The flight is flat colour and a surface, not a `Face`**, exactly as `rake` and `deckCut` are — no opening
  is cut in a riser, and a vaulted or arcaded undercroft is hand work.
- **The base is a flat plane at `y0`, not a raking soffit.** That is right for a masonry civic flight, which
  is what nearly all of these are, and wrong for a thin concrete stair in the air, whose underside follows the
  steps.
- **Nothing is clipped.** A `run` longer than the space in front of the wall will march across the pavement
  and into the carriageway — which is a mistake Yerba Buena's esplanade actually made once (`BUGS.md #134d`),
  and the fix there was to fit the flight to the pavement it has, not to wish the gradient shallower.
- **Neither part knows the terrain.** `y0` is the model's own local zero, so a flight down a slope has to be
  cut by its caller.

---

## Classical elements

![](shots/kit/sheet-classical.png)

### `classicalColumn` and the four orders

```ts
export function classicalColumn(out: MeshBuilder, x: number, z: number, y0: number, y1: number, r: number,
                                colour: Rgb, opts: ColumnOpts = {}): void

export type ColumnOrder = 'tuscan' | 'doric' | 'ionic' | 'corinthian'
export type ColumnTier = 'near' | 'mid' | 'far'

export interface ColumnOpts {
  /** which order's capital; 'tuscan' is the plain slab, and what the far tier draws whatever is asked */
  order?: ColumnOrder
  /** how much of it to model; omitted, it follows the height */
  tier?: ColumnTier
  /** the surface tag (surfaceTag('ashlar') and friends) */
  tag?: number
  /** the direction the colonnade's front faces (0 = +z), for the Ionic volutes */
  heading?: number
  /** real flutes: a finer shaft with an alternating radius. Only for the handful where the column is the subject. */
  flutes?: boolean
  /** the capital and base stone, when it is dressed lighter than the shaft */
  trim?: Rgb
}
```

ONE round column with entasis, a real base and a capital of its order. **The `tier` rule (BUGS.md #97, fixed 2026-09-23):** the tier follows the height unless you
name one — `tierFor` gives `far` under 6 m, `mid` under 12 m, `near` above — and the `far` tier draws a plain
tuscan slab whatever `order` was asked for. **An order asked for explicitly now promotes an automatic `far`
to `mid`**, which draws a real capital for about 100 triangles. Naming `tier: 'far'` yourself still gets the
28-triangle slab: that is a stated cost decision rather than a silent downgrade.

The four capitals, close up (this is the only difference between them):

| `order` | the capital |
|---|---|
| `tuscan` | a plain square slab |
| `doric` | a slab over a flared echinus |
| `ionic` | paired scroll volutes, turned to face `heading` |
| `corinthian` | a flared basket of acanthus leaves |

![](shots/kit/kit_classicalColumn_tuscan.png)
![](shots/kit/kit_classicalColumn_doric.png)
![](shots/kit/kit_classicalColumn_ionic.png)
![](shots/kit/kit_classicalColumn_corinthian.png)

### `column`

```ts
export function column(out: MeshBuilder, x: number, z: number, y0: number, y1: number, r: number, colour: Rgb,
                       opts: ColumnOpts = {}): void
```

`kit.ts`'s thin wrapper on `classicalColumn` — identical behaviour, kept because every Paris and SF builder
already calls it. Use either.

![](shots/kit/kit_column.png)

### `pediment`

```ts
export function pediment(out: MeshBuilder, x0: number, x1: number, z: number, y0: number, h: number, depth: number, colour: Rgb): void
```

The triangular gable over a portico: the front face at `z` facing −z, and the two sloping tops running back
`depth`. **Reach for it** for a temple front — over a colonnade, over a doorway, or in a row over the windows
of a Renaissance-revival facade, which is what `courtFacade` does with it internally.

**This part had never been used anywhere in the project** before this page existed. It is 3 quads.

![](shots/kit/kit_pediment.png)

**It draws facing −z**, unlike `edgeAt().heading`, which is the convention for parts that draw facing +z. A
−z part turned by a raw heading comes out exactly 180° wrong: that was BUGS.md #101, where the portico's
pediment faced into the building and read as a slab pushing up out of the roof. Add `+ Math.PI` when placing
it from an edge. Everything new on this page draws facing **+z**.

### `entablature` and `dentilCourse`

```ts
export type Frieze = 'plain' | 'dentil' | 'triglyph' | 'modillion'
export function entablature(out, a: P2, b: P2, y0, height, front, bays, opts: { colour?; tag?; frieze? }): void
export function dentilCourse(out, ring: P2[], y, height, front, colour, material?, frieze?): void
```

The ornament on an entablature or a cornice — **what a rider actually tells the orders apart by**, because at
any distance a street is seen from, a capital is a smudge and a row of teeth under a cornice is not.
`dentil` is a close row of small square blocks (Ionic, and most 1900s cornices); `triglyph` is grooved blocks
over each column and each gap with plain metopes between (Doric); `modillion` is fewer, deeper scrolled
brackets standing well proud (Corinthian, and any bracketed cornice).

`colonnade()` now takes a `frieze` and **picks its own from the order** when not told — so an existing
`colonnade()` or `facade()` call gets its correct frieze for free. `dentilCourse()` is the same ornament
round a whole ring for a cornice with no colonnade under it, which is what `bands: { top: 'dentil' }` uses.
Both draw facing **+z**, per edge.

![](shots/kit/kit_friezes.png)

*The three, on one entablature height: Doric triglyphs, Ionic dentils, Corinthian modillions.*

### `beam`

```ts
export function beam(out: MeshBuilder, a: [number, number, number], b: [number, number, number], r: number,
                     colour: Rgb, rv = r): void
```

A square tube between any two points in space, which `block` cannot do because it is axis-aligned. **Reach
for it** for a steel member, a truss, a tie, a duct run, an escalator tube, a bridge's diagonals, a crane.
`rv` lets the section be a flat plate rather than square. 12 triangles a member.

![](shots/kit/kit_beam.png)

---

## `church()` — the church kit

![](shots/kit/sheet-church.png)

```ts
export function church(out: MeshBuilder, fit: Fit, spec: ChurchSpec): void
```

[`src/render/landmarks/church.ts`](../src/render/landmarks/church.ts). A second slot grammar, for places of
worship, because `facade()` structurally cannot say one. `facade()` is ground / shaft / top / bands / crown —
a flat-walled masonry box with a repeating middle. **A church has no shaft.** It is a gabled hall with a
tower, the tower does not share the hall's bay rhythm, and the front is a gable END rather than the long
elevation.

This is not a style preference. [docs/INSTITUTIONS.md](INSTITUTIONS.md) measured it: **187 places of worship
in the San Francisco cut, 15 modelled, 37 refaced, 135 with nothing at all**, and in the owner's review of
~240 renders churches failed under *every* rule that touched them — Old Saint Mary's, Saint Agnes, Nuestra
Señora de Guadalupe, the Shrine of St Francis, the Chinese Independent Baptist Church — across three different
rules. The rules pick a *style*; a church's problem is *massing*.

### The argument, in two pictures

| `facade()` | `church()` |
|---|---|
| ![](shots/kit/kit_church_before_stmarys.png) | ![](shots/kit/kit_church_stmarys.png) |
| ![](shots/kit/kit_church_before_ssp.png) | ![](shots/kit/kit_church_ssp.png) |

Left is the best `facade()` can do with **Old Saint Mary's Cathedral** (way/260520154) and **Saints Peter and
Paul** (way/29902626) — a good brick office block and a good stone office block. There is no gable, no tower,
no portal and no spire, because `facade()` has no word for any of them; the nearest thing to twin spires is
the `spires` crown, which stands two needles on a flat roof. Right is the same two buildings through
`church()`, from the same photographs.

### The slots

**Every key is required; `aisles`, `transept`, `chancel` and `tower` may be `null`** — the same mechanism as
`FacadeSpec`, for the same reason: a model must write `tower: null` having looked at a photograph, where today
it writes nothing and never looks.

```ts
export interface ChurchSpec {
  nave:     Nave                 // the hall: bays, window levels, roof, pitch
  aisles:   Aisles   | null      // lower side aisles — presence means BOTH sides
  transept: Transept | null      // crossing arms — presence means BOTH arms
  chancel:  Chancel  | null      // the far end: an apse, or a squared sanctuary
  tower:    Tower    | null      // where it stands, how many stages, what finishes it
  front:    Front                // the gable end that faces the street
  walls:    Walls                // material, openings, buttresses
}
```

| slot | values | what it is |
|---|---|---|
| `nave.bays` | a count | window bays along ONE flank — the most countable thing about a church from the pavement |
| `nave.storeys` | a count | levels of window on that flank (2 where there is a clerestory over an aisle) |
| `nave.roof` | `gable` `hip` `flat` | |
| `nave.pitch` | `low` `moderate` `steep` | a WORD, not an angle: the kit turns it into a rise from the nave's own width |
| `aisles.roof` | `lean-to` `flat` | |
| `transept.ends` | `flush` `projecting` | whether the arms stand out beyond the aisles with their own gables |
| `chancel.kind` | `apse` `square` | `apse` is a half-octagon with a window per facet and a conical roof |
| `tower.at` | `front-centre` `front-corner` `twin` `crossing` `detached` | **spatial, not liturgical** |
| `tower.stages` | a count | the storeys the string courses divide it into — the only size the spec gives a tower |
| `tower.plan` | `square` `octagon` | |
| `tower.top` | `spire` `steeple` `belfry` `pyramid` `dome` `lantern` `parapet` `flat` | `belfry` is an OPEN top stage under a low cap, not a spire |
| `front.kind` | `gable` `pediment` `baroque` `mission` `plain` | the shape of the front's head |
| `front.portal` | `single` `triple` `porch` `recessed` | |
| `front.window` | `rose` `wheel` `oculus` `medallion` `lancets` `none` | |
| `front.steps` | a count | |
| `walls.material` | `facade()`'s `Material` set | shared, so a church matches its neighbours' palette |
| `walls.openings` | `lancet` `round` `square` `tracery` `blank` | |
| `walls.buttresses` | `none` `plain` `stepped` `flying` | |

**No heights anywhere.** `fit.height` is taken as the **nave RIDGE** — what OSM's height means on a church
when it means anything — and the eaves are solved back from it through `pitch`. A tower goes ABOVE it, from
`stages`, because OSM heights on churches essentially never include the spire.

**Which way it points.** The nave runs along the LONG axis of the fitted footprint and the front is its
NEGATIVE end, so a manifest entry should carry `"front": <bearing of the entrance front>` or
`"front": "street"`. Without a bearing the kit still picks the long axis, but which END is the front is then
the footprint's guess rather than an observation.

### The six worked examples

| | |
|---|---|
| ![](shots/kit/kit_church_gothic.png) **gothic** — `tower: twin/spire`, aisles, a transept, an apse, flying buttresses, a rose over a triple portal | ![](shots/kit/kit_church_brick.png) **brick** — one `front-centre` tower with a `parapet` top and no spire at all |
| ![](shots/kit/kit_church_baroque.png) **baroque** — a `baroque` curved gable, a `medallion`, twin `lantern` towers, stucco | ![](shots/kit/kit_church_mission.png) **mission** — a flat parapet with bell niches, `tower: null`, no spire |
| ![](shots/kit/kit_church_basilica.png) **basilica** — a `pediment` front, a `porch`, round-headed windows, a `crossing` `dome` | ![](shots/kit/kit_church_hall.png) **hall** — the ordinary parish church: one corner tower, a `pyramid` cap |

### The named parts

Each is exported and callable on its own, and **each is drawn FACING +z** and placed by a `heading`, the
`parts.ts` convention where `edgeAt(ring, i).heading` is an edge's outward facing. Nothing in this module uses
the `−z` convention of `pediment`, `pane`, `archedPane` and `courtFacade`; the one call into `pediment()`
takes the `+ Math.PI` correction at the call site (BUGS.md #101).

| part | picture | what it draws |
|---|---|---|
| `gableRoof(out, x0, x1, z0, z1, y, rise, …, hip?)` | ![](shots/kit/kit_church_gableRoof.png) ![](shots/kit/kit_church_gableRoof_hip.png) | a pitched roof over a box, ridge along z; `hip` pulls the ridge in from both ends |
| `gableEnd(out, at, heading, w, y, rise, …)` | ![](shots/kit/kit_church_gableEnd.png) | the triangular wall that closes a gable, with its raking eaves trim |
| `crossFinial(out, at, y, h, colour)` | ![](shots/kit/kit_church_crossFinial.png) | two crossed slabs, so a cross reads from every side |
| `roseWindow(out, at, heading, cy, r, stone, opts)` | ![](shots/kit/kit_church_roseWindow.png) | rose, `wheel`, and `surround` (a medallion) — the detail that says *church* at 200 m |
| `lancet(out, at, heading, y0, w, h, head, …)` | ![](shots/kit/kit_church_lancet.png) | one window, `pointed` / `round` / `square`. The **+z counterpart of `pointedPane`/`archedPane`**, which draw on −z and must not be used here |
| `lancetRow(out, a, b, y0, w, h, n, head, …)` | ![](shots/kit/kit_church_lancetRow.png) | one window per BAY along an edge — how a flank gets its rhythm from `nave.bays` |
| `buttress(out, at, heading, y0, h, w, d, kind, …)` | ![](shots/kit/kit_church_buttress.png) | `plain` and `stepped`, each with a weathered cap |
| `flyingButtress(out, at, heading, …)` | ![](shots/kit/kit_church_flyingButtress.png) | a pier out from the aisle wall and an arch bar back up to the nave wall |
| `portal(out, at, heading, w, h, kind, stone, opts)` | ![](shots/kit/kit_church_portal.png) | a stepped archivolt of `orders` mouldings round a dark void and a door, on steps |
| `bellNiche(out, at, heading, cy, w, h, stone)` | ![](shots/kit/kit_church_bellNiche.png) | a round-headed recess with a bell in it — a mission front's only ornament |
| `curvedGable(out, at, heading, w, y, rise, …)` | ![](shots/kit/kit_church_curvedGable.png) | the shouldered Spanish-colonial gable, built from flat courses so no wall is curved |
| `spire(out, at, y0, r, h, sides, …, pinnacles)` | ![](shots/kit/kit_church_spire.png) | a tapering spire with a ring of corner pinnacles at its foot |
| `churchTower(out, at, y0, r, stages, stageH, top, plan, o)` | ![](shots/kit/kit_church_churchTower.png) ![](shots/kit/kit_church_churchTower_parapet.png) ![](shots/kit/kit_church_churchTower_lantern.png) | stages with string courses, an open belfry where the top asks for one, and the finish. `spireOn()` can only do shaft-plus-spire; `tower()`'s `spire` crown covers a whole footprint |
| `apse(out, at, heading, r, y0, h, …)` | ![](shots/kit/kit_church_apse.png) | a half-octagon sanctuary: the one shape here that looks round and is not |
| `pagodaRoof(out, ring, y, tiers, …)` | ![](shots/kit/kit_church_pagodaRoof.png) | **not part of `church()`** — see below |

### Which traditions it covers, and which it refuses

**Never apply this by tag.** `amenity=place_of_worship` on a converted shopfront is still a shopfront.
Choosing between `church()`, `facade()` and from-scratch is the same `kit | custom | bail` triage as
everywhere else, keyed on **what the photograph shows**:

| what the photograph shows | answer |
|---|---|
| a gabled hall, with or without a tower — Gothic, Romanesque, colonial, mission, a plain parish hall | **`church()`** |
| an ordinary street building with a congregation inside (many of the 135) | **`facade()`, and no church geometry at all** |
| a Chinese temple: the upper floors of a street building, a recessed balcony, a tiled roof — Kong Chow Temple | **`facade()` plus `pagodaRoof()` placed on top.** Decided deliberately: these are *not* free-standing halls, and `church()` would raise a hall where there is a shopfront. `pagodaRoof` lives in `church.ts` because it belongs to the same subject, and is a loose part rather than a `Crown` kind so that `tower.ts` needs no change |
| four hyperbolic-paraboloid shells — St Mary of the Assumption | **from scratch.** The kit does not try, and saying so is its job |
| a genuinely curved or centrally planned building | **from scratch.** Flat walls only, as everywhere in the kit |

### What changed from the proposal in INSTITUTIONS.md

The proposal there was a starting point; these are the changes the photographs forced.

- **Every free number is gone.** `nave.height`, `nave.pitch: number`, `aisles.height`, `transept.length`,
  `tower.height` and `chancel.height` were all numbers a model would have had to invent. They are now derived
  from `fit`, or named (`pitch: 'steep'`), or a count (`tower.stages`).
- **`tower.at` is spatial, not liturgical.** `'west-centre'` / `'west-corner'` are wrong for San Francisco,
  where Saints Peter and Paul faces south and almost nothing faces east: `'front-centre'`, `'front-corner'`.
- **`aisles.sides` and `transept.arms` are gone.** `'both' | 'none'` could only ever duplicate `null`;
  presence now means both, and a one-aisle church is the custom tier.
- **`front.kind` gained `'baroque'`.** Nuestra Señora de Guadalupe's front is a curved, shouldered gable and
  the proposal had no word for it; `'pagoda'` was removed from `front.kind` because that decision moved to
  `facade()` + `pagodaRoof` (above).
- **`front.window` gained `'oculus'` and `'medallion'`** for the same building.
- **`tower.top` gained `'lantern'`** (an open cupola — Guadalupe's two) and **`tower.plan`**.
- **`front.steps` was added.** Old Saint Mary's and Guadalupe both stand on long flights, and a church that
  meets the pavement flat reads as a warehouse.
- **`chancel.kind: 'none'` was removed** in favour of `chancel: null`.

### What a church still cannot be made to say

Checked against the five worked photographs after building the kit. Each is a real thing in those pictures
that the slots have no word for; a builder needing one must drop to the parts above or model by hand.

- **A footprint that is not the church.** Both buildings modelled here have an OSM way that merges the church
  with its school or parish house — 49 × 53 m and 45 × 49 m, where the churches are 30 and 24 m across. Fitted
  to that box the kit builds a church twice its own width. The entries work round it with the manifest's
  point-and-size path, which is an existing mechanism but a manual measurement; **no kit can fix a footprint
  that is not the building.**
- **Attached wings** — the school along Filbert Street is half of what a rider sees of Saints Peter and Paul,
  and the kit has no slot for a subsidiary block.
- **Tracery.** `openings: 'tracery'` currently draws a wide lancet. Real Gothic tracery — mullions, cusping,
  a traceried rose — is flat-plane ornament and probably wants a texture, not geometry.
- **Sculpture and mosaic.** Guadalupe's painted medallion, its statue niches, and the carved tympanum over a
  Gothic portal are all the first thing a photograph shows and none of them exist here.
- **A dome over the nave**, as opposed to over a crossing tower — every Byzantine and many Greek Orthodox
  churches.
- **A minaret, and a synagogue's plan.** The parts were built to be reusable for those (a tower with a
  `lantern` top is already halfway to a minaret) but no slot has been checked against a photograph of either,
  and the module should not claim coverage it has not tested.
- **The interior seen through an open door**, which on a church is a real street-level experience and is a
  dark rectangle here.

---

## Helpers — the parts that draw nothing

These return numbers, points or rings, or copy geometry about. There is nothing to photograph, but they are
what the drawing parts above are made of, and a builder that does not know them writes the arithmetic by hand
and gets the facing wrong.

| function | what it gives you |
|---|---|
| `towerRing(fit)` | the footprint as an anticlockwise ring — the starting point for everything in `parts.ts` |
| `edgeAt(ring, i)` | one edge with everything a part needs: `a`, `b`, the tangent `tx/tz`, the outward normal `nx/nz`, the length `L`, the `mid`point, and **`heading`, the direction the wall FACES** |
| `longestEdge(ring)` | the index of the longest edge — usually the front, where a colonnade or a marquee belongs |
| `edgeFacing(ring, bearing)` | the index of the edge that faces a compass bearing most squarely — the street side, for `faceOn` |
| `insetRing(ring, d)` | the ring drawn in `d` metres toward its centroid: a setback, a roof, a cornice line. **Wrong on a concave ring** |
| `offsetRing(ring, d)` | the TRUE parallel offset — every edge moved `d` along its own normal, vertices at the intersections. Correct on a notched ring |
| `notch(ring, at, opts)` | a rectangular bite out of the footprint at a corner or along an edge; returns the new ring and the piece removed (pictured above) |
| `edgeDepth(ring, i)` | how far the ring reaches inward from edge `i` — a vault's or a light well's depth, derived rather than typed |
| `simplifyRing(ring, min, bend)` | an OSM outline with its dozens of near-collinear points collapsed to real corners |
| `roundRing(ring, r, n)` | the ring with rounded corners (pictured above; it draws nothing itself) |
| `tierFor(height)` | which column tier a height gets: `far` under 6 m, `mid` under 12 m, `near` above |
| `lathe(out, cx, cz, prof, sides, …)` | a profile revolved about a vertical axis — the shaft of every column |
| `boxAlong(out, …, heading, …)` | a box turned to a heading: the workhorse behind every part that sits on an edge |
| `block(out, x0, x1, z0, z1, y0, y1, c)` | a solid box from its footprint and heights |
| `rotated(out, part, angle)` | a MeshBuilder appended turned about y |
| `placed(out, part, angle, tx, tz)` | the same, turned and moved — a wall drawn once in its own frame, set in place |
| `fourSides(out, part)` | a part copied onto all four faces: draw it once on −z, get it everywhere |
| `hex('#rrggbb')` / `shade(c, f)` | a colour from hex, and a colour darkened or lightened |

**The one to internalise is `edgeAt(...).heading`.** It is the direction the wall FACES (0 = +z), not the
direction it runs. Every `parts.ts` helper that takes a `heading` — `marquee`, `bladeSign`, `signText`,
`bulbText`, `quoins`, `boxAlong` — expects that convention, and passing the direction the wall runs rotates
the part by a quarter turn: signs come out backwards, marquees collapse to an invisible sliver.

---

## What this catalogue found

Building the pictures turned up three things worth acting on, separately from the documentation gap itself:

1. **`arcade`'s arch heads did not read as arches** at any scale or with any arguments — **fixed**
   (BUGS.md #96), as part of building `facade()`: `ground: { kind: 'arcade' }` would have been worthless
   while the part it calls drew a picket fence.
2. **`classicalColumn`'s `tier` silently discarded `order`** below 6 m — **fixed** (BUGS.md #97): an order
   asked for explicitly promotes the automatic tier to `mid`.
3. **`Crown` needs `height` on every kind but `flat`** — already noted in MODELING_IMPROVEMENT_1.md as a cost
   to two runs, and still the first thing that fails to typecheck.

---

## What neoclassical still cannot be said

Checked against the three worked examples — the Pacific Exchange (way/256066230), the Curb Exchange
(way/151185875) and the US Appraisers Building (way/32965865) — after the 2026-09-23 additions. Each of these
is a real thing in those photographs that the slots have no word for; a builder needing one must drop to raw
parts.

- **A projecting centre pavilion** — a central bay standing forward for the full height with its own pediment,
  flanked by plainer wings. Ubiquitous on universities, libraries and civic buildings; **absent from all three
  worked examples**, which is why it was not built. It cannot be faked: `portico` with `projecting: true`
  stands forward only over the ground storeys.
- **Bracketed balconettes** — a small stone balcony on two consoles under a window, which is what the US
  Appraisers Building's rusticated storey actually carries (way-32965865-03.jpg). `head` dresses the top of an
  opening only.
- **Rustication as banded courses.** `ground: { kind: 'rusticated' }` draws small punched openings in ashlar;
  the real thing is deep horizontal grooves every course, which is the dominant texture of that whole
  building's base.
- **Sculpture** — the Pacific Exchange's two monumental figures flank its steps and are the first thing anyone
  photographs. Nothing in the kit places a figure.
- **A pediment with a modelled tympanum**, coffering, a cartouche, swags, a clock, lettering in the frieze.
  All are flat-plane ornament, and the right answer is probably a texture rather than geometry.
- **An order over a rusticated base with the base's storeys counted separately** — `ground` is one kind, so a
  giant order standing on a rusticated podium has to pick one. This is the commonest neoclassical composition
  after the plain temple front and is the most likely next addition.
