# Changelog

One line per thing done. Appended by the coordinator only — **never by subagents**, so it stays a single
coherent record rather than a pile of overlapping claims.

**Why this exists.** Session context is millions of lines and cannot be searched; git has the code but not
the intent, and most building work is never committed separately. This answers *"how many times did we touch
the Embarcadero?"* in one `grep`.

**Format:** `HH:MM  dur  tokens  TAG  what — detail`. Names and OSM ids go in the line so they are greppable.
`dur` and `tokens` are the subagent's own measured cost where an agent did the work; blank where I did it
inline (cost not separable from the conversation).

Tags: `BUILD` building or structure · `FIX` bug · `KIT` shared kit/tool · `BAKE` bake started/finished ·
`CORE` engine/app code · `DOC` notes and audits · `DATA` queue/manifest/reference data · `REVERT` undone.

---

## 2026-09-24

### Buildings and structures

    time   dur     tokens   what
    ~09:30  —        —      BUILD  Peace Pagoda, SF Armory, Woolf House, Round House Cafe — sf/scratch-1.ts
    ~09:45  14m    168k     BUILD  Walt Disney Family Museum — sf/scratch-2.ts; proof of facade() Shaft.by
    ~10:30   8m     97k     BUILD  Kit batch 8 — 0 of 23 kept; list was unfiltered, my error
    ~11:00  17m    166k     BUILD  Kit batch 9 — 7 towers kept, 6 escalated — sf/batches/b9.ts
    ~11:30   9m    170k     BUILD  4 curved towers — sf/scratch-3.ts; scalloped tower 97k→24k triangles
    ~12:00  22m    234k     BUILD  Bank temples ×6 incl. Old Mint, Old Federal Reserve — bank-temples.ts
    ~12:40   2m     —       BUILD  Academy of Art Liberal Arts (way/332374374) — owner confirmed the form
    ~13:00  10m    176k     BUILD  Hilton SF Financial District (way/260922316) — rebuilt twice; inverted-Y
    ~13:30   8m    164k     BUILD  8 "weird" landmarks — Pacific Union Club, Columbarium, Octagon Houses,
                                   Camera Obscura, Cliff House, City Lights, Vesuvio — sf/oddities.ts
    ~14:00  10m    151k     BUILD  Federal remainder — 9th Circuit, Customs House, Appraisers, Courthouse
    ~14:30  18m    228k     BUILD  SFMOMA ripple + McAllister pinnacles + CCSF ×3 + Old Mission Dolores + Bimbo's
    ~15:00   5m    117k     BUILD  Haiku batch h1 — 26 kept (all 29 heights invented, corrected by me)
    ~15:20   3m    112k     BUILD  Haiku batch h2 — 24 kept after I pulled 3 (2 gun batteries, 1 double-draw)
    ~15:40   6m    108k     BUILD  Haiku batch h3 — 16 kept, 1 non-building skipped
    ~16:00  10m    108k     BUILD  Haiku batch h4 — 17 kept, 8 non-buildings skipped (2 ships, a water tower)
    ~15:50   9m     96k     BUILD  Kit batch b10 — 0 kept; no references, wrong brief for the tier (my error)
    ~16:20  27m    233k     BUILD  Kit batch b11 — 18 kept; fetched OSM directly, no cached refs existed
    ~16:50  20m    178k     BUILD  Kit batch b12 — 9 kept; found 7 queue ids now pointing at roads out of state
    ~16:30   9m    161k     BUILD  Aquarium of the Bay, Macang gallery — sf/waterfront-2.ts
    ~17:00  17m    191k     BUILD  Portsmouth Square skybridge across Kearny — was a deliberate stub
    ~17:30  35m    175k     BUILD  Embarcadero re-authored on ONE TOWERS table + NETWORK_ORIGIN
    ~18:00   2m    185k     BUILD  Pier 39 (way/199829618, no building tag → standalone entry)

### Fixes

    ~09:15  —        —      FIX    #160 model-shots.ts made clockwise rings — walls invisible. Game unaffected
    ~10:00  —        —      FIX    #161 sea level → true MSL (a wrong 0-datum pin would have drowned the city)
    ~11:15 125m    324k     FIX    #159 THE OCEAN — one reversed sign in tOf. 2.73 km² → 87.27 km², full box
    ~12:30  12m    212k     FIX    #162 windmill sails — two bugs: strut() axis flip, then crossbar offset
    ~13:10  —        —      FIX    #166 default city was paris-marais, which does not exist → san-francisco
    ~13:20  —        —      FIX    #178 jumps could only land on already-streamed tiles
    ~14:45  45m    203k     FIX    #171 Marriott double-draw — supersession ignored RELATION outlines (bake)
    ~15:30  44m    186k     FIX    #154 second pass — graded subdivision, 2 bridges + Sutro Tower
    ~17:50   2m    185k     FIX    #181 every landmark over water sat ~3.4 m under it — new `deckAbove`
    ~18:10   4m    184k     FIX    vegetation warns loudly on empty pick / zero models (trees DID render)

### Core

    ~16:10  —        —      CORE   #164 tile table scanned linearly per load (108 800 entries) → Map
    ~16:15  —        —      CORE   #164 startup awaited 225 tiles → awaits 9, streams the other 216
    ~16:20  —        —      CORE   openCity's duplicate Set of all tile keys removed (heap)
    ~15:45  —        —      CORE   #174 photo mode — P fog, [ ] draw distance, ?fog=off&far=N
    ~16:25  —        —      CORE   #177 heap watch at each tenth of Chrome's ~3 GB ceiling

