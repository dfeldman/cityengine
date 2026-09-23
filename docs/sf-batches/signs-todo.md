# Large signs that want 3D lettering

Signs whose LETTERING is the landmark — the thing you recognise from a distance is the word itself, standing
proud of a frame with light and shadow on it. Those want real extruded letterforms from `tools/signgen`
(add a line to `tools/signgen/signs.json` and the bake builds it), not the 3×5 block font and not a texture
pasted on a plane.

The test: **would a photograph of it be recognisable with the letters removed?** If no, it belongs here.

Done:

- [x] **Ghirardelli**, Ghirardelli Square roof — mixed-case serif, bulbs along the letters, on an open steel
      lattice. The lattice is half the landmark and stays procedural (`ghirardelliSign`).

To do, roughly in the order a rider meets them:

- [ ] **Fisherman's Wharf** — the crab wheel sign at Jefferson & Taylor. Currently `wharfSign`, block letters.
      The crab and the wheel matter as much as the word; the lettering is a curved arc, which signgen cannot
      do yet (it sets a straight line).
- [ ] **The Warfield**, 982 Market — vertical blade, individually lit channel letters.
- [ ] **Orpheum Theatre**, 1192 Market — big vertical blade plus a marquee.
- [ ] **Golden Gate Theatre**, 1 Taylor — blade sign on the corner.
- [ ] **Castro Theatre**, 429 Castro — the neon blade, the single most photographed sign in the city after
      Ghirardelli. Outside the current box, but it will be in scope when the box reaches the Castro.
- [ ] **Alcazar Theatre**, 650 Geary — already modelled as a building (civic-1); its sign is not.
- [ ] **Great American Music Hall**, 859 O'Farrell — modelled as a building; the sign wants doing.
- [ ] **Hotel roof signs** on Nob Hill and around Union Square — the Mark Hopkins, the Sir Francis Drake's
      old sign, the Huntington. Roof-mounted capitals on a frame, visible along whole streets.
- [ ] **Bay Bridge / Embarcadero** — no lettering, but the same treatment applies to the clock faces on the
      Ferry Building, which are read from as far away and are currently flat.
- [ ] **Pier sheds** — the painted PIER 39 / PIER 45 numbers are flat and that is correct for them. Listed
      here only so nobody "upgrades" them: they are painted ON the shed, not standing off it.

Notes for whoever picks this up:

- `signgen` sets a straight line of text. A curved or arched word (the crab wheel, some marquees) needs an
  arc option — sample the text along a circle rather than a baseline.
- Neon is the bulb path with a smaller spacing, a tube instead of spheres, no letter extrusion, and the
  emission raised; see the README.
- Keep the FRAME in the builder. Signs differ far more in their frames than in their letters, and the frame is
  where the kit (`beam` for a truss, `boxAlong` for a box) already does the work.
