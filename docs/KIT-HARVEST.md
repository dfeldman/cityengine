# Harvesting the 35 hand-built landmarks into the kit

Scoping study, 2026-10-21. No code was changed. Sources: all 35 files in `src/render/landmarks/sf/civic/` (12)
and `src/render/landmarks/sf/showpieces/` (23), 18,194 lines, which export **62 builders**. Read against
[KIT.md](KIT.md), [KIT-DESIGN.md](KIT-DESIGN.md), [MODELING_IMPROVEMENT_1.md](../MODELING_IMPROVEMENT_1.md) and
the kit sources. Unless a path is given, `civic/x.ts:N` and `showpieces/x.ts:N` are relative to
`src/render/landmarks/sf/`.

## Summary

1. **Every agent wrote the same 60-line wall kernel.** 25 of 35 files declare their own edge frame
   (`Fr/frameOf`, `Edge/edgeOf` or `class Wall`). 28 files declare a `slab`, 31 a `panel`-type quad and 24 a
   round-arch fan. Each copy differs from the others in its face flags and argument order. **None of the 35
   calls `edgeAt`, and only 2 call `boxAlong`.** The kit's own versions take a centre, half-extents and a
   heading, whereas every agent wanted to say "from u0 to u1 along this wall, from o0 to o1 out of it, from y0
   to y1". Supplying that interface is most of the harvest. About 1,500 of the 18,200 lines are duplicated
   helpers.
2. **Each agent decided for itself which way the front faces, and the agents disagree.** The repository
   contradicts itself on this point (§4.1). About ten files assume the front faces −z and four assume +z. The
   rest avoid the question by finding the front from the plan's shape, using six different heuristics.
3. **17 of 35 files ignore the ground.** None of the 12 civic files reads `fit.grade` or `fit.groundAt`, so
   the War Memorial, Earl Warren and State Building stairs start at y = 0. **No file reads `fit.bare`.**
4. **Generic buildings are where the payoff is** (78% of the city is stucco, Victorian or Edwardian). The
   cheapest improvement there needs no kit part at all: `planWall` does not know which wall faces the
   street, so every Victorian carries 4.8 gables and 3.2 bay windows (§5.1).
5. **Cost:** ~1.85M tokens for the foundation, kit parts and migration, ~0.96M for the generic work, and
   ~0.43M for verification: ≈3.2M Opus-led, ≈2.65M mostly-Sonnet. Either fits in a quarter of one 13M
   week (§6.4).

Indicative triangle counts, measured by building each of the 62 builders on the test rectangle (50 × 70 × 40
m). That rectangle triggers every builder's ring fallback, so these are not the counts on the real footprints.

| | median | max | total |
|---|---|---|---|
| 62 new builders | 4,194 | 20,942 (`mcallisterTower`, close to the 25k cap in `tests/landmarks.test.ts:121`) | 326,505 |
| generic SF building (measured over all baked tiles) | 192 stucco / 372 Edwardian / 704 Victorian | — | mean 537 |

So one landmark costs about as much as eight generic buildings.

---

## 1. Inventory of recurring patterns

"Files" means files that contain the pattern; "impls" counts distinct implementations. The **Best** column
names the copy to harvest from.

