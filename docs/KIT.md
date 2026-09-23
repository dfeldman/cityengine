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

**Known defect — the arch heads do not read as arches.** The cause is visible in `parts.ts` around line 363:
the shaded opening is drawn with its centre at `y0 + height * 0.36` and half-height `height * 0.36`, so its
top is a flat line exactly at the springing (`0.72 * height`), and **the arch head above it is never filled
dark — it stays plain wall**. The only hint an arch was intended is five small chord boxes (`bay * 0.07`
half-size) sitting over a rectangular hole, which at every scale render as a stair-step of floating blocks.
The fix is to fill the tympanum, not to add more chords. Compare the naive call, which is what a model that
has not seen this page will write:

```ts
arcade(out, e.a, e.b, 0, 7, 5, {})
```

![](shots/kit/kit_arcade_naive.png)

That is a picket fence over black slots. **The defaults do not survive a naive call.** Until the arch is
fixed, `arcade` still beats a plain `punched` face for a ground floor — the openings and the rhythm are right
— but do not expect the arches to read from the street. `piers: true` has the same arch and squarer supports:

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

**What matters:** `out` (how far in front of the wall — 1.2 default is tight, 1.5–2.5 reads better), `n`
(4–8), and **`tier`**. Columns under 6 m get `tier: 'far'` automatically, which draws a plain tuscan slab
whatever `order` you asked for; pass `tier: 'near'` when the columns are the subject of the building.

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

### `signText`

```ts
export function signText(out: MeshBuilder, text: string, cx: number, cy: number, z: number, h: number, c: Rgb,
                         opts: { lit?: boolean; tag?: number; vertical?: boolean; heading?: number } = {}): void
```

Block letters in a 3 × 5 font, applied to a wall, each letter `h` tall. `lit: true` makes them emit — a neon
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

ONE round column with entasis, a real base and a capital of its order. **The `tier` gotcha:** it follows the
height unless you name one — `tierFor` gives `far` under 6 m, `mid` under 12 m, `near` above — and **the
`far` tier draws a plain tuscan slab whatever `order` you asked for**. If the order is meant to be visible,
pass `tier: 'near'`.

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
| `insetRing(ring, d)` | the ring drawn in `d` metres toward its centroid: a setback, a roof, a cornice line |
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

1. **`arcade`'s arch heads do not read as arches** at any scale or with any arguments. The opening is a
   rectangle whose top is flat at the springing line, and the tympanum above it is never filled — the five
   chord boxes float over a rectangular hole. The part the corpus used once is the part that is broken, and
   the fix is to fill the arch head rather than to add more chords.
2. **`classicalColumn`'s `tier` silently discards `order`** below 6 m. A model that asks for corinthian on a
   5 m shopfront order gets a tuscan slab and no warning. Every caller that cares must pass `tier`.
3. **`Crown` needs `height` on every kind but `flat`** — already noted in MODELING_IMPROVEMENT_1.md as a cost
   to two runs, and still the first thing that fails to typecheck.
