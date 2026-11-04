# The Opéra Bastille — how the builder was measured

`src/render/landmarks/paris/museums/opera-bastille.ts`, entry "Opéra Bastille" in public/landmarks/paris.json (OSM way/78149064,
front 300). Replaces the restyle of OSM's parts ("opera"/"operaGlass") and the standalone arch of opera-arch.ts (PARIS_BUGS.md #20;
owner, 2026-11-03, with a photograph from the Place: "our version doesn't look much like the real thing").

## Sources, in the order they were trusted

1. **IGN LiDAR HD surface model (MNS)** on the geopf WMS-R, two 600 px tiles over 48.8494–48.8542 N, 2.3680–2.3728 E (0.56 m),
   less the bare-earth MNT's median (36.5 m NGF; the Place stands ~1 m above it, so the builder's heights are the lidar's less 1).
   `refs/opera-bastille/lidar-grid.txt` is the 4 m grid over the front; `lidar-relief.png` the hillshade with 2 m contours (red every
   10 m) and a 10 m grid east/north of the OSM centroid, the outline in yellow.
2. **IGN HR orthophoto** with the ring and grid drawn on it: `refs/opera-bastille/ign-ortho-ring.png`.
3. **OSM's outline** (217 nodes, fetched from Overpass; the local caches have no nodes for it) for the plan: the front is a circular arc
   of radius 41.1 m centred at (−16.2 E, 62.1 N), from 269° round to 37° (residual 0.1 m over its 16 west-arc vertices), carried on
   south as the straight Rue de Lyon edge (bearing 164°, 109 m). The parts' heights agree with the lidar to a few metres.
4. The owner's photograph from the Place (2026-11-03): the colonnade's square pillars and recessed glazing, the panel grid, the glass
   band's mullions, the entrance lobby's two tall pillars right of the arch, the arch's dark frame and screen, the glass boxes above.

All geometry is in metres east/north of the outline's centroid (48.851812 N, 2.370529 E) and metres above the Place.
`registerRing` (museums/enframe.ts) puts that onto `fit.ring` by the area moments of the two convex hulls — the bake superseded the
outline by its 87 parts, so the loader hands the builder their hull (25 vertices), never the outline itself.

## What the lidar said (and the builder does)

| part | measured | built |
| --- | --- | --- |
| drum rim | 32 m band 7–8 m wide along the arc and 20 m down the Rue de Lyon tail (E −52, N 40–96) | `OUTER`/`INNER` band 9–31 m; colonnade 0–9 m with pillars every 6.5 m and the glazing 2.5 m back; panels 9–19 m, glass 19–31 m at 1.6 m |
| crown | 38–39 m plateau inside the rim (E −44…0, N 20…92), the roof garden on it | `CROWN_RING` 30.5–37.5 m, set back 8.5 m from the arc |
| glass boxes | 35 m over E −44…−26, N 84…99 | three boxes 31–34.5 m, mullioned |
| fly tower | 48–49 m over E −24…+20, N 20…62; 45/41/40 m steps down its west side; 41–45 m north of its foot | tower to 47 m (an L, E +8 at N 50–62); steps 44.5/41.5/39.5 m; the 41 m block |
| north-east terraces | 28/25/21/17–18 m in bands ~4.5 m wide along the edge from 356° on the arc to (30.8, 63.6) | four `band`s at 29/25/21/17 m, offsets 0–18 m |
| west terraces | 25/29/33/37 m stepping in from the Rue de Lyon edge, N 36…−28 | four bands at offsets 0–7–10–14–21 m |
| arch | 19 m at E −44…−34, N 102…112, standing 7 m proud of the arc at bearing 331°; the MNT rises 1 → 4 m over the stair | frame 20 × 19 m, 2.2 m deep, on a 3.4 m platform; 17 risers over 13.6 m; dark glazed hall back to the drum |
| halls behind | 37–39 m (E +12…+48, N −8…+36), 42 m (E 0…+28, N −32…−68), 36 m (E −19…+20, N −29…−91), 27–33 m round them, 22/19 m along the Rue de Charenton, the 29 m annex to N −178 | eleven plain prisms from OSM's part rings |

## Checks

- `tools/model-shots.ts --entry="Opéra Bastille" --city=paris-centre --view=nw:-2.5,1.2,300,0,20,0` → `refs/opera-bastille/model-nw.png`
  (the showcase frame: north at −x, east at +z; alpha π looks at the arch).
- In the city: `CITY=paris-centre HEIGHT=30 PITCH=10 sh tools/shoot-landmark.sh 2819 -890 300 1 0 …` → `model-city-place.png` (the owner's
  photograph's station, more or less; `before-place.png` is the restyle it replaced); `HEIGHT=140 PITCH=50` → `model-city-air.png`;
  `HEIGHT=18 PITCH=8 … 2760 -880 290` → `model-city-west.png`.
- 8,231 triangles; tools/paris-claims.ts --dry finds nothing unclaimed inside the outline.

## Colours (owner, 2026-11-03: "colors seem off")

The city's sun more than doubles a sunlit face's colour, so the first pass's pale cladding (0.86) and sky-blue glass came out as a
pure white wall under a bright cyan band. Read off `model-city-place.png` at the photograph's station: the front panels are now 0.40
(they read ~205, the photograph's light grey), the rest of the cladding 0.60 (the faces turned from the sun), the glass a grey-blue
0.25/0.29/0.34 (~140–180), the granite 0.36/0.38/0.41 (~55–70). Check the pixels again after any lighting change.

## Known gaps

- The crown and the fly tower, in shade from the Place, read darker than the photograph's sunlit white.

- The cladding is flat colour with a 1.6 m cell mottle; the real panel joints and the glass band's mullions are thinner than the
  city's sun shows.
- The rear halls are boxes from the lidar's plateaus, without their own terraces and plant.
- The Place in front is the city's paving; the stair's side walls are the only landscape drawn.