| # | pattern | files | impls | how the copies differ | best (file:line) |
|---|---|---|---|---|---|
| P1 | **Edge frame** (origin, tangent, outward normal (tz, −tx), L; `P(f,u,o,y)`, `pt(f,u,o)`) | 25 | 25 | `Fr` interface (showpieces), `Edge` (civic), `class Wall` (`civic/state.ts:91`, `civic/mcallister.ts:170`), axis-only `Wall` (`civic/libraries.ts:139`), explicit-normal `frame(a,b,nx,nz)` (`showpieces/hunter-dulin.ts:62`), plan frame (`showpieces/cathedral-apartments.ts:69-93`) | `civic/market-deco.ts:51-61` (has `sub(e,u0,u1)`); `civic/sixth-street.ts:69` `sidesOf` (the 4 outward faces of a box, for towers and porches); `showpieces/grace-cathedral.ts:70-88` `frAB` (flips the edge away from an interior point) |
| P2 | **Oriented box on an edge** (`slab(u0,u1,o0,o1,y0,y1)`) | 28 | ~27 | Back face: always / never / flag. Bottom face: default on (palace `showpieces/palace-hotel.ts:86`, war-memorial) or off. Top face as a `lid` flag (russ, mills, hunter-dulin, cal465). `civic/state.ts:102` puts y before o. Two files wrap `boxAlong` (`civic/sixth-street.ts:84`, `civic/un-plaza.ts:55`) | `civic/van-ness.ts:75` drops the back face when o0 ≤ 0 and keeps the soffit, with the comment "a cornice is seen from below" (:72). `civic/market-deco.ts:74` has a per-face flag object |
| P3 | **Flat panel proud of a wall** (2 tris) | 31 | ~30 | Argument order is (u0,u1,y0,y1,o) in civic and (u0,u1,o,y0,y1) in showpieces. `civic/palazzos.ts:107` uses yet another order. Several copies guard against degenerate sizes | `showpieces/sherith-israel.ts:113` (guarded) |
| P4 | **Cheap open-backed band** (front + top [+ soffit] [+ cheeks]) | 6 | 6 | `ledge` `civic/venues.ts:96`, `course` `showpieces/grace-cathedral.ts:102`, `stub` `showpieces/sherith-israel.ts:104`, `Wall.band` `civic/mcallister.ts:211`, `course` `showpieces/de-young-building.ts:129`, `course` `civic/palazzos.ts:117` (overlaps at corners) | `civic/venues.ts:96` |
| P5 | **Round / segmental arch** (rectangle + fan) | 24 | ~20 | 4–10 segments. Some use degenerate quads (`civic/war-memorial.ts:111` notes "one sliver triangle is degenerate"). Head-only variants (`archHead`, `semi`). **Spandrel-above-arch** variants (`roundHead` `showpieces/hunter-dulin.ts:110`, `archHead` `showpieces/mills.ts:121`, `showpieces/russ-building.ts:103`) | `civic/van-ness.ts:86` `archHead`: has `rise`, so the same call draws round or segmental heads, built as trapezoids |
| P6 | **Archivolt / voussoir ring** | 10 | 9 | Face only or face + soffit, keystone or not | `civic/van-ness.ts:97` (face + soffit), `showpieces/aronson.ts:121` |
| P7 | **Pointed (two-centred) arch** | 3 | 3 | `showpieces/grace-cathedral.ts:141-221` (fill, ring, holed wall, reveal), `showpieces/russ-building.ts:90-131`, `civic/mcallister.ts:244` (only 2 segments per side) | grace |
| P8 | **Wall with real holes** (rather than glass laid over a solid wall) | 3 | 3 | Rectangular `punched` `showpieces/mills.ts:95`, round `holedWall` `showpieces/sherith-israel.ts:155`, pointed `holedWall` `showpieces/grace-cathedral.ts:188`, plus `reveal`/`holeReveal` jambs | mills for rectangles, grace for arches. Neither leaves a hidden quad behind the glass |
| P9 | **Rusticated / channelled base** (dark joint strips every 0.6–1.15 m) | 22 | ~18 | Pitch 0.6–1.15 m. A proud plate under the joints only in `civic/van-ness.ts:288`. Usually inline one-liners | `showpieces/custom-house.ts:137` `baseCourses` (panel + plinth + joints + string course); `showpieces/ninth-circuit.ts:291` `oldBase` |
| P10 | **Belt / string course and cornice stack** (frieze, bed, brackets/modillions, corona, cymatium, parapet) | 30+ | ~20 | Modillion pitch 0.6–1.9 m. Dentils only in aronson/bank. Some draw "modillions" as a shade strip (`showpieces/ninth-circuit.ts:222`) | `showpieces/california-465.ts:239` `crownCornice`; `showpieces/custom-house.ts:145` `topCourses`; mitred ring course `civic/nema.ts:88` `ledge`; path moulding `showpieces/phelan-building.ts:134` `band` (follows curves); **corner ownership** `showpieces/mills.ts:151` `band(Ends)` |
| P11 | **Piered shaft with recessed glass and spandrels** | 12 | 12 | Recess 0.3–0.45 m. Per-window geometry or none. Head flat/round/pointed. Corner piers wider | `showpieces/embarcadero-center.ts:101` `grid`: ring-wide, no per-window quads, closes convex corners, carries room UVs for night lighting. Also `showpieces/california-465.ts:215` `shaftBays` and `civic/market-deco.ts:143` `martWall` (Deco, pitch/floors parameters) |
| P12 | **Punched window grid + window dressing** (surround, sill, hood, pediment, balconette) | 20+ | ~25 | Every file has its own `windowAt`/`pairAt`/`nobleWindow`/`win` | `showpieces/ninth-circuit.ts:187` `nobleWindow` (`'tri'|'seg'|'none'` heads); `civic/auditorium-symphony.ts:157` `bayTemplate`, an aedicule drawn once and stamped with `placed` |
| P13 | **Bay solver** (corner piers + n bays at a pitch) | ~30 | ~10 | Odd/even n, corner-pier width, snapping to a reference bay | `civic/palazzos.ts:159` `bays(L,cp,pitch)`; `showpieces/aronson.ts:156` |
| P14 | **Grand stair with cheek walls / plinths / lamps** | 18 | 13 | Kit `stair` in 11 files. Steps as hand-stacked slabs in 7 (`civic/un-plaza.ts:247`, `civic/venues.ts:579`, `showpieces/mission-dolores.ts:321`…). Cheek walls are always hand-built | `showpieces/grace-cathedral.ts:629-660` (two flights + landing + sloped cheeks, foot read from the ground); `showpieces/sherith-israel.ts:337-340` (rustic plinth "so the flight does not hang where the street falls away"); `civic/state.ts:359-370` (terrace + cheeks + lamp standards) |
| P15 | **Colonnade / portico / giant order** | 15 | ~12 | `classicalColumn` in 8 files, always with `heading = atan2(nx,nz)`. Columns as slabs in 4. Paired columns on pedestals; engaged | `civic/war-memorial.ts:325` (paired doric on pedestals); `showpieces/fairmont.ts:384-426` (free + engaged); `showpieces/california-465.ts:403` (in antis) |
| P16 | **Pediment / gable face + rakes** | 12 | ~10 | Triangle only, or triangle + raking returns, or + modillions | `showpieces/ninth-circuit.ts:129` (tympanum + 2 rakes); `showpieces/sherith-israel.ts:426` (rakes via `beam` + modillions) |
| P17 | **Balustrade** | 15 | ~10 | Baluster quads at 0.28–0.62 m, posts, urns | `civic/un-plaza.ts:302` (the only true helper, with piers); `showpieces/ninth-circuit.ts:203` (posts + urns) |
| P18 | **Pinnacle / urn / finial** | 10 | 7 | Kit `pinnacle` used in 2 files. Re-made in `civic/mcallister.ts:222`, `showpieces/russ-building.ts:134`, `showpieces/hunter-dulin.ts:127`, urns in `showpieces/cathedral-apartments.ts:126` | kit `pinnacle` + cathedral `urn` |
| P19 | **Parapet with crest** (pinnacles on piers, cresting, antefixes) | 9 | 9 | | `showpieces/cathedral-apartments.ts:217` `parapet`; `showpieces/russ-building.ts:216` `crownParapet` (blind arcading + turret); `showpieces/hunter-dulin.ts:248` `cresting` |
| P20 | **Hip / château / pyramid roof** | 6 | 6 | Axis-aligned kit `roof` (`civic/auditorium-symphony.ts:375`, `civic/libraries.ts:260`, `showpieces/haas-lilienthal.ts:242`). Ring-based `hipOn` `civic/van-ness.ts:225`. Frame rectangle `hip` `civic/war-memorial.ts:198`. 4-corner château to a flat top `showpieces/hunter-dulin.ts:264` | hunter-dulin `chateau` (any quadrilateral, cresting, finials); van-ness `hipOn` for a ring |
| P21 | **Gable roof in an edge frame** | 7 | 7 | With or without end triangles, eaves overhang, rafter tails | `civic/sixth-street.ts:122`; `showpieces/mission-dolores.ts:249` (overhangs + rafters) |
| P22 | **Dormers** | 3 | 4 | Wall dormer, slope dormer, gabled cone dormer, mansard dormer | `showpieces/hunter-dulin.ts:320,352`; `civic/palazzos.ts:437` |
| P23 | **Dome / onion / drum / lantern** | 6 | 6 | Kit `dome` used once (`civic/state.ts:525`). `lathe` profiles. Windowed drums | `showpieces/holy-virgin.ts:172` `onion` + `:187` `drum` (arched window every k-th facet); `showpieces/sherith-israel.ts:476` `drumAndDome` |
| P24 | **Corner turret** | 6 | 6 | 6/8/12 sides; caps are cone, spike, bell or onion | `showpieces/hunter-dulin.ts:133` (corbel + shaft + ring + cone + spike) |
| P25 | **Light court / C- and U-plans** | 6 | 6 | Inward walls (frame reversed: `showpieces/palace-hotel.ts:348`, `showpieces/california-465.ts:347`); roof with a hole; concave-safe cutting | `civic/van-ness.ts:171` `cut` (polygon-clipping; :166 explains why the half-plane `clip` is wrong on concave plans); `showpieces/russ-building.ts:270-365` height-field → walls |
| P26 | **Setback crown / tiers** | 8 | 8 | offsetRing tiers, clip-to-band tiers, rectangle stages, notched corners | `showpieces/de-young-building.ts:316` (offsetRing tiers); `civic/mcallister.ts:490` `notched`; `showpieces/embarcadero-center.ts:72` `notchCorners` |
| P27 | **Rounded corner / prow / chamfer** | 6 | 5 | Tangent arcs | `showpieces/phelan-building.ts:341` `withProw`; `showpieces/palace-hotel.ts:285` (duplicates `parts.roundRing`) |
| P28 | **Flagpole + flag** | 20 | ~14 | Prism / beam pole; flag colours; US/CA stripes | `showpieces/mark-hopkins.ts:213` (superset); `civic/state.ts:172` |
| P29 | **Lamp standard / wall lantern** | 6 | 6 | Near-identical copies at `civic/state.ts:190` and `civic/war-memorial.ts:178` | `showpieces/ninth-circuit.ts:234,243` |
| P30 | **Quoins** | 3 | 3 | `parts.quoins` is never used (it takes a heading and a point, not an edge end) | `showpieces/sherith-israel.ts:206` |
| P31 | **Roundel / cartouche / relief / medallion** | 12 | ~12 | Ornament discs and tablets | `civic/sixth-street.ts:101`; `showpieces/sherith-israel.ts:142` `circleRing` |
| P32 | **Lettering as rhythm** (dark bars, no glyphs) | 4 | 4 | `civic/libraries.ts:170` (seeded) | Should use `parts.signText`/`sign`, which 5 files did use |
| P33 | **Front finding** | 35 | ~20 | See §4.2 | `showpieces/bethlehem-steel.ts:276` `findCorner` (chamfer) |
| P34 | **Grade handling** | 18 | 5 styles | See §4.3 | `showpieces/sherith-israel.ts:518` (per element); `showpieces/cathedral-apartments.ts:266` `groundStorey` |
| P35 | **Shared walls / ownership** | 6 | 5 | See §4.4 | `civic/mcallister.ts:428` `dressPart`; `showpieces/mark-hopkins.ts:418` `against/occl` |
| P36 | **Ring prologue** (fallback rectangle, wind anticlockwise, simplify) | 33 | 3 simplifiers | `simplifyRing` imported from `districts/market-west.ts:52` (Douglas–Peucker, tol) in 20 files, from `tower.ts:602` (min, bend) in others, and `map/footing.ts:42` is a third | §4.1 |
| P37 | **Height scaling by `fit.height`** | ~15 | 4 | Module-level `let Y` / `let drop` / `let PL` (`showpieces/aronson.ts:291`, `showpieces/bethlehem-steel.ts:161`, `showpieces/phelan-building.ts:63`, `showpieces/cathedral-apartments.ts:70`) breaks re-entrancy and leaks state if the builder throws | pass a `Y` object down |
| P38 | **Palette + `T = surfaceTag` map** | 35 | 35 | 10–21 constants per file; GLASS/TRIM/SHADE recur with slightly different values; `EMIT` redefined 4× | §3 T3-c |

