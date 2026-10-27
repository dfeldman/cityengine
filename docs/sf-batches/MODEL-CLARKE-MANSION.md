# Model: the Clarke Mansion ("Nobby Clarke's Folly"), 250 Douglass Street at Caselli Avenue

Evidence pack, 2026-10-26. Builder `clarkeMansion_250_Douglass` in `src/render/landmarks/sf/clarke-mansion.ts`
(replacing the 2026-10-16 photo-pass sketch that lived in `districts/notable.ts`); manifest entry in
`public/landmarks/san-francisco/photo-pass-1016.json` (edited in place — first entry wins and that fragment is
included before `notable.json`).

## Every source can be wrong — the photographs are the ground truth

Treat each number as a claim; where it disagrees with the photographs, follow the photographs and say so.

## What it is

Alfred E. "Nobby" Clarke's 1891–92 mansion at the head of Eureka Valley: a four-storey **Baroque Queen Anne** house in
**pale grey-white painted wood** (fish-scale shingle bands over clapboard, white trim) on a **dark grey rusticated
basement storey**, set on a lot that rises above the street behind a retaining wall. San Francisco Landmark 80; the
Victor Apartments since 1909. Not cream, not a single corner tower: see below.

## Data (claims)

- OSM way/263884980 (`addr 250 Douglass Street`, `height=14`, `wikidata=Q4722577`), 24 vertices, 311 m². Centroid
  37.759605, −122.439573. Extents 24.0 m east–west × 18.1 m north–south; the long edges bear 86°/266° (the city grid
  here, 4° off east–west). The only round corner OSM drew is the **south-east** one (vertices v6–v11, a 6-facet bay
  ~5 m across); the north and west edges carry 1–2 m jogs.
- Streets, measured from the extract: **Caselli Avenue ~10 m NORTH of the north wall** (bearing 266 along the
  house); **Douglass Street ~20 m EAST** of the east wall. The lot corner is the north-east corner.
- Baked terrain (model metres, lower is lower): Douglass at Caselli −28.3, Douglass east of the house −25.2,
  Douglass at 19th −16.3; Caselli 60 m west of Douglass −23.1. Under the house: north edge −25.4, south edge −22.7.
  So Douglass falls northward to Caselli, Caselli rises westward, and the lot rises ~2.7 m from Caselli to its back.
- The bake has no named landmark for this way, so `"front": "street"` would fall through to the long-axis fit;
  the entry carries a numeric bearing.

## Photographs — `docs/shots/refs/notable/clarke-mansion/` (open every one)

| file | what it shows | licence |
|---|---|---|
| `commons-0.jpg` | the CONICAL tower on its round bay, seen from Douglass; the east side, 2-storey wing with balcony to the left | CC0, BriefEdits, 2024 (Commons "250 Douglass Street, exterior … 01") |
| `commons-1.jpg` | THE reference: the whole Caselli front from the north-east — both bell domes, porch, gable, cupola, conical tower behind-left, "250" gate | CC0, BriefEdits, 2024 (… 02) |
| `commons-2.jpg` | the front square-on: porch columns, balcony with urns, gridded ornament, gable with striped panels, chimney | CC0, BriefEdits, 2024 (… 03) |
| `commons-3.jpg` | the front from the east end, the right bell bay, the annex and garage at the west end | CC0, BriefEdits, 2024 (… 04) |
| `commons-4.jpg` | the front from further east: the dark basement, retaining wall, planted strip, garage at the right | CC0, BriefEdits, 2024 (… 05) |
| `commons-5.jpg` | the west end: the right bell bay over the garage, the neighbour attached beyond | CC0, BriefEdits, 2024 (… 06) |
| `commons-6.jpg` | the roofscape from the north-west, elevated: ridge, cupola, chimney, bell dome, hipped side bay | CC BY-SA 2.0, Kevin Collins, 2009 ("The Caselli Mansion, San Francisco (3720041013)") |

Mapillary: `tools/sf-photos.ts` found no frame for the way (the house stands back from the street behind trees).

Colours (from the photographs): walls ≈ `#d7dadd` pale grey-white; trim ≈ `#f2f2f0`; ornament stripes ≈ `#6e7276`;
basement ≈ `#5c6064`; roof slate ≈ `#474a4e`; bell domes and cone lead-grey ≈ `#8d8f88` (the cone paler, slate
shingle); finial balls gold; chimney red brick ≈ `#9c4a38`; windows dark.

## Which way it faces — the photographs overrule the brief

The brief assumed the front faced Douglass. It faces **Caselli, north**:

