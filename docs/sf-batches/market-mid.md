# market-mid: buildings to model one by one

Generated from docs/sf-targets.json (tools/sf-targets.ts): the unmodelled tall and civic buildings and the named parks and plazas within ~130 m of Market Street (or in the Union Square blocks), tallest first. `osm` is the manifest's id; the height is OSM's (or levels × 3.4). Parts (building:part) of a building are not listed: find them in OSM and add them to the entry's `osm` list if the model covers them.

| # | kind | name | osm | height m | levels | lat, lon | tags | status |
|---|---|---|---|---|---|---|---|---|
| 1 | tall | Chevron Tower | way/32963382 | 175 | 40 | 37.789605, -122.400457 | building=yes | market-east's (same block, modelled there) |
| 2 | tall | 44 Montgomery Street | way/32963370 | 172 | 43 | 37.789681, -122.401838 | building=office | market-east's (same block, modelled there) |
| 3 | tall | McKesson Plaza | way/32946671 | 161 | 38 | 37.788792, -122.402683 | building=office | **model** `onePostStreet` |
| 4 | tall | One Montgomery Tower | way/148716020 | 152 | 38 | 37.789201, -122.403399 | building=office | **model** `oneMontgomeryTower` |
| 5 | tall | 595 Market Street | way/941649701 | 125 | 28 | 37.789233, -122.400796 | building=yes | **model** `fiveNinetyFiveMarket` |
| 6 | tall | Hyatt Regency San Francisco Downtown SOMA | way/118480404 | 122 | 36 | 37.786594, -122.403145 | building=hotel | **model** `hyattSomaTower` |
| 7 | tall | 100 Montgomery | way/132125166 | 108 | 25 | 37.790381, -122.401791 | building=yes | **model** `hundredMontgomery` |
| 8 | tall | 55 2nd Street | way/79377189 | 100 | 26 | 37.788827, -122.40037 | building=yes | **model** `fiftyFiveSecond` |
| 9 | tall | (unnamed) | relation/3492880 | 97 | 0 | 37.788735, -122.403405 | building=office | **model** `eightyEightKearny` |
| 10 | tall | Hunter-Dulin Building | way/942664247 | 94 | 0 | 37.789669, -122.402487 | building=yes | **model** `hunterDulinBuilding` |
| 11 | tall | Central Tower | way/132127810 | 91 | 21 | 37.787141, -122.403585 | building=yes | **model** `centralTower` |
| 12 | tall | 799 Market Street | way/112928951 | 87 | 0 | 37.785719, -122.405452 | building=yes | restyle `bauhaus` |
| 13 | tall | Hobart Building | way/32946628 | 86 | 21 | 37.789547, -122.401644 | building=yes | market-east's (same block, modelled there) |
| 14 | tall | Pacific Place Tower | way/256029755 | 83 | 16 | 37.785017, -122.405598 | building=yes | restyle `skyscraper` |
| 15 | tall | 33 New Montgomery | way/79377223 | 80 | 20 | 37.788692, -122.401474 | building=yes | restyle `skyscraper` |
| 16 | tall | DeYoung Building | way/32946675 | 66 | 0 | 37.788319, -122.403203 | building=yes | **model** `deYoungBuilding` |
| 17 | tall | 605 Market Street | way/79377175 | 54 | 0 | 37.788914, -122.40128 | building=yes | restyle `chicago` |
| 18 | tall | 607 Market Street | way/148285587 | 54 | 0 | 37.788897, -122.401436 | building=yes | restyle `chicago` |
| 19 | tall | James Bong Building | way/256029751 | 54 | 12 | 37.784896, -122.406125 | building=yes | restyle `chicago` |
| 20 | tall | Pacific Building | way/256029754 | 54 | 10 | 37.785191, -122.405786 | building=yes | **model** `pacificBuilding` |
| 21 | tall | Hearst Building | way/132127809 | 49 | 0 | 37.787444, -122.403008 | building=yes | **model** `hearstBuilding` |
| 22 | tall | Flood Building | relation/1547963 | 49 | 12 | 37.784932, -122.407472 | building=yes | **model** `floodBuilding` |
| 23 | tall | Bank of America Building | way/941649434 | 48 | 14 | 37.788676, -122.401692 | building=yes | restyle `chicago` |
| 24 | tall | 1 Kearny Street | way/149335979 | 47 | 0 | 37.787696, -122.403994 | building=yes | restyle `skyscraper` |
| 25 | tall | 700 Market Street | way/149335987 | 47 | 0 | 37.78774, -122.403795 | building=yes | **model** `mutualSavingsBank` |
| 26 | tall | (unnamed) | way/151183777 | 47 | 0 | 37.787786, -122.403654 | building=yes | restyle `bauhaus` |
| 27 | tall | First National Bank of Northern California | way/32946665 | 43 | 0 | 37.788754, -122.403078 | building=yes amenity=bank | restyle `classical` |
| 28 | tall | Palace Hotel | relation/3492933 | 37 | 7 | 37.78801, -122.402111 | building=yes | **model** `palaceHotel` |
| 29 | tall | (unnamed) | relation/2013691 | 36 | 0 | 37.78764, -122.402808 | building=yes | **model** `monadnockBuilding` |
| 30 | civic | Contemporary Jewish Museum | way/118106934 | 14 | 0 | 37.785921, -122.403761 | building=museum | **model** `contemporaryJewishMuseum` |
| 31 | civic | Montgomery Street Station | way/550652205 | 0 | 0 | 37.78947, -122.401316 | building=train_station | not modelled |
| 32 | civic | Powell Street Station | way/160331904 | 0 | 0 | 37.785138, -122.406637 | building=train_station | not modelled |
| 33 | civic | Muni Metro Platform | way/512981834 | 0 | 0 | 37.789394, -122.401297 |  | not modelled |
| 34 | civic | BART Platform | way/512981835 | 0 | 0 | 37.789394, -122.401297 |  | not modelled |