## 2. Mapping against the existing kit

### 2.1 Already covered by the kit but not used, and why

| kit part | covers | used by | why agents skipped it |
|---|---|---|---|
| `parts.edgeAt` | P1 | 0 | Its return value is right. But no companion `at(e,u,o)` / `P(e,u,o,y)` exists, and nothing else in the kit takes an edge, so it saves only 5 of the 15 lines each file needed |
| `parts.boxAlong` | P2 | 2 | Takes centre + half-extents + heading, so every call becomes `(u0+u1)/2 … (o1-o0)/2` arithmetic. It also always draws 6 faces, which wastes 2 tris on the back face of a wall-mounted slab |
| `parts.panelOn` | P3 | 0 | Takes the position as a FRACTION along the edge (`along`) and draws a 0.08 m box (12 tris), not a 2-tri quad |
| `kit.archedPane` / `pointedPane` / `pediment` | P5, P7, P16 | 0 / 0 / 1 (auditorium, in a canonical frame) | They draw on the −z axis only (`kit.ts:90,104,123`). On an oblique ring edge they need a temporary builder + `placed`, which only `civic/auditorium-symphony.ts:270` did |
| `church.lancet` / `roseWindow` / `portal` / `gableRoof` | P7, P16, P21 | 0 | `(at, heading)` API with no orders, reveals or holes. The church kit also carries a cross: Sherith's header (`showpieces/sherith-israel.ts:2-5`) records `church()` putting "a Christian cross on top of the synagogue's dome". Grace (`:3-5`) found it "generic", and Mission Dolores (`:3-4`) found it lacked the vocabulary |
| `parts.entablature` / `dentilCourse` | P10 | 2 (libraries, van-ness `grove101`) | `(a,b)` endpoints work, but there is no corner ownership, no corona soffit, and no parapet/blocking course. Mostly the agents did not know about it |
| `parts.colonnade` | P15 | 0 | Fixed spacing, no pedestals, pairs or engaged columns. The agents placed `classicalColumn` by hand (8 files) |
| `parts.arcade` | P5 + P13 | 0 | `(a,b,n)` with no arch rings, keystones or spandrels; KIT.md's own warning about it being confused with `colonnade` |
| `parts.quoins` | P30 | 0 | Heading + point API; the agents wanted "both ends of this wall run" |
| `kit.pinnacle` / `turret` / `dome` / `parts.cupola` | P18, P23, P24 | 2 / 0 / 1 / 0 | `turret` is 12-sided with a fixed cap; `dome` cannot do onion or bell; `cupola` has no windowed drum |
| `kit.roof` | P20 | 3 | Axis-aligned rectangle only |
| `parts.roundRing`, `offsetRing`, `edgeDepth`, `notch` | P26, P27 | offsetRing 8, rest 0 | Re-implemented as `withProw`, `offsetPath` (open paths), `depthBehind`, `depthOf` and `notched`. **Unknown** to the agents, not wrong |
| `parts.edgeFacing` | P33 | 2 | Builders did not trust the +z/−z convention (§4.1) |
| `tower.faceBand` | P11 | 7 | Whole-ring API. `civic/nema.ts:84` fakes a single-edge call with a 4-point mini-ring. `civic/state.ts:155` `band` ignores its tag and gives every band the granite surface |
| `parts.stair` | P14 | 11 | Used where it was known. The missing piece is a solid **cheek wall** and the foot height from `groundAt` |
| `parts.signText` / `sign` | P32 | 5 | Used where known |

### 2.2 Needs a new or changed part

P1–P6, P8–P14, P16, P17, P19–P24, P28, P29, plus the footprint/grade/ownership helpers (P33–P36). Proposed in §3.

### 2.3 Keep local to the building (not worth harvesting)

- The rigid registrations of hard-coded OSM outlines: `civic/mcallister.ts:102` `locate`,
  `showpieces/mark-hopkins.ts:110` `register` and `showpieces/one-oh-one-california.ts:119` `placement`. They
  are clever but tied to stored data. If a fourth building needs one, promote a `registerOutline(fit, known)`
  then.
- 101 California's sawtooth drum and cascade.
- Grace's porch orders and flèche.
- The Palace's Garden Court glass roof.
- Phelan's prow drum: a part could draw it, but the prow geometry is all it shares with anything else.
- Sculpture groups: eagles, the Moore, the Pacific Exchange-style figures.
- The lettering bars.
- Bill Graham's `groveNormal`, War Memorial's span-profile `findFront`, Fox Plaza's edge classes.
- The Haas-Lilienthal Queen Anne gable part (`showpieces/haas-lilienthal.ts:72`) is a candidate for the
  generic Victorian family, not for the landmark kit (§5).

## 3. Proposed kit parts

**Convention for every new part (matches KIT.md):** a part sits on an `Edge`, which is exactly what `edgeAt`
returns. Within that edge:

- `u` runs along the wall from `a`, `o` points outward along `(nx, nz) = (tz, −tx)`, and `y` is up.
- A `heading` argument, where one is still needed, is `edgeAt(...).heading`, which is the direction the wall
  FACES (0 = +z).
- Parts are drawn from **y = 0 at the part's own datum**, which the caller sets from the footprint helper
  (§4.3). Absolute heights are never assumed.
