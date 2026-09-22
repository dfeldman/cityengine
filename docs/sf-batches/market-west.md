# market-west: buildings to model one by one

Generated from docs/sf-targets.json (tools/sf-targets.ts): the unmodelled tall and civic buildings and the named parks and plazas within ~130 m of Market Street (or in the Union Square blocks), tallest first. `osm` is the manifest's id; the height is OSM's (or levels × 3.4). Parts (building:part) of a building are not listed: find them in OSM and add them to the entry's `osm` list if the model covers them.

## Status (2026-09-22)

Every building on the stretch Market gives from Sixth/Taylor to Octavia, both sides, is either **modelled** (its own
builder in `src/render/landmarks/sf/districts/market-west.ts`, placed from
`public/landmarks/san-francisco/market-west.json`) or **restyled** (a pregenerated facade style, for the ordinary
low blocks). The model shots are in `docs/shots/models/market-west/`.

Modelled, in the order they were done: the Warfield Building and its auditorium, the Golden Gate Theatre, the
Orpheum, the Hibernia Bank, Market Square (the Furniture Mart), the Hotel Whitcomb, Fox Plaza, 100 Van Ness,
1 South Van Ness, the 1455 Market tower and its podium, Dolby (1275 Market), the NEMA towers and podiums, the
Federal Building and its annex, the Asian Art Museum, the Main Library, 50 UN Plaza, the War Memorial Opera House
and Veterans Building, the Bill Graham Civic Auditorium, Davies Symphony Hall, 1145 Market, 1150 and 1155 Market,
the Odd Fellows Temple, the San Francisco Proper Hotel and St Boniface.

Not done, and why: rows 13, 14, 32, 33 and 34 (Hotel Zetta, 845 Market, 1 Powell, Mint Plaza, Serif) are east of
Sixth Street — off this district's stretch and in market-mid's block, left alone so the two batches do not collide;
Civic Center Station is underground (only its head house is a building); the Oasis at 50 Jones and The Commons are
a garden and a park, not buildings.

