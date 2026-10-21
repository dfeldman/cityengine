# cityengine (Street Runner / Cycle Dash)

CityEngine is a system for rendering maximally realistic cities, including terrain, streets, and buildings. It currently includes San Francisco (flagship), Paris (works but more cartoon-style rendering), New York (early stages) and Chicago (even earlier stages). The purpose is to use as a world for games, although it's also fun to just zoom around. 

It's a lot like Google Earth. Unlike Google Earth, it is built only with CC0 or CC-BY-NA base data, so it is copyright-clean. 

There are basically four types of rendering. Generic rendering is for the vast majority of buildings in a city and just guesses a style based on building properties and in some cases custom colors. Bigger or more interesting buildings are called "custom." Custom buildings can use either a building kit, a simple language for building design, OR be entirely hand-coded from images for more complex or important buildings. Finally, objects that are difficult to model like trees, rocks, or statues are rendered from GLB mesh files from assetkit. (No buildings are GLB files.)

> [!WARNING]
> This is entirely vibecoded. Use at your own risk.
>

> [!WARNING]
> Images and models are not in Git at all. They are in my own "assets" R2 bucket, with metadata stored here.
> If you want to use this outside my ecosystem of games, please make a copy of those assets. 




This repo is **cityengine**: a city model built from OpenStreetMap and open elevation data, with its baking tools,
landmark builders and renderer. Today its main use is the game Street Runner (public name Cycle Dash), whose code
lives here too; the engine is meant to serve non-game uses as well. The repo was called `streetrunner` until
2026-10-14. Its siblings are expected beside it: `assetmgr`, `assetkit` (trees, plants, rocks, statues, carkit) and
`avatarkit`. See docs/ASSETS.md for what a fresh clone needs.

**Baked cities** (`public/cities/`, derived and large) are not in git and not in the shared asset bucket: they are
derived data, not shared assets, so assetmgr (provenance, sharing between projects) is the wrong tool. Each city's
shipped bake (`public/cities/<city>/v3/`, stamped with its **bake number**) is copied into the build with the code
(`tools/link-assets.js`, cities on `src/cities.json` only) and published with it to the site's own bucket
(`tools/r2-upload.sh`): one bucket for code and cities (owner, 2026-10-15: many cities, but not so many they
cannot all live with the code).

    npm run bake san-francisco
    npm run build && sh tools/r2-upload.sh && sh tools/r2-prune.sh --yes

## Street Runner

Ride or run through a real city. Not a city that feels real — the actual streets of Le Marais, with the actual
junctions, taken from OpenStreetMap, and **you choose at every one of them**. Turn left onto Rue Payenne
because you felt like it, and you are on Rue Payenne.

```bash
npm install && npm run dev
```

Then <http://localhost:5200>. `?time=night` (or `dawn`, `dusk`) changes the hour, and `?weather=rain` (or `overcast`) the sky. Arrow **up/down** set the effort, **space** stops pedalling (the brake comes on after a moment), **←/→** ask for a turn at the
junction ahead, **P** pauses. `?city=brooklyn-heights` goes somewhere else; `?device=treadmill` runs it;
`?showcase=1` shows the facades on their own.

| City | | |
|---|---|---|
| **Le Marais**, Paris | 7 637 edges, 3 400 buildings, 45 m of relief | tight medieval streets under Haussmann facades |
| **Brooklyn Heights**, New York | 4 169 edges, 38 m of relief | a grid of brownstone row houses |
| **The Loop**, Chicago | 6 478 edges, 9 m of relief | towers on a grid, and flat |
| **Nob Hill**, San Francisco | 3 721 edges, **122 m of relief** | a grid laid over terrain that does not care about grids |

## The two ideas

