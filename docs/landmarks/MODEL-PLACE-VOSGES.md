# Place des Vosges: how the builder was measured

`src/render/landmarks/paris/place-vosges.ts` (outlines and fronts in `place-vosges-plan.ts`), entry "Place des Vosges — the 36 pavilions" in
public/landmarks/paris.json (`procedural: placeVosges`, `madeBy` claude-sonnet-5-5), test `tests/place-vosges.test.ts`. One builder draws the
36 houses of Henri IV's square (nine a side) as one design and raises each claimed OSM outline behind them as plain walls. Plan metres east/north
of the garden's centre (48.8556179 N, 2.3655421 E), like the Vendôme entry.

## Sources

1. **OSM**, read off tools/cache/osm/ile-de-france-latest.osm.pbf with osmium (`extract -s smart`). The square is 140 m between its garden-facing
   fronts, turned 13.8° to the grid. OSM maps each arcade as a `building:part` strip (min_level 1) 5 m deep over an open gallery, while the
   building outlines start at the garden-side edge of the strip: the fronts are the strips' inner edges, fitted per side and crossed for the corners
   (141.1 / 140.2 / 140.0 / 141.9 m). Strip widths show nine houses to a side (south 15.7 m, west 14.5 m, east 14.7 m, north 15.6 m); the Roi and the
   Reine are the middle house (passages at 70.9 m and 70.1 m along, from the Rue de Birague and Rue de Béarn ways). The two north corners are
   streets (the west and east fronts stop 9.7 m short of them): the model leaves them open.
2. **IGN LiDAR HD MNS** (tools/ign-mns.ts, radius 100 m): ridges stand 24–25 m over the pavement, the Pavillon du Roi 25–26 m. The eaves, 14.6 m,
   are not from the lidar (I could not register its grid to the square in time): they follow the restyle region's old figure (14 m) and the photographs'
   ratio of wall to roof, so the roof is 10 m high on a 13.2 m depth: the "very steep" slope (about 54°).
3. **Commons photographs** ("Place des Vosges 2013": the Pavillon du Roi from the garden, houses either side; "Immeuble sur la Place des Vosges":
   one elevation): arches a window bay wide, tall first-floor windows over a balustrade with alternating triangular and flat hoods, shorter second-floor
   windows with a keystone, stone string courses and quoins at the house ends, a stone cornice, slate roofs with a row of pedimented dormers over the
   cornice and a smaller row above, tall stacks at the party walls; the Roi: five bays (the houses four), a great arch between two small doors, taller,
   hipped.

## What is drawn

| element | rule |
| --- | --- |
| arcade | `ARC_D` 4.8 m deep gallery, arches `ARCH_FRAC` of the bay to `ARCH_H` 4.35 m, soffits, dark back panel, courses on the piers, string course at `G` 5.3 m |
| upper wall | brick (per-house tone), first floor 6.4–9.4 m with balustrade and hood, second 10.9–13.3 m, string between at 10.2 m, quoins `QUOIN` up both ends, frieze and cornice to `EAVES` 14.6 m |
| roof | gabled per house, ridge `RIDGE` 24.6 m, overhang `OVER`; coping beams on each party wall; a stack on the ridge at each party wall |
| dormers | a pedimented one per bay, a round-headed smaller row above on alternate bays |
| Pavillon du Roi / de la Reine | `PAV_EAVES` 16.3, `PAV_RIDGE` 26.4, five bays, hipped roof, great arch (3.8 m) + two doors, three stacks |
| backs | every claimed outline (courtyards kept) to `BACK_H`, plain brick with four rows of windows, slate cap; its edges on a front are the facade's |

## Claims

59 refs (26 building outlines and 33 `building:part`s): the 22 hôtels named on the square (Montbrun, Montmorin, Regnouart, Coulanges, Pierrard, Chaulnes,
de la Salle, Dyel des Hameaux, Chabannes, Marchand, d'Asfeldt, Châtillon, Lafont, Clermont-Tonnerre, d'Angennes de Rambouillet, Laffemas, Richelieu,
l'Escalopier, Vitry, Tresmes, Fourcy, Ribault) plus the Pavillon du Roi, the Hôtel d'Espinoy et Pavillon de la Reine, Genou de Guiberville and
two unnamed outlines, and every arcade strip. The 22 civic.json `parisCivic` hotel entries for the named ones were removed by hand. Left alone: the Hôtel de
Sully (own court model, touches the square at one corner). Claimed afterwards: no. 6, Hôtel Arnaud ou de Rohan-Guéménée (relation/571726, the Maison de Victor Hugo, between Regnouart and Fourcy; first mis-filed as "on the Rue de Birague, not the square"): a plain back at the lidar wall head `h` 13.6 m; its civic.json entry removed by hand.

## What it replaces

The old look was the "Place des Vosges" restyle region (generic OSM buildings re-dressed in the `vosges` style by `restyles`): its buildings are replaced at
runtime by this entry's claims. The region stays for whatever it still catches (unclaimed back buildings within 16 m). No overlay in bugs.json drew these fronts.
`shadow: false`, as for Vendôme. `BIG.placeVosges` 34k in tests/landmarks.test.ts (31k triangles).

## Checks

Shots (`CITY=paris-centre sh tools/shoot-landmark.sh`, bearing = camera side, `HEIGHT=14`): south front/Roi `2438.7 -611.6 13.8 3 1`
(refs/place-vosges/south-roi-medres.png), east front `2524.5 -560.3 283.8 1.6 1` (east-medres.png), NE street gap `2541.4 -491.6 238.5 2.2 1`,
top-down `HEIGHT=150 PITCH=88` at `2456.2 -543.5`. Compared with the 2013 Commons view: same rhythm of arcade, brick storeys, steep roofs and a taller
hipped Roi.

## Known flaws

- Flat colours, no brick texture; the arcade piers read dark grey in shadow.
- The Roi and Reine are not projecting avant-corps and have no sculpted medallion; the pediments are plain triangles.
- Eaves heights are photo-derived, not lidar-measured; one height for all 34 ordinary houses.
- The generic passage vault (`passages.ts`) draws its own portal inside the great arch, a little smaller.
- The hôtels' courtyards and rear wings are plain walls with a flat slate cap.
- Corner houses meet at a point; their wrap-around is not modelled.
