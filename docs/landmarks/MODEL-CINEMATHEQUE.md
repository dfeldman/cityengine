# The Cinémathèque française — how the builder was measured

`src/render/landmarks/paris/rivegauche/cinematheque.ts`, entry "Cinémathèque française" in public/landmarks/paris/rivegauche.json
(OSM way/78271385). Frank Gehry's American Center of 1994, 51 rue de Bercy, on the north corner of the Parc de Bercy. Second
pass, 2026-11-03: the owner's photograph from the park ("most of the boxy protrusions are curved, not square", "we don't have
the glass lobby") replaced the first pass's square tumbled blocks and its dark glazed plinth.

## Sources, in the order they were trusted

1. **IGN LiDAR HD surface model (MNS)** on the geopf WMS-R, over 48.8363–48.8377 N, 2.3814–2.3840 E at 600 px (0.32 m), less
   the bare-earth MNT's median (32.9 m NGF): every height below is metres above the park. `refs/cinematheque/lidar-grid.txt`
   is the 2 m grid; `lidar-bands.png` the height classes with the builder's plan ring in cyan (the picture the massing was
   traced from); `lidar-relief.png` the hillshade with 2 m contours. `tools/ign-mns.ts` now makes all three for any landmark.
2. **IGN HR orthophoto** (0.2 m) with the ring and a 10 m grid: `refs/cinematheque/ign-ortho-ring.png`.
3. The photographs: the owner's from the park (the west front, 2026-11-03); Commons "Gehrys American Center 2011" (the same
   front through the trees), "Cinémathèque française de nuit en janvier 2020" (the lobby close up: the panes, the glass
   canopy at door height, the lettering), "Rue Jean Renoir Paris 12" (the lane on the south-east: a plain stone wall, the
   set-back block over it, the trellised apartment block across the lane), "Rue Paul Belmondo Paris XII" (the promenade on
   the south-west: stone with tall glazed slots). These fixed what the lidar cannot see: which forms are curved, the lean,
   the lobby, the skirt's sweep.

The builder's frame is OSM's box: x east, z north, metres from the box's centre (48.837002 N, 2.382646 E), which is also the
lidar grid's origin, so a number read off the grid goes straight into the code. The camera in the owner's photograph is in
the park WEST of the building looking east: left is north (the curved tower), right is south (the wing, then the trellised
block beyond the lane's end).

## What the lidar said (and the builder does)

| part | measured | built |
| --- | --- | --- |
| the block on the Rue de Bercy | 28–29 m along the whole north-east edge, wrapping south to the park corner at (−19, −26); a court in its west side, 11–13 m, at e −10…−2, n −4…16, with a 22 m piece at e −6…0, n 4…8 | `MAIN` prism 28.5 m; the court's roof the `FOYER` cap at 10 m; a 22 m prism in it |
| the lane strip | 18 m, ~6 m wide along the whole south-east edge, wrapping the south corner (16–18 m over e −16…−4 at n −30); a 24–25 m step at e −6…−2, n −24…−20 | `STRIP`, 18 m, drawn as outer walls and a lid so it does not fight the block's wall |
| the tower | 32 m over an 8×6 m patch at e −20…−12, n −6…−12, 29–31 round it: a ~10×12 m tower with a sloping top, highest at the west; its foot 5–7 m inside the ring's west edge | base (−21…−11, −14…−2), top leaning 1.3 m west, corners 32.4 / 28.6 / 29.6 / 33.4 |
| the curved tower | 22–27 m over e −27…−8, n 7…24, 25–27 on its south part, 22–23 north; its west face on the ring edge (−26.5 at n 14) | a D in plan, bow r 11.5 about (−15, 14) from 143° to 217°, back at x −12; leaning 1.2 m out; top 25.5 at n 14 sloping 0.21 per metre, 27 at the south end, 24 at the north |
| the entrance petal | 12–16 m at e −26…−18, n −8…1, in front (west) of the tower | a lens in plan: 11 m wide at its foot in the skirt (7 m), 14.5 m at the crest (16–17.6 m), the bow 1 m out past the glass by mid-height |
| the shoulder block | 19–23 m in a 3–4 m band at e −22…−18, n −27…−15, in front of the 28 m wing | a bow r 13 about (−9, −20.5), back at x −18.3, leaning 1 m out, top 23 by the tower sloping to 19.5 at the south |
| the eave | 5–9 m in a band outside the ring's west edge from n −21 to n +10; the skirt climbs from 5 at e −28 to 12 at e −18 on the north half (n 4), gentler at the south | `E` (eave, 7.2 m) 1.6 m outside the glass `G`; the zinc sweeps to `I` at 10–14 m, highest at the north |
| the lobby | nothing above 1.5 m outside the eave: the glass is at the ring line | `G`: panes every 1.6 m in dark mullions 0.15–6.5 m, a transom at 3.3, three pairs of doors, the canopy at 3.6 m 2.2 m out, LA CINÉMATHÈQUE FRANÇAISE on the glass at 5.1 m |

What the photographs decided: the curved tower's five rows of three square windows on the bow and one column of slots on its
south face; the tower's tall glazed slit by its south-west corner; the strict 3.3 m grid of seven rows on the street face and
six on the north-west end; the lane's few square windows and the set-back block's two rows; the promenade's tall glazed slots;
the wing's slot south of the tower.

## Checks

- `tools/model-shots.ts --entry="Cinémathèque française" --city=paris-centre --view=…`: the showcase's frame puts WEST at
  alpha π: `refs/cinematheque/model-front.png` (3.14), `model-sw.png` (−2.6, the owner's station), `model-street.png`
  (2.0, the Rue de Bercy corner), `model-top.png` (beta 0.2: compare with ign-ortho-ring.png).
- In the city: `CITY=paris-centre HEIGHT=5 PITCH=6 sh tools/shoot-landmark.sh 3709 -2616 275 1 0 …` → `model-city-west.png`
  (the lobby from the park); `HEIGHT=40 PITCH=28 … 255 1 0` → `model-city-air.png`. In the city a low flat-roofed pavilion
  (not this builder's) stands in front of the lobby and hides its lower half from the park; it is not in the photographs.
- 898 triangles; `tests/landmarks.test.ts`.
