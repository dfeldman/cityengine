# civic-1: thirteen civic buildings

Follow docs/sf-batches/BRIEF-RECIPE.md, and BRIEF.md where a building needs real geometry. Photographs are in
docs/shots/refs/civic/ — the filenames are the osm id with / replaced by -, plus a -2 for the second view.

Most of these have NO height in OSM at all (shown as unknown). Establish what the building is from a web
search and the photographs, and give a level count off the picture rather than a height.

Note: four rows (Transition Structure, Mount Zion Baptist Church, Newcomer School, CCSF Chinatown Annex) were
briefly bailed to civic-1-hard.md by a concurrent pass because their street-level photos are misaimed (they show
neighbouring towers/mansions, not the target). Cross-checking each OSM way's own address/level tags against the
name (curl the OSM API for the way, then reverse-geocode or web-search the address) resolved all four with
reasonable confidence, so they are modelled here instead; see the note on each row.

| # | osm | name | height | style now | photos | status |
|---|---|---|---|---|---|---|
| 1 | way/123559872 | San Francisco Transition Structure | 16 m | brick | (no street photo) | modelled (transbayTransitionStructure) — OSM tags identify it directly: building:levels=3, roof=quadruple_saltbox, wikipedia=Transbay Tube. Plain brick infrastructure box, hip-like roof. |
| 2 | way/256731627 | Saint Mary's Chinese Mission | 15 m | classical | way-256731627.jpg way-256731627-2.jpg | modelled (saintMarysChineseMission) — photo confirms cream Classical Revival with portico. |
| 3 | way/288473102 | Ripley's Believe it or Not | 13 m | brick | way-288473102.jpg way-288473102-2.jpg | modelled (ripleysBelieveItOrNot) — photo confirms the scalloped red facade. |
| 4 | way/260524896 | Gold Mountain Monastery | 11 m (counted, 3 levels) | classical | way-260524896.jpg way-260524896-2.jpg | modelled (goldMountainMonastery) — photo 2 confirms the pagoda-eaved corner tower; web source describes a 3-storey ex-mattress-factory building. |
| 5 | way/263866060 | Mount Zion Baptist Church | 10 m (nave, 1 level + small tower) | classical | way-263866060.jpg way-263866060-2.jpg | modelled (mountZionBaptistChurch) — photos show only neighbouring Victorians/palm tree, but the OSM node reverse-geocodes to Baker St at Oak St, matching the well-documented 1906 Mt Zion Baptist Church at 1321 Oak St. Modelled as a modest wood-frame church since the photo can't confirm its exact facade. |
| 6 | way/162056247 | Edwin and Anita Lee Newcomer School | 14 m (counted, 4 levels) | sfapartment | way-162056247.jpg way-162056247-2.jpg | modelled (newcomerSchool, restyle sfapartment) — OSM's own addr tag is 657 Merchant St, matching photo 1's ashlar building with a fire escape (ground + 3 upper floors); photo 2 is misaimed down the block. |
| 7 | way/256072722 | City College of San Francisco Chinatown Annex | 14 m (counted, 4 levels) | chinatown | way-256072722.jpg way-256072722-2.jpg | modelled (ccsfChinatownAnnex, restyle chinatown) — OSM addr is 628 Washington St; EHDD's own project page describes "a 4-storey annex building located on Washington Street adjacent to the Colombo Building" (the 15-storey tower at 808 Kearny is a separate OSM way). Modelled as a plain 4-storey brick block. |
| 8 | way/256732461 | Nourse Theater | 16 m (counted, 1 level/auditorium) | sfapartment | way-256732461.jpg way-256732461-2.jpg | modelled (nourseTheater) — photo confirms the plain tall stucco box (ONE auditorium volume, not multiple floors) with a carved terracotta Spanish Revival entrance. |
| 9 | way/104599984 | San Francisco Fire Station 35 | 8 m (counted, 2 levels) | sfapartment | way-104599984.jpg way-104599984-2.jpg | modelled (fireStation35) — photo confirms the white 2-storey Mission/Renaissance Revival fireboat house by the Bay Bridge. |
| 10 | way/260183822 | Notre Dame Des Victoires Church | 10 m | classical | way-260183822.jpg way-260183822-2.jpg | modelled (notreDameDesVictoires) — photo confirms the ochre French Romanesque apse and campanile. |
| 11 | way/32839686 | National Maritime Museum | 10 m | brick | way-32839686.jpg way-32839686-2.jpg | modelled (nationalMaritimeMuseum) — photo confirms the white Streamline Moderne ship shape with masts. |
| 12 | way/255958555 | San Francisco Unified School District Administration | 10 m | ? | way-255958555.jpg way-255958555-2.jpg | modelled (sfusdAdministration) — OSM old_name is "High School of Commerce" (same complex as the Nourse Theater, building:levels=3); modelled to match. |
| 13 | way/256587847 | 501 Fulton Street | 9 m | classical | way-256587847.jpg way-256587847-2.jpg | modelled (fulton501, restyle stucco) — OSM tags it a Jehovah's Witness Kingdom Hall; reference photo is aimed at a neighbouring modern condo, so kept as a plain low restyle rather than inventing detail. |