1. In `commons-4`/`commons-5` the street rises to the viewer's RIGHT: at the left end the main floor stands a
   retaining wall plus a full basement storey above the pavement (~4.3 m), at the right end a garage door's height
   (~2.7 m). Caselli rises westward; Douglass falls northward. Only a north-facing front has its right end uphill.
2. A neighbour is **attached** at the right end of the front (`commons-5`): west along Caselli there are houses; east
   of the house is Douglass Street.
3. Viewed from the front, the conical tower is at the rear-LEFT — south-east — which is exactly the one round bay
   OSM drew. `commons-0` shows that tower from Douglass with the east wing beside it.
4. `commons-6`, elevated, is taken from the hill to the north-west and sees the front gable on its left.

So the manifest carries `"front": 356` (the north edge's outward normal), the address being Douglass only because the
gate is there.

## Part by part (what the model must show)

Three things that make it recognisable from across the street: **(a) twin ribbed bell domes with gold balls on round
bays flanking the front; (b) a tall slate cone with a gold ball on a round tower at the back-left, rising a storey
above the eaves; (c) a square louvred cupola with a pyramidal cap and a red brick chimney over a big striped front
gable.** If a screenshot shows none of these, it has failed.

- **Basement**: a full dark grey rusticated storey (barred windows) over the whole plan, buried on the uphill
  (south) side; a dark retaining wall with an iron fence at the pavement, a planted strip, a stair up to the porch.
- **Main floor** (~4.1 m): clapboard, tall white-framed sashes; a one-storey **porch** across the middle of the front
  on four fluted Corinthian columns, balustraded between the columns, a deep bracketed cornice; the front door
  behind it.
- **Second floor** (~3.6 m): fish-scale shingles, same sashes; over the porch a **balcony** with a turned balustrade
  and four **urns** on its posts, and behind it a wall panel of square-gridded ornament under a dentilled band.
- **Round bays** at both front corners, three storeys from the basement to a dentilled cornice above the main eaves,
  each capped by a **ribbed lead-grey bell (ogee) dome** with a gold ball.
- **Conical tower** at the rear-left (south-east) corner: a round bay three storeys up, a dentilled cornice above the
  eaves, a short glazed belvedere stage, then a tall slate-shingled **cone** with a gold ball and a spike.
- **Roof**: a steep dark slate hip, ridge running east–west; a big **front gable** at the centre with white bargeboards,
  a pair of windows and vertical striped (stick-work) panels, a small balustrade before it; a segmental-arched dormer
  beside it; gabled dormers on the sides; two roof lights.
- **Cupola**: square, white, louvred, on the ridge just behind the gable, with a pyramidal slate cap and a spike;
  the **chimney** red brick with four pots, on the ridge to the right of the gable; a smaller white stack at the back.
- **Annex** at the front-right (north-west): a lower two-storey shingled piece with a hipped roof, the **garage door**
  at the pavement; the lot's neighbour adjoins beyond it.
- Fire escapes (white iron) on the front and the east side: skipped — invisible at 25 km/h.

## Outcome (2026-10-27)

Built: `clarkeMansion_250_Douglass` in `src/render/landmarks/sf/clarke-mansion.ts` (the 2026-10-16 sketch removed from
`districts/notable.ts`), **6,884 triangles**; the manifest entry in `photo-pass-1016.json` edited in place to `front: 356`.
Parts in a design frame measured off the OSM ring as the city fits it (hx 11.6, hz 8.6; −z Caselli, −x Douglass):
the dark basement from 3 m underground to the main floor, clapboard and shingle storeys, the two round bays with ribbed
lathed bells and gold balls, the south-east tower with its glazed belvedere and cone, the hip with the striped front
gable, segmental and gabled dormers, the louvred cupola (`spireOn`, four sides) and the brick chimney, the porch
(`colonnade`, fluted Corinthian, modillions) with its balustrades, balcony and urns, the gridded ornament panel, the
lower annex under its own hip, and along Caselli the retaining wall on `fit.groundAt` with an iron fence, gate piers and
the flight up to the porch. Shots: `docs/shots/models/notable/clarkeMansion_250_Douglass-{front,corner,street,top}.png`.
Checked in the city from Caselli, from Douglass and from the air (views/san-francisco.json "Clarke Mansion — from
Caselli at Douglass"): all three recognisable features read from across the street. Approximated or skipped: the
fire escapes, the garage door at the west end (the pavement there is nearly at lot level in the bake), the exact
24-vertex jogs of the plan, the planted strip (never plant anything).
