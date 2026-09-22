# tierA-5: buildings to model one by one

Cut from the register (docs/sf-buildings.csv) by tools/sf-batches.ts: only buildings nobody has claimed, tallest
first. Each gets its own model or a facade style — see docs/sf-batches/BRIEF-RECIPE.md.

| # | kind | name | osm | height m | levels | lat, lon | note | status |
|---|---|---|---|---|---|---|---|---|
| 1 | civic | SFJAZZ Center | way/256720482 | 13 | 3 | 37.776416, -122.42153 | building=yes amenity=arts_centre | done: model (sfjazzCenter, midcentury-slab) |
| 2 | civic | Kong Chow Temple | way/260523829 | 16 | 0 | 37.793911, -122.408058 | building=yes amenity=place_of_worship taoist | done: restyle chinatown |
| 3 | civic | Union Square/Market Street Station | way/184956226 | 0 | 0 | 37.786487, -122.406555 | building=train_station | bailed: see tierA-5-hard.md |
| 4 | civic | Quaker Meeting House | way/35174746 | 8 | 0 | 37.77676, -122.414981 | building=yes amenity=place_of_worship christian | done: restyle brick |
| 5 | civic | Canon Barcus Community House | way/260466858 | 0 | 0 | 37.777095, -122.411796 | building=yes amenity=social_facility | done: restyle stucco |
| 6 | civic | New Antioch Baptist Church | way/263824672 | 9 | 0 | 37.773781, -122.438445 | building=yes amenity=place_of_worship christian | done: restyle victorian |
| 7 | civic | 230 Kissling Street | way/260496648 | 9 | 0 | 37.773318, -122.413893 | building=church | done: restyle brick |
| 8 | civic | San Francisco Day School | relation/3828921 | 0 | 0 | 37.77805, -122.44636 | building=yes amenity=school | done: restyle stucco |
| 9 | civic | San Francisco Fire Station 3 | way/260026187 | 13 | 0 | 37.786614, -122.419304 | building=yes amenity=fire_station | done: model (fireStation3) |
| 10 | civic | San Francisco Fire Station 16 | way/161504253 | 8 | 0 | 37.79856, -122.436716 | building=yes amenity=fire_station | done: model (fireStation16) |
| 11 | civic | Korean Center | way/257965700 | 15 | 0 | 37.786476, -122.42467 | building=yes amenity=community_centre | done: restyle brick |
| 12 | civic | Brannan Street Station | way/160892688 | 5 | 0 | 37.779133, -122.396015 | building=yes amenity=post_office | done: restyle brick |
| 13 | tall | UC Law San Francisco McAllister Tower | way/256042681 | 114 | 0 | 37.781192, -122.414078 | building=university | done: model (mcallisterTower, deco-setback) |
| 14 | civic | San Francisco Fire Department Pioneer Museum | way/36950438 | 0 | 0 | 37.785774, -122.446825 | building=yes | done: restyle victorian |
| 15 | civic | Music and Art Institute | way/262096301 | 12 | 0 | 37.792157, -122.438871 | building=yes amenity=school | done: restyle edwardian |
| 16 | civic | 2725 California Street | way/263385458 | 11 | 0 | 37.787693, -122.439505 | building=school amenity=school | done: restyle edwardian |
| 17 | tall | Phillip Burton Federal Building & United States Courthouse | way/35176305 | 95 | 21 | 37.781903, -122.418188 | building=office amenity=courthouse roof=flat | done: model (phillipBurtonFederal, concrete-piers) |
| 18 | tall | (unnamed) | way/944025916 | 61 | 13 | 37.792953, -122.399569 | building=yes | done: model (embarcaderoResidential, glass-tower) |
| 19 | tall | Edith Witt Senior Community | way/243571751 | 55 | 0 | 37.776446, -122.415427 | building=yes | done: model (edithWittSenior, hotel-punched) |
| 20 | tall | Mills Building | relation/3492808 | 47 | 10 | 37.791383, -122.401836 | building=yes | done: model (millsBuilding, edwardian-terracotta) |
| 21 | tall | 108;110 Sutter Street | way/151195282 | 39 | 0 | 37.790256, -122.40279 | building=yes | done: model (oneOhEightSutter, chicago-block) |
| 22 | tall | 552 Montgomery Street | way/256068381 | 35 | 0 | 37.794543, -122.402925 | building=yes | done: model (bankOfItaly, edwardian-terracotta) |
| 23 | tall | 330;332 Pine Street | way/260283288 | 38 | 0 | 37.792331, -122.401507 | building=yes | done: model (orientBuilding, edwardian-terracotta) |
