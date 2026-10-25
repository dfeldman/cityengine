# Tier 4: prominent downtown buildings still generic or refaced (2026-10-25)

Owner, 2026-10-25: "Are there other buildings in the downtown area that could use new custom renderers? Fidi, Chinatown, near city hall … All 158. Do one subagent at a time."

**Selection:** every building in SoMa by Market (Yerba Buena, Rincon, Transbay), Union Square, the Tenderloin, Civic Center, Chinatown, the FiDi's north edge (Jackson to Broadway) and lower Nob Hill that has no custom model, scoring 100 or more on height × √footprint ÷ 10, +40 OSM heritage/wikidata, +20 a DataSF historic resource, +10 named. Left out: buildings whose middle lies inside an existing custom model, and 799 Market (its reface was kept on purpose). 157 buildings, grouped into batches of up to three neighbours.

Builders go in `src/render/landmarks/sf/downtown-t4.ts`, manifest entries in `public/landmarks/san-francisco/downtown-t4.json`. Brief: [sf-batches/BRIEF-TIER3.md](sf-batches/BRIEF-TIER3.md), with those two files in place of market-fidi's. One Haiku subagent at a time.

| batch | rank | area | buildings (OSM, name, height, now) | status |
|---:|---:|---|---|---|
| 1 | 397 | SoMa by Market | `way/156123224` 5th and Mission Garage · 36 m · reface || done |
| 2 | 342 | SoMa by Market | `way/192328858` The Bay Area Metro Center · 43 m · reface || done |
| 3 | 324 | SoMa by Market | `way/6985761` (unnamed) · 97 m · reface || done |
| 4 | 314 | Union Square | `way/71504442` The Clift Royal Sonesta San Francisco · 64 m · reface || done |
| 5 | 300 | Civic Center | `way/35176131` BEI Hotel San Francisco · 58 m · reface || done |
| 6 | 291 | SoMa by Market | `way/6985617` (unnamed) · 47 m · generic || done |
| 7 | 270 | SoMa by Market | `way/80296753` 55 Hawthorne Street · 57 m · reface || done |
| 8 | 251 | Civic Center | `way/38619793` (unnamed) · 29 m · generic || done |
| 9 | 251 | SoMa by Market | `way/93817371` 633 Folsom Street · 48 m · reface || done |
| 10 | 247 | SoMa by Market | `way/1258806534` (unnamed) · 68 m · reface || done |
| 11 | 245 | Union Square | `way/19474123` (unnamed) · 24 m · generic<br>`way/19474123` (unnamed) · 24 m · generic || done |
| 12 | 242 | Civic Center | `way/35111958` 1TENth · 40 m · reface || done |
| 13 | 242 | SoMa by Market | `way/80296729` 201 Third Street · 46 m · reface || done |
| 14 | 242 | Union Square | `way/333827281` The White House Building · 32 m · reface || done |
| 15 | 241 | Chinatown | `way/29087099` (unnamed) · 30 m · reface || done |
| 16 | 226 | Union Square | `way/3095925` (unnamed) · 42 m · generic || done |
| 17 | 225 | SoMa by Market | `way/148551352` 219 Brannan Street · 53 m · reface || done |
| 18 | 224 | SoMa by Market | `way/21451853` (unnamed) · 16 m · generic || done |
| 19 | 222 | Civic Center | `way/35115837` California Institute of Integral Studies · 43 m · reface<br>`way/397182870` 1401;1415 Mission Street · 40 m · reface || done |
| 20 | 219 | Tenderloin | `way/32864968` 50 Jones · 48 m · reface || done |
| 21 | 216 | SoMa by Market | `way/25759090` 360 3rd Street · 27 m · reface || done |
| 22 | 215 | Civic Center | `way/3471533` (unnamed) · 27 m · generic<br>`way/256477871` 580 McAllister Street · 26 m · generic || done |
| 23 | 214 | SoMa by Market | `way/288716386` Museum Parc Apartments · 40 m · reface || done |
| 24 | 209 | SoMa by Market | `way/112774492` The Clancy, Autograph Collection · 50 m · reface || done |
| 25 | 203 | SoMa by Market | `way/192307107` 360 Spear Street Data Center · 34 m · generic || done |
| 26 | 203 | Chinatown | `way/12960861` (unnamed) · 30 m · generic || done |
| 27 | 202 | SoMa by Market | `way/617990577` (unnamed) · 44 m · reface || done |
| 28 | 199 | SoMa by Market | `way/148551351` 239 Brannan Street · 54 m · reface<br>`way/148551346` 229 Brannan Street · 56 m · reface || done |
| 29 | 193 | SoMa by Market | `way/112758588` 501 2nd Street · 33 m · reface || done |
| 30 | 192 | SoMa by Market | `way/1487160484` (unnamed) · 60 m · generic<br>`way/25468389` (unnamed) · 20 m · generic || done |
| 31 | 188 | SoMa by Market | `way/192026937` 120 Howard Street · 44 m · reface || done |
| 32 | 186 | SoMa by Market | `way/151980461` Mosso · 26 m · reface || done |
| 33 | 186 | Tenderloin | `way/256058407` Courtyard San Francisco Union Square · 64 m · reface<br>`way/197354891` 747 Post Street · 64 m · reface<br>`way/33570646` Alcazar Theatre · 24 m · reface || done |
| 34 | 184 | Nob Hill | `way/436474725` (unnamed) · 48 m · reface || done |
| 35 | 182 | SoMa by Market | `way/32862740` 1 Harrison Street · 33 m · reface || done |
| 36 | 170 | Civic Center | `way/35174714` 1360 Mission Street · 55 m · reface<br>`way/173237459` 1328 Mission Street · 55 m · reface || done |
| 37 | 168 | Union Square | `way/474341709` Hotel Des Arts · 55 m · reface<br>`way/135174116` Hotel Triton · 27 m · reface || done |
| 38 | 166 | Civic Center | `way/256720468` French American International School · 23 m · reface || done |
| 39 | 166 | SoMa by Market | `way/79377152` 199 New Montgomery Street · 46 m · reface<br>`way/79377194` 606;608;612 Howard Street · 26 m · generic || done |
| 40 | 165 | SoMa by Market | `way/112864753` 340 Bryant Street · 34 m · generic || done |
| 41 | 165 | Union Square | `way/149757921` 195;199 Grant Avenue · 57 m · reface || done |
| 42 | 164 | SoMa by Market | `way/113347426` 95 Hawthorne Street · 39 m · reface<br>`way/113347425` 620 Folsom Street · 31 m · reface || done |
| 43 | 164 | FiDi | `way/32947670` Saybrook University · 26 m · reface || done |
| 44 | 163 | Civic Center | `way/260140485` Kelly Cullen Community · 32 m · generic<br>`way/1258857968` 145 TL Residences · 32 m · generic || done |
| 45 | 162 | SoMa by Market | `way/4027383` (unnamed) · 36 m · generic || done |
| 46 | 160 | SoMa by Market | `way/6985869` (unnamed) · 28 m · generic || done |
| 47 | 158 | SoMa by Market | `way/132125160` Galleria Park Hotel · 32 m · reface || done |
| 48 | 158 | SoMa by Market | `way/30672537` (unnamed) · 38 m · generic || done |
| 49 | 158 | Tenderloin | `way/71739089` 840 Post Street · 40 m · generic || done |
| 50 | 158 | Union Square | `way/33571523` Mason O'Farrell Garage · 25 m · reface || done |
| 51 | 157 | SoMa by Market | `way/93817363` 600;620 Harrison Street · 24 m · reface || done |
| 52 | 156 | SoMa by Market | `way/243356609` Canopy by Hilton San Francisco SoMa · 48 m · reface || done |
| 53 | 154 | SoMa by Market | `way/173886663` 875 Howard Street · 27 m · reface | |
| 54 | 154 | Tenderloin | `way/123646088` Hotel Carlton · 38 m · reface | |
| 55 | 151 | Union Square | `way/33617520` Ellis O'Farrell Garage · 25 m · reface<br>`way/941560578` CitizenM Union Square · 44 m · reface<br>`way/147689078` The Elevated Shops Building · 24 m · reface | |
| 56 | 150 | Union Square | `way/35536720` Fashion Institute of Design and Merchandising  · 38 m · reface | |
| 57 | 149 | SoMa by Market | `way/80296763` Academy of Art University - Game Development · 31 m · reface | |
| 58 | 147 | Tenderloin | `way/260155572` 201 Turk Street · 26 m · reface | |
| 59 | 146 | SoMa by Market | `way/288648571` 2 Townsend Street · 36 m · reface | |
| 60 | 146 | Tenderloin | `way/260142631` Mosser Towers · 41 m · reface | |
| 61 | 146 | Nob Hill | `way/32947055` Brocklebank Apartments · 40 m · reface | |
| 62 | 145 | FiDi | `way/32947763` KPIX TV · 23 m · reface | |
| 63 | 142 | SoMa by Market | `way/25759093` 795 Folsom Street · 24 m · reface | |
| 64 | 140 | SoMa by Market | `way/939460954` (unnamed) · 28 m · generic | |
| 65 | 140 | SoMa by Market | `way/1389915136` Folsom Street · 36 m · generic | |
| 66 | 139 | SoMa by Market | `way/114709400` 77 Dow Place · 42 m · reface | |
| 67 | 138 | Union Square | `way/35024381` The Barnes San Francisco, Tapestry Collection  · 30 m · reface | |
| 68 | 137 | SoMa by Market | `way/38613263` (unnamed) · 21 m · generic | |
| 69 | 137 | Tenderloin | `way/288532297` Eastern Park Apartments · 36 m · reface | |
| 70 | 136 | Tenderloin | `way/260142634` Mosser Towers · 41 m · reface | |
| 71 | 135 | Tenderloin | `way/56723860` Geary Courtyard Apartments · 38 m · reface | |
| 72 | 134 | SoMa by Market | `way/288647982` 2 Townsend Street · 35 m · reface | |
| 73 | 133 | SoMa by Market | `way/421816058` 333 Main Street · 35 m · reface | |
| 74 | 133 | Union Square | `way/256499427` Orchard Hotel · 32 m · reface | |
| 75 | 132 | SoMa by Market | `way/147508936` 500 3rd Street · 23 m · reface | |
| 76 | 131 | Chinatown | `way/256072725` (unnamed) · 56 m · reface | |
| 77 | 130 | Union Square | `way/135174117` (unnamed) · 49 m · reface | |
| 78 | 130 | Chinatown | `way/288487237` North Ping Yuen · 32 m · reface | |
| 79 | 129 | SoMa by Market | `way/93817372` 645 Harrison Street · 17 m · generic | |
| 80 | 128 | Tenderloin | `way/256047252` The Salvation Army Railton Place · 32 m · reface | |
| 81 | 128 | Union Square | `way/172250614` 150 Post Street · 32 m · reface | |
| 82 | 126 | SoMa by Market | `way/151980105` 832 Folsom Street · 37 m · reface | |
| 83 | 125 | Union Square | `way/135174114` (unnamed) · 27 m · reface | |
| 84 | 124 | Civic Center | `way/1059931715` 361 TL Residences · 32 m · generic | |
| 85 | 124 | SoMa by Market | `way/346093777` Cruise · 16 m · generic | |
| 86 | 124 | Tenderloin | `way/260155577` 111 Jones Street · 26 m · generic | |
| 87 | 123 | SoMa by Market | `way/112927453` 625;635 2nd Street · 16 m · generic | |
| 88 | 123 | SoMa by Market | `way/192883910` (unnamed) · 20 m · generic | |
| 89 | 123 | Nob Hill | `way/259925713` (unnamed) · 41 m · reface | |
| 90 | 122 | SoMa by Market | `way/114709401` Consulate General of Mexico, San Francisco · 21 m · reface | |
| 91 | 122 | Union Square | `way/35024386` 347;349;351;353;357;373 Geary Street · 26 m · reface | |
| 92 | 121 | SoMa by Market | `way/79377213` Sharon Building · 33 m · reface | |
| 93 | 120 | SoMa by Market | `way/159280391` (unnamed) · 32 m · reface | |
| 94 | 119 | SoMa by Market | `way/129176911` Townsend Building · 23 m · reface<br>`way/148547440` 128 King Street · 19 m · generic | |
| 95 | 119 | SoMa by Market | `way/37057430` 650 Delancey Street · 14 m · generic | |
| 96 | 119 | Nob Hill | `way/149930902` 1000 Sutter Street · 32 m · generic | |
| 97 | 118 | SoMa by Market | `way/80296754` SFMOMA Garage · 26 m · reface | |
| 98 | 117 | SoMa by Market | `way/112774496` 600 Folsom Street · 32 m · generic | |
| 99 | 115 | SoMa by Market | `way/4023969` (unnamed) · 21 m · generic | |
| 100 | 115 | Chinatown | `way/260517113` 850 Powell Street · 37 m · reface | |
| 101 | 115 | Chinatown | `way/260519112` 720;726 California Street · 30 m · reface | |
| 102 | 114 | SoMa by Market | `way/112775864` 274 Brannan Street · 24 m · reface<br>`way/113103851` 270 Brannan Street · 12 m · generic | |
| 103 | 114 | SoMa by Market | `way/260323193` 50 Lansing Street · 26 m · generic | |
| 104 | 114 | Chinatown | `way/403167643` Chinese Hospital · 30 m · reface | |
| 105 | 113 | Civic Center | `way/35176282` 150 Hayes Street · 24 m · generic | |
| 106 | 111 | Union Square | `way/147689076` (unnamed) · 30 m · reface | |
| 107 | 110 | Tenderloin | `way/260126021` O'Farrell Towers · 36 m · reface | |
| 108 | 110 | Union Square | `way/35536855` Mabrie Facial Institute · 56 m · reface | |
| 109 | 109 | SoMa by Market | `way/113103848` 301 · 31 m · generic | |
| 110 | 109 | SoMa by Market | `way/192328863` 444;470 Spear Street · 20 m · generic | |
| 111 | 108 | SoMa by Market | `way/24335195` Moscone Center Garage · 17 m · generic | |
| 112 | 108 | Nob Hill | `way/179746912` 1199 Bush Street · 26 m · generic | |
| 113 | 108 | FiDi | `way/288481830` ABC Broadcast Center (KGO/KRON) · 12 m · reface | |
| 114 | 107 | Civic Center | `way/172111600` 41;77 Van Ness Avenue · 27 m · reface | |
| 115 | 107 | Tenderloin | `way/197354892` Warrington Apartments · 25 m · reface | |
| 116 | 106 | Tenderloin | `way/1258513962` 180 Jones Street · 36 m · generic | |
| 117 | 106 | FiDi | `way/206621049` Westlake Building · 19 m · generic | |
| 118 | 105 | SoMa by Market | `way/129176905` Arc Light Co. · 17 m · generic | |
| 119 | 105 | SoMa by Market | `way/131297949` 539 Bryant Street · 19 m · generic | |
| 120 | 105 | SoMa by Market | `way/80296706` 50 Hawthorne Street · 18 m · generic | |
| 121 | 105 | SoMa by Market | `way/112927451` 601;611;615 2nd Street · 23 m · reface | |
| 122 | 105 | SoMa by Market | `way/113103850` Gallo Building · 13 m · generic | |
| 123 | 105 | SoMa by Market | `way/114709398` (unnamed) · 24 m · generic | |
| 124 | 105 | SoMa by Market | `way/151979683` 730;740 Harrison Street · 25 m · generic | |
| 125 | 105 | Tenderloin | `way/35024322` Gaylord Suites · 38 m · reface | |
| 126 | 105 | Tenderloin | `way/35536670` St Anthony's Vera Haile Senior Housing · 32 m · reface | |
| 127 | 104 | Tenderloin | `way/259974367` 666;670 Ellis Street · 38 m · reface | |
| 128 | 103 | Civic Center | `way/258127164` 701;711 Van Ness Avenue · 21 m · generic | |
| 129 | 103 | SoMa by Market | `way/79377160` 149 New Montgomery Street · 27 m · reface | |
| 130 | 103 | Union Square | `way/48995284` 663;665;679 Sutter Street · 30 m · reface | |
| 131 | 103 | Union Square | `way/256733832` Hotel Emblem San Francisco · 22 m · reface | |
| 132 | 103 | FiDi | `way/32947691` 750 Battery Street · 25 m · reface | |
| 133 | 102 | SoMa by Market | `way/129176908` (unnamed) · 21 m · reface | |
| 134 | 102 | SoMa by Market | `way/112759870` 1 South Park · 18 m · generic<br>`way/112758589` 300 Brannan Street · 21 m · generic | |
| 135 | 102 | Chinatown | `way/260517123` Mei Lun Yuen · 30 m · reface | |
| 136 | 101 | Union Square | `way/135620233` Metropolitan Club · 23 m · reface | |
| 137 | 101 | Chinatown | `way/104627922` St. Mary's Square · 20 m · generic | |
| 138 | 100 | Civic Center | `way/165846556` 136;142;146;150;154 McAllister Street · 20 m · generic | |
| 139 | 100 | Tenderloin | `way/259990935` Presentation Senior Community · 17 m · generic | |
| 140 | 100 | Tenderloin | `way/260129390` 48;50 Golden Gate Avenue · 24 m · generic | |
