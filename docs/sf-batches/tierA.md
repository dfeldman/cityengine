# tierA: buildings to model one by one

Cut from the register (docs/sf-buildings.csv) by tools/sf-batches.ts: only buildings nobody has claimed, tallest
first. Each gets its own model or a facade style — see docs/sf-batches/BRIEF-RECIPE.md.

| # | kind | name | osm | height m | levels | lat, lon | note |
|---|---|---|---|---|---|---|---|
| 1 | civic | First Chinese Baptist Church | way/66642926 | 14 | 0 | 37.793471, -122.406832 | building=yes amenity=place_of_worship christian |
| 2 | civic | Academy of Art University | way/93420060 | 12 | 3 | 37.807423, -122.410378 | building=yes amenity=university |
| 3 | civic | Embarcadero Station | way/773030142 | 0 | 0 | 37.792893, -122.396855 | building=train_station |
| 4 | civic | Nativity of Our Lord Parish | way/256720470 | 0 | 0 | 37.776373, -122.42187 | building=yes amenity=place_of_worship christian |
| 5 | civic | SFJAZZ Center | way/256720482 | 13 | 3 | 37.776416, -122.42153 | building=yes amenity=arts_centre |
| 6 | civic | Montgomery Street Station | way/550652205 | 0 | 0 | 37.78947, -122.401316 | building=train_station |
| 7 | civic | Powell Street Station | way/160331904 | 0 | 0 | 37.785138, -122.406637 | building=train_station |
| 8 | civic | Ripley's Believe it or Not | way/288473102 | 13 | 0 | 37.808044, -122.415396 | building=yes |
| 9 | civic | National Maritime Museum | way/32839686 | 10 | 0 | 37.80641, -122.423923 | building=yes |
| 10 | civic | Gold Mountain Monastery | way/260524896 | 0 | 0 | 37.793541, -122.406369 | building=yes amenity=place_of_worship buddhist |
| 11 | civic | The Urban School of San Francisco | way/449472826 | 0 | 0 | 37.771735, -122.446304 | building=school amenity=school |
| 12 | civic | Club Fugazi | way/32866034 | 16 | 0 | 37.799679, -122.4103 | building=yes amenity=theatre |
| 13 | civic | Civic Center Station | way/775660875 | 0 | 0 | 37.779391, -122.414076 | building=train_station |
| 14 | civic | San Francisco Evangelical Free Church | way/260925337 | 14 | 0 | 37.793815, -122.403877 | building=yes amenity=place_of_worship christian |
| 15 | civic | Kong Chow Temple | way/260523829 | 16 | 0 | 37.793911, -122.408058 | building=yes amenity=place_of_worship taoist |
| 16 | civic | San Francisco Transition Structure | way/123559872 | 16 | 3 | 37.79582, -122.391787 | building=transportation roof=quadruple_saltbox |
| 17 | civic | Notre Dame Des Victoires Church | way/260183822 | 10 | 0 | 37.790671, -122.406556 | building=church amenity=place_of_worship christian |
| 18 | civic | Saint Mary's Chinese Mission | way/256731627 | 15 | 0 | 37.79438, -122.408293 | building=church amenity=place_of_worship christian |
| 19 | civic | Mount Zion Baptist Church | way/263866060 | 0 | 0 | 37.772162, -122.440954 | building=yes amenity=place_of_worship christian |
| 20 | civic | Nourse Theater | way/256732461 | 0 | 0 | 37.776952, -122.421035 | building=school amenity=theatre |
| 21 | civic | 850 Sacramento Street | way/68862760 | 5 | 0 | 37.793614, -122.40693 | building=yes amenity=community_centre |
| 22 | civic | United States Appraisers Building | way/32965865 | 10 | 3 | 37.796214, -122.401391 | building=public |
| 23 | civic | North Beach Branch Library | way/35065740 | 0 | 0 | 37.802643, -122.41316 | building=yes amenity=library |
| 24 | civic | Ma-Tsu Temple | way/256733189 | 11 | 0 | 37.796488, -122.406304 | building=yes amenity=place_of_worship taoist |
| 25 | civic | Union Square/Market Street Station | way/184956226 | 0 | 0 | 37.786487, -122.406555 | building=train_station |
| 26 | civic | San Francisco Fire Station 13 | way/35266543 | 10 | 0 | 37.795561, -122.401358 | building=yes amenity=fire_station |
| 27 | civic | Edwin and Anita Lee Newcomer School | way/162056247 | 0 | 0 | 37.794799, -122.404087 | building=school amenity=school |
| 28 | civic | San Francisco Unified School District Administration | way/255958555 | 10 | 3 | 37.776692, -122.420205 | building=government |
| 29 | civic | Union Square/Market Street Station | way/616479968 | 3 | 1 | 37.787678, -122.407118 | building=train_station |
| 30 | civic | City College of San Francisco Chinatown Annex | way/256072722 | 0 | 0 | 37.795732, -122.40411 | building=yes amenity=college |
| 31 | civic | San Francisco Fire Station 2 | way/288487230 | 12 | 0 | 37.797061, -122.409969 | building=yes amenity=fire_station |
| 32 | civic | Great Star Theater | way/256733182 | 9 | 0 | 37.796388, -122.405826 | building=yes amenity=theatre |
| 33 | civic | San Francisco Evangelical Free Church | way/262574418 | 11 | 0 | 37.800309, -122.411796 | building=yes amenity=place_of_worship christian |
| 34 | civic | San Francisco Fire Station 28 | way/161843742 | 9 | 0 | 37.802556, -122.409358 | building=yes amenity=fire_station |
| 35 | civic | Quaker Meeting House | way/35174746 | 8 | 0 | 37.77676, -122.414981 | building=yes amenity=place_of_worship christian |
| 36 | civic | Larkin Street Youth Services | way/260155574 | 12 | 0 | 37.78226, -122.412996 | building=yes amenity=social_facility |
| 37 | civic | San Francisco Fire Station 35 | way/104599984 | 0 | 0 | 37.790207, -122.388504 | building=yes amenity=fire_station |
| 38 | civic | USS Pampanito | way/165601339 | 7 | 2 | 37.809924, -122.416345 | building=ship |
| 39 | civic | 501 Fulton Street | way/256587847 | 9 | 0 | 37.778345, -122.42528 | building=yes amenity=place_of_worship christian |
| 40 | civic | Korean Methodist Church | way/259256019 | 0 | 0 | 37.795099, -122.410026 | building=yes amenity=place_of_worship christian |
| 41 | civic | Chinatown / Him Mark Lai Branch Library | way/162056246 | 0 | 0 | 37.795243, -122.410201 | building=yes amenity=library |
| 42 | civic | DMV San Francisco | way/113631370 | 8 | 0 | 37.773282, -122.440452 | building=yes |
| 43 | civic | Esplanade Main Stage | way/580080200 | 0 | 0 | 37.784984, -122.40238 | building=no amenity=theatre |
| 44 | civic | Canon Kip Community House | way/227005952 | 15 | 0 | 37.776463, -122.412241 | building=yes amenity=social_facility |
| 45 | civic | Canon Barcus Community House | way/260466858 | 0 | 0 | 37.777095, -122.411796 | building=yes amenity=social_facility |
| 46 | civic | Boys & Girls Club | way/114304294 | 10 | 3 | 37.779174, -122.422797 | building=yes amenity=social_facility |
| 47 | civic | First Church of Christ, Scientist | way/71359566 | 15 | 0 | 37.786132, -122.412489 | building=church |
| 48 | civic | Clayton Street Post Office | way/196108167 | 6 | 0 | 37.77006, -122.448325 | building=yes amenity=post_office |
| 49 | civic | Unity | way/258640367 | 12 | 0 | 37.773952, -122.424726 | building=yes amenity=place_of_worship christian |
| 50 | civic | United Playaz | way/260358486 | 0 | 0 | 37.779223, -122.408266 | building=yes amenity=social_facility |
| 51 | civic | Lady Shaw Senior Center / 邵逸夫爵士夫人康樂中心 | way/257014128 | 12 | 0 | 37.797112, -122.412266 | building=yes amenity=community_centre |
| 52 | civic | Tenderloin Police Station | way/35095789 | 6 | 0 | 37.783655, -122.412867 | building=yes amenity=police |
| 53 | civic | 745 Buchanan Street | relation/20512971 | 0 | 0 | 37.776904, -122.428299 | building=civic |
| 54 | civic | San Francisco Zen Center | relation/3439271 | 0 | 0 | 37.773897, -122.426047 | building=yes amenity=place_of_worship buddhist |
| 55 | civic | New Antioch Baptist Church | way/263824672 | 9 | 0 | 37.773781, -122.438445 | building=yes amenity=place_of_worship christian |
| 56 | civic | The Riley Center | way/260369760 | 10 | 0 | 37.776636, -122.41068 | building=yes amenity=social_facility |
| 57 | civic | Cable Car Powerhouse and Barn | way/30029681 | 0 | 0 | 37.794904, -122.411994 | building=yes |
| 58 | civic | Ebenezer Baptist Church | way/263828910 | 6 | 0 | 37.771803, -122.437482 | building=yes amenity=place_of_worship christian |
| 59 | civic | The Sanctuary | way/243357053 | 9 | 0 | 37.776217, -122.411188 | building=yes amenity=social_facility |
| 60 | civic | Alcazar Theatre | way/33570646 | 0 | 0 | 37.786931, -122.41411 | building=yes amenity=theatre |
| 61 | civic | San Francisco Department of Emergency Management | way/258107724 | 13 | 0 | 37.781014, -122.426188 | building=yes |
| 62 | civic | Children's Creativity Museum | way/288716388 | 10 | 0 | 37.783098, -122.401745 | building=yes |
| 63 | civic | San Francisco Fire Station 21 | way/261466912 | 9 | 0 | 37.775417, -122.440299 | building=yes amenity=fire_station |
| 64 | civic | Presidio Knolls School | way/243466311 | 0 | 0 | 37.773013, -122.413877 | building=yes amenity=school |
| 65 | civic | 230 Kissling Street | way/260496648 | 9 | 0 | 37.773318, -122.413893 | building=church |
| 66 | civic | American Bookbinders Museum | way/173886707 | 9 | 0 | 37.78132, -122.402745 | building=yes |
| 67 | civic | SF LGBT Center | way/179496056 | 10 | 3 | 37.771779, -122.424116 | building=yes amenity=community_centre |
| 68 | civic | Tenderloin Recreation Center | way/71209420 | 10 | 0 | 37.784794, -122.415607 | building=yes amenity=community_centre |
| 69 | civic | San Francisco Fire Station 1 | way/225733614 | 0 | 0 | 37.77942, -122.404059 | building=yes amenity=fire_station |
| 70 | civic | Flexdrive | way/243464467 | 14 | 0 | 37.774501, -122.40996 | building=transportation amenity=car_rental |
| 71 | civic | Ella Hill Hutch Community Center | way/256584828 | 5 | 0 | 37.779279, -122.429256 | building=yes amenity=community_centre |
| 72 | civic | The Independent | way/174076537 | 7 | 0 | 37.775541, -122.43767 | building=yes amenity=theatre |
| 73 | civic | Marina Branch Library | way/288394771 | 4 | 0 | 37.801347, -122.43414 | building=yes amenity=library |
| 74 | civic | Ukrainian Orthodox Church of Saint Michael | way/260459201 | 12 | 0 | 37.776378, -122.406944 | building=church amenity=place_of_worship christian |
| 75 | civic | San Francisco Day School | relation/3828921 | 0 | 0 | 37.77805, -122.44636 | building=yes amenity=school |
| 76 | civic | City College of San Francisco Alemany Campus | way/172111621 | 15 | 0 | 37.783239, -122.420065 | building=yes amenity=college |
| 77 | civic | Uptown Church of Christ | way/261302127 | 0 | 0 | 37.778356, -122.432106 | building=yes amenity=place_of_worship christian |
| 78 | civic | Great American Music Hall | way/260131753 | 12 | 0 | 37.784819, -122.418797 | building=yes amenity=theatre |
| 79 | civic | Second Union Baptist Church | way/261443889 | 10 | 0 | 37.772489, -122.43299 | building=yes amenity=place_of_worship christian |
| 80 | civic | Saint John Coltrane African Orthodox Church | way/262226218 | 0 | 0 | 37.77889, -122.443357 | building=yes amenity=place_of_worship christian |
| 81 | civic | Harbor Light Center | way/219783333 | 0 | 0 | 37.772583, -122.409621 | building=yes amenity=social_facility |
| 82 | civic | Glad Tidings Church | way/256495545 | 11 | 0 | 37.782357, -122.430263 | building=church amenity=place_of_worship christian |
| 83 | civic | Redding Elementary School | way/85645142 | 14 | 0 | 37.789473, -122.419184 | building=yes amenity=school |
| 84 | civic | San Francisco Fire Station 41 | way/259222511 | 10 | 0 | 37.793381, -122.416518 | building=fire_station amenity=fire_station |
| 85 | civic | San Francisco Fire Station 3 | way/260026187 | 13 | 0 | 37.786614, -122.419304 | building=yes amenity=fire_station |
| 86 | civic | Community Youth Center | way/256060074 | 10 | 0 | 37.78719, -122.419131 | building=yes amenity=community_centre |
| 87 | civic | Full Gospel San Francisco Church | way/258017311 | 10 | 0 | 37.782926, -122.430421 | building=yes amenity=place_of_worship christian |
| 88 | civic | Northern Police Station | way/161385043 | 7 | 0 | 37.780217, -122.432533 | building=civic amenity=police |
| 89 | civic | Third Baptist Church | way/261301014 | 12 | 0 | 37.777821, -122.434781 | building=church amenity=place_of_worship christian |
| 90 | civic | California Highway Patrol | way/158827841 | 6 | 0 | 37.773246, -122.40738 | building=yes amenity=police |
| 91 | civic | Holy Trinity Orthodox Cathedral | way/243591036 | 0 | 0 | 37.797738, -122.424203 | building=yes amenity=place_of_worship christian |
| 92 | civic | Saint John the Baptist Serbian Orthodox Church | way/274428408 | 6 | 0 | 37.779544, -122.441553 | building=church amenity=place_of_worship christian |
| 93 | civic | Tahanan | way/1028203748 | 0 | 0 | 37.775293, -122.40325 | building=apartments amenity=social_facility |
| 94 | civic | Union Spring Baptist Church | way/261281719 | 9 | 0 | 37.770345, -122.430386 | building=yes amenity=place_of_worship christian |
| 95 | civic | San Francisco Fire Station 16 | way/161504253 | 8 | 0 | 37.79856, -122.436716 | building=yes amenity=fire_station |
| 96 | civic | New Liberation Presbyterian Church | way/256765941 | 0 | 0 | 37.779976, -122.438564 | building=yes amenity=place_of_worship christian |
| 97 | civic | Women's Resource Center | way/256877082 | 7 | 0 | 37.773892, -122.405705 | building=yes amenity=social_facility |
| 98 | civic | Al Tawheed Mosque | way/148428441 | 0 | 0 | 37.787457, -122.420589 | building=yes amenity=place_of_worship muslim |
| 99 | civic | Missionary Temple | way/256740737 | 8 | 0 | 37.77885, -122.434409 | building=yes amenity=place_of_worship christian |
| 100 | civic | Multi-Service Center South | way/218185111 | 11 | 0 | 37.777685, -122.399855 | building=yes amenity=social_facility |
| 101 | civic | Hamilton Square Baptist Church | way/257981293 | 10 | 0 | 37.785718, -122.423458 | building=church amenity=place_of_worship christian |
| 102 | civic | The Church For the Fellowship of All People | way/260991572 | 13 | 0 | 37.796771, -122.420505 | building=church |
| 103 | civic | Hall of Justice Service Station | way/256877086 | 4 | 0 | 37.773661, -122.406011 | building=yes |
| 104 | civic | CPMC Van Ness Campus | way/288533921 | 0 | 0 | 37.786052, -122.422405 | building=yes amenity=hospital |
| 105 | civic | Korean Center | way/257965700 | 15 | 0 | 37.786476, -122.42467 | building=yes amenity=community_centre |
| 106 | civic | Golden Gate Valley Branch Library | way/259078177 | 9 | 0 | 37.796799, -122.428949 | building=yes amenity=library |
| 107 | civic | Macang Monastery | way/261273676 | 16 | 0 | 37.780996, -122.438115 | building=church amenity=place_of_worship buddhist |
| 108 | civic | Art Gallery of the Macang Monastery | way/261273687 | 11 | 0 | 37.781036, -122.437946 | building=church |
| 109 | civic | Soto Zen Mission Sokoji | way/1160776714 | 0 | 0 | 37.786498, -122.428555 | building=yes amenity=place_of_worship buddhist |
| 110 | civic | Sagebrook | way/273538821 | 11 | 0 | 37.782634, -122.448847 | building=yes amenity=social_facility |
| 111 | civic | San Francisco Fire Department Headquarters | way/112897758 | 11 | 0 | 37.780649, -122.391044 | building=yes |
| 112 | civic | Fo Guang Shan San Bao Temple | way/261128338 | 0 | 0 | 37.79191, -122.422058 | building=yes amenity=place_of_worship buddhist |
| 113 | civic | Saint Mary the Virgin Episcopal Church | way/261608748 | 8 | 0 | 37.79664, -122.437419 | building=church amenity=place_of_worship christian |
| 114 | civic | Little Zion Baptist Church | way/274463275 | 5 | 0 | 37.781298, -122.439362 | building=church amenity=place_of_worship christian |
| 115 | civic | Brannan Street Station | way/160892688 | 5 | 0 | 37.779133, -122.396015 | building=yes amenity=post_office |
| 116 | civic | San Francisco Fire Station 8 | way/161502029 | 0 | 0 | 37.777256, -122.3967 | building=yes amenity=fire_station |
| 117 | civic | Japanese Cultural and Community Center of Northern California | way/257974849 | 0 | 0 | 37.786594, -122.430944 | building=yes amenity=community_centre |
| 118 | civic | Hamilton Memorial Church of God in Christ | way/263499595 | 0 | 0 | 37.78313, -122.44262 | building=yes amenity=place_of_worship christian |
| 119 | civic | Academy of Art University - School of Motion Pictures & Television | way/218185049 | 13 | 3 | 37.774253, -122.399345 | building=college amenity=college |
| 120 | civic | Jones Memorial United Methodist Church | way/263227932 | 10 | 0 | 37.784863, -122.43423 | building=yes amenity=place_of_worship christian |
| 121 | civic | Gadar Memorial | way/273575059 | 8 | 0 | 37.783604, -122.449588 | building=yes |
| 122 | tall | 1500 Mission | way/693627612 | 121 | 39 | 37.773941, -122.418287 | building=apartments |
| 123 | civic | Buddhist Church of San Francisco | way/308165312 | 12 | 0 | 37.788586, -122.426648 | building=temple amenity=place_of_worship buddhist |
| 124 | civic | Macedonia Baptist Church | way/263283882 | 16 | 0 | 37.785476, -122.435542 | building=church amenity=place_of_worship christian |
| 125 | tall | UC Law San Francisco McAllister Tower | way/256042681 | 114 | 0 | 37.781192, -122.414078 | building=university |
| 126 | civic | Haas-Lilienthal House | way/256993595 | 14 | 0 | 37.793292, -122.424952 | building=yes |
| 127 | civic | Sinai Memorial Chapel | way/263492932 | 8 | 0 | 37.78363, -122.439796 | building=yes amenity=place_of_worship jewish |
| 128 | civic | Pacific Heights School | relation/3528184 | 0 | 0 | 37.792899, -122.433492 | building=yes amenity=school |
| 129 | civic | Love Chapel Church of God in Christ | way/263509887 | 6 | 0 | 37.784471, -122.444611 | building=yes amenity=place_of_worship christian |
| 130 | civic | Calvary Presbyterian Church | way/262137945 | 0 | 0 | 37.792617, -122.434898 | building=yes amenity=place_of_worship christian |
| 131 | civic | San Francisco 4th & King Street | way/28295229 | 5 | 1 | 37.776519, -122.394845 | building=train_station |
| 132 | civic | San Francisco Fire Station 10 | way/36950390 | 0 | 0 | 37.785597, -122.446896 | building=yes amenity=fire_station |
| 133 | civic | Transit Police Bureau SFK Substation | way/218159535 | 4 | 0 | 37.771706, -122.400637 | building=yes amenity=police |
| 134 | tall | Jasper | way/227689990 | 131 | 39 | 37.785841, -122.393747 | building=apartments |
| 135 | civic | San Francisco Fire Department Pioneer Museum | way/36950438 | 0 | 0 | 37.785774, -122.446825 | building=yes |
| 136 | civic | First Apostolic Faith Church | way/263349499 | 0 | 0 | 37.786468, -122.436505 | building=yes amenity=place_of_worship christian |
| 137 | civic | Western Addition Branch Library | way/160833254 | 3 | 1 | 37.784143, -122.437549 | building=yes amenity=library |
| 138 | civic | San Francisco Fire Station 38 | way/256998543 | 8 | 0 | 37.789704, -122.429809 | building=yes amenity=fire_station |
| 139 | civic | Seventh-day Adventist Japanese Church | way/262751771 | 0 | 0 | 37.791595, -122.432908 | building=yes amenity=place_of_worship christian |
| 140 | tall | (unnamed) | way/80296740 | 108 | 26 | 37.788145, -122.399082 | building=yes |
| 141 | civic | Community Baptist Church | way/263420998 | 10 | 0 | 37.785801, -122.441458 | building=yes amenity=place_of_worship christian |
| 142 | tall | 1188 Mission Street | way/225384420 | 87 | 0 | 37.778275, -122.412839 | building=apartments |
| 143 | civic | Golden Gate Community Church of the Nazarene | way/263379850 | 12 | 0 | 37.787273, -122.437251 | building=yes amenity=place_of_worship christian |
| 144 | tall | Intercontinental San Francisco | way/256029743 | 104 | 32 | 37.782096, -122.404608 | building=hotel |
| 145 | civic | Music and Art Institute | way/262096301 | 12 | 0 | 37.792157, -122.438871 | building=yes amenity=school |
| 146 | civic | 1051 3rd Street | way/579664204 | 7 | 2 | 37.776609, -122.389914 | building=transportation roof=pyramidal |
| 147 | civic | Crissy Field Center | way/288374432 | 5 | 0 | 37.805788, -122.449104 | building=yes amenity=community_centre |
| 148 | tall | (unnamed) | way/80296709 | 99 | 0 | 37.788238, -122.398976 | building=yes |
| 149 | tall | Royal Towers | way/257026417 | 100 | 30 | 37.798594, -122.413131 | building=yes |
| 150 | civic | Town School for Boys | way/262074929 | 0 | 0 | 37.791999, -122.440234 | building=school amenity=school |
| 151 | tall | (unnamed) | way/80296716 | 99 | 24 | 37.788037, -122.399201 | building=yes |
| 152 | tall | W San Francisco | way/80296747 | 96 | 31 | 37.785399, -122.400493 | building=hotel |
| 153 | tall | InterContinental Mark Hopkins | way/1361492525 | 93 | 0 | 37.791566, -122.410387 | building=yes |
| 154 | civic | Mission Creek Park Pavilion | way/188854480 | 5 | 0 | 37.773112, -122.393669 | building=public |
| 155 | civic | 2725 California Street | way/263385458 | 11 | 0 | 37.787693, -122.439505 | building=school amenity=school |
| 156 | tall | (unnamed) | way/288645261 | 83 | 0 | 37.791286, -122.393816 | building=yes |
| 157 | civic | Christ Episcopal Church | way/262765326 | 10 | 0 | 37.789936, -122.437179 | building=yes amenity=place_of_worship christian |
| 158 | tall | 633;639 Howard Street | way/260318174 | 93 | 0 | 37.785976, -122.398869 | building=yes |
| 159 | tall | Grosvenor Suites | way/288500664 | 78 | 20 | 37.790768, -122.410154 | building=yes |
| 160 | tall | One Hawthorne Street | way/260318176 | 93 | 23 | 37.785784, -122.398839 | building=yes |
| 161 | tall | 75 Hawthorne Street | way/113347427 | 99 | 18 | 37.785375, -122.398171 | building=yes |
| 162 | tall | Hotel Zetta San Francisco | way/332627661 | 62 | 0 | 37.783573, -122.406886 | building=yes |
| 163 | tall | 100 California Street | way/32612487 | 59 | 12 | 37.793955, -122.398141 | building=office |
| 164 | civic | San Francisco Waldorf School | way/262464467 | 0 | 0 | 37.790849, -122.441842 | building=yes amenity=school |
| 165 | tall | Phillip Burton Federal Building & United States Courthouse | way/35176305 | 95 | 21 | 37.781903, -122.418188 | building=office amenity=courthouse roof=flat |
| 166 | civic | Church of Christ | way/262586259 | 16 | 0 | 37.789679, -122.440431 | building=yes amenity=place_of_worship christian |
| 167 | tall | 550 California Street | way/243794014 | 55 | 0 | 37.793137, -122.403603 | building=yes |
| 168 | tall | 300 Montgomery Street | way/944039725 | 58 | 12 | 37.792409, -122.402299 | building=yes |
| 169 | civic | Presidio Branch Library | way/160833249 | 10 | 0 | 37.788917, -122.444854 | building=yes amenity=library |
| 170 | tall | Mandarin Tower | way/256730074 | 57 | 0 | 37.794733, -122.407793 | building=yes |
| 171 | tall | 311 California Street | way/944032189 | 51 | 0 | 37.792926, -122.400186 | building=yes |
| 172 | tall | 1190 Mission Street | way/226283225 | 62 | 11 | 37.777918, -122.413111 | building=apartments |
| 173 | tall | 233;241 Sansome Street | way/256067714 | 53 | 0 | 37.792618, -122.401317 | building=yes |
| 174 | tall | The Spear | way/32863010 | 60 | 13 | 37.792611, -122.394592 | building=yes |
| 175 | tall | (unnamed) | way/944025916 | 61 | 13 | 37.792953, -122.399569 | building=yes |
| 176 | tall | Fontana East | way/32839432 | 55 | 18 | 37.805473, -122.424167 | building=residential |
| 177 | tall | Fontana West | way/32839422 | 55 | 18 | 37.805376, -122.424868 | building=residential |
| 178 | tall | The Clift Royal Sonesta San Francisco | way/71504442 | 64 | 0 | 37.786733, -122.411138 | building=yes |
| 179 | tall | (unnamed) | way/1122226053 | 85 | 25 | 37.781436, -122.405533 | building=yes |
| 180 | tall | (unnamed) | way/80296721 | 93 | 0 | 37.786127, -122.398426 | building=yes |
| 181 | tall | 115 Sansome Street | way/256066233 | 53 | 14 | 37.79139, -122.401057 | building=yes |
| 182 | tall | 180 Howard Street | way/192026934 | 57 | 0 | 37.791044, -122.393474 | building=yes |
| 183 | tall | Stock Exchange Tower | way/256066241 | 55 | 11 | 37.791662, -122.401249 | building=yes |
| 184 | tall | 70 4th Street | way/332381174 | 54 | 0 | 37.784689, -122.404934 | building=yes |
| 185 | tall | Edith Witt Senior Community | way/243571751 | 55 | 0 | 37.776446, -122.415427 | building=yes |
| 186 | civic | Swedenborgian Church of San Francisco | way/262577281 | 0 | 0 | 37.790415, -122.446227 | building=yes amenity=place_of_worship christian |
| 187 | tall | 49 South Van Ness Avenue | way/32945902 | 58 | 17 | 37.774377, -122.417916 | building=office |
| 188 | tall | Millennium Lofts | way/73348851 | 44 | 0 | 37.79069, -122.395782 | building=yes |
| 189 | tall | City College of San Francisco Downtown Campus | way/256029744 | 54 | 0 | 37.784544, -122.404723 | building=yes amenity=college |
| 190 | tall | Aronson Building | way/112878589 | 55 | 10 | 37.78623, -122.402533 | building=office |
| 191 | tall | 1338 Mission Street | way/173237465 | 55 | 0 | 37.776084, -122.415465 | building=yes |
| 192 | tall | 260 California Street | way/260286437 | 45 | 0 | 37.793491, -122.399766 | building=yes |
| 193 | tall | 1310 Mission Street | way/256733612 | 55 | 0 | 37.77621, -122.41521 | building=yes |
| 194 | tall | 98 9th Street | way/256733611 | 55 | 0 | 37.776258, -122.415072 | building=yes |
| 195 | tall | Mills Building | relation/3492808 | 47 | 10 | 37.791383, -122.401836 | building=yes |
| 196 | tall | Twelve Hundred California | way/1351029672 | 88 | 26 | 37.791716, -122.414645 | building=apartments |
| 197 | tall | 1328 Mission Street | way/173237459 | 55 | 0 | 37.776103, -122.415261 | building=yes |
| 198 | tall | 1360 Mission Street | way/35174714 | 55 | 0 | 37.775882, -122.415604 | building=yes |
| 199 | tall | (unnamed) | way/260523200 | 68 | 20 | 37.793312, -122.408919 | building=yes |
| 200 | tall | 1366;1370;1372 Mission Street | way/35174715 | 55 | 0 | 37.775742, -122.41576 | building=yes |
| 201 | tall | 1340 Mission Street | way/173237467 | 55 | 0 | 37.775918, -122.415405 | building=yes |
| 202 | tall | 222 Kearny Street | way/151195285 | 42 | 10 | 37.790199, -122.403499 | building=yes |
| 203 | tall | 417 Montgomery Street | way/151183782 | 41 | 0 | 37.793424, -122.403325 | building=yes |
| 204 | tall | 530;540;546;550 Kearny Street | way/32947355 | 42 | 9 | 37.793389, -122.404282 | building=yes |
| 205 | tall | 108;110 Sutter Street | way/151195282 | 39 | 0 | 37.790256, -122.40279 | building=yes |
| 206 | civic | Historic Fire Station #30 | way/286098244 | 9 | 0 | 37.77229, -122.389395 | building=public |
| 207 | tall | Wells Fargo | way/32947380 | 41 | 12 | 37.793384, -122.402355 | building=yes |
| 208 | tall | 230 Folsom Street | way/1389914425 | 58 | 17 | 37.789432, -122.392468 | building=construction |
| 209 | tall | Foundry Square II | way/136104349 | 55 | 0 | 37.788456, -122.395177 | building=office |
| 210 | tall | The Summit | way/262480462 | 80 | 29 | 37.798497, -122.41523 | building=yes |
| 211 | tall | 240;244 Kearny Street | way/151195272 | 36 | 0 | 37.790405, -122.403814 | building=yes |
| 212 | tall | 343 Sansome Street | way/260286436 | 41 | 12 | 37.793646, -122.401529 | building=yes |
| 213 | tall | Royal Insurance Building | way/256067738 | 41 | 0 | 37.79228, -122.401261 | building=yes |
| 214 | tall | Mint Plaza | way/173725096 | 39 | 0 | 37.783179, -122.407714 | building=yes |
| 215 | tall | 552 Montgomery Street | way/256068381 | 35 | 0 | 37.794543, -122.402925 | building=yes |
| 216 | tall | Nob Hill Community Apartments | way/256749839 | 74 | 19 | 37.792882, -122.412151 | building=yes |
| 217 | tall | 350 Sansome | way/32947542 | 41 | 9 | 37.793811, -122.400998 | building=commercial |
| 218 | tall | US Court of Appeals 9 Circuit | relation/19306325 | 42 | 5 | 37.780014, -122.411024 | building=yes amenity=courthouse |
| 219 | tall | Saint Patrick Catholic Church | way/32963425 | 46 | 0 | 37.785555, -122.403539 | building=church amenity=place_of_worship christian |
| 220 | tall | (unnamed) | way/256067734 | 48 | 0 | 37.79268, -122.401672 | building=yes |
| 221 | tall | The Civic | way/940206561 | 44 | 13 | 37.777755, -122.41846 | building=apartments |
| 222 | tall | 246 2nd Street | way/113096845 | 73 | 15 | 37.785758, -122.397448 | building=yes |
| 223 | tall | Hotel Spero | way/71504456 | 55 | 0 | 37.786161, -122.411663 | building=yes |
| 224 | tall | (unnamed) | way/260286443 | 51 | 15 | 37.793777, -122.401575 | building=yes |
| 225 | tall | 330;332 Pine Street | way/260283288 | 38 | 0 | 37.792331, -122.401507 | building=yes |
| 226 | tall | Blu Condos | way/112774488 | 82 | 21 | 37.784768, -122.396844 | building=residential |
| 227 | park | Union Square | way/25278818 | 0 | 0 | 37.78794, -122.407549 |  |
| 228 | tall | 1400 Mission | way/284932384 | 46 | 15 | 37.775298, -122.416526 | building=residential |
| 229 | tall | Hills Brothers Building | relation/2280956 | 56 | 0 | 37.789483, -122.389343 | building=office |
| 230 | park | Transamerica Redwood Park | way/261988292 | 0 | 0 | 37.795249, -122.4023 |  |
| 231 | park | Washington Square Park | way/18583270 | 0 | 0 | 37.800858, -122.41021 |  |
| 232 | tall | Cathedral Apartments | way/259920940 | 73 | 18 | 37.791099, -122.414422 | building=yes |
| 233 | tall | 665 Pine Street | way/260183824 | 35 | 0 | 37.79119, -122.406815 | building=yes |
| 234 | tall | Martin Luther Tower | way/256487834 | 93 | 13 | 37.783849, -122.422955 | building=yes |
| 235 | park | Willie Woo Woo Wong Park | way/35049434 | 0 | 0 | 37.793595, -122.407141 |  |
| 236 | park | Ecker Square | way/1257968471 | 0 | 0 | 37.789651, -122.398721 |  |
