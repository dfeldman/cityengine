# market-west: buildings to model one by one

Generated from docs/sf-targets.json (tools/sf-targets.ts): the unmodelled tall and civic buildings and the named parks and plazas within ~130 m of Market Street (or in the Union Square blocks), tallest first. `osm` is the manifest's id; the height is OSM's (or levels × 3.4). Parts (building:part) of a building are not listed: find them in OSM and add them to the entry's `osm` list if the model covers them.

| # | kind | name | osm | height m | levels | lat, lon | tags |
|---|---|---|---|---|---|---|---|
| 1 | tall | Fox Plaza | way/33790323 | 126 | 29 | 37.777136, -122.417665 | building=apartments |
| 2 | tall | 100 Van Ness Avenue | way/35174722 | 122 | 29 | 37.776742, -122.419117 | building=apartments |
| 3 | tall | NEMA North Tower | way/285840933 | 106 | 37 | 37.776031, -122.417457 | building=apartments |
| 4 | tall | Dolby Laboratories | way/35176298 | 95 | 0 | 37.777597, -122.41552 | building=office |
| 5 | tall | NEMA South Tower | way/285840934 | 73 | 24 | 37.775709, -122.416922 | building=apartments |
| 6 | tall | (unnamed) | way/255960460 | 70 | 0 | 37.779289, -122.413122 | building=yes |
| 7 | tall | Argenta | way/940206084 | 68 | 20 | 37.776738, -122.418199 | building=yes |
| 8 | tall | 33 8th Street | way/501076686 | 65 | 19 | 37.778313, -122.413473 | building=apartments |
| 9 | tall | LightHouse for the Blind and Visually Impaired | way/255960469 | 65 | 0 | 37.779205, -122.413382 | building=yes |
| 10 | tall | 1145 Market Street | way/255960482 | 65 | 0 | 37.779479, -122.413276 | building=yes |
| 11 | tall | AVA | way/35176297 | 63 | 17 | 37.777111, -122.415144 | building=yes |
| 12 | tall | Saint Boniface Catholic Church | way/127740039 | 62 | 6 | 37.78168, -122.413047 | building=church amenity=place_of_worship christian |
| 13 | tall | Hotel Zetta San Francisco | way/332627661 | 62 | 0 | 37.783573, -122.406886 | building=yes |
| 14 | tall | 845 Market Street | way/332627424 | 62 | 0 | 37.784069, -122.406674 | building=retail |
| 15 | tall | San Francisco Federal Building | way/32863953 | 61 | 18 | 37.779304, -122.412403 | building=office |
| 16 | tall | BEI Hotel San Francisco | way/35176131 | 58 | 0 | 37.77768, -122.414194 | building=yes |
| 17 | tall | 1177 Mission Street | way/208345686 | 58 | 17 | 37.778839, -122.413873 | building=apartments |
| 18 | tall | Hotel Whitcomb | way/33194422 | 55 | 0 | 37.777856, -122.414783 | building=hotel |
| 19 | tall | San Francisco Proper Hotel | way/32864990 | 47 | 0 | 37.780944, -122.412498 | building=yes |
| 20 | tall | Civic Center Residence | way/256042697 | 47 | 0 | 37.78133, -122.412863 | building=apartments |
| 21 | tall | San Francisco Public Library - Main Library | way/24446086 | 46 | 5 | 37.779173, -122.415884 | building=civic amenity=library |
| 22 | tall | Orpheum Building | way/35115840 | 46 | 4 | 37.779448, -122.414674 | building=commercial |
| 23 | tall | Market Square | way/35111960 | 45 | 11 | 37.776732, -122.416247 | building=office |
| 24 | tall | Odd Fellows Temple | way/35536533 | 44 | 0 | 37.780085, -122.412397 | building=yes |
| 25 | tall | (unnamed) | way/255960480 | 44 | 4 | 37.779972, -122.412497 | building=yes |
| 26 | tall | Prism | way/32864957 | 44 | 13 | 37.781936, -122.41139 | building=apartments |
| 27 | tall | (unnamed) | way/940206079 | 44 | 13 | 37.777081, -122.418787 | building=apartments |
| 28 | tall | (unnamed) | way/32865004 | 42 | 6 | 37.780555, -122.413222 | building=commercial |
| 29 | tall | Dorothy Day Community | way/256042679 | 42 | 0 | 37.781284, -122.41324 | building=yes |
| 30 | tall | (unnamed) | way/256042692 | 42 | 0 | 37.78119, -122.413518 | building=yes |
| 31 | tall | 50 Jones | way/32864968 | 41 | 12 | 37.781769, -122.411704 | building=apartments |
| 32 | tall | 1 Powell Street | way/32946751 | 41 | 0 | 37.784745, -122.408168 | building=yes |
| 33 | tall | Mint Plaza | way/173725096 | 39 | 0 | 37.783179, -122.407714 | building=yes |
| 34 | tall | Serif | way/1072899109 | 37 | 12 | 37.783126, -122.409869 | building=apartments roof=flat |
| 35 | tall | Bill Graham Civic Auditorium | way/25759141 | 37 | 0 | 37.778068, -122.417411 | building=civic amenity=theatre |
| 36 | tall | New Conservatory Theatre Center | way/35174721 | 37 | 0 | 37.775667, -122.419925 | building=yes amenity=arts_centre |
| 37 | tall | Grant Building | way/256035264 | 35 | 8 | 37.780369, -122.41201 | building=hotel |
| 38 | tall | 1TENth | way/35111958 | 34 | 10 | 37.776364, -122.416291 | building=office |
| 39 | tall | St Anthony's Vera Haile Senior Housing | way/35536670 | 32 | 10 | 37.781804, -122.412523 | building=apartments |
| 40 | civic | Strand Theatre | way/255960461 | 31 | 4 | 37.779601, -122.412875 | building=commercial amenity=theatre |
| 41 | civic | United Nations Building | relation/19309896 | 29 | 0 | 37.780354, -122.414465 | building=government |
| 42 | civic | Golden Gate Theater | way/260129387 | 24 | 0 | 37.782616, -122.411085 | building=yes amenity=theatre |
| 43 | civic | Warfield Theatre | way/206723692 | 22 | 9 | 37.782719, -122.410376 | building=yes amenity=theatre |
| 44 | civic | Allen Hotel | way/230607753 | 16 | 0 | 37.772573, -122.421981 | building=hotel amenity=social_facility |
| 45 | civic | Islamic Society of San Francisco | way/32864985 | 15 | 3 | 37.78151, -122.411845 | building=commercial amenity=place_of_worship muslim |
| 46 | civic | San Francisco Fire Station 36 | way/256728885 | 10 | 0 | 37.774903, -122.421238 | building=yes amenity=fire_station |
| 47 | civic | (unnamed) | way/256730329 | 4 | 0 | 37.773845, -122.422647 | building=government |
| 48 | civic | Alsabeel Masjid Noor Al Islam | way/942674800 | 3 | 1 | 37.782426, -122.412089 | building=yes amenity=place_of_worship muslim |
| 49 | civic | Civic Center Station | way/775660875 | 0 | 0 | 37.779391, -122.414076 | building=train_station |
| 50 | civic | San Francisco Conservatory of Music | way/255958566 | 0 | 0 | 37.775617, -122.420325 | building=civic amenity=school |
| 51 | garden | Oasis at 50 Jones | way/990987745 | 0 | 0 | 37.781725, -122.411742 |  |
| 52 | park | The Commons | way/1193867827 | 0 | 0 | 37.776483, -122.416427 |  |
