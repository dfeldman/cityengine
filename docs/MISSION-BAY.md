# Mission Bay — the district pass (started 2026-10-03)

Owner, 2026-10-03: "mission bay was actually barely in the box until we moved the border slightly south … we've put very
little effort into this area yet, even though it's full of unique prominent buildings"; "almost every building for blocks
around is highly memorable and unique. our generics don't do it justice … there should be at least 20 custom buildings in
this area, plus a renderer for the SPARK food truck park and mini golf course"; "the prominent buildings are mostly along
Mission Bay St, Owens St, and 3rd St. But almost every building on those streets is huge and unique."

Method (memory: landmark method): a Mapillary frame or two per building (`tools/photo.ts lat lon --out=…`), then a
builder in src/render/landmarks/sf/mission-bay.ts fitted to OSM's footprint (`front: "street"`), entries in
public/landmarks/san-francisco/mission-bay.json. A batch-recipe entry already claiming the building is pointed at the new
builder and the dead recipe key deleted (DISABLED MODELS table in BUGFIX-2026-10-03.md). Look at each in the renderer.

Inventory: `node --experimental-strip-types <scratch>/mbinv.ts` (204 buildings over 400 m² or 20 m in 37.7625–37.7745,
−122.3975…−122.3850). Biggest first, with what draws them now:

| way | name | h | now | status |
|---|---|---|---|---|
| 1243657270 | UCSF Pritzker Psychiatry Building, 3rd & 20th | 23 | h1 recipe at 210 m | **done** `ucsfPritzker` (#241) |
| 1256126073 | sawtooth apartments, 3rd at 20th | 15 | generic | **done** `dogpatchSawtooth` (#242) |
| 1256126075 | bronze box apartments, 3rd at 20th | 20 | generic | **done** `dogpatchBronzeBoxes` (#242) |
| 1256126074, 1256126076, 257724850 | the rest of that corner | 5–6 st | generic | todo (no usable photo yet) |
| 135103725 | Genentech Hall, 600 16th St | 30 | b9 office recipe | **done** `genentechHall` (#244) |
| 135103710 | Byers Hall, 1700 4th St | 30 | b9 office recipe | **done** `byersHall` (#244) |
| 84805700 | Gladstone Institutes, 1650 Owens | 41 | b3 lab recipe | **done** `gladstoneInstitutes` (#244) |
| 84812339 | UCSF Community Center (Rutter Center), 1675 Owens | 48? | generic | **done** `rutterCenter` (#259; from descriptions) |
| 82486636 | Community Center garage | 48? | generic | todo |
| 135103715 | Weill Neurosciences Building (OSM; not Sandler) | 29 | h1 recipe | checked 2026-10-04 — has its model |
| 135103721 | Smith Cardiovascular Research Building | 31 | generic | **done** `smithCardiovascular` (#258) |
| 142845120 | Helen Diller Family Cancer Research Building | 28 | generic | **done** `helenDiller` (#258) |
| 84808582 | Rock Hall, 1550 4th St | 23 | bauhaus, travertine (descriptions) | done 2026-10-04 |
| 255652151 | Mission Hall, 500 16th St | 26 | generic | **done** `missionHall` (#258) |
| 574616994 | Dropbox, 1800 Owens | 48 | b9 midrise recipe | **done** `dropboxOwens` (#244) |
| 24451951 | UCSF Medical Center (hospital), 1825 4th St | 24 | generic | **done** `ucsfMissionBayHospital` + `ucsfMbCanopy` (#273) |
| 1047709622/23 | Uber HQ buildings 1 and 2, 1515/1455 3rd | 32/54 | restyle / uberHq | check |
| 84808580 | 450 South Street Garage (Chase Center) | 20 | generic | **done** `garage450South` (#259; from description) |
| 142843006 | Owens Street Garage | 29 | owensGarage | done |
| 27369503 | Third Street Garage | 25 | thirdStreetGarage (Mapillary) | done 2026-10-04 |
| 46263441 | 1670 Owens Garage | 16 | owens1670Garage | done |
| 135103722 | "Hearst Tower" (residential, 60 m) | 60 | b9 office recipe | check |
| 135103716 | Strata, 555 Mission Rock | 32 | bauhaus, white + blue (Mapillary, Mission Rock stop) | done 2026-10-04 |
| 16085213 | Five 88 | 16 | five88 (descriptions) | done 2026-10-04 |
| 84808588 | UCSF Mission Bay Housing North | 30 | towerblock tan + blue (Mapillary) | done 2026-10-04 |
| 48569995 | Arterra, 300 Berry | 57 | haiku restyle (white, orange, blue) | ok as is |
| 46264111/2, 56656114/9 | Edgewater, Park Terrace, Mission Walk (Berry St, on the creek) | 19–23 | generic | **restyled** from Mapillary (#294): red siding / white with blue bays and orange accents / white and dark grey |
| 189142019 | Edwin M. Lee Apartments, 1150 3rd | 20 | generic | **restyled** (#294): blue-grey metal over a concrete band and glass base |
| 18852525 | MB360, 1200 4th | 14 | mb360 (descriptions) | done 2026-10-04 |
| 218159149 | San Francisco Flower Market, 901 16th | 10 | bauhaus charcoal (Mapillary) | done 2026-10-04 |
| 579646390 | Chase Center | 38 | chaseCenter | exists (owner: "rather boring", fine) |
| — | SPARK Social SF (food trucks, umbrellas, tent pavilions, shade sails) | — | OSM's small structures as brick | **done** (#245) |
| — | Stagecoach Greens mini golf | — | nothing | **done** `stagecoachGreens` (#245) |
| — | the five park blocks along Mission Bay Blvd (two built-up, one soccer, two grass and trees) | — | SPARK Social and Stagecoach Greens modelled (mission-bay.ts); the soccer and grass blocks from OSM areas | done |

Rule learned (#242): place facade features with `frontWall(fit)` — on the real street edge — never at `fit.hz`.
Audits include AERIAL views (owner).
