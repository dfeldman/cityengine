# Model: Temple Emanu-El (Congregation Emanu-El), 2 Lake Street at Arguello Boulevard

Evidence pack, gathered 2026-10-15. Everything below was checked by hand; where two sources disagree it says so.

## Every source here can be wrong — the photographs are the ground truth

The owner, 2026-10-15: "our data can be wrong, or OSM data can be wrong… buildings can be labeled as other things,
the difference between buildings and building parts is inconsistent, sometimes heights are in feet or storeys
instead of meters… every data source we have is imperfect. The ground truth is Mapillary images, but it's often
difficult to see a whole building in one image."

So treat every number below as a claim to check against the pictures, not a fact:

- **OSM**: outlines can be out of date or merged with neighbours; a `building:part` may be the whole building or
  vice versa; tags can say the wrong thing (Temple Emanu-El's dome part is drawn today as an apartment block).
- **LiDAR** (2010): heights are a footprint's median and maximum — a median over a stepped building is neither the
  wall nor the roof, and anything rebuilt since 2010 is missing. The 2025 renovation here added floors *below*
  ground, so the 2010 survey should still hold above ground.
- **Assessor**: storeys are a record keeper's count (4 here, for a building whose sanctuary is one enormous room).
- **Wikipedia**: "45 m dome" may be to the finial, from the street, or rounded.

Where the photographs and a number disagree, believe the photographs, and say so in your report. Several frames
show only part of the building — piece the whole together from all of them (count storeys and window rows, compare
the dome's width with the drum and the wall below it) rather than trusting any one view.

## What it is

Synagogue, dedicated April 1926. Architect **Arthur Brown Jr.** (Bakewell & Brown, the City Hall architects) with
Sylvain Schnaittacher. **Byzantine Revival / Mediterranean Revival**, inspired by Hagia Sophia (Wikidata Q5160642;
German Wikipedia: "Die Kuppel mit Terrakottaziegeln ist 45 Meter hoch … Der Bau ist von der Hagia Sophia inspiriert.
Im Innenhof befindet sich ein Kreuzgang mit offenen Säulengängen."). AIA's most beautiful building in Northern
California, 1927. A $97 M renovation finished 2025 added floors below street level and a third classroom floor;
the domed sanctuary was not altered. Texts: `docs/shots/refs/notable/emanu-el/wiki.txt`, `dewiki.txt`.

## OSM (the bake's input)

- **relation/3654752** — `building=synagogue`, multipolygon: outer way/274565593 (25 nodes), inner way/274565594
  (the courtyard, a hole). `ele=68`. No height tag. In the package this building's id is **7309505** (a relation is
  packed as 2·id+1) — an earlier batch looked `way/7309505` up on the OSM API, found a Finnish road, and dropped the
  building as "stale". **Use `relation/3654752` in the manifest.**
- **way/1153003006** — `building:part=yes`, `roof:shape=dome`, no height: the dome's footprint, a circle of radius
  ~12.9 m (20 vertices). It is in the package as its own building (drawn today as a 20 m `sfapartment`), so the
  entry must claim it too.
- Neighbours, NOT this building: St John's Presbyterian (way/274615294, 201 Arguello, already modelled as
  `stJohnsPresbyterian`), the Presidio Terrace houses to the west and north (9–11 m).

Plan in metres, x east, z north, from (37.78740, −122.45980), **in OSM's vertex order** (outer ring):

    outer: (-45.9,-17.8) (-44.8,-37.4) (-44.2,-37.9) (-43.9,-44.6) (28.4,-40.7) (26.0,0.9) (26.5,0.9) (26.1,7.3)
           (25.8,7.3) (23.9,44.4) (15.3,44.0) (15.2,46.4) (-4.5,45.4) (-4.4,43.1) (-12.2,42.7) (-11.8,35.1)
           (-12.1,35.1) (-10.2,-1.0) (-9.8,-0.9) (-8.9,-15.9) (-35.9,-17.4) (-35.9,-16.6) (-45.5,-17.1)
           (-45.5,-17.8)                                                       area ≈ 4 125 m²
    courtyard (hole): (0.1,-12.3) (17.2,-11.3) (18.4,-31.6) (1.3,-32.6)        area ≈ 348 m²
    dome: centre (7.6, 17.8), radius 12.9

So: an L. The **sanctuary** is the tall east block, x −12…26, z −1…46 (about 38 × 47 m), with the dome over its
middle. South of it the **front range** x −9…28, z −44…−1 wraps the **courtyard** (an open cloister, ~17 × 20 m).
The **west wing** x −46…−9, z −44…−17 (about 37 × 27 m) is the school/office block. Lake Street runs along the south
(z ≈ −50), Arguello Boulevard along the east (x ≈ +35). The entrance is through the courtyard from Lake Street.

**`fit.ring` is only the outer ring, in the model's own rotated, recentred frame — the hole and the dome are not in
it.** To place the courtyard and dome, map the plan above onto `fit.ring`: it is the same polygon (possibly reversed
to run anticlockwise, possibly starting at another vertex), so solve for the rotation + translation that best
matches the two vertex lists (try both orders and every starting offset, keep the smallest residual; a 2-D
Procrustes/Kabsch on 24 points), then transform the courtyard and dome through it. Do this at build time inside the
builder so it holds however the fit is oriented, and fall back to the ring's own bounding box if the residual is
over ~2 m or `fit.ring` is undefined (print nothing; just fall back). The stub's shots came out as a box of about
the L's bounding box, so check early (a temporary `console.log` you remove before reporting) whether the shot tool
hands you a ring, and what the residual is.

## LiDAR (DataSF building footprints, 2010 survey; heights above ground)

| footprint | where | median | max |
|---|---|---|---|
| 201006.0000786 (3 114 m²) | the sanctuary and front range | 18.3 m | **44.1 m** (dome top) |
| 201006.0002842 (1 018 m²) | the west wing | 16.5 m | 21.9 m |
| 201006.0176433 / 0176435 (3 m² each) | inside the courtyard | 8.2 m / 7.5 m | 9.9 / 9.2 m |

Ground under the building ~65–69 m (it falls toward the south-east). Wikipedia (de): dome **45 m**. So: dome top
44–45 m; sanctuary walls and the stepped blocks round the drum mostly ~18–28 m; west wing ~16–22 m; courtyard
arcade ~8–9 m.

## Assessor (2025 roll)

One parcel point inside the outline: built **1926**, **4 storeys**, use COMM, construction type **A** (steel frame).

## Photographs (look at every one) — `docs/shots/refs/notable/emanu-el/`

- `commons-Congregation_Emanu_El__San_Francisco.jpg.jpg` / `commons-Sinagoga_…` — from Arguello/Lake, the whole
  pile: the **terracotta-tiled dome** with fine ribs, on a **tall octagonal-ish drum ringed with round-arched windows**,
  stepped down through square **buttress blocks** to the sanctuary walls; the gable of a cross-arm with a **huge
  round-arched window** in a recessed arch; the lower front range with a blue awning.
- `commons-Congregation_Emanu_El.jpg.jpg` — Arguello side: the drum and dome over a **gabled front with a deep
  round-arched portal**, and the long low **west/south range** with a terracotta **tile roof** and chimney.
- `commons-Temple_Emanu_El__dedicated_in_1926…` — inside the courtyard: the **monumental arched portal** (a tall
  round arch framing a recessed, richly carved entrance), the cloister arcade, a fountain.
- `commons-Exterior_of_Temple…` — close-up of the carved portal.
- `commons-Synagogue_near_Julius_Kahn_Park…` / `commons-Presidio_Terrace…` — the dome over the neighbourhood: it is
  THE skyline object of Presidio Heights; the dome and drum read from far away.
- `mapillary-0…5.jpg` — 2023–25 street views from Lake, Arguello and Presidio Terrace: the cubic stepped massing,
  **cream/pale-buff stucco** everywhere, cornices edged with small **terracotta tile** brackets (a dentil-like band
  under each eave), gabled ends, the arcaded courtyard wall on Lake Street with round arches. (Construction fencing
  in 2025 frames — ignore it.)

Colours from the photographs: walls warm cream stucco ≈ `#e8dcc6` (sunlit) — it reads slightly pink in some light;
dome terracotta tile ≈ `#a9603f` with lighter ribs; roof tiles on the gables and the west range terracotta
≈ `#9c5236`; window glass dark; the portal's carved surround the same cream.

## What the model must show (the gist, in order of importance)

1. The **dome** — terracotta, 45 m to the top, on its **drum of round-arched windows** — over the sanctuary at the
   dome centre. This is what people see from blocks away.
2. The **stepped cubic massing** around the drum (square buttress blocks stepping down, Hagia-Sophia-like) and the
   **gabled cross-arm ends** with the giant round-arched window in each.
3. The **courtyard** open to the sky, ringed by a low **round-arched arcade** (~8–9 m), with the **great arched
   portal** on its north side (the sanctuary's entrance).
4. The **west wing**: a plainer ~16–20 m block, terracotta tile roof edge, punched arched windows.
5. Cream stucco walls everywhere; terracotta tile on the dome, gables and eaves.

Not needed: interior, the fountain, carving detail, the 2025 below-grade floors.

## How (read these first)

- `docs/sf-batches/BRIEF.md` — the general modelling brief (materials, checking, quality bar). Its "Your files"
  section is replaced by the one below.
- The kit: `src/render/landmarks/church.ts` (`church()`; Temple Sherith Israel, a 1905 domed synagogue, is
  `sherithIsrael` in `src/render/landmarks/sf/kit-churches.ts` — a useful comparison, but Emanu-El is far bigger and
  is NOT a nave church), `src/render/landmarks/tower.ts`, `src/render/landmarks/parts.ts` (look for dome/cupola/drum
  helpers), `src/render/landmarks/models.ts` (`box`, `prism`, …), `surfaceTag` in `src/render/cartoon-material.ts`.
  City Hall (`src/render/landmarks/sf/city-hall.ts`) has a drum and dome built by hand — read how.
- The kit works well for square-ish blocks with setbacks; the dome, drum and arcade will be your own polygons. Use
  the kit where it fits (the west wing, the sanctuary walls) and build the rest directly.
- A circle-ish footprint part is NOT a reason to model a cylinder tower: the dome sits on the sanctuary roof.

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — `NOTABLE.templeEmanuEl` is a STUB (a plain box, so the entry and
  the shot tool could be proven to work); replace it with your builder, keeping the name. Comment it like the others: building, year,
  architect, what the model shows and why, citing the photos.
- `public/landmarks/san-francisco/notable.json` — the entry is already there
  (`{"osm": ["relation/3654752", "way/1153003006"], "name": "Temple Emanu-El", "procedural": "templeEmanuEl", "front": "street", "height": 45, …}`);
  replace only its `note` with yours.
- `docs/shots/models/notable/` — your screenshots.

Do NOT edit any other file. Do not run git, bakes, or a dev server (one runs on http://localhost:5200 with hot
reload). Do not use a browser pane.

## Check before you report

- `node --experimental-strip-types tools/model-shots.ts --entry="Temple Emanu-El" --out=docs/shots/models/notable`
  — four views on the real footprint. **Read them and compare with the photographs**, and iterate until the dome,
  drum, stepped massing, courtyard and wings read as this building. Check the dome sits over the right part of the
  plan (north-middle of the sanctuary, NOT over the courtyard or the west wing).
- `npx vitest run tests/landmarks.test.ts` — under 25 k triangles (aim ≤ 15 k).
- `node tools/typecheck.js` — clean.

Report: what you built (and which parts are kit vs your own geometry), the triangle count, the transform residual
you got when mapping the plan onto `fit.ring`, the screenshot paths, and anything you could not do.
