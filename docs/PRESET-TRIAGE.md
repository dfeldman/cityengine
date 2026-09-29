# Presets standing in for buildings — triage list

**OWNER-TRIAGED 2026-09-23. Result: 2 of 216 need work.** Read this before using the tables below.

The tables are sorted by `kind = civic`, and **that sort key is wrong**. The owner went through tier 1 and
rejected almost all of it:

> *"first chinese baptist, SFJAZZ, Rincon Annex, Academy of Art University, great american, 4th and king,
> pier 24… those actually all ARE basically rectangular… they may be of civic importance but their exterior
> architecture is boring. The fellowship church and st mary church are genuinely church shaped."*

For a rectangular concert hall, university or railway terminus a recipe is the correct and cheap answer;
unusual colour and window rhythm are kit PARAMETERS, not reasons to hand-model.

**But do not read 2/216 as "the category is useless."** These 216 are not a random sample — they are the
buildings a capable model *chose* a recipe for, and it was largely choosing well. The number measures that
judgement, not the predictive value of `kind`. The one real failure here (the Children's Creativity Museum)
**is** civic, and sorting by civic is what surfaced it.

**Form decides. Category is a cheap and useful place to LOOK.** Neither replaces the other — and a sweep of
presets chosen by a cheaper tier or a deterministic rule should be expected to miss far more than this one
did.

**The right signal is FORM**, and it is the one the kit's own bail-out rules already use
(`docs/sf-batches/MODEL-A-BATCH-E14.md`): curved or round plan, massing that changes with height, per-bay
depth variation, vaulted/domed/shell roof, geometry outside the footprint, two unrelated buildings in one
footprint.

### The two that survived triage — both re-staged `done` → `manual`, priority 600

| osm | name | why | tool |
|---|---|---|---|
| `way/260991572` | The Church For the Fellowship of All People | genuinely church-shaped | `church()` kit |
| `way/261608748` | Saint Mary the Virgin Episcopal Church | genuinely church-shaped | `church()` kit |

Churches are the exception **not because they are institutions but because they are shaped differently** —
nave, aisles, tower, apse. That is why `church()` exists. Neither needs scratch modelling; both need the kit
they predate.

### Confirmed fine by the owner, do not revisit

First Chinese Baptist Church, SFJAZZ Center, Rincon Annex, Academy of Art University, Great American Music
Hall, 4th & King Street Station, Pier 24.

---

## The raw listing (sort key known-wrong; kept for reference)

## Tier 1 — CIVIC / institutions (16). Highest suspicion.

An institution answered by a recipe is the exact #140 failure. `docs/INSTITUTIONS.md` says these are priority
and the step-0 reface gate already forbids styling them; a bare `spec()` is the same mistake one rung up.

| osm | name | h | stage | builder | file |
|---|---|---|---|---|---|
| `way/944990390` | One Rincon Hill |  m | scratch | `oneRinconHill` | ring-tower.ts |
| `way/44106213` | Rincon Annex | 33 m | scratch | `rinconAnnex` | rebuild-e15.ts |
| `way/421816060` | LUMINA I |  m | scratch | `luminaI` | fidi-4.ts |
| `way/421816059` | LUMINA II |  m | scratch | `luminaII` | fidi-4.ts |
| `way/288647269` | The Metropolitan Tower I |  m | scratch | `metropolitanTowerI` | fidi-4.ts |
| `way/288647262` | The Metropolitan Tower II |  m | scratch | `metropolitanTowerII` | fidi-4.ts |
| `way/79377186` | St. Regis Museum Tower |  m | scratch | `stRegisMuseumTower` | fidi-3.ts |
| `way/288716388` | Children's Creativity Museum | 10 m | scratch | `childrensCreativityMuseum` | model-opus.ts |
| `way/435582543` | Westin St. Francis Tower |  m | done | `westinTower` | ring-tower.ts |
| `way/435591307` | Four Seasons Tower |  m | done | `fourSeasonsTower` | market-mid.ts |
| `way/436648856` | Hyatt Regency Downtown SOMA |  m | done | `hyattSomaTower` | market-mid.ts |
| `way/132238423` | Spear Tower |  m | haiku | `spearTower` | fidi-4.ts |
| `way/132238431` | Steuart Tower |  m | done | `steuartTower` | fidi-3.ts |
| `way/123559872` | San Francisco Transition Structure | 16 m | done | `transbayTransitionStructure` | civic-1.ts |
| `way/66642926` | First Chinese Baptist Church | 14 m | done | `firstChineseBaptistChurch` | tierA-1.ts |
| `way/256720482` | SFJAZZ Center | 13 m | done | `sfjazzCenter` | tierA-5.ts |
| `way/104599984` | San Francisco Fire Station 35 | 0 m | done | `fireStation35` | civic-1.ts |
| `way/93420060` | Academy of Art University | 12 m | done | `academyOfArtUniversity` | tierA-2.ts |
| `way/113631370` | DMV San Francisco | 8 m | done | `dmvSanFrancisco` | tierA-2.ts |
| `way/186071977` | Pier 24 | 9 m | done | `pier24` | piers.ts |
| `way/35095789` | Tenderloin Police Station | 6 m | done | `tenderloinPoliceStation` | tierA-2.ts |
| `way/260131753` | Great American Music Hall | 12 m | done | `greatAmericanMusicHall` | model-1.ts |
| `way/260991572` | The Church For the Fellowship of All People | 13 m | done | `churchForFellowshipOfAllPeoples` | tierA-2.ts |
| `way/261608748` | Saint Mary the Virgin Episcopal Church | 8 m | done | `stMaryTheVirginEpiscopalChurch` | tierA-3.ts |
| `way/28295229` | San Francisco 4th & King Street | 5 m | done | `sf4thKingStreetStation` | tierA-1.ts |
| `way/36950390` | San Francisco Fire Station 10 | 0 m | done | `sfFireStation10` | tierA-2.ts |
| `way/579664204` | 1051 3rd Street | 7 m | done | `thirdStreetSubstation` | tierA-6.ts |

## Tier 2 — NAMED tall buildings (183).

A name means somebody recognises it. Worth a glance; many will still be fine.

| osm | name | h | stage | builder | file |
|---|---|---|---|---|---|
| `way/445566153` | 181 Fremont | 244 m | sonnet | `fremont181` | ring-tower.ts |
| `way/588355355` | California Center (345 California) | 212 m | done | `californiaCenter345` | hard-1.ts |
| `way/72963089` | Millennium Tower | 197 m | done | `millenniumTower` | ring-tower.ts |
| `way/693629257` | 488 Folsom Street | 188 m | done | `fourEightyEightFolsom` | fidi-3.ts |
| `way/1279505488` | 101 California | 183 m | done | `oneOhOneCalifornia` | ring-tower.ts |
| `way/288716396` | 50 Fremont Center | 183 m | sonnet | `fiftyFremontCenter` | fidi-1.ts |
| `way/611390934` | Park Tower at Transbay | 183 m | scratch | `parkTowerTransbay` | fidi-1.ts |
| `way/32963382` | Chevron Tower | 175 m | sonnet | `chevronTower` | fidi-1.ts |
| `way/32612608` | Embarcadero Center 1 | 173 m | done | `embarcaderoCenter` | ring-tower.ts |
| `way/148710877` | One Front Street | 171 m | done | `oneFrontStreet` | fidi-1.ts |
| `way/32946570` | First Market Tower | 169 m | done | `firstMarketTower` | fidi-1.ts |
| `way/32946671` | McKesson Plaza | 161 m | done | `onePostStreet` | market-mid.ts |
| `way/693632325` | Four Seasons Private Residences at 706 Mission Street | 160 m | done | `fourSeasons706Mission` | fidi-4.ts |
| `way/260291405` | Pacific Gas & Electric Building | 154 m | done | `pgeBuilding` | fidi-1.ts |
| `way/148716020` | One Montgomery Tower | 152 m | done | `oneMontgomeryTower` | market-mid.ts |
| `way/132125167` | 333 Bush | 151 m | done | `threeThreeThreeBush` | fidi-1.ts |
| `way/80296761` | 555 Mission Street | 148 m | done | `fiveFiveFiveMission` | fidi-1.ts |
| `way/260520160` | 650 California Street | 142 m | haiku | `sixFiftyCalifornia` | fidi-1.ts |
| `way/32862919` | Providian Financial Building (201 Mission) | 138 m | done | `mission201` | hard-1.ts |
| `way/251587650` | 399 Fremont | 134 m | done | `threeNinetyNineFremont` | fidi-4.ts |
| `way/260925344` | 505 Montgomery Street | 134 m | done | `montgomery505` | hard-1.ts |
| `way/438098525` | 500 Folsom | 134 m | done | `fiveHundredFolsom` | fidi-3.ts |
| `way/359267373` | 340 Fremont Street | 134 m | done | `threeFortyFremont` | fidi-3.ts |
| `way/129142347` | Russ Building | 133 m | done | `russBuilding` | ring-tower.ts |
| `relation/6483285` | San Francisco Marriott Marquis | 133 m | scratch | `marriottMarquis` | ring-tower.ts |
| `way/192026933` | 123 Mission Street | 133 m | haiku | `oneTwentyThreeMission` | fidi-1.ts |
| `way/421816061` | The Infinity II | 132 m | done | `infinityII` | fidi-4.ts |
| `way/227689990` | Jasper | 131 m | done | `jasper` | tierA-4.ts |
| `way/226514310` | 350 Mission Street | 129 m | done | `threeFiftyMission` | fidi-1.ts |
| `way/939499092` | MIRA (Folsom wing) | 129 m | done | `miraPodium` | model-tall.ts |
| `way/79377216` | JPMorgan Chase Building | 128 m | done | `jpMorganChase` | fidi-1.ts |
| `way/160673823` | Paramount | 127 m | done | `paramount` | fidi-3.ts |
| `way/33790323` | Fox Plaza | 126 m | done | `foxPlaza` | model-3.ts |
| `way/288512967` | Parc 55 | 125 m | done | `parc55` | ring-tower.ts |
| `way/941649701` | 595 Market Street | 125 m | sonnet | `fiveNinetyFiveMarket` | market-mid.ts |
| `way/132125159` | 101 Montgomery | 123 m | done | `montgomery101` | hard-1.ts |
| `way/32859640` | 601 California Street | 122 m | done | `sixZeroOneCalifornia` | fidi-1.ts |
| `way/118480404` | Hyatt Regency Downtown SOMA | 122 m | done | `hyattSomaTower` | market-mid.ts |
| `way/693627612` | 1500 Mission | 121 m | scratch | `fifteenHundredMissionRebuilt` | rebuild-e15.ts |
| `way/421816062` | The Infinity I | 117 m | done | `theInfinityI` | fidi-3.ts |
| `way/441638842` | Spera | 116 m | done | `spera` | fidi-4.ts |
| `way/260282390` | Shell Building | 115 m | done | `shellBuilding` | ring-tower.ts |
| `way/127460048` | 535 Mission Street | 115 m | done | `fiveThreeFiveMission` | fidi-1.ts |
| `way/192883913` | 199 Fremont | 115 m | done | `fremont199` | hard-1.ts |
| `way/151183779` | 456 Montgomery Street | 114 m | done | `fourFiftySixMontgomery` | fidi-1.ts |
| `way/256042681` | UC Law San Francisco McAllister Tower | 114 m | done | `mcallisterTower` | tierA-5.ts |
| `way/260283289` | 401;425 California Street | 109 m | scratch | `fourZeroOneCalifornia` | fidi-1.ts |
| `way/436477702` | Fairmont Hotel Tower | 108 m | pending | `fairmontHotelTower` | tierA-6.ts |
| `way/132125166` | 100 Montgomery | 108 m | done | `hundredMontgomery` | market-mid.ts |
| `way/80296717` | LinkedIn | 106 m | done | `linkedinTower` | fidi-3.ts |
| `way/256065251` | 50 Beale Street | 105 m | done | `fiftyBeale` | fidi-1.ts |
| `way/256029743` | Intercontinental San Francisco | 104 m | scratch | `interContinentalSF` | model-opus.ts |
| `way/132125163` | 130 Montgomery Street | 104 m | done | `oneThirtyMontgomery` | fidi-1.ts |
| `way/192026935` | 135 Main Street | 104 m | done | `oneThirtyFiveMain` | fidi-1.ts |
| `way/256072715` | 655 Montgomery Street | 103 m | done | `montgomeryWashingtonTower` | model-tall.ts |
| `way/32859357` | Commercial Union Assurance Building | 101 m | scratch | `commercialUnionAssurance` | fidi-1.ts |
| `way/1279447597` | 150 California Street | 101 m | done | `oneFiftyCalifornia` | fidi-2.ts |
| `way/79377189` | 55 Second Street | 100 m | done | `fiftyFiveSecond` | fidi-2.ts |
| `way/257026417` | Royal Towers | 100 m | done | `royalTowers` | russian-hill.ts |
| `way/113347427` | 75 Hawthorne Street (Hawthorne Plaza) | 99 m | scratch | `seventyFiveHawthorne` | tierA-1.ts |
| `way/80296724` | 101 2nd Street | 99 m | done | `oneOOneSecondStreet` | fidi-3.ts |
| `way/32947408` | 350 Sansome Street | 99 m | done | `threeFiftySansome` | fidi-2.ts |
| `way/148741786` | 580 California Street | 98 m | done | `fiveEightyCalifornia` | fidi-2.ts |
| `way/1309156966` | 301;305;315 Howard Street | 97 m | scratch | `threeZeroOneHoward` | fidi-2.ts |
| `way/80296747` | W San Francisco | 96 m | sonnet | `wSanFrancisco` | tierA-2.ts |
| `way/35176305` | Phillip Burton Federal Building & United States Courthouse | 95 m | scratch | `phillipBurtonFederal` | tierA-5.ts |
| `way/942664247` | Hunter-Dulin Building | 94 m | done | `hunterDulinBuilding` | market-mid.ts |
| `way/192026938` | 100 Spear Street | 94 m | scratch | `oneHundredSpear` | fidi-2.ts |
| `way/260924224` | 555 Montgomery Street | 93 m | done | `montgomery555` | model-opus.ts |
| `way/256487834` | Martin Luther Tower | 93 m | done | `martinLutherTower` | tierA-1.ts |
| `way/260318171` | Optimizely, Inc. | 93 m | done | `optimizely` | fidi-4.ts |
| `way/1361492525` | InterContinental Mark Hopkins | 93 m | done | `intercontinentalMarkHopkins` | tierA-3.ts |
| `way/32862406` | The Towers at Rincon | 93 m | done | `towersAtRincon` | fidi-3.ts |
| `way/260318174` | 633;639 Howard Street | 93 m | manual | `howardStreetTower` | model-1.ts |
| `way/256066232` | Mills Tower | 92 m | done | `millsTower` | fidi-2.ts |
| `way/132127810` | Central Tower | 91 m | done | `centralTower` | market-mid.ts |
| `way/93817368` | 2 Folsom Street | 91 m | scratch | `twoFolsomStreet` | fidi-4.ts |
| `way/32946353` | 601 Montgomery Street | 91 m | done | `sixZeroOneMontgomery` | fidi-2.ts |
| `way/256487823` | Cathedral Hill Tower | 90 m | done | `cathedralHillTower` | model-2.ts |
| `way/260286865` | 290 Battery Street | 90 m | done | `twoNinetyBattery` | fidi-2.ts |
| `way/256076607` | 555 Pine Street | 90 m | done | `fiveFiveFivePine` | fidi-2.ts |
| `way/260286440` | 430;432;444 California Street | 89 m | done | `fourThirtyCalifornia` | fidi-2.ts |
| `way/1351029672` | Twelve Hundred California | 88 m | done | `twelveHundredCalifornia` | tierA-6.ts |
| `way/80296766` | 140 New Montgomery | 88 m | done | `oneFortyNewMontgomery` | fidi-4.ts |
| `way/225384420` | 1188 Mission Street | 87 m | scratch | `elevenEightyEightMission` | tierA-2.ts |
| `way/32946628` | Hobart Building | 86 m | done | `hobartBuilding` | fidi-2.ts |
| `way/154217696` | The Charles Schwab Building | 85 m | done | `charlesSchwabBuilding` | fidi-4.ts |
| `way/1474572306` | 400 Beale Street | 85 m | done | `fourHundredBeale` | fidi-3.ts |
| `way/288645261` | 83m tower | 83 m | done | `unnamedEightyThreeMeterTower` | tierA-6.ts |
| `way/1279504249` | Matson Building | 83 m | done | `matsonBuilding` | fidi-2.ts |
| `way/260291406` | PG&E General Office Building Annex | 83 m | done | `pgeAnnex` | fidi-2.ts |
| `way/149837280` | 25 Jessie Street | 83 m | done | `twentyFiveJessie` | fidi-2.ts |
| `way/112774488` | Blu Condos | 82 m | done | `bluCondos` | tierA-6.ts |
| `way/32859284` | 475 Sansome Street | 82 m | done | `fourSeventyFiveSansome` | fidi-3.ts |
| `way/35182441` | The Jay, Autograph Collection | 81 m | manual | `theJayAutograph` | fidi-4.ts |
| `way/944032191` | 351 California Street | 81 m | done | `threeFiftyOneCalifornia` | fidi-3.ts |
| `way/288645263` | 201 Spear | 81 m | done | `twoOOneSpear` | fidi-3.ts |
| `way/262480462` | The Summit | 80 m | done | `theSummit` | russian-hill.ts |
| `way/192026939` | 150 Spear Street | 80 m | sonnet | `oneFiftySpearStreet` | fidi-4.ts |
| `way/260930240` | the Gateway vistaSouth | 78 m | done | `gatewayVistaSouth` | fidi-4.ts |
| `way/32612241` | 155 Jackson Street | 78 m | done | `oneFiftyFiveJackson` | fidi-3.ts |
| `way/288500664` | Grosvenor Suites | 78 m | done | `grosvenorSuites` | model-1.ts |
| `way/288714525` | 221 Main Street | 76 m | done | `twoTwentyOneMain` | fidi-3.ts |
| `way/105027010` | 501 Beale Street | 75 m | done | `fiveOOneBeale` | model-2.ts |
| `way/260282401` | 160;180 Sansome Street | 75 m | done | `oneSixtySansome` | fidi-4.ts |
| `way/288645692` | 388 Beale | 75 m | done | `threeEightyEightBeale` | fidi-3.ts |
| `way/256749839` | Nob Hill Community Apartments | 74 m | done | `nobHillCommunityApartments` | tierA-6.ts |
| `way/72013921` | Carillon Tower | 74 m | done | `carillonTower` | model-3.ts |
| `way/32859283` | Two Transamerica Center | 74 m | done | `twoTransamericaCenter` | fidi-4.ts |
| `way/260520157` | 600 California Street | 74 m | done | `sixHundredCalifornia` | fidi-3.ts |
| `way/1204801756` | The Canyon | 73 m | done | `theCanyon` | model-3.ts |
| `way/1204801749` | Verde | 73 m | done | `verde` | model-3.ts |
| `way/259920940` | Cathedral Apartments | 73 m | done | `cathedralApartments` | model-2.ts |
| `way/113096845` | 246 2nd Street | 73 m | done | `twoFortySixSecond` | tierA-2.ts |
| `way/93817366` | 611 Folsom Street | 71 m | done | `sixElevenFolsom` | model-2.ts |
| `way/80296718` | 680 Folsom Street | 70 m | done | `sixEightyFolsom` | model-2.ts |
| `way/71209418` | The Hamilton | 70 m | done | `theHamilton` | model-2.ts |
| `way/288499675` | Clay-Jones Apartments | 70 m | done | `clayJonesApartments` | model-2.ts |
| `way/259065179` | Bellaire Tower | 70 m | done | `bellaireTower` | russian-hill.ts |
| `way/32859862` | 200;204;206 Sansome Street | 69 m | done | `twoHundredSansome` | fidi-4.ts |
| `way/256998550` | Pacific Heights Towers | 68 m | done | `pacificHeightsTowers` | model-3.ts |
| `way/256066242` | 250 Montgomery | 68 m | done | `twoFiftyMontgomery` | fidi-3.ts |
| `way/32859152` | the Gateway vistaWest | 67 m | done | `gatewayVistaWest` | fidi-4.ts |
| `way/667097308` | One Steuart Lane | 67 m | done | `oneSteuartLane` | fidi-4.ts |
| `way/32947577` | the Gateway East Tower | 67 m | done | `gatewayEastTower` | fidi-3.ts |
| `way/32946675` | de Young Building | 66 m | done | `deYoungBuilding` | market-mid.ts |
| `way/255960469` | 1155 Market Street (LightHouse) | 65 m | done | `greenGlassTower` | market-west.ts |
| `way/79377197` | 90 New Montgomery Street | 65 m | done | `ninetyNewMontgomery` | fidi-4.ts |
| `way/151185876` | 350 Bush St. | 65 m | done | `threeFiftyBush` | fidi-3.ts |
| `way/256072706` | City College of San Francisco (CCSF) North Beach / Chinatown | 65 m | done | `ccsfChinatownNorthBeach` | fidi-3.ts |
| `way/1204801755` | Visa | 64 m | done | `visaMissionRock` | model-3.ts |
| `way/1392472204` | The Comstock | 62 m | done | `comstock` | model-3.ts |
| `way/112774489` | 303 Second Street | 62 m | done | `threeOThreeSecondStreet` | model-2.ts |
| `way/262741037` | 1080 Chestnut Street | 62 m | done | `tenEightyChestnut` | russian-hill.ts |
| `way/332627661` | Hotel Zetta San Francisco | 62 m | done | `hotelZetta` | tierA-2.ts |
| `way/226283225` | 1190 Mission Street | 62 m | done | `elevenNinetyMission` | tierA-2.ts |
| `way/1279459281` | Omni San Francisco Hotel | 62 m | done | `omniSanFranciscoHotel` | fidi-4.ts |
| `way/256757158` | 1475 O'Farrell Street | 61 m | done | `ofarrell1475` | model-3.ts |
| `way/142845124` | Madrone Mission Bay | 61 m | done | `madroneMissionBay` | model-3.ts |
| `way/256067740` | California Bank and Trust | 61 m | done | `californiaBankAndTrust` | fidi-3.ts |
| `way/944025916` | Embarcadero-area residential tower | 61 m | sonnet | `embarcaderoResidential` | tierA-5.ts |
| `way/149253142` | 250 King Street | 60 m | done | `king250` | model-3.ts |
| `way/288671185` | The Beacon | 60 m | done | `theBeacon` | model-3.ts |
| `way/132125157` | Alexander Building | 60 m | sonnet | `alexanderBuilding` | fidi-4.ts |
| `way/32863010` | The Spear | 60 m | done | `theSpear` | tierA-4.ts |
| `way/32612487` | 100 California Street | 59 m | done | `oneHundredCalifornia` | tierA-3.ts |
| `way/192026934` | 180 Howard Street | 57 m | done | `oneEightyHoward` | tierA-2.ts |
| `way/32839432` | Fontana East | 55 m | done | `fontanaEast` | tierA-6.ts |
| `way/173237465` | 1338 Mission Street | 55 m | done | `thirteenThirtyEightMission` | tierA-1.ts |
| `way/173237467` | 1340 Mission Street | 55 m | done | `thirteenFortyMission` | tierA-1.ts |
| `way/256066241` | Stock Exchange Tower | 55 m | done | `stockExchangeTower` | tierA-3.ts |
| `way/256733612` | 1310 Mission Street | 55 m | done | `thirteenTenMission` | tierA-3.ts |
| `way/71504456` | Hotel Spero | 55 m | done | `hotelSpero` | tierA-3.ts |
| `way/256733611` | 98 9th Street | 55 m | done | `ninetyEightNinthStreet` | tierA-4.ts |
| `way/243571751` | Edith Witt Senior Community | 55 m | done | `edithWittSenior` | tierA-5.ts |
| `way/256029754` | Pacific Building | 54 m | done | `pacificBuilding` | market-mid.ts |
| `way/332381174` | 70 4th Street | 54 m | done | `seventyFourthStreet` | tierA-4.ts |
| `way/256066233` | 115 Sansome Street | 53 m | done | `oneFifteenSansome` | tierA-1.ts |
| `way/256067714` | 233;241 Sansome Street | 53 m | done | `twoThirtyThreeSansome` | tierA-3.ts |
| `way/944032189` | 311 California Street (Robert Dollar Building) | 51 m | done | `robertDollarBuilding` | tierA-1.ts |
| `way/24306412` | Moscone Center West | 50 m | done | `mosconeWest` | ring-tower.ts |
| `way/132127809` | Hearst Building | 49 m | done | `hearstBuilding` | market-mid.ts |
| `relation/1547963` | Flood Building | 49 m | done | `floodBuilding` | market-mid.ts |
| `way/149335987` | Mutual Savings Bank Building | 47 m | done | `mutualSavingsBank` | market-mid.ts |
| `relation/3492808` | Mills Building | 47 m | done | `millsBuilding` | tierA-5.ts |
| `way/24446086` | San Francisco Main Library | 46 m | done | `mainLibrary` | market-west.ts |
| `way/284932384` | 1400 Mission | 46 m | done | `fourteenHundredMission` | model-1.ts |
| `way/262482831` | 1000 Green Street | 45 m | done | `oneThousandGreen` | russian-hill.ts |
| `way/260286437` | 260 California Street | 45 m | done | `twoSixtyCalifornia` | tierA-2.ts |
| `way/940206561` | The Civic | 44 m | done | `theCivic` | tierA-1.ts |
| `relation/1547962` | Phelan Building | 42 m | done | `phelanBuilding` | market-mid.ts |
| `way/151195285` | 222 Kearny Street | 42 m | done | `twoTwentyTwoKearny` | tierA-2.ts |
| `way/32947355` | 530;540;546;550 Kearny Street | 42 m | done | `kearnyStreetBlock` | tierA-4.ts |
| `way/260286436` | 343 Sansome Street | 41 m | done | `threeFortyThreeSansome` | tierA-2.ts |
| `way/151183782` | 417 Montgomery Street | 41 m | done | `fourSeventeenMontgomery` | tierA-3.ts |
| `way/256067738` | Royal Insurance Building | 41 m | done | `royalInsuranceBuilding` | tierA-3.ts |
| `way/173725096` | Mint Plaza | 39 m | done | `mintPlaza` | tierA-4.ts |
| `way/151195282` | 108;110 Sutter Street | 39 m | done | `oneOhEightSutter` | tierA-5.ts |
| `way/260283288` | 330;332 Pine Street | 38 m | done | `orientBuilding` | tierA-5.ts |
| `relation/3492933` | Palace Hotel | 37 m | done | `palaceHotel` | market-mid.ts |
| `relation/2013691` | Monadnock Building | 36 m | done | `monadnockBuilding` | market-mid.ts |
| `way/151195272` | 240;244 Kearny Street | 36 m | done | `twoFortyKearny` | tierA-1.ts |
| `way/256068381` | 552 Montgomery Street | 35 m | done | `bankOfItaly` | tierA-5.ts |

## Tier 3 — unnamed tall buildings (6)

Almost certainly fine. A recipe is the correct treatment for an anonymous tower. Listed for completeness only;
do not spend on these.