- Plan arguments come before height arguments: `(u0, u1, o0, o1, y0, y1)`. That is the order 27 of the 28
  slab copies already use.
- A trailing `opts` object carries colour, `tag` and flags, so a cheap model never has to count positional
  booleans.

The new parts go in **`src/render/landmarks/wall.ts`**: the edge-frame "wall kit". The roof, crown and
footprint parts extend `parts.ts`, `kit.ts`, and a new `lot.ts`.

Triangle costs are for typical sizes: a 20 m wall, 4 storeys, 6 bays. Each part names the §1 pattern(s) it
replaces; the files that switch are the ones listed for that pattern in §1, and the "switches" column counts them.

### Tier 1: the kernel (removes ~1,000 duplicated lines; every one of the 30 edge-frame files switches)

| part | signature | draws | tris | switches |
|---|---|---|---|---|
| **T1-a frame ops** (P1) | `type Edge = ReturnType<typeof edgeAt>`; `edgeOf(a,b): Edge`; `at(e,u,o): P2`; `P(e,u,o,y): V3`; `sub(e,u0,u1): Edge`; `flip(e): Edge`; `sidesOf(e,u0,u1,o0,o1): Edge[4]` | nothing | 0 | all 25 frame files |
| **T1-b `slab`** (P2) | `slab(out,e,u0,u1,o0,o1,y0,y1,c,{tag,back?='auto',bottom?=true,top?=true,ends?=true})` | Box on a wall. `back:'auto'` drops the face lying against the wall when `o0 ≤ 0.01` (the van-ness rule) | 8–12 | 28 |
| **T1-c `panel` / `band`** (P3, P4) | `panel(out,e,u0,u1,o,y0,y1,c,{tag})` gives one quad. `band(out,e,u0,u1,o,y0,y1,c,{tag,top?,soffit?,ends?: Ends})` gives an open-backed course | Panel; string course, sill, mullion, modillion | 2 / 4–8 | 31 / 6 |
| **T1-d `arch` + `archRing`** (P5–P7) | `arch(out,e,uc,w,y0,h,{o,c,tag,head:'round'\|'segmental'\|'pointed',rise?,seg?=6})` and `archRing(out,e,uc,w,spring,{r0,r1,o0,o1,c,keystone?,soffit?})`. `spandrel(...)` is the wall above the head | Glazed or solid opening; archivolt | 2+2·seg (14) / ~4·seg (24) | 24 / 10 |
| **T1-e `bays`** (P13) | `bays(L,{pitch,corner?=0,odd?,snap?}): {u:number[], w:number, piers:[u0,u1][]}` | Layout only | 0 | ~30 |
| **T1-f `lift`** (P34) | `lift(out,v0,dy)` shifts every vertex since `v0`; `mark(out)` returns `v0` | Replaces 10 hand loops | 0 | 10 |

### Tier 2: wall dressing (biggest visual value; also the parts the generic families need, §5)

| part | signature | draws | tris | switches | generic use |
|---|---|---|---|---|---|
| **T2-a `rusticate`** (P9) | `rusticate(out,e,u0,u1,y0,y1,{course?=0.75,o?=0.02,plate?:number,joint?:Rgb,plinth?:number})` | Banded base: joints (+ proud plate, + plinth) | 2 per course + 10 (~24) | 22 | brick, classical, sfapartment bases |
| **T2-b `cornice`** (P10) | `cornice(out,path:P2[],closed,y,{kind:'modillion'\|'bracket'\|'dentil'\|'corbel'\|'plain',h,depth,pitch?,frieze?,parapet?:number,ends?:Ends,lod?:'near'\|'far'})` | Mitred stack along a ring or polyline: frieze, bed, brackets, corona with soffit, cymatium, parapet + coping. `ends` = corner ownership (mills `band(Ends)`) | plain ~8/m-run segment; modillion 20 m ≈ 280; `lod:'far'` swaps the brackets for a shade strip (≈ 40) | 30 | **every** cornice style (edwardian, victorian, sfapartment, brick, chinatown) |
| **T2-c `pieredWall`** (P11) | `pieredWall(out,e,u0,u1,y0,y1,{floors:number[]\|{fh}, pitch, pier:{w,o,corner?}, recess?=0.4, spandrel, glass, mullions?, head?:'flat'\|'round'\|'pointed', topFloors?, roomUV?})` | Pier slabs, recessed glass plane, spandrel per floor, optional arched top storey. No per-window quads (Embarcadero rule) | (bays+1)·10 + floors·4 + heads ≈ 90–150 | 12 | chicago, skyscraper, brutalist, bauhaus |
| **T2-d `windowGrid`** (P8, P12) | `windowGrid(out,e,u0,u1,{rows:[y0,y1][], pitch, w, surround?, sill?, hood?:'none'\|'cornice'\|'tri'\|'seg'\|'arch', balconette?:number[], holes?:boolean})` | Punched windows with dressing. `holes:true` cuts the wall like mills `punched` | 4–16 per window (≈100–380) | 20 | brick, classical, edwardian trim |
| **T2-e `pediment`** (P16) | `pediment(out,e,uc,w,y,rise,{o,depth,rakes?,modillions?,tympanum?})` (edge frame; supersedes the −z `kit.pediment`) | Gable face + raking cornices | 6–30 | 12 | victorian/edwardian false-front gable, window heads |
| **T2-f `balustrade`** (P17) | `balustrade(out,e,u0,u1,y,{h?=0.9,o?,spacing?=0.3,posts?:number,urns?,solidEnds?,lod?})` | Plinth, rail, backing shade quad, balusters, posts/urns | ~4/m + 10/post (~100 per 20 m). `lod:'far'` gives 6 | 15 | classical, edwardian roof rail |
| **T2-g `grandStair`** (P14) | `grandStair(out,e,u0,u1,{to:number, lot, depth?, cheeks?:{w,h,lamps?}, landing?, terrace?, preset?})` returns the `parts.stair` result | Wraps `parts.stair`. The foot is `lot.ground()` at the foot. **Solid cheek walls follow the flight's slope**. A plinth fills down to the ground under each end (Sherith rule) | flight 12/step + cheeks 24 (~200) | 18 | victorian/edwardian **stoop** (small preset) |
| **T2-h `portico`** (P15) | change `parts.colonnade` to `colonnade(out,a,b,y0,h,n,{order,pairs?,pedestal?,engaged?:number,entablature?,pediment?,tier?})` | Adds pairs, pedestals, engaged columns, a returned entablature and an optional pediment over it | per column 200–900 by tier | 8 (+4 slab-column files) | classical |

### Tier 3: roofs, crowns and street furniture (fewer buildings, but each currently costs 40–100 lines)

