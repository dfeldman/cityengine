# market-east: buildings to model one by one

Generated from docs/sf-targets.json (tools/sf-targets.ts): the unmodelled tall and civic buildings and the named parks and plazas within ~130 m of Market Street (or in the Union Square blocks), tallest first. `osm` is the manifest's id; the height is OSM's (or levels × 3.4). Parts (building:part) of a building are not listed: find them in OSM and add them to the entry's `osm` list if the model covers them.

| # | kind | name | osm | height m | levels | lat, lon | tags | status |
|---|---|---|---|---|---|---|---|---|
| 1 | tall | One Sansome Street | way/32963344 | 171 | 0 | 37.790471, -122.401236 | building=yes | **model** `oneSansomeTower` (3969 tris) |
| 2 | tall | One Front Street | way/148710877 | 171 | 0 | 37.791691, -122.398764 | building=office | **model** `oneFrontStreet` (11813 tris) |
| 3 | tall | First Market Tower | way/32946570 | 169 | 39 | 37.790398, -122.399276 | building=yes | **model** `firstMarketTower` (1558 tris) |
| 4 | tall | 50 California Street | way/32612484 | 159 | 37 | 37.794056, -122.397297 | building=commercial | **model** `california50` (1679 tris) |
| 5 | tall | 425 Market | way/32946526 | 156 | 38 | 37.791218, -122.398233 | building=office roof=flat | **model** `market425` (4750 tris) |
| 6 | tall | 45 Fremont Center | way/32946535 | 149 | 0 | 37.791247, -122.397253 | building=office | **model** `fremont45` (1863 tris) |
| 7 | tall | 333 Market | way/288505729 | 149 | 33 | 37.791938, -122.397406 | building=office | **model** `market333` (9700 tris) |
| 8 | tall | 100 Pine Center | way/944025918 | 145 | 32 | 37.792679, -122.398996 | building=yes | **model** `pine100` (5884 tris) |
| 9 | tall | One California Street Building | way/32612471 | 140 | 0 | 37.793215, -122.397177 | building=yes | **model** `oneCalifornia` (1424 tris) |
| 10 | tall | 388 Market Building | way/1279504526 | 118 | 24 | 37.79227, -122.398066 | building=yes | **model** `market388` (15506 tris) |
| 11 | tall | 555 Market Street | way/32946577 | 104 | 0 | 37.789978, -122.400009 | building=yes | **model** `market555` (2347 tris) |
| 12 | tall | Stevenson Place | way/149840694 | 103 | 0 | 37.789303, -122.399777 | building=yes | restyle `skyscraper` |
| 13 | tall | 225 Bush Street | way/942665601 | 100 | 22 | 37.79078, -122.401418 | building=yes | **model** `bush225` (5295 tris) |
| 14 | tall | Crown-Zellerbach Building | way/93817367 | 99 | 0 | 37.79091, -122.400091 | building=yes | **model** `crownZellerbach` (636 tris) |
| 15 | tall | (unnamed) | way/260298022 | 98 | 0 | 37.789418, -122.39942 | building=yes | restyle `skyscraper` |
| 16 | tall | 235 Pine Street | way/260282396 | 95 | 0 | 37.791905, -122.400296 | building=yes | **model** `pine235` (1192 tris) |
| 17 | tall | (unnamed) | way/148710880 | 84 | 0 | 37.792158, -122.39899 | building=yes | restyle `skyscraper` |
| 18 | tall | (unnamed) | way/148710883 | 84 | 0 | 37.792065, -122.399371 | building=yes | restyle `skyscraper` |
| 19 | tall | Pacific Gas and Electric Company General Office Building Annex | way/260291406 | 83 | 13 | 37.792107, -122.396527 | building=yes | **model** `pgeAnnex` (1280 tris) |
| 20 | tall | Matson Building | way/1279504249 | 83 | 16 | 37.792616, -122.396575 | building=office roof=flat | **model** `matsonBuilding` (3784 tris) |
| 21 | tall | Pacific Gas and Electric Company General Office Building | way/1279504251 | 83 | 17 | 37.792366, -122.396775 | building=yes | **model** `pgeBuilding` (2659 tris) |
| 22 | tall | Hyatt Regency San Francisco | way/28319370 | 83 | 20 | 37.794477, -122.395814 | building=hotel | **model** `hyattRegency` (8814 tris) |
| 23 | tall | 201 California Street | way/256067709 | 69 | 16 | 37.79295, -122.399008 | building=office | **model** `california201` (1054 tris) |
| 24 | tall | Federal Reserve Bank of San Francisco | way/32612362 | 66 | 0 | 37.792932, -122.395427 | building=government | **model** `federalReserve` (686 tris) |
| 25 | tall | 49 Stevenson Street | way/149837256 | 60 | 0 | 37.789763, -122.399385 | building=commercial | restyle `skyscraper` |
| 26 | tall | Southern Pacific Building | way/132238425 | 60 | 12 | 37.793788, -122.39484 | building=office roof=flat | **model** `southernPacificBuilding` (4694 tris) |
| 27 | tall | Adam Grant Building | way/260282389 | 58 | 14 | 37.79155, -122.400497 | building=yes | **model** `adamGrant` (3767 tris) |
| 28 | tall | 10;18;2;22 Battery Street | way/148710884 | 55 | 0 | 37.791618, -122.399373 | building=yes | **model** `postalTelegraphBuilding` (1578 tris) |
| 29 | tall | Flatiron Building | way/132125158 | 38 | 0 | 37.790063, -122.400793 | building=yes | **model** `flatiron544` (763 tris) |
| 30 | tall | 130 Bush Street | way/260282398 | 34 | 10 | 37.79156, -122.400216 | building=yes | **model** `heinemanBuilding` (189 tris) |
| 31 | civic | Embarcadero Station | way/773030142 | 0 | 0 | 37.792893, -122.396855 | building=train_station | — |
| 32 | park | 50 Beale Street Plaza | way/436484314 | 0 | 0 | 37.791603, -122.396954 |  | — |
| 33 | park | Embarcadero Plaza | way/27146063 | 0 | 0 | 37.795175, -122.395018 |  | — |