**One.** It is built on [streets-gl](https://github.com/StrandedKitty/streets-gl), but not as a fork. Its
renderer is a bespoke WebGL2 deferred engine, and forking it would have cut this game off from the avatar kit,
from Trail Trainer's ride physics, and from every convention the rest of the platform shares. What is worth
having is its **OSM tag layer** — the part that knows a height written `12'6"`, the 148 CSS colour names a
mapper might use for `building:colour`, which buildings have windows and which are lock-ups. That is vendored
verbatim under [`src/vendor/streets-gl/`](src/vendor/streets-gl/README.md), MIT intact, and everything is
drawn in Babylon. **The knowledge, not the engine.**

**Two, and this is the one that matters.** Render OSM the obvious way and every building comes out identical:
extrude the footprint, wrap it in a brick texture, repeat two thousand times. A street reads by its *rhythm* —
bay width, floor lines, how the ground floor differs from the fourth — and no amount of texture resolution
fixes a facade that has none. So facades are **planned, not tiled**, from seven named architectural styles:

| | |
|---|---|
| **Haussmann** | cream limestone, continuous iron balconies on the 2nd and 5th, zinc mansard, shops below |
| **Brownstone** | narrow, a stoop up to the door, two-over-two sash, deep bracketed cornice |
| **Classical** | rusticated base, pilasters, pediments over the windows, heavy entablature |
| **Brick** | punched openings, soldier-course lintels, stone sills, a parapet with a coping |
| **Bauhaus** | white render, horizontal ribbon windows, flat roof, no ornament at all |
| **Brutalist** | board-marked concrete, deep reveals, floor slabs left showing |
| **Skyscraper** | curtain wall — glass and spandrel in a narrow module, a crown instead of a cornice |

Each has its own storey heights, bay rhythm, window type, roofline and colour sets, and each building draws
from its own OSM way id as a seed, so a street is varied and a re-bake changes nothing.
[FACADES.md](FACADES.md) is the detail.

## Steering, and why it works the way it does

There are two input modes (`?input=`), because a keyboard and a trainer want opposite things:

- **`fast`** — the default in a browser. **Hold ← / →** (or A / D) and the bike steers across the street, 3 m/s
  sideways, never onto the pavement. **Hold a direction as you reach a corner and you turn there**: the choice is
  made where the corner starts, about 0.9 s out, and a tap just before it counts too. Nothing held is straight on
  (or the GPS's exit). A hold that has just taken a corner does not take the next one until let go. **U** turns
  round; up/down is still power.
- **`slow`** — for trainers, and the default on Dandyhorse, where the phone's d-pad arrives on a one-second poll.
  Described below: a press declares the turn at the next junction well before it. **↑ (or S, or the d-pad's up)
  cancels a signalled turn** that has not latched yet, instead of adding power.

The slow model, and why it exists. At the platform's once-a-second poll, a rider at 25 km/h covers seven metres between a button press and the
game hearing about it. A game that asked you to press LEFT *at* the corner would be unplayable — and on a
trainer, hands on the bars and out of breath, unpleasant even if it worked.

So steering is **a declared intention, not a twitch input**, which is also how a real cyclist rides:

```
approaching ─────────────────── commit ────── junction
     the next junction is        the choice    the turn is taken,
     announced, its turns        latches       and the next junction
     light up, press as often                  is announced at once
     as you like
```

Commit is 1.6 seconds of travel out, not a fixed distance, because the point is to be beyond the rider's
reaction time — twenty metres is an age at walking pace and no warning at all at forty. The default is
straight on, so inattention rolls you down the street you are on rather than stopping you at every corner.

## Coasting

Unchanged from Trail Trainer, because it is the thing a training game cannot fake.

**On a bike** the measured power is one force among several and the others do not stop when the pedals do:
`m·dv/dt = P·η/v − m·g·sin θ − Crr·m·g·cos θ − ½·ρ·CdA·v²`, with rolling resistance from what OSM says the
street is surfaced with — asphalt 0.004, cobbles 0.011, which is a real difference across the Marais.

The hill is real. Elevation is sampled offline from public terrain tiles, the ground is draped over it, and
the grade the game asks the trainer for is the grade of the street the rider is on — which is the whole
contract of a training game, and which a city baked flat cannot honour.

**On a treadmill** there is no such thing. The belt speed is your speed: stop running and you are standing
still, and you cover no ground at all. A runner never gets a metre for free.

What a city adds is **corners**: a junction cannot be taken at forty, so the model brakes to `√(a·r)` on the
approach. It only ever takes speed away.

### The descent is a headline feature, and that is a design goal

Rolling down California Street at full speed is the most enjoyable thing in the game. **Since 2026-09-29 the bike
has brakes** (the owner: *"if power goes to 0 then it should go 'negative' and that should be a brake"*): with dense
traffic and timed lights, a bike that could not slow was unfair. Stop pedalling for more than about half a second
and the brake comes on (up to 3 m/s², more than any hill here pulls); keep pedalling, however lightly, and a descent
is as fast as ever. Cars ahead of a descending rider make way rather than hold them.

- **The engine has to keep up with it.** 50 km/h is 14 m/s, so streaming, level of detail and culling must
  feed the camera far faster than a flat ride ever asks. A stutter on a fast descent costs more than a
  stutter anywhere else, because it lands on the best moment the game has. Treat it as a first-class bug.
- **Measure downhill, at speed.** A steady thirty on the flat proves nothing about the case that matters.
  Any performance claim about this game should come from a fast descent or it is not evidence.

Hills are therefore an asset, not a terrain problem to be smoothed away.

## The delivery game, version 0 (2026-09-29)

A job offer pops up on the left a few seconds into the ride: **pick up** near one intersection, **deliver** near
another — two real buildings a few blocks apart (120–350 m hops, everything within 600 m of you), named for now by
the nearest intersection of two named streets. **Y** (or click) takes it, **X** turns it down. Ride to the first
building, then the second — arriving is getting within about 25 m of its walls — and a banner says you delivered
it. **Ignore it and nothing happens at all**: the offer goes away after 30 s, the ride stays a free ride, and
another offer comes along later.

**Where to go, without a route** (finding the way is the game): the stop you are riding to NOW has colour on every
screen — **1 · pickup is amber, 2 · drop-off is green** — and nothing else does:

- the **building lights up** (`render/beacon.ts`): a glowing shell round its walls, a beam up from its roof over the
  rooftops, and a column on the street at its door — the nearest rideable point, where arriving counts;
- a **compass**, the **distance** as the crow flies and a big **clock** counting up, by the top bar;
- the stop's **pin on the minimap and the large map** (M); the drop-off waits as a small grey 2 until the pickup is
  made. No line between them.

A whole run was ridden end to end by a probe steering with the GPS: three jobs in 98–176 s, 2–6 junctions a leg.
The logic is its own module, `src/game/delivery.ts` (no Babylon, no DOM; `tests/delivery.test.ts`); the card and
the compass are `src/ui/delivery-card.ts`; `game.ts` only answers its questions about the city (buildings near a
point, the nearest named intersection, how far a footprint is from a rideable street). `__routeXZ(x, z)` routes
the GPS to a point, for probes.

## Traffic (2026-09-29)

The city is full of cars, mostly slow — the delivery game's joke is that the bike is faster. `src/sim/traffic.ts`:

- **Intelligent Driver Model** car-following (smooth starts, speed-dependent gaps, early gentle braking,
  stop-and-go waves), every driver with their own acceleration, braking, time gap and standstill gap.
- **Junctions** (`src/sim/signals.ts`): timed **lights** wherever the renderer draws them (two groups alternating,
  15 s green, 3 s amber, 2.5 s all-red; live lamps in `render/lamps.ts`), **all-way** and **two-way stops**, and
  uncontrolled joins. Left turns yield to oncoming traffic, clear on the amber, and lose patience after 8 s. Nobody
  enters a junction without room to leave it. Turns follow curves, not the junction's centre point.
- **The rider KEEPS RIGHT**, 1.2 m in from the kerb and never on the pavement; to the middle only before a left
  turn; back to the right 2 s after steering by hand (`Navigator.home`).
- **The rider WEAVES** (`Traffic.weave`): past anything standing or crawling their way (under 6 m/s) they steer
  to the free strip nearest their own line on the right, down the centre line between two stopped lanes included
  (0.2 m of air each side) — the bike in gridlock. Anything under 3 m/s stops for a rider in its path (the right
  hook, once the rider kept right), and a car under 2 m/s touching them is no crash. Measured on `sf-mini` in dense traffic: 75–95% of the free-ride speed, one stall over 3 s
  in 300 s. Held only when there is no strip at all; never for good (5 s behind a standing vehicle, 20 s behind a
  moving one — under 2 m/s counts as standing — then they squeeze past); after 8 s held, the HUD says **U turns you round**. In fast input a held
  arrow steers across the street; in slow input **A** and **D** nudge across at any time and the arrows nudge when
  the next junction is far and ask for a turn near one (see "Steering").
- **Collisions** come only from MOVING cross traffic (mostly when the rider runs a red), and from a pedestrian
  stepping into a moving bike — never from riding into a standing car. A slapstick tip-over and a message; the
  rider then waits until the car that hit them is clear of their way (no riding off through it), and cars stop for
  a rider who is down or stopped in their path (no second hit). Points later.
- **The bike steers** (`game.ts` `bikePose`): it points where it is going, leans by tan φ = v·ω/g and turns its
  bars (tan δ = L·ω/v, drawn ×2.5) — eased in and out, the same for corners, nudges and weaving. The bars, fork and
  front wheel turn about the head tube (avatar kit `Bike.steer`).
- **In a junction** every vehicle also looks a few metres ahead and stops for a moving one in the same junction
  (streets under 12 m joined into one), so fewer drive through each other — BUGS.md #235 has the numbers and what
  is left.
- **Never in view**: cars appear and vanish only out of the rider's sight; at a dead end they turn round.
- **Density** `dense` = 80 cars per km of street, times a zone's `traffic` multiplier — measured with
  `tools/traffic-soak.ts` on real streets: 60 flows, 80 queues and recovers, 100 locks solid. `?cars=0` turns it off,
  `?traffic=<n>` sets a density for measuring.

## Street tunnels (2026-09-29)

Street tunnels under a hill are ridden, driven and walked through — San Francisco's Stockton Tunnel (Bush to
Sacramento, under Nob Hill), the Broadway Tunnel and the Baker-Barry Tunnel. Highway and railway tunnels are
still left out — but for the one a ridden bridge runs through (the Yerba Buena tunnel, see the bridges below).

- **The bake** (`tools/tunnels.ts`) finds a *bore*: a chain of tunnel carriageways of an ordinary street class with
  two mouths, under ground that is never below it and well above it somewhere (not an underpass). It gets its own
  heights, straight from mouth to mouth at the streets outside — the explicit Z, not the hill above — and
  `bore: true`, which lets it into the ride graph and the traffic. Its pavements come with it. The bake log says
  why each other tunnel was left out.
- **Mouths under a street** (the Stockton Tunnel's south portal is right under Bush Street): the mouth goes at
  least 6.5 m under the street crossing over it, and the street leading in is sloped down to it; a street's last
  30 m into any mouth follows the ground along its centre line (a cut), and a tunnel's own heights never raise the
  junction at its mouth.
- **Levels kept apart in the bake and the ride graph**: a bridge's ramps spread only along roads and stop at a
  tunnel mouth; an unnamed service road on a bridge (a garage ramp) is not ridden; footway joins never rescue a
  driveway or a dead end at a tunnel mouth; a way on another layer, or a named street 2.5 m above or below, is
  never another street's "side path".
- **The renderer** (`src/render/tunnels.ts`): the city is drawn in rendering groups with the depth cleared between
  them, so nothing under the ground can be drawn while the camera is above it. The tube (road, pavements, tiled
  walls, arch, lamps) is shown only while the camera is inside it; from outside, each mouth is a headwall on the
  hillside with a dark opening. Cars and walkers inside a tunnel are hidden until the camera follows them in.

## URL parameters

Everything a player chooses is on the URL now (owner, 2026-10-01: the city menu, the routes menu and the
freeze/copy/go-to/paths buttons are gone from the screen; their keys still work). E.g.
`/?city=san-francisco&mode=debug` is trainer debug in San Francisco.

**Playing**

| | |
|---|---|
| `city=san-francisco` | the city (default); `paris-centre`, `paris-marais`, … as baked (`public/cities/index.json`) |
| `mode=couch\|trainer\|debug` | how you play (src/modes.ts): couch (default), trainer on a local Dandyhorse, trainer debug |
| `session=<id>` | on Dandyhorse: the session to join (the platform passes it); `dandyhorse=bike` an ad-hoc local session |
| `route=manual` | deliveries are not routed for you (default: routed, the turns taken) |
| `input=fast\|slow` | held arrows steer (couch default) / turns declared ahead (trainer default) |
| `speedup=2` | world metres per pedalled metre (default by mode: couch 2, trainer 1.25, debug 1) |
| `level=3` | the delivery level, 1–5 (default: rises every 3 deliveries) |
| `at=lat,lon` | start on the street nearest a point; `start=<edge>` on a ride edge |
| `time=dawn\|day\|dusk\|night`, `weather=clear\|overcast\|rain` | the hour and the sky |
| `traffic=none\|some\|busy`, `cars=0`, `crowd=none\|some\|busy\|crowded` | how busy |
| `touch=1\|0` | the touch buttons on or off (default: on a touch screen) |
| `running=1` | the bike/run switch back (running is off for now); then `device=treadmill` |

**The device**

| | |
|---|---|
| `tier=desktop\|phone\|ultra` | how much memory to use (default: iPhone/iPad ultra, Android phone, else desktop; src/tier.ts) |
| `rings=v,m` | the built and massing rings, in tiles (default by tier) |
| `budget=380` | the memory governor's budget, MB (phone and ultra tiers) |
| `mem=1` | the tier, canvas and a GPU estimate in a corner |

**Development**

| | |
|---|---|
| `buttons=1`, `routes=1`, `citymenu=1` | the hidden freeze/copy/go-to/paths buttons, routes menu, city menu |
| `freeze=1`, `view=high`, `paths=1` | the rider held still; the high camera; the ride graph drawn |
| `without=a,b` | leave subsystems out: ao, grade, trees, plants, life, crowd, furniture, signs, buildings, landmarks, carkit, fineocc, fence, weavehold, … |
| `grade=e,s,c` | the colour grade's exposure, saturation, contrast (`1,1,1`: none) |
| `fog=off`, `far=<m>` | photo mode's fog and draw distance |
| `map=v2` | read the old tile format |
| `profile=1`, `pick=1`, `zcheck=1`, `burst=1` | load profiling, mesh picking, z-fighting check, tile loading unthrottled |
| `bodies=4`, `veg=3`, `vegmerge=0`, `advance=<m>`, `turn=left` | avatar bodies, wood density, vegetation merging, ride ahead on load, a test turn |
| `model=<name>`, `trees=1`, `palms=1`, `showcase=1&style=<id>` | the model, tree, palm and facade showcases instead of the city |

**Keys**: ↑ ↓ effort · ← → steer · U turn round · Y / X take / decline a delivery · M map · P pause (and photo mode: fog off — the
same key, to be untangled) · B board transit · F freeze and fly · C copy location · G go to "lat, lon" · J paths ·
I landmark card · [ ] photo mode's draw distance.

## How you play: three modes (2026-10-01)

`src/modes.ts`; chosen on the welcome screen, or `?mode=`:

| | Couch (default) | Trainer (Dandyhorse) | Trainer debug (`?mode=debug`) |
|---|---|---|---|
| power | ↑ ↓ choose your effort, paid from the **energy bar** (sim/energy.ts: drains above 200 W, refills below; run it dry and you are capped until a quarter is back) | read from the trainer; the grade is written back | ↑ ↓ set the watts (a simulated trainer) |
| steering | fast: hold ← → | slow: turns declared ahead, from the phone's d-pad | slow |
| deliveries | offered; Y / X | **taken after 12 s unless skipped** — on screen and on the phone (a menu beside the d-pad) — so a rider can just pedal | offered |
| speedup | 2× | 1.25× | 1× |

The speedup scales the ground covered, not the physics: the grade asked of a trainer, and the power it takes, stay
real (sim/ride.ts). `?speedup=` overrides it. `?mode=trainer` outside Dandyhorse opens an ad-hoc session on a local
Dandyhorse server. **Running is off for now**: the bike only (`?running=1&device=treadmill` for development).

## Deliveries: kitchens, dishes, levels (2026-10-01)

Jobs start at **kitchens**: invented restaurants at fixed, plausible places — dim sum in Chinatown, steak in the
Financial District, a taquería in the Mission, ice cream in the Marina — 23 of them in
`src/city/sf/restaurants.json`, each with a joke, a menu, and an emoji per dish. Every name is made up; none is a
real business. A job picks one of the four nearest kitchens within 1.5 km, and a dish from its menu; the drop-off
is a random building. **FRAGILE** dishes (ice cream, wine, soup, cake…) are spoiled by a collision after pickup,
and the job is off. The **level** sets how far a drop-off may be from its kitchen — 500 m, 900 m, 1.4 km, 2 km,
3 km — and rises every three deliveries in a city (kept in the browser; `?level=` sets it). A city without
kitchens (Paris) keeps the building-to-building jobs. Logic: `src/game/delivery.ts` (tests/delivery.test.ts).

## Cars and buses: carkit (2026-10-01)

The street's cars and buses are drawn by **carkit** (`~/dandyhorse/libs/carkit`, linked like the avatar kit):
procedural sedans, hatchbacks, SUVs, vans, trucks, buses and their taxi/police/delivery/transit liveries, posed on
the hill under all four tyres, with brake lamps, indicators and headlamps. `src/render/street-fleet.ts` gives each
traffic vehicle one carkit car, its shape picked from its id. `?without=carkit` shows the old stand-ins. Trains,
streetcars and cable cars are still Street Runner's own (render/rolling-stock.ts).

## The look: brighter, more saturated, FXAA (2026-10-01)

Every material writes its own final colour and the AO can only darken, so frames came out dark and muddy. A last
pass now lifts exposure 1.14×, saturation 1.28×, contrast 1.06× with a soft shoulder (no clipped sky), then FXAA —
the AO renders into a texture without MSAA, so edges were jagged (`src/render/grade.ts`). `?grade=1,1,1` shows the
picture as the shaders made it; `?without=grade` drops both passes.

## Phones (2026-10-01)

**iPhones and iPads get the `ultra` tier** (iOS Safari allows a tab 384 MB; BUGS.md #243): no plants, trees,
crowd, furniture or signs; full buildings on the rider's own tile only, massing two tiles out; 1x canvas, small
textures, a 40 m ground grid. ~340 MB on a production build by Chromium's count. Load the production build on a
phone (the dev server costs ~50 MB more),; vite.config.ts dedupes Babylon so carkit's shaders
work in a build. `?tier=desktop|phone|ultra` overrides the guess.


A Safari tab on an iPhone is killed at about a gigabyte, and San Francisco needed two to three (BUGS.md #242). Phones
and tablets get the **phone tier** (src/tier.ts — guessed from the user agent, `?tier=phone|desktop` to override):
a smaller built ring (`?rings=1,5` is its default), the canvas at 1.5x at most, no SSAO, half-resolution sign pages,
vegetation and avatar images at 512 px, fewer avatar bodies, no CPU or context-loss copies of what is on the GPU.
`?mem=1` shows the tier, canvas and a GPU estimate in a corner. A **memory governor** estimates the footprint every 5 s (Safari reports nothing) and pulls the massing ring in
when it is over budget (`?budget=`, 1000 MB on phones; BUGS.md #242). The ground occluder and the distant ground were cut
from 524 MB of vertex buffers to 98 MB for every device.

## The bridges you ride (2026-09-30)

The full working notes — decisions, the Bay Bridge Bikeway, the tools, what is left — are in **docs/BRIDGES.md**.
In short: freeways are out of the ride network except the ones chosen for bikes; the Bay Bridge is reached by a
fictional bikes-only helix from The Embarcadero (`BAY_BIKEWAY`); deliveries are auto-routed by default
(`?route=manual` to find your own way), and now and then a job crosses the bay to Treasure Island.

The Golden Gate and the Bay Bridge are ridden end to end, on their models. The rule: **the model is the truth, and
the ways are put on it** — OSM says where a way runs, the model says how high.

- **A model declares its decks** (`src/city/sf/bridges.ts`, beside the profile functions the models draw their
  roadways from, so the two cannot disagree): a strip along the model's axis — or along a curved `path` — with a
  half-width and a height at each point; for a double-deck bridge one per OSM `layer`, which is what tells the
  roadways apart. `public/landmarks/<region>/bridges.json` places the model; the same transform places its decks.
- **The bake conforms the ways** (`src/city/bridge-decks.ts`, called from `tools/bake.ts`): a way on a deck takes the
  deck's height. Off the deck's end, the chain of *structures* (bridges, ways above layer 0) is regraded as straight
  grades between what is known — the deck, a junction with a way on the ground, the bake's own height 900 m along —
  with each junction where the grades of everything meeting there agree. A way on the ground that leaves a deck is
  brought to it within a 5% cone. Where the chain lands on an ordinary street, the junction is put on the ground
  and the bake's own 60 m ramp is taken back out of the streets there. A regraded ramp is held 5 m clear of what
  it crosses. Whatever is left standing off the ground is marked a bridge, and a tunnel a deck runs through a bore.
- **Trying a profile** takes two minutes, not twenty: `npm run bake -- <city> --decks` re-conforms a package already
  baked (from what it was before, `decks-undo.json`) and rewrites the tiles, the ride files and v3.
  `npx vite-node tools/bridge-fit.ts -- --conform --chain` measures it in seconds without writing anything: every
  way against its deck, every regraded way's grade, every crossing without headroom.
  `tools/bridge-chain.ts` lists what hangs off a bridge.
- **Nothing ridden flies.** `npx vite-node tools/air-paths.ts -- <city> [--mode=run] [--near=lat,lon,radius]` walks
  every ride edge against what the game draws — a street's corridor, a way's own deck, a model's roadway
  (`DeckDecl.model`: the slab the model really draws, narrower and shorter than the deck it declares), a bore — and
  lists each stretch with nothing under the wheel, with a lat, lon to go to. It is arithmetic on the baked files by
  the renderer's rules, city-generic; run it after any change to a bridge, the ride graph or the conformer.
- **A model stops where the ways stop being straight.** The Golden Gate's ways run dead straight from z −1100 to
  z 1275 in the model's frame and then swing 45 m off the axis within 150 m, so the steel and the declared deck end
  there (`GG_SOUTH_END`, `GG_NORTH_END`) and the curved viaducts to the toll plaza and to Vista Point are the ways'
  own structure. A way a model has taken is still drawn wherever it is off the model's roadway
  (`City.outsideCovers`), and a way that only bulges past the roadway's edge and comes back — the sidewalks round
  the towers — is brought in onto it (`BridgeDecks.snap`, the one place the plan is touched).
- **The Golden Gate**: both sidewalks are the bike's way across (the freeway is left out beside them), on the deck
  from the toll plaza to Vista Point.
- **The Bay Bridge**: eastbound on the lower deck, westbound on the upper — a one-way freeway is never ridden the
  wrong way (`againstFreeway`), and one that leads nowhere is not ridden at all (`pruneFreewayTraps`). On from Rincon
  Hill's ramps (Sterling, Essex, First, Fremont, Harrison), across, through the Yerba Buena tunnel (a double-deck
  bore, `render/landmarks/sf/tunnels.ts`), off at Treasure Island Road; back on from Macalla Road. The east span
  has no model yet: its ways are on a declared deck from the island down to the Oakland shore, drawn as a viaduct,
  and the Bay Bridge Trail along it is ridden.
- **Drawn outside the models** by the generic deck (`render/bridges.ts`): a pier is not stood across a road under
  the deck (a bent instead), a ramp well off the ground is a viaduct and not an embankment, a freeway has no
  pavement, a freeway's `man_made=bridge` outline does not get a stone-arch structure
  (`render/bridge-structures.ts`), and a way a model draws is still drawn where it runs on past the model's deck.
  Cars do not drive on cycleways, however wide, and do use a freeway ramp, however narrow. The ride graph invents
  no link across a freeway's two carriageways, or between two at different levels.

## Where it comes from

Everything is fetched **once, offline** by `npm run bake`, which writes one file per city into
`public/cities/`. The game touches no network service while it runs — a rider halfway through a session does
not want a tile server outage, and a platform in a garage may have no internet at all.

```
Overpass ──► streets ──► split at every shared node ──► a graph a rider can be navigated through
         ──► buildings ──► streets-gl's tag layer ──► a style, a level count, a height
         ──► parks, water, mapped trees
```

Streets are split at every shared node rather than kept as whole OSM ways, because a way is a mapper's
convenience — it runs through six junctions and changes name halfway — and what steering needs is an edge
between two junctions. Only the largest connected component is kept: an island of three streets the rider can
never reach is worse than not having it.

**One known gap: the baker fetches ways only, not relations.** A building mapped as a `type=multipolygon`
relation — which is how courtyard blocks and anything with a hole in it are mapped — is missing from the
bake, and so is the Seine, which is why the water shader is written but has not yet had a real river to
draw. The Loop's 843 buildings against Brooklyn's 1 800 is mostly this. Relation support is the first thing
to add to `tools/overpass.ts`.

Adding a city is one entry in `tools/cities.ts` and a re-bake. That is what "anywhere on the planet" means in
practice. Licensing is in [CREDITS.md](CREDITS.md).

## What is in here

```
tools/facadegen/   the painter: seamless wall materials and an element atlas, Pillow only
tools/             the city baker: overpass, the city list, a Playwright shot harness
src/city/          the facade grammar, the style table, the street graph, geo, the package format
src/sim/           ride physics, the navigator and its commit-distance steering
src/render/        the facade shader, building meshes, the streaming city
src/controls.ts    the one seam the platform replaces
src/vendor/        streets-gl's OSM tag layer, MIT, do not edit
```

A few things worth knowing before changing them:

- **Alpha is a tint mask, not transparency** (`src/render/facade-material.ts`). Both painted pages store
  *how much of the building's palette colour multiplies this pixel*: `albedo × mix(white, tint, alpha)`. Brick
  is painted pale with a full mask so the palette makes it red here and buff two streets over; mortar has a
  low mask and stays pale in both; glass has a zero mask and never takes the building's colour. It is the one
  trick that turns seven styles and four palettes into a city that does not repeat.
- **Two texture pages, bound at once, because they are sampled differently.** A wall must *repeat* over
  whatever length it is; an element must stay inside its cell. Opposite wrap modes, so they cannot share a
  texture — and a per-vertex `kind` attribute picks between them, which keeps a whole style to one draw call.
- **Winding is not cosmetic.** Back-face culling is on, so a road ribbon wound the wrong way is invisible and
  the city appears to have no ground. It happened; the comment in `src/render/city.ts` is there to stop it
  happening again.
- **The ground is four near-coplanar layers, separated in rendering ORDER, not in height.** Babylon clears
  depth between rendering groups, so each layer is drawn over the one below it. There are exactly **four**
  groups, 0–3 — asking for a fifth silently drops the mesh, which is how every building in the city vanished
  once. Roads additionally get a few tenths of a millimetre of their own from their edge id, because at a
  junction several ribbons are precisely coplanar and no amount of layering separates those.
- **`s` is always measured from an edge's `a` end**, whichever way the rider is going. Mirroring it for a
  reversed rider put them at the wrong end of every other street, so turns teleported them past the junction
  and back. `tests/ride-city.test.ts` rides the real Marais and fails if the rider ever jumps.
- **The road surface and the pavement are unioned OFFLINE, as polygons** (`tools/surfaces.ts`), not
  assembled from per-street ribbons. At a junction every street used to lay down its own carriageway and its
  own two pavements and they all overlapped. The pavement is defined as the widened union *minus* the road,
  so "where roads meet there is no pavement in the crossover" holds by construction. `polygon-clipping`, not
  `polybooljs`: the latter rejects this input outright, and no epsilon rescues it.
- **The ground materials draw with back-face culling OFF, deliberately.** A polygon clipper's ring winding is
  not worth depending on, the normals are set explicitly so lighting does not care, and when the winding went
  the other way the entire road network and every pavement became invisible while remaining present, ready,
  and in the active mesh list. That is a very expensive thing to debug twice.
- **An instanced mesh with zero instances is still drawn once**, through a shader whose `world0..world3`
  attributes are then undefined — a screenful of garbage triangles. Empty instance pools must be
  `setEnabled(false)`, and `thinInstanceSetBuffer` takes the count from the buffer's length, so the buffer
  has to be sliced to the number actually used.
- **The chase camera takes its position and its look-at from the same smoothed heading.** Deriving them from
  different headings — behind on the old one, looking along the new — swings the rider across the screen
  through a turn and reads as the camera zooming in and out.
- **`arrivalBearing` already reverses the direction.** Adding π to it a second time turned every left into a
  right and every straight into a U-turn, and the crossroads test in `tests/navigate.test.ts` is what caught
  it. That test is the one to keep passing.
- **No floating origin, deliberately.** A city fits inside ±5 km where a 32-bit float resolves a twentieth of
  a millimetre. Trail Trainer needs one because its routes reach 300 km; if a city here ever spans more than
  about 20 km, `trailtrainer/src/render/frame.ts` is the thing to bring over.

## Where it is going

Built: the facade generator; the road, water and cartoon shaders; the baker, including relations, railways,
crossings and roofs; ordered ground layers with convex-hull junctions; the street graph; steering; the ride
model; the minimap; the avatar kit rider; and a streaming city populated with traffic, pedestrians, street
furniture, vegetation and sky.

**Where it is going next is [DIRECTION.md](DIRECTION.md)** (2026-09-28): a bike food-delivery game, more and
larger cities, buildings from facade clusters, and a new map format with patches ([docs/MAP-FORMAT.md](docs/MAP-FORMAT.md)).

**The running list of what is wrong and what is missing is [PLAN.md](PLAN.md).**

Running it on the platform is [INTEGRATION.md](INTEGRATION.md).
