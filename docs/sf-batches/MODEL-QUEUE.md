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