| # | kind | name | osm | height m | levels | lat, lon | tags | status |
|---|---|---|---|---|---|---|---|---|
| 1 | tall | Fox Plaza | way/33790323 | 126 | 29 | 37.777136, -122.417665 | building=apartments | **modelled** (`foxPlaza`) |
| 2 | tall | 100 Van Ness Avenue | way/35174722 | 122 | 29 | 37.776742, -122.419117 | building=apartments | **modelled** (`vanNess100`) |
| 3 | tall | NEMA North Tower | way/285840933 | 106 | 37 | 37.776031, -122.417457 | building=apartments | **modelled** (`nemaTower`) |
| 4 | tall | Dolby Laboratories | way/35176298 | 95 | 0 | 37.777597, -122.41552 | building=office | **modelled** (`dolbyBuilding`) |
| 5 | tall | NEMA South Tower | way/285840934 | 73 | 24 | 37.775709, -122.416922 | building=apartments | **modelled** (`nemaTower`) |
| 6 | tall | (unnamed) | way/255960460 | 70 | 0 | 37.779289, -122.413122 | building=yes | **modelled** (`greenGlassTower`) |
| 7 | tall | Argenta | way/940206084 | 68 | 20 | 37.776738, -122.418199 | building=yes | restyle `skyscraper` (20 lv) |
| 8 | tall | 33 8th Street | way/501076686 | 65 | 19 | 37.778313, -122.413473 | building=apartments | restyle `skyscraper` (19 lv) |
| 9 | tall | LightHouse for the Blind and Visually Impaired | way/255960469 | 65 | 0 | 37.779205, -122.413382 | building=yes | **modelled** (`greenGlassTower`) |
| 10 | tall | 1145 Market Street | way/255960482 | 65 | 0 | 37.779479, -122.413276 | building=yes | **modelled** (`market1145`) |
| 11 | tall | AVA | way/35176297 | 63 | 17 | 37.777111, -122.415144 | building=yes | restyle `skyscraper` (17 lv) |
| 12 | tall | Saint Boniface Catholic Church | way/127740039 | 62 | 6 | 37.78168, -122.413047 | building=church amenity=place_of_worship christian | **modelled** (`saintBoniface`) |
| 13 | tall | Hotel Zetta San Francisco | way/332627661 | 62 | 0 | 37.783573, -122.406886 | building=yes | not done |
| 14 | tall | 845 Market Street | way/332627424 | 62 | 0 | 37.784069, -122.406674 | building=retail | not done |
| 15 | tall | San Francisco Federal Building | way/32863953 | 61 | 18 | 37.779304, -122.412403 | building=office | **modelled** (`federalBuilding`) |
| 16 | tall | BEI Hotel San Francisco | way/35176131 | 58 | 0 | 37.77768, -122.414194 | building=yes | restyle `skyscraper` (16 lv) |
| 17 | tall | 1177 Mission Street | way/208345686 | 58 | 17 | 37.778839, -122.413873 | building=apartments | restyle `skyscraper` (17 lv) |
| 18 | tall | Hotel Whitcomb | way/33194422 | 55 | 0 | 37.777856, -122.414783 | building=hotel | **modelled** (`hotelWhitcomb`) |
| 19 | tall | San Francisco Proper Hotel | way/32864990 | 47 | 0 | 37.780944, -122.412498 | building=yes | **modelled** (`properHotel`) |
| 20 | tall | Civic Center Residence | way/256042697 | 47 | 0 | 37.78133, -122.412863 | building=apartments | restyle `chicago` (12 lv) |
| 21 | tall | San Francisco Public Library - Main Library | way/24446086 | 46 | 5 | 37.779173, -122.415884 | building=civic amenity=library | **modelled** (`mainLibrary`) |
| 22 | tall | Orpheum Building | way/35115840 | 46 | 4 | 37.779448, -122.414674 | building=commercial | **modelled** (`orpheumTheatre`) |
| 23 | tall | Market Square | way/35111960 | 45 | 11 | 37.776732, -122.416247 | building=office | **modelled** (`furnitureMart`) |
| 24 | tall | Odd Fellows Temple | way/35536533 | 44 | 0 | 37.780085, -122.412397 | building=yes | **modelled** (`oddFellowsTemple`) |
| 25 | tall | (unnamed) | way/255960480 | 44 | 4 | 37.779972, -122.412497 | building=yes | restyle `classical` (4 lv) |
| 26 | tall | Prism | way/32864957 | 44 | 13 | 37.781936, -122.41139 | building=apartments | restyle `skyscraper` (13 lv) |
| 27 | tall | (unnamed) | way/940206079 | 44 | 13 | 37.777081, -122.418787 | building=apartments | restyle `skyscraper` (13 lv) |
| 28 | tall | (unnamed) | way/32865004 | 42 | 6 | 37.780555, -122.413222 | building=commercial | restyle `classical` (6 lv) |
| 29 | tall | Dorothy Day Community | way/256042679 | 42 | 0 | 37.781284, -122.41324 | building=yes | restyle `chicago` (11 lv) |
| 30 | tall | (unnamed) | way/256042692 | 42 | 0 | 37.78119, -122.413518 | building=yes | restyle `chicago` (11 lv) |
| 31 | tall | 50 Jones | way/32864968 | 41 | 12 | 37.781769, -122.411704 | building=apartments | restyle `skyscraper` (12 lv) |
| 32 | tall | 1 Powell Street | way/32946751 | 41 | 0 | 37.784745, -122.408168 | building=yes | not done |
| 33 | tall | Mint Plaza | way/173725096 | 39 | 0 | 37.783179, -122.407714 | building=yes | not done |
| 34 | tall | Serif | way/1072899109 | 37 | 12 | 37.783126, -122.409869 | building=apartments roof=flat | not done |
| 35 | tall | Bill Graham Civic Auditorium | way/25759141 | 37 | 0 | 37.778068, -122.417411 | building=civic amenity=theatre | **modelled** (`billGrahamAuditorium`) |
| 36 | tall | New Conservatory Theatre Center | way/35174721 | 37 | 0 | 37.775667, -122.419925 | building=yes amenity=arts_centre | restyle `classical` (8 lv) |
| 37 | tall | Grant Building | way/256035264 | 35 | 8 | 37.780369, -122.41201 | building=hotel | restyle `chicago` (8 lv) |
| 38 | tall | 1TENth | way/35111958 | 34 | 10 | 37.776364, -122.416291 | building=office | restyle `skyscraper` (10 lv) |
| 39 | tall | St Anthony's Vera Haile Senior Housing | way/35536670 | 32 | 10 | 37.781804, -122.412523 | building=apartments | restyle `brutalist` (10 lv) |
| 40 | civic | Strand Theatre | way/255960461 | 31 | 4 | 37.779601, -122.412875 | building=commercial amenity=theatre | restyle `classical` (4 lv) |
| 41 | civic | United Nations Building | relation/19309896 | 29 | 0 | 37.780354, -122.414465 | building=government | **modelled** (`unPlazaFederal`) |
| 42 | civic | Golden Gate Theater | way/260129387 | 24 | 0 | 37.782616, -122.411085 | building=yes amenity=theatre | **modelled** (`goldenGateTheatre`) |
| 43 | civic | Warfield Theatre | way/206723692 | 22 | 9 | 37.782719, -122.410376 | building=yes amenity=theatre | **modelled** (`warfieldBuilding`) |
| 44 | civic | Allen Hotel | way/230607753 | 16 | 0 | 37.772573, -122.421981 | building=hotel amenity=social_facility | restyle `sfapartment` (5 lv) |
| 45 | civic | Islamic Society of San Francisco | way/32864985 | 15 | 3 | 37.78151, -122.411845 | building=commercial amenity=place_of_worship muslim | restyle `brick` (3 lv) |
| 46 | civic | San Francisco Fire Station 36 | way/256728885 | 10 | 0 | 37.774903, -122.421238 | building=yes amenity=fire_station | restyle `bauhaus` (2 lv) |
| 47 | civic | (unnamed) | way/256730329 | 4 | 0 | 37.773845, -122.422647 | building=government | restyle `bauhaus` (1 lv) |
| 48 | civic | Alsabeel Masjid Noor Al Islam | way/942674800 | 3 | 1 | 37.782426, -122.412089 | building=yes amenity=place_of_worship muslim | restyle `brick` (1 lv) |
| 49 | civic | Civic Center Station | way/775660875 | 0 | 0 | 37.779391, -122.414076 | building=train_station | not done |
| 50 | civic | San Francisco Conservatory of Music | way/255958566 | 0 | 0 | 37.775617, -122.420325 | building=civic amenity=school | restyle `classical` (4 lv) |
| 51 | garden | Oasis at 50 Jones | way/990987745 | 0 | 0 | 37.781725, -122.411742 |  | not done |
| 52 | park | The Commons | way/1193867827 | 0 | 0 | 37.776483, -122.416427 |  | not done |