## Notes (worked 2026-09-22)

Stretch: Market Street from the Ferry Building (37.7955, −122.3937) to Kearny/Third (37.7879, −122.4035), both
sides, plus the batch list above. Every model was compared with photographs (Wikimedia Commons, and
artandarchitecture-sf.com for the Bush Plaza pavilion); the builders are in
`src/render/landmarks/sf/districts/market-east.ts`, the shots in `docs/shots/models/market-east/`.

Besides the table, the Market frontage got:

| what | osm | status |
|---|---|---|
| Southern Pacific Building (One Market) | way/132238425 | **model** `southernPacificBuilding` (4694 tris) |
| Hyatt Regency | way/28319370 + 20 parts | **model** `hyattRegency` (8814 tris) — placed at a point, see below |
| Federal Reserve Bank | way/32612362 + parts | **model** `federalReserve` (686 tris) |
| One California Street | way/32612471 | **model** `oneCalifornia` (1424 tris) |
| Matson Building | way/1279504249 + parts | **model** `matsonBuilding` (3784 tris) |
| PG&E General Office Building / Annex | way/1279504251, way/260291406 + parts | **model** `pgeBuilding`, `pgeAnnex` |
| 333 / 388 / 425 / 525 / 555 / 575 Market | — | **model**s, see the table |
| Crown Zellerbach (One Bush Plaza) | way/93817367 | **model** `crownZellerbach` (636 tris) |
| the Bush Plaza pavilion (SVB Experience Center) | way/93817360 | **model** `bushPlazaPavilion` (972 tris) |
| the glass kiosk in the 525 Market plaza | way/1313339504 | **model** `plazaKiosk` (14 tris) |
| Hobart Building, 44 Montgomery, 544 Market flatiron | — | **model**s, see the table |
| One Sansome tower and its banking hall | way/942665599, way/132125161 | **model**s `oneSansomeTower`, `oneSansomeHall` |
| the low blocks between Sansome and Montgomery, 32 Battery, the Stevenson Street backs, Citibank at Drumm | — | restyles (`chicago`, `brick`, `skyscraper`) |
| Oceanwide Center site part (way/1410934053, OSM says 160 m) | | restyle at 7 storeys: none of that tower was built |

Skipped, and why:

- **Embarcadero and Montgomery Street station** (way/773030142, way/550652205): the outlines are the underground
  station boxes, not buildings on the street. They want street furniture (entrance canopies), not a model.
- **Embarcadero Plaza and 50 Beale Street Plaza**: ground, planting and the Vaillancourt Fountain — a terrain and
  furniture job, not a landmark model.
- **way/941650783 / way/941650784** (the metal drum and the stair enclosure in the 525 Market plaza),
  **way/256969672** (a `building=roof` canopy) and **way/1358500530** (a kiosk): too small to read from the road.
- Everything west of Montgomery Street on Market (595 Market, 605/607, 33 New Montgomery, Bank of America,
  McKesson Plaza, the Palace Hotel, the de Young and Hearst buildings): market-mid's batch.
