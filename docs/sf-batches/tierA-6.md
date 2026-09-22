# tierA-6: buildings to model one by one

Cut from the register (docs/sf-buildings.csv) by tools/sf-batches.ts: only buildings nobody has claimed, tallest
first. Each gets its own model or a facade style — see docs/sf-batches/BRIEF-RECIPE.md.

| # | kind | name | osm | height m | levels | lat, lon | note | status |
|---|---|---|---|---|---|---|---|---|
| 1 | civic | Montgomery Street Station | way/550652205 | 0 | 0 | 37.78947, -122.401316 | building=train_station | restyle chicago |
| 2 | civic | San Francisco Transition Structure | way/123559872 | 16 | 3 | 37.79582, -122.391787 | building=transportation roof=quadruple_saltbox | BAIL (see -hard.md) |
| 3 | civic | San Francisco Fire Station 13 | way/35266543 | 10 | 0 | 37.795561, -122.401358 | building=yes amenity=fire_station | restyle brick |
| 4 | civic | Larkin Street Youth Services | way/260155574 | 12 | 0 | 37.78226, -122.412996 | building=yes amenity=social_facility | restyle stucco |
| 5 | civic | Boys & Girls Club | way/114304294 | 10 | 3 | 37.779174, -122.422797 | building=yes amenity=social_facility | restyle stucco |
| 6 | civic | The Riley Center | way/260369760 | 10 | 0 | 37.776636, -122.41068 | building=yes amenity=social_facility | restyle stucco |
| 7 | civic | American Bookbinders Museum | way/173886707 | 9 | 0 | 37.78132, -122.402745 | building=yes | restyle brick |
| 8 | civic | City College of San Francisco Alemany Campus | way/172111621 | 15 | 0 | 37.783239, -122.420065 | building=yes amenity=college | restyle stucco |
| 9 | civic | Community Youth Center | way/256060074 | 10 | 0 | 37.78719, -122.419131 | building=yes amenity=community_centre | restyle stucco |
| 10 | civic | New Liberation Presbyterian Church | way/256765941 | 0 | 0 | 37.779976, -122.438564 | building=yes amenity=place_of_worship christian | restyle stucco |
| 11 | civic | Golden Gate Valley Branch Library | way/259078177 | 9 | 0 | 37.796799, -122.428949 | building=yes amenity=library | model: goldenGateValleyLibrary (edwardian-terracotta + colonnade) |
| 12 | civic | San Francisco Fire Station 8 | way/161502029 | 0 | 0 | 37.777256, -122.3967 | building=yes amenity=fire_station | restyle brick |
| 13 | civic | Haas-Lilienthal House | way/256993595 | 14 | 0 | 37.793292, -122.424952 | building=yes | model: haasLilienthalHouse (hand tower + turret) |
| 14 | civic | First Apostolic Faith Church | way/263349499 | 0 | 0 | 37.786468, -122.436505 | building=yes amenity=place_of_worship christian | restyle stucco |
| 15 | civic | 1051 3rd Street | way/579664204 | 7 | 2 | 37.776609, -122.389914 | building=transportation roof=pyramidal | model: thirdStreetSubstation (brick-loft + pyramid crown) |
| 16 | tall | (unnamed) | way/288645261 | 83 | 0 | 37.791286, -122.393816 | building=yes | model: unnamedEightyThreeMeterTower (midcentury-slab) |
| 17 | civic | Church of Christ | way/262586259 | 16 | 0 | 37.789679, -122.440431 | building=yes amenity=place_of_worship christian | restyle stucco |
| 18 | tall | Fontana East | way/32839432 | 55 | 18 | 37.805473, -122.424167 | building=residential | model: fontanaEast (hotel-punched) |
| 19 | civic | Swedenborgian Church of San Francisco | way/262577281 | 0 | 0 | 37.790415, -122.446227 | building=yes amenity=place_of_worship christian | BAIL (see -hard.md) |
| 20 | tall | Twelve Hundred California | way/1351029672 | 88 | 26 | 37.791716, -122.414645 | building=apartments | model: twelveHundredCalifornia (glass-tower) |
| 21 | civic | Historic Fire Station #30 | way/286098244 | 9 | 0 | 37.77229, -122.389395 | building=public | restyle brick |
| 22 | tall | Nob Hill Community Apartments | way/256749839 | 74 | 19 | 37.792882, -122.412151 | building=yes | model: nobHillCommunityApartments (hotel-punched) |
| 23 | tall | Blu Condos | way/112774488 | 82 | 21 | 37.784768, -122.396844 | building=residential | model: bluCondos (glass-tower) |
