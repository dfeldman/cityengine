# Place Vendôme: how the builder was measured

`src/render/landmarks/paris/place-vendome.ts` (outlines in `place-vendome-plan.ts`), entry "Place Vendôme" in public/landmarks/paris.json,
`madeBy` claude-sonnet-5-5. One builder dresses the square-facing wall of every hôtel round the square with Hardouin-Mansart's uniform
front and raises each building's OSM outline behind it. Drawn in plan metres east/north of the Colonne (the entry stands on it, like
gabriel-palaces.ts).

## Sources

1. **OSM**, read off tools/cache/osm/ile-de-france-latest.osm.pbf with osmium (a `-s smart` extract, so relations whose members stray out
   of the box, like the Hôtel d'Évreux, keep their rings). Rays from the column found the square to be an octagon turned 57° to the grid:
   in (u, v) (u along the Rue de la Paix) it is 139.3 × 124.5 m, corners cut by 21 m legs. `OCT` holds its eight corners; every edge within
   1.7 m of a side and facing the square is a front (`SNAP`). Streets (Rue de la Paix v −14…+8, Rue de Castiglione v −13…+9) fall out of the
   gaps in the fronts. Nineteen buildings, listed in the entry's `osm`.
2. **IGN LiDAR HD MNS** (tools/ign-mns.ts, radius 100 m at the column), profiles taken square to each side: wall head 18–20 m at the line,
   21–22 m 2 m back, 24–25 m from 4–6 m back, ridge plateau 24–26 m. So `EAVES` 18.5, brisis 3.6 m high over 1.85 m, terrasson to `TOP` 25 at
   `INSET` 5.6 m. The same profile runs round every building (thin wings take a shallower inset, per building).
3. **Commons photographs** (read at 960 px): "Exterior facade of the Hôtel de Bourvallais 004" (the pediment, oeil-de-boeuf dormers with
   scrolled surrounds, brick-capped stacks, slate colour) and "Paris (FR), Place Vendôme -- 2019 -- 2498" (the whole elevation: arcaded
   ground storey, giant pilasters through two floors, capitals under the entablature, window sizes, the range ending in a pavilion).

## What is drawn

| element | rule |
| --- | --- |
| bays | pitch `BAY` 3.7 m, whole bays per run; runs are the gaps-joined fronts of a side, one grid for the run whichever building owns it |
| ground storey | rusticated arcade (arches `ARCH_W` of the bay, `ARCH_H` 4.5 m, soffits and dark back panel), courses, string course at `G` 5.8 m |
| upper wall | pilasters through both floors with capital to `ENT0` 16.2 m; first-floor tall windows with iron balcony, second-floor shorter ones |
| entablature | architrave, frieze, modillion-less cornice 0.85 m deep to `EAVES` |
| avant-corps | 3 bays standing out 0.8 m, four engaged columns, projecting entablature, pediment (rise 2.1 m, arms medallion): middle of the two long sides and of each cut corner |
| roof | two-slope mansard, oeil-de-boeuf dormer in every bay, a stack every third bay on the ridge |
| backs | each OSM outline (courtyards kept) with plain windowed walls, party walls (edges lying back to back with another hôtel's) left open |

Fronts are snapped onto the octagon's lines (OSM wobbles up to 1.5 m), corners solved from the two lines, so the facade is continuous.

## Claims

The nineteen ids are claimed by the entry; tools/paris-civic.ts skips any way another manifest claims (verified: a run reproduces none of them).
The seven civic.json entries for Moufle, Delpech de Chaunot, Nocé, Ségur, Fontpertuis, Boullongne and Évreux were removed.
relation/571726 "Hôtel Arnaud" is at 48.8545 N 2.3660 E (the Marais), not on the square: left alone.

## What it replaces

The earlier overlay "Place Vendôme — the fronts" (`vendomeFronts`, bugs/vendome.ts, in bugs.json) is removed from bugs.json: it drew the same fronts over the
restyled OSM walls and would double this. Its builder file stays. The restyle region "Place Vendôme — facades" (paris.json) is untouched; the claimed ids
are replaced at runtime. `shadow: false`, as the overlay had, or a 150 m shadow blob falls on the square. `BIG.placeVendome` 30k in tests/landmarks.test.ts is new.

## Checks

- `tests/place-vendome.test.ts`: builds finite geometry (26k triangles, ceiling `BIG.placeVendome` 30k in landmarks.test.ts), claims exactly
  `VENDOME_REFS`, and no civic entry shadows them.
- Shots (`CITY=paris-centre sh tools/shoot-landmark.sh`, bearing = camera side): NW front -239.4 810.7 / 123; NE-SE cut corner -107.8 798.4 / 258;
  NE end -173 849.6 / 213; overview HEIGHT=110 PITCH=55 at the column. Compared against the 2019 panorama: same range-and-pavilion rhythm.

## Known flaws

- The entry is `stone: false` (smooth walls, like gabriel-palaces): the rustication is only drawn grooves; windows have no glazing bars.
- One roof height for everything (25 m): the taller back wings (Delpech 28.9 m in OSM) are cut to it.
- No modillions, no relief in the pediments beyond a disc, no shop signs, no flag on the Chancellerie.
- The back walls are generic (plain, 4 rows of windows).