| part | signature | draws | tris | switches | generic use |
|---|---|---|---|---|---|
| **T3-a `hipRoof`** (P20) | `hipRoof(out, ring\|quad, y, {rise, inset?, flatTop?, eaves?, cresting?, finials?, dormers?: Dormer[]})` | Hip / pyramid / château to a flat top on any convex ring or quadrilateral (hunter-dulin `chateau` + van-ness `hipOn`) | 10–30 + dormers | 6 | capecod, presidio, victorian hip variant |
| **T3-b `gableRoof`** (edge frame; P21) | `gableRoof(out,e,u0,u1,o0,o1,y,rise,{ends?,overhang?:{front,side,back},rafters?,ridge?})` | Two slopes, end triangles, soffits, barge boards, rafter tails | 8–60 | 7 | victorian gable (replaces `buildings.ts:352` `gable()`) |
| **T3-c `dormer`** (P22) | `dormer(out, plane, {kind:'gable'\|'hip'\|'wall'\|'shed', w,h, window})` | Dormer on a roof plane or rising from the wall | 20–40 | 3 | mansard, capecod |
| **T3-d `turret`** (change; P24) | `turret(out,at,y0,y1,r,{sides?=8,corbel?,cap:'cone'\|'bell'\|'onion'\|'pyramid',capH?,finial?,windows?})` | Corner turret | 60–250 | 6 | victorian corner tower (Queen Anne) |
| **T3-e `domeOnDrum`** (change `cupola`; P23) | `cupola(out,at,y0,r,{drum?,windows?:{every,w,h},profile:'dome'\|'onion'\|'bell'\|'saucer',lantern?,finial?:'ball'\|'cross'\|'orthodox'\|'none'})` | Drum + windows + dome + lantern | 400–1,000 | 6 | none |
| **T3-f `parapetCrest`** (P18, P19) | `parapetCrest(out,e,u0,u1,y,{h,coping?,piers?:number[],pinnacle?:{h,w,cap:'pyramid'\|'urn'\|'ball'},cresting?,antefix?})` | Parapet with pinnacles / urns / cresting / antefixes | 10/m + 12 per pinnacle | 9 | deco/gothic downtown |
| **T3-g `flagpole` / `lampStandard` / `wallLantern`** (P28, P29) | `flagpole(out,at,y0,h,{flag?:'us'\|'ca'\|Rgb[],angle?:Edge})`; `lampStandard(out,at,y0)`; `wallLantern(out,e,u,y)` | Street furniture | 40 / 36 / 20 | 20 / 6 / 6 | none |
| **T3-h `palette`** (P38) | `src/render/landmarks/palette.ts`: named `Rgb` constants (STONE, GRANITE, TERRA, GLASS, SASH, SHADE, BRONZE, VERDIGRIS…) + one `T` tag map + `EMIT` | Nothing | 0 | 35 | the generic families draw trim colours from it |

That is **20 parts**: 6 kernel, 8 wall dressing, 8 roof/crown/furniture (two of which are changes to
existing parts). The footprint helpers in §4 are additional to these.

**Deliberately left out:** a "Beaux-Arts palazzo front" composite (`civic/state.ts:292` `pavilion`,
`civic/war-memorial.ts:221` `wall`). It is tempting, but it is `facade()`'s job. Once T2 exists, `facade()`
should gain `ground: 'rusticated-banded'`, pilaster orders over a counted base, and a projecting centre
pavilion. Those are the three gaps KIT.md:1566+ already lists, and the parts above are exactly what they are
missing.

## 4. Footprint, grade and shared walls: one tested helper

### 4.1 The front convention is contradictory in the repo itself

| source | says the front is |
|---|---|
| `src/render/landmarks.ts:96-99` (`front?` doc) | local **+z**, "checked empirically" 2026-09-22 |
| `tools/model-shots.ts:181-189` | **+z** (`edgeFacing(ring, 0)`) |
| `src/render/landmarks.ts:405-408` (`fitFront` doc) | "the model's local **−z** faces `bearing`" |
| `src/render/landmarks/fit.ts:11` + `landmarks.ts:1134` | `grade` is measured at local `(0, −hz)`, "the model's front" |
| `docs/KIT.md:19-21` | demos put the front on **−z**; the `kit.ts` parts draw on −z |

**Working the arithmetic:** `inFrame` (`landmarks.ts:353`) and model-shots both map world → local with
`x' = x·cosθ − z·sinθ, z' = x·sinθ + z·cosθ` and `θ = bearing + π`. Under that map, an outward normal
`(sin b, cos b)` lands on **local (0, −1)**. That supports −z for any entry whose front is a bearing.

The "+z, checked empirically" claim may date from the older north-up tool. It has not been re-tested since
the tool changed. The agents split along exactly this line:

- **−z:** `showpieces/california-465.ts:25-28,276`, `showpieces/sherith-israel.ts:21-24,523`,
  `showpieces/holy-virgin.ts:280`, `civic/venues.ts:18-22,67`, `civic/state.ts:665,742`, and the tie-breaks
  in auditorium, market-deco, palazzos, libraries and mission-dolores.
- **+z:** `showpieces/aronson.ts:293` (`edgeFacing(ring,0)`), `showpieces/palace-hotel.ts:19-22,277`,
  `civic/van-ness.ts:832-838` (Nourse fallback), and `showpieces/hunter-dulin.ts:20-23` (hard-coded).

**Fix:** stop asking builders to know the convention.

- The placer already knows the front. It is the manifest bearing, or the baked frontage
  (`landmarks.ts:1091-1098`).
- **Add `fit.front?: { nx: number; nz: number }` to `Fit`**: the street front's outward normal in the
  model's own frame.
  - Set it in `landmarks.ts` wherever `bearing` is defined.
  - Set it in `tools/model-shots.ts fitForEntry` from the same bearing.
- `lot()` (below) picks the ring edge that best matches `fit.front`.
- **Migration step 0** is one test that settles the stale comment (§6.1).

### 4.2 Hull vs ring

- The city hands a multi-part entry its parts' **convex hull** (`landmarks.ts:1077`, unless `plan: 'union'`).
- `tools/model-shots.ts` hands the real outline of a single way.
- Fairmont (`:171-177`), Grace (`:302-306`), 101 California (`:22-26`), Phelan (`:17-20`) and Mark Hopkins
  (`:19-22`) each discovered this separately.

**Fix:**

- **Add `fit.outline?: 'ring' | 'hull'`**, set by the placer.
- `lot()` exposes `lot.isHull`.
- Builders that need notches either declare `plan: 'union'` in the manifest (preferred, one line) or find
  features by edge length alone. The mills header (`showpieces/mills.ts:26-28`) shows the length-only
  approach working on both.
- model-shots should honour `plan`/union the same way the city does. Otherwise the two tools keep handing
  builders different rings.

### 4.3 The helper

```ts
// src/render/landmarks/lot.ts
export interface Lot {
  ring: P2[]          // anticlockwise, simplified with ONE simplifier (tower.ts simplifyRing; retire market-west's)
  raw: P2[]           // anticlockwise, unsimplified: jogs a simplifier drops (civic/van-ness.ts:809, civic/sixth-street.ts:366)
  isHull: boolean
  front: number       // ring index of the street front
  edge(i: number): Edge
  role: ('front' | 'side' | 'rear' | 'chamfer' | 'party')[]   // per ring edge
  ground(x: number, z: number): number  // groundAt ?? grade ?? 0, relative to the model base
  datum: number       // ground at the front door (front edge mid, 1.5 m out), clamped [0, maxLift]
  low(e: Edge, u0: number, u1: number): number   // lowest ground along a run → plinth bottom
  high(e: Edge, u0: number, u1: number): number  // highest → water table / sill (Sherith's gHi rule, :245)
}
export function lot(fit: Fit, o?: {
  front?: 'placed' | 'longest' | 'chamfer' | { length: number } | { bearing: number }
  simplify?: number; maxLift?: number; party?: P2[][]   // neighbour rings, when known
}): Lot
export function findChamfer(ring: P2[], o?: { min?: number; max?: number; flank?: number }): number | null  // bethlehem :276
export function prow(ring: P2[], r: number): { ring: P2[]; i0: number; i1: number } | null              // phelan :341
export function cut(ring: P2[], e: Edge, d: number): P2[][]   // polygon-clipping, concave-safe (van-ness :171)
```

