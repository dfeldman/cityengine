# Notable-building model queue (2026-10-15)

One building at a time, each from a full evidence pack (`MODEL-<name>.md`: OSM incl. parts, LiDAR, Assessor,
Mapillary + Commons photos, Wikipedia — every source a claim; the photographs are the ground truth). Before each:
grep for an existing model under another name/id, check it is really notable and really standing. Sonnet for simple
buildings, Opus for complex ones. Every result is looked at against the photographs before it ships.

Priority = how much of the city sees it × how wrong it is now.

## A. Unmodelled (docs/sf-batches/NOTABLE-UNMODELLED.md)

| # | building | status |
|---|---|---|
| 1 | Temple Emanu-El, 2 Lake St (relation/3654752 + dome part) | in progress (Opus) |
| 2 | The Ritz-Carlton, 600 Stockton (relation/14543549) — Ionic colonnade, pediment | evidence gathered |
| 3 | Pier 43 Ferry Arch (way/288472570) | |
| 4 | Malloch Building, Telegraph Hill (way/262076706) — Streamline Moderne | |
| 5 | St. Joseph's Hospital (way/247760730) — Art Deco | interim restyle (TALL-03) |
| 6 | YWCA Apartments, Julia Morgan (way/260523197) | interim restyle (TALL-05) |
| 7 | Rialto Building (way/79377215) | interim restyle (TALL-02) |
| 8 | Fourth Church of Christ, Scientist (way/38092130) | |
| 9 | Theatres: Northpoint (way/197397824), Red Vic (way/223616922), Grandview (way/256732471), Surf (way/277806435) | |
| 10 | Paige Motor Car Co. Building (way/257946618) | |

Not modelling: chain hotels with no architectural interest (Hotel Zephyr, Hyatt Centric, Marriott Wharf), offices
whose Wikidata entry is the tenant company (Plaid, CRV, UserTesting), anything outside the bake.

## B. Haiku-tier models of notable buildings (b*/h*/s1/batch-1006): review → redo only the clearly poor, prominent ones

Review sheets: model shots beside a Mapillary photo, graded fine / minor (manifest fix) / wrong (redo).