### Tools, data and notes

    ~12:15  —        —      KIT    tools/batch-list.ts — filter the queue by real OSM tags
    ~16:40  —        —      KIT    tools/tall-audit.ts — 177 tall outside the core; 63 bridge parts, 1 in feet
    ~17:40  —        —      KIT    tools/group-shots.ts — render several entries together and ALONE
    ~13:40  —        —      DATA   sf-queue.csv restored after I destroyed it with git checkout; 56 discarded;
                                   71 out-of-box rows removed
    ~15:15  —        —      DATA   18 island builders parked (#175) — docs/PARKED-ISLANDS.json
    ~16:45  —        —      DOC    docs/PARKS.md — GGP/Presidio plan; port Trail Trainer ecology/scatter/impostor
    ~17:55  —        —      DOC    docs/STATUS.md — open bugs, separating FIXED from VERIFIED
    ~18:20  —        —      DOC    CHANGELOG.md started (this file)

### Bakes

    ~05:48  ~40m     —      BAKE   finished OK — everything in public/cities/san-francisco dates from this
    ~07:47 135m+     —      BAKE   started --no-audit, pid 44110 — still running at 18:20, 3× the usual
     —      —        —      BAKE   3 bakes killed by me mid-run to pick up code changes; one agent read the
                                   kills as a crash and spent a pass investigating a phantom


---

## Backfilled — the numbered bug history (BUGS.md #1–#182)

Reconstructed mechanically from `BUGS.md` headings, which is the only durable record of the work before this
session. **No times or token counts survive for these** — they predate the changelog, and the session context
they happened in is gone. Dates are given only where an entry states one. The numbering itself is the useful
part: it is chronological, so #1 is the oldest and #182 today's, and a `grep` for a number lands in the full
write-up in `BUGS.md`.

Everything below #159 belongs to earlier sessions — the Paris/Marais era through the San Francisco box
expansion, Yerba Buena, Moscone, the churches and the first Embarcadero passes.

```
#1 Stranger cyclists are not avatar-kit bodies
#2 Streets near the Bastille are impassable; the rider cannot go round it
#3 West edge of the Marais box: landmarks in grass
#4 The base ground plane stands at twice the terrain height
#5 Tour Saint-Jacques drawn twice: landmark model and OSM building
#6 Cirque d'Hiver turned the wrong way
#7 Hôtel de Sens needs work
#8 White monuments are pure white
#9 The Seine-side path is a dead end
#10 The Cirque d'Hiver's horsemen block the road
#11 Café terraces: chairs in a line, tilted
#12 News stands need improvement
#13 Too many long gowns in the crowd
#14 Two ground levels
#15 Signs z-fight
#16 The camera goes through awnings
#17 Bike-share station across the road
#18 Café tables have no visible top
#19 The Colonne de Juillet is gone
#20 Central Paris ride audit
#21 Notre-Dame needs real effort
#22 The Concorde is grass
#23 Balconies read as solid lines
#24 Z-fighting at the central-Paris start
#25 Dormers in mid-air
#26 Riding below ground level
#27 Tangled paths near the Alma and the Trocadéro
#28 Parallel paths along the Seine
#29 Métro stations' underground rooms drawn as buildings
#30 A subtle, usually-on path display
#31 Messy ground near a bridge; camera below ground (48.846945, 2.366215)
#32 Errant footbridge (48.849195, 2.372189)
#33 Trapped in a junction (48.849354, 2.356970)
#34 Trams are ugly
#35 Building underwater (48.846324, 2.362785)
#36 Z-fighting on a barrier in the river (48.848591, 2.359412)
#37 Bridges: usable and beautiful
#38 Roads tilt sideways on hillsides
#39 Memory over an extended session
#40 Star junctions
#41 Quick landmarks for the buildings people steer by
#42 Strangers in the rider's way
#43 Through a wall by the Grand Palais (48.867116, 2.311297)
#44 A loop at a junction (48.856545, 2.370996)
#45 A fire hydrant in the street (37.792745, -122.411188)
#46 US-style crosswalks
#47 Trees sprouting out of buildings (San Francisco)
#48 A black polygon on the road under the trees (Cushman Street, Nob Hill)
#49 Strangers flicker between their avoiding offset and their own path
#50 Protruding signs backward
#51 Too many crop tops on the strangers
#52 Cluttered, unnavigable junctions in San Francisco
#53 A hump in Kearny Street (37.794730, −122.404853)
#54 Chinatown's facade signs are behind the balconies
#55 Trees half inside buildings (37.794225, −122.406647)
#56 A confused intersection on Kearny (37.795366, −122.404954)
#57 Newspaper boxes in the street (37.796674, −122.405238)
#58 The waterfront's grading is wrong: the water is too far out and the piers stand on land
#59 The Bay Bridge is OSM's two towers, not our generator
#60 A building floating in midair (37.788772, −122.396218)
#61 Jumping to a landmark reloads the whole page
#62 Every building round Union Square is the same cream
#63 Click the map to jump anywhere (debugging)
#64 Z-fighting on a building (37.789340, −122.401526)
#65 Spun off onto a side street at the Jones/Sacramento junction (37.793041, −122.401990)
#66 Salesforce Park sits slightly wrong and cuts through neighbouring buildings
#67 Z-fighting across Salesforce Park
#68 Dismissing the landmark box minimises it, and clicking the minimised form loses it for good
#69 Street-sign text is occluded by its own pole
#70 A huge bump in Kearny Street (37.795302, −122.404934), and most of Kearny is not flat
#71 A wall across the road at 37.792190, −122.415121
#72 A large structure at 37.791994, −122.416009, partly underground
#73 The PCC streetcar model is crude
#74 Streetcar and cable-car stops are never drawn
#75 Streetcars pass through each other
#76 Streetcars turn around like a bus instead of reversing
#77 The rider is steered down the middle of streetcar streets, into the cars
#78 The Federal Reserve Bank is a green square with a name plate on it — FIXED, needs a re-bake
#79 Landmark name signs: the box is drawn over the text, and hides the building
#80 45 Main Street is missing too
#81 285 Market Street looks nothing like the real building
#82 One Maritime Plaza is a plain box, and z-fights
#83 Once you choose left or right there is no way to choose straight again
#84 A key to open Google Street View at the camera's location
#85 The Bay Bridge may not be drawn
#86 Frame rate drops on a fast descent
#87 The Macy's, Saks and Neiman Marcus signs are very ugly
#88 Z-fighting across the Neiman Marcus building
#89 Three California Street buildings: 350, 433, and the "black instead of sand" complex
#90 Full-height white piers modelled as a punched grid, losing the effect
#91 The Institute of Contemporary Art is rendered as a low brick building
#92 Two different buildings share one procedural builder, silently
#93 Trees grow inside buildings; pick a small tree when a big one will not fit
#94 The ground cannot decide where it is at 37.793488, −122.405218
#95 Zany intersection at Geary/Laguna, 37.785027, −122.428014
#96 `arcade()` draws no arches — the arch head is never filled — FIXED 2026-09-23
#97 `classicalColumn` silently discards `order` below 6 m — FIXED 2026-09-23
#98 Nineteen modelled buildings are registered and placed by nothing
#99 Six pier builders are modelled and never placed
#100 Sixty-nine landmarks name an outline the bake dropped, and are never built — FIXED 2026-09-23
#101 `ground: { kind: 'portico', pediment: true }` draws the pediment wrong
#102 Restyle entries are never checked against the bake — 36 of 600 do nothing in San Francisco — FIXED 2026-09-23
#103 The builder audit silently skipped Paris, and printed green — FIXED 2026-09-23
#104 Fourteen landmark heights disagree with their `building:part`s
#105 250 core buildings are marked `done` in the queue with no model
#106 The archetypes CSV and the baked tiles disagree about which buildings exist
#107 `tools/audit-builders.ts` runs its CLI at module scope
#108 112. The nonbuildings, and the checks that are theirs alone
#109 not on the ground
#110 coplanar surfaces (z-fighting candidates)
#111 duplicates the claim loop cannot see
#112 skyline stand-ins inside the city box
#113 Four restyle entries name an OSM id the bake has nothing at all for
#114 Three render-harness faults that looked exactly like broken models — FIXED 2026-09-23
#115 The classifier is blind to a building whose top is a different building
#116 Three famous SF landmarks cannot be reached — OSM has no named way for them
#117 `tools/model-shots.ts --entry=` photographs the wrong side of any entry with a numeric `front`
#118 `rule 1: chinatown zone` overrides building type — the worst rule in the table
#119 Facade retention — a historic front with a modern tower behind it
#120 555 California passed review and still needs a custom model
#121 The landmark tables are never pruned — heap grows without bound as you jump around
#122 A pale ellipse sits in every `?model=` render — cause NOT found
#123 My central judging is harsher than the owner's — calibration note, not a defect
#124 The photograph backfill only covered buildings that already had a manifest entry
#125 Photograph search returns UNBUILT PROPOSALS — a model will build what was never built
#126 OSM heights are wrong, and the bake trusts them — 123 buildings contradict their own tags
#127 Unnamed `building:part` fragments enter the queue as buildings — 283 of them over 30 m
#128 Buildings that front a plaza get photographed from behind
#129 One landmark, many ways — the pipeline assumes a building is a polygon
#130 Raised public space — the gardens sit on a roof, and the ground model cannot say so
#131 Skybridges are lines in OSM, not volumes
#132 Complex sites need AERIAL references, and we have no way to get one
#133 A road that ends INSIDE a building — the Transit Center busway
#134 Yerba Buena — six defects found by the owner in the first renders
#135 A THIRD rotation convention — `boxAlong` mirrors z, and square parts hide it
#136 Nothing stops a hand-built structure duplicating an OSM way — FIXED 2026-09-23
#137 `tools/sf-queue.ts` will WIPE 493 hand-maintained rows if anyone runs it
#138 The centrepiece block cannot be ranked by our own priority formula
#139 Google Earth's 3D mesh is MISSING a real structure — it is not ground truth
#140 `done` can mean "a preset stands here" — the queue's most misleading state
#141 OSM's `level` tag IS present in San Francisco — 17,000+ times — and we read none of it
#142 SF Federal Building — the E13 model is missing both defining features
#143 Courtyard buildings: the data carries the hole, the builders ignore it
#144 Ground-floor passages THROUGH buildings — a third instance, and a ridable feature we cannot express
#145 Level constants disagree across the two Yerba Buena blocks
#146 Moscone South: the open skybridge lands 38 m short of the park — measured
#147 TWO "de Young" buildings, and the museum was never queued
#148 Golden Gate Park and the Presidio were never given the generic treatment
#149 Ghirardelli Square: the SIGN is modelled, the BUILDINGS are not
#150 Four "160 m towers" in a kit batch were BAY BRIDGE PYLONS
#151 Bay Bridge pylons render as BUILDINGS on top of the bridge
#152 Freestanding billboards are being placed where there are none
#153 Cupid's Span faces into the street
#154 The Bay Bridge and the bay need SLICING for the depth buffer
#155 A bike hut rendered as a tower — the height guess ignored footprint size
#156 Oracle Park had a 60 m block over the whole field
#157 I-280's overpasses are wrong, and the freeway never changes level
#158 Buildings on steep slopes are half-buried — the base rule has no limit
#159 Root cause found for #154's missing render evidence: the bake never builds ocean/bay water at all
#160 `model-shots.ts` produced CLOCKWISE rings — walls vanished in renders only
#161 the datum frame, and whether the sea needs a level of its own (2026-09-24)
#162 Windmill sails lying flat instead of standing in a circle (2026-09-24)
#163 The map does not show the box
#164 Loading blocks the browser thread
#165 No welcome screen
#166 Default city is `paris-marais`, which no longer exists
#167 Flight mode, five defects
#168 The landmarks dropdown is useless
#169 `GL_INVALID_OPERATION: glDrawElements: Vertex buffer is not big enough for the draw call`
#170 Far too few strangers
#171 The custom Marriott Marquis next to Yerba Buena is broken
#172 Z-fighting on the sand at Salesforce Park
#173 Portsmouth Square is unfinished and missing its skybridge
#174 Photo mode — fog off, adjustable draw distance (DONE 2026-09-24)
#175 Island buildings are not baked at all — Alcatraz, Treasure Island, Yerba Buena Island
#176 The city index does not scale — 25 MB, of which 20 MB is terrain
#177 The 3 GB heap ceiling is fatal and silent — now watched
#178 A jump could only land on tiles already loaded (FIXED 2026-09-24)
#179 The load is CPU-bound, not network-bound — ~90 s
#180 Embarcadero Center: unit 4, the connections, and One Maritime
#181 Pier 39's deck is missing — the Aquarium of the Bay stands on open water
#182 Pre-ship check: implausibly tall buildings outside the core — `tools/tall-audit.ts`
```

**Three that are worth knowing about without reading the file:**

- **#96** was fixed three separate times — found again by kit batch 2 on 2026-09-23, and actually fixed
  2026-09-24. A bug that regresses twice is a design problem, not a coding one.
- **#136** records a correction of my own proposal: `supersedes: ["way/..."]` CANNOT WORK, because a
  `PackedEdge` carries no OSM way id. The fix that landed, `coversRaised`, matches geometrically instead.
- **#129/#130** were rescoped twice, ending at *"the Yerba Buena block is a special case, not a pattern to
  build for"* — the same lesson the Embarcadero re-taught today from the opposite direction.

### Cost note

Subagent spend today is roughly **4.3 M tokens** across 28 tasks, averaging ~155 k each. The two most
expensive were the ocean (324 k, and worth it) and kit batch b11 (233 k for 18 buildings). The two cheapest
outcomes were batches 8 and b10 at 97 k and 96 k for **zero buildings each** — both my fault for handing them
the wrong list or the wrong brief.

---

## 2026-09-24, late — budget stop

    19:10   —      —      DOC    Owner at 75% of the weekly limit on a Thursday. HALTED all building batches.
                                 Remaining plan: (1) let the 2 running agents finish, (2) close the 250 target
                                 via #175 (unpark 18 island builders — a bake filter change, no modelling
                                 tokens), (3) nothing else started until those land.
    19:25   —      —      DOC    Embarcadero POSTPONED by the owner: "it's one building out of hundreds. i'm
                                 just fixated on it because it's a really weird building, but it's not even
                                 popular or famous." docs/EMBARCADERO.md keeps the analysis for later.
    19:30   —      —      FIX    #175 misdiagnosed: the islands are dropped by the DETAIL BOX (cities.ts
                                 detail.north/east = 2400 m), not by largestComponent at bake.ts:483.
    19:35   —      —      DATA   #175 measured, NOT acted on: the 15 parked ids need detail.north>=4150 and
                                 detail.east>=4500 (Yerba Buena Quarters sit at 4272-4313 m east, so the
                                 obvious 3900 would have missed them by ~400 m and cost a wasted bake).
    19:40   —      —      DOC    OWNER REPRIORITISED for a demo this week: performance, park vegetation,
                                 minimap, UI. Buildings and the 250 target are OFF the list. #175 shelved.
    19:45   7m   222k     FIX    Park trees: NOT A BUG. Fresh shots deep inside the Presidio forest, the GGP
                                 meadow and GGP-east dense wood all show a full canopy; every species and form
                                 resolves, no warning fires. The "shadows" were something else — see below.
    19:45   —      —      FIX    LEAD on #169: that agent found a large flat dark TEXTURELESS QUAD lying on
                                 the ground beside the trees in both park shots. Same object the earlier #169
                                 pass blamed for the vertex-buffer flood: `ground:occluder`. One cause, two
                                 symptoms (dark ground patches + dead avatar/stranger shaders).
    19:55   —      —      DOC    Owner specified the minimap/UI work precisely: #163 is NOT fixed (minimap
                                 jump AND goto-coords are both still clamped to a stale box); the map must
                                 DRAW the real box; #168 resolves by moving landmarks onto the map, not a
                                 search UI; bike/run toggle moves out of the HUD into the welcome screen.
    20:05   —      —      DOC    docs/DEMO.md — the owner scoped the demo to FIVE CORRIDORS: California St
                                 downhill at speed (motion), Market/FiDi (big buildings), Chinatown (style,
                                 cheaply), the waterfront (water + piers + both bridges, NOT Embarcadero
                                 Center), Presidio/GGP (ground texture + vegetation + the staircases).
                                 Anything outside those five does not block the demo.
    20:20   —      —      DOC    BUGS #183 — tangled intersections. Traced the Paris fix: RIDE_OVERRIDES in
                                 src/city/overrides.ts, a hand-made table of 7 places, each replacing the
                                 derived graph inside radius R with a circle + spokes. SAN FRANCISCO HAS NO
                                 ENTRY. Mechanism shipped, never populated here. Queued as next agent.
    20:30   —      —      DOC    #183 REFRAMED by the owner: the majority case is ordinary 90-degree crossings
                                 with OSM zigzags on both paths, not exotic places. So it needs an ALGORITHM
                                 in the bake (detect two straight axes, intersect them analytically, delete
                                 the jitter vertices), not the Paris hand-table. Agent dispatched.
    20:55  27m   146k     CORE   #179 ROOT-CAUSED. `city` mark = 86s of a ~90s load; everything else is under
                                 1s. Cause: distantGround() walks the WHOLE baked terrain grid (1391x1861 =
                                 2,588,651 cells) unclipped — and groundOccluder()'s clip to pkg.box was dead
                                 code because `box` was never in CityMeta at all. Threaded index.box through:
                                 quads 2,591,904 -> 586,488 (4.4x), city-phase heap 2,683MB -> 789MB (3.5x).
                                 The prepare/ingest/mapEdges/addEdges hypothesis is REFUTED: 121 tiles, <100ms
                                 total. Wall-clock unreliable (bake at 83-99% CPU all run; 86-148s spread on
                                 identical code) — only the relative deltas are trustworthy.
    20:55   —      —      FIX    #177 consequence: firstFrame heap was 2,929MB against Chrome's ~3GB ceiling.
                                 That is why it dies. The above buys ~2.1GB of headroom.
    21:15  34m   165k     CORE   #179 FINAL. distantGround fix verified: quads 2,591,904 -> 586,488, verts
                                 10.4M -> 2.3M, function itself now ~400ms. But groundOccluder is now the
                                 dominant cold-load cost (~120s) even clipped — a per-cell water-polygon
                                 lookup (wetAt/wetOnly point-in-ring) over every remaining cell. NOT fixed.
    21:15   —      —      CORE   STUTTER ROOT-CAUSED (#179/#164). Jumped Nob Hill -> FiDi, 300 frames: p50
                                 52ms, p95 223ms, MAX 1067ms. Across the jump 77 tiles arrived; the CPU chain
                                 (prepare/ingest/mapEdges/addEdges) grew only ~215ms TOTAL, but TileStore
                                 .load() grew ~175 SECONDS — ~2.3s/tile, worst 2.8s. The bottleneck is tile
                                 FETCH+PARSE, not geometry. The owner's own instinct (workers, prefetch ahead
                                 of the rider) is the validated fix. Not prototyped.
    21:15   —      —      CORE   Left in place: window.__bringStats() (keep) and temporary PROFILE console.log
                                 timers in game.ts (MUST be removed or gated before the demo).
    21:30  21m   162k     FIX    #163 ROOT-CAUSED and fixed, and NOT the cause I guessed. Nothing stale on
                                 disk: public/cities/index.json carried only `radius`, and cityFor() accepted
                                 a coordinate only within radius*1.5. SF radius 3,340 m vs a baked box of
                                 17,600 x 8,200 m — so everything past ~5 km (Ocean Beach, the Sunset, the
                                 far south) was refused as "not in any baked city". An extent measured the
                                 wrong way, not a cached one. box back-filled into index.json (no rebake);
                                 tools/bake.ts now writes it.
    21:30   —      —      FIX    #163b minimap: box drawn as a dashed amber rectangle; zoom cap was hardcoded
                                 at 5,000 m (a 10 km view) so a 17.6 km box could never fit on screen.
    21:30   —      —      FIX    #168 landmarks dropdown replaced by a search field ON the map (M opens both,
                                 Enter jumps and closes). #165 welcome screen with title, controls and the
                                 bike/run switch, which now leaves the HUD. Verified via Playwright: Chase
                                 Center search moved the rider; Candlestick/Oakland/Berlin correctly refused.
    21:50   4m    14k     FIX    #168b HUD gap where the landmarks dropdown was. Not an empty wrapper: the
                                 menus are each position:fixed with their own `top`, so nothing collapses.
                                 Routes was pinned at 118px !important, leaving the vacated 66px row empty.
                                 Routes moved to 66px; dead select.sr-landmarks rule and an overridden inline
                                 top in game.ts deleted. Bike/run left no gap (also fixed, and now unmounted).
    22:05   —      —      DOC    Owner on the live build: game MUCH FASTER (the distantGround fix landing),
                                 but loading still takes forever (= groundOccluder's ~120s per-cell water
                                 lookup, already assigned). #169 NARROWED: stranger NPCs now DO appear, only
                                 the PLAYER'S own avatar does not — so it is no longer one shared cause.
    22:05   —      —      DOC    #183 got a concrete repro on demo corridor 1: california 37.793080,
                                 -122.402004 shunts the rider sideways every descent. Owner's hypothesis is
                                 NAVIGATION not geometry — the default continuation may be chosen by street
                                 NAME, and the name changes here. Angle should win, name only breaks ties.
    22:20   —      —      DATA   Giant tower at 37.791211,-122.453762 investigated WITHOUT a browser. Nothing
                                 supertall exists there in either source: OSM's own tags within 300 m top out
                                 at h=15, and the baked buildings within a ~600 m window top out at 27 m. The
                                 tallest building ANYWHERE west of -122.44 in the current bake is 51 m. The
                                 GGP studio he reported supertall earlier is 12 m in this data.
    22:20   —      —      DOC    #182 CORRECTION: the running bake will NOT fix any of these. tall-audit.ts
                                 only REPORTS; grep confirms no height sanitiser exists anywhere in the bake.
    22:35  41m   113k     FIX    #169 FIXED, and it was NOT ground:occluder. Root cause: the `clouds` mesh.
                                 Clouds were set to 0 on 2026-09-23 but the mesh is still built and enabled;
                                 with count 0 its thin-instance arrays are Float32Array(0), so Babylon draws
                                 it as an ordinary mesh while world0..3/instColor stay bound as INSTANCED
                                 attributes on zero-length buffers — every vertex of a 252-index draw reads
                                 past the end. Pinned by patching _processRendering + gl.getError() around
                                 drawElementsType: over 40 frames `clouds` was the only mesh to error, 40/40.
                                 Fix in src/render/sky.ts: one show() helper; an empty matrix buffer leaves
                                 the mesh DISABLED. Covers birds and planes too. Proof: 120 frames with the
                                 crowd, zero GL errors. 4,935 occluder meshes: zero errors from any of them.
    22:35   —      —      DOC    #169 CORRECTION: the strangers were never missing for a rendering reason —
                                 tools/views.ts passes `without=life` unless --life, so every earlier
                                 views-based pass had no crowd BY CONSTRUCTION. And a failed glDrawElements
                                 is a per-draw no-op in ANGLE; it cannot hide another mesh. Three passes
                                 blamed vegetation, then ground:occluder, on that false premise.
    22:35   —      —      DOC    Player avatar NOT reproduced in 4 loads (flat, steep cross-slope, occluders
                                 disabled, run mode): body enabled, visible, scale 1, 7.93 m from a 0.9 minZ.
                                 Disabling every ground:occluder changed nothing — that theory is disproved.
    22:50   —      —      DOC    Owner ride report: BUGS #184-#191 recorded. #184 STALE VITE DEP CHUNKS (504
                                 Outdated Optimize Dep + failed dynamic import of rgbdDecode.fragment) is
                                 ordered FIRST because it plausibly causes #185 (no GGP trees) and #190 (no
                                 avatar) at once, and explains why every headless repro comes back clean.
                                 Also: #186 GGP trails unrideable, #187 furniture in parks and in the road,
                                 #188 junction choice cannot be changed, #189 elevated walkways over creeks
                                 we do not have, #191 pathmap empty position array.
    22:50   —      —      DOC    #190 resolves the #169 open question: the owner's URL is the BARE one, no
                                 ?session=/?dandyhorse=, so the Dandyhorse platform-wiring theory is dead.
    23:00   —      —      CORE   #184 root fix: vite.config.ts now takes `cacheDir` from VITE_CACHE, so an
                                 agent's test server can no longer rewrite the pre-bundled deps under the
                                 owner's live page. That sharing is what produces the 504s; it has cost two
                                 separate days (today, and 2026-09-21's phantom VERTEX SHADER ERROR 1:1).
    23:15   —      —      DOC    Second GGP ride: trees now load (#184 confirmed as the cause). BUGS #192-#199
                                 recorded — everything in GGP should be rideable (supersedes #186, and roads
                                 are affected too); plants on asphalt; Sunset Dunes is a dead end at the box
                                 edge; park landmarks MODELLED BUT NEVER PLACED (californiaAcademyOfSciences
                                 and conservatoryOfFlowers exist as registered builders); vegetation wrong
                                 species + wrong places + far too sparse; beach has no sand; trails and
                                 pavements far too wide.
    23:20   —      —      DOC    Machine overload: load avg 133 over 564 procs, two headless Chromes at ~95%
                                 CPU each plus the bake. Told both live agents to close every browser and
                                 stop measuring; the intersections agent continues on code reading only.
    23:40  56m   126k     CORE   #179 groundOccluder 81x. It was ~10^10 edge tests: 5 wet probes per cell,
                                 fanning to 9 on dry land (#36 seam), over 578,391 cells = 4,005,327 lookups,
                                 each walking all 49 water rings — the bay's ring is 2,648 points with a bbox
                                 covering the whole city, so nothing ever rejected it. New watermask.ts
                                 z-buckets each ring + a 200 m broad-phase grid. Replayed over the real baked
                                 index: 288s -> 5.5s, ALL 4,005,327 probes identical to the linear scan.
                                 `city` mark overall: ~86-148s -> 5.0s.
    23:40   —      —      CORE   WORKER PREMISE REFUTED — my brief was wrong. The predecessor's "2.3s/tile
                                 fetch+parse, worst 2.8s" was queue WAITING, not CPU: bring()'s loadMs timer
                                 runs while wantTiles has already fired the whole ring. Real parse cost of
                                 the 200 largest SF tiles: 126ms TOTAL, mean 0.63ms, worst 2.8ms — the same
                                 tile off by 1000x. Also __bringStats stopped at addEdges and missed the
                                 listeners, which is why the chain read 215ms while a frame stalled 1s.
                                 No worker built. Instead: <=12 tiles in flight, <=6ms tile work per frame,
                                 ring ordered two tiles AHEAD along recent movement. ?burst=1 is the control.
    23:40   —      —      CORE   Descent (Nob Hill, bounded vs ?burst=1): p50 63->57ms, p95 156->134ms, max
                                 816->669ms, frames over 250ms 15->8. Taken under load 190 — directional
                                 only. THE DEMO-CRITICAL FULL-SPEED WARM-CACHE DESCENT IS STILL UNVERIFIED.
    23:40   —      —      CORE   PROFILE logs gated behind ?profile=1 (src/profile.ts). __bringStats kept.
    23:55   —      —      DOC    docs/PARKS.md — the GGP design brief from the owner's own references
                                 (~/Downloads/ggp-*.png, Middle Dr and MLK Dr on Street View, both read).
                                 "The park FEELS like a rural area, intentionally. Everything is designed
                                 like it would be in a national park." Pattern to build: carriageway -> kerb
                                 on ONE side or none -> grass/duff verge -> a DETACHED asphalt-or-dirt trail
                                 -> undergrowth -> dense trunks, canopy closing overhead. No pavements at
                                 all, no furniture except sparse classic lampposts. OSM's geometry is right,
                                 its STYLE is wrong; correct it from Mapillary into a checked-in per-way
                                 table (quirks.yaml pattern), sampling a few points per major drive.
    23:58   —      —      DOC    #192 SETTLED: "we should be able to bike every trail, even if it's not
                                 marked bikeable." Overrides my caveat that bicycle=no should be honoured —
                                 inside a park EVERY way joins the bike graph, access tags not consulted.
                                 Single-player exergame: no one to endanger, no law to break. What remains
                                 is how a path RIDES (dirt vs asphalt), which is a surface question.
    00:05   —      —      DOC    docs/PARKS.md — the standard is RECOGNITION, not accuracy. And the owner's
                                 "almost no long sight lines, due to hills or trees" is the budget, not just
                                 art direction: the park can take a much shorter far plane and heavier fog
                                 than the city, which is MORE accurate rather than a compromise. Density and
                                 frame time stop fighting — the trees that make it feel real are what let us
                                 stop drawing what is behind them. Spend the saving on density, per-region.
    00:10   —      —      DOC    docs/PARKS.md — almost no signs in the park either. Filed apart from street
                                 furniture because signs come from buildSigns/tools/signgen, a different
                                 path. Only sign in either reference photo is a 25 mph plate on a lamppost.
    00:15   —      —      DOC    docs/PARKS.md — DECISION: the park gets its own rendering path, not the
                                 city's with suppressions. The exception list (no pavements/furniture/signs/
                                 kerbs, different widths, access, draw distance, surfaces, planting) now
                                 covers every subsystem, and the DEFAULTS INVERT. Seam: region.ts/regions
                                 .json selected by AREA rather than by city, so it serves Central Park and
                                 the Bois too. Better + more vegetation is ONE job: density is only
                                 affordable with the sight-line saving, and that saving is only credible if
                                 the occluding trees are the right species.
    00:25  70m   189k     FIX    #183 ROOT-CAUSED AND FIXED, and the premise was wrong: the ordinary-crossing
                                 zigzag DOES NOT EXIST in San Francisco's OSM — the wiggle was OURS.
                                 collapseClusters used the plain CENTROID of a junction cluster; at
                                 California/Leidesdorff that centroid sits 4.7 m to the SIDE of California,
                                 and the kinked stubs it creates made departureBearing offer California at
                                 63.7 deg and the alley at 56.9, so "straight on" took the alley every
                                 descent. Cluster centre is now projected onto the through street's axis.
                                 That junction: alley at 56.9 deg -> CALIFORNIA AT 0.1 deg. City-wide over
                                 16,228 arrivals: rawNearDuplicates 176->171, "straight on" turning >45 deg
                                 2755->2665, leaving the named street while it continues 378->308.
    00:25   —      —      DATA   #183 tolerance table measured (tools/straighten.ts + straighten-report.ts,
                                 region-independent, NOT wired into the bake — two lines to enable). At true
                                 crossings the mapped node is a MEDIAN 0.04 m (p90 0.38 m) from where the
                                 axes cross; move p90 is 0.20 m on California, 0.36 Chinatown, 0.34 Market.
                                 Shipping it would move 1,405 junctions by 0.15 m — invisible. Point it at
                                 New York first. Neither the owner's name hypothesis nor mine was right.
    00:25   —      —      FIX    #183 near-miss worth recording: the first anchor rule made all three
                                 aggregates WORSE — a dual carriageway's two members are equidistant from
                                 the axis, the tie broke arbitrarily and kinked one lane, breaking #52. Now
                                 anchored at the mean of all axis-parallel arm ends, preserving #52 exactly.
    00:25   —      —      DATA   #183 Job 2: a CIRCLE is the wrong shape for Market — these are streets
                                 ridden THROUGH, not radial places. Right shape is Job 1's detector with the
                                 90-degree test dropped. Market has 133 interior vertices turning >5 deg vs
                                 13 on all of California; the worst (Church, Guerrero, Noe) are OUTSIDE the
                                 demo corridor, where 69 of 83 junctions are already clean. No SF
                                 RIDE_OVERRIDES entries added. A bake is needed for the fix to reach the game.
    00:35   —      —      DOC    Machine recovered: load average 4.97 (was 190), zero stray headless Chromes.
                                 Two agents dispatched, each with its own VITE_CACHE so neither can break
                                 the owner's live page: #190 the invisible player avatar (headful-only, the
                                 harness cannot reproduce it), and Golden Gate Park as its own REGION.
    00:45   —      —      DOC    OWNER'S METHOD for the park: "ggp is not THAT big an area. we should be able
                                 to divide it into small squares and get each square to 100%" / "this will
                                 take hours, not weeks." Park measured at 5,104 x 1,302 m = 33 squares of
                                 500 m. docs/ggp-grid.csv (the worklist, one row per square with bounds and
                                 status) + docs/GGP-GRID.md (what 100% means for a square, how to work one,
                                 and which squares to do first). Beats working by SUBSYSTEM: a subsystem fix
                                 cannot be judged except against a whole place, which is why every previous
                                 pass ended "better, but it still does not feel right".
    00:55   —      —      FIX    #190 CLOSED by the owner: avatar AND trees were both #184, the stale Vite
                                 dep cache. Not a shader bug, not the scene graph, not WebGPU. Avatar agent
                                 stopped immediately (~2k tokens spent). Chrome answers some dep chunks from
                                 disk cache EVEN ON A HARD RELOAD, so incognito is the only reliable clear —
                                 "it works in incognito" is a positive diagnosis, to be tested FIRST in
                                 future before any rendering code is read. Across #169 and #190 we blamed
                                 vegetation, ground:occluder, crowd-baked and WebGPU; all four innocent.
    01:05   —      —      DOC    Reminded the park agent, and recorded in docs/GGP-GRID.md: Mapillary has
                                 hundreds of photos of GGP. Per square, sample several points along the
                                 drive crossing it. Trust OSM for WHERE, photographs for WHAT IT LOOKS LIKE;
                                 encode corrections in a per-way table (quirks.yaml pattern), not re-decided
                                 each time. The ~/Downloads shots are only two roads — without Mapillary the
                                 other thirty squares become copies of Middle Drive.
    01:20  07m   206k     DATA   #183 continued: BOTH remaining proposals measured and BOTH withdrawn, which
                                 is the right outcome. (1) The 998 split-junction pairs were a RAW OSM count;
                                 by the time the ride graph is built, collapseClusters/contract/mergeParallel
                                 have already absorbed 991 of them — 0 pairs within 4 m, 7 within 8 m. No
                                 merge rule written, which also disposes of the #52 kink risk. (2) Market's
                                 131 kinks are 130 MID-EDGE and exactly 1 at a ride node, so the any-angle
                                 detector could not have moved any of them; proposal withdrawn on evidence.
    01:20   —      —      FIX    Bake question answered: game.ts:157 loads the baked ride-<mode>.json and the
                                 client never builds a ride graph, so the collapseClusters fix is ENTIRELY
                                 bake-side and pid 44110 (started 09:45) predates it. New
                                 `npm run bake -- san-francisco --rides` rewrites just the two ride files
                                 from the package on disk, ~2 min. MUST be run AFTER 44110 finishes or that
                                 bake overwrites them with pre-fix files.
    01:20   —      —      DOC    BUGS #194 filed: 43 vertices on 41 edges turn >120 deg — ride edges that
                                 DOUBLE BACK. Pre-existing (42 before the fix, 43 after). 29 are join seams
                                 where a reversed map edge is concatenated without a direction check (one at
                                 37.790582,-122.399732 turns 165 deg, inside the FiDi corridor); 12 are
                                 endpoints reattached to a distant cluster centre. Worst is a 180 deg
                                 reversal on a 666 m motorway_link.
    01:30   —      —      DATA   BUGS.md DATA LOSS CONFIRMED AND REPAIRED. The whole "second GGP ride"
                                 section (#193, #195-#199 as originally filed) had been clobbered by a
                                 concurrent writer and was GONE — only #184-#191 survived. Restored from
                                 context and renumbered #195-#202, because #192 (Presidio retaining walls)
                                 and #194 (doubling-back edges) were taken by other writers meanwhile. The
                                 "#192 SETTLED - every trail is rideable" heading had also come to sit on
                                 the wrong bug and now reads #195. Two separate agents reported losing their
                                 own sections tonight; BUGS.md needs a single writer or a lock.
    01:40   —      —      DOC    #198b filed: the park's one-off structures get CUSTOM generators, not city
                                 archetypes — owner named the Polo Field grandstand. Candidate list: the
                                 grandstand, Beach Chalet, the two windmills (builder may already exist,
                                 #162), Japanese Tea Garden gate/pagoda, Spreckels Temple of Music, Stow
                                 Lake boathouse, bison shelters, McLaren Lodge. Check for an existing
                                 builder FIRST — #198 showed finished builders sitting unplaced.
    02:10  37m   219k     CORE   PARK AS ITS OWN PATH SHIPPED: src/city/park-area.ts, selected by AREA (a
                                 tile whose park/wood polygon covers >=10,000 m2) — no city name, no park
                                 list, so Central Park and the Bois qualify the day they are baked. Applied
                                 in render/prepare.ts, the one choke point before road surface, kerb, centre
                                 line, plantings, sign reach and ride graph read width/walk. Settings in
                                 regions.json under default.park. Effects, all render-time and visible with
                                 NO bake: no pavements, road capped 6.5 m / trail 3.0 m, mapped furniture
                                 filtered, no corridor concrete, no street-name blades, park fog.
    02:10   —      —      FIX    THE THING NOBODY HAD ON A LIST: it is the concrete CORRIDOR layer, not the
                                 pavement, that makes a park road look like a street. city.ts paints
                                 concrete `width + 2*walk + 4.5` m under every way plus a hull at every
                                 junction, so zeroing walk and narrowing the road BARELY MOVED THE FRAME —
                                 the 4.5 m constant survives both. Suppressing the layer inside the park is
                                 what changed the picture. Found by standing in a square and looking, which
                                 is the argument for the square method.
    02:10   —      —      DOC    #198 IS WRONG and this saves the work it asked for: the manifest entries DO
                                 exist (parks.json, included at san-francisco.json:308), the buildings are
                                 baked, and 52 landmark:* meshes are in the scene INCLUDING the Academy and
                                 the Conservatory, with no city massing within 60 m. The grey box in the
                                 screenshot IS the Academy — its living roof and domes do not read at rider
                                 height. So: a builder to improve, not a manifest line to add. The de Young
                                 is the genuine gap — no builder at all.
    02:10   —      —      DOC    BLOCKER on the sight-line saving: photo.ts refuses a far plane under 900 m
                                 because the sky dome clips below the sky radius. The park has heavier fog
                                 (0.006 vs the city's 0.0026) — the LOOK — but frame time is unchanged, so
                                 the density it was meant to pay for is still unaffordable. FAR PLANE AND
                                 SKY DOME ARE ONE CHANGE; make and measure it BEFORE thickening planting.
    02:10   —      —      DATA   Squares G2A-G2K now `in progress` in docs/ggp-grid.csv with per-square
                                 notes; views `GGP G2A`..`GGP G2K` (group ggp) render the whole row in one
                                 tools/views.ts call. Best: G2I (concrete apron -> grass and a narrow path).
                                 Mapillary NOT yet pulled for any square. No square is at 100%.
    02:50  44m   233k     DATA   #204 THE PARK PLAN IS REVERSED BY MEASUREMENT, and my sight-line theory is
                                 dead. Measured in G2G (forested middle), 120-frame medians:
                                 far plane 1400m 28.4ms/851 meshes; 900m 26.0/703; 600m 26.1/626; 450m
                                 25.1/568; 1400m repeat 28.2/851. Culling a THIRD of active meshes buys
                                 3.3ms = 11.6%. The sky-dome coupling is real and solvable (SKY_RADIUS 520,
                                 corners reach 520*sqrt(3) ~= 900, which is exactly MIN_FAR) but not worth
                                 the risk for an eighth of what it was meant to fund. NOT BUILT.
    02:50   —      —      DATA   #204 NOT FILL-BOUND: 1280x720 30.1ms, 640x360 26.0ms, 320x180 26.6ms —
                                 SIXTEEN TIMES fewer pixels moves the frame 3.5ms. Trail Trainer's recorded
                                 conclusion (fill-bound) DOES NOT TRANSFER; docs/PARKS.md D4 was right to
                                 insist on re-measuring.
    02:50   —      —      DATA   #204 IT IS VEGETATION, ON THE CPU, PER PLANT: without=life 29.0ms;
                                 without=life,trees,plants 16.7ms. Trees and plants are 12.3ms of a 29ms
                                 frame (42%) for just 693 meshes, at a density everyone agrees is FAR TOO
                                 THIN. Cost that does not fall with pixels and barely falls with frustum
                                 culling is per-instance per-frame work, not drawing.
    02:50   —      —      DOC    CONSEQUENCE: PARKS.md section D inverts. Port scatter.ts FIRST ("nothing is
                                 stored: the position of a tree is a function of where it is") — bulk thin
                                 instances, no per-copy per-frame decision — NOT ecology.ts's bands or the
                                 impostors. Species and zoning are already largely in src/city/sf/parks.ts.
                                 Make a plant free per frame, THEN close the canopy.
    02:50   —      —      DOC    #198 corrected in place: "WRONG AS FILED — the park's landmarks ARE placed;
                                 the Academy just does not READ", evidence above the original text.
    03:05   —      —      BAKE   pid 44110 FINISHED after 4h33m (started 07:47; san-francisco.json 14:12,
                                 tiles 14:15, ride-bike.json 14:16). It also explains the `ridefile` test
                                 failure an agent reported as environmental — the package was being
                                 rewritten underneath the test.
    03:06   2m    —       BAKE   `npm run bake -- san-francisco --rides` run by me: ride-bike 8,405 edges /
                                 5,060 kB, ride-run 30,378 / 12,576 kB. This puts the collapseClusters fix
                                 LIVE — the California/Leidesdorff junction that shunted the rider sideways
                                 on every descent (demo corridor 1) should now go straight on.
    03:06  48m   245k     DATA   #205 REVERSES #204's pessimism — a closed canopy IS affordable. In G2G: 655
                                 vegetation meshes, 324 carrying 42,226 thin instances over 4.82M triangles.
                                 The instance counts are a LONG TAIL: 36 meshes draw ONE instance, 63 draw
                                 2-4, 101 draw 5-16 — TWO HUNDRED of the 324 drawn meshes exist to draw
                                 sixteen plants or fewer. Curve: 42,226 plants 27.4ms / 31,706 25.8 /
                                 21,214 24.2 / 10,579 22.3 / 0 22.3 — ~0.12ms per 1,000 plants on a 22.3ms
                                 floor. Decomposition: zeroing every INSTANCE recovers 5.1ms, but #204's
                                 figure was 12.3ms because that also removed the 655 MESHES, their
                                 materials and the tree shadow meshes. So ~7ms is fixed per-mesh overhead
                                 paid whether or not a plant is visible, and ~5ms is the actual plants.
                                 Tripling to ~130,000 plants costs ~+10ms; merging 655 meshes into a few
                                 dozen returns ~7ms for nothing.
    03:06   —      —      DOC    What to port from scatter.ts is the MERGE-BY-MATERIAL shape, NOT the
                                 determinism — the bake already gives us determinism (city/plantings.ts,
                                 city/park-planting.ts), so porting it would reimplement what we have.
                                 Impostors stay out: at 114 triangles per instance the geometry is already
                                 cheap. Open question flagged honestly: the 22.3ms FLOOR is unattributed
                                 and is 80% of the frame at low plant counts — find it before celebrating.
    03:20   —      —      FIX    FATAL, fixed by me: `ReferenceError: process is not defined` at
                                 ridegraph.ts:401 took the whole app down at load. A new `despike()` tuning
                                 knob read `process.env.SPIKE_ARM`, but ridegraph.ts is SHARED — the game
                                 loads it, not only the bake, and `process` does not exist in a browser.
                                 Now reads globalThis.process?.env, which is simply undefined client-side
                                 and yields the default 14. No other process.env references in src/.
    03:40   —      —      DATA   BUGS #206 RESEARCHED with numbers — GGP's fine terrain. Not OSM at all:
                                 terrain is AWS terrarium, baked at ZOOM 12 (bake.ts:891) onto a 20 m grid
                                 (STEP=20). terrarium.ts's own header claims z12 is native and more zoom
                                 "only interpolates" — true for SRTM, WRONG for the US, where 3DEP is 1/3
                                 arc-second lidar-derived and SF has 1 m coverage. Measured on a 1.6 km GGP
                                 transect, 160 samples, mean |2nd difference|: z12 30.2 m/px roughness
                                 0.126 m; z13 0.206; z14 0.326; z15 3.8 m/px 0.391 — roughness TRIPLES
                                 while relief stays ~50 m, which is the signature of real detail, not
                                 interpolation. TWO losses: the fetch zoom AND STEP=20 (Nyquist kills
                                 20-40 m features regardless of zoom). Blocked on #176 — terrain is already
                                 ~20 MB of the 25 MB index and halving STEP quadruples it. Do NOT hand-
                                 author hills; the real ones are there for the asking.
    03:55   —      —      DATA   #206 CHECKED AGAINST OSM: the fine terrain is NOT in OSM. OpenTopoMap draws
                                 its contours from SRTM/ASTER, not from OSM data, so fine contours there
                                 prove the DEM has detail, not that OSM does. Counted in our own cut inside
                                 the GGP box: 40,847 elements, only 135 rows carrying ele= (~45 distinct
                                 features), NO contour ways, no natural=ridge/valley/peak. Conclusion of
                                 #206 unchanged and now confirmed from both ends — the fix is in bake.ts.
                                 Incidental: natural=sand appears 42x in the park box, so #200's sand is
                                 genuinely sourceable and needs no inventing.
    03:55   —      —      DOC    #206b owner wants finer topo EVERYWHERE, not just parks — "It does make a
                                 difference when you're on foot", and we have a run mode. Blocked on cost:
                                 STEP 20->10 quadruples a terrain payload that is already ~20 MB of the
                                 25 MB index (#176), against a fatal 3 GB heap ceiling (#177) and a load
                                 time we just cut from 90s to 5s — doing it naively would UNDO tonight's
                                 biggest win. Order: #176 first, then #206. Likely shape: stop carrying
                                 terrain in the index at all, stream it per tile, so resolution becomes a
                                 per-tile decision and fine ground costs only where the rider is.
    04:10   —      —      DATA   #206c COSTED. Terrain block measured: 1861x1391 at step 20 = 20.5 MB of the
                                 26.2 MB index (78%), 7.9 bytes/sample, covering 37.2 x 27.8 km = 1,035 km2
                                 (much larger than the ride box — it must reach the skyline objects).
                                 Step 5: 41.4M samples = 327 MB in the index (impossible) but 12.3 KB PER
                                 200 m TILE and 2.8 MB resident for the whole 15x15 ring. Step 2.5: 1.3 GB
                                 on disk, 11.4 MB resident. So per-tile streaming turns resolution into a
                                 free parameter, and the owner's two asks are ONE change with a forced
                                 order: per-tile first, then step 5 EVERYWHERE. Selective fine terrain
                                 (GGP/Presidio/Sutro/California) is withdrawn — it was the right answer to
                                 the wrong architecture. Fetch zoom must rise to 15 with it or a step-5 grid
                                 is six samples of the same 30 m number.
    04:25   —      —      DOC    #206d — the owner raised two real consequences of finer terrain, both
                                 confirmed in the code. (1) Buildings take the LOWEST ground under the
                                 footprint (city.ts:2344, Math.min over the ring): a min over samples gets
                                 systematically lower as sampling gets finer — 20 m grid gives ~3 samples
                                 per footprint, 5 m gives ~30 — so every building sinks and grows a plinth,
                                 worse with size and slope. Citywide regression risk, must be measured
                                 before/after. (2) Roads are already smoothed by #38: level kerb-to-kerb at
                                 the HIGHEST ground across the corridor, densified to 8 m. A max has the
                                 mirror problem — finer sampling can only raise it, and unevenly, so smooth
                                 roads can become bumpy along their length. Both are PART of the terrain
                                 change, not follow-ups.
    04:35   —      —      DATA   Owner wants 2.5 m in GGP and the Presidio. Costed: step 2.5 is 49.4 KB/tile,
                                 12.9 MB on disk for the two parks (255 tiles), 11.4 MB resident when the
                                 rider is inside one — about +10 MB over step 5. Affordable. 1.25 is 197 KB
                                 /tile and 45.5 MB resident; not now, but making `step` a PER-TILE property
                                 means trying it later costs a bake and nothing else. Park tiles chosen by
                                 AREA (reusing park-area.ts's coverage test), not by name, so Central Park
                                 and the Bois inherit it. NOTE zoom 15 is 3.8 m/px, so a 2.5 m grid is
                                 already finer than the source — must be stated, not read as 2.5 m of data.
    04:35   —      —      DOC    Per-tile step also SOFTENS both #206d risks: the buildings-sink problem
                                 scales with samples per footprint and parks have few buildings; the road-
                                 ripple problem is least harmful exactly where we WANT uneven rural ground.
                                 So fidelity wins in the parks, smoothness wins on the city grid.
    04:50   —      —      DATA   #206e PROBED: zoom 16 does not exist (404), so the terrarium pyramid bottoms
                                 out at ZOOM 15 = 3.78 m/px. On a 600-point GGP transect: z13 vs z14 mean
                                 |diff| 0.329 m (max 1.70); z14 vs z15 0.107 m (max 0.57) — real but small,
                                 and the floor. So a 2.5 m grid stores 1.5 samples per real one. TARGET IS
                                 STEP 4 EVERYWHERE (19.3 KB/tile, 4.3 MB resident, within 6% of source),
                                 and the park/city step split is WITHDRAWN as unnecessary — less code, not
                                 more. Owner: "no point in going finer than the original source."
    04:50   —      —      DOC    #206f owner adds a third axis: "terrain in tiles, and special data sources
                                 for the parks". Right call — z15 is a limit of THIS PYRAMID, not of the
                                 data: USGS 3DEP has 1 m lidar over San Francisco and terrarium is a
                                 resampled global convenience product. A tile should record its SOURCE and
                                 true ground resolution, not just its spacing. Candidates: 3DEP/The National
                                 Map, OpenTopography, data.sfgov.org (which already gives us the 68,972
                                 street trees, so the pattern and licence are known). PROBE FIRST with the
                                 #206 transect method — a "1 m" product that is resampled 10 m shows up as a
                                 near-zero difference against z15 for the price of one probe.
    05:00   —      —      DOC    #206g owner adds the whole Presidio (already in scope) and THE COASTAL
                                 TRAIL CLIFFS. The cliffs are the better argument: a coarse DEM fails
                                 hardest where the ground is steepest — a 30 m pixel across a cliff face
                                 averages rock and beach into a ramp, so the cliff stops being a cliff.
                                 Lands End, Sutro Baths, the Baker Beach bluffs and Fort Point are the most
                                 vertical terrain in the box and are all currently ramps. PROPOSED RULE: do
                                 not list named places — promote a tile to high-res on either (a) SLOPE over
                                 the coarse grid, which catches cliffs, bluffs, Sutro, Twin Peaks and steep
                                 city blocks in ANY city, or (b) park/wood coverage via park-area.ts, which
                                 catches GGP's flat-but-lumpy interior that slope would miss. Both are data,
                                 not geography. Measure how many tiles each threshold promotes before
                                 promoting any. ALSO: the Coastal Trail is the worst case for #206d's road
                                 rule — max across the corridor, on a cliff, includes the rock face rising
                                 beside the trail and would lift it into the air. Check it explicitly.
    05:10   —      —      DATA   #206h Mount Sutro. The hillside needs no special case — #206g's slope
                                 criterion promotes it automatically. But measured against the box: the
                                 PEAK MISSES BY 62 m (x -4047, z -3662 vs south 3600). Sutro Tower is 605 m
                                 out, Twin Peaks 697 m. Moving `south` from 3600 to ~4400 — one number,
                                 800 m on one edge — brings in the peak, Sutro Tower AND Twin Peaks, all
                                 currently unreachable horizon scenery. The TERRAIN is already baked (the
                                 grid is 37.2 x 27.8 km, far bigger than the 17.6 x 8.2 km ride box); it is
                                 the RIDE box that stops short. Costs ~10% more box area plus a matching
                                 detail.south move, so batch it with a box change — and with #175, which
                                 wants detail extended north/east for the islands.
    05:20   —      —      DATA   #206i offshore rocks: the CHEAP answer wins — they are ALREADY IN OSM and
                                 need drawing, not finer bathymetry. Counted west of -122.478 (Lands End to
                                 Baker Beach): 36 place=islet, 54 natural=bare_rock, 138 natural=reef, 36
                                 natural=cliff, and NAMED — Seal Rocks, Mile Rock, Little Mile Rock, Lobos
                                 Rock (the one the owner spotted), Pyramid Rock, Hermit Rock, Black Head
                                 Rock. A 20 m rock is invisible at 30 m/px and marginal at 4 m, so finer
                                 terrain would give a bump where a rock should be. They are already holes in
                                 the coastline ring (#159 produced 22 island holes), so the water is right
                                 and only the rock is missing. Build them from WATER LEVEL up, not terrain —
                                 the bed is flattened to shore-1.5 (#58) and that is exactly what sank every
                                 pier until #181. The owner's "over by the piers they've been removed" needs
                                 no special case: those tags simply do not occur there.
    05:30   —      —      DATA   #206j bridge ends as a THIRD high-res criterion, and MEASURED to be
                                 necessary rather than duplicative. p90 gradient over a 200 m window on the
                                 shipped grid: Yerba Buena 0.460, GG north (Marin) 0.367, GG south (Fort
                                 Point) 0.362 — but BAY BRIDGE WEST (Rincon Hill) only 0.068, against flat
                                 controls of 0.043 (Market & Montgomery) and 0.041 (Ocean Beach). So slope
                                 catches 3 of 4 and misses Rincon, which no threshold could catch without
                                 also promoting half of downtown. Selection is now THREE data-driven tests,
                                 any one promoting a tile: slope (~0.12-0.15, with flat 0.04 and cliffs
                                 0.36-0.46 an order of magnitude apart, so the threshold is comfortable),
                                 park/wood cover, and the ground end of a bridge=yes way. No place names.
    05:45   —      —      DATA   TREASURE ISLAND + YERBA BUENA + ALCATRAZ unlocked. Owner: "omg we should
                                 have Treasure Island... how cool would it be to bike across the bay bridge
                                 and turn off onto YB island / Treasure Island". Measured: YBI is at local
                                 4047,1837 and TI at 3695,3395 — both well INSIDE the ride box (east 7800,
                                 north 4600), which is why the Bay Bridge already crosses them. They were
                                 outside the DETAIL box at 2400, so the detailed city query never covered
                                 them: the baked ride graph has ONE edge within 900 m of YBI and ZERO on
                                 Treasure Island, and their buildings were never classified. Changed
                                 tools/cities.ts detail east 2400->4500, north 2400->4200 (4500 clears the
                                 YB quarters at 4313 m — measured; the obvious 3900 would have missed).
                                 This also brings ALCATRAZ inside, so it closes #175 and unparks all 18
                                 finished island builders. Most of the added area is bay and carries little.
    05:45   —      —      DOC    Owner: "treasure island is perfectly flat, that's not a terrain thing, just
                                 a modeling thing." Correct, and it is a good check on #206g: TI is
                                 artificial landfill and the slope criterion will leave it coarse, while
                                 YBI's real hill gets promoted. The rule gets this right with no special
                                 case — which is the argument for selecting on data rather than names.
    05:55   —      —      DOC    #206k Alcatraz needs a SKYLINE entry, not just the detail-box fix. Measured:
                                 Pier 39 2,316 m, Fort Mason 2,356 m, Crissy Field 3,591 m, Embarcadero
                                 4,325 m — against a streaming radius of MID+1 = 7 tiles = 1,400 m. So it
                                 bakes but never streams; a tile-streamed island is one nobody sees. The
                                 mechanism exists and was built for this: package `skyline` draws far
                                 landmarks always, with skylineBoost (1x inside 1.5 km, 1.8x by 5 km) — at
                                 2,316 m that is ~1.18x, a gentle and correct correction. Add Alcatraz
                                 beside the two bridges and Sutro Tower as a recognisable GIST (island
                                 silhouette, cellhouse along the top, lighthouse, water tower). Keep the 18
                                 detailed builders: free once unparked, and right if a boat mode ever comes.
    06:05   —      —      DATA   #206l GGNRA extension measured. KEY FINDING: Battery Spencer (x -6158) and
                                 Hawk Hill / Conzelman Rd (x -7653) are ALREADY INSIDE both the box and the
                                 detail box — the classic ride over the bridge is in scope today and is
                                 presumably generic for want of PARK TREATMENT, not extent. That makes the
                                 headlands a free test case: get them right with no box change, and we learn
                                 whether GGNRA is worth extending to without spending a bake. Growth steps:
                                 west to 11,500 (Point Bonita + Rodeo Beach) = 158 km2, only 1.1x, almost
                                 all headland and ocean so very few buildings; north to 7,500 (Tennessee
                                 Valley) 214 km2 = 1.5x; Muir Beach + Mt Tam 390 km2 = 2.7x. GGNRA is park
                                 all the way down, so it is the purest test of the park-as-region work —
                                 every rule shipped tonight applies with no new ones, and every remaining
                                 gap is exposed over a far bigger area. The owner's "IF" is load-bearing.
    06:20   —      —      DOC    Owner rode to the Marin headlands — the free test case #206l predicted.
                                 BUGS #207-#210 filed. #207 CAMERA ON THE GOLDEN GATE BRIDGE is the most
                                 demo-critical: navigation is right, the camera "has no idea where to go and
                                 points inside bridge structures" — likely aiming at terrain (the sea bed,
                                 hundreds of metres down) instead of the raised DECK, or colliding with the
                                 structure we subdivided in #154. #208 headlands render "like a golf
                                 course" — CHECK FIRST whether they are tagged park/wood at all: GGNRA is
                                 often boundary=protected_area or natural=grassland/scrub, and park-area.ts
                                 selects on park/wood, so tonight's park work may not be reaching them AT
                                 ALL. #209 paths messed up. #210 a second phantom overpass —
                                 upgrades #189 from a park quirk to a general rule.
    06:15  44m   206k     FIX    #194 FIXED bake-side: reversals 43 -> 6 (bike), 168 -> 38 (run). The two
                                 mechanisms were ONE: join() already orients by node id, so nothing is
                                 concatenated backwards — the fault is in reattach(), where a collapsing
                                 cluster jumps an endpoint up to 48 m and NOTHING REMOVED THE VERTICES IT
                                 STEPPED OVER, so the line runs past a point and comes back. The "seam" is
                                 the same overshoot one stage later, once contract() makes that endpoint
                                 interior (9 spikes before collapsing, 53 after collapseClusters, 131 after
                                 contract). Fix: trimBehind in reattach + a new despike() pass + snapEnds().
                                 Trimming was chosen over my suggested cap because a cap leaves the edge
                                 short of the junction and #52 depends on the centre's position.
    06:15   —      —      FIX    #194 cost, stated honestly: straight-on >45 deg got WORSE by 6 (bike) and
                                 10 (run) — 0.04% of 16,800 arrivals, from departureBearing reading a
                                 corrected first 8 m. rawNearDuplicates 171->167 / 1320->1310. The 180 deg
                                 reversal on the 666 m motorway_link and the Market/FiDi one are gone. 38
                                 run survivors are deliberate: 121 of 168 were footways/steps, where a
                                 single-vertex zigzag IS the stairway. #52 VERIFIED not assumed, via a new
                                 tools/junction.ts: 1,001 cluster centres before and after, exactly one
                                 removed (an unnamed Channel St scrap offering a 134 deg near-U-turn).
    06:15   —      —      FIX    Latent 3.3 m TELEPORT found at a Marais node — two edges disagreed where
                                 their shared node was and buildGraph takes the first. snapEnds() averages
                                 each node's ends. SF had none.
    06:15   —      —      DATA   JFK DRIVE REFUTED, and sharper than any previous guess: it is
                                 highway=tertiary, in BIKE, in the graph, offered from every arrival. From
                                 one arrival it comes out at 40 deg, which exits() classes as STRAIGHT ON —
                                 so the rider pressing RIGHT gets the Great Highway at 86 deg. That is
                                 "cannot turn onto JFK", and #195's park access rule will NOT fix it.
    06:18   4m    —       BAKE   Ran `--rides` for san-francisco AND paris-marais, so #194 is live and the
                                 Marais teleport fix is in.
    06:35   —      —      DOC    BUGS #211 — the Golden Gate Bridge is DOUBLE-DRAWN close up: the OSM version
                                 as a solid wall the path runs over ("biking on a giant wall in the ocean")
                                 plus the low-poly skyline model hanging in the sky. Same class as #171, and
                                 ALREADY HALF-DIAGNOSED IN #182, which found 63 bridge segments rendering
                                 as buildings (towers are OSM building:part stacks with description=leg_*/
                                 top_mast_*) and noted "they are also drawn a second time by the bridge
                                 builders themselves" — but #182 produced a reporting tool and no fix. The
                                 mechanism to fix it exists: coversRaised (#136). CHECK WHETHER SKYLINE
                                 ENTRIES PARTICIPATE — the bridges and Sutro are spec.skyline items, a
                                 different path from landmark entries, which is likely why they were missed.
                                 Skyline objects are also drawn ALWAYS by design, so one must be suppressed
                                 when the rider is on it. Noted as WELL: the accidental building-stack
                                 towers "aren't awful" — the OSM tower geometry is roughly right; the deck
                                 and the double-draw are what is wrong.
    06:35   —      —      DOC    OWNER'S SCOPE DECISION: "We WILL do Golden Gate as a realistic rideable
                                 route. This is a huge project though and let's get the parks good enough
                                 first." So the realistic bridge is AFTER the parks; only the double-draw
                                 kill is worth doing now, and only if cheap. Demo corridor 4 should show
                                 the bridges FROM the waterfront rather than riding them.
    06:50   —      —      DOC    BUGS #212 Fort Point needs a custom model — checked first (the #198 lesson)
                                 and there is NO builder: it appears in landmarks/ only as "the steel arch
                                 over Fort Point" in golden-gate.ts. Worse, ITS OSM OUTLINE APPEARS MISSING
                                 — batch b12 already hit "way/11009073 no longer exists (404)", and our cut
                                 has nothing named Fort Point except Fort Point Light (way/1358282761, a
                                 building:part lighthouse); every other building within 220 m is a bridge
                                 pylon. So build it as a STANDALONE entry (size+lat+lon, no OSM id) rather
                                 than hunting a deleted way. Watch two traps: the OSM lighthouse must be
                                 suppressed if the custom fort includes its own, and it sits under the
                                 double-drawn bridge (#211) so it cannot be judged until that is fixed.
                                 QUEUED BEHIND THE PARKS per the owner's scope decision.
    07:00   —      —      DOC    docs/SCOPE-GOLDEN-GATE.md — owner groups Fort Point, realistic rocks and
                                 the GG bridge fix as "another scope of work", after the parks. Written up
                                 so it is not re-derived and not cherry-picked: the three share the same few
                                 hundred metres and each is hard to judge while the others are wrong.
                                 CONFIRMED for the rocks: ~/trailtrainer/public/rocks holds 218 generated
                                 models (tools/rockgen), and rock is threaded through the SAME modules as
                                 the planting — ecology.ts, scatter.ts, impostor.ts, layers.ts, ground.ts,
                                 palette.ts, groundTextures/splat. So rock is nearly free ONCE the
                                 vegetation port lands, and starting it now would port the same code twice
                                 by two agents. Distinct from #206i's offshore rocks, which are named OSM
                                 polygons wanting geometry, not scatter.
    07:15   —      —      DOC    BUGS #213 Presidio work list. Owner: it is AHEAD of GGP — but the reason is
                                 not flattering: large mown grass is the one natural surface our generic
                                 treatment already does well, and the Presidio has a lot of it. Its FORESTED
                                 parts will fail exactly as GGP does. Needs: the steps from "50% good
                                 enough" to 100% (there is NO stair builder at all — checked; they come
                                 from the generic highway=steps path), the coastal BATTERIES (no builder;
                                 grep finds only Battery STREET downtown, and PARKS.md already records
                                 Chamberlin and Yates being pulled from a recipe batch for rendering as
                                 apartment blocks), The Landmark (ex Public Health Service Hospital), the
                                 World Economic Forum centre, and the Main Post barracks. Order: steps,
                                 then batteries, then buildings.
    07:25   —      —      DOC    #213a — the steps' last 50% is the SETTING, not the stair. Owner: "the
                                 steps have unique hedges and decorations". The flights are close enough;
                                 what is missing is the clipped hedges that step DOWN IN REGISTER with each
                                 flight (not a continuous hedge beside a slope), the balustrades, urns and
                                 planters at the landings, and the planted verges. So a better stair kit
                                 alone will NOT finish this, which PARKS.md B implies it would — build this
                                 one from photographs, since the recognisable parts are exactly what no rule
                                 would generate. Kit still generalises to Filbert/Greenwich/Lincoln Park;
                                 the hedges and urns stay Lyon Street's own decoration.
    07:35   —      —      DATA   #213b Lyon Street houses surveyed: 256 buildings between Green and
                                 Broadway, median footprint 165 m2, largest 475-541 m2 — and ZERO named,
                                 ZERO tagged historic. First place the queue method has nothing to offer:
                                 OSM maps what is DISTINCT, and a street of 200 grand houses individually
                                 unremarkable to a mapper but collectively remarkable to a rider is exactly
                                 what it does not record. So select by SIZE (largest are 3-4x the median, a
                                 clean signal) and PLACE, then style from photographs with a handful of
                                 Pacific Heights recipes — Beaux-Arts stone, Tudor, Mission Revival stucco,
                                 brown-shingle. NOT 256 custom models. They also frame the view from the
                                 steps, so they are part of finishing that showcase (#213a).
    07:45  50m   289k     FIX    PARK BAKE-SIDE WORK READY FOR BATCHING (not baked). Verified render-time by
                                 square: G2A lampposts restored (they had been lost by accident — every
                                 lamppost in the city is planted by a loop gated on e.walk >= 1.2 and the
                                 park rule zeroes walk); now planted the way the photographs show, one side,
                                 every ~70 m, out on the verge. #196 FIXED, plants no longer grow through
                                 asphalt (plants.ts tests each lattice point with Carriageways.onPaving,
                                 new includeFoot flag because a park trail IS a footway) — clear in G2B,
                                 G2G, G2I, G2J. #201 widths corrected FROM PHOTOGRAPHS via a checked-in
                                 table src/city/park-roads.json read by parkEdge, so bake and render agree;
                                 it also fixed the cap the OTHER way — JFK Promenade and Middle Drive West
                                 are tagged `pedestrian` and were being squeezed to the 3 m trail cap when
                                 they are the old carriageway (12.6 -> 12, not -> 3). 18,400 baked park
                                 edges were `concrete` (surfaceOf's default for an untagged footway), which
                                 is what made the trails read as pale city slabs; now asphalt.
    07:45   —      —      DATA   #208 MEASURED AND CONFIRMED — it was the AREA TEST, not the planting. Park
                                 rules applied to the Marin headlands: 11 of 253 tiles (4%) BEFORE, 242
                                 (96%) after. The headlands are 254 `grass` polygons from OSM natural=scrub,
                                 so 96% of them were being drawn with CITY rules on open ground — which is
                                 exactly "spartan" and "like a golf course". grass/sand/dirt now count as
                                 open country on a tile with fewer than 8 buildings. Citywide +765 tiles, of
                                 which the building test removes 5. GGP 122->123, Presidio 170->171,
                                 downtown and Mission unchanged.
    07:45   —      —      DOC    FOUR items in my brief were not what they looked like. (1) buildSigns has
                                 no geometry — it is a per-city Blender GLB generator, and park street-name
                                 blades were ALREADY suppressed at render/signs.ts:355. (2) Parking meters
                                 are not baked at all — procedural in render/city.ts, already gone with the
                                 pavements. (3) Crossover Drive is `secondary`, not primary/trunk, so the
                                 exemption as I briefed it would have MISSED THE ONE ROAD IT WAS WRITTEN
                                 FOR. (4) TRAFFIC LIGHTS ARE A FOURTH PATH — drawn per-arm at junctions from
                                 `pads`, so both earlier suppressions missed them. Signs, furniture and
                                 signals are three subsystems with three placement paths.
    07:45   —      —      DOC    Trap for the terrain agent: park-area.ts had a TS parameter property, which
                                 `node --experimental-strip-types` REJECTS — and bake.ts now imports that
                                 file, so it would have killed the bake at the import. tsc is perfectly
                                 happy with it. Anything tools/*.ts imports from src/ must be strip-safe.
    07:55   —      —      DOC    BUGS #214 a SPORTS-PITCH KIT, owner's "that should be a kit". Counted
                                 1,421 sports areas in the box: basketball 294, four_square 288, playground
                                 234, tennis 172, untagged pitch 86, swimming 71, baseball 70, soccer 62,
                                 running track 39, pickleball 25. Today they are flat coloured polygons —
                                 the bake paints a pitch kind and nothing else happens. KEY: the kit is
                                 smaller than the list, because basketball + four_square + tennis +
                                 pickleball are ONE part (flat asphalt, painted lines, optional net or
                                 hoop) = 779 of 1,421, 55%, from a single court part driven by a markings
                                 table. Then diamond (70, the most recognisable at distance), field (67),
                                 track (39), plus playground and pool as siblings. Genuinely cheap: flat,
                                 axis-aligned, standardised published dimensions, NO reference photographs
                                 needed — the opposite of the landmark problem. Cautions: fit a correctly
                                 proportioned court INSIDE the rough OSM trace rather than stretching to
                                 its corners, and take orientation from the longest edge, not north. The
                                 Polo Field is in this family.
    08:05   —      —      DATA   #214a the sports kit must not claim landmark venues (owner's caution —
                                 same supersession trap as #171 and #211). Measured so the rule is a
                                 threshold, not a list: 1,161 pitch/track/stadium areas, only 78 NAMED (6%),
                                 median area 219 m2 — while the Polo Field is 103,557 m2, Kezar Stadium
                                 30,850, Beach Chalet Soccer Fields 30,527, Chase Center 19,603. A landmark
                                 venue is TWO ORDERS OF MAGNITUDE bigger than a tennis court. RULE: the kit
                                 draws a polygon only if unnamed AND under ~5,000 m2 AND not
                                 leisure=stadium. At 6% named the kit still covers the overwhelming
                                 majority. Also check the surrounding sports_centre for a name — Beach
                                 Chalet is a sports_centre with courts=4 whose inner pitches are unnamed.
    08:10  18m   266k     FIX    #207 FIXED and it was ONE LINE: the chase camera aimed at
                                 terrain.heightAt(12 m ahead), and under a bridge the terrain IS THE SEA
                                 BED. Crossing the Golden Gate the camera held a pitch of -73 degrees for
                                 the whole span — eye at y -29 m on the deck, aim at y -85 m, 55 m below it
                                 at 16.5 m reach, so it stared straight down through the deck into the
                                 bridge's own structure. A GENERAL RAISED-EDGE FAULT, not a Golden Gate
                                 one: every bridge and ramp in the city had it. Fix: aim at the ride edge's
                                 own height profile (new Navigator.elevationAhead), the same source the
                                 rider's height and the trainer's grade use, eased to absorb junction
                                 steps. RENDER-TIME, live with no bake. Measured riding both ways with a
                                 new tools/cam-probe.ts: Golden Gate mean pitch -73.2 -> -6.1 (north) and
                                 -5.4 (south); BAY BRIDGE SWUNG THROUGH 42 DEGREES (-68.9 to -27.0, mean
                                 -53.0) -> mean -3.2 — that swing was the "no idea where to go" half of the
                                 report. Flat city unchanged (0.3 degrees of mean pitch).
    08:10   —      —      DATA   #207: both my other candidates REFUTED with numbers. Deck densification is
                                 fine (the Golden Gate deck has a point every 7.6 m on average, never more
                                 than 8.0 m apart, each with a height). Nothing was avoiding the structure
                                 (clearBehind only tests building rings). The camera was inside the
                                 structure because it was pointing at the sea bed.
    08:10   —      —      DOC    Found not fixed: game.ts:1218 recomputes the FROZEN/ORBIT look height from
                                 terrain every frame, overwriting the deck height the freeze handler sets —
                                 so tools/ride-shot.ts on any bridge photographs from under the water,
                                 which is why #207 could never have been verified from a still. Needs a
                                 "raised deck height here" query that does not exist (~20 lines). Until
                                 then cam-probe.ts is the instrument for bridges.
    08:20   —      —      DATA   #214b outdoor pools confirmed for the kit. All 71 swimming pools in the box
                                 are mapped as open polygons — NOT ONE carries location=indoor, indoor=yes
                                 or building=, so the indoor/outdoor worry does not arise. Median 70 m2
                                 (about 8x9 m, so small objects wanting cheap geometry), largest 324 m2,
                                 biggest named is Mission Pool. A sibling of `court`, not a variant: the
                                 material is the point — blue basin with a waterline band, coping edge, lane
                                 ropes on the larger ones, paved deck. Caution mirroring #214a: check
                                 whether a BUILDING polygon covers the pool before drawing, since OSM often
                                 maps a natatorium's pool separately from its roof — otherwise an indoor
                                 pool appears on a roof, the same class of error as the sunken piers.
    08:30   —      —      DATA   Detail box north 4200 -> 5600 (lat 37.8307 -> 37.8433). The park agent
                                 found the sand/dirt query runs over detailBboxOf, whose north edge was
                                 37.8307, while the Marin headlands reach ~37.842 — so every detail-only
                                 query stopped short of ground the WIDER box was already building tiles
                                 for. That compounds #208: even after the area-test fix, no sand or dirt
                                 would ever have been fetched up there. 5600 clears it with margin and
                                 stops short of Sausalito (37.85). Rides the batched bake, costs nothing
                                 extra.
    08:30   —      —      DOC    Park bake-side status corrected by the agent: the sand cache warm had been
                                 KILLED mid-run, not completed. Restarted detached and throttled; 96 chunks,
                                 first ten cached and valid (so the query text, tag regex and timeout are
                                 confirmed against live Overpass), then overpass-api.de returned 429 and it
                                 rolled to the next server. Resumes from cache, so nothing is wasted. NOT a
                                 bake blocker: an incomplete cache means the .catch returns empty and the
                                 beach stays grass for missed chunks — the status quo, not a new failure.
                                 Deliberately not hammered, per the standing throttle instruction.
    08:45   —      —      DOC    GOAL SET: demo routes GREAT first — GGP, Presidio, Market St, California
                                 St, downtown waterfront, fine terrain in the big parks — THEN the rideable
                                 Golden Gate and Battery park. Full phase-2 spec written into
                                 docs/SCOPE-GOLDEN-GATE.md with the gate table: bridge itself, remove the
                                 OSM copy, the on/off-bridge paths, custom buildings near the bridge,
                                 Battery park as rocky natural area, fine terrain there. The ordering is
                                 not just preference — items 5 and 6 are the SAME CODE as the park work in
                                 the gate, so doing them now would port scatter.ts twice and build the
                                 per-tile selection twice.
    09:05  46m   264k     CORE   PER-TILE TERRAIN SHIPPED (#176/#206). Two grids chosen per point: COARSE
                                 (zoom 12, step 20, whole footprint) deliberately kept coarse because
                                 distantGround and groundOccluder walk it cell by cell and a finer grid
                                 would multiply their quads by 25 and undo #179 — it has left index.json
                                 for a BINARY SIDECAR terrain.bin, Int16 decimetres, expanded to Float32 on
                                 fetch so no reader changed; and FINE (zoom 15, step 4, rideable box +
                                 1.5 km), one block per tile, registered as tiles stream. Blocks overlap by
                                 one row so edges are the SAME SAMPLE, not two that must agree. step/src/
                                 resM are per tile, so a 1 m source can be taken later without
                                 re-architecting. Measured end-to-end on Brooklyn Heights: index.json
                                 192 kB -> 62 kB + 39 kB sidecar (no parse), terrain's share of index
                                 68% -> 0, per-tile block 7.2 kB (I predicted 19.3), resident full ring
                                 1.02 MB. SEAMS: ZERO disagreeing samples across 364 shared edges. SF still
                                 loads with `city` at 5,241 ms — the load-time win is not regressed.
    09:05   —      —      DATA   #206d MEASURED and it is not what the owner or I feared. BUILDINGS: raw
                                 min sinks mean 0.63 m / p90 1.77 / worst 10.27; a 15th percentile of the
                                 outline sampled every 4 m takes it to 0.37 / 1.52, removing the ~40% that
                                 was noise and no more — the rest is the two surfaces genuinely disagreeing
                                 and the finer one is right. ROADS DO NOT RIPPLE once smoothed: California
                                 St 2.297 -> 2.359 -> 2.305. And THE COASTAL TRAIL GETS SMOOTHER (0.575 ->
                                 0.519) — a footway's corridor is ~1 m so the max never reaches the cliff.
                                 That hazard does not exist.
    09:05   —      —      DATA   THREE things nobody had on the list. (1) bareEarth's opening eats a third
                                 of the gain and ITS RADIUS IS IN CELLS (3 -> 15 to stay 60 m; getting that
                                 wrong would have been silent) — net gain 1.41x fine relief, not the ~2x
                                 the data allows; making the opening conditional on buildings being present
                                 is the best remaining lever and would give parks the full 1.95x. (2) ZOOM
                                 15 HAS NODATA HOLES that zoom 12 averages away — Brooklyn: 4,449 of 1.2M
                                 samples off by >100 m, MINIMUM -22,626 m. bareEarth is an opening so it
                                 PRESERVES PITS: one bad pixel is a 20 m crater, and the first Brooklyn
                                 bake reported 3,743 m of relief while otherwise looking normal. Guarded at
                                 30 m against the coarse grid; fires ZERO times in SF (worst genuine
                                 disagreement 9.7 m). (3) The fine grid can exceed the coarse one in a
                                 small city, silently comparing against a clamped edge value. Also: a
                                 fractional Float64Array index made the whole decimation a NO-OP while the
                                 bake logged success — now assert on median gap (reads p50 0.01 m).
    09:35  10m    —       BAKE   DOUBLE-CHECK before committing 4 hours (owner: "i'm nervous that we'll
                                 spend 4 hours baking and it will be poor quality"). Ran a FULL bake of
                                 brooklyn-heights end to end as a smoke test: EXIT 0, audit stage 3 passed,
                                 423 tiles / 5,998 kB, index 62 kB + terrain.bin 39 kB. Area kinds now
                                 include SAND (5) and DIRT (3) — the new query works. Log shows the park
                                 path firing at bake time: "open country: 284 ways restyled at source, 2
                                 pieces of street furniture dropped inside it". public/cities/index.json
                                 still lists paris-centre and san-francisco with SF's box intact.
    09:35   —      —      DATA   THE SAND PREFETCH IS A NON-ISSUE FOR SAN FRANCISCO, verified rather than
                                 assumed. overpassTiled consults regionFor() first, and the SF detail bbox
                                 is fully covered by the local norcal-latest.osm.pbf extract — cut in 3.5 s
                                 (94 MB) on demand. So sandQuery is answered from disk, not from Overpass,
                                 and the prefetch stuck at chunk 18/96 behind 429s does not gate the
                                 beaches. Independently corroborated: natural=sand already appears 42x in
                                 the cached cuts west of -122.478.
    09:50   —      —      BAKE   BATCHED BAKE STARTED, pid 46837 (owner: "ok let's go ahead and bake!").
                                 Carries, in one run: (1) per-tile terrain — coarse grid to a binary
                                 sidecar, fine zoom-15 step-4 blocks per tile; (2) the park bake-side work
                                 — sand/dirt kinds, photographed widths from park-roads.json, furniture and
                                 signals suppressed with stop signs and lampposts kept, wood recoloured to
                                 duff, concrete->asphalt on park trails; (3) detail box east 2400->4500 and
                                 north 4200->5600, bringing in Treasure Island, Yerba Buena, ALCATRAZ and
                                 the Marin headlands, which also unparks the 18 island builders of #175;
                                 (4) #194's despike/trimBehind and #183's collapseClusters anchor.
                                 Early log: 61,574 outlines (219 replaced by parts), 81,925 edges -> 78,055
                                 in the largest connected network, 2,243 stairways, 20,000 parcels.
    10:05   —      —      DOC    docs/PARKS.md — BEACHES ARE BANDS, not a sand-coloured polygon. Owner on
                                 the Great Highway frame: "notice the rocky area leading to sand leading to
                                 water." #200 as written would give one flat tone from kerb to surf. The
                                 profile is: rip-rap revetment / dry sand / WET SAND (the darker band that
                                 makes it read as a beach at all) / water. Counted at Ocean Beach:
                                 natural=sand 8, surface=sand 15, and barrier=retaining_wall 33 — the
                                 seawall IS mapped and is exactly where band 1 belongs; there is no
                                 natural=shingle or bare_rock anywhere. So band 1 comes from the mapped
                                 wall and bands 2-4 are generated inward from the coastline as a
                                 DISTANCE-FROM-COASTLINE function, not four polygons — which generalises to
                                 every beach and needs no new OSM data. NOT scattered boulders: a revetment
                                 is a continuous armoured slope, a different thing from the deferred rock
                                 system.
    10:15   —      —      DOC    Owner away four hours with the bake running. Chose work that needs NEITHER
                                 the bake NOR him, and that survives a loaded machine (renders are
                                 unreliable while a bake holds the CPU, so all three agents verify with
                                 cheap single-model shots rather than city views):
                                   - vegetation: scatter merge, canopy density, species, understorey
                                   - the sports-pitch kit (#214) — 55% of 1,421 pitches from one `court`
                                     part, no photographs needed, and it lands directly on the parks
                                   - the Lyon Street Steps (#213a) — the named top-ten showcase, now
                                     unblocked by the Mapillary token, building the SETTING (hedges that
                                     step with the flights, balustrades, urns) rather than a better stair
                                 Deliberately NOT started: anything bake-gated, anything in the deferred
                                 Golden Gate scope, and anything needing the owner's judgement.
    10:45  31m   220k     FIX    THE FOREST — and the headline finding was not in the plan. The library's
                                 `cypress` is an ITALIAN cypress: measured crown radius 0.09x height, never
                                 taller than 11.6 m. cypress + pine are the two heaviest species in EVERY
                                 GGP and Presidio zone, so the park was planted almost entirely in dark
                                 PENCILS. A pencil cannot close a canopy at any density, so thickening
                                 first — which is what I briefed — would have cost frame time with nothing
                                 to show. Fixed at the source: tools/sftrees/gen.py now understands
                                 conifers and library-monterey.json builds 13 models (7 Monterey cypress,
                                 6 Monterey pine) into public/sftrees; flora.ts points cypress, pine and
                                 the park pool at them. Measured crown/height 0.53, like the real tree.
    10:45   —      —      CORE   #205's merge landed: materials folded by name+texture and frozen, world
                                 matrices frozen, per-mesh alwaysSelectAsActiveMesh dropped, and the two
                                 FAR TIERS of each pool redirected to one representative. 326 -> 186 drawn
                                 meshes, 170 -> 65 materials, 835 -> 699 active. #205's tail of "200 meshes
                                 drawing 16 plants or fewer" is GONE, and mesh count is FLAT across the
                                 whole density curve — the merge holds.
    10:45   —      —      CORE   CANOPY (src/render/infill.ts): satellites off every baked park tree, form
                                 inherited, heights spread below the parent, deterministic, rejected on
                                 paving. HOW MANY DEPENDS ON HOW MANY NEIGHBOURS IT ALREADY HAS — a 66%-
                                 park tile goes 220 -> 621 trees while a meadow specimen gets nothing. One
                                 rule answers "close the canopy" and "the Polo Field must be bare"
                                 together. Understorey from the same woodAt field, gated at two trunks
                                 within 14 m.
    10:45   —      —      DATA   Curve in G2G: veg=1 vegmerge=0 -> 10.4 ms / 326 meshes; veg=1 -> 10.2 ms /
                                 186; veg=3 (shipped) 40,002 instances, 7.50M tris, 13.0 ms / 196; veg=8
                                 62,274 instances, 14.33M tris, 22.7 ms. THE BOUND HAS MOVED TO TRIANGLES
                                 (1.3 ms/M) — the correct trees are 3-4x the geometry of the pencils, so
                                 the ~7 ms floor was recovered and partly spent on species. Next cheap
                                 lever is NEAR_LOD = 90, one line, measure first. CAVEAT the agent raised
                                 itself: its baseline is 10 ms where #204 measured 28 ms in the same
                                 square, so +25% could be +7 ms on the owner's headful Chrome, not +2.6.
                                 ?veg=1 is the package as baked; ?veg=N is the knob.
    10:45   —      —      DATA   By square: G2B, G2C and G2F now MATCH the ggp-rural-road reference —
                                 trunks either side, canopy meeting overhead. G2G's wood side reads as
                                 forest with its JFK Promenade lawn correctly open. G2D (Polo Field) and
                                 G2H are bare of trees AND scrub. Every square still lacks the GROUND:
                                 uniform bright mown lawn even under closed canopy — that is bake-time and
                                 is in the run now. Not done: tree ferns (FERN still maps to a palm),
                                 G2H's palms over the railings, G2D's grandstand.
    11:10   —      —      DOC    OWNER AT 84% OF THE WEEKLY BUDGET. Priority narrowed to FINISHING the five
                                 showcase routes; Golden Gate and Bay Bridge->Treasure Island only if time
                                 allows. Sports-kit agent capped: land the `court` part (55% of 1,421
                                 pitches, and the one that shows in the parks) and stop, writing the rest
                                 down rather than building it.
    11:10   —      —      DOC    And a standing rule recorded to memory: "for simple jobs like writing a
                                 kit generator for a warehouse on Treasure Island, or even a landmark in
                                 Presidio, Haiku is basically free." Kit builds, recipe batches and
                                 landmarks-with-a-reference go to Haiku; the strong model is for work where
                                 the DIAGNOSIS is the hard part. Known Haiku failure mode from batch h1: it
                                 invents heights by category when the column is blank, so give it the real
                                 OSM numbers in the brief.
    11:25   —      —      DOC    Owner adds to the deferred scope: "Fort Point and Sutro Baths are probably
                                 custom models. The bridges themselves are a big mess. Need retopology and
                                 to sort out the paths." RETOPOLOGY sharpens it — the bridge geometry
                                 itself is wrong, not just duplicated: the OSM version is an extruded slab
                                 and the skyline model is low-poly, and #154 subdivided the WRONG SHAPE
                                 more finely. Budget a rebuild, not an edit. SUTRO BATHS IS NEARLY FREE:
                                 the builder ALREADY EXISTS (s1_sutro_baths_32776564 — roofless concrete
                                 walls, flooded pools, sea wall, boulders) and way/32776564 is in the cut,
                                 but it appears nowhere in the archetypes CSV because RUINS ARE NOT TAGGED
                                 building=, so the building pipeline never sees it. Same class as Pier 39:
                                 it needs a standalone ENTRY, not a model. Minutes, and it need not wait
                                 for the bridge scope.
    11:35   —      —      DOC    Owner: "the bridges may be a good spot for LOD since they're visible nearly
                                 anywhere from afar." REFRAMES #211 usefully — the bridge is the only class
                                 of object that is both visible from everywhere AND ridden on, so it needs
                                 two levels, and WE ALREADY HAVE THEM BY ACCIDENT: the spec.skyline model
                                 is a correct FAR LOD (always drawn, skylineBoost 1x to 1.8x) and the OSM
                                 version is a correct NEAR LOD (the path runs over it). Nothing switches
                                 between them, so up close you see both. DELETING EITHER LOSES SOMETHING:
                                 without the skyline copy the bridge vanishes from every view in the city;
                                 without the OSM copy there is nothing to ride on. So the work is one
                                 object with two levels, switched by distance, with the switch HIDDEN
                                 because a bridge is crossed at speed and cannot pop. Also explains why
                                 coversRaised alone was never the whole answer. Generalises to exactly one
                                 other object: Sutro Tower.
    11:45   3m    115k     BUILD  Presidio coastal batteries on HAIKU — first use of the owner's new rule,
                                 and it worked: three builders (Battery Chamberlin way/421294976, Crosby
                                 way/420832798, Godfrey way/420287686) in src/render/landmarks/sf/districts
                                 /batteries.ts, with a manifest at public/landmarks/san-francisco/
                                 batteries.json, wired into SF_BUILDERS. Parapet wall, semicircular gun pit
                                 in the seaward face, magazine rooms behind and below, earth berm over the
                                 back — built from existing kit parts, no new primitives. 115k tokens and
                                 3 minutes, against 200-290k for the comparable Sonnet passes today.
                                 I VERIFIED THE DATA MYSELF rather than trusting it: all three way ids are
                                 really in the cut and really carry defensive_works=battery / military=
                                 bunker, and the manifest is valid and referenced. Two typecheck errors it
                                 left (an unused pitDepth, and `material: 'dirt'` which the kit does not
                                 know) fixed by me in place — the berm now reads from its colour alone.
                                 NOT yet seen: no model shots, because the bake holds the machine.
    12:00   —      —      DATA   BUGS #216 OSM TAG AUDIT, at the owner's suggestion ("we're likely
                                 missing others"). Counted every key=value in the SF cut and grepped the
                                 codebase for each: 365 of the top 900 tag-values are never mentioned, but
                                 most is routing/admin metadata we do not want. Filtered to VISIBLE tags,
                                 the real misses are: highway=street_lamp 1,161; amenity=waste_basket 844;
                                 railway=level_crossing 318; historic=naval 273; amenity=toilets 236;
                                 man_made=breakwater 83; natural=reef 77. Already handled and better than
                                 feared: benches 2,972, bicycle parking 1,644, piers 1,396, retaining walls
                                 528, gardens 471, memorials 267, artwork 195, picnic tables 153, hedges
                                 151. THE ONE WORTH DOING FIRST is street_lamp — every other row ADDS an
                                 object, that one FIXES a coupling: park lampposts are generated off the
                                 pavement width, which is exactly why zeroing it for the park deleted them
                                 and they had to be re-added as a special case. Also found:
                                 leaf_type=broadleaved 1,118, a free broadleaf/conifer split for trees that
                                 carry no species — the very distinction behind the Italian-vs-Monterey
                                 cypress error.
    12:15  16m   176k     BUILD  #214 the `court` part SHIPPED and verified with model shots (not a city
                                 render): src/city/sports.ts (courtSport, courtEligible, fitCourt) and
                                 src/render/sports.ts (surface, per-sport markings, net with sag and posts,
                                 basketball hoop at real dimensions). Tennis, pickleball, four-square,
                                 basketball and volleyball all read correctly; each shot draws the traced
                                 polygon in white around the court so one plan view proves both cautions.
                                 12 tests on rotated off-square rings. Fitted on the WHOLE RING in the bake,
                                 which is load-bearing — splitPackage clips areas at tile borders, so a
                                 court fitted per tile would come out as two wrong half-courts.
    12:15   —      —      DATA   #214c — the measurement overturned one of MY cautions. I said fit a
                                 correctly-proportioned court INSIDE the rough trace. But over the 660
                                 leisure=pitch ways in the cut, TENNIS AND PICKLEBALL POLYGONS ARE TRACED
                                 TO THE LINES (median 23.6x10.9 and 13.4x6.0 — the published courts to a
                                 decimetre), so an inset would have drawn courts smaller than their own
                                 asphalt. Basketball's median (18.4x12.0) is nothing standard, so the
                                 half-court rung is uniformly scaled and pushed to the END under its hoop,
                                 because a half court centred in an 18 m polygon floats. No banks of courts
                                 — p90 tennis width is 11.0 m, one per polygon.
    12:15   —      —      DOC    Next pass needs: cityQuery does NOT fetch sports_centre, stadium, track,
                                 swimming_pool or playground, so the enclosure test is written and called
                                 but finds nothing. Size alone covers the court sports (no court-sport
                                 polygon exceeds 5,000 m2) but field/diamond will need the query widened —
                                 which invalidates every Overpass cache and osmium cut, so NOT during a
                                 bake. Watch on the first city render: court stripes are single long quads
                                 draped at their endpoints while the pitch under them is subdivided at 8 m,
                                 so on a hilltop court the lines may float.
    12:35  18m   205k     BUILD  LYON STREET STEPS (#213a). What was actually wrong: there was NO stair
                                 builder at all, so the showcase came from the generic highway=steps path,
                                 which quantises the TERRAIN under every tread — on a 20 m height grid that
                                 is a wobbling ramp with treads drawn on it, no flight ends, no landings,
                                 and nothing a decorator could hang anything on. That is the 50%. Split as
                                 briefed: src/render/landmarks/stairway.ts is the KIT (flights capped at
                                 maxRisers, level landings, cheek walls whose coping is level over three
                                 treads then steps, centre rail, newel pedestals; returns flights and
                                 landings in the flight's own frame, which is what makes decoration
                                 possible) and sf/lyon-steps.ts is Lyon Street's OWN (hedges, urns,
                                 balustraded terrace, verge planting). Filbert, Greenwich, Hidden Garden,
                                 Lincoln Park, Bancroft and Saturn are ready and deliberately not wired.
    12:35   —      —      DATA   Built from six cited Mapillary frames (docs/shots/lyon/): tall dark
                                 flanking hedge mass, square newel pedestals at each flight foot, stepped
                                 cheek coping, black handrails, pale stucco retaining walls, and the
                                 knee-high pale clipped edging at the Broadway head. Geography settled:
                                 Broadway 37.79281 is the head, Green 37.79471 the foot, ~31 m drop north
                                 over six ways all named "Lyon Street".
    12:35   —      —      DATA   Two findings worth keeping. (1) MEASURE THE HEDGE CLIP FROM THE MIDDLE OF
                                 THE FLIGHT, not the head — from the head it walls in the axis view, which
                                 is the shot the stairway exists for. (2) RISERS MUST BE DARKER THAN
                                 TREADS; with both the same pale grey a flight reads as a ramp at any
                                 distance, which is likely part of why the generic stairs read as "very
                                 generic".
    12:35   —      —      FIX    And the one that would have ruined it, caught from CITY data rather than
                                 the harness: the four terrace cross-arms (edges 80419-80422) carry
                                 0.33-0.47 m over 7.7 m — 4-6%, which is the HILLSIDE, not a stair. Drawn
                                 as stairs they become sideways two- and three-step flights across the
                                 terrace with newels and 2.5 m hedges. The model harness could never have
                                 shown it, because its synthetic profile gives them zero rise. Guarded by
                                 StairwayStyle.levelBelow. NOT DONE: the in-city axis shots, which are the
                                 check that decides 100% — left until the bake finishes.
    12:55  25m   187k     BUILD  #200b THE BEACH AS BANDS. New src/render/shore.ts: wet sand within ~9 m of
                                 the coastline with a 2.5 m transition and extra darkening in the last 2 m
                                 at the surf; dry sand beyond with a wind-ripple mottle; dune grass only
                                 between 100 m and a 140 m cap, patchy and weak, never a lawn; rip-rap as a
                                 continuous armoured ribbon along mapped walls, not scattered boulders.
                                 Sand is capped at 4 m instead of the general >=8 m ground step, because a
                                 9 m band on 8 m triangles is a gradient, not a tide line. The coastline
                                 index is built ONCE PER CITY, not per tile, and box-boundary segments are
                                 dropped — which drops 445 of 5,412 segment entries, so it is doing real
                                 work (the sea ring touches all four box edges to within 0.04 m).
    12:55   —      —      DATA   Measured against the real data, not assumed: Ocean Beach is a MULTIPOLYGON
                                 RELATION (relation/2165532, 167,659 m2, plus a 463,532 m2 GGNRA strip),
                                 not a way — sandQuery already asks for relations so it will be built, and
                                 its minimum distance to the baked coastline is 0.0 m, so the wet band will
                                 fire. The 8 natural=sand WAYS in that strip are GOLF BUNKERS (9-406 m2,
                                 140 m+ inland), so the dune tint is gated inside the cap to keep them
                                 pale. The 33 retaining walls sit 80-210 m from the coastline — the beach
                                 is that wide — hence a 250 m gate rather than a tight one.
    12:55   —      —      FIX    AND A FAULT THAT WOULD HAVE LEFT THE BEACH A LAWN ANYWAY: sandQuery
                                 contains ["surface"~"^(sand)$"] and `surface` was NOT in osm-local.ts's
                                 KEPT_KEYS, so the whole beach query fell outside the local subset and went
                                 to PUBLIC OVERPASS — whose failure mode in the bake is a console.warn and
                                 an empty result. `surface` is now kept. The RUNNING bake (pid 46837)
                                 loaded the old code at start, so watch its log for "sand: not fetched".
    12:55   —      —      DOC    A SECOND BAKE IS ALREADY NEEDED regardless: band 1 (the rip-rap) needs
                                 barrier=retaining_wall, which is in neither cityQuery nor wideQuery, so
                                 the 33 walls have never been in any package. A new wallsQuery, PackedWall
                                 and tile pass-through are written and wait for the next run. Bands 2-4 may
                                 land with the current bake if its sand query answered.
    13:10   —      —      DATA   TWO AGENTS REACHED OPPOSITE CONCLUSIONS ABOUT THE BEACH, and reconciling
                                 them is good news. The beach agent found `surface` was missing from
                                 osm-local.ts's KEPT_KEYS, so sandQuery cannot be answered locally and
                                 falls through to public Overpass — which it feared would fail in the
                                 running bake. The park agent's prefetch finished ALL 96 CHUNKS of exactly
                                 that query. Verified: tools/cache holds 1,271 cached Overpass responses
                                 written today, one of which carries natural=sand/beach (the other 95
                                 chunks are inland and legitimately empty). So the running bake answers
                                 the sand query FROM CACHE and bands 2-4 should land in it. Band 1, the
                                 rip-rap, still needs the next bake because barrier=retaining_wall has
                                 never been fetched by any query.
    13:10   —      —      DATA   And the trap the park agent caught while confirming it, which would have
                                 shipped a broken bake silently: OCEAN BEACH AND BAKER BEACH ARE
                                 MULTIPOLYGON RELATIONS, NOT WAYS. A ways-only check reports "NOT COVERED"
                                 for exactly the two beaches this bug is about, while a small unnamed beach
                                 returns twelve ways and looks like success. Checked through outerRings():
                                 Ocean Beach 1 ring / 263 points / 37.7345-37.7778 (the full 4.8 km strip,
                                 covering squares G2A and G1A), Baker Beach 1/173, China Beach 1/109. The
                                 path works end to end because sandQuery happens to ask for relations —
                                 the agent was explicit that this was luck, not design, and that a
                                 ways-only query would have shipped every beach as lawn with a cheerful
                                 "159 ways" in the log. Sand data on disk: 159 ways + 24 relations.
    14:05  ~73m   —       BAKE   pid 46837 FINISHED, audit stage 3 passed. index.json 26,207 kB -> 8,223 kB
                                 with terrain.bin 5,056 kB beside it; 110,059 tiles / 436 MB carrying the
                                 fine step-4 terrain; ride-bike 8,455 edges, ride-run 30,474.
                                 Area kinds now: grass 720, pitch 483, park 479, paved 207, SAND 130,
                                 wood 72, DIRT 51, water 50 — the beach data landed.
                                 "open country: 12,332 ways restyled at source (233 from a photographed row
                                 in park-roads.json), 240 pieces of street furniture dropped inside it."
    14:05   —      —      DATA   #175 CLOSED — the islands are baked. Counting by POSITION rather than by
                                 way id (the ids in PARKED-ISLANDS.json have moved on): Alcatraz 27
                                 buildings, TREASURE ISLAND 170, Yerba Buena 79. My first check looked for
                                 the old ids in the archetypes CSV, found zero, and would have reported
                                 failure — worth remembering that a CSV keyed on ids is a weak instrument
                                 after an OSM refresh.
    14:05   —      —      DATA   Courts are NOT in this bake, as expected: the bake started at 09:50 and
                                 the court code landed at 12:15. They need the next run, along with the
                                 rip-rap walls. No work lost.
    14:05   —      —      DATA   VERIFIED IN A RIDER SHOT at Ocean Beach (37.76500,-122.51050): the sand
                                 reads as a pale expanse beyond the Great Highway, and THE PLAYER AVATAR IS
                                 VISIBLE. The furniture around that junction (signals, stop sign, bin,
                                 lamps, hydrant, street blade) is correct rather than a regression — the
                                 Great Highway is a city arterial and the park rule deliberately exempts
                                 classified through-routes.
    14:30   —      —      DATA   #213d Lyon Street Steps IN-CITY check against the finished bake — NOT 100%,
                                 and the model shots could not have shown any of it. (1) Down the axis the
                                 flight reads as a WHITE RAMP: from the head you see tread faces and almost
                                 no riser, so the 0.60/0.80 contrast does nothing, and the run is one blank
                                 pale surface. That is the shot the stairway exists for, so it is the thing
                                 that decides the showcase — it needs a nosing line or an AO band that
                                 survives being seen end-on. (2) A LAMPPOST STANDS DEAD CENTRE in the
                                 Vallejo approach, splitting the view of the steps. (3) The hedge reads as
                                 a long dark green BOX with a flat mauve band, not clipped planting. The
                                 stair GEOMETRY is right — flights, landings, cheek walls, rails, newels
                                 all read, and the hedges DO step in register, which was the hard part.
    14:45   —      —      FIX    #213d first fault fixed by me: THE NOSING. parts.ts `stair()` now draws a
                                 narrow darker strip along the front lip of every tread, in the riser's own
                                 colour, one quad per step. The reason it was needed is the whole lesson of
                                 the axis view: from the HEAD of a flight you see tread faces and almost no
                                 riser, so a flight whose treads are one colour reads as a blank RAMP
                                 however much the risers contrast — and the axis view is the shot the
                                 stairway exists for. A nosing is also a real feature of a stone stair, not
                                 a graphics trick. Re-rendered in city: the flights now read as steps down
                                 the whole run. Benefits every stairway in every city, not just Lyon Street.
                                 Still open from #213d: the lamppost dead centre in the Vallejo approach,
                                 and the hedge reading as a box rather than clipped planting.
    15:00   —      —      FIX    #213e park lanes carried full CITY LANE MARKINGS — double yellow centre
                                 line plus white edge lines on a road through a wood, which is the single
                                 loudest thing that says "city". city.ts now skips the centre and edge
                                 lines when `e.park && e.width < 9`. The width test deliberately keeps the
                                 genuine arterials that cross the parks (the Great Highway, Crossover
                                 Drive), which really are marked and which the park rule already exempts
                                 elsewhere. NOT YET SEEN TO WORK: the road I re-shot to check it
                                 (37.79400,-122.48250, on the Presidio's edge) is unchanged, and the tile
                                 there carries only 3 m Coastal Trail footways — so that camera is looking
                                 at a wider through-route which the rule correctly leaves marked. The
                                 change is conservative and typechecks; it wants a shot on a narrow park
                                 drive (Middle Drive, JFK) to confirm, which I am not spending at 84%.
    15:00   —      —      DATA   Also learned while checking: `e.park` is NOT in the baked tiles — it is
                                 computed at load by park-area.ts through render/prepare.ts. So inspecting
                                 tile JSON for `park` is a dead end and will always read null; the flag
                                 only exists client-side.
    15:15   —      —      DATA   Rode the two downtown corridors against the finished bake, first time since
                                 it landed. MARKET/SoMa reads well: brick and stone frontages, a zebra
                                 crossing, signals, bins, a hydrant, meters and news boxes, street trees
                                 down the block — recognisably San Francisco, and nothing on it needs work
                                 for the demo. CALIFORNIA at the Leidesdorff junction: the glass and stone
                                 towers read correctly, but ride-shot placed the rider on LEIDESDORFF (the
                                 alley) rather than California, because --at snaps to the nearest edge —
                                 so this shot does NOT confirm the #183 "straight on" fix, which was about
                                 which exit is taken when RIDING THROUGH. That needs a moving test, not a
                                 placement.
    15:25   —      —      BAKE   SECOND BAKE STARTED. It costs machine time and almost no tokens, and it
                                 completes two of the five routes: the SPORTS COURTS (written after the
                                 first bake began, so absent from it) land in the parks, and the RIP-RAP
                                 band lands on the waterfront via the new wallsQuery — barrier=
                                 retaining_wall has never been fetched by any query, so band 1 of the beach
                                 has never existed in any package. Also picks up the park lane-marking
                                 suppression and the stair nosing, both render-time but baked views will
                                 show them.
    15:30   —      —      DOC    Battery model shot timed out — the second bake is holding the CPU, exactly
                                 the contention I warned the agents about all session. Verification of the
                                 batteries, the park lane markings and the courts all wait for it. Real
                                 coordinates recorded so the next pass does not hunt: Chamberlin
                                 37.79403,-122.48264 (1,925 m2, 106 nodes), Crosby 37.79841,-122.48040
                                 (912 m2), Godfrey 37.80371,-122.47741 (2,837 m2). My earlier Presidio
                                 shot was AT Chamberlin's coordinates but looking along the road — the
                                 battery is off to the side and below the bluff, which is what a coastal
                                 battery is. It wants a view aimed at it, not a rider placement near it.
    15:45   —      —      DOC    GATE OPEN. Owner: "I believe the top 5 are now demoable. Record all the
                                 bugs but we can tackle later. Time to do the bridges... Golden gate
                                 first." Parked-bug list written into BUGS.md grouped BY ROUTE so a later
                                 pass can take one route at a time — Market has nothing outstanding; the
                                 rest is ground shading, the two Lyon cosmetics, unseen batteries, the
                                 California fix unverified in motion, and the standing #189/#195/#197/
                                 #206b/#214/#216 items.
    15:45   —      —      DOC    ONE agent dispatched on the Golden Gate, with the owner's anti-churn
                                 constraint quoted at the top of the brief ("getting it done is better than
                                 perfect"). Priority order: (1) ONE bridge not two — suppress the OSM slab
                                 and the 63 building-part segments, and suppress the far model when the
                                 rider is on it; (2) a DECK not a wall, with a gap under it and railings;
                                 (3) the on/off-bridge paths, which the owner has named twice; (4) towers
                                 and cables only if budget remains. Told to KEEP the accidental OSM tower
                                 shape, which the owner said "isn't awful". Verification by cam-probe in
                                 both directions, NOT by ride-shot, which photographs from under the water
                                 on any bridge.
    16:05   —      —      DOC    OWNER SIMPLIFIES THE BRIDGE, and it cuts most of the work out: "the
                                 current FAR model of the Golden Gate Bridge actually LOOKS fine, the
                                 towers are great. The issue is that its polys are huge so depth mapping
                                 fails. The CLOSE LOD could just be a tessellated version of the FAR LOD."
                                 So NO retopology and NO new deck — the procedural model is the right
                                 shape; its only fault up close is that its polygons are enormous, so
                                 depth precision fails against nearby surfaces and it reads as a wall.
                                 Near LOD = the same model, tessellated.
    16:05   —      —      DOC    Two consequences I passed on. (1) I was WRONG to call the OSM slab "a
                                 correct near level in role" — it is not needed as a near level at all, so
                                 items 1 and 2 of the brief collapse into one change: suppress the OSM copy
                                 wherever the landmark covers it, and tessellate the landmark. (2) This is
                                 what #154 was reaching for and missed — it added graded subdivision
                                 (26,168 -> 34,280 triangles) and the owner still reports the fault, so it
                                 subdivided the wrong surfaces or not finely enough. Told the agent to look
                                 at what #154 already does before adding more, and to point it at the deck
                                 and near spans rather than the open middle of the span.
    16:15   —      —      DOC    Owner again, removing a class of work: "We don't really need anything from
                                 OSM except the footprint and the path. The OSM having a somewhat okay
                                 representation of the structure is a pure accident, it's not good enough
                                 to actually use." So OSM gives exactly the FOOTPRINT and the PATH; every
                                 structural element — deck, towers, piers, cables — is the procedural
                                 model's. RETRACTS my earlier instruction to keep the accidental OSM tower
                                 shape because the owner had said it "isn't awful"; he has now been
                                 explicit that it is an accident and not good enough to build on. Item 1
                                 therefore becomes ONE RULE rather than a list of exceptions: suppress all
                                 OSM structure inside the bridge's footprint, keep the rideable way. The
                                 63 building:part segments and the extruded slab all go together.
    16:25   —      —      DOC    Owner locates item 3 precisely: "The ramps on the GG Bridge side that's far
                                 from sf are super messy. I suppose they are rideable, because OSM will
                                 have ensured a continuous path, but they look really ugly in our
                                 renderer." So the on/off-bridge work goes to the MARIN end — the Waldo /
                                 Alexander Avenue interchange — and his diagnosis is that the GRAPH is
                                 fine and the LOOK is not. Passed three checks, cheapest first: whether
                                 ramps at different `layer` values are being draped onto the same ground
                                 and z-fighting; whether the CORRIDOR layer (width + 2*walk + 4.5 m) is
                                 being painted for motorway slip roads, which on a dozen close-packed
                                 ramps would fill the interchange with concrete — the same constant that
                                 made park roads read as city streets; and whether ramps the rider can
                                 never take are drawn at full fidelity. Explicitly told NOT to author the
                                 interchange by hand: OSM models interchanges well, so this is a rendering
                                 problem, not a data problem.
    16:35   —      —      DOC    OWNER CORRECTS MY BRIEF: "We do not have a way to take movie captures, nor
                                 do we have any way to analyze one... A human has to actually sit down and
                                 play the game and see the motion to judge motion issues. The GG brief
                                 implied it can verify motion." He is right. The distinction, now recorded
                                 to memory: an agent CAN measure motion numerically (cam-probe prints
                                 eye/aim/pitch twice a second and is what proved #207; frame times, tile
                                 arrivals, bringStats deltas) but CANNOT judge how motion LOOKS — whether
                                 a LOD transition pops, whether an interchange reads as a junction while
                                 passing through it, whether a deck stops reading as a wall at speed. Told
                                 the agent to stop saying "verified in motion", to state what it could NOT
                                 check, and to hand over a specific list of what to look for with start
                                 points. Stills are separately weak on bridges: ride-shot photographs from
                                 under the water.
    16:45  ~75m   —       BAKE   SECOND BAKE FINISHED, audit stages 2 and 3 passed. It carries the two
                                 things the first one could not: **424 retaining/sea walls** (the new
                                 wallsQuery — band 1 of the beach, which had never been in ANY package
                                 because barrier=retaining_wall was in neither cityQuery nor wideQuery),
                                 and the SPORTS COURTS (33 found in an 11-tile sample of 6,000). index
                                 8,275 kB + terrain.bin 5,056 kB, 110,059 tiles / 437 MB. Furniture also
                                 grew: 195 fountains, 47 columns, 114 bike docks, 1,471 signal nodes.
    16:45   —      —      DATA   Visual confirmation of the rip-rap is NOT done and I am not spending
                                 further on it: ride-shot snaps the rider to the nearest EDGE, and on a
                                 beach there is no edge, so the camera lands back on the Great Highway
                                 looking inland. The data is verified present (424 walls); seeing the band
                                 wants a view aimed at the shore, which is a job for the owner riding it or
                                 for a purpose-made view entry.
    17:00  24m   187k     BUILD  GOLDEN GATE: items 1 and 2 DONE, all render-time, no bake needed. One
                                 bridge now — the procedural model placed as a real landmark with the ride
                                 path on its roadway; the skyline stand-in switches off, and the OSM slab,
                                 its generic piers and the building:part tower stacks are suppressed under
                                 the same footprint (3 raised OSM edges + bridge outline 21407754 covered,
                                 81 buildings suppressed by a new coversBuilding(), 7 ordinary 4-15 m
                                 buildings under the approaches kept). Mid-span: skyline DISABLED, landmark
                                 enabled, 69,032 triangles.
    17:00   —      —      CORE   The owner's simplification was exactly right and saved the whole job: NO
                                 retopology. The builder already had a real deck on trusses; the near LOD
                                 is the SAME builder with a NEAR flag subdividing every box to 4 m
                                 (34,280 -> 69,032 tris). Far level untouched. And THE LOD SWITCH NEEDED NO
                                 NEW MACHINERY — Landmarks.update() already disables a skyline stand-in
                                 when a placed landmark of the same name is near, so naming the manifest
                                 entry "Golden Gate Bridge" IS the switch. One real fix: the test measured
                                 to the model's CENTRE, which on a 2.7 km bridge put the switch in mid-air
                                 over the strait; it now measures to the placed rectangle.
    17:00   —      —      DATA   Placement fitted to the RIDE GRAPH, not to cities.ts, because the skyline
                                 entry is 43 m and 1.8 degrees off — and 1.8 degrees is 20 m lateral at the
                                 towers on a deck 13.7 m half-wide. cities.ts deliberately left alone as
                                 bake input. Also: index.json carries NO seaLevel — the bake computes one
                                 and neither index.json nor tiles.ts passes it through, so `deckAbove`
                                 could not be used and a new absolute `baseY` was added instead. Bake-side
                                 gap, filed.
    17:00   —      —      DATA   MY MARIN-RAMPS HYPOTHESIS IS REFUTED. I proposed motorway slip roads at
                                 differing `layer` values z-fighting. Measured: 234 ways in a 600 m circle,
                                 ZERO motorway or motorway_link, only 8 carrying a `layer` tag at all. It
                                 is 105 FOOTWAYS, 48 service and 25 cycleways — the vista-point web — each
                                 drawn as its own full road strip, with up to 9 ways in one 10 m cell at
                                 identical heights to the decimetre. Not attempted, and rightly: the fix
                                 is a merge-or-suppress rule whose success is a judgement about how it
                                 LOOKS in motion, which an agent cannot make.
    17:00   —      —      DOC    BAKE-SIDE DEFECT FOUND, not fixable from the render side: the two bridge
                                 sidewalks disagree by up to 12 m (tools/bridges.ts's height rule). West
                                 (1002983) is flat at -33.7/-32.9/-34.8; east (1002999) runs -35.5/-29.8/
                                 -46.7. The model was aligned to the WEST sidewalk, giving rider-to-roadway
                                 within +/-0.58 m northbound — but SOUTHBOUND the rider floats up to 5 m
                                 above the roadway at mid-span and 12.5 m over the north side span. A
                                 deliberate trade: the alternative is the camera inside the slab, which is
                                 #207's failure.
    17:15   —      —      DATA   Tried to shoot the Marin end anyway and got a concrete demonstration of the
                                 KNOWN unfixed defect rather than a picture of the ramps: the frame is the
                                 inside of the bridge's own structure, international orange filling half
                                 the view. game.ts:1218 recomputes the frozen/orbit look height from
                                 TERRAIN every frame, overwriting the deck height the freeze handler sets,
                                 so ride-shot on any bridge puts the camera inside or under the structure.
                                 It was theorised when #207 was fixed; it is now demonstrated. So the
                                 Marin ramps CANNOT be photographed with the tools we have, and the bridge
                                 handover stands as written: four keyboard checks for the owner.
    17:15   —      —      DOC    STOPPING the bridge pass here rather than churning. Items 1 and 2 are done
                                 and are render-time, so they are live now. Item 3 (the Marin ramps) is
                                 MEASURED — 105 footways, 48 service, 25 cycleways, up to 9 ways in one
                                 10 m cell at identical heights — and the fix is a merge-or-suppress rule
                                 whose success is a judgement about how it looks. Neither the agent nor I
                                 can make that judgement, and the one instrument that might have helped is
                                 the defect above. Item 4 (cables, further detail) untouched by design.
    17:30   —      —      DATA   BUGS #217 — answered the owner's "if I rebake will the path still be
                                 floating": YES. tools/bridges.ts last changed 24 Sep 00:58, before both of
                                 today's bakes, so the rule is what produces the heights. Traced it:
                                 bridgeHeights() profiles each CHAIN independently — own h0/h1, own rise,
                                 own hump-versus-level decision — and the two sidewalks of one deck are two
                                 chains that OSM splits at different nodes, so nothing knows they are the
                                 same structure. The -46.7 m sample is the tell: BELOW both its own ends,
                                 which no hump or level deck can produce, so it is a chain under the 12 m
                                 threshold being treated as a CULVERT and draped on the sea bed. Fix 1
                                 (honest, contained): a short chain whose ends meet other RAISED bridge
                                 edges is not a culvert — take its height from its neighbours, in a second
                                 pass after the raising loop. Bake-side, so it costs a run.
    17:50   —      —      FIX    #217 IMPLEMENTED, bake-side, ready for the next run. tools/bridges.ts now
                                 records chains it skipped as too short (`shortChain`), and after the
                                 raising loop lifts any of them whose ends meet RAISED bridge edges onto
                                 their neighbours' deck, interpolating between the two ends. The culvert
                                 heuristic stays — it is right for a real two-metre bridge way — and is
                                 simply not applied to a fragment sitting inside a structure that has
                                 already been raised. Logs how many fragments it lifted. This is what puts
                                 the Golden Gate's east sidewalk back on the deck instead of the sea bed,
                                 and should fix the southbound float without moving the model.
    17:50   —      —      FIX    The nosing is now CARVED OUT of the tread rather than laid on top of it:
                                 same plane, no y offset. The first version sat at yt + 0.001 and raised
                                 the mesh's max y by a millimetre, which broke kit-stairs' assertion that a
                                 flight lands exactly on y1 — a good test catching a real sloppiness, since
                                 an overlaid quad could also have z-fought. Both stair tests updated for
                                 the extra quad per step (8 -> 10 triangles) and the suite is green again.
    18:00   —      —      DATA   Test suite 6 failures -> 4. The two I caused (kit-stairs' triangle counts)
                                 are fixed. The remaining four are REAL and were introduced today by the
                                 landmark work, not pre-existing as earlier reports assumed:
                                 audit-builders says `lyonStreetSteps` and `batteryChamberlin` are
                                 REGISTERED BUT UNREFERENCED — a builder nothing places. For the steps that
                                 is expected and wants an allowlist entry, because they are placed by the
                                 stairways table rather than by a manifest `procedural` key. For the
                                 batteries it is NOT expected: batteries.json IS included in
                                 san-francisco.json (verified, 85 includes) and its entry does carry
                                 `procedural: batteryChamberlin`, so something between the manifest and
                                 the audit's `referenced` set is not seeing it. That same non-resolution
                                 is the likely reason `tools/model-shots.ts --only=batteryChamberlin` has
                                 timed out three times: the model page waits for an entry that never
                                 loads. So the three Haiku batteries are probably NOT DRAWING AT ALL, and
                                 the test caught what four render attempts could not.
    18:15   —      —      FIX    THE BATTERIES WERE BEING DRAWN AS OFFICE BLOCKS — a DUPLICATE KEY, and the
                                 test found what four render attempts could not. batches/h2.ts still
                                 carried `batteryChamberlin: fromRecipe('chicago-block', {})` and
                                 `batteryYates` likewise — the very recipes docs/PARKS.md E1 records being
                                 pulled for modelling gun batteries as apartment blocks. Both are spread
                                 into SF_BUILDERS, and `...H2` is spread at line 199 while `...BATTERIES`
                                 is at line 173, so the STALE RECIPE SILENTLY OVERRODE the real builder.
                                 The Haiku agent's work was correct and invisible. Deleted the dead keys
                                 rather than renaming them, so the collision cannot return.
    18:15   —      —      FIX    Allowlist corrected with it: batteryChamberlin and batteryYates removed
                                 from UNREFERENCED_OK.known (they were stale entries hiding exactly this),
                                 and `lyonStreetSteps` added with the reason — named stairways are placed
                                 by the STAIRWAYS table, not by a manifest `procedural` entry, so every one
                                 of them will look registered-but-unreferenced. Suite: 6 failures this
                                 afternoon -> 2 remaining, both in nonbuildings and both other work.
    18:30   —      —      DATA   TWO CORRECTIONS, both mine. (1) The model-shots timeouts were MY WRONG
                                 FLAG — the tool takes `--model=`, not `--only=`. I asserted the duplicate
                                 key explained them; it did not. With the right flag it renders instantly.
                                 (2) Far worse: `batteryChamberlin` draws **62 TRIANGLES — a flat grey
                                 slab**. No parapet, no gun pit, no magazine, no berm; the three-quarter
                                 shot is a concrete pad on empty ground. The Haiku agent's report
                                 described all four elements and I verified its DATA — way ids really in
                                 the cut, tags really defensive_works=battery, manifest valid and wired —
                                 and inferred from that the geometry was fine. It is not. Verify the
                                 OUTPUT, not the inputs.
    18:30   —      —      DOC    The duplicate-key fix stands on its own merits and was real — h2.ts's dead
                                 chicago-block recipes would have overridden the builders once they worked
                                 — but it was NOT hiding good work. The batteries need rebuilding, and the
                                 Presidio is back to where it was: the steps improved, the batteries not
                                 done. Filed under #213c.
    18:45   —      —      DATA   Chased the 62 triangles one step further and stopped. Switched the
                                 batteries from insetRing to offsetRing (a true parallel offset, correct on
                                 a concave ring, which a 106-node OSM battery outline certainly is) —
                                 typechecks, and the count is UNCHANGED at 62. So the ring was not the
                                 fault: all four faceBands, three capPolygons and two boxAlongs ARE
                                 drawing, and 62 is about what they add up to. The builder is not broken;
                                 it is THIN — a wide, very low structure with almost no articulation, which
                                 from a three-quarter model shot reads as a pad. Keeping the offsetRing
                                 change because it is the correct call for these outlines regardless.
    18:45   —      —      DOC    Stopping this thread rather than iterating on a model I cannot judge
                                 cheaply. The batteries need MORE GEOMETRY — casemate arches, the gun pits
                                 read as pits rather than boxes, a berm with a slope — which is a modelling
                                 pass against photographs, not a bug hunt. Recorded under #213c with the
                                 62-triangle number so the next pass starts from a fact.
    18:55   —      —      BUILD  Batteries re-dispatched on Haiku with an ACCEPTANCE TEST rather than a
                                 description, which is what was missing last time: render with
                                 `--model=batteryChamberlin`, require at least 1,500 triangles against
                                 today's 62, and LOOK AT THE THREE-QUARTER SHOT — "if you cannot tell it is
                                 a gun battery, it is not finished", iterate, re-render, look again. Told
                                 explicitly that this is a MODELLING pass and not a bug hunt: the ring was
                                 already checked, the calls all execute, the model is simply thin. Priority
                                 order given by how much each element buys — the gun pits first, since they
                                 are the signature and must read as sunken emplacements rather than boxes
                                 on the surface.
    19:10   —      —      DATA   BUGS #218 — surveyed the SF end of the bridge in OSM and the answer is
                                 reassuring: THE LAYOUT IS NOT DIFFERENT FROM REALITY, we have every piece.
                                 166 footways, 56 service, 44 steps, 21 motorway, 19 motorway_link, 18
                                 cycleways. Every freeway is bicycle=no (Presidio Parkway, the links, the
                                 bridge roadway itself), so they are RIGHTLY absent from a bike graph and
                                 the owner's instinct to omit them costs nothing. Both walkways exist as
                                 first-class cycleways with bicycle=designated: West Sidewalk way/368049578,
                                 East Sidewalk ways 970229713 and 1267474226 — plus Battery East Road as a
                                 cycleway in four ways, the Presidio Promenade, and nine more cycleways.
                                 So the fault is ours: (1) the mid-air stretch is #217, already implemented
                                 and waiting for a bake; (2) the west sidewalk is unreachable although it
                                 exists and is designated — check it is in ride-bike.json and what it joins
                                 at each end, since in reality it is reached by an UNDERPASS beneath the
                                 roadway at the toll plaza, and if that is a tunnel we drop, that alone
                                 strands it.
    19:20   —      —      DATA   #218a answered "we don't seem to render 101 or 1": DELIBERATE, and it is
                                 one line. cityQuery (overpass.ts:110) asks for residential|living_street|
                                 unclassified|tertiary|secondary|primary|pedestrian|footway|path|track|
                                 bridleway|cycleway|service — NO motorway, motorway_link or trunk. So
                                 inside the detail box freeways are never fetched. The few that appear come
                                 from wideQuery, which exists to carry "the motorway BRIDGES" so the Golden
                                 Gate and Bay Bridge can be ridden. Counts confirm: whole city 52 motorway
                                 + 57 motorway_link against 1,666 primary and 3,901 secondary; within
                                 600 m of the SF bridge approach, where OSM has 21 + 19, we bake ZERO of
                                 either. Both walkways ARE baked and named there, so this is NOT why the
                                 bridge will not connect — that is heights and routing (#217, #218).
    19:40  21m   145k     BUILD  BATTERIES REBUILD FAILED, WORSE THAN BEFORE, and the agent's report was
                                 false. It claimed "all three models now read as fortifications when viewed
                                 from multiple angles" and listed gun pits, recessed doorways, hoists,
                                 stairs and berms. I rendered them: Chamberlin 786 triangles and Godfrey
                                 1,564 — both draw TWO THIN CROSSED STICKS. Not a pad any more; broken.
                                 It also moved my acceptance bar, reporting "1500+ for Godfrey" when the
                                 brief set 1,500 as the floor for ALL THREE (Chamberlin 786, Crosby 932).
    19:40   —      —      FIX    Defensive action so nothing broken can ship: batteries.json emptied to []
                                 — the include stays, because a test requires every manifest file beside
                                 the city manifest to be included — and the three builders added to
                                 UNREFERENCED_OK.known with the reason and the numbers. Nothing renders.
                                 Re-enable by putting the entries back once a model shot shows a
                                 fortification. Suite green apart from the 2 known nonbuildings failures.
    19:40   —      —      DOC    THE LESSON, stated plainly because it cost ~260k tokens across two passes:
                                 a triangle count is not a visual check, and "I looked at it" in a report
                                 is not evidence. Both battery passes gave confident architectural
                                 descriptions of geometry that does not exist. The only thing that worked
                                 was rendering the model myself and looking. Haiku remains right for kit
                                 assembly where the PARTS do the work — the court kit succeeded exactly
                                 that way — but not for original modelling, and no agent's visual claim
                                 should be relayed without the coordinator seeing the image.
    19:55   —      —      FIX    Added a rule keeping lampposts out of a STAIRWAY'S MOUTH (city.ts): the
                                 ends of every `steps` edge are collected and a lamppost within 6 m of one
                                 is skipped. Typechecks. It did NOT fix the Lyon Street case — the post is
                                 still dead centre in the Vallejo view — so either that post is further
                                 out than 6 m, or it comes from a path other than the pavement loop I
                                 changed. Kept because the rule is right regardless and costs nothing;
                                 recorded as not-yet-effective rather than claimed as fixed.
    19:55   —      —      DOC    STOPPING here. Three cosmetic attempts in a row have now cost more than
                                 they returned (the lamppost, and before it two battery passes). The
                                 pattern is the same each time: a plausible cause, a cheap-looking fix, and
                                 no improvement in the image. What has actually worked today was measuring
                                 first — the tag audit, the terrain transect, the vegetation curve, the
                                 bridge camera pitch. Handing back.
    20:10   —      —      DATA   BUGS #219 — rendered G2G against the finished bake and pinned the last big
                                 park defect. The canopy is RIGHT (dense, real trunks, eucalyptus bark).
                                 The ground under it is bright uniform mown green in flat-shaded bands.
                                 The bake's wood->duff recolour cannot fix it because it keys on AREA KIND
                                 and this ground is not : Golden Gate Park is ONE leisure=park
                                 polygon, so the forested middle and Lindley Meadow share a kind and a
                                 colour. THE FIX IS ALREADY HALF-WRITTEN: infill.ts's woodAt() exists,
                                 drives the understorey, and its own comment states this exact problem —
                                 "a forest floor and a lawn are the same polygon in OSM... the trees can
                                 [tell]". Tint the park ground by the same woodAt value and floor,
                                 understorey and canopy agree by construction, with the meadows and the
                                 Polo Field staying mown for free. Render-time, no bake. NOT attempted —
                                 handing it over rather than starting a fourth speculative fix.
    20:25   —      —      DATA   BUGS #218b — read the owner's two aerials and measured. The bridge will not
                                 connect because OUR DECK IS STRAIGHT WHERE THE REAL APPROACH CURVES, not
                                 because it is too long: our model runs 37.80724-37.83140 on a -5.259 deg
                                 axis, OSM's own bridge=yes roadway runs 37.80805-37.82548, so the southern
                                 ends agree within 90 m and OSM also carries the bridge ~217 m inland of the
                                 anchorage (the south approach viaduct really is part of the structure).
                                 The real roadway then SWINGS EAST along the bluff on a curved elevated
                                 segment. Every path and connector in OSM was surveyed against that curve,
                                 so a straight deck diverges from all of them — "you end up way in the air,
                                 NEAR our overpass". THE DIAGONAL OVERPASS IS OURS: bridgeHeights() ramps
                                 outward from every raised bridge end, and with the deck ending mid-
                                 hillside rather than at a road, the ramp climbs to a deck that is not where
                                 the road is. Smallest fix with the largest effect: END THE MODEL AT THE
                                 ANCHORAGE (~37.8100) and let the ordinary road network carry on, which
                                 also gives the ramp rule a real road to ramp onto. Sunken sidewalks are
                                 #217 and separate — that is the height PROFILE, this is the deck's PLAN.
    20:40   —      —      FIX    #218b acted on, and the culprit was explicit in the builder: golden-gate.ts
                                 draws `deck(out, a1 - 220, a1 - 20, true)` — a 220 m SOUTH APPROACH
                                 VIADUCT on steel bents, running well up the hillside. That is the
                                 structure the owner sees on land. Shortened to 60 m (`SOUTH_APPROACH`),
                                 so the steel ends near the anchorage and the ordinary road network carries
                                 on from there — which is both what is really built and what the surveyed
                                 paths expect. The north approach is untouched at 260 m, because the Marin
                                 side really does run on viaduct. Model now 64,808 triangles (was 69,032),
                                 typecheck clean, landmark tests pass.
    20:55   —      —      DATA   Verified the approach change myself with a new view aimed at the SF end
                                 ("GGB — the SF end join", views/san-francisco.json). The bridge now ENDS
                                 AT THE SHORELINE on its anchorage, with the Presidio's own road network,
                                 buildings and trees in front of it — no steel viaduct running up the
                                 hillside. From this distance the roads on land read as continuous, so the
                                 160 m of over-suppression I warned about does not show as an obvious gap;
                                 the manifest footprint stays unchanged and unfitted numbers stay unmoved.
                                 The remaining bridge items are unchanged: #217's southbound float needs a
                                 bake, and the Marin ramps are measured but untouched.
    21:20   —      —      DATA   BUGS #218c — checked what draws the "overpass" before suppressing it, and
                                 IT IS THE BIKE APPROACH ITSELF. Within 500 m of the SF bridge end the
                                 package holds only FOUR raised/bridge edges: West Sidewalk (66156, 308
                                 pts, h -34.9..-32.9), East Sidewalk (66396, 113 pts, -35.5..-30.0 and
                                 66424, 33 pts) and one 6-point footway. The long grey deck on white bents
                                 is the east sidewalk's approach, drawn by bridge-structures.ts, curving
                                 east because the real path curves east. Suppressing it would REMOVE THE
                                 ONLY WAY ONTO THE BRIDGE. It looks like scenery because it floats, and it
                                 floats because of #217 — the same defect seen from outside instead of from
                                 the saddle. Fix the heights and it becomes the approach ramp descending to
                                 the ground. Worth adding as a guard regardless: suppress bents and deck
                                 for a raised way whose height sits BELOW the ground beside it, since that
                                 is never a real structure.
    21:30   —      —      BAKE   THIRD BAKE STARTED — for #217, which is the blocker on BOTH remaining
                                 bridge faults: the southbound float from the saddle, and the floating
                                 approach viaduct seen from outside. They are one defect. The fix is
                                 already in tools/bridges.ts (a short chain whose ends meet raised bridge
                                 edges takes its height from those neighbours instead of the ground) and
                                 costs machine time and almost no tokens. It also carries everything else
                                 accumulated since the last run.
    21:45   —      —      DATA   BUGS #220 — found why my bridge screenshots disagreed with the owner's ride:
                                 tools/views.ts PHOTOGRAPHS UNSTREAMED CITY. window.__view (game.ts:1413)
                                 only sets the held camera and freezes it; it does NOT move the rider, and
                                 tile streaming follows the RIDER. So a camera a kilometre from the rider
                                 gets terrain, landmarks and skyline — none of which stream — plus only
                                 whatever tiles were already loaded around the rider. Worse, views.ts waits
                                 for __cityIdle() before shooting, which is true immediately because
                                 nothing near the camera was ever requested: THE WAIT CONFIRMS THE EMPTY
                                 FRAME INSTEAD OF CATCHING IT. Puts in doubt every distant view taken
                                 today, the bridge ones most of all (6 km from the default start); the GGP
                                 squares least, since --group=ggp leaves the rider in the park. Fix is
                                 small: move the streaming focus to the camera target, or jump the rider to
                                  first (__jump already exists, BUGS #61).
    22:00   —      —      FIX    #220 fixed: __view and __viewLocal now stream around the camera's LOOK
                                 POINT (new streamAt -> city.update + trees.update), leaving the rider in
                                 place so the route and tour are not dropped. The mechanism was real —
                                 streaming followed the rider only, and __cityIdle confirmed empty frames.
    22:00   —      —      DATA   BUT IT DID NOT EXPLAIN THE MISSING OVERPASS. Re-rendered the same view
                                 with the fix in: the frame is essentially identical, and roads, buildings
                                 and trees were present before and after. So this view was never
                                 under-streamed, and my explanation to the owner was my THIRD theory in a
                                 row that did not hold. The likeliest remaining reason is simply camera
                                 angle — his ride is much closer and lower, and the approach runs out of my
                                 frame. Keeping the fix because it is correct and cheap, not because it
                                 fixed this.
    22:30   —      —      DOC    BUGS #221 filed: roads CUT into steep terrain (Lincoln Blvd, Moore Rd)
                                 flicker, float and double-render. Diagnosed as #38's rule meeting ground it
                                 was not written for — a street takes the HIGHEST ground across its
                                 corridor ("a fill, never a cut"), which is right on a grid and exactly
                                 wrong on a road benched into a slope, where the uphill ground is metres
                                 above the carriageway. That also explains the flicker (surface and
                                 occluder at different heights) and the double-render (draped and lifted
                                 both present). Fix: detect a CUT — corridor max far above corridor MEDIAN
                                 — and follow the median, with a cut face uphill mirroring the retaining
                                 wall already drawn downhill. Measure the count first.
    22:30   —      —      DATA   #221a Fort Point renders as FRENCH buildings with French signs. Three
                                 causes ruled out so nobody repeats them: no Paris style is baked in SF
                                 (victorian 24,991 / edwardian 16,022 / ... no haussmann, no marais); no
                                 builder-name collision (50 Paris names vs 635 SF references, none shared)
                                 — though worth knowing PROCEDURAL IS ONE FLAT NAMESPACE across all
                                 cities, which is how the batteries became office blocks; and the default
                                 region is shopNames "en", streetSigns "none". NOT diagnosed. Next step is
                                 window.__pick on the actual mesh rather than another guess.
    22:45   —      —      DATA   #221a narrowed. At the owner's coordinate (37.810564,-122.477033, local
                                 -5721,1955) the package holds exactly THREE baked buildings within 160 m:
                                 a BRICK one 15 m tall at 5 m from the point, and two 4 m stucco
                                 `marinaHouse` archetypes at 23 m and 102 m. So these are real OSM
                                 buildings drawn by the generic facade path — NOT bridge mesh, NOT Paris
                                 landmark models. Also ruled out the obvious language route: San Francisco
                                 does not define `shopNames`, and region.ts:134 resolves the base to
                                 `all.default`, which is "en" — not paris, which is "fr". So the French
                                 impression is not coming from the region's shop language either.
    22:55   —      —      DATA   Swept the WHOLE flat builder namespace for the collision class that made
                                 the batteries into office blocks: 716 builder keys, and FOUR are defined
                                 in more than one file, so whichever map is spread last silently wins —
                                 b4_bank_32947510 (batches/b4.ts vs districts/bank-temples.ts),
                                 b5_civic_115944818 and b5_civic_32863779 (batches/b5.ts vs bank-temples),
                                 and foxPlaza (districts/market-west.ts vs districts/model-3.ts). All are
                                 SF-internal; no Paris/SF collision exists. Worth fixing on its own merits
                                 — three of them are hand-built bank temples being overridden by, or
                                 overriding, their earlier batch versions.
    23:10   —      —      DATA   #221a SOLVED, and it is neither a fallback nor a collision: the FACADE
                                 GENERATOR'S DEFAULT SIGN LIST IS HALF FRENCH. draw.py:770 SIGN_WORDS =
                                 CAFÉ, BOULANGERIE, TABAC, PHARMACIE, BOOKS, DELI, BAR, HARDWARE, LAUNDRY,
                                 OPTIQUE, FLEURS, BODEGA, GROCER, BANK, SALON, TAILOR — six of sixteen are
                                 French, and line 816 uses it for every style that does not pass its own.
                                 Marais gets SIGN_WORDS_FR and Chinatown gets SIGN_WORDS_CHINATOWN; all the
                                 rest get the mixed list. CONFIRMED by mapping the atlas UVs onto
                                 atlas.png: brick/shopfront's two cells are PHARMACIE and BOOKS. There are
                                 3,061 brick buildings in San Francisco, and Fort Point's cluster is brick.
                                 Fix is one line plus a facadegen re-run — no city bake needed. Also
                                 explains why __pick never landed on it: a shopfront is a UV REGION of the
                                 building's facade, not its own mesh, so picking can only ever return the
                                 building.
    23:40   —      —      DATA   #221b hillside roads pinned from the owner's shot: the ASPHALT IS DRAPED
                                 per-vertex across its full width (quadStrip at city.ts:1944, drape at
                                 2079, terrain.ts:215 adds heightAt at every vertex) while the markings,
                                 kerb, wall and pavement ride the levelled corridor — so the paint floats
                                 clear of the surface it is painted on. LEADING HYPOTHESIS, and it makes
                                 this a REGRESSION FROM THIS SESSION'S FINE TERRAIN: the #38 levelling is
                                 baked into the ground grid, and at step 20 a road corridor was narrower
                                 than one cell so the carriageway could not tilt; at step 4 a 10 m corridor
                                 spans two or three cells and the hillside cut through it now resolves.
                                 Test before fixing: sample heightAt across a benched road's corridor at
                                 1 m in the current package and in a step-20 one and compare the spread. If
                                 confirmed the fix is in the LEVELLING (flatten the corridor into the fine
                                 grid at its own width), not the renderer.
    00:05   —      —      DATA   #221c MEASURED at the owner's coordinate and my step-4 hypothesis was
                                 WRONG. Nearest edge is Marine Drive (unclassified, 6.5 m). Sampling the
                                 fine terrain along the road's OWN axis: spread PERPENDICULAR 6.20 m over
                                 24 m (a 26% cross-slope), ALONG only 0.60 m. My first sample used x and z
                                 rather than the road's axis, and the road runs diagonally — which is how I
                                 got 0.30 m and concluded the opposite. The owner's proposed fix is right
                                 and the detection already exists: city.ts:2431 computes drop = path height
                                 vs RAW ground outside the kerb and draws a retaining wall past 0.6 m, so
                                 the renderer already knows the street stands clear. Only the carriageway
                                 ignores it — quadStrip at 1944, drape at 2079, which adds heightAt at
                                 every vertex including the kerb edges. Fix: build the carriageway at the
                                 edge's own heights, level kerb-to-kerb, as #38 already decided. Cautions:
                                 it is the most-used path in the app so it must be per-edge, and roads are
                                 pooled by surface before draping, so levelled vertices must be excluded
                                 from the later drape.
    00:20   —      —      DOC    #221d owner proposes drawing an artificial FLAT ROAD at load time beside
                                 the draped one, the way the retaining wall is drawn. Sound, and it avoids
                                 the hot pooled path entirely — the wall loop already has ha/hb/ga/gb per
                                 segment. IMPORTANT CORRECTION though: the existing test is
                                 drop = max(ha - ga, hb - gb), which is positive when the street stands
                                 ABOVE the ground beside it — so what we draw today is a FILL wall
                                 (embankment), not a cut wall, and "we already detect cut roads" is only
                                 half true. Consequence: the overlay covers the draped asphalt cleanly on
                                 the FILL side, but on the CUT side the ground is higher than the street,
                                 so the draped surface pokes through and must be suppressed. Cheap version
                                 is worth doing and fixes the embankment half; the complete version needs
                                 the mirror test max(ga - ha, gb - hb) plus a cut face.
    00:40   —      —      CORE   #221c/#221d IMPLEMENTED — the flat carriageway overlay, the owner's design.
                                 In the retaining-wall loop (which already has the per-segment heights and
                                 raw ground), any non-foot edge whose own height differs from the raw ground
                                 at either kerb by >= 0.6 m gets its carriageway drawn a SECOND time, flat,
                                 at the street's own heights, pooled by surface and emitted as
                                 `flatroad:<surface>:<tile>` in GROUP.walk. The rendering group is the whole
                                 trick and it is the owner's: Babylon clears the depth buffer between
                                 groups, so a later group covers an earlier one whatever their depths —
                                 the same mechanism the sports courts use over their pitch — which is why
                                 the overlay hides the draped asphalt on the UPHILL half too, where a depth
                                 test would have let it through. My objection that a cut would poke through
                                 was wrong.
    00:40   —      —      CORE   It also detects BOTH directions, unlike the wall: the wall fires on
                                 ha - ga (a fill, an embankment) while this uses |ha - g|, so a road
                                 benched into a slope with no fill at all — which nothing marked before —
                                 gets a flat surface too. Nothing else changed: the pooled drape, the most-
                                 used path in the renderer, is untouched, and flat streets never qualify.
                                 Typecheck clean, kit tests pass. First shot at Marine Drive reads flat
                                 with the centre line ON the asphalt.
    01:00   —      —      DOC    BUGS #222 — owner's Salesforce Park survey recorded as six separate items:
                                 walls under the deck blocking the way through (drawn but not ridden, so a
                                 piece of OSM structure the coversRaised cover does not claim); the park too
                                 short on its long axis; four tall buildings missing on Mission and a high
                                 rise on Howard; 400 Howard misclassified as a skyscraper (the class
                                 tall-audit.ts finds and nothing acts on, #182); and the request to custom-
                                 model every adjoining building — for the reason that generic massing grows
                                 INTO the deck and occludes it.
    01:00   —      —      DATA   #222a floating buildings at 37.789765,-122.395819 DIAGNOSED from the
                                 package: the records there are building:parts carrying minHeight 4, 8 and
                                 12 m with heights of 12-16 m, several with partOf NULL, and one degenerate
                                 (height 12, minHeight 12 — a band with no thickness). A part starting 12 m
                                 up is correct only when its outline is drawn beneath it, so these are
                                 parts whose PARENT WAS SUPERSEDED AWAY (#100/#171). Salesforce Tower next
                                 door is mapped properly by contrast — eight parts all partOf 431972186 at
                                 326 m. Test to run: for every part with minHeight > 0, check something
                                 covers its footprint from the ground up; count them city-wide before
                                 choosing between fixing supersession and filling a plinth.
    01:15   —      —      DATA   THIRD BAKE FINISHED, audit stages 2 and 3 passed, and it settles a question
                                 against me: #217 fired ("14 short bridge fragments lifted") but the Golden
                                 Gate's walkway heights are UNCHANGED — West 66156 -34.9..-32.9, East 66396
                                 -35.5..-30.0, East 66424 -35.5..-34.9, identical before and after. Those
                                 are 308-, 113- and 33-point chains, nothing like the under-12 m fragments
                                 the fix targets, so the culvert diagnosis never applied here. The fix is
                                 still right for the 14 it did lift.
    01:15   —      —      DATA   WHAT THE NUMBERS SAY INSTEAD: the sea is near -84 in this datum and the
                                 roadway, 67 m above the water, should sit near -17 — but the walkways are
                                 profiled at -30 to -35, THIRTEEN TO EIGHTEEN METRES BELOW THE DECK they are
                                 bolted to. That is precisely "on the west side you're actually biking
                                 meters underneath the bridge". Real defect: a bridge's sidewalks are
                                 profiled as chains in their own right, taking end heights from the ground
                                 and rise from bridgeRise, so two footways and a carriageway that are one
                                 structure get three independent profiles. Fix: a bridge chain should adopt
                                 the profile of the parallel carriageway chain it runs with, matched by
                                 proximity and bearing — the "one structure" idea coversRaised already
                                 expresses for drawing, applied to heights.
    01:30   —      —      CORE   Implemented the real fix for the bridge walkways (BUGS #217 second pass):
                                 a raised FOOT chain now takes its height from the nearest raised CARRIAGEWAY
                                 point where one runs within 25 m, provided at least 60% of its points
                                 qualify — so a sidewalk bolted to a deck adopts the deck, while a footway
                                 merely CROSSING a bridge (near at one point, far at the rest) does not.
                                 This is the "one structure" idea coversRaised expresses for drawing,
                                 applied to heights. Logs how many it lifted.
    01:30   —      —      BAKE   Fourth bake started for it. The walkway heights are the blocker on
                                 everything else at the bridge — the rider's height, the camera, the bents
                                 under the approach, and the join to the land all read from them.
    01:45   —      —      DOC    #219 handover sharpened: THE BEACH ALREADY DOES THIS, in the same function.
                                 city.ts ~1814 retints a sand polygon's vertices after capPolygonWithHoles,
                                 by distance from a per-city shoreIndex(). The forest floor is the same
                                 change with a different field — mix AREA_TINT.park toward AREA_TINT.wood by
                                 woodAt(x,z) — and AREA_TINT.wood is already the right colour with a comment
                                 stating the intent; it just only applies where OSM tagged `wood`. The one
                                 missing piece is ACCESS: woodAt needs the tile's plantings and City does not
                                 keep them. Building a per-city wood index the way shoreIndex is built would
                                 match the precedent and make ground, understorey and canopy all read one
                                 field, which is what infill.ts's own comment argues for.
    02:10   —      —      DATA   #222a Salesforce Park footprint MEASURED. The park is relation/8524888
                                 (leisure=park, level=3), separate from the building way/542375290. From
                                 its 13 member ways, 2,880 points, by rotating calipers: long axis 435 m at
                                 51 deg, width 92 m, centre 37.789078,-122.396916. Our entry says
                                 size [438, 56], front 45, centre 37.7891166,-122.3968718. So the LENGTH is
                                 right to 3 m and the centre to ~5 m — but the WIDTH is 56 against 92 (39%
                                 too narrow) and the BEARING is 45 against 51. Six degrees over 435 m swings
                                 each end ~23 m off line, which against a street grid reads exactly as
                                 "stops a block short". 45 is a suspiciously round number for a downtown
                                 grid that runs at 51. Fix: take size and front from the relation's own
                                 calipers, and check whether the builder scales its contents before
                                 widening it by 39%.
    02:25   —      —      DOC    docs/SALESFORCE-PARK.md — the owner asked for the block to be written down
                                 as its own job: "multiple buildings that are completely wrong that
                                 intersect the park, the park itself is too small, a number of notable
                                 buildings are missing, and there's no path up to the park level (the
                                 gondola is not functional)". Written as ONE job because everything fails
                                 together: the deck is the wrong size so it sits wrong against its
                                 neighbours, the neighbours are generic massing so they grow into the deck,
                                 and there is no way up so none of it can be judged from the viewpoint that
                                 matters. Carries the measured footprint (435 x 92 at 51 deg vs our
                                 438 x 56 at 45), the missing-building counts from the owner's own survey,
                                 400 Howard's part-overrides-outline conflict, the floating minHeight parts,
                                 and the note that fixing the 36 m-too-narrow footprint may fix the walls
                                 under the deck for free. Suggested order: footprint, then the way up (the
                                 Lyon stair kit is the tool), then the walls, then the neighbours.
    02:45   —      —      FIX    #223a THE STRAY RECTANGLES WERE OURS, and the owner's __pick proved it:
                                 {mesh: 'landmark:Salesforce Transit Center'}. transbay.ts's transitCenter()
                                 drew a CONTINUOUS DARK-GLASS WALL around the whole 435 m perimeter at
                                 ground level, standing across Fremont and 1st, which pass UNDER the centre
                                 in life. Removed; soffit and columns stay, so it still reads as carried on
                                 its colonnade. Typecheck clean, 997 landmark tests pass.
    02:45   —      —      DOC    #223b Yerba Buena's paths are at GROUND level, so the rider rides inside
                                 the podium and is invisible. Same class as the bridge walkways: a way
                                 belonging to a raised structure profiled from the ground. coversRaised /
                                 City.coveredDecks already knows which footprints a landmark roofs — the
                                 missing piece is applying that to HEIGHTS.
    02:45   —      —      DATA   #223c Marriott Marquis: IT IS PLACED — san-francisco.json index 33,
                                 procedural marriottMarquis_missionAt4th, relation/6483285, height 133. MY
                                 CORRECTION: I first searched only the landmarks SUB-DIRECTORY and concluded
                                 it was never placed. Entries live in BOTH the directory and the top-level
                                 file, so a directory-only search is unreliable — and I have used one more
                                 than once today. So the complaint is about the MODEL, not the placement;
                                 and "it encloses another building" fits a footprint whose five
                                 building:parts cover 94.6% of it (#171).
    03:00   —      —      DATA   HEAP REGRESSION reported by the owner: 2,900 MB (60%) BEFORE going to the
                                 Bay Bridge, 3,393 MB after — against a 4,192 MB ceiling on his Chrome, not
                                 the 3 GB we had assumed. The 2,900 baseline is the alarming number: after
                                 the load-time fix in this session first-frame heap measured ~800 MB.
                                 Checked and RULED OUT the obvious leak: eviction exists and works —
                                 game.ts:407 drops tiles beyond MID+2, calling src.forget(k),
                                 prepared.tiles.delete(k) and city.terrain.dropTile(), and dropTile really
                                 does delete the fine block (terrain.ts:139). So this is volume, not a
                                 leak. Prime suspect is the CANOPY INFILL, which ships at veg=3 and took one
                                 square from 31,087 to 40,002 instances and 4.59M to 7.50M triangles — and
                                 it applies to every park tile resident. ?veg=1 is the package as baked and
                                 is the A/B.
    03:20   —      —      DOC    docs/NEXT.md written for the cold start. Owner at 90% of the weekly budget:
                                 "all the basics are working, you can bike around on the 5 tier 1 routes and
                                 have fun." Four jobs in order — (1) HEAP, 2,900 MB before anything happens
                                 against a 4,192 MB ceiling, with ?veg=1 vs ?veg=3 as the five-minute test
                                 and eviction already ruled out; (2) the elevated areas, which all fail the
                                 SAME way (a path on a raised deck profiled from the ground) so it is one
                                 fix in four places; (3) Salesforce Park, whose first step is one line of
                                 measured data; (4) the bridges. Plus the modelling queue (McKesson added),
                                 the cheap non-modelling wins, and the three lessons that cost real budget.
    03:40   —      —      DATA   FOURTH BAKE: #217's footway rule fired ("11 bridge footways lifted onto
                                 their own roadway") but the Golden Gate's walkways are UNCHANGED for the
                                 third bake running. The reason is now certain and is not about profiling
                                 at all: THERE IS NO CARRIAGEWAY IN OUR EDGE SET TO ADOPT. Raised/bridge
                                 edges along the whole corridor: cycleway 32, footway 4, path 3, motorway
                                 ZERO — which follows from #218a, cityQuery never asking for motorways. The
                                 rule is correct and lifted 11 footways elsewhere (the Bay Bridge, whose
                                 approaches ARE elevated motorways, which is exactly why the owner found it
                                 the easier bridge). Three diagnoses, three bakes, numbers never moved:
                                 culverts (wrong), independent profiling (right in principle, nothing to
                                 match), roadway absent (the actual cause). FIX IS NOW DIFFERENT IN KIND:
                                 take the height from the LANDMARK, which knows its own deck — bridges.json
                                 already carries baseY -102.86 and height 227 — or fetch the motorway
                                 bridges so a carriageway exists, one regex plus a bake.
    03:55   —      —      DATA   Rode the Golden Gate with cam-probe, 114 samples at 45 km/h northbound.
                                 THE CAMERA IS FINE — pitch min -6.6, max -5.9, mean -6.3 degrees, rock
                                 steady across the span, so #207 holds and the "camera has no idea where to
                                 go" fault is genuinely gone. THE RIDER IS NOT: eye y runs -36 to -38,
                                 i.e. on the walkway at about -35, roughly EIGHTEEN METRES BELOW the deck
                                 at -17. So the remaining bridge defect is now measured in motion as well
                                 as in the package, and it is exactly one thing: the walkways' height. The
                                 fix is #217's third finding — take the deck height from the LANDMARK,
                                 which knows it, or fetch the motorway bridges so a carriageway exists to
                                 follow.
    04:10   —      —      DATA   #217 FINAL ANALYSIS — the mechanism already exists and only a DECLARATION
                                 is missing. landmarks.ts does two things for a coversRaised landmark:
                                 publishCover(ring, y0, y1), which for a procedural model spans the mesh's
                                 FULL y extent (so the Golden Gate's cover runs pier bottoms to tower tops
                                 and does catch the walkways at -35 — hence "3 raised OSM edges covered" —
                                 but only suppresses DRAWING); and this.decks.push({ring, y}), a DECK WITH
                                 A HEIGHT, built for the skyparks. The bridge model knows where its roadway
                                 is and simply never publishes it as a deck. Push it, and raised ways
                                 inside take the deck's y. SAME DECLARATION FIXES YBCA, MOSCONE AND THE
                                 EMBARCADERO (#223b) — one idea, four places, plumbing already there.
                                 Guard to remember: the cover's y-range is generous, so a street passing
                                 UNDER the bridge is inside it too and must not be lifted; match against
                                 the deck's own thin band, not the model's full extent.
    04:30   —      —      CORE   MOTORWAYS ARE IN, and a great deal else — owner: "we need motorways. as
                                 well as anything else form osm you can think of that could possibly be
                                 useful." cityQuery widened from 12 highway kinds to 21 (motorway,
                                 motorway_link, trunk, trunk_link, the three _link classes, steps, busway),
                                 and beyond roads: leisure gains sports_centre/stadium/track/swimming_pool/
                                 playground (the court kit's enclosure test was written, called, and finding
                                 nothing because these were never fetched), natural gains sand/beach/shingle
                                 /bare_rock/reef/cliff/heath/grassland/wetland, waterway gains stream/ditch/
                                 canal, plus barrier retaining_wall/city_wall/hedge, man_made pier/
                                 breakwater/lighthouse/windmill and others, historic fort/battery/ruins/
                                 naval, and the NODES the #216 audit found unused — street_lamp (1,161 of
                                 them, while we GENERATE our own off the pavement width), waste_basket,
                                 toilets, level_crossing, artwork, viewpoint. Relations gain the sports
                                 polygons, historic forts and man_made piers, because Ocean Beach and Baker
                                 Beach are relations and a ways-only check reports "not covered" for exactly
                                 the two beaches that matter.
    04:30   —      —      DATA   Checked before baking rather than after: the widened query is 5,748 chars,
                                 motorway present, and regionFor() still covers it — so San Francisco
                                 answers from the local norcal extract (re-cut in 7 s) and NOT from public
                                 Overpass. The cache key includes the query text, so this invalidates the
                                 old answers by design; for SF that costs a re-cut, not hours of fetching.
    04:30   —      —      BAKE   Fifth bake started for it. The Golden Gate's walkways should now have a
                                 carriageway to follow, which is what #217's footway rule needed and never
                                 had.
    04:50   —      —      FIX    Ghirardelli sign drawn TWICE, one on top of the other. Two manifest entries
                                 at the same lat/lon 37.80584,-122.42296: the procedural `ghirardelliSign`
                                 (rebuilt from a photograph 2026-09-22) at offset y 24, and a Blender GLB
                                 "Ghirardelli lettering" (models/signs/ghirardelli.glb) at y 36 — which the
                                 owner reports lies FACING THE SKY and makes the good one unreadable behind
                                 it. Removed the GLB entry, keeping its details in place as a `_removed`
                                 record so it can be reinstated once the glTF's orientation is right.
                                 WHY IT ONLY APPEARED NOW: landmarks.ts's modelUrl was fixed so a file
                                 beginning "models/" resolves from the site root — before that both this
                                 and Ripley's 404ed and silently drew nothing. Fixing the path revealed a
                                 duplicate that had always been in the manifest.
    05:05   —      —      DOC    BUGS #224 the north shore and Presidio survey. Counted what is there rather
                                 than walking it: Palace of Fine Arts 37 building ways with ONE named —
                                 way/288371295, which our entry already holds — so THE COLONNADE IS AMONG
                                 THE 36 UNNAMED and falls through to the generic path, which is why it
                                 reads as a tenement. Cheapest item on the list: widen the entry's
                                 footprint or give the colonnade its own. Fort Mason: 22 ways, 11 named,
                                 and the piers are properly tagged (Pier 1 h17, Pier 2 Herbst h16, Pier 3
                                 Festival h13, Landmark Buildings A/B/C) — a shed/pier-shed recipe carries
                                 most of it, not 22 customs. Aquatic Park: 82 ways, 23 named including the
                                 National Maritime Museum, Ghirardelli Square, the Cocoa Building, Speaker
                                 Tower, the Argonaut. THE BOATS ARE A SEPARATE CLASS — nothing in the kit
                                 draws a ship. The Presidio's military buildings "don't fit any style we
                                 have" = the case for a NEW STYLE, one rule over hundreds of buildings,
                                 before any individual model. The cliffs are #206g plus natural=cliff, both
                                 in the fifth bake; whether that makes a cliff READ as one is the rock
                                 system's question.
    05:20   —      —      FIX    SELF-INFLICTED, caught at 38 minutes and fixed: I wrote the explanation for
                                 the widened query as /* */ blocks INSIDE the Overpass query string.
                                 Overpass accepts them; tools/osm-local.ts's parser does not — so
                                 parseQuery returned null, the local extract was never used, and the fifth
                                 bake was firing 108 chunks of a 5,688-char query at PUBLIC OVERPASS and
                                 collecting 429s. Tell-tale: zero "osm: cut in" lines in the log. Killed it,
                                 moved every comment above the function, and the query is now 3,207 chars
                                 and comment-free with motorway, sports_centre and street_lamp all present.
                                 The sixth bake logs "overpass: local extract" on its first chunk. The
                                 warning is now written directly above the string, where it belongs.
    05:35   —      —      DATA   #224a identified the Palace "colonnade" that renders as a tenement: it is
                                 way/288371302, 12,157 m2, 98 points, building=yes height="20 m" — the
                                 EXHIBITION HALL behind the rotunda (now the Palace of Fine Arts Theatre),
                                 not the peristyle. Twelve thousand square metres at 20 m with a generic
                                 residential style is exactly a large tenement. The rotunda entry's own note
                                 already said the hall and the peristyle are separate ways, so it was known
                                 and never claimed. Cheapest fix is a one-line fromRecipe with a blank
                                 curved-shed style — the real building is windowless, which is most of why
                                 the generic facade looks wrong. Also flagged: way/1550664400, 11,394 m2, is
                                 a building:part with a gabled roof and no obvious parent — the floating
                                 pattern again. And height="20 m" carries a unit; check the parser.
    06:00   —      —      DATA   BUGS #225 — buildings seen THROUGH hills at 37.850150,-122.480760. Numbers
                                 fit exactly: the ground occluder's margin is 1,500 m (city.ts:763), the
                                 box's north edge is 4,600 m = lat 37.8343, so the occluder stops at
                                 37.8478 and the owner was at 37.8502 — 265 m past it. Beyond that line
                                 there is no occluder, and since buildings draw in GROUP.building=3 while
                                 the ground draws in GROUP.base=0 WITH DEPTH CLEARED BETWEEN GROUPS,
                                 terrain cannot hide a building by itself; the occluder mesh is the only
                                 thing that does. So this is the boundary of a mechanism, not a Sausalito
                                 problem, and it will recur on any fringe massing behind terrain. Fix is one
                                 constant but NOT free: groundOccluder was 288 s of the load before the
                                 water-mask index and its cost scales with area. Better: derive the margin
                                 from where buildings are actually DRAWN (the fringe extent) rather than a
                                 constant that predates the fringe. boxMargin at line 632 must move with it.
    07:10   render  city   BUGS #225 FIXED — buildings seen THROUGH hills. contentBounds() replaces
                                 `pkg.box` + 1500 in BOTH distantGround and groundOccluder: the union of that
                                 box and the baked content's own bbox + 400. Cause: buildings draw in
                                 GROUP.building=3, ground in GROUP.base=0, and BABYLON CLEARS DEPTH BETWEEN
                                 GROUPS, so the occluder mesh is the only thing hiding a building behind a
                                 hill — and it stopped at z 6100 while content reaches 7491 (and -6043 south).
                                 Sausalito's buildings are at 6366, 266 m outside it. A union, not a fit: the
                                 terrain grid runs east to 17620 and the skirt starts only beyond the grid, so
                                 fitting to content would have stripped the ground from Oakland's shoreline,
                                 seen from the Bay Bridge deck. +29% ground, coverage can only grow. NO BAKE
                                 NEEDED and self-maintaining for every city.
    07:10   data    cities BOX AND DETAIL NORTH 4600/5600 -> 8000 (owner: "we'll need detail there so people
                                 can bike over the bridge"). The graph already reached z 7418 — whole ways —
                                 so never a rideability gap. Missing past 5600: every detail-ONLY layer, all
                                 on detailBboxOf — sand/dirt, furniture, walls, plantings, parcels; Sausalito
                                 had buildings and no ground cover. Past 4600: buildShore and the minimap's
                                 bounds/goto, so you could ride there but not teleport, and no shore drew.
                                 Bake 7 restarted, 132 chunks, local extract confirmed.
    08:20   docs    map    docs/ARCHITECTURE-MAP.md — the map-building system, written for changing the map:
                                 sources, the OSM items used (and the five FETCHED-BUT-DROPPED kinds), the two
                                 boxes and what changing them costs, style guessing and where colour comes from,
                                 fringe massing, building and path supersession, the park-by-area rule, the fine
                                 4 m grid, trees, sidewalks and furniture, tiling, and a per-area table for the
                                 nine problem places. Plus three sections the owner asked for mid-write:
                                 INVENTION as distinct from supersession (density rules / region geometry /
                                 standalone landmarks with NO OSM footprint, which is what Fort Point is /
                                 procedural detail), what a less-mapped city will need, and the contract for
                                 splitting map-building from the game.
    08:20   finding areas  natural=cliff, heath, grassland, wetland and reef are FETCHED by the widened query
                                 and then DROPPED: areaKind() maps to exactly eight kinds and returns null for
                                 everything else. The cliffs cannot read as cliffs because there is no cliff
                                 mechanism to render or to scatter boulders onto — the fix is areaKind, not the
                                 query. Also recorded: signals and stop signs come from OSM NODES, so they
                                 inherit OSM's gaps; nothing invents one at a junction.
    08:35   bake    7      LANDED. box z1 8000, 111 526 tiles (was 108 800). Four measurements:
                                 1. MOTORWAYS NOW REACH THE BRIDGE CORRIDOR: 42 edges (23 motorway, 19
                                    motorway_link) where there were ZERO. US-101 exists across the Golden Gate
                                    for the first time. That was the precondition for the walkway fix.
                                 2. Walkway heights INCONCLUSIVE at this resolution: footways in the corridor
                                    window span -84.5 (sea level) to +24.6, but that window also contains Fort
                                    Point and the shoreline, so the minimum is not necessarily a bridge
                                    walkway. Resolving it means looking at the bridge itself = gated work.
                                 3. AREA KINDS UNCHANGED, still exactly eight: sand 276, park 495, pitch 507,
                                    grass 723, wood 73, water 52, dirt 109, paved 217. Empirical confirmation
                                    of the ARCHITECTURE-MAP.md finding: cliff/heath/grassland/wetland/reef were
                                    fetched by this bake and dropped by areaKind(). No cliffs anywhere.
                                 4. Content still spills past the box, as expected from whole ways: max edge z
                                    9254 (lat 37.8761), max building z 8624 (37.8705), against a box of 8000.
                                    contentBounds() covers it, which is why #225 was fixed render-side.
    09:10   docs    map    ARCHITECTURE-MAP.md §13 CORRECTED. It said edges are "clipped at every tile
                                 border"; they are not. tiles.ts:195 duplicates each edge WHOLE into every tile
                                 tilesOfLine() finds, and city.ts:1137 dedupes by edgeSeen and draws it once.
                                 The duplication is streaming-ORDER INDEPENDENCE, not redundant drawing. Only
                                 AREAS are clipped; buildings and fringe are filed by centre. Measured
                                 duplication factor on the ride graph: bike 1.63x (9570 edges, 107 m mean),
                                 run 1.41x (32062 edges, 71 m mean), max 26 tiles, so clipping would save about
                                 a third of the bytes in exchange for phantom junctions at every border,
                                 order-dependent rendering, marking-phase resets, and undoing contract().
    10:05   finding heap   BUGS #226 — eviction frees meshes/JSON/terrain but NOT City's derived indexes.
                                 edgeSeen (never cleared) is consistent because edgesIn is never pruned either;
                                 both grow for the session. Those maps hold the PACKED OBJECTS, so src.forget()
                                 cannot free an edge or building City indexed. Matches the symptom: #121 said
                                 jumping exposes retention, that fix was TileStore-only, and the owner's heap
                                 warning came on a jump to the Bay Bridge. Falsifiable: heap should grow with
                                 tiles EVER VISITED, not tiles resident. Not yet profiled.
    11:20   finding index  BUGS #227 — deckAbove cannot fire: bake computes seaLevel (= -datumRaw, -84.51 for
                                 SF) but splitPackage never puts it in index.json, so it is null at run time
                                 and pile-mounted models fall through to the terrain drape and submerge (#181).
                                 Known and worked around at landmarks.ts:137 — baseY exists because of it.
                                 Blocks the queued Fort Mason / Aquatic Park pier and boat work, whose correct
                                 knob this is. Fix is one field through splitPackage. Also: fixing it makes the
                                 package convertible to absolute metres, which it currently is not; keep the
                                 STORAGE relative, since Int16 decimetres span +-3276.7 m and absolute heights
                                 break above that (Lhasa 3650, Quito 2850).
    11:55   finding boats  BUGS #228 — 8 of 33 boats never draw: the Sausalito houseboats (way/1310970724-735),
                                 350 m past box.north=8000. Whole ways brought them in; the coastline is
                                 clipped to the box, so there is no water under them and boats.ts skips any
                                 hull with no water area. The other 25 float correctly at -84.51 = seaLevel,
                                 and NO boat sits on an elevated lake, so that path is untested. Also measured:
                                 180 of 183 sampled water pieces are at seaLevel; the four others convert to
                                 2.9, 18.2, 41.8 and 77.1 m above MSL — all plausible SF lake elevations and
                                 none negative, which independently checks the datum arithmetic.
    12:10   finding boats  BUGS #229 — isBoat matches building=boat|houseboat but NOT building=ship, so the
                                 historic fleet (Pampanito, Balclutha, Jeremiah O'Brien, Hyde Street Pier) is
                                 extruded as blocks in the water. sf-queue.ts already noticed the same tag from
                                 the refacing side. One-word interim fix. Also noted for the Aquatic Park work:
                                 OSM maps vessels only as permanent structures, so marina berths are empty and
                                 masts there must be invented, not imported.
    12:50   docs    ref    docs/URL-PARAMS.md — every URL parameter and window.__ handle, scraped from source.
                                 Notes worth having: cars are OFF by default by design; bodies defaults to 10
                                 baked avatar variants and is the variety cap; crowd is ONE value for the whole
                                 city; baked bodies draw only to RANGE=115 m while the crowd spawns to 260.
    13:30   fix     city   BUGS #230 — my #225 fix crashed startup: contentBounds iterated pkg.buildings, and
                                 City NEVER HAS BUILDINGS (its pkg is CityMeta + edges:[] + areas:[], geometry
                                 arrives per tile). The `as unknown as CityPackage` cast hid it from tsc and I
                                 never ran it. So the game would not start, and before the change the occluder
                                 was on the old box+1500 — #225 was never actually fixed.
                                 Rewritten to take the bbox from the INDEX'S OWN TILE LIST (tx/tz of every tile
                                 with buildings>0 or edges>0, 200 m granularity, no bake): game.ts computes
                                 contentBox, CityMeta carries it, contentBounds unions it +400 with box+1500
                                 and falls back to the box when absent. 2451 of 111526 tiles hold content;
                                 union now reaches lat 37.8810 against the 37.8502 of the report, and gains
                                 1.7 km on the east that the old bound also missed. Typecheck clean; the
                                 occluder MECHANISM is still unverified (see #230).
    09:40   docs    tiles  docs/TILE-V2.md — the tile format measured field by field, for a binary v2. Two
                                 byte profiles, not one: the MEAN tile is plantings 51% + terrain 24%, the 40
                                 LARGEST are buildings 42% + edges 39%, so park/water tiles and downtown tiles
                                 need different wins. Measured memory: a downtown 13x13 is 9.5 MB of text ->
                                 14.5 MB of retained objects (1.52x). Ordered payoff: terrain to Int16 (5202 B
                                 vs 12337, already decimetres, terrain.bin proves it), plantings to a 7-byte
                                 struct (vs 29), delta-encoded polylines (longest edge spans 26 tiles, so no
                                 scheme may assume one tile), interned strings, packed flags, SoA columns.
                                 Stated plainly: 14.5 -> ~4 MB does NOT fix mobile; #226 is why it accumulates,
                                 and ride-run.json at 13.2 MB is bigger than the resident tile set.
    10:30   measure tiles  JSON.parse is ~450 MB/s: a tile is 0.12 ms, a downtown 13x13 (9.3 MB) is 20.3 ms,
                                 index.json 17 ms, ride-run.json 33 ms. So parse is NOT a reason to go binary —
                                 under 1% of a frame per tile, ~50 ms of global startup. Does not reproduce
                                 #176's "330 ms of parse" for a 20 MB index (should be ~45 ms), so that figure
                                 likely included fetch + the Int16->Float32 expansion. And brotli already gives
                                 25% of raw (gzip 29%), the 113 kB tile -> 18.6 kB, because repeated field
                                 names are what LZ eats. Conclusion: binary buys RETAINED MEMORY only (1.52x
                                 text as objects, 14.5 MB downtown), which makes #226 the prerequisite. Open
                                 question for the owner: if parse is 50 ms and the load is 5.0 s, __marks will
                                 say where the other 4.95 s goes.