**Front rule:** take `'placed'` (the edge best aligned with `fit.front`, length-weighted as in `edgeFacing`)
if `fit.front` exists, and fall back to `'longest'`. Shape heuristics are opt-in overrides. The one worth
shipping is `findChamfer`. Four files independently wrote "a short edge between two long ones":
`civic/state.ts:396`, `civic/van-ness.ts:266`, `civic/van-ness.ts:966` and `civic/sixth-street.ts:497`.

**Grade rule:** two supported modes, both drawn from `lot`. No module-level `let`.

1. **Datum mode** (most buildings). Draw with the entrance at y = 0. Every wall run starts at
   `y = −lot.datum − 0.5`, because the city sinks the base 0.5 m below the lowest ground
   (`landmarks.ts:1131`). Call `lift(out, v0, lot.datum)` at the end. This is what nm140, phelan, russ,
   hunter-dulin, mills, aronson, bethlehem and cal465 do by hand.
2. **Per-element mode** (long fronts on a hill). Use `lot.low/high/ground` per run: plinths go down to `low`,
   sills go above `high`, and each stair's foot is at `ground(foot)`. This is the Sherith and Cathedral
   Apartments approach.

`grandStair` and any `plinth` part must take the `Lot`, so a stair can no longer start at 0. The 17 files
with no grade handling are fixed by switching to `lot()` alone.

### 4.4 Shared walls and z-fighting

Rules found in the code:

- `civic/mcallister.ts:16-18`: the taller part draws a shared wall.
- `showpieces/mills.ts:29-30,151`: the owning front turns the corner, and the other stops short by its own
  depth.
- `showpieces/fairmont.ts:542`: an annex is inset 0.4 m.
- `showpieces/mark-hopkins.ts:418-439`: no windows behind abutting volumes.

**Proposal:**

- `lot.role` marks an edge `'party'` when it lies within 0.4 m of a `party` neighbour ring, or of an edge
  listed in `fit.bare`. `fit.bare` exists and is unused by all 35 files.
- `ownership(parts: {ring, top}[]) → per edge {state: 'out' | 'plain' | 'none', from: y}`, generalised from
  `dressPart`, handles multi-part buildings.
- The `Ends` type is shared by `band` and `cornice`.
- One table of standard layer offsets (`LAYER.trim = 0.02`, `LAYER.sash = 0.04`, `LAYER.recess = −0.4`, …) in
  `wall.ts` replaces the hand-tuned 0.01–0.09 values in every file.

### 4.5 Tests (`tests/lot.test.ts`)

1. **Convention.** A ring with one notched side, placed through `fitSnug` + `inFrame` at bearings 0/90/180/270:
   `lot(fit).front` is the notched edge every time, and `fit.front` points out of it.
2. **Hull.** The same building given as ring and as hull: `findChamfer` and `'longest'` agree, and
   `isHull` is set.
3. **Grade.** A `groundAt` that slopes 6 m across the lot: the front door's datum is right, every wall run
   reaches `−0.5` below the lowest ground, and the stair foot equals `ground(foot)`.
4. **Winding.** A clockwise input comes out anticlockwise. A court ring is reversed so frames face into the
   court (`showpieces/palace-hotel.ts:348`).
5. **Re-entrancy.** Two builders run interleaved produce identical output.

---

## 5. Generic generators: variety first

### 5.1 What is there today (measured)

**Styles and counts.** The 89,142 SF buildings in `docs/san-francisco-archetypes.csv` use 17 styles:

| style | count | share |
|---|---|---|
| stucco | 32,653 | 36.6% |
| victorian | 19,373 | 21.7% |
| edwardian | 18,257 | 20.5% |
| brick | 5,431 | |
| sfapartment | 4,263 | |
| bauhaus | 3,933 | |
| capecod | 1,667 | |
| all others | < 1,000 each | |

**Pipeline.**

- Bake: `tools/bake.ts:860` → `classifySF` (`src/city/sf/btype.ts`) → 22 archetypes → `STYLE_OF`.
- Render: `src/render/city.ts:4177-4300` → `planFacade` (`src/city/facade.ts:263`) → `buildBuilding`
  (`src/render/buildings.ts:691`) → per-wall `planWall` (`facade.ts:353`).
- Output: one mesh per (200 m tile, style) under the per-style `facadeMaterial` ShaderMaterial. The vertex
  colour carries the palette tint, and its alpha carries the kind (wall / atlas / rail).

**What varies per building:**

- palette: 1 of 6 (stucco), 15 (victorian) or 11 (edwardian);
- storey and ground heights within a range;
- bay width;
- window size, which only moves the sills;
- which of 3 painted windows each cell gets.

**What is fixed per style:**

- ground-floor kind (stucco/edwardian: always garage; victorian: always stoop, and painted only);
- top kind and cornice size;
- features;
- roof: 99% flat. `bake.ts:3063` `roofFor` pitches only capecod, presidio and mansard.
- SF has no roofscape: `region.ts:208,219` turns chimneys and dormers off.

So two neighbouring Victorians differ only in palette and window paintings. That is the "copy-pasted"
street.

**The street-blind defect.**

- `planWall` never learns which wall faces the street. `facesStreet` is computed per wall in
  `city.ts:4151,4271`, but only for awnings.
- The feature rules therefore fire on **every** short wall:
  - `facade.ts:480`: bay windows on every wall ≤ 9.5 m;
  - `facade.ts:513`: a gable on every wall ≤ 9.5 m, although the comment there says "on the street wall";
  - fire escapes on every wall with 3 or more bays.
- Measured result: a Victorian carries **4.8 gables and 3.2 bays**, where a real one has one of each.
- Cost: Victorian median 704 tris, 14.1M tris city-wide, mostly in these duplicates. `buildings.ts:352`
  gables also run 3–7 m back from each gabled wall, which matches the owner's "roof in mid-air" reports.

**Data at render time.**

- The v3 record (`src/city/package.ts:88-175`) carries `style`, `archetype` (22), `levels`, `height`, `roof*`,
  `noShops` and `form`.
- It does **not** carry year, use, construction type or district. Those live only in the bake
  (btype `Features.record`) and the CSV.
- So "data is not the problem" holds at bake time only. Until the format changes, the families must key off
  `archetype + style + levels + seed`.

**Two colour bugs.**

- Walls pick their palette by `pick(rng(id))` (`facade.ts:272`).
- The roof (`bake.ts:3071`) and the mid-ring massing (`fringe.ts:63`) use `palettes[|id| % n]`.
  `asMassing` (`fringe.ts:118`) also drops `b.palette`.
- Over 80k ids, **90% mismatch**: a house changes colour when its tile loads.

### 5.2 Step zero: street-aware walls (no new parts; saves triangles)