Reviewed 2026-10-15 (sheets: model corner view beside a Mapillary photo, all 106). Heights in the city are right
(spot-checked Castagnola's, Dolphin Club, Fugazi); the fault is a generic grey office box where the building has a
face of its own. Redo, in order (landmark × how much of the city sees it):

| # | building | entry | why |
|---|---|---|---|
| B1 | Spreckels Mansion | h4 `spreckelsMansion` | BROKEN: its columns float detached in front of the house |
| B2 | Fugazi Bank Building (Columbus/Montgomery) | h2 `fugaziBank` | ornate white corner bank drawn as a grey office recipe |
| B3 | California Historical Society (Whittier Mansion) | h2 `californiaHistoricalSociety` | red sandstone mansion drawn as an office block |
| B4 | Pacific Exchange (301 Pine) | b5 `b5_bank_256066230` | plain stone grid; the giant columns and Stackpole statues are missing |
| B5 | Bohemian Club | h2 `bohemianClub` | ivy-covered brick club drawn as an office recipe |
| B6 | Audiffred Building | h4 `h4_audiffredBuilding` | 1889 brick with mansard drawn as a glass-base box |
| B7 | Alhambra Theatre (Polk) | b6 `b6_theatre_206662303` | Moorish front and marquee missing |
| B8 | Victoria Theatre / Swedish American Hall / Olympic Club / Ocean Climate Center | b6/b6/b4/b11 | |

Re-checked at full size: the Old Mint (BANK_TEMPLES override: Doric portico) and The Cannery (arched brick) are
fine — the review thumbnails were too small to judge; always confirm at full size.

Acceptable as they are (gist right): Women's Building, Castro Theatre, San Francisco Mint (1937), Old Federal
Reserve Bank, Presidio chapel, Yerba Buena lighthouse, carousel. Alcatraz/Treasure Island quarters/Mile Rocks:
generic but out of the way — later.

## Done 2026-10-15 (one at a time, each checked in model shots AND in the city)

Temple Emanu-El · The Ritz-Carlton · Pier 43 Ferry Arch · Malloch Building · Fugazi Bank (redo) · Pacific Exchange
(redo) · Whittier Mansion (redo) · Bohemian Club (redo) · Spreckels Mansion (repair) · Audiffred Building (redo) ·
Alhambra Theatre (redo) · YWCA 940 Powell · St. Joseph's Hospital.

Open questions: St. Joseph's — which end carries the taller pavilion is unconfirmed (one photo, from one side).
Lesson: measure which side of the building its street is on (scratchpad side.ts against the street graph) before
writing a pack's `front` — two packs had it wrong by guess (Pacific Exchange, Alhambra/YWCA).
Lesson 2: `tools/model-shots.ts`'s auto cameras look from the fit's +z side, but the city puts the manifest `front`
bearing on −z — so the auto "front" shot shows the BACK. Every pack must say: front on the ring edge facing −z,
check it with an explicit `--view=<name>:-1.5708,1.5,40,0,8,0`. (Swedish American Hall was first built facing +z.)
Lesson 3: brick renders much brighter/oranger in the city than in the shots — specify brick ≈ 30 % darker than the photo.
Lesson 4: when an entry claims building:parts, give the agent each part's POLYGON (evidence.py lists only centres/areas) — The Pacific's parts had to be approximated.

Also done 2026-10-15 (evening): Rialto Building · Internet Archive (Fourth Church) · Paige Motor Car Co. · Olympic
Club (redo) · Victoria Theatre (redo) · Swedish American Hall (redo) · 650 Townsend (Zynga) · The Pacific ·
arched-crown office on King (way/149167950) · 510 Townsend (Stripe) · China Basin Landing (2) · 8th & Brannan zinc
apartments · 200 Brannan · 235 Second · 1650 Mission · Hotel Metropolis · The Chateau · 2400 Pacific.

Next in line (photo-pass model-worthy, by prominence): way/1047709622 and the Mission Bay glass offices
(84821722, 84812340, 84821715 — judgement calls, maybe restyles), 93817363, 288719494, 681442041, 113347425,
25759093, 1185421909, 71504453 (Beaux-Arts hotel cornice), 256479475; theatres Northpoint/Red Vic/Grandview/Surf;
Ocean Climate Center (b11) and the Alcatraz/Treasure Island Haiku models. Open: Hotel VIA height (22 m model vs
~38 m), The Oak (5 vs 12 storeys), St. Joseph's pavilion end.
Resolved by the owner 2026-10-15: Hotel VIA = 2-storey lobby + 10 room floors + mechanical floor (now 44 m; its
glass-tower recipe still deserves a proper model showing those three parts); The Oak = 12 storeys (now 38 m).

## Done 2026-10-16 (night, owner's reports + queue)

Embarcadero Center podiums on Davis · Ferry Building (signs + tower/pavilion rework) · Hilton Financial District
(reshaped, moved onto its tower part) · 2 Folsom / Gap HQ (Opus) · Hotel VIA (proper model) · Webster St footbridge ·
Sing Chong, Sing Fat, Chinese Telephone Exchange, Six Companies (Chinatown) · St. Mary's Cathedral plaza ·
2 Bryant (the owner's "1 Bryant": there is no 1) · Language of the Birds · giant laurel figs (sf_ficus_giant).
Restyles by judgement: Mission Bay lab offices 84821722 / 84812340 / 84821715; 600 Harrison, 620 Folsom,
795 Folsom, 730 Stanyan. Systems: ivy (render/landmarks/ivy.ts + foliage surface), two-sided signs, Chinese shop
names/boards in Chinatown, front-gable roofs capped at the lot depth, subway entrances never inside buildings,
short underpasses ridden, unnamed slip lanes as side paths.
Former theatres (Northpoint, Red Vic, Grandview, Surf): repurposed buildings — not worth models now.
Next: 288719494 (4th & Harrison rounded corner, builder drafted), Hotel Kabuki tower (681442041, drafted),
Uber HQ Mission Bay (Opus, in progress), Ping Yuen (generic but gist right — later).

Later 2026-10-16 (03:00-04:45): Uber HQ B1+B2 (Opus) · Hotel Kabuki tower · 4th & Harrison apartments · Kong Chow
Temple · Grant & Sacramento corner (Bank of America / Gold Mountain) · Waverly Place painted row · East Ping Yuen
restyle · Ocean Climate Center (Crissy Field) · Yerba Buena Island officers' quarters ×8 · Metro Theatre · The Light
House (651 Dolores) · The Clift (restyle) · 243571728 (restyle) · phantom towers 58 Main / Oceanwide removed ·
555 California and Southern Pacific brick darkened (see BUGS.md #280: the colour grade is the cause).
Checked and fine as they are: Dragon Gate, Hilton Union Square tower, Alcatraz cellhouse.
Skipped (no usable photo): Nob Hill Theatre, GGU School of Law.

2026-10-16 05:00-06:00: Coit Tower recoloured · Saints Peter and Paul white spires (church kit `masonrySpires`) · Grace
Cathedral taller towers · Clarke (Caselli) Mansion · Greater Farallones / old Coast Guard station · Torpedo Assembly
Building (YBI) · Chinatown YWCA (CHSA) · Julius' Castle · Peace Pagoda (rework) · Ferry Building true arches ·
Kearny top planters · Chinese place names in Chinatown (bake) · phantom heights: Hotel Des Arts, 153 Kearny, 60
McAllister · FIFTEEN Haiku "no photo" models replaced by photo-matched restyles (Argonaut, Clay Theatre, Galleria
Park, Golden Gate Club, Green Tortoise, HI Fort Mason, Harbor Court, Riu Plaza, Triton, Hotel Union, Inn at the
Presidio, Langley Porter, Queen Anne Hotel, Red Victorian, Curb Exchange). Lesson: a Haiku entry whose builder note
says "No photo" or "guess" is almost always wrong — review those first.

2026-10-16 06:45-07:05: Alcatraz dock — Building 64 (own model: gallery on struts, UNITED STATES PENITENTIARY board,
INDIANS WELCOME, bookstore pavilions), the steel lattice dock guard tower, restrooms down to one storey; the
Warden's House and the Officers' Club as roofless burnt-out shells (`ruinShell`). Sutro Baths ruins checked: gist
right. BUGS #279 triage finished.
07:05-07:30: placeholder LETTERING replaced by real words through the sign system — Golden Gate Theatre (GOLDEN GATE
blades, readerboards), Warfield (THE WARFIELD), Orpheum (ORPHEUM blade and board), the Alcatraz water tower's 1969
words (one tangent sign a word round the tank), the Internet Archive's attic inscription. Swept src/render/landmarks
for other "a block a letter" stand-ins: none left. Open: the Geary Theater (A.C.T.) has no marquee — needs a photo.
Skyline (#278) compared again from Treasure Island against ti1.jpg: order and relative heights right; no
day-time reference yet for colours.
07:30-07:40: HILLS BROS COFFEE open-frame roof sign on the coffee works (own `kind: sign` entry; the building stays a
restyle) · Embarcadero pier bulkheads read PIER 1 / 3 / 5 / 9 in capitals (were 3×5 block digits; `paintedNumber`
removed).
07:40-07:55: every pier preset (1–48, Fort Mason) now carries PIER n, sized to its bulkhead (smaller under the
mission tile pents) · Geary Theater / A.C.T.: the A, C, T banners · Lotta's Fountain muted from orange to bronze
(grade, #280) · the stored "Market — Ferry Building" view re-aimed at the tower.
07:55-08:00: pier names checked on Piers 9, 17, 23, 35 and Fort Mason 2/3; a larger size tried and reverted (it rose above the beaux parapets).

2026-10-16 (morning, owner's pick of 8 from NOTABLE-UNMODELLED): Benjamin Franklin Middle School · Irving Murray
Scott School · St. John the Evangelist (15th) · Henry Doelger Building · Abner Phelps House · Battery Marcus Miller
(no photo of Miller: drawn in Battery Boutelle's idiom) · Dashiell Hammett Place (one Mapillary frame, ~40 m) ·
Engine Co. No. 2. Also GGU School of Law from the owner's Street View frames (tower on the inner corner by the
entrance — owner's correction).
