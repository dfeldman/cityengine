# tierA-3: buildings to model one by one

Cut from the register (docs/sf-buildings.csv) by tools/sf-batches.ts: only buildings nobody has claimed, tallest
first. Each gets its own model or a facade style — see docs/sf-batches/BRIEF-RECIPE.md.

| # | kind | name | osm | height m | levels | lat, lon | note |
|---|---|---|---|---|---|---|---|
| 1 | civic | Embarcadero Station | way/773030142 | 0 | 0 | 37.792893, -122.396855 | DONE — restyle brutalist |
| 2 | civic | Civic Center Station | way/775660875 | 0 | 0 | 37.779391, -122.414076 | DONE — restyle brutalist |
| 3 | civic | North Beach Branch Library | way/35065740 | 0 | 0 | 37.802643, -122.41316 | DONE — restyle bauhaus (2013 flatiron library, glazed corners) |
| 4 | civic | San Francisco Evangelical Free Church | way/262574418 | 11 | 0 | 37.800309, -122.411796 | DONE — restyle edwardian (no reference photo found) |
| 5 | civic | Esplanade Main Stage | way/580080200 | 0 | 0 | 37.784984, -122.40238 | BAIL-OUT — see tierA-3-hard.md |
| 6 | civic | 745 Buchanan Street | relation/20512971 | 0 | 0 | 37.776904, -122.428299 | BAIL-OUT — see tierA-3-hard.md |
| 7 | civic | San Francisco Fire Station 21 | way/261466912 | 9 | 0 | 37.775417, -122.440299 | DONE — restyle brick |
| 8 | civic | Marina Branch Library | way/288394771 | 4 | 0 | 37.801347, -122.43414 | DONE — restyle classical |
| 9 | civic | Redding Elementary School | way/85645142 | 14 | 0 | 37.789473, -122.419184 | DONE — restyle brick |
| 10 | civic | Tahanan | way/1028203748 | 0 | 0 | 37.775293, -122.40325 | DONE — restyle sfapartment |
| 11 | civic | Hall of Justice Service Station | way/256877086 | 4 | 0 | 37.773661, -122.406011 | DONE — restyle brutalist |
| 12 | civic | Saint Mary the Virgin Episcopal Church | way/261608748 | 8 | 0 | 37.79664, -122.437419 | DONE — model stMaryTheVirginEpiscopalChurch (brick-loft recipe + hip crown) |
| 13 | civic | Buddhist Church of San Francisco | way/308165312 | 12 | 0 | 37.788586, -122.426648 | DONE — model buddhistChurchOfSanFrancisco (tower spec + cupola stupa) |
| 14 | civic | Transit Police Bureau SFK Substation | way/218159535 | 4 | 0 | 37.771706, -122.400637 | DONE — restyle brutalist |
| 15 | civic | Golden Gate Community Church of the Nazarene | way/263379850 | 12 | 0 | 37.787273, -122.437251 | DONE — restyle classical (converted Masonic hall) |
| 16 | tall | InterContinental Mark Hopkins | way/1361492525 | 93 | 0 | 37.791566, -122.410387 | DONE — model intercontinentalMarkHopkins (edwardian-terracotta + mansard) |
| 17 | tall | 100 California Street | way/32612487 | 59 | 12 | 37.793955, -122.398141 | DONE — model oneHundredCalifornia (midcentury-slab) |
| 18 | tall | 233;241 Sansome Street | way/256067714 | 53 | 0 | 37.792618, -122.401317 | DONE — model twoThirtyThreeSansome (midcentury-slab) |
| 19 | tall | Stock Exchange Tower | way/256066241 | 55 | 11 | 37.791662, -122.401249 | DONE — model stockExchangeTower (deco-setback) |
| 20 | tall | 1310 Mission Street | way/256733612 | 55 | 0 | 37.77621, -122.41521 | DONE — model thirteenTenMission (glass-tower) |
| 21 | tall | 417 Montgomery Street | way/151183782 | 41 | 0 | 37.793424, -122.403325 | DONE — model fourSeventeenMontgomery (edwardian-terracotta) |
| 22 | tall | Royal Insurance Building | way/256067738 | 41 | 0 | 37.79228, -122.401261 | DONE — model royalInsuranceBuilding (edwardian-terracotta) |
| 23 | tall | Hotel Spero | way/71504456 | 55 | 0 | 37.786161, -122.411663 | DONE — model hotelSpero (edwardian-terracotta) |