- Pass `street: boolean` (and `main: boolean`) into `planWall`, from the `facesStreet` result `city.ts`
  already computes.
- Gate `bayWindows`, `gable` and `fireEscape` on it.
- Pick ONE street wall per building for the Victorian gable and bay. Use the longest street-facing wall ≤
  9.5 m; on a corner lot, use the one on the higher-ranked street.
- Expected effect:
  - Victorian median falls from ~700 to ~350 tris;
  - the 14.1M Victorian total roughly halves;
  - the mid-air roofs disappear.
- Fix the palette pick in `bake.ts` and `fringe.ts` to use the same `rng(id)` pick in the same change.
- Cost: ~60k tokens, Sonnet.

### 5.3 Families: parametric styles with independent seeded axes

Each high-count style becomes a family. Each axis is drawn from its own sub-seed (`rng(id ^ AXIS_SALT)`), so
the axes vary independently. Each axis's weights are conditioned on the archetype. **G** = needs real
geometry (a harvested part, or `buildings.ts` `feature()`); **S** = stays in the shader/atlas (a new atlas
cell or a tint).

**Victorian** (19.4k; archetypes `victorian-house`, `narrow-lot`):

| axis | values (weights) | G/S | part |
|---|---|---|---|
| bay | slanted 45%, square 25%, round turret-bay 5%, none 15%, stacked 2-storey 10% | G | `bay()` gains a `kind`; turret via T3-d `turret` at `lod:'far'` (sides 6) |
| top | gable 50%, false-front flat cornice 35%, hip 15% | G | T2-e `pediment` / T2-b `cornice kind:'bracket'` / T3-a `hipRoof` |
| cornice | bracketed 60% (Italianate), plain 25%, spindle frieze 15% | G (brackets) / S (frieze) | T2-b, `lod:'far'` beyond 60 m |
| entry | stoop + hood 70%, recessed porch 20%, garage-under (`levels ≥ 3`) 10% | G | T2-g `grandStair` small preset (6–8 steps, cheeks), cheap |
| window head | flat 40%, segmental 30%, pedimented 30% | S (atlas cell) | 3 more atlas paintings |
| trim vs body | contrasting trim colour from a second palette list | S | vertex colour on trim geometry |
| ornament level | 0/1/2: whether brackets, quoins and the frieze are drawn | G | gates the above |

**Edwardian** (18.3k; archetype `edwardian-house`):

| axis | values | G/S | part |
|---|---|---|---|
| bay | square 40%, slanted 30%, flat 30% | G | `bay()` |
| cornice | bracketed 40%, plain 40%, pediment-capped 20% | G | T2-b, T2-e |
| ground | garage 55%, stoop 30%, shopfront on corner lots 15% | G / S | T2-g, atlas |
| windows | paired 50%, single 30%, Chicago-style 20% | S | atlas |
| rustication | channelled base storey 25% | G | T2-a, 2 tris per course |
| trim colour | second palette | S | |

**Stucco** (32.6k; archetypes `interwar-house`, `sunset-house`, `postwar-house`):

| axis | values | G/S | part |
|---|---|---|---|
| sub-style | Mediterranean (tile parapet / pent roof) 35%, Streamline (rounded corner, eyebrow band) 15%, plain box 30%, Doelger (picture window + entry stair along the front) 20%, by archetype | G | `pentRoof` (T3-b with one slope), `parts.roundRing` on the front corner |
| garage door | 1 or 2, arched or square | S | atlas |
| entry stair | along-front 50%, straight 30%, none 20% | G | T2-g |
| parapet | flat, tile cap, stepped | G | T2-b `kind:'plain'` + a tile tag |
| window | picture 40%, bay-box 20%, casement grid 40% | S / G (bay-box) | `bay()` |
| colour | pastel palette, expanded from 6 to ~18 | S | |

**sfapartment** (4.3k), **brick** (5.4k) and **chinatown** (0.6k):

- `rusticate` ground storey;
- T2-b cornice `kind:'bracket'` (most) or `'plain'`;
- T2-d `windowGrid` hoods (`'cornice'` / `'seg'`);
- `fireEscape` on the street wall only.

**Constraints between axes:**

- `levels ≥ 3` allows a garage under a stoop.
- `narrow-lot` forbids the turret-bay.
- A corner lot (two street walls) raises the shopfront and turret weights.
- The `postwar-house` archetype forbids bracketed cornices.

When year and construction join the record, add `year < 1890` → Italianate, `1890–1905` → Queen Anne
(turret allowed), `construction A/B` → brick/stone only. Adding them is about one byte each in
`src/map/format.ts` → `convert.ts` → `adapt.ts`, plus a rebake.

### 5.4 Material integration (the hard constraint)

Generic buildings are drawn by `facadeMaterial`, using the vertex-colour alpha convention. Kit parts emit
cartoon-material geometry with a surface tag. A harvested part can join the tile mesh only if it writes
alpha = 0 (wall) with the palette tint, as `buildings.ts` `feature()` and `bay()` already do.

So every T2/T3 part the families use needs an **emit adapter**: an `out` that maps `(colour, tag)` to the
generic convention. The cheapest form is a `GenericSink` implementing `MeshBuilder.quad` that remaps tag →
kind. This keeps one draw call per (tile, style). The alternative, a second mesh per tile in cartoon
material, costs +1 draw call per tile per style and is acceptable only for ornament.

### 5.5 Phone cost

- Phones run tier `ultra` (`src/tier.ts:114,162`): only the rider's own tile is full detail (`view:0`), with
  a massing ring beyond it, and the atlas is clamped to 1024² (each cell ≈ 128×51 px).
- Budget per family building, after step zero:

| style | target tris | breakdown |
|---|---|---|
| Victorian | ≤ 450 | ~350 base + ~100 for stoop, brackets and one bay |
| Edwardian | ≤ 450 | |
| stucco | ≤ 300 | |

  A typical SF tile (~40 buildings) stays under its current median of 12k.
- Ornament (brackets, balusters, spindles) uses `lod:'far'` beyond ~60 m. A shade strip replaces the
  geometry, so it stays mostly in the atlas.

**Instancing candidates** (thin instances, own material, +1 draw call per tile):

| candidate | count | per-instance variation |
|---|---|---|
| bay windows | ~19k Victorian + ~18k Edwardian street bays | width/height via the instance scale; 3–4 bay meshes |
| cornice brackets | ~40 per building on bracketed fronts → ~600k city-wide | one mesh |
| stoop steps | | |
| turret caps | | |
| finials | | |

- Instancing pays only where a part is identical across buildings and ≥ ~50 tris. Brackets are 8 tris each
  but very numerous, so batch them per tile with a single instanced mesh.
- Below that size, merging into the tile mesh is cheaper than an extra draw call.
- Instances need the palette tint as a per-instance colour attribute.

---

## 6. Migration plan

### 6.1 Order of work

