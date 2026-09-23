# stations: the two station entrances

Follow docs/sf-batches/BRIEF-RECIPE.md, and BRIEF.md where a building needs real geometry. Photographs are in
docs/shots/refs/civic/ — the filenames are the osm id with / replaced by -, plus a -2 for the second view.

Most of these have NO height in OSM at all (shown as unknown). Establish what the building is from a web
search and the photographs, and give  counted off the picture rather than a height.

| # | osm | name | height | style now | photos |
|---|---|---|---|---|---|
| 1 | way/184956226 | Union Square/Market Street Station | **unknown — count the floors** | ? | way-184956226.jpg way-184956226-2.jpg |
| 2 | way/160331904 | Powell Street Station | **unknown — count the floors** | ? | way-160331904.jpg way-160331904-2.jpg |

## Status (2026-09-22)

Both DONE, but **not** as footprint models. Both OSM ids are the stations' UNDERGROUND boxes
(`location=underground`, `layer=-1`, ~300 m long; `tools/bake.ts` drops them), so nothing can be raised from
those rings and the "count the floors" instruction does not apply — these are 5–6 m surface structures. Powell is a STANDALONE
entry (lat/lon + size + numeric `front`) on its `railway=subway_entrance` node; Union Square is fitted to
way/616479968, the surface head house OSM actually maps (building=train_station, building:levels=1).

| # | osm (list) | placed on | builder | tris | what it is |
|---|---|---|---|---|---|
| 1 | way/184956226 | **way/616479968** (the ABOVE-ground head house), front=180 | `unionSquareHeadhouse` | ~2.1k | granite pavilion, dark perforated awning over the mouth, glass lift bay in "Convergence" art glass, roof terrace behind an art-glass parapet, Muni worm |
| 2 | way/160331904 | node/5318198803 Market & Ellis (A2) | `powellStreetCanopy` | 1.3k | Perkins Eastman 2018 canopy: a flat champagne plane floating at 5 m on four slim columns, frameless glass screens round the escalator well, brick apron, POWELL pylon |

References used (the fetched civic/ street views are aimed at the neighbours, the OSM way being underground):
Commons "New canopy at Powell Street station, March 2019" and "North headhouse of Union Square Market Street
station, November 2022"; BART's Market Street canopy programme page; Wikipedia on the Central Subway station.

Night shots: docs/shots/models/stations-night/.
