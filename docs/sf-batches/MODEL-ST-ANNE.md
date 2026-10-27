# Model: St. Anne of the Sunset Catholic Church, 850 Judah Street at Funston Avenue

Evidence pack, 2026-10-26. The owner: "a pink and white Victorian church (highly unusual)" — in fact 1930s
Romanesque/Byzantine revival (the parish's third church, dedicated 1933) in **pink stucco with white cast-stone
trim**, red-tile roofs, twin square campaniles. Was the `church()` kit's one-tower brick guess, built with no
photograph (`saintAnneOfTheSunset` in `sf/churches-3.ts`); now `stAnneOfTheSunset_850_Judah` in `sf/st-anne.ts`.

## Every source can be wrong — the photographs are the ground truth

Each number below is a claim; where it disagrees with the photographs, follow the photographs and say so.

## Data (claims)

- **OSM way/267102407**, `name=Saint Anne of the Sunset Catholic Church`, `addr:housenumber=810` (the parish and the
  owner say 850 — OSM's number is wrong or the rectory's; the footprint is right), `building=church`,
  `building:colour=#d9b2a4`, `roof:colour=#a3331e`, `height=25`, `ele=82`, `wikidata=Q7587034`,
  `wikimedia_commons=Category:Saint Anne of the Sunset Church, San Francisco`. 45 vertices. Centroid
  **37.76230, -122.47084**; the front wall is at about 37.76212 on Judah.
- Local OSM extract: `tools/cache/osm/norcal-latest.osm.pbf` (`osmium getid -r … w267102407`). `osmium tags-filter
  nwr/name=…` found nothing for "St. Anne…" / "Saint Anne of the Sunset" — the tag carries the full "… Catholic
  Church" name.
- Mapillary via `tools/sf-photos.ts`: **0 frames** (the N-Judah corridor is well covered but nothing scored).

## The plan, measured (metres, north up; nave axis x ≈ +0.75 from the centroid)

The footprint is a Latin cross with a wide rear block, **76 m long north–south by 44 m at the transept**, long axis
bearing 176° (the Sunset grid, 4° off true), front on Judah to the SOUTH:

| part | north–south extent | width (east–west) | what the photographs show there |
|---|---|---|---|
| tower stubs | y −24.0 … −20.0 | two 4.9 m stubs, centres x −8.5 and +13.0 | the twin campaniles stand 3.6 m proud of the front wall |
| front wall | y −20 | 39 m (x −18.5 … +20.2) | narthex and portals between the towers; a flat-roofed side chapel outside each tower |
| nave | y −20 … +14 (34 m) | 27 m (x −12.9 … +14.4) | 16–17 m clerestory nave between the towers' inner faces, ~5 m aisles each side |
| transept | y +14 … +35 (21 m) | 41 m (x −22.7 … +18.6) | gabled transept arms; the octagonal crossing drum over the middle |
| rear block | y +35 … +52 (17 m) | 34 m (x −19.9 … +14.6) | the low parish hall / sacristy wing, with the apse rising out of it |

Area 2,420 m². OSM's 25 m is read as the nave ridge; the towers rise to about 42 m (tower cap ≈ 1.4 × the front
gable's apex in the Grandview Park photograph, apex ≈ 29–30 m).

## Photographs (Wikimedia Commons; opened and judged, none of them reaches the game)

Downloaded at 1400 px to the session scratchpad; links are the canonical file pages.

| file | licence / author | view |
|---|---|---|
| [St Anne of the Sunset Church, San Francisco.jpg](https://commons.wikimedia.org/wiki/File:St_Anne_of_the_Sunset_Church,_San_Francisco.jpg) | CC BY 2.0, Marc Smith, 2010 | oblique aerial from Grand View Park: the whole front, both towers, the nave roof, the west side chapel |
| [St. Anne of the Sunset from Grandview Park, October 2018.JPG](https://commons.wikimedia.org/wiki/File:St._Anne_of_the_Sunset_from_Grandview_Park,_October_2018.JPG) | CC BY-SA 3.0, Pi.1415926535 | THE front reference, sharp, late sun: the tower stages, the gallery, the rose, the narthex hood and portals |
| [St. Anne of the Sunset from Grand View Park.jpg](https://commons.wikimedia.org/wiki/File:St._Anne_of_the_Sunset_from_Grand_View_Park.jpg) | CC BY-SA 3.0, Eric in SF, 2009 | the same front, closer, with the flat-roofed side chapels and the nave's west flank |
| [Saint Anne of the Sunset from Strawberry Hill, March 2020.JPG](https://commons.wikimedia.org/wiki/File:Saint_Anne_of_the_Sunset_from_Strawberry_Hill,_March_2020.JPG) | CC BY-SA 3.0, Pi.1415926535 | THE back reference, from the north-west: the round apse with its blind arcade, the octagonal crossing drum and lantern, the west transept gable with its small rose, the low parish wing |
| [Inbound train at Judah and Funston, November 2017.JPG](https://commons.wikimedia.org/wiki/File:Inbound_train_at_Judah_and_Funston,_November_2017.JPG) | CC BY-SA 3.0, Pi.1415926535 | street level, the portals: the carved white archivolts and friezes, engaged columns, the rose and its tiled hood, the steps and railings, the palms |
| [Outbound train at Judah and Funston, November 2017.JPG](https://commons.wikimedia.org/wiki/File:Outbound_train_at_Judah_and_Funston,_November_2017.JPG) | CC BY-SA 3.0, Pi.1415926535 | from the south-east on Judah: the east tower, the nave's east flank with its corbel table, the crossing drum and lantern |
| [Outbound train at Judah and Funston, March 2019.JPG](https://commons.wikimedia.org/wiki/File:Outbound_train_at_Judah_and_Funston,_March_2019.JPG) | CC BY-SA 3.0, Pi.1415926535 | down Judah from the west: the west tower over the street — what a rider sees first |
| [N Judah train at Funston Avenue, March 2001.jpg](https://commons.wikimedia.org/wiki/File:N_Judah_train_at_Funston_Avenue,_March_2001.jpg) | CC BY 2.0, David Wilson | from the west, 2001: the west side chapel's tiled hip and the narthex from the side (rejected as a main reference: hazy, half hidden) |

Rejected from the category: interiors (vestibule, altar, nave), and the Grand View Park panoramas in which the church
is a smudge.

## What it is, part by part

**Colour.** Salmon-pink stucco everywhere (`#d9b2a4` in OSM reads beige; the photographs are a warmer, pinker
`#e8b09c`–`#f0b8a4` in sun, `#d9a090` in shade). All trim — archivolts, colonettes, rims, corbel tables, string
courses — is white/cream cast stone. Roofs are red-brown clay tile (`#a3331e` is right). Finials and the tower
crosses are weathered copper green.

**The towers.** Two square campaniles, about 6 m square, standing 3.6 m proud of the front wall at the front corners
of the nave, their inner faces in line with the nave's clerestory walls. From the ground: a plain shaft with a slim
pair of round-arched slits at about a third of its height; a stage of **three round arches on colonettes** (a
triforium-like open arcade) at about 23–28 m; a row of two **quatrefoil** openings; a tall **belfry stage of three
round arches** on colonettes (36 m); a white corbel cornice; then a **red-tile pyramidal cap** (sides roughly as
long as they are tall) with a copper finial and cross reaching about 43 m. Shallow corner pilaster strips.

**The front between the towers** (16–17 m wide), bottom to top:

1. A broad flight of steps across the whole front, with iron handrails (the street rises east).
2. The **narthex**: a band about 9 m tall standing a little proud of the wall, with **three round-arched portals** —
   the centre one larger — in **white carved archivolts** of several orders, a **sculpted white frieze** of figures
   over each side portal and across the top, and engaged white colonettes with capitals between them.
3. Over the narthex a **red-tile pent roof** (a lean-to against the wall) with white corbels under its eave, rising
   into a **small gabled hood** over the centre.
4. The **rose window**: a white cast-stone wheel of twelve spokes in a wide moulded white rim, about 6 m across,
   centred around 15–16 m up.
5. Above it a **white arcaded gallery**: a blind arcade of slim colonettes under a flat entablature, with a statue
   niche under a little pediment at its centre.
6. The **gable**: the pink wall rises to the apex at about 29–30 m, with a white corbel table along both rakes and a
   cross on the apex.

**The side chapels** outside each tower: a flat-roofed pink block about 11 m tall and 5 m wide, its front one tall
round-arched window, a white corbel band at the top; the west one has a tiled hip in the 2001 photograph.

**The nave.** The clerestory walls run back from the towers at about 20 m to the eaves under a tile gable roof
(ridge ≈ 27 m); each bay has a tall round-arched window pair in white surrounds, and a **white corbel table** runs
under the eaves. The aisles have a round-arched window per bay under their own corbel band at about 11 m, and
**red-tile lean-to roofs** running up from that eave to under the clerestory windows (the Strawberry Hill and the
Judah-east photographs; the first draft said "flat-roofed", and so it was built — in the game the two flat pale
planes either side of the nave were the first wrong thing seen from the air, 2026-10-27).

**The transept and crossing.** Gabled transept arms (same eaves and ridge as the nave), each end a gable with a
small rose window and corbel table, a low porch under the west one. Over the crossing an **octagonal drum** about
15 m across rising some four metres clear of the ridges, a pair of round-arched windows in each face, under a
**shallow octagonal tiled pyramid** (rising about a third of its span) and a small **lantern** (an open colonetted
cupola a few metres across with its own little tile cap and a cross, about 39 m to the cross). Built taller and
steeper at first, the drum hid behind the transept roof and the lantern read as a third tower.

**The apse.** A **round apse** at the north end: an upper storey of nine tall **blind round arches** (pink panels,
white arch rims) under a corbel table and a **conical tile roof**, over a lower, wider ambulatory ring of
round-arched windows under a **tile lean-to ring** rising to the upper apse wall (not flat: a flat ring rendered as
a white disc). It rises out of the low two-storey parish wing (flat roof, rows of
rectangular windows) that fills the rest of the rear block.

## The three things that make it recognisable (check these on the screenshot)

1. Twin pink campaniles with white triple-arched belfries under red-tile pyramid caps.
2. A white wheel rose window in a wide rim, over a tiled hood and three white-archivolted portals.
3. Pink stucco body with white trim and red tile roofs — and at the back, the octagonal drum and round apse.

## Orientation

`"front": 176` (Judah's bearing) → Judah on local −z (a numeric front faces −z at the manifest bearing, as the
Chateau's does); the nave runs along +z behind it. `"front": "street"` was the first draft's choice and it put the
towers on FUNSTON: the baked frontage for this footprint is the avenue, not Judah, and the church stood turned
90° until seen in the game on 2026-10-27. The builder measures the raw ring's width at each depth, so the
transept's and rear block's asymmetry comes from OSM, not from the code.

## Colour in the engine

The engine's sun lifts a colour a long way: the first draft's stucco `[0.96, 0.72, 0.64]` rendered cream, not
pink, on every sunlit face, so the builder starts deeper, `[0.91, 0.60, 0.52]`, which reads as the photographs'
salmon in sun and a dusty rose in shade. Tile is the city's idiom `[0.60, 0.29, 0.20]` (Carmelite, Art Institute);
OSM's `#a3331e` and the draft's `[0.70, 0.32, 0.22]` were a saturated orange beside every neighbour's roof.

## Seen in the game (2026-10-27)

Looked at from the Judah pavement to the east (the Inbound-train photograph's angle), from across Judah at 20 m,
from the air to the south, and from the north at 24 m (the Strawberry Hill photograph's angle). The three things:

1. Twin pink campaniles, white triple-arched belfries, tile pyramids — **there**, the first thing seen down Judah.
2. The white wheel rose in its rim over the tiled hood and the three white portals on the steps — **there**.
3. Pink stucco, white trim, red tile, and from the north the octagonal drum, the lantern and the round arcaded
   apse over its ambulatory — **there**; the back reads as the Strawberry Hill photograph.

Cost: **19,954 triangles** (ceiling 25,000). Views: `views/san-francisco.json` "St. Anne of the Sunset — from
Judah at Funston", "— from the south, air", "— from the north, air".