| step | work | model | tokens |
|---|---|---|---|
| 0 | **Convention test**: `tests/lot.test.ts` case 1, plus `tools/model-shots.ts --entry=<sherith> --front=0` vs `--front=180`; fix whichever comment is wrong; add `fit.front` / `fit.outline` in `landmarks.ts` and `model-shots.ts` | Opus | 80k |
| 1 | **`lot.ts`** + tests 1–5; retire the market-west and footing `simplifyRing` copies behind one export | Opus | 150k |
| 2 | **Tier 1 kernel** (`wall.ts`), `palette.ts`, `lift`; demo `kit_wall_kernel` in `kit-demo.ts`; KIT.md section "Walls on an edge" with pictures via `tools/kit-shots.ts` | Opus | 200k |
| 3 | **Tier 2 parts**, each with a kit-demo builder, a KIT.md picture and a test. Harvest from the "best" copies in §1 rather than writing fresh | Opus for `cornice`, `pieredWall`, `grandStair`, `portico`; Sonnet for the rest | 8 × 40k = 320k |
| 4 | **Tier 3 parts** with demos | Sonnet | 8 × 30k = 240k |
| 5 | **Pilot migration**: 3 builders of different kinds (`showpieces/california-465.ts`, `civic/war-memorial.ts`, `showpieces/hunter-dulin.ts`) to shake out the API before the bulk | Opus | 3 × 70k = 210k |
| 6 | **Bulk migration**, grouped 3–4 files per agent by shared vocabulary (§6.2) | Sonnet | ~22 files in 7 groups × 90k ≈ 650k |
| 7 | **Generic step zero** (§5.2) | Sonnet | 60k |
| 8 | **Generic families**: emit adapter, Victorian, Edwardian, stucco (then brick/sfapartment) | Opus for the adapter + Victorian; Sonnet for the others | 150k + 4 × 120k ≈ 630k |
| 9 | Instancing for bays and brackets | Opus | 150k |
| 10 | Data: year + construction into v3, rebake, constraint table | Sonnet | 120k |

### 6.2 What to migrate, and what not

**Migrate.** These are the 22 files whose only shared code is the kernel plus Tier 2. Migration deletes
~40–80 lines from each and gives them grade handling for free.

- aronson, bank-of-italy, bethlehem-steel, california-465, custom-house, de-young-building, ninth-circuit,
  new-montgomery-140, russ-building, hunter-dulin, mills, fairmont, palace-hotel, phelan-building,
  sherith-israel, mission-dolores, holy-virgin
- civic: war-memorial, state, un-plaza, van-ness, palazzos, venues, sixth-street

**Grade-only migration** (swap the prologue for `lot()`; leave the dressing alone): libraries, market-deco,
nema, auditorium-symphony, cathedral-apartments, grace-cathedral.

- Grace is 845 lines of mostly specific Gothic. Rewriting it risks the owner's favourite for little gain, but
  its stair and portal must stop ignoring local ground.

**Do not migrate:**

| file | reason |
|---|---|
| `one-oh-one-california.ts` | hull-registered bespoke drum; shares nothing but a quad helper |
| `mcallister.ts` | rigid registration and its own `Wall` class are the whole design; the only harvest is *from* it (`dressPart` → `ownership`) |
| `mark-hopkins.ts` | same; the harvest is `against`/`occl` → `ownership` |
| `haas-lilienthal.ts` | already uses the axis-aligned kit + `placed` |
| `embarcadero-center.ts` | its ring parts *are* the harvest (`grid` → `pieredWall`) |

### 6.3 Verifying nothing regresses

1. **Before shots, taken once, before step 5.** For each of the 62 builders, run
   `node --experimental-strip-types tools/model-shots.ts --entry=<name>` (front, three-quarter, top) into
   `shots/harvest/before/<name>/`. Batch them through `tools/shoot-landmark.sh`.
2. **After each migrated file**, take the same shots into `after/` and run
   `node --experimental-strip-types tools/compare-shots.ts before/<n> after/<n>`.
   - Gate: ≤ 0.5% of pixels changed at threshold 24 for a pure refactor.
   - A grade fix will change the front shot on a sloping site. That change is expected. Review it by eye
     and record it in the commit.
3. **`tests/landmarks.test.ts`.** It already builds every procedural builder with a finite/bounded/affordable
   check (`:112-135`). Add:
   - a triangle count per builder, recorded before the migration, with ±10% allowed. The kernel's
     `back:'auto'` should only reduce counts;
   - a sloped `groundAt` fit (6 m fall) under which no builder's front y-min sits above the ground and no
     stair foot sits below it.
4. **City shots** of the Civic Center and Nob Hill from `tools/shots.ts`, before and after, through
   `compare-shots`, to catch placement and front changes the model shots cannot show.
5. **For the generic families:**
   - before/after `tools/shots.ts` street views of Alamo Square (Victorian), the Inner Richmond (Edwardian)
     and the Sunset (stucco);
   - the triangle census re-run with the scratch census script, or a `tools/building-census.ts --tris`
     mode;
   - `tools/perf.ts` on the `ultra` tier.

### 6.4 Token budget (owner's week ≈ 13M)

Base rates: 200k for a single custom landmark, 90k per building when grouped. MODELING_IMPROVEMENT_1.md
measured 82k for one building alone and 11–14k each in a batch of ten, with the brief worth ~20%.

| block | Opus-led | all-Sonnet alternative |
|---|---|---|
| steps 0–2 foundation | 430k | 430k (do not downgrade: the conventions decide everything after) |
| steps 3–4 parts | 560k | 420k |
| steps 5–6 migration | 860k | 650k (pilot stays on Opus) |
| steps 7–10 generic | 960k | 800k |
| verification shots and review (~15%) | 430k | 350k |
| **total** | **≈ 3.2M** | **≈ 2.65M** |

Both fit in a quarter of one week. After the harvest, a new custom landmark should cost what a recipe building
costs today. A Sonnet run in a batch of five, with a brief that inlines the `wall.ts` + `lot.ts` signatures,
should land at **~25–40k per building** instead of ~90–200k.

That is MODELING_IMPROVEMENT_1's "another recipe is worth more than another tier of model", applied to the
landmark path. The brief must name the parts: the same study found a part unnamed in the brief goes unused.

## 7. Surprises

1. **The kit already had most of this, and nobody used it.** The kit has `edgeAt`, `boxAlong`, `panelOn`,
   `entablature`, `arcade`, `colonnade`, `quoins`, `roundRing`, `edgeDepth` and `notch`. None of the 35 files
   calls `edgeAt`, and only 2 call `boxAlong`. The cause is the API shape (centre/half-extent/heading against
   the agents' u/o/y spans), not discoverability. The u/o/y kernel is the single highest-value change.
2. **The repo disagrees with itself about which way the front faces** (§4.1). The arithmetic says −z for
   bearing-placed entries, while two source comments say +z, "checked empirically". The 35 agents split
   along this line.
3. **Three different `simplifyRing` functions** (`tower.ts:602`, `districts/market-west.ts:52`,
   `map/footing.ts:42`) with different signatures. 20 of the 35 files import the district one.
4. **Every civic file ignores the ground.** Those 12 files hold the city's most stair-fronted buildings.
5. **The generic Victorian's ornament is applied to every short wall** (4.8 gables per house), and the colour
   of every generic house changes at the massing switch (90% of ids). These are the two cheapest variety
   wins, and neither needs a kit part.
6. **Year, use and construction are not available at render time.** They exist only at bake time, so the
   families key off `archetype` until the format gains two fields.
7. **Module-level mutable state** (`let Y`, `let drop`, `let PL`) in 4 showpieces. It is harmless today
   because builders run serially, but a refactor that interleaves builders will break it.