## The Market Street frontage, Second to Sixth (tools/street-buildings.ts), and Powell's first block

Every building fronting the stretch got a decision: its own model where it is tall, civic, historic or odd in
shape, a pregenerated facade style where it is an ordinary block of one of the city's types. The models are in
`src/render/landmarks/sf/districts/market-mid.ts`, the entries in
`public/landmarks/san-francisco/market-mid.json`, the shots in `docs/shots/models/market-mid/`.

Modelled beyond the table above:

| building | osm | builder | why |
|---|---|---|---|
| Phelan Building | relation/1547962 | `phelanBuilding` | the worked example (terracotta flatiron) |
| Humboldt Bank Building | way/332384276 | `humboldtBankBuilding` | the domed tower; OSM has no height and 8 levels — 58 m to the cornice, ~74 m to the dome |
| One Montgomery Street | way/132125162 | `oneMontgomeryStreet` | the Crocker / Wells Fargo rotunda, portico and roof pergola |
| Westfield Centre (Emporium) | way/332627424 + way/435591306 (dome part) | `emporiumWestfield` | the Emporium facade and the dome |
| Four Seasons tower / podium | way/435591307 / way/149332498 | `fourSeasonsTower` / `fourSeasonsPodium` | the tower is a `building:part` |
| Lotta's Fountain | — (lat/lon) | `lottasFountain` | the bronze column at Market, Geary, Kearny and Third |
| Powell Street turntable | — (lat/lon) | `powellTurntable` | the cable-car turnaround at Market and Powell |

Restyled (ordinary blocks): 650 Market, 711–735 Market, 716–720 Market, 2–8 Kearny, the Union
Trust bank at Grant, 742–748 Market, 800–830 Market, 901–993 Market, 934–944 Market, 945 Market, 960 Market
(Serif), 1 Sixth Street, and on Powell: 1 Powell, the Axiom Hotel, 39, 45–49 and 69 Powell. Styles used:
`chicago` for the pre-war commercial blocks, `brick` for the low retail fronts, `classical` for the two banking
halls, `edwardian` for the Powell hotels, `bauhaus`/`skyscraper` for the post-war ones.

Restyled although over ten storeys, because no reference photograph could be found on Commons (they are plain
pre-war or 1980s office blocks): 605 and 607 Market, 33 New Montgomery, the Bank of America block at New
Montgomery, the James Bong Building, Pacific Place Tower, 1 Kearny.

Handed to the neighbouring districts, which had already modelled or restyled them when the manifests were
compared: the Chevron Tower, 44 Montgomery, the Hobart Building and 544–580 Market (market-east), and the
Warfield Building (market-west). One Montgomery Street is modelled here although market-east also restyles
way/132125162 as "590 Market Street" — the model should win; they should drop their entry. Worth a Street View pass later.

Not modelled: the BART/Muni station structures (Montgomery, Powell, Union Square/Market Street) — what shows on
the street is escalator canopies and railings, which belong to the city's furniture, not to a landmark model;
and Hallidie Plaza, which is a sunken plaza (a hole in the pavement) that the landmark pipeline cannot cut.

Notes on the sources: the de Young Building's 1890 clock tower was taken down in 1962, so the model is the
building as it stands, with the 2007 Ritz-Carlton tower on it. OSM's height for 799 Market (87 m) and the
Pacific Building (54 m) are both wrong; the manifest carries the real ones.
